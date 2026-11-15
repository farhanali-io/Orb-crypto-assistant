import React, { useState } from 'react';
import { CryptoCoin } from '../types/crypto';
import { formatCurrency, formatCompactNumber } from '../services/cryptoApi';
import { Star, Share2, Globe, FileText, Search, Bird, MessageCircle } from 'lucide-react';

interface Props {
  coin: CryptoCoin;
  onBack: () => void;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
}

const TF = ['24H','7D','1M','3M','1Y','MAX'] as const;

export const CoinDetail: React.FC<Props> = ({ coin, onBack, favorites, onToggleFavorite }) => {
  const [tf, setTf] = useState<typeof TF[number]>('24H');
  const isFav = favorites.includes(coin.id);
  const change = coin.price_change_percentage_24h || 0.35;
  const isUp = change >= 0;

  return (
    <div className="w-full min-h-screen bg-[#080808] text-white flex flex-col pb-[110px]">
      {/* Top Nav */}
      <div className="sticky top-0 z-20 flex items-center justify-between px-4 h-[56px] bg-[#080808]/90 backdrop-blur-xl border-b border-[#141414]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#111] border border-[#222] flex items-center justify-center"><div className="w-3 h-3 rounded-full bg-[#00ff88] shadow-[0_0_10px_#00ff88]"></div></div>
          <span className="font-bold tracking-tight">Orbix</span>
          <span className="text-[11px] text-neutral-500 ml-3 hidden md:block">Cryptocurrencies › {coin.name} Price</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="w-8 h-8 rounded-full bg-[#161616] border border-[#222] flex items-center justify-center"><Share2 className="w-4 h-4 text-neutral-400" /></button>
          <button onClick={()=>onToggleFavorite(coin.id)} className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${isFav ? 'bg-[#ffcc00] border-[#ffcc00] text-black' : 'bg-[#161616] border-[#222] text-neutral-400'}`}><Star className={`w-4 h-4 ${isFav?'fill-black':''}`} /></button>
        </div>
      </div>

      {/* Breadcrumb mobile */}
      <div className="md:hidden px-4 py-3 text-[11px] text-neutral-500 font-mono">Cryptocurrencies <span className="mx-1">›</span> <span className="text-neutral-300">{coin.symbol.toUpperCase()} Price</span></div>

      {/* Header Coin */}
      <div className="px-4 md:px-[3%] pt-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={coin.image} alt={coin.name} className="w-10 h-10 rounded-full border border-[#222] bg-[#141414]" />
          <div>
            <div className="flex items-center gap-2"><h1 className="text-[20px] md:text-[26px] font-bold tracking-tight">{coin.name}</h1><span className="text-[14px] md:text-[16px] font-bold text-[#5a6370]">Price</span></div>
            <div className="flex items-center gap-2 mt-1"><span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#161616] border border-[#222] text-[#888]">{coin.symbol.toUpperCase()}</span><span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#161616] border border-[#222] text-[#888]">RANK #{coin.market_cap_rank || 4}</span></div>
          </div>
        </div>
      </div>

      {/* Price */}
      <div className="px-4 md:px-[3%] mt-5">
        <div className="text-[36px] md:text-[48px] font-bold tracking-tight leading-none">{formatCurrency(coin.current_price)}</div>
        <div className={`mt-2 text-[12px] font-mono font-bold flex items-center gap-1 ${isUp ? 'text-[#00ff88]' : 'text-[#ff4d4d]'}`}>{isUp ? '▲' : '▼'} {Math.abs(change).toFixed(2)}% <span className="text-neutral-600 font-normal ml-1">24h</span></div>
      </div>

      {/* Timeframe Pills */}
      <div className="px-4 md:px-[3%] mt-6">
        <div className="inline-flex bg-[#111113] border border-[#1a1a1a] rounded-full p-1 gap-1">
          {TF.map(t=>(
            <button key={t} onClick={()=>setTf(t)} className={`px-3.5 py-1.5 rounded-full text-[11px] font-bold transition-all ${tf===t ? 'bg-white text-black' : 'text-[#777] hover:text-white'}`}>{t}</button>
          ))}
        </div>
        <div className="mt-3 text-[11px] text-[#555] font-mono flex items-center gap-1.5"><span>↔</span> Drag across the chart to measure a move</div>
      </div>

      {/* Chart */}
      <div className="w-full mt-4 px-0 md:px-[3%]">
        <div className="relative w-full h-[300px] md:h-[420px] bg-[#080808] border-y md:border border-[#141414] md:rounded-2xl overflow-hidden">
          <svg viewBox="0 0 400 200" className="absolute inset-0 w-full h-full">
            <defs>
              <linearGradient id="g" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#00ff88" stopOpacity="0.25"/><stop offset="100%" stopColor="#00ff88" stopOpacity="0"/></linearGradient>
            </defs>
            <path d="M0 80 Q20 20 40 50 T80 30 T120 60 T160 100 T200 120 T240 90 T280 110 T320 70 T400 20" fill="none" stroke="#00ff88" strokeWidth="1.2" />
            <path d="M0 80 Q20 20 40 50 T80 30 T120 60 T160 100 T200 120 T240 90 T280 110 T320 70 T400 20 L400 200 L0 200 Z" fill="url(#g)" />
          </svg>
          <div className="absolute right-3 top-10 text-[10px] font-mono text-[#444]">$601.05B</div>
          <div className="absolute right-3 top-1/2 text-[10px] font-mono text-[#444]">$583.98B</div>
          <div className="absolute right-3 bottom-10 text-[10px] font-mono text-[#444]">$566.46</div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[#141414] border-y border-[#141414] mt-0 md:mt-6 md:rounded-2xl md:overflow-hidden md:mx-[3%]">
        {[
          ['MARKET CAP', formatCompactNumber(coin.market_cap)],
          ['24H VOLUME', formatCompactNumber(coin.total_volume)],
          ['FULLY DILUTED VALUE', formatCompactNumber(coin.market_cap)],
          ['24H RANGE', 'RANGE BAR'],
          ['LAUNCHED', '2017-07-08'],
          ['ALGORITHM', '-'],
          ['SYMBOL', coin.symbol.toUpperCase()],
          ['READING TIME', '1 min'],
        ].map(([k,v],i)=>(
          <div key={i} className="bg-[#080808] px-4 py-4">
            <div className="text-[9px] font-bold tracking-widest text-[#555] uppercase">{k}</div>
            {v==='RANGE BAR' ? (
              <div className="mt-2">
                <div className="flex justify-between text-[10px] font-mono text-[#666]"><span>$566.46</span><span>$598.82</span></div>
                <div className="mt-1 h-1 rounded-full bg-gradient-to-r from-[#ff4d4d] to-[#00ff88] relative"><div className="absolute right-6 -top-1 w-2.5 h-2.5 rounded-full bg-white border-2 border-black"></div></div>
              </div>
            ) : <div className="mt-1 text-[14px] font-bold font-mono text-white">{v}</div>}
          </div>
        ))}
      </div>

      {/* Sentiment */}
      <div className="px-4 md:px-[3%] mt-6">
        <div className="text-[10px] font-bold tracking-widest text-[#555] uppercase">Community Sentiment</div>
        <div className="mt-2 h-2 rounded-full flex overflow-hidden bg-[#141414]">
          <div className="h-full bg-[#00ff88]" style={{width:'51%'}}></div>
          <div className="h-full bg-[#ff2d55]" style={{width:'49%'}}></div>
        </div>
        <div className="mt-1 flex justify-between text-[11px] font-mono"><span className="text-[#00ff88]">51% bull</span><span className="text-[#ff2d55]">49% bear</span></div>
      </div>

      {/* Links */}
      <div className="px-4 md:px-[3%] mt-8 flex flex-col gap-4 border-t border-[#111] pt-6">
        {[
          [Globe,'Website'],
          [FileText,'Whitepaper'],
          [Search,'Explorer'],
          [Bird,'X / Twitter'],
          [MessageCircle,'Reddit'],
        ].map(([Icon,label],i)=>(
          <div key={i} className="flex items-center gap-3 text-[13px] text-[#aaa] hover:text-white cursor-pointer">
            <Icon className="w-4 h-4 text-[#555]" /> {label as string}
          </div>
        ))}
      </div>

      {/* About */}
      <div className="px-4 md:px-[3%] mt-10 border-t border-[#111] pt-8">
        <h2 className="text-[22px] font-bold tracking-tight">About {coin.name}</h2>
        <p className="mt-4 text-[14px] leading-[1.7] text-[#aaa]">
          <span className="float-left text-[48px] leading-[0.8] font-bold text-white mr-2 mt-1">{coin.name[0]}</span>
          {coin.name} is the native utility token of the BNB Chain ecosystem, acting as a multi-chain asset that powers decentralized applications and facilitates value exchange across its network. It serves as the primary asset for paying transaction gas and smart contract deployment fees while providing users with tiered fee discounts on the Binance exchange.
          <br/><br/>
          The project's main value proposition lies in its unified multi-chain architecture, which integrates a smart contract platform, a Layer 2 scaling solution, and a decentralized data storage network into a cohesive settlement and data availability layer. The network operates on a Proof of Staked Authority consensus mechanism, utilizing a group of 21 active validators known as the Cabinet to verify transactions and produce blocks every 3 seconds.
        </p>
      </div>
    </div>
  );
};
