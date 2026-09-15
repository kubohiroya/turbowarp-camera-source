# Architecture

[日本語](architecture.ja.md)

## Build outputs

The project keeps runtime behavior and compatibility metadata separate while generating both from
the same checked-in source definitions.

```text
src/index.ts + src/extension.ts
  -> vite-plugin-turbowarp-extension
  -> dist/<extension>.js

src/config.ts + src/block-definitions.json
  -> extension-api-manifest Vite plugin
  -> dist/extension-manifest.json
```

The manifest plugin runs in Vite's post-build phase. This preserves the JavaScript plugin's
single-output validation and adds the manifest only after the TurboWarp bundle is complete.

## Extension API manifest v1

`schemas/extension-manifest.schema.json` is the normative JSON Schema. `formatVersion` is `1` and
must change when an incompatible manifest shape is introduced.

The v1 contract contains:

- the TurboWarp extension ID;
- each block opcode and block type;
- each argument ID, argument type, and optional menu reference;
- each menu ID and whether it accepts reporter blocks.

Blocks, arguments, and menus are sorted by their identifiers before serialization. Text,
descriptions, default values, and static menu items are intentionally excluded because they do not
identify saved-project API references. A compatibility checker can therefore distinguish API
changes from documentation or localization changes.

## Drift detection

`dist/` is committed as a release artifact. `pnpm run check:dist` rebuilds both files and fails when
Git reports any modified, deleted, or untracked file below `dist/`. This catches manifest and bundle
drift in local checks and CI.

## Camera frame paths

One camera session owns one `MediaStream` and one unmodified `HTMLVideoElement`. Leases share that
element and independently opt into the display path.

```text
MediaStream -> HTMLVideoElement -> VideoSkin -> texImage2D(video) -> WebGL texture
                              \-> HTMLVideoElement / VideoFrame -> WebGPU or vision consumer
```

The display skin receives video-frame notifications, reuses one WebGL texture, and requests a stage
redraw only for a new frame. Mirroring is a negative X scale on the preview drawable, so it does not
modify the source used by WebGPU, WebCodecs, pose recognition, or QR recognition. The drawable is
private and noninteractive, allowing the skin to omit CPU silhouette updates and video-pixel
readback.

This removes explicit `drawImage()`, `getImageData()`, and CPU pixel scanning from the preview path.
It does not guarantee browser-internal zero-copy because decoding, color conversion, and texture
transfer are implementation-dependent.

## Block-owned preview lifecycle

The show-preview block holds one dedicated preview lease per camera ID. Repeating the block with
the same mirror setting is a no-op. A mirror-setting change acquires the replacement before
releasing the old lease, which keeps the shared session and drawable alive. The hide-preview block
releases only this facade-owned lease; unrelated processing leases retain ownership.

`stopSharedCamera()` tears down every lease for the named session. `PROJECT_STOP_ALL`,
`PROJECT_LOADED`, and `RUNTIME_DISPOSED` tear down all sessions so a stopped or replaced project
cannot leave camera tracks, textures, skins, or drawables alive. Preview remains opt-in: no renderer
API is touched until either a runtime consumer requests `preview: true` or a project runs the
show-preview block.

## Calibration profile contract

This extension owns the contract for intrinsic calibration profiles and produces none of them.
Chessboard calibration, an operator pasting JSON, a file kept from a previous venue — from here each
is a producer handing over a document, and the only thing that decides whether it is kept is whether
it passes validation. Naming a particular extension would undo the split that keeps this package
free of a solver: the solver carries OpenCV, and `opencv.js` alone is 10.4 MB against this bundle's
tens of kilobytes. `pnpm run check:dist` fails if a solver's identifiers ever appear in the bundle.

A profile says how a camera projects, never where it stands. The world pose the earlier
`twrmc/camera-calibration` format carried was the extrinsic of whichever calibration sample happened
to be last; reading it as a placement in a shared world frame puts a camera somewhere it has never
been. Documents in that format are still accepted, and that pose is dropped rather than republished.

Three questions are answered separately, because they fail separately.

| Question | Answer |
|---|---|
| Does this profile describe this camera as configured now? | `compatible` / `incompatible` / `undetermined` |
| Can the stored numbers be expressed for this frame size? | `exact` / `scaled` / `unavailable` |
| May a consumer project with them? | the `usable` intrinsics, or nothing |

`undetermined` never resolves upward into `compatible`, and intrinsics are withheld unless both of
the first two answers allow it. Handing them over regardless lets a consumer project with numbers
from another configuration, and the geometry that comes back reads as a slightly different camera
pose rather than as a mistake.

A camera nobody has calibrated is an ordinary state. `assessProfile` and `profileFor` report it as
absence, not as a failure: the safe reading of a failure is to stop, which is the wrong response.

The whole surface sits behind a startup-fixed flag and is off by default. Camera acquisition and
preview are unaffected either way.

## Published runtime contract

`./runtime` is a separate entry point carrying the declarations a sharing consumer needs, and no
logic. A consumer that re-declares `CameraFrameSource` or `CameraLease` by hand compiles perfectly
against nothing: when the shape here changes, the copy keeps type-checking in its own repository and
fails in a browser instead. Importing the published declarations moves that failure to the
consumer's build, which is the only place it is cheap.
