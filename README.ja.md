# Camera Source

[English](README.md)

Camera Sourceは、MediaDevicesのカメラストリームを複数のTurboWarp拡張で共有するためのcapability拡張です。leaseで起動と停止を管理し、TMPose、QR読み取り、将来の画像入力が同じ物理カメラに対して競合する`getUserMedia()`を開始しないようにします。

**[English guide](https://kubohiroya.github.io/turbowarp-camera-source/)** ·
**[日本語ガイド](https://kubohiroya.github.io/turbowarp-camera-source/ja/)**

## ブロック

- `start shared camera`: 共有カメラストリームを開始します。
- `stop shared camera`: 共有カメラストリームを停止し、MediaStreamTrackを解放します。
- `shared camera is running?`: 共有カメラが起動中かを返します。
- `shared camera device ID`: 利用中のカメラdevice IDを返します。

## Runtime API

他のunsandboxed拡張は`Scratch.vm.runtime.ext_kubohiroyacamerasource`を参照できます。

```js
const lease = await cameraSource.acquireCamera({owner: 'my-extension'});
const frame = lease.getFrameSource();
await lease.release();
```

`frame.element`は`HTMLVideoElement`です。最後のleaseが解放されるまでストリームは維持されます。

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
