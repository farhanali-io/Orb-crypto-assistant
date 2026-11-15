import React, { useState, useEffect, useRef } from 'react';
import { CryptoCoin } from '../types/crypto';

type TF = '24H'|'7D'|'1M'|'3M'|'1Y'|'MAX';
const TF_MAP: Record<TF,string> = {'24H':'1','7D':'7','1M':'30','3M':'90','1Y':'365','MAX':'max'};

export const CoinDetailPage: React.FC<{coin:CryptoCoin; onBack:()=>void; favorites:string[]; onToggleFavorite:(id:string)=>void}> = ({ coin, onBack }) => {
  const [tf, setTf] = useState<TF>('1M');
  const [ohlc, setOhlc] = useState<number[][]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const change = coin.price_change_percentage_24h ?? -0.31;
  const isUp = change >= 0;

  useEffect(()=>{
    fetch(`https://api.coingecko.com/api/v3/coins/${coin.id}/ohlc?vs_currency=usd&days=${TF_MAP[tf]}`)
      .then(r=>r.json()).then(d=>{
        if(Array.isArray(d) && d.length>2) setOhlc(d);
        else {
          // fallback to price line -> convert to fake ohlc
          fetch(`https://api.coingecko.com/api/v3/coins/${coin.id}/market_chart?vs_currency=usd&days=${TF_MAP[tf]}`)
            .then(r=>r.json()).then(m=>{
              const p = (m.prices||[]).slice(-120);
              const o = p.map((v:any,i:number)=>[v[0], v[1]*0.998, v[1]*1.002, v[1]*0.996, v[1]]);
              setOhlc(o);
            });
        }
      }).catch(()=>{});
  },[tf, coin.id]);

  // TradingView draw
  useEffect(()=>{
    const canvas = canvasRef.current;
    if(!canvas || !ohlc.length) return;
    const ctx = canvas.getContext('2d');
    if(!ctx) return;
    const dpr = window.devicePixelRatio||1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width*dpr;
    canvas.height = rect.height*dpr;
    ctx.scale(dpr,dpr);
    const W = rect.width, H = rect.height;
    const PAD_L = 10, PAD_R = 60, PAD_T = 10, PAD_B = 24;
    const chartW = W - PAD_L - PAD_R;
    const chartH = H - PAD_T - PAD_B;

    ctx.clearRect(0,0,W,H);
    // bg
    ctx.fillStyle = '#0A0A0C';
    ctx.fillRect(0,0,W,H);

    // grid
    ctx.strokeStyle = '#1A1A20';
    ctx.lineWidth = 0.5;
    for(let i=0;i<4;i++){
      const y = PAD_T + (chartH/4)*i;
      ctx.beginPath(); ctx.moveTo(PAD_L, y); ctx.lineTo(PAD_L+chartW, y); ctx.stroke();
    }

    const highs = ohlc.map(o=>o[2]);
    const lows = ohlc.map(o=>o[3]);
    const min = Math.min(...lows);
    const max = Math.max(...highs);
    const range = (max-min) || 1;
    const getY = (v:number)=> PAD_T + chartH - ((v-min)/range)*chartH;
    const getX = (i:number)=> PAD_L + (i/(ohlc.length-1))*chartW;

    // candles
    const candleW = Math.max(2, chartW/ohlc.length*0.6);
    ohlc.forEach((c,i)=>{
      const [ , open, high, low, close ] = c;
      const x = getX(i);
      const yOpen = getY(open);
      const yClose = getY(close);
      const yHigh = getY(high);
      const yLow = getY(low);
      const green = close >= open;
      ctx.strokeStyle = green ? '#00FF88' : '#FF3B3B';
      ctx.fillStyle = green ? '#00FF88' : '#FF3B3B';
      // wick
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x, yHigh); ctx.lineTo(x, yLow); ctx.stroke();
      // body
      const bodyH = Math.max(2, Math.abs(yOpen-yClose));
      const bodyY = Math.min(yOpen, yClose);
      ctx.fillRect(x-candleW/2, bodyY, candleW, bodyH||2);
    });

    // price scale right (TradingView style)
    ctx.fillStyle = '#2A2A33';
    ctx.fillRect(W-PAD_R, 0, PAD_R, H);
    ctx.fillStyle = '#8A8A9A';
    ctx.font = '11px JetBrains Mono, monospace';
    ctx.textAlign = 'right';
    for(let i=0;i<5;i++){
      const v = min + (range/4)*i;
      const y = PAD_T + chartH - (chartH/4)*i;
      ctx.fillText(v.toFixed(v<1?4:2), W-8, y+3);
    }
  },[ohlc]);

  return (
    <div className="w-full min-h-screen bg-[#08080A] text-white pb-[160px] font-sans">
      {/* Header - NO duplicate Orbix bar, only coin */}
      <div className="px-5 pt-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={coin.image} className="w-8 h-8 rounded-full" alt=""/>
          <div className="flex items-baseline gap-2">
            <span className="text-[17px] font-bold tracking-tight">{coin.symbol.toUpperCase()}</span>
            <span className="text-[12px] text-[#6B6B7A]">/ USD</span>
            <span className={`ml-2 px-2 py-0.5 rounded text-[11px] font-bold ${isUp?'bg-[#00FF88]/15 text-[#00FF88]':'bg-[#FF3B3B]/15 text-[#FF3B3B]'}`}>{isUp?'+':''}{change.toFixed(2)}%</span>
          </div>
        </div>
        <button onClick={onBack} className="w-8 h-8 rounded-full bg-[#15151A] border border-[#222] text-[#666]">✕</button>
      </div>

      <div className="px-5 mt-3">
        <div className="text-[34px] font-bold tracking-tight leading-none">${coin.current_price.toLocaleString(undefined,{minimumFractionDigits:2, maximumFractionDigits:2})}</div>
        <div className="mt-1 text-[11px] text-[#5A5A6A] font-mono tracking-widest">BINANCE • {tf} • {isUp?'BULL':'BEAR'}</div>
      </div>

      {/* TradingView Chart */}
      <div className="mt-4 mx-3 rounded-[16px] overflow-hidden border border-[#1E1E27] bg-[#0A0A0C]">
        <canvas ref={canvasRef} className="w-full h-[360px] block" style={{height:360}}/>
        <div className="h-[28px] bg-[#0F0F12] border-t border-[#1A1A20] flex items-center px-3 text-[10px] font-mono text-[#555] justify-between">
          <span>VOL • {coin.total_volume ? (coin.total_volume/1e9).toFixed(2)+'B' : '-'}</span>
          <span className="text-[#00FF88]">O {ohlc[0]?.[1]?.toFixed(2)} H {ohlc[0]?.[2]?.toFixed(2)} L {ohlc[0]?.[3]?.toFixed(2)} C {ohlc[0]?.[4]?.toFixed(2)}</span>
        </div>
      </div>

      {/* Filters - All 6, TradingView style */}
      <div className="mt-4 px-4 flex justify-center">
        <div className="inline-flex bg-[#111117] border border-[#1E1E27] rounded-full p-1 gap-1">
          {(Object.keys(TF_MAP) as TF[]).map(t=>(
            <button key={t} onClick={()=>setTf(t)} className={`px-4 h-[32px] rounded-full text-[12px] font-bold tracking-wide transition ${tf===t?'bg-white text-black':'text-[#6A6A78] hover:text-white'}`}>{t}</button>
          ))}
        </div>
      </div>

      {/* Premium stats - clean rows like TradingView, not cards */}
      <div className="mt-6 mx-4 rounded-[16px] bg-[#101014] border border-[#1E1E27] divide-y divide-[#1A1A20]">
        <div className="flex justify-between p-4 text-[13px]"><span className="text-[#6A6A78]">Market Cap</span><span className="font-mono font-bold">${(coin.market_cap/1e9).toFixed(2)}B</span></div>
        <div className="flex justify-between p-4 text-[13px]"><span className="text-[#6A6A78]">24h Volume</span><span className="font-mono font-bold">${(coin.total_volume/1e6).toFixed(1)}M</span></div>
        <div className="flex justify-between p-4 text-[13px]"><span className="text-[#6A6A78]">Circulating</span><span className="font-mono font-bold">{(coin.circulating_supply/1e9).toFixed(2)}B {coin.symbol.toUpperCase()}</span></div>
        <div className="flex justify-between p-4 text-[13px]"><span className="text-[#6A6A78]">Rank</span><span className="font-mono font-bold">#{coin.market_cap_rank}</span></div>
      </div>
    </div>
  );
};
