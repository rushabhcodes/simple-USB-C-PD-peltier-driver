import { Circuit } from "tscircuit"
import { mkdir } from "node:fs/promises"
import { RoutedProductBoard, productCopper } from "../designs/routed-boards"
import { GeneralPdDriverBoard } from "../src/board/general-pd"
import original from "../src/board/routing-data.json"
import { reviewBoardRouting, type RoutedBoardId } from "../designs/routing-audit"
import type { RoutedCopperData } from "../src/board/routed-copper"
import { connectivity, straightCable } from "../designs/audit"

const ids = (process.argv[2] ? [process.argv[2]] : ["standard", "lite", "modular-power", "modular-control"]) as RoutedBoardId[]
const output = "dist/product-routing"
await mkdir(output, { recursive: true })
const rendered = new Map<string, ReturnType<InstanceType<typeof Circuit>["getCircuitJson"]>>()
const reports = []
for (const id of ids) {
  console.log(`Checking ${id}: fresh source, physical copper, native DRC and manufacturing geometry...`)
  const circuit = new Circuit({ platform: { partsEngineDisabled: true, schematicDisabled: true } })
  circuit.add(id === "standard" ? <GeneralPdDriverBoard schematicDisabled /> : <RoutedProductBoard id={id} />)
  await circuit.renderUntilSettled()
  const json = circuit.getCircuitJson()
  rendered.set(id, json)
  await Bun.write(`${output}/${id}.circuit.json`, JSON.stringify(json))
  const data = id === "standard" ? original as RoutedCopperData : productCopper[id]!
  const report = await reviewBoardRouting(id, json, data)
  reports.push(report)
  console.log(`${id}: ${report.traceCount} traces, ${report.viaCount} vias; routing ${report.routingComplete ? "PASS" : "INCOMPLETE"}`)
}
let modularGraph: { pinCount: number; matchesReference: boolean } | null = null
if (["standard", "modular-power", "modular-control"].every(id => rendered.has(id))) {
  const reference = rendered.get("standard")!
  const names = new Set(reference.filter(e => e.type === "source_component").map(e => e.name))
  const expected = connectivity([{ id: "standard", json: reference }], [], names)
  const actual = connectivity([{ id: "power", json: rendered.get("modular-power")! },
    { id: "control", json: rendered.get("modular-control")! }], straightCable, names)
  modularGraph = { pinCount: actual.pinCount, matchesReference: expected.signature === actual.signature }
}
const result = { schemaVersion: 1, qualification: "Source and routing checks only; hardware, connector sourcing and fabrication-process qualification remain open", modularGraph, boards: reports }
await Bun.write(`${output}/validation.json`, JSON.stringify(result, null, 2) + "\n")
if (reports.some(r => !r.routingComplete) || modularGraph?.matchesReference === false) process.exitCode = 1
