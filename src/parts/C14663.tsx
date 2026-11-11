// Supplier footprint: tsci import C14663 --jlcpcb --use-exact-footprint; see docs/component-imports.json.
// Paste control: 1:1 stencil apertures for passive pads (default toolchain shrinks to 70% linear).
// Manufacturer drawing audited 2026-10-10, page 11: https://img.pcbx.com/erp/file/part/spec/CC0201CRNPO9BN5R6-Yageo.pdf
// Existing imported lands corrected in place; NSMD +0.05 mm and 1:1 paste; courtyard includes maximum body.
// Exact EasyEDA/JLCPCB C14663; observed 2026-10-10T03:21:00.696553+00:00. Source: https://jlcsearch.tscircuit.com/api/easyeda_components/C14663
import type { CapacitorProps } from "@tscircuit/props"

export const CC0603KRX7R9BB104 = (props: Omit<CapacitorProps, "capacitance">) => {
  const { name = "C1", ...restProps } = props

  return (
    <capacitor
      name={name}
      capacitance="100nF"
      supplierPartNumbers={{
  "jlcpcb": [
    "C14663"
  ]
}}
      manufacturerPartNumber="CC0603KRX7R9BB104"
      footprint={<footprint>
        <smtpad solderPasteMargin={0} portHints={["pin2", "neg"]} pcbX="0.7mm" pcbY="0mm" width="0.8mm" height="0.9mm" shape="rect" solderMaskMargin="0.05mm" />
<smtpad solderPasteMargin={0} portHints={["pin1", "pos"]} pcbX="-0.7mm" pcbY="0mm" width="0.8mm" height="0.9mm" shape="rect" solderMaskMargin="0.05mm" />

<courtyardoutline outline={[{"x":-1.35,"y":0.75},{"x":1.35,"y":0.75},{"x":1.35,"y":-0.75},{"x":-1.35,"y":-0.75},{"x":-1.35,"y":0.75}]} />
      </footprint>}
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C14663.obj?uuid=ac9b32e974bc448eab36b1293f859dcb",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C14663.step?uuid=ac9b32e974bc448eab36b1293f859dcb",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: 0, y: 0, z: -0.4 },
      }}
      {...restProps}
    />
  )
}
