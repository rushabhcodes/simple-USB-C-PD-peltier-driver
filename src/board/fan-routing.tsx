// Logical branches and length limits. Widths belong to the explicit copper in
// routing-data.json and its power-copper checks, not a net-wide autorouter hint.
export function FanRouting() {
  return <>
    <trace name={"FAN_ROUTE_0"} from={".U_FAN > .pin4"} to={".U_FAN > .pin5"} maxLength={undefined} />
    <trace name={"FAN_ROUTE_1"} from={".C_FAN_IN > .pin1"} to={".C_FAN_IN_HF > .pin1"} maxLength={3} />
    <trace name={"FAN_ROUTE_2"} from={".C_FAN_IN_HF > .pin1"} to={".U_FAN > .pin5"} maxLength={3} />
    <trace name={"FAN_ROUTE_3"} from={".C_FAN_IN > .pin2"} to={".C_FAN_IN_HF > .pin2"} maxLength={3} />
    <trace name={"FAN_ROUTE_4"} from={".C_FAN_IN_HF > .pin2"} to={".U_FAN > .pin2"} maxLength={4} />
    <trace name={"FAN_ROUTE_5"} from={".U_FAN > .pin1"} to={".C_FAN_BOOT > .pin1"} maxLength={undefined} />
    <trace name={"FAN_ROUTE_6"} from={".U_FAN > .pin6"} to={".C_FAN_BOOT > .pin2"} maxLength={undefined} />
    <trace name={"FAN_ROUTE_7"} from={".U_FAN > .pin6"} to={".L_FAN > .pin1"} maxLength={undefined} />
    <trace name={"FAN_ROUTE_8"} from={".L_FAN > .pin2"} to={".C_FAN_OUT1 > .pin1"} maxLength={undefined} />
    <trace name={"FAN_ROUTE_9"} from={".L_FAN > .pin2"} to={".C_FAN_OUT2 > .pin1"} maxLength={undefined} />
    <trace name={"FAN_ROUTE_10"} from={".C_FAN_OUT1 > .pin2"} to={".C_FAN_OUT2 > .pin2"} maxLength={undefined} />
    <trace name={"FAN_ROUTE_11"} from={".U_FAN > .pin3"} to={".R_FAN_FB_BOTTOM > .pin1"} maxLength={undefined} />
    <trace name={"FAN_ROUTE_12"} from={".R_FAN_FB_TOP > .pin2"} to={".R_FAN_FB_BOTTOM > .pin1"} maxLength={undefined} />
    <trace name={"FAN_ROUTE_13"} from={".R_FAN_FB_BOTTOM > .pin2"} to={".U_FAN > .pin2"} maxLength={undefined} />
    <trace name={"FAN_ROUTE_14"} from={".R_FAN_FB_TOP > .pin1"} to={".C_FAN_OUT1 > .pin1"} maxLength={undefined} />
    <trace name={"FAN_ROUTE_15"} from={".C_FAN_OUT2 > .pin1"} to={".J_FAN > .pin2"} maxLength={undefined} />
  </>
}
