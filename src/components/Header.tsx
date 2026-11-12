import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { TimeFrame, ColorTheme, CryptoCoin } from '../types/crypto';
import { ThemeToggle } from './ThemeToggle';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  timeFrame?: TimeFrame;
  setTimeFrame?: (tf: TimeFrame) => void;
  onHomeClick: () => void;
  onNavigate: (route: string) => void;
  theme: ColorTheme;
  currentRoute: string;
  mobileTab?: string;
  coins: CryptoCoin[];
  onSelectCoin: (coin: CryptoCoin) => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery, setSearchQuery, onHomeClick, onNavigate, theme, currentRoute, mobileTab, coins, onSelectCoin
}) => {
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const isHeatmap = currentRoute === 'heatmap';
  const searchWrapperRef = useRef<HTMLDivElement>(null);

  // Filter coins based on search query (Removed the .slice limit!)
  const filteredCoins = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return coins.filter(
      c => c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q)
    );
  }, [coins, searchQuery]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setShowDropdown(true);
  };

  const handleSelectCoin = (coin: CryptoCoin) => {
    onSelectCoin(coin);
    setShowDropdown(false);
    setSearchQuery('');
    setMobileSearchOpen(false);
  };

  const SearchResults = () => {
    if (!showDropdown || filteredCoins.length === 0) return null;
    
    return (
      <div className="absolute top-full left-0 right-0 mt-2 bg-[#111111] border border-[#2a2a2a] rounded-xl shadow-2xl overflow-hidden z-50 flex flex-col max-h-[60vh] overflow-y-auto">
        {filteredCoins.map((coin) => (
          <button
            key={coin.id}
            onMouseDown={(e) => {
              e.preventDefault(); // Prevents input from losing focus before click registers
              handleSelectCoin(coin);
            }}
            className="flex items-center gap-3 w-full p-3 hover:bg-[#1a1a1a] transition-colors border-b border-[#1e1e1e] last:border-0 text-left"
          >
            <img src={coin.image} alt={coin.name} className="w-6 h-6 rounded-full shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-white truncate">{coin.name}</div>
              <div className="text-[11px] font-mono text-neutral-400 uppercase">{coin.symbol}</div>
            </div>
            <div className="text-xs font-mono text-emerald-400 font-bold shrink-0">
              ${coin.current_price.toLocaleString()}
            </div>
          </button>
        ))}
      </div>
    );
  };

  return (
    <header className="w-full bg-[#000000] border-b border-[#141414] select-none sticky top-0 z-40">
      <div className="w-full px-4 sm:px-6 h-[52px] flex items-center justify-between gap-3">
        
        {mobileSearchOpen ? (
          <div className="flex w-full items-center gap-3 animate-in fade-in slide-in-from-right-4 duration-200 relative" ref={searchWrapperRef}>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => setShowDropdown(true)}
                placeholder="Search cryptocurrency..."
                className="w-full h-9 pl-9 pr-8 bg-[#111111] border border-[#222222] focus:border-[#383838] rounded-full text-xs text-white placeholder-neutral-500 focus:outline-none transition-all"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button
              onClick={() => {
                setMobileSearchOpen(false);
                setSearchQuery('');
                setShowDropdown(false);
              }}
              className="text-xs font-semibold text-neutral-400 hover:text-white shrink-0"
            >
              Cancel
            </button>
            <SearchResults />
          </div>
        ) : (
          <>
            <div onClick={onHomeClick} className="flex items-center gap-2 cursor-pointer shrink-0">
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-300 flex items-center justify-center p-0.5">
                <div className="w-full h-full bg-black rounded-full flex items-center justify-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
                </div>
              </div>
              <span className="text-xl font-bold tracking-tight text-white hover:text-emerald-400 transition-colors">
                Orbix
              </span>
            </div>

            {/* Desktop Search */}
            <div className="hidden md:flex flex-1 max-w-md mx-4 relative" ref={searchWrapperRef}>
              <div className="relative w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={() => setShowDropdown(true)}
                  placeholder="Search cryptocurrency..."
                  className="w-full h-9 pl-9 pr-8 bg-[#111111] hover:bg-[#161616] focus:bg-[#161616] border border-[#222222] focus:border-[#383838] rounded-full text-xs text-white placeholder-neutral-500 focus:outline-none transition-all"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <SearchResults />
            </div>

            <div className="hidden md:flex items-center gap-4 shrink-0 ml-auto">
              <button
                onClick={() => onNavigate('#/about')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-300 border ${
                  currentRoute === 'about'
                    ? 'bg-[#141414] text-white border-[#00FF88] shadow-[0_0_12px_rgba(0,255,136,0.25)]'
                    : 'bg-[#0A0A0A] text-neutral-400 border-[#222222] hover:text-white hover:border-[#555] shadow-[0_0_4px_rgba(255,255,255,0.03)]'
                }`}
              >
                About Us
              </button>
              <button
                onClick={() => onNavigate('#/contact')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-300 border ${
                  currentRoute === 'contact'
                    ? 'bg-[#141414] text-white border-[#00FF88] shadow-[0_0_12px_rgba(0,255,136,0.25)]'
                    : 'bg-[#0A0A0A] text-neutral-400 border-[#222222] hover:text-white hover:border-[#555] shadow-[0_0_4px_rgba(255,255,255,0.03)]'
                }`}
              >
                Contact Us
              </button>
              {isHeatmap && mobileTab !== 'tables' && <ThemeToggle theme={theme} />}
            </div>

            {/* Mobile Search Icon */}
            <div className="flex md:hidden items-center gap-2 ml-auto">
              <button onClick={() => setMobileSearchOpen(true)} className="p-2 rounded-lg bg-[#111111] text-neutral-300 hover:text-white" title="Search">
                <Search className="w-4 h-4" />
              </button>
              {isHeatmap && mobileTab !== 'tables' && <ThemeToggle theme={theme} />}
            </div>
          </>
        )}
      </div>
    </header>
  );
};
