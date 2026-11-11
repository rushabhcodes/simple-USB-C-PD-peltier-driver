import { Fragment } from "react"
import type { CopperPourProps, ViaProps } from "@tscircuit/props"
import type { PcbTraceRoutePoint } from "circuit-json"

export type CopperPoint = Exclude<PcbTraceRoutePoint, { route_type: "through_pad" }>
export interface CopperRoute {
  net: string; route: CopperPoint[]; sourceTraceId?: string; sourceTraceKey?: string
  /** Binds a local branch to this endpoint; required for single-pin constraints. Omit for supply trunks. */
  sourcePort?: string
}
export interface CopperVia { name?: string; net: string; x: number; y: number; holeDiameter: number; outerDiameter: number; tented?: ViaProps["tented"] }
export interface RoutedCopperData {
  routes: CopperRoute[]
  vias: CopperVia[]
  pours?: CopperPourProps[]
}

// Coordinates are in the board frame. The parent board keeps routeRemaining=false
// and routing enabled so native connectivity/clearance checks validate this copper.
export function RoutedCopper({ routes, vias, pours = [] }: RoutedCopperData) {
  return <>
    {routes.map(({ route, sourceTraceId }, index) => <Fragment key={index}>
      <pcbtrace route={route} {...{ source_trace_id: sourceTraceId }} />
    </Fragment>)}
    {vias.map(({ name, net, x, y, holeDiameter, outerDiameter, tented }, index) =>
      <Fragment key={index}><via name={name} pcbX={x} pcbY={y} fromLayer="top" toLayer="bottom"
        holeDiameter={holeDiameter} outerDiameter={outerDiameter} tented={tented} connectsTo={`net.${net}`} /></Fragment>)}
    {pours.map((pour, index) => <Fragment key={index}><copperpour {...pour} /></Fragment>)}
  </>
}
