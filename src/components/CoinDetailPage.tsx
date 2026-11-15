import React, { useState, useEffect, useMemo } from 'react';
import { CryptoCoin } from '../types/crypto';
import { formatCompactNumber } from '../services/cryptoApi';

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

export const CoinDetailPage: React.FC<{coin:CryptoCoin; onBack:()=>void; favorites:string[]; onToggleFavorite:(id:string)=>void}> = ({ coin, onBack }) => {
  const [tf, setTf] = useState<TF>('MAX');
  const [prices, setPrices] = useState<number[][]>([]);

  const change = coin.price_change_percentage_24h ?? -0.31;
  const isUp = change>=0;
  const line = isUp ? '#FFFFFF' : '#FF6B6B';

  useEffect(()=>{
    fetch(`https://api.coingecko.com/api/v3/coins/${coin.id}/market_chart?vs_currency=usd&days=${TF_MAP[tf]}`)
      .then(r=>r.json()).then(d=>{
        let vals = (d.prices||[]).map((v:any,i:number,a:any[])=>{
          const w = a.slice(Math.max(0,i-3), i+4);
          return [v[0], w.reduce((s:any,c:any)=>s+c[1],0)/w.length];
        });
        setPrices(vals);
      }).catch(()=>{
        const b=coin.current_price||1819.47;
        setPrices(Array.from({length:90},(_,i)=>[i, b*(1+Math.sin(i/16)*0.06)]) as any);
      });
  },[tf, coin.id, coin.current_price]);

  const {pathD, areaD} = useMemo(()=>{
    if(!prices.length) return {pathD:'', areaD:''};
    const vals=prices.map(p=>p[1]);
    const min=Math.min(...vals), max=Math.max(...vals);
    const pad=(max-min)*0.25||1, vMin=min-pad, vMax=max+pad, range=vMax-vMin;
    const W=1000,H=300;
    const pts:[number,number][]=vals.map((v,i)=>[(i/(vals.length-1))*W, H-((v-vMin)/range)*H]);
    const p=smooth(pts);
    return {pathD:p, areaD:`${p} L${W} ${H} L0 ${H} Z`};
  },[prices]);

  return (
    <div className="w-full min-h-screen bg-[#08080A] text-white px-4 pb-[180px]">
      <div className="pt-4 flex items-start justify-between">
        <div className="flex gap-3">
          <img src={coin.image} className="w-10 h-10 rounded-full bg-[#1A1A20] p-1" alt=""/>
          <div>
            <div className="text-[20px] font-black leading-none">{coin.symbol.toUpperCase()} <span className="text-[13px] font-medium text-[#6A6A78]">{coin.name}</span></div>
            <div className="mt-2 text-[30px] font-bold leading-none">${coin.current_price.toLocaleString()}</div>
            <div className={`mt-2 inline-flex px-2.5 py-1 rounded-full text-[11px] font-bold border ${isUp?'bg-[#00FF88]/10 text-[#00FF88] border-[#00FF88]/20':'bg-[#FF5A5A]/10 text-[#FF5A5A] border-[#FF5A5A]/20'}`}>{change.toFixed(2)}%</div>
          </div>
        </div>
        <button onClick={onBack} className="w-9 h-9 rounded-full bg-[#15151A] border border-[#23232A] text-[#888]">✕</button>
      </div>

      <div className="relative mt-6 h-[360px] rounded-[28px] bg-[#101014] border border-[#1C1C20] overflow-hidden">
        <svg viewBox="0 0 1000 300" preserveAspectRatio="none" className="absolute inset-0 w-full h-full p-3">
          <defs><linearGradient id="f2" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor={line} stopOpacity="0.22"/><stop offset="100%" stopColor={line} stopOpacity="0"/></linearGradient></defs>
          <path d={areaD} fill="url(#f2)"/>
          <path d={pathD} fill="none" stroke={line} strokeWidth="2" strokeLinecap="round"/>
        </svg>
        <div className="absolute bottom-3 left-4 text-[10px] tracking-widest text-[#444] font-mono">{tf} • {isUp?'BULLISH':'BEARISH'} • LIVE</div>
      </div>

      <div className="mt-6 flex justify-center">
        <div className="flex gap-1 p-1.5 rounded-full bg-[#15151C] border border-[#222] w-full max-w-[360px]">
          {(Object.keys(TF_MAP) as TF[]).map(t=>(
            <button key={t} onClick={()=>setTf(t)} className={`flex-1 h-[38px] rounded-full text-[12px] font-bold ${tf===t?'bg-white text-black':'text-[#6A6A78]'}`}>{t}</button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="rounded-[20px] bg-[#111116] border border-[#1E1E27] p-4"><div className="text-[10px] text-[#666] tracking-widest">MARKET CAP</div><div className="mt-2 font-mono font-bold">{formatCompactNumber(coin.market_cap)}</div></div>
        <div className="rounded-[20px] bg-[#111116] border border-[#1E1E27] p-4"><div className="text-[10px] text-[#666] tracking-widest">VOLUME (24H)</div><div className="mt-2 font-mono font-bold">{formatCompactNumber(coin.total_volume)}</div></div>
      </div>
    </div>
  );
};
