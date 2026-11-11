import { mkdir, readFile, writeFile } from "node:fs/promises"
import { resolve } from "node:path"
import { createHash } from "node:crypto"
import { convertCircuitJsonTo3D, convertSceneToGLTF } from "circuit-json-to-gltf"
import { renderGLTFToPNGFromGLB } from "poppygl"
import { assemblyConnections } from "../src/assembly/models"

// Consume the actual build; do not duplicate board/component geometry here.
const output = resolve(process.argv[2] ?? "dist/assembly")
await mkdir(output, { recursive: true })
const circuitSource = await readFile("dist/index/circuit.json", "utf8")
const circuit = JSON.parse(circuitSource)
const provenance = JSON.parse(await readFile("assets/assembly/provenance.json", "utf8"))
const board = circuit.find((e: any) => e.type === "pcb_board")
if (!board) throw new Error("Build the PCB first: bun run build")
if (circuit.some((e: any) => e.type === "pcb_trace" || e.type === "pcb_via")) throw new Error("Assembly expects an unrouted PCB")
provenance.pcb.circuitSha256 = createHash("sha256").update(circuitSource).digest("hex")
provenance.pcb.dimensionsMm = [board.width, board.height, board.thickness]
provenance.pcb.centerMm = board.center
const dnpPads = circuit.filter((e: any) => e.type === "pcb_component" && e.do_not_place)
const dnpPcbIds = new Set(dnpPads.map((e: any) => e.pcb_component_id)), dnpSourceIds = new Set(dnpPads.map((e: any) => e.source_component_id))
const purchasedIds = new Set(circuit.filter((e: any) => e.type === "pcb_component" && !e.do_not_place).map((e: any) => e.source_component_id))
provenance.pcb.copperTestPads = dnpPads.map((e: any) => ({ reference: circuit.find((s: any) => s.type === "source_component" && s.source_component_id === e.source_component_id)?.name, center: e.center, geometry: "Actual exposed PCB copper; no component body" }))
provenance.pcb.components = circuit.filter((e: any) => e.type === "source_component" && purchasedIds.has(e.source_component_id)).map((e: any) => {
  const cad = circuit.find((c: any) => c.type === "cad_component" && c.source_component_id === e.source_component_id)
  return { reference: e.name, manufacturerPartNumber: e.manufacturer_part_number, jlcpcb: e.supplier_part_numbers?.jlcpcb, geometry: cad?.model_obj_url ?? cad?.model_glb_url ?? cad?.model_stl_url ?? (cad?.model_jscad ? "Component-wrapper JSCAD geometry; see source for dimensional provenance" : "Generic component envelope"), stepReference: cad?.model_step_url }
})
provenance.nativeAssembly = {
  ...provenance.nativeAssembly,
  source: "src/assembly/general-pd-assembly.tsx",
  api: "https://docs.tscircuit.com/elements/assembly-part",
  geometry: "Native assembly.device + eleven literal CAD-only assembly.part models. They add no PCB components, electrical ports or JLCPCB BOM entries. The fan uses official NF-A8 family CAD; other peripheral bodies/cables use documented envelopes. assembly.cable currently cannot attach to generic parts or loose leads; these external connection paths are native geometry.",
  components: circuit.filter((e: any) => e.type === "source_component" && e.ftype === "subassembly").map((e: any) => {
    const cad = circuit.find((c: any) => c.type === "cad_component" && c.source_component_id === e.source_component_id)
    if (!cad?.model_jscad || cad.pcb_component_id) throw new Error(`Missing native accessory geometry: ${e.name}`)
    return { reference: e.name, description: e.display_name, positionMm: cad.position, geometry: "Native JSCAD; see peripheral dimensional provenance" }
  }),
  connections: assemblyConnections.map(({ partName, boardConnector, boardPoint, path, ...part }) => ({
    reference: partName, boardConnector, pin: "pin" in part ? part.pin : undefined, boardPointMm: boardPoint, pathMm: path,
    conductors: "conductors" in part ? part.conductors : undefined,
    probePointMm: "probePoint" in part ? part.probePoint : undefined,
    fanPointMm: "fanPoint" in part ? part.fanPoint : undefined,
    locatorPointMm: "locatorPoint" in part ? part.locatorPoint : undefined,
  })),
  mapping: "Connector attachment points derive from shared connector placements and exact supplier-footprint XY insertion/pin offsets. Fan contacts/locator match the actual Molex47053-1000 footprint. USB Z=2.5 mm, TEC Z=6 mm, probe Z=3 mm and fan mating Z=6.8 mm are illustrative; cable bends, plug envelopes and fan exit location are not fit-qualified.",
}
if (!purchasedIds.size || provenance.pcb.components.length !== purchasedIds.size || provenance.pcb.copperTestPads.some((pad: any) => !pad.reference) || provenance.nativeAssembly.components.length !== 11)
  throw new Error("Expected a complete PCB source inventory and eleven native accessories")
for (const reference of ["TP_BOOTSEL", "TP_SWCLK", "TP_RUN", "TP_SWDIO", "TP_OUT"])
  if (!provenance.pcb.copperTestPads.some((pad: any) => pad.reference === reference)) throw new Error(`Missing required copper feature ${reference}`)
for (const part of provenance.pcb.components)
  if (!part.jlcpcb?.some((code: string) => /^C\d+$/.test(code))) throw new Error(`Missing JLCPCB code for ${part.reference}`)
// DNP copper test pads remain in the PCB texture, with no artificial component bodies.
const renderCircuit = circuit.filter((e: any) => e.type !== "cad_component" || (!dnpPcbIds.has(e.pcb_component_id) && !dnpSourceIds.has(e.source_component_id)))
const scene = await convertCircuitJsonTo3D(renderCircuit, { renderBoardTextures: true, textureResolution: 2048 })

const glb = await convertSceneToGLTF(scene, { binary: true, embedImages: true, forceIndices: true }) as ArrayBuffer
await writeFile(resolve(output, "assembly.glb"), new Uint8Array(glb))
await writeFile(resolve(output, "provenance.json"), JSON.stringify(provenance, null, 2) + "\n")
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
await writeFile(resolve(output, "assembly.png"), png)
const viewerSource = await Bun.build({ entrypoints: ["scripts/assembly-viewer.js"], target: "browser", minify: true })
if (!viewerSource.success) throw new Error("Could not bundle assembly viewer")
const js = await viewerSource.outputs[0].text()
const html = await readFile("assets/assembly/viewer.html", "utf8")
await writeFile(resolve(output, "assembly.html"), html.replace("__GLB__", Buffer.from(glb).toString("base64")).replace("__PREVIEW__", Buffer.from(png).toString("base64")).replace("__VIEWER__", () => js))
console.log(`Assembly exported to ${output}`)
