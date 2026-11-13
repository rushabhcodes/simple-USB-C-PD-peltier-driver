# Recommended version: integrated Standard

Use the reviewed Standard design as the best all-round version of this family.
It retains the 12 V fan supply and both powered probe interfaces on a single
fully routed board, without an inter-board connector.
Lite removes useful interfaces; Modular adds board area, connectors and an
internal harness. Their separately routed review candidates remain available.

This selection preserves the reviewed electrical design rather than claiming
new hardware performance. The board is 72.5 × 59 mm, four layers, nominal
1.6 mm, with 134 purchased placements, 364 saved traces and 370 vias. It uses
RP2040 control, a separate PROGRAM USB port, adjustable CC/CV and fixed TEC
polarity. The 72 W setting ceiling requires thermal/electrical qualification;
the firmware does not implement a thermostat or polarity reversal.

## Generate the complete review package

```sh
bun run best:build
```

In the prepared cloud environment, source `/workspace/.cloud-setup/env.sh`
first so Bun, the Arm toolchain and the pinned Pico SDK are available.

The builder creates `dist/peltier-best-standard-review.zip` and a fresh
`dist/best-version-…/` review folder. It builds the recommended entrypoint from
source and includes:

- Routed PCB Circuit JSON, SVG and PNG.
- All nine schematic sheets, SVG/PNG and a combined schematic.
- An offline interactive 3D assembly with exploded-stack controls, GLB, wiring
  diagram, assembly image and fan-duct STL.
- A 134-placement BOM with supplier identifiers and a placement-review CSV.
- RP2040 UF2/BIN/ELF firmware and the host control tool.
- Gerber/Excellon/POFV archive for CAM review, fabrication notes and assembly guide.
- Source snapshot, per-command logs, build report and SHA-256 checksums.

The build rejects missing features, unsourced purchased parts, changed/incomplete
copper, circuit errors, failed placement/netlist/short checks, mismatched PCB and
assembly geometry/connectivity, or source changes during generation. Firmware's
UF2 check must confirm it excludes the saved-profile flash sector. Every command
keeps its underlying exit status; a previous build is not used to certify a new one.

The source snapshot contains only explicit repository source/documentation
directories, not credentials, `.git`, dependency installations, SDK checkouts,
virtual environments or compiler build caches. Unpack it for editable source
links referenced by the original documentation. Each build uses a fresh review
directory and keeps prior generated folders.

## Commercial and release status

Keep the provisional **USD $89–119** assembled-PCB selling target at 100 units
until the sales market, currency and quotations are confirmed. The corresponding
50% gross-margin landed-COGS ceiling is $44.50–59.50. Actual cost and current
supplier stock remain unknown; accessories, PSU and tax are excluded.

The package is for **engineering and CAM review**, not a qualified production
release. Confirm the specified four-layer stackup, 2 oz outer copper, impedance,
13 selectively filled/capped vias, assembly origin/rotation and fabricator
artwork. Then perform power, thermal, USB, protection, fault and mechanical bench
qualification. No automatic order, publication or hardware flashing is performed.

The previous three-cycle findings remain in [the review log](design-review.md).

## Packaging review fixes

The package generator additionally addresses these findings:

| Finding | Correction / check |
|---|---|
| The CLI preserves `designs/` in its output path; the first attempt looked in `dist/best`. | Read the freshly generated `dist/designs/best/` and keep the command log. |
| Bun cannot redirect stderr using the string `stdout`; the project targets ES2020 rather than `replaceAll`. | Share an explicit log file descriptor and use a compatible quoted-CSV replacement. Typecheck and packaging unit checks pass. |
| The original offline assembly page links to docs two directories above its viewer. | Rewrite only the generated package link to `../docs/assembly.md`. |
| Creating an archive log after checksumming would leave an uncovered package member. | Complete all logged build steps before checksumming; create/test the final ZIP without adding another member. |
| Code edits during generation could mix built outputs with a different source snapshot. | Capture source hashes before building and compare them again before packaging; abort on drift. |

Five focused tests verify the exact Standard entrypoint and packaging gates.
The build performs fresh checks on actual PCB/assembly/firmware outputs in
addition to those structural unit tests. The earlier full 82-test design-family
run is recorded separately; it is not presented as a new package-build test run.
