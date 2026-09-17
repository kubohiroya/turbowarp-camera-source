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
https://cdn.jsdelivr.net/npm/@kubohiroya/turbowarp-camera-source@0.10.0/dist/camera-source.js
```

For npm hosts:

```bash
pnpm add @kubohiroya/turbowarp-camera-source@0.10.0
```

## Quick Start

Use role names for camera streams. Consumers that use the same `cameraId` share one camera; different names can bind to different devices.

```text
start shared camera [pose] with device ID []
show shared camera [pose] preview mirrored [true]
shared camera [pose] frame width
shared camera [pose] frame rate
hide shared camera [pose] preview
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

### `shared camera [CAMERA_ID] error code`

Returns the latest camera failure code, or an empty string after a successful start.

| Property | Value |
|---|---|
| Type | Reporter |
| Opcode | `cameraErrorCode` |
| `CAMERA_ID` | String, default: `default` |

### `shared camera [CAMERA_ID] error`

Returns the latest camera failure message, or an empty string after a successful start.

| Property | Value |
|---|---|
| Type | Reporter |
| Opcode | `cameraError` |
| `CAMERA_ID` | String, default: `default` |

### `shared camera [CAMERA_ID] device ID`

Returns the active device ID for a named shared camera when available.

| Property | Value |
|---|---|
| Type | Reporter |
| Opcode | `cameraDeviceIdReporter` |
| `CAMERA_ID` | String, default: `default` |

### `show shared camera [CAMERA_ID] preview flipped [PREVIEW_FLIP]`

Draws the named camera on the stage, turned over as asked. The flip is how the preview is drawn and never changes the frames a consumer is handed.

| Property | Value |
|---|---|
| Type | Command |
| Opcode | `showCameraPreview` |
| `CAMERA_ID` | String, default: `default` |
| `PREVIEW_FLIP` | String, default: `horizontal` |

### `hide shared camera [CAMERA_ID] preview`

Hides the block-owned preview without stopping leases owned by other consumers.

| Property | Value |
|---|---|
| Type | Command |
| Opcode | `hideCameraPreview` |
| `CAMERA_ID` | String, default: `default` |

### `shared camera [CAMERA_ID] frame width`

Returns the active video frame width in pixels, or zero while the camera is not running.

| Property | Value |
|---|---|
| Type | Reporter |
| Opcode | `cameraFrameWidth` |
| `CAMERA_ID` | String, default: `default` |

### `shared camera [CAMERA_ID] frame height`

Returns the active video frame height in pixels, or zero while the camera is not running.

| Property | Value |
|---|---|
| Type | Reporter |
| Opcode | `cameraFrameHeight` |
| `CAMERA_ID` | String, default: `default` |

### `shared camera [CAMERA_ID] frame rate`

Returns the active video track frame rate, or zero when it is unavailable.

| Property | Value |
|---|---|
| Type | Reporter |
| Opcode | `cameraFrameRate` |
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

### `register camera profile [PROFILE_JSON]`

Validates a twcs/camera-intrinsics version 1 document and stores it against the camera it names. Nothing is stored unless the whole document passes, and the profile in force for that camera is replaced.

| Property | Value |
|---|---|
| Type | Command |
| Opcode | `registerCameraProfile` |
| `PROFILE_JSON` | String, default: `{}` |

### `register camera profile [PROFILE_JSON] as [CAMERA_ID]`

Registers a profile under the named camera ID, replacing the ID the document carries before it is validated. Use it when a profile was solved under another name, such as `default` in a calibration app. Sets or clears the camera profile error like the plain register block.

| Property | Value |
|---|---|
| Type | Command |
| Opcode | `registerCameraProfileAs` |
| `PROFILE_JSON` | String, default: `{}` |
| `CAMERA_ID` | String, default: `default` |

### `forget camera profile for [CAMERA_ID]`

Removes the stored calibration profile for one camera.

| Property | Value |
|---|---|
| Type | Command |
| Opcode | `forgetCameraProfile` |
| `CAMERA_ID` | String, default: `default` |

### `camera [CAMERA_ID] is calibrated?`

Reports whether a calibration profile is stored for the camera. An uncalibrated camera is an ordinary state and not an error.

| Property | Value |
|---|---|
| Type | Boolean |
| Opcode | `cameraProfileRegistered` |
| `CAMERA_ID` | String, default: `default` |

### `camera profile JSON for [CAMERA_ID]`

Returns the stored profile as JSON, or an empty string when the camera has none.

| Property | Value |
|---|---|
| Type | Reporter |
| Opcode | `cameraProfileJson` |
| `CAMERA_ID` | String, default: `default` |

### `camera profile error`

Returns the code of the last rejected profile document, or an empty string when the last one was accepted.

| Property | Value |
|---|---|
| Type | Reporter |
| Opcode | `cameraProfileError` |

### `camera profile error detail`

Returns why the last profile document was rejected, naming the member at fault.

| Property | Value |
|---|---|
| Type | Reporter |
| Opcode | `cameraProfileErrorDetail` |

### `camera profile compatibility for [CAMERA_ID]`

Returns compatible, incompatible, undetermined, or an empty string when the camera has no profile. Undetermined is a distinct answer from compatible and never resolves upward into it.

| Property | Value |
|---|---|
| Type | Reporter |
| Opcode | `cameraProfileCompatibility` |
| `CAMERA_ID` | String, default: `default` |

### `camera profile compatibility detail for [CAMERA_ID]`

Returns the findings that decided the verdict, so an operator sees the one thing that has to change.

| Property | Value |
|---|---|
| Type | Reporter |
| Opcode | `cameraProfileCompatibilityDetail` |
| `CAMERA_ID` | String, default: `default` |

### `camera profile adaptation for [CAMERA_ID]`

Returns exact, scaled, or unavailable. A frame size that differs by a pure scale can be projected with scaled intrinsics; a crop or an aspect change cannot, because the principal point cannot be placed.

| Property | Value |
|---|---|
| Type | Reporter |
| Opcode | `cameraProfileAdaptation` |
| `CAMERA_ID` | String, default: `default` |

### `camera intrinsics JSON for [CAMERA_ID]`

Returns the intrinsics to project the current frames with, already adapted to the frame size, or an empty string when they cannot be established. Consumers use this rather than scaling a profile themselves, because only this extension can tell a scale from a crop.

| Property | Value |
|---|---|
| Type | Reporter |
| Opcode | `cameraProfileIntrinsicsJson` |
| `CAMERA_ID` | String, default: `default` |

### `camera conditions JSON for [CAMERA_ID]`

Returns what the track reports about itself: frame size, resize mode, zoom, focus and frame rate. Read only; this extension never changes a shared camera configuration.

| Property | Value |
|---|---|
| Type | Reporter |
| Opcode | `cameraConditionsJson` |
| `CAMERA_ID` | String, default: `default` |

### `camera conditions generation for [CAMERA_ID]`

Returns a number that increases whenever something affecting the geometry changes. A consumer holding a derived result compares this instead of re-checking every condition.

| Property | Value |
|---|---|
| Type | Reporter |
| Opcode | `cameraConditionsGeneration` |
| `CAMERA_ID` | String, default: `default` |

### `save camera profile for [CAMERA_ID] to browser storage`

Saves the profile registered for the camera to this origin's browser storage (IndexedDB) and tells other windows on the same origin. Waits until the write commits. The result becomes `saved`, `no-profile` or `unavailable`.

| Property | Value |
|---|---|
| Type | Command |
| Opcode | `saveCameraProfile` |
| `CAMERA_ID` | String, default: `default` |

### `restore stored camera profile for [CAMERA_ID]`

Registers the newest saved profile that is `compatible` with the camera as configured now, under this camera ID. Fails closed: an `undetermined` or `incompatible` profile is never registered and the current registration is left untouched. The result becomes `restored`, `none`, `incompatible`, `undetermined` or `unavailable`.

| Property | Value |
|---|---|
| Type | Command |
| Opcode | `restoreStoredCameraProfile` |
| `CAMERA_ID` | String, default: `default` |

### `stored camera profile result for [CAMERA_ID]`

Returns the outcome of the last save or restore for the camera ID, or an empty string before either has run.

| Property | Value |
|---|---|
| Type | Reporter |
| Opcode | `storedCameraProfileResult` |
| `CAMERA_ID` | String, default: `default` |

### `stored camera profile detail for [CAMERA_ID]`

Explains the last save or restore: which profile was saved or restored, or why no saved profile fits the camera.

| Property | Value |
|---|---|
| Type | Reporter |
| Opcode | `storedCameraProfileDetail` |
| `CAMERA_ID` | String, default: `default` |

### `stored camera profiles generation`

A counter that increments whenever a profile is saved in this window or another window on the same origin. It is not reset by loading a project.

| Property | Value |
|---|---|
| Type | Reporter |
| Opcode | `storedCameraProfilesGeneration` |

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
  previewFlip: "horizontal",
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
If multiple preview leases share a camera, the preview is turned over while any active preview
lease asks for a flip.

TurboWarp projects can manage the same display path with the `show shared camera ... preview`
and `hide shared camera ... preview` blocks. The show block owns exactly one preview lease per
camera ID. Calling it repeatedly with the same setting is idempotent; changing `PREVIEW_FLIP`
replaces that lease without creating another drawable. `PREVIEW_FLIP` takes `none`, `horizontal`,
`vertical` or `both`, and accepts a reporter so a project can hold the choice in a variable. Hiding the preview releases only the block-owned display lease, so processing
leases held by other blocks or extensions continue running. Stopping the named camera, stopping or
loading a project, and disposing the runtime release the block-owned camera and preview resources.

The frame width and height reporters prefer the dimensions currently delivered by the video
element and fall back to the active track settings before its first frame. The frame-rate reporter
uses the active track setting. All three reporters return `0` when the camera is not running or the
browser does not provide the value.

`frame.element` is the original, unmodified `HTMLVideoElement`, even when the preview is mirrored.
WebGPU and WebCodecs consumers can therefore use that same source without going through the preview
or a CPU canvas, for example with `GPUQueue.copyExternalImageToTexture()` or a short-lived
`VideoFrame`. Consumers own and must close any `VideoFrame` they create.

The display path avoids explicit CPU readback, but it does not promise end-to-end zero-copy:
browser-internal color conversion and GPU transfer may still occur. The preview is private and
noninteractive; it is intended for display, not Scratch touching or color-sensing queries.

### Calibration profiles

This extension owns the contract for intrinsic calibration profiles but never produces one. Chessboard calibration, an operator pasting JSON, and any future calibrator are all just producers of a document that passes validation, and nothing here can tell them apart.

A versioned capability is published for other extensions, always:

```js
const calibration = Scratch.vm.runtime.kubohiroyaCameraSourceCapability.requireVersion(1);
calibration.registerProfile(document);
const assessment = calibration.assessProfile("pose");
```

**A profile says how a camera projects, never where it stands.** Camera pose in a shared world frame belongs to whichever extension solves placement; mixing the two into one document is what made the earlier `twrmc/camera-calibration` format unusable outside the application it came from. Legacy documents can be read, but their pose is dropped rather than republished as a placement.

**Ask for intrinsics rather than scaling a profile yourself.** When the camera delivers a size the calibration was not solved at, the arithmetic depends on what happened: a pure downscale multiplies `fx`, `fy`, `cx` and `cy`, while a crop leaves the focal lengths alone and shifts the principal point instead. Only this extension sees the track's `resizeMode`, so only it can tell the two apart — and if every consumer guesses, they guess differently and the same camera yields different geometry depending on which extension asked. `camera intrinsics JSON` returns numbers already adapted to the current frame, or an empty string when the difference is a crop or an aspect change and the principal point cannot be placed.

**Turning the preview over does not turn the frames over.** `getFrameSource()` reports `previewFlip`, which describes how the stage is drawing the image and nothing else; the frames behind it are always the ones the camera captured. Coordinates picked off a flipped preview must be turned back before they are used with these frames — a solve fed the preview's coordinates converges on a left-right reflected pose and reports a small reprojection error while doing it. `horizontal` is the left-right mirror, matching `cv::flip(…, 1)`, ffmpeg's `hflip` and CSS `scaleX(-1)`; rotation is a separate concern and is deliberately not folded into the same enum.

**Import these declarations rather than re-writing them.** The contract is published as its own
entry point, so a consumer states what it expects and finds out at build time when that changes.

```ts
import {readCameraSourceRuntime} from "@kubohiroya/turbowarp-camera-source/runtime";
import type {CameraFrameSource, CameraLease} from "@kubohiroya/turbowarp-camera-source/runtime";
```

The module holds no logic and pulls in none of the extension. A hand-written copy of an interface
compiles perfectly against nothing: when the shape here changes, the copy keeps type-checking in its
own repository and fails in a browser instead.

**"Cannot tell" is a distinct answer from "fits".** Compatibility is `compatible`, `incompatible` or `undetermined`, and unknown never resolves upward. Intrinsics are withheld unless the profile actually fits the camera as configured now: handing them over regardless would let a consumer project with numbers from a different configuration and get plausible, wrong geometry back.

### Browser storage

A profile can be kept in the browser so the next session, or another window, does not need the file
again. `save camera profile for [CAMERA_ID] to browser storage` writes the registered profile to
IndexedDB (database `kubohiroya-camera-source`, object store `camera-profiles`, keyed by `profileId`)
and announces the save on the `kubohiroya-camera-source:camera-profiles` BroadcastChannel.
`stored camera profiles generation` moves on every save, in this window or any other on the same
origin, so a project waiting for a calibration app in another window watches one number and restores
when it changes.

```text
restore stored camera profile for [pose]
if <(stored camera profile result for [pose]) = [restored]> then
  ... skip lens calibration ...
```

**It is a cache, not a backup.** Storage belongs to one origin in one browser profile, a different
host or port sees none of it, and the browser may evict it. The exported profile file stays the
source of truth; keep it.

**Restoring fails closed.** Candidates are tried newest `calibratedAt` first, each rebound to the
camera ID the block names and judged against that camera as it is configured now. Only a
`compatible` one is registered. `undetermined` — for example because the camera has not delivered a
frame yet — is not a weaker yes, and when nothing qualifies the profile already registered for the
camera is left as it was. The result is `restored`, `none`, `incompatible`, `undetermined` or
`unavailable`; a save reports `saved`, `no-profile` or `unavailable`.

`register camera profile [PROFILE_JSON] as [CAMERA_ID]` does the same rebinding for a file: a profile
solved under `default` in a calibration app can be registered as `pose` in the app that uses it.

## Compatibility

Version 0.10.0 adds browser storage for calibration profiles and `register camera profile as`. No
existing block or capability member changes.

Unreleased changes are breaking. `CameraFrameSource.mirrored` is replaced by `previewFlip`, which
names the axis and says that it describes the drawing rather than the pixels. The preview block's
`MIRRORED` argument is replaced by `PREVIEW_FLIP` and the boolean is no longer read. `acquireCamera`
takes `previewFlip` and no longer accepts `mirrored`. Consumers holding a hand-written copy of the
frame source interface should move to the published `./runtime` entry point, which would have caught
this at build time.

Version 0.6.0 exposes per-camera failure details and treats inactive or ended video tracks as
stopped. Existing camera IDs, lease ownership, and preview behavior remain unchanged.

Version 0.5.0 exposes GPU-backed preview visibility, mirroring, and actual frame width, height,
and rate as TurboWarp blocks. The default behavior remains unchanged.

Version 0.4.0 adds the opt-in GPU-backed video preview without changing the extension ID,
block opcodes, camera lease ownership, device selection, or release semantics. Consumers that do
not request `preview: true` retain the existing camera-source behavior.

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
