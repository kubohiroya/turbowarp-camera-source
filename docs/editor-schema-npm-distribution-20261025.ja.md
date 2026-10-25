# 段階2の配布境界: 公開npm releaseでの再検証

2026-10-25。対象は[Issue #49](https://github.com/kubohiroya/turbowarp-camera-source/issues/49)。検証したcommitは`ea922ee264eaef4b43c30f3d2a3aa3014c9d2db8`（main、version 0.19.4）。機械記録は[editor-schema-npm-distribution-20261025.json](editor-schema-npm-distribution-20261025.json)。

## 公開Git SHAのpinは、npm releaseに置き換わった

Issue #49は「ローカルfile依存を公開Git SHAへ置換する」ことを求めていた。その前提は変わっている。先行repoの[Issue #31](https://github.com/kubohiroya/turbowarp-extension-data-editor/issues/31)は2026-10-19にcloseし、共通フォームは公開npmへ`@kubohiroya/turbowarp-extension-data-editor@0.3.0`として公開された（2026-10-20T11:56:59Z）。本repositoryはこれをdevDependencyとして完全固定している。

| | 旧（段階1・2の記録） | 現在 |
| --- | --- | --- |
| 指定 | `git+https://github.com/kubohiroya/turbowarp-extension-data-editor.git#b5f4b8d2…` | `0.3.0` |
| 取得元 | codeload.github.com | registry.npmjs.org |
| 同一性の根拠 | commit SHA | tarballのintegrity `sha512-QYC/F394…` |
| Git revisionの確認 | 指定そのもの | artifact内の`./build-info` |

Git revisionを確認する手段は失われていない。0.3.0のartifactは自身に`dist/build-info.json`を持ち、`revision`は`9409867dc58d56cd652afa83f2361810dc8da826`である。このcommitは公開repositoryに実在し（2026-10-20T11:21:05Z、`chore(release): 共通フォーム0.3.0を準備する (#51)`）、npm公開の35分前にあたる。つまり**指定はversion、同一性はintegrity、出所はbuild-info**で、三つが一致している。

lockのintegrityはregistryが返す`dist.integrity`と文字列一致する。manifest・lock・実解決が食い違っていればfrozen installが失敗するが、成功した。

0.3.0にprovenance attestationは付いていない（[#42](https://github.com/kubohiroya/turbowarp-camera-source/issues/42)で扱う範囲）。観測時点のdist-tag `latest`は0.3.3であり、本repositoryは0.3.0に留めている。版の引き上げはSchemaの受理条件に触れうるため、このIssueには含めない。

manifest・lock・workspace policyに`file:`・`link:`・`git+`の依存指定は無い。`package.json`に残る唯一の`git+`は本repository自身の`repository.url`である。

## 検証

Node v26.7.0、packageManager指定のpnpm 11.18.0、darwin arm64。mainの別pathへのclean cloneで実施した。

- `pnpm install --frozen-lockfile`が成功。lockがmanifestを書き換えずに満たすので、pin・lock・実解決が一致している。
- `pnpm run check`が成功（typecheck・lint・21ファイル279テスト・docs:check・docs:pages:check・check:dist・repo:check・pack:check）。
- 配布境界は`tests/editor-boundary.test.ts`が見ている。`./runtime`・`./profile`・`./editor-schema`・`./editor-metadata`の4つのpure入口に第三者runtime importは0。`dist`・`lib-editor`・`package.json`だけを置いた一時node_modulesから、`window`・`document`・`Scratch`を例外を投げるgetterにした上で`./editor-metadata`と`./editor-schema`をimportし、Schema ownerが単一であること、宣言が揃っていること、`registerSourceEditors`・`registerFixedInputEditors`が呼べることを確認した。packにsrcとReactは含まれない。
- 生成物74ファイル（`lib-editor` 24、`dist` 50）が、別pathの2つのcheckoutで全SHA-256一致した。同一machine・同一frozen storeでの比較であり、別OSでの再現性は主張しない。
- pack内容は83ファイル、133.2 kB（展開591.3 kB）。

依存の`./schema`入口のうち`schema-compose`・`schema-engine`・`schema-json`・`schema-types`・`schema-view`は、Git artifact時代の記録（[editor-schema-ci-fix-20261018.json](editor-schema-ci-fix-20261018.json)）とbyte一致する。`schema.js`・`schema.d.ts`が変わり`schema-presentation.{js,d.ts}`が増えているのは、0.3.0が加えたprepared sourceのcapabilityに対応する。

## 範囲とロールバック

本記録はコードを変えない。`src/`・`schemas/`・既存API・受理条件・Schemaの正本に差分は無く、GUIのフラグは起動時固定・既定OFFのままである。保存形式の移行もしない。

npm releaseから離れる場合は、[editor-schema-ci-fix-20261018.json](editor-schema-ci-fix-20261018.json)のGit pinを対応するlock・workspace policyと一体で戻すか、pure入口の利用を停止する。公開済みnpmは削除せず、修正は新versionで行う。依存の版引き上げ、npm公開、mergeはこの記録に含めない。
