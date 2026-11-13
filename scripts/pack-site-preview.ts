import { createHash } from "node:crypto"
import { mkdir, readFile, writeFile } from "node:fs/promises"
import { brotliCompressSync, brotliDecompressSync, constants } from "node:zlib"
import builds from "../assets/assembly/registry-builds.json"
import { chunkPreview, joinPreview, validatePreviewManifest, type PreviewArchiveManifest } from "./preview-archive"

const archivePath = "assets/assembly/site-preview-manifest.json"
const archiveDirectory = "assets/assembly"
const outputs = [
  "index.html", "standalone.min.js", "index.js", "index.cjs", "index.d.ts",
  ...builds.flatMap(build => ["circuit.json", "3d.glb", "3d.png", "pcb.svg", "pcb.png", "schematic.svg", "schematic.png"]
    .map(file => `${build.outputDir}/${file}`)),
]

// Refuse to deploy a preview built from a different board or assembly.
async function sourceFingerprint() {
  const glob = new Bun.Glob("**/*")
  const paths = [
    "assembly.tsx", "index.circuit.tsx", "package.json", "tscircuit.config.json", "tsconfig.json",
    "scripts/build-assembly.ts", "scripts/pack-site-preview.ts", "scripts/preview-archive.ts", "assets/assembly/provenance.json", "assets/assembly/registry-builds.json",
    ...["src", "imports", "designs"].flatMap(dir =>
      [...glob.scanSync({ cwd: dir, onlyFiles: true })].map(path => `${dir}/${path}`)),
  ].sort()
  const hash = createHash("sha256")
  for (const path of paths) hash.update(path).update("\0").update(await readFile(path)).update("\0")
  return hash.digest("hex")
}

type PreviewHeader = { fingerprint: string; paths: string[]; sizes: number[] }
const fingerprint = await sourceFingerprint()
switch (process.argv[2]) {
  case "pack": {
    const htmlPath = "dist/index.html"
    const html = await readFile(htmlPath, "utf8")
    // Canvas works on machines without a WebGPU adapter. Preserve a user's
    // existing choice and keep the browser bundle local, avoiding CDN size limits.
    const preference = `<script>try { if (localStorage.getItem("pcb_viewer_rendering_engine") === null) localStorage.setItem("pcb_viewer_rendering_engine", JSON.stringify("canvas")); } catch (_) {}</script>\n`
    if (!html.includes('src="./standalone.min.js"')) throw new Error("Build the static site with its local browser bundle")
    if (!html.includes('localStorage.getItem("pcb_viewer_rendering_engine")'))
      await writeFile(htmlPath, html.replace('<script type="module"', preference + '<script type="module"'))
    const files = await Promise.all(outputs.map(path => readFile(`dist/${path}`)))
    for (const build of builds) {
      const circuit = JSON.parse(await readFile(`dist/${build.outputDir}/circuit.json`, "utf8")) as Array<{ type: string }>
      if (circuit.filter(e => e.type === "pcb_board").length !== 1 || circuit.some(e => e.type.endsWith("_error")))
        throw new Error(`Invalid compiled registry board: ${build.label}`)
      if (build.routingStatus === "unrouted" && circuit.some(e => ["pcb_trace", "pcb_via", "pcb_copper_pour"].includes(e.type)))
        throw new Error(`Draft build contains unexpected saved copper: ${build.label}`)
    }
    const header: PreviewHeader = { fingerprint, paths: outputs, sizes: files.map(file => file.length) }
    const payload = Buffer.concat([Buffer.from(JSON.stringify(header) + "\n"), ...files])
    const archive = chunkPreview(brotliCompressSync(payload, {
      params: { [constants.BROTLI_PARAM_QUALITY]: 6 },
    }))
    await Promise.all(archive.manifest.parts.map((part, i) => writeFile(`${archiveDirectory}/${part.file}`, archive.chunks[i]!)))
    await writeFile(archivePath, JSON.stringify(archive.manifest, null, 2) + "\n")
    console.log(`Packed the validated preview into ${archivePath}`)
    break
  }
  case "unpack": {
    const manifest = JSON.parse(await readFile(archivePath, "utf8")) as PreviewArchiveManifest
    validatePreviewManifest(manifest)
    const chunks = await Promise.all(manifest.parts.map(part => readFile(`${archiveDirectory}/${part.file}`)))
    const payload = brotliDecompressSync(joinPreview(manifest, chunks))
    const newline = payload.indexOf(10)
    if (newline < 0) throw new Error(`Invalid preview archive: ${archivePath}`)
    const header: PreviewHeader = JSON.parse(payload.toString("utf8", 0, newline))
    if (header.fingerprint !== fingerprint) {
      throw new Error(`The published preview is stale. Run bun run build:preview and commit ${archivePath}.`)
    }
    let offset = newline + 1
    if (JSON.stringify(header.paths) !== JSON.stringify(outputs) || header.sizes.length !== outputs.length || header.sizes.some(size => !Number.isSafeInteger(size) || size <= 0) ||
      offset + header.sizes.reduce((sum, size) => sum + size, 0) !== payload.length) {
      throw new Error(`Incomplete preview archive: ${archivePath}`)
    }
    for (const build of builds) await mkdir(`dist/${build.outputDir}`, { recursive: true })
    await Promise.all(outputs.map((path, i) => {
      const file = payload.subarray(offset, offset + header.sizes[i]!)
      offset += file.length
      return writeFile(`dist/${path}`, file)
    }))
    console.log(`Prepared ${builds.length} registry builds for three product versions in dist/`)
    break
  }
  default:
    throw new Error("Expected pack or unpack")
}
