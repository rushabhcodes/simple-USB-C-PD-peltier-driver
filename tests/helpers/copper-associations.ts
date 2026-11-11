import type { AnyCircuitElement } from "circuit-json"
import type { RoutedCopperData } from "../../src/board/routed-copper"
import { copperPortContacts, sourceConnectivity } from "./physical-copper"

/** PCB metadata cannot establish a net: use the original source graph only. */
export function assertCopperAssociations(json: AnyCircuitElement[], data: RoutedCopperData) {
  const source = sourceConnectivity(json)
  const ports = new Map(json.filter(e => e.type === "source_port").map(e => [e.source_port_id, e]))
  const components = new Map(json.filter(e => e.type === "source_component").map(e => [e.source_component_id, e]))
  const nets = json.filter(e => e.type === "source_net")
  const traces = json.filter(e => e.type === "source_trace")
  const originalPorts = new Map([...source.ports].map(([key, id]) => [id, key]))
  const contacts = copperPortContacts(json)
  const portName = (id: string) => {
    const port = ports.get(id)!
    return `${components.get(port.source_component_id!)!.name}.pin${port.pin_number ?? port.name}`
  }
  for (const [i, route] of data.routes.entries()) {
    const trace = traces.find(t => t.source_trace_id === route.sourceTraceId)
    const namedNets = nets.filter(n => n.name === route.net)
    if (!trace || namedNets.length !== 1 || !trace.connected_source_port_ids.length ||
      !trace.connected_source_port_ids.every(id => source.groups.some(group =>
        group.nets.includes(route.net) && group.ports.includes(originalPorts.get(id) ?? "")))) {
      throw new Error(`Route ${i} (${route.net}) has a stale/missing source association`)
    }
    const key = JSON.stringify([
      trace.connected_source_port_ids.map(portName).sort(),
      trace.connected_source_net_ids.map(id => nets.find(net => net.source_net_id === id)?.name).sort(),
      trace.max_length ?? null, trace.max_via_count ?? null,
    ])
    if (key !== route.sourceTraceKey) throw new Error(`Route ${i} (${route.net}) has stale pin/constraint metadata`)
    const endpointPorts = contacts([route.route[0], route.route[route.route.length - 1]].filter(point => !!point)
      .map(point => ({ x: point.x, y: point.y, layers: point.route_type === "wire" ? [point.layer] : [point.from_layer, point.to_layer] })))
    const { sourcePort } = route
    if (sourcePort && !trace.connected_source_port_ids.some(id => portName(id) === sourcePort && endpointPorts.has(id)))
      throw new Error(`Route ${i} (${route.net}) sourcePort ${sourcePort} does not own its endpoint`)
    if (trace.max_length !== undefined || trace.max_via_count !== undefined) {
      if (!trace.connected_source_port_ids.every(id => endpointPorts.has(id)))
        throw new Error(`Route ${i} (${route.net}) borrows a constraint from an unrelated branch`)
    }
  }
}
