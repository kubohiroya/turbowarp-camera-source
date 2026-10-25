# 実カメラでの適合性判定の検証

関連: [Issue #14](https://github.com/kubohiroya/turbowarp-camera-source/issues/14)。

#14のDoDで最後まで残った項目は「実カメラで解像度・focus／zoomを変えた際の適合性判定を検証し、条件を記録する」である。単体テストでは届かない。`evaluateProfileCompatibility`が3値（`compatible`／`incompatible`／`undetermined`）を返すのは、**デバイスが報告しない制御**と**報告する制御が変わったこと**を区別するためで、その区別が実機で成り立つかは実機でしか分からない。

2026-10-25に解像度の側を実機で確認した。結果は下の「記録」にある。focus／zoomは、試した内蔵カメラがその制御を持たないため未確認のまま残っている。

**#14はこの項目を未達のままcloseした**（2026-10-25）。満たされたからではなく、`zoom`・`focusMode`・`focusDistance`を`applyConstraints`で受ける機材を調達する計画が無いという判断による。必要になった時点で改めてIssueを立てる。この文書はそのときの入口として残す——下の「記録」に、何が確認済みで何が確認済みでないかの内訳がある。

ハーネスは [`tests/manual/real-camera-compatibility.html`](../tests/manual/real-camera-compatibility.html)。

## 何を試すか

ハーネスは`./profile`——pure入口——だけをimportする。VM・renderer・blockは使わない。`evaluateProfileCompatibility`と`readCameraConditions`は素の値を受ける素の関数なので、このページが加えるのは「向こう側に本物のデバイスが居る」ことだけである。

1. カメラを開き、`getCapabilities()`と`getSettings()`を記録する
2. **いまのカメラにちょうど合うprofile**を書く。`image`はいま届いているフレームの寸法、`capture`はいまの`MediaTrackSettings`から作る。documentはpackage自身の`readCameraProfileDocument`を通すので、壊れたものはここで落ちる（intrinsicsは作り物で、判定には使われない）
3. 撮影条件を1つずつ変え、そのたびに「このprofileはまだ合うか」を訊く

期待する振る舞いは単純である。条件Aで解いたprofileは、条件Aのままなら`compatible`、決定的な制御が動いたら`compatible`でなくなる。`zoom`・`focusMode`・`focusDistance`は`image-size`と並ぶ決定的な項目で、`frameRate`と`facingMode`はレンズの投影を変えないので決定に加わらない。デバイスがその制御を持たない場合は、黙って飛ばさず「報告しないので変えられない」と記録する。

## 手順

リポジトリのルートをlocalhostのhttpで配り、`/tests/manual/real-camera-compatibility.html`を開く。`file://`では`/dist/profile.js`のimportとgetUserMediaのどちらも通らない。

```sh
pnpm run build   # dist/profile.js が要る
npx --yes http-server -p 5178 .
```

ブラウザで <http://localhost:5178/tests/manual/real-camera-compatibility.html> を開き、ボタンを押してカメラを許可する。出力の「Machine-readable record」の節をまるごとIssueへ貼る。`globalThis.__realCameraCheck`にも同じものが入る。

## 記録

| 日付 | ブラウザ | カメラ | 結果 |
| --- | --- | --- | --- |
| 2026-10-25 | Chrome 155（macOS） | FaceTime HDカメラ (3A71:F4B5) | 解像度は確認済み。focus／zoomはこの機材に制御が無く未確認 |

### 2026-10-25 — Chrome 155、FaceTime HDカメラ

`http://localhost:5178`、`observedAt` 2026-10-25T13:29:08Z。

**デバイスが報告した`getCapabilities()`**は`aspectRatio`・`deviceId`・`facingMode`（空配列）・`frameRate`（0–30）・`groupId`・`height`（1–1920）・`resizeMode`（`none`と`crop-and-scale`）・`width`（1–1920）で、**`zoom`・`focusMode`・`focusDistance`は含まれない**。だからハーネスはそれらを「報告しないので変えられない」と記録した。推測ではなく、capabilitiesに無い。

基準条件は640x480・`frameRate` 30・`resizeMode` `none`。記録されたprofileの`capture`は`{frameRate: 30, resizeMode: "none"}`の2つだけで、`facingMode`は入っていない——デバイスが空配列を返し`getSettings()`にも現れないためで、契約どおり「報告しない」が既定値で埋められずに保たれている。

| 変化 | 届いたフレーム | 判定 | 決定的な所見 |
| --- | --- | --- | --- |
| 無し（基準） | 640x480 | `compatible` | — |
| 解像度 640x480を要求 | 640x480 | `compatible` | — |
| 解像度 1280x720を要求 | 1280x720 | `incompatible` | `image-size:mismatched` |
| 解像度 320x240を要求 | 320x240 | `incompatible` | `image-size:mismatched` `resize-mode:mismatched` |
| 解像度 640x480へ戻す | 640x480 | `compatible` | — |
| `zoom` | — | — | デバイスが報告しないので変えられない |
| `focusMode` | — | — | 同上 |
| `focusDistance` | — | — | 同上 |

確認できたこと:

- 基準条件で`compatible`、解像度が動けば`incompatible`、**戻せば再び`compatible`**。判定に状態が残らない。
- **320x240の行で所見が2つ出た。** 1280x720では`image-size`だけなのに対し、320x240では`resize-mode:mismatched`が加わっている。このカメラは1280x720のモードを持つが320x240は持たず、ブラウザは`resizeMode`を`crop-and-scale`へ切り替えてその寸法を作った。`crop-and-scale`は切り出しと縮小のどちらか／両方を意味し、設定だけでは区別できない——だから純粋な縮小なら`fx`・`fy`・`cx`・`cy`を一律に掛けて済むところを、この拡張はintrinsicsを渡さない。`resize-mode`はサイズとは独立した決定的な所見として挙がる。

  これは合成した`MediaTrackSettings`でも検査していた経路だが、**実機のブラウザが本当にこう振る舞う**ことはここで初めて裏が取れた。`src/calibration/types.ts`の「Cropping changes the effective intrinsics at the same resolution.」が実測で支えられた形である。

未確認のまま残るもの: `zoom`・`focusMode`・`focusDistance`を変えたときの判定。このカメラがその制御を持たないため、**機材が揃うまで実機では確かめられない**。それらを`applyConstraints`で受けるUSBカメラがあれば、同じページをもう一度走らせるだけで埋まる。判定側のロジック自体は下の合成条件での確認で裏が取れている。

正確には、未確認なのは**実機のデバイスが`applyConstraints`でそれらを動かしたとき、`getSettings()`の変化を判定が拾うか**だけである。判定側の分岐——各制御の不一致が`incompatible`に、報告されていなかった制御の出現が`undetermined`になること——は合成条件で確認済みで、残差はデバイス側の振る舞いに限られる。この残差を抱えたまま#14はcloseした（上記）。

### 2026-10-25 — 判定側は実機なしで確認済み

ハーネスが実機で確かめるのは**デバイスの振る舞い**だけで、判定そのものは先に確かめられる。`dist/profile.js`へ、実機の代わりに合成した`MediaTrackSettings`を与えて同じ経路を通した結果:

まずハーネスが書くprofile documentは`readCameraProfileDocument`を通る（通らなければページはそこで落ちるので、これが前提）。その上で、

| 変化 | 判定 | 決定的な所見 |
| --- | --- | --- |
| 無し（基準） | `compatible` | — |
| 解像度 1280x720 → 640x480 | `incompatible` | `image-size:mismatched` |
| `zoom` 1 → 2 | `incompatible` | `zoom:mismatched` |
| `focusMode` continuous → manual | `incompatible` | `focus-mode:mismatched` |
| `focusDistance` 0.5 → 0.9 | `incompatible` | `focus-distance:mismatched` |
| `frameRate` 30 → 15 | `compatible` | —（決定に加わらない） |
| 制御を報告しないデバイスが`zoom`を報告し始める | `undetermined` | `zoom:unknown` |

最後の行が肝で、**未知は`compatible`へ上がらない**。したがって内蔵カメラしか無い場合でも、残るのは「このデバイスが`applyConstraints`でfocus／zoomを実際に動かすか」という機材の問題だけで、判定の正しさは未確認ではない。

### 2026-10-25 — 実行できなかった環境

Claudeのアプリ内ブラウザペイン（Chromium 152、`http://localhost:5178`）ではページとimportは通るが、`getUserMedia`が`NotAllowedError: Permission denied`で返る。ペイン側がデバイス取得を塞いでいるためで、操作者の拒否ではない。実機検証は通常のChromeで行った（上の記録）。
