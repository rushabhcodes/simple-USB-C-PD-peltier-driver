import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import Best from "../designs/best.circuit"
import Standard from "../index.circuit"
import { bestProduct, describeBestBoard, requiredBestParts } from "../designs/best"

// Structural fixtures test packaging gates; native DRC and shorts are run on
// the actual routed board by best:build, not inferred from these fixtures.
const fixture = (): AnyCircuitElement[] => [
  { type: "pcb_board", num_layers: 4, width: 72.5, height: 59, thickness: 1.6 },
  ...Array.from({ length: 134 }, (_, i) => ({ type: "source_component", ftype: "simple_resistor",
    source_component_id: `c${i}`, name: requiredBestParts[i] ?? `R${i}`, manufacturer_part_number: `MPN-${i}`,
    supplier_part_numbers: { jlcpcb: [`C${i + 1}`] } })),
  ...Array.from({ length: 364 }, () => ({ type: "pcb_trace" })),
  ...Array.from({ length: 370 }, () => ({ type: "pcb_via" })),
  ...Array.from({ length: 29 }, () => ({ type: "pcb_copper_pour" })),
] as unknown as AnyCircuitElement[]

test("recommended entrypoint is exactly the reviewed Standard design", () => {
  expect(Best).toBe(Standard)
  expect(bestProduct()).toMatchObject({ id: "standard", boards: ["standard"], manufacturingReady: false,
    hardwareQualified: false, actualCost: null, targetSellPrice: [89, 119] })
})

test("packaging summary describes a complete integrated board", () => {
  expect(describeBestBoard(fixture())).toMatchObject({ layers: 4, purchasedPlacements: 134, traces: 364, vias: 370, pours: 29 })
})

test("unrouted, multi-board and changed-outline inputs are rejected", () => {
  const a = fixture().filter(e => e.type !== "pcb_trace")
  expect(() => describeBestBoard(a)).toThrow("copper")
  const b = fixture(); b.push(b[0]!)
  expect(() => describeBestBoard(b)).toThrow("exactly one")
  const c = fixture(); c[0] = { ...c[0], width: 70 } as AnyCircuitElement
  expect(() => describeBestBoard(c)).toThrow("dimensions")
})

test("missing or unsourced features cannot be packaged as the recommended version", () => {
  const a = fixture().filter(e => !(e.type === "source_component" && e.name === "U_FAN"))
  expect(() => describeBestBoard(a)).toThrow("134")
  const b = fixture().map(e => e.type === "source_component" && e.name === "U_FAN"
    ? { ...e, manufacturer_part_number: "" } : e)
  expect(() => describeBestBoard(b)).toThrow("Unsourced")
})

test("circuit errors block packaging and warnings remain visible", () => {
  const a = fixture(); a.push({ type: "source_trace_error", message: "broken net" } as unknown as AnyCircuitElement)
  expect(() => describeBestBoard(a)).toThrow("circuit errors")
  const b = fixture(); b.push({ type: "source_property_ignored_warning", message: "unverified" } as unknown as AnyCircuitElement)
  expect(describeBestBoard(b).warnings).toHaveLength(1)
})
