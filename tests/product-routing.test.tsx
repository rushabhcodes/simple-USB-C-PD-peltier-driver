import { beforeAll, expect, test } from "bun:test"
import { Circuit } from "tscircuit"
import type { AnyCircuitElement } from "circuit-json"
import { RoutedProductBoard, productCopper } from "../designs/routed-boards"
import { reviewBoardRouting } from "../designs/routing-audit"
import { analyzePhysicalCopper, sourceConnectivity } from "./helpers/physical-copper"

const ids = ["lite", "modular-power", "modular-control"] as const
const boards = new Map<string, AnyCircuitElement[]>()
const reports = new Map<string, Awaited<ReturnType<typeof reviewBoardRouting>>>()

beforeAll(async () => {
  for (const id of ids) {
    const circuit = new Circuit({ platform: { schematicDisabled: true, partsEngineDisabled: true } })
    circuit.add(<RoutedProductBoard id={id} />)
    await circuit.renderUntilSettled()
    const json = circuit.getCircuitJson()
    boards.set(id, json)
    reports.set(id, await reviewBoardRouting(id, json, productCopper[id]!))
  }
}, 360_000)

test("all product PCBs pass fresh physical connectivity, native DRC and fabrication geometry checks", () => {
  for (const id of ids) {
    const report = reports.get(id)!
    expect({ id, complete: report.routingComplete, opens: report.disconnected, shorts: report.shorts,
      clearance: report.clearanceViolations, drills: report.drillClearanceViolations,
      native: report.nativeErrors, floating: report.floatingCopper,
      association: report.associationError }).toEqual({ id, complete: true, opens: [], shorts: [],
      clearance: [], drills: [], native: [], floating: [], association: null })
    expect(report.manufacturingReady).toBe(false)
    expect(report.traceCount).toBeGreaterThan(100)
    expect(report.viaCount).toBeGreaterThan(100)
  }
})

test("routing retains the converter's six wide copper corridors and original Kelvin branches", () => {
  for (const id of ["lite", "modular-power"]) {
    const report = reports.get(id)!
    expect(report.powerCorridors).toHaveLength(6)
    expect(report.powerCorridors.every(c => c.covered)).toBe(true)
    expect(report.missingKelvinRoutes).toEqual([])
  }
})

test("only the exact exposed-pad thermal arrays receive via-in-pad exemptions", () => {
  expect(ids.map(id => reports.get(id)!.thermalVias)).toEqual([13, 4, 9]
    .map(checkedPairs => ({ checkedPairs, missing: [], invalid: [] })))
})

test("removing harness permission copper exposes an open even though the source netlist is unchanged", () => {
  const json = boards.get("modular-power")!
  const source = sourceConnectivity(json)
  const permission = json.find(e => e.type === "source_net" && e.name === "MCU_DRIVER_PERMISSION")!
  if (permission.type !== "source_net") throw new Error("Missing permission net")
  const traces = new Set(json.flatMap(e => e.type === "source_trace" &&
    e.connected_source_net_ids.includes(permission.source_net_id) ? [e.source_trace_id] : []))
  const broken = json.filter(e => !(e.type === "pcb_trace" && traces.has(e.source_trace_id ?? "")))
  expect(broken.length).toBeLessThan(json.length)
  expect(sourceConnectivity(broken).signature).toBe(source.signature)
  expect(analyzePhysicalCopper(broken).disconnected.some(g => g.nets.includes("MCU_DRIVER_PERMISSION"))).toBe(true)
})
