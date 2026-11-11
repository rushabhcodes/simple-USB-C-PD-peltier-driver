import { expect, test } from "bun:test"
import { createElement } from "react"
import { Circuit } from "tscircuit"
import type { PartsEngine } from "@tscircuit/props"
import { withKnownStockAvailability } from "../src/known-stock-parts-engine"
import { catalogPartsEngine } from "../src/catalog-parts-engine"

test("unknown stock remains unknown, while zero and positive stock remain reportable", async () => {
  const request = { supplierName: "jlcpcb", supplierPartNumber: "C14663" } as const
  for (const stock of [null, 0, 50]) {
    const engine: PartsEngine = {
      findPart: () => ({}),
      fetchPartAvailability: () => ({ stock, price: null, currency: null, checkedAt: "2026-11-11T00:00:00Z" }),
    }
    expect((await withKnownStockAvailability(engine).fetchPartAvailability!(request))?.stock)
      .toBe(stock === null ? undefined : stock)
  }
  const engine = withKnownStockAvailability({ findPart: () => ({}), fetchPartAvailability: () => { throw new Error("Catalog failed") } })
  await expect(Promise.resolve().then(() => engine.fetchPartAvailability!(request))).rejects.toThrow("Catalog failed")
})

test("the manufacturer footprint is compared, and an incorrect inductor footprint still warns", async () => {
  for (const width of [2.2, 0.5]) {
    const circuit = new Circuit({ platform: {
      schematicDisabled: true, routingDisabled: true, checkAvailability: false, partsEngine: catalogPartsEngine,
    } })
    circuit.add(createElement("board", { width: 12, height: 12 }, createElement("inductor", {
      name: "L1", inductance: "33uH", supplierPartNumbers: { jlcpcb: ["C83467"] },
      footprint: createElement("footprint", null, ...[-3, 3].map((x, i) => createElement("smtpad", {
        key: i, pcbX: x, pcbY: 0, shape: "rect", width, height: 7.5, portHints: [`pin${i + 1}`],
      }))),
    })))
    await circuit.renderUntilSettled()
    expect(circuit.getCircuitJson().filter(e => e.type === "supplier_footprint_mismatch_warning")).toHaveLength(width === 2.2 ? 0 : 1)
  }
})

test("core still emits a real zero-stock warning with the catalog adapter installed", async () => {
  for (const stock of [null, 0, 50]) {
    const circuit = new Circuit({ platform: {
      pcbDisabled: true, schematicDisabled: true, checkAvailability: true,
      partsEngine: withKnownStockAvailability({
        findPart: () => ({}),
        fetchPartAvailability: () => ({ stock, price: null, currency: null, checkedAt: "2026-11-11T00:00:00Z" }),
      }),
    } })
    circuit.add(createElement("board", { width: 10, height: 10 }, createElement("resistor", {
      name: "R1", resistance: "10k", footprint: "0603", supplierPartNumbers: { jlcpcb: ["C25804"] },
    })))
    await circuit.renderUntilSettled()
    expect(circuit.getCircuitJson().filter(e => e.type === "source_component_availability_warning")).toHaveLength(stock === 0 ? 1 : 0)
  }
})
