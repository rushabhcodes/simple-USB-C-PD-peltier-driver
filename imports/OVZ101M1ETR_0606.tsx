// Supplier footprint: tsci import C164071 --jlcpcb --use-exact-footprint; see docs/component-imports.json.
import type { CapacitorProps } from "@tscircuit/props"

export const OVZ101M1ETR_0606 = (props: Omit<CapacitorProps, "capacitance">) => {
  const { name = "C1", ...restProps } = props

  return (
    <capacitor
      name={name}
      capacitance="100uF"
      polarized
      supplierPartNumbers={{
  "jlcpcb": [
    "C164071"
  ]
}}
      manufacturerPartNumber="OVZ101M1ETR-0606"
      footprint={<footprint>
        <smtpad portHints={["pin2", "neg"]} pcbX="2.669921mm" pcbY="0mm" width="3.499993mm" height="1.1999976mm" shape="rect" />
<smtpad portHints={["pin1", "pos"]} pcbX="-2.669921mm" pcbY="0mm" width="3.499993mm" height="1.1999976mm" shape="rect" />

<fabricationnotepath route={[{"x":-2.8100782000001345,"y":0.6599427999999534},{"x":-2.8100782000001345,"y":-0.6600444000000607},{"x":-2.6120852000001378,"y":-0.6600444000000607},{"x":-2.6120852000001378,"y":0.6599427999999534},{"x":-2.8100782000001345,"y":0.6599427999999534}]} strokeWidth="0mm" isFilled hasStroke={false} />
<fabricationnotepath route={[{"x":-3.102076600000146,"y":0.09895840000001499},{"x":-3.102076600000146,"y":-0.09906000000012227},{"x":-2.3100792000000183,"y":-0.09906000000012227},{"x":-2.3100792000000183,"y":0.09895840000001499},{"x":-3.102076600000146,"y":0.09895840000001499}]} strokeWidth="0mm" isFilled hasStroke={false} />
<fabricationnotepath route={[{"x":3.1019241999998712,"y":0.09895840000001499},{"x":3.1019241999998712,"y":-0.09906000000012227},{"x":2.309926799999971,"y":-0.09906000000012227},{"x":2.309926799999971,"y":0.09895840000001499},{"x":3.1019241999998712,"y":0.09895840000001499}]} strokeWidth="0mm" isFilled hasStroke={false} />
<courtyardoutline outline={[{"x":-4.669917499999997,"y":3.5499426000000085},{"x":4.669917499999997,"y":3.5499426000000085},{"x":4.669917499999997,"y":-3.550044200000116},{"x":-4.669917499999997,"y":-3.550044200000116},{"x":-4.669917499999997,"y":3.5499426000000085}]} />
      </footprint>}
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C164071.obj?uuid=a0e1020d0a024be2ba93e0905a6e8289",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C164071.step?uuid=a0e1020d0a024be2ba93e0905a6e8289",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: 0.0000762000000804619, y: 0.00005080000016732811, z: -0.02 },
      }}
      {...restProps}
    />
  )
}
