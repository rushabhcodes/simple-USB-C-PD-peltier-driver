// Supplier footprint: tsci import C2289 --jlcpcb --use-exact-footprint; see docs/component-imports.json.
import type { LedProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["cathode","neg"],
  pin2: ["anode","pos"]
} as const

export const KT_0603YG = (props: LedProps) => {
  const { name = "LED1", ...restProps } = props

  return (
    <led
      name={name}
      pinLabels={pinLabels}
      supplierPartNumbers={{
  "jlcpcb": [
    "C2289"
  ]
}}
      manufacturerPartNumber="KT-0603YG"
      footprint={<footprint>
        <smtpad portHints={["pin2","anode","pos"]} pcbX="0.7489952mm" pcbY="0.000127mm" width="0.7999984mm" height="0.7999984mm" shape="rect" />
<smtpad portHints={["pin1","cathode","neg"]} pcbX="-0.7489952mm" pcbY="-0.000127mm" width="0.7999984mm" height="0.7999984mm" shape="rect" />

<fabricationnotepath route={[{"x":-1.07000040000014,"y":0.061518800000044394},{"x":-0.5299964000000728,"y":0.061518800000044394},{"x":-0.5299964000000728,"y":-0.06847839999988992},{"x":-1.07000040000014,"y":-0.06847839999988992},{"x":-1.07000040000014,"y":0.061518800000044394}]} strokeWidth="0mm" isFilled hasStroke={false} />
<fabricationnotepath route={[{"x":0.7345679999998538,"y":-0.26708099999996193},{"x":0.7345679999998538,"y":0.2729229999999916},{"x":0.864539799999875,"y":0.2729229999999916},{"x":0.864539799999875,"y":-0.26708099999996193},{"x":0.7345679999998538,"y":-0.26708099999996193}]} strokeWidth="0mm" isFilled hasStroke={false} />
<fabricationnotepath route={[{"x":0.5289295999999695,"y":0.06837679999989632},{"x":1.0689336000000367,"y":0.06837679999989632},{"x":1.0689336000000367,"y":-0.0616203999999243},{"x":0.5289295999999695,"y":-0.0616203999999243},{"x":0.5289295999999695,"y":0.06837679999989632}]} strokeWidth="0mm" isFilled hasStroke={false} />
<courtyardoutline outline={[{"x":-1.3989943999999923,"y":0.6599813999999924},{"x":1.3989943999998786,"y":0.6599813999999924},{"x":1.3989943999998786,"y":-0.6600067999999055},{"x":-1.3989943999999923,"y":-0.6600067999999055},{"x":-1.3989943999999923,"y":0.6599813999999924}]} />
      </footprint>}
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C2289.obj?uuid=3c2caa1a3e7d4a5a87f46b87d898ef41",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C2289.step?uuid=3c2caa1a3e7d4a5a87f46b87d898ef41",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: -0.000012700000070253736, y: 0.000012699999956566899, z: -0.01 },
      }}
      {...restProps}
    />
  )
}