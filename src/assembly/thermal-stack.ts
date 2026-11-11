import earcut from "earcut"
import type { JscadOperation } from "jscad-planner"
import type { Point3 } from "./connector-placement"

export const moduleCenter: Point3 = [132, 24, 2]
const [x, y] = moduleCenter
const aluminium: Point3 = [0.61, 0.65, 0.68]
const ductColor: Point3 = [0.23, 0.29, 0.34]

const cuboid = (size: Point3, center: Point3): JscadOperation =>
  ({ type: "translate", vector: center, shape: { type: "cuboid", size } })
const cylinder = (radius: number, height: number, center: Point3): JscadOperation =>
  ({ type: "cylinder", radius, height, center, resolution: 48 })
const alongX = (shape: JscadOperation, center: Point3): JscadOperation =>
  ({ type: "translate", vector: center, shape: { type: "rotateY", angle: Math.PI / 2, shape } })
const alongY = (shape: JscadOperation, center: Point3): JscadOperation =>
  ({ type: "translate", vector: center, shape: { type: "rotateX", angle: Math.PI / 2, shape } })
const union = (shapes: JscadOperation[]): JscadOperation => ({ type: "union", shapes })
const subtract = (base: JscadOperation, ...cuts: JscadOperation[]): JscadOperation =>
  ({ type: "subtract", shapes: [base, ...cuts] })
const colored = (shape: JscadOperation, color: Point3): JscadOperation => ({ type: "colorize", shape, color })

// Fischer SK 595 100 AL. The 9 mm base and outside dimensions follow the
// drawing. Fins are simplified for visualization.
const boltX = [-27, 27]
const probeBoreDiameter = 6.2
const probeBoreDepth = 36
const probeLength = 35
const hotProbeOffsetY = 12
export const hotProbeEntry: Point3 = [x + 60, y + hotProbeOffsetY, 8.5]
export const coldProbeEntry: Point3 = [x, y - 38, -5]
export const thermalProbeLength = probeLength
export const hotSideHeatsink = {
  partName: "HOT_SIDE_HEATSINK",
  displayName: "HOT · Fischer SK 595 100 AL · fin detail simplified",
  position: [x, y, 4] as Point3,
  model: colored(union([
    subtract(cuboid([120, 100, 9], [0, 0, 4.5]),
      ...boltX.map(offset => cylinder(1.65, 8.1, [offset, 0, 3.95])),
      alongX(cylinder(probeBoreDiameter / 2, probeBoreDepth + 0.1, [0, 0, 0]),
        [60 - probeBoreDepth / 2 + 0.05, hotProbeOffsetY, 4.5])),
    ...Array.from({ length: 15 }, (_, i) => cuboid([1.6, 100, 51.2], [-56 + i * 8, 0, 34.4])),
  ]), aluminium),
}

export const coldPlate = {
  partName: "COLD_PLATE",
  displayName: "COLD · 6061-T6 cold plate · 80 × 76 × 10 mm",
  position: [x, y, 0] as Point3,
  model: colored(subtract(cuboid([80, 76, 10], [0, 0, -5]),
    ...boltX.map(offset => cylinder(2.25, 11, [offset, 0, -5])),
    alongY(cylinder(probeBoreDiameter / 2, probeBoreDepth + 0.1, [0, 0, 0]),
      [0, -38 + probeBoreDepth / 2 - 0.05, -5])), [0.45, 0.58, 0.67]),
}

export const tecClamp = {
  partName: "TEC_CLAMP",
  displayName: "TEC clamp · 2 × M4 × 20 A2 screws with flat washers",
  position: [x, y, 0] as Point3,
  model: colored(union(boltX.flatMap(offset => [
    cylinder(2, 20, [offset, 0, -0.8]),
    cylinder(4.5, 0.8, [offset, 0, -10.4]),
    cylinder(3.5, 4, [offset, 0, -12.8]),
  ])), [0.44, 0.46, 0.5]),
}

// Use shared boundary rings for the visual and print meshes. The flange has
// a 76 mm opening and four M4 clearance holes on the 71.5 mm fan pattern.
function makeFanDuct() {
  const rectangle = (depth: number, width: number, height: number): Point3[] => [
    [depth, -width / 2, -height / 2], [depth, width / 2, -height / 2],
    [depth, width / 2, height / 2], [depth, -width / 2, height / 2],
  ]
  const circle = (depth: number, radius: number, u = 0, v = 0): Point3[] => Array.from({ length: 48 }, (_, i) => {
    const angle = i * Math.PI / 24
    return [depth, u + radius * Math.cos(angle), v + radius * Math.sin(angle)]
  })
  const holeRings = (depth: number) => [circle(depth, 38), ...[-35.75, 35.75].flatMap(u =>
    [-35.75, 35.75].map(v => circle(depth, 2.2, u, v)))]
  const front = rectangle(0, 86, 86), rear = rectangle(4, 86, 86)
  const throat = rectangle(4, 81, 81)
  const collar = rectangle(20, 125.6, 65.6), outlet = rectangle(26, 125.6, 65.6)
  const innerCollar = rectangle(20, 120.8, 60.8), innerOutlet = rectangle(26, 120.8, 60.8)
  const frontHoles = holeRings(0), rearHoles = holeRings(4)
  const triangles: Point3[][] = []
  const join = (a: Point3[], b: Point3[]) => {
    for (let i = 0; i < a.length; i++) {
      const j = (i + 1) % a.length
      triangles.push([a[i]!, a[j]!, b[j]!], [a[i]!, b[j]!, b[i]!])
    }
  }
  const face = (outer: Point3[], holes: Point3[][], normalX: number) => {
    const points = [outer, ...holes].flat()
    const holeIndices = holes.map((_, i) => outer.length + holes.slice(0, i).reduce((count, hole) => count + hole.length, 0))
    const indices = earcut(points.flatMap(([, u, v]) => [u, v]), holeIndices)
    for (let i = 0; i < indices.length; i += 3) {
      const a = points[indices[i]!]!, b = points[indices[i + 1]!]!, c = points[indices[i + 2]!]!
      const cross = (b[1] - a[1]) * (c[2] - a[2]) - (b[2] - a[2]) * (c[1] - a[1])
      triangles.push(cross * normalX > 0 ? [a, b, c] : [a, c, b])
    }
  }
  face(front, frontHoles, -1)
  face(throat, rearHoles, 1)
  frontHoles.forEach((hole, i) => join(rearHoles[i]!, hole))
  join(front, rear)
  join(rear, collar)
  join(collar, outlet)
  join(outlet, innerOutlet)
  join(innerOutlet, innerCollar)
  join(innerCollar, throat)
  return triangles
}

export const fanDuctTriangles = makeFanDuct()
export const fanDuctModel: JscadOperation = { type: "createGeom3",
  polygons: fanDuctTriangles.map(vertices => ({ vertices, color: ductColor })) }

export const ductPosition: Point3 = [x, y + 76, 34]
export const fanPosition: Point3 = [x, ductPosition[1] + 13.5, ductPosition[2]]
export const fanDuct = {
  partName: "FAN_DUCT",
  displayName: "Fan duct · 80 mm flange to SK 595 fin inlet",
  position: ductPosition,
  model: { type: "rotateZ", angle: -Math.PI / 2, shape: fanDuctModel } satisfies JscadOperation,
}
