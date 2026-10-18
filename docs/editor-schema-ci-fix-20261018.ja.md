# 段階1 CI修正（2026-10-18）

対象は `feat/schema/stage1-camera-source` の公開入口の回帰検査である。段階2以降のフォーム接続やデータ変換は含めない。

## 変更と互換性

`tests/runtime-subentry.test.ts` の公開入口の完全一致検査へ、段階1で追加済みの `./editor-schema` を追加した。同入口の import/type パスと `lib-editor/` の配布対象も検査する。既存の `./runtime`、`./profile`、バンドル、package.json の入口を保持し、ルート入口を追加しない検査も維持する。runtime の6公開値、実行時依存のないビルド出力、capability の既存動作の検査を弱めていない。

実装、Schema、保存データ形式、公開APIの追加変更はない。依存pin・lockと実解決の最終対応は、今回のproducer commit後にconsumer側も含めて全体検証記録へ記載する。

## 検証結果と受け入れ基準

- `corepack pnpm@11.18.0 check` 成功。typecheck、lint、15ファイル240テスト、README/Pages整合、build/dist整合、repository policy、pack dry-runを通過した。
- npm 10.9.8でもpack出力の挙動を確認した。`pack --dry-run --json --ignore-scripts` はprepareのVite出力がstdoutへ混ざりJSONとして読めない。`--foreground-scripts=false`を加えると70ファイルのJSONとして読める。CameraSourceの`pack:check`はJSONを解析しないため、この問題による追加変更は不要である。他のrepositoryのJSON解析検査では明示指定が必要となる。
- 段階1の `./editor-schema` と既存入口の両方を完全一致で検査し、既存runtimeの純粋な到達境界を保持することを受け入れ条件とする。

検証ログは `/tmp/schema-stage1-ci-fix-20261018/camera-source-check.log`、npm 10比較は同ディレクトリの `camera-source-npm10-pack-{default,background}.{stdout,stderr}.log` に保存した。後続の統合記録でハッシュと採取条件を固定する。

## ロールバック

今回のテスト修正commitをrevertする。実装とデータに変更はないため、既存データの変換や復旧操作は不要である。producerのGit artifactを切り戻す場合は、consumerのpin・lock・実解決も同じ旧revisionへ戻し、既存のartifact整合検査を再実行する。
