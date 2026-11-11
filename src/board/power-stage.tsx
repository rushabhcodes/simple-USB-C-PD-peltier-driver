import { PowerStageRouting } from "./power-routing"
import { TPS55289RYQR } from "../../imports/TPS55289RYQR"
import { SRP1265A_4R7M } from "../../imports/SRP1265A_4R7M"
import { RLM25FEER010 } from "../../imports/RLM25FEER010"
import { GRM32ER71E226KE15L } from "../../imports/GRM32ER71E226KE15L"
import { OVZ101M1ETR_0606 } from "../../imports/OVZ101M1ETR_0606"
import { EEHZK1V101XP } from "../../imports/EEHZK1V101XP"
import { UMK325BJ106KM_T } from "../../imports/UMK325BJ106KM_T"
import { A_0603WAF1001T5E as Resistor0603 } from "../../imports/A_0603WAF1001T5E"
import { CC0603KRX7R9BB104 as Capacitor100nF } from "../parts/C14663"
import { CL21A106KAYNNNE as Capacitor10uF } from "../../imports/CL21A106KAYNNNE"
import { CC0603KRX7R9BB224 as Capacitor220nF } from "../../imports/CC0603KRX7R9BB224"
import { CC0603KRX7R9BB472 as Capacitor4n7F } from "../../imports/CC0603KRX7R9BB472"
import { CC0603JRNPO0BN101 as Capacitor100pF } from "../../imports/CC0603JRNPO0BN101"

// TPS55289 datasheet pin table and TI EVM SLVUCF2 figure 5-1.
// Compact switching copper and Kelvin sensing use a four-layer, 2 oz outer
// copper target. Compensation, ripple, thermal and transient qualification remain required.
export function AdjustablePowerStage() {
  return <>
    <PowerStageRouting />
    <group name="POWER_NOTES" schSheetName="POWER" schX={0} schY={0}>
      <schematictext text="20 V PD input / bypass" schX={-7} schY={3.8} fontSize={0.28} />
      <schematictext text="Four-switch buck-boost / 400 kHz" schX={0} schY={7.5} fontSize={0.28} />
      <schematictext text="Output capacitors and 10 mΩ shunt" schX={11.5} schY={3.8} fontSize={0.28} />
      <schematictext text="TEC: 2.1–15 V / 0.5–6 A" schX={17.5} schY={6} fontSize={0.25} />
      <schematictext text="72 W maximum" schX={17.5} schY={5.3} fontSize={0.25} />
      <schematictext text="Filtered Kelvin current sense" schX={8.5} schY={-3.2} fontSize={0.25} />
      <schematictext text="UVLO and hardware shutdown" schX={-7.5} schY={-2.9} fontSize={0.28} />
      <schematictext text="5 V logic bias / bypass" schX={-0.5} schY={-7.4} fontSize={0.25} />
      <schematictext text="TI EVM compensation / verify after routing" schX={6.5} schY={-8.5} fontSize={0.25} />
      <netlabel net="GND" connectsTo={[".U_DRIVER > .pin21", ".U_DRIVER > .pin2", ".U_DRIVER > .pin5", ".U_DRIVER > .pin9", ".U_DRIVER > .pin17"]} schX={0.4} schY={-4.2} anchorSide="top" />
      <netlabel net="GND" connectsTo=".C_DRIVER_IN1 > .pin2" schX={-9.2} schY={0.1} anchorSide="top" />
      <netlabel net="GND" connectsTo=".C_DRIVER_IN2 > .pin2" schX={-7.72} schY={0.1} anchorSide="top" />
      <netlabel net="GND" connectsTo=".C_DRIVER_IN3 > .pin2" schX={-5.8} schY={0.1} anchorSide="top" />
      <netlabel net="GND" connectsTo=".C_DRIVER_IN4 > .pin2" schX={-3.8} schY={0.1} anchorSide="top" />
      <netlabel net="GND" connectsTo=".C_DRIVER_INPUT_BULK > .pin2" schX={-9.2} schY={-1.5} anchorSide="top" />
      <netlabel net="GND" connectsTo=".C_DRIVER_INPUT_HF > .pin2" schX={-7.07} schY={-1.5} anchorSide="top" />
      <netlabel net="GND" connectsTo=".C_DRIVER_VCC > .pin2" schX={-1.8} schY={-6.4} anchorSide="top" />
      <netlabel net="GND" connectsTo=".C_DRIVER_VCC_HF > .pin2" schX={-0.05} schY={-6.4} anchorSide="top" />
      <netlabel net="GND" connectsTo=".C_DRIVER_OUT1 > .pin2" schX={4.3} schY={0.1} anchorSide="top" />
      <netlabel net="GND" connectsTo=".C_DRIVER_OUT2 > .pin2" schX={6.3} schY={0.1} anchorSide="top" />
      <netlabel net="GND" connectsTo=".C_DRIVER_OUT3 > .pin2" schX={8.3} schY={0.1} anchorSide="top" />
      <netlabel net="GND" connectsTo=".C_DRIVER_OUT4 > .pin2" schX={10.3} schY={0.1} anchorSide="top" />
      <netlabel net="GND" connectsTo=".C_DRIVER_OUTPUT_HF > .pin2" schX={12.3} schY={0.1} anchorSide="top" />
      <netlabel net="GND" connectsTo=".C_TEC_BULK > .pin2" schX={18.6} schY={0.1} anchorSide="top" />
      <netlabel net="GND" connectsTo=".R_DRIVER_FSW > .pin2" schX={-4} schY={-4.7} anchorSide="top" />
      <netlabel net="GND" connectsTo=".R_DRIVER_EN_BOTTOM > .pin2" schX={-10} schY={-6.5} anchorSide="top" />
      <netlabel net="GND" connectsTo=".C_DRIVER_EN > .pin2" schX={-7} schY={-6.5} anchorSide="top" />
      <netlabel net="GND" connectsTo=".C_COMP_ZERO > .pin2" schX={4.8} schY={-7.5} anchorSide="top" />
      <netlabel net="GND" connectsTo=".C_COMP_POLE > .pin2" schX={8} schY={-5.7} anchorSide="top" />
      <netlabel net="DRIVER_COMP_ZERO" connectsTo={[".R_COMP > .pin2", ".C_COMP_ZERO > .pin1"]} inline />
      <netlabel net="GND" connectsTo=".J_TEC > .pin2" schX={18.3} schY={1.7} anchorSide="top" />
    </group>
    <TPS55289RYQR name="U_DRIVER" schHeight={5.645} schWidth={4.51} schX={0} schY={0} schRotation={0} pcbX={0} pcbY={12} pcbRotation={0} layer="top" schSheetName="POWER" connections={{
      pin1: "net.DRIVER_ENABLE", pin2: "net.GND",
      pin3: "net.I2C_SCL", pin4: "net.I2C_SDA", pin5: "net.GND",
      pin6: "net.DRIVER_FSW", pin7: "net.VBUS_QUALIFIED",
      pin8: "net.DRIVER_SW1", pin9: "net.GND", pin10: "net.DRIVER_SW2",
      pin11: "net.DRIVER_OUT", pin12: "net.DRIVER_ISP", pin13: "net.DRIVER_ISN",
      pin14: "net.DRIVER_FAULT", pin15: "net.DRIVER_COMP",
      pin16: "net.DRIVER_CURRENT_MONITOR", pin17: "net.GND",
      // The external 5 V auxiliary supply stays available with EN low,
      // so live MCU I2C pull-ups do not exceed the VCC + 0.3 V rating.
      pin18: "net.LOGIC_5V", pin19: "net.DRIVER_BOOT2",
      pin20: "net.DRIVER_BOOT1", pin21: "net.GND",
    }} />
    <SRP1265A_4R7M name="L_OUT" schX={0} schY={6} schRotation={0} pcbX={0} pcbY={22.5} pcbRotation={0} layer="top" schSheetName="POWER" connections={{
      pin1: "net.DRIVER_SW1", pin2: "net.DRIVER_SW2",
    }} />
    <RLM25FEER010 name="R_SENSE" schX={15.3} schY={2.5} schRotation={90} pcbX={20} pcbY={15} pcbRotation={0} layer="top" schSheetName="POWER" connections={{
      pin1: "net.DRIVER_OUT", pin2: "net.TEC_POS",
    }} />
    <UMK325BJ106KM_T name="C_DRIVER_IN1" schX={-9.2} schY={1.1} schRotation={270} maxVoltageRating="50V" pcbX={-10} pcbY={7.5} pcbRotation={90} layer="top" schSheetName="POWER"
      connections={{ pin1: "net.VBUS_QUALIFIED", pin2: "net.GND" }} />
    <UMK325BJ106KM_T name="C_DRIVER_IN2" schX={-7.72} schY={1.1} schRotation={270} maxVoltageRating="50V" pcbX={-6.5} pcbY={7.5} pcbRotation={90} layer="top" schSheetName="POWER"
      connections={{ pin1: "net.VBUS_QUALIFIED", pin2: "net.GND" }} />
    <UMK325BJ106KM_T name="C_DRIVER_IN3" schX={-5.8} schY={1.1} schRotation={270} maxVoltageRating="50V" pcbX={-10} pcbY={13} pcbRotation={90} layer="top" schSheetName="POWER"
      connections={{ pin1: "net.VBUS_QUALIFIED", pin2: "net.GND" }} />
    <UMK325BJ106KM_T name="C_DRIVER_IN4" schX={-3.8} schY={1.1} schRotation={270} maxVoltageRating="50V" pcbX={-6.5} pcbY={13} pcbRotation={90} layer="top" schSheetName="POWER"
      connections={{ pin1: "net.VBUS_QUALIFIED", pin2: "net.GND" }} />
    {/* Bulk for upstream cable transients; the ceramic bank carries HF ripple.
        PD load-switch inrush with this capacitance still needs qualification. */}
    <EEHZK1V101XP name="C_DRIVER_INPUT_BULK" schX={-9.2} schY={-0.5} schRotation={270} maxVoltageRating="35V" pcbX={-8} pcbY={-0.5} pcbRotation={270} layer="top" schSheetName="POWER"
      connections={{ pin1: "net.VBUS_QUALIFIED", pin2: "net.GND" }} />
    <Capacitor100nF name="C_DRIVER_INPUT_HF" schX={-7.07} schY={-0.5} schRotation={270} maxVoltageRating="50V" pcbX={-1.4} pcbY={8.1} pcbRotation={270} layer="top" schSheetName="POWER"
      connections={{ pin1: "net.VBUS_QUALIFIED", pin2: "net.GND" }} />
    <Capacitor100nF name="C_DRIVER_BOOT1" schX={-2.6} schY={4.7} schRotation={90} maxVoltageRating="50V" pcbX={-2} pcbY={14.9} pcbRotation={0} layer="top" schSheetName="POWER"
      connections={{ pin1: "net.DRIVER_BOOT1", pin2: "net.DRIVER_SW1" }} />
    <Capacitor100nF name="C_DRIVER_BOOT2" schX={2.6} schY={4.7} schRotation={90} maxVoltageRating="50V" pcbX={2} pcbY={14.9} pcbRotation={180} layer="top" schSheetName="POWER"
      connections={{ pin1: "net.DRIVER_BOOT2", pin2: "net.DRIVER_SW2" }} />
    <Capacitor10uF name="C_DRIVER_VCC" schX={-1.8} schY={-5.5} schRotation={270} maxVoltageRating="25V" pcbX={5.6} pcbY={13.8} pcbRotation={0} layer="top" schSheetName="POWER"
      connections={{ pin1: "net.LOGIC_5V", pin2: "net.GND" }} />
    <Capacitor100nF name="C_DRIVER_VCC_HF" schX={-0.05} schY={-5.5} schRotation={270} maxVoltageRating="50V" pcbX={5.6} pcbY={11.6} pcbRotation={0} layer="top" schSheetName="POWER"
      connections={{ pin1: "net.LOGIC_5V", pin2: "net.GND" }} />
    <GRM32ER71E226KE15L name="C_DRIVER_OUT1" schX={4.3} schY={1.1} schRotation={270} maxVoltageRating="25V" pcbX={10.5} pcbY={7.5} pcbRotation={270} layer="top" schSheetName="POWER"
      connections={{ pin1: "net.DRIVER_OUT", pin2: "net.GND" }} />
    <GRM32ER71E226KE15L name="C_DRIVER_OUT2" schX={6.3} schY={1.1} schRotation={270} maxVoltageRating="25V" pcbX={14} pcbY={7.5} pcbRotation={270} layer="top" schSheetName="POWER"
      connections={{ pin1: "net.DRIVER_OUT", pin2: "net.GND" }} />
    <GRM32ER71E226KE15L name="C_DRIVER_OUT3" schX={8.3} schY={1.1} schRotation={270} maxVoltageRating="25V" pcbX={10.5} pcbY={13} pcbRotation={270} layer="top" schSheetName="POWER"
      connections={{ pin1: "net.DRIVER_OUT", pin2: "net.GND" }} />
    <GRM32ER71E226KE15L name="C_DRIVER_OUT4" schX={10.3} schY={1.1} schRotation={270} maxVoltageRating="25V" pcbX={14} pcbY={13} pcbRotation={270} layer="top" schSheetName="POWER"
      connections={{ pin1: "net.DRIVER_OUT", pin2: "net.GND" }} />
    <Capacitor100nF name="C_DRIVER_OUTPUT_HF" schX={12.3} schY={1.1} schRotation={270} maxVoltageRating="50V" pcbX={1.4} pcbY={8.1} pcbRotation={270} layer="top" schSheetName="POWER"
      connections={{ pin1: "net.DRIVER_OUT", pin2: "net.GND" }} />
    {/* Post-shunt bulk follows TI's EVM topology. Capacitor transients are
        distinct from the slow average current limit delivered to the TEC. */}
    <OVZ101M1ETR_0606 name="C_TEC_BULK" schX={18.6} schY={1.1} schRotation={270} maxVoltageRating="25V" pcbX={20.5} pcbY={23.5} pcbRotation={90} layer="top" schSheetName="POWER"
      connections={{ pin1: "net.TEC_POS", pin2: "net.GND" }} />
    {/* Separate top-side Kelvin taps terminate at the shunt lands. */}
    <Resistor0603 name="R_ISP_FILTER" schX={6.75} schY={-0.9} schRotation={180} resistance="10"
      manufacturerPartNumber="0603WAF100JT5E" supplierPartNumbers={{ jlcpcb: ["C22859"] }} pcbX={5.3} pcbY={10} pcbRotation={0} layer="top" schSheetName="POWER"
      connections={{ pin1: "net.DRIVER_OUT", pin2: "net.DRIVER_ISP" }} />
    <Resistor0603 name="R_ISN_FILTER" schX={7.25} schY={-2.1} schRotation={270} resistance="10"
      manufacturerPartNumber="0603WAF100JT5E" supplierPartNumbers={{ jlcpcb: ["C22859"] }} pcbX={5} pcbY={5.5} pcbRotation={180} layer="top" schSheetName="POWER"
      connections={{ pin1: "net.TEC_POS", pin2: "net.DRIVER_ISN" }} />
    <Capacitor220nF name="C_CURRENT_FILTER" schX={4.5} schY={-1.5} schRotation={270} maxVoltageRating="50V" pcbX={8} pcbY={3.5} pcbRotation={90} layer="top" schSheetName="POWER"
      connections={{ pin1: "net.DRIVER_ISP", pin2: "net.DRIVER_ISN" }} />
    <Resistor0603 name="R_DRIVER_FSW" schX={-4} schY={-3.8} schRotation={270} resistance="49.9k"
      manufacturerPartNumber="0603WAF4992T5E" supplierPartNumbers={{ jlcpcb: ["C23184"] }} pcbX={16.2} pcbY={18} pcbRotation={0} layer="top" schSheetName="POWER"
      connections={{ pin1: "net.DRIVER_FSW", pin2: "net.GND" }} />
    {/* Initial compensation is TI EVM's 27.4k / 4.7nF / 100pF network. */}
    <Resistor0603 name="R_COMP" schX={4.8} schY={-4.8} schRotation={270} resistance="27.4k"
      manufacturerPartNumber="0603WAF2742T5E" supplierPartNumbers={{ jlcpcb: ["C22964"] }} pcbX={9.5} pcbY={18.8} pcbRotation={0} layer="top" schSheetName="POWER"
      connections={{ pin1: "net.DRIVER_COMP", pin2: "net.DRIVER_COMP_ZERO" }} />
    <Capacitor4n7F name="C_COMP_ZERO" schX={4.8} schY={-6.7} schRotation={270} maxVoltageRating="50V" pcbX={12.7} pcbY={18.8} pcbRotation={0} layer="top" schSheetName="POWER"
      connections={{ pin1: "net.DRIVER_COMP_ZERO", pin2: "net.GND" }} />
    <Capacitor100pF name="C_COMP_POLE" schX={8} schY={-4.8} schRotation={270} maxVoltageRating="100V" pcbX={9.5} pcbY={16.8} pcbRotation={0} layer="top" schSheetName="POWER"
      connections={{ pin1: "net.DRIVER_COMP", pin2: "net.GND" }} />
    {/* Independent UVLO rejects 5 V even if the MCU releases its reset clamp.
        PD fault and the reset/watchdog clamp pull DRIVER_ENABLE low. */}
    <Resistor0603 name="R_DRIVER_EN_TOP" schX={-10} schY={-3.8} schRotation={270} resistance="130k"
      manufacturerPartNumber="0603WAF1303T5E" supplierPartNumbers={{ jlcpcb: ["C22795"] }} pcbX={4} pcbY={3} pcbRotation={0} layer="top" schSheetName="POWER"
      connections={{ pin1: "net.VBUS_QUALIFIED", pin2: "net.DRIVER_ENABLE" }} />
    <Resistor0603 name="R_DRIVER_EN_BOTTOM" schX={-10} schY={-5.6} schRotation={270} resistance="10k"
      manufacturerPartNumber="0603WAF1002T5E" supplierPartNumbers={{ jlcpcb: ["C25804"] }} pcbX={4} pcbY={1} pcbRotation={0} layer="top" schSheetName="POWER"
      connections={{ pin1: "net.DRIVER_ENABLE", pin2: "net.GND" }} />
    <Capacitor100nF name="C_DRIVER_EN" schX={-7} schY={-5.6} schRotation={270} maxVoltageRating="50V" pcbX={4} pcbY={-1} pcbRotation={0} layer="top" schSheetName="POWER"
      connections={{ pin1: "net.DRIVER_ENABLE", pin2: "net.GND" }} />
  </>
}
