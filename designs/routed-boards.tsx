import { DraftBoard, type DraftBoardId } from "./boards"
import { RoutedCopper, type RoutedCopperData } from "../src/board/routed-copper"
import lite from "./copper/lite.json"
import power from "./copper/modular-power.json"
import control from "./copper/modular-control.json"

const copper: Record<DraftBoardId, RoutedCopperData> = {
  lite: lite as RoutedCopperData,
  "modular-power": power as RoutedCopperData,
  "modular-control": control as RoutedCopperData,
}

/** Stored copper is bound to this exact variant's source graph. */
export function RoutedProductBoard({ id }: { id: DraftBoardId }) {
  const data = copper[id]
  if (!data) throw new Error(`No validated copper is available for ${id}`)
  const source = DraftBoard({ id })
  return <board {...source.props} title={`Peltier ${id} — ROUTED REVIEW CANDIDATE`}
    routingDisabled={false} routeRemaining={false}>
    {source.props.children}
    <RoutedCopper {...data} />
  </board>
}

export const productCopper = copper
