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
https://cdn.jsdelivr.net/npm/@kubohiroya/turbowarp-camera-source@0.10.0/dist/camera-source.js
```

npm hostでは次を使います。

```bash
pnpm add @kubohiroya/turbowarp-camera-source@0.10.0
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

<!-- BEGIN GENERATED BLOCKS -->

- `start shared camera [CAMERA_ID] with device ID [DEVICE_ID]`: 名前付き共有カメラを開始します。
- `stop shared camera [CAMERA_ID]`: 名前付き共有カメラを停止し、MediaStreamTrackを解放します。
- `shared camera [CAMERA_ID] is running?`: 指定した共有カメラが起動中かを返します。
- `shared camera [CAMERA_ID] error code`: 直近の開始失敗コードを返します。開始成功後は空文字列です。
- `shared camera [CAMERA_ID] error`: 直近の開始失敗メッセージを返します。開始成功後は空文字列です。
- `shared camera [CAMERA_ID] device ID`: 指定した共有カメラのdevice IDを返します。
- `show shared camera [CAMERA_ID] preview flipped [PREVIEW_FLIP]`: GPU-backed stage previewを表示します。`none`／`horizontal`／`vertical`／`both`から選び、reporterも渡せます。
- `hide shared camera [CAMERA_ID] preview`: ブロックが所有するpreview leaseだけを解放して非表示にします。
- `shared camera [CAMERA_ID] frame width`: 実際のframe幅をpixel単位で返します。
- `shared camera [CAMERA_ID] frame height`: 実際のframe高さをpixel単位で返します。
- `shared camera [CAMERA_ID] frame rate`: 有効なvideo trackのframe rateを返します。
- `refresh camera devices`: カメラデバイス一覧を更新します。
- `camera device count`: 更新済みカメラデバイス数を返します。
- `camera device ID at [INDEX]`: 1始まりの位置でカメラdevice IDを返します。
- `camera device label at [INDEX]`: 1始まりの位置でカメララベルを返します。
- `register camera profile [PROFILE_JSON]`: 内部校正プロファイルを検証して登録します。現行の`twcs/camera-intrinsics`と、旧`twrmc/camera-calibration`のどちらの文書も受け取ります。
- `register camera profile [PROFILE_JSON] as [CAMERA_ID]`: 文書が持つcamera IDを指定したIDへ置き換えてから検証し、登録します。校正アプリで`default`として解いたプロファイルを`pose`として使う場合などに使います。camera profile errorの扱いは通常の登録ブロックと同じです。
- `forget camera profile for [CAMERA_ID]`: 登録済みプロファイルを破棄します。
- `camera [CAMERA_ID] is calibrated?`: プロファイルが登録されているかを返します。未登録は正常な状態です。
- `camera profile JSON for [CAMERA_ID]`: 保存された文書をそのまま返します。表示や書き出し用であって、投影に使う数値ではありません。
- `camera profile error`: 直近の登録失敗のコードを返します。成功後は空文字列です。
- `camera profile error detail`: 直近の登録失敗の位置と理由を返します。
- `camera profile compatibility for [CAMERA_ID]`: `compatible`／`incompatible`／`undetermined`を返します。
- `camera profile compatibility detail for [CAMERA_ID]`: 判定を決めた項目の理由を返します。
- `camera profile adaptation for [CAMERA_ID]`: 現在のフレームサイズへ読み替えられたか（`exact`／`scaled`／`unavailable`）を返します。
- `camera intrinsics JSON for [CAMERA_ID]`: 現在のフレームに適合済みの内部行列を返します。適合していなければ空文字列です。
- `camera conditions JSON for [CAMERA_ID]`: カメラが今報告している撮影条件を返します。
- `camera conditions generation for [CAMERA_ID]`: 幾何に影響する条件が変わるたびに増える整数を返します。frame rateでは動きません。
- `save camera profile for [CAMERA_ID] to browser storage`: そのカメラに登録済みのプロファイルを、このoriginのブラウザストレージ（IndexedDB）へ保存し、同じoriginの他ウィンドウへ通知します。書き込み完了まで待ちます。結果は`saved`／`no-profile`／`unavailable`です。
- `restore stored camera profile for [CAMERA_ID]`: 保存済みプロファイルのうち、現在のカメラ構成に`compatible`な最新のものをこのcamera IDで登録します。fail closedで、`undetermined`や`incompatible`なものは登録せず、既存の登録にも触れません。結果は`restored`／`none`／`incompatible`／`undetermined`／`unavailable`です。
- `stored camera profile result for [CAMERA_ID]`: そのcamera IDで直近に行った保存または復元の結果を返します。未実行なら空文字列です。
- `stored camera profile detail for [CAMERA_ID]`: 直近の保存・復元の説明を返します。保存・復元したプロファイル、またはどの保存済みプロファイルもカメラに適合しない理由です。
- `stored camera profiles generation`: このウィンドウまたは同じoriginの他ウィンドウでプロファイルが保存されるたびに増えるカウンタです。プロジェクトを読み込んでも戻りません。

<!-- END GENERATED BLOCKS -->

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

**プロファイルはカメラの投影の仕方を述べるもので、どこに立っているかは述べない。** 共通world座標での姿勢は配置を解く拡張の責務で、両者を1つの文書に混ぜたことが、従来の`twrmc/camera-calibration`形式を出自のアプリ以外で使えなくしていた。旧文書は読めるが、その姿勢は配置として再公開せずに捨てる。

**プロファイルを自分でスケールせず、内部行列を要求すること。** 校正時と違う解像度で届く場合、必要な計算は何が起きたかで変わる。単純な縮小なら`fx`・`fy`・`cx`・`cy`を比率倍するが、cropなら焦点距離はそのままで主点が平行移動する。trackの`resizeMode`を見られるのは本拡張だけなので、両者を区別できるのも本拡張だけ。**利用側がそれぞれ推測すれば、それぞれ違う推測をし、同じカメラがどの拡張から尋ねたかで違う幾何を返すことになる。** `camera intrinsics JSON`は現在のフレームに適合済みの数値を返し、cropやアスペクト変更で主点を置けない場合は空文字を返す。

**previewを反転してもフレームは反転しない。** `getFrameSource()`が返す`previewFlip`は、stageがどう描いているかだけを述べる。その裏にあるフレームは常にカメラが撮ったままである。**反転表示したpreview上で拾った座標は、これらのフレームと使う前に戻さなければならない** — previewの座標をそのままsolveへ渡すと、左右反転した姿勢に収束し、しかも再投影誤差は小さいまま出る。`horizontal`は左右反転で、`cv::flip(…, 1)`・ffmpegの`hflip`・CSSの`scaleX(-1)`と同じ。回転は別の関心事なので、同じenumには混ぜていない。

**契約は書き写さずimportすること。** 型は専用のentry pointとして公開してある。

```ts
import {readCameraSourceRuntime} from "@kubohiroya/turbowarp-camera-source/runtime";
import type {CameraFrameSource, CameraLease} from "@kubohiroya/turbowarp-camera-source/runtime";
```

このmoduleはlogicを持たず拡張本体を引き込まない。手書きの写しは何とも照合されないので、こちらの形が変わっても利用側のリポジトリでは型検査が通り続け、ブラウザで実行したときに壊れる。

**「判定できない」は「適合する」とは別の答え。** 適合性は`compatible`／`incompatible`／`undetermined`の3値で、不明が`compatible`へ格上げされることはない。プロファイルが現在の構成に適合していない限り内部行列は渡さない。渡してしまえば、利用側は別の構成の数値で投影し、**もっともらしく間違った幾何**を得ることになる。

### ブラウザストレージ

プロファイルはブラウザ内に保持でき、次の作業や別ウィンドウでファイルを読み直さずに済む。`save camera profile for [CAMERA_ID] to browser storage`は登録済みプロファイルをIndexedDB（データベース`kubohiroya-camera-source`、object store`camera-profiles`、キーは`profileId`）へ書き込み、BroadcastChannel`kubohiroya-camera-source:camera-profiles`で保存を知らせる。`stored camera profiles generation`は、このウィンドウでも同じoriginの別ウィンドウでも保存のたびに増えるので、別ウィンドウの校正アプリを待つ作品はこの整数だけを見て、動いたら復元すればよい。

```text
restore stored camera profile for [pose]
if <(stored camera profile result for [pose]) = [restored]> then
  ... レンズ校正を省略 ...
```

**これはキャッシュであってバックアップではない。** ストレージは1つのブラウザプロファイルの1つのoriginに属し、ホストやポートが違えば見えず、ブラウザが消すこともある。**書き出したプロファイルファイルが正本**なので、そちらを残しておくこと。

**復元はfail closedである。** 候補は`calibratedAt`の新しい順に、ブロックで指定したcamera IDへ付け替えたうえで、そのカメラの現在の構成と照合する。登録するのは`compatible`なものだけ。`undetermined`（たとえばカメラがまだフレームを届けていない）は弱いyesではなく、該当がなければそのカメラに登録済みのプロファイルはそのまま残る。結果は`restored`／`none`／`incompatible`／`undetermined`／`unavailable`、保存は`saved`／`no-profile`／`unavailable`を返す。

`register camera profile [PROFILE_JSON] as [CAMERA_ID]`はファイルに対して同じ付け替えを行う。校正アプリで`default`として解いたプロファイルを、利用側の作品で`pose`として登録できる。

## 互換性

0.10.0では校正プロファイルのブラウザストレージと`register camera profile as`を追加した。既存のブロックとcapabilityのメンバーは変えていない。

未リリースの変更は破壊的である。`CameraFrameSource.mirrored`は`previewFlip`へ置き換えた。軸を名指しでき、かつ「描画の話であって画素の話ではない」と言えるためである。previewブロックの`MIRRORED`引数は`PREVIEW_FLIP`へ置き換え、booleanはもう読まない。`acquireCamera`は`previewFlip`を受け取り、`mirrored`は受け付けない。frame sourceのinterfaceを手書きで持っている利用側は、公開した`./runtime`のimportへ移ること。そうしていればこの変更はビルド時に分かった。

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
