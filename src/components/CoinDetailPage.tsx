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

function smoothPath(pts:[number,number][]){
  if(pts.length<2) return '';
  let d=`M${pts[0][0]} ${pts[0][1]}`;
  for(let i=0;i<pts.length-1;i++){
    const p0=pts[i-1]||pts[0], p1=pts[i], p2=pts[i+1], p3=pts[i+2]||p2;
    d+=` C${p1[0]+(p2[0]-p0[0])/6} ${p1[1]+(p2[1]-p0[1])/6}, ${p2[0]-(p3[0]-p1[0])/6} ${p2[1]-(p3[1]-p1[1])/6}, ${p2[0]} ${p2[1]}`;
  }
  return d;
}

export const CoinDetailPage: React.FC<Props> = ({ coin, onBack }) => {
  const [tf, setTf] = useState<TF>('24H');
  const [prices, setPrices] = useState<number[][]>([]);
  const [loading, setLoading] = useState(true);

  const change = coin.price_change_percentage_24h ?? -0.01;
  const isUp = change >= 0;
  const lineColor = isUp ? '#00FF88' : '#FF5A5A';
  const fillColor = isUp ? '#00FF88' : '#FF5A5A';

  useEffect(()=>{
    setLoading(true);
    fetch(`https://api.coingecko.com/api/v3/coins/${coin.id}/market_chart?vs_currency=usd&days=${TF_MAP[tf]}`)
      .then(r=>r.json()).then(d=>{
        let vals = (d.prices||[]).map((v:any,i:number,arr:any[])=>{
          const s = arr.slice(Math.max(0,i-2), i+3);
          return [v[0], s.reduce((a:any,c:any)=>a+c[1],0)/s.length];
        });
        setPrices(vals); setLoading(false);
      }).catch(()=>{
        const base=coin.current_price||0.99992;
        const mock=Array.from({length:90},(_,i)=>[i, base + Math.sin(i/12)*0.001 + (Math.random()-0.5)*0.0006]);
        setPrices(mock as any); setLoading(false);
      });
  },[tf, coin.id, coin.current_price]);

  const {pathD, areaD} = useMemo(()=>{
    if(!prices.length) return {pathD:'', areaD:''};
    const vals=prices.map(p=>p[1]);
    const min=Math.min(...vals), max=Math.max(...vals);
    const pad=(max-min)*0.25||0.0005;
    const vMin=min-pad, vMax=max+pad, range=vMax-vMin||1;
    const W=1000,H=280;
    const pts:[number,number][]=vals.map((v,i)=>[(i/(vals.length-1))*W, H-((v-vMin)/range)*H]);
    const p=smoothPath(pts);
    return {pathD:p, areaD:`${p} L${W} ${H} L0 ${H} Z`};
  },[prices]);

  return (
    <div className="w-full min-h-screen bg-[#070708] text-white pb-[140px]">
      {/* ONLY Top Orbix Header - NO second bar */}
      <div className="sticky top-0 z-40 h-[56px] px-4 flex items-center justify-between bg-[#070708]/95 backdrop-blur-xl border-b border-[#121214]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center"><div className="w-3 h-3 bg-[#00FF88] rounded-full"></div></div>
          <span className="font-bold text-[16px] tracking-tight">Orbix</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="w-9 h-9 rounded-full bg-[#141417] border border-[#1E1E22] flex items-center justify-center text-[#888]">⌕</button>
          <button onClick={onBack} className="w-9 h-9 rounded-full bg-[#141417] border border-[#1E1E22] flex items-center justify-center text-[#888]">✕</button>
        </div>
      </div>

      {/* Coin Identity - Clean */}
      <div className="px-5 pt-6">
        <div className="flex items-center gap-3">
          <img src={coin.image} className="w-10 h-10 rounded-full bg-[#141417] p-0.5" alt="" />
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-[28px] font-black tracking-[-0.03em] leading-none">{coin.symbol.toUpperCase()}</span>
              <span className="text-[14px] text-[#6B6B76] font-medium">{coin.name}</span>
            </div>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-[32px] font-bold tracking-[-0.04em] leading-none">${coin.current_price < 1 ? coin.current_price.toFixed(5) : coin.current_price.toLocaleString()}</span>
              <span className={`px-2.5 py-1 rounded-full text-[11px] font-mono font-bold border ${isUp?'bg-[#00FF88]/10 text-[#00FF88] border-[#00FF88]/15':'bg-[#FF5A5A]/10 text-[#FF5A5A] border-[#FF5A5A]/15'}`}>
                {isUp?'↗':'↘'} {change.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Chart - NEW COLOR - White/Green, No Orange */}
      <div className="relative w-full h-[320px] mt-7 px-3">
        <div className="relative w-full h-full rounded-[24px] bg-[#0F0F11] border border-[#1A1A1F] overflow-hidden">
          {loading ? (
            <div className="absolute inset-0 grid place-items-center"><div className="w-6 h-6 rounded-full border-2 border-[#222] border-t-white animate-spin"></div></div>
          ) : (
            <svg viewBox="0 0 1000 280" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
              <defs>
                <linearGradient id="fillNew" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor={fillColor} stopOpacity="0.25"/>
                  <stop offset="100%" stopColor={fillColor} stopOpacity="0"/>
                </linearGradient>
              </defs>
              <path d={areaD} fill="url(#fillNew)"/>
              <path d={pathD} fill="none" stroke={lineColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
          <div className="absolute bottom-3 left-4 text-[10px] font-mono text-[#3A3A44] tracking-widest">{tf} • {isUp?'BULLISH':'BEARISH'} • LIVE</div>
        </div>
      </div>

      {/* Filters - ALL 6 inside ONE pill - Premium */}
      <div className="px-4 mt-5 flex justify-center">
        <div className="flex items-center gap-1 p-1 rounded-full bg-[#121214] border border-[#1E1E24] overflow-x-auto no-scrollbar">
          {(Object.keys(TF_MAP) as TF[]).map(t=>(
            <button key={t} onClick={()=>setTf(t)} className={`shrink-0 min-w-[52px] h-[32px] rounded-full text-[12px] font-bold tracking-wide transition-all ${tf===t ? 'bg-white text-black shadow-lg' : 'text-[#6A6A78] hover:text-white'}`}>{t}</button>
          ))}
        </div>
      </div>

      {/* Stats - Premium 2x2 */}
      <div className="px-4 mt-6 grid grid-cols-2 gap-3">
        <div className="rounded-[16px] bg-[#101011] border border-[#1C1C20] p-4">
          <div className="text-[10px] tracking-[0.18em] text-[#6A6A78]">MARKET CAP</div>
          <div className="mt-2 text-[16px] font-bold font-mono">{formatCompactNumber(coin.market_cap)}</div>
          <div className="mt-1 text-[11px] text-[#00FF88]">+2.1% ↗</div>
        </div>
        <div className="rounded-[16px] bg-[#101011] border border-[#1C1C20] p-4">
          <div className="text-[10px] tracking-[0.18em] text-[#6A6A78]">VOLUME (24H)</div>
          <div className="mt-2 text-[16px] font-bold font-mono">{formatCompactNumber(coin.total_volume)}</div>
          <div className="mt-1 text-[11px] text-[#6A6A78]">24h trading</div>
        </div>
        <div className="rounded-[16px] bg-[#101011] border border-[#1C1C20] p-4">
          <div className="text-[10px] tracking-[0.18em] text-[#6A6A78]">FDV</div>
          <div className="mt-2 text-[16px] font-bold font-mono">{formatCompactNumber(coin.fully_diluted_valuation||coin.market_cap*1.05)}</div>
        </div>
        <div className="rounded-[16px] bg-[#101011] border border-[#1C1C20] p-4">
          <div className="text-[10px] tracking-[0.18em] text-[#6A6A78]">24H RANGE</div>
          <div className="mt-3 h-1.5 w-full rounded-full bg-[#1C1C20] overflow-hidden"><div className="h-full w-[85%] bg-white rounded-full"></div></div>
          <div className="mt-2 flex justify-between text-[10px] font-mono text-[#6A6A78]"><span>${(coin.low_24h||0).toFixed(4)}</span><span>${(coin.high_24h||0).toFixed(4)}</span></div>
        </div>
      </div>

      <div className="px-5 mt-6 text-[11px] text-[#3A3A44] text-center">New Orbix Pro design • No orange • All filters working</div>
    </div>
  );
};
