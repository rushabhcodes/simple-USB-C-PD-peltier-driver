import { beforeAll, describe, expect, test } from "bun:test"
import { Circuit } from "tscircuit"
import { GeneralPdDriverBoard } from "../src/board/general-pd"
import { placedComponents, FIXTURE_RENDER_TIMEOUT } from "./fixtures"

let circuit: InstanceType<typeof Circuit>
const functionalSheets = {
  PD: "U_PD", POWER: "U_DRIVER", LOGIC: "U_AUX", MCU: "U_MCU",
  MCU_POWER: "C_MCU_BULK", MONITOR: "R_V_ADC_TOP", DEBUG: "TP_SWDIO",
  FAN: "U_FAN", SENSORS: "J_HOT_SENSOR",
}

beforeAll(async () => {
  // Exercise native schematic rendering and DRC using the committed parts;
  // accessory meshes and live catalog enrichment are unrelated to this test.
  circuit = new Circuit({ platform: { partsEngineDisabled: true } })
  circuit.add(<GeneralPdDriverBoard />)
  await circuit.renderUntilSettled()
}, FIXTURE_RENDER_TIMEOUT)

describe("readable functional schematics", () => {
  test("all functional sheets use A4 styling and render without errors or schematic warnings", () => {
    const json = circuit.getCircuitJson()
    expect(json.filter(item => item.type.endsWith("_error"))
      .map(item => "message" in item ? item.message : item.type)).toEqual([])
    expect(json.filter(item => item.type.endsWith("_warning") && (item.type.startsWith("schematic_") ||
      ("property_name" in item && typeof item.property_name === "string" && item.property_name.startsWith("sch"))))
      .map(item => "message" in item ? item.message : item.type)).toEqual([])
    const sheets = circuit.db.schematic_sheet.list()
    expect(sheets.map(sheet => sheet.name).sort()).toEqual(Object.keys(functionalSheets).sort())
    expect(sheets.filter(sheet => sheet.sheet_size !== "a4" || sheet.sheet_width !== 297 || sheet.sheet_height !== 210)
      .map(sheet => sheet.name)).toEqual([])
    for (const [name, anchor] of Object.entries(functionalSheets)) {
      const sheet = sheets.find(sheet => sheet.name === name)!
      const source = circuit.db.source_component.list().find(part => part.name === anchor)!
      expect(circuit.db.schematic_component.list().some(symbol =>
        symbol.source_component_id === source.source_component_id && symbol.schematic_sheet_id === sheet.schematic_sheet_id)).toBe(true)
    }
  })

  test("every physical part and exposed debug pad has a finite, separated schematic symbol", () => {
    const sources = new Map(circuit.db.source_component.list().map(part => [part.source_component_id, part.name]))
    const symbols = circuit.db.schematic_component.list()
    const represented = new Set(symbols.map(symbol => symbol.source_component_id))
    expect(placedComponents(circuit).filter(part => !represented.has(part.source_component_id))
      .map(part => sources.get(part.source_component_id))).toEqual([])
    const sheets = new Set(circuit.db.schematic_sheet.list().map(sheet => sheet.schematic_sheet_id))
    const sheetNames = new Map(circuit.db.schematic_sheet.list().map(sheet => [sheet.schematic_sheet_id, sheet.name]))
    expect(symbols.filter(symbol => !sheets.has(symbol.schematic_sheet_id!)).map(symbol => sources.get(symbol.source_component_id!))).toEqual([])
    expect(symbols.filter(symbol => !Number.isFinite(symbol.center.x) || !Number.isFinite(symbol.center.y) ||
      !Number.isFinite(symbol.size.width) || !Number.isFinite(symbol.size.height) ||
      symbol.size.width <= 0 || symbol.size.height <= 0).map(symbol => sources.get(symbol.source_component_id!))).toEqual([])
    // Native sizes are final symbol-body bounds, including custom graphics.
    // Compare instances rather than refdes so split MCU units are covered too.
    const overlaps: string[] = []
    for (let i = 0; i < symbols.length; i++) {
      for (let j = i + 1; j < symbols.length; j++) {
        const a = symbols[i]!, b = symbols[j]!
        if (a.schematic_sheet_id === b.schematic_sheet_id &&
          Math.abs(a.center.x - b.center.x) < (a.size.width + b.size.width) / 2 - 0.01 &&
          Math.abs(a.center.y - b.center.y) < (a.size.height + b.size.height) / 2 - 0.01)
          overlaps.push(`${sheetNames.get(a.schematic_sheet_id!)}: ${sources.get(a.source_component_id!)} / ${sources.get(b.source_component_id!)}`)
      }
    }
    expect(overlaps).toEqual([])
  })

  test("splitting the MCU drawing preserves one physical RP2040 and every real package pin", () => {
    const mcus = circuit.db.source_component.list().filter(part => part.manufacturer_part_number === "RP2040")
    expect(mcus).toHaveLength(1)
    const mcu = mcus[0]!
    expect(circuit.db.pcb_component.list().filter(part => part.source_component_id === mcu.source_component_id)).toHaveLength(1)
    const pins = circuit.db.source_port.list().filter(port => port.source_component_id === mcu.source_component_id)
    expect(pins.map(port => port.pin_number).sort((a, b) => a! - b!)).toEqual(Array.from({ length: 57 }, (_, index) => index + 1))
    const expected = pins.map(port => port.source_port_id).sort()
    const physical = new Set(circuit.db.pcb_port.list().map(port => port.source_port_id).filter(id => expected.includes(id)))
    const drawn = new Set(circuit.db.schematic_port.list().map(port => port.source_port_id).filter(id => id && expected.includes(id)))
    expect([...physical].sort()).toEqual(expected)
    // Duplicate ground/power references are valid; no package pin may vanish.
    expect([...drawn].sort()).toEqual(expected)
  })

  test("capacitor package aliases remain usable when their schematic symbols rotate", () => {
    const capacitors = circuit.db.source_component.list().filter(part => part.ftype === "simple_capacitor")
    expect(capacitors.length).toBeGreaterThan(0)
    const ids = new Set(capacitors.map(part => part.source_component_id))
    expect(circuit.db.schematic_component.list().some(symbol => ids.has(symbol.source_component_id!) &&
      (symbol.symbol_name === "capacitor_down" || symbol.symbol_name === "capacitor_up"))).toBe(true)
    const ports = circuit.db.source_port.list()
    const invalid = capacitors.filter(part => {
      const pins = ports.filter(port => port.source_component_id === part.source_component_id)
      return pins.length !== 2 || ![[1, "pos", "neg"], [2, "neg", "pos"]].every(([number, alias, opposite]) => {
        const pin = pins.find(port => port.pin_number === number)
        return pin?.name === `pin${number}` && pin.port_hints?.includes(String(alias)) &&
          !pin.port_hints?.includes(String(opposite))
      })
    }).map(part => part.name)
    expect(invalid).toEqual([])
  })
})
