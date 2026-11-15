import React, { useState } from 'react';
import { CryptoCoin } from '../types/crypto';
import { formatCurrency, formatCompactNumber } from '../services/cryptoApi';
import { Star } from 'lucide-react';

interface Props {
  coins: CryptoCoin[];
  onSelectCoin: (coin: CryptoCoin) => void;
  searchQuery: string;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
}

export const MarketTable: React.FC<Props> = ({ coins, onSelectCoin, favorites, onToggleFavorite }) => {
  const [showFavsOnly, setShowFavsOnly] = useState(false);
  const list = showFavsOnly ? coins.filter(c => favorites.includes(c.id)) : coins;

  const fmt = (v?: number) => {
    if (!v || Math.abs(v) < 0.005) return '0.00%';
    return `${v > 0 ? '+' : ''}${v.toFixed(2)}%`;
  };
  const color = (v?: number) => {
    if (!v || Math.abs(v) < 0.005) return 'text-[#666]';
    return v > 0 ? 'text-[#22c55e]' : 'text-[#ef4444]';
  };
  const pill = (v?: number) => {
    if (!v || Math.abs(v) < 0.005) return 'bg-[#18181b] text-[#666] border-[#222]';
    if (v > 0) return 'bg-[#0f1f13] text-[#4ade80] border-[#1a3a22]';
    return 'bg-[#221212] text-[#f87171] border-[#3a1a1a]';
  };

  return (
    <div className="w-full bg-[#080808] flex flex-col">
      {/* Filter */}
      <div className="w-full flex items-center justify-between px-[2%] py-3 border-b border-[#161616] sticky top-0 z-20 bg-[#080808]/90 backdrop-blur-xl">
        <div className="flex gap-2">
          <button onClick={() => setShowFavsOnly(false)} className={`h-8 px-4 rounded-full text-[12px] font-bold ${!showFavsOnly ? 'bg-white text-black' : 'bg-[#171717] text-[#777] border border-[#222]'}`}>All Assets</button>
          <button onClick={() => setShowFavsOnly(true)} className={`h-8 px-4 rounded-full text-[12px] font-bold flex gap-1.5 items-center ${showFavsOnly ? 'bg-white text-black' : 'bg-[#171717] text-[#777] border border-[#222]'}`}><Star className="w-3.5 h-3.5" /> Favorites ({favorites.length})</button>
        </div>
        <span className="text-[11px] font-mono text-[#555]">{list.length} coins · Live</span>
      </div>

      {/* DESKTOP - FULL WIDTH RESPONSIVE */}
      <div className="hidden md:block w-full overflow-x-auto">
        <div className="w-full min-w-full">
          {/* Header - stretches */}
          <div className="w-full grid px-[2%] h-10 items-center text-[10px] font-bold uppercase tracking-widest text-[#555] border-b border-[#161616] bg-[#0c0c0c] 
            grid-cols-[36px_minmax(160px,1.8fr)_minmax(90px,0.7fr)_70px_80px_70px_minmax(90px,0.7fr)_minmax(90px,0.7fr)_80px]
            xl:grid-cols-[40px_minmax(200px,2.2fr)_minmax(110px,0.8fr)_80px_90px_80px_minmax(110px,0.9fr)_minmax(110px,0.9fr)_100px]
            2xl:grid-cols-[48px_minmax(240px,2.5fr)_minmax(120px,1fr)_90px_100px_90px_minmax(120px,1fr)_minmax(120px,1fr)_120px]">
            <span>#</span><span>Name</span><span className="text-right">Price</span><span className="text-right">1H</span><span className="text-right">24H</span><span className="text-right">7D</span><span className="text-right">Market Cap</span><span className="text-right">Volume</span><span className="text-right">Last 7D</span>
          </div>

          {list.map((c, i) => (
            <div key={c.id} onClick={() => onSelectCoin(c)} 
              className="w-full grid px-[2%] h-[60px] items-center border-b border-[#101010] hover:bg-[#111] cursor-pointer group
              grid-cols-[36px_minmax(160px,1.8fr)_minmax(90px,0.7fr)_70px_80px_70px_minmax(90px,0.7fr)_minmax(90px,0.7fr)_80px]
              xl:grid-cols-[40px_minmax(200px,2.2fr)_minmax(110px,0.8fr)_80px_90px_80px_minmax(110px,0.9fr)_minmax(110px,0.9fr)_100px]
              2xl:grid-cols-[48px_minmax(240px,2.5fr)_minmax(120px,1fr)_90px_100px_90px_minmax(120px,1fr)_minmax(120px,1fr)_120px]">
              <span className="text-[11px] font-mono text-[#444] group-hover:text-[#777]">{i+2}</span>
              <div className="flex items-center gap-2.5 min-w-0">
                <img src={c.image} className="w-7 h-7 rounded-full border border-[#222] shrink-0" alt="" />
                <span className="text-[13px] font-semibold text-white truncate">{c.name}</span>
                <span className="text-[10px] font-mono text-[#666] bg-[#161616] border border-[#222] px-1.5 py-0.5 rounded hidden xl:inline">{c.symbol.toUpperCase()}</span>
              </div>
              <span className="text-right font-mono text-[13px] font-bold text-white truncate">{formatCurrency(c.current_price)}</span>
              <span className={`text-right font-mono text-[11px] ${color(c.price_change_percentage_1h_in_currency)}`}>{fmt(c.price_change_percentage_1h_in_currency)}</span>
              <div className="flex justify-end"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono border ${pill(c.price_change_percentage_24h)}`}>{fmt(c.price_change_percentage_24h)}</span></div>
              <span className={`text-right font-mono text-[11px] ${color(c.price_change_percentage_7d_in_currency)}`}>{fmt(c.price_change_percentage_7d_in_currency)}</span>
              <span className="text-right font-mono text-[11px] text-[#999] truncate">{formatCompactNumber(c.market_cap)}</span>
              <span className="text-right font-mono text-[11px] text-[#666] truncate hidden lg:block">{formatCompactNumber(c.total_volume)}</span>
              <div className="flex justify-end"><svg width="64" height="20" viewBox="0 0 64 20"><path d="M0 12 Q16 4 32 10 T64 8" fill="none" stroke={(c.price_change_percentage_7d_in_currency||0)>=0?'#22c55e':'#ef4444'} strokeWidth="1.2" /></svg></div>
            </div>
          ))}
        </div>
      </div>

      {/* MOBILE */}
      <div className="md:hidden w-full divide-y divide-[#111]">
        {list.map((c,i)=>(
          <div key={c.id} onClick={()=>onSelectCoin(c)} className="flex items-center gap-2 px-3 h-[64px] w-full">
            <span className="text-[10px] font-mono text-[#444] w-4">{i+2}</span>
            <img src={c.image} className="w-7 h-7 rounded-full" alt="" />
            <div className="flex-1 min-w-0"><div className="text-[12px] font-semibold text-white truncate">{c.name}</div><div className="text-[10px] text-[#666]">{c.symbol}</div></div>
            <div className="text-right"><div className="text-[12px] font-bold font-mono text-white">{formatCurrency(c.current_price)}</div></div>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${pill(c.price_change_percentage_24h)}`}>{fmt(c.price_change_percentage_24h)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
