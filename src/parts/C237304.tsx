// Supplier footprint: tsci import C237304 --jlcpcb --use-exact-footprint; see docs/component-imports.json.
// Manufacturer drawing audited 2026-10-10: Murata GRM31CC72A475KE11-01A, pages 2 and 27.
// Existing imported lands corrected in place; same reviewed C200 copper envelope, NSMD +0.05 mm and 1:1 paste.
// Exact EasyEDA/JLCPCB C237304; observed 2026-10-10T03:58:55.723558+00:00. Source: https://jlcsearch.tscircuit.com/api/easyeda_components/C237304
import type { CapacitorProps } from "@tscircuit/props"

export const GRM31CC72A475KE11L = (props: Omit<CapacitorProps, "capacitance">) => {
  const { name = "C1", ...restProps } = props

  return (
    <capacitor
      name={name}
      capacitance="4.7uF"
      supplierPartNumbers={{
  "jlcpcb": [
    "C237304"
  ]
}}
      manufacturerPartNumber="GRM31CC72A475KE11L"
      footprint={<footprint>
        <smtpad solderPasteMargin={0} portHints={["pin2", "neg"]} pcbX="1.575mm" pcbY="0mm" width="1.15mm" height="1.75mm" shape="rect" solderMaskMargin="0.05mm" />
<smtpad solderPasteMargin={0} portHints={["pin1", "pos"]} pcbX="-1.575mm" pcbY="0mm" width="1.15mm" height="1.75mm" shape="rect" solderMaskMargin="0.05mm" />

<courtyardoutline outline={[{"x":-2.4,"y":1.2},{"x":2.4,"y":1.2},{"x":2.4,"y":-1.2},{"x":-2.4,"y":-1.2},{"x":-2.4,"y":1.2}]} />
      </footprint>}
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C237304.obj?uuid=c6790e9475e1483991d2c64340b24e96",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C237304.step?uuid=c6790e9475e1483991d2c64340b24e96",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: 0, y: 0, z: -0.65 },
      }}
      {...restProps}
    />
  )
}
