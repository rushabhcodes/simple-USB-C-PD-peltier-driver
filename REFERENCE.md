# Reference provenance

- Requested reference: https://tscircuit.com/0hmX/dual-usb-peltier-assembly
- tscircuit release: 0.4.12
- Package release ID: `d87f3581-bdde-4704-a2f4-5686a00e2e71`
- Upstream source: https://github.com/0hmX/usb-c-peltier-board
- Source commit: `87fa5809a7254b2ae2d7efe53fcedd53276361bb`
- License: MIT; original copyright notice retained in `LICENSE`.

The PCB, component footprints, pin maps, existing routed copper, firmware, accessory geometry, and original validation tests originate in that source snapshot. This is a board-focused adaptation, not a claim of a newly engineered electrical design.

The default `index.circuit.tsx` renders the board. The reference's accessory assembly is exposed separately as `assembly.tsx`, and the assembly test imports that entrypoint. Project metadata and local build/check scripts describe the new workspace. The tscircuit runtime is pinned to the reference's 0.0.2868 version for repeatable builds. Original supplier-stock snapshots are historical observations, not current availability guarantees.

The supplier components are imported afresh with the tscircuit CLI. `docs/component-imports.json` records all 55 BOM SKUs, the commands, raw source hashes, and active wrapper adjustments. Capacitor pin aliases, power/ground attributes, custom schematic symbols, connector access directions, and documented land/drill corrections are retained from the reference after comparing the imported geometry.

Schematic-only refinements group bypass capacitors, reduce excess symbol padding, orient bootstrap capacitors vertically, and move a colliding fault annotation. A local 3V3 label identifies the cold-probe supply. These changes retain the reference's PCB coordinates and electrical net partition.
