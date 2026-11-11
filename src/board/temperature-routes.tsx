// Logical branches and length limits. Widths belong to the explicit copper in
// routing-data.json and its power-copper checks, not a net-wide autorouter hint.
export function TemperatureRouting() {
  return <>
    <trace name="ROUTE_HOT_PULLUP" from={".R_HOT_PULLUP > .pin2"} to={".R_HOT_SERIES > .pin2"} />
    <trace name="ROUTE_HOT_ESD_INPUT" from={".R_HOT_SERIES > .pin2"} to={".U_SENSOR_ESD > .pin6"} />
    <trace name="ROUTE_HOT_PROBE_DATA" from={".U_SENSOR_ESD > .pin1"} to={".J_HOT_SENSOR > .pin2"} />
    <trace name="ROUTE_COLD_PULLUP" from={".R_COLD_PULLUP > .pin2"} to={".R_COLD_SERIES > .pin2"} />
    <trace name="ROUTE_COLD_ESD_INPUT" from={".R_COLD_PULLUP > .pin2"} to={".U_SENSOR_ESD > .pin4"} />
    <trace name="ROUTE_COLD_PROBE_DATA" from={".U_SENSOR_ESD > .pin3"} to={".J_COLD_SENSOR > .pin2"} />
    <trace name="ROUTE_HOT_PROBE_BYPASS" from={".R_HOT_PULLUP > .pin1"} to={".C_HOT_SENSOR > .pin1"} />
    <trace name="ROUTE_COLD_PROBE_BYPASS" from={".R_COLD_PULLUP > .pin1"} to={".C_COLD_SENSOR > .pin1"} />
    <trace name="ROUTE_HOT_PROBE_SUPPLY" from={".R_HOT_PULLUP > .pin1"} to={".V_SENSOR_HOT_3V3 > .top"} />
    <trace name="ROUTE_COLD_PROBE_SUPPLY" from={".R_COLD_PULLUP > .pin1"} to={".V_SENSOR_COLD_3V3 > .top"} />
    <trace name="ROUTE_SENSOR_ESD_SUPPLY" from={".U_SENSOR_ESD > .pin5"} to={".V_SENSOR_ESD_3V3 > .top"} />
    <trace name="ROUTE_PROBE_SUPPLY_TRUNK" from={".V_SENSOR_HOT_3V3 > .bottom"} to={".V_SENSOR_COLD_3V3 > .bottom"} />
    <trace name="ROUTE_ESD_SUPPLY_TRUNK" from={".V_SENSOR_ESD_3V3 > .bottom"} to={".V_SENSOR_HOT_3V3 > .bottom"} />
    <trace name="ROUTE_HOT_PROBE_HEADER_SUPPLY" from={".V_SENSOR_HOT_3V3 > .bottom"} to={".J_HOT_SENSOR > .pin1"} />
    <trace name="ROUTE_COLD_PROBE_HEADER_SUPPLY" from={".V_SENSOR_COLD_3V3 > .bottom"} to={".J_COLD_SENSOR > .pin1"} />
    <trace name="ROUTE_HOT_PROBE_RETURN" from={".C_HOT_SENSOR > .pin2"} to={".V_SENSOR_HOT_GND > .top"} />
    <trace name="ROUTE_COLD_PROBE_RETURN" from={".C_COLD_SENSOR > .pin2"} to={".V_SENSOR_COLD_GND > .top"} />
    <trace name="ROUTE_SENSOR_ESD_RETURN" from={".U_SENSOR_ESD > .pin2"} to={".V_SENSOR_ESD_GND > .top"} />
  </>
}
