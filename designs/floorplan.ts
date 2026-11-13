import type { AnyCircuitElement } from "circuit-json"
import { convertCircuitJsonToPcbSvg } from "circuit-to-svg"
import type { DraftBoardId } from "./boards"

export function floorplanSvg(json: AnyCircuitElement[], id: DraftBoardId) {
  const pcb = convertCircuitJsonToPcbSvg(json, { width: 1200, height: 900 })
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="952" viewBox="0 0 1200 952">
<rect width="1200" height="52" fill="#fff4d6"/>
<text x="24" y="34" font-family="sans-serif" font-size="22" fill="#6b3100">${id.toUpperCase()} — UNROUTED PLACEMENT STUDY — NOT FOR FABRICATION</text>
${pcb.replace("<svg", '<svg y="52"')}
</svg>`
}
