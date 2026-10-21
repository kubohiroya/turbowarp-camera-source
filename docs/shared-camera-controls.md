# 共通のカメラ設定コントローラー

関連: [Issue #55](https://github.com/kubohiroya/turbowarp-camera-source/issues/55)。GUI #51の登録APIを先に導入し、app #952が利用する。

Camera Sourceのruntime上の拡張インスタンスは`registerCameraControls({owner, cameraId, locale, port?, mirroring?})`を提供する。対応するGUIではEditorの操作列を使い、単独HTMLでは共通app-shell Dockを使う。DOMのないホストではnullを返す。`start()`で入口を表示し、`stop()`で非表示にする。`refresh()`・`setMirroring()`で作品側から反映し、`dispose()`で解除する。登録だけでは表示や撮影を開始しない。

許可・開始のフロー、機器一覧と選択のUI、左右反転のUI、日本語/英語の標準文言をCamera Sourceが所有する。GUIは停止ボタン後方に一つの入口とパネルを提供し、撮影の状態を推測しない。

`port`は`isCameraRunning()`に加え、必要に応じて`listCameraDevices()`・`selectCamera()`・`getCameraSelection()`・`getActiveCamera()`・`setPreviewMirroring()`を提供する。選択値は`default`・`front`・`back`または`{deviceId}`。作品や推論エンジン固有のプレビュー反転・再取得方針はportへ委譲する。Camera Sourceが他の利用者の共有leaseを勝手に解放することはない。portを省略した許可入口はCamera Sourceの起動状態を表示する。

開始操作では実際の`<usermedia>`をGUIへ登録し、本人のクリックで返ったストリームをadoptする。コントローラーは自分が要求したストリームとleaseを所有する。破棄時は自分のものだけを止め、既存の外部adoptストリームは止めない。通常ブロックの許可待ち要素も同じGUI入口を利用する。Editor APIのないHTMLではapp-shell Dockへfallbackする。Dockの上下左右・自動非表示設定はカメラ固有の設定とは分離する。

ネイティブ要素は配置直後にブラウザーから一時的に無効化されることがある。InvalidStateErrorでは要素を維持し、配置が安定した後の実クリックを待つ。キャンセル・終端エラー・明示的なdismissは待機を終了する。エラー詳細は要素のerrorプロパティから取得する。[Chrome公式仕様説明](https://developer.chrome.com/blog/usermedia-html-element)

位置指定やドラッグ移動は共通入口のAPIに含めない。受け入れ条件は一つの入口、許可/設定の切替、機器選択/左右反転、非同期キャンセルとストリームの後始末。切戻しは今回の利用側/API差分のrevert。


Packager HTMLの入口は操作列の有無・file://・全画面に依存しない共通Dockを使う。標準設定は下・自動非表示ON。Dock本体の責務はapp-shell #16、カメラ設定・許可の責務は本拡張にある。Camera Source 0.19.0はapp-shell 0.3.0をビルド依存として完全固定し、配布extensionへ内包する。runtime/profile等の純粋entryは第三者runtime importを持たない。
