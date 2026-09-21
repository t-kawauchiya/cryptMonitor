# cryptMonitor

価格画面とは別に、機械が60秒ごとにBTC・ETH・SOL・USDT・USDC・JPYCを確認します。

    npm run monitor

しきい値を超えると、ターミナルへ記録し、macOSのデスクトップ通知を出します。設定は monitor.config.json で変更できます。

- BTC: 24時間で5%以上の変動
- ETH: 24時間で6%以上の変動
- SOL: 24時間で8%以上の変動
- JPYC: ¥1から1%以上の乖離
- USDT / USDC: 24時間で1%以上の変動（主にドル円の急変を拾う）

重複通知を避けるため、同じ種類の通知は30分間抑制します。監視の状態と通知履歴は .monitor/ に保存され、Gitには含めません。

## Macで常時監視する

ログイン時に監視を自動起動し、ターミナルを閉じても動かし続けるには次を実行します。

    npm run monitor:install

状態確認と解除:

    npm run monitor:status
    npm run monitor:uninstall

常駐監視の標準出力とエラーは .monitor/launchd.out.log と .monitor/launchd.err.log に保存されます。
