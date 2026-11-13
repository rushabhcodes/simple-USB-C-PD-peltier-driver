import { createHash } from "node:crypto"
import type { AnyCircuitElement } from "circuit-json"
import * as checks from "@tscircuit/checks"
import type { RoutedCopperData } from "../src/board/routed-copper"
import original from "../src/board/routing-data.json"
import { assertCopperAssociations } from "../tests/helpers/copper-associations"
import { analyzePhysicalCopper, drillSmtClearanceViolations, pouredCorridorCovered, solderMaskSpacingViolations } from "../tests/helpers/physical-copper"
import { inspectThermalVias, THERMAL_ARRAYS } from "../tests/helpers/thermal-vias"
import { placementIssues } from "./audit"
import type { DraftBoardId } from "./boards"

export type RoutedBoardId = DraftBoardId | "standard"
export const copperRouteKey = (route: any[]) => JSON.stringify(route.map(p =>
  [p.route_type, p.x, p.y, p.width, p.layer, p.from_layer, p.to_layer]))

export async function reviewBoardRouting(id: RoutedBoardId, json: AnyCircuitElement[], copper: RoutedCopperData) {
  const physical = analyzePhysicalCopper(json)
  const arrays = THERMAL_ARRAYS.filter(a => id === "standard" || id === "lite" ||
    (id === "modular-control" ? a.component === "U_MCU" : a.component === "U_PD"))
    .map(a => ({ ...a, y: a.y.map(y => y + (id === "modular-control" ? 12 : 0)) }))
  const thermal = inspectThermalVias(json, arrays)
  const strict = structuredClone(json)
  const board = strict.find(e => e.type === "pcb_board")
  if (!board) throw new Error(`Missing ${id} board`)
  board.is_via_in_pad_allowed = false
  const native = [...await checks.runAllRoutingChecks(strict), ...await checks.runAllPlacementChecks(strict)]
  const waived = (e: AnyCircuitElement) => e.type === "pcb_placement_error" && thermal.allowedErrorIds.has(e.pcb_placement_error_id)
  const allowedMessages = new Set(native.filter(waived).map(e => (e as any).message))
  const errors = [...native.filter(e => e.type.endsWith("_error") && !waived(e)),
    ...json.filter(e => e.type.endsWith("_error") && !(e.type === "pcb_placement_error" && allowedMessages.has(e.message)))]
  let associationError: string | null = null
  try { assertCopperAssociations(json, copper) } catch (e) { associationError = String(e) }
  const drills = drillSmtClearanceViolations(json, thermal.allowedErrorIds)
  const mask = solderMaskSpacingViolations(json)
  const placement = placementIssues(json)
  const crystals = id === "modular-power" ? [] : ["XIN", "XOUT_CRYSTAL"].map(net => ({ net, ...physical.metricsForNet(net) }))
  const crystalErrors = crystals.filter(m => m.traceLengthMm <= 0 || m.traceLengthMm > 10 + 1e-6 || m.viaCount !== 0)
  const corridors = id === "modular-control" ? [] : [
    ["DRIVER_SW1", -5.55, 20.5, -5.55, 24], ["DRIVER_SW2", 5.55, 20.5, 5.55, 24],
    ["VBUS_QUALIFIED", -9.5, 6, -5.5, 6], ["DRIVER_OUT", 11, 15, 16, 15],
    ["TEC_POS", 24.35, 14.5, 24.35, 18], ["TEC_POS", 20.5, 21, 27.5, 21],
  ].map(([net, x1, y1, x2, y2]) => ({ net: String(net), covered: pouredCorridorCovered(json, String(net), "top",
    { x: Number(x1), y: Number(y1) }, { x: Number(x2), y: Number(y2) }, 3) }))
  const savedKeys = new Set(copper.routes.map(r => `${r.net}:${copperRouteKey(r.route)}`))
  const missingKelvinRoutes = id === "modular-control" ? [] : original.routes.filter(r =>
    ["DRIVER_ISP", "DRIVER_ISN"].includes(r.net) && !savedKeys.has(`${r.net}:${copperRouteKey(r.route)}`))
    .map(r => r.sourceTraceKey)
  const geometryIssues = physical.shorts.length + physical.clearanceViolations.length + physical.unanchoredCopper.length +
    physical.invalid.length + drills.length + mask.length + placement.length + thermal.missing.length + thermal.invalid.length +
    errors.length + crystalErrors.length + corridors.filter(c => !c.covered).length + missingKelvinRoutes.length + Number(!!associationError)
  return {
    id, routingComplete: physical.missingPorts.length === 0 && physical.disconnected.length === 0 && geometryIssues === 0,
    manufacturingReady: false, traceCount: json.filter(e => e.type === "pcb_trace").length,
    viaCount: json.filter(e => e.type === "pcb_via").length, pourCount: json.filter(e => e.type === "pcb_copper_pour").length,
    requiredPins: physical.requiredPortCount, ignoredNcPins: physical.ignoredNcPortCount,
    sourceSignatureSha256: createHash("sha256").update(physical.sourceSignature).digest("hex"),
    missingPorts: physical.missingPorts, disconnected: physical.disconnected, shorts: physical.shorts,
    clearanceViolations: physical.clearanceViolations, floatingCopper: physical.unanchoredCopper, invalidPours: physical.invalid,
    drillClearanceViolations: drills, solderMaskViolations: mask, placementIssues: placement,
    thermalVias: { checkedPairs: thermal.allowedErrorIds.size, missing: thermal.missing, invalid: thermal.invalid },
    associationError, nativeErrors: errors, crystals, crystalErrors, powerCorridors: corridors, missingKelvinRoutes,
    warnings: json.filter(e => e.type.endsWith("_warning")),
  }
}
