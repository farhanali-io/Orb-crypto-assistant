import React, { useRef, useState, useEffect } from 'react';
import gsap from 'gsap';
import { Flame, Rocket, ShieldAlert, Crosshair } from 'lucide-react';

interface LandingPageProps { onLaunch: () => void; }

export const LandingPage: React.FC<LandingPageProps> = ({ onLaunch }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const uiRef = useRef<HTMLDivElement>(null);
  const hudRef = useRef<HTMLDivElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const [isLaunching, setIsLaunching] = useState(false);
  const hasLiftedOff = useRef(false);

  useEffect(() => {
    audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
  }, []);

  const playSound = (type: 'smoke' | 'thrust' | 'liftoff') => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    if (ctx.state === 'suspended') ctx.resume();

    if (type === 'smoke') {
      const buf = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i=0;i<d.length;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,2);
      const src = ctx.createBufferSource(); src.buffer = buf;
      const f = ctx.createBiquadFilter(); f.type='bandpass'; f.frequency.value=2200;
      const g = ctx.createGain(); g.gain.setValueAtTime(0,ctx.currentTime); g.gain.linearRampToValueAtTime(0.7,ctx.currentTime+0.02); g.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.5);
      src.connect(f).connect(g).connect(ctx.destination); src.start();
    }

    if (type === 'thrust') {
      const osc = ctx.createOscillator(); osc.frequency.setValueAtTime(60,ctx.currentTime); osc.frequency.exponentialRampToValueAtTime(140,ctx.currentTime+1.5);
      const g = ctx.createGain(); g.gain.setValueAtTime(0,ctx.currentTime); g.gain.linearRampToValueAtTime(0.9,ctx.currentTime+0.15); g.gain.exponentialRampToValueAtTime(0.01,ctx.currentTime+1.8);
      osc.connect(g).connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime+1.8);

      const buf = ctx.createBuffer(1, ctx.sampleRate*1.8, ctx.sampleRate);
      const d = buf.getChannelData(0); for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1;
      const src = ctx.createBufferSource(); src.buffer=buf;
      const f = ctx.createBiquadFilter(); f.type='lowpass'; f.frequency.setValueAtTime(500,ctx.currentTime); f.frequency.exponentialRampToValueAtTime(3000,ctx.currentTime+1.2);
      const gg = ctx.createGain(); gg.gain.setValueAtTime(0,ctx.currentTime); gg.gain.linearRampToValueAtTime(0.8,ctx.currentTime+0.2); gg.gain.exponentialRampToValueAtTime(0.01,ctx.currentTime+1.8);
      src.connect(f).connect(gg).connect(ctx.destination); src.start();
    }

    if (type === 'liftoff') {
      const osc = ctx.createOscillator(); osc.frequency.setValueAtTime(150,ctx.currentTime); osc.frequency.exponentialRampToValueAtTime(40,ctx.currentTime+1.0);
      const g = ctx.createGain(); g.gain.setValueAtTime(1,ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.01,ctx.currentTime+1.0);
      osc.connect(g).connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime+1);
    }
  };

  useEffect(() => {
    const video = videoRef.current; if (!video) return;
    video.play().catch(()=>{});
    const handleTimeUpdate = () => {
      if (!isLaunching) { if (video.currentTime >= 4.9) video.currentTime = 0; }
      else {
        if (video.currentTime >= 3 && !hasLiftedOff.current) {
          hasLiftedOff.current = true;
          video.pause();
          playSound('liftoff');
          const tl = gsap.timeline({ onComplete: onLaunch });
          tl.to(video, { scale: 3, filter: 'blur(12px) brightness(2.5)', duration: 1.2, ease: 'power3.in' });
          tl.to(flashRef.current, { opacity: 1, duration: 0.5, ease: 'power2.inOut' }, "-=0.6");
        }
      }
    };
    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, [isLaunching, onLaunch]);

  const handleLaunch = () => {
    if (isLaunching) return;
    setIsLaunching(true);

    // TIMING FIX: Ab sound video shake ke sath synced
    playSound('smoke');
    setTimeout(() => playSound('thrust'), 150);
    if (navigator.vibrate) navigator.vibrate([50,30,100]);

    const video = videoRef.current; if (!video) return;
    video.currentTime = 0; video.play().catch(()=>{});
    gsap.to(uiRef.current, { opacity: 0, y: 50, duration: 0.5, ease: 'power2.in' });
    gsap.to(hudRef.current, { opacity: 0, duration: 0.5 });
    gsap.to('.video-overlay', { opacity: 0, duration: 0.5 });
    gsap.to(containerRef.current, { x: 8, y: -8, repeat: 40, yoyo: true, duration: 0.05, delay: 0.15 });
  };

  return (
    <div ref={containerRef} className="fixed inset-0 z-[9999] bg-[#020202] overflow-hidden font-sans">
      <video ref={videoRef} src="/hero.mp4" className="absolute inset-0 w-full h-full object-cover origin-center" playsInline muted preload="auto" />
      <div className="video-overlay absolute inset-0 bg-gradient-to-t from-[#020202] via-[#020202]/60 to-[#020202]/80 z-10" />
      <div ref={hudRef} className="absolute inset-0 z-20 pointer-events-none p-6 md:p-12 flex flex-col justify-between opacity-70">
        <div className="flex justify-between items-start font-mono text-[10px] md:text-xs text-[#00FF88] tracking-widest">
          <div className="flex flex-col gap-2"><span className="flex items-center gap-2"><Crosshair className="w-4 h-4 animate-pulse" /> LIVE FEED: PAD 39A</span><span>SYS: ONLINE</span></div>
          <div className="flex flex-col gap-2 text-right"><span className="flex items-center justify-end gap-2 text-rose-500"><ShieldAlert className="w-4 h-4" /> ENGINE ARMED</span><span>FUEL: 100%</span></div>
        </div>
        <div className="flex justify-between items-end font-mono text-[10px] md:text-xs text-[#00FF88] tracking-widest"><div className="flex flex-col gap-1"><span>ALTITUDE: 0.00 KM</span><span>VELOCITY: 0 KM/H</span></div><div className="text-right flex flex-col gap-1"><span>TELEMETRY ACTIVE</span></div></div>
      </div>
      <div ref={uiRef} className="absolute inset-0 z-30 flex flex-col items-center justify-end pb-24 px-4 pointer-events-none">
        <div className="text-center pointer-events-auto bg-black/60 backdrop-blur-xl p-8 md:p-10 rounded-3xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)]">
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-4">ORBIX <span className="text-[#00FF88]">LIFTOFF</span></h1>
          <p className="text-neutral-400 max-w-md mx-auto text-sm md:text-base mb-8 font-medium">The crypto market visualized in zero gravity. Press ignition to begin the launch sequence.</p>
          <button onClick={handleLaunch} disabled={isLaunching} className="group relative inline-flex items-center gap-3 px-10 py-4 bg-[#00FF88] text-black font-black text-sm tracking-widest uppercase rounded-full transition-all hover:scale-105 hover:bg-white hover:shadow-[0_0_60px_rgba(0,255,136,0.8)] overflow-hidden disabled:opacity-50">
            <Flame className="w-5 h-5 group-hover:animate-bounce" /><span className="relative z-10">{isLaunching ? 'Launching...' : 'Initiate Launch'}</span><Rocket className="w-5 h-5 relative z-10 group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
      <div ref={flashRef} className="absolute inset-0 bg-white opacity-0 pointer-events-none z-50 mix-blend-screen" />
    </div>
  );
};
