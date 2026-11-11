import { createHash } from "node:crypto"
import { mkdir, readFile, writeFile } from "node:fs/promises"
import { brotliCompressSync, brotliDecompressSync, constants } from "node:zlib"

const archivePath = "assets/assembly/site-preview.br"
const outputs = [
  "index.html", "index.js", "index.cjs", "index.d.ts",
  "assembly/circuit.json", "assembly/3d.glb", "assembly/3d.png",
  "assembly/pcb.svg", "assembly/pcb.png", "assembly/schematic.svg", "assembly/schematic.png",
]

// Refuse to deploy a preview built from a different board or assembly.
async function sourceFingerprint() {
  const glob = new Bun.Glob("**/*")
  const paths = [
    "assembly.tsx", "index.circuit.tsx", "tscircuit.config.json", "tsconfig.json",
    "scripts/build-assembly.ts", "scripts/pack-site-preview.ts", "assets/assembly/provenance.json",
    ...["src", "imports"].flatMap(dir =>
      [...glob.scanSync({ cwd: dir, onlyFiles: true })].map(path => `${dir}/${path}`)),
  ].sort()
  const hash = createHash("sha256")
  for (const path of paths) hash.update(path).update("\0").update(await readFile(path)).update("\0")
  return hash.digest("hex")
}

type PreviewHeader = { fingerprint: string; sizes: number[] }
const fingerprint = await sourceFingerprint()
switch (process.argv[2]) {
  case "pack": {
    const files = await Promise.all(outputs.map(path => readFile(`dist/${path}`)))
    const header: PreviewHeader = { fingerprint, sizes: files.map(file => file.length) }
    const payload = Buffer.concat([Buffer.from(JSON.stringify(header) + "\n"), ...files])
    await writeFile(archivePath, brotliCompressSync(payload, {
      params: { [constants.BROTLI_PARAM_QUALITY]: 6 },
    }))
    console.log(`Packed the validated preview into ${archivePath}`)
    break
  }
  case "unpack": {
    const payload = brotliDecompressSync(await readFile(archivePath))
    const newline = payload.indexOf(10)
    if (newline < 0) throw new Error(`Invalid preview archive: ${archivePath}`)
    const header: PreviewHeader = JSON.parse(payload.toString("utf8", 0, newline))
    if (header.fingerprint !== fingerprint) {
      throw new Error(`The published preview is stale. Run bun run build:preview and commit ${archivePath}.`)
    }
    let offset = newline + 1
    if (header.sizes.length !== outputs.length || header.sizes.some(size => !Number.isSafeInteger(size) || size <= 0) ||
      offset + header.sizes.reduce((sum, size) => sum + size, 0) !== payload.length) {
      throw new Error(`Incomplete preview archive: ${archivePath}`)
    }
    await mkdir("dist/assembly", { recursive: true })
    await Promise.all(outputs.map((path, i) => {
      const file = payload.subarray(offset, offset + header.sizes[i]!)
      offset += file.length
      return writeFile(`dist/${path}`, file)
    }))
    console.log("Published the full assembly preview to dist/assembly")
    break
  }
  default:
    throw new Error("Expected pack or unpack")
}
