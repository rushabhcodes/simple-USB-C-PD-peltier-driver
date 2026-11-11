// Supplier footprint: tsci import C2871822 --jlcpcb --use-exact-footprint; see docs/component-imports.json.
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

export const LMR50410Y5FQDBVRQ1 = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      pinAttributes={pinAttributes}
      supplierPartNumbers={{
  "jlcpcb": [
    "C2871822"
  ]
}}
      manufacturerPartNumber="LMR50410Y5FQDBVRQ1"
      footprint={<footprint>
        <smtpad portHints={["pin6"]} pcbX="-0.94996mm" pcbY="1.1999976mm" width="0.5500116mm" height="1.1999976mm" shape="rect" />
<smtpad portHints={["pin4"]} pcbX="0.94996mm" pcbY="1.1999976mm" width="0.5500116mm" height="1.1999976mm" shape="rect" />
<smtpad portHints={["pin3"]} pcbX="0.94996mm" pcbY="-1.1999976mm" width="0.5500116mm" height="1.1999976mm" shape="rect" />
<smtpad portHints={["pin2"]} pcbX="0mm" pcbY="-1.1999976mm" width="0.5500116mm" height="1.1999976mm" shape="rect" />
<smtpad portHints={["pin1"]} pcbX="-0.94996mm" pcbY="-1.1999976mm" width="0.5500116mm" height="1.1999976mm" shape="rect" />
<smtpad portHints={["pin5"]} pcbX="0mm" pcbY="1.1999976mm" width="0.5500116mm" height="1.1999976mm" shape="rect" />

<courtyardoutline outline={[{"x":-1.699984399999991,"y":2.0499963999999977},{"x":1.700009800000018,"y":2.0499963999999977},{"x":1.700009800000018,"y":-2.0499963999999977},{"x":-1.699984399999991,"y":-2.0499963999999977},{"x":-1.699984399999991,"y":2.0499963999999977}]} />
      </footprint>}
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C2871822.obj?uuid=222e8593009c495bb3d3af0c08fa5e6a",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C2871822.step?uuid=222e8593009c495bb3d3af0c08fa5e6a",
        pcbRotationOffset: 90,
        modelOriginPosition: { x: 0, y: 0.000012700000013410317, z: 0.050795 },
      }}
      {...props}
    />
  )
}