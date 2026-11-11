// Supplier footprint: tsci import C3235557 --jlcpcb --use-exact-footprint; see docs/component-imports.json.
import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["GND"],
  pin2: ["VOUT1"],
  pin3: ["VIN1"],
  pin4: ["PR1"],
  pin5: ["MODE"],
  pin6: ["VIN2"],
  pin7: ["VOUT2"],
  pin8: ["ST"]
} as const

const pinAttributes = {
  pin1: {requiresGround: true},
  pin2: {providesPower: true},
  pin3: {requiresPower: true},
  pin4: {isInput: true},
  pin5: {isInput: true},
  pin6: {requiresPower: true},
  pin7: {providesPower: true},
  pin8: {isOutput: true, canUseOpenDrain: true, isUsingOpenDrain: true}
} as const

export const TPS2116DRLR = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      pinAttributes={pinAttributes}
      supplierPartNumbers={{
  "jlcpcb": [
    "C3235557"
  ]
}}
      manufacturerPartNumber="TPS2116DRLR"
      footprint={<footprint>
        <smtpad portHints={["pin1"]} pcbX="-0.750062mm" pcbY="-0.64008mm" width="0.2800096mm" height="0.6800088mm" shape="rect" />
<smtpad portHints={["pin2"]} pcbX="-0.249936mm" pcbY="-0.64008mm" width="0.2800096mm" height="0.6800088mm" shape="rect" />
<smtpad portHints={["pin3"]} pcbX="0.249936mm" pcbY="-0.64008mm" width="0.2800096mm" height="0.6800088mm" shape="rect" />
<smtpad portHints={["pin4"]} pcbX="0.750062mm" pcbY="-0.64008mm" width="0.2800096mm" height="0.6800088mm" shape="rect" />
<smtpad portHints={["pin5"]} pcbX="0.750062mm" pcbY="0.64008mm" width="0.2800096mm" height="0.6800088mm" shape="rect" />
<smtpad portHints={["pin6"]} pcbX="0.249936mm" pcbY="0.64008mm" width="0.2800096mm" height="0.6800088mm" shape="rect" />
<smtpad portHints={["pin7"]} pcbX="-0.249936mm" pcbY="0.64008mm" width="0.2800096mm" height="0.6800088mm" shape="rect" />
<smtpad portHints={["pin8"]} pcbX="-0.750062mm" pcbY="0.64008mm" width="0.2800096mm" height="0.6800088mm" shape="rect" />

<courtyardoutline outline={[{"x":-1.300010599999979,"y":1.2300843999999813},{"x":1.2999851999999947,"y":1.2300843999999813},{"x":1.2999851999999947,"y":-1.2300843999999955},{"x":-1.300010599999979,"y":-1.2300843999999955},{"x":-1.300010599999979,"y":1.2300843999999813}]} />
      </footprint>}
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C3235557.obj?uuid=7de5db90ab974d88b4eb22e148e2ee81",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C3235557.step?uuid=7de5db90ab974d88b4eb22e148e2ee81",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: 0.000012699999984988608, y: 0, z: -0.135 },
      }}
      {...props}
    />
  )
}
