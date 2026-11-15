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
import { CoinRightPanel } from './components/CoinRightPanel';

type CurrentRoute = 'heatmap' | 'about' | 'contact' | 'coin';

const getThemeSnapshot = (): ColorTheme => {
  if (typeof document === 'undefined') return 'classic';
  return (document.documentElement.dataset.theme as ColorTheme) || 'classic';
};

export default function App() {
  const [coins, setCoins] = useState<CryptoCoin[]>(() => getFullTop100Coins());
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('day');
  const [selectedCoin, setSelectedCoin] = useState<CryptoCoin | null>(null);
  const [panelCoin, setPanelCoin] = useState<CryptoCoin | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [currentRoute, setCurrentRoute] = useState<CurrentRoute>('heatmap');
  const [mobileTab, setMobileTab] = useState<MobileTab>('bubbles');
  const [favorites, setFavorites] = useState<string[]>(() => getFavorites());
  const [hasLaunched, setHasLaunched] = useState(false);
  const [isMobile, setIsMobile] = useState<boolean>(() => typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  const [isLoading, setIsLoading] = useState(true);

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
    inkRef.current = initInkBleed({ toggleSelector: '.theme-toggle-btn', storageKey: 'orbix_theme' });
    return () => { inkRef.current?.destroy(); inkRef.current = null; };
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
      if (hash === '#/about') { setCurrentRoute('about'); setSelectedCoin(null); }
      else if (hash === '#/contact') { setCurrentRoute('contact'); setSelectedCoin(null); }
      else if (hash.startsWith('#/coin/')) {
        const coinId = hash.replace('#/coin/', '').trim();
        const found = coins.find(c => c.id === coinId || c.symbol.toLowerCase() === coinId.toLowerCase());
        if (found) { setSelectedCoin(found); setCurrentRoute('coin'); }
      } else { setCurrentRoute('heatmap'); setSelectedCoin(null); }
    };
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [coins]);

  const handleOpenRightPanel = useCallback((coin: CryptoCoin) => { setPanelCoin(coin); setIsPanelOpen(true); }, []);
  const handleOpenFullCoinPage = useCallback((coin: CryptoCoin) => {
    setSelectedCoin(coin); setIsPanelOpen(false); setCurrentRoute('coin');
    window.location.hash = `#/coin/${coin.id}`;
  }, []);
  const handleBackToHeatmap = useCallback(() => {
    setSelectedCoin(null); setIsPanelOpen(false); setCurrentRoute('heatmap'); window.location.hash = '#/';
  }, []);
  const handleToggleFavorite = useCallback((coinId: string) => setFavorites(toggleFavorite(coinId)), []);

  const loadData = useCallback(async (force = false) => {
    try {
      const res = await fetchTop100Coins(force);
      setIsLoading(false);
      if (res.coins && res.coins.length > 0) {
        setCoins(res.coins);
        setSelectedCoin(prev => prev ? (res.coins.find(c => c.id === prev.id) || prev) : null);
      }
    } catch (e) { setIsLoading(false); }
  }, []);

  useEffect(() => { loadData(false); }, [loadData]);
  useEffect(() => { const interval = setInterval(() => loadData(false), 60000); return () => clearInterval(interval); }, [loadData]);

  // If coin page, show ONLY coin page (no duplicate Orbix bars)
  if (currentRoute === 'coin' && selectedCoin) {
    return (
      <div className="min-h-screen bg-[#08080A]">
        <Header searchQuery="" setSearchQuery={()=>{}} onNavigate={()=>{}} currentRoute="heatmap" theme={theme} />
        <CoinDetailPage coin={selectedCoin} onBack={handleBackToHeatmap} favorites={favorites} onToggleFavorite={handleToggleFavorite} />
        <MobileBottomBar activeTab="bubbles" onTabChange={()=>{}} onAskOrb={()=>{}} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#08080A] text-white">
      <Header searchQuery="" setSearchQuery={()=>{}} onNavigate={(r)=>setCurrentRoute(r as any)} currentRoute={currentRoute} theme={theme} />
      {currentRoute === 'about' ? <AboutPage/> : currentRoute === 'contact' ? <ContactPage/> : (
        <>
          <BubbleCanvas coins={coins} onCoinClick={handleOpenRightPanel} timeFrame={timeFrame} isLoading={isLoading} favorites={favorites} />
          <MarketTable coins={coins} onCoinClick={handleOpenRightPanel} favorites={favorites} onToggleFavorite={handleToggleFavorite} />
        </>
      )}
      <CoinRightPanel coin={panelCoin} isOpen={isPanelOpen} onClose={()=>setIsPanelOpen(false)} onViewFullPage={handleOpenFullCoinPage} isFavorite={panelCoin?favorites.includes(panelCoin.id):false} onToggleFavorite={handleToggleFavorite} />
      <MobileBottomBar activeTab={mobileTab} onTabChange={setMobileTab} onAskOrb={()=>{}} />
    </div>
  );
}
