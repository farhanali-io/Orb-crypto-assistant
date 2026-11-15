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

export const CoinDetail: React.FC<Props> = ({ coin, onBack, favorites, onToggleFavorite }) => {
  const [tf, setTf] = useState<typeof TFS[number]>('24H');
  const isFav = favorites.includes(coin.id);
  const change = coin.price_change_percentage_24h ?? -1.27;
  const isUp = change >= 0;

  // mock chart points down
  const chartPath = "M0 10 Q10 12 20 25 L30 18 L45 35 L65 42 L85 48 L105 52 L130 68 L155 72 L180 88 L205 92 L230 96 L260 108 L285 115 L310 120 L340 118 L380 112";
  const areaPath = chartPath + " L380 130 L0 130 Z";

  return (
    <div className="w-full min-h-screen bg-[#070708] text-white flex flex-col pb-[120px] selection:bg-white/10">
      {/* Top Orbix */}
      <div className="sticky top-0 z-30 flex items-center justify-center h-[64px] bg-[#070708]/80 backdrop-blur-2xl border-b border-[#121212]">
        <div className="absolute left-4 md:left-[3%] flex items-center gap-3">
          <button onClick={onBack} className="w-8 h-8 rounded-full bg-[#151515] border border-[#222] flex items-center justify-center text-[#888]">‹</button>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center"><div className="w-5 h-5 rounded-full border-[2.5px] border-black/80 relative"><div className="absolute inset-[3px] rounded-full border border-black/30"></div></div></div>
          <span className="text-[22px] font-semibold tracking-tight">Orbix</span>
        </div>
        <div className="absolute right-4 md:right-[3%] flex items-center gap-2">
          <button className="w-9 h-9 rounded-full bg-[#141414] border border-[#222] flex items-center justify-center"><Share2 className="w-4 h-4 text-[#999]" /></button>
          <button onClick={()=>onToggleFavorite(coin.id)} className={`w-9 h-9 rounded-full border flex items-center justify-center ${isFav ? 'bg-[#ffe600] border-[#ffe600] text-black' : 'bg-[#141414] border-[#222] text-[#666]'}`}><Star className={`w-4 h-4 ${isFav?'fill-black':''}`} /></button>
        </div>
      </div>

      {/* Centered Hero */}
      <div className="w-full flex flex-col items-center pt-6 md:pt-10 pb-2 px-4">
        <div className="relative">
          <div className="absolute inset-0 blur-[30px] bg-[#f7931a]/30 rounded-full scale-110"></div>
          <img src={coin.image} alt={coin.name} className="relative w-[88px] h-[88px] md:w-[112px] md:h-[112px] rounded-full shadow-[0_0_40px_rgba(247,147,26,0.4)]" />
        </div>
        <div className="mt-5 text-[14px] text-[#6a6570] font-medium tracking-wide">Bitcoin Price</div>
        <div className="mt-3 flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-[#1e1c20] border border-[#2a282c] text-[11px] font-bold tracking-widest text-[#9a959e]">{coin.symbol.toUpperCase()}</span>
          <span className="px-3 py-1 rounded-full bg-[#1e1c20] border border-[#2a282c] text-[11px] font-bold tracking-widest text-[#9a959e]">RANK #{coin.market_cap_rank || 1}</span>
        </div>
        <div className="mt-5 text-[44px] md:text-[56px] font-bold tracking-tighter leading-none">{formatCurrency(coin.current_price).replace('$',' $').trim() ? formatCurrency(coin.current_price) : '$64,931.00'}</div>
        <div className={`mt-2 flex items-center gap-1.5 text-[14px] font-bold font-mono ${isUp ? 'text-[#00e676]' : 'text-[#ff4d4d]'}`}>
          <span>{isUp ? '↑' : '↓'}</span><span>{Math.abs(change).toFixed(2)}% 24h</span><span className="ml-1 opacity-60">{isUp ? '↗' : '↘'}</span>
        </div>
      </div>

      {/* Timeframes */}
      <div className="w-full flex justify-center mt-7 px-4">
        <div className="inline-flex bg-[#121114] border border-[#1e1c20] rounded-full p-1.5 gap-1.5">
          {TFS.map(t=>(
            <button key={t} onClick={()=>setTf(t)} className={`min-w-[48px] md:min-w-[56px] h-8 rounded-full text-[12px] font-bold tracking-wide transition-all ${tf===t ? 'bg-white text-black shadow-[0_2px_10px_rgba(255,255,255,0.2)]' : 'bg-[#201e22] text-[#7a757e] hover:text-[#b5b0ba]'}`}>{t}</button>
          ))}
        </div>
      </div>

      {/* Chart Card - Premium */}
      <div className="w-full px-3 md:px-[4%] mt-6">
        <div className="relative w-full h-[300px] md:h-[420px] bg-[#101010] border border-[#1e1c20] rounded-[22px] overflow-hidden">
          <div className="absolute top-3 left-4 text-[12px] font-mono text-[#6b6670]">$66k</div>
          <div className="absolute bottom-8 left-4 text-[12px] font-mono text-[#6b6670]">$62k</div>
          {/* Grid */}
          <div className="absolute inset-0 opacity-[0.06]" style={{backgroundImage:`linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`, backgroundSize:'80px 40px'}}></div>
          <svg viewBox="0 0 400 130" className="absolute inset-0 w-full h-full p-4 pt-8 pb-10">
            <defs>
              <linearGradient id="g1" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#ff7a45" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#ff7a45" stopOpacity="0.02" />
              </linearGradient>
            </defs>
            <path d={areaPath} fill="url(#g1)" />
            <path d={chartPath} fill="none" stroke="#ff6b3d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M0 10 Q10 12 20 25" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="40" />
          </svg>
          <div className="absolute bottom-2.5 left-0 right-0 text-center text-[11px] font-mono text-[#6b6670] flex items-center justify-center gap-1.5"><span className="w-3 h-3 rounded-[3px] bg-[#2a282c] flex items-center justify-center">◧</span> drag to measure •</div>
        </div>
      </div>

      {/* Market Cards 2x2 */}
      <div className="w-full px-3 md:px-[4%] mt-4 grid grid-cols-2 gap-3">
        <div className="bg-[#121114] border border-[#1e1c20] rounded-[16px] px-4 py-4 text-center">
          <div className="text-[10px] tracking-[0.14em] font-bold text-[#8a858f] uppercase">Market Cap</div>
          <div className="mt-1 text-[24px] md:text-[28px] font-bold tracking-tight">{formatCompactNumber(coin.market_cap) || '$1.31T'}</div>
        </div>
        <div className="bg-[#121114] border border-[#1e1c20] rounded-[16px] px-4 py-4 text-center">
          <div className="text-[10px] tracking-[0.14em] font-bold text-[#8a858f] uppercase">24H Volume</div>
          <div className="mt-1 text-[24px] md:text-[28px] font-bold tracking-tight">{formatCompactNumber(coin.total_volume) || '$49.29B'}</div>
        </div>
        <div className="bg-[#121114] border border-[#1e1c20] rounded-[16px] px-4 py-4 text-center">
          <div className="text-[10px] tracking-[0.14em] font-bold text-[#8a858f] uppercase">Fully Diluted</div>
          <div className="mt-1 text-[24px] md:text-[28px] font-bold tracking-tight">{formatCompactNumber(coin.market_cap) || '$1.36T'}</div>
        </div>
        <div className="bg-[#121114] border border-[#1e1c20] rounded-[16px] px-4 py-4">
          <div className="text-[10px] tracking-[0.14em] font-bold text-[#8a858f] uppercase text-center">24H Range</div>
          <div className="mt-3 h-[8px] rounded-full bg-gradient-to-r from-[#ff5a5a] via-[#c5b06a] to-[#00e676] relative overflow-hidden"></div>
          <div className="mt-2 flex justify-between text-[11px] font-mono text-[#9a959e]"><span>$62,104</span><span>$66,042</span></div>
        </div>
      </div>

      {/* Sentiment */}
      <div className="w-full px-4 md:px-[4%] mt-7">
        <div className="text-[13px] font-semibold text-white">Community Sentiment</div>
        <div className="mt-3 h-8 rounded-full bg-[#1a181c] border border-[#252329] flex overflow-hidden p-1">
          <div className="h-full rounded-full bg-[#00d26a] flex items-center px-3 text-[11px] font-bold text-white" style={{width:'51%'}}>51% bull</div>
          <div className="flex-1 flex items-center justify-end px-3 text-[11px] font-bold text-[#ffb3b3]">49% bear</div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {[
            ['Website','🌐'],
            ['Whitepaper','📄'],
            ['Explorer','🔍'],
            ['X Twitter','𝕏'],
            ['Reddit','👽'],
          ].map(([l,ico])=>(
            <button key={l} className="h-8 px-3.5 rounded-full bg-[#1e1c20] border border-[#2a282c] text-[11px] font-bold text-[#b5b0ba] flex items-center gap-1.5"><span>{ico}</span>{l}</button>
          ))}
        </div>
      </div>

      {/* About */}
      <div className="w-full px-4 md:px-[4%] mt-8 pt-7 border-t border-[#141214]">
        <h2 className="text-[22px] font-bold tracking-tight">About {coin.name}</h2>
        <div className="mt-4 flex gap-3">
          <span className="text-[56px] leading-[0.85] font-bold text-white">{coin.name[0]}</span>
          <p className="text-[13.5px] leading-[1.65] text-[#b5b0ba]">
            Bitcoin is the first decentralized cryptocurrency, introduced in 2009. It operates peer-to-peer without central authority, secured by proof-of-work. Limited to 21M supply, it's designed as digital gold for store-of-value and global payments. Often referred to as digital gold, Bitcoin is capped at 21 million coins, making it a deflationary store of value used globally for transfer, investment, and hedging against inflation.
          </p>
        </div>
      </div>
    </div>
  );
};
