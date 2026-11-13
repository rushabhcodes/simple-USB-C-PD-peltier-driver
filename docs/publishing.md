# Publishing the three product versions

Version 0.2.0 keeps one package, `rushabhcodes/simple-usb-c-pd-peltier-driver`,
with multiple build views. `includeBoardFiles` is the TSCircuit CLI's supported
configuration for those builds. The three products have four physical board
views because Modular consists of two PCBs:

| Registry build | Product | Status |
|---|---|---|
| `assembly.tsx` | Standard / recommended integrated board | Routed; bench qualification pending |
| `designs/lite.circuit.tsx` | Lite | Unrouted design candidate |
| `designs/modular-power.circuit.tsx` | Modular power board | Unrouted design candidate |
| `designs/modular-control.circuit.tsx` | Modular controller board | Unrouted design candidate |

Standard remains the default 3D assembly and preserves its existing copper.
The draft boards retain their explicit UNROUTED titles and unresolved connector
sourcing warnings. Publishing them does not qualify them for fabrication/sale.

## Rebuild and push

```sh
bun install --frozen-lockfile
bun run build:preview
bun run build:cloud
bun run typecheck
bun test ./tests
tsci login
tsci push
```

`build:preview` compiles all four entrypoints from the pinned dependency set,
generates PCB/schematic/3D artifacts, restores the full Standard assembly model,
and packs the outputs. `build:cloud` verifies the source fingerprint and unpacks
the same four builds for the registry's cloud builder. The fingerprint covers
all variant source and the output map; a stale or incomplete preview is rejected.

The static viewer uses a local browser bundle so a large bundle cannot fail a
CDN's file-size limit. Preview generation uses committed footprints with live
supplier lookups disabled; supplier stock and price feasibility remain unverified.
The ordinary source `build` command keeps its normal supplier-check behaviour.

Do not push with `--include-dist`: local review ZIPs, tool outputs and firmware
build caches are not registry source. Credentials stay in the CLI's user config
or environment, never Git or the packed preview. Native `tsci login` provides
the user sign-in flow; do not paste session tokens into chat or commit them.

After pushing, check the new package release's build result and confirm all four
`circuit.json` artifacts, corresponding previews and build selector entries are
present. The [design comparison](product-designs.md) and
[review log](design-review.md) distinguish the remaining release gates.

## 0.2.0 local preflight

The release passed TypeScript and all **89 tests across 14 files**. A clean
source staging tree with no prior `dist/` restored all four compiled builds,
including valid PNGs and GLB models. Chromium loaded and rendered each build,
showed four gallery cards, and reported no page, request or HTTP errors. Draft
outputs contained no saved copper; Standard retained its 364 routed traces.
These checks establish the prepared artifacts, not hardware qualification or
the eventual remote publication result; verify the live registry build after push.
