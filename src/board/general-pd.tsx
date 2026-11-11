import { CYPD3177_24LQXQT } from "../../imports/CYPD3177_24LQXQT"
import { AO4407A } from "../../imports/AO4407A"
import { USB4085_GF_A } from "../../imports/USB4085_GF_A"
import { connectorPlacements } from "../assembly/connector-placement"
import { KF301_5_0_2P } from "../parts/C474881"
import { MMBT3904_RANGE_100_300_ } from "../parts/C20526"
import { GRM31CC72A475KE11L } from "../parts/C237304"
import { AdjustablePowerStage } from "./power-stage"
import { ControlBlock } from "./control"
import { FanPowerBlock } from "./fan-power"
import { TemperaturePorts } from "./temperature-ports"
import { RoutedCopper, type RoutedCopperData } from "./routed-copper"
import routingData from "./routing-data.json"
import { A_0603WAF1001T5E as Resistor0603 } from "../../imports/A_0603WAF1001T5E"
import { CC0603KRX7R9BB104 as Capacitor100nF } from "../parts/C14663"
import { CC0603KRX7R8BB105 as Capacitor1uF } from "../../imports/CC0603KRX7R8BB105"
import { catalogPartsEngine } from "../catalog-parts-engine"

export function GeneralPdDriverBoard({ schematicDisabled = false }: { schematicDisabled?: boolean } = {}) {
  // Exposed-pad thermal arrays require POFV; routing tests allow only the 13 exact pairs.
  // Keep catalog handling with the board: cloud hosts can omit runtime
  // project configuration when rendering a package.
  return <board width={72.5} height={59} outlineOffsetX={-3.75} outlineOffsetY={-0.5} layers={4} thickness={1.6}
    partsEngine={catalogPartsEngine}
    title="USB-C PD Peltier driver · adjustable CC/CV"
    minTraceWidth={0.2} minTraceToPadEdgeClearance={0.17} minPadEdgeToPadEdgeClearance={0.17}
    minViaEdgeToPadEdgeClearance={0.17} minViaHoleDiameter={0.3} minViaPadDiameter={0.6}
    minTraceToHoleEdgeClearance={0.25} minViaHoleEdgeToViaHoleEdgeClearance={0.25} minBoardEdgeClearance={0.3}
    pcbStyle={{ viaHoleDiameter: 0.3, viaPadDiameter: 0.6 }}
    isViaInPadAllowed routeRemaining={false} schematicDisabled={schematicDisabled}
    pcbSx={{ "& silkscreentext": { visibility: "hidden" } }}
    schTraceAutoLabelEnabled schMaxTraceDistance={8}>
    <net name="GND" isGroundNet />
    <net name="TEC_POS" isPowerNet />
    <net name="OUTPUT_CURRENT_ADC" isPowerNet={false} />
    <net name="OUTPUT_VOLTAGE_ADC" isPowerNet={false} />
    <net name="INPUT_VOLTAGE_ADC" isPowerNet={false} />
    <net name="PROGRAM_VBUS_SENSE" isPowerNet={false} />
    <schematicsheet name="PD" displayName="100 W USB-C PD input" sheetIndex={1} />
    <schematicsheet name="POWER" displayName="Adjustable voltage and current limits" sheetIndex={2} />
    <schematicsheet name="LOGIC" displayName="USB programming and logic supplies" sheetIndex={3} />
    <schematicsheet name="MCU" displayName="RP2040 signals, flash and clock" sheetIndex={4} />
    <schematicsheet name="MCU_POWER" displayName="RP2040 power and decoupling" sheetIndex={5} />
    <schematicsheet name="MONITOR" displayName="Output permission and voltage/current monitoring" sheetIndex={6} />
    <schematicsheet name="DEBUG" displayName="Status LEDs and debug test pads" sheetIndex={7} />
    <schematicsheet name="FAN" displayName="Fixed 12 V fan power" sheetIndex={8} />
    <schematicsheet name="SENSORS" displayName="Hot- and cold-side temperature probes" sheetIndex={9} />
    <USB4085_GF_A name="J_USB" schWidth={1.575} {...connectorPlacements.J_USB} schX={-11} schY={4.2} schRotation={0} schSheetName="PD"
      connections={{ pin1: "net.CC1", pin14: "net.CC2",
        pin2: "net.GND", pin8: "net.GND", pin9: "net.GND", pin16: "net.GND", pin17: "net.GND",
        pin3: "net.VBUS_RAW", pin7: "net.VBUS_RAW", pin10: "net.VBUS_RAW", pin15: "net.VBUS_RAW" }}
      noConnect={["pin4", "pin5", "pin6", "pin11", "pin12", "pin13"]} />
    <CYPD3177_24LQXQT name="U_PD" pcbX={-24} pcbY={18.5} pcbRotation={180} schX={-2} schY={4.05} schRotation={0} schSheetName="PD" schWidth={2.71} schHeight={3.84}
      schPinArrangement={{
        leftSide: { direction: "top-to-bottom", pins: ["CC1", "CC2", "D_NEG", "D_POS", "HPI_INT", "GPIO_1", "FLIP", "HPI_SDA", "HPI_SCL"] },
        rightSide: { direction: "top-to-bottom", pins: ["VBUS_FET_EN", "VDC_OUT", "FAULT", "SAFE_PWR_EN", "DNU1", "DNU2"] },
        topSide: { direction: "left-to-right", pins: ["VBUS_IN", "VBUS_MIN", "VBUS_MAX", "ISNK_COARSE", "ISNK_FINE"] },
        bottomSide: { direction: "left-to-right", pins: ["VDDD", "VCCD", "GND1", "GND2", "EP"] },
      }}
      connections={{
        // Datasheet tables 2–4: MIN=MAX=20 V, COARSE=5 A, FINE=0 A.
        pin1: "net.PD_3V3", pin2: "net.PD_3V3", pin3: "net.PD_GATE_DRIVE",
        pin5: "net.PD_3V3", pin6: "net.GND", pin9: "net.PD_FAULT", pin11: "net.PD_VDC_OUT",
        pin14: "net.CC2", pin15: "net.CC1", pin18: "net.VBUS_RAW", pin19: "net.GND",
        pin22: "net.GND", pin23: "net.PD_3V3", pin24: "net.PD_CORE", pin25: "net.GND",
      }} noConnect={["SAFE_PWR_EN", "HPI_INT", "GPIO_1", "FLIP", "HPI_SDA", "HPI_SCL", "DNU1", "DNU2", "D_NEG", "D_POS"]} />
    {/* Every parallel MOSFET source and drain pin is wired explicitly. */}
    <AO4407A name="Q_INPUT" pcbX={-25} pcbY={9} pcbRotation={90} schX={7.5} schY={5} schRotation={0} schSheetName="PD" />
    <trace from=".Q_INPUT > .pin1" to="net.PFET_SOURCE" />
    <trace from=".Q_INPUT > .pin2" to="net.PFET_SOURCE" />
    <trace from=".Q_INPUT > .pin3" to="net.PFET_SOURCE" />
    <trace from=".Q_INPUT > .pin4" to="net.PD_GATE" />
    <trace from=".Q_INPUT > .pin5" to="net.VBUS_RAW" />
    <trace from=".Q_INPUT > .pin6" to="net.VBUS_RAW" />
    <trace from=".Q_INPUT > .pin7" to="net.VBUS_RAW" />
    <trace from=".Q_INPUT > .pin8" to="net.VBUS_RAW" />
    <AO4407A name="Q_REVERSE" pcbX={-17.5} pcbY={9} pcbRotation={270} schX={13} schY={5} schRotation={0} schSheetName="PD" />
    <trace from=".Q_REVERSE > .pin1" to="net.PFET_SOURCE" />
    <trace from=".Q_REVERSE > .pin2" to="net.PFET_SOURCE" />
    <trace from=".Q_REVERSE > .pin3" to="net.PFET_SOURCE" />
    <trace from=".Q_REVERSE > .pin4" to="net.PD_GATE" />
    <trace from=".Q_REVERSE > .pin5" to="net.VBUS_QUALIFIED" />
    <trace from=".Q_REVERSE > .pin6" to="net.VBUS_QUALIFIED" />
    <trace from=".Q_REVERSE > .pin7" to="net.VBUS_QUALIFIED" />
    <trace from=".Q_REVERSE > .pin8" to="net.VBUS_QUALIFIED" />
    <GRM31CC72A475KE11L name="C_USB" pcbX={-23.7} pcbY={4.5} pcbRotation={0} schX={-8} schY={7} schRotation={270} schSheetName="PD"
      connections={{ pin1: "net.VBUS_RAW", pin2: "net.GND" }} />
    <Capacitor100nF name="C_PD_VBUS" maxVoltageRating="50V" pcbX={-27.96} pcbY={17.250066} pcbRotation={180} schX={-6.2} schY={7} schRotation={270} schSheetName="PD"
      connections={{ pin1: "net.VBUS_RAW", pin2: "net.GND" }} />
    <Capacitor1uF name="C_PD_3V3" maxVoltageRating="25V" pcbX={-23.750938} pcbY={14.54} pcbRotation={270} schX={-7} schY={-1.5} schRotation={270} schSheetName="PD"
      connections={{ pin1: "net.PD_3V3", pin2: "net.GND" }} />
    <Capacitor100nF name="C_PD_3V3_HF1" maxVoltageRating="50V" pcbX={-20.04} pcbY={17.250066} pcbRotation={0} schX={-5.2} schY={-1.5} schRotation={270} schSheetName="PD"
      connections={{ pin1: "net.PD_3V3", pin2: "net.GND" }} />
    <Capacitor100nF name="C_PD_3V3_HF2" maxVoltageRating="50V" pcbX={-20.04} pcbY={19.250066} pcbRotation={0} schX={-3.4} schY={-1.5} schRotation={270} schSheetName="PD"
      connections={{ pin1: "net.PD_3V3", pin2: "net.GND" }} />
    <Capacitor1uF name="C_PD_CORE" maxVoltageRating="25V" pcbX={-22.249066} pcbY={14.54} pcbRotation={270} schX={2} schY={-1.5} schRotation={270} schSheetName="PD"
      connections={{ pin1: "net.PD_CORE", pin2: "net.GND" }} />
    <MMBT3904_RANGE_100_300_ name="Q_PD_FAULT" pcbX={-15.5} pcbY={20.65} pcbRotation={0} schX={-2} schY={-6} schRotation={0} schSheetName="PD"
      connections={{ pin1: "net.PD_FAULT_BASE", pin2: "net.GND", pin3: "net.DRIVER_ENABLE" }} />
    <Resistor0603 name="R_GATE" resistance="1k" pcbX={-21.75} pcbY={12.5} pcbRotation={180} schX={3.5} schY={5} schRotation={0} schSheetName="PD"
      manufacturerPartNumber="0603WAF1001T5E" supplierPartNumbers={{ jlcpcb: ["C21190"] }}
      connections={{ pin1: "net.PD_GATE_DRIVE", pin2: "net.PD_GATE" }} />
    <Resistor0603 name="R_GATE_OFF" resistance="49.9k" pcbX={-18.7} pcbY={12.5} pcbRotation={0} schX={10.5} schY={2} schRotation={270} schSheetName="PD"
      manufacturerPartNumber="0603WAF4992T5E" supplierPartNumbers={{ jlcpcb: ["C23184"] }}
      connections={{ pin1: "net.PFET_SOURCE", pin2: "net.PD_GATE" }} />
    <Resistor0603 name="R_DC_SENSE" resistance="1k" pcbX={-24.75} pcbY={22.5} pcbRotation={270} schX={13} schY={0} schRotation={270} schSheetName="PD"
      manufacturerPartNumber="0603WAF1001T5E" supplierPartNumbers={{ jlcpcb: ["C21190"] }}
      connections={{ pin1: "net.VBUS_QUALIFIED", pin2: "net.PD_VDC_OUT" }} />
    <Resistor0603 name="R_FAULT_BASE" resistance="10k" pcbX={-19} pcbY={21.6} pcbRotation={0} schX={-6} schY={-6} schRotation={0} schSheetName="PD"
      manufacturerPartNumber="0603WAF1002T5E" supplierPartNumbers={{ jlcpcb: ["C25804"] }}
      connections={{ pin1: "net.PD_FAULT", pin2: "net.PD_FAULT_BASE" }} />
    <Resistor0603 name="R_FAULT_OFF" resistance="100k" pcbX={-17} pcbY={17} pcbRotation={180} schX={-3.5} schY={-8} schRotation={270} schSheetName="PD"
      manufacturerPartNumber="0603WAF1003T5E" supplierPartNumbers={{ jlcpcb: ["C25803"] }}
      connections={{ pin1: "net.PD_FAULT_BASE", pin2: "net.GND" }} />
    <group schSheetName="PD">
      <schematictext text="100 W USB-C PD INPUT" schX={-11} schY={9.5} fontSize={0.35} anchor="left" />
      <schematictext text="20 V / 5 A contract - use a 5 A e-marked cable" schX={-11} schY={8.7} fontSize={0.22} anchor="left" />
      <schematictext text="Back-to-back P-FETs" schX={7.5} schY={8.5} fontSize={0.25} anchor="left" />
      <schematictext text="Straps: MIN = MAX = 20 V; COARSE = 5 A; FINE = 0 A" schX={-10} schY={-3.8} fontSize={0.22} anchor="left" />
      <schematictext text="PD FAULT disables the load converter" schX={-10} schY={-5} fontSize={0.25} anchor="left" />
      <netlabel net="GND" connection=".J_USB > .pin2" schX={-10.3} schY={1.4} anchorSide="top" />
      <netlabel net="GND" connection=".U_PD > .pin19" schX={-1.6} schY={-0.8} anchorSide="top" />
      <netlabel net="GND" connection=".C_USB > .pin2" schX={-8} schY={5.3} anchorSide="top" />
      <netlabel net="GND" connection=".C_PD_VBUS > .pin2" schX={-6.2} schY={5.3} anchorSide="top" />
      <netlabel net="GND" connection=".C_PD_3V3 > .pin2" schX={-7} schY={-2.7} anchorSide="top" />
      <netlabel net="GND" connection=".C_PD_3V3_HF1 > .pin2" schX={-5.2} schY={-2.7} anchorSide="top" />
      <netlabel net="GND" connection=".C_PD_3V3_HF2 > .pin2" schX={-3.4} schY={-2.7} anchorSide="top" />
      <netlabel net="GND" connection=".C_PD_CORE > .pin2" schX={2} schY={-2.7} anchorSide="top" />
      <netlabel net="GND" connection=".Q_PD_FAULT > .pin2" schX={-2} schY={-7.1} anchorSide="top" />
      <netlabel net="GND" connection=".R_FAULT_OFF > .pin2" schX={-3.5} schY={-9.1} anchorSide="top" />
    </group>
    <AdjustablePowerStage />
    <ControlBlock />
    <FanPowerBlock />
    <TemperaturePorts />
    <KF301_5_0_2P name="J_TEC" {...connectorPlacements.J_TEC} schX={19.5} schY={3} schSheetName="POWER"
      schPinArrangement={{ leftSide: [1, 2], rightSide: [] }}
      connections={{ pin1: "net.TEC_POS", pin2: "net.GND" }} />

    <RoutedCopper {...routingData as RoutedCopperData} />
  </board>
}
