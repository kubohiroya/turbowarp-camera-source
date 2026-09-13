# TurboWarp-Camera-Source

**English** | [日本語](README.ja.md)

TurboWarp-Camera-Source is a TurboWarp extension capability for sharing named
`MediaDevices` camera streams across consumers such as pose recognition, image
classification, and QR scanning. It owns camera startup and shutdown through
leases so multiple extensions can intentionally share the same physical camera
or select separate cameras for separate roles.

**[Open the user guide](https://kubohiroya.github.io/turbowarp-camera-source/)** ·
**[日本語ガイド](https://kubohiroya.github.io/turbowarp-camera-source/ja/)**

## What it does

- Starts and stops named camera streams such as `pose`, `qr`, or `default`.
- Shares one live `HTMLVideoElement` frame source across multiple unsandboxed consumers.
- Keeps each stream alive until the final lease is released.
- Lists browser camera devices after permission is granted.

## Requirements and Safety

- TurboWarp custom extensions loaded with **Run extension without sandbox**.
- A secure browser context such as HTTPS or localhost.
- User camera permission through the browser permission prompt.
- Camera frames stay in the browser. Camera Source does not upload frames or store images.

## Installation

Load this URL as an unsandboxed custom extension:

```text
https://cdn.jsdelivr.net/npm/@kubohiroya/turbowarp-camera-source@0.3.0/dist/camera-source.js
```

For npm hosts:

```bash
pnpm add @kubohiroya/turbowarp-camera-source@0.3.0
```

## Quick Start

Use role names for camera streams. Consumers that use the same `cameraId` share one camera; different names can bind to different devices.

```text
start shared camera [pose] with device ID []
start shared camera [qr] with device ID []
shared camera [pose] is running?
stop shared camera [pose]
```

## Block Reference

<!-- BEGIN GENERATED BLOCKS -->

### `start shared camera [CAMERA_ID] with device ID [DEVICE_ID]`

Starts or keeps a named shared MediaDevices camera stream.

| Property | Value |
|---|---|
| Type | Command |
| Opcode | `startSharedCamera` |
| `CAMERA_ID` | String, default: `default` |
| `DEVICE_ID` | String, default: `` |

### `stop shared camera [CAMERA_ID]`

Stops a named shared camera stream and releases its tracks.

| Property | Value |
|---|---|
| Type | Command |
| Opcode | `stopSharedCamera` |
| `CAMERA_ID` | String, default: `default` |

### `shared camera [CAMERA_ID] is running?`

Reports whether a named shared camera stream is active.

| Property | Value |
|---|---|
| Type | Boolean |
| Opcode | `isCameraRunning` |
| `CAMERA_ID` | String, default: `default` |

### `shared camera [CAMERA_ID] device ID`

Returns the active device ID for a named shared camera when available.

| Property | Value |
|---|---|
| Type | Reporter |
| Opcode | `cameraDeviceIdReporter` |
| `CAMERA_ID` | String, default: `default` |

### `refresh camera devices`

Refreshes the browser camera device list.

| Property | Value |
|---|---|
| Type | Command |
| Opcode | `refreshCameraDevices` |

### `camera device count`

Returns the number of known camera devices after refresh.

| Property | Value |
|---|---|
| Type | Reporter |
| Opcode | `cameraDeviceCount` |

### `camera device ID at [INDEX]`

Returns the one-based camera device ID at the requested index.

| Property | Value |
|---|---|
| Type | Reporter |
| Opcode | `cameraDeviceIdAt` |
| `INDEX` | String, default: `1` |

### `camera device label at [INDEX]`

Returns the one-based camera device label at the requested index when the browser exposes it.

| Property | Value |
|---|---|
| Type | Reporter |
| Opcode | `cameraDeviceLabelAt` |
| `INDEX` | String, default: `1` |

<!-- END GENERATED BLOCKS -->

## Runtime API

Other unsandboxed extensions can access `Scratch.vm.runtime.ext_kubohiroyacamerasource`.
Use `acquireCamera()` to receive a lease, call `getFrameSource()` while it is active, and
release the lease when the consumer no longer needs frames. Pass `cameraId` as a
project-local role name such as `pose` or `qr`; pass `deviceId` when a role should
bind to a specific browser camera device.

```js
const poseLease = await cameraSource.acquireCamera({
  owner: "tm",
  cameraId: "pose",
  deviceId: poseDeviceId,
});
const qrLease = await cameraSource.acquireCamera({
  owner: "jsqr",
  cameraId: "qr",
  deviceId: qrDeviceId,
});
const previewLease = await cameraSource.acquireCamera({
  owner: "camera-preview",
  cameraId: "pose",
  preview: true,
  mirrored: true,
});
const frame = qrLease.getFrameSource();
await previewLease.release();
await qrLease.release();
await poseLease.release();
```

`preview: true` opts that lease into the GPU-backed stage preview. The dedicated video skin uploads
the shared `HTMLVideoElement` with `texImage2D(video)` and mirrors by changing the preview drawable's
X scale. It does not call `drawImage()`, `getImageData()`, or scan frame pixels on the CPU. The option
defaults to `false`; the preview remains visible until the final preview lease for that camera is
released.
If multiple preview leases share a camera, the preview is mirrored while any active preview lease
requests `mirrored: true`.

`frame.element` is the original, unmodified `HTMLVideoElement`, even when the preview is mirrored.
WebGPU and WebCodecs consumers can therefore use that same source without going through the preview
or a CPU canvas, for example with `GPUQueue.copyExternalImageToTexture()` or a short-lived
`VideoFrame`. Consumers own and must close any `VideoFrame` they create.

The display path avoids explicit CPU readback, but it does not promise end-to-end zero-copy:
browser-internal color conversion and GPU transfer may still occur. The preview is private and
noninteractive; it is intended for display, not Scratch touching or color-sensing queries.

## Compatibility

The extension ID remains `kubohiroyacamerasource`, and the block opcodes are unchanged. Camera lease ownership, device selection, and release semantics are unchanged in 0.2.0.

## Development

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm run check
```

For continuous rebuilding during development:

```bash
pnpm run dev
```

## Build Workflow

```text
TypeScript source
  -> Vite
  -> vite-plugin-turbowarp-extension
  -> dist/camera-source.js

Extension config + block definitions
  -> extension manifest plugin
  -> dist/extension-manifest.json
```

The generated JavaScript is a single, non-minified TurboWarp extension file with Extension Gallery metadata and the standard `(function (Scratch) { ... })(Scratch);` wrapper.

## Project structure

- `src/config.ts`: extension metadata
- `src/block-definitions.json`: canonical block metadata used by both the extension and README generator
- `src/extension.ts`: extension implementation
- `src/video-preview.ts`: GPU-backed `HTMLVideoElement` preview skin and drawable lifecycle
- `src/extension-manifest.ts`: canonical manifest generator and Vite output plugin
- `src/index.ts`: extension registration entry point
- `src/globals.d.ts`: Scratch API declarations used by the project
- `schemas/extension-manifest.schema.json`: JSON Schema for the generated API contract
- `scripts/generate-readme.ts`: updates the generated README block section
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
pnpm run check:dist
```

## Generated documentation

Regenerate block documentation with:

```bash
pnpm run docs
```

`pnpm run check` also runs `docs:check`, which fails if `README.md` is out of date with `src/block-definitions.json`.

## License

SPDX-License-Identifier: MPL-2.0
