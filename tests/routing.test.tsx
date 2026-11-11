import { beforeAll, describe, expect, test } from "bun:test"
import { createHash } from "node:crypto"
import type { PcbTraceRoutePoint } from "circuit-json"
import * as checks from "@tscircuit/checks"
import routingData from "../src/board/routing-data.json"
import type { RoutedCopperData } from "../src/board/routed-copper"
import { assertCopperAssociations } from "./helpers/copper-associations"
import { analyzePhysicalCopper, drillSmtClearanceViolations, pouredCorridorCovered, roundDrillToPourClearance, solderMaskSpacingViolations, sourceConnectivity } from "./helpers/physical-copper"
import { inspectThermalVias } from "./helpers/thermal-vias"
import { boardFixture, FIXTURE_RENDER_TIMEOUT } from "./fixtures"

let circuit: Awaited<ReturnType<typeof boardFixture>>
let physical: ReturnType<typeof analyzePhysicalCopper>
const routeKey = (sourceTraceId: string | undefined, route: PcbTraceRoutePoint[]) => JSON.stringify([
  sourceTraceId, route.map(point => point.route_type === "wire"
    ? ["wire", point.x, point.y, point.width, point.layer]
    : point.route_type === "via" ? ["via", point.x, point.y, point.from_layer, point.to_layer]
      : ["through_pad", point.start, point.end, point.width, point.start_layer, point.end_layer]),
])
beforeAll(async () => {
  circuit = await boardFixture()
  physical = analyzePhysicalCopper(circuit.getCircuitJson())
}, FIXTURE_RENDER_TIMEOUT)

describe("complete PCB routing", () => {
  test("routing preserves the original named pins, NC pins and electrical net partition", () => {
    // Expand the USB4110's four paired mating contacts to the original pin IDs.
    const pairedContacts = new Map([["2", "9"], ["3", "10"], ["7", "15"], ["8", "16"]])
    const { groups, internalKeys } = sourceConnectivity(circuit.getCircuitJson())
    const matingGroups = groups.map(({ nets, ports }) => ({ nets, ports: ports.flatMap(port => {
      const [name, pin] = port.split(".")
      const other = pairedContacts.get(pin!)
      return (name === "J_USB" || name === "J_PROGRAM") && other ? [port, `${name}.${other}`] : [port]
    }).sort() })).sort((a, b) => a.ports.join() < b.ports.join() ? -1 : a.ports.join() > b.ports.join() ? 1 : 0)
    const originalNetlist = "2df111c39b7d3294a0155048451ab575d62202339edb9e6157b2c3a0de41d77b"
    expect(createHash("sha256").update(JSON.stringify(matingGroups)).digest("hex"))
      .toBe(originalNetlist)
    expect(physical.requiredPortCount).toBe(422)
    expect(physical.groups).toHaveLength(76)
    expect(physical.ignoredNcPortCount).toBe(39)
    // Physical package metal is limited to the original connector shells and
    // verified USBLC6 flow-through conductors; it cannot stand in for PCB wires.
    const packageMetal = [
      ...["J_USB", "J_PROGRAM"].map(name => [17, "pin17_internal_1", "pin17_internal_2", "pin17_internal_3"].map(pin => `${name}.${pin}`)),
      ...["U_PROGRAM_ESD", "U_SENSOR_ESD"].flatMap(name => [[1, 6], [3, 4]].map(pins => pins.map(pin => `${name}.${pin}`))),
    ].map(pins => pins.sort().join()).sort()
    expect([...new Set(internalKeys.map(pins => pins.sort().join()))].sort())
      .toEqual(packageMetal)
  })

  test("actual copper joins every required pin with no shorts, floating copper or invalid pours", () => {
    expect(physical.missingPorts).toEqual([])
    expect(physical.disconnected).toEqual([])
    expect(physical.shorts).toEqual([])
    expect(physical.invalid).toEqual([])
    expect(physical.unanchoredCopper).toEqual([])
    expect(physical.clearanceViolations).toEqual([])
    const ground = circuit.db.source_net.list().find(net => net.name === "GND")!
    expect(circuit.db.pcb_copper_pour.list().some(pour => pour.source_net_id === ground.source_net_id)).toBe(true)
  })

  test("saved copper renders with finite coordinates, legal widths and physical through vias", () => {
    assertCopperAssociations(circuit.getCircuitJson(), routingData as RoutedCopperData)
    const board = circuit.db.pcb_board.list()[0]!
    const traces = circuit.db.pcb_trace.list()
    expect(board.min_trace_width).toBeGreaterThanOrEqual(0.2)
    expect(board.min_trace_to_pad_edge_clearance).toBeGreaterThanOrEqual(0.17)
    expect(board.min_pad_edge_to_pad_edge_clearance).toBeGreaterThanOrEqual(0.17)
    expect(board.min_via_edge_to_pad_edge_clearance).toBeGreaterThanOrEqual(0.17)
    expect(board.min_via_hole_diameter).toBeGreaterThanOrEqual(0.3)
    expect(board.min_via_pad_diameter).toBeGreaterThanOrEqual(0.6)
    expect(board.min_trace_to_hole_edge_clearance).toBeGreaterThanOrEqual(0.25)
    expect(board.min_via_hole_edge_to_via_hole_edge_clearance).toBeGreaterThanOrEqual(0.25)
    expect(board.min_board_edge_clearance).toBeGreaterThanOrEqual(0.3)
    expect(routingData.routes.length).toBeGreaterThan(0)
    expect(traces.length).toBeGreaterThanOrEqual(routingData.routes.length)
    const rendered = new Map<string, number>()
    for (const trace of traces) {
      const key = routeKey(trace.source_trace_id, trace.route)
      rendered.set(key, (rendered.get(key) ?? 0) + 1)
    }
    const missingRoutes: string[] = []
    for (const [index, route] of (routingData as RoutedCopperData).routes.entries()) {
      const key = routeKey(route.sourceTraceId, route.route), count = rendered.get(key) ?? 0
      if (!count) missingRoutes.push(`${index}: ${route.net}`)
      else rendered.set(key, count - 1)
    }
    expect(missingRoutes).toEqual([])
    for (const trace of traces) {
      expect(trace.route.filter(point => point.route_type === "wire").length).toBeGreaterThanOrEqual(2)
      for (const point of trace.route) {
        const coordinates = point.route_type === "through_pad" ? [point.start, point.end] : [point]
        expect(coordinates.every(p => Number.isFinite(p.x) && Number.isFinite(p.y))).toBe(true)
        if (point.route_type === "wire") expect(point.width).toBeGreaterThanOrEqual(board.min_trace_width! - 1e-9)
      }
    }
    const layers = ["top", ...Array.from({ length: board.num_layers - 2 }, (_, i) => `inner${i + 1}`), "bottom"].sort()
    expect(circuit.db.pcb_via.list().length).toBeGreaterThanOrEqual(routingData.vias.length)
    for (const via of circuit.db.pcb_via.list()) {
      expect(via.layers.map(String).sort()).toEqual(layers)
      expect(via.hole_diameter).toBeGreaterThanOrEqual(board.min_via_hole_diameter!)
      expect(via.outer_diameter).toBeGreaterThanOrEqual(board.min_via_pad_diameter!)
      expect(via.outer_diameter - via.hole_diameter).toBeGreaterThanOrEqual(0.15)
    }
  })

  test("the connector locator drills clear the copper pours and both outer layers retain 0.20 mm mask dams", () => {
    const holes = circuit.db.pcb_hole.list()
    const diameters = holes.map(hole => {
      if (hole.hole_shape !== "circle") throw new Error("Expected a round locator drill")
      expect(roundDrillToPourClearance(circuit.getCircuitJson(), hole.x, hole.y, hole.hole_diameter))
        .toBeGreaterThanOrEqual(0.2)
      return hole.hole_diameter
    }).sort((a, b) => a - b)
    expect(diameters).toEqual([0.65, 0.65, 0.65, 0.65, 1.25])
    expect(solderMaskSpacingViolations(circuit.getCircuitJson())).toEqual([])
  })

  test("original crystal limits hold even for copper without source-trace associations", () => {
    for (const net of ["XIN", "XOUT_CRYSTAL"]) {
      const metric = physical.metricsForNet(net)
      expect(metric.traceLengthMm).toBeGreaterThan(0)
      expect(metric.traceLengthMm).toBeLessThanOrEqual(10 + 1e-6)
      expect(metric.viaCount).toBe(0)
    }
  })

  test("main power corridors retain broad clipped copper and the fan header retains its 0.6 mm branch", () => {
    // These are physical trunk sections, not a width imposed on every sense,
    // bootstrap and ground branch. Package escapes and local necks still need
    // the thermal qualification documented in docs/pcb-fabrication.md.
    for (const [net, x1, y1, x2, y2] of [
      ["DRIVER_SW1", -5.55, 20.5, -5.55, 24],
      ["DRIVER_SW2", 5.55, 20.5, 5.55, 24],
      ["VBUS_QUALIFIED", -9.5, 6, -5.5, 6],
      ["DRIVER_OUT", 11, 15, 16, 15],
      ["TEC_POS", 24.35, 14.5, 24.35, 18],
      ["TEC_POS", 20.5, 21, 27.5, 21],
    ] as const) expect(pouredCorridorCovered(circuit.getCircuitJson(), net, "top",
      { x: x1, y: y1 }, { x: x2, y: y2 }, 3), `${net} power corridor must contain 3 mm of clipped copper`).toBe(true)
    const fanHeader = (routingData as RoutedCopperData).routes.find(r => r.net === "FAN_12V" &&
      r.route.some(p => p.route_type === "wire" && Math.abs(p.y + 29.39) < 1e-6))!
    expect(fanHeader).toBeDefined()
    expect(Math.min(...fanHeader.route.filter(p => p.route_type === "wire").map(p => p.width))).toBeGreaterThanOrEqual(0.6)
    const logicTrunk = (routingData as RoutedCopperData).routes.find(r => r.net === "CTRL_3V3" &&
      r.route.some(p => p.route_type === "wire" && p.layer === "inner2" && p.x === 17.7 && p.y === -19))!
    expect(logicTrunk).toBeDefined()
    const inner = logicTrunk.route.filter(p => p.route_type === "wire").filter(p => p.layer === "inner2")
    expect(Math.min(...inner.map(p => p.width))).toBeGreaterThanOrEqual(0.6)
    // 30 um inner copper versus 70 um outer copper; include the 0.8 mm
    // outer lead from the supply junction. This local link stays below
    // 6 mm equivalent 0.2 mm outer-copper length (previous link: 4.86 mm).
    const equivalentLength = inner.slice(1).reduce((sum, p, i) => sum +
      Math.hypot(p.x - inner[i]!.x, p.y - inner[i]!.y) * (70 / 30) * (0.2 / inner[i]!.width), 0) + 0.8
    expect(equivalentLength).toBeLessThanOrEqual(6)
  })

  test("full-board native connectivity and geometry checks pass", async () => {
    const json = circuit.getCircuitJson()
    const strictJson = structuredClone(json)
    // The fabrication process may permit filled/capped via-in-pad globally;
    // validation always restores the strict rule before the exact-pair waiver.
    const board = strictJson.find(item => item.type === "pcb_board")!
    board.is_via_in_pad_allowed = false
    const native = [
      ...await checks.runAllRoutingChecks(structuredClone(strictJson)),
      ...await checks.runAllPlacementChecks(structuredClone(strictJson)),
    ]
    expect(json.filter(item => item.type === "source_unnamed_trace_warning" ||
      item.type === "pcb_trace_warning" || item.type === "pcb_trace_style_warning")).toEqual([])
    const thermal = inspectThermalVias(json)
    expect(thermal.missing).toEqual([])
    expect(thermal.invalid).toEqual([])
    expect(thermal.allowedErrorIds.size).toBe(13)
    expect(drillSmtClearanceViolations(json, thermal.allowedErrorIds)).toEqual([])
    // Keep original diagnostics intact. Native rechecks identify exact pad/via
    // pairs; core renumbers embedded duplicates, so match only their exact text.
    // Every fresh native error is still checked by ID (not rounded coordinates).
    const allowedEmbeddedMessages = new Set(native.filter(item => item.type === "pcb_placement_error" &&
      thermal.allowedErrorIds.has(item.pcb_placement_error_id)).map(item => item.message))
    const errors = [
      ...native.filter(item => item.type.endsWith("_error") &&
        !(item.type === "pcb_placement_error" && thermal.allowedErrorIds.has(item.pcb_placement_error_id))),
      ...json.filter(item => item.type.endsWith("_error") &&
        !(item.type === "pcb_placement_error" && allowedEmbeddedMessages.has(item.message))),
    ]
    expect(errors).toEqual([])
  }, 180_000)
})
