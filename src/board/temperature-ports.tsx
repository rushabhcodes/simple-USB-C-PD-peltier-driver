import { connectorPlacements } from "../assembly/connector-placement"
import { TemperatureRouting } from "./temperature-routes"
import { XY302V_3_5_3P as SensorTerminal } from "../parts/XY302V_3_5_3P"
import { USBLC6_2SC6 } from "../../imports/USBLC6_2SC6"
import { CC0603KRX7R9BB104 as Capacitor100nF } from "../parts/C14663"
import { A_0603WAF1001T5E as Resistor0603 } from "../../imports/A_0603WAF1001T5E"

// One powered DS18B20 per port: red=3V3, yellow=DATA, black=GND.
// The two independent 3.3 V GPIO lines can support other digital probes with
// suitable firmware. Existing SDA/SCL debug pads expose the shared I2C bus.
export function TemperaturePorts() {
  return <>
    <TemperatureRouting />
    <group schSheetName="SENSORS">
      <netlabel net="CTRL_3V3" connectsTo=".J_COLD_SENSOR > .pin1" schX={6.5} schY={-1.2} anchorSide="bottom" />
    </group>
    <SensorTerminal name="J_HOT_SENSOR" {...connectorPlacements.J_HOT_SENSOR} schX={10} schY={3} schRotation={0} schSheetName="SENSORS"
      connections={{ pin1: "net.CTRL_3V3", pin2: "net.HOT_SENSOR_DATA", pin3: "net.GND" }}>
      <schematictext text="HOT · DS18B20 · GP8" schX={-15} schY={4.5} anchor="center" fontSize={0.5} />
    </SensorTerminal>
    <SensorTerminal name="J_COLD_SENSOR" {...connectorPlacements.J_COLD_SENSOR} schX={10} schY={-3} schRotation={0} schSheetName="SENSORS"
      connections={{ pin1: "net.CTRL_3V3", pin2: "net.COLD_SENSOR_DATA", pin3: "net.GND" }}>
      <schematictext text="COLD · DS18B20 · GP9" schX={-15} schY={4.5} anchor="center" fontSize={0.5} />
    </SensorTerminal>
    <Resistor0603 name="R_HOT_PULLUP" resistance="4.7k" pcbX={22.4} pcbY={10} schX={0} schY={5.5} schRotation={270} schSheetName="SENSORS"
      manufacturerPartNumber="0603WAF4701T5E" supplierPartNumbers={{ jlcpcb: ["C23162"] }}
      connections={{ pin1: "net.CTRL_3V3", pin2: "net.HOT_SENSOR_DATA" }} />
    <Resistor0603 name="R_COLD_PULLUP" resistance="4.7k" pcbX={22.4} pcbY={-5.3} schX={0} schY={-0.5} schRotation={270} schSheetName="SENSORS"
      manufacturerPartNumber="0603WAF4701T5E" supplierPartNumbers={{ jlcpcb: ["C23162"] }}
      connections={{ pin1: "net.CTRL_3V3", pin2: "net.COLD_SENSOR_DATA" }} />
    <Resistor0603 name="R_HOT_SERIES" resistance="100" pcbX={22.4} pcbY={6} schX={-5} schY={3} schRotation={0} schSheetName="SENSORS"
      manufacturerPartNumber="0603WAF1000T5E" supplierPartNumbers={{ jlcpcb: ["C22775"] }}
      connections={{ pin1: "net.HOT_DATA_MCU", pin2: "net.HOT_SENSOR_DATA" }} />
    <Resistor0603 name="R_COLD_SERIES" resistance="100" pcbX={22.4} pcbY={-10.7} schX={-5} schY={-3} schRotation={0} schSheetName="SENSORS"
      manufacturerPartNumber="0603WAF1000T5E" supplierPartNumbers={{ jlcpcb: ["C22775"] }}
      connections={{ pin1: "net.COLD_DATA_MCU", pin2: "net.COLD_SENSOR_DATA" }} />
    <Capacitor100nF name="C_HOT_SENSOR" maxVoltageRating="50V" pcbX={19} pcbY={3} schX={5} schY={5.5} schRotation={270} schSheetName="SENSORS"
      connections={{ pin1: "net.CTRL_3V3", pin2: "net.GND" }} />
    <Capacitor100nF name="C_COLD_SENSOR" maxVoltageRating="50V" pcbX={22.4} pcbY={-2} schX={6.8} schY={5.5} schRotation={270} schSheetName="SENSORS"
      connections={{ pin1: "net.CTRL_3V3", pin2: "net.GND" }} />
    <USBLC6_2SC6 name="U_SENSOR_ESD" pcbX={22.4} pcbY={3} schX={0} schY={-8} schRotation={0} schSheetName="SENSORS"
      connections={{ pin1: "net.HOT_SENSOR_DATA", pin6: "net.HOT_SENSOR_DATA",
        pin3: "net.COLD_SENSOR_DATA", pin4: "net.COLD_SENSOR_DATA", pin2: "net.GND", pin5: "net.CTRL_3V3" }}>
      <schematictext text="SHARED ESD PROTECTION" schX={0} schY={2.6} fontSize={0.4} />
      <schematictext text="HOT: pins 1/6 · COLD: pins 3/4" schX={0} schY={-2} fontSize={0.3} />
      <schematictext text="Powered probes · 3V3 / DATA / GND · no parasite power" schX={0} schY={-3.4} fontSize={0.3} />
    </USBLC6_2SC6>

  </>
}
