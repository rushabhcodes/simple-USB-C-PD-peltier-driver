// Supplier footprint: tsci import C7095263 --jlcpcb --use-exact-footprint; see docs/component-imports.json.
import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["CC1","A5"],
  pin2: ["GND1","A1"],
  pin3: ["VBUS1","A4"],
  pin4: ["Dp1","A6"],
  pin5: ["Dn1","A7"],
  pin6: ["SBU1","A8"],
  pin7: ["VBUS2","A9"],
  pin8: ["GND2","A12"],
  pin9: ["GND3","B12"],
  pin10: ["VBUS3","B9"],
  pin11: ["SBU2","B8"],
  pin12: ["Dn2","B7"],
  pin13: ["Dp2","B6"],
  pin14: ["CC2","B5"],
  pin15: ["VBUS4","B4"],
  pin16: ["GND4","B1"],
  pin17: ["S1"]
} as const

export const USB4085_GF_A = (props: ChipProps<typeof pinLabels>) => {
  return (
    <connector standard="usb_c"
      pinAttributes={{ pin2: { requiresGround: true }, pin8: { requiresGround: true },
        pin9: { requiresGround: true }, pin16: { requiresGround: true }, pin17: { requiresGround: true },
        pin3: { isPassive: true }, pin7: { isPassive: true }, pin10: { isPassive: true }, pin15: { isPassive: true } }}
      pinLabels={pinLabels}
      supplierPartNumbers={{
  "jlcpcb": [
    "C7095263"
  ]
}}
      manufacturerPartNumber="USB4085-GF-A"
      // GCT USB4085 drawing, sheet 2: 16 through-hole contacts, not SMT lands.
      // https://gct.co/connector/usb4085 (0.40 mm drills, 0.65 mm lands, 0.85/1.35 mm pitch).
      footprint={<footprint insertionDirection="from_bottom">
        <platedhole  portHints={["pin1"]} pcbX="-1.27508mm" pcbY="2.180082mm" holeWidth="0.40005mm" holeHeight="0.399796mm" outerWidth="0.649986mm" outerHeight="0.649986mm" shape="pill" />
<platedhole  portHints={["pin2"]} pcbX="-2.975102mm" pcbY="2.180082mm" holeWidth="0.40005mm" holeHeight="0.399796mm" outerWidth="0.649986mm" outerHeight="0.649986mm" shape="pill" />
<platedhole  portHints={["pin3"]} pcbX="-2.124964mm" pcbY="2.180082mm" holeWidth="0.40005mm" holeHeight="0.399796mm" outerWidth="0.649986mm" outerHeight="0.649986mm" shape="pill" />
<platedhole  portHints={["pin4"]} pcbX="-0.424942mm" pcbY="2.180082mm" holeWidth="0.40005mm" holeHeight="0.399796mm" outerWidth="0.649986mm" outerHeight="0.649986mm" shape="pill" />
<platedhole  portHints={["pin5"]} pcbX="0.424942mm" pcbY="2.180082mm" holeWidth="0.40005mm" holeHeight="0.399796mm" outerWidth="0.649986mm" outerHeight="0.649986mm" shape="pill" />
<platedhole  portHints={["pin6"]} pcbX="1.27508mm" pcbY="2.180082mm" holeWidth="0.40005mm" holeHeight="0.399796mm" outerWidth="0.649986mm" outerHeight="0.649986mm" shape="pill" />
<platedhole  portHints={["pin7"]} pcbX="2.124964mm" pcbY="2.180082mm" holeWidth="0.40005mm" holeHeight="0.399796mm" outerWidth="0.649986mm" outerHeight="0.649986mm" shape="pill" />
<platedhole  portHints={["pin8"]} pcbX="2.975102mm" pcbY="2.180082mm" holeWidth="0.40005mm" holeHeight="0.399796mm" outerWidth="0.649986mm" outerHeight="0.649986mm" shape="pill" />
<platedhole  portHints={["pin9"]} pcbX="-2.975102mm" pcbY="0.830072mm" holeWidth="0.40005mm" holeHeight="0.399796mm" outerWidth="0.649986mm" outerHeight="0.649986mm" shape="pill" />
<platedhole  portHints={["pin10"]} pcbX="-2.119884mm" pcbY="0.830072mm" holeWidth="0.40005mm" holeHeight="0.399796mm" outerWidth="0.649986mm" outerHeight="0.649986mm" shape="pill" />
<platedhole  portHints={["pin11"]} pcbX="-1.27mm" pcbY="0.830072mm" holeWidth="0.40005mm" holeHeight="0.399796mm" outerWidth="0.649986mm" outerHeight="0.649986mm" shape="pill" />
<platedhole  portHints={["pin12"]} pcbX="-0.420116mm" pcbY="0.830072mm" holeWidth="0.40005mm" holeHeight="0.399796mm" outerWidth="0.649986mm" outerHeight="0.649986mm" shape="pill" />
<platedhole  portHints={["pin13"]} pcbX="0.430022mm" pcbY="0.830072mm" holeWidth="0.40005mm" holeHeight="0.399796mm" outerWidth="0.649986mm" outerHeight="0.649986mm" shape="pill" />
<platedhole  portHints={["pin14"]} pcbX="1.279906mm" pcbY="0.830072mm" holeWidth="0.40005mm" holeHeight="0.399796mm" outerWidth="0.649986mm" outerHeight="0.649986mm" shape="pill" />
<platedhole  portHints={["pin15"]} pcbX="2.130044mm" pcbY="0.830072mm" holeWidth="0.40005mm" holeHeight="0.399796mm" outerWidth="0.649986mm" outerHeight="0.649986mm" shape="pill" />
<platedhole  portHints={["pin16"]} pcbX="2.979928mm" pcbY="0.830072mm" holeWidth="0.40005mm" holeHeight="0.399796mm" outerWidth="0.649986mm" outerHeight="0.649986mm" shape="pill" />
<platedhole  portHints={["pin17"]} pcbX="-4.325112mm" pcbY="1.199896mm" holeWidth="0.599948mm" holeHeight="2.100072mm" outerWidth="0.899922mm" outerHeight="2.400046mm" shape="pill" />
<platedhole  portHints={["pin17"]} pcbX="4.325112mm" pcbY="1.199896mm" holeWidth="0.599948mm" holeHeight="2.100072mm" outerWidth="0.899922mm" outerHeight="2.400046mm" shape="pill" />
<platedhole  portHints={["pin17"]} pcbX="-4.325112mm" pcbY="-2.180082mm" holeWidth="0.599948mm" holeHeight="1.400048mm" outerWidth="0.899922mm" outerHeight="1.700022mm" shape="pill" />
<platedhole  portHints={["pin17"]} pcbX="4.325112mm" pcbY="-2.180082mm" holeWidth="0.599948mm" holeHeight="1.400048mm" outerWidth="0.899922mm" outerHeight="1.700022mm" shape="pill" />

<fabricationnotepath route={[{"x":-2.8949903999998696,"y":3.0500828000001547},{"x":-3.5099497999999585,"y":3.660089200000016},{"x":-2.284983999999895,"y":3.660089200000016},{"x":-2.8949903999998696,"y":3.0500828000001547}]} strokeWidth="0mm" isFilled hasStroke={false} />
<courtyardoutline outline={[{"x":-5.02507300000002,"y":3.010091000000102},{"x":5.02507300000002,"y":3.010091000000102},{"x":5.02507300000002,"y":-6.659867799999915},{"x":-5.02507300000002,"y":-6.659867799999915},{"x":-5.02507300000002,"y":3.010091000000102}]} />
      </footprint>}
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C7095263.obj?uuid=93a4c9e821b34e2aa62f203849b72926",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C7095263.step?uuid=93a4c9e821b34e2aa62f203849b72926",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: 0, y: 1.8248883999999634, z: 0.09999559999999974 },
      }}
      {...props}
    />
  )
}
