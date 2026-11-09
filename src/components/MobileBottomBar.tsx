import React from 'react';
import { Wallet, List, Info, Mail, Sparkles } from 'lucide-react';

export type MobileTab = 'bubbles' | 'tables';

interface MobileBottomBarProps {
  activeTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
  onNavigate: (route: string) => void;
  currentRoute: string;
  onOpenAskOrb: () => void;
  isAskOrbOpen?: boolean;
}

export const MobileBottomBar: React.FC<MobileBottomBarProps> = ({
  activeTab,
  onTabChange,
  onNavigate,
  currentRoute,
  onOpenAskOrb,
  isAskOrbOpen = false,
}) => {
  const isBubblesActive = currentRoute === 'heatmap' && activeTab === 'bubbles';
  const isTablesActive = currentRoute === 'heatmap' && activeTab === 'tables';
  const isAboutActive = currentRoute === 'about';
  const isContactActive = currentRoute === 'contact';

  const handleBubblesClick = () => {
    onTabChange('bubbles');
    onNavigate('#/');
  };

  const handleTablesClick = () => {
    onTabChange('tables');
    onNavigate('#/');
  };

  const handleAboutClick = () => {
    onNavigate('#/about');
  };

  const handleContactClick = () => {
    onNavigate('#/contact');
  };

  return (
    <div
      className={`md:hidden fixed z-[100] flex items-center justify-between px-2 transition-opacity duration-200 ${
        isAskOrbOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{
        bottom: '12px',
        left: '12px',
        right: '12px',
        height: '56px',
        backgroundColor: 'rgba(26, 26, 26, 0.90)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderRadius: '28px',
        border: '1px solid #2A2A2A',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.6)',
      }}
    >
      {/* 1. Bubbles View (Wallet Icon) */}
      <button
        onClick={handleBubblesClick}
        className={`flex items-center justify-center gap-1.5 h-10 transition-all rounded-full ${
          isBubblesActive
            ? 'bg-[#2D2D2D] px-3 text-white shadow-sm'
            : 'w-10 text-[#8A8A8A] hover:text-white'
        }`}
        title="Bubbles View"
      >
        <Wallet className="w-5 h-5 shrink-0" />
        {isBubblesActive && (
          <span className="text-[11px] font-semibold whitespace-nowrap">Bubbles</span>
        )}
      </button>

      {/* 2. Tables View (List/Table Icon) */}
      <button
        onClick={handleTablesClick}
        className={`flex items-center justify-center gap-1.5 h-10 transition-all rounded-full ${
          isTablesActive
            ? 'bg-[#2D2D2D] px-3 text-white shadow-sm'
            : 'w-10 text-[#8A8A8A] hover:text-white'
        }`}
        title="Tables View"
      >
        <List className="w-5 h-5 shrink-0" />
        {isTablesActive && (
          <span className="text-[11px] font-semibold whitespace-nowrap">Tables</span>
        )}
      </button>

      {/* 3. Ask Orb (Center, slightly bigger, 48px green circle #00FF88, black sparkle icon, raised up -8px) */}
      <button
        onClick={onOpenAskOrb}
        className="flex items-center justify-center shrink-0 w-12 h-12 rounded-full transition-transform active:scale-95 cursor-pointer"
        style={{
          backgroundColor: '#00FF88',
          color: '#000000',
          transform: 'translateY(-8px)',
          boxShadow: '0 4px 18px rgba(0, 255, 136, 0.5), 0 2px 8px rgba(0,0,0,0.8)',
          border: '2px solid #000000',
        }}
        title="Ask Orb - AI Assistant"
      >
        <Sparkles className="w-5 h-5 text-black fill-black" />
      </button>

      {/* 4. About Page (Info Icon) */}
      <button
        onClick={handleAboutClick}
        className={`flex items-center justify-center gap-1.5 h-10 transition-all rounded-full ${
          isAboutActive
            ? 'bg-[#2D2D2D] px-3 text-white shadow-sm'
            : 'w-10 text-[#8A8A8A] hover:text-white'
        }`}
        title="About Orbix"
      >
        <Info className="w-5 h-5 shrink-0" />
        {isAboutActive && (
          <span className="text-[11px] font-semibold whitespace-nowrap">About</span>
        )}
      </button>

      {/* 5. Contact Page (Mail Icon) */}
      <button
        onClick={handleContactClick}
        className={`flex items-center justify-center gap-1.5 h-10 transition-all rounded-full ${
          isContactActive
            ? 'bg-[#2D2D2D] px-3 text-white shadow-sm'
            : 'w-10 text-[#8A8A8A] hover:text-white'
        }`}
        title="Contact Us"
      >
        <Mail className="w-5 h-5 shrink-0" />
        {isContactActive && (
          <span className="text-[11px] font-semibold whitespace-nowrap">Contact</span>
        )}
      </button>
    </div>
  );
};
