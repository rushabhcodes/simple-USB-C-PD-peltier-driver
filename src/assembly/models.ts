import type { JscadOperation, JscadPolygon3 } from "jscad-planner"
import fanMesh from "./assets/noctua-nf-a8-pwm.mesh.json"
import { connectorPlacements, connectorPoint, fanLocatorLocal, fanPinLocal, sensorPinLocal, tecPinLocal, usbFaceLocal, type Point3 } from "./connector-placement"

// Circuit coordinates: X/Y follow the PCB, Z is height. Accessory geometry is
// documented peripheral geometry; cable routes are not a mechanical fit test.
const add = (a: Point3, b: Point3): Point3 => a.map((v, i) => v + b[i]!) as Point3
const subtract = (a: Point3, b: Point3): Point3 => a.map((v, i) => v - b[i]!) as Point3
const scaled = (a: Point3, scale: number): Point3 => a.map(v => v * scale) as Point3
const union = (shapes: JscadOperation[]): JscadOperation => ({ type: "union", shapes })
const colored = (color: Point3, shape: JscadOperation): JscadOperation => ({ type: "colorize", color, shape })
const cuboid = (size: Point3, center: Point3): JscadOperation => ({ type: "translate", vector: center, shape: { type: "cuboid", size } })

function wire(points: Point3[], radius: number, color: Point3): JscadOperation {
  const shapes: JscadOperation[] = points.map(center => ({ type: "sphere", radius, center, resolution: 12 }))
  for (let i = 1; i < points.length; i++) {
    const delta = subtract(points[i]!, points[i - 1]!), length = Math.hypot(...delta)
    const center = scaled(add(points[i]!, points[i - 1]!), 0.5)
    shapes.push({ type: "translate", vector: center, shape: { type: "rotateZ", angle: Math.atan2(delta[1], delta[0]),
      shape: { type: "rotateY", angle: Math.acos(delta[2] / length),
        shape: { type: "cylinder", radius, height: length, resolution: 12 } } } })
  }
  return colored(color, union(shapes))
}

// Colored native polygons avoid a browser-incompatible CSG runtime import.
// Each cable is a closed tube through its authored path, with 12-sided rings.
function wirePolygons(points: Point3[], radius: number, color: Point3): JscadPolygon3[] {
  const cross = (a: Point3, b: Point3): Point3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
  const normalize = (a: Point3) => scaled(a, 1 / Math.hypot(...a))
  const rings = points.map((point, i) => {
    const tangent = normalize(subtract(points[Math.min(i + 1, points.length - 1)]!, points[Math.max(0, i - 1)]!))
    const u = normalize(cross(tangent, Math.abs(tangent[2]) < 0.9 ? [0, 0, 1] : [0, 1, 0]))
    const v = cross(tangent, u)
    return Array.from({ length: 12 }, (_, j) => {
      const angle = j * Math.PI / 6
      return add(point, add(scaled(u, radius * Math.cos(angle)), scaled(v, radius * Math.sin(angle))))
    })
  })
  const polygons: JscadPolygon3[] = [{ vertices: [...rings[0]!].reverse(), color }, { vertices: rings[rings.length - 1]!, color }]
  for (let i = 1; i < rings.length; i++) {
    const a = rings[i - 1]!, b = rings[i]!
    for (let j = 0; j < 12; j++) {
      const next = (j + 1) % 12
      polygons.push({ vertices: [a[j]!, a[next]!, b[next]!], color }, { vertices: [a[j]!, b[next]!, b[j]!], color })
    }
  }
  return polygons
}

export const moduleCenter: Point3 = [112, 24, 1.8]
export const moduleModel = colored([0.965, 0.969, 0.965], union([
  cuboid([38.5, 38.5, 2.2], [0, 0, 0]),
  ...[-1.45, 1.45].map(z => cuboid([40, 40, 0.7], [0, 0, z])),
]))

function usbCable(boardConnector: "J_USB" | "J_PROGRAM", partName: string, branch: number, color: Point3) {
  const placement = connectorPlacements[boardConnector]
  const boardPoint = connectorPoint(placement, usbFaceLocal)
  const outward = subtract(connectorPoint(placement, [0, -1, 0]), connectorPoint(placement, [0, 0, 0]))
  const side: Point3 = [outward[1], -outward[0], 0]
  const plug = add(boardPoint, scaled(outward, 0.5))
  const path = [[24, 0], [45, 0], [60, 13], [66, 38]].map(([distance, bend]) =>
    add(add(plug, scaled(outward, distance!)), scaled(side, branch * bend!)))
  const rotation = (placement.pcbRotation + 90) * Math.PI / 180
  const plugShape = (size: Point3, center: Point3): JscadOperation => ({ type: "translate", vector: subtract(center, boardPoint),
    shape: { type: "rotateZ", angle: rotation, shape: cuboid(size, [0, 0, 0]) } })
  return { partName, boardConnector, boardPoint, path, position: boardPoint,
    displayName: boardConnector === "J_USB" ? "Cable Matters 201440 · PD power · envelope" : "Cable Matters 201440 · USB programming · envelope",
    model: colored(color, union([plugShape([7, 8.3, 3], plug),
      plugShape([20, 11, 5.4], add(plug, scaled(outward, 14))),
      wire(path.map(point => subtract(point, boardPoint)), 2.1, color)])) }
}

function tecLead(pin: "pin1" | "pin2", partName: string, offset: number, color: Point3) {
  const boardPoint = connectorPoint(connectorPlacements.J_TEC, tecPinLocal[pin])
  const modulePoint: Point3 = [moduleCenter[0] - 20, moduleCenter[1] + offset, moduleCenter[2]]
  const path: Point3[] = [boardPoint, [connectorPlacements.J_TEC.pcbX + 15, boardPoint[1], 6],
    [connectorPlacements.J_TEC.pcbX + 34, moduleCenter[1] + offset, 4], modulePoint]
  return { partName, boardConnector: "J_TEC", pin, boardPoint, modulePoint, path, position: boardPoint,
    displayName: pin === "pin1" ? "TEC positive lead · red · path illustration" : "TEC negative lead · black · path illustration",
    model: wire(path.map(point => subtract(point, boardPoint)), 0.75, color) }
}

export const usbPdCable = usbCable("J_USB", "USB_PD_CABLE", 1, [0.19, 0.21, 0.25])
export const usbProgramCable = usbCable("J_PROGRAM", "USB_PROGRAM_CABLE", -1, [0.68, 0.73, 0.79])
export const tecPositiveLead = tecLead("pin1", "TEC_POS_LEAD", -3, [0.78, 0.17, 0.21])
export const tecNegativeLead = tecLead("pin2", "TEC_NEG_LEAD", 3, [0.125, 0.14, 0.17])

// Selected HiLetgo B00M1PM55K housing dimensions are not published/verified.
// These cylinders are explicitly illustrative, not seller-specified dimensions.
const probeBodyLengthMm = 50, probeBodyDiameterMm = 6
const probeModel: JscadOperation = { type: "rotateY", angle: Math.PI / 2,
  shape: { type: "cylinder", height: probeBodyLengthMm, radius: probeBodyDiameterMm / 2 },
  material: { color: [0.72, 0.75, 0.77], metalness: 0.8, roughness: 0.3 } }
export const hotProbe = { partName: "HOT_PROBE", position: [112, 50, 9.6] as Point3, model: probeModel,
  cableEndPoint: [87, 50, 9.6] as Point3, bodyLengthMm: probeBodyLengthMm, bodyDiameterMm: probeBodyDiameterMm }
export const coldProbe = { partName: "COLD_PROBE", position: [112, -8, -6] as Point3, model: probeModel,
  cableEndPoint: [87, -8, -6] as Point3, bodyLengthMm: probeBodyLengthMm, bodyDiameterMm: probeBodyDiameterMm }

function probeCable(boardConnector: "J_HOT_SENSOR" | "J_COLD_SENSOR", partName: string, probePoint: Point3) {
  const placement = connectorPlacements[boardConnector]
  const boardPoint = connectorPoint(placement, sensorPinLocal.pin2)
  const join: Point3 = [66, placement.pcbY, 8]
  const path: Point3[] = [join, [77, boardConnector === "J_HOT_SENSOR" ? 42 : -24, boardConnector === "J_HOT_SENSOR" ? 12 : 2], probePoint]
  const conductors = [
    { pin: "pin1", signal: "CTRL_3V3", colorName: "red", color: [0.82, 0.06, 0.04] as Point3 },
    { pin: "pin2", signal: boardConnector === "J_HOT_SENSOR" ? "HOT_SENSOR_DATA" : "COLD_SENSOR_DATA", colorName: "yellow", color: [0.95, 0.76, 0.05] as Point3 },
    { pin: "pin3", signal: "GND", colorName: "black", color: [0.03, 0.03, 0.035] as Point3 },
  ].map(conductor => {
    const point = connectorPoint(placement, sensorPinLocal[conductor.pin as keyof typeof sensorPinLocal])
    return { ...conductor, boardPoint: point, path: [point, [placement.pcbX + 4, point[1], 3], [placement.pcbX + 7, point[1], 8], join] as Point3[] }
  })
  // Union discards child shape colors. Colored native polygons keep all three
  // vendor wire colors in one cable part, with no invented electrical anchors.
  const jacketColor: Point3 = [0.05, 0.055, 0.06]
  const pieces = [{ path, radius: 1.5, color: jacketColor }, ...conductors.map(c => ({ path: c.path, radius: 0.35, color: c.color }))]
  const polygons = pieces.flatMap(piece => wirePolygons(piece.path.map(point => subtract(point, boardPoint)), piece.radius, piece.color))
  return { partName, boardConnector, boardPoint, path, probePoint, conductors, model: { type: "createGeom3", polygons } satisfies JscadOperation }
}

export const hotProbeCable = probeCable("J_HOT_SENSOR", "HOT_PROBE_CABLE", hotProbe.cableEndPoint)
export const coldProbeCable = probeCable("J_COLD_SENSOR", "COLD_PROBE_CABLE", coldProbe.cableEndPoint)
// Offline tessellation of Noctua's NF-A8 family public STEP: manufacturer
// external/mounting geometry, including pads. Noctua modifies internal details.
export const fan = { partName: "FAN_DEFAULT", position: [112, -92, 20] as Point3,
  cableEndPoint: [72, -68, 20] as Point3, bodyDimensionsMm: [81, 81, 27], mountingHoleSpacingMm: 71.5,
  model: { type: "createGeom3", polygons: fanMesh.meshes.flatMap(mesh => mesh.triangles.map(indices => ({
    vertices: indices.map(index => mesh.vertices[index]!) as Point3[], color: mesh.color as Point3,
  }))) } satisfies JscadOperation }

const fanBoardPoint = connectorPoint(connectorPlacements.J_FAN, [0, 0.98001455, 6.8])
const fanJoin: Point3 = [fanBoardPoint[0], fanBoardPoint[1], 22]
const fanColors = [
  { pin: "pin1", signal: "GND", colorName: "black", boardConnected: true, color: [0.03, 0.03, 0.035] as Point3 },
  { pin: "pin2", signal: "FAN_12V", colorName: "yellow", boardConnected: true, color: [0.95, 0.76, 0.05] as Point3 },
  { pin: "pin3", signal: "TACH_NC", colorName: "green", boardConnected: false, color: [0.04, 0.5, 0.12] as Point3 },
  { pin: "pin4", signal: "PWM_NC", colorName: "blue", boardConnected: false, color: [0.04, 0.18, 0.85] as Point3 },
]
const fanConductors = fanColors.map(conductor => {
  const boardPoint = connectorPoint(connectorPlacements.J_FAN, fanPinLocal[conductor.pin as keyof typeof fanPinLocal])
  return { ...conductor, boardPoint, path: [boardPoint, [boardPoint[0], boardPoint[1], 11.6], fanJoin] as Point3[] }
})
// Approximate slack for the nominal 200 mm factory cable, with no extension or
// LNA. The shown sleeve plus connector-exit fanout is about 200 mm; the plug's
// internal leads are separate. Noctua does not specify these bends/exit points.
const fanPath: Point3[] = [fanJoin, [67, -36, 28], [58, -70, 28],
  [42, -109, 22], [69, -105, 20], fan.cableEndPoint]
const plugColor: Point3 = [0.77, 0.74, 0.64]
function boxPolygons(center: Point3, size: Point3): JscadPolygon3[] {
  // These envelopes were authored for the original 90-degree header.
  const angle = (connectorPlacements.J_FAN.pcbRotation - 90) * Math.PI / 180
  const vertices = [[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]].map(v => {
    const [x, y, z] = v.map((n, i) => n * size[i]! / 2) as Point3
    return add(center, [x * Math.cos(angle) - y * Math.sin(angle), x * Math.sin(angle) + y * Math.cos(angle), z])
  })
  return [[0,3,2,1],[4,5,6,7],[0,4,7,3],[1,2,6,5],[0,1,5,4],[3,7,6,2]].map(face => ({ vertices: face.map(i => vertices[i]!), color: plugColor }))
}
const fanLocatorPoint = connectorPoint(connectorPlacements.J_FAN, fanLocatorLocal)
export const fanCable = { partName: "FAN_CABLE", boardConnector: "J_FAN", boardPoint: fanBoardPoint,
  locatorPoint: fanLocatorPoint, path: fanPath, fanPoint: fan.cableEndPoint, cableLengthMm: 200,
  conductors: fanConductors,
  model: { type: "createGeom3", polygons: [
    ...boxPolygons([0, 0, 0.55], [4.2, 10.2, 8.5]),
    ...boxPolygons([fanLocatorPoint[0] - fanBoardPoint[0], fanLocatorPoint[1] - fanBoardPoint[1], 0.55], [0.6, 7.62, 4]),
    ...wirePolygons(fanPath.map(p => subtract(p, fanBoardPoint)), 1.6, [0.05, 0.055, 0.06]),
    ...fanConductors.flatMap(c => wirePolygons(c.path.map(p => subtract(p, fanBoardPoint)), 0.35, c.color)),
  ] } satisfies JscadOperation }
export const assemblyConnections = [usbPdCable, usbProgramCable, tecPositiveLead, tecNegativeLead, hotProbeCable, coldProbeCable, fanCable]
