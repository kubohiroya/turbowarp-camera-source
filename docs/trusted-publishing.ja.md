# npmのtrusted publishing

関連: [Issue #42](https://github.com/kubohiroya/turbowarp-camera-source/issues/42)、[Issue #41](https://github.com/kubohiroya/turbowarp-camera-source/issues/41)。

このrepositoryはnpmのtrusted publishingで公開する。保存されたtokenは無く、publishのたびの2FAも無い。workflowの身元をnpmが検証し、job中だけ有効な資格情報を発行する。provenanceは自動で付く。`@kubohiroya/turbowarp-camera-source`では0.14.0で初めて成立した。それ以前の3回のrelease実行はすべて`403 OIDC permission denied`で失敗しており、設定が未了だった。

## 何がどこに設定されているか

設定は**2か所**にあり、片方だけでは成立しない。

### GitHub側 — `.github/workflows/release.yml`

| 項目 | 値 | なぜ |
| --- | --- | --- |
| `permissions.id-token` | `write` | npmが短命な公開資格情報と交換する身元 |
| `actions/setup-node`の`registry-url` | **渡さない** | 渡すと`.npmrc`が書かれる。tokenを与えなければauth tokenはリテラルの`XXXXX-XXXXX-XXXXX-XXXXX`になり、設定済みの資格情報——出来の悪いものでも——があるとnpmはworkflowの身元を交換せずそれを送るので、publishは`OIDC permission denied`で拒否される。registryは`package.json`の`publishConfig`が指定しているので、他に必要な用途も無い |
| npm | 11.5.1以降 | trusted publishingの要件。pinしているNodeのnpmは足りているが、将来のbumpで付いてくるnpmに依存させないため`npm install -g npm@latest`を明示する |
| publishの位置 | 最後のstep | checkの失敗やtagの不一致は、registryへ何かが届く前に止まる。届いたものは取り消せない |

### npmjs.com側 — パッケージの Settings → Trusted publisher

照合項目。1つでも食い違うと`403 OIDC permission denied`になる。

| 欄 | 値 | 落とし穴 |
| --- | --- | --- |
| Organization or user | `kubohiroya` | |
| Repository | `turbowarp-camera-source` | |
| Workflow filename | `release.yml` | **ファイル名のみ**。`.github/workflows/release.yml`と書くと一致しない |
| Environment | **空** | workflowが`environment:`を宣言していない。ここに名前を入れると一致しない |

同じページの Publishing access も効く。「Require two-factor authentication」だとOIDCは拒否される。trusted publishingを使うなら「Require two-factor authentication or an automation token」にする。

## 反映待ちは別の段

workflowがsuccessになることと、レジストリに反映されることは別である。#41では、success直後の`npm view`が`404 No match found`を返し、`dist-tags`も旧版のままだった。反映には約80秒かかった。

したがって、公開直後に下流を更新する手順には、レジストリへ直接問い合わせて待つ段を入れる。版ごとのendpointは未公開なら404を返すので、待ち条件にそのまま使える。

```sh
pkg=@kubohiroya%2Fturbowarp-camera-source
version="$(node -p "require('./package.json').version")"
until curl -sf -o /dev/null "https://registry.npmjs.org/$pkg/$version"; do sleep 5; done
curl -sf "https://registry.npmjs.org/$pkg/latest" | jq -r .version
```

#42の本文に書いた一行版（packument全体を`process.stdin.on('data', …)`の中で`JSON.parse`する形）は使えない。packumentは32 kBあり複数のchunkで届くので、最初のchunkの`JSON.parse`が例外になる。上の版ごとのendpointか、`…/latest`を使う。

provenanceが付いたかは、registryのversion metadataの`dist.attestations`で確認できる。

```sh
curl -sf "https://registry.npmjs.org/$pkg/latest" | jq '.dist.attestations'
```

## 他パッケージへの展開

### 観測（2026-10-25）

| パッケージ | npm最新版 | provenance | `release.yml`の`id-token` |
| --- | --- | --- | --- |
| @kubohiroya/turbowarp-camera-source | 0.19.4 | **あり**（0.14.0以降） | あり |
| @kubohiroya/turbowarp-teachable-machine | 3.5.6 | **あり**（3.3.0以降） | `publish-npm.yml`にあり |
| @kubohiroya/turbowarp-app-shell | 0.3.1 | なし | **あり** |
| @kubohiroya/turbowarp-kamishibai-app | 4.0.0-rc.49 | なし | `release.yml`なし |
| @kubohiroya/turbowarp-bubble | 0.13.5 | なし | `release.yml`なし |
| @kubohiroya/turbowarp-async-input | 0.8.1 | なし | `release.yml`なし |
| @kubohiroya/turbowarp-asset-cache | 0.3.2 | なし | `release.yml`なし |
| @kubohiroya/turbowarp-extension-manifest | 0.3.2 | なし | `release.yml`なし |
| @kubohiroya/sb3-toolchain | 0.17.0 | なし | `release.yml`なし |
| @kubohiroya/turbowarp-extension-data-editor | 0.3.3 | なし | `release.yml`なし |
| @kubohiroya/turbowarp-svg-text | 0.10.1 | なし | `release.yml`あり・`id-token`なし |
| @kubohiroya/turbowarp-kvs | 0.2.1 | なし | `release.yml`あり・`id-token`なし |
| @kubohiroya/turbowarp-runtime-expression | 0.6.1 | なし | `release.yml`あり・`id-token`なし |

#42の本文の表から2点変わっている。**teachable-machineはすでにprovenance付きで公開されている**（3.3.0以降、`workflow_dispatch`の`publish-npm.yml`経由）。手元からの2FA公開ではない。そして**app-shellはworkflow側が済んでいる**。

### app-shellの切り分け（2026-10-26、実測）

当初は「npmjs.com側の登録が無いか、その版を手で公開したかのどちらか」と書いていた。release実行のログを読んで確定した——**両方である。**

`release.yml`の実行は5回すべて失敗している（v0.2.0から v0.3.1まで）。つまりこのworkflowは一度もpublishに成功しておらず、npm上の0.3.1は手元から公開されたものである。だからprovenanceが無い。

そしてv0.3.1の実行が落ちた理由がこれである。

```
npm notice publish Signed provenance statement with source and build information from GitHub Actions
npm notice publish Provenance statement published to transparency log: https://search.sigstore.dev/?logIndex=3348503453
npm error code E403
npm error 403 Forbidden - PUT https://registry.npmjs.org/@kubohiroya%2fturbowarp-app-shell
          - OIDC permission denied for this action
```

**GitHub側は正しい。** npmはOIDCの交換まで到達し、provenance statementに署名してsigstoreのtransparency logへ公開までしている。そのうえでregistryがPUTを拒否した。つまり欠けているのはnpmjs.com側のTrusted publisher登録だけで、camera-sourceが0.14.0より前に3回踏んだのと同じ症状である。

workflowを本repositoryの実績ある版と突き合わせても、OIDCに効く差は無い（`registry-url`を渡していない・tokenを渡していない・npmを11.5.1以降へ上げている・publishが最後のstep。`actions/checkout`と`actions/setup-node`のmajorとNode版は違うが、どれもOIDCには効かない）。

残る作業は操作者がnpmjs.comで上記の4欄を登録することだけで、次のtag pushで成立する。

### 判断

**下流の痛みが大きい順に展開する。** 全パッケージの一斉移行はしない。

1. **`turbowarp-kamishibai-app`** — 第1優先。releaseごとに2FAのワンタイムパスワードのやり取りが発生しており、効果が最も大きい。`release.yml`が無いので、workflowとnpmjs.com側の登録の両方が要る。
2. **`turbowarp-app-shell`** — 第2優先。**workflowは出来ていることが実測で確定した**（上記）。残るのはnpmjs.com側の登録だけで、コードの変更は要らない。family中でコストが最も低い。
3. **残り** — 次のminor公開のついでに1つずつ。`release.yml`があって`id-token`が無いもの（svg-text、kvs、runtime-expression）は、このrepositoryのpublish stepをそのまま写せる。`release.yml`が無いものは、このrepositoryのworkflow全体か、teachable-machineの`workflow_dispatch`版を雛形にする。

各パッケージで最初の公開がprovenance付きになったことを、上の`dist.attestations`で確認してこの表を更新する。

展開しない選択も残る。保存tokenが無いこと自体は、trusted publishingでしか得られない性質ではない——automation tokenでも2FAは省ける。trusted publishingが加えるのはprovenanceと、tokenをどこにも保管しないことである。
