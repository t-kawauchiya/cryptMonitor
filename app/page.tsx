'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, Bell, CircleAlert, Clock3, RefreshCw, ShieldCheck, Sparkles, TrendingUp, WalletCards } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Asset = { id: string; symbol: string; name: string; price: number; change: number; marketCap?: number; image?: string };
const tracked = [
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' }, { id: 'ethereum', symbol: 'ETH', name: 'Ethereum' },
  { id: 'solana', symbol: 'SOL', name: 'Solana' }, { id: 'tether', symbol: 'USDT', name: 'Tether' },
  { id: 'usd-coin', symbol: 'USDC', name: 'USD Coin' }, { id: 'jpy-coin', symbol: 'JPYC', name: 'JPYC' },
];
const fallback: Asset[] = [
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', price: 17_270_000, change: 2.8, marketCap: 344_000_000_000_000 },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', price: 575_000, change: 4.2, marketCap: 69_000_000_000_000 },
  { id: 'solana', symbol: 'SOL', name: 'Solana', price: 25_800, change: 5.1, marketCap: 14_200_000_000_000 },
  { id: 'tether', symbol: 'USDT', name: 'Tether', price: 155.9, change: 0.1 },
  { id: 'usd-coin', symbol: 'USDC', name: 'USD Coin', price: 155.8, change: -0.1 },
  { id: 'jpy-coin', symbol: 'JPYC', name: 'JPYC', price: 1, change: 0 },
];
const yen = new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY', maximumFractionDigits: 0 });
const compact = new Intl.NumberFormat('ja-JP', { notation: 'compact', maximumFractionDigits: 1 });

function Sparkline({ positive }: { positive: boolean }) {
  return <svg viewBox="0 0 140 42" className="h-10 w-32 overflow-visible" aria-hidden="true"><path d={positive ? 'M2 34 C14 30 15 24 26 27 S42 18 53 23 S67 30 78 18 S92 22 103 11 S120 14 138 4' : 'M2 8 C15 7 16 15 28 13 S43 23 55 17 S71 13 83 23 S101 19 111 30 S126 34 138 38'} fill="none" stroke={positive ? '#27d7a1' : '#ff6b86'} strokeWidth="2.5" strokeLinecap="round" /></svg>;
}

function AssetRow({ asset }: { asset: Asset }) {
  const positive = asset.change >= 0;
  return <div className="grid grid-cols-[1fr_auto] items-center gap-3 px-5 py-4 sm:grid-cols-[1fr_140px_150px_115px]">
    <div className="flex items-center gap-3"><div className="grid size-9 place-items-center overflow-hidden rounded-full bg-slate-700 text-xs font-bold">{asset.image ? <img src={asset.image} alt="" className="size-full" /> : asset.symbol.slice(0, 1)}</div><div><p className="font-semibold">{asset.symbol}</p><p className="text-xs text-slate-500">{asset.name}</p></div></div>
    <div className="hidden sm:block"><Sparkline positive={positive} /></div>
    <div className="text-right"><p className="font-semibold tabular-nums">{yen.format(asset.price)}</p><p className="mt-0.5 text-xs text-slate-500">時価総額 {asset.marketCap ? compact.format(asset.marketCap) : '—'}</p></div>
    <div className={`flex items-center justify-end gap-1 text-sm font-semibold ${positive ? 'text-teal-300' : 'text-rose-300'}`}>{positive ? <ArrowUpRight className="size-4" /> : <ArrowDownRight className="size-4" />}{positive ? '+' : ''}{asset.change.toFixed(2)}%</div>
  </div>;
}

export default function Home() {
  const [assets, setAssets] = useState<Asset[]>(fallback);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [alertsOn, setAlertsOn] = useState(true);
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=jpy&ids=bitcoin,ethereum,solana,tether,usd-coin,jpy-coin&price_change_percentage=24h');
      if (!response.ok) throw new Error('market data unavailable');
      const data = await response.json();
      setAssets(tracked.map((item) => {
        const coin = data.find((row: { id: string }) => row.id === item.id);
        return coin ? { ...item, price: coin.current_price, change: coin.price_change_percentage_24h ?? 0, marketCap: coin.market_cap, image: coin.image } : fallback.find((row) => row.id === item.id)!;
      }));
    } catch { /* Keep the useful starter values if the public feed is temporarily unavailable. */ }
    finally { setUpdatedAt(new Date()); setLoading(false); }
  }, []);
  useEffect(() => { refresh(); }, [refresh]);

  const main = assets.filter((asset) => ['BTC', 'ETH', 'SOL'].includes(asset.symbol));
  const stable = assets.filter((asset) => ['USDT', 'USDC', 'JPYC'].includes(asset.symbol));
  const averageMove = useMemo(() => main.reduce((sum, asset) => sum + asset.change, 0) / main.length, [main]);
  const jpyc = stable.find((asset) => asset.symbol === 'JPYC')?.price ?? 1;

  return <main className="min-h-screen bg-[#08131c] text-slate-100 selection:bg-teal-300 selection:text-slate-950"><div className="mx-auto max-w-7xl px-5 py-6 lg:px-8">
    <header className="mb-7 flex flex-wrap items-center justify-between gap-4"><div className="flex items-center gap-3"><div className="grid size-10 place-items-center rounded-2xl bg-teal-300 text-slate-950 shadow-[0_0_30px_rgba(45,212,191,.28)]"><TrendingUp className="size-5" /></div><div><p className="text-lg font-bold tracking-tight">cryptMonitor</p><p className="text-xs text-slate-400">Market pulse, in yen</p></div></div><div className="flex items-center gap-2 text-xs text-slate-400"><span className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/4 px-3 py-2 sm:flex"><span className="size-2 rounded-full bg-teal-300" />Live market data</span><Button onClick={refresh} variant="outline" size="sm" className="border-white/10 bg-white/5 text-slate-100 hover:bg-white/10 hover:text-white"><RefreshCw className={loading ? 'animate-spin' : ''} />更新</Button></div></header>
    <section className="mb-6 grid gap-4 md:grid-cols-3">
      <div className="rounded-2xl border border-teal-300/25 bg-[linear-gradient(135deg,rgba(45,212,191,.16),rgba(16,29,39,.8))] p-5"><div className="flex items-start justify-between"><div><p className="text-sm font-medium text-teal-100">市場の温度</p><p className="mt-3 text-3xl font-bold tracking-tight">{averageMove >= 0 ? '+' : ''}{averageMove.toFixed(1)}%</p><p className="mt-1 text-xs text-slate-400">主要3銘柄の24時間平均</p></div><Sparkles className="size-5 text-teal-300" /></div></div>
      <div className="rounded-2xl border border-white/8 bg-[#0d1b26] p-5"><div className="flex items-start justify-between"><div><p className="text-sm font-medium text-slate-300">JPYC / JPY</p><p className="mt-3 text-3xl font-bold tracking-tight">{jpyc.toFixed(3)}</p><p className="mt-1 text-xs text-slate-400">理論値 ¥1.000 からの乖離を監視</p></div><WalletCards className="size-5 text-amber-300" /></div></div>
      <div className="rounded-2xl border border-white/8 bg-[#0d1b26] p-5"><div className="flex items-start justify-between"><div><p className="text-sm font-medium text-slate-300">アラート</p><p className="mt-3 text-3xl font-bold tracking-tight">{alertsOn ? '有効' : '停止中'}</p><p className="mt-1 text-xs text-slate-400">急変・ペッグ乖離を検知</p></div><button onClick={() => setAlertsOn(!alertsOn)} aria-label="アラートを切り替える" className={`grid size-9 place-items-center rounded-xl ${alertsOn ? 'bg-amber-300/15 text-amber-300' : 'bg-white/6 text-slate-500'}`}><Bell className="size-4" /></button></div></div>
    </section>
    <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]"><div className="space-y-6">
      <div className="overflow-hidden rounded-2xl border border-white/8 bg-[#0d1b26]"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/7 px-5 py-4"><div><h1 className="font-semibold">主要マーケット</h1><p className="mt-0.5 text-xs text-slate-400">日本円建て・24時間の変化</p></div><span className="rounded-full bg-white/5 px-3 py-1.5 text-xs text-slate-400">{updatedAt ? `更新 ${updatedAt.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}` : '取得中…'}</span></div><div className="divide-y divide-white/6">{main.map((asset) => <AssetRow key={asset.id} asset={asset} />)}</div></div>
      <div className="rounded-2xl border border-white/8 bg-[#0d1b26] p-5"><div className="mb-4 flex items-center justify-between"><div><h2 className="font-semibold">ステーブルコイン・ウォッチ</h2><p className="mt-0.5 text-xs text-slate-400">価格のペッグと流動性をまず確認</p></div><ShieldCheck className="size-5 text-teal-300" /></div><div className="grid gap-3 sm:grid-cols-3">{stable.map((asset) => <div key={asset.id} className={`rounded-xl border p-4 ${asset.symbol === 'JPYC' ? 'border-amber-300/35 bg-amber-300/7' : 'border-white/7 bg-white/3'}`}><div className="flex justify-between"><span className="font-semibold">{asset.symbol}</span>{asset.symbol === 'JPYC' && <span className="text-[10px] font-bold tracking-wide text-amber-300">注目</span>}</div><p className="mt-3 text-xl font-bold">¥{asset.price.toLocaleString('ja-JP', { maximumFractionDigits: asset.symbol === 'JPYC' ? 3 : 2 })}</p><p className={`mt-1 text-xs ${asset.change >= 0 ? 'text-teal-300' : 'text-rose-300'}`}>{asset.change >= 0 ? '+' : ''}{asset.change.toFixed(2)}% / 24h</p></div>)}</div></div>
    </div><aside className="space-y-5">
      <div className="rounded-2xl border border-amber-300/25 bg-[linear-gradient(160deg,rgba(251,191,36,.14),rgba(13,27,38,.96))] p-5"><div className="flex gap-3"><CircleAlert className="mt-0.5 size-5 shrink-0 text-amber-300" /><div><h2 className="font-semibold text-amber-100">JPYCを見るとき</h2><p className="mt-2 text-sm leading-6 text-slate-300">価格だけでなく、取引高・発行残高・交換所ごとの板もセットで追うのが大事。</p></div></div><div className="mt-4 rounded-xl bg-black/15 p-3 text-xs leading-5 text-slate-400">¥1.00 から <span className="font-semibold text-amber-200">±1%</span> を超えたら、まず流動性と売買場所を確認。</div></div>
      <div className="rounded-2xl border border-white/8 bg-[#0d1b26] p-5"><div className="flex items-center justify-between"><h2 className="font-semibold">今日の監視項目</h2><Clock3 className="size-4 text-slate-500" /></div><ul className="mt-4 space-y-3 text-sm text-slate-300"><li className="flex gap-3"><span className="mt-1.5 size-1.5 rounded-full bg-teal-300" />BTCの24時間変化と出来高</li><li className="flex gap-3"><span className="mt-1.5 size-1.5 rounded-full bg-teal-300" />ETH / SOL の相対的な強さ</li><li className="flex gap-3"><span className="mt-1.5 size-1.5 rounded-full bg-amber-300" />JPYCのペッグ乖離</li><li className="flex gap-3"><span className="mt-1.5 size-1.5 rounded-full bg-slate-500" />USDT・USDCの為替影響</li></ul></div>
    </aside></section><p className="mt-6 text-center text-xs text-slate-500">価格データ: CoinGecko。投資助言ではありません。</p>
  </div></main>;
}
