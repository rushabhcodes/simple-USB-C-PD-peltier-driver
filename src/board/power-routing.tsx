// Electrical branches and their length limits; hand-placed copper lives in routing-data.json.
export function PowerStageRouting() {
  return <>
    <trace from={".U_DRIVER > .pin8"} to={".L_OUT > .pin1"} thickness={0.22} />
    <trace from={".U_DRIVER > .pin10"} to={".L_OUT > .pin2"} thickness={0.22} />
    <trace from={".U_DRIVER > .pin7"} to={".C_DRIVER_INPUT_HF > .pin1"} thickness={0.22} maxLength={4} />
    <trace from={".U_DRIVER > .pin11"} to={".C_DRIVER_OUTPUT_HF > .pin1"} thickness={0.22} maxLength={4} />
    <trace from={".C_DRIVER_OUTPUT_HF > .pin1"} to={".C_DRIVER_OUT1 > .pin1"} thickness={1} maxLength={11} />
    <trace from={".U_DRIVER > .pin20"} to={".C_DRIVER_BOOT1 > .pin1"} thickness={0.2} />
    <trace from={".U_DRIVER > .pin19"} to={".C_DRIVER_BOOT2 > .pin1"} thickness={0.2} />
    <trace from={".U_DRIVER > .pin8"} to={".C_DRIVER_BOOT1 > .pin2"} thickness={0.2} />
    <trace from={".U_DRIVER > .pin10"} to={".C_DRIVER_BOOT2 > .pin2"} thickness={0.2} />
    <trace from={".U_DRIVER > .pin18"} to={".C_DRIVER_VCC > .pin1"} thickness={0.25} maxLength={3} />
    <trace from={".C_DRIVER_VCC > .pin1"} to={".C_DRIVER_VCC_HF > .pin1"} thickness={0.4} maxLength={3} />
    <trace from={".U_DRIVER > .pin12"} to={".C_CURRENT_FILTER > .pin1"} thickness={0.2} />
    <trace from={".U_DRIVER > .pin13"} to={".C_CURRENT_FILTER > .pin2"} thickness={0.2} />
    <trace from={".R_ISP_FILTER > .pin2"} to={".C_CURRENT_FILTER > .pin1"} thickness={0.2} />
    <trace from={".R_ISN_FILTER > .pin2"} to={".C_CURRENT_FILTER > .pin2"} thickness={0.2} />
    <trace from={".R_SENSE > .pin1"} to={".R_ISP_FILTER > .pin1"} thickness={0.2} />
    <trace from={".R_SENSE > .pin2"} to={".R_ISN_FILTER > .pin1"} thickness={0.2} />
    <trace from={".U_DRIVER > .pin6"} to={".R_DRIVER_FSW > .pin1"} thickness={0.2} />
    <trace from={".U_DRIVER > .pin15"} to={".R_COMP > .pin1"} thickness={0.2} />
    <trace from={".R_COMP > .pin2"} to={".C_COMP_ZERO > .pin1"} thickness={0.2} />
    <trace from={".R_COMP > .pin1"} to={".C_COMP_POLE > .pin1"} thickness={0.2} />
    <trace from={".U_DRIVER > .pin9"} to={".C_DRIVER_INPUT_HF > .pin2"} thickness={0.3} maxLength={5.1} />
    <trace from={".U_DRIVER > .pin9"} to={".C_DRIVER_OUTPUT_HF > .pin2"} thickness={0.3} maxLength={5.1} />
    <trace from={".C_COMP_POLE > .pin2"} to={".C_DRIVER_VCC > .pin2"} thickness={0.25} maxLength={5} />
    <trace from={".C_COMP_ZERO > .pin2"} to={".C_COMP_POLE > .pin2"} thickness={0.25} />
    <trace from={".R_DRIVER_FSW > .pin2"} to={".C_COMP_POLE > .pin2"} thickness={0.25} />
    <trace from={".U_DRIVER > .pin17"} to={".C_DRIVER_VCC > .pin2"} thickness={0.2} maxLength={12} />
    <trace from={".U_DRIVER > .pin2"} to={"net.GND"} thickness={0.2} />
    <trace from={".U_DRIVER > .pin5"} to={"net.GND"} thickness={0.2} />
    <trace from={".U_DRIVER > .pin21"} to={"net.GND"} thickness={0.2} />
  </>
}
