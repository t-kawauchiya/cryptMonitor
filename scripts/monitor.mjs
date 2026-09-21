import { execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const config = JSON.parse(await readFile(path.join(root, 'monitor.config.json'), 'utf8'));
const stateDir = path.join(root, '.monitor');
const statePath = path.join(stateDir, 'state.json');
const logPath = path.join(stateDir, 'alerts.ndjson');
const cooldownMs = 30 * 60 * 1000;

async function loadState() {
  try { return JSON.parse(await readFile(statePath, 'utf8')); }
  catch { return { lastAlertAt: {} }; }
}

function notification(title, message) {
  if (!config.desktopNotifications) return;
  try { execFileSync('osascript', ['-e', 'display notification "' + message.replaceAll('"', '\\"') + '" with title "' + title.replaceAll('"', '\\"') + '"'], { stdio: 'ignore' }); }
  catch { /* Terminal output remains the fallback when desktop alerts are unavailable. */ }
}

function formatYen(value) {
  return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY', maximumFractionDigits: value < 10 ? 3 : 0 }).format(value);
}

async function check() {
  const ids = config.assets.map((asset) => asset.id).join(',');
  const response = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=jpy&ids=' + ids + '&price_change_percentage=24h', { headers: { accept: 'application/json' } });
  if (!response.ok) throw new Error('価格APIが応答しませんでした (HTTP ' + response.status + ')');
  const markets = await response.json();
  const state = await loadState();
  const now = Date.now();
  const alerts = [];

  for (const asset of config.assets) {
    const market = markets.find((item) => item.id === asset.id);
    if (!market) { alerts.push({ key: asset.symbol + ':missing', title: asset.symbol + ' のデータなし', message: '価格データが取得できませんでした。' }); continue; }
    const change = market.price_change_percentage_24h ?? 0;
    if (Math.abs(change) >= asset.change24hPercent) alerts.push({ key: asset.symbol + ':24h', title: asset.symbol + ' が急変', message: '24時間で ' + (change >= 0 ? '+' : '') + change.toFixed(2) + '%（' + formatYen(market.current_price) + '）' });
    if (asset.peg) {
      const deviation = ((market.current_price - asset.peg) / asset.peg) * 100;
      if (Math.abs(deviation) >= asset.pegDeviationPercent) alerts.push({ key: asset.symbol + ':peg', title: asset.symbol + ' のペッグ乖離', message: formatYen(market.current_price) + '。目標値から ' + (deviation >= 0 ? '+' : '') + deviation.toFixed(2) + '% 乖離しています。' });
    }
  }

  for (const alert of alerts) {
    if (now - (state.lastAlertAt[alert.key] ?? 0) < cooldownMs) continue;
    console.log('[' + new Date().toLocaleString('ja-JP') + '] ALERT: ' + alert.title + ' — ' + alert.message);
    notification(alert.title, alert.message);
    await writeFile(logPath, JSON.stringify({ at: new Date().toISOString(), ...alert }) + '\n', { flag: 'a' });
    state.lastAlertAt[alert.key] = now;
  }
  if (!alerts.length) console.log('[' + new Date().toLocaleString('ja-JP') + '] OK: 監視対象はしきい値内です。');
  await writeFile(statePath, JSON.stringify(state, null, 2));
}

await mkdir(stateDir, { recursive: true });
console.log('cryptMonitor: ' + config.pollIntervalSeconds + '秒ごとに監視を開始します。停止は Ctrl+C。');
await check().catch((error) => console.error('監視エラー: ' + error.message));
setInterval(() => check().catch((error) => console.error('監視エラー: ' + error.message)), config.pollIntervalSeconds * 1000);
