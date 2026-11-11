import { beforeAll, describe, expect, test } from "bun:test"
import { Circuit } from "tscircuit"
import { loadJscadPlan } from "circuit-json-to-gltf"
import Device from "../assembly"
import { boardFixture, renderFixture, placedComponents, FIXTURE_RENDER_TIMEOUT } from "./fixtures"
import { assemblyConnections, hotProbe, coldProbe, hotProbeCable, coldProbeCable, fan, fanCable } from "../src/assembly/models"
import provenance from "../assets/assembly/provenance.json"

type RenderedCircuit = InstanceType<typeof Circuit>
type MeshVertex = ReturnType<typeof loadJscadPlan>["triangles"][number]["vertices"][number]
let board: RenderedCircuit, device: RenderedCircuit
const originalNames = ["TEC_DEFAULT", "USB_PD_CABLE", "USB_PROGRAM_CABLE", "TEC_POS_LEAD", "TEC_NEG_LEAD"]
const externalNames = [...originalNames, "HOT_PROBE", "COLD_PROBE", "HOT_PROBE_CABLE", "COLD_PROBE_CABLE", "FAN_DEFAULT", "FAN_CABLE"]
const originalConnections = assemblyConnections.filter(connection => originalNames.includes(connection.partName))
const meshes = new Map<string, ReturnType<typeof loadJscadPlan>>()

beforeAll(async () => {
  board = await boardFixture()
}, FIXTURE_RENDER_TIMEOUT)
beforeAll(async () => {
  device = await renderFixture(<Device schematicDisabled />)
}, FIXTURE_RENDER_TIMEOUT)

function ownerName(c: RenderedCircuit, id: string | undefined) {
  return c.db.source_component.list().find(part => part.source_component_id === id)?.name
}

function externalGeometry(name: string) {
  const source = device.db.source_component.list().find(part => part.name === name)!
  const cad = device.db.cad_component.list().find(model => model.source_component_id === source.source_component_id)!
  let mesh = meshes.get(name)
  if (!mesh) { mesh = loadJscadPlan(cad.model_jscad!); meshes.set(name, mesh) }
  return { source, cad, mesh }
}

function physicalSignature(c: RenderedCircuit) {
  return c.getCircuitJson().filter(item => item.type.startsWith("pcb_"))
    .map(item => {
      const value = item as unknown as Record<string, unknown>
      const pcb = c.db.pcb_component.list().find(part => part.pcb_component_id === value.pcb_component_id)
      return JSON.stringify({ name: pcb && ownerName(c, pcb.source_component_id),
        ...Object.fromEntries(Object.entries(value).filter(([key]) => !key.endsWith("_id") && !key.endsWith("_ids"))) })
    }).sort()
}

function electricalSignature(c: RenderedCircuit) {
  const roots = new Map<string, string>()
  function root(id: string): string {
    const parent = roots.get(id)
    return !parent || parent === id ? id : root(parent)
  }
  const join = (ids: string[]) => {
    if (!ids.length) return
    const first = root(ids[0]!)
    for (const id of ids.slice(1)) roots.set(root(id), first)
  }
  for (const trace of c.db.source_trace.list())
    join([...trace.connected_source_port_ids, ...trace.connected_source_net_ids])
  for (const part of c.db.source_component.list())
    for (const ports of part.internally_connected_source_port_ids ?? []) join(ports)
  return c.db.source_port.list().map(port => JSON.stringify({
    name: ownerName(c, port.source_component_id), pin: port.pin_number,
    nets: c.db.source_net.list().filter(net => root(net.source_net_id) === root(port.source_port_id)).map(net => net.name).sort(),
  })).sort()
}

describe("native Peltier assembly", () => {
  test("the optional assembly contains native models for the module, cables, temperature probes and fan", () => {
    expect(device.firstChild?.componentName).toBe("AssemblyDevice")
    expect(device.getCircuitJson().filter(item => item.type.endsWith("_error"))).toEqual([])
    const external = device.db.source_component.list().filter(part => part.ftype === "subassembly")
    expect(external.map(part => part.name).sort()).toEqual([...externalNames].sort())
    for (const part of external) {
      expect(part.supplier_part_numbers?.jlcpcb).toBeUndefined()
      expect(device.db.pcb_component.list().filter(pcb => pcb.source_component_id === part.source_component_id)).toHaveLength(0)
      expect(device.db.source_port.list().filter(port => port.source_component_id === part.source_component_id)).toHaveLength(0)
      const cad = device.db.cad_component.list().find(model => model.source_component_id === part.source_component_id)!
      expect(cad).toBeDefined()
      expect(cad.pcb_component_id).toBeUndefined()
      expect(cad.model_jscad).toBeDefined()
      const { mesh } = externalGeometry(part.name)
      expect(mesh.triangles.length).toBeGreaterThan(0)
      expect(mesh.triangles.every(triangle => triangle.vertices.every(vertex =>
        Number.isFinite(vertex.x) && Number.isFinite(vertex.y) && Number.isFinite(vertex.z)))).toBe(true)
      for (const axis of ["x", "y", "z"] as const)
        expect(mesh.boundingBox.max[axis] - mesh.boundingBox.min[axis]).toBeGreaterThan(0)
    }
  })

  test("the mechanical assembly preserves the entire physical PCB and its electrical connections", () => {
    expect(device.db.pcb_board.list()).toHaveLength(1)
    expect(placedComponents(device).filter(part => !part.do_not_place)).toHaveLength(
      placedComponents(board).filter(part => !part.do_not_place).length)
    expect(placedComponents(device).filter(part => !part.do_not_place)).toHaveLength(134)
    expect(placedComponents(device).filter(part => part.do_not_place)).toHaveLength(16)
    expect(physicalSignature(device)).toEqual(physicalSignature(board))
    expect(electricalSignature(device)).toEqual(electricalSignature(board))
  })

  test("accessory solids meet the real connector endpoints with correct TEC polarity and documented dimensions", () => {
    expect(originalConnections.map(connection => [connection.partName, connection.boardConnector,
      "pin" in connection ? connection.pin : undefined])).toEqual([
      ["USB_PD_CABLE", "J_USB", undefined], ["USB_PROGRAM_CABLE", "J_PROGRAM", undefined],
      ["TEC_POS_LEAD", "J_TEC", "pin1"], ["TEC_NEG_LEAD", "J_TEC", "pin2"],
    ])
    const { source: tecSource, cad: tecCad, mesh: tecMesh } = externalGeometry("TEC_DEFAULT")
    expect(tecSource.display_name).toContain("TEC1-12706")
    // loadJscadPlan converts circuit XY/Z into scene XZ/Y. Dimensions must
    // match the selected product's recorded envelope, not just its CAD label.
    const spans = (["x", "z", "y"] as const).map(axis => tecMesh.boundingBox.max[axis] - tecMesh.boundingBox.min[axis])
    for (let i = 0; i < 3; i++) expect(spans[i]!).toBeCloseTo(provenance.peltier.bodyDimensionsMm[i]!, 5)
    expect(provenance.peltier.source).toBe("https://www.amazon.com/dp/B00M1PM7H6")
    expect(provenance.peltier.nativePart).toBe(tecSource.name)
    expect(provenance.peltier.leadParts.map(lead => [lead.nativePart, lead.boardConnector, lead.pin])).toEqual(
      originalConnections.flatMap(connection => "pin" in connection
        ? [[connection.partName, connection.boardConnector, connection.pin]] : []))
    expect(provenance.usbCables.quantity).toBe(2)
    expect(provenance.usbCables.roles.map(role => role.boardPort).sort()).toEqual(["J_PROGRAM", "J_USB"])
    expect(provenance.usbCables.roles.map(role => [role.nativePart, role.boardPort])).toEqual(
      originalConnections.filter(connection => !("pin" in connection)).map(connection => [connection.partName, connection.boardConnector]))
    // Verify the rendered lead colors agree with their electrical polarity.
    for (const [name, positive] of [["TEC_POS_LEAD", true], ["TEC_NEG_LEAD", false]] as const) {
      const triangles = externalGeometry(name).mesh.triangles
      expect(triangles.every(triangle => {
        const color = triangle.material?.color
        return Array.isArray(color) && (positive
          ? color[0] > color[1] + 0.3 && color[0] > color[2] + 0.3
          : Math.max(...color) < 0.25)
      })).toBe(true)
    }

    for (const connection of originalConnections) {
      const part = device.db.source_component.list().find(part => part.name === connection.boardConnector)!
      const pcb = device.db.pcb_component.list().find(pcb => pcb.source_component_id === part.source_component_id)!
      if ("pin" in connection) {
        const pin = Number(connection.pin.slice(3))
        const sourcePort = device.db.source_port.list().find(port => port.source_component_id === part.source_component_id && port.pin_number === pin)!
        const pcbPort = device.db.pcb_port.list().find(port => port.source_port_id === sourcePort.source_port_id)!
        expect(connection.boardPoint[0]).toBeCloseTo(pcbPort.x, 5)
        expect(connection.boardPoint[1]).toBeCloseTo(pcbPort.y, 5)
        const trace = device.db.source_trace.list().find(trace => trace.connected_source_port_ids.includes(sourcePort.source_port_id))!
        const net = device.db.source_net.list().find(net => trace.connected_source_net_ids.includes(net.source_net_id))!
        expect(net.name).toBe(pin === 1 ? "TEC_POS" : "GND")
        const point = connection.modulePoint
        expect(point[0]).toBeCloseTo(tecCad.position.x + tecMesh.boundingBox.min.x, 5)
        expect(point[1]).toBeGreaterThan(tecCad.position.y + tecMesh.boundingBox.min.z)
        expect(point[1]).toBeLessThan(tecCad.position.y + tecMesh.boundingBox.max.z)
      } else {
        // tscircuit infers this metadata from silk outlines. With intentionally
        // no silk, keep the established physical USB face/anchor contract, not
        // the now outline-free inference (which points at the wrong edge).
        expect(pcb.rotation).toBe(270)
        expect(connection.boardPoint[0]).toBeCloseTo(Number(pcb.display_offset_x) - 7.237483112, 5)
        expect(connection.boardPoint[1]).toBeCloseTo(Number(pcb.display_offset_y), 5)
        expect(externalGeometry(connection.partName).source.display_name).toContain("Cable Matters 201440")
      }
      const { cad, mesh } = externalGeometry(connection.partName)
      expect(cad.rotation).toEqual({ x: 0, y: 0, z: 0 })
      const offset = { x: cad.position.x, y: cad.position.z, z: cad.position.y }
      // Check actual triangulated solids enclose both their board attachment
      // and authored wire path; this catches an offset applied twice or lost.
      for (const [x, circuitY, height] of [connection.boardPoint, ...connection.path]) {
        const point = { x, y: height, z: circuitY }
        for (const axis of ["x", "y", "z"] as const) {
          expect(point[axis]).toBeGreaterThanOrEqual(mesh.boundingBox.min[axis] + offset[axis] - 0.01)
          expect(point[axis]).toBeLessThanOrEqual(mesh.boundingBox.max[axis] + offset[axis] + 0.01)
        }
      }
    }
  })

  test("both factory probe cables render three correctly colored conductors at the actual sensor terminals", () => {
    const details = provenance.temperatureProbes
    expect(details.source).toBe("https://www.amazon.com/dp/B00M1PM55K")
    expect(details.quantityUsed).toBe(2)
    expect(details.cableLengthMm).toBe(1_000)
    expect(details.housingDimensionsVerified).toBe(false)
    expect(details.roles.map(role => [role.role, role.boardPort, role.nativePart, role.cableNativePart, role.gpio])).toEqual([
      ["HOT", "J_HOT_SENSOR", "HOT_PROBE", "HOT_PROBE_CABLE", "GP8"],
      ["COLD", "J_COLD_SENSOR", "COLD_PROBE", "COLD_PROBE_CABLE", "GP9"],
    ])
    expect(assemblyConnections.filter(connection => "probePoint" in connection).map(connection =>
      [connection.partName, connection.boardConnector])).toEqual([
      ["HOT_PROBE_CABLE", "J_HOT_SENSOR"], ["COLD_PROBE_CABLE", "J_COLD_SENSOR"],
    ])
    const pins = new Map(electricalSignature(device).map(json => {
      const pin = JSON.parse(json) as { name: string; pin: number; nets: string[] }
      return [`${pin.name}.${pin.pin}`, pin.nets] as const
    }))
    for (const [probe, cable, side] of [[hotProbe, hotProbeCable, "HOT"], [coldProbe, coldProbeCable, "COLD"]] as const) {
      const { source: probeSource, cad: probeCad, mesh: probeMesh } = externalGeometry(probe.partName)
      expect(probeSource.display_name).toContain("HiLetgo DS18B20")
      expect(probeSource.display_name).toContain("illustrative")
      expect(probeCad.position).toEqual({ x: probe.position[0], y: probe.position[1], z: probe.position[2] })
      expect(probeMesh.boundingBox.max.x - probeMesh.boundingBox.min.x).toBeCloseTo(details.illustrativeHousingEnvelopeMm.length, 5)
      for (const axis of ["y", "z"] as const)
        expect(probeMesh.boundingBox.max[axis] - probeMesh.boundingBox.min[axis]).toBeCloseTo(details.illustrativeHousingEnvelopeMm.diameter, 5)
      // The jacket joins the rear center of the actual rendered cylinder.
      expect(cable.probePoint).toEqual(probe.cableEndPoint)
      expect(cable.probePoint[0]).toBeCloseTo(probeCad.position.x + probeMesh.boundingBox.min.x, 5)
      expect(cable.probePoint[1]).toBe(probeCad.position.y)
      expect(cable.probePoint[2]).toBe(probeCad.position.z)
      expect(cable.path[cable.path.length - 1]).toEqual(cable.probePoint)
      expect(cable.conductors.map(conductor => [conductor.pin, conductor.signal, conductor.colorName])).toEqual([
        ["pin1", "CTRL_3V3", "red"], ["pin2", `${side}_SENSOR_DATA`, "yellow"], ["pin3", "GND", "black"],
      ])
      const { cad, mesh } = externalGeometry(cable.partName)
      expect(cad.rotation).toEqual({ x: 0, y: 0, z: 0 })
      const offset = { x: cad.position.x, y: cad.position.z, z: cad.position.y }
      const nearPoint = (vertices: MeshVertex[], point: readonly number[], radius: number) =>
        vertices.some(vertex => Math.hypot(vertex.x + offset.x - point[0]!,
          vertex.y + offset.y - point[2]!, vertex.z + offset.z - point[1]!) <= radius)
      const connector = device.db.source_component.list().find(part => part.name === cable.boardConnector)!
      for (const conductor of cable.conductors) {
        const pin = Number(conductor.pin.slice(3))
        const sourcePort = device.db.source_port.list().find(port =>
          port.source_component_id === connector.source_component_id && port.pin_number === pin)!
        const physicalPort = device.db.pcb_port.list().find(port => port.source_port_id === sourcePort.source_port_id)!
        expect(conductor.boardPoint[0]).toBeCloseTo(physicalPort.x, 5)
        expect(conductor.boardPoint[1]).toBeCloseTo(physicalPort.y, 5)
        expect(pins.get(`${cable.boardConnector}.${pin}`)).toEqual([conductor.signal])
        expect(conductor.path[0]).toEqual(conductor.boardPoint)
        expect(conductor.path[conductor.path.length - 1]).toEqual(cable.path[0])
        for (let i = 1; i < conductor.path.length; i++)
          expect(conductor.path[i]![0]).toBeGreaterThanOrEqual(conductor.path[i - 1]![0])
        const [r, g, b] = conductor.color
        expect(conductor.colorName === "red" ? r > g + 0.3 && r > b + 0.3 :
          conductor.colorName === "yellow" ? r > 0.6 && g > 0.5 && b < 0.2 : Math.max(r, g, b) < 0.2).toBe(true)
        const coloredVertices = mesh.triangles.filter(triangle => {
          const color = triangle.material?.color
          return Array.isArray(color) && conductor.color.every((value, i) => Math.abs(color[i]! - value) < 1e-6)
        }).flatMap(triangle => triangle.vertices)
        expect(coloredVertices.length).toBeGreaterThan(0)
        // Matching-color polygons must physically reach every wire endpoint;
        // a colored metadata label or a broad overall bounding box is insufficient.
        for (const point of conductor.path) expect(nearPoint(coloredVertices, point, 0.36)).toBe(true)
      }
      const blackVertices = mesh.triangles.filter(triangle => {
        const color = triangle.material?.color
        return Array.isArray(color) && Math.max(...color.slice(0, 3)) < 0.2
      }).flatMap(triangle => triangle.vertices)
      for (const point of cable.path) expect(nearPoint(blackVertices, point, 1.51)).toBe(true)
    }
  })

  test("manufacturer fan CAD and the four-wire factory plug match the real header without changing its NC signals", () => {
    const details = provenance.fan
    expect(details.source).toBe("https://www.amazon.com/dp/B00NEMG62M")
    expect(details.dimensionsVerified).toBe(true)
    expect(details.nativePart).toBe(fan.partName)
    expect(details.cableNativePart).toBe(fanCable.partName)
    expect(details.boardConnector).toBe(fanCable.boardConnector)
    expect(details.nominalVoltageV).toBe(12)
    expect(details.maximumInputCurrentA).toBeLessThan(details.boardContinuousFanBudgetA)
    expect(details.cableLengthMm).toBe(fanCable.cableLengthMm)
    expect(details.extensionFitted).toBe(false)
    expect(details.lowNoiseAdaptorFitted).toBe(false)
    const { source, cad, mesh } = externalGeometry(fan.partName)
    expect(source.display_name).toContain("official NF-A8 family CAD")
    expect(mesh.triangles.length).toBe(details.geometry.conversion.triangles)
    expect(cad.position).toEqual({ x: fan.position[0], y: fan.position[1], z: fan.position[2] })
    for (const [i, axis] of (["x", "z", "y"] as const).entries())
      expect(mesh.boundingBox.max[axis] - mesh.boundingBox.min[axis]).toBeCloseTo(details.bodyWithPadsDimensionsMm[i]!, 4)
    expect(fan.mountingHoleSpacingMm).toBe(details.mountingHoleSpacingMm)
    // Exploded placement must leave the fan frame clear of the PCB and TEC.
    const pcb = device.db.pcb_board.list()[0]!
    expect(cad.position.y + mesh.boundingBox.max.z).toBeLessThan(pcb.center.y - pcb.height! / 2)
    const tec = externalGeometry("TEC_DEFAULT")
    expect(cad.position.y + mesh.boundingBox.max.z).toBeLessThan(tec.cad.position.y + tec.mesh.boundingBox.min.z)
    expect(fanCable.path[fanCable.path.length - 1]).toEqual(fan.cableEndPoint)
    // The unpublished cable exit is illustrative, but must meet the frame.
    for (const [i, axis] of (["x", "z", "y"] as const).entries()) {
      expect(fanCable.fanPoint[i]!).toBeGreaterThanOrEqual(fan.position[i]! + mesh.boundingBox.min[axis])
      expect(fanCable.fanPoint[i]!).toBeLessThanOrEqual(fan.position[i]! + mesh.boundingBox.max[axis])
    }
    expect(fanCable.conductors.map(c => ({ pin: c.pin, signal: c.signal, color: c.colorName, boardConnected: c.boardConnected }))).toEqual(details.wireMap)
    const connector = device.db.source_component.list().find(part => part.name === fanCable.boardConnector)!
    const header = device.db.pcb_component.list().find(part => part.source_component_id === connector.source_component_id)!
    const locator = device.db.pcb_hole.list().find(hole => hole.pcb_component_id === header.pcb_component_id)!
    expect(locator.hole_shape === "circle" && locator.hole_diameter).toBe(1.25)
    expect(fanCable.locatorPoint[0]).toBeCloseTo(locator.x, 5)
    expect(fanCable.locatorPoint[1]).toBeCloseTo(locator.y, 5)
    const cable = externalGeometry(fanCable.partName)
    const nearPoint = (vertices: MeshVertex[], point: readonly number[], radius: number) => vertices.some(vertex =>
      Math.hypot(vertex.x + cable.cad.position.x - point[0]!, vertex.y + cable.cad.position.z - point[2]!,
        vertex.z + cable.cad.position.y - point[1]!) <= radius)
    const pins = new Map(electricalSignature(device).map(json => {
      const pin = JSON.parse(json) as { name: string; pin: number; nets: string[] }
      return [`${pin.name}.${pin.pin}`, pin.nets] as const
    }))
    for (const conductor of fanCable.conductors) {
      const pin = Number(conductor.pin.slice(3))
      const sourcePort = device.db.source_port.list().find(port => port.source_component_id === connector.source_component_id && port.pin_number === pin)!
      const physicalPort = device.db.pcb_port.list().find(port => port.source_port_id === sourcePort.source_port_id)!
      expect(conductor.boardPoint[0]).toBeCloseTo(physicalPort.x, 5)
      expect(conductor.boardPoint[1]).toBeCloseTo(physicalPort.y, 5)
      expect(pins.get(`${fanCable.boardConnector}.${pin}`)).toEqual(conductor.boardConnected ? [conductor.signal] : [])
      expect(Boolean(sourcePort.do_not_connect)).toBe(!conductor.boardConnected)
      const vertices = cable.mesh.triangles.filter(triangle => {
        const color = triangle.material?.color
        return Array.isArray(color) && conductor.color.every((value, i) => Math.abs(color[i]! - value) < 1e-6)
      }).flatMap(triangle => triangle.vertices)
      expect(vertices.length).toBeGreaterThan(0)
      for (const point of conductor.path) expect(nearPoint(vertices, point, 0.36)).toBe(true)
    }
    const sleeve = cable.mesh.triangles.filter(triangle => {
      const color = triangle.material?.color
      return Array.isArray(color) && [0.05, 0.055, 0.06].every((value, i) => Math.abs(color[i]! - value) < 1e-6)
    }).flatMap(triangle => triangle.vertices)
    for (const point of fanCable.path) expect(nearPoint(sleeve, point, 1.61)).toBe(true)
    // The plug's long side must follow the actual header pin row after rotation.
    const plug = cable.mesh.triangles.filter(triangle => {
      const color = triangle.material?.color
      return Array.isArray(color) && [0.77, 0.74, 0.64].every((value, i) => Math.abs(color[i]! - value) < 1e-6)
    }).flatMap(triangle => triangle.vertices)
    expect(plug.length).toBeGreaterThan(0)
    const [first, last] = [1, 4].map(pin => {
      const port = device.db.source_port.list().find(port => port.source_component_id === connector.source_component_id && port.pin_number === pin)!
      return device.db.pcb_port.list().find(p => p.source_port_id === port.source_port_id)!
    })
    const distance = Math.hypot(last!.x - first!.x, last!.y - first!.y)
    const axis = [(last!.x - first!.x) / distance, (last!.y - first!.y) / distance]
    const span = (values: number[]) => Math.max(...values) - Math.min(...values)
    expect(span(plug.map(v => v.x * axis[0]! + v.z * axis[1]!))).toBeCloseTo(10.2, 5)
    expect(span(plug.map(v => -v.x * axis[1]! + v.z * axis[0]!))).toBeLessThan(5)
    const pathLength = (path: number[][]) => path.slice(1).reduce((sum, point, i) =>
      sum + Math.hypot(...point.map((value, axis) => value - path[i]![axis]!)), 0)
    const cableLength = pathLength(fanCable.path) + Math.max(...fanCable.conductors.map(c => pathLength(c.path)))
    expect(cableLength).toBeLessThanOrEqual(fanCable.cableLengthMm)
    expect(cableLength).toBeGreaterThan(fanCable.cableLengthMm - 2)
  })
})
