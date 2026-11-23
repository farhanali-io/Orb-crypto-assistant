import React, { useState, useEffect, useRef } from 'react';
import { CryptoCoin } from '../types/crypto';
import { formatCurrency, formatCompactNumber } from '../services/cryptoApi';
import { createChart, ColorType } from 'lightweight-charts';
import { Star, Globe, Github, Twitter, Share2, Check, ChevronRight, MoveHorizontal, FileText, Compass, MessageCircle, Send } from 'lucide-react';

const CG_KEYS = (import.meta.env.VITE_CG_KEYS as string || '').split(',').map(s=>s.trim()).filter(Boolean);
const KEY_CHART = CG_KEYS[1] || CG_KEYS[0] || '';
const KEY_DETAILS = CG_KEYS[2] || CG_KEYS[0] || '';


type TF = '24H' | '7D' | '1M' | '3M' | '1Y' | 'MAX';
const TF_DAYS: Record<TF, string> = { '24H': '1', '7D': '7', '1M': '30', '3M': '90', '1Y': '365', 'MAX': 'max' };

export const CoinDetailPage: React.FC<{ coin: CryptoCoin; onBack: () => void; favorites: string[]; onToggleFavorite: (id: string) => void }> = ({ coin, onBack, favorites, onToggleFavorite }) => {
  const [tf, setTf] = useState<TF>('7D'); // Bloopa default is 7D like your screenshot
  const [copied, setCopied] = useState(false);
  const [showAllTags, setShowAllTags] = useState(false);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoverPrice, setHoverPrice] = useState<number | null>(null);
  const [extra, setExtra] = useState<any>({});
  const containerRef = useRef<HTMLDivElement>(null);

  const isFav = favorites.includes(coin.id);
  const ch24 = coin.price_change_percentage_24h ?? 0;
  const ch7d = (coin as any).price_change_percentage_7d_in_currency ?? 0;
  const volPct = coin.market_cap ? (coin.total_volume / coin.market_cap * 100).toFixed(2) : '0';

  // Real CoinGecko history
  useEffect(() => {
    let m = true; setLoading(true);
    fetch(`https://api.coingecko.com/api/v3/coins/${coin.id}/market_chart?vs_currency=usd&days=${TF_DAYS[tf]}`, { headers: { 'x-cg-demo-api-key': KEY_CHART } })
      .then(r => r.json()).then(d => {
        if (!m) return;
        setChartData((d.prices || []).map(([t, v]: [number, number]) => ({ time: Math.floor(t / 1000), value: v })));
        setLoading(false);
      }).catch(() => setLoading(false));
    return () => { m = false; };
  }, [coin.id, tf]);

  useEffect(() => {
    fetch(`https://api.coingecko.com/api/v3/coins/${coin.id}?localization=false&tickers=false&market_data=false&community_data=false&developer_data=false&sparkline=false`, { headers: { 'x-cg-demo-api-key': KEY_DETAILS } })
      .then(r => r.json()).then(d => {
        let desc = (d.description?.en || '').replace(/<[^>]+>/g, '');
        desc = desc.split('. ').slice(0, 4).join('. ') + '.';
        setExtra({ description: desc, genesis_date: d.genesis_date, algorithm: d.hashing_algorithm, whitepaper: d.links?.whitepaper, subreddit: d.links?.subreddit_url, telegram: d.links?.telegram_channel_identifier ? `https://t.me/${d.links.telegram_channel_identifier}` : undefined, tags: d.categories?.filter((t: string) => t && t.length < 25).slice(0, 6) });
      }).catch(() => {});
  }, [coin.id]);

  // BLOOPA CHART: beige thin line, no green/red, High/Low inside
  useEffect(() => {
    if (!containerRef.current || chartData.length === 0) return;
    const chart = createChart(containerRef.current, {
      layout: { background: { type: ColorType.Solid, color: 'transparent' }, textColor: '#666', fontFamily: 'Inter, sans-serif' },
      grid: { vertLines: { visible: false }, horzLines: { color: 'rgba(255,255,255,0.03)', style: 1 } },
      width: containerRef.current.clientWidth, height: 420,
      rightPriceScale: { visible: false },
      timeScale: { borderVisible: false, timeVisible: tf === '24H', rightOffset: 2 },
      crosshair: { mode: 1, vertLine: { color: 'rgba(255,255,255,0.2)', labelBackgroundColor: '#333' }, horzLine: { color: 'rgba(255,255,255,0.2)', labelBackgroundColor: '#333' } },
    });
    const BEIGE = '#E8D5B0';
    const series: any = chart.addAreaSeries({ lineColor: BEIGE, topColor: 'rgba(232,213,176,0.12)', bottomColor: 'rgba(232,213,176,0)', lineWidth: 1, priceLineVisible: false, lastValueVisible: false, crosshairMarkerVisible: true });
    series.setData(chartData);
    const vals = chartData.map((d: any) => d.value);
    const high = Math.max(...vals), low = Math.min(...vals);
    // High / Low labels like Bloopa - inside chart
    series.createPriceLine({ price: high, color: '#888', lineWidth: 1, lineStyle: 2, axisLabelVisible: false, title: `High $${high.toFixed(6)}` });
    series.createPriceLine({ price: low, color: '#888', lineWidth: 1, lineStyle: 2, axisLabelVisible: false, title: `Low $${low.toFixed(6)}` });
    chart.subscribeCrosshairMove((p: any) => { const v = p?.seriesData?.get(series); setHoverPrice(v ? v.value : null); });
    const onResize = () => chart.applyOptions({ width: containerRef.current?.clientWidth || 800 });
    window.addEventListener('resize', onResize);
    chart.timeScale().fitContent();
    return () => { window.removeEventListener('resize', onResize); chart.remove(); };
  }, [chartData, tf]);

  const bullish = Math.min(90, Math.max(10, 50 + ch24 * 2));

  return (
    <div className="w-full min-h-screen text-slate-200 pb-16 font-sans relative" style={{ background: '#0A0A0A' }}>
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      {/* BLOOPA = narrow centered, not 1600px */}
      <div className="w-full max-w-[1100px] mx-auto px-4 sm:px-6 relative z-10">
        <div className="flex items-center justify-between py-6">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
            <button onClick={onBack} className="hover:text-white">Cryptocurrencies</button><ChevronRight className="w-3 h-3" /><span className="text-white capitalize">{coin.name} Price</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => { navigator.clipboard.writeText(window.location.href); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#1a1a1a] text-slate-300 text-xs border border-[#2a2a2a]">{copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}<span className="hidden sm:inline">{copied ? 'Copied' : 'Share'}</span></button>
            <button onClick={() => onToggleFavorite(coin.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#1a1a1a] text-slate-300 text-xs border border-[#2a2a2a]"><Star className={`w-3.5 h-3.5 ${isFav ? 'fill-amber-400 text-amber-400' : ''}`} /><span className="hidden sm:inline">{isFav ? 'Watchlisted' : 'Watchlist'}</span></button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 mt-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-white shrink-0"><img src={coin.image} alt={coin.name} className="w-full h-full object-contain p-1" /></div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">{coin.name} <span className="text-slate-500 font-normal">Price</span></h1>
              <div className="flex items-center gap-2 mt-2"><span className="text-[11px] font-bold uppercase text-slate-300 bg-[#1a1a1a] border border-[#2a2a2a] px-2 py-0.5 rounded">{coin.symbol}</span><span className="text-[11px] font-bold uppercase text-slate-300 bg-[#1a1a1a] border border-[#2a2a2a] px-2 py-0.5 rounded">Rank #{coin.market_cap_rank}</span></div>
            </div>
          </div>
          <div className="flex flex-col md:items-end">
            <div className="text-5xl sm:text-6xl font-bold text-white tracking-tighter tabular-nums">{formatCurrency(hoverPrice ?? coin.current_price)}</div>
            <div className="flex items-center gap-3 mt-2 text-sm font-semibold">
              <span className={ch24 >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{ch24 >= 0 ? '▲' : '▼'} {Math.abs(ch24).toFixed(2)}% <span className="text-slate-500 font-normal">24h</span></span>
              <span className={ch7d >= 0 ? 'text-emerald-400' : 'text-rose-400'}>{ch7d >= 0 ? '▲' : '▼'} {Math.abs(ch7d).toFixed(2)}% <span className="text-slate-500 font-normal">7D</span></span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-[#1a1a1a] pt-4">
          <div className="flex items-center gap-1 bg-[#111] p-1 rounded-lg border border-[#1a1a1a]">
            {(['24H', '7D', '1M', '3M', '1Y', 'MAX'] as TF[]).map(t => (
              <button key={t} onClick={() => setTf(t)} className={`px-4 py-1.5 text-xs font-bold rounded-md ${tf === t ? 'bg-white text-black' : 'text-slate-400 hover:text-white hover:bg-[#222]'}`}>{t}</button>
            ))}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500"><MoveHorizontal className="w-4 h-4" /><span>Drag across the chart to measure a move</span></div>
        </div>

        <div className="relative w-full mt-4 mb-8 border-b border-[#1a1a1a]">
          {loading && <div className="absolute inset-0 z-10 flex items-center justify-center text-slate-500 text-sm">Loading chart...</div>}
          <div ref={containerRef} className="w-full h-[420px] cursor-crosshair" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-[#1a1a1a] border-y border-[#1a1a1a]">
          <div className="py-6 pr-6"><div className="text-[10px] font-bold tracking-wider text-slate-500 uppercase mb-1">Market Cap</div><div className="text-xl font-bold text-white font-mono">{formatCompactNumber(coin.market_cap)}</div></div>
          <div className="py-6 px-6"><div className="text-[10px] font-bold tracking-wider text-slate-500 uppercase mb-1">24H Volume</div><div className="text-xl font-bold text-white font-mono">{formatCompactNumber(coin.total_volume)}</div><div className="text-[11px] text-slate-500 mt-1">{volPct}% of market cap</div></div>
          <div className="py-6 px-6"><div className="text-[10px] font-bold tracking-wider text-slate-500 uppercase mb-1">Fully Diluted Value</div><div className="text-xl font-bold text-white font-mono">{coin.fully_diluted_valuation ? formatCompactNumber(coin.fully_diluted_valuation) : '-'}</div></div>
          <div className="py-6 pl-6"><div className="text-[10px] font-bold tracking-wider text-slate-500 uppercase mb-1">24H Range</div><div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mt-2 mb-1"><span>{formatCurrency(coin.low_24h)}</span><span>{formatCurrency(coin.high_24h)}</span></div><div className="w-full h-[3px] bg-[#222] rounded-full relative"><div className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-rose-500 to-emerald-500 rounded-full" style={{ width: '100%' }} /><div className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white rounded-full border border-black" style={{ left: `calc(${Math.min(100, Math.max(0, ((coin.current_price - coin.low_24h) / (coin.high_24h - coin.low_24h || 1)) * 100))}% - 5px)` }} /></div></div>
        </div>

        <div className="mt-16 grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="space-y-8">
            <div className="grid grid-cols-2 gap-x-4 gap-y-6 pb-6 border-b border-[#1a1a1a]">
              <div><div className="text-[10px] font-bold tracking-wider text-slate-500 uppercase mb-1">Launched</div><div className="text-sm text-slate-200">{extra.genesis_date || '-'}</div></div>
              <div><div className="text-[10px] font-bold tracking-wider text-slate-500 uppercase mb-1">Algorithm</div><div className="text-sm text-slate-200">{extra.algorithm || '-'}</div></div>
              <div><div className="text-[10px] font-bold tracking-wider text-slate-500 uppercase mb-1">Symbol</div><div className="text-sm text-slate-200">{coin.symbol.toUpperCase()}</div></div>
              <div><div className="text-[10px] font-bold tracking-wider text-slate-500 uppercase mb-1">Reading Time</div><div className="text-sm text-slate-200">1 min</div></div>
            </div>
            <div className="pb-6 border-b border-[#1a1a1a]"><div className="text-[10px] font-bold tracking-wider text-slate-500 uppercase mb-3">Community Sentiment</div><div className="flex w-full h-2 rounded-full overflow-hidden mb-2"><div className="bg-emerald-500 h-full" style={{ width: `${bullish}%` }} /><div className="bg-rose-500 h-full" style={{ width: `${100 - bullish}%` }} /></div><div className="flex justify-between text-[11px]"><span className="text-emerald-400">{Math.round(bullish)}% bull</span><span className="text-rose-400">{Math.round(100 - bullish)}% bear</span></div></div>
            <div className="flex flex-col border-t border-[#1a1a1a]">
              {coin.homepage && <a href={coin.homepage} target="_blank" rel="noreferrer" className="flex items-center gap-3 py-3 border-b border-[#1a1a1a] text-sm text-slate-300 hover:text-white"><Globe className="w-4 h-4 text-slate-500" /> Website</a>}
              {extra.whitepaper && <a href={extra.whitepaper} target="_blank" rel="noreferrer" className="flex items-center gap-3 py-3 border-b border-[#1a1a1a] text-sm text-slate-300 hover:text-white"><FileText className="w-4 h-4 text-slate-500" /> Whitepaper</a>}
              {coin.blockchain_site && <a href={coin.blockchain_site} target="_blank" rel="noreferrer" className="flex items-center gap-3 py-3 border-b border-[#1a1a1a] text-sm text-slate-300 hover:text-white"><Compass className="w-4 h-4 text-slate-500" /> Explorer</a>}
              {coin.github && <a href={coin.github} target="_blank" rel="noreferrer" className="flex items-center gap-3 py-3 border-b border-[#1a1a1a] text-sm text-slate-300 hover:text-white"><Github className="w-4 h-4 text-slate-500" /> GitHub</a>}
              {coin.twitter_screen_name && <a href={`https://twitter.com/${coin.twitter_screen_name}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 py-3 border-b border-[#1a1a1a] text-sm text-slate-300 hover:text-white"><Twitter className="w-4 h-4 text-slate-500" /> X / Twitter</a>}
              {extra.subreddit && <a href={extra.subreddit} target="_blank" rel="noreferrer" className="flex items-center gap-3 py-3 border-b border-[#1a1a1a] text-sm text-slate-300 hover:text-white"><MessageCircle className="w-4 h-4 text-slate-500" /> Reddit</a>}
              {extra.telegram && <a href={extra.telegram} target="_blank" rel="noreferrer" className="flex items-center gap-3 py-3 border-b border-[#1a1a1a] text-sm text-slate-300 hover:text-white"><Send className="w-4 h-4 text-slate-500" /> Telegram</a>}
            </div>
            {extra.tags?.length > 0 && <div className="flex flex-wrap gap-2 pt-2">{(showAllTags ? extra.tags : extra.tags.slice(0, 3)).map((t: string, i: number) => <span key={i} className="px-3 py-1.5 rounded-md bg-[#111] border border-[#222] text-[11px] text-slate-300">{t}</span>)}{!showAllTags && extra.tags.length > 3 && <button onClick={() => setShowAllTags(true)} className="px-2 py-1.5 rounded-md bg-[#111] border border-[#222] text-[11px]">+{extra.tags.length - 3}</button>}</div>}
          </div>
          <div className="lg:col-span-2"><div className="flex items-center gap-3 mb-6"><span className="text-[10px] font-bold tracking-wider text-emerald-500 uppercase">04 Story</span></div><h2 className="text-3xl font-bold text-white mb-8">About {coin.name}</h2><p className="text-[17px] leading-relaxed text-slate-200 mb-6 first-letter:text-6xl first-letter:font-bold first-letter:float-left first-letter:mr-3 first-letter:mt-1 first-letter:text-white">{extra.description || `Loading real ${coin.name} details from CoinGecko...`}</p><p className="text-[15px] leading-relaxed text-slate-400">Users can purchase, trade, and utilize {coin.name} at thousands of merchants and major exchanges around the globe.</p></div>
        </div>
      </div>
    </div>
  );
};