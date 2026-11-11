import { beforeAll, describe, expect, test } from "bun:test"
import { Circuit } from "tscircuit"
import { computeGapBetweenCopper } from "@tscircuit/circuit-json-util"
import { boardFixture, FIXTURE_RENDER_TIMEOUT, placedComponents } from "./fixtures"

let circuit: InstanceType<typeof Circuit>
const roots = new Map<string, string>()
function root(id: string): string {
  const parent = roots.get(id)
  if (!parent || parent === id) return id
  const result = root(parent)
  roots.set(id, result)
  return result
}

beforeAll(async () => {
  circuit = await boardFixture()
  // Follow source wiring transitively so an accidental port-to-port or
  // net-to-net bridge cannot hide behind otherwise correct named connections.
  const join = (ids: string[]) => {
    if (!ids.length) return
    const first = root(ids[0]!)
    for (const id of ids.slice(1)) roots.set(root(id), first)
  }
  for (const trace of circuit.db.source_trace.list())
    join([...trace.connected_source_port_ids, ...trace.connected_source_net_ids])
  for (const part of circuit.db.source_component.list())
    for (const ports of part.internally_connected_source_port_ids ?? []) join(ports)
}, FIXTURE_RENDER_TIMEOUT)

function component(name: string) {
  const part = circuit.db.source_component.list().find(item => item.name === name)
  if (!part) throw new Error(`Missing component ${name}`)
  return part
}

function sourcePin(name: string, pin: number) {
  const port = circuit.db.source_port.list().find(item =>
    item.source_component_id === component(name).source_component_id && item.pin_number === pin)
  if (!port) throw new Error(`Missing physical pin ${name}.${pin}`)
  return port
}

function physicalPin(name: string, pin: number) {
  const port = sourcePin(name, pin)
  const placed = circuit.db.pcb_port.list().find(item => item.source_port_id === port.source_port_id)
  if (!placed) throw new Error(`Missing PCB port ${name}.${pin}`)
  return placed
}

function pinNet(name: string, pin: number) {
  const port = sourcePin(name, pin)
  const nets = circuit.db.source_net.list().filter(net =>
    root(net.source_net_id) === root(port.source_port_id))
  if (nets.length > 1) throw new Error(`Conflicting nets on ${name}.${pin}: ${nets.map(net => net.name)}`)
  return nets[0]?.name
}

function resistance(name: string) {
  const part = component(name)
  if (!("resistance" in part)) throw new Error(`Missing resistance for ${name}`)
  return Number(part.resistance)
}

function capacitance(name: string) {
  const part = component(name)
  if (!("capacitance" in part)) throw new Error(`Missing capacitance for ${name}`)
  return Number(part.capacitance)
}

function directCapacitance(rail: string) {
  return circuit.db.source_component.list().reduce((sum, part) => {
    if (!("capacitance" in part)) return sum
    const nets = [pinNet(part.name, 1), pinNet(part.name, 2)]
    return nets.includes(rail) && nets.includes("GND")
      ? sum + Number(part.capacitance) : sum
  }, 0)
}

describe("general USB-C PD Peltier driver", () => {
  test("every placed part is sourced, with an error-free and separated placement", () => {
    const parts = circuit.db.source_component.list()
    const purchased = parts.filter(part => !(part.ftype === "simple_test_point" &&
      "footprint_variant" in part && part.footprint_variant === "pad"))
    expect(purchased.filter(part => !part.manufacturer_part_number ||
      !part.supplier_part_numbers?.jlcpcb?.some(number => /^C\d+$/.test(number))).map(part => part.name)).toEqual([])
    expect(circuit.getCircuitJson().filter(item => item.type.endsWith("_error")).map(item =>
      "message" in item ? item.message : item.type)).toEqual([])

    const board = circuit.db.pcb_board.list()[0]!
    if (!board.width || !board.height) throw new Error("Missing rectangular board dimensions")
    const width = board.width, height = board.height
    expect([width, height]).toEqual([72.5, 59])
    expect(board.center.x - width / 2).toBe(-40) // Preserve the original USB mating edge.
    // Copper-only DNP test pads need board area and probe access too.
    const placed = placedComponents(circuit)
    expect([...new Set(placed.map(part => part.layer))]).toEqual(["top"])
    const nameOf = (id: string) => parts.find(part => part.source_component_id === id)?.name ?? id
    const outOfBounds = placed.filter(part =>
      Math.abs(part.center.x - board.center.x) + part.width / 2 > width / 2 + 0.01 ||
      Math.abs(part.center.y - board.center.y) + part.height / 2 > height / 2 + 0.01)
    expect(outOfBounds.map(part => nameOf(part.source_component_id))).toEqual([])
    const pads = [...circuit.db.pcb_smtpad.list(), ...circuit.db.pcb_plated_hole.list()]
    const overlaps: string[] = []
    for (let i = 0; i < placed.length; i++) {
      for (let j = i + 1; j < placed.length; j++) {
        const a = placed[i]!, b = placed[j]!
        const clearance = a.do_not_place || b.do_not_place
          ? board.min_pad_edge_to_pad_edge_clearance ?? 0.1 : -0.01
        if (a.layer === b.layer &&
          Math.abs(a.center.x - b.center.x) < (a.width + b.width) / 2 + clearance &&
          Math.abs(a.center.y - b.center.y) < (a.height + b.height) / 2 + clearance) {
          if (a.do_not_place || b.do_not_place) {
            // Round probe pads can clear a pad corner while their square bounds do not.
            const aPads = pads.filter(pad => pad.pcb_component_id === a.pcb_component_id)
            const bPads = pads.filter(pad => pad.pcb_component_id === b.pcb_component_id)
            if (aPads.length && bPads.length && aPads.every(pad =>
              bPads.every(other => computeGapBetweenCopper(pad, other) >= clearance))) continue
          }
          overlaps.push(`${nameOf(a.source_component_id)} / ${nameOf(b.source_component_id)}`)
        }
      }
    }
    expect(overlaps).toEqual([])
  })

  test("output connectors reach the board edge with their full bodies clear of other parts", () => {
    const board = circuit.db.pcb_board.list()[0]!
    const courtyards = circuit.db.pcb_courtyard_outline.list()
    for (const name of ["J_TEC", "J_HOT_SENSOR", "J_COLD_SENSOR", "J_FAN"]) {
      const placed = circuit.db.pcb_component.list().find(part => part.source_component_id === component(name).source_component_id)!
      const outline = courtyards.find(court => court.pcb_component_id === placed.pcb_component_id)!.outline
      const left = Math.min(...outline.map(p => p.x)), right = Math.max(...outline.map(p => p.x))
      const bottom = Math.min(...outline.map(p => p.y)), top = Math.max(...outline.map(p => p.y))
      const gap = name === "J_FAN" ? bottom - (board.center.y - board.height! / 2)
        : board.center.x + board.width! / 2 - right
      expect(gap).toBeGreaterThanOrEqual(0)
      expect(gap).toBeLessThan(1)
      // Imported component bounds cover copper, so also check the connector's body envelope.
      expect(placedComponents(circuit).filter(other => other.layer === placed.layer &&
        other.pcb_component_id !== placed.pcb_component_id &&
        other.center.x + other.width / 2 > left && other.center.x - other.width / 2 < right &&
        other.center.y + other.height / 2 > bottom && other.center.y - other.height / 2 < top)
        .map(other => other.source_component_id)).toEqual([])
    }
  })

  test("both USB4085 footprints retain the manufacturer's two rows of through-hole contacts", () => {
    // GCT drawing, sheet 2: 0.85 mm contact pitch, 1.35 mm rows, 0.40/0.65 mm drill/land.
    for (const name of ["J_USB", "J_PROGRAM"]) {
      expect(component(name).manufacturer_part_number).toBe("USB4085-GF-A")
      const rows = [[2, 3, 1, 4, 5, 6, 7, 8], [9, 10, 11, 12, 13, 14, 15, 16]]
      for (const row of rows) for (const [index, pin] of row.entries()) {
        const port = physicalPin(name, pin)
        const hole = circuit.db.pcb_plated_hole.list().find(hole => hole.pcb_port_id === port.pcb_port_id)!
        expect(hole.shape).toBe("pill")
        if (hole.shape !== "pill") throw new Error("Missing USB through-hole contact")
        expect(hole.hole_width).toBeCloseTo(0.4, 3)
        expect(hole.hole_height).toBeCloseTo(0.4, 3)
        expect(hole.outer_width).toBeCloseTo(0.65, 3)
        expect(hole.outer_height).toBeCloseTo(0.65, 3)
        expect(port.x).toBeCloseTo(physicalPin(name, row[0]!).x, 3)
        if (index) expect(physicalPin(name, row[index - 1]!).y - port.y).toBeCloseTo(0.85, 1)
      }
      expect(physicalPin(name, 2).x - physicalPin(name, 9).x).toBeCloseTo(1.35, 3)
    }
  })

  test("20 V / 5 A PD qualification is the only input to the load converter", () => {
    // Count the complete directly exposed capacitor bank, rather than one
    // designator: USB-C legacy attachment allows at most 10uF on raw VBUS.
    const rawCapacitanceF = directCapacitance("VBUS_RAW")
    expect(rawCapacitanceF).toBeGreaterThan(0)
    expect(rawCapacitanceF * 1.2).toBeLessThanOrEqual(10e-6)
    expect(component("J_USB").manufacturer_part_number).toBe("USB4085-GF-A")
    for (const pin of [1, 2, 5, 23]) expect(pinNet("U_PD", pin)).toBe("PD_3V3")
    expect(pinNet("U_PD", 6)).toBe("GND")
    expect(pinNet("U_PD", 18)).toBe("VBUS_RAW")
    for (const pin of [16, 17]) expect(pinNet("U_PD", pin)).toBeUndefined()
    expect(pinNet("J_USB", 1)).toBe("CC1")
    expect(pinNet("J_USB", 14)).toBe("CC2")
    for (const pin of [3, 7, 10, 15]) expect(pinNet("J_USB", pin)).toBe("VBUS_RAW")
    for (const name of ["Q_INPUT", "Q_REVERSE"]) {
      for (const pin of [1, 2, 3]) expect(pinNet(name, pin)).toBe("PFET_SOURCE")
      expect(pinNet(name, 4)).toBe("PD_GATE")
    }
    for (const pin of [5, 6, 7, 8]) {
      expect(pinNet("Q_INPUT", pin)).toBe("VBUS_RAW")
      expect(pinNet("Q_REVERSE", pin)).toBe("VBUS_QUALIFIED")
    }
    expect(pinNet("U_DRIVER", 7)).toBe("VBUS_QUALIFIED")
    expect(pinNet("R_DC_SENSE", 1)).toBe("VBUS_QUALIFIED")
    expect(pinNet("R_DC_SENSE", 2)).toBe("PD_VDC_OUT")
    expect(pinNet("U_PD", 11)).toBe("PD_VDC_OUT")
    expect(pinNet("J_TEC", 1)).toBe("TEC_POS")
    expect(pinNet("J_TEC", 2)).toBe("GND")
  })

  test("the hardware CC loop measures a series shunt and the converter has both bootstrap paths", () => {
    expect(component("U_DRIVER").manufacturer_part_number).toBe("TPS55289RYQR")
    expect(resistance("R_SENSE")).toBeCloseTo(0.01, 6)
    expect(pinNet("U_DRIVER", 11)).toBe("DRIVER_OUT")
    expect(pinNet("R_SENSE", 1)).toBe("DRIVER_OUT")
    expect(pinNet("R_SENSE", 2)).toBe("TEC_POS")
    for (const [name, rail, sense, pin] of [
      ["R_ISP_FILTER", "DRIVER_OUT", "DRIVER_ISP", 12],
      ["R_ISN_FILTER", "TEC_POS", "DRIVER_ISN", 13],
    ] as const) {
      expect(resistance(name)).toBe(10)
      expect(pinNet(name, 1)).toBe(rail)
      expect(pinNet(name, 2)).toBe(sense)
      expect(pinNet("U_DRIVER", pin)).toBe(sense)
    }
    expect(pinNet("C_CURRENT_FILTER", 1)).toBe("DRIVER_ISP")
    expect(pinNet("C_CURRENT_FILTER", 2)).toBe("DRIVER_ISN")
    expect(pinNet("L_OUT", 1)).toBe("DRIVER_SW1")
    expect(pinNet("L_OUT", 2)).toBe("DRIVER_SW2")
    for (const [name, bootPin, switchPin, bootNet, switchNet] of [
      ["C_DRIVER_BOOT1", 20, 8, "DRIVER_BOOT1", "DRIVER_SW1"],
      ["C_DRIVER_BOOT2", 19, 10, "DRIVER_BOOT2", "DRIVER_SW2"],
    ] as const) {
      expect(pinNet("U_DRIVER", bootPin)).toBe(bootNet)
      expect(pinNet("U_DRIVER", switchPin)).toBe(switchNet)
      expect(pinNet(name, 1)).toBe(bootNet)
      expect(pinNet(name, 2)).toBe(switchNet)
    }
    expect(pinNet("U_DRIVER", 2)).toBe("GND") // Physical address strap: 0x75.
    expect(pinNet("U_DRIVER", 15)).toBe("DRIVER_COMP")
    expect(pinNet("R_COMP", 1)).toBe("DRIVER_COMP")
    expect(pinNet("R_COMP", 2)).toBe("DRIVER_COMP_ZERO")
    expect(pinNet("C_COMP_ZERO", 1)).toBe("DRIVER_COMP_ZERO")
    expect(pinNet("C_COMP_ZERO", 2)).toBe("GND")
    expect(pinNet("C_COMP_POLE", 1)).toBe("DRIVER_COMP")
    expect(pinNet("C_COMP_POLE", 2)).toBe("GND")
  })

  test("fixed 12 V fan power is qualified-PD-only and matches the keyed PC fan header", () => {
    expect(component("U_FAN").manufacturer_part_number).toBe("LMR50410XDBVR")
    expect(component("U_FAN").supplier_part_numbers?.jlcpcb).toEqual(["C2841056"])
    // EN follows the qualified input, so MCU reset/TEC Off cannot turn cooling off.
    for (const pin of [4, 5]) expect(pinNet("U_FAN", pin)).toBe("VBUS_QUALIFIED")
    expect(pinNet("U_FAN", 2)).toBe("GND")
    expect(pinNet("U_FAN", 6)).toBe("FAN_SW")
    expect(pinNet("U_FAN", 1)).toBe("FAN_BOOT")
    expect(pinNet("C_FAN_BOOT", 1)).toBe("FAN_BOOT")
    expect(pinNet("C_FAN_BOOT", 2)).toBe("FAN_SW")
    expect(capacitance("C_FAN_BOOT")).toBeCloseTo(100e-9, 12)
    expect(pinNet("L_FAN", 1)).toBe("FAN_SW")
    expect(pinNet("L_FAN", 2)).toBe("FAN_12V")
    const coil = component("L_FAN")
    expect(String("inductance" in coil && coil.inductance)).toBe("33uH")
    expect(coil.manufacturer_part_number).toBe("SWPA8040S330MT")

    expect(pinNet("U_FAN", 3)).toBe("FAN_FB")
    expect(pinNet("R_FAN_FB_TOP", 1)).toBe("FAN_12V")
    expect(pinNet("R_FAN_FB_TOP", 2)).toBe("FAN_FB")
    expect(pinNet("R_FAN_FB_BOTTOM", 1)).toBe("FAN_FB")
    expect(pinNet("R_FAN_FB_BOTTOM", 2)).toBe("GND")
    expect(resistance("R_FAN_FB_TOP")).toBe(110_000)
    expect(resistance("R_FAN_FB_BOTTOM")).toBe(10_000)
    // TI's 1 V reference sets the fan rail independently of programmable TEC voltage.
    expect(1 + resistance("R_FAN_FB_TOP") / resistance("R_FAN_FB_BOTTOM")).toBeCloseTo(12, 6)
    for (const [name, rail, farads, minRating] of [
      ["C_FAN_IN", "VBUS_QUALIFIED", 10e-6, 25],
      ["C_FAN_IN_HF", "VBUS_QUALIFIED", 100e-9, 25],
      ["C_FAN_OUT1", "FAN_12V", 22e-6, 16],
      ["C_FAN_OUT2", "FAN_12V", 22e-6, 16],
    ] as const) {
      expect(pinNet(name, 1)).toBe(rail)
      expect(pinNet(name, 2)).toBe("GND")
      expect(capacitance(name)).toBeCloseTo(farads, 10)
      const capacitor = component(name)
      expect("max_voltage_rating" in capacitor && capacitor.max_voltage_rating).toBeGreaterThanOrEqual(minRating)
    }

    expect(component("J_FAN").manufacturer_part_number).toBe("470531000")
    expect(component("J_FAN").supplier_part_numbers?.jlcpcb).toEqual(["C240840"])
    expect(pinNet("J_FAN", 1)).toBe("GND")
    expect(pinNet("J_FAN", 2)).toBe("FAN_12V")
    for (const pin of [3, 4]) {
      expect(pinNet("J_FAN", pin)).toBeUndefined()
      expect(sourcePin("J_FAN", pin).do_not_connect).toBe(true)
    }
    // Check actual drilled contacts: the rotated keyed header presents GND,
    // +12 V, tach, PWM in ascending X order at the official 2.54 mm pitch.
    const contacts = [1, 2, 3, 4].map(pin => physicalPin("J_FAN", pin))
    const holes = circuit.db.pcb_plated_hole.list().filter(hole =>
      contacts.some(port => port.pcb_port_id === hole.pcb_port_id))
    expect(holes).toHaveLength(4)
    for (let i = 0; i < contacts.length; i++) {
      const contact = contacts[i]!
      expect(contact.y).toBeCloseTo(contacts[0]!.y, 5)
      if (i) expect(contact.x - contacts[i - 1]!.x).toBeCloseTo(2.54, 5)
      const hole = holes.find(hole => hole.pcb_port_id === contact.pcb_port_id)!
      expect(hole.x).toBeCloseTo(contact.x, 6)
      expect(hole.y).toBeCloseTo(contact.y, 6)
      expect("hole_diameter" in hole && hole.hole_diameter).toBeCloseTo(1.02, 5)
    }
  })

  test("each powered probe has its own protected 1-Wire input and correctly numbered screw contacts", () => {
    expect(component("U_SENSOR_ESD").manufacturer_part_number).toBe("USBLC6-2SC6")
    expect(pinNet("U_SENSOR_ESD", 2)).toBe("GND")
    expect(pinNet("U_SENSOR_ESD", 5)).toBe("CTRL_3V3")
    for (const [side, mcuPin, esdPins] of [["HOT", 11, [1, 6]], ["COLD", 12, [3, 4]]] as const) {
      const connector = `J_${side}_SENSOR`, data = `${side}_SENSOR_DATA`, mcuData = `${side}_DATA_MCU`
      expect(component(connector).manufacturer_part_number).toBe("XY302V-3.5-3P")
      expect(component(connector).supplier_part_numbers?.jlcpcb).toEqual(["C784941"])
      expect(pinNet(connector, 1)).toBe("CTRL_3V3")
      expect(pinNet(connector, 2)).toBe(data)
      expect(pinNet(connector, 3)).toBe("GND")
      expect(pinNet("U_MCU", mcuPin)).toBe(mcuData)
      expect(resistance(`R_${side}_SERIES`)).toBe(100)
      expect(pinNet(`R_${side}_SERIES`, 1)).toBe(mcuData)
      expect(pinNet(`R_${side}_SERIES`, 2)).toBe(data)
      expect(resistance(`R_${side}_PULLUP`)).toBe(4_700)
      expect(pinNet(`R_${side}_PULLUP`, 1)).toBe("CTRL_3V3")
      expect(pinNet(`R_${side}_PULLUP`, 2)).toBe(data)
      expect(capacitance(`C_${side}_SENSOR`)).toBeCloseTo(100e-9, 12)
      expect(pinNet(`C_${side}_SENSOR`, 1)).toBe("CTRL_3V3")
      expect(pinNet(`C_${side}_SENSOR`, 2)).toBe("GND")
      for (const pin of esdPins) expect(pinNet("U_SENSOR_ESD", pin)).toBe(data)
      const contacts = [1, 2, 3].map(pin => physicalPin(connector, pin))
      const holes = circuit.db.pcb_plated_hole.list().filter(hole =>
        contacts.some(port => port.pcb_port_id === hole.pcb_port_id))
      expect(holes).toHaveLength(3)
      for (let i = 0; i < contacts.length; i++) {
        const contact = contacts[i]!, hole = holes.find(hole => hole.pcb_port_id === contact.pcb_port_id)!
        expect(hole.x).toBeCloseTo(contact.x, 6)
        expect(hole.y).toBeCloseTo(contact.y, 6)
        if (i) expect(Math.hypot(contact.x - contacts[i - 1]!.x, contact.y - contacts[i - 1]!.y)).toBeCloseTo(3.5, 4)

      }
    }
    // Read-ROM is valid for one device per port: no direct HOT/COLD bus bridge.
    expect(root(sourcePin("J_HOT_SENSOR", 2).source_port_id)).not.toBe(
      root(sourcePin("J_COLD_SENSOR", 2).source_port_id))
    expect(root(sourcePin("U_MCU", 11).source_port_id)).not.toBe(
      root(sourcePin("U_MCU", 12).source_port_id))
  })

  test("reset and PD fault independently disable output while live logic has a 5 V driver bias", () => {
    expect(pinNet("U_DRIVER", 1)).toBe("DRIVER_ENABLE")
    expect(pinNet("R_DRIVER_EN_TOP", 1)).toBe("VBUS_QUALIFIED")
    expect(pinNet("R_DRIVER_EN_TOP", 2)).toBe("DRIVER_ENABLE")
    expect(pinNet("R_DRIVER_EN_BOTTOM", 1)).toBe("DRIVER_ENABLE")
    expect(pinNet("R_DRIVER_EN_BOTTOM", 2)).toBe("GND")
    const uvlo = 1.23 * (1 + resistance("R_DRIVER_EN_TOP") / resistance("R_DRIVER_EN_BOTTOM"))
    expect(uvlo).toBeGreaterThan(16)
    expect(uvlo).toBeLessThan(18.5)
    expect(pinNet("R_KILL_RESET", 1)).toBe("LOGIC_5V")
    expect(pinNet("R_KILL_RESET", 2)).toBe("DRIVER_KILL_BASE")
    expect(resistance("R_KILL_RESET")).toBe(47_000)
    expect(pinNet("U_MCU", 4)).toBe("MCU_DRIVER_PERMISSION") // GP2 defaults to an input; external pull-down holds OFF.
    expect(pinNet("R_KILL_DRIVE", 1)).toBe("MCU_DRIVER_PERMISSION")
    expect(pinNet("R_KILL_DRIVE", 2)).toBe("DRIVER_RELEASE_GATE")
    expect(resistance("R_KILL_DRIVE")).toBe(1_000)
    // The permission MOSFET defaults off even when the MCU's 3V3 rail fails.
    expect(pinNet("R_RELEASE_OFF", 1)).toBe("DRIVER_RELEASE_GATE")
    expect(pinNet("R_RELEASE_OFF", 2)).toBe("GND")
    expect(resistance("R_RELEASE_OFF")).toBe(100_000)
    expect(pinNet("Q_MCU_RELEASE", 1)).toBe("DRIVER_RELEASE_GATE")
    expect(pinNet("Q_MCU_RELEASE", 2)).toBe("GND")
    expect(pinNet("Q_MCU_RELEASE", 3)).toBe("DRIVER_KILL_BASE")
    for (const [name, base] of [["Q_MCU_KILL", "DRIVER_KILL_BASE"], ["Q_PD_FAULT", "PD_FAULT_BASE"]]) {
      expect(pinNet(name!, 1)).toBe(base)
      expect(pinNet(name!, 2)).toBe("GND")
      expect(pinNet(name!, 3)).toBe("DRIVER_ENABLE")
    }
    expect(pinNet("U_PD", 9)).toBe("PD_FAULT")
    expect(pinNet("R_FAULT_BASE", 1)).toBe("PD_FAULT")
    expect(pinNet("R_FAULT_BASE", 2)).toBe("PD_FAULT_BASE")

    // A fixed 3.3 V SKU here would not supply the driver's required external bias.
    expect(component("U_AUX").manufacturer_part_number).toBe("LMR50410Y5FQDBVRQ1")
    expect(pinNet("U_AUX", 5)).toBe("VBUS_RAW")
    expect(pinNet("U_AUX", 3)).toBe("AUX_5V")
    expect(pinNet("L_AUX", 2)).toBe("AUX_5V")
    expect(pinNet("U_DRIVER", 18)).toBe("LOGIC_5V")
    expect(pinNet("U_DRIVER", 21)).toBe("GND")
    expect(pinNet("U_CTRL_LDO", 1)).toBe("LOGIC_5V")
    expect(pinNet("U_CTRL_LDO", 3)).toBe("LOGIC_5V")
    expect(pinNet("U_CTRL_LDO", 5)).toBe("CTRL_3V3")
    for (const pin of [1, 10, 22, 33, 42, 43, 44, 48, 49])
      expect(pinNet("U_MCU", pin)).toBe("CTRL_3V3")
    for (const pin of [23, 45, 50]) expect(pinNet("U_MCU", pin)).toBe("RP_CORE_1V1")
    expect(directCapacitance("RP_CORE_1V1")).toBeGreaterThanOrEqual(1e-6)
    expect(pinNet("U_MCU", 19)).toBe("GND") // TESTEN must not float.
    expect(pinNet("U_MCU", 57)).toBe("GND")
    expect(pinNet("U_MCU", 5)).toBe("DRIVER_FAULT")
    expect(pinNet("U_MCU", 6)).toBe("PD_FAULT_SENSE")
    expect(pinNet("R_SCL", 1)).toBe("CTRL_3V3")
    expect(pinNet("R_SDA", 1)).toBe("CTRL_3V3")
    expect(pinNet("U_MCU", 3)).toBe("I2C_SCL")
    expect(pinNet("U_MCU", 2)).toBe("I2C_SDA")
    // ADC conversion factors must describe the installed sense network.
    for (const [top, bottom, rail, sense, pin, topOhms, bottomOhms] of [
      ["R_V_ADC_TOP", "R_V_ADC_BOTTOM", "TEC_POS", "OUTPUT_VOLTAGE_ADC", 39, 100_000, 20_000],
      ["R_PD_ADC_TOP", "R_PD_ADC_BOTTOM", "VBUS_QUALIFIED", "INPUT_VOLTAGE_ADC", 40, 150_000, 22_000],
    ] as const) {
      expect(resistance(top)).toBe(topOhms)
      expect(resistance(bottom)).toBe(bottomOhms)
      expect(pinNet(top, 1)).toBe(rail)
      expect(pinNet(top, 2)).toBe(sense)
      expect(pinNet(bottom, 1)).toBe(sense)
      expect(pinNet(bottom, 2)).toBe("GND")
      expect(pinNet("U_MCU", pin)).toBe(sense)
    }
    expect(pinNet("R_I_ADC", 1)).toBe("DRIVER_CURRENT_MONITOR")
    expect(pinNet("R_I_ADC", 2)).toBe("OUTPUT_CURRENT_ADC")
    expect(pinNet("U_MCU", 38)).toBe("OUTPUT_CURRENT_ADC")
  })

  test("programming USB powers logic through a reverse-blocking mux and exposes real recovery pads", () => {
    expect(component("U_MCU").manufacturer_part_number).toBe("RP2040")
    expect(component("U_LOGIC_MUX").manufacturer_part_number).toBe("TPS2116DRLR")
    expect(directCapacitance("PROGRAM_VBUS")).toBeGreaterThan(0)
    expect(directCapacitance("PROGRAM_VBUS") * 1.2).toBeLessThanOrEqual(10e-6)
    for (const [name, net, pin] of [
      ["R_PROGRAM_CC1", "PROGRAM_CC1", 1], ["R_PROGRAM_CC2", "PROGRAM_CC2", 14],
    ] as const) {
      expect(resistance(name)).toBe(5_100)
      expect(pinNet(name, 1)).toBe(net)
      expect(pinNet(name, 2)).toBe("GND")
      expect(pinNet("J_PROGRAM", pin)).toBe(net)
    }
    for (const pin of [3, 7, 10, 15]) expect(pinNet("J_PROGRAM", pin)).toBe("PROGRAM_VBUS")
    for (const [connectorPins, mcuPin, esdPins, net, series, mcuNet] of [
      [[4, 13], 47, [3, 4], "PROGRAM_USB_DP", "R_USB_DP", "RP_USB_DP"],
      [[5, 12], 46, [1, 6], "PROGRAM_USB_DM", "R_USB_DM", "RP_USB_DM"],
    ] as const) {
      for (const pin of connectorPins) expect(pinNet("J_PROGRAM", pin)).toBe(net)
      for (const pin of esdPins) expect(pinNet("U_PROGRAM_ESD", pin)).toBe(net)
      expect(resistance(series)).toBe(27)
      expect([pinNet(series, 1), pinNet(series, 2)].sort()).toEqual([net, mcuNet].sort())
      expect(pinNet("U_MCU", mcuPin)).toBe(mcuNet)
    }
    for (const pin of [6, 11]) expect(pinNet("J_PROGRAM", pin)).toBeUndefined()
    for (const [pin, net] of [[1, "GND"], [2, "LOGIC_5V"], [3, "AUX_5V"],
      [4, "GND"], [5, "GND"], [6, "PROGRAM_VBUS"], [7, "LOGIC_5V"]] as const)
      expect(pinNet("U_LOGIC_MUX", pin)).toBe(net)
    // This ESD clamp must not steer self-powered ROM D+ into an unplugged PC VBUS.
    expect(pinNet("U_PROGRAM_ESD", 5)).toBe("LOGIC_5V")
    expect(pinNet("U_PROGRAM_ESD", 2)).toBe("GND")
    expect(pinNet("U_MCU", 41)).toBe("PROGRAM_VBUS_SENSE")
    expect(pinNet("R_PROGRAM_SENSE_TOP", 1)).toBe("PROGRAM_VBUS")
    expect(pinNet("R_PROGRAM_SENSE_TOP", 2)).toBe("PROGRAM_VBUS_SENSE")
    expect(resistance("R_PROGRAM_SENSE_TOP")).toBe(15_000)
    expect(resistance("R_PROGRAM_SENSE_BOTTOM")).toBe(20_000)
    expect(pinNet("U_MCU", 24)).toBe("SWCLK")
    expect(pinNet("U_MCU", 25)).toBe("SWDIO")
    expect(pinNet("U_MCU", 26)).toBe("MCU_RUN")
    expect(pinNet("R_RUN", 1)).toBe("CTRL_3V3")
    expect(pinNet("R_RUN", 2)).toBe("MCU_RUN")
    expect(resistance("R_RUN")).toBe(10_000)
    expect(pinNet("C_MCU_RUN", 1)).toBe("MCU_RUN")
    expect(pinNet("C_MCU_RUN", 2)).toBe("GND")

    // ROM USB recovery needs a real 12 MHz clock and a bootable external flash.
    expect(component("Y_MCU").manufacturer_part_number).toBe("ABM8-272-T3")
    expect(pinNet("U_MCU", 20)).toBe("XIN")
    expect(pinNet("U_MCU", 21)).toBe("XOUT")
    expect(pinNet("Y_MCU", 1)).toBe("XIN")
    expect(pinNet("Y_MCU", 3)).toBe("XOUT_CRYSTAL")
    for (const pin of [2, 4]) expect(pinNet("Y_MCU", pin)).toBe("GND")
    expect(resistance("R_XOUT")).toBe(1_000)
    expect(pinNet("R_XOUT", 1)).toBe("XOUT")
    expect(pinNet("R_XOUT", 2)).toBe("XOUT_CRYSTAL")
    for (const [name, rail] of [["C_XIN", "XIN"], ["C_XOUT", "XOUT_CRYSTAL"]]) {
      expect(capacitance(name!)).toBeCloseTo(15e-12, 15)
      expect(pinNet(name!, 1)).toBe(rail)
      expect(pinNet(name!, 2)).toBe("GND")
    }
    expect(component("U_FLASH").manufacturer_part_number).toBe("W25Q128JVSIQ")
    for (const [flashPin, mcuPin, rail] of [
      [1, 56, "QSPI_SS"], [2, 55, "QSPI_SD1"], [3, 54, "QSPI_SD2"],
      [5, 53, "QSPI_SD0"], [6, 52, "QSPI_SCLK"], [7, 51, "QSPI_SD3"],
    ] as const) {
      expect(pinNet("U_FLASH", flashPin)).toBe(rail)
      expect(pinNet("U_MCU", mcuPin)).toBe(rail)
    }
    expect(pinNet("U_FLASH", 8)).toBe("CTRL_3V3")
    expect(pinNet("U_FLASH", 4)).toBe("GND")
    expect(resistance("R_FLASH_CS")).toBe(10_000)
    expect(pinNet("R_FLASH_CS", 1)).toBe("CTRL_3V3")
    expect(pinNet("R_FLASH_CS", 2)).toBe("QSPI_SS")
    expect(resistance("R_BOOTSEL")).toBe(1_000)
    expect(pinNet("R_BOOTSEL", 1)).toBe("BOOTSEL_PAD")
    expect(pinNet("R_BOOTSEL", 2)).toBe("QSPI_SS")
    // Holding BOOTSEL to GND must override the CS pull-up during reset.
    expect(3.3 * resistance("R_BOOTSEL") / (resistance("R_BOOTSEL") + resistance("R_FLASH_CS"))).toBeLessThan(0.8)
    for (const [name, rail, farads] of [
      ...[1, 10, 22, 33, 42, 49].map(pin => [`C_IOVDD${pin}`, "CTRL_3V3", 100e-9] as const),
      ["C_ADC_AVDD", "CTRL_3V3", 100e-9], ["C_USB_VDD", "CTRL_3V3", 100e-9],
      ["C_DVDD23", "RP_CORE_1V1", 100e-9], ["C_DVDD50", "RP_CORE_1V1", 100e-9],
      ["C_VREG_IN", "CTRL_3V3", 1e-6], ["C_VREG_OUT", "RP_CORE_1V1", 1e-6],
    ] as const) {
      expect(capacitance(name)).toBeCloseTo(farads, 12)
      expect(pinNet(name, 1)).toBe(rail)
      expect(pinNet(name, 2)).toBe("GND")
    }

    const probes = {
      TP_SWDIO: "SWDIO", TP_SWCLK: "SWCLK", TP_BOOTSEL: "BOOTSEL_PAD", TP_RUN: "MCU_RUN",
      TP_3V3: "CTRL_3V3", TP_GND: "GND", TP_RAW_PD: "VBUS_RAW", TP_QUAL_PD: "VBUS_QUALIFIED",
      TP_5V: "LOGIC_5V", TP_TEC: "TEC_POS", TP_OUT: "DRIVER_OUT", TP_EN: "DRIVER_ENABLE",
      TP_ISP: "DRIVER_ISP", TP_ISN: "DRIVER_ISN", TP_SCL: "I2C_SCL", TP_SDA: "I2C_SDA",
    }
    for (const [name, net] of Object.entries(probes)) {
      const source = component(name)
      expect(source.ftype).toBe("simple_test_point")
      const placed = circuit.db.pcb_component.list().find(part => part.source_component_id === source.source_component_id)!
      expect(placed.do_not_place).toBe(true)
      const pads = circuit.db.pcb_smtpad.list().filter(pad => pad.pcb_component_id === placed.pcb_component_id)
      expect(pads).toHaveLength(1)
      expect(pads[0]!.shape).toBe("circle")
      expect("radius" in pads[0]! && pads[0]!.radius).toBe(0.75)
      expect(pads[0]!.is_covered_with_solder_mask).toBe(false)
      expect(pinNet(name, 1)).toBe(net)
      const physicalPort = circuit.db.pcb_port.list().find(port => port.pcb_port_id === pads[0]!.pcb_port_id)!
      const sourcePort = circuit.db.source_port.list().find(port => port.source_port_id === physicalPort.source_port_id)!
      expect(sourcePort.source_component_id).toBe(source.source_component_id)
      expect(sourcePort.pin_number).toBe(1)
    }
    for (const [name, anode, cathode, drive, mcuPin] of [
      ["POWER", 1, 2, "CTRL_3V3", undefined],
      ["RUN", 2, 1, "LED_RUN_DRIVE", 8],
      ["FAULT", 1, 2, "LED_FAULT_DRIVE", 9],
    ] as const) {
      expect(pinNet(`LED_${name}`, anode)).toBe(`LED_${name}_ANODE`)
      expect(pinNet(`LED_${name}`, cathode)).toBe("GND")
      expect(pinNet(`R_LED_${name}`, 1)).toBe(drive)
      expect(pinNet(`R_LED_${name}`, 2)).toBe(`LED_${name}_ANODE`)
      expect(resistance(`R_LED_${name}`)).toBeGreaterThanOrEqual(1_000)
      if (mcuPin) expect(pinNet("U_MCU", mcuPin)).toBe(drive)
    }
  })
})

test("all board and footprint silkscreen is intentionally absent", () => {
  expect(circuit.getCircuitJson().filter(element =>
    element.type.startsWith("pcb_silkscreen_"))).toEqual([])
})
