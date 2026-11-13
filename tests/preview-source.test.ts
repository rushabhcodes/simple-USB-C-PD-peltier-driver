import { expect, test } from "bun:test"
import { changedSources, fingerprintSources } from "../scripts/preview-source"

const file = (path: string, text: string) => ({ path, data: Buffer.from(text) })
test("registry renumbering and JSON formatting do not change the board fingerprint", () => {
  const a = fingerprintSources([file("package.json", JSON.stringify({ name: "board", version: "0.2.3", dependencies: { core: "1.0" } }))])
  const b = fingerprintSources([file("package.json", JSON.stringify({ dependencies: { core: "1.0" }, version: "0.2.4", name: "board" }, null, 2))])
  expect(a).toEqual(b)
})
test("dependency, source and input-set changes invalidate the preview", () => {
  const a = fingerprintSources([file("package.json", '{"dependencies":{"core":"1"}}'), file("board.tsx", "original")])
  for (const files of [
    [file("package.json", '{"dependencies":{"core":"2"}}'), file("board.tsx", "original")],
    [file("package.json", '{"dependencies":{"core":"1"}}'), file("board.tsx", "changed")],
    [file("package.json", '{"dependencies":{"core":"1"}}')],
    [file("package.json", '{"dependencies":{"core":"1"}}'), file("board.tsx", "original"), file("extra.tsx", "new")],
  ]) expect(fingerprintSources(files).fingerprint).not.toBe(a.fingerprint)
})
test("fingerprint diagnostics identify changed, added and missing inputs", () => {
  expect(changedSources({ "a.ts": "old", "b.ts": "same", "missing.ts": "x" }, { "a.ts": "new", "b.ts": "same", "added.ts": "x" })).toEqual(["a.ts", "added.ts", "missing.ts"])
})
