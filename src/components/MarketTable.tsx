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
    if (v === undefined || v === null || Math.abs(v) < 0.005) return '0.00%';
    return `${v > 0 ? '+' : ''}${v.toFixed(2)}%`;
  };
  const changeColor = (v?: number) => {
    if (!v || Math.abs(v) < 0.005) return 'text-[#5a5a5a]';
    return v > 0 ? 'text-[#23e33e]' : 'text-[#ff4d4d]';
  };
  const pillClass = (v?: number) => {
    if (!v || Math.abs(v) < 0.005) return 'bg-[#18181b] text-[#6b7280] border-[#242424]';
    if (v > 0) return 'bg-[#102216] text-[#2bff5a] border-[#1a3a20] shadow-[0_0_12px_rgba(43,255,90,0.15)]';
    return 'bg-[#221111] text-[#ff6b6b] border-[#3a1a1a] shadow-[0_0_12px_rgba(255,77,77,0.12)]';
  };

  return (
    <div className="w-full bg-[#080808]">
      {/* Top */}
      <div className="flex items-center justify-between px-6 py-3.5 border-b border-[#161616] sticky top-0 z-20 bg-[#080808]/90 backdrop-blur-xl">
        <div className="flex items-center gap-2.5">
          <button onClick={() => setShowFavsOnly(false)} className={`h-[32px] px-4 rounded-full text-[12px] font-bold transition-all ${!showFavsOnly ? 'bg-white text-black' : 'bg-[#171717] text-[#888] border border-[#242424] hover:text-white hover:bg-[#1e1e1e]'}`}>All Assets</button>
          <button onClick={() => setShowFavsOnly(true)} className={`h-[32px] px-4 rounded-full text-[12px] font-bold flex items-center gap-1.5 transition-all ${showFavsOnly ? 'bg-white text-black' : 'bg-[#171717] text-[#888] border border-[#242424] hover:text-white'}`}><Star className="w-3.5 h-3.5" /> Favorites ({favorites.length})</button>
        </div>
        <div className="text-[11px] font-mono text-[#555]">100 coins · Live · {new Date().toLocaleTimeString()}</div>
      </div>

      {/* Desktop Pro */}
      <div className="hidden md:block">
        <div className="grid grid-cols-[48px_280px_110px_80px_90px_80px_110px_110px_96px] px-6 h-10 items-center text-[10px] font-bold uppercase tracking-[0.15em] text-[#555] border-b border-[#161616] bg-[#0c0c0c]">
          <span>#</span><span>Name</span><span className="text-right">Price</span><span className="text-right">1H</span><span className="text-right">24H</span><span className="text-right">7D</span><span className="text-right">Market Cap</span><span className="text-right">Volume 24h</span><span className="text-right">Last 7D</span>
        </div>
        {list.map((coin, i) => {
          const isFav = favorites.includes(coin.id);
          const c24 = coin.price_change_percentage_24h;
          const c1h = coin.price_change_percentage_1h_in_currency;
          const c7d = coin.price_change_percentage_7d_in_currency;
          return (
            <div key={coin.id} onClick={() => onSelectCoin(coin)} className="grid grid-cols-[48px_280px_110px_80px_90px_80px_110px_110px_96px] items-center px-6 h-[64px] border-b border-[#111] hover:bg-[#111] group cursor-pointer transition-colors">
              <span className="text-[12px] font-mono text-[#444] group-hover:text-[#888]">{String(i+2).padStart(2,'0')}</span>
              <div className="flex items-center gap-3">
                <img src={coin.image} alt={coin.name} className="w-8 h-8 rounded-full border border-[#222] bg-[#141414]" />
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-semibold text-white">{coin.name}</span>
                  {isFav && <Star className="w-3 h-3 fill-[#ffcc00] text-[#ffcc00]" />}
                  <span className="text-[10px] font-mono text-[#777] bg-[#161616] border border-[#222] px-1.5 py-0.5 rounded">{coin.symbol.toUpperCase()}</span>
                </div>
              </div>
              <span className="text-right font-mono text-[13.5px] font-bold text-white tracking-tight">{formatCurrency(coin.current_price)}</span>
              <span className={`text-right font-mono text-[12px] font-medium ${changeColor(c1h)}`}>{fmt(c1h)}</span>
              <div className="flex justify-end"><span className={`px-2.5 py-1 rounded-full text-[11px] font-bold font-mono border ${pillClass(c24)}`}>{fmt(c24)}</span></div>
              <span className={`text-right font-mono text-[12px] font-medium ${changeColor(c7d)}`}>{fmt(c7d)}</span>
              <span className="text-right font-mono text-[12px] text-[#aaa]">{formatCompactNumber(coin.market_cap)}</span>
              <span className="text-right font-mono text-[12px] text-[#666]">{formatCompactNumber(coin.total_volume)}</span>
              <div className="flex justify-end">
                <svg width="84" height="32" viewBox="0 0 84 32" className="overflow-visible">
                  <path d="M0 18 Q21 8 42 16 T84 10" fill="none" stroke={(c7d||0)>=0 ? '#2bff5a' : '#ff4d4d'} strokeWidth="1.6" strokeLinecap="round" opacity="0.9" />
                </svg>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile - keep your liked version */}
      <div className="md:hidden flex flex-col divide-y divide-[#111]">
        {list.map((coin, i) => {
          const c24 = coin.price_change_percentage_24h;
          return (
            <div key={coin.id} onClick={() => onSelectCoin(coin)} className="flex items-center gap-3 px-4 h-[72px] active:bg-[#111]">
              <span className="text-[11px] font-mono text-[#444] w-5">{String(i+2).padStart(2,'0')}</span>
              <img src={coin.image} className="w-8 h-8 rounded-full border border-[#222]" alt="" />
              <div className="flex-1 min-w-0"><div className="text-[13px] font-semibold text-white truncate">{coin.name}</div><div className="text-[10px] font-mono text-[#666]">{coin.symbol.toUpperCase()}</div></div>
              <div className="text-right"><div className="text-[13px] font-bold font-mono text-white">{formatCurrency(coin.current_price)}</div><div className="text-[10px] font-mono text-[#666]">{formatCompactNumber(coin.market_cap)}</div></div>
              <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold font-mono border ${pillClass(c24)}`}>{fmt(c24)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
