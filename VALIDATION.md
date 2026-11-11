# Validation — 2026-11-11, version 0.1.3

The revised board builds with **zero circuit errors and zero circuit warnings**. The mating-contact netlist matches the reference after mapping the USB4110's paired power and ground tails.

| Check | Result |
| --- | --- |
| Supplier imports | All 55 unique BOM SKUs imported using the tscircuit CLI; 39 base wrappers integrated |
| TypeScript | `bun run typecheck` passes |
| Dependency installation | Locked dependencies install successfully |
| Netlist | Zero errors, zero warnings |
| PCB build | The connector revision passed the online build. The final fabrication export uses the pinned local footprints. |
| Compiled diagnostics | Zero errors, zero warnings in `dist/index/circuit.json` |
| Schematic placement | No reported issues across all nine sheets |
| PCB placement | Analyzer exits 0 with no issues; native DRC has zero errors and zero warnings |
| Copper shorts | Default Gerber-based `tsci check shorts dist/index/circuit.json`: no shorts detected |
| Routing difficulty | Completed; dense MCU regions are recorded in `checks/routing-difficulty.txt` |
| Source associations | Source IDs, named nets, constraints and all saved route associations match the complete online build |
| Full suite | 59 passed and 0 failed across eight files |
| Catalog regressions | Five tests pass, covering host-engine precedence, stalled lookups, confirmed zero stock and footprint mismatch reporting |

The tests verify the original electrical net partition, all 422 required physical connections, copper clearances, minimum dimensions, trace constraints, MCU package pins, schematic layout, and the optional accessory assembly. Power-copper checks inspect 3 mm-wide sections of the clipped VIN/SW/VOUT/TEC pours, the 0.6 mm fan-header branch, and the resistance-length budget of the new 0.6 mm inner-layer logic link. The circuit contains 134 purchased placements, 16 debug pads, 364 saved traces, and nine schematic sheets on a 72.5 × 59 mm four-layer board.

## Diagnostic handling and limits

The 0.1.0 release had 209 warnings: 35 unnamed traces, 34 logical-width warnings, five long odd-angle segments, 134 availability warnings, and one supplier-footprint mismatch. See [docs/diagnostic-fixes.md](docs/diagnostic-fixes.md) for their source fixes and the four additional resistor-orientation corrections.

The catalog engine is bound directly to the board. The JSON cloud build command starts a fresh CLI process after installing dependencies; no runtime config module imports an uninstalled package during bootstrap. Availability lookups have a two-second deadline and return unknown on missing data, transport failure or timeout, before core's ten-second timeout can misclassify them as unavailable. The earlier cloud-binding rebuild preserved every physical PCB record and the electrical netlist of that revision. See `checks/cloud-binding-verification.json` and `checks/stock-availability.txt`.

Supplier checks remain enabled. Unknown catalog stock is left unverified; confirmed zero stock still generates a warning. Tests exercise these cases through core and verify that a stalled lookup aborts and remains unknown. L_FAN is compared against canonical Sunlord recommended land-pattern geometry instead of the differing supplier CAD; a deliberately incorrect footprint still warns in the regression test. No blanket diagnostic filter is applied to the published circuit.

The reference's exposed-pad via process, four-layer stackup, copper weights, local power-copper necks, USB geometry and bench qualification requirements remain applicable. A clean diagnostic list does not establish thermal performance or stock availability. See [docs/pcb-fabrication.md](docs/pcb-fabrication.md). No hardware measurements were performed.

## JLCPCB fabrication review

Both USB-C ports use GCT USB4110-GF-A surface-mount receptacles. An independent Gerber and Excellon parser matched the four copper layers to the board within 0.1 µm and matched each drill to its modeled center and diameter. The files contain 370 Ø0.30 mm vias, 12 plated terminal or header holes, and five nonplated locators. The minimum locator-to-copper clearance is 0.225 mm, the minimum plated component ring is 0.300 mm and the minimum drill web is 0.250 mm. The masks retain separate openings with at least 0.200 mm between openings. The archive includes all 13 epoxy-fill and copper-cap markers. [Fabrication settings and export instructions](docs/pcb-fabrication.md#jlcpcb-cam-review)

## Bench assembly

`bun run build:assembly` exports actual meshes for all 134 fitted PCB components and 15 external parts. Seven assembly tests pass, covering board geometry and connectivity, wiring, component dimensions and the closed fan-duct mesh. The offline viewer loads and switches between the installed and exploded positions in Chromium. Physical fit and thermal testing are pending for the first bench assembly. [Assembly guide](docs/assembly.md)

## Review artifacts

- [PCB SVG](docs/previews/pcb.svg) and [PNG](docs/previews/pcb.png): committed routed PCB previews.
- [All schematic sheets](docs/previews/all-sheets.svg) and [individual PNGs](docs/previews/schematics).
- `dist/index/circuit.json`: compiled circuit generated by the build.
- `dist/schematics/`: generated sheet SVG/PNG previews.
- [docs/component-imports.json](docs/component-imports.json): CLI import commands, hashes and footprint corrections.
- `checks/`: current build, netlist, placement, schematic, short, density and test logs.
