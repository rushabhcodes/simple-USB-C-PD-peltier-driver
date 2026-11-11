import { Fragment } from "react"
import type { ChipProps } from "@tscircuit/props"
import type { JscadOperation } from "jscad-planner"

// GCT drawing USB4110. Four power/ground tails each join two mating contacts.
// Keep the existing logical numbers for the contacts that share a tail.
const pinLabels = {
  pin1: ["CC1", "A5"], pin2: ["GND1", "A1", "B12"], pin3: ["VBUS1", "A4", "B9"],
  pin4: ["Dp1", "A6"], pin5: ["Dn1", "A7"], pin6: ["SBU1", "A8"],
  pin7: ["VBUS2", "A9", "B4"], pin8: ["GND2", "A12", "B1"],
  pin11: ["SBU2", "B8"], pin12: ["Dn2", "B7"], pin13: ["Dp2", "B6"], pin14: ["CC2", "B5"],
  pin17: ["S1"],
} as const

const tails = [
  [2, -3.2], [3, -2.4], [11, -1.75], [1, -1.25], [12, -0.75], [4, -0.25],
  [5, 0.25], [13, 0.75], [6, 1.25], [14, 1.75], [7, 2.4], [8, 3.2],
] as const

export const usb4110Face = [0, -4.885, 1.63] as const
const shellTabs = [-5.11, 5.11].flatMap(x => [-2.04, 1.89].map(y => ({ x, y })))
const locatorX = [-2.89, 2.89]
const bodyDepth = 7.35
const bodyY = usb4110Face[1] + bodyDepth / 2
const bodyZ = usb4110Face[2]

const cuboid = (size: [number, number, number], vector: [number, number, number]): JscadOperation =>
  ({ type: "translate", vector, shape: { type: "cuboid", size } })

function shellProfile(width: number, height: number, depth: number, y: number): JscadOperation {
  const halfStraight = (width - height) / 2
  return { type: "union", shapes: [
    cuboid([2 * halfStraight, depth, height], [0, y, bodyZ]),
    ...[-halfStraight, halfStraight].map(x => ({
      type: "translate" as const, vector: [x, y, bodyZ] as [number, number, number],
      shape: { type: "rotateX" as const, angle: Math.PI / 2,
        shape: { type: "cylinder" as const, radius: height / 2, height: depth, resolution: 32 } },
    })),
  ] }
}

// Drawing-derived mating envelope, with the shell cavity and insulating tongue.
const model: JscadOperation = { type: "union", shapes: [
  { type: "colorize", color: [0.66, 0.68, 0.71], shape: { type: "subtract", shapes: [
    shellProfile(8.94, 3.26, bodyDepth, bodyY),
    shellProfile(8.34, 2.56, 5.78, usb4110Face[1] + 2.88),
  ] } },
  { type: "colorize", color: [0.09, 0.09, 0.10], shape: cuboid([6.4, 4.4, 0.63], [0, usb4110Face[1] + 3.5, bodyZ]) },
] }

export function USB4110_GF_A(props: ChipProps<typeof pinLabels>) {
  return <connector standard="usb_c" pinLabels={pinLabels}
    manufacturerPartNumber="USB4110-GF-A" supplierPartNumbers={{ jlcpcb: ["C5143397"] }}
    pinAttributes={{ pin2: { requiresGround: true }, pin8: { requiresGround: true }, pin17: { requiresGround: true },
      pin3: { isPassive: true }, pin7: { isPassive: true } }}
    footprint={<footprint insertionDirection="from_bottom">
      {tails.map(([pin, x]) => {
        const wide = Math.abs(x) > 2
        // Retract the peg-side edge of each wide tail by 0.05 mm.
        // This leaves at least 0.225 mm from the nonplated locator to copper.
        return <Fragment key={pin}><smtpad portHints={[`pin${pin}`]} pcbX={x} pcbY={wide ? 2.49 : 2.465}
          width={wide ? 0.6 : 0.3} height={wide ? 1.1 : 1.15} shape="rect" /></Fragment>
      })}
      {shellTabs.map(({ x, y }) => <Fragment key={`${x},${y}`}><smtpad portHints={["pin17"]}
        pcbX={x} pcbY={y} width={2.18} height={2} shape="rect" /></Fragment>)}
      {locatorX.map(x => <Fragment key={x}><hole pcbX={x} pcbY={1.39} diameter={0.65} /></Fragment>)}
      <courtyardoutline outline={[{ x: -6.44, y: 3.29 }, { x: 6.44, y: 3.29 },
        { x: 6.44, y: -5.14 }, { x: -6.44, y: -5.14 }, { x: -6.44, y: 3.29 }]} />
    </footprint>}
    cadModel={{ jscad: model }}
    {...props}
  />
}
