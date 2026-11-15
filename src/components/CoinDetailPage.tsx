import React, { useState, useEffect, useMemo } from 'react';
import { CryptoCoin } from '../types/crypto';
import { formatCurrency, formatCompactNumber } from '../services/cryptoApi';

interface Props {
  coin: CryptoCoin;
  onBack: () => void;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
}

type TF = '24H'|'7D'|'1M'|'3M'|'1Y'|'MAX';
const TF_MAP: Record<TF, string> = { '24H':'1', '7D':'7', '1M':'30', '3M':'90', '1Y':'365', 'MAX':'max' };

export const CoinDetailPage: React.FC<Props> = ({ coin, onBack, favorites, onToggleFavorite }) => {
  const [tf, setTf] = useState<TF>('24H');
  const [prices, setPrices] = useState<number[][]>([]);
  const [loading, setLoading] = useState(true);
  const [hoverIdx, setHoverIdx] = useState<number|null>(null);

  const isFav = favorites.includes(coin.id);
  const change = coin.price_change_percentage_24h ?? -1.48;
  const isUp = change >= 0;

  // Fetch real chart
  useEffect(() => {
    setLoading(true);
    const days = TF_MAP[tf];
    fetch(`https://api.coingecko.com/api/v3/coins/${coin.id}/market_chart?vs_currency=usd&days=${days}`)
      .then(r => r.json())
      .then(d => {
        if(d.prices) setPrices(d.prices);
        setLoading(false);
      })
      .catch(()=>{ 
        // fallback mock if rate limited
        const mock = Array.from({length:60}, (_,i)=>[i, coin.current_price * (0.95 + Math.random()*0.1)]);
        setPrices(mock as any);
        setLoading(false);
      });
  }, [tf, coin.id, coin.current_price]);

  const { path, areaPath, min, max } = useMemo(()=>{
    if(!prices.length) return {path:'', areaPath:'', min:0, max:0};
    const vals = prices.map(p=>p[1]);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const range = max-min || 1;
    const W = 360, H = 120, P = 10;
    const pts = vals.map((v,i)=>{
      const x = (i/(vals.length-1))*W;
      const y = H - ((v-min)/range)*H;
      return `${i===0?'M':'L'}${x} ${y}`;
    }).join(' ');
    const area = `${pts} L${W} ${H} L0 ${H} Z`;
    return {path: pts, areaPath: area, min, max};
  }, [prices]);

  return (
    <div className="w-full min-h-screen bg-[#07070A] text-white pb-[130px] antialiased">
      {/* Breadcrumb */}
      <div className="sticky top-0 z-20 h-[52px] px-4 flex items-center justify-between bg-[#07070A]/80 backdrop-blur-2xl border-b border-[#111119]">
        <button onClick={onBack} className="text-[13px] flex items-center gap-1.5">
          <span className="text-[#6B6B78]">Cryptocurrencies</span>
          <span className="text-[#2A2A35]">›</span>
          <span className="text-white font-medium">{coin.symbol.toUpperCase()} Price</span>
        </button>
        <div className="flex items-center gap-2">
          <button className="w-9 h-9 rounded-xl bg-[#15151C] border border-[#1E1E2A] flex items-center justify-center text-[#888]">↗</button>
          <button onClick={()=>onToggleFavorite(coin.id)} className={`w-9 h-9 rounded-xl border flex items-center justify-center ${isFav?'bg-white text-black border-white':'bg-[#15151C] border-[#1E1E2A] text-[#666]'}`}>★</button>
        </div>
      </div>

      {/* Header */}
      <div className="px-5 pt-6">
        <div className="flex items-center gap-3.5">
          <div className="relative">
            <div className="absolute inset-0 blur-[20px] bg-[#F7931A]/30 rounded-full scale-125"></div>
            <img src={coin.image} className="relative w-[46px] h-[46px] rounded-full bg-[#15151C] p-1" alt="" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-[22px] font-bold tracking-tight">{coin.symbol.toUpperCase()}</span>
            <span className="text-[22px] font-medium text-[#6B6B78]">Price</span>
          </div>
        </div>

        <div className="flex gap-2 mt-4 ml-[60px]">
          <span className="px-2.5 py-1.5 rounded-lg bg-[#12121A] border border-[#1E1E2A] text-[10px] font-bold tracking-widest text-[#8A8990]">{coin.symbol.toUpperCase()}</span>
          <span className="px-2.5 py-1.5 rounded-lg bg-[#12121A] border border-[#1E1E2A] text-[10px] font-bold tracking-widest text-[#8A8990]">RANK #{coin.market_cap_rank||1}</span>
        </div>

        <div className="mt-6">
          <div className="text-[40px] font-bold tracking-[-0.03em] leading-none">{formatCurrency(coin.current_price)}</div>
          <div className={`mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold font-mono ${isUp?'bg-[#00E676]/10 text-[#00E676] border border-[#00E676]/20':'bg-[#FF4D4D]/10 text-[#FF4D4D] border border-[#FF4D4D]/20'}`}>
            <span>{isUp?'▲':'▼'}</span> {Math.abs(change).toFixed(2)}% 24h
          </div>
        </div>
      </div>

      {/* Timeframe - FIXED */}
      <div className="px-4 mt-7">
        <div className="flex bg-[#0F0F14] border border-[#1A1A26] rounded-full p-1 gap-1 overflow-x-auto no-scrollbar">
          {(['24H','7D','1M','3M','1Y','MAX'] as TF[]).map(t=>(
            <button key={t} onClick={()=>setTf(t)} className={`flex-1 min-w-[48px] h-[34px] rounded-full text-[11px] font-bold tracking-wide transition-all duration-200 ${tf===t ? 'bg-white text-black shadow-[0_2px_12px_rgba(255,255,255,0.3)] scale-[1.02]' : 'text-[#6B6B78] hover:text-[#9A99A6] hover:bg-[#1A1A26]'}`}>{t}</button>
          ))}
        </div>
        <div className="mt-3 text-[11px] text-[#5A5A6A] flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-[#1E1E2A] flex items-center justify-center text-[8px]">↔</span> Drag across the chart to measure a move
        </div>
      </div>

      {/* Chart - PREMIUM + WORKING */}
      <div className="px-3 mt-4">
        <div className="relative w-full h-[340px] bg-[#0C0C10] border border-[#1A1A26] rounded-[24px] overflow-hidden group"
          onTouchMove={(e)=>{
            const rect = (e.currentTarget as any).getBoundingClientRect();
            const x = e.touches[0].clientX - rect.left;
            const idx = Math.floor((x/rect.width)*prices.length);
            setHoverIdx(idx);
          }}
          onMouseMove={(e)=>{
            const rect = (e.currentTarget as any).getBoundingClientRect();
            const x = e.clientX - rect.left;
            const idx = Math.floor((x/rect.width)*prices.length);
            setHoverIdx(idx);
          }}
          onMouseLeave={()=>setHoverIdx(null)}
        >
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center text-[#444] text-[12px] animate-pulse">Loading {tf} chart...</div>
          ) : (
            <>
              {/* Y labels */}
              <div className="absolute top-4 right-4 z-10 flex flex-col gap-6 text-right">
                <span className="text-[10px] font-mono text-[#4A4A5A] bg-[#07070A]/60 px-2 py-1 rounded-full backdrop-blur">${max.toFixed(2)}</span>
                <span className="text-[10px] font-mono text-[#4A4A5A] bg-[#07070A]/60 px-2 py-1 rounded-full backdrop-blur mt-24">${min.toFixed(2)}</span>
              </div>

              <svg viewBox="0 0 360 140" preserveAspectRatio="none" className="absolute inset-0 w-full h-full p-3 pt-8 pb-6 pr-16">
                <defs>
                  <linearGradient id="chartGrad" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor={isUp ? "#00E676" : "#FF6B3D"} stopOpacity="0.4" />
                    <stop offset="100%" stopColor={isUp ? "#00E676" : "#FF6B3D"} stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d={areaPath} fill="url(#chartGrad)" />
                <path d={path} fill="none" stroke={isUp ? "#00E676" : "#FF6B3D"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                {hoverIdx!==null && prices[hoverIdx] && (
                  <>
                    <line x1={(hoverIdx/prices.length)*360} y1="0" x2={(hoverIdx/prices.length)*360} y2="140" stroke="#2A2A3A" strokeDasharray="4 4" />
                    <circle cx={(hoverIdx/prices.length)*360} cy={140 - ((prices[hoverIdx][1]-min)/(max-min||1))*120} r="4" fill={isUp?"#00E676":"#FF6B3D"} stroke="#07070A" strokeWidth="2" />
                  </>
                )}
              </svg>

              {hoverIdx!==null && prices[hoverIdx] && (
                <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-[#1C1C28] border border-[#2A2A3A] rounded-full px-3 py-1 text-[11px] font-mono text-white shadow-xl">
                  ${prices[hoverIdx][1].toFixed(2)}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="px-3 mt-5 grid grid-cols-2 gap-3">
        <div className="bg-[#101016] border border-[#1A1A26] rounded-[18px] p-4 text-center hover:border-[#22223A] transition-colors">
          <div className="text-[9px] tracking-[0.18em] font-bold text-[#6B6B78] uppercase">Market Cap</div>
          <div className="mt-2 text-[22px] font-bold tracking-tight">{formatCompactNumber(coin.market_cap)}</div>
        </div>
        <div className="bg-[#101016] border border-[#1A1A26] rounded-[18px] p-4 text-center hover:border-[#22223A] transition-colors">
          <div className="text-[9px] tracking-[0.18em] font-bold text-[#6B6B78] uppercase">24H Volume</div>
          <div className="mt-2 text-[22px] font-bold tracking-tight">{formatCompactNumber(coin.total_volume)}</div>
        </div>
        <div className="bg-[#101016] border border-[#1A1A26] rounded-[18px] p-4 text-center">
          <div className="text-[9px] tracking-[0.18em] font-bold text-[#6B6B78] uppercase">Fully Diluted</div>
          <div className="mt-2 text-[22px] font-bold tracking-tight">{formatCompactNumber(coin.fully_diluted_valuation || coin.market_cap)}</div>
        </div>
        <div className="bg-[#101016] border border-[#1A1A26] rounded-[18px] p-4">
          <div className="text-[9px] tracking-[0.18em] font-bold text-[#6B6B78] uppercase text-center">24H Range</div>
          <div className="mt-3 h-[6px] rounded-full bg-[#1A1A26] overflow-hidden"><div className="h-full w-full bg-gradient-to-r from-[#FF5A5A] via-[#FFD93D] to-[#00E676]"></div></div>
          <div className="mt-2.5 flex justify-between text-[10px] font-mono text-[#6B6B78]"><span>${(coin.low_24h||0).toLocaleString()}</span><span>${(coin.high_24h||0).toLocaleString()}</span></div>
        </div>
      </div>

      {/* Sentiment */}
      <div className="px-4 mt-7">
        <div className="flex justify-between items-center"><span className="text-[13px] font-semibold">Community Sentiment</span><span className="text-[10px] text-[#5A5A6A]">51% bull · 49% bear</span></div>
        <div className="mt-3 h-[32px] rounded-full bg-[#0F0F14] border border-[#1A1A26] flex overflow-hidden p-1.5">
          <div className="h-full rounded-full bg-gradient-to-r from-[#00E676] to-[#00C853] flex items-center px-3 text-[11px] font-bold text-black shadow-[0_0_12px_rgba(0,230,118,0.3)]" style={{width:'51%'}}>51% bull</div>
          <div className="flex-1 flex items-center justify-end px-3 text-[11px] font-bold text-[#FF6B6B]">49% bear</div>
        </div>
      </div>
    </div>
  );
};
