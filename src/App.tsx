/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect, useCallback, useMemo, useRef, useSyncExternalStore } from 'react';
import { CryptoCoin, TimeFrame, ColorTheme } from './types/crypto';
import { initInkBleed } from './modules/inkBleed';
import { getFullTop100Coins } from './data/top100Coins';
import { fetchTop100Coins, getFavorites, toggleFavorite } from './services/cryptoApi';
import { Header } from './components/Header';
import { BubbleCanvas } from './components/BubbleCanvas';
import { MarketTable } from './components/MarketTable';
import { CoinDetailPage } from './components/CoinDetailPage';
import { AboutPage } from './components/AboutPage';
import { ContactPage } from './components/ContactPage';
import { MobileBottomBar, MobileTab } from './components/MobileBottomBar';
import { DustBackground } from './components/DustBackground';
import { CoinRightPanel } from './components/CoinRightPanel';
import { TimeFilterBar } from './components/TimeFilterBar';
import { AskOrbChat } from './components/AskOrbChat';

type CurrentRoute = 'heatmap' | 'about' | 'contact' | 'coin';

const getThemeSnapshot = (): ColorTheme => {
  if (typeof document === 'undefined') return 'classic';
  return (document.documentElement.dataset.theme as ColorTheme) || 'classic';
};

export default function App() {
  const [coins, setCoins] = useState<CryptoCoin[]>(() => getFullTop100Coins());
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('day');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCoin, setSelectedCoin] = useState<CryptoCoin | null>(null);
  const [panelCoin, setPanelCoin] = useState<CryptoCoin | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [currentRoute, setCurrentRoute] = useState<CurrentRoute>('heatmap');
  const [mobileTab, setMobileTab] = useState<MobileTab>('bubbles');
  const [favorites, setFavorites] = useState<string[]>(() => getFavorites());
  const [isAskOrbOpen, setIsAskOrbOpen] = useState(false);
  const [isMobile, setIsMobile] = useState<boolean>(() => typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  // Read the current theme from <html data-theme>, which the ink module owns.
  const theme = useSyncExternalStore<ColorTheme>(
    useCallback((notify: () => void) => {
      const observer = new MutationObserver(notify);
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
      return () => observer.disconnect();
    }, []),
    getThemeSnapshot,
    () => 'classic' as ColorTheme
  );

  const inkRef = useRef<ReturnType<typeof initInkBleed> | null>(null);
  useEffect(() => {
    inkRef.current = initInkBleed({
      toggleSelector: '.theme-toggle-btn',
      storageKey: 'orbix_theme',
    });
    return () => {
      inkRef.current?.destroy();
      inkRef.current = null;
    };
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash || '#/';
      if (hash === '#/about') {
        setCurrentRoute('about'); setSelectedCoin(null); window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (hash === '#/contact') {
        setCurrentRoute('contact'); setSelectedCoin(null); window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (hash.startsWith('#/coin/')) {
        const coinId = hash.replace('#/coin/', '').trim();
        const found = coins.find(c => c.id === coinId || c.symbol.toLowerCase() === coinId.toLowerCase());
        if (found) { setSelectedCoin(found); setCurrentRoute('coin'); window.scrollTo({ top: 0, behavior: 'smooth' }); }
      } else { setCurrentRoute('heatmap'); setSelectedCoin(null); }
    };
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [coins]);

  const handleOpenRightPanel = useCallback((coin: CryptoCoin) => { setPanelCoin(coin); setIsPanelOpen(true); }, []);
  const handleOpenFullCoinPage = useCallback((coin: CryptoCoin) => {
    setSelectedCoin(coin); setIsPanelOpen(false); setCurrentRoute('coin');
    window.location.hash = `#/coin/${coin.id}`; window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);
  const handleBackToHeatmap = useCallback(() => {
    setSelectedCoin(null); setIsPanelOpen(false); setCurrentRoute('heatmap'); window.location.hash = '#/';
  }, []);
  const handleToggleFavorite = useCallback((coinId: string) => setFavorites(toggleFavorite(coinId)), []);

  const loadData = useCallback(async (force = false) => {
    try {
      const res = await fetchTop100Coins(force);
      if (res.coins && res.coins.length > 0) {
        setCoins(res.coins);
        setSelectedCoin(prev => prev ? (res.coins.find(c => c.id === prev.id) || prev) : null);
      }
    } catch (e) { console.error('Failed to update crypto prices', e); }
  }, []);

  useEffect(() => { loadData(false); }, [loadData]);
  useEffect(() => { const interval = setInterval(() => loadData(false), 60000); return () => clearInterval(interval); }, [loadData]);

  const filteredCoins = useMemo(() => {
    if (!searchQuery.trim()) return coins;
    const q = searchQuery.toLowerCase().trim();
    return coins.filter(c => c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q));
  }, [coins, searchQuery]);

  return (
    <div className="relative min-h-screen bg-[#000000] text-white flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-300 pb-20 md:pb-5">
      <DustBackground />
      <div className="relative z-20">
        <Header searchQuery={searchQuery} setSearchQuery={setSearchQuery} onHomeClick={handleBackToHeatmap} onNavigate={route => { window.location.hash = route; }} theme={theme} currentRoute={currentRoute} mobileTab={mobileTab} />
      </div>

      <main className="relative z-10 w-full bg-transparent flex flex-col min-h-[calc(100vh-52px)]">
        {currentRoute === 'about' && <AboutPage onBack={handleBackToHeatmap} />}
        {currentRoute === 'contact' && <ContactPage onBack={handleBackToHeatmap} />}
        {currentRoute === 'coin' && selectedCoin && (
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6">
            <CoinDetailPage coin={selectedCoin} onBack={handleBackToHeatmap} favorites={favorites} onToggleFavorite={handleToggleFavorite} />
          </div>
        )}
        {currentRoute === 'heatmap' && (
          <div className="w-full bg-transparent flex flex-col">
            {currentRoute === 'heatmap' && <div className={mobileTab === 'tables' ? 'hidden md:block' : 'block'}><TimeFilterBar timeFrame={timeFrame} setTimeFrame={setTimeFrame} /></div>}
            <div className={`relative z-10 w-full overflow-hidden ${mobileTab === 'tables' ? 'hidden md:block' : 'block'}`}>
              <BubbleCanvas coins={coins} timeFrame={timeFrame} searchQuery={searchQuery} theme={theme} onSelectCoin={handleOpenRightPanel} />
            </div>
            <div className={`relative z-10 w-full bg-[#000000]/80 backdrop-blur-md pt-6 ${mobileTab === 'bubbles' ? 'hidden md:block' : 'flex flex-col pb-24 md:pb-12'}`}>
              <MarketTable coins={filteredCoins} onSelectCoin={handleOpenRightPanel} searchQuery={searchQuery} />
            </div>
          </div>
        )}
      </main>

      <footer className="hidden md:block mt-auto border-t border-[#141414] bg-[#000000] py-6 px-4 text-center">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
          <div className="flex items-center gap-2"><span className="font-bold text-white">Orbix</span><span>·</span><span>Top 100 Cryptocurrency Bubble Heatmap</span></div>
          <div className="flex items-center gap-4 text-neutral-400">
            <button onClick={() => { window.location.hash = '#/about'; }} className="hover:text-white transition-colors">About</button><span>·</span>
            <button onClick={() => { window.location.hash = '#/contact'; }} className="hover:text-white transition-colors">Contact</button><span>·</span>
            <span>hello@orbix.live</span>
          </div>
        </div>
      </footer>

      <MobileBottomBar activeTab={mobileTab} onTabChange={setMobileTab} onNavigate={route => { window.location.hash = route; }} currentRoute={currentRoute} onOpenAskOrb={() => setIsAskOrbOpen(true)} isAskOrbOpen={isAskOrbOpen} />
      {!isAskOrbOpen && (
        <button onClick={() => setIsAskOrbOpen(true)} className="hidden md:flex fixed bottom-6 right-6 z-50 items-center gap-2.5 px-4 py-2.5 rounded-full bg-[#111111] hover:bg-[#181818] border border-[#2A2A2A] hover:border-[#00FF88]/40 shadow-[0_8px_30px_rgba(0,0,0,0.85)] transition-all hover:scale-105 active:scale-95 cursor-pointer group" style={{ boxShadow: '0 8px 30px rgba(0, 0, 0, 0.85), 0 0 16px rgba(0, 255, 136, 0.18)' }} title="Ask Orb - AI Assistant">
          <span className="w-2.5 h-2.5 rounded-full bg-[#00FF88] shadow-[0_0_8px_#00FF88] animate-pulse" /><span className="text-sm font-bold text-white tracking-wide group-hover:text-[#00FF88] transition-colors">Ask Orb</span>
        </button>
      )}
      <AskOrbChat isOpen={isAskOrbOpen} onClose={() => setIsAskOrbOpen(false)} isMobile={isMobile} coins={coins} />
      <CoinRightPanel coin={panelCoin} isOpen={isPanelOpen} onClose={() => setIsPanelOpen(false)} onViewFullPage={handleOpenFullCoinPage} isFavorite={panelCoin ? favorites.includes(panelCoin.id) : false} onToggleFavorite={handleToggleFavorite} />
    </div>
  );
}
