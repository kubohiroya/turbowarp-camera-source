# TurboWarp-Camera-Source

[English](README.md) | **日本語**

TurboWarp-Camera-Sourceは、MediaDevicesのカメラストリームを名前付きで複数のTurboWarp拡張へ共有するcapability拡張です。leaseで起動と停止を管理し、TM、QR読み取り、将来の画像入力が同じ物理カメラを共有する場合も、姿勢認識用とQR/画像認識用で別カメラを使う場合も、`getUserMedia()`の競合を避けます。

**[English guide](https://kubohiroya.github.io/turbowarp-camera-source/)** ·
**[日本語ガイド](https://kubohiroya.github.io/turbowarp-camera-source/ja/)**

## できること

- `pose`、`qr`、`default`などの名前付きカメラストリームを開始・停止します。
- 1つのライブ`HTMLVideoElement`フレームソースを複数のunsandboxed consumerで共有します。
- 最後のleaseが解放されるまで各ストリームを維持します。
- ブラウザのカメラ許可後にデバイス一覧を取得します。

## 要件と安全性

- TurboWarpの「Run extension without sandbox」
- HTTPSまたはlocalhostなどの安全なコンテキスト
- ブラウザのカメラ許可
- Camera Sourceはカメラフレームをアップロードせず、画像を保存しません。

## インストール

次のURLをunsandboxed custom extensionとして読み込みます。

```text
https://cdn.jsdelivr.net/npm/@kubohiroya/turbowarp-camera-source@0.3.0/dist/camera-source.js
```

npm hostでは次を使います。

```bash
pnpm add @kubohiroya/turbowarp-camera-source@0.3.0
```

## Quick start

カメラストリームには役割名を使います。同じ`cameraId`を使うconsumerは1つのカメラを共有し、異なる名前は別デバイスへ割り当てられます。

```text
start shared camera [pose] with device ID []
start shared camera [qr] with device ID []
shared camera [pose] is running?
stop shared camera [pose]
```

## ブロック一覧

- `start shared camera [CAMERA_ID] with device ID [DEVICE_ID]`: 名前付き共有カメラを開始します。
- `stop shared camera [CAMERA_ID]`: 名前付き共有カメラを停止し、MediaStreamTrackを解放します。
- `shared camera [CAMERA_ID] is running?`: 指定した共有カメラが起動中かを返します。
- `shared camera [CAMERA_ID] device ID`: 指定した共有カメラのdevice IDを返します。
- `refresh camera devices`: カメラデバイス一覧を更新します。
- `camera device count`: 更新済みカメラデバイス数を返します。
- `camera device ID at [INDEX]`: 1始まりの位置でカメラdevice IDを返します。
- `camera device label at [INDEX]`: 1始まりの位置でカメララベルを返します。

## Runtime API

他のunsandboxed拡張は`Scratch.vm.runtime.ext_kubohiroyacamerasource`を参照できます。

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
await qrLease.release();
await poseLease.release();
```

`preview: true`を指定したleaseは、GPU-backed stage previewを利用します。専用video skinは共有
`HTMLVideoElement`を`texImage2D(video)`でアップロードし、preview drawableのX scaleで左右反転します。
`drawImage()`、`getImageData()`、CPUでのフレームピクセル走査は行いません。既定値は`false`で、同じ
カメラの最後のpreview leaseが解放されるまで表示を維持します。

`frame.element`はpreviewを左右反転した場合も未加工の`HTMLVideoElement`です。そのためWebGPUや
WebCodecsのconsumerは、CPU canvasやpreviewを経由せず、同じsourceを
`GPUQueue.copyExternalImageToTexture()`や短時間だけ保持する`VideoFrame`へ渡せます。consumerが生成した
`VideoFrame`はconsumer自身が`close()`する必要があります。

この表示経路は明示的なCPU readbackを避けますが、end-to-endの完全なzero-copyは保証しません。ブラウザ内部の
色変換やGPU転送が発生する可能性があります。またpreviewはprivateかつnoninteractiveで、表示専用です。
Scratchのtouchingまたはcolor sensing用の画像sourceとしては扱いません。

`cameraId`は`pose`や`qr`のような作品内の役割名です。`deviceId`を指定すると、その役割をブラウザが公開する特定のカメラデバイスへ割り当てられます。各カメラは最後のleaseが解放されるまで維持されます。

## 互換性

Extension IDは`kubohiroyacamerasource`のままです。ブロックopcode、camera lease ownership、device selection、release semanticsは0.2.0でも変更しません。

## 開発

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm run check
```

GitHub Pages用の静的サイトは`docs/`にあり、英語版は`docs/index.html`、日本語版は`docs/ja/index.html`です。

## ライセンス

SPDX-License-Identifier: MPL-2.0
