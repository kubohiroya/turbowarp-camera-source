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
https://cdn.jsdelivr.net/npm/@kubohiroya/turbowarp-camera-source@0.6.0/dist/camera-source.js
```

npm hostでは次を使います。

```bash
pnpm add @kubohiroya/turbowarp-camera-source@0.6.0
```

## Quick start

カメラストリームには役割名を使います。同じ`cameraId`を使うconsumerは1つのカメラを共有し、異なる名前は別デバイスへ割り当てられます。

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

## ブロック一覧

- `start shared camera [CAMERA_ID] with device ID [DEVICE_ID]`: 名前付き共有カメラを開始します。
- `stop shared camera [CAMERA_ID]`: 名前付き共有カメラを停止し、MediaStreamTrackを解放します。
- `shared camera [CAMERA_ID] is running?`: 指定した共有カメラが起動中かを返します。
- `shared camera [CAMERA_ID] error code`: 直近の開始失敗コードを返します。開始成功後は空文字列です。
- `shared camera [CAMERA_ID] error`: 直近の開始失敗メッセージを返します。開始成功後は空文字列です。
- `shared camera [CAMERA_ID] device ID`: 指定した共有カメラのdevice IDを返します。
- `show shared camera [CAMERA_ID] preview mirrored [MIRRORED]`: GPU-backed stage previewを表示します。
- `hide shared camera [CAMERA_ID] preview`: ブロックが所有するpreview leaseだけを解放して非表示にします。
- `shared camera [CAMERA_ID] frame width`: 実際のframe幅をpixel単位で返します。
- `shared camera [CAMERA_ID] frame height`: 実際のframe高さをpixel単位で返します。
- `shared camera [CAMERA_ID] frame rate`: 有効なvideo trackのframe rateを返します。
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
await previewLease.release();
await qrLease.release();
await poseLease.release();
```

`preview: true`を指定したleaseは、GPU-backed stage previewを利用します。専用video skinは共有
`HTMLVideoElement`を`texImage2D(video)`でアップロードし、preview drawableのX scaleで左右反転します。
`drawImage()`、`getImageData()`、CPUでのフレームピクセル走査は行いません。既定値は`false`で、同じ
カメラの最後のpreview leaseが解放されるまで表示を維持します。
複数のpreview leaseが同じカメラを共有する場合、1つ以上の有効なleaseが`mirrored: true`を要求している間は
previewを左右反転します。

TurboWarp作品からは`show shared camera ... preview`と`hide shared camera ... preview`ブロックで同じ
表示経路を操作できます。showブロックが所有するpreview leaseはcamera IDごとに1つだけです。同じ設定で
繰り返し実行してもleaseやdrawableは増えず、`MIRRORED`を変更した場合は既存camera sessionを維持したまま
leaseを置換します。`MIRRORED`には`true`または`false`など、TurboWarpがbooleanとして解釈できる値を指定します。
hideはブロック所有の表示leaseだけを解放するため、ほかのブロックや拡張が所有する処理用leaseは継続します。
名前付きcameraの停止、作品の停止・再読込、runtime disposeではブロック所有resourceをすべて解放します。

frame widthとheightは、video elementが現在受信している寸法を優先し、最初のframeより前はvideo track設定を
fallbackとして使います。frame rateは有効なvideo track設定を返します。cameraが未起動の場合、またはブラウザが
値を提供しない場合、これら3つのreporterは`0`を返します。

`frame.element`はpreviewを左右反転した場合も未加工の`HTMLVideoElement`です。そのためWebGPUや
WebCodecsのconsumerは、CPU canvasやpreviewを経由せず、同じsourceを
`GPUQueue.copyExternalImageToTexture()`や短時間だけ保持する`VideoFrame`へ渡せます。consumerが生成した
`VideoFrame`はconsumer自身が`close()`する必要があります。

この表示経路は明示的なCPU readbackを避けますが、end-to-endの完全なzero-copyは保証しません。ブラウザ内部の
色変換やGPU転送が発生する可能性があります。またpreviewはprivateかつnoninteractiveで、表示専用です。
Scratchのtouchingまたはcolor sensing用の画像sourceとしては扱いません。

`cameraId`は`pose`や`qr`のような作品内の役割名です。`deviceId`を指定すると、その役割をブラウザが公開する特定のカメラデバイスへ割り当てられます。各カメラは最後のleaseが解放されるまで維持されます。

### 校正プロファイル

内部校正プロファイルの契約は本拡張が持つが、**プロファイルを作ることはしない**。チェスボード校正も、操作者が貼り付けたJSONも、将来の別方式も、検証を通る文書の生産者というだけで、ここからは区別できない。

この面は`config/feature-flags.ts`の起動時固定フラグで囲ってあり、**既定はOFF**。カメラ取得とpreviewはどちらでも変わらない。

```js
globalThis.__TWCS_FEATURE_FLAGS__ = {calibrationProfilesV1: true};
```

**プロファイルはカメラの投影の仕方を述べるもので、どこに立っているかは述べない。** 共通world座標での姿勢は配置を解く拡張の責務で、両者を1つの文書に混ぜたことが、従来の`twrmc/camera-calibration`形式を出自のアプリ以外で使えなくしていた。旧文書は読めるが、その姿勢は配置として再公開せずに捨てる。

**プロファイルを自分でスケールせず、内部行列を要求すること。** 校正時と違う解像度で届く場合、必要な計算は何が起きたかで変わる。単純な縮小なら`fx`・`fy`・`cx`・`cy`を比率倍するが、cropなら焦点距離はそのままで主点が平行移動する。trackの`resizeMode`を見られるのは本拡張だけなので、両者を区別できるのも本拡張だけ。**利用側がそれぞれ推測すれば、それぞれ違う推測をし、同じカメラがどの拡張から尋ねたかで違う幾何を返すことになる。** `camera intrinsics JSON`は現在のフレームに適合済みの数値を返し、cropやアスペクト変更で主点を置けない場合は空文字を返す。

**「判定できない」は「適合する」とは別の答え。** 適合性は`compatible`／`incompatible`／`undetermined`の3値で、不明が`compatible`へ格上げされることはない。プロファイルが現在の構成に適合していない限り内部行列は渡さない。渡してしまえば、利用側は別の構成の数値で投影し、**もっともらしく間違った幾何**を得ることになる。

## 互換性

0.6.0ではcamera IDごとの開始失敗情報を公開し、inactive streamまたは終了したvideo trackを停止状態として
扱います。既存のcamera ID、lease ownership、preview動作は変更しません。

0.5.0ではGPU-backed previewの表示・非表示・mirror設定と、実際のframe width／height／rateを
TurboWarpブロックとして公開します。既定動作は変更しません。

0.4.0ではopt-inのGPU-backed video previewを追加します。Extension ID、ブロックopcode、camera lease
ownership、device selection、release semanticsは変更しません。`preview: true`を指定しないconsumerは、
従来のcamera-source動作を維持します。

## 開発

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm run check
```

GitHub Pages用の静的サイトは`docs/`にあり、英語版は`docs/index.html`、日本語版は`docs/ja/index.html`です。

## ライセンス

SPDX-License-Identifier: MPL-2.0
