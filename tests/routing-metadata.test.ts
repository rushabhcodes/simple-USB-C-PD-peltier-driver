import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import type { RoutedCopperData } from "../src/board/routed-copper"
import { assertCopperAssociations } from "./helpers/copper-associations"
import { inspectThermalVias, THERMAL_ARRAYS } from "./helpers/thermal-vias"
import { drillSmtClearanceViolations } from "./helpers/physical-copper"

function thermalFixture(): AnyCircuitElement[] {
  const json: any[] = [{ type: "source_net", source_net_id: "gnd", name: "GND" }]
  for (const array of THERMAL_ARRAYS) {
    const id = array.component
    json.push(
      { type: "source_component", source_component_id: id, name: id },
      { type: "source_port", source_port_id: id, source_component_id: id, pin_number: array.pin },
      { type: "source_trace", source_trace_id: id, connected_source_port_ids: [id], connected_source_net_ids: ["gnd"] },
      { type: "pcb_port", pcb_port_id: id, source_port_id: id },
      { type: "pcb_smtpad", pcb_smtpad_id: id, pcb_port_id: id, shape: "rect", width: 3.1, height: 3.1,
        x: (array.x[0] + array.x[array.x.length - 1]!) / 2, y: (array.y[0] + array.y[array.y.length - 1]!) / 2 })
    for (const x of array.x) for (const y of array.y) json.push({ type: "pcb_via", pcb_via_id: `${x},${y}`,
      x, y, source_net_id: "gnd", hole_diameter: 0.3, outer_diameter: 0.6, layers: ["top", "inner1", "inner2", "bottom"] })
  }
  return json
}

test("only exact documented filled thermal pad/via pairs receive native exceptions", () => {
  const json = thermalFixture()
  const result = inspectThermalVias(json)
  expect(result.missing).toEqual([])
  expect(result.invalid).toEqual([])
  expect(result.allowedErrorIds.size).toBe(13)
  expect(result.allowedErrorIds.has("via_in_pad_-0.8,-15.8_U_MCU")).toBe(true)
  expect(result.allowedErrorIds.has("via_in_pad_-0.8,-15.8_TP_OUT")).toBe(false)
  const via = json.find(e => e.type === "pcb_via")!
  if (via.type !== "pcb_via") throw new Error("Missing fixture via")
  via.source_net_id = "signal"
  expect(inspectThermalVias(json).invalid).toHaveLength(1)
  via.source_net_id = "gnd"
  via.hole_diameter = 0.4
  expect(inspectThermalVias(json).invalid).toHaveLength(1)
  via.hole_diameter = 0.3
  via.layers = ["top", "bottom"]
  expect(inspectThermalVias(json).invalid).toHaveLength(1)
})

test("drills require a 0.15mm solder-land web, including same-net vias and plated slots", () => {
  const pad = { type: "pcb_smtpad", pcb_smtpad_id: "pad", shape: "rect", x: 0, y: 0, width: 1, height: 1, layer: "top", source_net_id: "gnd" }
  const via = { type: "pcb_via", pcb_via_id: "via", x: 0.799, y: 0, hole_diameter: 0.3, outer_diameter: 0.6, source_net_id: "gnd" }
  const check = (hole: object) => drillSmtClearanceViolations([pad, hole] as AnyCircuitElement[])
  expect(check(via)[0]!.actual).toBeCloseTo(0.149)
  expect(check({ ...via, x: 0.8 })).toEqual([])
  expect(check({ ...via, x: 0 })[0]!.actual).toBe(0)
  const slot = { type: "pcb_plated_hole", pcb_plated_hole_id: "slot", x: 0.849, y: 0, hole_width: 0.4, hole_height: 0.2 }
  expect(check(slot)[0]!.actual).toBeCloseTo(0.149)
  expect(check({ ...slot, x: 0.85 })).toEqual([])
})

test("only the exact 13 thermal via-pad pairs waive the drill web", () => {
  const json = thermalFixture(), allowed = inspectThermalVias(json).allowedErrorIds
  expect(drillSmtClearanceViolations(json)).toHaveLength(13)
  expect(drillSmtClearanceViolations(json, allowed)).toEqual([])
  json.push({ type: "pcb_smtpad", pcb_smtpad_id: "unlisted-pad", shape: "rect", x: -0.8, y: -15.8,
    width: 0.1, height: 0.1, layer: "bottom" } as AnyCircuitElement)
  expect(drillSmtClearanceViolations(json, allowed)).toEqual([
    { drill: "-0.8,-15.8", pad: "unlisted-pad", actual: 0, minimum: 0.15 },
  ])
})

const associationFixture = (): AnyCircuitElement[] => [
  { type: "source_component", source_component_id: "c", name: "IC" },
  { type: "source_port", source_port_id: "s", source_component_id: "c", pin_number: 1 },
  { type: "source_net", source_net_id: "n", name: "N" },
  { type: "source_trace", source_trace_id: "t", connected_source_port_ids: ["s"], connected_source_net_ids: ["n"], max_length: 2 },
  { type: "pcb_port", pcb_port_id: "p", source_port_id: "s", x: 0, y: 0, layers: ["top"] },
  { type: "pcb_smtpad", pcb_smtpad_id: "pad", pcb_port_id: "p", shape: "rect", x: 0, y: 0, width: 0.6, height: 0.6, layer: "top" },
] as AnyCircuitElement[]
const associationData = (): RoutedCopperData => ({ vias: [], routes: [{ net: "N", sourceTraceId: "t",
  sourceTraceKey: JSON.stringify([["IC.pin1"], ["N"], 2, null]),
  route: [0, 1].map(x => ({ route_type: "wire", x, y: 0, layer: "top", width: 0.2 })) }] })

test("saved source associations retain the original pin, named net and constraints", () => {
  const json = associationFixture(), data = associationData()
  expect(() => assertCopperAssociations(json, data)).not.toThrow()
  data.routes[0]!.sourceTraceId = "stale"
  expect(() => assertCopperAssociations(json, data)).toThrow("source association")
  data.routes[0]!.sourceTraceId = "t"
  const trace = json.find(e => e.type === "source_trace")!
  if (trace.type !== "source_trace") throw new Error("Missing fixture trace")
  trace.max_length = 3
  expect(() => assertCopperAssociations(json, data)).toThrow("pin/constraint metadata")
})

test("a constrained source branch cannot be borrowed by a distant copper trunk", () => {
  const data = associationData()
  data.routes[0]!.route.forEach(p => { p.x += 5 })
  expect(() => assertCopperAssociations(associationFixture(), data)).toThrow("unrelated branch")
})

test("constrained endpoints may land inside pad copper away from the center", () => {
  const data = associationData()
  data.routes[0]!.route[0]!.x = 0.25
  expect(() => assertCopperAssociations(associationFixture(), data)).not.toThrow()
  data.routes[0]!.route[0]!.x = 0.31
  expect(() => assertCopperAssociations(associationFixture(), data)).toThrow("unrelated branch")
})

test("all pins of a constrained branch must be its physical endpoints", () => {
  const json = associationFixture(), data = associationData()
  json.push(
    { type: "source_port", source_port_id: "s2", source_component_id: "c", pin_number: 2 } as AnyCircuitElement,
    { type: "pcb_port", pcb_port_id: "p2", source_port_id: "s2", x: 2, y: 0, layers: ["top"] } as AnyCircuitElement,
    { type: "pcb_smtpad", pcb_smtpad_id: "pad2", pcb_port_id: "p2", shape: "rect", x: 2, y: 0, width: 0.6, height: 0.6, layer: "top" } as AnyCircuitElement)
  const trace = json.find(e => e.type === "source_trace")!
  if (trace.type !== "source_trace") throw new Error("Missing fixture trace")
  trace.connected_source_port_ids.push("s2")
  data.routes[0]!.sourceTraceKey = JSON.stringify([["IC.pin1", "IC.pin2"], ["N"], 2, null])
  expect(() => assertCopperAssociations(json, data)).toThrow("unrelated branch")
  data.routes[0]!.route[1]!.x = 2
  expect(() => assertCopperAssociations(json, data)).not.toThrow()
  data.routes[0]!.sourcePort = "IC.pin3"
  expect(() => assertCopperAssociations(json, data)).toThrow("does not own its endpoint")
})
