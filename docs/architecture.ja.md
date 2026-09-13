# アーキテクチャ

[English](architecture.md)

## ビルド出力

このプロジェクトは実行時の動作と互換性メタデータを分離し、リポジトリに保存された同じソース定義から両方を生成します。

```text
src/index.ts + src/extension.ts
  -> vite-plugin-turbowarp-extension
  -> dist/<extension>.js

src/config.ts + src/block-definitions.json
  -> extension-api-manifest Viteプラグイン
  -> dist/extension-manifest.json
```

manifestプラグインはViteのビルド後フェーズで実行されます。これにより、JavaScriptプラグインの単一出力検証を維持しながら、TurboWarpバンドルの完成後にだけmanifestを追加します。

## 拡張機能API manifest v1

`schemas/extension-manifest.schema.json`が規範となるJSON Schemaです。`formatVersion`は`1`で、互換性のないmanifest形式を導入するときに変更する必要があります。

v1契約は次の情報を含みます。

- TurboWarp拡張機能のID
- 各ブロックのopcodeとブロック種類
- 各引数のID、引数種類、任意のメニュー参照
- 各メニューのIDとReporterブロックを受け付けるかどうか

ブロック、引数、メニューは、シリアライズ前に識別子で並べ替えられます。テキスト、説明、既定値、静的メニュー項目は、保存済みプロジェクトのAPI参照を識別しないため、意図的に除外しています。そのため互換性チェッカーは、API変更とドキュメントまたはローカライズの変更を区別できます。

## 差分の検出

`dist/`はリリース成果物としてコミットされます。`pnpm run check:dist`は両方のファイルを再ビルドし、`dist/`配下に変更、削除、未追跡ファイルがある場合に失敗します。これにより、ローカル検証とCIの両方でmanifestとバンドルの差分を検出できます。

## カメラフレーム経路

1つのcamera sessionが1つの`MediaStream`と未加工の`HTMLVideoElement`を所有します。leaseはそのelementを共有し、表示経路だけを個別にopt-inします。

```text
MediaStream -> HTMLVideoElement -> VideoSkin -> texImage2D(video) -> WebGL texture
                              \-> HTMLVideoElement / VideoFrame -> WebGPU・vision consumer
```

表示skinはvideo frame通知を受け、1つのWebGL textureを再利用し、新しいframeがある場合だけstageの再描画を要求します。左右反転はpreview drawableの負のX scaleで行うため、WebGPU、WebCodecs、姿勢認識、QR認識が使うsourceは変更されません。drawableはprivateかつnoninteractiveであり、skinはCPU silhouette更新とvideo pixelのreadbackを省略します。

これによりpreview経路から明示的な`drawImage()`、`getImageData()`、CPU pixel走査を除去します。ただしdecode、色変換、texture転送はブラウザ実装に依存するため、ブラウザ内部まで含むzero-copyは保証しません。

## ブロック所有previewのlifecycle

preview表示ブロックはcamera IDごとに専用preview leaseを1つだけ保持します。同じ左右反転設定での再実行は
何も行いません。左右反転設定を変更するときは置換leaseを先に取得してから古いleaseを解放するため、共有sessionと
drawableを維持できます。preview非表示ブロックはこのfacade所有leaseだけを解放し、ほかの処理用leaseは維持します。

`stopSharedCamera()`は名前付きsessionの全leaseを破棄します。`PROJECT_STOP_ALL`、`PROJECT_LOADED`、
`RUNTIME_DISPOSED`では全sessionを破棄し、停止または置換された作品がcamera track、texture、skin、drawableを
残さないようにします。previewは引き続きopt-inです。runtime consumerが`preview: true`を要求するか、作品が
preview表示ブロックを実行するまでrenderer APIには触れません。
