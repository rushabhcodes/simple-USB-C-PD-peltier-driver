import type { ReactElement } from "react"
import { Circuit } from "tscircuit"
import { GeneralPdDriverBoard } from "../src/board/general-pd"

// Full four-layer pours and native DRC can take several minutes on a busy host.
export const FIXTURE_RENDER_TIMEOUT = 300_000

// Native manually placed vias have PCB component proxies but no purchased or
// schematic source component. Reject other missing owners rather than hiding them.
export function placedComponents(circuit: InstanceType<typeof Circuit>) {
  const sources = new Set(circuit.db.source_component.list().map(part => part.source_component_id))
  const ports = new Map(circuit.db.pcb_port.list().map(port => [port.pcb_port_id, port]))
  const sourcePorts = new Map(circuit.db.source_port.list().map(port => [port.source_port_id, port]))
  const viaOwners = new Set(circuit.db.pcb_via.list().flatMap(via => via.pcb_port_ids ?? [])
    .map(id => sourcePorts.get(ports.get(id)?.source_port_id ?? "")?.source_component_id)
    .filter((id): id is string => !!id))
  return circuit.db.pcb_component.list().filter(part => {
    if (sources.has(part.source_component_id)) return true
    if (!viaOwners.has(part.source_component_id)) throw new Error(`PCB component has no source or via owner: ${part.pcb_component_id}`)
    return false
  })
}

// Tests use the committed supplier footprints/pin maps and run local DRC.
// Live catalog enrichment belongs to the build and stock audit, not fixtures.
export async function renderFixture(element: ReactElement) {
  const circuit = new Circuit({ platform: { schematicDisabled: true, partsEngineDisabled: true } })
  circuit.add(element)
  await circuit.renderUntilSettled()
  return circuit
}

let board: ReturnType<typeof renderFixture> | undefined
export const boardFixture = () => board ??= renderFixture(<GeneralPdDriverBoard schematicDisabled />)
