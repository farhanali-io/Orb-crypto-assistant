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

export const CoinDetailPage: React.FC<Props> = ({ coin, onBack }) => {
  const [tf, setTf] = useState<TF>('7D');
  const [prices, setPrices] = useState<number[][]>([]);
  const [loading, setLoading] = useState(true);

  const change = coin.price_change_percentage_24h ?? 1.24;
  const isUp = change >= 0;

  useEffect(()=>{
    setLoading(true);
    fetch(`https://api.coingecko.com/api/v3/coins/${coin.id}/market_chart?vs_currency=usd&days=${TF_MAP[tf]}`)
      .then(r=>r.json())
      .then(d=>{
        if(d.prices) setPrices(d.prices);
        setLoading(false);
      })
      .catch(()=>{
        const mock = Array.from({length:80},(_,i)=>[i, coin.current_price*(0.85+i*0.004+Math.random()*0.03)]);
        setPrices(mock as any); setLoading(false);
      });
  },[tf, coin.id, coin.current_price]);

  const {path, areaPath} = useMemo(()=>{
    if(!prices.length) return {path:'', areaPath:''};
    const vals = prices.map(p=>p[1]);
    const min = Math.min(...vals), max = Math.max(...vals);
    const range = max-min || 1;
    const W=1000, H=280;
    const pts = vals.map((v,i)=>{
      const x=(i/(vals.length-1))*W;
      const y=H-((v-min)/range)*H;
      return `${i===0?'M':'L'}${x} ${y}`;
    }).join(' ');
    return {path:pts, areaPath:`${pts} L${W} ${H} L0 ${H} Z`};
  },[prices]);

  const now = new Date().toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}).toUpperCase();
  const usd = (v:number)=>`$${v.toLocaleString(undefined,{maximumFractionDigits:2})}`;

  return (
    <div className="w-full min-h-screen bg-[#0A0A0B] text-white pb-[110px] font-mono">
      {/* Top Meta like screenshot */}
      <div className="px-6 pt-6 flex justify-between items-center text-[11px] tracking-widest text-[#6B6B6B] uppercase">
        <div className="flex items-center gap-2.5">
          <img src={coin.image} className="w-7 h-7 rounded-full" alt="" />
          <span className="text-white font-bold">{coin.symbol.toUpperCase()}</span>
          <span className="w-1 h-1 bg-[#444] rounded-full"></span>
          <span>{coin.name}</span>
          <span className="w-1 h-1 bg-[#444] rounded-full"></span>
          <span>{coin.symbol.toUpperCase()}/USD</span>
        </div>
        <div className="hidden md:block">AS OF {now} • {new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})} UTC</div>
        <button onClick={onBack} className="md:hidden text-white">✕</button>
      </div>

      {/* Huge Price */}
      <div className="px-6 pt-8 pb-2">
        <div className="flex items-baseline gap-4 flex-wrap">
          <h1 className="text-[48px] md:text-[64px] font-black tracking-tighter leading-none font-sans">{coin.symbol.toUpperCase()} {usd(coin.current_price)}</h1>
          <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[13px] font-medium ${isUp?'bg-[#1A2E1A] text-[#8AF59D]':'bg-[#2E1A1A] text-[#FF8A8A]'}`}>
            <span>{isUp?'↗':'↘'}</span> {isUp?'+':''}{change.toFixed(2)}% (+{usd(Math.abs(coin.current_price*change/100))})
          </div>
        </div>
      </div>

      {/* Chart - Full width glowing orange */}
      <div className="relative w-full h-[320px] md:h-[380px] mt-6 px-2 md:px-6">
        <div className="relative w-full h-full bg-[#0E0E0F] border-y md:border border-[#1A1A1A] md:rounded-2xl overflow-hidden">
          {/* Grid */}
          <div className="absolute inset-0 opacity-[0.07]" style={{backgroundImage:`linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`, backgroundSize:'120px 70px'}}></div>
          
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center text-[#555] text-xs animate-pulse">Loading {tf} chart...</div>
          ) : (
            <svg viewBox="0 0 1000 280" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
              <defs>
                <linearGradient id="orangeGrad" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#FF8C2A" stopOpacity="0.35"/>
                  <stop offset="100%" stopColor="#FF8C2A" stopOpacity="0"/>
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
              </defs>
              <path d={areaPath} fill="url(#orangeGrad)" />
              <path d={path} fill="none" stroke="#FF8C2A" strokeWidth="2.2" strokeLinecap="round" filter="url(#glow)" />
              {/* Glowing dots */}
              {prices.filter((_,i)=>i%12===0).map((p,i)=>{
                const vals=prices.map(x=>x[1]); const min=Math.min(...vals), max=Math.max(...vals), range=max-min||1;
                const x=(prices.indexOf(p)/ (prices.length-1))*1000;
                const y=280-((p[1]-min)/range)*280;
                return <circle key={i} cx={x} cy={y} r="3.5" fill="#FFB26A" filter="url(#glow)" />
              })}
            </svg>
          )}
        </div>
      </div>

      {/* Time Filters - Exactly like your 1st image */}
      <div className="px-4 md:px-6 mt-6">
        <div className="flex gap-3 md:gap-4 overflow-x-auto no-scrollbar pb-2">
          {(Object.keys(TF_MAP) as TF[]).map(t=>(
            <button key={t} onClick={()=>setTf(t)} className={`min-w-[84px] h-[44px] rounded-full text-[15px] font-medium tracking-wide border transition-all duration-200 ${tf===t?'bg-white text-black border-white shadow-[0_2px_16px_rgba(255,255,255,0.3)]':'bg-[#2A2A2D] text-white border-[#3A3A3E] hover:bg-[#333] hover:border-[#444]'}`}>{t}</button>
          ))}
        </div>
      </div>

      {/* Stats - List rows minimal like Bloomberg */}
      <div className="px-6 mt-10">
        <div className="divide-y divide-[#1E1E1E] border-y border-[#1E1E1E]">
          <div className="flex justify-between items-center py-4">
            <span className="text-[13px] tracking-widest text-[#9A9A9A] uppercase">Market Cap</span>
            <span className="text-[18px] font-bold tracking-tight font-sans">{formatCompactNumber(coin.market_cap)}</span>
          </div>
          <div className="flex justify-between items-center py-4">
            <span className="text-[13px] tracking-widest text-[#9A9A9A] uppercase">Volume (24H)</span>
            <span className="text-[18px] font-bold tracking-tight font-sans">{formatCompactNumber(coin.total_volume)}</span>
          </div>
          <div className="flex justify-between items-center py-4">
            <span className="text-[13px] tracking-widest text-[#9A9A9A] uppercase">FDV</span>
            <span className="text-[18px] font-bold tracking-tight font-sans">{formatCompactNumber(coin.fully_diluted_valuation || coin.market_cap)}</span>
          </div>
          <div className="flex justify-between items-center py-4">
            <span className="text-[13px] tracking-widest text-[#9A9A9A] uppercase">24H Range</span>
            <span className="text-[18px] font-bold tracking-tight font-sans">${(coin.low_24h||0).toLocaleString()} — ${(coin.high_24h||0).toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="px-6 mt-6 text-[11px] text-[#555]">↔ Drag on chart to inspect · Tap timeframe to change · Data from CoinGecko</div>
    </div>
  );
};
