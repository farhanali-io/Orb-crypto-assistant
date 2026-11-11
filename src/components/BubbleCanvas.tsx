import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  forceSimulation,
  forceCollide,
  forceManyBody,
  forceX,
  forceY,
  Simulation,
  SimulationNodeDatum,
} from 'd3-force';
import { CryptoCoin, TimeFrame, ColorTheme } from '../types/crypto';
import { formatCurrency, formatPercentage, formatCompactNumber } from '../services/cryptoApi';

interface BubbleCanvasProps {
  coins: CryptoCoin[];
  timeFrame: TimeFrame;
  searchQuery: string;
  theme: ColorTheme;
  onSelectCoin: (coin: CryptoCoin) => void;
}

interface DynamicBubbleNode extends SimulationNodeDatum {
  id: string;
  coin: CryptoCoin;
  diameter: number;
  r: number;
  changeVal: number;
  isPositive: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

// Clean truncated symbol helper so text never overflows
function getCleanSymbol(symbol: string, diameter: number): string {
  const sym = (symbol || '').toUpperCase();
  if (diameter < 46) return sym.slice(0, 4);
  if (diameter < 65 && sym.length > 5) return sym.slice(0, 4) + '..';
  if (sym.length > 8) return sym.slice(0, 6) + '..';
  return sym;
}

// Check if device is touch or mobile screen
const isTouchOrMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  return (
    window.innerWidth < 768 ||
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    (window.matchMedia && window.matchMedia('(hover: none)').matches) ||
    (window.matchMedia && window.matchMedia('(pointer: coarse)').matches)
  );
};

export const BubbleCanvas: React.FC<BubbleCanvasProps> = ({
  coins,
  timeFrame,
  searchQuery,
  onSelectCoin,
  theme,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? Math.max(window.innerHeight - 110, 680) : 720,
  });
  const [isMobile, setIsMobile] = useState<boolean>(() => isTouchOrMobileDevice());
  const [bubbleNodes, setBubbleNodes] = useState<DynamicBubbleNode[]>([]);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [hoveredBubble, setHoveredBubble] = useState<DynamicBubbleNode | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ left: number; top: number }>({ left: 0, top: 0 });

  // Smart Tooltip Positioning:
  // - If bubble is on right side -> open card on LEFT side of bubble
  // - If bubble is on left side -> open card on RIGHT side of bubble
  // - If bubble is at bottom -> open card ABOVE bubble
  // - If bubble is at top -> open card BELOW bubble
  // - Keep card ALWAYS inside viewport (clamped)
  // - If card still overflows, flip it to opposite side automatically
  const updateTooltipPosition = useCallback((targetEl: HTMLElement) => {
    if (typeof window === 'undefined') return;
    const bubbleRect = targetEl.getBoundingClientRect();
    const CARD_WIDTH = 260;
    const CARD_HEIGHT = 142;
    const GAP = 12;
    const EDGE_PAD = 8;

    const winW = window.innerWidth;
    const winH = window.innerHeight;

    const bubbleCenterX = bubbleRect.left + bubbleRect.width / 2;
    const bubbleCenterY = bubbleRect.top + bubbleRect.height / 2;

    // Horizontal placement
    let targetLeft: number;
    if (bubbleCenterX > winW * 0.65) {
      // Bubble on right side: open card on LEFT side of bubble
      targetLeft = bubbleRect.left - CARD_WIDTH - GAP;
      if (targetLeft < EDGE_PAD) {
        // If overflowing left, flip to right
        targetLeft = bubbleRect.right + GAP;
      }
    } else if (bubbleCenterX < winW * 0.35) {
      // Bubble on left side: open on RIGHT side of bubble
      targetLeft = bubbleRect.right + GAP;
      if (targetLeft + CARD_WIDTH > winW - EDGE_PAD) {
        // If overflowing right, flip to left
        targetLeft = bubbleRect.left - CARD_WIDTH - GAP;
      }
    } else {
      // In middle: center horizontally
      targetLeft = bubbleCenterX - CARD_WIDTH / 2;
    }

    // Strict clamp: left = clamp(targetLeft, 8, windowWidth - cardWidth - 8)
    const clampedLeft = Math.max(EDGE_PAD, Math.min(winW - CARD_WIDTH - EDGE_PAD, targetLeft));

    // Vertical placement
    let targetTop: number;
    if (bubbleCenterY > winH * 0.65) {
      // Bubble at bottom: open card ABOVE bubble
      targetTop = bubbleRect.top - CARD_HEIGHT - GAP;
      if (targetTop < EDGE_PAD) {
        // If overflowing top, flip below
        targetTop = bubbleRect.bottom + GAP;
      }
    } else if (bubbleCenterY < winH * 0.35) {
      // Bubble at top: open card BELOW bubble
      targetTop = bubbleRect.bottom + GAP;
      if (targetTop + CARD_HEIGHT > winH - EDGE_PAD) {
        // If overflowing bottom, flip above
        targetTop = bubbleRect.top - CARD_HEIGHT - GAP;
      }
    } else {
      // Default: prefer above bubble
      targetTop = bubbleRect.top - CARD_HEIGHT - GAP;
      if (targetTop < EDGE_PAD) {
        targetTop = bubbleRect.bottom + GAP;
      }
    }

    // Strict clamp: top = clamp(targetTop, 8, windowHeight - cardHeight - 8)
    const clampedTop = Math.max(EDGE_PAD, Math.min(winH - CARD_HEIGHT - EDGE_PAD, targetTop));

    setTooltipPos({ left: clampedLeft, top: clampedTop });
  }, []);

  const domRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const nodesRef = useRef<DynamicBubbleNode[]>([]);
  const simulationRef = useRef<Simulation<DynamicBubbleNode, undefined> | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const isPausedRef = useRef(false);

  // Handle Resize and Mobile Detection
  useEffect(() => {
    const updateSize = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const mobile = isTouchOrMobileDevice();
      setIsMobile(mobile);

      const width = Math.max(rect.width || window.innerWidth, 320);
      const height = mobile
        ? Math.max(window.innerHeight - 175, 520)
        : Math.max(window.innerHeight - 110, 680);

      setContainerSize({ width, height });
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Handle tab visibility to pause simulation when backgrounded
  useEffect(() => {
    const handleVisibility = () => {
      isPausedRef.current = document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  // Calculate timeframe change
  const getChangeVal = useCallback((coin: CryptoCoin): number => {
    switch (timeFrame) {
      case 'hour':
        return coin.price_change_percentage_1h_in_currency ?? coin.price_change_percentage_24h * 0.15;
      case 'day':
      case 'day_marketcap':
        return coin.price_change_percentage_24h ?? 0;
      case 'week':
        return coin.price_change_percentage_7d_in_currency ?? coin.price_change_percentage_24h * 1.5;
      case 'month':
        return coin.price_change_percentage_30d_in_currency ?? coin.price_change_percentage_24h * 2.8;
      case 'year':
        return coin.price_change_percentage_1y_in_currency ?? coin.price_change_percentage_24h * 4.2;
      default:
        return coin.price_change_percentage_24h ?? 0;
    }
  }, [timeFrame]);

  // FIX: Dynamic Bubble Sizing & Random Scatter Across Entire Container (No Center Cluster)
  useEffect(() => {
    if (!coins || coins.length === 0) return;

    const { width, height } = containerSize;
    const mobile = width < 768;
    const top100 = coins.slice(0, 100);

    // 1. DYNAMIC SIZE: Auto recalculate on load and resize so bubbles fill the container area
    // Target filling ~64% of total rectangular container area with gaps
    const targetArea = (mobile ? 0.60 : 0.65) * width * height;

    // Calculate market cap log bounds for fair log-scale sizing
    let minLog = Infinity;
    let maxLog = -Infinity;

    top100.forEach((c, i) => {
      const mc = Math.max(1e7, c.market_cap || (100 - i) * 1e8);
      const l = Math.log10(mc);
      if (l < minLog) minLog = l;
      if (l > maxLog) maxLog = l;
    });

    if (minLog === maxLog) {
      minLog = 8.5;
      maxLog = 12.3;
    }

    // Minimum radius: 36px on mobile (min radius 18), 44px on desktop (min radius 22)
    const minRadiusFloor = mobile ? 18 : 22;

    // Raw proportional radii
    const rawRadii = top100.map(coin => {
      const mc = Math.max(1e7, coin.market_cap || 1e8);
      const logMC = Math.log10(mc);
      const norm = Math.max(0, Math.min(1, (logMC - minLog) / (maxLog - minLog || 1)));
      // Base raw radius
      return minRadiusFloor + Math.pow(norm, 1.4) * (mobile ? 42 : 68);
    });

    // Auto-scale factor to fill the container area without cut-off
    const rawSumArea = rawRadii.reduce((acc, r) => acc + Math.PI * r * r, 0);
    const scaleFactor = Math.sqrt(targetArea / (rawSumArea || 1));

    // 2. RANDOM SCATTER: Place 100 bubbles at RANDOM scattered positions across ENTIRE container, not from center
    const initialNodes: DynamicBubbleNode[] = top100.map((coin, index) => {
      let r = rawRadii[index] * scaleFactor;
      // Clamp bounds per user spec
      r = Math.max(minRadiusFloor, Math.min(mobile ? 58 : 92, r));
      const diameter = Math.round(r * 2);

      const changeVal = getChangeVal(coin);
      const isPositive = changeVal >= 0;

      // Random scattered start position across the entire container width and height
      const pad = r + 8;
      const x = pad + Math.random() * (width - 2 * pad);
      const y = pad + Math.random() * (height - 2 * pad);

      // Random initial slow drift velocity:
      const vx = (Math.random() - 0.5) * 0.2;
      const vy = (Math.random() - 0.5) * 0.2;

      return {
        id: coin.id,
        coin,
        diameter,
        r,
        changeVal,
        isPositive,
        x,
        y,
        vx,
        vy,
      };
    });

    nodesRef.current = initialNodes;
    setBubbleNodes([...initialNodes]);

    // Clean up previous simulation
    if (simulationRef.current) {
      simulationRef.current.stop();
    }

    const centerX = width / 2;
    const centerY = height / 2;

    // FIX 1, 4, 5:
    // - forceX and forceY strength from 0.015 to 0.001 (remove center attraction!)
    // - forceCollide radius + 6, strength 0.7 (keep 6px gap, no overlap, no hiding!)
    // - forceManyBody -25 (negative repulsion to spread bubbles into corners!)
    // - velocityDecay 0.35, max speed 0.3px/frame, soft wall bounce
    const sim = forceSimulation<DynamicBubbleNode>(initialNodes)
      .velocityDecay(0.35)
      .alpha(0.8)
      .alphaTarget(0.05) // Keep simulation slowly active so bubbles float freely
      .alphaDecay(0.005)
      .force(
        'charge',
        forceManyBody<DynamicBubbleNode>().strength(-25) // Negative repulsion pushes into corners!
      )
      .force(
        'collide',
        forceCollide<DynamicBubbleNode>((d: DynamicBubbleNode) => d.r + 6) // 6px gap, no overlap
          .strength(0.7)
          .iterations(2)
      )
      .force('x', forceX<DynamicBubbleNode>(centerX).strength(0.001)) // Center attraction: 0.001
      .force('y', forceY<DynamicBubbleNode>(centerY).strength(0.001)); // Center attraction: 0.001

    // Quick initial warm-up ticks to resolve any immediate overlaps
    for (let i = 0; i < 30; ++i) {
      sim.tick();
    }

    simulationRef.current = sim;

    // Free, Slow Movement Animation Loop (max speed 0.3px/frame, soft wall bounce)
    const tick = () => {
      if (!isPausedRef.current) {
        const nodes = nodesRef.current;
        const maxSpeed = 0.3; // User rule: max speed 0.3px/frame

        for (let i = 0; i < nodes.length; i++) {
          const d = nodes[i];

          // Gentle ambient float impulse
          if (Math.random() < 0.03) {
            d.vx += (Math.random() - 0.5) * 0.04;
            d.vy += (Math.random() - 0.5) * 0.04;
          }

          // Clamp max speed: 0.3px/frame
          const currentSpeed = Math.hypot(d.vx, d.vy);
          if (currentSpeed > maxSpeed) {
            d.vx = (d.vx / currentSpeed) * maxSpeed;
            d.vy = (d.vy / currentSpeed) * maxSpeed;
          }

          // Soft wall bounce: stay inside frame, reverse velocity gently
          const pad = d.r + 2;
          if (d.x < pad) {
            d.x = pad;
            d.vx = Math.abs(d.vx) * 0.7;
          } else if (d.x > width - pad) {
            d.x = width - pad;
            d.vx = -Math.abs(d.vx) * 0.7;
          }

          if (d.y < pad) {
            d.y = pad;
            d.vy = Math.abs(d.vy) * 0.7;
          } else if (d.y > height - pad) {
            d.y = height - pad;
            d.vy = -Math.abs(d.vy) * 0.7;
          }

          // Apply smooth GPU transform to DOM element
          const el = domRefs.current.get(d.id);
          if (el) {
            el.style.transform = `translate3d(${d.x - d.r}px, ${d.y - d.r}px, 0)`;
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (sim) sim.stop();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [coins, containerSize, getChangeVal]);

  const query = searchQuery.trim().toLowerCase();
  const hasSearch = query.length > 0;

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden select-none"
      style={{
        backgroundColor: 'transparent',
        height: isMobile ? 'calc(100vh - 175px)' : 'calc(100vh - 110px)',
        minHeight: isMobile ? '520px' : '680px',
      }}
    >
      {/* 100 Dynamically Sized, Freely Floating Bubbles (No Clustering, 6px Gap, Filling Entire Viewport) */}
      {bubbleNodes.map(node => {
        const { id, coin, diameter, changeVal, isPositive, r } = node;

        // Visuals: Perfect Circle + Glow
        // Background: #0A0A0A with inner gradient
        // Border: 2.5px solid #00FF88 (green) or #FF2D2D (red)
        // Outer glow shadow + soft drop shadow
        const isClassic = theme === 'classic';
        const borderColor = isPositive 
          ? (isClassic ? '#00E676' : '#00F0FF') 
          : (isClassic ? '#FF1E1E' : '#FF007F');
        const glowColor = isPositive 
          ? (isClassic ? 'rgba(0, 230, 118,' : 'rgba(0, 240, 255,') 
          : (isClassic ? 'rgba(255, 30, 30,' : 'rgba(255, 0, 127,');
        const defaultBoxShadow = `0 0 16px 2px ${glowColor} 0.45), 0 4px 16px rgba(0, 0, 0, 0.8)`;
        const hoverBoxShadow = `0 0 24px 4px ${glowColor} 0.70), 0 6px 22px rgba(0, 0, 0, 0.95)`;

        // Text Hierarchy inside bubble:
        // Top: coin logo (28% of bubble size, circular white background)
        // Middle: TICKER in bold white, Inter font, centered
        // Bottom: % change in white, centered
        // If diameter < 56px, hide % and show only TICKER
        const logoSize = Math.max(14, Math.min(38, Math.round(diameter * 0.28)));
        const tickerFontSize = Math.max(11, Math.min(18, Math.round(diameter * 0.16)));
        const pctFontSize = Math.max(10, Math.min(13, Math.round(tickerFontSize * 0.82)));
        const cleanSymbol = getCleanSymbol(coin.symbol, diameter);

        const showPercent = diameter >= 56;
        const showSymbol = diameter >= 38;

        const isHovered = !isMobile && hoveredId === id;

        // Search highlight
        const matchesSearch =
          !hasSearch ||
          coin.symbol.toLowerCase().includes(query) ||
          coin.name.toLowerCase().includes(query);

        const opacity = hasSearch ? (matchesSearch ? 1 : 0.12) : 1;

        return (
          <div
            key={id}
            ref={el => {
              if (el) domRefs.current.set(id, el);
              else domRefs.current.delete(id);
            }}
            onClick={() => {
              // On mobile & laptop: opens detail panel / coin view
              // Clear any hover state so card never lingers on mobile touch
              setHoveredId(null);
              setHoveredBubble(null);
              onSelectCoin(coin);
            }}
            onMouseEnter={e => {
              if (isMobile || isTouchOrMobileDevice()) return;
              updateTooltipPosition(e.currentTarget);
              setHoveredId(id);
              setHoveredBubble(node);
            }}
            onMouseMove={e => {
              if (isMobile || isTouchOrMobileDevice()) return;
              updateTooltipPosition(e.currentTarget);
            }}
            onMouseLeave={() => {
              setHoveredId(null);
              setHoveredBubble(null);
            }}
            className="absolute top-0 left-0 flex flex-col items-center justify-center cursor-pointer will-change-transform rounded-full group"
            style={{
              width: `${diameter}px`,
              height: `${diameter}px`,
              opacity,
              zIndex: isHovered ? 50 : matchesSearch ? 20 : 10,
              transform: `translate3d(${node.x - r}px, ${node.y - r}px, 0)`,
              transition: 'opacity 200ms ease',
            }}
          >
            {/* Bubble Circle with exact Bloopa radial inner gradient + glow */}
            <div
              className={`absolute inset-0 rounded-full transition-all duration-300 ${
                isHovered ? 'scale-105' : 'scale-100'
              }`}
              style={{
                background:
                  'radial-gradient(circle at 35% 30%, rgba(255, 255, 255, 0.08), #0A0A0A 60%, #050505 100%)',
                border: `2.5px solid ${borderColor}`,
                boxShadow: isHovered ? hoverBoxShadow : defaultBoxShadow,
              }}
            />

            {/* Bubble Internal Content (strictly centered, never touches border) */}
            <div
              className="relative z-10 flex flex-col items-center justify-center text-center p-1 w-full h-full pointer-events-none select-none"
              style={{ maxWidth: '82%' }}
            >
              {/* Coin Logo (small circular icon, 28% of bubble size) */}
              <div
                className="rounded-full bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-sm"
                style={{
                  width: `${logoSize}px`,
                  height: `${logoSize}px`,
                  border: '1.5px solid #ffffff',
                  marginBottom: showSymbol ? (diameter >= 70 ? '3px' : '1px') : '0px',
                }}
              >
                <img
                  src={coin.image}
                  alt={coin.name}
                  className="w-full h-full object-contain rounded-full"
                  onError={e => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>

              {/* TICKER: bold white, Inter font, centered */}
              {showSymbol && (
                <span
                  className="font-bold text-bubble-white font-sans text-center truncate leading-tight"
                  style={{
                    fontSize: `${tickerFontSize}px`,
                    maxWidth: '100%',
                    textShadow: '0 2px 5px rgba(0,0,0,0.9)',
                  }}
                  title={coin.symbol}
                >
                  {cleanSymbol}
                </span>
              )}

              {/* % Change in white, centered */}
              {showPercent && (
                <span
                  className="font-medium text-bubble-white font-sans text-center truncate leading-tight mt-0.5"
                  style={{
                    fontSize: `${pctFontSize}px`,
                    maxWidth: '100%',
                    textShadow: '0 2px 5px rgba(0,0,0,0.9)',
                  }}
                >
                  {formatPercentage(changeVal)}
                </span>
              )}
            </div>
          </div>
        );
      })}

      {/* Smart Tooltip Detail Card: Laptop/Desktop ONLY (width >= 768px + mouse device), viewport-clamped */}
      {!isMobile && hoveredBubble && (
        <div
          className="fixed pointer-events-none transition-all duration-150 ease-out font-sans"
          style={{
            zIndex: 9999,
            backgroundColor: '#111111',
            border: '1px solid #2A2A2A',
            borderRadius: '12px',
            padding: '12px',
            width: '260px',
            maxWidth: '260px',
            left: `${tooltipPos.left}px`,
            top: `${tooltipPos.top}px`,
            boxShadow: `0 10px 30px rgba(0,0,0,0.85), 0 0 16px ${
              hoveredBubble.isPositive ? 'rgba(0,255,136,0.32)' : 'rgba(255,45,45,0.32)'
            }`,
          }}
        >
          {/* Coin Name + Symbol + Rank */}
          <div className="flex items-center gap-2 mb-1.5 overflow-hidden">
            <span className="font-bold text-white text-sm truncate">{hoveredBubble.coin.name}</span>
            <span className="text-[11px] uppercase font-mono text-neutral-400 shrink-0">
              ({hoveredBubble.coin.symbol})
            </span>
            <span className="text-[11px] font-mono text-neutral-500 shrink-0">
              #{hoveredBubble.coin.market_cap_rank || '—'}
            </span>
          </div>

          {/* Price + 24h % */}
          <div className="flex items-center gap-3 font-mono">
            <span className="font-bold text-white text-base">
              {formatCurrency(hoveredBubble.coin.current_price)}
            </span>
            <span
              className={`font-bold text-sm ${
                hoveredBubble.changeVal >= 0 ? 'text-[#00FF88]' : 'text-[#FF2D2D]'
              }`}
            >
              {formatPercentage(hoveredBubble.changeVal)}
            </span>
          </div>

          {/* Market Cap + Volume */}
          <div className="flex items-center justify-between text-[11px] text-neutral-400 mt-1.5 pt-1.5 border-t border-[#1e1e1e]">
            <span>Cap: {formatCompactNumber(hoveredBubble.coin.market_cap)}</span>
            <span>Vol: {formatCompactNumber(hoveredBubble.coin.total_volume)}</span>
          </div>
        </div>
      )}
    </div>
  );
};
