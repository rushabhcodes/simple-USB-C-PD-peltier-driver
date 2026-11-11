// Supplier footprint: tsci import C20625731 --jlcpcb --use-exact-footprint; see docs/component-imports.json.

import type { CrystalProps } from "@tscircuit/props"

const pinAttributes = {
  pin2: {requiresGround: true},
  pin4: {requiresGround: true}
} as const

export const ABM8_272_T3 = (props: Omit<CrystalProps, "frequency" | "loadCapacitance" | "pinVariant">) => {
  return (
    <crystal
      frequency="12MHz"
      loadCapacitance="10pF"
      pinVariant="four_pin"
      pinAttributes={pinAttributes}
      symbol={
        <symbol>
          <schematictext text={props.name ?? "Y_MCU"} schX={0} schY={0.85} fontSize={0.18} />
          <schematictext text="12 MHz" schX={0} schY={0.55} fontSize={0.18} />
          <port name="pin1" pinNumber={1} aliases={["1", "X1"]} direction="left" schX={-0.6} schY={0} schStemLength={0.2} schPinLabelFontSize={0.08} />
          <port name="pin3" pinNumber={3} aliases={["3", "X2"]} direction="right" schX={0.6} schY={0} schStemLength={0.2} schPinLabelFontSize={0.08} />
          <port name="pin2" pinNumber={2} aliases={["GND1"]} direction="down" schX={-0.4} schY={-0.8} schStemLength={0.2} schPinLabelFontSize={0.08} />
          <port name="pin4" pinNumber={4} aliases={["GND2"]} direction="down" schX={0.4} schY={-0.8} schStemLength={0.2} schPinLabelFontSize={0.08} />
          <schematicrect schX={0} schY={0} width={0.16} height={0.36} strokeWidth={0.02} color="#880000" />
          <schematicpath points={[{x:-0.18,y:-0.18},{x:-0.18,y:0.18}]} strokeColor="#880000" />
          <schematicpath points={[{x:0.18,y:-0.18},{x:0.18,y:0.18}]} strokeColor="#880000" />
          <schematicpath points={[{x:-0.4,y:0},{x:-0.18,y:0}]} strokeColor="#880000" />
          <schematicpath points={[{x:0.18,y:0},{x:0.4,y:0}]} strokeColor="#880000" />
          <schematicpath points={[{x:-0.5,y:0.3},{x:-0.5,y:-0.3},{x:0.5,y:-0.3},{x:0.5,y:0.3}]} strokeColor="#880000" />
          <schematicpath points={[{x:-0.4,y:-0.3},{x:-0.4,y:-0.6}]} strokeColor="#880000" />
          <schematicpath points={[{x:0.4,y:-0.3},{x:0.4,y:-0.6}]} strokeColor="#880000" />
        </symbol>
      }
      supplierPartNumbers={{
  "jlcpcb": [
    "C20625731"
  ]
}}
      manufacturerPartNumber="ABM8-272-T3"
      footprint={<footprint>
        <smtpad portHints={["pin1"]} pcbX="-1.100074mm" pcbY="-0.850011mm" width="1.3999972mm" height="1.1999976mm" shape="rect" />
<smtpad portHints={["pin2"]} pcbX="1.100074mm" pcbY="-0.850011mm" width="1.3999972mm" height="1.1999976mm" shape="rect" />
<smtpad portHints={["pin3"]} pcbX="1.100074mm" pcbY="0.850011mm" width="1.3999972mm" height="1.1999976mm" shape="rect" />
<smtpad portHints={["pin4"]} pcbX="-1.100074mm" pcbY="0.850011mm" width="1.3999972mm" height="1.1999976mm" shape="rect" />

<courtyardoutline outline={[{"x":-2.0500725999999077,"y":1.7000097999999753},{"x":2.0500725999999077,"y":1.7000097999999753},{"x":2.0500725999999077,"y":-1.7000097999999753},{"x":-2.0500725999999077,"y":-1.7000097999999753},{"x":-2.0500725999999077,"y":1.7000097999999753}]} />
      </footprint>}
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C20625731.obj?uuid=02485e56ba8d4732a26526d2983fc729",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C20625731.step?uuid=02485e56ba8d4732a26526d2983fc729",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: 0, y: -0.000012700000070253736, z: 0 },
      }}
      {...props}
    />
  )
}
