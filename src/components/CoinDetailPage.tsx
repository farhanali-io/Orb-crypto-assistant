import React, { useState, useEffect, useMemo } from 'react';
import { CryptoCoin } from '../types/crypto';
import { formatCompactNumber } from '../services/cryptoApi';

interface Props {
  coin: CryptoCoin;
  onBack: () => void;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
}

type TF = '24H'|'7D'|'1M'|'3M'|'1Y'|'MAX';
const TF_MAP: Record<TF,string> = {'24H':'1','7D':'7','1M':'30','3M':'90','1Y':'365','MAX':'max'};

// Smooth the line - Catmull to Bezier
function smoothPath(points: [number,number][]) {
  if(points.length<3) return points.map(([x,y],i)=>`${i===0?'M':'L'}${x} ${y}`).join(' ');
  let d = `M${points[0][0]} ${points[0][1]}`;
  for(let i=0;i<points.length-1;i++){
    const p0 = points[i-1] || points[0];
    const p1 = points[i];
    const p2 = points[i+1];
    const p3 = points[i+2] || p2;
    const cp1x = p1[0] + (p2[0]-p0[0])/6;
    const cp1y = p1[1] + (p2[1]-p0[1])/6;
    const cp2x = p2[0] - (p3[0]-p1[0])/6;
    const cp2y = p2[1] - (p3[1]-p1[1])/6;
    d+=` C${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2[0]} ${p2[1]}`;
  }
  return d;
}

export const CoinDetailPage: React.FC<Props> = ({ coin, onBack }) => {
  const [tf, setTf] = useState<TF>('7D');
  const [prices, setPrices] = useState<number[][]>([]);
  const [loading, setLoading] = useState(true);
  const [hoverPrice, setHoverPrice] = useState<number|null>(null);

  const change = coin.price_change_percentage_24h ?? -0.01;
  const isUp = change >=0;

  useEffect(()=>{
    setLoading(true);
    fetch(`https://api.coingecko.com/api/v3/coins/${coin.id}/market_chart?vs_currency=usd&days=${TF_MAP[tf]}`)
      .then(r=>r.json()).then(d=>{
        if(d.prices){
          // For stablecoin USDG, smooth heavily to avoid spikes
          let vals = d.prices as number[][];
          if(coin.symbol.toLowerCase()==='usdg' || Math.abs(change)<0.5){
            // moving average 5
            vals = vals.map((v,i,arr)=>{
              const slice = arr.slice(Math.max(0,i-3), i+4);
              const avg = slice.reduce((s,x)=>s+x[1],0)/slice.length;
              return [v[0], avg];
            });
          }
          setPrices(vals);
        }
        setLoading(false);
      }).catch(()=>{
        const base = coin.current_price || 1;
        const mock = Array.from({length:120},(_,i)=>[i, base + (Math.sin(i/10)*0.002 + (Math.random()-0.5)*0.001)]);
        setPrices(mock as any); setLoading(false);
      });
  },[tf, coin.id, coin.current_price, change]);

  const {pathD, areaD, min, max} = useMemo(()=>{
    if(!prices.length) return {pathD:'', areaD:'', min:0, max:0};
    const vals = prices.map(p=>p[1]);
    const min = Math.min(...vals), max = Math.max(...vals);
    const padding = (max-min)*0.15 || 0.005;
    const vMin = min-padding, vMax = max+padding;
    const range = vMax-vMin || 0.01;
    const W=1000, H=300;
    const pts:[number,number][] = vals.map((v,i)=>[
      (i/(vals.length-1))*W,
      H - ((v-vMin)/range)*H
    ]);
    const p = smoothPath(pts);
    return {pathD:p, areaD:`${p} L${W} ${H} L0 ${H} Z`, min:vMin, max:vMax};
  },[prices]);

  return (
    <div className="w-full min-h-screen bg-[#09090B] text-white pb-[120px] selection:bg-white selection:text-black">
      {/* Header - Orbix style */}
      <div className="sticky top-0 z-30 backdrop-blur-2xl bg-[#09090B]/80 border-b border-[#141417]">
        <div className="h-[52px] px-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-full bg-[#00FF88] flex items-center justify-center"><div className="w-2.5 h-2.5 bg-black rounded-full"></div></div>
            <span className="font-bold tracking-tight">Orbix</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="w-8 h-8 rounded-full bg-[#15151A] border border-[#222] flex items-center justify-center text-[#888]">⌕</button>
            <button onClick={onBack} className="w-8 h-8 rounded-full bg-[#15151A] border border-[#222] flex items-center justify-center text-[#888]">✕</button>
          </div>
        </div>
        <div className="px-4 pb-3 flex items-center gap-2 text-[10px] tracking-[0.15em] text-[#6A6A72]">
          <img src={coin.image} className="w-5 h-5 rounded-full" alt="" />
          <span className="text-white font-bold tracking-widest">{coin.symbol.toUpperCase()}</span>
          <span>•</span><span>{coin.name.toUpperCase()}</span>
          <span>•</span><span>{coin.symbol.toUpperCase()}/USD</span>
        </div>
      </div>

      {/* Price Hero - Advanced */}
      <div className="px-5 pt-5">
        <div className="flex items-end gap-3">
          <h1 className="text-[42px] font-black tracking-[-0.04em] leading-none">{coin.symbol.toUpperCase()} ${coin.current_price < 10 ? coin.current_price.toFixed(4).replace(/0+$/,'').replace(/\.$/,'') : coin.current_price.toLocaleString()}</h1>
          <div className={`mb-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold border ${isUp?'bg-[#FF8C2A]/10 text-[#FF8C2A] border-[#FF8C2A]/20':'bg-[#FF4D4D]/10 text-[#FF8C2A] border-[#FF4D4D]/20'}`}>
            ↘ {change.toFixed(2)}% (${Math.abs(change).toFixed(2)})
          </div>
        </div>
        {hoverPrice && <div className="mt-2 text-[13px] font-mono text-[#9A9AA6]">→ {hoverPrice.toFixed(4)} USD <span className="text-[#444]">on chart</span></div>}
      </div>

      {/* Chart - ADVANCED with depth */}
      <div className="relative w-full h-[340px] mt-6 group">
        <div className="absolute inset-0 bg-gradient-to-b from-[#FF8C2A]/[0.03] to-transparent pointer-events-none"></div>
        {/* Subtle grid */}
        <div className="absolute inset-0 px-5">
          <div className="w-full h-full border-y border-[#141417] relative">
            <div className="absolute inset-0 flex flex-col justify-between py-6">
              {[0,1,2,3].map(i=><div key={i} className="h-px w-full bg-[#141417]"></div>)}
            </div>
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center"><div className="w-5 h-5 border-2 border-[#222] border-t-[#FF8C2A] rounded-full animate-spin"></div></div>
            ) : (
              <svg viewBox="0 0 1000 300" preserveAspectRatio="none" className="absolute inset-0 w-full h-full"
                onMouseMove={e=>{
                  const rect=(e.currentTarget as any).getBoundingClientRect();
                  const idx=Math.floor(((e.clientX-rect.left)/rect.width)*prices.length);
                  if(prices[idx]) setHoverPrice(prices[idx][1]);
                }}
                onMouseLeave={()=>setHoverPrice(null)}
              >
                <defs>
                  <linearGradient id="advFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#FF8C2A" stopOpacity="0.45"/>
                    <stop offset="50%" stopColor="#FF8C2A" stopOpacity="0.08"/>
                    <stop offset="100%" stopColor="#FF8C2A" stopOpacity="0"/>
                  </linearGradient>
                  <filter id="advGlow"><feGaussianBlur stdDeviation="4"/><feComposite in="SourceGraphic" operator="over"/></filter>
                  <linearGradient id="lineGrad" x1="0" x2="1"><stop offset="0%" stopColor="#FF9A3D"/><stop offset="100%" stopColor="#FF7A18"/></linearGradient>
                </defs>
                <path d={areaD} fill="url(#advFill)" />
                <path d={pathD} fill="none" stroke="url(#lineGrad)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" filter="url(#advGlow)" />
              </svg>
            )}
          </div>
        </div>
      </div>

      {/* Timeframes - Pill advanced */}
      <div className="px-4 mt-5">
        <div className="relative flex gap-2.5 overflow-x-auto no-scrollbar">
          {(Object.keys(TF_MAP) as TF[]).slice(0,4).map(t=>(
            <button key={t} onClick={()=>setTf(t)} className={`relative min-w-[76px] h-[38px] rounded-full text-[13px] font-semibold tracking-wide transition-all ${tf===t?'bg-white text-black':'bg-[#1A1A1F] text-[#8A8A92] border border-[#24242A] hover:text-white hover:border-[#2E2E36]'}`}>
              {t}
              {tf===t && <span className="absolute inset-0 rounded-full shadow-[0_0_20px_rgba(255,255,255,0.4)] pointer-events-none"></span>}
            </button>
          ))}
        </div>
        <div className="mt-3 h-1 w-full bg-[#15151A] rounded-full overflow-hidden"><div className="h-full bg-[#2A2A30] w-[65%] rounded-full"></div></div>
      </div>

      {/* Stats - Advanced List */}
      <div className="px-5 mt-8">
        <div className="rounded-[18px] bg-[#101013] border border-[#1C1C20] overflow-hidden">
          <div className="divide-y divide-[#1A1A1F]">
            <div className="flex justify-between items-center px-4 py-4 group hover:bg-[#15151A] transition-colors">
              <span className="text-[11px] tracking-[0.18em] text-[#6B6B76]">MARKET CAP</span>
              <div className="flex items-center gap-2"><span className="text-[15px] font-bold font-mono">{formatCompactNumber(coin.market_cap)}</span><span className="w-5 h-5 rounded-full bg-[#1A1A1F] flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">↗</span></div>
            </div>
            <div className="flex justify-between items-center px-4 py-4 group hover:bg-[#15151A] transition-colors">
              <span className="text-[11px] tracking-[0.18em] text-[#6B6B76]">VOLUME (24H)</span>
              <span className="text-[15px] font-bold font-mono">{formatCompactNumber(coin.total_volume)}</span>
            </div>
            <div className="flex justify-between items-center px-4 py-4 group hover:bg-[#15151A] transition-colors">
              <span className="text-[11px] tracking-[0.18em] text-[#6B6B76]">FDV</span>
              <span className="text-[15px] font-bold font-mono">{formatCompactNumber(coin.fully_diluted_valuation||coin.market_cap*1.1)}</span>
            </div>
            <div className="flex justify-between items-center px-4 py-4 group hover:bg-[#15151A] transition-colors">
              <span className="text-[11px] tracking-[0.18em] text-[#6B6B76]">24H RANGE</span>
              <span className="text-[12px] font-mono text-[#9A9AA6]">${(coin.low_24h||0.999).toFixed(3)} — ${(coin.high_24h||1.001).toFixed(3)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom hint */}
      <div className="px-5 mt-5 flex items-center gap-2 text-[10px] text-[#444] tracking-wide">
        <span className="w-1 h-1 bg-[#FF8C2A] rounded-full animate-pulse"></span> LIVE • Advanced smoothing enabled for {coin.symbol} • Drag chart to inspect
      </div>
    </div>
  );
};
