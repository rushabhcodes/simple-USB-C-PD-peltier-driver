import { USB4110_GF_A } from "../../imports/USB4110_GF_A"
import { connectorPlacements } from "../assembly/connector-placement"
import { USBLC6_2SC6 } from "../../imports/USBLC6_2SC6"
import { TPS2116DRLR } from "../../imports/TPS2116DRLR"
import { LMR50410Y5FQDBVRQ1 } from "../../imports/LMR50410Y5FQDBVRQ1"
import { TLV75533PDBVR } from "../../imports/TLV75533PDBVR"
import { SWPA4018S4R7MT } from "../../imports/SWPA4018S4R7MT"
import { CC0805KKX7R9BB225 as Capacitor2u2F } from "../../imports/CC0805KKX7R9BB225"
import { CC0603KRX7R9BB104 as Capacitor100nF } from "../parts/C14663"
import { CC0603KRX7R8BB105 as Capacitor1uF } from "../../imports/CC0603KRX7R8BB105"
import { CL21A106KAYNNNE as Capacitor10uF } from "../../imports/CL21A106KAYNNNE"
import { A_0603WAF1001T5E as Resistor0603 } from "../../imports/A_0603WAF1001T5E"

export function ProgrammingAndLogicPower() {
  return <>
    <group name="LOGIC_NOTES" schSheetName="LOGIC" schX={0} schY={0}>
      <schematictext text="USB PROGRAM: data, CC detection and host 5 V" schX={-5} schY={10.2} fontSize={0.35} />
      <schematictext text="Logic supplies: PD 20 V / host 5 V → isolated 5 V → 3.3 V" schX={0} schY={1} fontSize={0.35} />
      <netlabel net="PROGRAM_VBUS" connectsTo={[".U_LOGIC_MUX > .pin6", ".C_PROGRAM_IN > .pin1"]} schX={0} schY={-3.4} anchorSide="bottom" />
      <schematictext text="TPS2116: MODE = 0, PR1 = 0 → higher-voltage 5 V source, reverse blocking" schX={0} schY={0} fontSize={0.28} />
    </group>
    <USB4110_GF_A name="J_PROGRAM" {...connectorPlacements.J_PROGRAM} schX={-12} schY={7} schRotation={0} schSheetName="LOGIC"
      schWidth={1.575} schHeight={3.4}
      schPinArrangement={{ leftSide: [], rightSide: [3, 7, 1, 14, 4, 13, 5, 12, 2, 8, 17, 6, 11] }}
      connections={{ pin1: "net.PROGRAM_CC1", pin14: "net.PROGRAM_CC2",
        pin2: "net.GND", pin8: "net.GND", pin17: "net.GND",
        pin3: "net.PROGRAM_VBUS", pin7: "net.PROGRAM_VBUS",
        pin4: "net.PROGRAM_USB_DP", pin13: "net.PROGRAM_USB_DP", pin5: "net.PROGRAM_USB_DM", pin12: "net.PROGRAM_USB_DM" }}
      noConnect={["SBU1", "SBU2"]} />
    <USBLC6_2SC6 name="U_PROGRAM_ESD" schX={-2} schY={7} schRotation={0} pcbX={-27.7} pcbY={-20} pcbRotation={90} schSheetName="LOGIC"
      schWidth={2.5} schHeight={2}
      schPinArrangement={{ leftSide: [1, 3], rightSide: [6, 4], topSide: [5], bottomSide: [2] }}
      connections={{ pin1: "net.PROGRAM_USB_DM", pin6: "net.PROGRAM_USB_DM", pin3: "net.PROGRAM_USB_DP",
        pin4: "net.PROGRAM_USB_DP", pin2: "net.GND", pin5: "net.LOGIC_5V" }} />
    <Capacitor100nF name="C_PROGRAM_ESD" schX={6} schY={-7} schRotation={270} maxVoltageRating="50V" pcbX={-27.7} pcbY={-23} pcbRotation={0} schSheetName="LOGIC"
      connections={{ pin1: "net.LOGIC_5V", pin2: "net.GND" }} />
    {/* Program USB powers only logic. TPS2116 prevents either USB source feeding
        the other, and avoids a Schottky drop on the main converter's VCC supply. */}
    <TPS2116DRLR name="U_LOGIC_MUX" schX={4} schY={-4} schRotation={0} pcbX={-19} pcbY={-17} schSheetName="LOGIC" noConnect={["ST"]}
      schWidth={2.055} schHeight={0.97}
      schPinArrangement={{ leftSide: [3, 6], rightSide: [2, 7], topSide: [8], bottomSide: [1, 4, 5] }}
      connections={{ pin1: "net.GND", pin2: "net.LOGIC_5V", pin7: "net.LOGIC_5V", pin3: "net.AUX_5V",
        pin4: "net.GND", pin5: "net.GND", pin6: "net.PROGRAM_VBUS" }} />
    <Capacitor1uF name="C_PROGRAM_IN" schX={0} schY={-6} schRotation={270} maxVoltageRating="25V" pcbX={-18.750064} pcbY={-14.35} pcbRotation={90} schSheetName="LOGIC"
      connections={{ pin1: "net.PROGRAM_VBUS", pin2: "net.GND" }} />
    <Capacitor1uF name="C_LOGIC_MUX_OUT" schX={7.8} schY={-7} schRotation={270} maxVoltageRating="25V" pcbX={-20.4} pcbY={-19.7} pcbRotation={270} schSheetName="LOGIC"
      connections={{ pin1: "net.LOGIC_5V", pin2: "net.GND" }} />
    <LMR50410Y5FQDBVRQ1 name="U_AUX" schX={-10} schY={-4} schRotation={0} pcbX={-21} pcbY={-9} pcbRotation={180} schSheetName="LOGIC"
      schWidth={1.675} schHeight={0.875}
      schPinArrangement={{ leftSide: [5, 4], rightSide: [6, 3], topSide: [1], bottomSide: [2] }}
      connections={{ pin1: "net.AUX_BOOT", pin2: "net.GND", pin3: "net.AUX_5V",
        pin4: "net.VBUS_RAW", pin5: "net.VBUS_RAW", pin6: "net.AUX_SW" }} />
    <SWPA4018S4R7MT name="L_AUX" schX={-6.5} schY={-3.7} schRotation={0} pcbX={-15} pcbY={-10.2} pcbRotation={0} schSheetName="LOGIC"
      connections={{ pin1: "net.AUX_SW", pin2: "net.AUX_5V" }} />
    {/* Raw PD capacitance remains below USB-C's 10 uF attachment limit. */}
    <Capacitor2u2F name="C_AUX_IN" schX={-15} schY={-6} schRotation={270} pcbX={-22} pcbY={-13.8} pcbRotation={180} schSheetName="LOGIC"
      connections={{ pin1: "net.VBUS_RAW", pin2: "net.GND" }} />
    <Capacitor100nF name="C_AUX_HF" schX={-13.2} schY={-6} schRotation={270} maxVoltageRating="50V" pcbX={-21.7} pcbY={-11.9} pcbRotation={180} schSheetName="LOGIC"
      connections={{ pin1: "net.VBUS_RAW", pin2: "net.GND" }} />
    <Capacitor100nF name="C_AUX_BOOT" schX={-9} schY={-1.8} schRotation={90} maxVoltageRating="50V" pcbX={-18.5} pcbY={-9} pcbRotation={270} schSheetName="LOGIC"
      connections={{ pin1: "net.AUX_BOOT", pin2: "net.AUX_SW" }} />
    <Capacitor10uF name="C_AUX_OUT" schX={-3.7} schY={-6} schRotation={270} maxVoltageRating="25V" pcbX={-13.400054} pcbY={-14.5} pcbRotation={270} schSheetName="LOGIC"
      connections={{ pin1: "net.AUX_5V", pin2: "net.GND" }} />
    <TLV75533PDBVR name="U_CTRL_LDO" schX={12} schY={-4} schRotation={0} pcbX={-12} pcbY={-21.1} pcbRotation={180} schSheetName="LOGIC" noConnect={["NC"]}
      schWidth={1.675} schHeight={0.875}
      schPinArrangement={{ leftSide: [1, 3], rightSide: [5], topSide: [4], bottomSide: [2] }}
      connections={{ pin1: "net.LOGIC_5V", pin2: "net.GND", pin3: "net.LOGIC_5V", pin5: "net.CTRL_3V3" }} />
    <Capacitor1uF name="C_LDO_IN" schX={9.6} schY={-7} schRotation={270} maxVoltageRating="25V" pcbX={-13.300099} pcbY={-18} pcbRotation={90} schSheetName="LOGIC"
      connections={{ pin1: "net.LOGIC_5V", pin2: "net.GND" }} />
    <Capacitor1uF name="C_LDO_OUT" schX={15} schY={-7} schRotation={270} maxVoltageRating="25V" pcbX={-10.699901} pcbY={-18} pcbRotation={90} schSheetName="LOGIC"
      connections={{ pin1: "net.CTRL_3V3", pin2: "net.GND" }} />
    <Resistor0603 name="R_PROGRAM_CC1" schX={-7} schY={6.7} schRotation={270} resistance="5.1k" pcbX={-28} pcbY={-14} pcbRotation={0} schSheetName="LOGIC"
      manufacturerPartNumber="0603WAF5101T5E" supplierPartNumbers={{ jlcpcb: ["C23186"] }}
      connections={{ pin1: "net.PROGRAM_CC1", pin2: "net.GND" }} />
    <Resistor0603 name="R_PROGRAM_CC2" schX={-5} schY={6.7} schRotation={270} resistance="5.1k" pcbX={-28} pcbY={-16.5} pcbRotation={0} schSheetName="LOGIC"
      manufacturerPartNumber="0603WAF5101T5E" supplierPartNumbers={{ jlcpcb: ["C23186"] }}
      connections={{ pin1: "net.PROGRAM_CC2", pin2: "net.GND" }} />

  </>
}
