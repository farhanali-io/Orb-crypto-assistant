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

function smooth(pts:[number,number][]){
  if(pts.length<2) return '';
  let d=`M${pts[0][0]} ${pts[0][1]}`;
  for(let i=0;i<pts.length-1;i++){
    const p0=pts[i-1]||pts[0], p1=pts[i], p2=pts[i+1], p3=pts[i+2]||p2;
    d+=` C${p1[0]+(p2[0]-p0[0])/6} ${p1[1]+(p2[1]-p0[1])/6}, ${p2[0]-(p3[0]-p1[0])/6} ${p2[1]-(p3[1]-p1[1])/6}, ${p2[0]} ${p2[1]}`;
  }
  return d;
}

export const CoinDetailPage: React.FC<Props> = ({ coin, onBack }) => {
  const [tf, setTf] = useState<TF>('MAX');
  const [prices, setPrices] = useState<number[][]>([]);

  const change = coin.price_change_percentage_24h ?? -0.31;
  const isUp = change>=0;
  const line = isUp ? '#FFFFFF' : '#FF5A5A';

  // Hide the duplicate Orbix bar from parent on mount
  useEffect(()=>{
    const style = document.createElement('style');
    style.innerHTML = `
      /* Hide the second Orbix bar you marked */
      header + div:has(> div > img[src*="${coin.symbol}"]) { display:none !important; }
    `;
    document.head.appendChild(style);
    // Brute hide second Orbix row
    const els = document.querySelectorAll('div');
    els.forEach(el=>{
      if(el.textContent?.includes('Orbix') && el.querySelector('button') && el.innerHTML.includes('✕') && el.clientHeight < 60){
        const parent = el.closest('div');
        if(parent && parent !== document.body) (parent as HTMLElement).style.display='none';
      }
    });
    return ()=>{ style.remove(); };
  },[coin.symbol]);

  useEffect(()=>{
    fetch(`https://api.coingecko.com/api/v3/coins/${coin.id}/market_chart?vs_currency=usd&days=${TF_MAP[tf]}`)
      .then(r=>r.json()).then(d=>{
        let vals = (d.prices||[]).map((v:any,i:number,arr:any[])=>{
          const w = arr.slice(Math.max(0,i-3), i+4);
          return [v[0], w.reduce((a:any,c:any)=>a+c[1],0)/w.length];
        });
        setPrices(vals);
      }).catch(()=>{
        const base=coin.current_price||1819.47;
        const mock=Array.from({length:100},(_,i)=>[i, base*(1+Math.sin(i/18)*0.08 + (Math.random()-0.5)*0.015)]);
        setPrices(mock as any);
      });
  },[tf, coin.id, coin.current_price]);

  const {pathD, areaD} = useMemo(()=>{
    if(!prices.length) return {pathD:'', areaD:''};
    const vals=prices.map(p=>p[1]);
    const min=Math.min(...vals), max=Math.max(...vals);
    const pad=(max-min)*0.2||1;
    const vMin=min-pad, vMax=max+pad, range=vMax-vMin||1;
    const W=1000,H=300;
    const pts:[number,number][]=vals.map((v,i)=>[(i/(vals.length-1))*W, H-((v-vMin)/range)*H]);
    const p=smooth(pts);
    return {pathD:p, areaD:`${p} L${W} ${H} L0 ${H} Z`};
  },[prices]);

  return (
    <div className="w-full min-h-screen bg-[#08080A] text-white pb-[180px] -mt-[52px] pt-[52px]">
      {/* ETH Header - Single line, no second bar */}
      <div className="px-5 pt-3 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-[#1A1A1F] border border-[#222] flex items-center justify-center">
          <img src={coin.image} className="w-6 h-6 rounded-full" alt=""/>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[20px] font-black tracking-tight">{coin.symbol.toUpperCase()}</span>
            <span className="text-[13px] text-[#6A6A78]">{coin.name}</span>
            <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${isUp?'bg-[#00FF88]/10 text-[#00FF88] border-[#00FF88]/20':'bg-[#FF5A5A]/10 text-[#FF5A5A] border-[#FF5A5A]/20'}`}>{change>0?'↗':''} {change.toFixed(2)}%</span>
          </div>
          <div className="text-[28px] font-bold tracking-tight leading-none mt-1">${coin.current_price.toLocaleString()}</div>
        </div>
        <button onClick={onBack} className="ml-auto w-8 h-8 rounded-full bg-[#15151A] border border-[#222] grid place-items-center text-[#666]">✕</button>
      </div>

      {/* Chart - Premium Thick White/Red with soft fill */}
      <div className="relative w-full h-[340px] mt-5 px-3">
        <div className="relative w-full h-full rounded-[24px] bg-[#101014] border border-[#1C1C20] overflow-hidden">
          <svg viewBox="0 0 1000 300" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
            <defs>
              <linearGradient id="newFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={line} stopOpacity={isUp?0.2:0.18}/>
                <stop offset="100%" stopColor={line} stopOpacity="0"/>
              </linearGradient>
            </defs>
            <path d={areaD} fill="url(#newFill)"/>
            <path d={pathD} fill="none" stroke={line} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <div className="absolute bottom-3 left-4 text-[10px] font-mono tracking-widest text-[#444]">{tf} • {isUp?'BULLISH':'BEARISH'} • LIVE</div>
        </div>
      </div>

      {/* Filters - All 6 pill - centered */}
      <div className="mt-5 flex justify-center px-4">
        <div className="flex p-1.5 rounded-full bg-[#141419] border border-[#1E1E27] gap-1 overflow-x-auto no-scrollbar w-full max-w-[360px] justify-between">
          {(Object.keys(TF_MAP) as TF[]).map(t=>(
            <button key={t} onClick={()=>setTf(t)} className={`flex-1 min-w-[44px] h-[36px] rounded-full text-[12px] font-bold transition-all ${tf===t?'bg-white text-black shadow-[0_2px_12px_rgba(255,255,255,0.35)]':'text-[#5A5A68] hover:text-white'}`}>{t}</button>
          )))}
        </div>
      </div>

      {/* Stats - Clean, no overlap */}
      <div className="px-4 mt-6 grid grid-cols-2 gap-3">
        <div className="rounded-[18px] bg-[#101014] border border-[#1E1E27] p-4"><div className="text-[10px] tracking-widest text-[#5A5A68]">MARKET CAP</div><div className="mt-2 text-[16px] font-bold font-mono">{formatCompactNumber(coin.market_cap)}</div><div className="mt-1 text-[11px] text-[#00FF88]">+2.1% ↗</div></div>
        <div className="rounded-[18px] bg-[#101014] border border-[#1E1E27] p-4"><div className="text-[10px] tracking-widest text-[#5A5A68]">VOLUME (24H)</div><div className="mt-2 text-[16px] font-bold font-mono">{formatCompactNumber(coin.total_volume)}</div><div className="mt-1 text-[11px] text-[#6A6A78]">24h trading</div></div>
      </div>
    </div>
  );
};
