# Camera Source

[日本語](README.ja.md)

Camera Source is a TurboWarp extension capability for sharing one `MediaDevices`
camera stream across camera consumers such as pose recognition and QR scanning.
It owns camera startup and shutdown through leases so multiple extensions do not
start competing `getUserMedia()` sessions for the same physical camera.

**[Open the user guide](https://kubohiroya.github.io/turbowarp-camera-source/)** ·
**[日本語ガイド](https://kubohiroya.github.io/turbowarp-camera-source/ja/)**

## Build workflow

```text
TypeScript source
  -> Vite
  -> vite-plugin-turbowarp-extension
  -> dist/<extension-name>.js

Extension config + block definitions
  -> extension manifest plugin
  -> dist/extension-manifest.json
```

The generated JavaScript is a single, non-minified TurboWarp extension file with Extension Gallery metadata and the standard `(function (Scratch) { ... })(Scratch);` wrapper.

## Blocks

<!-- BEGIN GENERATED BLOCKS -->

### `start shared camera`

Starts the shared MediaDevices camera stream.

| Property | Value |
|---|---|
| Type | Command |
| Opcode | `startSharedCamera` |

### `stop shared camera`

Stops the shared camera stream and releases its tracks.

| Property | Value |
|---|---|
| Type | Command |
| Opcode | `stopSharedCamera` |

### `shared camera is running?`

Reports whether the shared camera stream is active.

| Property | Value |
|---|---|
| Type | Boolean |
| Opcode | `isCameraRunning` |

### `shared camera device ID`

Returns the active shared camera device ID when available.

| Property | Value |
|---|---|
| Type | Reporter |
| Opcode | `cameraDeviceIdReporter` |

<!-- END GENERATED BLOCKS -->

## Development

```bash
npm install
npm run check
```

## Runtime API

Other unsandboxed extensions can access `Scratch.vm.runtime.ext_kubohiroyacamerasource`.
Use `acquireCamera()` to receive a lease, call `getFrameSource()` while it is active, and
release the lease when the consumer no longer needs frames.

For continuous rebuilding during development:

```bash
npm run dev
```

## Project structure

- `src/config.ts`: extension metadata
- `src/block-definitions.json`: canonical block metadata used by both the extension and README generator
- `src/extension.ts`: extension implementation
- `src/extension-manifest.ts`: canonical manifest generator and Vite output plugin
- `src/index.ts`: extension registration entry point
- `src/globals.d.ts`: Scratch API declarations used by the project
- `schemas/extension-manifest.schema.json`: JSON Schema for the generated API contract
- `scripts/generate-readme.mjs`: updates the generated README block section
- `tests/`: unit tests
- `vite.config.ts`: TurboWarp-compatible Vite build configuration
- `dist/`: tracked TurboWarp JavaScript and extension API manifest

## Extension API manifest

Each build emits `dist/extension-manifest.json` with `formatVersion: 1`. It records the extension ID,
block opcodes and types, argument IDs and types, and menu references in a deterministic order. Tools
such as `sb3-toolchain` can compare this contract before updating an embedded extension or migrating
its ID. See [the architecture document](docs/architecture.md) and the
[JSON Schema](schemas/extension-manifest.schema.json) for the v1 contract.

After changing runtime or block metadata, regenerate and verify the tracked release artifacts:

```bash
npm run check:dist
```

## Generated documentation

Regenerate block documentation with:

```bash
npm run docs
```

`npm run check` also runs `docs:check`, which fails if `README.md` is out of date with `src/block-definitions.json`.

## License

MPL-2.0
