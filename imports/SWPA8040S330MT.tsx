// Supplier footprint: tsci import C83467 --jlcpcb --use-exact-footprint; see docs/component-imports.json.
import type { InductorProps } from "@tscircuit/props"

export const SWPA8040S330MT = (props: Omit<InductorProps, "inductance">) => {
  return (
    <inductor
      inductance="33uH"
      supplierPartNumbers={{
  "jlcpcb": [
    "C83467"
  ]
}}
      manufacturerPartNumber="SWPA8040S330MT"
      // Sunlord SWPA8040S recommended land pattern: 3.8 mm gap,
      // 2.2 x 7.5 mm pads, with centres at +/-3.0 mm (datasheet page 2).
      // https://atta.szlcsc.com/upload/public/pdf/source/20190109/C361638_7901FB77EA6D5D90885BF852E01DD0FD.pdf
      footprint={<footprint>
        <smtpad portHints={["pin1"]} pcbX="-3mm" pcbY="0mm" width="2.2mm" height="7.5mm" shape="rect" />
<smtpad portHints={["pin2"]} pcbX="3mm" pcbY="0mm" width="2.2mm" height="7.5mm" shape="rect" />

<courtyardrect width="8.8mm" height="8.8mm" />
      </footprint>}
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C83467.obj?uuid=6dd7f26bae554279b6f5912a8916ae99",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C83467.step?uuid=6dd7f26bae554279b6f5912a8916ae99",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: 0, y: 0.00004999999999988347, z: 0 },
      }}
      {...props}
    />
  )
}
