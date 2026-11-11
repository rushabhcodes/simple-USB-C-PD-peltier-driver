import type { PartsEngine } from "@tscircuit/props"

/** Unknown catalog stock is not evidence of an unavailable part. */
export function withKnownStockAvailability(engine: PartsEngine, { timeoutMs = 2_000 } = {}): PartsEngine {
  return {
    findPart: engine.findPart.bind(engine),
    fetchPartCircuitJson: engine.fetchPartCircuitJson?.bind(engine),
    fetchPartAvailability: engine.fetchPartAvailability && (async request => {
      const controller = new AbortController()
      let timer: ReturnType<typeof setTimeout> | undefined
      const unknownAtDeadline = new Promise<undefined>(resolve => {
        timer = setTimeout(() => { controller.abort(); resolve(undefined) }, timeoutMs)
      })
      const lookup = Promise.resolve().then(() => engine.fetchPartAvailability!({
        ...request,
        signal: request.signal ? AbortSignal.any([request.signal, controller.signal]) : controller.signal,
      })).then(result => result?.stock == null ? undefined : result).catch(() => undefined)
      try {
        // Return unknown before core's 10 s deadline, which otherwise turns a
        // failed lookup into an unavailable-part warning during CPU-heavy DRC.
        // A confirmed stock=0 remains reportable. No stock value is fabricated.
        return await Promise.race([lookup, unknownAtDeadline])
      } finally {
        clearTimeout(timer)
      }
    }),
  }
}
