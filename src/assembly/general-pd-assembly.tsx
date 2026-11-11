import { assembly } from "tscircuit"
import { GeneralPdDriverBoard } from "../board/general-pd"
import { assemblyParts } from "./models"

// External wiring and hardware are CAD-only. Use the board entrypoint for
// fabrication files and the assembly entrypoint for the installed parts.
export function GeneralPdDriverAssembly({ schematicDisabled = false }: { schematicDisabled?: boolean } = {}) {
  return <assembly.device name="GENERAL_PD_ASSEMBLY">
    <GeneralPdDriverBoard schematicDisabled={schematicDisabled} />
    {assemblyParts.map(({ partName, displayName, position: [x, y, z], model }) =>
      <assembly.part key={partName} name={partName} displayName={displayName}
        cadModel={{ jscad: model, positionOffset: { x, y, z },
          modelOriginPosition: { x: 0, y: 0, z: 0 }, modelUnitToMmScale: 1 }} />)}
  </assembly.device>
}
