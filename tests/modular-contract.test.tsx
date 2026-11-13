import { expect, test } from "bun:test"
import { interfacePins, isPart, ownerOf, referenceElements } from "../designs/boards"

const parts = () => referenceElements().filter(isPart)
const owner = (name: string) => ownerOf(parts().find(e => e.props.name === name)!)

test("disconnecting the controller leaves the entire hardware kill circuit on the power board", () => {
  for (const name of ["Q_MCU_KILL", "Q_MCU_RELEASE", "R_KILL_DRIVE", "R_KILL_RESET", "R_RELEASE_OFF"])
    expect({ name, owner: owner(name) }).toEqual({ name, owner: "power" })
  expect(owner("U_MCU")).toBe("control")
})

test("voltage dividers and converter bias stay local; high-current rails do not enter the signal harness", () => {
  for (const name of ["R_V_ADC_TOP", "R_V_ADC_BOTTOM", "C_V_ADC", "R_PD_ADC_TOP", "R_PD_ADC_BOTTOM", "C_PD_ADC",
    "R_I_ADC", "C_I_ADC", "R_PD_FAULT_SENSE", "U_AUX", "U_LOGIC_MUX"])
    expect({ name, owner: owner(name) }).toEqual({ name, owner: "power" })
  expect(owner("R_DRIVER_FAULT")).toBe("control")
  for (const net of ["TEC_POS", "VBUS_RAW", "VBUS_QUALIFIED", "DRIVER_ENABLE", "DRIVER_SW1", "DRIVER_SW2"])
    expect([...interfacePins]).not.toContain(net)
})

test("every named net shared by the two boards has a harness pin", () => {
  const nets = { power: new Set<string>(), control: new Set<string>() }
  for (const part of parts()) {
    const side = ownerOf(part)
    for (const value of Object.values(part.props.connections ?? {}))
      if (typeof value === "string" && value.startsWith("net.")) nets[side].add(value.slice(4))
  }
  const shared = [...nets.power].filter(net => nets.control.has(net)).sort()
  expect(shared).toEqual([...new Set(interfacePins)].sort())
})

test("partitioning neither loses nor duplicates reference components", () => {
  const names = parts().map(p => p.props.name)
  const power = parts().filter(p => ownerOf(p) === "power").map(p => p.props.name)
  const control = parts().filter(p => ownerOf(p) === "control").map(p => p.props.name)
  expect([...power, ...control].sort()).toEqual(names.sort())
  expect(power.filter(name => control.includes(name))).toEqual([])
})
