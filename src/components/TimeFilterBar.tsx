import React from 'react';
import { TimeFrame } from '../types/crypto';
import { Star } from 'lucide-react';

interface TimeFilterBarProps {
  timeFrame: TimeFrame;
  setTimeFrame: (tf: TimeFrame) => void;
}

export const TimeFilterBar: React.FC<TimeFilterBarProps> = ({ timeFrame, setTimeFrame }) => {
  const filters = [
    { id: 'hour', label: 'Hour' },
    { id: 'day', label: 'Day' },
    { id: 'week', label: 'Week' },
    { id: 'month', label: 'Month' },
    { id: 'year', label: 'Year' },
    { id: 'favorites', label: 'Fav', icon: true },
  ] as const;

  return (
    <div className="w-full border-b border-[#141414] bg-[#000000] px-2 py-2.5 sm:px-6 sm:py-4">
      {/* Grid ensures all 6 fit exactly on mobile with no scrolling, switches to flex on desktop */}
      <div className="grid grid-cols-6 gap-1.5 sm:flex sm:items-center sm:justify-start sm:gap-3 w-full max-w-4xl">
        {filters.map(f => (
          <button
            key={f.id}
            onClick={() => setTimeFrame(f.id as TimeFrame)}
            className={`flex items-center justify-center gap-1 sm:gap-2 px-1 py-1.5 sm:px-5 sm:py-2 rounded-md sm:rounded-full text-[10px] sm:text-xs font-bold transition-all duration-300 border ${
              timeFrame === f.id
                ? 'bg-[#141414] text-white border-[#00FF88] shadow-[0_0_12px_rgba(0,255,136,0.25)] scale-105'
                : 'bg-[#0A0A0A] text-neutral-400 border-[#222222] hover:text-white hover:border-[#555] shadow-[0_0_4px_rgba(255,255,255,0.03)]'
            }`}
          >
            {'icon' in f && f.icon && (
              <Star className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${timeFrame === f.id ? 'fill-[#00FF88] text-[#00FF88]' : 'fill-neutral-500 text-neutral-500'}`} />
            )}
            {f.label}
          </button>
        ))}
      </div>
    </div>
  );
};
