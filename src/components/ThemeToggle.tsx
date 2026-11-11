import React from 'react';
import { ColorTheme } from '../types/crypto';

interface ThemeToggleProps {
  theme: ColorTheme;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ theme }) => {
  return (
    <button
      type="button"
      className="theme-toggle-btn relative inline-grid place-items-center w-9 h-9 rounded-full bg-[#111111] border border-[#333] cursor-pointer transition-transform hover:scale-105 active:scale-95"
      aria-label="Toggle color theme"
      aria-pressed={theme === 'neon'}
      title={theme === 'neon' ? 'Switch to Classic' : 'Switch to Neon'}
      data-ink-live
    >
      <svg className="relative block w-5 h-5 overflow-visible" viewBox="0 0 24 24" aria-hidden="true">
        {/* Classic Icon */}
        <g
          className={`transition-all duration-300 origin-center ${
            theme === 'classic' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'
          }`}
          style={{ transformOrigin: '12px 12px' }}
        >
          <circle cx="9" cy="12" r="5" fill="#FF1E1E" opacity="0.8" />
          <circle cx="15" cy="12" r="5" fill="#00E676" opacity="0.8" />
        </g>
        {/* Neon Icon */}
        <g
          className={`transition-all duration-300 origin-center ${
            theme === 'neon' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 rotate-90 scale-50'
          }`}
          style={{ transformOrigin: '12px 12px' }}
        >
          <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5Z" fill="#00F0FF" />
          <circle cx="12" cy="12" r="3" fill="#FF007F" />
        </g>
      </svg>
    </button>
  );
};
