// Supplier footprint: tsci import C780205 --jlcpcb --use-exact-footprint; see docs/component-imports.json.
import type { InductorProps } from "@tscircuit/props"

// Bourns SRP1265A manufacturer drawing, visually audited 2026-10-14:
// 14.2 mm outer land span, 8.0 mm gap, 5.0 mm land height.
// https://www.bourns.com/docs/product-datasheets/srp1265a.pdf

export const SRP1265A_4R7M = (props: Omit<InductorProps, "inductance">) => {
  return (
    <inductor
      inductance="4.7uH"
      supplierPartNumbers={{
  "jlcpcb": [
    "C780205"
  ]
}}
      manufacturerPartNumber="SRP1265A-4R7M"
      footprint={<footprint>
        <smtpad portHints={["pin1"]} pcbX="-5.55mm" pcbY="0mm" width="3.1mm" height="5mm" shape="rect" solderMaskMargin="0.05mm" solderPasteMargin={0} />
<smtpad portHints={["pin2"]} pcbX="5.55mm" pcbY="0mm" width="3.1mm" height="5mm" shape="rect" solderMaskMargin="0.05mm" solderPasteMargin={0} />

<courtyardrect width="14.8mm" height="13.4mm" />
      </footprint>}
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C780205.obj?uuid=b9cef65ce96748059577ce5e642ee887",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C780205.step?uuid=b9cef65ce96748059577ce5e642ee887",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: -0.000012699999956566899, y: 0.000012699999956566899, z: 0 },
      }}
      {...props}
    />
  )
}
