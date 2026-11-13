import { createHash } from "node:crypto"

export const previewChunkBytes = 3 * 1024 * 1024
const hash = (data: Uint8Array) => createHash("sha256").update(data).digest("hex")
export type PreviewArchiveManifest = {
  format: "brotli-chunks-v1"
  bytes: number
  sha256: string
  parts: Array<{ file: string; bytes: number; sha256: string }>
}

export function chunkPreview(data: Buffer, maxBytes = previewChunkBytes) {
  if (!data.length || !Number.isSafeInteger(maxBytes) || maxBytes < 1) throw new Error("Invalid preview archive size")
  const chunks: Buffer[] = []
  for (let offset = 0; offset < data.length; offset += maxBytes) chunks.push(data.subarray(offset, offset + maxBytes))
  const manifest: PreviewArchiveManifest = { format: "brotli-chunks-v1", bytes: data.length, sha256: hash(data),
    parts: chunks.map((data, i) => ({ file: `site-preview-${String(i).padStart(3, "0")}.brpart`, bytes: data.length, sha256: hash(data) })) }
  return { manifest, chunks }
}

export function validatePreviewManifest(manifest: PreviewArchiveManifest) {
  if (manifest.format !== "brotli-chunks-v1" || !Number.isSafeInteger(manifest.bytes) || manifest.bytes < 1 ||
      !/^[a-f0-9]{64}$/.test(manifest.sha256) || !Array.isArray(manifest.parts) || !manifest.parts.length)
    throw new Error("Invalid preview archive manifest")
  for (const [i, part] of manifest.parts.entries()) {
    if (part.file !== `site-preview-${String(i).padStart(3, "0")}.brpart` ||
        !Number.isSafeInteger(part.bytes) || part.bytes < 1 || part.bytes > previewChunkBytes || !/^[a-f0-9]{64}$/.test(part.sha256))
      throw new Error("Invalid preview archive part")
  }
  if (manifest.parts.reduce((sum, p) => sum + p.bytes, 0) !== manifest.bytes) throw new Error("Preview archive size mismatch")
}

export function joinPreview(manifest: PreviewArchiveManifest, chunks: Buffer[]) {
  validatePreviewManifest(manifest)
  if (chunks.length !== manifest.parts.length) throw new Error("Missing preview archive parts")
  for (const [i, chunk] of chunks.entries()) {
    if (chunk.length !== manifest.parts[i]!.bytes || hash(chunk) !== manifest.parts[i]!.sha256)
      throw new Error(`Preview part checksum mismatch: ${manifest.parts[i]!.file}`)
  }
  const data = Buffer.concat(chunks)
  if (data.length !== manifest.bytes || hash(data) !== manifest.sha256) throw new Error("Preview archive checksum mismatch")
  return data
}
