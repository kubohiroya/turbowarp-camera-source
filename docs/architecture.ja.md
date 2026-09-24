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

この契約は[`@kubohiroya/turbowarp-extension-manifest`](https://github.com/kubohiroya/turbowarp-extension-manifest)が所有します。同packageの`schemas/extension-manifest.schema.json`が規範となるJSON Schemaであり、`createExtensionManifest`が唯一の生成器です。`formatVersion`は`1`で、互換性のないmanifest形式を導入するときはpackage側で変更します。

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

## 校正プロファイルの契約

内部校正プロファイルの契約は本拡張が持ち、プロファイル自体は作りません。チェスボード校正も、操作者が貼り付けたJSONも、前の会場から持ち越したファイルも、ここからは「検証を通る文書を渡してくる誰か」であり、区別しません。特定の拡張を名指しすると、solverを分離した意味が失われます。solverはOpenCVを抱えており、`opencv.js`だけで10.4 MB、本bundleの数十KBに対して桁が違います。solver由来の識別子がbundleへ入っていないことは`pnpm run check:dist`が検査します。

プロファイルはカメラがどう投影するかを述べるもので、どこに立っているかは述べません。従来の`twrmc/camera-calibration`が持っていた世界姿勢は、校正の最後のサンプルの外部姿勢でした。これを共通世界での配置として読むと、カメラを一度もいたことのない場所に置きます。旧形式の文書は今も受け取りますが、その姿勢は再公開せずに捨てます。

3つの問いは別々に答えます。別々に失敗するからです。

| 問い | 答え |
|---|---|
| このプロファイルは今の構成のこのカメラを表しているか | `compatible`／`incompatible`／`undetermined` |
| 保存された数値を今のフレームサイズで表現できるか | `exact`／`scaled`／`unavailable` |
| 利用側はそれで投影してよいか | `usable`な内部行列、または無し |

`undetermined`が`compatible`へ格上げされることはなく、最初の2つが揃わない限り内部行列は渡しません。渡してしまえば、利用側は別の構成の数値で投影し、返ってくる幾何は「少し違うカメラ姿勢」に見えて、誤りには見えません。

誰も校正していないカメラは正常な状態です。`assessProfile`と`profileFor`はそれを失敗ではなく不在として返します。失敗の安全な読み方は「止まる」であり、それはここでの応答として誤っています。

この面は起動時固定のフラグで囲ってあり、既定はOFFです。カメラ取得とpreviewはどちらでも変わりません。

## 公開しているruntime契約

`./runtime`は、カメラを共有する利用側が必要とする宣言だけを持つ別のentry pointで、logicを含みません。`CameraFrameSource`や`CameraLease`を手書きで宣言した利用側は、何とも照合されないまま型検査を通ります。こちらの形が変わっても利用側のリポジトリでは通り続け、代わりにブラウザで壊れます。公開した宣言をimportすれば、その失敗は利用側のビルドへ移ります。そこが唯一、安く済む場所です。
