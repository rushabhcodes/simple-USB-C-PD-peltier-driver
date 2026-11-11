// Supplier footprint: tsci import C5942077 --jlcpcb --use-exact-footprint; see docs/component-imports.json.
import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["EN","UVLO"],
  pin2: ["MODE"],
  pin3: ["SCL"],
  pin4: ["SDA"],
  pin5: ["DITH","SYNC"],
  pin6: ["FSW"],
  pin7: ["VIN"],
  pin8: ["SW1"],
  pin9: ["PGND"],
  pin10: ["SW2"],
  pin11: ["VOUT"],
  pin12: ["ISP"],
  pin13: ["ISN"],
  pin14: ["FB","N_INT"],
  pin15: ["COMP"],
  pin16: ["CDC"],
  pin17: ["AGND"],
  pin18: ["VCC"],
  pin19: ["BOOT2"],
  pin20: ["BOOT1"],
  pin21: ["EXTVCC"]
} as const

const pinAttributes = {
  pin7: {requiresPower: true},
  pin9: {requiresGround: true},
  pin17: {requiresGround: true},
  pin18: {requiresPower: true}
} as const

export const TPS55289RYQR = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      pinAttributes={pinAttributes}
      schWidth={4.6}
      schHeight={6.4}
      schPinArrangement={{
        leftSide: { pins: [7, 1, 3, 4, 6], direction: "top-to-bottom" },
        topSide: { pins: [20, 8, 10, 19], direction: "left-to-right" },
        rightSide: { pins: [11, 14, 16, 12, 13, 15], direction: "top-to-bottom" },
        bottomSide: { pins: [18, 21, 2, 5, 9, 17], direction: "left-to-right" },
      }}
      schPinStyle={{
        pin7: { marginBottom: 1.4 }, pin1: { marginBottom: 0.4 },
        pin3: { marginBottom: 0.4 }, pin4: { marginBottom: 1.4 },
        pin11: { marginBottom: 1.2 }, pin12: { marginBottom: 0.6 },
        pin13: { marginBottom: 1 }, pin14: { marginBottom: 0.4 },
        pin16: { marginBottom: 0.6 },
        pin20: { marginRight: 0.8 }, pin8: { marginRight: 0.8 },
        pin10: { marginRight: 0.8 },
        pin18: { marginRight: 0.6 }, pin21: { marginRight: 0.2 },
        pin2: { marginRight: 0.2 }, pin5: { marginRight: 0.2 },
        pin9: { marginRight: 0.2 },
      }}
      supplierPartNumbers={{
  "jlcpcb": [
    "C5942077"
  ]
}}
      manufacturerPartNumber="TPS55289RYQR"
      footprint={<footprint>
        <smtpad portHints={["pin1"]} pcbX="-2.3999952mm" pcbY="0.750062mm" width="0.5999988mm" height="0.2500122mm" shape="rect" />
<smtpad portHints={["pin2"]} pcbX="-2.3999952mm" pcbY="0.249936mm" width="0.5999988mm" height="0.2500122mm" shape="rect" />
<smtpad portHints={["pin3"]} pcbX="-2.3999952mm" pcbY="-0.249936mm" width="0.5999988mm" height="0.2500122mm" shape="rect" />
<smtpad portHints={["pin4"]} pcbX="-2.3999952mm" pcbY="-0.750062mm" width="0.5999988mm" height="0.2500122mm" shape="rect" />
        {/* Retract the heels of the four corner lands by 0.05 mm for the 2 oz mask dam. */}
<smtpad portHints={["pin5"]} pcbX="-2.040001mm" pcbY="-1.4mm" width="0.2500122mm" height="0.6mm" shape="rect" />
<smtpad portHints={["pin6"]} pcbX="-1.539875mm" pcbY="-1.3999972mm" width="0.2500122mm" height="0.5999988mm" shape="rect" />
<smtpad portHints={["pin7"]} pcbX="-1.040003mm" pcbY="0mm" width="0.2500122mm" height="3.3999932mm" shape="rect" />
<smtpad portHints={["pin8"]} pcbX="-0.539877mm" pcbY="0mm" width="0.2500122mm" height="3.3999932mm" shape="rect" />
<smtpad portHints={["pin9"]} pcbX="0mm" pcbY="0mm" width="0.3299968mm" height="3.3999932mm" shape="rect" />
<smtpad portHints={["pin10"]} pcbX="0.540131mm" pcbY="0mm" width="0.2500122mm" height="3.3999932mm" shape="rect" />
<smtpad portHints={["pin11"]} pcbX="1.040003mm" pcbY="0mm" width="0.2500122mm" height="3.3999932mm" shape="rect" />
<smtpad portHints={["pin12"]} pcbX="1.540129mm" pcbY="-1.3999972mm" width="0.2500122mm" height="0.5999988mm" shape="rect" />
<smtpad portHints={["pin13"]} pcbX="2.040001mm" pcbY="-1.4mm" width="0.2500122mm" height="0.6mm" shape="rect" />
<smtpad portHints={["pin14"]} pcbX="2.3999952mm" pcbY="-0.750062mm" width="0.5999988mm" height="0.2500122mm" shape="rect" />
<smtpad portHints={["pin15"]} pcbX="2.3999952mm" pcbY="-0.249936mm" width="0.5999988mm" height="0.2500122mm" shape="rect" />
<smtpad portHints={["pin16"]} pcbX="2.3999952mm" pcbY="0.249936mm" width="0.5999988mm" height="0.2500122mm" shape="rect" />
<smtpad portHints={["pin17"]} pcbX="2.3999952mm" pcbY="0.750062mm" width="0.5999988mm" height="0.2500122mm" shape="rect" />
<smtpad portHints={["pin18"]} pcbX="2.040001mm" pcbY="1.4mm" width="0.2500122mm" height="0.6mm" shape="rect" />
<smtpad portHints={["pin19"]} pcbX="1.540129mm" pcbY="1.3999972mm" width="0.2500122mm" height="0.5999988mm" shape="rect" />
<smtpad portHints={["pin21"]} pcbX="-2.040001mm" pcbY="1.4mm" width="0.2500122mm" height="0.6mm" shape="rect" />
<smtpad portHints={["pin20"]} pcbX="-1.540129mm" pcbY="1.3999972mm" width="0.2500122mm" height="0.5999988mm" shape="rect" />

<courtyardoutline outline={[{"x":-3.348799999999983,"y":1.9518000000000058},{"x":2.9424000000000063,"y":1.9518000000000058},{"x":2.9424000000000063,"y":-1.9517999999999915},{"x":-3.348799999999983,"y":-1.9517999999999915},{"x":-3.348799999999983,"y":1.9518000000000058}]} />
      </footprint>}
      // TI's RYQ0021A package envelope (5 x 3 x 1 mm maximum).
      // The manufacturer-linked Ultra Librarian detailed CAD needs a login;
      // this is a datasheet-derived envelope, not an official 3D mesh.
      // https://www.ti.com/lit/ds/symlink/tps55289.pdf, package outline.
      cadModel={{ jscad: { type: "colorize", color: [0.12, 0.12, 0.13],
        shape: { type: "cuboid", size: [5, 3, 1], center: [0, 0, 0.5] } },
        modelUnitToMmScale: 1, modelOriginPosition: { x: 0, y: 0, z: 0 } }}
      {...props}
    />
  )
}
