// Supplier footprint: tsci import C92856 --jlcpcb --use-exact-footprint; see docs/component-imports.json.
import type { CapacitorProps } from "@tscircuit/props"

export const UMK325BJ106KM_T = (props: Omit<CapacitorProps, "capacitance">) => {
  const { name = "C1", ...restProps } = props

  return (
    <capacitor
      name={name}
      capacitance="10uF"
      supplierPartNumbers={{
  "jlcpcb": [
    "C92856"
  ]
}}
      manufacturerPartNumber="UMK325BJ106KM-T"
      footprint={<footprint>
        <smtpad portHints={["pin2", "neg"]} pcbX="1.517396mm" pcbY="0mm" width="1.634998mm" height="2.6999946mm" shape="rect" />
<smtpad portHints={["pin1", "pos"]} pcbX="-1.517396mm" pcbY="0mm" width="1.634998mm" height="2.6999946mm" shape="rect" />

<courtyardoutline outline={[{"x":-2.584895000000188,"y":1.599997300000041},{"x":2.584895000000074,"y":1.599997300000041},{"x":2.584895000000074,"y":-1.599997300000041},{"x":-2.584895000000188,"y":-1.599997300000041},{"x":-2.584895000000188,"y":1.599997300000041}]} />
      </footprint>}
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C92856.obj?uuid=0f62590f50b54fa48364a4157b2b6286",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C92856.step?uuid=0f62590f50b54fa48364a4157b2b6286",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: 0, y: -0.000012700000070253736, z: -1.25 },
      }}
      {...restProps}
    />
  )
}
