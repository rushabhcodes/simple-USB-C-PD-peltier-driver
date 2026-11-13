# Publishing the three product versions

The 0.2.x release family keeps one package, `rushabhcodes/simple-usb-c-pd-peltier-driver`,
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
tsci push --no-compress
```

`build:preview` compiles all four entrypoints from the pinned dependency set,
generates PCB/schematic/3D artifacts, restores the full Standard assembly model,
and packs the outputs in checksum-verified chunks of at most 3 MiB to respect
registry request-size limits. `build:cloud` verifies the source fingerprint and unpacks
the same four builds for the registry's cloud builder. The fingerprint covers
all variant source and the output map; a stale or incomplete preview is rejected.
Release-version metadata and package JSON formatting are canonicalized; dependency,
script and board changes still invalidate the cache. Per-file hashes identify any
changed inputs when a remote build reports a stale preview.

The static viewer uses a local browser bundle so a large bundle cannot fail a
CDN's file-size limit. Preview generation uses committed footprints with live
supplier lookups disabled; supplier stock and price feasibility remain unverified.
The ordinary source `build` command keeps its normal supplier-check behaviour.

Publish from a clean source checkout or a staging tree containing only files
listed by `git ls-files`. This CLI version's `push` does not honour the project's
`ignoredFiles` list, so pushing a development tree can include generated firmware
and work caches. Do not use `--include-dist`. `--no-compress` uploads the bounded
files individually instead of exceeding the archive request limit. Credentials stay in the CLI's user config
or environment, never Git or the packed preview. Native `tsci login` provides
the user sign-in flow; do not paste session tokens into chat or commit them.

After pushing, check the new package release's build result and confirm all four
`circuit.json` artifacts, corresponding previews and build selector entries are
present. The [design comparison](product-designs.md) and
[review log](design-review.md) distinguish the remaining release gates.

## Local preflight and upload correction

The board release passed TypeScript and all **92 tests across 15 files**. A clean
source staging tree with no prior `dist/` restored all four compiled builds,
including valid PNGs and GLB models. Chromium loaded and rendered each build,
showed four gallery cards, and reported no page, request or HTTP errors. Draft
outputs contained no saved copper; Standard retained its 364 routed traces.
These checks establish the prepared artifacts, not hardware qualification or
the eventual remote publication result; verify the live registry build after push.

The initial 0.2.0 upload was stopped after HTTP 413 and detection of generated
caches in the CLI fallback. The corrected native `tsci push --no-compress`
published 195 source files as 0.2.1; its cloud job succeeded and all four live
boards rendered with hashes matching the tested Circuit JSON, four gallery
cards, and no browser/request/HTTP errors. GitHub `main` was then pushed.

GitHub synchronization automatically created 0.2.2. That job rejected a stale
fingerprint even though the registry copies of all 85 covered input files matched
the checkout. The follow-up fingerprint excludes only release-version metadata,
canonicalizes package JSON, and adds per-file diagnostics; source and dependency
changes continue to invalidate the cache. The current board artifacts remain the
same checked designs. Verify both automatic and native releases after this fix.
No credential or generated build-cache directory belongs in the published source.
