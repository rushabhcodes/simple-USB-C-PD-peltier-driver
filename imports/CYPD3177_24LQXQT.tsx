// Supplier footprint: tsci import C2952489 --jlcpcb --use-exact-footprint; see docs/component-imports.json.
import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["VBUS_MIN"],
  pin2: ["VBUS_MAX"],
  pin3: ["VBUS_FET_EN"],
  pin4: ["SAFE_PWR_EN"],
  pin5: ["ISNK_COARSE"],
  pin6: ["ISNK_FINE"],
  pin7: ["HPI_INT"],
  pin8: ["GPIO_1"],
  pin9: ["FAULT"],
  pin10: ["FLIP"],
  pin11: ["VDC_OUT"],
  pin12: ["HPI_SDA"],
  pin13: ["HPI_SCL"],
  pin14: ["CC2"],
  pin15: ["CC1"],
  pin16: ["D_NEG"],
  pin17: ["D_POS"],
  pin18: ["VBUS_IN"],
  pin19: ["GND1"],
  pin20: ["DNU1"],
  pin21: ["DNU2"],
  pin22: ["GND2"],
  pin23: ["VDDD"],
  pin24: ["VCCD"],
  pin25: ["EP"]
} as const

const pinAttributes = {
  pin18: {requiresPower: true},
  pin19: {requiresGround: true},
  pin22: {requiresGround: true},
  pin25: {requiresGround: true}
} as const

export const CYPD3177_24LQXQT = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      pinAttributes={pinAttributes}
      supplierPartNumbers={{
  "jlcpcb": [
    "C2952489"
  ]
}}
      manufacturerPartNumber="CYPD3177-24LQXQT"
      footprint={<footprint>
        <smtpad portHints={["pin1"]} pcbX="-1.970024mm" pcbY="1.249934mm" width="0.6649974mm" height="0.2800096mm" shape="rect" />
<smtpad portHints={["pin2"]} pcbX="-1.970024mm" pcbY="0.750062mm" width="0.6649974mm" height="0.2800096mm" shape="rect" />
<smtpad portHints={["pin3"]} pcbX="-1.970024mm" pcbY="0.249936mm" width="0.6649974mm" height="0.2800096mm" shape="rect" />
<smtpad portHints={["pin4"]} pcbX="-1.970024mm" pcbY="-0.249936mm" width="0.6649974mm" height="0.2800096mm" shape="rect" />
<smtpad portHints={["pin5"]} pcbX="-1.970024mm" pcbY="-0.750062mm" width="0.6649974mm" height="0.2800096mm" shape="rect" />
<smtpad portHints={["pin6"]} pcbX="-1.970024mm" pcbY="-1.249934mm" width="0.6649974mm" height="0.2800096mm" shape="rect" />
<smtpad portHints={["pin7"]} pcbX="-1.249934mm" pcbY="-1.970024mm" width="0.2800096mm" height="0.6649974mm" shape="rect" />
<smtpad portHints={["pin8"]} pcbX="-0.750062mm" pcbY="-1.970024mm" width="0.2800096mm" height="0.6649974mm" shape="rect" />
<smtpad portHints={["pin9"]} pcbX="-0.249936mm" pcbY="-1.970024mm" width="0.2800096mm" height="0.6649974mm" shape="rect" />
<smtpad portHints={["pin10"]} pcbX="0.249936mm" pcbY="-1.970024mm" width="0.2800096mm" height="0.6649974mm" shape="rect" />
<smtpad portHints={["pin11"]} pcbX="0.750062mm" pcbY="-1.970024mm" width="0.2800096mm" height="0.6649974mm" shape="rect" />
<smtpad portHints={["pin12"]} pcbX="1.249934mm" pcbY="-1.970024mm" width="0.2800096mm" height="0.6649974mm" shape="rect" />
<smtpad portHints={["pin13"]} pcbX="1.970024mm" pcbY="-1.249934mm" width="0.6649974mm" height="0.2800096mm" shape="rect" />
<smtpad portHints={["pin14"]} pcbX="1.970024mm" pcbY="-0.750062mm" width="0.6649974mm" height="0.2800096mm" shape="rect" />
<smtpad portHints={["pin15"]} pcbX="1.970024mm" pcbY="-0.249936mm" width="0.6649974mm" height="0.2800096mm" shape="rect" />
<smtpad portHints={["pin16"]} pcbX="1.970024mm" pcbY="0.249936mm" width="0.6649974mm" height="0.2800096mm" shape="rect" />
<smtpad portHints={["pin17"]} pcbX="1.970024mm" pcbY="0.750062mm" width="0.6649974mm" height="0.2800096mm" shape="rect" />
<smtpad portHints={["pin18"]} pcbX="1.970024mm" pcbY="1.249934mm" width="0.6649974mm" height="0.2800096mm" shape="rect" />
<smtpad portHints={["pin19"]} pcbX="1.249934mm" pcbY="1.970024mm" width="0.2800096mm" height="0.6649974mm" shape="rect" />
<smtpad portHints={["pin20"]} pcbX="0.750062mm" pcbY="1.970024mm" width="0.2800096mm" height="0.6649974mm" shape="rect" />
<smtpad portHints={["pin21"]} pcbX="0.249936mm" pcbY="1.970024mm" width="0.2800096mm" height="0.6649974mm" shape="rect" />
<smtpad portHints={["pin22"]} pcbX="-0.249936mm" pcbY="1.970024mm" width="0.2800096mm" height="0.6649974mm" shape="rect" />
<smtpad portHints={["pin23"]} pcbX="-0.750062mm" pcbY="1.970024mm" width="0.2800096mm" height="0.6649974mm" shape="rect" />
<smtpad portHints={["pin24"]} pcbX="-1.249934mm" pcbY="1.970024mm" width="0.2800096mm" height="0.6649974mm" shape="rect" />
<smtpad portHints={["pin25"]} pcbX="0mm" pcbY="0mm" width="2.7999944mm" height="2.7999944mm" shape="rect" />

<courtyardoutline outline={[{"x":-2.5525226999999404,"y":2.5525226999999404},{"x":2.5525226999998267,"y":2.5525226999999404},{"x":2.5525226999998267,"y":-2.5525226999998267},{"x":-2.5525226999999404,"y":-2.5525226999998267},{"x":-2.5525226999999404,"y":2.5525226999999404}]} />
      </footprint>}
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C2952489.obj?uuid=bdabffe6205b4c07a55b4e3d4c5c681c",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C2952489.step?uuid=bdabffe6205b4c07a55b4e3d4c5c681c",
        pcbRotationOffset: 270,
        modelOriginPosition: { x: 0, y: 0, z: -0.02 },
      }}
      {...props}
    />
  )
}
