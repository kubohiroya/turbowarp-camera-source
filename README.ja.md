# Camera Source

[English](README.md)

Camera Sourceは、MediaDevicesのカメラストリームを名前付きで複数のTurboWarp拡張へ共有するcapability拡張です。leaseで起動と停止を管理し、TMPose、QR読み取り、将来の画像入力が同じ物理カメラを共有する場合も、姿勢認識用とQR/画像認識用で別カメラを使う場合も、`getUserMedia()`の競合を避けます。

**[English guide](https://kubohiroya.github.io/turbowarp-camera-source/)** ·
**[日本語ガイド](https://kubohiroya.github.io/turbowarp-camera-source/ja/)**

## ブロック

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
  owner: 'tmpose',
  cameraId: 'pose',
  deviceId: poseDeviceId
});
const qrLease = await cameraSource.acquireCamera({
  owner: 'jsqr',
  cameraId: 'qr',
  deviceId: qrDeviceId
});
const frame = qrLease.getFrameSource();
await qrLease.release();
await poseLease.release();
```

`cameraId`は`pose`や`qr`のような作品内の役割名です。`deviceId`を指定すると、その役割をブラウザが公開する特定のカメラデバイスへ割り当てられます。`frame.element`は`HTMLVideoElement`です。各カメラは最後のleaseが解放されるまで維持されます。

## 要件

- TurboWarpの「Run extension without sandbox」
- HTTPSまたはlocalhostなどの安全なコンテキスト
- ブラウザのカメラ許可

Camera Sourceはカメラフレームをアップロードせず、画像を保存しません。

## 開発

```bash
pnpm install
pnpm check
```

GitHub Pages用の静的サイトは`docs/`にあり、英語版は`docs/index.html`、日本語版は`docs/ja/index.html`です。

## ライセンス

MPL-2.0
