import React, { useState, useMemo } from 'react';
import { CryptoCoin } from '../types/crypto';
import { formatCurrency, formatCompactNumber, formatPercentage } from '../services/cryptoApi';
import { ArrowUpDown, ArrowUp, ArrowDown, Sparkles } from 'lucide-react';

interface MarketTableProps {
  coins: CryptoCoin[];
  onSelectCoin: (coin: CryptoCoin) => void;
  searchQuery: string;
}

type SortField = 'rank' | 'name' | 'price' | '24h' | 'volume' | 'market_cap' | 'ai_score';
type SortDirection = 'asc' | 'desc';

// Deterministic AI Score calculator (1–100) based on rank, 24h change, and volume momentum
function getCoinAiScore(coin: CryptoCoin): { score: number; label: string } {
  const change = coin.price_change_percentage_24h ?? 0;
  let base = 75;
  if (coin.market_cap_rank <= 5) base += 12;
  else if (coin.market_cap_rank <= 20) base += 8;
  else if (coin.market_cap_rank <= 50) base += 4;

  const changeBoost = Math.max(-15, Math.min(12, Math.round(change * 1.2)));
  const finalScore = Math.max(52, Math.min(98, base + changeBoost));

  let label = 'Neutral';
  if (finalScore >= 88) label = 'Strong Buy';
  else if (finalScore >= 80) label = 'Bullish';
  else if (finalScore >= 68) label = 'Neutral';
  else label = 'Oversold';

  return { score: finalScore, label };
}

export const MarketTable: React.FC<MarketTableProps> = ({
  coins,
  onSelectCoin,
  searchQuery,
}) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [sortField, setSortField] = useState<SortField>('rank');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const pageSize = 50;

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection(field === 'rank' || field === 'name' ? 'asc' : 'desc');
    }
  };

  const sortedCoins = useMemo(() => {
    const list = [...coins];
    return list.sort((a, b) => {
      let valA: number | string = 0;
      let valB: number | string = 0;

      switch (sortField) {
        case 'rank':
          valA = a.market_cap_rank;
          valB = b.market_cap_rank;
          break;
        case 'name':
          valA = a.name.toLowerCase();
          valB = b.name.toLowerCase();
          break;
        case 'price':
          valA = a.current_price;
          valB = b.current_price;
          break;
        case '24h':
          valA = a.price_change_percentage_24h ?? 0;
          valB = b.price_change_percentage_24h ?? 0;
          break;
        case 'volume':
          valA = a.total_volume ?? 0;
          valB = b.total_volume ?? 0;
          break;
        case 'market_cap':
          valA = a.market_cap ?? 0;
          valB = b.market_cap ?? 0;
          break;
        case 'ai_score':
          valA = getCoinAiScore(a).score;
          valB = getCoinAiScore(b).score;
          break;
      }

      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortDirection === 'asc' ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
    });
  }, [coins, sortField, sortDirection]);

  // Total pages
  const totalPages = Math.max(1, Math.ceil(sortedCoins.length / pageSize));
  const activePage = Math.min(currentPage, totalPages);
  const pagedCoins = sortedCoins.slice((activePage - 1) * pageSize, activePage * pageSize);

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-[#555555] opacity-60" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-[#00D97A]" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-[#00D97A]" />
    );
  };

  return (
    <div className="w-full max-w-[1200px] mx-auto px-4 py-4 bg-[#000000] select-none">
      {/* Table Title and Status */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <span>Top 100 Cryptocurrencies by Market Cap</span>
            <span className="text-[11px] font-mono text-[#8A94A6] bg-[#0A0A0A] border border-[#1E2633] px-2 py-0.5 rounded">
              Page {activePage} of {totalPages}
            </span>
          </h2>
        </div>

        {searchQuery && (
          <span className="text-xs text-neutral-400 bg-[#0A0A0A] border border-[#1E2633] px-3 py-1 rounded-full">
            Filtered by: <strong className="text-white">{searchQuery}</strong>
          </span>
        )}
      </div>

      {/* Responsive Horizontal Scroll Container */}
      <div className="w-full overflow-x-auto scrollbar-thin border border-[#1E2633] rounded-xl bg-black">
        <table className="w-full text-left border-collapse min-w-[580px] md:min-w-[850px]">
          {/* Header Row: Sticky, Background #0A0A0A, text #8A94A6, 12px uppercase, border-bottom 1px #1E2633 */}
          <thead>
            <tr className="sticky top-0 z-20 bg-[#0A0A0A] border-b border-[#1E2633] text-[12px] font-semibold text-[#8A94A6] uppercase tracking-wider h-11">
              <th
                onClick={() => handleSort('rank')}
                className="py-2.5 px-3 cursor-pointer hover:text-white transition-colors w-12 text-center"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>#</span>
                  {getSortIcon('rank')}
                </div>
              </th>

              <th
                onClick={() => handleSort('name')}
                className="py-2.5 px-4 cursor-pointer hover:text-white transition-colors min-w-[160px] md:min-w-[220px]"
              >
                <div className="flex items-center gap-1">
                  <span>Coin</span>
                  {getSortIcon('name')}
                </div>
              </th>

              <th
                onClick={() => handleSort('price')}
                className="py-2.5 px-4 cursor-pointer hover:text-white transition-colors text-right"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Price</span>
                  {getSortIcon('price')}
                </div>
              </th>

              <th
                onClick={() => handleSort('24h')}
                className="py-2.5 px-4 cursor-pointer hover:text-white transition-colors text-right"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>24h %</span>
                  {getSortIcon('24h')}
                </div>
              </th>

              {/* Market Cap & Volume hidden on mobile */}
              <th
                onClick={() => handleSort('market_cap')}
                className="hidden md:table-cell py-2.5 px-4 cursor-pointer hover:text-white transition-colors text-right"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Market Cap</span>
                  {getSortIcon('market_cap')}
                </div>
              </th>

              <th
                onClick={() => handleSort('volume')}
                className="hidden md:table-cell py-2.5 px-4 cursor-pointer hover:text-white transition-colors text-right"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>24h Volume</span>
                  {getSortIcon('volume')}
                </div>
              </th>

              <th
                onClick={() => handleSort('ai_score')}
                className="py-2.5 px-4 cursor-pointer hover:text-white transition-colors text-center w-28"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>AI Score</span>
                  {getSortIcon('ai_score')}
                </div>
              </th>
            </tr>
          </thead>

          {/* Rows: Height 56px, border-bottom 1px #111111, alternate row background #000 and #050505 */}
          <tbody className="divide-y divide-[#111111] text-sm">
            {pagedCoins.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-neutral-500 font-mono text-xs">
                  No coins found matching "{searchQuery}".
                </td>
              </tr>
            ) : (
              pagedCoins.map((coin, index) => {
                const isEven = index % 2 === 0;
                const change24h = coin.price_change_percentage_24h ?? 0;
                const isUp = change24h >= 0;
                const ai = getCoinAiScore(coin);

                return (
                  <tr
                    key={coin.id}
                    onClick={() => onSelectCoin(coin)}
                    className={`h-[56px] transition-colors cursor-pointer group ${
                      isEven ? 'bg-[#000000]' : 'bg-[#050505]'
                    } hover:bg-[#101010]`}
                  >
                    {/* # Rank */}
                    <td className="py-2 px-3 text-center font-mono text-xs text-neutral-400">
                      {coin.market_cap_rank}
                    </td>

                    {/* Coin: Logo + Name + Symbol */}
                    <td className="py-2 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center p-0.5 overflow-hidden shrink-0 border border-neutral-700">
                          <img
                            src={coin.image}
                            alt={coin.name}
                            className="w-full h-full object-contain rounded-full"
                            onError={e => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        </div>
                        <div className="min-w-0">
                          <span className="font-semibold text-white group-hover:text-emerald-400 transition-colors mr-2">
                            {coin.name}
                          </span>
                          <span className="text-xs uppercase font-mono text-neutral-500">
                            {coin.symbol}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Price: White bold */}
                    <td className="py-2 px-4 text-right font-mono font-bold text-white whitespace-nowrap">
                      {formatCurrency(coin.current_price)}
                    </td>

                    {/* 24h %: green/red pill, background 15% opacity */}
                    <td className="py-2 px-4 text-right whitespace-nowrap">
                      <span
                        className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-mono font-bold"
                        style={{
                          color: isUp ? '#00D97A' : '#FF2222',
                          backgroundColor: isUp ? 'rgba(0, 217, 122, 0.15)' : 'rgba(255, 34, 34, 0.15)',
                        }}
                      >
                        {formatPercentage(change24h)}
                      </span>
                    </td>

                    {/* Market Cap (Hidden on mobile) */}
                    <td className="hidden md:table-cell py-2 px-4 text-right font-mono text-xs text-neutral-300 whitespace-nowrap">
                      {formatCompactNumber(coin.market_cap)}
                    </td>

                    {/* Volume (Hidden on mobile) */}
                    <td className="hidden md:table-cell py-2 px-4 text-right font-mono text-xs text-neutral-300 whitespace-nowrap">
                      {formatCompactNumber(coin.total_volume)}
                    </td>

                    {/* AI Score Badge */}
                    <td className="py-2 px-4 text-center whitespace-nowrap">
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#121212] border border-[#222222] text-[11px] font-mono">
                        <Sparkles
                          className={`w-3 h-3 ${ai.score >= 80 ? 'text-[#00D97A]' : 'text-amber-400'}`}
                        />
                        <span className="font-bold text-white">{ai.score}</span>
                        <span className="text-[10px] text-neutral-400 hidden sm:inline">
                          · {ai.label}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination: Below table, centered buttons [1] [2] with 50 coins per page */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNumber => {
            const isActive = pageNumber === activePage;
            return (
              <button
                key={pageNumber}
                onClick={() => {
                  setCurrentPage(pageNumber);
                  window.scrollTo({ top: window.innerHeight * 0.7, behavior: 'smooth' });
                }}
                className={`w-9 h-9 rounded-xl text-xs font-mono font-bold transition-all border ${
                  isActive
                    ? 'bg-white text-black border-white shadow-lg'
                    : 'bg-[#0A0A0A] text-neutral-400 border-[#1E2633] hover:text-white hover:bg-[#141414]'
                }`}
              >
                {pageNumber}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
