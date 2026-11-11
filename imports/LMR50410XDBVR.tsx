// Supplier footprint: tsci import C2841056 --jlcpcb --use-exact-footprint; see docs/component-imports.json.
import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["CB"],
  pin2: ["GND"],
  pin3: ["FB"],
  pin4: ["EN"],
  pin5: ["VIN"],
  pin6: ["SW"]
} as const

const pinAttributes = {
  pin2: {requiresGround: true},
  pin5: {requiresPower: true}
} as const

export const LMR50410XDBVR = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      pinAttributes={pinAttributes}
      schWidth={2.2}
      schHeight={2.4}
      schPinArrangement={{
        leftSide: { pins: [5, 4], direction: "top-to-bottom" },
        rightSide: { pins: [6, 1, 3], direction: "top-to-bottom" },
        bottomSide: [2],
      }}
      schPinStyle={{ pin5: { marginBottom: 1 }, pin6: { marginBottom: 0.5 },
        pin1: { marginBottom: 0.5 } }}
      supplierPartNumbers={{
  "jlcpcb": [
    "C2841056"
  ]
}}
      manufacturerPartNumber="LMR50410XDBVR"
      footprint={<footprint>
        <smtpad portHints={["pin1"]} pcbX="-0.94996mm" pcbY="-1.149096mm" width="0.532003mm" height="1.072007mm" shape="rect" />
<smtpad portHints={["pin2"]} pcbX="0mm" pcbY="-1.149096mm" width="0.532003mm" height="1.072007mm" shape="rect" />
<smtpad portHints={["pin3"]} pcbX="0.94996mm" pcbY="-1.149096mm" width="0.532003mm" height="1.072007mm" shape="rect" />
<smtpad portHints={["pin4"]} pcbX="0.94996mm" pcbY="1.149096mm" width="0.532003mm" height="1.072007mm" shape="rect" />
<smtpad portHints={["pin5"]} pcbX="0mm" pcbY="1.149096mm" width="0.532003mm" height="1.072007mm" shape="rect" />
<smtpad portHints={["pin6"]} pcbX="-0.94996mm" pcbY="1.149096mm" width="0.532003mm" height="1.072007mm" shape="rect" />

<courtyardoutline outline={[{"x":-1.6999843999999484,"y":1.9350994999999784},{"x":1.7000097999999753,"y":1.9350994999999784},{"x":1.7000097999999753,"y":-1.9350994999998647},{"x":-1.6999843999999484,"y":-1.9350994999998647},{"x":-1.6999843999999484,"y":1.9350994999999784}]} />
      </footprint>}
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C2841056.obj?uuid=229b69761e2c45dba6a83d8866dec72d",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C2841056.step?uuid=229b69761e2c45dba6a83d8866dec72d",
        pcbRotationOffset: 90,
        modelOriginPosition: { x: -0.000012700000070253736, y: 0.000012700000070253736, z: -0.048939 },
      }}
      {...props}
    />
  )
}
