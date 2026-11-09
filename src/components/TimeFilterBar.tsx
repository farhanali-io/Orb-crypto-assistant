import React from 'react';
import { TimeFrame } from '../types/crypto';

interface TimeFilterBarProps {
  timeFrame: TimeFrame;
  setTimeFrame: (tf: TimeFrame) => void;
}

export const TimeFilterBar: React.FC<TimeFilterBarProps> = ({
  timeFrame,
  setTimeFrame,
}) => {
  const timeFrames: { key: TimeFrame; label: string }[] = [
    { key: 'hour', label: 'Hour' },
    { key: 'day', label: 'Day' },
    { key: 'week', label: 'Week' },
    { key: 'month', label: 'Month' },
    { key: 'year', label: 'Year' },
  ];

  return (
    <div className="w-full px-4 sm:px-6 py-2 bg-[#000000] border-b border-[#141414] flex items-center gap-2 overflow-x-auto scrollbar-none flex-nowrap z-20">
      {timeFrames.map(tf => {
        const isActive = timeFrame === tf.key;
        return (
          <button
            key={tf.key}
            onClick={() => setTimeFrame(tf.key)}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition-all whitespace-nowrap shrink-0 cursor-pointer ${
              isActive
                ? 'bg-[#3D0A0A] text-white border border-[#FF2D2D] shadow-[0_0_12px_rgba(255,45,45,0.35)]'
                : 'bg-[#111111] text-neutral-400 hover:text-white hover:bg-[#181818] border border-[#222222]'
            }`}
          >
            {tf.label}
          </button>
        );
      })}
    </div>
  );
};
