import { JlcPcbPartsEngine } from "@tscircuit/parts-engine"
import type { PartsEngine } from "@tscircuit/props"
import type { AnyCircuitElement } from "circuit-json"
import { withKnownStockAvailability } from "./known-stock-parts-engine"

// The published engine declaration bundles an older circuit-json union. Its
// standard footprint/availability protocol is compatible with our pinned core.
const stockAwareEngine = withKnownStockAvailability(new JlcPcbPartsEngine() as unknown as PartsEngine)

// Sunlord SWPA8040S datasheet, p.2: a=3.8, b=2.2, c=7.5 mm.
// https://atta.szlcsc.com/upload/public/pdf/source/20190109/C361638_7901FB77EA6D5D90885BF852E01DD0FD.pdf
// The supplier CAD has different lands. Supply the manufacturer geometry to
// the footprint checker instead; incorrect local footprints still warn.
const sunlordLandPattern: AnyCircuitElement[] = [-3, 3].map((x, index) => ({
  type: "pcb_smtpad", pcb_smtpad_id: `sunlord_swpa8040s_pad_${index + 1}`,
  shape: "rect", x, y: 0, width: 2.2, height: 7.5, layer: "top",
  port_hints: [`pin${index + 1}`],
}))

export const catalogPartsEngine: PartsEngine = {
  ...stockAwareEngine,
  fetchPartCircuitJson: params => params.supplierPartNumber === "C83467"
    ? structuredClone(sunlordLandPattern)
    : stockAwareEngine.fetchPartCircuitJson!(params),
}
