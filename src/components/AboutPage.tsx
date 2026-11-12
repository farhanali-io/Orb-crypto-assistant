import React, { useState } from 'react';
import { ArrowLeft, ArrowUpRight, Circle, Minus, ChevronDown } from 'lucide-react';

interface AboutPageProps {
  onBack: () => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onBack }) => {
  const [openSection, setOpenSection] = useState<number>(1);

  const dataSources = [
    {
      id: 1,
      title: 'Prices & Market Caps',
      content: 'Prices, market caps, volume and price changes come from CoinGecko.',
    },
    {
      id: 2,
      title: 'Bubble Visualization Physics',
      content: 'Bubble sizes are mathematically scaled using a logarithmic algorithm based on real-time market capitalization. The layout uses a live physics engine (D3-force) so the bubbles organically float and react to your screen size.',
    },
    {
      id: 3,
      title: 'Live Refresh & AI',
      content: 'The market dashboard automatically polls the CoinGecko API every 60 seconds. You can also click the "Ask Orb" button anywhere on the site to get instant AI-driven insights on the live data.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-slate-300 font-sans pb-24">
      {/* Background Grid Pattern */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.03]" 
        style={{ 
          backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', 
          backgroundSize: '40px 40px' 
        }} 
      />

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        
        {/* Back Button */}
        <div className="pt-8 pb-12">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#111] hover:bg-[#1a1a1a] text-slate-400 hover:text-white border border-[#222] transition-all text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to App</span>
          </button>
        </div>

        {/* Hero Section */}
        <div className="mb-24 max-w-4xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#111] border border-[#222] mb-8">
            <Circle className="w-2.5 h-2.5 fill-emerald-500 text-emerald-500" />
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-slate-400">
              About Orbix
            </span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white uppercase tracking-tight leading-[1.1] mb-8">
            About Orbix - Live Crypto <br className="hidden md:block" /> Bubble Chart
          </h1>
          
          <p className="text-base sm:text-lg text-slate-400 leading-relaxed max-w-2xl mb-8">
            Orbix turns the crypto market into a picture. Every coin is a bubble. Large bubbles are the heavyweights, small ones are the long tail, and the color shows which way each coin is moving. You can read the whole market in a few seconds instead of scrolling through a table of 1,000 rows.
          </p>

          <button 
            onClick={onBack}
            className="inline-flex items-center gap-2 text-sm font-medium text-white hover:text-emerald-400 transition-colors border-b border-white/20 hover:border-emerald-400 pb-1"
          >
            Open the Bubble Chart
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-gradient-to-r from-[#222] via-[#222] to-transparent mb-24" />

        {/* Why We Built Section (Two Columns) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-24 mb-24">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white uppercase tracking-wider mb-6">
              Why We Built Orbix
            </h2>
            <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
              Most crypto trackers are built around tables. Tables are precise, but they hide the shape of the market.
            </p>
          </div>

          <div className="space-y-6 text-sm sm:text-base text-slate-400 leading-relaxed">
            <p>
              It is hard to tell from rows of numbers whether Bitcoin is leading, whether altcoins are moving together, or whether one sector is quietly pulling ahead.
            </p>
            <p>
              We wanted a crypto market visualization that answers those questions at a glance, then lets you click into the details without opening five other tabs.
            </p>
          </div>
        </div>

        {/* Images Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-24">
          <div className="relative group overflow-hidden rounded-xl border border-[#222] bg-[#111]">
            <img 
              src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=1200" 
              alt="Team working on code" 
              className="w-full h-[300px] sm:h-[450px] object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700 grayscale group-hover:grayscale-0"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent opacity-60" />
          </div>

          <div className="relative group overflow-hidden rounded-xl border border-[#222] bg-[#111]">
            <img 
              src="https://images.unsplash.com/photo-1621504450181-5d356f61d307?auto=format&fit=crop&q=80&w=1200" 
              alt="Crypto trading charts on screens" 
              className="w-full h-[300px] sm:h-[450px] object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700 grayscale group-hover:grayscale-0"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent opacity-60" />
          </div>
        </div>

        {/* ========================================================= */}
        {/* DATA SECTION (Accordion) */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-24">
          {/* Left Column: Header */}
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white uppercase tracking-tight mb-6 leading-tight">
              Where Our Data <br className="hidden md:block" /> Comes From.
            </h2>
            <p className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
              Every number on Orbix comes from an established market data provider, refreshed while you watch.
            </p>
          </div>

          {/* Right Column: Accordion */}
          <div className="flex flex-col border-t border-[#222]">
            {dataSources.map((item) => {
              const isOpen = openSection === item.id;
              return (
                <div key={item.id} className="border-b border-[#222] py-6">
                  <button
                    onClick={() => setOpenSection(isOpen ? 0 : item.id)}
                    className="w-full flex items-center justify-between gap-4 text-left group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-7 h-7 rounded-full bg-white text-black flex items-center justify-center font-bold text-xs shrink-0">
                        {item.id}
                      </div>
                      <span className="text-base sm:text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">
                        {item.title}
                      </span>
                    </div>
                    <div className="text-slate-500 group-hover:text-white transition-colors">
                      {isOpen ? <Minus className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </button>
                  
                  {/* Animated Content */}
                  <div 
                    className={`grid transition-all duration-300 ease-in-out ${
                      isOpen ? 'grid-rows-[1fr] opacity-100 mt-4' : 'grid-rows-[0fr] opacity-0 mt-0'
                    }`}
                  >
                    <div className="overflow-hidden">
                      <p className="text-sm text-slate-400 leading-relaxed pl-11">
                        {item.content}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};
