import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import { TimeFrame, ColorTheme } from '../types/crypto';
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
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery, setSearchQuery, onHomeClick, onNavigate, theme, currentRoute, mobileTab
}) => {
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const isHeatmap = currentRoute === 'heatmap';

  return (
    <header className="w-full bg-[#000000] border-b border-[#141414] select-none sticky top-0 z-40">
      <div className="w-full px-4 sm:px-6 h-[52px] flex items-center justify-between gap-3 overflow-hidden">
        
        {/* =========================================
            MOBILE SEARCH ACTIVE VIEW
            Replaces the entire header row so it doesn't push content down
            ========================================= */}
        {mobileSearchOpen ? (
          <div className="flex w-full items-center gap-3 animate-in fade-in slide-in-from-right-4 duration-200">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search cryptocurrency..."
                className="w-full h-9 pl-9 pr-8 bg-[#111111] border border-[#222222] focus:border-[#383838] rounded-full text-xs text-white placeholder-neutral-500 focus:outline-none transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button
              onClick={() => {
                setMobileSearchOpen(false);
                setSearchQuery(''); // Optional: clear search on cancel
              }}
              className="text-xs font-semibold text-neutral-400 hover:text-white shrink-0"
            >
              Cancel
            </button>
          </div>
        ) : (
          /* =========================================
             NORMAL HEADER VIEW (Logo, Search, Icons)
             ========================================= */
          <>
            {/* Left: Logo */}
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

            {/* Center: Desktop Search */}
            {isHeatmap && (
              <div className="hidden md:flex flex-1 max-w-md mx-4">
                <div className="relative w-full">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search cryptocurrency..."
                    className="w-full h-9 pl-9 pr-8 bg-[#111111] hover:bg-[#161616] focus:bg-[#161616] border border-[#222222] focus:border-[#383838] rounded-full text-xs text-white placeholder-neutral-500 focus:outline-none transition-all"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Right: Nav & Theme Toggle (Desktop) */}
            <div className="hidden md:flex items-center gap-4 shrink-0 ml-auto">
              <button onClick={() => onNavigate('#/about')} className="text-xs font-medium text-neutral-300 hover:text-white transition-colors">About Us</button>
              <button onClick={() => onNavigate('#/contact')} className="text-xs font-medium text-neutral-300 hover:text-white transition-colors">Contact Us</button>
              {isHeatmap && mobileTab !== 'tables' && <ThemeToggle theme={theme} />}
            </div>

            {/* Mobile Controls */}
            <div className="flex md:hidden items-center gap-2 ml-auto">
              {isHeatmap && (
                <button onClick={() => setMobileSearchOpen(true)} className="p-2 rounded-lg bg-[#111111] text-neutral-300 hover:text-white" title="Search">
                  <Search className="w-4 h-4" />
                </button>
              )}
              {isHeatmap && mobileTab !== 'tables' && <ThemeToggle theme={theme} />}
            </div>
          </>
        )}
      </div>
    </header>
  );
};
