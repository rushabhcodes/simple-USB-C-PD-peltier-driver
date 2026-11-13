import type { AnyCircuitElement } from "circuit-json"
import { computeGapBetweenCopper } from "@tscircuit/circuit-json-util"

type RecordElement = AnyCircuitElement & Record<string, any>
export type SourceBoard = { id: string; json: AnyCircuitElement[] }
export type Cable = Array<[string, string]>

/** Actual source graphs, including package internal connections. Cross-board
 * nets join ONLY through the explicit cable; equal net names alone do not join.
 */
export function connectivity(boards: SourceBoard[], cable: Cable = [], includeNames?: Set<string>) {
  const parents = new Map<string, string>(), ports = new Map<string, { id: string; part: string; pin: string }>()
  const namedNets: Array<{ id: string; name: string }> = []
  let ignoredViaPorts = 0
  const root = (id: string): string => {
    const parent = parents.get(id)
    if (!parent) { parents.set(id, id); return id }
    if (parent === id) return id
    const result = root(parent)
    parents.set(id, result)
    return result
  }
  const join = (ids: string[]) => { for (const id of ids.slice(1)) parents.set(root(id), root(ids[0]!)) }
  for (const { id: board, json } of boards) {
    const elements = json as RecordElement[]
    const prefix = (id: string) => `${board}:${id}`
    const components = new Map(elements.filter(e => e.type === "source_component").map(e => [e.source_component_id, e.name]))
    for (const e of elements) {
      if (e.type === "source_trace") join([...e.connected_source_port_ids, ...e.connected_source_net_ids].map(prefix))
      if (e.type === "source_component") for (const ids of e.internally_connected_source_port_ids ?? []) join(ids.map(prefix))
      if (e.type === "source_component_internal_connection") join(e.source_port_ids.map(prefix))
      if (e.type === "source_net") namedNets.push({ id: prefix(e.source_net_id), name: e.name })
      if (e.type === "source_port") {
        const part = components.get(e.source_component_id ?? "")
        if (!part) {
          // Native manually placed vias have top/bottom source proxies, not
          // purchased source components. Do not ignore any other missing owner.
          if (/^source_manually_placed_via_\d+$/.test(e.source_component_id ?? "") &&
            ["top", "bottom"].includes(e.name) && e.pin_number == null) { ignoredViaPorts++; continue }
          throw new Error(`Missing owner for ${board}:${e.source_port_id}`)
        }
        const pin = `${part}.pin${e.pin_number ?? e.name}`, key = `${board}:${pin}`
        if (ports.has(key)) throw new Error(`Duplicate pin ${key}`)
        ports.set(key, { id: prefix(e.source_port_id), part, pin })
      }
    }
  }
  for (const [a, b] of cable) {
    if (!ports.has(a) || !ports.has(b)) throw new Error(`Cable refers to a missing pin: ${a} / ${b}`)
    join([ports.get(a)!.id, ports.get(b)!.id])
  }
  const nets = new Map<string, Set<string>>()
  for (const e of namedNets) {
    const id = root(e.id)
    if (!nets.has(id)) nets.set(id, new Set())
    nets.get(id)!.add(e.name)
  }
  const groups = new Map<string, string[]>(), seenPins = new Set<string>()
  for (const [qualifiedPin, p] of ports) {
    if (includeNames && !includeNames.has(p.part)) continue
    const identity = includeNames ? p.pin : qualifiedPin
    if (seenPins.has(identity)) throw new Error(`Component/pin exists on multiple boards: ${identity}`)
    seenPins.add(identity)
    const id = root(p.id)
    groups.set(id, [...groups.get(id) ?? [], identity])
  }
  const signature = JSON.stringify([...groups].map(([id, pins]) => ({ pins: pins.sort(), nets: [...nets.get(id) ?? []].sort() }))
    .sort((a, b) => a.pins.join().localeCompare(b.pins.join())))
  return { signature, pinCount: seenPins.size, ignoredViaPorts,
    connected(a: string, b: string) {
      if (!ports.has(a) || !ports.has(b)) throw new Error(`Missing pin: ${a} / ${b}`)
      return root(ports.get(a)!.id) === root(ports.get(b)!.id)
    },
    netsAt(pin: string) {
      const port = ports.get(pin)
      if (!port) throw new Error(`Missing pin ${pin}`)
      return [...nets.get(root(port.id)) ?? []].sort()
    } }
}

export const straightCable: Cable = Array.from({ length: 16 }, (_, i) =>
  [`power:J_LINK.pin${i + 1}`, `control:J_LINK.pin${i + 1}`])

export function placementIssues(json: AnyCircuitElement[]) {
  const elements = json as RecordElement[]
  const board = elements.find(e => e.type === "pcb_board")
  if (!board?.width || !board?.height) return ["Missing board dimensions"]
  const source = new Map(elements.filter(e => e.type === "source_component").map(e => [e.source_component_id, e.name]))
  const parts = elements.filter(e => e.type === "pcb_component" && source.has(e.source_component_id))
  const pads = elements.filter(e => ["pcb_smtpad", "pcb_plated_hole"].includes(e.type))
  const issues: string[] = []
  for (const p of parts) {
    if (![p.center.x, p.center.y, p.width, p.height].every(Number.isFinite) ||
      Math.abs(p.center.x - board.center.x) + p.width / 2 > board.width / 2 + 0.01 ||
      Math.abs(p.center.y - board.center.y) + p.height / 2 > board.height / 2 + 0.01)
      issues.push(`Bounds: ${source.get(p.source_component_id)}`)
  }
  for (let i = 0; i < parts.length; i++) for (let j = i + 1; j < parts.length; j++) {
    const a = parts[i]!, b = parts[j]!
    const clearance = a.do_not_place || b.do_not_place ? board.min_pad_edge_to_pad_edge_clearance ?? 0.1 : -0.01
    if (a.layer !== b.layer || Math.abs(a.center.x - b.center.x) >= (a.width + b.width) / 2 + clearance ||
      Math.abs(a.center.y - b.center.y) >= (a.height + b.height) / 2 + clearance) continue
    if (a.do_not_place || b.do_not_place) {
      const ap = pads.filter(p => p.pcb_component_id === a.pcb_component_id), bp = pads.filter(p => p.pcb_component_id === b.pcb_component_id)
      if (ap.length && bp.length && ap.every(p => bp.every(q => computeGapBetweenCopper(p as any, q as any) >= clearance))) continue
    }
    issues.push(`Overlap: ${source.get(a.source_component_id)} / ${source.get(b.source_component_id)}`)
  }
  return issues
}
