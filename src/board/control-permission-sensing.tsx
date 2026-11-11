import { MMBT3904_RANGE_100_300_ } from "../parts/C20526"
import { A_2N7002 } from "../../imports/A_2N7002"
import { CC0603KRX7R9BB104 as Capacitor100nF } from "../parts/C14663"
import { A_0603WAF1001T5E as Resistor0603 } from "../../imports/A_0603WAF1001T5E"

export function PermissionAndSensing() {
  return <>
    <group name="MONITOR_NOTES" schSheetName="MONITOR" schX={0} schY={0} schLayout={{ layoutMode: "none" }}>
      <schematictext text="OUTPUT PERMISSION / FAIL-OFF" schX={-10.15} schY={8.26} fontSize={0.4} anchor="left" />
      <schematictext text="GP2 HIGH releases Q_MCU_KILL. LOW, reset or unpowered keeps DRIVER_ENABLE LOW." schX={-10.15} schY={7.35} fontSize={0.24} anchor="left" />
      <schematictext text="FAULT INPUTS" schX={3.15} schY={8.26} fontSize={0.4} anchor="left" />
      <schematictext text="GP3: converter fault, active LOW" schX={3.15} schY={3.93} fontSize={0.24} anchor="left" />
      <schematictext text="GP4: PD fault, active HIGH" schX={3.15} schY={1.89} fontSize={0.24} anchor="left" />
      <schematictext text="CURRENT / GP26 ADC0" schX={-10.15} schY={0.35} fontSize={0.32} anchor="left" />
      <schematictext text="0.2 V/A; 1k + 100nF filter" schX={-10.15} schY={-0.35} fontSize={0.23} anchor="left" />
      <schematictext text="TEC VOLTAGE / GP27 ADC1" schX={-3.85} schY={0.35} fontSize={0.32} anchor="left" />
      <schematictext text="100k / 20k: V_TEC / 6" schX={-3.85} schY={-0.35} fontSize={0.23} anchor="left" />
      <schematictext text="QUALIFIED PD / GP28 ADC2" schX={2.45} schY={0.35} fontSize={0.32} anchor="left" />
      <schematictext text="150k / 22k: V_PD x 22 / 172" schX={2.45} schY={-0.35} fontSize={0.23} anchor="left" />
      <schematictext text="PROGRAM VBUS / GP29 ADC3" schX={8.75} schY={0.35} fontSize={0.32} anchor="left" />
      <schematictext text="15k / 20k: V_USB x 4 / 7" schX={8.75} schY={-0.35} fontSize={0.23} anchor="left" />
      <schematictext text="ADC readings use the 3V3 reference and are approximate. Converter CC/CV regulation is independent." schX={-10.15} schY={-6.65} fontSize={0.25} anchor="left" />
    </group>
    <MMBT3904_RANGE_100_300_ name="Q_MCU_KILL" schX={-2.1} schY={4.2} schRotation={0} pcbX={12} pcbY={-8} schSheetName="MONITOR"
      connections={{ pin1: "net.DRIVER_KILL_BASE", pin2: "net.GND", pin3: "net.DRIVER_ENABLE" }} />
    <A_2N7002 name="Q_MCU_RELEASE" schX={-6.3} schY={3.5} schRotation={0} pcbX={21} pcbY={-8} schSheetName="MONITOR" />
    <trace from=".Q_MCU_RELEASE > .pin1" to="net.DRIVER_RELEASE_GATE" />
    <trace from=".Q_MCU_RELEASE > .pin2" to="net.GND" />
    <trace from=".Q_MCU_RELEASE > .pin3" to="net.DRIVER_KILL_BASE" />
    <Resistor0603 name="R_KILL_DRIVE" schX={-8.4} schY={3.5} schRotation={0} resistance="1k" pcbX={8.5} pcbY={-15.5} schSheetName="MONITOR"
      manufacturerPartNumber="0603WAF1001T5E" supplierPartNumbers={{ jlcpcb: ["C21190"] }}
      connections={{ pin1: "net.MCU_DRIVER_PERMISSION", pin2: "net.DRIVER_RELEASE_GATE" }} />
    <Resistor0603 name="R_KILL_RESET" schX={-4.2} schY={5.6} schRotation={270} resistance="47k" pcbX={12} pcbY={-11} schSheetName="MONITOR"
      manufacturerPartNumber="0603WAF4702T5E" supplierPartNumbers={{ jlcpcb: ["C25819"] }}
      connections={{ pin1: "net.LOGIC_5V", pin2: "net.DRIVER_KILL_BASE" }} />
    <Resistor0603 name="R_RELEASE_OFF" schX={-7.35} schY={2.24} schRotation={270} resistance="100k" pcbX={20} pcbY={-18} schSheetName="MONITOR"
      manufacturerPartNumber="0603WAF1003T5E" supplierPartNumbers={{ jlcpcb: ["C25803"] }}
      connections={{ pin1: "net.DRIVER_RELEASE_GATE", pin2: "net.GND" }} />
    <Resistor0603 name="R_PD_FAULT_SENSE" schX={4.2} schY={3.15} schRotation={0} resistance="10k" pcbX={16} pcbY={-8} schSheetName="MONITOR"
      manufacturerPartNumber="0603WAF1002T5E" supplierPartNumbers={{ jlcpcb: ["C25804"] }}
      connections={{ pin1: "net.PD_FAULT", pin2: "net.PD_FAULT_SENSE" }} />
    <Resistor0603 name="R_DRIVER_FAULT" schX={7} schY={5.6} schRotation={270} resistance="4.7k" pcbX={16} pcbY={-19} schSheetName="MONITOR"
      manufacturerPartNumber="0603WAF4701T5E" supplierPartNumbers={{ jlcpcb: ["C23162"] }}
      connections={{ pin1: "net.CTRL_3V3", pin2: "net.DRIVER_FAULT" }} />
    <Resistor0603 name="R_I_ADC" schX={-8.75} schY={-2.1} schRotation={0} resistance="1k" pcbX={8.5} pcbY={-19} schSheetName="MONITOR"
      manufacturerPartNumber="0603WAF1001T5E" supplierPartNumbers={{ jlcpcb: ["C21190"] }}
      connections={{ pin1: "net.DRIVER_CURRENT_MONITOR", pin2: "net.OUTPUT_CURRENT_ADC" }} />
    <Resistor0603 name="R_V_ADC_TOP" schX={-2.8} schY={-1.4} schRotation={270} resistance="100k" pcbX={16} pcbY={-11} schSheetName="MONITOR"
      manufacturerPartNumber="0603WAF1003T5E" supplierPartNumbers={{ jlcpcb: ["C25803"] }}
      connections={{ pin1: "net.TEC_POS", pin2: "net.OUTPUT_VOLTAGE_ADC" }} />
    <Resistor0603 name="R_V_ADC_BOTTOM" schX={-2.8} schY={-4.2} schRotation={270} resistance="20k" pcbX={16} pcbY={-15} schSheetName="MONITOR"
      manufacturerPartNumber="0603WAF2002T5E" supplierPartNumbers={{ jlcpcb: ["C4184"] }}
      connections={{ pin1: "net.OUTPUT_VOLTAGE_ADC", pin2: "net.GND" }} />
    <Resistor0603 name="R_PD_ADC_TOP" schX={3.5} schY={-1.4} schRotation={270} resistance="150k" pcbX={-20} pcbY={-25} schSheetName="MONITOR"
      manufacturerPartNumber="0603WAF1503T5E" supplierPartNumbers={{ jlcpcb: ["C22807"] }}
      connections={{ pin1: "net.VBUS_QUALIFIED", pin2: "net.INPUT_VOLTAGE_ADC" }} />
    <Resistor0603 name="R_PD_ADC_BOTTOM" schX={3.5} schY={-4.2} schRotation={270} resistance="22k" pcbX={-16} pcbY={-25} schSheetName="MONITOR"
      manufacturerPartNumber="0603WAF2202T5E" supplierPartNumbers={{ jlcpcb: ["C31850"] }}
      connections={{ pin1: "net.INPUT_VOLTAGE_ADC", pin2: "net.GND" }} />
    <Resistor0603 name="R_PROGRAM_SENSE_TOP" schX={9.8} schY={-1.4} schRotation={270} resistance="15k" pcbX={8} pcbY={-23} schSheetName="MONITOR"
      manufacturerPartNumber="0603WAF1502T5E" supplierPartNumbers={{ jlcpcb: ["C22809"] }}
      connections={{ pin1: "net.PROGRAM_VBUS", pin2: "net.PROGRAM_VBUS_SENSE" }} />
    <Resistor0603 name="R_PROGRAM_SENSE_BOTTOM" schX={9.8} schY={-4.2} schRotation={270} resistance="20k" pcbX={12} pcbY={-23} schSheetName="MONITOR"
      manufacturerPartNumber="0603WAF2002T5E" supplierPartNumbers={{ jlcpcb: ["C4184"] }}
      connections={{ pin1: "net.PROGRAM_VBUS_SENSE", pin2: "net.GND" }} />
    <Capacitor100nF name="C_I_ADC" schX={-7} schY={-4.2} schRotation={270} maxVoltageRating="50V" pcbX={12} pcbY={-19} schSheetName="MONITOR"
      connections={{ pin1: "net.OUTPUT_CURRENT_ADC", pin2: "net.GND" }} />
    <Capacitor100nF name="C_V_ADC" schX={-0.7} schY={-4.2} schRotation={270} maxVoltageRating="50V" pcbX={20} pcbY={-15} schSheetName="MONITOR"
      connections={{ pin1: "net.OUTPUT_VOLTAGE_ADC", pin2: "net.GND" }} />
    <Capacitor100nF name="C_PD_ADC" schX={5.6} schY={-4.2} schRotation={270} maxVoltageRating="50V" pcbX={-12} pcbY={-25} schSheetName="MONITOR"
      connections={{ pin1: "net.INPUT_VOLTAGE_ADC", pin2: "net.GND" }} />
    <Capacitor100nF name="C_PROGRAM_SENSE" schX={11.9} schY={-5.2} schRotation={270} maxVoltageRating="50V" pcbX={16} pcbY={-23} schSheetName="MONITOR"
      connections={{ pin1: "net.PROGRAM_VBUS_SENSE", pin2: "net.GND" }} />
  </>
}
