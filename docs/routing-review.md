# Routing review: all three products

All four physical PCBs now have variant-specific routed copper. Standard's
original copper is unchanged. Lite and both Modular boards compile from their
own entrypoints with routing enabled and automatic remaining-net routing disabled.
The saved routes are rebound to each board's actual source traces and pins.

The checks below establish routing completion, not hardware qualification or a
production release. The connector MPNs, supplier quotations, thermal/electrical
measurements, impedance and mechanical qualification remain open.

## Review → fix → review cycle 1: derive and connect

| ID | Finding | Change | Re-review result |
|---|---|---|---|
| RT1-01 | Lite and the two Modular entrypoints contained no physical routing. Original copper cannot be replayed against changed source IDs. | Retain only applicable original geometry, translate controller geometry by 12 mm, rebind associations, and save separate copper files. | Resolved: all three active variant entrypoints contain real traces, vias and pours; source association checks pass. |
| RT1-02 | Deleting parts and splitting the board leaves unused branches and physical opens, even when net names agree. | Remove obsolete branches and use actual connected copper islands to generate missing connections. | Resolved: every required physical pin joins its intended net, with no floating copper. Equal net labels cannot hide a missing wire. |
| RT1-03 | Native autorouting preflight rejected a 2 mm ground-decoupling constraint using a longer pad-to-pad estimate, despite an existing local ground via/plane. Dense fixed-obstacle capacity routing also failed to finish the remaining paths. | Route the missing physical connections offline with the grid router, retain the source constraints, then check the assembled copper with independent geometry and native DRC. | Resolved for these boards without relaxing the original capacitor constraints. Direct native autorouting remains unsuitable for this fixed-copper case. |
| RT1-04 | A complete router job could lose successful connections after one failure; layer-array endpoints could also end on the wrong layer. | Route connections sequentially, retain successes, and explicitly assign the reachable endpoint layer. | Resolved: successful connections are preserved; the physical checker rejects unplated layer transitions and finds none in the final boards. |
| RT1-05 | Dense IC pads need their original escapes; starting an arbitrary new route at the pad made routing fail. | Preserve applicable escape prefixes and their first vias before routing the trunks. | Resolved: clock routes retain zero vias and stay below 10 mm; all dense-device pins connect. |

## Review → fix → review cycle 2: physical copper and fabrication

| ID | Finding | Change | Re-review result |
|---|---|---|---|
| RT2-01 | The physical checker did not support the header's square pin-1 annulus. | Model the rectangular outer pad with its actual circular drill and test copper continuity around the hole. | Resolved: all 16 header pads on each board participate in the physical connectivity check. |
| RT2-02 | Router vias could duplicate nearby existing vias, violating the drill web. | Merge redundant same-net barrels and remove tiny detours inside the retained drill. | Resolved: native drill-spacing and independent drill-to-SMT checks pass. |
| RT2-03 | A short, nonzero trace wholly inside a round drill was incorrectly counted as floating fabricated copper. | Exclude only strokes whose entire width lies inside a real drill; keep geometry tolerance at 1 nm. Add a regression test. | Resolved: real floating copper still fails; an entirely drilled-away stroke does not fabricate a conductor. |
| RT2-04 | Applying board-edge setback to every explicit power polygon eroded internal converter copper and disconnected power paths. | Clip only outlines crossing the board boundary; preserve internal power-pour geometry. | Resolved: every power pin connects and all six 3 mm converter corridors remain covered. |
| RT2-05 | New controller signal routes and obsolete power-area ground patches fragmented the translated ground layout and left dangling branches. | Move eligible signal runs off inner1, retain the ground and USB-reference pours, and remove obsolete ground branches. | Resolved: controller ground, all required pins, native contiguity checks and floating-copper checks pass. This does not establish measured return-path impedance. |
| RT2-06 | A logically flow-through ESD channel connected internally, but native PCB checks still required an external trace at its other pad. | Add a local copper strap between the corresponding same-net ESD pads. | Resolved: physical connectivity and native pad-connectivity checks both pass. |

## Review → fix → review cycle 3: strict final checks

| ID | Finding | Change | Re-review result |
|---|---|---|---|
| RT3-01 | Grid-rounded through-hole endpoints lay inside the drill but did not identify the exact source port when rebinding. | End header routes at the actual compiled plated-port centers. | Resolved: physical connectivity and source-trace association checks both pass. |
| RT3-02 | Six new vias were too close to SMT or header pads; global via-in-pad allowance would conceal them. | Search clear positions against existing copper and drill geometry, move the six vias, and rerender the pours. Re-enable strict via-in-pad checks for review. | Resolved: zero drill-to-SMT violations and zero unapproved via-in-pad errors. Only the exact checked exposed-pad arrays are exempt. |
| RT3-03 | A current-monitor via clipped the converter's full-width input corridor even though the net remained connected. | Move that signal via away from the protected corridor and regenerate the copper. | Resolved: all six 3 mm corridors pass; every original ISP/ISN Kelvin branch is unchanged. |
| RT3-04 | A redundant ADC escape and residual ground stubs caused native dangling-endpoint errors after the final routes connected. | Remove the redundant ADC branch/barrel and prune unused ground branches. | Resolved: no native circuit/routing/placement errors, no opens and no floating copper. |
| RT3-05 | Published build metadata, product pages and previews still described the variants as unrouted. | Attach checked copper to all entrypoints, update statuses, rebuild the multi-build previews, and add a routing validation command and regressions. | Resolved: all four native builds, routing audits and the full regression suite pass; a clean source stage restores all four previews. Historical placement-review results remain preserved in the earlier log. |
| RT3-06 | One 5.18 mm inner1 segment on Modular Power has a 190.01° direction, generating a 45°-style advisory. | Retain the clear, connected segment and record the advisory. | Open cosmetic advisory; it passes physical/native clearance and fabrication checks. No routing constraint is waived for it. |
| RT3-07 | Modular's provisional headers still have no selected MPN, and none of the products has measured hardware qualification. | Preserve both sourcing warnings, block the variant builder's fabrication mode, and retain `manufacturingReady: false`. | Open release gates. Routing resolves only the routing portion of historical R3-04. |
| RT3-08 | Final checker review found that the drill-contained-stroke filter used the next point's width even for a constant-width segment. | Use the actual stroke end width consistently and test constant versus interpolated widths. | Resolved: the 15 focused geometry tests pass with 36 assertions, and all four compiled boards pass the strengthened audit. Board copper did not change. |

## Final routing evidence

| Board | Required pins | Traces | Vias | Rendered pour regions | Exact thermal via pairs | Routing result |
|---|---:|---:|---:|---:|---:|---|
| Standard | 422 | 364 | 370 | 29 | 13 | PASS |
| Lite | 372 | 331 | 357 | 29 | 13 | PASS |
| Modular Power | 249 | 187 | 262 | 31 | 4 | PASS |
| Modular Controller | 207 | 195 | 228 | 4 | 9 | PASS |

For each board, fresh source compilation plus `reviewBoardRouting` checks:

- Every required pin, actual geometric connectivity, shorts, clearances,
  floating copper, valid pour geometry and source/copper associations.
- Native routing/placement DRC with global via-in-pad permission disabled.
  Only the exact grounded 0.3/0.6 mm exposed-pad arrays are exempt, and require
  the documented filled, planarized and capped fabrication process.
- Drill-to-SMT clearance, solder-mask spacing and component placement.
- Crystal length/via limits where present; the six converter corridors and
  unchanged Kelvin branches on boards carrying the converter.

The two Modular source graphs, joined only by the explicit 16-wire harness,
must reproduce all 461 original physical pins and their connections. An added
mutation test removes permission copper while keeping the source netlist
unchanged and confirms that a real open is detected.

Run `bun run designs:route-check` to regenerate
`dist/product-routing/validation.json`. The committed
[routing report](routing-validation.json) and
[product report](product-design-validation.json) record the completed check.
`bun run designs:build` exports fresh routed PCB and schematic review artifacts.
Raw failed and successful router/check logs remain in the ignored local
`work/routing-attempts/` directory.

Completed command checks:

| Check | Result |
|---|---|
| `bun run typecheck` | PASS |
| `bun test ./tests` | 102 passed, 0 failed; 7604 assertions across 17 files; 480.14 s |
| `bun run designs:route-check` | All four PCBs pass; explicit Modular harness matches 461 reference pins |
| `bun run designs:build` | All three variant boards pass; purchased placements 115 / 80 / 57 |
| `bun run build:preview` | Four native circuits pass; PCB, schematic and 3D outputs packed successfully |
| `bun run build:cloud` in a clean tracked-source stage | Four builds restored from the checked preview archive |
| Chromium preview check | All four PCB views render; gallery has four cards; zero page, request or HTTP errors |
| `bun run designs:build --fabrication` | Refused with exit 1 as required while hardware/connectors remain unqualified |

After the full-suite run, RT3-08 added two assertions to an existing geometry
test. The focused geometry suite, TypeScript and all four compiled-board routing
audits passed again after that checker-only correction.
