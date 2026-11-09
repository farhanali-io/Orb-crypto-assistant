import React, { useMemo } from 'react';

/**
 * Faint white dust / noise dots on pure black #000000 (opacity 0.05).
 * Clean, subtle, non-intrusive backdrop as requested.
 */
export const DustBackground: React.FC = () => {
  // Generate random static dust particles
  const dustParticles = useMemo(() => {
    const dots: { id: number; x: number; y: number; r: number; opacity: number }[] = [];
    let seed = 12345;
    const random = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    for (let i = 0; i < 90; i++) {
      dots.push({
        id: i,
        x: Math.round(random() * 1000) / 10,
        y: Math.round(random() * 1000) / 10,
        r: random() > 0.8 ? 1.5 : 1,
        opacity: 0.03 + random() * 0.04,
      });
    }
    return dots;
  }, []);

  return (
    <div
      className="fixed inset-0 pointer-events-none select-none overflow-hidden z-0 bg-[#000000]"
      aria-hidden="true"
    >
      <svg
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        style={{ opacity: 0.06 }}
      >
        {dustParticles.map(dot => (
          <circle
            key={dot.id}
            cx={`${dot.x}%`}
            cy={`${dot.y}%`}
            r={dot.r}
            fill="#FFFFFF"
            opacity={dot.opacity * 15}
          />
        ))}
      </svg>
    </div>
  );
};
