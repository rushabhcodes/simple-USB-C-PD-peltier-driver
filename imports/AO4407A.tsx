// Supplier footprint: tsci import C16072 --jlcpcb --use-exact-footprint; see docs/component-imports.json.
import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["S3"],
  pin2: ["S2"],
  pin3: ["S1"],
  pin4: ["G"],
  pin5: ["D1"],
  pin6: ["D2"],
  pin7: ["D3"],
  pin8: ["D4"]
} as const

export const AO4407A = (props: Omit<ChipProps<typeof pinLabels>, "connections">) => {
  return (
    <mosfet channelType="p" mosfetMode="enhancement"
      pinAttributes={{
        pin1: { isPassive: true },
        pin2: { isPassive: true },
        pin3: { isPassive: true },
        pin4: { isPassive: true },
        pin5: { isPassive: true },
        pin6: { isPassive: true },
        pin7: { isPassive: true },
        pin8: { isPassive: true },
      }}
      pinLabels={pinLabels}
      symbol={
        <symbol>
          <port name="pin1" pinNumber={1} aliases={["S3"]} direction="down" schX={-0.6} schY={-1.4} schStemLength={0.25} schPinLabelFontSize="sm" />
          <port name="pin2" pinNumber={2} aliases={["S2"]} direction="down" schX={0} schY={-1.4} schStemLength={0.25} schPinLabelFontSize="sm" />
          <port name="pin3" pinNumber={3} aliases={["S1"]} direction="down" schX={0.6} schY={-1.4} schStemLength={0.25} schPinLabelFontSize="sm" />
          <port name="pin4" pinNumber={4} aliases={["G"]} direction="left" schX={-1.6} schY={0} schStemLength={0.25} schPinLabelFontSize="sm" />
          <port name="pin5" pinNumber={5} aliases={["D1"]} direction="up" schX={-0.9} schY={1.4} schStemLength={0.25} schPinLabelFontSize="sm" />
          <port name="pin6" pinNumber={6} aliases={["D2"]} direction="up" schX={-0.3} schY={1.4} schStemLength={0.25} schPinLabelFontSize="sm" />
          <port name="pin7" pinNumber={7} aliases={["D3"]} direction="up" schX={0.3} schY={1.4} schStemLength={0.25} schPinLabelFontSize="sm" />
          <port name="pin8" pinNumber={8} aliases={["D4"]} direction="up" schX={0.9} schY={1.4} schStemLength={0.25} schPinLabelFontSize="sm" />
          {/* Package terminal banks join the same P-MOS source and drain. */}
          <schematicpath svgPath="M -0.9 1.15 H 0.9 M -0.6 -1.15 H 0.6 M 0 1.15 V 0.5 M 0 -1.15 V -0.5 M -1.35 0 H -0.6 M -0.6 -0.45 V 0.45 M -0.5 -0.45 V -0.25 M -0.5 -0.1 V 0.1 M -0.5 0.25 V 0.45" strokeColor="#880000" />
          <schematicpath svgPath="M -0.5 0.35 H 0 V 0.5 H 0.5 V 0.15 M -0.5 -0.35 H 0 V -0.5 H 0.5 V -0.1 M -0.5 0 H 0 V -0.35 M 0.35 -0.1 H 0.65" strokeColor="#880000" />
          <schematicpath svgPath="M 0 0 L -0.3 0.1 V -0.1 Z M 0.5 -0.1 L 0.65 0.15 H 0.35 Z" strokeColor="#880000" isFilled fillColor="#FEFEFE" />
          <schematictext schX={1.3} schY={0.3} text="{NAME}" fontSize={0.2} anchor="left" />
          <schematictext schX={1.3} schY={-0.1} text="AO4407A" fontSize={0.18} anchor="left" />
        </symbol>
      }
      supplierPartNumbers={{
  "jlcpcb": [
    "C16072"
  ]
}}
      manufacturerPartNumber="AO4407A"
      footprint={<footprint>
        <smtpad portHints={["pin5"]} pcbX="1.905mm" pcbY="2.599944mm" width="0.58801mm" height="1.7999964mm" radius="0.294005mm" shape="pill" />
<smtpad portHints={["pin6"]} pcbX="0.635mm" pcbY="2.599944mm" width="0.58801mm" height="1.7999964mm" radius="0.294005mm" shape="pill" />
<smtpad portHints={["pin7"]} pcbX="-0.635mm" pcbY="2.599944mm" width="0.58801mm" height="1.7999964mm" radius="0.294005mm" shape="pill" />
<smtpad portHints={["pin8"]} pcbX="-1.905mm" pcbY="2.599944mm" width="0.58801mm" height="1.7999964mm" radius="0.294005mm" shape="pill" />
<smtpad portHints={["pin4"]} pcbX="1.905mm" pcbY="-2.599944mm" width="0.58801mm" height="1.7999964mm" radius="0.294005mm" shape="pill" />
<smtpad portHints={["pin3"]} pcbX="0.635mm" pcbY="-2.599944mm" width="0.58801mm" height="1.7999964mm" radius="0.294005mm" shape="pill" />
<smtpad portHints={["pin2"]} pcbX="-0.635mm" pcbY="-2.599944mm" width="0.58801mm" height="1.7999964mm" radius="0.294005mm" shape="pill" />
<smtpad portHints={["pin1"]} pcbX="-1.905mm" pcbY="-2.599944mm" width="0.58801mm" height="1.7999964mm" radius="0.294005mm" shape="pill" />

<courtyardoutline outline={[{"x":-2.699982400000067,"y":3.7499422000000777},{"x":2.7000077999998666,"y":3.7499422000000777},{"x":2.7000077999998666,"y":-3.749942199999964},{"x":-2.699982400000067,"y":-3.749942199999964},{"x":-2.699982400000067,"y":3.7499422000000777}]} />
      </footprint>}
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C16072.obj?uuid=ec3b9f9b31a74655be3e55848dbee9c1",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C16072.step?uuid=ec3b9f9b31a74655be3e55848dbee9c1",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: -0.000012700000070253736, y: 0, z: 0 },
      }}
      {...props}
    />
  )
}
