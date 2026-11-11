import React, { useState } from 'react';
import { Search, X, Menu } from 'lucide-react';
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
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery, setSearchQuery, onHomeClick, onNavigate, theme,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  return (
    <header className="w-full bg-[#000000] border-b border-[#141414] select-none sticky top-0 z-40">
      <div className="w-full px-4 sm:px-6 h-[52px] flex items-center justify-between gap-3">
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

        <div className="hidden md:flex items-center gap-4 shrink-0">
          <button onClick={() => onNavigate('#/about')} className="text-xs font-medium text-neutral-300 hover:text-white transition-colors">About Us</button>
          <button onClick={() => onNavigate('#/contact')} className="text-xs font-medium text-neutral-300 hover:text-white transition-colors">Contact Us</button>
          <ThemeToggle theme={theme} />
        </div>

        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle theme={theme} />
          <button onClick={() => setMobileSearchOpen(!mobileSearchOpen)} className="p-2 rounded-lg bg-[#111111] text-neutral-300 hover:text-white" title="Search">
            <Search className="w-4 h-4" />
          </button>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 rounded-lg bg-[#111111] text-neutral-300 hover:text-white" title="Menu">
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdowns remain unchanged... */}
      {mobileSearchOpen && (
        <div className="md:hidden px-4 py-2 bg-[#0a0a0a] border-t border-[#1a1a1a] flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input type="text" autoFocus value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search cryptocurrency..." className="w-full h-8 pl-9 pr-8 bg-[#161616] border border-[#262626] rounded-full text-xs text-white placeholder-neutral-500 focus:outline-none" />
            {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500"><X className="w-3.5 h-3.5" /></button>}
          </div>
          <button onClick={() => setMobileSearchOpen(false)} className="text-xs text-neutral-400 px-2 py-1">Done</button>
        </div>
      )}

      {mobileMenuOpen && (
        <div className="md:hidden px-4 py-3 bg-[#0a0a0a] border-t border-[#181818] flex flex-col gap-2 animate-in slide-in-from-top-2 duration-150">
          <button onClick={() => { onNavigate('#/about'); setMobileMenuOpen(false); }} className="w-full text-left py-2 px-3 text-xs font-semibold text-neutral-200 hover:text-white hover:bg-[#141414] rounded-lg">About Us</button>
          <button onClick={() => { onNavigate('#/contact'); setMobileMenuOpen(false); }} className="w-full text-left py-2 px-3 text-xs font-semibold text-neutral-200 hover:text-white hover:bg-[#141414] rounded-lg">Contact Us</button>
        </div>
      )}
    </header>
  );
};
