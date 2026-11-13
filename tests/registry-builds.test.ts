import { expect, test } from "bun:test"
import config from "../tscircuit.config.json"
import builds from "../assets/assembly/registry-builds.json"
import pkg from "../package.json"
import { existsSync } from "node:fs"

test("the registry exposes all three products and both Modular PCBs", () => {
  expect([...new Set(builds.map(b => b.product))].sort()).toEqual(["lite", "modular", "standard"])
  expect(builds.filter(b => b.product === "modular")).toHaveLength(2)
  expect(config.includeBoardFiles).toEqual(builds.map(b => b.entrypoint))
  expect(new Set(builds.map(b => b.outputDir)).size).toBe(4)
  for (const build of builds) expect(existsSync(build.entrypoint)).toBe(true)
})

test("Standard stays the default and all draft views disclose their routing status", () => {
  const standard = builds.find(b => b.product === "standard")!
  expect(config.mainEntrypoint).toBe(standard.entrypoint)
  expect(config.previewComponentPath).toBe(standard.entrypoint)
  expect(config.siteDefaultComponentPath).toBe(standard.entrypoint)
  for (const build of builds.filter(b => b.routingStatus === "unrouted")) expect(build.label).toContain("UNROUTED")
  expect(config.buildCommand).toBe("bun run build:cloud")
  expect(pkg.scripts["build:preview"]).toContain("--all-images")
  expect(pkg.scripts["build:preview"]).toContain("--glbs")
  expect(pkg.scripts["build:preview"]).not.toContain("--use-cdn-javascript")
})
