// Supplier footprint: tsci import C106218 --jlcpcb --use-exact-footprint; see docs/component-imports.json.
import type { CapacitorProps } from "@tscircuit/props"

export const CC0603KRX7R9BB472 = (props: Omit<CapacitorProps, "capacitance">) => {
  const { name = "C1", ...restProps } = props

  return (
    <capacitor
      name={name}
      capacitance="4.7nF"
      supplierPartNumbers={{
  "jlcpcb": [
    "C106218"
  ]
}}
      manufacturerPartNumber="CC0603KRX7R9BB472"
      footprint={<footprint>
        <smtpad portHints={["pin2", "neg"]} pcbX="0.700024mm" pcbY="0mm" width="0.7999984mm" height="0.8999982mm" shape="rect" />
<smtpad portHints={["pin1", "pos"]} pcbX="-0.700024mm" pcbY="0mm" width="0.7999984mm" height="0.8999982mm" shape="rect" />

<courtyardoutline outline={[{"x":-1.3500232000000096,"y":0.6999991000000136},{"x":1.350023199999896,"y":0.6999991000000136},{"x":1.350023199999896,"y":-0.6999991000000136},{"x":-1.3500232000000096,"y":-0.6999991000000136},{"x":-1.3500232000000096,"y":0.6999991000000136}]} />
      </footprint>}
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C106218.obj?uuid=ac9b32e974bc448eab36b1293f859dcb",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C106218.step?uuid=ac9b32e974bc448eab36b1293f859dcb",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: 0, y: 0, z: -0.4 },
      }}
      {...restProps}
    />
  )
}
