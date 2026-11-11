import { describe, expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { analyzePhysicalCopper, sourceConnectivity } from "./helpers/physical-copper"

function fixture(): AnyCircuitElement[] {
  const json: any[] = [{ type: "pcb_board", num_layers: 4 }, { type: "source_net", source_net_id: "n", name: "SIGNAL" }]
  for (const [i, x] of [0, 2, 4].entries()) {
    json.push(
      { type: "source_component", source_component_id: `c${i}`, name: `P${i}` },
      { type: "source_port", source_port_id: `s${i}`, source_component_id: `c${i}`, name: "pin1", pin_number: 1 },
      { type: "pcb_port", pcb_port_id: `p${i}`, source_port_id: `s${i}`, x, y: 0, layers: ["top"] },
      { type: "pcb_smtpad", pcb_smtpad_id: `pad${i}`, pcb_port_id: `p${i}`, shape: "rect", x, y: 0, width: 0.6, height: 0.6, layer: "top" })
    if (i < 2) json.push({ type: "source_trace", source_trace_id: `st${i}`, connected_source_port_ids: [`s${i}`], connected_source_net_ids: ["n"] })
  }
  return json
}
const trace = (layer = "top", x0 = 0, x1 = 2): AnyCircuitElement => ({ type: "pcb_trace", pcb_trace_id: `trace${x0}`,
  source_trace_id: "st0", route: [x0, x1].map(x => ({ route_type: "wire", x, y: 0, width: 0.2, layer })) }) as AnyCircuitElement
const via = (x: number): AnyCircuitElement => ({ type: "pcb_via", pcb_via_id: `arbitrary-via-${x}`, x, y: 0,
  outer_diameter: 0.5, hole_diameter: 0.2, layers: ["top", "bottom"] }) as AnyCircuitElement
const ring = (coordinates: number[][]) => ({ vertices: coordinates.map(([x, y]) => ({ x, y })) })

describe("physical copper connectivity oracle", () => {
  test("logical net and trace IDs do not connect isolated copper islands", () => {
    const baseline = fixture(), expected = sourceConnectivity(baseline)
    expect(analyzePhysicalCopper(baseline, expected).disconnected).toHaveLength(1)
    expect(analyzePhysicalCopper([...baseline, trace("top", 0, 0.7), trace("top", 1.3, 2)], expected).disconnected).toHaveLength(1)
  })
  test("real copper joins required pins and ignores a genuinely unused pin", () => {
    const result = analyzePhysicalCopper([...fixture(), trace()])
    expect(result.disconnected).toEqual([])
    expect(result.shorts).toEqual([])
    expect(result.requiredPortCount).toBe(2)
    expect(result.ignoredNcPortCount).toBe(1)
  })
  test("current package flow-through conductors preserve the original source net partition", () => {
    const baseline = fixture() as any[]
    const pin = baseline.find(e => e.source_port_id === "s1" && e.type === "source_port")
    pin.source_component_id = "c0"
    pin.pin_number = 2
    const expected = sourceConnectivity(baseline)
    const current = [...baseline, { type: "source_component_internal_connection", source_component_id: "c0",
      source_port_ids: ["s0", "s1"] }]
    expect(sourceConnectivity(current).signature).toBe(expected.signature)
    expect(analyzePhysicalCopper(baseline, expected).disconnected).toHaveLength(1)
    expect(analyzePhysicalCopper(current, expected).disconnected).toEqual([])
  })
  test("bottom copper cannot contact top-only pads", () => {
    expect(analyzePhysicalCopper([...fixture(), trace("bottom")]).disconnected).toHaveLength(1)
  })
  test("top-to-bottom barrels connect inner copper and arbitrary via IDs count", () => {
    const result = analyzePhysicalCopper([...fixture(), via(0), via(2), trace("inner1")])
    expect(result.disconnected).toEqual([])
    expect(result.metricsForNet("SIGNAL")).toEqual({ traceLengthMm: 2, viaCount: 2 })
  })
  test("native wire-to-via points include the copper leading into and out of a barrel", () => {
    const json = fixture() as any[]
    json.find(e => e.pcb_smtpad_id === "pad1").layer = "bottom"
    const routed: any = { type: "pcb_trace", pcb_trace_id: "implicit", route: [
      { route_type: "wire", x: 0, y: 0, width: 0.2, layer: "top" },
      { route_type: "via", x: 1, y: 0, from_layer: "top", to_layer: "bottom" },
      { route_type: "wire", x: 2, y: 0, width: 0.2, layer: "bottom" },
    ] }
    const result = analyzePhysicalCopper([...json, via(1), routed])
    expect(result.disconnected).toEqual([])
    expect(result.unanchoredCopper).toEqual([])
    expect(result.metricsForNet("SIGNAL")).toEqual({ traceLengthMm: 2, viaCount: 1 })
  })
  test("through-pad paths require real plated copper between their two layers", () => {
    const json = fixture() as any[]
    json.find(e => e.pcb_smtpad_id === "pad1").layer = "bottom"
    const routed: any = { type: "pcb_trace", pcb_trace_id: "pad-path", route: [
      { route_type: "wire", x: 0, y: 0, width: 0.2, layer: "top" },
      { route_type: "through_pad", start: { x: 0.8, y: 0 }, end: { x: 1.2, y: 0 }, start_layer: "top", end_layer: "bottom", width: 0.2 },
      { route_type: "wire", x: 2, y: 0, width: 0.2, layer: "bottom" },
    ] }
    expect(analyzePhysicalCopper([...json, routed]).disconnected).toHaveLength(1)
    const hole: any = { type: "pcb_plated_hole", pcb_plated_hole_id: "plated", shape: "circle", x: 1, y: 0,
      outer_diameter: 0.5, hole_diameter: 0.2, layers: ["top", "bottom"] }
    expect(analyzePhysicalCopper([...json, hole, routed]).disconnected).toEqual([])
  })
  test("a repeated wire endpoint inside a drilled via is not a floating copper disk", () => {
    const routed: any = { type: "pcb_trace", pcb_trace_id: "stub", route: [
      { route_type: "wire", x: 0, y: 0, width: 0.1, layer: "top" },
      { route_type: "wire", x: 1, y: 0, width: 0.1, layer: "top" },
      { route_type: "via", x: 1, y: 0, from_layer: "top", to_layer: "bottom" },
      { route_type: "wire", x: 1, y: 0, width: 0.1, layer: "bottom" },
    ] }
    expect(analyzePhysicalCopper([...fixture(), via(1), routed]).unanchoredCopper).toEqual([])
  })
  test("a pour hole isolates copper inside it", () => {
    const pour: any = { type: "pcb_copper_pour", pcb_copper_pour_id: "pour", shape: "brep", layer: "top", source_net_id: "n",
      brep_shape: { outer_ring: ring([[-1, -1], [3, -1], [3, 1], [-1, 1]]),
        inner_rings: [ring([[1.5, -0.5], [2.5, -0.5], [2.5, 0.5], [1.5, 0.5]])] } }
    expect(analyzePhysicalCopper([...fixture(), pour]).disconnected).toHaveLength(1)
    pour.brep_shape.inner_rings = []
    expect(analyzePhysicalCopper([...fixture(), pour]).disconnected).toEqual([])
  })
  test("touching an NC pad is an unintended connection", () => {
    expect(analyzePhysicalCopper([...fixture(), trace("top", 0, 4)]).shorts).toHaveLength(1)
  })
  test("source-net mutation remains visible even when copper connects the pins", () => {
    const baseline = fixture(), altered = structuredClone(baseline) as any[]
    altered.find(e => e.source_trace_id === "st1").connected_source_net_ids = []
    const result = analyzePhysicalCopper([...altered, trace()], sourceConnectivity(baseline))
    expect(result.sourceSignature).not.toBe(sourceConnectivity(baseline).signature)
  })
  test("a 0.095 mm gap fails a 0.1 mm rule without a tolerance waiver", () => {
    const json = fixture() as any[]
    json.find(e => e.pcb_smtpad_id === "pad2").x = 2.695
    const violations = analyzePhysicalCopper(json).clearanceViolations
    expect(violations).toHaveLength(1)
    expect(violations[0]!.actual).toBeCloseTo(0.095, 9)
    expect(violations[0]!.minimum).toBe(0.1)
  })
})
