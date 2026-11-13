import { expect, test } from "bun:test"
import { costCeiling, evaluateQuote } from "../designs/economics"
import products from "../designs/products.json"

test("selling targets are explicitly provisional, currency-labelled and exclude accessories", () => {
  expect(products.products).toHaveLength(3)
  expect(products.priceStatus).toContain("provisional")
  expect(products.currency).toBe("USD")
  expect(products.planningQuantity).toBe(100)
  expect(products.saleScope).toContain("no TEC")
  expect(products.products.find(p => p.id === "modular")!.boards).toHaveLength(2)
})

test("50 percent gross margin means a 50 percent cost ceiling, not a 50 percent markup", () => {
  expect(costCeiling([100, 120], 0.5)).toEqual([50, 60])
  for (const product of products.products)
    expect(costCeiling(product.targetSellPrice, products.targetGrossMargin)).toEqual(product.targetSellPrice.map(p => p / 2))
})

test("unknown parts, PCBA, harness, test and freight costs never become zero or a profitability claim", () => {
  for (const p of products.products) {
    const result = evaluateQuote(p.targetSellPrice[0]!, p.boards.length, products.targetGrossMargin,
      { boardCosts: p.boards.map(() => null), harness: p.boards.length > 1 ? null : 0,
        programmingAndTest: null, scrapAndInboundFreight: null })
    expect(result).toMatchObject({ status: "unquoted", landedCost: null, targetMet: null })
  }
})

test("modular costs include both physical PCBs and the harness", () => {
  expect(() => evaluateQuote(120, 2, 0.5, { boardCosts: [20], harness: 5, programmingAndTest: 4, scrapAndInboundFreight: 6 })).toThrow()
  expect(evaluateQuote(120, 2, 0.5, { boardCosts: [20, 10], harness: 5, programmingAndTest: 4, scrapAndInboundFreight: 6 }))
    .toMatchObject({ landedCost: 45, targetMet: true })
  expect(evaluateQuote(120, 2, 0.5, { boardCosts: [40, 20], harness: 5, programmingAndTest: 4, scrapAndInboundFreight: 6 }))
    .toMatchObject({ landedCost: 75, targetMet: false })
})

test("invalid prices and costs are rejected instead of producing a plausible budget", () => {
  for (const price of [[0, 10], [100, 10], [NaN, 10], [10, Infinity]]) expect(() => costCeiling(price, 0.5)).toThrow()
  for (const margin of [-0.1, 1, NaN]) expect(() => costCeiling([10, 20], margin)).toThrow()
  for (const badCost of [-1, NaN, Infinity])
    expect(() => evaluateQuote(100, 1, 0.5, { boardCosts: [badCost], harness: 0, programmingAndTest: 0, scrapAndInboundFreight: 0 })).toThrow()
})

test("the candidate builder refuses fabrication output", () => {
  const run = Bun.spawnSync([process.execPath, "run", "scripts/build-product-designs.tsx", "--fabrication"], { cwd: process.cwd() })
  expect(run.exitCode).not.toBe(0)
  expect(run.stderr.toString()).toContain("fabrication export is blocked")
})
