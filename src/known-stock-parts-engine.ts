import type { PartsEngine } from "@tscircuit/props"

/** Unknown catalog stock is not evidence of an unavailable part. */
export function withKnownStockAvailability(engine: PartsEngine): PartsEngine {
  return {
    findPart: engine.findPart.bind(engine),
    fetchPartCircuitJson: engine.fetchPartCircuitJson?.bind(engine),
    fetchPartAvailability: engine.fetchPartAvailability && (async request => {
      const result = await engine.fetchPartAvailability!(request)
      // Core 0.0.2145 interprets { stock: null } as unavailable. Its supported
      // undefined result skips only the inconclusive lookup; stock=0 and
      // rejected requests still produce the normal availability warning.
      return result?.stock == null ? undefined : result
    }),
  }
}
