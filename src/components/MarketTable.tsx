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

  const pill = (v?: number) => {
    if (!v || Math.abs(v) < 0.05) return 'bg-[#1a1a1a] text-[#6b7280] border-[#222]';
    if (v > 0) return 'bg-[rgba(16,185,129,0.12)] text-[#22c55e] border-[rgba(34,197,94,0.25)]';
    return 'bg-[rgba(239,68,68,0.12)] text-[#ef4444] border-[rgba(239,68,68,0.25)]';
  };
  const fmt = (v?: number) => {
    if (!v || Math.abs(v) < 0.05) return '0.00%';
    return `${v > 0 ? '+' : ''}${v.toFixed(2)}%`;
  };

  return (
    <div className="w-full bg-[#08080a] min-h-screen">
      {/* Filter */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#161616] sticky top-0 z-10 bg-[#08080a]/90 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <button onClick={() => setShowFavsOnly(false)} className={`h-8 px-4 rounded-full text-[12px] font-bold tracking-tight transition-all ${!showFavsOnly ? 'bg-white text-black' : 'bg-[#141414] text-neutral-400 border border-[#222] hover:text-white'}`}>All</button>
          <button onClick={() => setShowFavsOnly(true)} className={`h-8 px-4 rounded-full text-[12px] font-bold flex items-center gap-1.5 transition-all ${showFavsOnly ? 'bg-white text-black' : 'bg-[#141414] text-neutral-400 border border-[#222] hover:text-white'}`}><Star className="w-3.5 h-3.5" /> Favorites ({favorites.length})</button>
        </div>
        <span className="text-[11px] font-mono text-neutral-600">{list.length} assets</span>
      </div>

      {/* DESKTOP */}
      <div className="hidden md:block">
        <div className="grid grid-cols-[56px_1fr_140px_140px_100px] px-6 py-2.5 text-[10px] font-bold uppercase tracking-[0.12em] text-neutral-500 border-b border-[#161616] bg-[#0c0c0e]">
          <span>#</span><span>Name</span><span className="text-right">Price</span><span className="text-right">Market Cap</span><span className="text-right">24h</span>
        </div>
        {list.map((coin, i) => {
          const isFav = favorites.includes(coin.id);
          return (
            <div key={coin.id} onClick={() => onSelectCoin(coin)} className="grid grid-cols-[56px_1fr_140px_140px_100px] items-center px-6 h-[68px] border-b border-[#121212] hover:bg-[#111113] transition-colors cursor-pointer group">
              <span className="text-[13px] font-mono text-neutral-500">{String(i+1).padStart(2,'0')}</span>
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-full bg-[#161616] flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.06)]"><img src={coin.image} alt={coin.name} className="w-7 h-7 rounded-full" /></div>
                <div><div className="flex items-center gap-2"><span className="text-[14px] font-semibold text-white tracking-tight group-hover:text-[#d1ffef]">{coin.name}</span>{isFav && <Star className="w-3 h-3 fill-amber-400 text-amber-400" />}</div><span className="text-[11px] font-mono text-neutral-500 uppercase tracking-wider">{coin.symbol}</span></div>
              </div>
              <span className="text-right text-[14px] font-semibold text-white font-mono">{formatCurrency(coin.current_price)}</span>
              <span className="text-right text-[13px] font-mono text-neutral-400">{formatCompactNumber(coin.market_cap)}</span>
              <div className="flex justify-end"><span className={`px-3 py-1.5 rounded-full text-[12px] font-bold font-mono border ${pill(coin.price_change_percentage_24h)}`}>{fmt(coin.price_change_percentage_24h)}</span></div>
            </div>
          );
        })}
      </div>

      {/* MOBILE - PREMIUM */}
      <div className="md:hidden flex flex-col">
        {list.map((coin, i) => {
          const isFav = favorites.includes(coin.id);
          return (
            <div key={coin.id} onClick={() => onSelectCoin(coin)} className="flex items-center gap-3 px-4 h-[74px] border-b border-[#121212] active:bg-[#121212] bg-[#08080a]">
              <span className="text-[12px] font-mono text-[#555] w-7">{String(i+1).padStart(2,'0')}</span>
              <div className="w-10 h-10 rounded-full bg-[#141416] border border-[#1e1e1e] flex items-center justify-center shadow-[0_0_18px_rgba(255,255,255,0.05)]"><img src={coin.image} alt={coin.name} className="w-7 h-7 rounded-full" /></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5"><span className="text-[14px] font-semibold text-white truncate tracking-tight">{coin.name}</span>{isFav && <Star className="w-3 h-3 fill-amber-300 text-amber-300" />}</div>
                <span className="text-[11px] font-mono text-neutral-500 uppercase">{coin.symbol}</span>
              </div>
              <div className="text-right min-w-[92px]">
                <div className="text-[14px] font-semibold text-white font-mono tracking-tight">{formatCurrency(coin.current_price)}</div>
                <div className="text-[11px] font-mono text-neutral-500">MC {formatCompactNumber(coin.market_cap)}</div>
              </div>
              <span className={`ml-1 px-3 py-1.5 rounded-full text-[12px] font-bold font-mono border min-w-[68px] text-center ${pill(coin.price_change_percentage_24h)}`}>{fmt(coin.price_change_percentage_24h)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
