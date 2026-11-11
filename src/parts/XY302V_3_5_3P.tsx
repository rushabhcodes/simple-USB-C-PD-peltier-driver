// Supplier footprint: tsci import C784941 --jlcpcb --use-exact-footprint; see docs/component-imports.json.
import type { ConnectorProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["pin1"],
  pin2: ["pin2"],
  pin3: ["pin3"]
} as const

export const XY302V_3_5_3P = (props: ConnectorProps) => {
  return (
    <connector
      pinLabels={pinLabels}
      symbol={<symbol>
        <schematicpath points={[{ x: -2, y: 1.8 }, { x: 2, y: 1.8 }, { x: 2, y: -1.8 }, { x: -2, y: -1.8 }, { x: -2, y: 1.8 }]}
          strokeWidth={0.04} strokeColor="#880000" />
        <port name="pin1" pinNumber={1} direction="left" schX={-2.5} schY={1.2} schStemLength={0.5} />
        <port name="pin2" pinNumber={2} direction="left" schX={-2.5} schY={0} schStemLength={0.5} />
        <port name="pin3" pinNumber={3} direction="left" schX={-2.5} schY={-1.2} schStemLength={0.5} />
        <schematictext text="1  3V3 / RED" schX={-1.65} schY={1.2} anchor="center_left" fontSize={0.28} />
        <schematictext text="2  DATA / YELLOW" schX={-1.65} schY={0} anchor="center_left" fontSize={0.28} />
        <schematictext text="3  GND / BLACK" schX={-1.65} schY={-1.2} anchor="center_left" fontSize={0.28} />
        <schematictext text="{NAME}" schX={0} schY={2.1} anchor="bottom_center" fontSize={0.3} />
      </symbol>}
      supplierPartNumbers={{
  "jlcpcb": [
    "C784941"
  ]
}}
      manufacturerPartNumber="XY302V-3.5-3P"
      footprint={<footprint insertionDirection="from_bottom">
        <platedhole  portHints={["pin1"]} pcbX="-3.499993mm" pcbY="0mm" outerDiameter="1.6999966mm" holeDiameter="1.1000232mm" shape="circle" />
<platedhole  portHints={["pin2"]} pcbX="0mm" pcbY="0mm" outerDiameter="1.6999966mm" holeDiameter="1.1000232mm" shape="circle" />
<platedhole  portHints={["pin3"]} pcbX="3.499993mm" pcbY="0mm" outerDiameter="1.6999966mm" holeDiameter="1.1000232mm" shape="circle" />

<courtyardoutline outline={[{"x":-5.474983199999997,"y":4.149992200000042},{"x":6.024994799999945,"y":4.149992200000042},{"x":6.024994799999945,"y":-3.649993199999926},{"x":-5.474983199999997,"y":-3.649993199999926},{"x":-5.474983199999997,"y":4.149992200000042}]} />
      </footprint>}
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C784941.obj?uuid=ce97c0b00e884dd99d85dccd2888bd94",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C784941.step?uuid=ce97c0b00e884dd99d85dccd2888bd94",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: -0.025005799999917144, y: -0.2499995000000581, z: -0.000006999999999646178 },
      }}
      {...props}
    />
  )
}
