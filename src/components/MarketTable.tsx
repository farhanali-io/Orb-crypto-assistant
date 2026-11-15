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

  const getColor = (v?: number) => {
    if (!v || Math.abs(v) < 0.05) return 'text-neutral-500';
    return v > 0 ? 'text-[#22c55e]' : 'text-[#ef4444]';
  };
  const pill = (v?: number) => {
    if (!v || Math.abs(v) < 0.05) return 'bg-[#1a1a1a] text-[#6b7280] border-[#222]';
    if (v > 0) return 'bg-[rgba(34,197,94,0.1)] text-[#22c55e] border-[rgba(34,197,94,0.2)]';
    return 'bg-[rgba(239,68,68,0.1)] text-[#ef4444] border-[rgba(239,68,68,0.2)]';
  };
  const fmt = (v?: number) => {
    if (!v || Math.abs(v) < 0.05) return '0.00%';
    return `${v > 0 ? '+' : ''}${v.toFixed(2)}%`;
  };

  return (
    <div className="w-full bg-[#07080a]">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-[#141414] sticky top-0 z-20 bg-[#07080a]/80 backdrop-blur-2xl">
        <div className="flex items-center gap-2">
          <button onClick={() => setShowFavsOnly(false)} className={`h-8 px-4 rounded-full text-[12px] font-bold transition-all ${!showFavsOnly ? 'bg-white text-black' : 'bg-[#141414] text-neutral-400 border border-[#1f1f1f] hover:text-white'}`}>All Assets</button>
          <button onClick={() => setShowFavsOnly(true)} className={`h-8 px-4 rounded-full text-[12px] font-bold flex items-center gap-1.5 transition-all ${showFavsOnly ? 'bg-white text-black' : 'bg-[#141414] text-neutral-400 border border-[#1f1f1f] hover:text-white'}`}><Star className="w-3.5 h-3.5" /> Favorites ({favorites.length})</button>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-mono text-neutral-500">
          <span>{list.length} coins</span>
          <span className="w-px h-3 bg-[#222]"></span>
          <span className="hidden md:block">Live • {new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      {/* LAPTOP / DESKTOP - PRO TABLE */}
      <div className="hidden md:block w-full overflow-x-auto">
        <table className="w-full border-collapse min-w-[1100px]">
          <thead className="sticky top-[52px] z-10 bg-[#0a0b0e]/90 backdrop-blur-xl border-b border-[#18181b]">
            <tr className="text-[10px] font-bold uppercase tracking-[0.14em] text-neutral-500">
              <th className="py-3.5 px-6 text-left w-14">#</th>
              <th className="py-3.5 px-2 text-left">Name</th>
              <th className="py-3.5 px-3 text-right">Price</th>
              <th className="py-3.5 px-3 text-right">1H</th>
              <th className="py-3.5 px-3 text-right">24H</th>
              <th className="py-3.5 px-3 text-right">7D</th>
              <th className="py-3.5 px-3 text-right">Market Cap</th>
              <th className="py-3.5 px-3 text-right">Volume 24h</th>
              <th className="py-3.5 px-6 text-right">Last 7D</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#101012]">
            {list.map((coin, i) => {
              const isFav = favorites.includes(coin.id);
              return (
                <tr key={coin.id} onClick={() => onSelectCoin(coin)} className="group h-[62px] hover:bg-[#0e0f12] transition-all cursor-pointer border-l-2 border-l-transparent hover:border-l-white">
                  <td className="px-6 text-[12px] font-mono text-neutral-600 group-hover:text-neutral-300">{String(i+1).padStart(2,'0')}</td>
                  <td className="px-2">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img src={coin.image} alt={coin.name} className="w-8 h-8 rounded-full bg-[#161616] border border-[#232323]" />
                        <div className="absolute -inset-1 rounded-full bg-white/5 blur-[6px] -z-10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="text-[13.5px] font-semibold text-white tracking-tight">{coin.name}</span>
                          {isFav && <Star className="w-3 h-3 fill-amber-400 text-amber-400" />}
                          <span className="text-[10px] font-mono text-neutral-500 border border-[#1f1f1f] bg-[#111] px-1.5 py-0.5 rounded">{coin.symbol.toUpperCase()}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 text-right font-mono text-[13.5px] font-medium text-white">{formatCurrency(coin.current_price)}</td>
                  <td className={`px-3 text-right font-mono text-[12px] font-medium ${getColor(coin.price_change_percentage_1h_in_currency)}`}>{fmt(coin.price_change_percentage_1h_in_currency)}</td>
                  <td className="px-3 text-right"><span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-bold font-mono border ${pill(coin.price_change_percentage_24h)}`}>{fmt(coin.price_change_percentage_24h)}</span></td>
                  <td className={`px-3 text-right font-mono text-[12px] font-medium ${getColor(coin.price_change_percentage_7d_in_currency)}`}>{fmt(coin.price_change_percentage_7d_in_currency)}</td>
                  <td className="px-3 text-right font-mono text-[12px] text-neutral-400">{formatCompactNumber(coin.market_cap)}</td>
                  <td className="px-3 text-right font-mono text-[12px] text-neutral-500">{formatCompactNumber(coin.total_volume)}</td>
                  <td className="px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-[72px] h-[28px] opacity-60 group-hover:opacity-100">
                        <svg width="72" height="28" viewBox="0 0 72 28" className="overflow-visible"><path d={`M0,${14 + Math.random()*8} Q18,${8 + Math.random()*10} 36,${14} T72,${14 + (coin.price_change_percentage_7d_in_currency||0)}`} fill="none" stroke={ (coin.price_change_percentage_7d_in_currency||0) >=0 ? '#22c55e' : '#ef4444'} strokeWidth="1.5" strokeLinecap="round" /></svg>
                      </div>
                      <button onClick={(e)=>{e.stopPropagation(); onToggleFavorite(coin.id);}} className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-full bg-[#1a1a1a] border border-[#252525] flex items-center justify-center hover:bg-white hover:text-black transition-all"><Star className={`w-3.5 h-3.5 ${isFav?'fill-amber-400 text-amber-400':''}`} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* MOBILE - SAME PREMIUM AS BEFORE */}
      <div className="md:hidden flex flex-col">
        {list.map((coin, i) => {
          const isFav = favorites.includes(coin.id);
          return (
            <div key={coin.id} onClick={() => onSelectCoin(coin)} className="flex items-center gap-3 px-4 h-[72px] border-b border-[#101012] active:bg-[#101012]">
              <span className="text-[11px] font-mono text-[#4a4a4a] w-6">{String(i+1).padStart(2,'0')}</span>
              <img src={coin.image} alt={coin.name} className="w-9 h-9 rounded-full bg-[#141414] border border-[#1e1e1e]" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5"><span className="text-[14px] font-semibold text-white truncate">{coin.name}</span>{isFav && <Star className="w-3 h-3 fill-amber-300 text-amber-300" />}</div>
                <span className="text-[11px] font-mono text-neutral-500 uppercase">{coin.symbol}</span>
              </div>
              <div className="text-right">
                <div className="text-[14px] font-semibold text-white font-mono">{formatCurrency(coin.current_price)}</div>
                <div className="text-[11px] font-mono text-neutral-500">MC {formatCompactNumber(coin.market_cap)}</div>
              </div>
              <span className={`ml-1 px-3 py-1 rounded-full text-[11px] font-bold font-mono border ${pill(coin.price_change_percentage_24h)}`}>{fmt(coin.price_change_percentage_24h)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
