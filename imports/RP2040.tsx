// Supplier footprint: tsci import C2040 --jlcpcb --use-exact-footprint; see docs/component-imports.json.
import { Fragment } from "react"
import type { ChipProps } from "@tscircuit/props"

const pinLabels = {
  pin1: ["IOVDD6"],
  pin2: ["GPIO0"],
  pin3: ["GPIO1"],
  pin4: ["GPIO2"],
  pin5: ["GPIO3"],
  pin6: ["GPIO4"],
  pin7: ["GPIO5"],
  pin8: ["GPIO6"],
  pin9: ["GPIO7"],
  pin10: ["IOVDD5"],
  pin11: ["GPIO8"],
  pin12: ["GPIO9"],
  pin13: ["GPIO10"],
  pin14: ["GPIO11"],
  pin15: ["GPIO12"],
  pin16: ["GPIO13"],
  pin17: ["GPIO14"],
  pin18: ["GPIO15"],
  pin19: ["TESTEN"],
  pin20: ["XIN"],
  pin21: ["XOUT"],
  pin22: ["IOVDD4"],
  pin23: ["DVDD2"],
  pin24: ["SWCLK"],
  pin25: ["SWD"],
  pin26: ["RUN"],
  pin27: ["GPIO16"],
  pin28: ["GPIO17"],
  pin29: ["GPIO18"],
  pin30: ["GPIO19"],
  pin31: ["GPIO20"],
  pin32: ["GPIO21"],
  pin33: ["IOVDD3"],
  pin34: ["GPIO22"],
  pin35: ["GPIO23"],
  pin36: ["GPIO24"],
  pin37: ["GPIO25"],
  pin38: ["GPIO26_ADC0"],
  pin39: ["GPIO27_ADC1"],
  pin40: ["GPIO28_ADC2"],
  pin41: ["GPIO29_ADC3"],
  pin42: ["IOVDD2"],
  pin43: ["ADC_AVDD"],
  pin44: ["VREG_IN"],
  pin45: ["VREG_VOUT"],
  pin46: ["USB_DM"],
  pin47: ["USB_DP"],
  pin48: ["USB_VDD"],
  pin49: ["IOVDD1"],
  pin50: ["DVDD1"],
  pin51: ["QSPI_SD3"],
  pin52: ["QSPI_SCLK"],
  pin53: ["QSPI_SD0"],
  pin54: ["QSPI_SD2"],
  pin55: ["QSPI_SD1"],
  pin56: ["QSPI_SS"],
  pin57: ["GND"]
} as const

const pinAttributes = {
  pin1: { requiresPower: true },
  pin10: { requiresPower: true },
  pin22: { requiresPower: true },
  pin23: { requiresPower: true },
  pin33: { requiresPower: true },
  pin42: { requiresPower: true },
  pin43: { requiresPower: true },
  pin44: { requiresPower: true },
  pin48: { requiresPower: true },
  pin49: { requiresPower: true },
  pin50: { requiresPower: true },
  pin19: { requiresGround: true },
  pin57: { requiresGround: true },
} as const

export const RP2040 = (props: ChipProps<typeof pinLabels>) => {
  return (
    <chip
      pinLabels={pinLabels}
      pinAttributes={pinAttributes}
      supplierPartNumbers={{
  "jlcpcb": [
    "C2040"
  ]
}}
      manufacturerPartNumber="RP2040"
      footprint={<footprint>
        <smtpad portHints={["pin57"]} pcbX="-0mm" pcbY="0.000127mm" width="3.0999938mm" height="3.0999938mm" shape="rect" />
        {/* Raspberry Pi's nominal 0.4 mm pitch and 0.20 mm pad width. */}
        {Array.from({ length: 56 }, (_, index) => {
          const pin = 56 - index
          const side = Math.floor(index / 14)
          const along = (2 * (index % 14) - 13) / 5
          const horizontal = side % 2 === 0
          const outward = side < 2 ? 3.425 : -3.425
          const tangential = side === 0 || side === 3 ? along : -along
          return <Fragment key={pin}><smtpad portHints={[`pin${pin}`]}
            pcbX={horizontal ? tangential : outward} pcbY={horizontal ? outward : tangential}
            width={horizontal ? 0.2 : 0.85} height={horizontal ? 0.85 : 0.2} shape="rect" /></Fragment>
        })}

<courtyardoutline outline={[{"x":-4.3780080000000225,"y":4.109021999999982},{"x":4.097592000000077,"y":4.109021999999982},{"x":4.097592000000077,"y":-4.087178000000108},{"x":-4.3780080000000225,"y":-4.087178000000108},{"x":-4.3780080000000225,"y":4.109021999999982}]} />
      </footprint>}
      cadModel={{
        objUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C2040.obj?uuid=76b360a9d4c54384a4e47d7e5af156df",
        stepUrl: "https://modelcdn.tscircuit.com/easyeda_models/assets/C2040.step?uuid=76b360a9d4c54384a4e47d7e5af156df",
        pcbRotationOffset: 0,
        modelOriginPosition: { x: 0.000012699999956566899, y: -0.0001269999999067295, z: -0.02 },
      }}
      {...props}
    />
  )
}
