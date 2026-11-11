import type { CapacitorProps } from "@tscircuit/props"
import { CL05B104KB5NNNC } from "../../imports/CL05B104KB5NNNC"

// Samsung MLCC Product Manual §5-4: 1005 reflow lands, gap 0.40 mm,
// length 0.45 mm and width 0.55 mm for the ±0.05 mm body tolerance.
// https://media.digikey.com/pdf/Data%20Sheets/Samsung%20PDFs/CL05B104KB5NNNC_Spec.pdf
const footprint0402 = (height: number) => <footprint>
  <smtpad portHints={["pin1", "pos"]} pcbX={-0.425} pcbY={0} width={0.45} height={height} shape="rect" solderMaskMargin={0.05} solderPasteMargin={0} />
  <smtpad portHints={["pin2", "neg"]} pcbX={0.425} pcbY={0} width={0.45} height={height} shape="rect" solderMaskMargin={0.05} solderPasteMargin={0} />
  <courtyardoutline outline={[{x:-0.75,y:-0.4},{x:0.75,y:-0.4},{x:0.75,y:0.4},{x:-0.75,y:0.4},{x:-0.75,y:-0.4}]} />
</footprint>

type Props = Omit<CapacitorProps, "capacitance">

// https://product.samsungsem.com/mlcc/CL05B104KB5NNN.do
export const Capacitor100nF0402 = (props: Props) => <CL05B104KB5NNNC
  maxVoltageRating="50V" manufacturerPartNumber="CL05B104KB5NNNC"
  supplierPartNumbers={{ jlcpcb: ["C960916"] }} footprint={footprint0402(0.55)} {...props} />
