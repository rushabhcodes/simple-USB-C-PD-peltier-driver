import { Arc, Box, Circle, Point, Polygon, Segment, Vector } from "@flatten-js/core"
import Flatbush from "flatbush"
import type { AnyCircuitElement } from "circuit-json"

// Geometry tolerance only (1 nm), never a manufacturing-clearance exemption.
const EPS = 1e-6
type Element = AnyCircuitElement & Record<string, any>
type Node = { shape: Polygon; layer: string; id: string; type: string; port?: string }
class Union {
  parents = new Map<string, string>()
  root(id: string): string {
    const parent = this.parents.get(id)
    if (!parent) { this.parents.set(id, id); return id }
    if (parent === id) return id
    const root = this.root(parent)
    this.parents.set(id, root)
    return root
  }
  join(ids: string[]) {
    if (!ids.length) return
    const first = this.root(ids[0]!)
    for (const id of ids.slice(1)) this.parents.set(this.root(id), first)
  }
}
const append = <T>(map: Map<string, T[]>, key: string, value: T) =>
  map.set(key, [...map.get(key) ?? [], value])

export function sourceConnectivity(json: AnyCircuitElement[]) {
  const elements = json as Element[]
  const components = new Map(elements.filter(e => e.type === "source_component").map(e => [e.source_component_id, e]))
  const union = new Union(), internal: string[][] = []
  for (const e of elements) {
    if (e.type === "source_trace") union.join([...e.connected_source_port_ids, ...e.connected_source_net_ids])
    if (e.type === "source_component") internal.push(...e.internally_connected_source_port_ids ?? [])
    if (e.type === "source_component_internal_connection") internal.push(e.source_port_ids)
  }
  for (const ids of internal) union.join(ids)
  const ports = new Map<string, string>(), sourceToKey = new Map<string, string>()
  for (const port of elements.filter(e => e.type === "source_port" && components.has(e.source_component_id ?? ""))) {
    const key = `${components.get(port.source_component_id)!.name}.${port.pin_number ?? port.name}`
    if (ports.has(key)) throw new Error(`Duplicate physical pin identity: ${key}`)
    ports.set(key, port.source_port_id)
    sourceToKey.set(port.source_port_id, key)
  }
  const names = new Map<string, string[]>(), peers = new Map<string, string[]>()
  for (const e of elements.filter(e => e.type === "source_net")) append(names, union.root(e.source_net_id), e.name)
  for (const [key, id] of ports) append(peers, union.root(id), key)
  const groups = [...peers].map(([id, keys]) => ({ nets: [...names.get(id) ?? []].sort(), ports: keys.sort() }))
    .sort((a, b) => a.ports.join() < b.ports.join() ? -1 : a.ports.join() > b.ports.join() ? 1 : 0)
  const internalKeys = internal.map(ids => ids.map(id => sourceToKey.get(id)).filter((id): id is string => !!id))
  return { ports, groups, internalKeys, signature: JSON.stringify(groups) }
}
export type ExpectedConnectivity = ReturnType<typeof sourceConnectivity>

const point = (p: { x: number; y: number }) => new Point(p.x, p.y)
const disk = (x: number, y: number, r: number) => new Polygon(new Circle(new Point(x, y), r))
function rectangle(x: number, y: number, w: number, h: number, degrees = 0) {
  return new Polygon(new Box(-w / 2, -h / 2, w / 2, h / 2)).rotate(degrees * Math.PI / 180).translate(new Vector(x, y))
}
function stroke(a: { x: number; y: number }, b: { x: number; y: number }, r1: number, r2 = r1) {
  const length = Math.hypot(b.x - a.x, b.y - a.y)
  if (![a.x, a.y, b.x, b.y, r1, r2].every(Number.isFinite) || Math.min(r1, r2) <= 0)
    throw new Error("Invalid trace coordinate or width")
  if (length <= Math.abs(r1 - r2) + EPS) return r1 >= r2 ? disk(a.x, a.y, r1) : disk(b.x, b.y, r2)
  const angle = Math.acos((r1 - r2) / length)
  const lowerA = new Point(r1 * Math.cos(-angle), r1 * Math.sin(-angle))
  const lowerB = new Point(length + r2 * Math.cos(-angle), r2 * Math.sin(-angle))
  const upperA = new Point(r1 * Math.cos(angle), r1 * Math.sin(angle))
  const upperB = new Point(length + r2 * Math.cos(angle), r2 * Math.sin(angle))
  return new Polygon([
    new Segment(lowerA, lowerB), new Arc(new Point(length, 0), r2, -angle, angle, true),
    new Segment(upperB, upperA), new Arc(new Point(0, 0), r1, angle, 2 * Math.PI - angle, true),
  ]).rotate(Math.atan2(b.y - a.y, b.x - a.x)).translate(new Vector(a.x, a.y))
}
function capsule(x: number, y: number, w: number, h: number, degrees = 0) {
  const half = Math.abs(w - h) / 2, radius = Math.min(w, h) / 2
  return stroke({ x: w > h ? -half : 0, y: w > h ? 0 : -half },
    { x: w > h ? half : 0, y: w > h ? 0 : half }, radius)
    .rotate(degrees * Math.PI / 180).translate(new Vector(x, y))
}
function cutHole(outer: Polygon, hole: Polygon) {
  const orientation = outer.faces.values().next().value!.orientation()
  for (const boundary of hole.faces) {
    const face = outer.addFace(boundary.shapes)
    if (face.orientation() === orientation) face.reverse()
  }
  return outer
}
function padShape(e: Element, components: Map<string, Element>) {
  const { x, y } = e, rotation = e.ccw_rotation ?? 0
  if (e.type === "pcb_via") return cutHole(disk(x, y, e.outer_diameter / 2), disk(x, y, e.hole_diameter / 2))
  const plated = e.type === "pcb_plated_hole"
  const w = plated ? e.outer_width : e.width, h = plated ? e.outer_height : e.height
  let shape: Polygon
  if (e.shape === "circle") shape = disk(x, y, plated ? e.outer_diameter / 2 : e.radius)
  else if (["rect", "rotated_rect", "circle_with_rect_pad"].includes(e.shape)) shape = rectangle(x, y, w, h, rotation)
  else if (["pill", "rotated_pill", "oval"].includes(e.shape)) shape = capsule(x, y, w, h, rotation)
  else if (e.shape === "polygon") {
    shape = new Polygon(e.points.map(point))
    if (plated) shape = shape.rotate((components.get(e.pcb_component_id ?? "")?.rotation ?? 0) * Math.PI / 180).translate(new Vector(x, y))
  } else throw new Error(`Unsupported copper shape: ${e.type} ${e.shape}`)
  if (plated) cutHole(shape, e.hole_diameter ? disk(x, y, e.hole_diameter / 2) : capsule(x, y, e.hole_width, e.hole_height, rotation))
  return shape
}
function pourShape(e: Element) {
  if (e.shape === "rect") return rectangle(e.center.x, e.center.y, e.width, e.height, e.rotation)
  if (e.shape === "polygon") return new Polygon(e.points.map(point))
  if (e.shape !== "brep") throw new Error(`Unsupported pour shape: ${e.shape}`)
  const shape = new Polygon(e.brep_shape.outer_ring.vertices.map(point))
  for (const ring of e.brep_shape.inner_rings ?? []) cutHole(shape, new Polygon(ring.vertices.map(point)))
  return shape
}
function touches(a: Polygon, b: Polygon) {
  return a.contains(b.vertices[0]!) || b.contains(a.vertices[0]!) || a.distanceTo(b)[0] <= EPS
}

/** Drill webs are a fabrication constraint even when the copper shares a net. */
export function drillSmtClearanceViolations(json: AnyCircuitElement[], thermalPairs = new Set<string>()) {
  const elements = json as Element[], minimum = 0.15
  const components = new Map(elements.filter(e => e.type === "pcb_component").map(e => [e.pcb_component_id, e]))
  const pads = elements.filter(e => e.type === "pcb_smtpad").map(e => ({ id: e.pcb_smtpad_id, shape: padShape(e, components) }))
  const violations: { drill: string; pad: string; actual: number; minimum: number }[] = []
  if (!pads.length) return violations
  const index = new Flatbush(pads.length)
  for (const { shape } of pads) { const b = shape.box; index.add(b.xmin, b.ymin, b.xmax, b.ymax) }
  index.finish()
  for (const e of elements.filter(e => e.type === "pcb_via" || e.type === "pcb_plated_hole")) {
    const id = e[`${e.type}_id`]
    const drill = e.hole_diameter ? disk(e.x, e.y, e.hole_diameter / 2)
      : capsule(e.x, e.y, e.hole_width, e.hole_height, e.ccw_rotation ?? 0)
    const b = drill.box
    for (const i of index.search(b.xmin - minimum, b.ymin - minimum, b.xmax + minimum, b.ymax + minimum)) {
      const pad = pads[i]!
      if (e.type === "pcb_via" && thermalPairs.has(`via_in_pad_${id}_${pad.id}`)) continue
      const actual = touches(drill, pad.shape) ? 0 : drill.distanceTo(pad.shape)[0]
      if (actual < minimum - EPS) violations.push({ drill: id, pad: pad.id, actual, minimum })
    }
  }
  return violations
}

/** Endpoints inside real pad copper count even when displaced from pad center. */
export function copperPortContacts(json: AnyCircuitElement[]) {
  const elements = json as Element[]
  const components = new Map(elements.filter(e => e.type === "pcb_component").map(e => [e.pcb_component_id, e]))
  const ports = new Map(elements.filter(e => e.type === "pcb_port").map(e => [e.pcb_port_id, e]))
  const pads = elements.filter(e => e.type === "pcb_smtpad" || e.type === "pcb_plated_hole").map(e => ({
    element: e, shape: padShape(e, components), port: ports.get(e.pcb_port_id ?? ""),
    layers: (e.type === "pcb_smtpad" ? [e.layer] : e.layers) as string[],
  })).filter(pad => pad.port?.source_port_id)
  return (endpoints: { x: number; y: number; layers: string[] }[]) => new Set<string>(pads.filter(pad =>
    endpoints.some(endpoint => endpoint.layers.some(layer => pad.layers.includes(layer)) &&
      (pad.shape.contains(point(endpoint)) || pad.shape.distanceTo(point(endpoint))[0] <= EPS ||
        // Through-hole routes conventionally terminate at the drill center.
        (pad.element.type === "pcb_plated_hole" && Math.hypot(endpoint.x - pad.port!.x, endpoint.y - pad.port!.y) <= EPS))))
    .map(pad => pad.port!.source_port_id))
}

export function analyzePhysicalCopper(json: AnyCircuitElement[], expected = sourceConnectivity(json)) {
  const elements = json as Element[], current = sourceConnectivity(json)
  const board = elements.find(e => e.type === "pcb_board")!
  if (!board) throw new Error("Missing board")
  const stack = ["top", ...Array.from({ length: board.num_layers - 2 }, (_, i) => `inner${i + 1}`), "bottom"]
  const components = new Map(elements.filter(e => e.type === "pcb_component").map(e => [e.pcb_component_id, e]))
  const pcbPorts = new Map(elements.filter(e => e.type === "pcb_port").map(e => [e.pcb_port_id, e]))
  const sourceToKey = new Map([...current.ports].map(([key, id]) => [id, key]))
  const nodes: Node[] = [], union = new Union(), portNodes = new Map<string, string[]>()
  const segmentLengths = new Map<string, number>(), viaIds = new Set<string>(), invalid: string[] = []
  const add = (shape: Polygon, layer: string, id: string, type: string, port?: string) => {
    if (!stack.includes(layer)) throw new Error(`Unknown copper layer: ${layer}`)
    const index = String(nodes.length)
    nodes.push({ shape, layer, id, type, port }); union.root(index)
    if (port) append(portNodes, port, index)
    return index
  }
  for (const e of elements) {
    if (["pcb_smtpad", "pcb_plated_hole", "pcb_via"].includes(e.type)) {
      const shape = padShape(e, components), id = e[`${e.type}_id`]
      let layers = e.type === "pcb_smtpad" ? [e.layer] : e.layers ?? [e.from_layer ?? "top", e.to_layer ?? "bottom"]
      if (e.type !== "pcb_smtpad") {
        const indices = layers.map((layer: string) => stack.indexOf(layer))
        if (indices.includes(-1)) throw new Error(`Unknown barrel layer: ${id}`)
        layers = stack.slice(Math.min(...indices), Math.max(...indices) + 1)
      }
      const port = sourceToKey.get(pcbPorts.get(e.pcb_port_id ?? "")?.source_port_id ?? "")
      const ids = layers.map((layer: string) => add(shape, layer, id, e.type, port))
      if (e.type !== "pcb_smtpad") union.join(ids)
      if (e.type === "pcb_via") viaIds.add(id)
    } else if (e.type === "pcb_copper_pour") {
      const shape = pourShape(e)
      if (!shape.isValid()) invalid.push(e.pcb_copper_pour_id)
      add(shape, e.layer, e.pcb_copper_pour_id, e.type)
    } else if (e.type === "pcb_trace") {
      for (let i = 1; i < e.route.length; i++) {
        const a = e.route[i - 1], b = e.route[i]
        if (a.route_type === "via" && b.route_type === "via") continue
        const aPoint = a.route_type === "through_pad" ? a.end : a
        const bPoint = b.route_type === "through_pad" ? b.start : b
        const aLayer = a.route_type === "wire" ? a.layer : a.route_type === "via" ? a.to_layer : a.end_layer
        const bLayer = b.route_type === "wire" ? b.layer : b.route_type === "via" ? b.from_layer : b.start_layer
        if (aLayer !== bLayer) throw new Error(`Unplated layer transition: ${e.pcb_trace_id}`)
        // Native routes may omit repeated wire points at a via or pad boundary.
        // The pad itself must exist as real copper; metadata cannot bridge it.
        const aWidth = a.route_type !== "via" ? a.width : b.route_type !== "via" ? b.width : 0
        const bWidth = b.route_type !== "via" ? b.width : aWidth
        const length = Math.hypot(bPoint.x - aPoint.x, bPoint.y - aPoint.y)
        // A repeated endpoint entirely inside a drill leaves no fabricated
        // copper disk. The annular via/pad already models its real copper.
        if (length <= EPS && elements.some(hole =>
          (hole.type === "pcb_via" || hole.type === "pcb_plated_hole") && hole.hole_diameter &&
          Math.hypot(aPoint.x - hole.x, aPoint.y - hole.y) + Math.max(aWidth, bWidth) / 2 <= hole.hole_diameter / 2 + EPS)) continue
        const id = `${e.pcb_trace_id}:segment${i - 1}`
        add(stroke(aPoint, bPoint, aWidth / 2, e.route_thickness_mode === "interpolated" ? bWidth / 2 : aWidth / 2), aLayer, id, e.type)
        segmentLengths.set(id, length)
      }
    }
  }
  for (const ids of portNodes.values()) union.join(ids)
  // Preserve original package metal (USB shells) and include verified conductors
  // added to current component definitions (USBLC6 flow-through pins). Desired
  // electrical nets still come exclusively from the immutable expected graph.
  for (const keys of [...expected.internalKeys, ...current.internalKeys]) union.join(keys.flatMap(key => portNodes.get(key) ?? []))
  const layerIndices: { ids: number[]; index: Flatbush }[] = []
  for (const layer of stack) {
    const ids = nodes.flatMap((node, i) => node.layer === layer ? [i] : [])
    if (!ids.length) continue
    const index = new Flatbush(ids.length)
    for (const id of ids) { const b = nodes[id]!.shape.box; index.add(b.xmin, b.ymin, b.xmax, b.ymax) }
    index.finish()
    layerIndices.push({ ids, index })
    ids.forEach((id, i) => {
      const a = nodes[id]!.shape, b = a.box
      for (const j of index.search(b.xmin - EPS, b.ymin - EPS, b.xmax + EPS, b.ymax + EPS))
        if (j > i && touches(a, nodes[ids[j]!]!.shape)) union.join([String(id), String(ids[j])])
    })
  }
  const expectedNets = new Map<string, string[]>(), groups = [], disconnected = []
  let requiredPortCount = 0, ignoredNcPortCount = 0
  for (const group of expected.groups) {
    for (const key of group.ports) expectedNets.set(key, group.nets)
    if (!group.nets.length && group.ports.length === 1) { ignoredNcPortCount++; continue }
    requiredPortCount += group.ports.length
    const islands = new Map<string, string[]>()
    for (const port of group.ports) append(islands, portNodes.has(port) ? union.root(portNodes.get(port)![0]!) : `missing:${port}`, port)
    const result = { ...group, islands: [...islands.values()] }
    groups.push(result)
    if (islands.size > 1) disconnected.push(result)
  }
  const physicalGroups = new Map<string, string[]>()
  for (const [port, ids] of portNodes) if (expected.ports.has(port)) append(physicalGroups, union.root(ids[0]!), port)
  const shorts = [...physicalGroups.values()].flatMap(ports => {
    const nets = [...new Set(ports.map(port => expectedNets.get(port)?.join(",") || `NC:${port}`))]
    return nets.length > 1 ? [{ nets, ports }] : []
  })
  // Resolve copper nets only through physical contact with original pins. A
  // short cannot redefine the intended source nets: shorts above fail first.
  const rootNets = new Map([...physicalGroups].map(([root, ports]) => [root,
    [...new Set(ports.map(port => expectedNets.get(port)?.join(",") || `NC:${port}`))]]))
  const elementsById = new Map(elements.map(e => [e[`${e.type}_id`], e]))
  const namedNet = (id: string) => {
    const name = elementsById.get(id)?.name
    return expected.groups.find(group => group.nets.includes(name))?.nets.join(",")
  }
  const declaredNet = (element?: Element): string | undefined => {
    if (!element) return
    if (element.source_net_id) return namedNet(element.source_net_id)
    if (element.source_trace_id) {
      const trace = elementsById.get(element.source_trace_id)
      const key = trace?.connected_source_port_ids.map((id: string) => sourceToKey.get(id)).find((key: string) => expectedNets.has(key))
      return key ? expectedNets.get(key)?.join(",") : trace?.connected_source_net_ids.map(namedNet).find(Boolean)
    }
    if (element.type === "pcb_via" && element.pcb_trace_id) return declaredNet(elementsById.get(element.pcb_trace_id))
    const port = sourceToKey.get(pcbPorts.get(element.pcb_port_id ?? "")?.source_port_id ?? "")
    return port ? expectedNets.get(port)?.join(",") || `NC:${port}` : undefined
  }
  const copperNet = (node: Node, root: string) => {
    const actual = rootNets.get(root)
    // A unique physically anchored net always overrides replayed metadata.
    // For an open/shorted intermediate candidate only, declarations distinguish
    // intended same-net islands. Opens, shorts and floating copper still fail.
    return actual?.length === 1 ? actual[0] : declaredNet(elementsById.get(node.id.split(":segment")[0]))
  }
  const padGap = board.min_pad_edge_to_pad_edge_clearance ?? 0.1
  const traceGap = board.min_trace_to_pad_edge_clearance ?? 0.1
  const traceTraceGap = board.min_trace_to_trace_clearance ?? traceGap
  const viaGap = board.min_via_edge_to_pad_edge_clearance ?? padGap
  const maxGap = Math.max(padGap, traceGap, traceTraceGap, viaGap)
  const clearanceViolations: { a: string; b: string; layer: string; actual: number; minimum: number }[] = []
  const checkedPairs = new Set<string>()
  for (const { ids, index } of layerIndices) ids.forEach((id, i) => {
    const a = nodes[id]!, box = a.shape.box, aRoot = union.root(String(id))
    for (const j of index.search(box.xmin - maxGap, box.ymin - maxGap, box.xmax + maxGap, box.ymax + maxGap)) {
      if (j <= i) continue
      const b = nodes[ids[j]!]!, bRoot = union.root(String(ids[j]))
      const aNet = copperNet(a, aRoot), bNet = copperNet(b, bRoot)
      if (aRoot === bRoot || (aNet && aNet === bNet)) continue
      const pair = [a.id, b.id].sort().join("|")
      if (checkedPairs.has(pair)) continue
      const minimum = a.type === "pcb_trace" && b.type === "pcb_trace" ? traceTraceGap
        : a.type === "pcb_trace" || b.type === "pcb_trace" ? traceGap
        : a.type === "pcb_via" || b.type === "pcb_via" ? viaGap : padGap
      const actual = a.shape.distanceTo(b.shape)[0]
      if (actual < minimum - EPS) {
        clearanceViolations.push({ a: a.id, b: b.id, layer: a.layer, actual, minimum })
        checkedPairs.add(pair)
      }
    }
  })
  const metricsForNet = (name: string) => {
    const group = expected.groups.find(group => group.nets.includes(name))
    const roots = new Set(group?.ports.flatMap(port => (portNodes.get(port) ?? []).map(id => union.root(id))))
    const ids = new Set(nodes.filter((_, i) => roots.has(union.root(String(i)))).map(node => node.id))
    return { traceLengthMm: [...ids].reduce((sum, id) => sum + (segmentLengths.get(id) ?? 0), 0),
      viaCount: [...ids].filter(id => viaIds.has(id)).length }
  }
  const unanchoredCopper = [...new Set(nodes.filter((_, i) => !physicalGroups.has(union.root(String(i)))).map(node => node.id))]
  return { requiredPortCount, ignoredNcPortCount, groups, disconnected, shorts, invalid, unanchoredCopper, clearanceViolations,
    missingPorts: [...expected.ports.keys()].filter(port => !portNodes.has(port)),
    sourceSignature: current.signature, metricsForNet }
}
