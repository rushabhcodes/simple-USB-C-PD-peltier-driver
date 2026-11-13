import type { AnyCircuitElement } from "circuit-json"
import products from "./products.json"
import { costCeiling } from "./economics"

export const requiredBestParts = ["U_PD", "U_DRIVER", "U_MCU", "U_FLASH", "U_FAN", "J_USB", "J_PROGRAM",
  "J_TEC", "J_FAN", "J_HOT_SENSOR", "J_COLD_SENSOR"] as const

export function bestProduct() {
  const product = products.products.find(p => p.id === "standard")
  if (!product || product.routingStatus !== "existing-routed-design" || product.boards.length !== 1)
    throw new Error("The recommended product must be the reviewed, integrated Standard board")
  return { ...product, currency: products.currency, priceStatus: products.priceStatus,
    planningQuantity: products.planningQuantity,
    maxLandedCogs: costCeiling(product.targetSellPrice, products.targetGrossMargin),
    actualCost: null, hardwareQualified: false, manufacturingReady: false }
}

export function describeBestBoard(json: AnyCircuitElement[]) {
  const boards = json.filter(e => e.type === "pcb_board")
  if (boards.length !== 1) throw new Error("Expected exactly one integrated PCB")
  const board = boards[0]!
  if (board.num_layers !== 4 || board.width !== 72.5 || board.height !== 59 || board.thickness !== 1.6)
    throw new Error("Unexpected Standard board dimensions or stackup")
  const errors = json.filter(e => e.type.endsWith("_error"))
  if (errors.length) throw new Error(`Resolve ${errors.length} circuit errors before packaging`)
  const parts = json.filter(e => e.type === "source_component" && e.ftype !== "simple_test_point")
  if (parts.length !== 134 || new Set(parts.map(p => p.name)).size !== 134)
    throw new Error("Expected 134 distinct purchased placements")
  for (const name of requiredBestParts) if (!parts.some(p => p.name === name)) throw new Error(`Missing feature: ${name}`)
  for (const part of parts) if (!part.manufacturer_part_number?.trim() ||
    !part.supplier_part_numbers?.jlcpcb?.some(s => /^C\d+$/.test(s))) throw new Error(`Unsourced purchased part: ${part.name}`)
  const traces = json.filter(e => e.type === "pcb_trace").length
  const vias = json.filter(e => e.type === "pcb_via").length
  const pours = json.filter(e => e.type === "pcb_copper_pour").length
  if (traces !== 364 || vias !== 370 || pours !== 29) throw new Error("Incomplete or changed reviewed copper; rerun engineering review")
  return { widthMm: board.width, heightMm: board.height, thicknessMm: board.thickness, layers: board.num_layers,
    purchasedPlacements: parts.length,
    uniqueSkus: new Set(parts.flatMap(p => p.supplier_part_numbers?.jlcpcb ?? [])).size,
    traces, vias, pours, errors: [], warnings: json.filter(e => e.type.endsWith("_warning")) }
}
