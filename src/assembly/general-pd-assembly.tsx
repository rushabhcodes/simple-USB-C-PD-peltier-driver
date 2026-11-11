import { assembly } from "tscircuit"
import { GeneralPdDriverBoard } from "../board/general-pd"
import { moduleModel, usbPdCable, usbProgramCable, tecPositiveLead, tecNegativeLead, hotProbe, coldProbe, hotProbeCable, coldProbeCable, fan, fanCable } from "./models"

// CAD-only accessories do not add PCB components, electrical ports or JLC BOM
// entries. Native assembly.cable cannot attach to generic parts/loose TEC leads.
export function GeneralPdDriverAssembly({ schematicDisabled = false }: { schematicDisabled?: boolean } = {}) {
  return <assembly.device name="GENERAL_PD_ASSEMBLY">
    <GeneralPdDriverBoard schematicDisabled={schematicDisabled} />
    <assembly.part name="TEC_DEFAULT" displayName="HiLetgo TEC1-12706 · 40 × 40 × 3.6 mm listing envelope"
      cadModel={{ jscad: moduleModel, positionOffset: { x: 112, y: 24, z: 1.8 },
        modelOriginPosition: { x: 0, y: 0, z: 0 }, modelUnitToMmScale: 1 }} />
    <assembly.part name="USB_PD_CABLE" displayName="Cable Matters 201440 · PD power · envelope"
      cadModel={{ jscad: usbPdCable.model,
        positionOffset: { x: usbPdCable.boardPoint[0], y: usbPdCable.boardPoint[1], z: usbPdCable.boardPoint[2] },
        modelOriginPosition: { x: 0, y: 0, z: 0 }, modelUnitToMmScale: 1 }} />
    <assembly.part name="USB_PROGRAM_CABLE" displayName="Cable Matters 201440 · USB programming · envelope"
      cadModel={{ jscad: usbProgramCable.model,
        positionOffset: { x: usbProgramCable.boardPoint[0], y: usbProgramCable.boardPoint[1], z: usbProgramCable.boardPoint[2] },
        modelOriginPosition: { x: 0, y: 0, z: 0 }, modelUnitToMmScale: 1 }} />
    <assembly.part name="TEC_POS_LEAD" displayName="TEC positive lead · red · path illustration"
      cadModel={{ jscad: tecPositiveLead.model,
        positionOffset: { x: tecPositiveLead.boardPoint[0], y: tecPositiveLead.boardPoint[1], z: tecPositiveLead.boardPoint[2] },
        modelOriginPosition: { x: 0, y: 0, z: 0 }, modelUnitToMmScale: 1 }} />
    <assembly.part name="TEC_NEG_LEAD" displayName="TEC negative lead · black · path illustration"
      cadModel={{ jscad: tecNegativeLead.model,
        positionOffset: { x: tecNegativeLead.boardPoint[0], y: tecNegativeLead.boardPoint[1], z: tecNegativeLead.boardPoint[2] },
        modelOriginPosition: { x: 0, y: 0, z: 0 }, modelUnitToMmScale: 1 }} />
    <assembly.part name="HOT_PROBE" displayName="HiLetgo DS18B20 · HOT · illustrative Ø6 × 50 mm housing"
      cadModel={{ jscad: hotProbe.model, positionOffset: { x: hotProbe.position[0], y: hotProbe.position[1], z: hotProbe.position[2] },
        modelOriginPosition: { x: 0, y: 0, z: 0 }, modelUnitToMmScale: 1 }} />
    <assembly.part name="COLD_PROBE" displayName="HiLetgo DS18B20 · COLD · illustrative Ø6 × 50 mm housing"
      cadModel={{ jscad: coldProbe.model, positionOffset: { x: coldProbe.position[0], y: coldProbe.position[1], z: coldProbe.position[2] },
        modelOriginPosition: { x: 0, y: 0, z: 0 }, modelUnitToMmScale: 1 }} />
    <assembly.part name="HOT_PROBE_CABLE" displayName="HiLetgo factory cable · HOT · red VCC / yellow DATA / black GND"
      cadModel={{ jscad: hotProbeCable.model,
        positionOffset: { x: hotProbeCable.boardPoint[0], y: hotProbeCable.boardPoint[1], z: hotProbeCable.boardPoint[2] },
        modelOriginPosition: { x: 0, y: 0, z: 0 }, modelUnitToMmScale: 1 }} />
    <assembly.part name="COLD_PROBE_CABLE" displayName="HiLetgo factory cable · COLD · red VCC / yellow DATA / black GND"
      cadModel={{ jscad: coldProbeCable.model,
        positionOffset: { x: coldProbeCable.boardPoint[0], y: coldProbeCable.boardPoint[1], z: coldProbeCable.boardPoint[2] },
        modelOriginPosition: { x: 0, y: 0, z: 0 }, modelUnitToMmScale: 1 }} />
    <assembly.part name="FAN_DEFAULT" displayName="Noctua NF-A8 PWM · official NF-A8 family CAD"
      cadModel={{ jscad: fan.model, positionOffset: { x: fan.position[0], y: fan.position[1], z: fan.position[2] },
        modelOriginPosition: { x: 0, y: 0, z: 0 }, modelUnitToMmScale: 1 }} />
    <assembly.part name="FAN_CABLE" displayName="Noctua factory 200 mm sleeved cable · GND / 12 V / tach NC / PWM NC"
      cadModel={{ jscad: fanCable.model,
        positionOffset: { x: fanCable.boardPoint[0], y: fanCable.boardPoint[1], z: fanCable.boardPoint[2] },
        modelOriginPosition: { x: 0, y: 0, z: 0 }, modelUnitToMmScale: 1 }} />
  </assembly.device>
}
