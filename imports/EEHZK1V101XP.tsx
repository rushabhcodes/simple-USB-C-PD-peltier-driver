// Supplier footprint: tsci import C454360 --jlcpcb --use-exact-footprint; see docs/component-imports.json.
import type { CapacitorProps } from "@tscircuit/props"

export const EEHZK1V101XP = (props: Omit<CapacitorProps, "capacitance">) => {
  const { name = "C1", ...restProps } = props

  return (
    <capacitor
      name={name}
      capacitance="100uF"
      polarized
      supplierPartNumbers={{
  "jlcpcb": [
    "C454360"
  ]
}}
      manufacturerPartNumber="EEHZK1V101XP"
      footprint={<footprint>
        <smtpad portHints={["pin1", "pos"]} pcbX="-2.670048mm" pcbY="0mm" width="3.499993mm" height="1.1999976mm" shape="rect" />
<smtpad portHints={["pin2", "neg"]} pcbX="2.670048mm" pcbY="0mm" width="3.499993mm" height="1.1999976mm" shape="rect" />

<fabricationnotepath route={[{"x":3.102000399999838,"y":0.09900920000006863},{"x":3.102000399999838,"y":-0.09900919999995494},{"x":2.310002999999938,"y":-0.09900919999995494},{"x":2.310002999999938,"y":0.09900920000006863},{"x":3.102000399999838,"y":0.09900920000006863}]} strokeWidth="0mm" isFilled hasStroke={false} />
<fabricationnotepath route={[{"x":-3.1020003999999517,"y":0.09900920000006863},{"x":-3.1020003999999517,"y":-0.09900919999995494},{"x":-2.3100030000000515,"y":-0.09900919999995494},{"x":-2.3100030000000515,"y":0.09900920000006863},{"x":-3.1020003999999517,"y":0.09900920000006863}]} strokeWidth="0mm" isFilled hasStroke={false} />
<fabricationnotepath route={[{"x":-2.8100020000001678,"y":0.6599935999998934},{"x":-2.8100020000001678,"y":-0.6599935999998934},{"x":-2.6120090000000573,"y":-0.6599935999998934},{"x":-2.6120090000000573,"y":0.6599935999998934},{"x":-2.8100020000001678,"y":0.6599935999998934}]} strokeWidth="0mm" isFilled hasStroke={false} />
<courtyardoutline outline={[{"x":-4.670044500000017,"y":3.5499933999999485},{"x":4.670044500000017,"y":3.5499933999999485},{"x":4.670044500000017,"y":-3.5500187999999753},{"x":-4.670044500000017,"y":-3.5500187999999753},{"x":-4.670044500000017,"y":3.5499933999999485}]} />
      </footprint>}
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C454360.obj?uuid=6cb1ec5759f6404189e20b90556867d6",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C454360.step?uuid=6cb1ec5759f6404189e20b90556867d6",
        pcbRotationOffset: 180,
        modelOriginPosition: { x: 0, y: -0.000012700000070253736, z: -0.05 },
      }}
      {...restProps}
    />
  )
}
