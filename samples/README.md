# 最小デモ / Minimal sample

[TurboWarp Editor](https://turbowarp.org/editor?project_url=https%3A%2F%2Fkubohiroya.github.io%2Fturbowarp-camera-source%2Fsamples%2Fcamera-preview-and-size.sb3) / [SB3](https://kubohiroya.github.io/turbowarp-camera-source/samples/camera-preview-and-size.sb3)

## このデモ / This sample

`startSharedCamera` → `showCameraPreview` をStartボタンから呼び、`isCameraRunning`・`cameraFrameWidth`・`cameraFrameHeight`・`cameraErrorCode`を表示します。初期値はfalse、0、0、空文字です。Stopは`hideCameraPreview`・`stopSharedCamera`を使います。画像のアップロードはありません。

Start uses the real acquisition and preview blocks; reporters show actual running state and dimensions. Stop releases preview and camera. Images are not uploaded.

## 操作 / Operation

1. Editorで同梱拡張それぞれの **Run without sandbox** を選び **Allow** します。緑旗ではカメラも音声も起動しません。
2. **Start** をクリックするとカメラ許可を求めます。許可後は共有カメラのプレビューと実際の幅・高さを表示します。エラーならCamera errorを確認します。
3. **Stop** でプレビューとカメラleaseを解放します。Editorの停止ボタンでもCamera Sourceはカメラを解放します。拒否した場合はブラウザのサイト設定を確認し、再読み込みしてください。

Allow each embedded extension to run without sandbox. Green flag reads status only. **Start** deliberately requests a camera; **Stop** releases it. A rejected permission is shown in Camera error. The Editor stop button also releases Camera Source's camera. No audio blocks are included.

## 要件と未検証範囲 / Requirements and unverified scope

- HTTPS対応ブラウザ、物理カメラ、カメラ許可、TurboWarpのunsandboxed実行が必要です。
- 自動検証は無音で、実カメラを起動せず、公開ファイル・通常の許可画面・初期のfalse/0/空エラー・未起動での停止・停止後の再実行だけを確認します。
- **実機での取得、プレビューの向き・解像度、USB機器の相性、権限拒否後のOS/browserごとの復旧、認識・校正の成功は未検証です。** 観測していない値を成功値として表示しません。

A physical camera, permission, HTTPS and unsandboxed execution are required. Silent automated checks cover delivery, consent, idle reporters, stopping before acquisition and rerunning. Physical capture, preview orientation/resolution, device compatibility, OS permission recovery, recognition and calibration success are unverified.

## 再生成 / Maintenance

`manifest.json` に配信先、拡張ID、依存bundleのSHA256、期待値を記録します。`project.json` と自作SVGを編集し、`.nvmrc` のNode.jsで以下を実行してください。

```bash
node scripts/build-samples.mjs
node scripts/build-samples.mjs --check
node --test scripts/verify-samples.mjs
node scripts/prepare-pages.mjs
```

SB3は追加依存なしで決定的に生成しコミットします。unsandboxed bundleはSB3へ同梱します。Pagesは既存docs、dist、SB3、印刷素材を`_site`へまとめます。本体の既定フラグは変更しません。切戻しはPRをrevertしPagesを再配信します。
