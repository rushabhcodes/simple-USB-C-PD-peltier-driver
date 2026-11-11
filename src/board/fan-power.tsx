import { LMR50410XDBVR } from "../../imports/LMR50410XDBVR"
import { connectorPlacements } from "../assembly/connector-placement"
import { SWPA8040S330MT } from "../../imports/SWPA8040S330MT"
import { A_470531000 as PcFanHeader } from "../../imports/A_470531000"
import { UMK325BJ106KM_T as Capacitor10uF50V } from "../../imports/UMK325BJ106KM_T"
import { GRM32ER71E226KE15L as Capacitor22uF25V } from "../../imports/GRM32ER71E226KE15L"
import { CC0603KRX7R9BB104 as Capacitor100nF50V } from "../parts/C14663"
import { A_0603WAF1001T5E as Resistor0603 } from "../../imports/A_0603WAF1001T5E"
import { FanRouting } from "./fan-routing"

// TI LMR50410: 1 V feedback reference, 700 kHz, internal compensation,
// synchronous rectification and 1.8 ms typical soft-start. The 33 uH filter
// follows TI's 12 V example (datasheet table 9-1); 110k / 10k gives 12 V.
// https://www.ti.com/lit/ds/symlink/lmr50410.pdf
// User fan budget: 12 V / 0.5 A continuous. The regulator's 1 A rating and
// cycle-by-cycle protection do not implement a precision 0.5 A current limit.
export function FanPowerBlock() {
  return <>
    <group name="FAN_NOTES" schSheetName="FAN" schX={0} schY={0}>
      <schematictext text="Qualified 20 V PD → fixed 12 V fan supply" schX={3} schY={4} fontSize={0.3} />
      <schematictext text="700 kHz synchronous buck / 1 A regulator" schX={-0.8} schY={3.1} fontSize={0.25} />
      <schematictext text="12 V / 0.5 A fan budget" schX={10} schY={3} fontSize={0.25} />
      <schematictext text="1 V × (1 + 110k / 10k) = 12 V" schX={5} schY={-5} fontSize={0.25} />
      <schematictext text="Fan stays powered when TEC is off" schX={0} schY={-5.8} fontSize={0.25} />
      <schematictext text="Pin 3: tach unmonitored / pin 4: PWM open → full speed" schX={10} schY={-2} fontSize={0.25} />
      <netlabel net="GND" connectsTo=".U_FAN > .pin2" schX={0} schY={-0.9} anchorSide="top" />
      <netlabel net="GND" connectsTo=".C_FAN_IN > .pin2" schX={-5} schY={-0.4} anchorSide="top" />
      <netlabel net="GND" connectsTo=".C_FAN_IN_HF > .pin2" schX={-3.2} schY={-0.4} anchorSide="top" />
      <netlabel net="GND" connectsTo=".C_FAN_OUT1 > .pin2" schX={6} schY={-0.6} anchorSide="top" />
      <netlabel net="GND" connectsTo=".C_FAN_OUT2 > .pin2" schX={7.8} schY={-0.6} anchorSide="top" />
      <netlabel net="GND" connectsTo=".R_FAN_FB_BOTTOM > .pin2" schX={4.5} schY={-4.2} anchorSide="top" />
      <netlabel net="GND" connectsTo=".J_FAN > .pin1" schX={10.5} schY={0.2} anchorSide="top" />
      <netlabel net="FAN_BOOT" connectsTo={[".U_FAN > .pin1", ".C_FAN_BOOT > .pin1"]} inline />
    </group>
    {/* Fan power remains on while qualified PD is present, including TEC Off.
        It is independent of the variable TEC output. */}
    <LMR50410XDBVR name="U_FAN" schHeight={1.885} schWidth={1.675} schX={0} schY={1} schRotation={0} pcbX={-29} pcbY={-0.29999999999999716} pcbRotation={180} schSheetName="FAN"
      connections={{ pin1: "net.FAN_BOOT", pin2: "net.GND", pin3: "net.FAN_FB",
        pin4: "net.VBUS_QUALIFIED", pin5: "net.VBUS_QUALIFIED", pin6: "net.FAN_SW" }} />
    <SWPA8040S330MT name="L_FAN" schX={4} schY={1.7} schRotation={0} pcbX={-21.3} pcbY={-1.2999999999999972} schSheetName="FAN"
      connections={{ pin1: "net.FAN_SW", pin2: "net.FAN_12V" }} />
    <Capacitor10uF50V name="C_FAN_IN" schX={-5} schY={0.5} schRotation={270} maxVoltageRating="50V" pcbX={-34.1} pcbY={-0.29999999999999716} pcbRotation={90} schSheetName="FAN"
      connections={{ pin1: "net.VBUS_QUALIFIED", pin2: "net.GND" }} />
    <Capacitor100nF50V name="C_FAN_IN_HF" schX={-3.2} schY={0.5} schRotation={270} maxVoltageRating="50V" pcbX={-31.5} pcbY={-0.29999999999999716} pcbRotation={90} schSheetName="FAN"
      connections={{ pin1: "net.VBUS_QUALIFIED", pin2: "net.GND" }} />
    <Capacitor100nF50V name="C_FAN_BOOT" schX={2.4} schY={2.4} schRotation={90} maxVoltageRating="50V" pcbX={-26.5} pcbY={-0.19999999999999574} pcbRotation={270} schSheetName="FAN"
      connections={{ pin1: "net.FAN_BOOT", pin2: "net.FAN_SW" }} />
    <Capacitor22uF25V name="C_FAN_OUT1" schX={6} schY={0.3} schRotation={270} maxVoltageRating="25V" pcbX={-14.2} pcbY={1.4000000000000057} schSheetName="FAN"
      connections={{ pin1: "net.FAN_12V", pin2: "net.GND" }} />
    <Capacitor22uF25V name="C_FAN_OUT2" schX={7.8} schY={0.3} schRotation={270} maxVoltageRating="25V" pcbX={-14.2} pcbY={-3.6999999999999957} schSheetName="FAN"
      connections={{ pin1: "net.FAN_12V", pin2: "net.GND" }} />
    <Resistor0603 name="R_FAN_FB_TOP" schX={4.5} schY={-1.7} schRotation={270} resistance="110k" manufacturerPartNumber="0603WAF1103T5E"
      supplierPartNumbers={{ jlcpcb: ["C25805"] }} pcbX={-33} pcbY={3.3000000000000043} schSheetName="FAN"
      connections={{ pin1: "net.FAN_12V", pin2: "net.FAN_FB" }} />
    <Resistor0603 name="R_FAN_FB_BOTTOM" schX={4.5} schY={-3.4} schRotation={270} resistance="10k" manufacturerPartNumber="0603WAF1002T5E"
      supplierPartNumbers={{ jlcpcb: ["C25804"] }} pcbX={-30} pcbY={3.3000000000000043} schSheetName="FAN"
      connections={{ pin1: "net.FAN_FB", pin2: "net.GND" }} />
    {/* Molex 47053-1000 is a standard keyed PC fan header. Compatible 12 V
        3-pin fans use pins 1-3; 4-pin fans run at full speed with PWM unconnected.
        Tach is not monitored. Noctua's PWM whitepaper specifies this header.
        https://noctua.at/pub/media/wysiwyg/Noctua_PWM_specifications_white_paper.pdf */}
    <PcFanHeader name="J_FAN" {...connectorPlacements.J_FAN} schX={11.5} schY={1.2} schRotation={0} schSheetName="FAN"
      connections={{ pin1: "net.GND", pin2: "net.FAN_12V" }} noConnect={["pin3", "pin4"]} />

    <FanRouting />
  </>
}
