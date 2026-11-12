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
    <div className="flex items-center gap-2 px-4 py-3 overflow-x-auto no-scrollbar w-full border-b border-[#141414]">
      {filters.map(f => (
        <button
          key={f.id}
          onClick={() => setTimeFrame(f.id as TimeFrame)}
          className={`flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
            timeFrame === f.id
              ? 'bg-[#1A1A1A] text-white border-[#333]'
              : 'bg-transparent text-neutral-400 border-transparent hover:text-white hover:border-[#222]'
          }`}
        >
          {'icon' in f && f.icon && <Star className="w-3.5 h-3.5 fill-current" />}
          {f.label}
        </button>
      ))}
    </div>
  );
};