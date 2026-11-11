import { RP2040 } from "../../imports/RP2040"
import { W25Q128JVSIQ } from "../../imports/W25Q128JVSIQ"
import { ABM8_272_T3 } from "../../imports/ABM8_272_T3"
import { CC0603KRX7R9BB104 as Capacitor100nF } from "../parts/C14663"
import { Capacitor100nF0402 } from "../parts/Samsung0402Capacitors"
import { CC0603KRX7R8BB105 as Capacitor1uF } from "../../imports/CC0603KRX7R8BB105"
import { CL21A106KAYNNNE as Capacitor10uF } from "../../imports/CL21A106KAYNNNE"
import { CL10C150JB8NNNC as Capacitor15pF } from "../../imports/CL10C150JB8NNNC"
import { A_0603WAF1001T5E as Resistor0603 } from "../../imports/A_0603WAF1001T5E"

export function Rp2040Control() {
  return <>
    <group name="MCU_POWER_NOTES" schSheetName="MCU_POWER" schX={0} schY={0}>
      <schematictext text="IOVDD 3.3 V: local bypass at each package supply pin" schX={-4} schY={9} fontSize={0.35} />
      <schematictext text="ADC / USB 3.3 V supplies" schX={-4.5} schY={4.5} fontSize={0.32} anchor="left" />
      <schematictext text="Internal regulator: 3.3 V → 1.1 V" schX={-4.5} schY={0} fontSize={0.32} anchor="left" />
      <schematictext text="Both DVDD pins use RP_CORE_1V1" schX={2.5} schY={-4.5} fontSize={0.32} />
    </group>
    <group name="MCU_NOTES" schSheetName="MCU" schX={0} schY={0}>
      <schematictext text="Digital I/O: interlocks, sensors and I2C" schX={-10} schY={9.5} fontSize={0.35} />
      <schematictext text="ADC inputs from MONITOR" schX={-11} schY={2} fontSize={0.32} />
      <schematictext text="USB data, SWD and reset" schX={-11} schY={-4} fontSize={0.32} />
      <netlabel net="GND" connectsTo=".C_FLASH > .pin2" schX={13} schY={6} anchorSide="top" />
      <schematictext text="QSPI boot flash / 12 MHz crystal" schX={6} schY={9.5} fontSize={0.35} />
      <schematictext text="Unused GPIO: intentionally NC" schX={10} schY={-2.7} fontSize={0.32} />
    </group>
    <RP2040 name="U_MCU" noSchematicRepresentation pcbX={0} pcbY={-15} schSheetName="MCU"
      noConnect={["GPIO5", "GPIO10", "GPIO11", "GPIO12", "GPIO13", "GPIO14", "GPIO15",
        "GPIO16", "GPIO17", "GPIO18", "GPIO19", "GPIO20", "GPIO21", "GPIO22", "GPIO23", "GPIO24", "GPIO25"]}
      connections={{
        pin1: "net.CTRL_3V3", pin10: "net.CTRL_3V3", pin22: "net.CTRL_3V3",
        pin33: "net.CTRL_3V3", pin42: "net.CTRL_3V3", pin43: "net.CTRL_3V3",
        pin44: "net.CTRL_3V3", pin48: "net.CTRL_3V3", pin49: "net.CTRL_3V3",
        pin19: "net.GND", pin57: "net.GND", pin23: "net.RP_CORE_1V1", pin50: "net.RP_CORE_1V1", pin45: "net.RP_CORE_1V1",
        pin2: "net.I2C_SDA", pin3: "net.I2C_SCL", pin4: "net.MCU_DRIVER_PERMISSION",
        pin5: "net.DRIVER_FAULT", pin6: "net.PD_FAULT_SENSE", pin8: "net.LED_RUN_DRIVE", pin9: "net.LED_FAULT_DRIVE",
        pin11: "net.HOT_DATA_MCU", pin12: "net.COLD_DATA_MCU",
        pin20: "net.XIN", pin21: "net.XOUT", pin24: "net.SWCLK", pin25: "net.SWDIO", pin26: "net.MCU_RUN",
        pin38: "net.OUTPUT_CURRENT_ADC", pin39: "net.OUTPUT_VOLTAGE_ADC", pin40: "net.INPUT_VOLTAGE_ADC", pin41: "net.PROGRAM_VBUS_SENSE",
        pin46: "net.RP_USB_DM", pin47: "net.RP_USB_DP", pin51: "net.QSPI_SD3", pin52: "net.QSPI_SCLK",
        pin53: "net.QSPI_SD0", pin54: "net.QSPI_SD2", pin55: "net.QSPI_SD1", pin56: "net.QSPI_SS",
      }} />
    <schematicbox name="U_MCU_IO" chipRef=".U_MCU" width={3.29} height={2.4} schX={-11} schY={6} schSheetName="MCU"
      pinLabels={{ pin2: ["GP0_SDA", "GPIO0"], pin3: ["GP1_SCL", "GPIO1"], pin4: ["GP2_ALLOW", "GPIO2"],
        pin5: ["GP3_FAULT", "GPIO3"], pin6: ["GP4_PD", "GPIO4"], pin8: ["GP6_RUN_LED", "GPIO6"],
        pin9: ["GP7_FAULT_LED", "GPIO7"], pin11: ["GP8_HOT", "GPIO8"], pin12: ["GP9_COLD", "GPIO9"] }}
      schPinArrangement={{ leftSide: [5, 6, 11, 12], rightSide: [2, 3, 4, 8, 9] }}
      schPinStyle={{ pin5: { marginBottom: 0.2 }, pin6: { marginBottom: 0.3 }, pin11: { marginBottom: 0.2 },
        pin2: { marginBottom: 0.2 }, pin3: { marginBottom: 0.2 }, pin4: { marginBottom: 0.3 }, pin8: { marginBottom: 0.2 } }} />
    <schematicbox name="U_MCU_ADC" chipRef=".U_MCU" width={1.955} height={1.4} schX={-11} schY={0} schSheetName="MCU"
      pinLabels={{ pin38: ["GP26_ADC0", "GPIO26_ADC0"], pin39: ["GP27_ADC1", "GPIO27_ADC1"],
        pin40: ["GP28_ADC2", "GPIO28_ADC2"], pin41: ["GP29_ADC3", "GPIO29_ADC3"] }}
      schPinArrangement={{ leftSide: [38, 39, 40, 41], rightSide: [] }}
      schPinStyle={{ pin38: { marginBottom: 0.2 }, pin39: { marginBottom: 0.2 }, pin40: { marginBottom: 0.2 } }} />
    <schematicbox name="U_MCU_USB_DEBUG" chipRef=".U_MCU" width={2.245} height={1.4} schX={-11} schY={-6} schSheetName="MCU"
      pinLabels={{ pin24: "SWCLK", pin25: "SWD", pin26: "RUN", pin46: "USB_DM", pin47: "USB_DP" }}
      schPinArrangement={{ leftSide: [26, 24, 25], rightSide: [46, 47] }}
      schPinStyle={{ pin46: { marginBottom: 0.8 } }} />
    <schematicbox name="U_MCU_BOOT" chipRef=".U_MCU" width={2.435} height={2.8} schX={1.5} schY={4} schSheetName="MCU"
      pinLabels={{ pin20: "XIN", pin21: "XOUT", pin51: "QSPI_SD3", pin52: "QSPI_SCLK", pin53: "QSPI_SD0",
        pin54: "QSPI_SD2", pin55: "QSPI_SD1", pin56: "QSPI_SS" }}
      schPinArrangement={{ leftSide: [20, 21], rightSide: [56, 52, 53, 55, 54, 51] }}
      schPinStyle={{ pin20: { marginBottom: 0.8 }, pin56: { marginBottom: 0.3 }, pin52: { marginBottom: 0.3 },
        pin53: { marginBottom: 0.3 }, pin55: { marginBottom: 0.3 }, pin54: { marginBottom: 0.3 } }} />
    <schematicbox name="U_MCU_NC" chipRef=".U_MCU" width={2.34} height={2.8} schX={10} schY={-5.5} schSheetName="MCU"
      pinLabels={{ pin7: "GPIO5", pin13: "GPIO10", pin14: "GPIO11", pin15: "GPIO12", pin16: "GPIO13",
        pin17: "GPIO14", pin18: "GPIO15", pin27: "GPIO16", pin28: "GPIO17", pin29: "GPIO18", pin30: "GPIO19",
        pin31: "GPIO20", pin32: "GPIO21", pin34: "GPIO22", pin35: "GPIO23", pin36: "GPIO24", pin37: "GPIO25" }}
      schPinArrangement={{ leftSide: [7, 13, 14, 15, 16, 17, 18, 27, 28], rightSide: [29, 30, 31, 32, 34, 35, 36, 37] }}
      schPinStyle={{ pin7: { marginBottom: 0.1 }, pin13: { marginBottom: 0.1 }, pin14: { marginBottom: 0.1 }, pin15: { marginBottom: 0.1 },
        pin16: { marginBottom: 0.1 }, pin17: { marginBottom: 0.1 }, pin18: { marginBottom: 0.1 }, pin27: { marginBottom: 0.1 },
        pin29: { marginBottom: 0.1 }, pin30: { marginBottom: 0.1 }, pin31: { marginBottom: 0.1 }, pin32: { marginBottom: 0.1 },
        pin34: { marginBottom: 0.1 }, pin35: { marginBottom: 0.1 }, pin36: { marginBottom: 0.1 } }} />
    <schematicbox name="U_MCU_POWER" chipRef=".U_MCU" width={2.09} height={3.2} schX={-9} schY={0} schSheetName="MCU_POWER"
      pinLabels={{ pin1: "IOVDD6", pin10: "IOVDD5", pin22: "IOVDD4", pin33: "IOVDD3", pin42: "IOVDD2", pin49: "IOVDD1",
        pin43: "ADC_AVDD", pin48: "USB_VDD", pin44: "VREG_IN", pin45: "VREG_VOUT", pin23: "DVDD2", pin50: "DVDD1",
        pin19: "TESTEN", pin57: "GND" }}
      schPinArrangement={{ leftSide: [1, 10, 22, 33, 42, 49], rightSide: [43, 48, 44, 45, 23, 50], bottomSide: [19, 57] }}
      schPinStyle={{ pin1: { marginBottom: 0.3 }, pin10: { marginBottom: 0.3 }, pin22: { marginBottom: 0.3 },
        pin33: { marginBottom: 0.3 }, pin42: { marginBottom: 0.3 }, pin43: { marginBottom: 0.3 }, pin48: { marginBottom: 0.3 },
        pin44: { marginBottom: 0.3 }, pin45: { marginBottom: 0.3 }, pin23: { marginBottom: 0.3 } }} />
    {/* Winbond flash matches Raspberry Pi's reference circuit. The protected
        BOOTSEL pad can be grounded during RUN reset to enter the ROM USB loader. */}
    <W25Q128JVSIQ name="U_FLASH" schX={9} schY={4} schRotation={0} pcbX={-0.5} pcbY={-3.1} pcbRotation={0} schSheetName="MCU"
      schWidth={1.51} schHeight={3}
      schPinArrangement={{ leftSide: [1, 6, 5, 2, 3, 7], rightSide: [], topSide: [8], bottomSide: [4] }}
      schPinStyle={{ pin1: { marginBottom: 0.3 }, pin6: { marginBottom: 0.3 }, pin5: { marginBottom: 0.3 },
        pin2: { marginBottom: 0.3 }, pin3: { marginBottom: 0.3 } }}
      connections={{ pin1: "net.QSPI_SS", pin2: "net.QSPI_SD1", pin3: "net.QSPI_SD2", pin4: "net.GND",
        pin5: "net.QSPI_SD0", pin6: "net.QSPI_SCLK", pin7: "net.QSPI_SD3", pin8: "net.CTRL_3V3" }} />
    <ABM8_272_T3 name="Y_MCU" schX={-3} schY={0.5} schRotation={0} pcbX={0} pcbY={-23.2} schSheetName="MCU"
      connections={{ pin1: "net.XIN", pin2: "net.GND", pin3: "net.XOUT_CRYSTAL", pin4: "net.GND" }} />
    {/* RP2040 hardware design guide §§2.1.2–2.1.3 uses compact 0402 bypasses,
        permits routing-space compromises, and shares pins 48/49. Keep both
        original 100 nF parts: C_USB_VDD serves 48/49; C_IOVDD49 adds local
        3.3 V bypass beside ADC_AVDD. These crowded-edge local routes have an
        explicit 2 mm budget, including the space required by package courtyards.
        VREG retains the original 0603 1 uF 25 V X7R parts.
        https://datasheets.raspberrypi.org/rp2040/hardware-design-with-rp2040.pdf */}
    <Capacitor100nF0402 name="C_IOVDD1" schX={-12.0} schY={6.5} schRotation={270} maxVoltageRating="50V" pcbX={-5.15} pcbY={-12.399929} pcbRotation={180} maxDecouplingTraceLength={2} schSheetName="MCU_POWER"
      connections={{ pin1: "net.CTRL_3V3", pin2: "net.GND" }} />
    <Capacitor100nF0402 name="C_IOVDD10" schX={-10.3} schY={6.5} schRotation={270} maxVoltageRating="50V" pcbX={-5.15} pcbY={-15.999871} pcbRotation={180} maxDecouplingTraceLength={2} schSheetName="MCU_POWER"
      connections={{ pin1: "net.CTRL_3V3", pin2: "net.GND" }} />
    <Capacitor100nF0402 name="C_IOVDD22" schX={-8.6} schY={6.5} schRotation={270} maxVoltageRating="50V" pcbX={0.2} pcbY={-20.275} pcbRotation={270} maxDecouplingTraceLength={2} schSheetName="MCU_POWER"
      connections={{ pin1: "net.CTRL_3V3", pin2: "net.GND" }} />
    <Capacitor100nF0402 name="C_IOVDD33" schX={-6.9} schY={6.5} schRotation={270} maxVoltageRating="50V" pcbX={4.87} pcbY={-15.999871} pcbRotation={0} maxDecouplingTraceLength={2} schSheetName="MCU_POWER"
      connections={{ pin1: "net.CTRL_3V3", pin2: "net.GND" }} />
    <Capacitor100nF0402 name="C_IOVDD42" schX={-5.2} schY={6.5} schRotation={270} maxVoltageRating="50V" pcbX={4.87} pcbY={-12.399929} pcbRotation={0} maxDecouplingTraceLength={2} schSheetName="MCU_POWER"
      connections={{ pin1: "net.CTRL_3V3", pin2: "net.GND" }} />
    <Capacitor100nF0402 name="C_IOVDD49" schX={-3.5} schY={6.5} schRotation={270} maxVoltageRating="50V" pcbX={5.2} pcbY={-9.9} pcbRotation={0} maxDecouplingTraceLength={2} schSheetName="MCU_POWER"
      connections={{ pin1: "net.CTRL_3V3", pin2: "net.GND" }} />
    <Capacitor100nF0402 name="C_ADC_AVDD" schX={-1.8} schY={6.5} schRotation={270} maxVoltageRating="50V" pcbX={4.9} pcbY={-11.3} pcbRotation={0} maxDecouplingTraceLength={2} schSheetName="MCU_POWER"
      connections={{ pin1: "net.CTRL_3V3", pin2: "net.GND" }} />
    <Capacitor100nF0402 name="C_USB_VDD" schX={-0.1} schY={6.5} schRotation={270} maxVoltageRating="50V" pcbX={0.4} pcbY={-9.875} pcbRotation={90} maxDecouplingTraceLength={2} schSheetName="MCU_POWER"
      connections={{ pin1: "net.CTRL_3V3", pin2: "net.GND" }} />
    <Capacitor100nF0402 name="C_DVDD23" schX={9.8} schY={-2} schRotation={270} maxVoltageRating="50V" pcbX={1.05} pcbY={-20.275} pcbRotation={270} maxDecouplingTraceLength={2} schSheetName="MCU_POWER"
      connections={{ pin1: "net.RP_CORE_1V1", pin2: "net.GND" }} />
    <Capacitor100nF0402 name="C_DVDD50" schX={11.6} schY={-2} schRotation={270} maxVoltageRating="50V" pcbX={-0.45} pcbY={-9.475} pcbRotation={90} maxDecouplingTraceLength={2} schSheetName="MCU_POWER"
      connections={{ pin1: "net.RP_CORE_1V1", pin2: "net.GND" }} />
    <Capacitor1uF name="C_VREG_IN" schX={1.6} schY={6.5} schRotation={270} maxVoltageRating="25V" pcbX={3.56} pcbY={-9.53} pcbRotation={90} maxDecouplingTraceLength={2} schSheetName="MCU_POWER"
      connections={{ pin1: "net.CTRL_3V3", pin2: "net.GND" }} />
    <Capacitor1uF name="C_VREG_OUT" schX={8} schY={-2} schRotation={270} maxVoltageRating="25V" pcbX={2.15} pcbY={-9.53} pcbRotation={90} maxDecouplingTraceLength={2} schSheetName="MCU_POWER"
      connections={{ pin1: "net.RP_CORE_1V1", pin2: "net.GND" }} />
    <Capacitor10uF name="C_MCU_BULK" schX={3.3} schY={6.5} schRotation={270} maxVoltageRating="25V" pcbX={-5.35} pcbY={-18.8} pcbRotation={270} maxDecouplingTraceLength={2} schSheetName="MCU_POWER"
      connections={{ pin1: "net.CTRL_3V3", pin2: "net.GND" }} />
    <Capacitor100nF name="C_MCU_RUN" schX={-16} schY={-8} schRotation={270} maxVoltageRating="50V" pcbX={8} pcbY={-26} pcbRotation={0} schSheetName="MCU"
      connections={{ pin1: "net.MCU_RUN", pin2: "net.GND" }} />
    <Capacitor100nF0402 name="C_FLASH" schX={13} schY={7} schRotation={270} maxVoltageRating="50V" pcbX={-3.85} pcbY={1.45} pcbRotation={90} schSheetName="MCU"
      connections={{ pin1: "net.CTRL_3V3", pin2: "net.GND" }} />
    <Capacitor15pF name="C_XIN" schX={-6} schY={-1.5} schRotation={270} maxVoltageRating="50V" pcbX={-3.5} pcbY={-23.2} pcbRotation={180} schSheetName="MCU"
      connections={{ pin1: "net.XIN", pin2: "net.GND" }} />
    <Capacitor15pF name="C_XOUT" schX={-0.5} schY={-1.5} schRotation={270} maxVoltageRating="50V" pcbX={3.5} pcbY={-25.2} pcbRotation={0} schSheetName="MCU"
      connections={{ pin1: "net.XOUT_CRYSTAL", pin2: "net.GND" }} />
    <Resistor0603 name="R_SCL" schX={-3} schY={7.7} schRotation={270} resistance="4.7k" pcbX={-8.5} pcbY={-8} schSheetName="MCU"
      manufacturerPartNumber="0603WAF4701T5E" supplierPartNumbers={{ jlcpcb: ["C23162"] }}
      connections={{ pin1: "net.CTRL_3V3", pin2: "net.I2C_SCL" }} />
    <Resistor0603 name="R_SDA" schX={-6} schY={7.7} schRotation={270} resistance="4.7k" pcbX={-8.5} pcbY={-10.5} schSheetName="MCU"
      manufacturerPartNumber="0603WAF4701T5E" supplierPartNumbers={{ jlcpcb: ["C23162"] }}
      connections={{ pin1: "net.CTRL_3V3", pin2: "net.I2C_SDA" }} />
    <Resistor0603 name="R_RUN" schX={-16} schY={-5.7} schRotation={270} resistance="10k" pcbRotation={180} pcbX={12} pcbY={-26} schSheetName="MCU"
      manufacturerPartNumber="0603WAF1002T5E" supplierPartNumbers={{ jlcpcb: ["C25804"] }}
      connections={{ pin1: "net.CTRL_3V3", pin2: "net.MCU_RUN" }} />
    <Resistor0603 name="R_USB_DM" schX={-5} schY={-5.5} schRotation={180} resistance="27" pcbX={6.1} pcbY={-6.7} pcbRotation={270} schSheetName="MCU"
      manufacturerPartNumber="0603WAF270JT5E" supplierPartNumbers={{ jlcpcb: ["C25190"] }}
      connections={{ pin1: "net.PROGRAM_USB_DM", pin2: "net.RP_USB_DM" }} />
    <Resistor0603 name="R_USB_DP" schX={-5} schY={-6.5} schRotation={180} resistance="27" pcbX={4.5} pcbY={-6.7} pcbRotation={270} schSheetName="MCU"
      manufacturerPartNumber="0603WAF270JT5E" supplierPartNumbers={{ jlcpcb: ["C25190"] }}
      connections={{ pin1: "net.PROGRAM_USB_DP", pin2: "net.RP_USB_DP" }} />
    <Resistor0603 name="R_XOUT" schX={-2.8} schY={3.5} schRotation={180} resistance="1k" pcbX={3.5} pcbY={-23.2} pcbRotation={180} schSheetName="MCU"
      manufacturerPartNumber="0603WAF1001T5E" supplierPartNumbers={{ jlcpcb: ["C21190"] }}
      connections={{ pin1: "net.XOUT", pin2: "net.XOUT_CRYSTAL" }} />
    <Resistor0603 name="R_BOOTSEL" schX={-1.5} schY={7} schRotation={0} resistance="1k" pcbX={-6} pcbY={-6.3} schSheetName="MCU"
      manufacturerPartNumber="0603WAF1001T5E" supplierPartNumbers={{ jlcpcb: ["C21190"] }}
      connections={{ pin1: "net.BOOTSEL_PAD", pin2: "net.QSPI_SS" }} />
    <Resistor0603 name="R_FLASH_CS" schX={5} schY={7} schRotation={270} resistance="10k" pcbX={-2.5} pcbY={3.7} schSheetName="MCU"
      manufacturerPartNumber="0603WAF1002T5E" supplierPartNumbers={{ jlcpcb: ["C25804"] }}
      connections={{ pin1: "net.CTRL_3V3", pin2: "net.QSPI_SS" }} />
  </>
}
