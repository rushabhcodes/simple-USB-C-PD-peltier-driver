# Product design review log

This records actual review → fix → review cycles for the three-product design
study. Standard remains the original routed PCB. Lite and Modular begin as
editable schematic/floorplan candidates, with routing and hardware qualification
outstanding. Passing source checks does not establish manufacturability.

This is the historical source/placement review. All four PCBs were subsequently
routed; the [routing review](routing-review.md) records three further cycles and
the resolution of R3-04's routing portion. Connector and hardware qualification
remain open.

## Cycle 1 — variants and source integrity

Initial review of `c28f8c890b31f38c8fe63c92ef2eeaf6ea4e5f4a`:

| ID | Finding | Change | Re-review |
|---|---|---|---|
| R1-01 | Only one board design existed. | Added Lite, Standard and a two-board Modular product with separate entrypoints. | Resolved at design-candidate scope: three products, four board entrypoints; all builds/checks pass. |
| R1-02 | The saved copper/IDs belong to one exact board; deleting parts or splitting it invalidates that copper. | New candidates omit `RoutedCopper` entirely and explicitly disable routing; Standard stays unchanged. | Resolved: all three draft JSONs have no traces/vias/pours; original routing regressions still pass. |
| R1-03 | Removing probe interfaces leaves MCU inputs and product claims requiring review. | Lite removes the fan/probe circuits and makes GPIO8/9 explicitly NC. | Resolved: 115 purchased placements, both physical inputs explicitly NC, no circuit errors. |
| R1-04 | `bun run typecheck` scans CMake-generated `firmware/build/**/compiler_depend.ts` as TypeScript after firmware setup. | Exclude only the generated firmware build directory. | Resolved: typecheck passes with firmware outputs present; preview rebuilt and fingerprint check passes. |
| R1-05 | The first test draft assumed unsupported Circuit JSON `do_not_place` and `is_not_connected` source fields. | Count purchased parts by excluding testpoints and check the schema's `do_not_connect` field, including exactly two ports. | Resolved: typecheck and the actual compiled-port assertions pass. |
| R1-06 | The first full Lite render exceeded Bun's default 5-second test budget (4 structural tests passed, 1 timed out). | Use a bounded 60-second render budget; keep all assertions. | Resolved: focused render completed in 13.0 s; final full-suite render in 16.0 s. |

No variant has been released for fabrication or assigned a confirmed commercial
price. Evidence and final checks are recorded below.

Cycle 1 re-review: `bun run typecheck` passed after the exclusions/schema fixes;
the focused suite passed **5/5**, with the full Lite source render completing in
13.0 s under the 60 s budget. R1-01/02/03/05/06 are resolved at schematic/source
level. R1-04's typecheck fix is verified; preview fingerprint refresh remains a
separate required check at that point; it subsequently passed in cycle 3.
Routing remains open by design.

## Cycle 2 — inspect the first modular partition

The first partition classified parts by schematic sheet. Reviewing that actual
draft exposed these electrical problems before it can be used as hardware:

| ID | Finding | Required correction | Re-review |
|---|---|---|---|
| R2-01 | MONITOR was assigned to the controller, taking the fail-off clamp away from the converter on unplug. | Keep both clamp transistors and all three bias/gate resistors on the power PCB. | Source topology resolved: ownership, compiled clamp nets and open-permission-wire tests pass. Bench disconnect tests remain in R3-04. |
| R2-02 | ADC dividers, auxiliary 5 V supply and mux would cross the split with raw/high-current rails. | Keep conversion/bias/dividers local and carry only scaled ADC signals and logic rails. | Resolved at source level: all 16 connector pins match the documented nets; no raw/TEC/switching rails cross the harness. |
| R2-03 | A hand-written harness can silently omit shared named nets. | Compare the actual partition's shared nets with every harness pin. | Resolved: 11 distinct shared nets covered by 16 pins; all 461 original pins match through the explicit cable. |
| R2-04 | A second PCB needs its own placement, interface footprint and local input bypass; copying full-board coordinates is insufficient. | Allocate separate smaller outlines, move the interfaces, add local PROGRAM VBUS bypass. | Candidate placement resolved: zero bounds, overlap or native circuit errors after the capacitor fix. Final connector selection/routing remains R3-04. |

Cycle 2 evidence: the new contract suite initially reported **1 pass / 3 fail**,
including the misplaced clamp, misplaced ADC divider and an incorrect shared-net
set. After the ownership/bias/divider fixes the combined suites reported **9 pass /
0 fail** and TypeScript passed. R2-01/02/03 are resolved at source level; compiled
graph and floorplan checks follow in cycle 3. The extra local 1 µF PROGRAM VBUS
capacitor is included in the modular BOM. Connector part selection remains open.

## Cycle 3 — compiled layout, price and release review

| ID | Review finding | Change/verification | Status |
|---|---|---|---|
| R3-01 | The first two cycles checked source structure, not stitched compiled pin connectivity or physical placement. | Build each draft and compare all reference pins through an explicit 16-wire cable; check component bounds/overlaps. | Resolved: fresh builds and compiled regression suite pass; 461/461 original pins match. |
| R3-02 | Selling-price scope and targets were unspecified, and a multi-board estimate can omit a second PCB, harness and test cost. | Added explicit provisional USD targets at 100 units, defined sale scope, gross-margin cost ceilings and null/unquoted costs. | Calculation checks pass; **open commercial gate:** user targets, market and supplier quotations remain unconfirmed. No profitability claim. |
| R3-03 | The tsconfig correction invalidates the default committed preview fingerprint. | Rebuild/validate the default preview after the final source changes. | Resolved: `bun run build:preview` and `bun run build:cloud` both exit 0. |
| R3-04 | New boards are unrouted and the harness footprint has no selected MPN. Passing a netlist cannot establish fabrication readiness. | Mark new designs as candidates; block the design builder's fabrication mode; report missing source/quote and qualification work explicitly. | Guard/warning checks pass; **open engineering gate:** route new boards, select/verify mating connectors, obtain PCBA quotes and qualify hardware before fabrication/sale. |
| R3-05 | The first exporter typecheck found an optional source owner and a value-only Circuit export used as a type. | Check absent owners explicitly and use `InstanceType<typeof Circuit>`. | Resolved: final typecheck passes. |
| R3-06 | Native courtyard DRC found `C_LINK_PROGRAM` overlapping `U_LOGIC_MUX` in the first compiled power floorplan. | Move the new bypass to the original, already separated PROGRAM input-capacitor position and orientation. | Resolved: native re-render reports zero circuit/courtyard errors and no placement overlaps. |
| R3-07 | The first graph audit incorrectly treated the reference's 740 native via proxy ports as missing purchased parts. | Exclude only the documented native via top/bottom proxy pattern, report the count, and continue rejecting every other missing owner. | Resolved: 740 proxy ports accounted for; all 461 real reference pins compared; injected missing-owner regression rejects the bad graph. |
| R3-08 | Lite's schematic box still labelled its NC pins HOT/COLD after removing the probes. | Rename those symbols GP8_NC / GP9_NC while retaining the physical GPIO mapping. | Resolved: exported schematic contains both NC labels and neither old HOT/COLD label. |
| R3-09 | The disconnected-cable audit rejected the legitimate local name `J_LINK` appearing on both PCBs. | Qualify identities by board for general multi-board graphs; retain strict unique reference identities when comparing the original parts. | Resolved: open-wire and swapped-5-V-pair mutation checks pass. |
| R3-10 | "No cables" in the initial selling scope was ambiguous while costing Modular's internal harness. | Explicitly include the internal inter-board harness and exclude external cables/accessories. | Resolved: manifest, compiled report and product comparison agree. |

Cycle 3 first compiled suite: **2 pass / 4 fail**, catching the courtyard overlap,
via-proxy handling and duplicate local connector identities. After fixes, the
same six checks passed. Two additional compiled checks now verify unexpected
missing owners are rejected and provisional headers retain their sourcing
warnings instead of being marked DNP.

## Final re-review evidence

| Check | Completed result |
|---|---|
| `bun run typecheck` | Passed with generated firmware outputs still present. |
| `bun test ./tests` | **82 passed, 0 failed**, 7526 assertions across 12 files, 321.63 s. This includes all original 59 regressions plus 23 new checks. |
| `bun run designs:build` | Exit 0; all three draft boards compiled with zero circuit errors and zero bounds/overlap findings. |
| Compiled Modular source graph | 461 original pins matched exactly through 16 explicit cable wires. Equal net labels do not join boards implicitly. |
| BOM counts | Lite 115; Modular power 80 + controller 57 = 137; Standard remains 134. |
| Sourcing warnings | Lite: 0. Power: 1 for `J_LINK`; controller: 1 for `J_LINK`. Both are intentionally unresolved and tested as such. Stock/quotes were not verified. |
| Pricing logic | Price/margin validation, missing-quote handling and two-PCB/harness/test/freight accounting passed. Actual cost remains null. |
| Default preview | Rebuilt, packed and unpacked successfully with the new tsconfig fingerprint. |
| Fabrication mode | Rejected with nonzero exit as intended; no new Gerbers generated. |
| Visual review | Saved labelled PNG/SVG floorplans inspected; new boards prominently state UNROUTED / NOT FOR FABRICATION. |

The [compiled report](product-design-validation.json) and
[product comparison](product-designs.md) are saved for review. Raw command logs
are in the ignored local `work/design-review/` directory, including failed and
fixed runs; the counts above preserve their outcomes in the repository.

All 20 findings are tracked above. Eighteen are resolved within their stated
source/tooling/design-study scope. R3-02 and R3-04 remain open commercial and
engineering release gates; neither passing tests nor provisional selling targets
resolve them. No physical measurements or hardware fault injection were done.

## Recommended-version package follow-up

The subsequent request to generate the best version selects integrated Standard
and exports a complete review package. The [recommended-version guide](best-version.md#packaging-review-fixes)
tracks the additional packaging findings and corrections. The 20-finding count
above applies to the three-product design study, not this later export workflow.
