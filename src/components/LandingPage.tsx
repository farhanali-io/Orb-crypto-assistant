import React, { useRef, useState, useEffect } from 'react';
import gsap from 'gsap';
import { Flame, Rocket, ShieldAlert, Crosshair } from 'lucide-react';

interface LandingPageProps {
  onLaunch: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLaunch }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const uiRef = useRef<HTMLDivElement>(null);
  const hudRef = useRef<HTMLDivElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  
  const [isLaunching, setIsLaunching] = useState(false);
  const hasLiftedOff = useRef(false);

  // --- 1. VIDEO TIMING (5s Loop & 3s Launch) ---
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.play().catch(() => console.log("Autoplay blocked"));

    const handleTimeUpdate = () => {
      if (!isLaunching) {
        if (video.currentTime >= 4.9) {
          video.currentTime = 0; 
        }
      } else {
        if (video.currentTime >= 3 && !hasLiftedOff.current) {
          hasLiftedOff.current = true;
          
          video.pause(); // Freeze the video

          const tl = gsap.timeline({ onComplete: onLaunch });

          // --- PROFESSIONAL TRANSITION: DEEP ZOOM INTO THE EXHAUST ---
          // Instead of sliding up and showing black, we zoom the camera into the fire.
          tl.to(video, {
            scale: 3, // Massive zoom
            filter: 'blur(12px) brightness(2.5)', // Motion blur + bright exhaust
            duration: 1.2,
            ease: 'power3.in'
          });

          // Screen flash right as the zoom gets intense
          tl.to(flashRef.current, {
            opacity: 1,
            duration: 0.5,
            ease: 'power2.inOut'
          }, "-=0.6");
        }
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, [isLaunching, onLaunch]);

  // --- 2. CLICK HANDLER ---
  const handleLaunch = () => {
    if (isLaunching) return;
    setIsLaunching(true);

    const video = videoRef.current;
    if (!video) return;

    video.currentTime = 0;
    video.play().catch(e => console.warn('Video play error', e));

    // Fade out UI and HUD instantly
    gsap.to(uiRef.current, { opacity: 0, y: 50, duration: 0.5, ease: 'power2.in' });
    gsap.to(hudRef.current, { opacity: 0, duration: 0.5 });
    gsap.to('.video-overlay', { opacity: 0, duration: 0.5 });

    // Heavy engine rumble
    gsap.to(containerRef.current, { x: 8, y: -8, repeat: 40, yoyo: true, duration: 0.05 });
  };

  return (
    <div ref={containerRef} className="fixed inset-0 z-[9999] bg-[#020202] overflow-hidden font-sans">
      
      {/* FULL-SCREEN ROCKET VIDEO */}
      <video
        ref={videoRef}
        src="/hero.mp4" 
        className="absolute inset-0 w-full h-full object-cover origin-center will-change-transform"
        playsInline
        muted 
        preload="auto"
      />

      {/* DARK GRADIENT OVERLAY */}
      <div className="video-overlay absolute inset-0 bg-gradient-to-t from-[#020202] via-[#020202]/60 to-[#020202]/80 z-10" />

      {/* SCI-FI HUD OVERLAYS */}
      <div ref={hudRef} className="absolute inset-0 z-20 pointer-events-none p-6 md:p-12 flex flex-col justify-between opacity-70">
        <div className="flex justify-between items-start font-mono text-[10px] md:text-xs text-[#00FF88] tracking-widest">
          <div className="flex flex-col gap-2">
            <span className="flex items-center gap-2"><Crosshair className="w-4 h-4 animate-pulse" /> LIVE FEED: PAD 39A</span>
            <span>SYS: ONLINE</span>
          </div>
          <div className="flex flex-col gap-2 text-right">
            <span className="flex items-center justify-end gap-2 text-rose-500"><ShieldAlert className="w-4 h-4" /> ENGINE ARMED</span>
            <span>FUEL: 100%</span>
          </div>
        </div>

        <div className="flex justify-between items-end font-mono text-[10px] md:text-xs text-[#00FF88] tracking-widest">
          <div className="flex flex-col gap-1">
            <span>ALTITUDE: 0.00 KM</span>
            <span>VELOCITY: 0 KM/H</span>
          </div>
          <div className="text-right flex flex-col gap-1">
            <span>TELEMETRY ACTIVE</span>
          </div>
        </div>
      </div>

      {/* MAIN UI & BUTTON */}
      <div ref={uiRef} className="absolute inset-0 z-30 flex flex-col items-center justify-end pb-24 px-4 pointer-events-none">
        <div className="text-center pointer-events-auto bg-black/60 backdrop-blur-xl p-8 md:p-10 rounded-3xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)]">
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-4">
            ORBIX <span className="text-[#00FF88]">LIFTOFF</span>
          </h1>
          <p className="text-neutral-400 max-w-md mx-auto text-sm md:text-base mb-8 font-medium">
            The crypto market visualized in zero gravity. Press ignition to begin the launch sequence.
          </p>

          <button
            onClick={handleLaunch}
            disabled={isLaunching}
            className="group relative inline-flex items-center gap-3 px-10 py-4 bg-[#00FF88] text-black font-black text-sm tracking-widest uppercase rounded-full transition-all hover:scale-105 hover:bg-white hover:shadow-[0_0_60px_rgba(0,255,136,0.8)] overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Flame className="w-5 h-5 group-hover:animate-bounce" />
            <span className="relative z-10">{isLaunching ? 'Launching...' : 'Initiate Launch'}</span>
            <Rocket className="w-5 h-5 relative z-10 group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform" />
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/50 to-transparent group-hover:animate-[shimmer_1s_infinite]" />
          </button>
        </div>
      </div>

      {/* LAUNCH FLASH OVERLAY */}
      <div ref={flashRef} className="absolute inset-0 bg-white opacity-0 pointer-events-none z-50 mix-blend-screen" />
    </div>
  );
};
