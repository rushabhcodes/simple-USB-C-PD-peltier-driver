import { expect, test } from "bun:test"
import type { AnyCircuitElement } from "circuit-json"
import { checkPcbTraceLengths, checkTracesAreContiguous } from "@tscircuit/checks"
import type { RoutedCopperData } from "../src/board/routed-copper"
import { assertStableSourceIds, enrichCopper, formatRoutingData } from "../scripts/helpers/routing"
import { assertCopperAssociations } from "./helpers/copper-associations"
import { analyzePhysicalCopper } from "./helpers/physical-copper"

const source = [
  { type: "source_component", source_component_id: "c", name: "IC" },
  { type: "source_net", source_net_id: "n", name: "N" },
  ...[0, 1].flatMap(i => [
    { type: "source_port", source_port_id: `s${i}`, source_component_id: "c", pin_number: i + 1 },
    { type: "source_trace", source_trace_id: `t${i}`, connected_source_port_ids: [`s${i}`], connected_source_net_ids: ["n"], ...(i === 0 ? { max_length: 2 } : {}) },
    { type: "pcb_port", pcb_port_id: `p${i}`, source_port_id: `s${i}`, x: i * 5, y: 0, layers: ["top"] },
    { type: "pcb_smtpad", pcb_smtpad_id: `pad${i}`, pcb_port_id: `p${i}`, shape: "rect", x: i * 5, y: 0, width: 0.6, height: 0.6, layer: "top" },
  ]),
] as AnyCircuitElement[]
const data: RoutedCopperData = { vias: [], routes: [
  { net: "N", sourcePort: "IC.pin1", route: [0.25, 1].map(x => ({ route_type: "wire", x, y: 0, width: 0.2, layer: "top" })) },
  { net: "N", route: [2, 3].map(x => ({ route_type: "wire", x, y: 0, width: 0.2, layer: "top" })) },
] }

test("rebinding regenerates IDs without changing copper or borrowing branch constraints", () => {
  const bound = enrichCopper(source, data)
  expect(bound.routes.map(route => route.sourceTraceId)).toEqual(["t0", "t1"])
  const reordered = source.map(item => item.type === "source_trace" ? { ...item, source_trace_id: item.source_trace_id === "t0" ? "t1" : "t0" } : item)
  expect(() => assertCopperAssociations(reordered, bound)).toThrow()
  const rebound = enrichCopper(reordered, bound)
  expect(rebound.routes.map(route => route.sourceTraceId)).toEqual(["t1", "t0"])
  expect(rebound.routes.map(route => route.route)).toEqual(data.routes.map(route => route.route))
  expect(() => assertCopperAssociations(reordered, rebound)).not.toThrow()
})

test("a global trunk touching a capacitor does not inherit its local length limit", () => {
  const copper = structuredClone(data)
  copper.routes[1]!.route[0]!.x = 0.25
  copper.routes[1]!.route[1]!.x = 20
  const emitted = (bound: RoutedCopperData) => [...source, ...bound.routes.map((route, i) => ({
    type: "pcb_trace", pcb_trace_id: `r${i}`, source_trace_id: route.sourceTraceId, route: route.route,
  }))] as AnyCircuitElement[]
  const bound = enrichCopper(source, copper)
  expect(bound.routes.map(route => route.sourceTraceId)).toEqual(["t0", "t1"])
  expect(checkPcbTraceLengths(emitted(bound))).toEqual([])
  copper.routes[0]!.route[1]!.x = 3
  const tooLong = enrichCopper(source, copper)
  expect(tooLong.routes[0]!.sourceTraceId).toBe("t0")
  expect(checkPcbTraceLengths(emitted(tooLong))).toMatchObject([
    { source_trace_id: "t0", maximum_trace_length: 2, actual_trace_length: 2.75 },
  ])
  expect(tooLong.routes.map(route => route.route)).toEqual(copper.routes.map(route => route.route))
})

test("rebinding rejects lost constraint ownership and ambiguous constrained sources", () => {
  const bound = enrichCopper(source, data)
  delete bound.routes[0]!.sourcePort
  expect(() => enrichCopper(source, bound)).toThrow("retain its saved single-pin constraint")
  const ambiguous = [...source, {
    type: "source_trace", source_trace_id: "other", connected_source_port_ids: ["s0"],
    connected_source_net_ids: ["n"], max_via_count: 0,
  }] as AnyCircuitElement[]
  expect(() => enrichCopper(ambiguous, data)).toThrow("ambiguous constrained")
})

test("multi-pin constraints require every endpoint and take priority over generic traces", () => {
  const paired = [...source.filter(item => item.type !== "source_trace" || item.source_trace_id !== "t0"), {
    type: "source_trace", source_trace_id: "pair", connected_source_port_ids: ["s0", "s1"],
    connected_source_net_ids: ["n"], max_length: 6,
  }] as AnyCircuitElement[]
  const copper = structuredClone(data)
  copper.routes[0]!.route[1]!.x = 5
  delete copper.routes[0]!.sourcePort
  expect(enrichCopper(paired, copper).routes[0]!.sourceTraceId).toBe("pair")
  expect(() => enrichCopper(paired, data)).toThrow("every endpoint")
})

test("pour trunks prefer a source pin represented by reachable trace copper", () => {
  const circuit = [...source.map(item => item.type === "source_trace" ? { ...item, max_length: undefined } : item),
    { type: "pcb_board", pcb_board_id: "board", center: { x: 2.5, y: 0 }, width: 8, height: 3, num_layers: 2 },
    { type: "pcb_copper_pour", pcb_copper_pour_id: "pour", shape: "rect", layer: "top", source_net_id: "n",
      center: { x: 2.5, y: 0 }, width: 6, height: 1 },
  ] as AnyCircuitElement[]
  const copper = structuredClone(data)
  delete copper.routes[0]!.sourcePort
  copper.routes[0]!.route[0]!.x = 5
  copper.routes[0]!.route[1]!.x = 2
  const bound = enrichCopper(circuit, copper)
  // t0 belongs to the same net but its pad has no trace endpoint; t1 does.
  expect(bound.routes.map(route => route.sourceTraceId)).toEqual(["t1", "t1"])
  const emitted = [...circuit, ...bound.routes.map((route, i) => ({
    type: "pcb_trace", pcb_trace_id: `r${i}`, source_trace_id: route.sourceTraceId, route: route.route,
  }))] as AnyCircuitElement[]
  expect(analyzePhysicalCopper(emitted).disconnected).toEqual([])
  expect(checkTracesAreContiguous(emitted)).toEqual([])
  const trunk = emitted.find(item => item.type === "pcb_trace" && item.pcb_trace_id === "r1")!
  if (trunk.type !== "pcb_trace") throw Error("Missing trunk")
  trunk.source_trace_id = "t0"
  expect(checkTracesAreContiguous(emitted)).toMatchObject([{ source_trace_id: "t0" }])
})

test("two-phase guard permits net renumbering but rejects changed source pins", () => {
  const renumbered = source.map(item => item.type === "source_net" ? { ...item, source_net_id: "new" } :
    item.type === "source_trace" ? { ...item, connected_source_net_ids: ["new"] } : item)
  expect(() => assertStableSourceIds(source, renumbered)).not.toThrow()
  const changed = renumbered.map(item => item.type === "source_port" ? { ...item, pin_number: 9 } : item)
  expect(() => assertStableSourceIds(source, changed)).toThrow("between renders")
})

test("compact serialization keeps exact coordinates and escaped source signatures", () => {
  const bound = enrichCopper(source, data)
  bound.routes[0]!.route[0]!.x = 0.12345678901234567
  const text = formatRoutingData(bound)
  expect(JSON.parse(text)).toEqual(bound)
  expect(text).toContain('{ "route_type": "wire", "x": 0.12345678901234566,')
  expect(text).toContain(JSON.stringify(bound.routes[0]!.sourceTraceKey))
})
