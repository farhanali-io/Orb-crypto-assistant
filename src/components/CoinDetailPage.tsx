import React, { useState, useEffect, useRef } from 'react';
import { createChart, ColorType, IChartApi, CandlestickData, Time } from 'lightweight-charts';
import { CryptoCoin } from '../types/crypto';

type TF = '24H'|'7D'|'1M'|'3M'|'1Y'|'MAX';
const TF_MAP: Record<TF,string> = {'24H':'1','7D':'7','1M':'30','3M':'90','1Y':'365','MAX':'max'};

export const CoinDetailPage: React.FC<{coin:CryptoCoin; onBack:()=>void; favorites:string[]; onToggleFavorite:(id:string)=>void}> = ({ coin, onBack }) => {
  const [tf, setTf] = useState<TF>('1M');
  const chartRef = useRef<HTMLDivElement>(null);
  const chartApiRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const change = coin.price_change_percentage_24h ?? 0;
  const isUp = change >= 0;

  useEffect(()=>{
    if(!chartRef.current) return;
    const chart = createChart(chartRef.current, {
      layout: { background: { type: ColorType.Solid, color: '#0A0A0C' }, textColor: '#6A6A78' },
      width: chartRef.current.clientWidth,
      height: 360,
      grid: { vertLines: { color: '#14141A' }, horzLines: { color: '#14141A' } },
      rightPriceScale: { borderColor: '#1E1E27' },
      timeScale: { borderColor: '#1E1E27', timeVisible: true, rightOffset: 6, barSpacing: 6 },
      handleScroll: { mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: true } as any,
      handleScale: { axisPressedMouseMove: true, mouseWheel: true, pinch: true } as any,
    });
    const series = chart.addCandlestickSeries({
      upColor: '#00FF88', downColor: '#FF3B3B',
      borderUpColor: '#00FF88', borderDownColor: '#FF3B3B',
      wickUpColor: '#00FF88', wickDownColor: '#FF3B3B',
    });
    chartApiRef.current = chart;
    seriesRef.current = series;
    const ro = new ResizeObserver(()=>{ if(chartRef.current) chart.applyOptions({ width: chartRef.current.clientWidth }); });
    ro.observe(chartRef.current);
    return ()=>{ ro.disconnect(); chart.remove(); };
  },[]);

  useEffect(()=>{
    let cancel=false;
    setLoading(true);
    fetch(`https://api.coingecko.com/api/v3/coins/${coin.id}/market_chart?vs_currency=usd&days=${TF_MAP[tf]}`)
      .then(r=>r.json()).then(m=>{
        if(cancel) return;
        const prices: any[] = m.prices || [];
        const step = Math.max(1, Math.floor(prices.length/150));
        const candles: CandlestickData[] = [];
        for(let i=0;i<prices.length;i+=step){
          const slice = prices.slice(i, i+step);
          if(!slice.length) continue;
          const open = slice[0][1];
          const close = slice[slice.length-1][1];
          const high = Math.max(...slice.map((s:any)=>s[1]));
          const low = Math.min(...slice.map((s:any)=>s[1]));
          candles.push({ time: Math.floor(slice[0][0]/1000) as Time, open, high, low, close });
        }
        seriesRef.current?.setData(candles);
        chartApiRef.current?.timeScale().fitContent();
        setLoading(false);
      }).catch(()=>setLoading(false));
    return ()=>{ cancel=true; };
  },[tf, coin.id]);

  return (
    <div className="w-full min-h-screen bg-[#08080A] text-white pb-[170px]">
      <div className="px-5 pt-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <img src={coin.image} className="w-8 h-8 rounded-full bg-[#111]" alt=""/>
          <span className="text-[16px] font-bold">{coin.symbol.toUpperCase()}</span>
          <span className="text-[11px] text-[#666]">/ USD</span>
          <span className={`ml-2 px-2 py-0.5 rounded text-[11px] font-bold ${isUp?'bg-[#00FF88]/15 text-[#00FF88]':'bg-[#FF3B3B]/15 text-[#FF3B3B]'}`}>{change>0?'+':''}{change.toFixed(2)}%</span>
        </div>
        <button onClick={onBack} className="w-8 h-8 rounded-full bg-[#15151A] border border-[#222]">✕</button>
      </div>
      <div className="px-5 mt-2"><div className="text-[32px] font-bold">${coin.current_price.toLocaleString(undefined,{minimumFractionDigits:2})}</div><div className="text-[10px] font-mono text-[#555] mt-1">{loading?'LOADING...':'DRAG • PINCH • SCROLL'} • {tf}</div></div>
      <div className="mt-4 mx-3 rounded-[16px] overflow-hidden border border-[#1E1E27] bg-[#0A0A0C] relative"><div ref={chartRef} className="w-full h-[360px]" />{loading && <div className="absolute inset-0 bg-[#0A0A0C]/80 grid place-items-center text-xs text-[#666]">Loading...</div>}</div>
      <div className="mt-4 flex justify-center px-4"><div className="inline-flex bg-[#111117] border border-[#1E1E27] rounded-full p-1 gap-1">{(Object.keys(TF_MAP) as TF[]).map(t=><button key={t} onClick={()=>setTf(t)} className={`px-4 h-[32px] rounded-full text-[12px] font-bold ${tf===t?'bg-white text-black':'text-[#6A6A78]'}`}>{t}</button>)}</div></div>
    </div>
  );
};
