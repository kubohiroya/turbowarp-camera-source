# 共通エディターと軽量runtimeの境界（camera-source #52）

専用の `turbowarp-camera-source-block-editor` repository/packageは新設しない。Camera Sourceは正本Schema、表示メタデータ、純粋なowner検証、ブロック引数との対応を提供し、既存の `turbowarp-extension-data-editor` とGUIが編集を実行する。

## 公開入口と責務

| 入口・場所 | 責務 |
| --- | --- |
| `./runtime` / `./profile` | 従来のcamera capability、profile読取・検証。公開APIを維持する |
| 新設 `./editor-metadata` | `cameraProfileSchemaBundles`、`cameraProfileUiSchemas`、Source/Form・固定入力の宣言、純粋callback、optional GUI登録関数 |
| 既存 `./editor-schema` | 正本bundle・decode・owner検証の軽量な互換入口。削除せず維持する |
| `Scratch.gui.blockEditors` API v1 | GUIの起動時capabilityに応じて宣言を受け取り、共通基盤でcompile・描画・保存する |
| 共通data-editor／GUI | Ajv、Schema compile／診断、汎用JSON/YAML codec、RJSF／独自Tree、draft、保存／Cancel、transaction、Undo／Redo |

`createSourceEditorOptions`／`fixedInputEditors` はSchemaBundleと純粋なdecode／owner callbackを渡す。拡張側はcompiler、RJSF、React、汎用YAML packageをimportしない。GUIがない場合やAPI未対応の場合は登録を省略する。カメラ取得・adopt・lease・preview・許可ブロックの契約や保存形式は変更しない。

runtimeに残す `src/calibration/yaml.ts` は既存のROS `camera_info` 用専用readerであり、汎用 `yaml` packageではない。GUI側の汎用codecとこのreaderは責務が異なる。ROS YAML／legacy／JSONの既存入力条件を維持する。

## `./editor-schema` 利用者の移行

Camera Source内の利用箇所は `source-editors.ts`、対応テスト、公開ドキュメント。既存の入口・export名は継続する。新しいGUI統合は `./editor-metadata` を利用できる。

`validateCameraProfileSource` は同じ文字列を返し、decode失敗／未知variantの安全な診断とpure owner検証を担当する。**JSON Schemaのcompile／schema keyword別診断は実行しない。** スキーマ診断が必要な独自consumerは `cameraProfileSchemaBundles` を共通基盤の `compileSchemaBundle` でcompileし、decode済みraw dataを検証する。正規化profileをdraftやcommitへ代入しない。共通Source/Formの `prepareSave` は既にこのSchema検証を行うため、そこでの検証は維持される。旧APIの診断phase／codeに依存するconsumerは、この責務変更を次のexact releaseへ追随する前に確認する。

data-editor `0.2.1` は型検査・共通サービスとの開発時検証だけに使い、`devDependencies` へ移す。production依存および自動導入するpeer依存は設けない。生成JSは共通packageに依存しない。生成 `.d.ts` の共通型を使うTypeScript consumerは、自身の開発依存にdata-editorを追加する。共通GUIは従来どおり自身の依存として同基盤を所有する。ビルド済みnpm成果物を利用し、source archiveの開発ビルドに必要な依存と再生時の依存を区別する。

公開済み `0.17.1` を保持し、リリース版 `0.18.0` のexact version、lock、配布物を一組で更新する。app等のpin変更はnpm公開後に行う。

## 共通layout #49との接続

共通仕様は [turbowarp-extension-data-editor #49](https://github.com/kubohiroya/turbowarp-extension-data-editor/issues/49)。`SourceVariant.uiSchema` の各objectに `ui:options.extensionDataLayout`（`version: 1`）を宣言する。`field` はそのobjectの直下のkey、`tabs`・`group`・`grid` は表示だけの定義である。Schema、既定値、保存JSONの階層を変更しない。

- twcs: Profile／Camera／Captureタブ、Identity／Contractグループ、画像幅・高さと内部パラメーターの2列grid。
- legacy: Profile／Camera／Worldタブ、Identityグループ、幅・高さの2列grid。
- ROS: Image／Matrices／Regionタブ、幅・高さおよびbinningの2列grid。

標準RJSFと原文保持Source/Formの独自Treeは同じ共通表示契約を解釈する。Camera SourceのprofileブロックはSource/Form経路を使う。RJSF経路のconsumerも同じSchemaBundle／uiSchemaを渡せる。固定 `PREVIEW_FLIP` 入力は従来の共通固定入力UIを使い、複数項目レイアウトは不要である。

共通GUIの `createBlockEditorService({commonLayout: true})` で起動時にopt-inする。既定OFF／旧GUIでは従来表示へ戻る。拡張からflagをONにしない。既存の `blockEditorDialogs`・`blockEditorSourceForms` の起動時フラグも維持する。#49全体のcloseを待たずruntime依存除去を進められるが、layoutの実表示は#49の実装とGUI配布が必要である。相互にIssue完了待ちの依存は作らない。

## 受け入れ条件とロールバック

完了条件は、第三者runtime依存なしの公開入口、GUIなしのimport、standaloneへの編集依存混入防止、pure ownerと既存profile入力の一致、raw no-op保持、共通サービスのSchema検証、既存camera経路の回帰確認、および生成物・manifest・lockの一致である。境界テストはTypeScript ASTで生成JSのimport graphを追い、隔離packageでDOM／GUIのglobalを参照せずimportできることを確認する。Vite buildは生成chunkへdata-editor、Ajv／ajv-formats、汎用yaml、React／RJSFが入ると失敗する。

問題時は共通layoutをOFFにし、必要なら既存GUI編集フラグをOFFにして再読込する。runtimeや公開契約に問題がある場合はconsumerから順に、検証済みexact pin・lock・生成物を一組で戻す。保存データの自動移行や公開済みversionの上書きは行わない。

## ローカル検証記録（2026-10-20）

基準は `origin/main` の `78613ea`（公開版 `0.17.1`）。standaloneの未圧縮サイズは456,577 Bから155,236 Bへ、Node `zlib.gzipSync` によるgzipは99,433 Bから38,646 Bへ減少した。これは単体配布JSの比較であり、SB3の削減量ではない。Viteは28 moduleをbundleし、編集依存の混入guardを通過した。

- 変更境界: 型検査、対象editor／metadataテスト、変更ファイルのESLint。
- 既存runtime: extension、許可ブロック、profileブロック、ROS YAML、profile、registry、適合性、保存、互換性の9ファイル189テスト。
- 共通#49のローカルbuildとのJSDOM統合: `node scripts/check-common-layout.mjs /path/to/built/data-editor`。twcs／legacy／ROSの独自Tree、twcsの標準RJSFの4経路で3タブ・group・grid・no-op原文保持を確認。twcsは両描画経路でタブをまたいだ2項目変更が一度のcommitとなり、pure owner検証に成功。全3variantと入れ子objectのlayout field参照がSchemaと一致。依存pinは変更せず、ローカルoverlay検証として扱う。
- 隔離consumer: `npm pack --ignore-scripts` のtarballを `npm install --omit=dev --ignore-scripts --offline` で導入。Camera Source一つだけが導入され、metadataをimportできた。兄弟checkout依存は使わない。

ここでのstream／GUI確認はテスト代替であり、実カメラ・実Editor・packaged作品の実ブラウザ表示は未確認である。共通layoutの実ブラウザ表示、非表示タブのエラー誘導、Cancel、Undo／RedoのGUI統合確認は、#49およびGUI側の検証結果と合わせてリリース前に確認する。

運用ログ:
- 2026-10-20 start: #52の最新要件とmainを確認し、独立worktreeで実装開始。
- 2026-10-20 done (local): runtime依存除去、軽量metadata入口、共通layout宣言、既存入口の移行文書と配布物を作成。GitHub write／公開は未実施。

## 0.18.0 の公開

編集用依存を外す版を0.18.0として公開する。`./editor-schema` のpure owner検証と共通Schema診断の責務変更を含むため、旧診断phase/codeを使うconsumerは上記移行手順に従う。問題時は0.17.1のexact pin・lock・生成物へ一組で戻す。
