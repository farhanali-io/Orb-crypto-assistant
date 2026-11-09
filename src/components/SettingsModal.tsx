import React from 'react';
import { ColorTheme, THEME_CONFIGS } from '../types/crypto';
import { X, Palette, Check } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: ColorTheme;
  setTheme: (theme: ColorTheme) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  theme,
  setTheme,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-[#0a0a0a] border border-[#222222] rounded-2xl shadow-2xl p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#222222]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#161616] border border-[#2a2a2a] text-white">
              <Palette className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Orbix Settings</h2>
              <p className="text-xs text-neutral-400">Choose visual bubble color palette</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-[#1a1a1a] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Theme Options */}
        <div className="py-5 space-y-4">
          <div className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
            Bubble Color Themes
          </div>

          {/* Theme 1: Classic */}
          <div
            onClick={() => setTheme('classic')}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              theme === 'classic'
                ? 'bg-[#141414] border-white/40 shadow-lg'
                : 'bg-[#0f0f0f] border-[#222222] hover:border-[#333333]'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="font-bold text-sm text-white">Theme 1 - Classic</span>
                <p className="text-xs text-neutral-400 mt-0.5">High-contrast Red & Green on pure black</p>
              </div>
              {theme === 'classic' && (
                <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center text-black">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              )}
            </div>

            {/* Visual Swatches */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black border border-[#FF1E1E] text-xs font-mono font-bold"
                   style={{ boxShadow: '0 0 10px #FF1E1E55', color: '#FF1E1E' }}>
                <span className="w-2 h-2 rounded-full bg-[#FF1E1E]"></span>
                -3.8% #FF1E1E
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black border border-[#00E676] text-xs font-mono font-bold"
                   style={{ boxShadow: '0 0 10px #00E67655', color: '#00E676' }}>
                <span className="w-2 h-2 rounded-full bg-[#00E676]"></span>
                +3.2% #00E676
              </div>
            </div>
          </div>

          {/* Theme 2: Neon */}
          <div
            onClick={() => setTheme('neon')}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              theme === 'neon'
                ? 'bg-[#141414] border-white/40 shadow-lg'
                : 'bg-[#0f0f0f] border-[#222222] hover:border-[#333333]'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="font-bold text-sm text-white">Theme 2 - Neon</span>
                <p className="text-xs text-neutral-400 mt-0.5">Vibrant Cyberpunk Coral & Mint Cyan</p>
              </div>
              {theme === 'neon' && (
                <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center text-black">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              )}
            </div>

            {/* Visual Swatches */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black border border-[#FF4D6D] text-xs font-mono font-bold"
                   style={{ boxShadow: '0 0 10px #FF4D6D55', color: '#FF4D6D' }}>
                <span className="w-2 h-2 rounded-full bg-[#FF4D6D]"></span>
                -3.8% #FF4D6D
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black border border-[#00FFAA] text-xs font-mono font-bold"
                   style={{ boxShadow: '0 0 10px #00FFAA55', color: '#00FFAA' }}>
                <span className="w-2 h-2 rounded-full bg-[#00FFAA]"></span>
                +3.2% #00FFAA
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-3 border-t border-[#222222]">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold rounded-xl bg-white text-black hover:bg-neutral-200 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
