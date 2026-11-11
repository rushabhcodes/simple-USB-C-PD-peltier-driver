// Supplier footprint: tsci import C404027 --jlcpcb --use-exact-footprint; see docs/component-imports.json.
import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["IN"],
  pin2: ["GND"],
  pin3: ["EN"],
  pin4: ["NC"],
  pin5: ["OUT"]
} as const

const pinAttributes = {
  pin1: {requiresPower: true},
  pin2: {requiresGround: true},
  pin3: {isInput: true},
  pin4: {doNotConnect: true},
  pin5: {providesPower: true, providesVoltage: "3.3V"}
} as const

export const TLV75533PDBVR = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      pinAttributes={pinAttributes}
      supplierPartNumbers={{
  "jlcpcb": [
    "C404027"
  ]
}}
      manufacturerPartNumber="TLV75533PDBVR"
      footprint={<footprint>
        <smtpad portHints={["pin5"]} pcbX="-1.300099mm" pcbY="-0.94996mm" width="1.0999978mm" height="0.5999988mm" shape="rect" />
<smtpad portHints={["pin4"]} pcbX="-1.300099mm" pcbY="0.94996mm" width="1.0999978mm" height="0.5999988mm" shape="rect" />
<smtpad portHints={["pin3"]} pcbX="1.300099mm" pcbY="0.94996mm" width="1.0999978mm" height="0.5999988mm" shape="rect" />
<smtpad portHints={["pin2"]} pcbX="1.300099mm" pcbY="-0mm" width="1.0999978mm" height="0.5999988mm" shape="rect" />
<smtpad portHints={["pin1"]} pcbX="1.300099mm" pcbY="-0.94996mm" width="1.0999978mm" height="0.5999988mm" shape="rect" />

<courtyardoutline outline={[{"x":-2.1000978999999234,"y":1.6999843999999484},{"x":2.1000978999999234,"y":1.6999843999999484},{"x":2.1000978999999234,"y":-1.7000097999999753},{"x":-2.1000978999999234,"y":-1.7000097999999753},{"x":-2.1000978999999234,"y":1.6999843999999484}]} />
      </footprint>}
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C404027.obj?uuid=460193f9bf2d42e58cf3c2f675b07dc6",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C404027.step?uuid=460193f9bf2d42e58cf3c2f675b07dc6",
        pcbRotationOffset: 180,
        modelOriginPosition: { x: 0, y: -0.000012700000070253736, z: -0.049083 },
      }}
      {...props}
    />
  )
}
