import { beforeAll, expect, test } from "bun:test"
import { Circuit } from "tscircuit"
import { GeneralPdDriverBoard } from "../src/board/general-pd"
import { DraftBoard, interfacePins } from "../designs/boards"
import { connectivity, placementIssues, straightCable } from "../designs/audit"
import type { AnyCircuitElement } from "circuit-json"

const drafts = new Map<string, AnyCircuitElement[]>()
let reference: AnyCircuitElement[], names: Set<string>
beforeAll(async () => {
  const baseline = new Circuit({ platform: { pcbDisabled: true, schematicDisabled: true, partsEngineDisabled: true } })
  baseline.add(<GeneralPdDriverBoard />)
  await baseline.renderUntilSettled()
  reference = baseline.getCircuitJson()
  names = new Set(baseline.db.source_component.list().map(p => p.name))
  for (const id of ["lite", "modular-power", "modular-control"] as const) {
    const circuit = new Circuit({ platform: { schematicDisabled: true, partsEngineDisabled: true } })
    circuit.add(<DraftBoard id={id} />)
    await circuit.renderUntilSettled()
    drafts.set(id, circuit.getCircuitJson())
  }
}, 240_000)

test("every draft compiles without circuit errors, stays within its own board, and has no component overlap", () => {
  for (const [id, json] of drafts) {
    expect({ id, errors: json.filter(e => e.type.endsWith("_error")) }).toEqual({ id, errors: [] })
    expect({ id, placement: placementIssues(json) }).toEqual({ id, placement: [] })
    expect(json.filter(e => ["pcb_trace", "pcb_via", "pcb_copper_pour"].includes(e.type))).toEqual([])
  }
})

test("compiled modular boards, connected only through the cable, reproduce every original pin and net", () => {
  const actual = connectivity([{ id: "power", json: drafts.get("modular-power")! },
    { id: "control", json: drafts.get("modular-control")! }], straightCable, names)
  const expected = connectivity([{ id: "standard", json: reference }], [], names)
  expect(expected.ignoredViaPorts).toBe(740)
  expect(actual.pinCount).toBe(expected.pinCount)
  expect(actual.signature).toBe(expected.signature)
})

test("an open permission cable is disconnected in the graph; equal net names cannot hide it", () => {
  const boards = [{ id: "power", json: drafts.get("modular-power")! }, { id: "control", json: drafts.get("modular-control")! }]
  expect(connectivity(boards, straightCable).connected("power:R_KILL_DRIVE.pin1", "control:U_MCU.pin4")).toBe(true)
  expect(connectivity(boards, straightCable.filter((_, i) => i !== 4))
    .connected("power:R_KILL_DRIVE.pin1", "control:U_MCU.pin4")).toBe(false)
  const power = connectivity([boards[0]!])
  expect(power.netsAt("power:Q_MCU_KILL.pin3")).toEqual(["DRIVER_ENABLE"])
  expect(power.netsAt("power:R_KILL_RESET.pin1")).toEqual(["LOGIC_5V"])
  expect(power.netsAt("power:R_RELEASE_OFF.pin2")).toEqual(["GND"])
})

test("a swapped 5 V harness pair is detected instead of being joined by net labels", () => {
  const cable = straightCable.map(([a, b]) => [a, b] as [string, string])
  ;[cable[1]![1], cable[2]![1]] = [cable[2]![1], cable[1]![1]]
  const actual = connectivity([{ id: "power", json: drafts.get("modular-power")! },
    { id: "control", json: drafts.get("modular-control")! }], cable, names)
  expect(actual.signature).not.toBe(connectivity([{ id: "standard", json: reference }], [], names).signature)
})

test("both compiled headers have all 16 physical pins on the exact documented nets", () => {
  for (const [id, board] of [["power", "modular-power"], ["control", "modular-control"]] as const) {
    const json = drafts.get(board)!
    const header = json.find(e => e.type === "source_component" && e.name === "J_LINK")!
    if (header.type !== "source_component") throw new Error("Missing header")
    const pins = json.filter(e => e.type === "source_port" && e.source_component_id === header.source_component_id)
    expect(pins).toHaveLength(16)
    const graph = connectivity([{ id, json }])
    interfacePins.forEach((net, i) => expect(graph.netsAt(`${id}:J_LINK.pin${i + 1}`)).toEqual([net]))
  }
})

test("power and controller modules are individually smaller than the original board", () => {
  for (const id of ["modular-power", "modular-control"]) {
    const board = drafts.get(id)!.find(e => e.type === "pcb_board")!
    if (board.type !== "pcb_board") throw new Error("Missing board")
    expect(board.width! * board.height!).toBeLessThan(72.5 * 59)
  }
})

test("unexpected missing source owners still fail instead of being mistaken for native vias", () => {
  let changed = false
  const broken = drafts.get("modular-power")!.map(e => {
    if (!changed && e.type === "source_port") {
      changed = true
      return { ...e, source_component_id: "missing_purchased_component" }
    }
    return e
  })
  expect(changed).toBe(true)
  expect(() => connectivity([{ id: "power", json: broken }])).toThrow("Missing owner")
})

test("provisional headers remain purchased parts with explicit unresolved sourcing warnings", () => {
  for (const [id, json] of drafts) {
    const warnings = json.filter(e => e.type.endsWith("_warning"))
    if (id === "lite") { expect(warnings).toEqual([]); continue }
    const header = json.find(e => e.type === "source_component" && e.name === "J_LINK")!
    if (header.type !== "source_component") throw new Error("Missing header")
    expect(warnings).toHaveLength(1)
    expect(warnings[0]).toMatchObject({ type: "source_missing_manufacturer_part_number_warning", source_component_id: header.source_component_id })
    const pcb = json.find(e => e.type === "pcb_component" && e.source_component_id === header.source_component_id)!
    if (pcb.type !== "pcb_component") throw new Error("Missing header footprint")
    expect(pcb.do_not_place).not.toBe(true)
  }
})
