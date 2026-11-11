import { Circuit } from "@tscircuit/core"
import { mkdir, rename, rm } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { Children, cloneElement, isValidElement, type ReactElement } from "react"
import { GeneralPdDriverBoard } from "../src/board/general-pd"
import { RoutedCopper, type RoutedCopperData } from "../src/board/routed-copper"
import { assertCopperAssociations } from "../tests/helpers/copper-associations"
import { assertStableSourceIds, enrichCopper, formatRoutingData, renderSourceIds } from "./helpers/routing"

const path = new URL("../src/board/routing-data.json", import.meta.url)
const outputPath = process.argv[2] ? resolve(process.argv[2]) : undefined
if (outputPath === fileURLToPath(path)) throw new Error("Circuit output must not overwrite routing-data.json")
const capturedText = await Bun.file(path).text()
const data = JSON.parse(capturedText) as RoutedCopperData
const board = GeneralPdDriverBoard({ schematicDisabled: true })
const withCopper = (copper: RoutedCopperData) => {
  let replacements = 0
  const children = Children.map(board.props.children, child => {
    if (!isValidElement(child) || child.type !== RoutedCopper) return child
    replacements++
    return cloneElement(child as ReactElement<RoutedCopperData>, copper)
  })
  if (replacements !== 1) throw new Error(`Expected one board RoutedCopper component, found ${replacements}`)
  return cloneElement(board, { routingDisabled: false, routeRemaining: false, partsEngineDisabled: true }, children)
}

// Both phases use one captured component graph and one captured copper dataset.
const source = await renderSourceIds(withCopper(data))
console.log("Source snapshot complete; rendering rebound copper and pours")
const enriched = enrichCopper(source, data)
const circuit = new Circuit({ platform: { schematicDisabled: true, partsEngineDisabled: true } })
circuit.add(withCopper(enriched))
await circuit.renderUntilSettled()
const rendered = circuit.getCircuitJson()
assertStableSourceIds(source, rendered)
assertCopperAssociations(rendered, enriched)
if (await Bun.file(path).text() !== capturedText) throw new Error("routing-data.json changed during rendering; rerun against the latest data")
const temporary = new URL(`./routing-data.rebind-${process.pid}.tmp`, path)
try {
  await Bun.write(temporary, formatRoutingData(enriched))
  await rename(temporary, path)
} finally {
  await rm(temporary, { force: true })
}
if (outputPath) {
  await mkdir(dirname(outputPath), { recursive: true })
  await Bun.write(outputPath, JSON.stringify(rendered, null, 2) + "\n")
}
const errors: Record<string, number> = {}
for (const item of rendered.filter(item => item.type.includes("error"))) errors[item.type] = (errors[item.type] ?? 0) + 1
console.log(JSON.stringify({ reboundRoutes: enriched.routes.length, nativeErrors: errors, circuitPath: outputPath }))
console.log("Saved source associations. Run bun test tests/routing.test.tsx to validate the physical board.")
