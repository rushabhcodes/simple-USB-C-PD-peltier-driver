# USB-C PD Peltier driver

An editable tscircuit PCB based on [0hmX/dual-usb-peltier-assembly](https://tscircuit.com/0hmX/dual-usb-peltier-assembly), release **0.4.12**. The default 3D preview shows the routed board with its Peltier stack, fan, probes, and cables. The project includes nine schematic sheets and RP2040 firmware.

Supplier parts are imported with the **TSCircuit CLI** using `tsci import C… --jlcpcb --use-exact-footprint`. The import audit in [`docs/component-imports.json`](docs/component-imports.json) records the exact commands and source hashes. The active wrappers preserve the reference's pin semantics and documented manufacturing corrections. Schematic placement is refined for closer capacitor banks, compact IC symbols, and readable annotations.

![Routed four-layer PCB](docs/previews/pcb.png)

Review the [PCB SVG](docs/previews/pcb.svg), [all nine schematic sheets](docs/previews/all-sheets.svg), or [individual sheet previews](docs/previews/schematics). See the [validation record](VALIDATION.md) and [release diagnostic fixes](docs/diagnostic-fixes.md).

Open the [published tscircuit board](https://tscircuit.com/rushabhcodes/simple-usb-c-pd-peltier-driver).

## Design

| Item | Specification |
| --- | --- |
| PCB | 72.5 × 59 mm, four layers, nominal 1.6 mm |
| PD POWER | USB-C, CYPD3177 sink controller; 20 V / 5 A target contract |
| USB PROGRAM | Separate USB-C port for RP2040 firmware and serial commands |
| TEC output | TPS55289 buck-boost with programmable voltage/current limits |
| Output settings | 2.1–15 V, 0.5–6 A, maximum configured V × I of 72 W |
| Control | RP2040, 12 MHz crystal, 16 MiB QSPI flash |
| Sensors | Two 3.3 V DS18B20 probe connections: HOT and COLD |
| Fan | Fixed 12 V supply, 0.5 A design budget, 3/4-pin PC fan header |
| Status | POWER, RUN and FAULT LEDs; SWD and other exposed debug pads |

These are the reference design's targets, not measured performance. Temperature sensing reports measurements; the included firmware does not implement closed-loop temperature control. The TEC output has fixed polarity.

## Open and edit

```sh
git clone https://github.com/rushabhcodes/simple-USB-C-PD-peltier-driver.git
cd simple-USB-C-PD-peltier-driver
bun install --frozen-lockfile
bun run dev
```

The local `tsci` executable is pinned through the project dependency and lockfile. Use the **PCB**, **Schematic**, and **3D** tabs in the local viewer. The schematic sheet selector divides the design into PD input, TEC conversion, logic supplies, MCU signals, MCU power, monitoring, debug, fan, and probes.

The viewer opens [`assembly.tsx`](assembly.tsx). Zoom out in the local 3D tab to see the full thermal stack. For the PCB entrypoint, run `bun run dev index.circuit.tsx`. It renders [`src/board/general-pd.tsx`](src/board/general-pd.tsx) from the functional blocks in `src/board/`. `imports/` and `src/parts/` contain the footprints and pin maps. Run `bun run build:assembly` and open `dist/assembly/assembly.html` for the offline viewer with an exploded view. The build also exports the fan duct STL.

Saved routing is in [`src/board/routing-data.json`](src/board/routing-data.json). After changing component order or logical connections, run `bun run routing:rebind` and review/reroute the affected copper; rebinding updates associations and does not move traces.

## Validate and build

```sh
bun run typecheck
bun run check:netlist
bun run check:schematic
bun run check:placement
bun run build --pcb-png --schematic-png
bun run export:schematics
bun run check:shorts
bun test ./tests
```

Board artifacts are written to `dist/index/`. Individual sheet SVG/PNG previews and an all-sheet SVG are written to `dist/schematics/`. Default builds keep supplier checks enabled. Confirmed zero stock produces a warning; missing data, failed requests and timed-out lookups remain unverified. For an offline build, `--disable-parts-engine` uses the committed supplier parts. The tests check electrical connectivity, saved copper, component pin maps, schematic separation, and accessory models. They do not replace hardware qualification.

After changing the board or assembly, run `bun run build:preview` and commit the updated `assets/assembly/site-preview.br`. The tscircuit cloud build verifies the source fingerprint and unpacks this preview into `dist/`.

See [`VALIDATION.md`](VALIDATION.md) for the exact build, placement, routing, supplier-check and test results, including the reviewed manufacturer footprint used for the fan inductor.

## Wiring and fabrication

- The [bench assembly guide](docs/assembly.md) covers exact parts and purchase links, the component-side wiring diagram, plate machining, and first power-up.
- Use a 100 W USB-C PD supply and a 5 A electronically marked cable for the reference's full power target.
- `J_TEC`: pin 1 = TEC positive; pin 2 = ground. Install the Peltier's heatsink and clamping before operation.
- HOT/COLD probes: use the schematic pin map for 3V3, DATA, and GND.
- The original board omits silkscreen. Identify connections and polarity from the schematic and assembly guide.
- Firmware setup and USB commands are in [`firmware/README.md`](firmware/README.md).
- Generate the Gerber and Excellon archive with `bun run build && python3 scripts/export-fabrication-review.py`. See the [JLCPCB fabrication review](docs/pcb-fabrication.md#jlcpcb-cam-review) for the stackup, solder mask, and selective via filling. Bench qualification remains required for the full power target.

## Reference and license

Adapted from [0hmX/usb-c-peltier-board](https://github.com/0hmX/usb-c-peltier-board/tree/87fa5809a7254b2ae2d7efe53fcedd53276361bb), commit `87fa5809a7254b2ae2d7efe53fcedd53276361bb`, corresponding to the supplied tscircuit release. Original source copyright © 2026 0hmX, under the [MIT license](LICENSE). See [`REFERENCE.md`](REFERENCE.md) for the adaptation details and [`docs/general-pd-driver.md`](docs/general-pd-driver.md) for the original design notes and component datasheets.

The assembly includes manufacturer CAD from Noctua with its [bundled usage terms](src/assembly/assets/Noctua-CAD-README.txt).
