import { ProgrammingAndLogicPower } from "./control-usb-power"
import { Rp2040Control } from "./control-rp2040"
import { PermissionAndSensing } from "./control-permission-sensing"
import { StatusAndDebug } from "./control-status-debug"

export function ControlBlock() {
  return <>
    <ProgrammingAndLogicPower />
    <Rp2040Control />
    <PermissionAndSensing />
    <StatusAndDebug />
  </>
}
