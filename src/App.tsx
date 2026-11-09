/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { CryptoCoin, TimeFrame, ColorTheme } from './types/crypto';
import { getFullTop100Coins } from './data/top100Coins';
import {
  fetchTop100Coins,
  getFavorites,
  toggleFavorite,
} from './services/cryptoApi';
import { Header } from './components/Header';
import { BubbleCanvas } from './components/BubbleCanvas';
import { MarketTable } from './components/MarketTable';
import { CoinDetailPage } from './components/CoinDetailPage';
import { AboutPage } from './components/AboutPage';
import { ContactPage } from './components/ContactPage';
import { SettingsModal } from './components/SettingsModal';
import { MobileBottomBar, MobileTab } from './components/MobileBottomBar';
import { DustBackground } from './components/DustBackground';
import { CoinRightPanel } from './components/CoinRightPanel';
import { TimeFilterBar } from './components/TimeFilterBar';
import { AskOrbChat } from './components/AskOrbChat';

type CurrentRoute = 'heatmap' | 'about' | 'contact' | 'coin';

export default function App() {
  // State
  const [coins, setCoins] = useState<CryptoCoin[]>(() => getFullTop100Coins());
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('day');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCoin, setSelectedCoin] = useState<CryptoCoin | null>(null);
  const [panelCoin, setPanelCoin] = useState<CryptoCoin | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [currentRoute, setCurrentRoute] = useState<CurrentRoute>('heatmap');
  const [mobileTab, setMobileTab] = useState<MobileTab>('bubbles');
  const [favorites, setFavorites] = useState<string[]>(() => getFavorites());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAskOrbOpen, setIsAskOrbOpen] = useState(false);
  const [isMobile, setIsMobile] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );
  const [theme, setTheme] = useState<ColorTheme>(() => {
    try {
      const stored = localStorage.getItem('orbix_theme');
      return (stored === 'neon' ? 'neon' : 'classic') as ColorTheme;
    } catch {
      return 'classic';
    }
  });

  // Track mobile viewport
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Persist theme
  const handleSetTheme = useCallback((newTheme: ColorTheme) => {
    setTheme(newTheme);
    try {
      localStorage.setItem('orbix_theme', newTheme);
    } catch {}
  }, []);

  // Sync hash routing for #/, #/about, #/contact, #/coin/:id
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash || '#/';

      if (hash === '#/about') {
        setCurrentRoute('about');
        setSelectedCoin(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (hash === '#/contact') {
        setCurrentRoute('contact');
        setSelectedCoin(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (hash.startsWith('#/coin/')) {
        const coinId = hash.replace('#/coin/', '').trim();
        const found = coins.find(
          c => c.id === coinId || c.symbol.toLowerCase() === coinId.toLowerCase()
        );
        if (found) {
          setSelectedCoin(found);
          setCurrentRoute('coin');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      } else {
        setCurrentRoute('heatmap');
        setSelectedCoin(null);
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [coins]);

  // Open Right Slide-in Panel on Bubble / Row click
  const handleOpenRightPanel = useCallback((coin: CryptoCoin) => {
    setPanelCoin(coin);
    setIsPanelOpen(true);
  }, []);

  // Navigate to Full Coin Page
  const handleOpenFullCoinPage = useCallback((coin: CryptoCoin) => {
    setSelectedCoin(coin);
    setIsPanelOpen(false);
    setCurrentRoute('coin');
    window.location.hash = `#/coin/${coin.id}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Return to Heatmap Main Page
  const handleBackToHeatmap = useCallback(() => {
    setSelectedCoin(null);
    setIsPanelOpen(false);
    setCurrentRoute('heatmap');
    window.location.hash = '#/';
  }, []);

  // Toggle Favorite
  const handleToggleFavorite = useCallback((coinId: string) => {
    const updated = toggleFavorite(coinId);
    setFavorites(updated);
  }, []);

  // Fetch live CoinGecko Top 100 with 60-second caching
  const loadData = useCallback(async (force = false) => {
    try {
      const res = await fetchTop100Coins(force);
      if (res.coins && res.coins.length > 0) {
        setCoins(res.coins);
        // If a coin is currently selected, update its reference
        setSelectedCoin(prev => {
          if (!prev) return null;
          return res.coins.find(c => c.id === prev.id) || prev;
        });
      }
    } catch (e) {
      console.error('Failed to update crypto prices', e);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadData(false);
  }, [loadData]);

  // 60-second polling interval
  useEffect(() => {
    const interval = setInterval(() => {
      loadData(false);
    }, 60000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Filtered coins for table
  const filteredCoins = useMemo(() => {
    if (!searchQuery.trim()) return coins;
    const q = searchQuery.toLowerCase().trim();
    return coins.filter(
      c => c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q)
    );
  }, [coins, searchQuery]);

  return (
    <div className="relative min-h-screen bg-[#000000] text-white flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-300 pb-20 md:pb-5">
      {/* 0. Full-screen Pure Black Background with Faint Dust Dots (Opacity 0.05) */}
      <DustBackground />

      {/* 1. Header (Orbix styling with 52px top bar: Orbix logo + Search + About Us + Contact Us + Settings) */}
      <div className="relative z-20">
        <Header
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onHomeClick={handleBackToHeatmap}
          onNavigate={route => {
            window.location.hash = route;
          }}
        />
      </div>

      {/* Main Content Area: Pure Black #000000, edge-to-edge */}
      <main className="relative z-10 flex-1 w-full bg-transparent flex flex-col">
        {currentRoute === 'about' && (
          <AboutPage onBack={handleBackToHeatmap} />
        )}

        {currentRoute === 'contact' && (
          <ContactPage onBack={handleBackToHeatmap} />
        )}

        {currentRoute === 'coin' && selectedCoin && (
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6">
            <CoinDetailPage
              coin={selectedCoin}
              onBack={handleBackToHeatmap}
              favorites={favorites}
              onToggleFavorite={handleToggleFavorite}
            />
          </div>
        )}

        {currentRoute === 'heatmap' && (
          <div className="w-full bg-transparent flex flex-col">
            {/* Filters ONLY on Bubble / Heatmap page (Hour / Day / Week / Month / Year) */}
            <TimeFilterBar
              timeFrame={timeFrame}
              setTimeFrame={setTimeFrame}
            />

            {/* 2. Full screen Edge-to-Edge Pure Black Bubble Canvas: Desktop calc(100vh - 110px), Mobile calc(100vh - 175px) */}
            {/* On mobile: Show ONLY when 'bubbles' is active. On laptop/desktop: always show on top. */}
            <div
              className={`relative z-10 w-full overflow-hidden ${
                mobileTab === 'tables' ? 'hidden md:block' : 'block'
              }`}
            >
              <BubbleCanvas
                coins={coins}
                timeFrame={timeFrame}
                searchQuery={searchQuery}
                theme={theme}
                onSelectCoin={handleOpenRightPanel}
              />
            </div>

            {/* 3. Market Table: Desktop stays below bubbles. Mobile: Show ONLY when 'tables' is active. */}
            <div
              className={`relative z-10 w-full bg-[#000000]/80 backdrop-blur-md pt-6 pb-12 ${
                mobileTab === 'bubbles' ? 'hidden md:block' : 'block'
              }`}
            >
              <MarketTable
                coins={filteredCoins}
                onSelectCoin={handleOpenRightPanel}
                searchQuery={searchQuery}
              />
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-[#141414] bg-[#000000] py-6 px-4 text-center">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">Orbix</span>
            <span>·</span>
            <span>Top 100 Cryptocurrency Bubble Heatmap</span>
          </div>
          <div className="flex items-center gap-4 text-neutral-400">
            <button
              onClick={() => {
                window.location.hash = '#/about';
              }}
              className="hover:text-white transition-colors"
            >
              About
            </button>
            <span>·</span>
            <button
              onClick={() => {
                window.location.hash = '#/contact';
              }}
              className="hover:text-white transition-colors"
            >
              Contact
            </button>
            <span>·</span>
            <span>hello@orbix.live</span>
          </div>
        </div>
      </footer>

      {/* Floating Bottom Navigation Bar (Visible ONLY on mobile, width < 768px; hidden on desktop) */}
      <MobileBottomBar
        activeTab={mobileTab}
        onTabChange={setMobileTab}
        onNavigate={route => {
          window.location.hash = route;
        }}
        currentRoute={currentRoute}
        onOpenAskOrb={() => setIsAskOrbOpen(true)}
        isAskOrbOpen={isAskOrbOpen}
      />

      {/* Laptop Floating Button (width >= 768px): fixed, bottom 24px right 24px, pill shape black #111111 with green dot + text "Ask Orb" white bold */}
      {!isAskOrbOpen && (
        <button
          onClick={() => setIsAskOrbOpen(true)}
          className="hidden md:flex fixed bottom-6 right-6 z-50 items-center gap-2.5 px-4 py-2.5 rounded-full bg-[#111111] hover:bg-[#181818] border border-[#2A2A2A] hover:border-[#00FF88]/40 shadow-[0_8px_30px_rgba(0,0,0,0.85)] transition-all hover:scale-105 active:scale-95 cursor-pointer group"
          style={{
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.85), 0 0 16px rgba(0, 255, 136, 0.18)',
          }}
          title="Ask Orb - AI Assistant"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-[#00FF88] shadow-[0_0_8px_#00FF88] animate-pulse" />
          <span className="text-sm font-bold text-white tracking-wide group-hover:text-[#00FF88] transition-colors">
            Ask Orb
          </span>
        </button>
      )}

      {/* AI Assistant "Ask Orb": Laptop right panel (380px x 70vh) / Mobile bottom sheet (75vh) */}
      <AskOrbChat
        isOpen={isAskOrbOpen}
        onClose={() => setIsAskOrbOpen(false)}
        isMobile={isMobile}
        coins={coins}
      />

      {/* Slide-in Right Panel for Coin Overview (300ms transition) */}
      <CoinRightPanel
        coin={panelCoin}
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        onViewFullPage={handleOpenFullCoinPage}
        isFavorite={panelCoin ? favorites.includes(panelCoin.id) : false}
        onToggleFavorite={handleToggleFavorite}
      />

      {/* Settings Modal (Themes Only) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        theme={theme}
        setTheme={handleSetTheme}
      />
    </div>
  );
}
