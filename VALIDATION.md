# Validation — 2026-11-11

The generated board is a development adaptation of the supplied reference. It retains the reference's copper geometry and electrical net partition. It is not a manufacturing release.

| Check | Result |
| --- | --- |
| Supplier imports | All 55 unique BOM SKUs successfully imported using the tscircuit CLI; 39 base wrappers integrated |
| TypeScript | `bun run typecheck` passes |
| Dependency installation | Locked dependencies install successfully |
| Netlist | Zero errors, zero warnings |
| Build | `tsci build index.circuit.tsx --disable-parts-engine --pcb-png --schematic-png --svgs --profile` passes |
| Native circuit errors | Zero |
| Schematic placement | No reported issues across all nine sheets |
| PCB placement DRC | Zero errors, zero warnings; no overlaps or off-board components |
| PCB placement analyzer | Four orientation advisories; command exits 1 |
| Copper shorts | Default Gerber-based `tsci check shorts dist/index/circuit.json`: no shorts detected |
| Routing difficulty | Analysis completed; dense regions around MCU bypass components are recorded in `checks/routing-difficulty.txt` |
| Retained tests | 50 passed, 0 failed; 7,163 assertions across seven files |

The tests verify the original electrical net partition, all required physical connections, copper clearances, minimum dimensions, trace constraints, MCU package pins, and the optional accessory assembly. The final circuit has 134 purchased placements, 16 copper debug pads, 359 PCB traces, and nine schematic sheets on a 72.5 × 59 mm four-layer board.

## Remaining diagnostics

The placement analyzer suggests rotating `R_FAULT_OFF`, `R_RUN`, `R_DRIVER_FAULT`, and `R_V_ADC_TOP` by 180°. Its orientation estimate compares straight-line distances to connected pads; it does not evaluate the saved routed paths. The inherited resistor orientation and copper are retained. These advisories remain visible in `checks/placement.txt`; the command does not pass overall despite clean native placement DRC.

The compiled circuit also retains 35 unnamed-trace warnings, 34 requested-width versus routed-width warnings, and five trace-angle style warnings. The saved layout uses both traces and pours; the current checks do not establish whether each power path meets its requested width/current budget. The warnings have not been cleared or suppressed. Review actual current paths and the reference's documented local width exceptions before fabrication; passing connectivity/short checks does not establish current-carrying or thermal performance.

The reference's exposed-pad via process, four-layer stackup, copper weights, USB geometry, and bench qualification requirements remain applicable. See [`docs/pcb-fabrication.md`](docs/pcb-fabrication.md). No hardware measurements were performed.

## Review artifacts

- [`PCB SVG`](docs/previews/pcb.svg) and [`PNG`](docs/previews/pcb.png): committed routed PCB previews.
- [`All schematic sheets`](docs/previews/all-sheets.svg): all nine sheets in one SVG.
- [`Individual sheet previews`](docs/previews/schematics): one PNG per sheet.
- `dist/index/circuit.json`: compiled circuit, generated locally by the build command.
- `dist/schematics/`: locally generated sheet SVG/PNG previews.
- [`docs/component-imports.json`](docs/component-imports.json): CLI import commands, hashes, and retained footprint corrections.
- `checks/`: netlist, placement, schematic, shorts, build, and test logs.
