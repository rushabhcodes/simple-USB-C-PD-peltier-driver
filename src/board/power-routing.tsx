// Logical branches and length limits. Widths belong to the explicit copper in
// routing-data.json and its power-copper checks, not a net-wide autorouter hint.
export function PowerStageRouting() {
  return <>
    <trace name="ROUTE_DRIVER_SWITCH1" from={".U_DRIVER > .pin8"} to={".L_OUT > .pin1"} />
    <trace name="ROUTE_DRIVER_SWITCH2" from={".U_DRIVER > .pin10"} to={".L_OUT > .pin2"} />
    <trace name="ROUTE_DRIVER_INPUT_HF" from={".U_DRIVER > .pin7"} to={".C_DRIVER_INPUT_HF > .pin1"} maxLength={4} />
    <trace name="ROUTE_DRIVER_OUTPUT_HF" from={".U_DRIVER > .pin11"} to={".C_DRIVER_OUTPUT_HF > .pin1"} maxLength={4} />
    <trace name="ROUTE_DRIVER_OUTPUT_BULK" from={".C_DRIVER_OUTPUT_HF > .pin1"} to={".C_DRIVER_OUT1 > .pin1"} maxLength={11} />
    <trace name="ROUTE_DRIVER_BOOT1" from={".U_DRIVER > .pin20"} to={".C_DRIVER_BOOT1 > .pin1"} />
    <trace name="ROUTE_DRIVER_BOOT2" from={".U_DRIVER > .pin19"} to={".C_DRIVER_BOOT2 > .pin1"} />
    <trace name="ROUTE_DRIVER_BOOT1_SWITCH" from={".U_DRIVER > .pin8"} to={".C_DRIVER_BOOT1 > .pin2"} />
    <trace name="ROUTE_DRIVER_BOOT2_SWITCH" from={".U_DRIVER > .pin10"} to={".C_DRIVER_BOOT2 > .pin2"} />
    <trace name="ROUTE_DRIVER_VCC" from={".U_DRIVER > .pin18"} to={".C_DRIVER_VCC > .pin1"} maxLength={3} />
    <trace name="ROUTE_DRIVER_VCC_BYPASS" from={".C_DRIVER_VCC > .pin1"} to={".C_DRIVER_VCC_HF > .pin1"} maxLength={3} />
    <trace name="ROUTE_DRIVER_ISP" from={".U_DRIVER > .pin12"} to={".C_CURRENT_FILTER > .pin1"} />
    <trace name="ROUTE_DRIVER_ISN" from={".U_DRIVER > .pin13"} to={".C_CURRENT_FILTER > .pin2"} />
    <trace name="ROUTE_DRIVER_ISP_FILTER" from={".R_ISP_FILTER > .pin2"} to={".C_CURRENT_FILTER > .pin1"} />
    <trace name="ROUTE_DRIVER_ISN_FILTER" from={".R_ISN_FILTER > .pin2"} to={".C_CURRENT_FILTER > .pin2"} />
    <trace name="ROUTE_SHUNT_ISP" from={".R_SENSE > .pin1"} to={".R_ISP_FILTER > .pin1"} />
    <trace name="ROUTE_SHUNT_ISN" from={".R_SENSE > .pin2"} to={".R_ISN_FILTER > .pin1"} />
    <trace name="ROUTE_DRIVER_FREQUENCY" from={".U_DRIVER > .pin6"} to={".R_DRIVER_FSW > .pin1"} />
    <trace name="ROUTE_DRIVER_COMP" from={".U_DRIVER > .pin15"} to={".R_COMP > .pin1"} />
    <trace name="ROUTE_DRIVER_COMP_ZERO" from={".R_COMP > .pin2"} to={".C_COMP_ZERO > .pin1"} />
    <trace name="ROUTE_DRIVER_COMP_POLE" from={".R_COMP > .pin1"} to={".C_COMP_POLE > .pin1"} />
    <trace name="ROUTE_DRIVER_INPUT_RETURN" from={".U_DRIVER > .pin9"} to={".C_DRIVER_INPUT_HF > .pin2"} maxLength={5.1} />
    <trace name="ROUTE_DRIVER_OUTPUT_RETURN" from={".U_DRIVER > .pin9"} to={".C_DRIVER_OUTPUT_HF > .pin2"} maxLength={5.1} />
    <trace name="ROUTE_DRIVER_COMP_RETURN" from={".C_COMP_POLE > .pin2"} to={".C_DRIVER_VCC > .pin2"} maxLength={5} />
    <trace name="ROUTE_DRIVER_COMP_ZERO_RETURN" from={".C_COMP_ZERO > .pin2"} to={".C_COMP_POLE > .pin2"} />
    <trace name="ROUTE_DRIVER_FREQUENCY_RETURN" from={".R_DRIVER_FSW > .pin2"} to={".C_COMP_POLE > .pin2"} />
    <trace name="ROUTE_DRIVER_AGND" from={".U_DRIVER > .pin17"} to={".C_DRIVER_VCC > .pin2"} maxLength={12} />
    <trace name="ROUTE_DRIVER_PGND2" from={".U_DRIVER > .pin2"} to={"net.GND"} />
    <trace name="ROUTE_DRIVER_PGND5" from={".U_DRIVER > .pin5"} to={"net.GND"} />
    <trace name="ROUTE_DRIVER_THERMAL_RETURN" from={".U_DRIVER > .pin21"} to={"net.GND"} />
  </>
}
