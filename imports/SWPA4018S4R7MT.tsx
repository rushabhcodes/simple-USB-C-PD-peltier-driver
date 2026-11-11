// Supplier footprint: tsci import C60117 --jlcpcb --use-exact-footprint; see docs/component-imports.json.
import type { InductorProps } from "@tscircuit/props"

export const SWPA4018S4R7MT = (props: Omit<InductorProps, "inductance">) => {
  return (
    <inductor
      inductance="4.7uH"
      supplierPartNumbers={{
  "jlcpcb": [
    "C60117"
  ]
}}
      manufacturerPartNumber="SWPA4018S4R7MT"
      footprint={<footprint>
        <smtpad portHints={["pin2"]} pcbX="1.599946mm" pcbY="0mm" width="1.5999968mm" height="3.499993mm" shape="rect" />
<smtpad portHints={["pin1"]} pcbX="-1.599946mm" pcbY="0mm" width="1.5999968mm" height="3.499993mm" shape="rect" />

<courtyardoutline outline={[{"x":-2.649944399999981,"y":2.24999600000001},{"x":2.649944399999981,"y":2.24999600000001},{"x":2.649944399999981,"y":-2.2499959999998964},{"x":-2.649944399999981,"y":-2.2499959999998964},{"x":-2.649944399999981,"y":2.24999600000001}]} />
      </footprint>}
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C60117.obj?uuid=54384860ccaa4399aecca69a879f17ac",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C60117.step?uuid=54384860ccaa4399aecca69a879f17ac",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: 0, y: 0.000050000000000105516, z: 0 },
      }}
      {...props}
    />
  )
}