// Supplier footprint: tsci import C2287 --jlcpcb --use-exact-footprint; see docs/component-imports.json.
import type { LedProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["anode","pos"],
  pin2: ["cathode","neg"]
} as const

export const KT_0603Y = (props: LedProps) => {
  const { name = "LED1", ...restProps } = props

  return (
    <led
      name={name}
      pinLabels={pinLabels}
      supplierPartNumbers={{
  "jlcpcb": [
    "C2287"
  ]
}}
      manufacturerPartNumber="KT-0603Y"
      footprint={<footprint>
        <smtpad portHints={["pin1","anode","pos"]} pcbX="0.7510018mm" pcbY="0mm" width="0.7999984mm" height="0.7999984mm" shape="rect" />
<smtpad portHints={["pin2","cathode","neg"]} pcbX="-0.7510018mm" pcbY="0mm" width="0.7999984mm" height="0.7999984mm" shape="rect" />

<fabricationnotepath route={[{"x":0.6603999999999957,"y":0.1016000000000048},{"x":1.3208000000000055,"y":0.1016000000000048},{"x":1.3208000000000055,"y":-0.05079999999999529},{"x":0.6603999999999957,"y":-0.05079999999999529},{"x":0.6603999999999957,"y":0.1016000000000048}]} strokeWidth="0mm" isFilled hasStroke={false} />
<fabricationnotepath route={[{"x":0.9355582000000027,"y":-0.2751581999999928},{"x":0.9355582000000027,"y":0.38524180000000285},{"x":1.0879582000000028,"y":0.38524180000000285},{"x":1.0879582000000028,"y":-0.2751581999999928},{"x":0.9355582000000027,"y":-0.2751581999999928}]} strokeWidth="0mm" isFilled hasStroke={false} />
<fabricationnotepath route={[{"x":-1.1933427999999964,"y":0.04963159999999789},{"x":-0.5329428000000007,"y":0.04963159999999789},{"x":-0.5329428000000007,"y":-0.10276839999998799},{"x":-1.1933427999999964,"y":-0.10276839999998799},{"x":-1.1933427999999964,"y":0.04963159999999789}]} strokeWidth="0mm" isFilled hasStroke={false} />
<courtyardoutline outline={[{"x":-1.4010009999999937,"y":0.6499991999999963},{"x":1.4010009999999937,"y":0.6499991999999963},{"x":1.4010009999999937,"y":-0.6499991999999963},{"x":-1.4010009999999937,"y":-0.6499991999999963},{"x":-1.4010009999999937,"y":0.6499991999999963}]} />
      </footprint>}
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C2287.obj?uuid=eca76de2c48042b48052f5876bb6c831",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C2287.step?uuid=eca76de2c48042b48052f5876bb6c831",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: 0, y: 0, z: -0.01 },
      }}
      {...restProps}
    />
  )
}