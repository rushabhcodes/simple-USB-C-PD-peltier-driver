export interface ProductCostQuote {
  // One landed material/fabrication/assembly quote for EACH PCB; no silent zeros.
  boardCosts: Array<number | null>
  harness: number | null
  programmingAndTest: number | null
  scrapAndInboundFreight: number | null
}

export function costCeiling(price: [number, number] | readonly number[], grossMargin: number) {
  if (price.length !== 2 || price.some(p => !Number.isFinite(p) || p <= 0) || price[0]! > price[1]!)
    throw new Error("Supply a positive, ordered, finite selling-price range")
  if (!Number.isFinite(grossMargin) || grossMargin < 0 || grossMargin >= 1)
    throw new Error("Gross margin must be at least zero and less than one")
  return price.map(p => Math.round(p * (1 - grossMargin) * 100) / 100)
}

export function evaluateQuote(price: number, expectedBoardCount: number, grossMargin: number, quote: ProductCostQuote) {
  const ceiling = costCeiling([price, price], grossMargin)[0]!
  if (!Number.isInteger(expectedBoardCount) || expectedBoardCount < 1 || quote.boardCosts.length !== expectedBoardCount)
    throw new Error("A quote is required for every physical PCB")
  const costs = [...quote.boardCosts, quote.harness, quote.programmingAndTest, quote.scrapAndInboundFreight]
  if (costs.some(c => c !== null && (!Number.isFinite(c) || c < 0))) throw new Error("Invalid cost quote")
  if (costs.some(c => c === null)) return { status: "unquoted" as const, landedCost: null, ceiling, targetMet: null }
  const landedCost = (costs as number[]).reduce((a, b) => a + b, 0)
  return { status: "quoted" as const, landedCost, ceiling, targetMet: landedCost <= ceiling }
}
