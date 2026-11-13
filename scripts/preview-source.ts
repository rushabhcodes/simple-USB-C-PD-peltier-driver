import { createHash } from "node:crypto"

const hash = (data: Uint8Array | string) => createHash("sha256").update(data).digest("hex")
function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical)
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([k, v]) => [k, canonical(v)]))
  return value
}

export function fingerprintSources(files: Array<{ path: string; data: Uint8Array }>) {
  const sources: Record<string, string> = {}
  for (const { path, data } of [...files].sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0)) {
    let bytes: Uint8Array | string = data
    if (path === "package.json") {
      const pkg = JSON.parse(Buffer.from(data).toString())
      // Registry release numbering is metadata, not a board/model input.
      delete pkg.version
      bytes = JSON.stringify(canonical(pkg))
    }
    sources[path] = hash(bytes)
  }
  return { fingerprint: hash(JSON.stringify(sources)), sources }
}

export function changedSources(expected: Record<string, string>, actual: Record<string, string>) {
  return [...new Set([...Object.keys(expected), ...Object.keys(actual)])].sort().filter(path => expected[path] !== actual[path])
}
