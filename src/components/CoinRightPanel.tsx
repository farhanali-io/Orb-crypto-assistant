import React, { useEffect } from 'react';
import { X, Star, ExternalLink, TrendingUp, TrendingDown, DollarSign, Activity, BarChart2 } from 'lucide-react';
import { CryptoCoin } from '../types/crypto';
import { formatCurrency, formatPercentage, formatCompactNumber } from '../services/cryptoApi';

interface CoinRightPanelProps {
  coin: CryptoCoin | null;
  isOpen: boolean;
  onClose: () => void;
  onViewFullPage: (coin: CryptoCoin) => void;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
}

export const CoinRightPanel: React.FC<CoinRightPanelProps> = ({
  coin,
  isOpen,
  onClose,
  onViewFullPage,
  isFavorite,
  onToggleFavorite,
}) => {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!coin) return null;

  const isPositive = coin.price_change_percentage_24h >= 0;

  return (
    <>
      {/* Backdrop overlay */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Slide-in Right Panel: 300ms transition */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[420px] bg-[#0A0A0A] border-l border-[#222222] shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Panel Header */}
        <div className="px-5 py-4 border-b border-[#1c1c1c] flex items-center justify-between bg-[#0E0E0E]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white p-0.5 flex items-center justify-center shrink-0 border border-white/20 shadow-sm">
              <img
                src={coin.image}
                alt={coin.name}
                className="w-full h-full object-contain rounded-full"
                onError={e => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base leading-tight">{coin.name}</h3>
                <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-[#202020] text-neutral-400 uppercase">
                  #{coin.market_cap_rank || '—'}
                </span>
              </div>
              <span className="text-xs font-mono text-neutral-400 uppercase">{coin.symbol}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleFavorite(coin.id)}
              className={`p-2 rounded-lg border transition-colors ${
                isFavorite
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                  : 'bg-[#181818] border-[#282828] text-neutral-400 hover:text-white'
              }`}
              title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Star className={`w-4 h-4 ${isFavorite ? 'fill-amber-400' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-[#181818] border border-[#282828] text-neutral-400 hover:text-white transition-colors"
              title="Close panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Panel Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          {/* Main Price Card */}
          <div className="p-4 rounded-xl bg-[#111111] border border-[#222222]">
            <span className="text-xs font-medium text-neutral-400 block mb-1">Current Price</span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-extrabold font-mono text-white tracking-tight">
                {formatCurrency(coin.current_price)}
              </span>
              <div
                className={`flex items-center gap-1 text-sm font-bold font-mono px-2 py-0.5 rounded ${
                  isPositive ? 'text-[#00FF88] bg-[#00FF88]/10' : 'text-[#FF2D2D] bg-[#FF2D2D]/10'
                }`}
              >
                {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                <span>{formatPercentage(coin.price_change_percentage_24h)}</span>
              </div>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">Market Overview</h4>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 rounded-lg bg-[#111111] border border-[#1e1e1e]">
                <div className="flex items-center gap-1.5 text-neutral-400 text-xs mb-1">
                  <DollarSign className="w-3.5 h-3.5 text-neutral-500" />
                  <span>Market Cap</span>
                </div>
                <span className="font-mono text-sm font-bold text-white block">
                  {formatCompactNumber(coin.market_cap)}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-[#111111] border border-[#1e1e1e]">
                <div className="flex items-center gap-1.5 text-neutral-400 text-xs mb-1">
                  <Activity className="w-3.5 h-3.5 text-neutral-500" />
                  <span>24h Volume</span>
                </div>
                <span className="font-mono text-sm font-bold text-white block">
                  {formatCompactNumber(coin.total_volume)}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-[#111111] border border-[#1e1e1e]">
                <span className="text-neutral-400 text-xs block mb-1">24h High</span>
                <span className="font-mono text-sm font-bold text-white block">
                  {formatCurrency(coin.high_24h)}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-[#111111] border border-[#1e1e1e]">
                <span className="text-neutral-400 text-xs block mb-1">24h Low</span>
                <span className="font-mono text-sm font-bold text-white block">
                  {formatCurrency(coin.low_24h)}
                </span>
              </div>
            </div>
          </div>

          {/* Supply & ATH */}
          <div className="p-3.5 rounded-xl bg-[#111111] border border-[#1e1e1e] space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-400">Circulating Supply</span>
              <span className="font-mono font-medium text-white">
                {coin.circulating_supply?.toLocaleString() || 'N/A'} {coin.symbol.toUpperCase()}
              </span>
            </div>
            {coin.total_supply && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-400">Total Supply</span>
                <span className="font-mono font-medium text-white">
                  {coin.total_supply?.toLocaleString()} {coin.symbol.toUpperCase()}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between text-xs pt-2 border-t border-[#1c1c1c]">
              <span className="text-neutral-400">All-Time High</span>
              <span className="font-mono font-semibold text-white">
                {formatCurrency(coin.ath)}
              </span>
            </div>
          </div>
        </div>

        {/* Panel Footer */}
        <div className="p-4 border-t border-[#1c1c1c] bg-[#0E0E0E]">
          <button
            onClick={() => {
              onViewFullPage(coin);
              onClose();
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-[#1a1a1a] hover:bg-[#252525] border border-[#333333] text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            <BarChart2 className="w-4 h-4 text-emerald-400" />
            <span>Open Detailed Analysis Page</span>
            <ExternalLink className="w-3.5 h-3.5 text-neutral-400" />
          </button>
        </div>
      </div>
    </>
  );
};
