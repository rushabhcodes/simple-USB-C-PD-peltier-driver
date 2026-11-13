import { Children, Fragment, cloneElement, isValidElement, type ReactElement, type ReactNode } from "react"
import { GeneralPdDriverBoard } from "../src/board/general-pd"
import { RoutedCopper } from "../src/board/routed-copper"
import { CC0603KRX7R8BB105 as Capacitor1uF } from "../imports/CC0603KRX7R8BB105"

type Element = ReactElement<Record<string, any>>
export type DraftBoardId = "lite" | "modular-power" | "modular-control"

/** Expand functional blocks, keeping the actual imported component wrappers.
 * Saved copper belongs exclusively to the original board and is never copied.
 */
function expand(children: ReactNode, sheet?: string): Element[] {
  return Children.toArray(children).flatMap(child => {
    if (!isValidElement(child)) return []
    const element = child as Element
    const props = element.props
    if (element.type === RoutedCopper) return []
    const inheritedSheet = props.schSheetName ?? sheet
    if (element.type === Fragment || element.type === "group")
      return expand(props.children, inheritedSheet)
    if (typeof element.type === "function" && !props.name)
      return expand((element.type as (p: any) => ReactNode)(props), inheritedSheet)
    return [inheritedSheet ? cloneElement(element, { schSheetName: inheritedSheet }) : element]
  })
}

export function referenceElements() {
  return expand(GeneralPdDriverBoard().props.children)
}

export function isPart(element: Element) {
  return !!element.props.name && (typeof element.type === "function" ||
    ["testpoint", "pinheader", "connector"].includes(String(element.type)))
}

export function ownerOf(element: Element): "power" | "control" {
  const { name, schSheetName, connections } = element.props
  if (["PD", "POWER", "FAN"].includes(schSheetName)) return "power"
  if (["U_AUX", "L_AUX", "C_AUX_IN", "C_AUX_HF", "C_AUX_BOOT", "C_AUX_OUT", "U_LOGIC_MUX", "C_LOGIC_MUX_OUT",
    "Q_MCU_KILL", "Q_MCU_RELEASE", "R_KILL_DRIVE", "R_KILL_RESET", "R_RELEASE_OFF", "R_PD_FAULT_SENSE",
    "R_I_ADC", "C_I_ADC", "R_V_ADC_TOP", "R_V_ADC_BOTTOM", "C_V_ADC", "R_PD_ADC_TOP", "R_PD_ADC_BOTTOM", "C_PD_ADC"].includes(name))
    return "power"
  if (element.type === "testpoint" && ["VBUS_RAW", "VBUS_QUALIFIED", "TEC_POS", "DRIVER_OUT", "DRIVER_ENABLE", "DRIVER_ISP", "DRIVER_ISN"]
    .some(net => connections?.pin1 === `net.${net}`)) return "power"
  if (!["LOGIC", "MCU", "MCU_POWER", "MONITOR", "DEBUG", "SENSORS"].includes(schSheetName))
    throw new Error(`Unreviewed modular ownership for ${name} on ${schSheetName}`)
  return "control"
}

function referencedParts(element: Element): string[] {
  const selectors = [element.props.from, element.props.to, element.props.connection,
    ...[element.props.connectsTo].flat()]
  return selectors.flatMap(value => typeof value === "string"
    ? [...value.matchAll(/\.([A-Za-z0-9_]+)\s*>/g)].map(match => match[1]!) : [])
}

export const interfacePins = [
  "GND", "LOGIC_5V", "PROGRAM_VBUS", "GND", "MCU_DRIVER_PERMISSION", "DRIVER_FAULT",
  "PD_FAULT_SENSE", "GND", "I2C_SCL", "I2C_SDA", "GND", "OUTPUT_CURRENT_ADC",
  "OUTPUT_VOLTAGE_ADC", "INPUT_VOLTAGE_ADC", "GND", "GND",
] as const

export const boardDimensions = {
  lite: { width: 72.5, height: 59, outlineOffsetY: -0.5 },
  "modular-power": { width: 72.5, height: 55, outlineOffsetY: 3 },
  "modular-control": { width: 72.5, height: 46, outlineOffsetY: 0 },
} as const

function place(element: Element, id: DraftBoardId): Element {
  if (!isPart(element) || id === "lite") return element
  const p = element.props
  const moved = { pcbX: p.pcbX, pcbY: p.pcbY + (id === "modular-control" ? 12 : 0) }
  const positions: Record<string, [number, number]> = id === "modular-power" ? {
    J_FAN: [26.8, -19], R_PD_ADC_TOP: [-28, -19], R_PD_ADC_BOTTOM: [-24.5, -19], C_PD_ADC: [-28, -22],
    R_I_ADC: [-6, -13], C_I_ADC: [-2, -13],
  } : { J_HOT_SENSOR: [28.5, 16], R_HOT_PULLUP: [22.4, 21.5] }
  const override = positions[p.name]
  if (override) [moved.pcbX, moved.pcbY] = override
  return cloneElement(element, moved)
}

function selectedElements(id: DraftBoardId) {
  const elements = referenceElements()
  const parts = elements.filter(isPart).filter(element => id === "lite"
    ? !["FAN", "SENSORS"].includes(element.props.schSheetName)
    : ownerOf(element) === (id === "modular-power" ? "power" : "control"))
  const names = new Set(parts.map(e => e.props.name))
  const sheets = new Set(parts.map(e => e.props.schSheetName))
  return elements.filter(element => {
    if (isPart(element)) return names.has(element.props.name)
    if (element.type === "schematicsheet") return sheets.has(element.props.name)
    if (element.type === "schematicbox") return names.has(element.props.chipRef?.replace(/^\./, ""))
    if (element.props.schSheetName && !sheets.has(element.props.schSheetName)) return false
    return referencedParts(element).every(name => names.has(name))
  }).map(element => {
    if (id === "lite" && element.props.name === "U_MCU_IO") return cloneElement(element, {
      pinLabels: { ...element.props.pinLabels, pin11: ["GP8_NC", "GPIO8"], pin12: ["GP9_NC", "GPIO9"] },
    })
    if (id !== "lite" || element.props.name !== "U_MCU") return place(element, id)
    const connections = { ...element.props.connections }
    delete connections.pin11
    delete connections.pin12
    return cloneElement(element, { connections, noConnect: [...element.props.noConnect, "GPIO8", "GPIO9"] })
  })
}

/** Schematic/floorplan candidates only. Routing is explicitly incomplete. */
export function DraftBoard({ id }: { id: DraftBoardId }) {
  const original = GeneralPdDriverBoard()
  return <board {...original.props} {...boardDimensions[id]} title={`Peltier ${id} — UNROUTED DESIGN CANDIDATE`}
    routingDisabled routeRemaining={false}>
    {selectedElements(id).map((element, key) => cloneElement(element, { key }))}
    {id !== "lite" && <>
      <schematicsheet name="LINK" displayName="Inter-board harness — provisional connector" sheetIndex={10} />
      <pinheader name="J_LINK" pinCount={16} doubleRow pitch={2.54}
        gender="male" pcbX={id === "modular-power" ? 0 : -18} pcbY={id === "modular-power" ? -21 : 19}
        schX={0} schY={0} schSheetName="LINK"
        pinLabels={Object.fromEntries(interfacePins.map((net, i) => [`pin${i + 1}`, net]))}
        connections={Object.fromEntries(interfacePins.map((net, i) => [`pin${i + 1}`, `net.${net}`]))} />
    </>}
    {id === "modular-power" && <Capacitor1uF name="C_LINK_PROGRAM" maxVoltageRating="25V"
      pcbX={-18.750064} pcbY={-14.35} pcbRotation={90} schX={0} schY={-6} schRotation={270} schSheetName="LOGIC"
      connections={{ pin1: "net.PROGRAM_VBUS", pin2: "net.GND" }} />}
  </board>
}

export const StandardBoard = GeneralPdDriverBoard
