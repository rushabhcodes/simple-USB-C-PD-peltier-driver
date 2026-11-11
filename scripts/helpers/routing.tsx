import { Circuit } from "@tscircuit/core"
import { cloneElement, isValidElement, type ReactElement, type ReactNode } from "react"
import type { AnyCircuitElement } from "circuit-json"
import type { RoutedCopperData } from "../../src/board/routed-copper"
import { assertCopperAssociations } from "../../tests/helpers/copper-associations"
import { copperPortContacts, sourceConnectivity } from "../../tests/helpers/physical-copper"

/** Keep logical traces and every via; omit only the slow native copper primitives. */
function withoutPhysicalCopper(node: ReactNode): ReactNode {
  if (Array.isArray(node)) return node.map(withoutPhysicalCopper)
  if (!isValidElement<Record<string, any>>(node)) return node
  if (typeof node.type === "function") return withoutPhysicalCopper((node.type as Function)(node.props))
  if (node.type === "pcbtrace" || node.type === "copperpour") return null
  const props = { ...node.props }
  for (const [key, value] of Object.entries(props)) {
    if (key === "children" || isValidElement(value) || (Array.isArray(value) && value.some(isValidElement)))
      props[key] = withoutPhysicalCopper(value)
  }
  return cloneElement(node, props)
}

export async function renderSourceIds(board: ReactElement) {
  const circuit = new Circuit({ platform: { schematicDisabled: true, partsEngineDisabled: true } })
  circuit.add(cloneElement(withoutPhysicalCopper(board) as ReactElement<any>, {
    routingDisabled: true, routeRemaining: false, schematicDisabled: true, partsEngineDisabled: true,
  }))
  await circuit.renderUntilSettled()
  return circuit.getCircuitJson()
}

export function assertStableSourceIds(fast: AnyCircuitElement[], full: AnyCircuitElement[]) {
  const source = (items: AnyCircuitElement[]) => {
    const nets = new Map(items.filter(item => item.type === "source_net").map(net => [net.source_net_id, net.name]))
    return items.filter(item => item.type === "source_trace" || item.type === "source_port").map(item =>
      item.type === "source_trace" ? { ...item, connected_source_net_ids: item.connected_source_net_ids.map(id => nets.get(id)) } : item)
  }
  // Pours affect implicit net numbering. Trace/port IDs stay exact; net names are stable.
  if (JSON.stringify(source(fast)) !== JSON.stringify(source(full)))
    throw new Error("Source trace IDs, pins, named nets, or constraints changed between renders")
}

export function enrichCopper(circuit: AnyCircuitElement[], data: RoutedCopperData): RoutedCopperData {
  const source = sourceConnectivity(circuit)
  const ports = new Map(circuit.filter(item => item.type === "source_port").map(port => [port.source_port_id, port]))
  const components = new Map(circuit.filter(item => item.type === "source_component").map(component => [component.source_component_id, component]))
  const nets = circuit.filter(item => item.type === "source_net")
  const originalPorts = new Map([...source.ports].map(([key, id]) => [id, key]))
  const traces = circuit.filter(item => item.type === "source_trace").filter(item => item.connected_source_port_ids.length &&
    item.connected_source_port_ids.every(id => originalPorts.has(id)))
  const contacts = copperPortContacts(circuit)
  const routeEndpoints = data.routes.map(({ route }) => contacts([route[0], route[route.length - 1]].filter(point => !!point)
    .map(point => ({ x: point.x, y: point.y, layers: point.route_type === "wire" ? [point.layer] : [point.from_layer, point.to_layer] }))))
  const routedPorts = new Set(routeEndpoints.flatMap(endpoints => [...endpoints]))
  const portName = (id: string) => {
    const port = ports.get(id)!
    return `${components.get(port.source_component_id!)!.name}.pin${port.pin_number ?? port.name}`
  }
  const constrained = (trace: typeof traces[number]) => trace.max_length !== undefined || trace.max_via_count !== undefined
  const routes = data.routes.map((route, index) => {
    const savedKey = route.sourceTraceKey ? JSON.parse(route.sourceTraceKey) : undefined
    if (!route.sourcePort && savedKey?.[0]?.length === 1 && (savedKey[2] != null || savedKey[3] != null))
      throw new Error(`Route ${index} (${route.net}) needs sourcePort to retain its saved single-pin constraint`)
    const endpoints = routeEndpoints[index]!
    if (route.sourcePort && ![...endpoints].some(id => portName(id) === route.sourcePort))
      throw new Error(`Route ${index} (${route.net}) sourcePort ${route.sourcePort} is not a physical endpoint`)
    const matches = traces.filter(trace => trace.connected_source_port_ids.every(id => source.groups.some(group =>
      group.nets.includes(route.net) && group.ports.includes(originalPorts.get(id)!))) &&
      (!route.sourcePort || trace.connected_source_port_ids.some(id => portName(id) === route.sourcePort)))
      .map(trace => ({ trace, endpoints: trace.connected_source_port_ids.filter(id => endpoints.has(id)).length }))
    // A global trunk can touch a constrained capacitor pad. Only an explicit
    // owner distinguishes its local one-pin branch; length must not decide this.
    const constraints = matches.filter(({ trace, endpoints }) => constrained(trace) &&
      endpoints === trace.connected_source_port_ids.length && (route.sourcePort || endpoints > 1))
    if (constraints.length > 1)
      throw new Error(`Route ${index} (${route.net}) has ambiguous constrained source traces`)
    if (route.sourcePort && matches.some(({ trace }) => constrained(trace)) && !constraints.length)
      throw new Error(`Route ${index} (${route.net}) does not contact every endpoint of its sourcePort constraint`)
    // A pour-only pad is physically connected but cannot represent a trace
    // endpoint in native contiguity checks. Prefer a routed pin on the same net.
    const represented = (trace: typeof traces[number]) => trace.connected_source_port_ids.filter(id => routedPorts.has(id)).length
    const unconstrained = matches.filter(({ trace }) => !constrained(trace)).sort((a, b) => b.endpoints - a.endpoints ||
      represented(b.trace) - represented(a.trace) ||
      (a.trace.display_name ?? a.trace.source_trace_id).localeCompare(b.trace.display_name ?? b.trace.source_trace_id))
    const trace = (constraints[0] ?? unconstrained[0])?.trace
    if (!trace) throw new Error(`Route ${index} (${route.net}) has no matching original source trace; constrained branches require sourcePort`)
    return { ...route, sourceTraceId: trace.source_trace_id, sourceTraceKey: JSON.stringify([
      trace.connected_source_port_ids.map(portName).sort(),
      trace.connected_source_net_ids.map(id => nets.find(net => net.source_net_id === id)?.name).sort(),
      trace.max_length ?? null, trace.max_via_count ?? null,
    ]) }
  })
  const result = { ...data, routes }
  assertCopperAssociations(circuit, result)
  return result
}

export const formatRoutingData = (data: RoutedCopperData) => JSON.stringify(data, null, 2)
  .replace(/\{\n(?:[ \t]+"[^\n]*\n)+[ \t]*\}/g, object => object.replace(/\n\s*/g, " ")) + "\n"
