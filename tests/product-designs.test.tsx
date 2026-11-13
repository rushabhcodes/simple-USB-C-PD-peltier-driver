import { describe, expect, test } from "bun:test"
import { Circuit } from "tscircuit"
import { DraftBoard, referenceElements, isPart } from "../designs/boards"

describe("product designs — review cycle 1", () => {
  test("the baseline partition accounts for every purchased placement and debug pad", () => {
    const parts = referenceElements().filter(isPart)
    expect(parts).toHaveLength(150)
    expect(new Set(parts.map(p => p.props.name)).size).toBe(150)
  })

  test.each(["lite", "modular-power", "modular-control"] as const)("%s is a separate source design with no copied copper", id => {
    const board = DraftBoard({ id })
    expect(board.props.routingDisabled).toBe(true)
    expect(board.props.title).toContain("UNROUTED")
    expect(JSON.stringify(board.props.children)).not.toContain("source_trace_id")
  })

  test("Lite removes accessories and explicitly marks the two unused MCU inputs NC", async () => {
    const circuit = new Circuit({ platform: { pcbDisabled: true, schematicDisabled: true, partsEngineDisabled: true } })
    circuit.add(<DraftBoard id="lite" />)
    await circuit.renderUntilSettled()
    const json = circuit.getCircuitJson()
    const parts = circuit.db.source_component.list()
    expect(parts.filter(p => p.ftype !== "simple_test_point")).toHaveLength(115)
    expect(parts.map(p => p.name)).not.toContain("U_FAN")
    expect(parts.map(p => p.name)).not.toContain("J_HOT_SENSOR")
    expect(json.filter(e => e.type.endsWith("_error"))).toEqual([])
    const mcu = parts.find(p => p.name === "U_MCU")!
    const pins = circuit.db.source_port.list().filter(p => p.source_component_id === mcu.source_component_id)
    expect(pins.filter(p => [11, 12].includes(p.pin_number!))).toHaveLength(2)
    expect(pins.filter(p => [11, 12].includes(p.pin_number!)).every(p => p.do_not_connect)).toBe(true)
  }, 60_000)
})
