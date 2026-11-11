// Supplier footprint: tsci import C240840 --jlcpcb --use-exact-footprint; see docs/component-imports.json.
import type { ConnectorProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["pin1"],
  pin2: ["pin2"],
  pin3: ["pin3"],
  pin4: ["pin4"]
} as const

export const A_470531000 = (props: ConnectorProps) => {
  return (
    <connector
      pinLabels={pinLabels}
      supplierPartNumbers={{
  "jlcpcb": [
    "C240840"
  ]
}}
      manufacturerPartNumber="470531000"
      // Molex SD-47053-001 C4: contact holes 1.02 +/-0.05 mm,
      // locator hole 1.25 +/-0.05 mm, 2.54 mm contact pitch.
      // https://www.molex.com/content/dam/molex/molex-dot-com/products/automated/en-us/salesdrawingpdf/470/47053/470531000_sd.pdf
      footprint={<footprint insertionDirection="from_above">
        <hole pcbX="-1.27mm" pcbY="-1.18000145mm" diameter="1.25mm" />
<platedhole  portHints={["pin1"]} pcbX="3.81mm" pcbY="0.98001455mm" outerDiameter="1.6999966mm" holeDiameter="1.02mm" shape="circle" />
<platedhole  portHints={["pin2"]} pcbX="1.27mm" pcbY="0.98001455mm" outerDiameter="1.6999966mm" holeDiameter="1.02mm" shape="circle" />
<platedhole  portHints={["pin3"]} pcbX="-1.27mm" pcbY="0.98001455mm" outerDiameter="1.6999966mm" holeDiameter="1.02mm" shape="circle" />
<platedhole  portHints={["pin4"]} pcbX="-3.81mm" pcbY="0.98001455mm" outerDiameter="1.6999966mm" holeDiameter="1.02mm" shape="circle" />

<courtyardoutline outline={[{"x":-5.349989800000003,"y":4.550023150000129},{"x":5.349989800000003,"y":4.550023150000129},{"x":5.349989800000003,"y":-2.080012850000003},{"x":-5.349989800000003,"y":-2.080012850000003},{"x":-5.349989800000003,"y":4.550023150000129}]} />
      </footprint>}
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C240840.obj?uuid=c1d992728b48493bafd30084a88c37a7",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C240840.step?uuid=c1d992728b48493bafd30084a88c37a7",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: 0, y: -1.3800264500000594, z: -1.2500069999999996 },
      }}
      {...props}
    />
  )
}
