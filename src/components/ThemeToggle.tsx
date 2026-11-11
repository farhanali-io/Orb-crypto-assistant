import React from 'react';
import { ColorTheme } from '../types/crypto';

interface ThemeToggleProps {
  theme: ColorTheme;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ theme }) => {
  return (
    <button
      type="button"
      id="theme-toggle"
      aria-label="Toggle color theme"
      aria-pressed={theme === 'neon'}
      title={theme === 'neon' ? 'Switch to Classic' : 'Switch to Neon'}
      data-ink-live
    >
      <svg className="theme-toggle__svg" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
        {/* Classic Icon (Red/Green Dual Circle) */}
        <g className="theme-toggle__classic">
           <circle cx="9" cy="12" r="5" fill="#FF1E1E" opacity="0.8" />
           <circle cx="15" cy="12" r="5" fill="#00E676" opacity="0.8" />
        </g>
        {/* Neon Icon (Cyan/Magenta Diamond) */}
        <g className="theme-toggle__neon">
          <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5Z" fill="#00F0FF" />
          <circle cx="12" cy="12" r="3" fill="#FF007F" />
        </g>
      </svg>
    </button>
  );
};
