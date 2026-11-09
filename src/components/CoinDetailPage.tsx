import React, { useState, useMemo } from 'react';
import { CryptoCoin } from '../types/crypto';
import { formatCurrency, formatCompactNumber, formatPercentage } from '../services/cryptoApi';
import {
  ArrowLeft,
  Star,
  Globe,
  ExternalLink,
  Github,
  Twitter,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Layers,
  Percent,
  Calendar,
  Share2,
  Check,
} from 'lucide-react';

interface CoinDetailPageProps {
  coin: CryptoCoin;
  onBack: () => void;
  favorites: string[];
  onToggleFavorite: (coinId: string) => void;
}

type ChartTimeframe = '24h' | '7d' | '30d' | '90d' | '1y';

export const CoinDetailPage: React.FC<CoinDetailPageProps> = ({
  coin,
  onBack,
  favorites,
  onToggleFavorite,
}) => {
  const [selectedChartRange, setSelectedChartRange] = useState<ChartTimeframe>('7d');
  const [hoveredPoint, setHoveredPoint] = useState<{ price: number; label: string } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [convertAmount, setConvertAmount] = useState<number>(1);

  const isFavorited = favorites.includes(coin.id);

  // Generate chart data for selected range based on available sparkline or baseline
  const chartPoints = useMemo(() => {
    const base = coin.current_price;
    let count = 30;
    let trend = (coin.price_change_percentage_7d_in_currency ?? 0) / 100;

    if (selectedChartRange === '24h') {
      count = 24;
      trend = (coin.price_change_percentage_24h ?? 0) / 100;
    } else if (selectedChartRange === '30d') {
      count = 30;
      trend = (coin.price_change_percentage_30d_in_currency ?? 0) / 100;
    } else if (selectedChartRange === '90d') {
      count = 45;
      trend = ((coin.price_change_percentage_30d_in_currency ?? 0) * 1.5) / 100;
    } else if (selectedChartRange === '1y') {
      count = 52;
      trend = (coin.price_change_percentage_1y_in_currency ?? 0) / 100;
    }

    if (selectedChartRange === '7d' && coin.sparkline_in_7d?.price && coin.sparkline_in_7d.price.length > 5) {
      return coin.sparkline_in_7d.price;
    }

    // Synthesize realistic curve leading up to current price
    const result: number[] = [];
    const startPrice = Math.max(base / (1 + trend), base * 0.2);
    let cur = startPrice;
    const delta = (base - startPrice) / count;

    for (let i = 0; i < count; i++) {
      const volatility = (Math.random() - 0.48) * (base * 0.035);
      cur += delta + volatility;
      result.push(Number(Math.max(cur, base * 0.1).toFixed(4)));
    }
    result[result.length - 1] = base;
    return result;
  }, [coin, selectedChartRange]);

  const minChartPrice = Math.min(...chartPoints);
  const maxChartPrice = Math.max(...chartPoints);
  const isUpTrend = chartPoints[chartPoints.length - 1] >= chartPoints[0];

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const circulatingRatio = coin.max_supply
    ? Math.min(100, Math.round((coin.circulating_supply / coin.max_supply) * 100))
    : coin.total_supply
    ? Math.min(100, Math.round((coin.circulating_supply / coin.total_supply) * 100))
    : null;

  return (
    <div className="w-full max-w-7xl mx-auto pb-16 animate-in fade-in duration-200">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex items-center justify-between gap-4 py-4 mb-2">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-all active:scale-95 text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4 text-emerald-400" />
          <span>Back to Top 100 Bubbles</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-all text-xs font-medium"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'Link Copied!' : 'Share'}</span>
          </button>
          <button
            onClick={() => onToggleFavorite(coin.id)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border transition-all text-xs font-semibold ${
              isFavorited
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                : 'bg-slate-900/90 hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${isFavorited ? 'fill-amber-400 text-amber-400' : ''}`} />
            <span>{isFavorited ? 'Watchlisted' : 'Add to Watchlist'}</span>
          </button>
        </div>
      </div>

      {/* Main Coin Header Card */}
      <div className="bg-[#0a0a0a] border border-[#1c1c1c] rounded-2xl p-6 shadow-xl mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left: Brand lockup */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center p-2 shadow-lg border border-[#222222] shrink-0">
              <img
                src={coin.image}
                alt={coin.name}
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {coin.name}
                </h1>
                <span className="text-sm uppercase font-mono font-bold text-neutral-400 bg-[#161616] px-2.5 py-0.5 rounded-md border border-[#252525]">
                  {coin.symbol}
                </span>
                <span className="text-xs font-mono font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2.5 py-0.5 rounded-full">
                  Rank #{coin.market_cap_rank}
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-1">
                Orbix Top 100 Visualizer Asset Profile
              </p>
            </div>
          </div>

          {/* Right: Price & 24h change */}
          <div className="flex flex-col lg:items-end">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl sm:text-4xl font-extrabold font-mono text-white tracking-tight">
                {formatCurrency(coin.current_price)}
              </span>
              <div
                className={`flex items-center gap-1 font-mono font-bold text-sm px-2.5 py-1 rounded-lg ${
                  coin.price_change_percentage_24h >= 0
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                }`}
              >
                {coin.price_change_percentage_24h >= 0 ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                <span>{formatPercentage(coin.price_change_percentage_24h)}</span>
                <span className="text-[11px] opacity-75">(24h)</span>
              </div>
            </div>

            {/* 24h Low / High Bar */}
            <div className="w-full sm:w-64 mt-3">
              <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1">
                <span>Low: {formatCurrency(coin.low_24h)}</span>
                <span>High: {formatCurrency(coin.high_24h)}</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(
                        5,
                        ((coin.current_price - coin.low_24h) / (coin.high_24h - coin.low_24h || 1)) * 100
                      )
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Chart & Key Characteristics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Interactive Price Chart (2 cols) */}
        <div className="lg:col-span-2 bg-[#0c101a] border border-slate-800/80 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-bold text-white tracking-wide">
                Price Performance Chart
              </h2>
            </div>

            {/* Timeframe selector */}
            <div className="flex items-center p-1 bg-slate-900 rounded-xl border border-slate-800">
              {(['24h', '7d', '30d', '90d', '1y'] as ChartTimeframe[]).map(tf => (
                <button
                  key={tf}
                  onClick={() => setSelectedChartRange(tf)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                    selectedChartRange === tf
                      ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tf.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Chart Canvas / SVG Container */}
          <div className="relative w-full h-[280px] sm:h-[320px] my-2 select-none">
            {hoveredPoint && (
              <div className="absolute top-2 left-2 z-10 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-700 shadow-lg text-xs font-mono">
                <span className="text-slate-400">{hoveredPoint.label}: </span>
                <span className="text-emerald-400 font-bold">{formatCurrency(hoveredPoint.price)}</span>
              </div>
            )}

            <svg
              className="w-full h-full overflow-visible"
              viewBox="0 0 700 300"
              preserveAspectRatio="none"
              onMouseLeave={() => setHoveredPoint(null)}
            >
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor={isUpTrend ? '#10b981' : '#f43f5e'}
                    stopOpacity="0.35"
                  />
                  <stop
                    offset="100%"
                    stopColor={isUpTrend ? '#10b981' : '#f43f5e'}
                    stopOpacity="0.0"
                  />
                </linearGradient>
              </defs>

              {/* Horizontal Reference Lines */}
              {[0.2, 0.4, 0.6, 0.8].map(ratio => (
                <line
                  key={ratio}
                  x1="0"
                  y1={300 * ratio}
                  x2="700"
                  y2={300 * ratio}
                  stroke="rgba(255, 255, 255, 0.04)"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
              ))}

              {/* Area path */}
              {(() => {
                const range = maxChartPrice - minChartPrice || 1;
                const points = chartPoints.map((p, i) => {
                  const x = (i / (chartPoints.length - 1)) * 700;
                  const y = 280 - ((p - minChartPrice) / range) * 240 - 20;
                  return { x, y, price: p };
                });

                const polyPoints = `0,300 ${points.map(p => `${p.x},${p.y}`).join(' ')} 700,300`;
                const linePoints = points.map(p => `${p.x},${p.y}`).join(' ');

                return (
                  <>
                    <polygon points={polyPoints} fill="url(#chartGradient)" />
                    <polyline
                      fill="none"
                      stroke={isUpTrend ? '#10b981' : '#f43f5e'}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={linePoints}
                    />

                    {/* Interactive hover points */}
                    {points.map((pt, idx) => (
                      <circle
                        key={idx}
                        cx={pt.x}
                        cy={pt.y}
                        r="8"
                        className="opacity-0 hover:opacity-100 fill-emerald-400 stroke-white cursor-pointer transition-opacity"
                        onMouseEnter={() =>
                          setHoveredPoint({
                            price: pt.price,
                            label: `Point ${idx + 1}/${points.length}`,
                          })
                        }
                      />
                    ))}
                  </>
                );
              })()}
            </svg>
          </div>

          <div className="flex justify-between items-center text-xs font-mono text-slate-500 pt-2 border-t border-slate-800">
            <span>Low: {formatCurrency(minChartPrice)}</span>
            <span>Range: {selectedChartRange.toUpperCase()}</span>
            <span>High: {formatCurrency(maxChartPrice)}</span>
          </div>
        </div>

        {/* Quick Characteristics Sidebar (1 col) */}
        <div className="bg-[#0c101a] border border-slate-800/80 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Layers className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-bold text-white tracking-wide">
                Key Metrics
              </h2>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800/80">
                <span className="text-xs text-slate-400">Market Capitalization</span>
                <span className="text-sm font-bold font-mono text-white">
                  {formatCompactNumber(coin.market_cap)}
                </span>
              </div>

              <div className="flex justify-between items-center pb-2 border-b border-slate-800/80">
                <span className="text-xs text-slate-400">24h Trading Volume</span>
                <span className="text-sm font-bold font-mono text-white">
                  {formatCompactNumber(coin.total_volume)}
                </span>
              </div>

              <div className="flex justify-between items-center pb-2 border-b border-slate-800/80">
                <span className="text-xs text-slate-400">Volume / Market Cap</span>
                <span className="text-sm font-mono text-slate-200">
                  {coin.market_cap > 0 ? (coin.total_volume / coin.market_cap).toFixed(4) : 'N/A'}
                </span>
              </div>

              <div className="flex justify-between items-center pb-2 border-b border-slate-800/80">
                <span className="text-xs text-slate-400">Circulating Supply</span>
                <span className="text-sm font-mono text-slate-200">
                  {formatCompactNumber(coin.circulating_supply, '')} {coin.symbol.toUpperCase()}
                </span>
              </div>

              {circulatingRatio !== null && (
                <div className="pb-2 border-b border-slate-800/80">
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Supply Issued</span>
                    <span className="font-mono text-emerald-400 font-semibold">{circulatingRatio}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-400 rounded-full"
                      style={{ width: `${circulatingRatio}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center pb-2 border-b border-slate-800/80">
                <span className="text-xs text-slate-400">All-Time High (ATH)</span>
                <div className="text-right">
                  <div className="text-sm font-bold font-mono text-white">
                    {formatCurrency(coin.ath)}
                  </div>
                  <div className="text-[11px] font-mono text-rose-400">
                    {formatPercentage(coin.ath_change_percentage)}
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400">All-Time Low (ATL)</span>
                <div className="text-right">
                  <div className="text-sm font-bold font-mono text-white">
                    {formatCurrency(coin.atl)}
                  </div>
                  <div className="text-[11px] font-mono text-emerald-400">
                    {formatPercentage(coin.atl_change_percentage)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Currency Converter */}
          <div className="mt-6 pt-4 border-t border-slate-800">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Quick Converter
            </h3>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 flex items-center justify-between">
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={convertAmount}
                  onChange={e => setConvertAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-20 bg-transparent text-sm font-mono text-white focus:outline-none"
                />
                <span className="text-xs font-mono font-bold text-slate-400">
                  {coin.symbol.toUpperCase()}
                </span>
              </div>
              <span className="text-slate-500 font-bold">=</span>
              <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 flex items-center justify-between">
                <span className="text-sm font-mono text-emerald-400 font-bold truncate">
                  {formatCurrency(convertAmount * coin.current_price)}
                </span>
                <span className="text-xs font-mono font-bold text-slate-400">USD</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Historical Performance Matrix */}
      <div className="bg-[#0c101a] border border-slate-800/80 rounded-2xl p-6 shadow-xl mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Percent className="w-4 h-4 text-emerald-400" />
          <h2 className="text-sm font-bold text-white tracking-wide">
            Multi-Period Performance
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: '1 Hour', val: coin.price_change_percentage_1h_in_currency ?? 0.1 },
            { label: '24 Hours', val: coin.price_change_percentage_24h ?? 0 },
            { label: '7 Days', val: coin.price_change_percentage_7d_in_currency ?? 0 },
            { label: '30 Days', val: coin.price_change_percentage_30d_in_currency ?? 0 },
            { label: '1 Year', val: coin.price_change_percentage_1y_in_currency ?? 0 },
            { label: 'From ATH', val: coin.ath_change_percentage ?? 0 },
          ].map(item => {
            const isPos = item.val >= 0;
            return (
              <div
                key={item.label}
                className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex flex-col"
              >
                <span className="text-[11px] text-slate-400 mb-1">{item.label}</span>
                <span
                  className={`text-base font-extrabold font-mono ${
                    isPos ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {formatPercentage(item.val)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* About & Verified Links */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Description / About (2 cols) */}
        <div className="lg:col-span-2 bg-[#0c101a] border border-slate-800/80 rounded-2xl p-6 shadow-xl">
          <h2 className="text-base font-bold text-white tracking-wide mb-3">
            About {coin.name}
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            {coin.description ||
              `${coin.name} (${coin.symbol.toUpperCase()}) is one of the top 100 cryptocurrencies in the global blockchain ecosystem by market capitalization.`}
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <span className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-lg text-slate-300">
              Layer 1 / Ecosystem
            </span>
            <span className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-lg text-slate-300">
              Smart Contracts
            </span>
            <span className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-lg text-slate-300">
              PoS / Consensus
            </span>
          </div>
        </div>

        {/* Resources & Links (1 col) */}
        <div className="bg-[#0c101a] border border-slate-800/80 rounded-2xl p-6 shadow-xl">
          <h2 className="text-base font-bold text-white tracking-wide mb-3">
            Official Resources
          </h2>
          <div className="space-y-2">
            {coin.homepage && (
              <a
                href={coin.homepage}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-200 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-emerald-400" />
                  <span>Official Website</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              </a>
            )}

            {coin.blockchain_site && (
              <a
                href={coin.blockchain_site}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-200 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  <span>Block Explorer</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              </a>
            )}

            {coin.github && (
              <a
                href={coin.github}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-200 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Github className="w-4 h-4 text-emerald-400" />
                  <span>Source Code</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              </a>
            )}

            {coin.twitter_screen_name && (
              <a
                href={`https://twitter.com/${coin.twitter_screen_name}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-200 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Twitter className="w-4 h-4 text-sky-400" />
                  <span>Community / X</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
