import React, { useState, useMemo, useRef, useEffect } from 'react';
import { CryptoCoin } from '../types/crypto';
import { formatCurrency, formatCompactNumber } from '../services/cryptoApi';
import {
  Star,
  Globe,
  Github,
  Twitter,
  Share2,
  Check,
  ChevronRight,
  MoveHorizontal,
  FileText,
  Compass,
  MessageCircle,
  Send,
} from 'lucide-react';

interface CoinDetailPageProps {
  coin: CryptoCoin;
  onBack: () => void;
  favorites: string[];
  onToggleFavorite: (coinId: string) => void;
}

type ChartTimeframe = '24h' | '7d' | '30d' | '90d' | '1y' | 'max';

export const CoinDetailPage: React.FC<CoinDetailPageProps> = ({
  coin,
  onBack,
  favorites,
  onToggleFavorite,
}) => {
  const [selectedChartRange, setSelectedChartRange] = useState<ChartTimeframe>('24h');
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showAllTags, setShowAllTags] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);

  // State for the extra API details
  const [extraDetails, setExtraDetails] = useState<{
    description?: string;
    genesis_date?: string;
    algorithm?: string;
    whitepaper?: string;
    subreddit?: string;
    telegram?: string;
    tags?: string[];
  }>({});

  const isFavorited = favorites.includes(coin.id);
  const isPositive = (coin.price_change_percentage_24h ?? 0) >= 0;

  // Fetch unique details for this specific coin
  useEffect(() => {
    let isMounted = true;
    const fetchDetails = async () => {
      try {
        const res = await fetch(`https://api.coingecko.com/api/v3/coins/${coin.id}?localization=false&tickers=false&market_data=false&community_data=false&developer_data=false&sparkline=false`);
        if (!res.ok) throw new Error('Failed to fetch details');
        const data = await res.json();
        if (!isMounted) return;

        // Strip HTML tags from the description and truncate
        let cleanDesc = data.description?.en || '';
        cleanDesc = cleanDesc.replace(/<[^>]+>/g, '');
        const sentences = cleanDesc.split('. ').slice(0, 4).join('. ');
        cleanDesc = sentences ? sentences + '.' : '';

        setExtraDetails({
          description: cleanDesc,
          genesis_date: data.genesis_date,
          algorithm: data.hashing_algorithm,
          whitepaper: data.links?.whitepaper,
          subreddit: data.links?.subreddit_url,
          telegram: data.links?.telegram_channel_identifier ? `https://t.me/${data.links.telegram_channel_identifier}` : undefined,
          tags: data.categories?.filter((t: string) => t && t.length < 25).slice(0, 6),
        });
      } catch (e) {
        console.warn('Could not fetch extra details', e);
      }
    };
    fetchDetails();
    return () => { isMounted = false; };
  }, [coin.id]);

  const chartPoints = useMemo(() => {
    const base = coin.current_price;
    let count = 30;
    let trend = (coin.price_change_percentage_7d_in_currency ?? 0) / 100;

    if (selectedChartRange === '24h') { count = 24; trend = (coin.price_change_percentage_24h ?? 0) / 100; }
    else if (selectedChartRange === '30d') { count = 30; trend = (coin.price_change_percentage_30d_in_currency ?? 0) / 100; }
    else if (selectedChartRange === '90d') { count = 45; trend = ((coin.price_change_percentage_30d_in_currency ?? 0) * 1.5) / 100; }
    else if (selectedChartRange === '1y' || selectedChartRange === 'max') { count = 52; trend = (coin.price_change_percentage_1y_in_currency ?? 0) / 100; }

    if (selectedChartRange === '7d' && coin.sparkline_in_7d?.price && coin.sparkline_in_7d.price.length > 5) {
      return coin.sparkline_in_7d.price;
    }

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
  const midChartPrice = (minChartPrice + maxChartPrice) / 2;
  
  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleChartMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!chartRef.current) return;
    const rect = chartRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(1, x / rect.width));
    const index = Math.round(percent * (chartPoints.length - 1));
    setHoverIndex(index);
  };

  const change24h = coin.price_change_percentage_24h || 0;
  const bullishPercent = Math.min(90, Math.max(10, 50 + (change24h * 2)));
  const bearishPercent = 100 - bullishPercent;

  const chartWidth = 1000;
  const chartHeight = 400;
  const paddingY = 40;
  const plotHeight = chartHeight - paddingY * 2;

  return (
    <div className="w-full bg-transparent min-h-screen text-slate-200 pb-16 font-sans relative">
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]" 
           style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      {/* Full-width container instead of max-w-[1400px] */}
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 relative z-10">
        
        <div className="flex items-center justify-between py-6">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
            <button onClick={onBack} className="hover:text-white transition-colors flex items-center gap-1">
              Cryptocurrencies
            </button>
            <ChevronRight className="w-3 h-3" />
            <span className="text-white capitalize">{coin.name} Price</span>
          </div>
          
          <div className="flex items-center gap-3">
            <button onClick={handleShare} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#1a1a1a] hover:bg-[#222] text-slate-300 transition-all text-xs font-medium border border-[#2a2a2a]">
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copiedLink ? 'Copied' : 'Share'}</span>
            </button>
            <button onClick={() => onToggleFavorite(coin.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#1a1a1a] hover:bg-[#222] text-slate-300 transition-all text-xs font-medium border border-[#2a2a2a]">
              <Star className={`w-3.5 h-3.5 ${isFavorited ? 'fill-amber-400 text-amber-400' : ''}`} />
              <span className="hidden sm:inline">{isFavorited ? 'Watchlisted' : 'Watchlist'}</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 mt-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-white shrink-0">
              <img src={coin.image} alt={coin.name} className="w-full h-full object-contain p-1" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight flex items-center gap-3">
                {coin.name} <span className="text-slate-500 font-normal">Price</span>
              </h1>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300 bg-[#1a1a1a] border border-[#2a2a2a] px-2 py-0.5 rounded">
                  {coin.symbol}
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300 bg-[#1a1a1a] border border-[#2a2a2a] px-2 py-0.5 rounded">
                  Rank #{coin.market_cap_rank}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:items-end">
            <div className="text-5xl sm:text-6xl font-bold text-white tracking-tighter font-mono">
              {formatCurrency(coin.current_price)}
            </div>
            <div className={`flex items-center gap-1 text-sm font-semibold font-mono mt-2 ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
              <span>{isPositive ? '▲' : '▼'}</span>
              <span>{Math.abs(coin.price_change_percentage_24h ?? 0).toFixed(2)}%</span>
              <span className="text-slate-500 font-normal ml-1">24h</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-[#1a1a1a] pt-4">
          <div className="flex items-center gap-1 bg-[#111] p-1 rounded-lg border border-[#1a1a1a]">
            {(['24h', '7d', '30d', '90d', '1y', 'max'] as ChartTimeframe[]).map(tf => (
              <button
                key={tf}
                onClick={() => { setSelectedChartRange(tf); setHoverIndex(null); }}
                className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${
                  selectedChartRange === tf
                    ? 'bg-white text-black shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-[#222]'
                }`}
              >
                {tf === '30d' ? '1M' : tf === '90d' ? '3M' : tf === 'max' ? 'MAX' : tf.toUpperCase()}
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <MoveHorizontal className="w-4 h-4" />
            <span>Drag across the chart to measure a move</span>
          </div>
        </div>

        <div 
          ref={chartRef}
          className="relative w-full h-[350px] sm:h-[450px] mt-4 mb-8 select-none cursor-crosshair group border-b border-[#1a1a1a]"
          onMouseMove={handleChartMouseMove}
          onMouseLeave={() => setHoverIndex(null)}
        >
          <div className="absolute right-0 top-0 bottom-0 flex flex-col justify-between text-[10px] font-mono text-slate-500 py-6 pointer-events-none">
            <span>{formatCurrency(maxChartPrice)}</span>
            <span>{formatCurrency(midChartPrice)}</span>
            <span>{formatCurrency(minChartPrice)}</span>
          </div>

          {hoverIndex !== null && (
            <div 
              className="absolute z-20 px-3 py-2 rounded-lg bg-[#0f172a] border border-[#2a2a2a] shadow-xl text-xs font-mono pointer-events-none transform -translate-x-1/2"
              style={{ left: `${(hoverIndex / (chartPoints.length - 1)) * 100}%`, top: '10px' }}
            >
              <div className="text-slate-400 mb-0.5">{selectedChartRange === '24h' ? `${24 - hoverIndex}:00` : `Point ${hoverIndex + 1}`}</div>
              <div className={`font-bold text-sm ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                {formatCurrency(chartPoints[hoverIndex])}
              </div>
            </div>
          )}

          <svg className="w-full h-full overflow-visible pr-16" viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none">
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={isPositive ? '#10b981' : '#f43f5e'} stopOpacity="0.2" />
                <stop offset="100%" stopColor={isPositive ? '#10b981' : '#f43f5e'} stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {[0, 0.5, 1].map(ratio => (
              <line key={ratio} x1="0" y1={paddingY + plotHeight * ratio} x2={chartWidth} y2={paddingY + plotHeight * ratio} stroke="rgba(255, 255, 255, 0.04)" strokeWidth="1" strokeDasharray="4 4" />
            ))}

            {(() => {
              const range = maxChartPrice - minChartPrice || 1;
              const points = chartPoints.map((p, i) => {
                const x = (i / (chartPoints.length - 1)) * chartWidth;
                const y = (chartHeight - paddingY) - ((p - minChartPrice) / range) * plotHeight;
                return { x, y, price: p };
              });

              const polyPoints = `0,${chartHeight} ${points.map(p => `${p.x},${p.y}`).join(' ')} ${chartWidth},${chartHeight}`;
              const linePoints = points.map(p => `${p.x},${p.y}`).join(' ');

              return (
                <>
                  <polygon points={polyPoints} fill="url(#chartGradient)" />
                  <polyline fill="none" stroke={isPositive ? '#10b981' : '#f43f5e'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={linePoints} />
                  {hoverIndex !== null && (
                    <>
                      <line x1={points[hoverIndex].x} y1={0} x2={points[hoverIndex].x} y2={chartHeight} stroke="rgba(255, 255, 255, 0.1)" strokeWidth="1" />
                      <circle cx={points[hoverIndex].x} cy={points[hoverIndex].y} r="4" fill={isPositive ? '#10b981' : '#f43f5e'} stroke="#0a0a0a" strokeWidth="2" />
                    </>
                  )}
                </>
              );
            })()}
          </svg>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-[#1a1a1a] border-y border-[#1a1a1a]">
          <div className="py-6 pr-6">
            <div className="text-[10px] font-bold tracking-wider text-slate-500 uppercase mb-1">Market Cap</div>
            <div className="text-xl font-bold text-white font-mono">{formatCompactNumber(coin.market_cap)}</div>
          </div>
          <div className="py-6 px-6">
            <div className="text-[10px] font-bold tracking-wider text-slate-500 uppercase mb-1">24H Volume</div>
            <div className="text-xl font-bold text-white font-mono">{formatCompactNumber(coin.total_volume)}</div>
          </div>
          <div className="py-6 px-6">
            <div className="text-[10px] font-bold tracking-wider text-slate-500 uppercase mb-1">Fully Diluted Value</div>
            <div className="text-xl font-bold text-white font-mono">{formatCompactNumber(coin.fully_diluted_valuation || coin.market_cap)}</div>
          </div>
          <div className="py-6 pl-6">
            <div className="text-[10px] font-bold tracking-wider text-slate-500 uppercase mb-1">24H Range</div>
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mt-2 mb-1">
              <span>{formatCurrency(coin.low_24h)}</span>
              <span>{formatCurrency(coin.high_24h)}</span>
            </div>
            <div className="w-full h-[3px] bg-[#222] rounded-full relative">
              <div className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-rose-500 to-emerald-500 rounded-full" style={{ width: '100%' }} />
              <div className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white rounded-full border border-[#0a0a0a]" style={{ left: `calc(${Math.min(100, Math.max(0, ((coin.current_price - coin.low_24h) / (coin.high_24h - coin.low_24h || 1)) * 100))}% - 5px)` }} />
            </div>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="space-y-8">
            <div className="grid grid-cols-2 gap-x-4 gap-y-6 pb-6 border-b border-[#1a1a1a]">
              <div>
                <div className="text-[10px] font-bold tracking-wider text-slate-500 uppercase mb-1">Launched</div>
                <div className="text-sm font-medium text-slate-200">{extraDetails.genesis_date || '-'}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold tracking-wider text-slate-500 uppercase mb-1">Algorithm</div>
                <div className="text-sm font-medium text-slate-200">{extraDetails.algorithm || '-'}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold tracking-wider text-slate-500 uppercase mb-1">Symbol</div>
                <div className="text-sm font-medium text-slate-200">{coin.symbol.toUpperCase()}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold tracking-wider text-slate-500 uppercase mb-1">Reading Time</div>
                <div className="text-sm font-medium text-slate-200">1 min</div>
              </div>
            </div>

            <div className="pb-6 border-b border-[#1a1a1a]">
              <div className="text-[10px] font-bold tracking-wider text-slate-500 uppercase mb-3">Community Sentiment</div>
              <div className="flex w-full h-2 rounded-full overflow-hidden mb-2">
                <div className="bg-emerald-500 h-full" style={{ width: `${bullishPercent}%` }} />
                <div className="bg-rose-500 h-full" style={{ width: `${bearishPercent}%` }} />
              </div>
              <div className="flex justify-between text-[11px] font-medium">
                <span className="text-emerald-400">{Math.round(bullishPercent)}% bull</span>
                <span className="text-rose-400">{Math.round(bearishPercent)}% bear</span>
              </div>
            </div>

            <div className="flex flex-col border-t border-[#1a1a1a]">
              {coin.homepage && (
                <a href={coin.homepage} target="_blank" rel="noreferrer" className="flex items-center gap-3 py-3 border-b border-[#1a1a1a] text-sm text-slate-300 hover:text-white transition-colors">
                  <Globe className="w-4 h-4 text-slate-500" /> Website
                </a>
              )}
              {extraDetails.whitepaper && (
                <a href={extraDetails.whitepaper} target="_blank" rel="noreferrer" className="flex items-center gap-3 py-3 border-b border-[#1a1a1a] text-sm text-slate-300 hover:text-white transition-colors">
                  <FileText className="w-4 h-4 text-slate-500" /> Whitepaper
                </a>
              )}
              {coin.blockchain_site && (
                <a href={coin.blockchain_site} target="_blank" rel="noreferrer" className="flex items-center gap-3 py-3 border-b border-[#1a1a1a] text-sm text-slate-300 hover:text-white transition-colors">
                  <Compass className="w-4 h-4 text-slate-500" /> Explorer
                </a>
              )}
              {coin.github && (
                <a href={coin.github} target="_blank" rel="noreferrer" className="flex items-center gap-3 py-3 border-b border-[#1a1a1a] text-sm text-slate-300 hover:text-white transition-colors">
                  <Github className="w-4 h-4 text-slate-500" /> GitHub
                </a>
              )}
              {coin.twitter_screen_name && (
                <a href={`https://twitter.com/${coin.twitter_screen_name}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 py-3 border-b border-[#1a1a1a] text-sm text-slate-300 hover:text-white transition-colors">
                  <Twitter className="w-4 h-4 text-slate-500" /> X / Twitter
                </a>
              )}
              {extraDetails.subreddit && (
                <a href={extraDetails.subreddit} target="_blank" rel="noreferrer" className="flex items-center gap-3 py-3 border-b border-[#1a1a1a] text-sm text-slate-300 hover:text-white transition-colors">
                  <MessageCircle className="w-4 h-4 text-slate-500" /> Reddit
                </a>
              )}
              {extraDetails.telegram && (
                <a href={extraDetails.telegram} target="_blank" rel="noreferrer" className="flex items-center gap-3 py-3 border-b border-[#1a1a1a] text-sm text-slate-300 hover:text-white transition-colors">
                  <Send className="w-4 h-4 text-slate-500" /> Telegram
                </a>
              )}
            </div>

            {extraDetails.tags && extraDetails.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {(showAllTags ? extraDetails.tags : extraDetails.tags.slice(0, 3)).map((tag, idx) => (
                  <span key={idx} className="px-3 py-1.5 rounded-md bg-[#111] border border-[#222] text-[11px] font-medium text-slate-300">
                    {tag}
                  </span>
                ))}
                {!showAllTags && extraDetails.tags.length > 3 && (
                  <button 
                    onClick={() => setShowAllTags(true)} 
                    className="px-2 py-1.5 rounded-md bg-[#111] border border-[#222] text-[11px] font-medium text-slate-300 hover:border-slate-500 transition-colors"
                  >
                    +{extraDetails.tags.length - 3}
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-6">
               <span className="text-[10px] font-bold tracking-wider text-emerald-500 uppercase">04 Story</span>
            </div>
            <h2 className="text-3xl font-bold text-white mb-8">About {coin.name}</h2>
            
            <p className="text-[17px] leading-relaxed text-slate-200 mb-6 first-letter:text-6xl first-letter:font-bold first-letter:float-left first-letter:mr-3 first-letter:mt-1 first-letter:text-white">
              {extraDetails.description || `Loading real ${coin.name} details from CoinGecko... If this persists, the API might be rate-limited.`}
            </p>
            
            <p className="text-[15px] leading-relaxed text-slate-400">
              Users can purchase, trade, and utilize {coin.name} at thousands of merchants and major exchanges around the globe. The asset is supported by a robust community of developers and enthusiasts who continuously contribute to its growth and security.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
