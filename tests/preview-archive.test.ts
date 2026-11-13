import { expect, test } from "bun:test"
import { chunkPreview, joinPreview, validatePreviewManifest } from "../scripts/preview-archive"

test("bounded preview chunks reconstruct the exact archive", () => {
  const input = Buffer.from("the-four-boards-and-local-viewer".repeat(10))
  const { manifest, chunks } = chunkPreview(input, 17)
  expect(chunks.every(c => c.length <= 17)).toBe(true)
  expect(joinPreview(manifest, chunks)).toEqual(input)
})

test("missing, reordered and corrupted preview chunks are rejected", () => {
  const { manifest, chunks } = chunkPreview(Buffer.from("abcdefghijklmno"), 5)
  expect(() => joinPreview(manifest, chunks.slice(1))).toThrow()
  expect(() => joinPreview(manifest, [...chunks].reverse())).toThrow()
  const corrupt = chunks.map(c => Buffer.from(c)); corrupt[0]![0] ^= 1
  expect(() => joinPreview(manifest, corrupt)).toThrow("checksum")
})

test("preview manifests reject invalid part paths and sizes", () => {
  const { manifest } = chunkPreview(Buffer.from("valid preview"))
  const bad = structuredClone(manifest); bad.parts[0]!.file = "../../private-config"
  expect(() => validatePreviewManifest(bad)).toThrow()
  const wrong = structuredClone(manifest); wrong.bytes++
  expect(() => validatePreviewManifest(wrong)).toThrow()
  expect(() => chunkPreview(Buffer.alloc(0))).toThrow()
})
