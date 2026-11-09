import React from 'react';
import { ArrowLeft, Cpu, Database, ShieldAlert, Sparkles, Activity } from 'lucide-react';

interface AboutPageProps {
  onBack: () => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onBack }) => {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-8 text-white bg-black min-h-[calc(100vh-110px)] animate-in fade-in duration-150">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#111111] hover:bg-[#1a1a1a] text-neutral-300 hover:text-white border border-[#222222] transition-all text-xs font-semibold mb-8 active:scale-95"
      >
        <ArrowLeft className="w-4 h-4 text-emerald-400" />
        <span>Back to Heatmap</span>
      </button>

      {/* Hero Header */}
      <div className="mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#111111] border border-[#222222] text-xs font-mono text-emerald-400 mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Next-Generation Visual Analytics</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-4">
          About Orbix
        </h1>
        <p className="text-sm sm:text-base text-neutral-400 leading-relaxed max-w-2xl">
          Orbix is a real-time Top 100 cryptocurrency visualizer engineered with free-floating physics, mood-driven kinetics, and AI sentiment intelligence.
        </p>
      </div>

      {/* 3 Core Sections */}
      <div className="space-y-10">
        {/* Section 1: What is Orbix? */}
        <section className="p-6 rounded-2xl bg-[#090909] border border-[#1a1a1a]">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-[#141414] border border-[#262626] text-emerald-400">
              <Activity className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-white">1. What is Orbix?</h2>
          </div>
          <p className="text-sm text-neutral-300 leading-relaxed mb-4">
            Traditional market tables can be overwhelming. Orbix reimagines crypto market monitoring through a living, breathing bubble canvas. Instead of rigid columns, each asset is represented by an organic bubble whose size reflects its market capitalization and whose velocity mirrors its market momentum.
          </p>
          <p className="text-sm text-neutral-400 leading-relaxed">
            Gainers float upwards, decliners sink downwards, and momentum outliers pulsate in real time. Backed by AI sentiment scoring, Orbix allows traders and enthusiasts to instantly spot market trends at a single glance.
          </p>
        </section>

        {/* Section 2: How it Works? */}
        <section className="p-6 rounded-2xl bg-[#090909] border border-[#1a1a1a]">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-[#141414] border border-[#262626] text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-white">2. How It Works?</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
            <div className="p-4 rounded-xl bg-black border border-[#1f1f1f]">
              <div className="text-xs font-mono font-bold text-emerald-400 mb-1">DATA STREAM</div>
              <h3 className="text-sm font-semibold text-white mb-2">CoinGecko Top 100</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Live pricing, 24h trading volume, circulating supply, and historical sparklines updated continuously with smart 60-second client caching.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-black border border-[#1f1f1f]">
              <div className="text-xs font-mono font-bold text-sky-400 mb-1">INTELLIGENCE</div>
              <h3 className="text-sm font-semibold text-white mb-2">Gemini AI Model</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Quantitative analysis evaluating multi-timeframe price action, volume velocity, and volatility ratios to generate automated AI Scores (1–100).
              </p>
            </div>

            <div className="p-4 rounded-xl bg-black border border-[#1f1f1f]">
              <div className="text-xs font-mono font-bold text-purple-400 mb-1">INFRASTRUCTURE</div>
              <h3 className="text-sm font-semibold text-white mb-2">Supabase & Edge</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Persistent user watchlists, synchronized state, and high-performance edge distribution ensuring sub-100ms load times worldwide.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3: Disclaimer */}
        <section className="p-6 rounded-2xl bg-[#090909] border border-[#1a1a1a]">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-[#141414] border border-[#262626] text-amber-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-white">3. Disclaimer</h2>
          </div>
          <p className="text-xs text-neutral-400 leading-relaxed">
            The information, metrics, visualizations, and AI Scores provided on Orbix are for informational, research, and educational purposes only. None of the content on this platform constitutes financial, investment, legal, or trading advice. Cryptocurrencies are highly volatile digital assets. Always conduct your own independent due diligence and consult a qualified financial advisor before making any financial decisions.
          </p>
        </section>
      </div>
    </div>
  );
};
