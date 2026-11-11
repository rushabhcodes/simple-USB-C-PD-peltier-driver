// Supplier footprint: tsci import C192580 --jlcpcb --use-exact-footprint; see docs/component-imports.json.
import type { ResistorProps } from "@tscircuit/props"

export const RLM25FEER010 = (props: Omit<ResistorProps, "resistance">) => {
  const { name = "R1", ...restProps } = props

  return (
    <resistor
      name={name}
      resistance="10mohm"
      supplierPartNumbers={{
  "jlcpcb": [
    "C192580"
  ]
}}
      manufacturerPartNumber="RLM25FEER010"
      footprint={<footprint>
        <smtpad portHints={["pin2"]} pcbX="3.066288mm" pcbY="0mm" width="1.2825222mm" height="3.4560002mm" shape="rect" />
<smtpad portHints={["pin1"]} pcbX="-3.066288mm" pcbY="0mm" width="1.2825222mm" height="3.4560002mm" shape="rect" />

<courtyardoutline outline={[{"x":-3.957549100000051,"y":1.9780001000000311},{"x":3.9575490999999374,"y":1.9780001000000311},{"x":3.9575490999999374,"y":-1.9780001000000311},{"x":-3.957549100000051,"y":-1.9780001000000311},{"x":-3.957549100000051,"y":1.9780001000000311}]} />
      </footprint>}
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C192580.obj?uuid=311a5ea298274ff3b9740151e78a7465",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C192580.step?uuid=311a5ea298274ff3b9740151e78a7465",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: 0.000012700000070253736, y: 0, z: 0 },
      }}
      {...restProps}
    />
  )
}