import { mkdir, readFile, writeFile } from "node:fs/promises"
import { resolve } from "node:path"
import { createHash } from "node:crypto"
import { convertCircuitJsonTo3D, convertSceneToGLTF } from "circuit-json-to-gltf"
import { renderGLTFToPNGFromGLB } from "poppygl"
import type { AnyCircuitElement } from "circuit-json"
import { assemblyConnections, assemblyParts } from "../src/assembly/models"
import { fanDuctTriangles } from "../src/assembly/thermal-stack"
import { assemblyWiringSvg } from "./helpers/assembly-wiring"

// Consume the actual build; do not duplicate board/component geometry here.
const sitePreview = process.argv[2] === "--site-preview"
const output = resolve(sitePreview ? "dist/assembly" : process.argv[2] ?? "dist/assembly")
await mkdir(output, { recursive: true })
const circuitSource = await readFile("dist/assembly/circuit.json", "utf8")
const circuit: AnyCircuitElement[] = JSON.parse(circuitSource)
const provenance = JSON.parse(await readFile("assets/assembly/provenance.json", "utf8"))
const board = circuit.find(e => e.type === "pcb_board")
if (!board || !circuit.some(e => e.type === "pcb_trace")) throw new Error("Build the routed assembly with bun run build:assembly")
if (circuit.some(e => e.type.endsWith("_error"))) throw new Error("Resolve circuit build errors before exporting the assembly")
provenance.pcb.circuitSha256 = createHash("sha256").update(circuitSource).digest("hex")
provenance.pcb.dimensionsMm = [board.width, board.height, board.thickness]
provenance.pcb.centerMm = board.center
const sources = new Map(circuit.filter(e => e.type === "source_component").map(e => [e.source_component_id, e]))
const cadBySource = new Map(circuit.filter(e => e.type === "cad_component").map(e => [e.source_component_id, e]))
const placements = circuit.filter(e => e.type === "pcb_component").filter(e => sources.has(e.source_component_id))
const dnpPads = placements.filter(e => e.do_not_place)
const dnpPcbIds = new Set(dnpPads.map(e => e.pcb_component_id))
const dnpSourceIds = new Set(dnpPads.map(e => e.source_component_id))
const fitted = placements.filter(e => !e.do_not_place)
provenance.pcb.copperTestPads = dnpPads.map(e => ({
  reference: sources.get(e.source_component_id)!.name, center: e.center, geometry: "Exposed PCB copper",
}))
const pcbParts = fitted.map(placement => {
  const source = sources.get(placement.source_component_id)!
  const cad = cadBySource.get(source.source_component_id)
  if (!source.supplier_part_numbers?.jlcpcb?.some(code => /^C\d+$/.test(code))) {
    throw new Error(`Missing JLCPCB code for ${source.name}`)
  }
  const geometry = cad?.model_obj_url ?? cad?.model_glb_url ?? cad?.model_stl_url ?? cad?.model_step_url
    ?? (cad?.model_jscad ? "Drawing-derived JSCAD geometry" : undefined)
  if (!geometry) throw new Error(`Missing PCB model for ${source.name}`)
  return { reference: source.name, manufacturerPartNumber: source.manufacturer_part_number,
    jlcpcb: source.supplier_part_numbers.jlcpcb, geometry, stepReference: cad?.model_step_url }
})
provenance.pcb.components = pcbParts
provenance.nativeAssembly = {
  ...provenance.nativeAssembly,
  source: "src/assembly/general-pd-assembly.tsx",
  components: [...sources.values()].filter(e => e.ftype === "subassembly").map(source => {
    const cad = cadBySource.get(source.source_component_id)
    if (!cad?.model_jscad || cad.pcb_component_id) throw new Error(`Missing native accessory geometry: ${source.name}`)
    return { reference: source.name, description: source.display_name, positionMm: cad.position }
  }),
  connections: assemblyConnections.map(({ partName, boardConnector, boardPoint, path, ...part }) => ({
    reference: partName, boardConnector, pin: "pin" in part ? part.pin : undefined, boardPointMm: boardPoint, pathMm: path,
    conductors: "conductors" in part ? part.conductors : undefined,
    probePointMm: "probePoint" in part ? part.probePoint : undefined,
    fanPointMm: "fanPoint" in part ? part.fanPoint : undefined,
    locatorPointMm: "locatorPoint" in part ? part.locatorPoint : undefined,
  })),
  mapping: "Board-side XY coordinates use the connector footprints. Mating heights, cable bends and plug envelopes are illustrative.",
}
if (!pcbParts.length || provenance.nativeAssembly.components.length !== assemblyParts.length)
  throw new Error("Expected a populated board and all mechanical assembly parts")
for (const reference of ["TP_BOOTSEL", "TP_SWCLK", "TP_RUN", "TP_SWDIO", "TP_OUT"])
  if (!dnpPads.some(pad => sources.get(pad.source_component_id)?.name === reference)) throw new Error(`Missing required copper feature ${reference}`)
// DNP copper test pads remain in the PCB texture, with no artificial component bodies.
const renderCircuit = circuit.filter(e => e.type !== "cad_component" ||
  !(dnpPcbIds.has(e.pcb_component_id ?? "") || dnpSourceIds.has(e.source_component_id ?? "")))
const scene = await convertCircuitJsonTo3D(renderCircuit, { renderBoardTextures: true, textureResolution: 2048 })
const renderedModels = new Set(scene.boxes.filter(box => box.mesh?.triangles.length).map(box => box.label))
const missingModels = [...pcbParts.map(part => part.reference), ...assemblyParts.map(part => part.partName)]
  .filter(reference => !renderedModels.has(reference))
if (missingModels.length) throw new Error(`Models did not render: ${missingModels.join(", ")}`)

const glb = await convertSceneToGLTF(scene, { binary: true, embedImages: true, forceIndices: true }) as ArrayBuffer
// The exporter bakes rotations into meshes and uses translated, flat nodes.
// Fit actual GLB bounds, including accessories beyond the PCB, in an elevated view.
const data = Buffer.from(glb), model = JSON.parse(data.subarray(20, 20 + data.readUInt32LE(12)).toString())
const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity]
for (const node of model.nodes) for (const primitive of model.meshes[node.mesh]?.primitives ?? []) {
  const bounds = model.accessors[primitive.attributes.POSITION], offset = node.translation ?? [0, 0, 0]
  for (let i = 0; i < 3; i++) { min[i] = Math.min(min[i]!, bounds.min[i] + offset[i]); max[i] = Math.max(max[i]!, bounds.max[i] + offset[i]) }
}
const center = min.map((v, i) => (v + max[i]!) / 2)
const normalize = (v: number[]) => v.map(n => n / Math.hypot(...v))
const direction = normalize([-0.35, 0.75, 0.7]), right = normalize([direction[2]!, 0, -direction[0]!])
const up = [-direction[1]! * right[2]!, direction[2]! * right[0]! - direction[0]! * right[2]!, direction[1]! * right[0]!]
const dot = (a: number[], b: number[]) => a.reduce((sum, v, i) => sum + v * b[i]!, 0)
const tanY = Math.tan(43 * Math.PI / 360), tanX = tanY * 1600 / 900
let distance = 0
for (const x of [min[0]!, max[0]!]) for (const y of [min[1]!, max[1]!]) for (const z of [min[2]!, max[2]!]) {
  const point = [x, y, z].map((v, i) => v - center[i]!)
  distance = Math.max(distance, dot(point, direction) + Math.max(Math.abs(dot(point, right)) / tanX, Math.abs(dot(point, up)) / tanY))
}
const camPos = center.map((v, i) => v + direction[i]! * distance * 1.12) as [number, number, number]
const png = await renderGLTFToPNGFromGLB(new Uint8Array(glb), { width: 1600, height: 900, supersampling: 2, realistic: true,
  camPos, lookAt: center as [number, number, number], fov: 43, backgroundColor: "#f3f6fa" })
if (sitePreview) {
  // The registry loads 3d.glb for the interactive view and 3d.png for the thumbnail.
  await Promise.all([
    writeFile(resolve(output, "3d.glb"), data),
    writeFile(resolve(output, "3d.png"), png),
    writeFile(resolve(output, "circuit.json"), JSON.stringify(circuit)),
  ])
  console.log(`Assembly preview exported to ${output}`)
} else {
  await writeFile(resolve(output, "assembly.glb"), data)
  await writeFile(resolve(output, "provenance.json"), JSON.stringify(provenance, null, 2) + "\n")
  const stl = Buffer.alloc(84 + fanDuctTriangles.length * 50)
  stl.writeUInt32LE(fanDuctTriangles.length, 80)
  for (const [index, triangle] of fanDuctTriangles.entries()) {
    // Rotate X depth to print Z, with the fan flange flat on the print bed.
    const vertices = triangle.map(([x, y, z]) => [-z, y, x])
    const [a, b, c] = vertices
    const [u, v, w] = b!.map((value, axis) => value - a![axis]!)
    const [p, q, r] = c!.map((value, axis) => value - a![axis]!)
    const normal = [v! * r! - w! * q!, w! * p! - u! * r!, u! * q! - v! * p!]
    const magnitude = Math.hypot(...normal)
    if (!magnitude) throw new Error("The fan duct mesh contains a degenerate triangle")
    const values = [...normal.map(value => value / magnitude), ...vertices.flat()]
    values.forEach((value, i) => stl.writeFloatLE(value, 84 + index * 50 + 4 * i))
  }
  await writeFile(resolve(output, "fan-duct.stl"), stl)
  const wiring = assemblyWiringSvg()
  await writeFile(resolve(output, "wiring.svg"), wiring)
  await writeFile(resolve(output, "assembly.png"), png)
  const viewerSource = await Bun.build({ entrypoints: ["scripts/assembly-viewer.js"], target: "browser", minify: true })
  if (!viewerSource.success) throw new Error("Could not bundle assembly viewer")
  const js = await viewerSource.outputs[0].text()
  const html = await readFile("assets/assembly/viewer.html", "utf8")
  await writeFile(resolve(output, "assembly.html"), html.replace("__GLB__", data.toString("base64"))
    .replace("__PREVIEW__", Buffer.from(png).toString("base64")).replace("__WIRING__", () => wiring).replace("__VIEWER__", () => js))
  console.log(`Assembly exported to ${output}`)
}
