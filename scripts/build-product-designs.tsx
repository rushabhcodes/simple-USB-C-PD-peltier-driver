import { mkdir } from "node:fs/promises"
import { Circuit } from "tscircuit"
import { Resvg } from "@resvg/resvg-js"
import { convertCircuitJsonToStackedSchematicSheetsSvg } from "circuit-to-svg"
import { DraftBoard, type DraftBoardId } from "../designs/boards"
import { GeneralPdDriverBoard } from "../src/board/general-pd"
import { connectivity, placementIssues, straightCable } from "../designs/audit"
import { costCeiling } from "../designs/economics"
import products from "../designs/products.json"
import { floorplanSvg } from "../designs/floorplan"

if (process.argv.includes("--fabrication")) throw new Error("New designs are unrouted and unqualified; fabrication export is blocked")
const output = "dist/product-designs"
await mkdir(output, { recursive: true })
const baseline = new Circuit({ platform: { pcbDisabled: true, schematicDisabled: true, partsEngineDisabled: true } })
baseline.add(<GeneralPdDriverBoard />)
await baseline.renderUntilSettled()
const reference = baseline.getCircuitJson()
const included = new Set(baseline.db.source_component.list().map(p => p.name))
const rendered = new Map<DraftBoardId, ReturnType<InstanceType<typeof Circuit>["getCircuitJson"]>>()
const reports = []
for (const id of ["lite", "modular-power", "modular-control"] as const) {
  console.log(`Rendering ${id} source, schematic and unrouted floorplan...`)
  const circuit = new Circuit({ platform: { partsEngineDisabled: true } })
  circuit.add(<DraftBoard id={id} />)
  await circuit.renderUntilSettled()
  const json = circuit.getCircuitJson()
  rendered.set(id, json)
  const dir = `${output}/${id}`
  await mkdir(dir, { recursive: true })
  await Bun.write(`${dir}/circuit.json`, JSON.stringify(json))
  const pcb = floorplanSvg(json, id)
  await Bun.write(`${dir}/floorplan.svg`, pcb)
  await Bun.write(`${dir}/floorplan.png`, new Resvg(pcb).render().asPng())
  await Bun.write(`${dir}/schematics.svg`, convertCircuitJsonToStackedSchematicSheetsSvg(json, { width: 1400, height: 990 }))
  const bom = circuit.db.source_component.list().filter(p => p.ftype !== "simple_test_point").map(p => ({
    designator: p.name, mpn: p.manufacturer_part_number ?? null, suppliers: p.supplier_part_numbers ?? null,
    quoteStatus: "unquoted", unitPrice: null,
  }))
  await Bun.write(`${dir}/bom.json`, JSON.stringify(bom, null, 2) + "\n")
  reports.push({ id, purchasedPlacements: bom.length, routingComplete: false, manufacturingReady: false,
    placementIssues: placementIssues(json), errors: json.filter(e => e.type.endsWith("_error")),
    warnings: json.filter(e => e.type.endsWith("_warning")),
    unsourced: bom.filter(p => !p.mpn || !p.suppliers).map(p => p.designator) })
}
const stitched = connectivity([
  { id: "power", json: rendered.get("modular-power")! },
  { id: "control", json: rendered.get("modular-control")! },
], straightCable, included)
const baselineGraph = connectivity([{ id: "standard", json: reference }], [], included)
const graphMatches = stitched.signature === baselineGraph.signature
if (!graphMatches) {
  const expected = (JSON.parse(baselineGraph.signature) as unknown[]).map(e => JSON.stringify(e))
  const actual = (JSON.parse(stitched.signature) as unknown[]).map(e => JSON.stringify(e))
  await Bun.write(`${output}/connectivity-diff.json`, JSON.stringify({
    missing: expected.filter(e => !actual.includes(e)).map(e => JSON.parse(e)),
    unexpected: actual.filter(e => !expected.includes(e)).map(e => JSON.parse(e)),
  }, null, 2))
}
const report = { graphMatches, referencePins: baselineGraph.pinCount, stitchedPins: stitched.pinCount,
  nativeViaProxyPortsExcluded: baselineGraph.ignoredViaPorts,
  commercialAssumptions: { currency: products.currency, priceStatus: products.priceStatus,
    planningQuantity: products.planningQuantity, saleScope: products.saleScope, targetGrossMargin: products.targetGrossMargin },
  prices: products.products.map(p => ({ id: p.id, currency: products.currency, targetSellPrice: p.targetSellPrice,
    priceStatus: products.priceStatus, maxLandedCogs: costCeiling(p.targetSellPrice, products.targetGrossMargin), actualCost: null })),
  boards: reports }
await Bun.write(`${output}/validation.json`, JSON.stringify(report, null, 2) + "\n")
console.log(JSON.stringify(report, null, 2))
if (!graphMatches || reports.some(r => r.errors.length || r.placementIssues.length)) process.exitCode = 1
