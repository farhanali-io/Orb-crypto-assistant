import React from 'react';
import { CryptoCoin } from '../types/crypto';
import { formatCurrency, formatCompactNumber, formatPercentage } from '../services/cryptoApi';
import { Star, Globe, Compass, Twitter, Plus, Sparkles } from 'lucide-react';

interface MarketTableProps {
  coins: CryptoCoin[];
  onSelectCoin: (coin: CryptoCoin) => void;
  searchQuery: string;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
}

export const MarketTable: React.FC<MarketTableProps> = ({
  coins,
  onSelectCoin,
  favorites,
  onToggleFavorite,
}) => {
  
  const getPercentColor = (val?: number) => {
    if (val === undefined || val === null) return 'text-slate-400 bg-[#111]';
    if (val > 0) return 'text-white bg-[#16a34a]'; // solid green
    if (val < 0) return 'text-white bg-[#dc2626]'; // solid red
    return 'text-slate-400 bg-[#111]'; // neutral
  };

  const getAIPrediction = (val?: number) => {
    const change = val || 0;
    if (change > 2) return { label: 'Bullish', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };
    if (change < -2) return { label: 'Bearish', color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' };
    return { label: 'Neutral', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
  };

  return (
    <div className="w-full overflow-x-auto bg-[#0a0a0a] border-y border-[#1a1a1a]">
      <table className="w-full text-left border-collapse min-w-[1000px]">
        <thead>
          <tr className="border-b border-[#1a1a1a] text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-[#0a0a0a]">
            <th className="py-3 px-4 w-12 text-center">#</th>
            <th className="py-3 px-4">Name</th>
            <th className="py-3 px-4 text-right">Price</th>
            <th className="py-3 px-4 text-right">Market Cap</th>
            <th className="py-3 px-4 text-right">24H Volume</th>
            <th className="py-3 px-2 text-center w-16">1H</th>
            <th className="py-3 px-2 text-center w-16">Day</th>
            <th className="py-3 px-2 text-center w-16">Week</th>
            <th className="py-3 px-2 text-center w-16">Month</th>
            <th className="py-3 px-2 text-center w-16">Year</th>
            <th className="py-3 px-4 text-center">Links</th>
            <th className="py-3 px-4 text-right">AI Prediction</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1a1a1a]">
          {coins.map((coin, index) => {
            const isFav = favorites.includes(coin.id);
            const ai = getAIPrediction(coin.price_change_percentage_24h);

            return (
              <tr 
                key={coin.id} 
                className="hover:bg-[#141414] transition-colors group cursor-pointer"
                onClick={() => onSelectCoin(coin)}
              >
                {/* Rank & Favorite */}
                <td className="py-3 px-4">
                  <div className="flex items-center justify-center gap-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); onToggleFavorite(coin.id); }}
                      className="text-slate-600 hover:text-amber-400 transition-colors"
                    >
                      {isFav ? <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> : <Plus className="w-3.5 h-3.5" />}
                    </button>
                    <span className="text-xs font-mono text-slate-500">{index + 1}</span>
                  </div>
                </td>

                {/* Name & Ticker */}
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <img src={coin.image} alt={coin.name} className="w-6 h-6 rounded-full shrink-0" />
                    <div className="flex items-baseline gap-1.5 truncate">
                      <span className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors truncate">{coin.name}</span>
                      <span className="text-[10px] font-mono text-slate-500 uppercase">{coin.symbol}</span>
                    </div>
                  </div>
                </td>

                {/* Price */}
                <td className="py-3 px-4 text-right">
                  <span className="text-sm font-mono text-white font-medium">{formatCurrency(coin.current_price)}</span>
                </td>

                {/* Market Cap & Volume */}
                <td className="py-3 px-4 text-right">
                  <span className="text-sm font-mono text-slate-300">{formatCompactNumber(coin.market_cap)}</span>
                </td>
                <td className="py-3 px-4 text-right">
                  <span className="text-sm font-mono text-slate-300">{formatCompactNumber(coin.total_volume)}</span>
                </td>

                {/* Performance Cells */}
                <td className="p-1">
                  <div className={`w-full h-full py-2 rounded-sm text-center text-[11px] font-bold font-mono ${getPercentColor(coin.price_change_percentage_1h_in_currency)}`}>
                    {coin.price_change_percentage_1h_in_currency ? `${coin.price_change_percentage_1h_in_currency.toFixed(1)}%` : '-'}
                  </div>
                </td>
                <td className="p-1">
                  <div className={`w-full h-full py-2 rounded-sm text-center text-[11px] font-bold font-mono ${getPercentColor(coin.price_change_percentage_24h)}`}>
                    {coin.price_change_percentage_24h ? `${coin.price_change_percentage_24h.toFixed(1)}%` : '-'}
                  </div>
                </td>
                <td className="p-1">
                  <div className={`w-full h-full py-2 rounded-sm text-center text-[11px] font-bold font-mono ${getPercentColor(coin.price_change_percentage_7d_in_currency)}`}>
                    {coin.price_change_percentage_7d_in_currency ? `${coin.price_change_percentage_7d_in_currency.toFixed(1)}%` : '-'}
                  </div>
                </td>
                <td className="p-1">
                  <div className={`w-full h-full py-2 rounded-sm text-center text-[11px] font-bold font-mono ${getPercentColor(coin.price_change_percentage_30d_in_currency)}`}>
                    {coin.price_change_percentage_30d_in_currency ? `${coin.price_change_percentage_30d_in_currency.toFixed(1)}%` : '-'}
                  </div>
                </td>
                <td className="p-1">
                  <div className={`w-full h-full py-2 rounded-sm text-center text-[11px] font-bold font-mono ${getPercentColor(coin.price_change_percentage_1y_in_currency)}`}>
                    {coin.price_change_percentage_1y_in_currency ? `${coin.price_change_percentage_1y_in_currency.toFixed(1)}%` : '-'}
                  </div>
                </td>

                {/* Links */}
                <td className="py-3 px-4">
                  <div className="flex items-center justify-center gap-2 text-slate-600">
                    {coin.homepage && (
                      <a href={coin.homepage} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="hover:text-white transition-colors" title="Website">
                        <Globe className="w-4 h-4" />
                      </a>
                    )}
                    {coin.blockchain_site && (
                      <a href={coin.blockchain_site} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="hover:text-white transition-colors" title="Explorer">
                        <Compass className="w-4 h-4" />
                      </a>
                    )}
                    {coin.twitter_screen_name && (
                      <a href={`https://twitter.com/${coin.twitter_screen_name}`} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="hover:text-sky-400 transition-colors" title="Twitter">
                        <Twitter className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </td>

                {/* AI Prediction */}
                <td className="py-3 px-4 text-right">
                  <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md border text-[10px] font-bold tracking-wide uppercase ${ai.color}`}>
                    <Sparkles className="w-3 h-3" />
                    {ai.label}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
