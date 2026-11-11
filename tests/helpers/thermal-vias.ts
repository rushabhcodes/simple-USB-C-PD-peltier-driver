import type { AnyCircuitElement } from "circuit-json"
import { sourceConnectivity } from "./physical-copper"

// These exact exposed-pad arrays require the filled, planarized and capped
// process in docs/pcb-fabrication.md. No other same-net via-in-pad is exempt.
export const THERMAL_ARRAYS = [
  { component: "U_MCU", pin: 57, x: [-0.8, 0, 0.8], y: [-15.8, -15, -14.2] },
  { component: "U_PD", pin: 25, x: [-24.7, -23.3], y: [17.8, 19.2] },
] as const

export function inspectThermalVias(json: AnyCircuitElement[]) {
  const ground = json.filter(e => e.type === "source_net").find(e => e.name === "GND")
  const source = sourceConnectivity(json)
  const vias = json.filter(e => e.type === "pcb_via")
  const allowedErrorIds = new Set<string>(), missing: string[] = [], invalid: string[] = []
  const close = (a: number, b: number) => Math.abs(a - b) <= 1e-6
  for (const array of THERMAL_ARRAYS) {
    const key = `${array.component}.${array.pin}`
    const sourcePort = source.ports.get(key)
    const port = json.filter(e => e.type === "pcb_port").find(e => e.source_port_id === sourcePort)
    const pad = port && json.filter(e => e.type === "pcb_smtpad").find(e => e.pcb_port_id === port.pcb_port_id)
    const isGround = source.groups.some(g => g.nets.includes("GND") && g.ports.includes(key))
    for (const x of array.x) for (const y of array.y) {
      const label = `${key}@${x},${y}`
      const matches = vias.filter(via => close(via.x, x) && close(via.y, y))
      if (matches.length !== 1) { missing.push(label); continue }
      const via = matches[0]!
      if (!ground || !isGround || !pad || pad.shape !== "rect" ||
          via.source_net_id !== ground.source_net_id ||
          !close(via.hole_diameter, 0.3) || !close(via.outer_diameter, 0.6) ||
          [...via.layers].sort().join() !== "bottom,inner1,inner2,top" ||
          Math.abs(via.x - pad.x) + via.outer_diameter / 2 > pad.width / 2 + 1e-6 ||
          Math.abs(via.y - pad.y) + via.outer_diameter / 2 > pad.height / 2 + 1e-6) {
        invalid.push(label)
        continue
      }
      allowedErrorIds.add(`via_in_pad_${via.pcb_via_id}_${pad.pcb_smtpad_id}`)
    }
  }
  return { allowedErrorIds, missing, invalid }
}
