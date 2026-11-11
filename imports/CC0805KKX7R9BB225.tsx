// Supplier footprint: tsci import C125847 --jlcpcb --use-exact-footprint; see docs/component-imports.json.
import type { CapacitorProps } from "@tscircuit/props"

export const CC0805KKX7R9BB225 = (props: Omit<CapacitorProps, "capacitance">) => {
  const { name = "C1", ...restProps } = props

  return (
    <capacitor
      name={name}
      capacitance="2.2uF"
      supplierPartNumbers={{
  "jlcpcb": [
    "C125847"
  ]
}}
      manufacturerPartNumber="CC0805KKX7R9BB225"
      footprint={<footprint>
        <smtpad portHints={["pin2", "neg"]} pcbX="0.999998mm" pcbY="0mm" width="1.4100048mm" height="1.35001mm" shape="rect" />
<smtpad portHints={["pin1", "pos"]} pcbX="-0.999998mm" pcbY="0mm" width="1.4100048mm" height="1.35001mm" shape="rect" />

<courtyardoutline outline={[{"x":-1.9550003999999035,"y":0.9250050000000556},{"x":1.9550003999999035,"y":0.9250050000000556},{"x":1.9550003999999035,"y":-0.9250050000000556},{"x":-1.9550003999999035,"y":-0.9250050000000556},{"x":-1.9550003999999035,"y":0.9250050000000556}]} />
      </footprint>}
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C125847.obj?uuid=b87ab0c5465a48b3a1c9a6dac8d30bc5",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C125847.step?uuid=b87ab0c5465a48b3a1c9a6dac8d30bc5",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: 0, y: -0.000012700000070253736, z: -0.65 },
      }}
      {...restProps}
    />
  )
}
