import { createHash } from "node:crypto"
import { closeSync, openSync } from "node:fs"
import { cp, mkdir, mkdtemp, readdir, readFile, rename, stat } from "node:fs/promises"
import { relative, resolve } from "node:path"
import type { AnyCircuitElement } from "circuit-json"
import { bestProduct, describeBestBoard } from "../designs/best"
import { connectivity, placementIssues } from "../designs/audit"

const root = resolve(import.meta.dir, "..")
const dist = resolve(root, "dist")
await mkdir(dist, { recursive: true })
const output = await mkdtemp(resolve(dist, "best-version-"))
await mkdir(resolve(output, "checks"))
const checks: Array<{ name: string; command: string[]; exitCode: number; log: string }> = []
async function run(name: string, command: string[], cwd = root) {
  console.log(`${name}...`)
  const log = `checks/${name}.log`
  const fd = openSync(resolve(output, log), "w")
  let exitCode: number
  try { exitCode = await Bun.spawn(command, { cwd, stdout: fd, stderr: fd }).exited }
  finally { closeSync(fd) }
  checks.push({ name, command, exitCode, log })
  if (exitCode !== 0) throw new Error(`${name} failed (${exitCode}); see ${resolve(output, log)}`)
  return readFile(resolve(output, log), "utf8")
}
const copy = async (from: string, to: string) => {
  const destination = resolve(output, to)
  await mkdir(resolve(destination, ".."), { recursive: true })
  await cp(resolve(root, from), destination, { recursive: true })
}
const digest = (data: Uint8Array) => createHash("sha256").update(data).digest("hex")
async function filesUnder(dir: string): Promise<string[]> {
  const result: string[] = []
  for (const item of await readdir(dir, { withFileTypes: true })) {
    if (item.name.startsWith(".") || item.name === "__pycache__" || item.name.endsWith(".pyc")) continue
    const path = resolve(dir, item.name)
    if (item.isSymbolicLink()) throw new Error(`Do not package an unreviewed symlink: ${path}`)
    if (item.isDirectory()) result.push(...await filesUnder(path))
    else if (item.isFile()) result.push(path)
  }
  return result.sort()
}

async function captureSources() {
  const sourceFiles = ["README.md", "LICENSE", "REFERENCE.md", "VALIDATION.md", "package.json", "bun.lock", "tsconfig.json",
    "tscircuit.config.json", "index.circuit.tsx", "assembly.tsx", "firmware/README.md", "firmware/CMakeLists.txt", "firmware/requirements.txt"]
  for (const dir of ["src", "imports", "scripts", "designs", "tests", "docs", "assets", "firmware/src", "firmware/include", "firmware/host", "firmware/test"])
    sourceFiles.push(...(await filesUnder(resolve(root, dir))).map(path => relative(root, path)))
  const inputs = [...new Set(sourceFiles)].sort()
  const hashes = Object.fromEntries(await Promise.all(inputs.map(async file => [file, digest(await readFile(resolve(root, file)))])))
  return { inputs, hashes }
}
const sourceBefore = await captureSources()
const product = bestProduct()
await run("board-build", ["bunx", "--no-install", "tsci", "build", "designs/best.circuit.tsx", "--disable-parts-engine", "--pcb-png", "--schematic-png", "--svgs"])
const boardPath = "dist/designs/best/circuit.json"
const board = JSON.parse(await readFile(resolve(root, boardPath), "utf8")) as AnyCircuitElement[]
const summary = describeBestBoard(board)
if (placementIssues(board).length) throw new Error(`Board placement failed: ${placementIssues(board).join("; ")}`)
await copy("dist/designs/best", "pcb")
await run("schematics", ["bun", "run", "scripts/export-schematics.ts", boardPath, resolve(output, "schematics")])
const netlist = await run("netlist", ["bunx", "--no-install", "tsci", "check", "netlist", "designs/best.circuit.tsx"])
if (!/Errors: 0/.test(netlist) || !/Warnings: 0/.test(netlist)) throw new Error("Netlist did not report a clean result")
const shorts = await run("copper-shorts", ["bunx", "--no-install", "tsci", "check", "shorts", boardPath])
if (!shorts.includes("No shorts detected")) throw new Error("Copper check did not demonstrate a shorts-free board")
await run("cam-export", ["python3", "scripts/export-fabrication-review.py", "--circuit", boardPath,
  "--output", resolve(output, "fabrication/standard-cam-review.zip")])

await run("firmware-configure", ["firmware/.venv/bin/cmake", "-S", "firmware", "-B", "firmware/build",
  `-DPICO_SDK_PATH=${process.env.PICO_SDK_PATH ?? "/workspace/.cloud-setup/pico-sdk"}`])
await run("firmware-build", ["firmware/.venv/bin/cmake", "--build", "firmware/build", "-j4"])
await run("firmware-uf2-check", ["firmware/.venv/bin/python", "firmware/test/check_uf2.py", "firmware/build/general_pd.uf2"])
for (const ext of ["uf2", "bin", "elf"]) await copy(`firmware/build/general_pd.${ext}`, `firmware/general_pd.${ext}`)
for (const file of ["control.py", "test_control.py", "requirements.txt"]) await copy(`firmware/host/${file}`, `firmware/host/${file}`)
await copy("firmware/README.md", "firmware/README.md")

await run("assembly-build", ["bunx", "--no-install", "tsci", "build", "assembly.tsx", "--disable-parts-engine"])
const assembly = JSON.parse(await readFile(resolve(root, "dist/assembly/circuit.json"), "utf8")) as AnyCircuitElement[]
const names = new Set(board.filter(e => e.type === "source_component").map(p => p.name))
const baseGraph = connectivity([{ id: "best", json: board }], [], names)
const assemblyGraph = connectivity([{ id: "assembly", json: assembly }], [], names)
if (baseGraph.signature !== assemblyGraph.signature) throw new Error("Assembly and PCB electrical graphs differ")
const geometry = (json: AnyCircuitElement[]) => {
  const source = new Map(json.filter(e => e.type === "source_component").map(p => [p.source_component_id, p.name]))
  const clean = (value: any): any => typeof value === "number" ? Math.round(value * 1e6) / 1e6
    : Array.isArray(value) ? value.map(clean) : value && typeof value === "object"
      ? Object.fromEntries(Object.entries(value).filter(([k]) => !k.endsWith("_id") && !k.endsWith("_ids")).map(([k, v]) => [k, clean(v)])) : value
  return JSON.stringify(json.filter(e => e.type.startsWith("pcb_")).map(e => {
    const element = e as AnyCircuitElement & { source_component_id?: string }
    return JSON.stringify({ owner: element.source_component_id ? source.get(element.source_component_id) : undefined, ...clean(e) })
  }).sort())
}
if (geometry(board) !== geometry(assembly)) throw new Error("Assembly and PCB physical geometry differ")
await run("assembly-export", ["bun", "run", "scripts/build-assembly.ts", resolve(output, "assembly")])
const viewer = resolve(output, "assembly/assembly.html")
await Bun.write(viewer, (await readFile(viewer, "utf8")).replace('href="../../docs/assembly.md"', 'href="../docs/assembly.md"'))
await copy("dist/assembly/circuit.json", "assembly/circuit.json")
await copy("docs", "docs")
await copy("LICENSE", "LICENSE")
await copy("src/assembly/assets/Noctua-CAD-README.txt", "assembly/Noctua-CAD-README.txt")

const components = board.filter(e => e.type === "source_component" && e.ftype !== "simple_test_point")
const placements = board.filter(e => e.type === "pcb_component")
const bom = components.map(part => {
  const placed = placements.filter(p => p.source_component_id === part.source_component_id)
  if (placed.length !== 1) throw new Error(`Expected one PCB placement for ${part.name}`)
  const p = placed[0]!
  return { designator: part.name, mpn: part.manufacturer_part_number!, jlcpcb: part.supplier_part_numbers!.jlcpcb!,
    xMm: p.center.x, yMm: p.center.y, rotationDeg: p.rotation, side: p.layer, unitPrice: null }
}).sort((a, b) => a.designator.localeCompare(b.designator))
await Bun.write(resolve(output, "bom.json"), JSON.stringify(bom, null, 2) + "\n")
const csv = (value: unknown) => `"${String(value).replace(/"/g, '""')}"`
await Bun.write(resolve(output, "placement-review.csv"), [
  ["Designator", "MPN", "JLCPCB", "X_mm", "Y_mm", "Rotation_deg", "Side"].map(csv).join(","),
  ...bom.map(p => [p.designator, p.mpn, p.jlcpcb.join(";"), p.xMm, p.yMm, p.rotationDeg, p.side].map(csv).join(",")),
].join("\n") + "\n")

const sourceAfter = await captureSources()
if (JSON.stringify(sourceBefore) !== JSON.stringify(sourceAfter)) throw new Error("Source changed during generation; build a consistent snapshot again")
const { inputs, hashes: sourceHashes } = sourceAfter
await Bun.write(resolve(output, "source-files.json"), JSON.stringify(inputs, null, 2))
await run("source-archive", ["python3", "-c", `import json,sys,zipfile,pathlib
root=pathlib.Path(sys.argv[1]); out=pathlib.Path(sys.argv[2])
with zipfile.ZipFile(out/'source-snapshot.zip','w',zipfile.ZIP_DEFLATED) as z:
 for name in json.loads((out/'source-files.json').read_text()): z.write(root/name,name)
`, root, output])

const report = { product, board: summary, sourceHashes, checks, assemblyMatchesBoard: true,
  originalPinsCompared: baseGraph.pinCount, supplierStockVerified: false, actualCost: null,
  hardwareQualified: false, manufacturingReady: false,
  sourceFingerprint: digest(Buffer.from(JSON.stringify(sourceHashes))) }
await Bun.write(resolve(output, "build-report.json"), JSON.stringify(report, null, 2) + "\n")
await Bun.write(resolve(output, "README.md"), `# Recommended version — integrated Standard\n\nEngineering review package, not a production release.\n\n` +
  `72.5 × 59 mm, four layers, 134 purchased placements, fully routed. RP2040, programmable CC/CV, separate PROGRAM USB, 12 V fan supply and two powered probe ports.\n\n` +
  `Start with assembly/assembly.html for the offline 3D/exploded viewer, pcb/pcb.png and schematics/all-sheets.svg. Source is in source-snapshot.zip; firmware/general_pd.uf2 is the checked RP2040 image.\n\n` +
  `The PCB/assembly electrical graph and physical geometry match. Logs and hashes are in checks/, build-report.json and SHA256SUMS.\n\n` +
  `fabrication/standard-cam-review.zip is for CAM review only. Follow docs/pcb-fabrication.md for the four-layer stackup, 2 oz outer copper and 13 selectively filled/capped vias. Confirm manufacturer artwork and PCBA rotation/origin before ordering. placement-review.csv uses circuit coordinates and is not a supplier-approved centroid file.\n\n` +
  `Provisional target: USD ${product.targetSellPrice.join("–")} per assembled PCB at ${product.planningQuantity} units, excluding accessories, PSU and tax. Actual cost and stock are unquoted/unverified.\n\n` +
  `The 72 W TEC ceiling is a setting, not measured performance. No thermostat or polarity reversal is implemented. Complete power, thermal, USB, fault/disconnect and mechanical bench qualification before manufacture or sale. See docs/assembly.md and firmware/README.md for wiring and programming.\n`)
const artifacts = await filesUnder(output)
await Bun.write(resolve(output, "SHA256SUMS"), (await Promise.all(artifacts.map(async file =>
  `${digest(await readFile(file))}  ${relative(output, file)}`))).join("\n") + "\n")
const archive = resolve(dist, "peltier-best-standard-review.zip")
console.log("package-archive...")
const zipExitCode = await Bun.spawn(["python3", "-c", `import pathlib,sys,zipfile,os
root=pathlib.Path(sys.argv[1]); target=pathlib.Path(sys.argv[2]); temp=target.with_suffix('.zip.partial')
with zipfile.ZipFile(temp,'w',zipfile.ZIP_DEFLATED) as z:
 for p in sorted(root.rglob('*')):
  if p.is_file(): z.write(p,pathlib.Path('peltier-best-standard-review')/p.relative_to(root))
with zipfile.ZipFile(temp) as z:
 bad=z.testzip()
 if bad: raise RuntimeError('Corrupt ZIP member: '+bad)
os.replace(temp,target)
`, output, archive], { cwd: root, stdout: "inherit", stderr: "inherit" }).exited
if (zipExitCode !== 0) throw new Error(`Archive validation failed (${zipExitCode})`)
console.log(`Recommended version: ${archive} (${(await stat(archive)).size} bytes)\nReview folder: ${output}`)
