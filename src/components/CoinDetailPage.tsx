import React, { useState } from 'react';
import { CryptoCoin } from '../types/crypto';
import { formatCurrency, formatCompactNumber } from '../services/cryptoApi';
import { Star, Share2 } from 'lucide-react';

interface Props {
  coin: CryptoCoin;
  onBack: () => void;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
}

const TFS = ['24H','7D','1M','3M','1Y','MAX'] as const;

export const CoinDetailPage: React.FC<Props> = ({ coin, onBack, favorites, onToggleFavorite }) => {
  const [tf, setTf] = useState('24H');
  const isFav = favorites.includes(coin.id);
  const change = coin.price_change_percentage_24h ?? 0.96;
  const isUp = change >= 0;

  return (
    <div className="w-full min-h-screen bg-[#050507] text-white pb-[120px]">
      <div className="sticky top-0 z-30 h-[56px] bg-[#050507]/90 backdrop-blur-xl border-b border-[#111] flex items-center justify-between px-4">
        <button onClick={onBack} className="text-[13px] text-[#6a6770] flex items-center gap-1">
          Cryptocurrencies <span className="mx-1">›</span> <span className="text-white font-medium">{coin.symbol.toUpperCase()} Price</span>
        </button>
        <div className="flex gap-2">
          <button className="w-8 h-8 rounded-lg bg-[#14141a] border border-[#222] flex items-center justify-center"><Share2 className="w-3.5 h-3.5 text-[#888]" /></button>
          <button onClick={()=>onToggleFavorite(coin.id)} className={`w-8 h-8 rounded-lg border flex items-center justify-center ${isFav?'bg-white text-black':'bg-[#14141a] border-[#222] text-[#666]'}`}><Star className="w-3.5 h-3.5" /></button>
        </div>
      </div>

      <div className="px-5 pt-6">
        <div className="flex items-center gap-3">
          <img src={coin.image} className="w-[44px] h-[44px] rounded-full bg-[#111]" alt="" />
          <span className="text-[22px] font-bold">{coin.symbol.toUpperCase()} <span className="text-[#6b6b78] font-medium text-[18px]">Price</span></span>
        </div>
        <div className="flex gap-2 mt-2 ml-[56px]">
          <span className="px-2.5 py-1 rounded-md bg-[#17161b] border border-[#23222a] text-[10px] font-bold text-[#8a8690]">{coin.symbol.toUpperCase()}</span>
          <span className="px-2.5 py-1 rounded-md bg-[#17161b] border border-[#23222a] text-[10px] font-bold text-[#8a8690]">RANK #{coin.market_cap_rank || 6}</span>
        </div>
        <div className="mt-5 text-[38px] font-bold tracking-tighter">{formatCurrency(coin.current_price)}</div>
        <div className={`mt-1 text-[12px] font-bold font-mono ${isUp?'text-[#00e676]':'text-[#ff4d4d]'}`}>{isUp?'▲':'▼'} {Math.abs(change).toFixed(2)}% 24h</div>
      </div>

      <div className="px-4 mt-6">
        <div className="flex bg-[#121115] border border-[#1e1c20] rounded-full p-1 gap-1">
          {TFS.map(t=>(
            <button key={t} onClick={()=>setTf(t)} className={`flex-1 h-8 rounded-full text-[11px] font-bold ${tf===t ? 'bg-white text-black' : 'text-[#7a757e]'}`}>{t}</button>
          ))}
        </div>
        <div className="mt-3 text-[11px] text-[#55525c]">↔ Drag across the chart to measure a move</div>
      </div>

      <div className="px-3 mt-4">
        <div className="relative w-full h-[320px] bg-[#0e0d10] border border-[#1e1c20] rounded-[20px] overflow-hidden flex items-center justify-center">
          <svg viewBox="0 0 360 140" className="w-full h-full pt-6 pb-2 pr-14 pl-2">
            <defs>
              <linearGradient id="gg" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={isUp ? "#00e676" : "#ff6b3d"} stopOpacity="0.35" />
                <stop offset="100%" stopColor={isUp ? "#00e676" : "#ff6b3d"} stopOpacity="0.02" />
              </linearGradient>
            </defs>
            <path d={`M0 80 Q20 20 40 45 L60 25 L80 60 L120 40 L160 90 L200 75 L240 85 L280 95 L320 110 L360 30 L360 140 L0 140 Z`} fill="url(#gg)" />
            <path d={`M0 80 Q20 20 40 45 L60 25 L80 60 L120 40 L160 90 L200 75 L240 85 L280 95 L320 110 L360 30`} fill="none" stroke={isUp ? "#00e676" : "#ff6b3d"} strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <div className="absolute top-3 right-4 flex flex-col gap-8 text-right">
            <span className="text-[10px] font-mono text-[#555]">$1.001</span>
            <span className="text-[10px] font-mono text-[#555]">$0.9583</span>
          </div>
        </div>
      </div>

      <div className="px-3 mt-4 grid grid-cols-2 gap-3">
        <div className="bg-[#121114] border border-[#1e1c20] rounded-[16px] px-4 py-4 text-center"><div className="text-[9px] font-bold tracking-widest text-[#8a858f]">MARKET CAP</div><div className="mt-1 text-[20px] font-bold">{formatCompactNumber(coin.market_cap)}</div></div>
        <div className="bg-[#121114] border border-[#1e1c20] rounded-[16px] px-4 py-4 text-center"><div className="text-[9px] font-bold tracking-widest text-[#8a858f]">24H VOLUME</div><div className="mt-1 text-[20px] font-bold">{formatCompactNumber(coin.total_volume)}</div></div>
        <div className="bg-[#121114] border border-[#1e1c20] rounded-[16px] px-4 py-4 text-center"><div className="text-[9px] font-bold tracking-widest text-[#8a858f]">FULLY DILUTED</div><div className="mt-1 text-[20px] font-bold">{formatCompactNumber(coin.market_cap)}</div></div>
        <div className="bg-[#121114] border border-[#1e1c20] rounded-[16px] px-4 py-4"><div className="text-[9px] font-bold tracking-widest text-[#8a858f] text-center">24H RANGE</div><div className="mt-3 h-[6px] rounded-full bg-gradient-to-r from-[#ff5a5a] to-[#00e676]"></div><div className="mt-2 flex justify-between text-[10px] font-mono text-[#9a959e]"><span>${(coin.low_24h||0).toFixed(4)}</span><span>${(coin.high_24h||0).toFixed(4)}</span></div></div>
      </div>

      <div className="px-4 mt-7">
        <div className="text-[12px] font-semibold">Community Sentiment</div>
        <div className="mt-3 h-[28px] rounded-full bg-[#16141a] border border-[#23202a] flex overflow-hidden p-1">
          <div className="h-full rounded-full bg-[#00d26a] flex items-center px-3 text-[11px] font-bold text-white" style={{width:'51%'}}>51% bull</div>
          <div className="flex-1 flex items-center justify-end px-3 text-[11px] font-bold text-[#ff9a9a]">49% bear</div>
        </div>
      </div>
    </div>
  );
};
