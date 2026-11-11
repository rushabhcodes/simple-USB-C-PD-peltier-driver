// Electrical branches and their length limits; hand-placed copper lives in routing-data.json.
export function TemperatureRouting() {
  return <>
    <trace from={".R_HOT_PULLUP > .pin2"} to={".R_HOT_SERIES > .pin2"} width={0.2} />
    <trace from={".R_HOT_SERIES > .pin2"} to={".U_SENSOR_ESD > .pin6"} width={0.2} />
    <trace from={".U_SENSOR_ESD > .pin1"} to={".J_HOT_SENSOR > .pin2"} width={0.2} />
    <trace from={".R_COLD_PULLUP > .pin2"} to={".R_COLD_SERIES > .pin2"} width={0.2} />
    <trace from={".R_COLD_PULLUP > .pin2"} to={".U_SENSOR_ESD > .pin4"} width={0.2} />
    <trace from={".U_SENSOR_ESD > .pin3"} to={".J_COLD_SENSOR > .pin2"} width={0.2} />
    <trace from={".R_HOT_PULLUP > .pin1"} to={".C_HOT_SENSOR > .pin1"} width={0.4} />
    <trace from={".R_COLD_PULLUP > .pin1"} to={".C_COLD_SENSOR > .pin1"} width={0.4} />
    <trace from={".R_HOT_PULLUP > .pin1"} to={".V_SENSOR_HOT_3V3 > .top"} width={0.4} />
    <trace from={".R_COLD_PULLUP > .pin1"} to={".V_SENSOR_COLD_3V3 > .top"} width={0.4} />
    <trace from={".U_SENSOR_ESD > .pin5"} to={".V_SENSOR_ESD_3V3 > .top"} width={0.4} />
    <trace from={".V_SENSOR_HOT_3V3 > .bottom"} to={".V_SENSOR_COLD_3V3 > .bottom"} width={0.4} />
    <trace from={".V_SENSOR_ESD_3V3 > .bottom"} to={".V_SENSOR_HOT_3V3 > .bottom"} width={0.4} />
    <trace from={".V_SENSOR_HOT_3V3 > .bottom"} to={".J_HOT_SENSOR > .pin1"} width={0.4} />
    <trace from={".V_SENSOR_COLD_3V3 > .bottom"} to={".J_COLD_SENSOR > .pin1"} width={0.4} />
    <trace from={".C_HOT_SENSOR > .pin2"} to={".V_SENSOR_HOT_GND > .top"} width={0.3} />
    <trace from={".C_COLD_SENSOR > .pin2"} to={".V_SENSOR_COLD_GND > .top"} width={0.3} />
    <trace from={".U_SENSOR_ESD > .pin2"} to={".V_SENSOR_ESD_GND > .top"} width={0.3} />
  </>
}
