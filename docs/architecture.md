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
