import { mkdir } from "node:fs/promises"
import { Resvg } from "@resvg/resvg-js"
import type { CircuitJson } from "circuit-json"
import {
  convertCircuitJsonToSchematicSvg,
  convertCircuitJsonToStackedSchematicSheetsSvg,
} from "circuit-to-svg"

const input = "dist/index/circuit.json"
if (!await Bun.file(input).exists()) throw new Error("Build the board first: bun run build")
const circuit = await Bun.file(input).json() as CircuitJson
const sheets = circuit.filter(item => item.type === "schematic_sheet")
  .sort((a, b) => (a.sheet_index ?? 0) - (b.sheet_index ?? 0))
const output = "dist/schematics"
await mkdir(output, { recursive: true })
for (const [index, sheet] of sheets.entries()) {
  const filename = `${String(index + 1).padStart(2, "0")}-${sheet.name}`
  const svg = convertCircuitJsonToSchematicSvg(circuit, {
    schematicSheetId: sheet.schematic_sheet_id,
    width: 2000,
    height: 1414,
  })
  await Bun.write(`${output}/${filename}.svg`, svg)
  await Bun.write(`${output}/${filename}.png`, new Resvg(svg).render().asPng())
}
await Bun.write(`${output}/all-sheets.svg`, convertCircuitJsonToStackedSchematicSheetsSvg(circuit, {
  width: 1400,
  height: 990,
}))
console.log(`Exported ${sheets.length} schematic sheets to ${output}`)
