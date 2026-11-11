# Release 0.1.1 diagnostic fixes

The linked 0.1.0 preview contained 209 warnings and no native errors. The source fixes address each category; normal electrical and copper checks remain enabled.

| Previous diagnostics | Change |
| --- | --- |
| 35 unnamed traces | Give every explicit power and sensor branch a stable descriptive name. |
| 34 requested-width warnings | Remove autorouter width hints from logical branches of this manually routed board. The pinned checker compares a branch's request with the narrowest trace anywhere on its entire net, including unrelated ground and sense branches. Physical widths remain in `routing-data.json`. |
| 5 long odd-angle segments | Replace these segments with horizontal, vertical and 45° paths, then verify physical connectivity and clearance. |
| 134 availability warnings | The catalog returned `stock: null`, including for C14663 and C21190. The configured parts engine returns an unknown result for unknown stock. It retains zero-stock values and rejected lookups, so real availability problems still generate warnings. Unknown stock does **not** establish that a part can be ordered. |
| 1 fan-inductor footprint warning | Compare L_FAN against the reviewed Sunlord land pattern supplied by the project parts engine, rather than the different supplier CAD footprint. Stock and footprint checks both remain enabled. |

L_FAN uses two 2.2 × 7.5 mm pads with 3.8 mm inner spacing, as specified in the [Sunlord SWPA8040S recommended land pattern, page 2](https://atta.szlcsc.com/upload/public/pdf/source/20190109/C361638_7901FB77EA6D5D90885BF852E01DD0FD.pdf). The CLI-imported supplier CAD instead has 4.2 × 8.2 mm pads. The footprint checker receives canonical manufacturer geometry for C83467; other parts retain their normal supplier geometry lookup. Tests check the actual rendered pads and verify that an incorrect C83467 footprint still generates a mismatch warning.

Four additional placement-analyzer advisories are addressed by rotating R_FAULT_OFF, R_RUN, R_DRIVER_FAULT and R_V_ADC_TOP by 180° and rerouting their connections. R_V_ADC_TOP moves down 0.1 mm for via clearance. One short 3V3 branch is added; the board now contains 360 saved traces. Its new inner2 supply link uses 0.6 mm copper and is checked against a local resistance-length budget. The original physical pin/net partition is unchanged (SHA-256 `2df111c39b7d3294a0155048451ab575d62202339edb9e6157b2c3a0de41d77b`).

The routing tests check 3 mm-wide sections of the clipped VIN, SW1, SW2, VOUT and TEC pours, the 0.6 mm fan-header branch, all required physical connections, and clearances. These checks protect specific physical conductors rather than applying a power-trunk width to every trace on a net. They do not establish a current rating for the entire path. The unchanged package escapes and local necks still require the thermal qualification described in [pcb-fabrication.md](pcb-fabrication.md).

Stock-adapter tests exercise core with unknown, zero and positive stock. They verify that zero stock still creates a warning. Stock is not frozen or fabricated to obtain a clean preview.

See [VALIDATION.md](../VALIDATION.md) for the completed build and check results.
