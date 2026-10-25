# 実カメラでの適合性判定の検証

関連: [Issue #14](https://github.com/kubohiroya/turbowarp-camera-source/issues/14)。

#14のDoDで唯一残っている項目は「実カメラで解像度・focus／zoomを変えた際の適合性判定を検証し、条件を記録する」である。単体テストでは届かない。`evaluateProfileCompatibility`が3値（`compatible`／`incompatible`／`undetermined`）を返すのは、**デバイスが報告しない制御**と**報告する制御が変わったこと**を区別するためで、その区別が実機で成り立つかは実機でしか分からない。

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
| — | — | — | 未実施 |

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

Claudeのアプリ内ブラウザペイン（Chromium 152、`http://localhost:5178`）ではページとimportは通るが、`getUserMedia`が`NotAllowedError: Permission denied`で返る。ペイン側がデバイス取得を塞いでいるためで、操作者の拒否ではない。実機検証は通常のChromeで行う必要がある。

内蔵カメラ（FaceTime HD）では`zoom`・`focusMode`・`focusDistance`を報告しない見込みが高い。その場合、このハーネスで確かめられるのは解像度の変化と、**制御を持たないデバイスで判定が`undetermined`へ上がらないこと**までである。focus／zoomの変化そのものを確かめるには、それらを`applyConstraints`で受けるUSBカメラが要る。ハーネスは`getCapabilities()`をそのまま記録するので、使った機材が何を持っていたかは出力から分かる。
