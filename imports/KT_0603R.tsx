// Supplier footprint: tsci import C2286 --jlcpcb --use-exact-footprint; see docs/component-imports.json.
import type { LedProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["anode","pos"],
  pin2: ["cathode","neg"]
} as const

export const KT_0603R = (props: LedProps) => {
  const { name = "LED1", ...restProps } = props

  return (
    <led
      name={name}
      pinLabels={pinLabels}
      supplierPartNumbers={{
  "jlcpcb": [
    "C2286"
  ]
}}
      manufacturerPartNumber="KT-0603R"
      footprint={<footprint>
        <smtpad portHints={["pin2","cathode","neg"]} pcbX="-0.750062mm" pcbY="0mm" width="0.7999984mm" height="0.7999984mm" shape="rect" />
<smtpad portHints={["pin1","anode","pos"]} pcbX="0.750062mm" pcbY="0mm" width="0.7999984mm" height="0.7999984mm" shape="rect" />

<fabricationnotepath route={[{"x":-1.0264647999997578,"y":0.14396720000002006},{"x":-0.4182110000000421,"y":0.14396720000002006},{"x":-0.4182110000000421,"y":-0.009779000000094129},{"x":-1.0291825999998991,"y":-0.009779000000094129},{"x":-1.0291825999998991,"y":-0.003098800000088886},{"x":-1.0264647999997578,"y":0.14396720000002006}]} strokeWidth="0mm" isFilled hasStroke={false} />
<fabricationnotepath route={[{"x":0.4618228000001636,"y":0.13197839999997996},{"x":1.0700765999998794,"y":0.13197839999997996},{"x":1.0700765999998794,"y":-0.021767800000020543},{"x":0.4591050000000223,"y":-0.021767800000020543},{"x":0.4591050000000223,"y":-0.015087600000128987},{"x":0.4618228000001636,"y":0.13197839999997996}]} strokeWidth="0mm" isFilled hasStroke={false} />
<fabricationnotepath route={[{"x":0.6916166000000885,"y":-0.2636266000001797},{"x":0.6916166000000885,"y":0.3446271999998771},{"x":0.845362800000089,"y":0.3446271999998771},{"x":0.845362800000089,"y":-0.26634440000009363},{"x":0.8386826000000838,"y":-0.26634440000009363},{"x":0.6916166000000885,"y":-0.2636266000001797}]} strokeWidth="0mm" isFilled hasStroke={false} />
<courtyardoutline outline={[{"x":-1.4000612000000956,"y":0.650049999999851},{"x":1.4000612000000956,"y":0.650049999999851},{"x":1.4000612000000956,"y":-0.6499992000000248},{"x":-1.4000612000000956,"y":-0.6499992000000248},{"x":-1.4000612000000956,"y":0.650049999999851}]} />
      </footprint>}
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C2286.obj?uuid=0da0275bf7a84667bce8747a921fb9e3",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C2286.step?uuid=0da0275bf7a84667bce8747a921fb9e3",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: 0.000050799999826267594, y: -0.00005079999993995443, z: -0.01 },
      }}
      {...restProps}
    />
  )
}