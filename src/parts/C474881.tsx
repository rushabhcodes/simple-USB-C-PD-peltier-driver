// Supplier footprint: tsci import C474881 --jlcpcb --use-exact-footprint; see docs/component-imports.json.
// JLC silk audit: explicit graphic strokes >=0.15 mm; USB/cap outline ends trimmed for >=0.15 mm own-mask clearance. Copper/drills/courtyards preserved.
// Exact EasyEDA/JLCPCB C474881; observed 2026-10-10T03:20:59.408046+00:00. Source: https://jlcsearch.tscircuit.com/api/easyeda_components/C474881
// In-place audit correction: JLC finished-hole adaptation 1.30 mm; KEFA recommends 1.20 +0.10/-0 but its nominal1.00 lead has general +/-0.20 mm tolerance.
// JLC nominal plated-hole minimum is -0.08 mm: 1.30-0.08=1.22 clears max1.20 lead. 5.00 mm pitch and 2.20 mm copper retained (0.45 annular ring).
import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["pin1"],
  pin2: ["pin2"]
} as const

export const KF301_5_0_2P = (props: ChipProps<typeof pinLabels>) => {
  return (
    <connector
      pinLabels={pinLabels}
      supplierPartNumbers={{
  "jlcpcb": [
    "C474881"
  ]
}}
      manufacturerPartNumber="KF301-5.0-2P"
      footprint={<footprint insertionDirection="from_bottom">
        <platedhole  portHints={["pin1"]} pcbX="-2.499995mm" pcbY="0mm" outerDiameter="2.1999956mm" holeDiameter="1.3mm" shape="circle" />
<platedhole  portHints={["pin2"]} pcbX="2.499995mm" pcbY="0mm" outerDiameter="2.1999956mm" holeDiameter="1.3mm" shape="circle" />

<fabricationnotepath route={[{"x":-3.596004999999991,"y":-3.700780000000009},{"x":-3.596004999999991,"y":-1.501139999999964},{"x":-3.5588075612106422,"y":-1.4113374387892463},{"x":-3.4690050000000383,"y":-1.3741399999998976},{"x":-1.5487650000001167,"y":-1.3741399999998976},{"x":-1.4589624387893991,"y":-1.4113374387892463},{"x":-1.4217650000000503,"y":-1.501139999999964},{"x":-1.4217650000000503,"y":-3.700780000000009},{"x":-1.5487650000001167,"y":-3.5737799999999424},{"x":-1.6757650000000694,"y":-3.700780000000009},{"x":-1.6757650000000694,"y":-1.6281399999999167},{"x":-3.342004999999972,"y":-1.6281399999999167},{"x":-3.342004999999972,"y":-3.700780000000009},{"x":-3.4690050000000383,"y":-3.5737799999999424},{"x":-3.596004999999991,"y":-3.700780000000009}]} strokeWidth="0mm" isFilled hasStroke={false} />
<fabricationnotepath route={[{"x":1.4041373999999678,"y":-3.700780000000009},{"x":1.4041373999999678,"y":-1.501190799999904},{"x":1.4413348387893166,"y":-1.4113882387891863},{"x":1.5311373999999205,"y":-1.3741907999999512},{"x":3.4513774000000694,"y":-1.3741907999999512},{"x":3.541179961210787,"y":-1.4113882387891863},{"x":3.578377400000136,"y":-1.501190799999904},{"x":3.578377400000136,"y":-3.700780000000009},{"x":3.4513774000000694,"y":-3.5737799999999424},{"x":3.3243774000001167,"y":-3.700780000000009},{"x":3.3243774000001167,"y":-1.6281907999999703},{"x":1.6581373999999869,"y":-1.6281907999999703},{"x":1.6581373999999869,"y":-3.700780000000009},{"x":1.5311373999999205,"y":-3.5737799999999424},{"x":1.4041373999999678,"y":-3.700780000000009}]} strokeWidth="0mm" isFilled hasStroke={false} />
<courtyardoutline outline={[{"x":-5.249990000000139,"y":4.24999200000002},{"x":5.849988799999892,"y":4.24999200000002},{"x":5.849988799999892,"y":-3.8499927999999954},{"x":-5.249990000000139,"y":-3.8499927999999954},{"x":-5.249990000000139,"y":4.24999200000002}]} />
      </footprint>}
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C474881.obj?uuid=ccfba28652874fb7a69eea8ba34eb61b",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C474881.step?uuid=ccfba28652874fb7a69eea8ba34eb61b",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: 0, y: -0.1499495999999556, z: -4.950006999999999 },
      }}
      {...props}
    />
  )
}
