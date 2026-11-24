import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, Maximize2, Minimize2, Plus, Bot } from 'lucide-react';
import { CryptoCoin } from '../types/crypto';
import { askOrbAssistant, ChatMessage } from '../services/askOrbService';

interface Props { isOpen: boolean; onClose: () => void; isMobile: boolean; coins: CryptoCoin[]; }
const clean = (t:string) => t.replace(/not financial advice\.?/gi,'').replace(/\n{3,}/g,'\n\n').trim();

export const AskOrbChat: React.FC<Props> = ({ isOpen, onClose, isMobile, coins }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 'w', sender: 'assistant', text: "Hi! I'm Orb — your live crypto assistant.\n\nAsk me BTC price, top gainers, or any coin.", timestamp: Date.now() }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [loading, setLoading] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const [dragY, setDragY] = useState(0);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [vvHeight, setVvHeight] = useState<number | null>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  
  useEffect(()=>{ endRef.current?.scrollIntoView({behavior:'smooth'}) },[messages]);

  // Keyboard fix: use visualViewport, not 85vh
  useEffect(() => {
    if (!isMobile || !window.visualViewport) return;
    const vv = window.visualViewport;
    const onResize = () => {
      const isOpen = vv.height < window.innerHeight * 0.85;
      setKeyboardOpen(isOpen);
      setVvHeight(vv.height);
      if (isOpen) setDragY(0); // never allow drag while typing
    };
    vv.addEventListener('resize', onResize);
    vv.addEventListener('scroll', onResize);
    return () => { vv.removeEventListener('resize', onResize); vv.removeEventListener('scroll', onResize); };
  }, [isMobile]);

  // touch drag for bottom sheet
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isMobile) return;
    if (keyboardOpen) return;
    if (document.activeElement?.tagName === 'INPUT') return;
    // Only allow drag-to-close if messages are scrolled to top
    if (messagesRef.current && messagesRef.current.scrollTop > 10) return;
    const startY = e.touches[0].clientY;
    const onMove = (ev: TouchEvent) => {
      const delta = ev.touches[0].clientY - startY;
      if (delta > 0) setDragY(delta);
    };
    const onEnd = () => {
      if (dragY > 120) onClose();
      setDragY(0);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
    };
    window.addEventListener('touchmove', onMove);
    window.addEventListener('touchend', onEnd);
  };

  if(!isOpen) return null;
  const send = async (q?: string) => {
    const t = (q || inputVal).trim(); if(!t || loading) return;
    setInputVal(''); setMessages(m=>[...m,{id:`u-${Date.now()}`,sender:'user',text:t,timestamp:Date.now()}]);
    setLoading(true);
    try { const a = await askOrbAssistant(t, coins); setMessages(m=>[...m,{id:`a-${Date.now()}`,sender:'assistant',text:clean(a),timestamp:Date.now()}]); } finally { setLoading(false); }
  };
  const isFull = fullscreen || isMobile;
  return (
    <>
      {isMobile && !fullscreen && <div onClick={onClose} className="fixed inset-0 bg-black/70 z-[140] backdrop-blur-sm" />}
      <div ref={sheetRef} style={isMobile && !fullscreen ? { transform: keyboardOpen ? 'none' : `translateY(${dragY}px)`, transition: dragY === 0 ? 'transform 0.3s' : 'none', height: keyboardOpen && vvHeight ? `${vvHeight}px` : undefined, maxHeight: keyboardOpen ? '100dvh' : undefined } : {}}
        className={`fixed z-[150] flex flex-col bg-[#111111] border border-[#262626] text-white overflow-hidden ${fullscreen ? 'inset-0 w-screen h-[100dvh]' : isMobile ? 'inset-x-0 bottom-0 h-[85dvh] max-h-[100dvh] rounded-t-[24px] shadow-[0_-20px_60px_rgba(0,0,0,0.8)]' : 'bottom-6 right-6 w-[420px] h-[600px] rounded-2xl'}`}>
        {isMobile && !fullscreen && (
          <div onTouchStart={handleTouchStart} className="flex justify-center pt-3 pb-1 shrink-0 cursor-grab active:cursor-grabbing">
            <div className="w-10 h-1.5 rounded-full bg-zinc-700" />
          </div>
        )}
        <div className="h-[56px] px-4 flex items-center justify-between bg-[#0E0E0E] border-b border-[#1E1E1E] shrink-0">
          <div className="flex items-center gap-2.5"><div className="w-8 h-8 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center"><Sparkles className="w-4 h-4 text-emerald-400" /></div><div><div className="flex items-center gap-2"><span className="font-bold text-[14px]">Ask Orb</span><span className="text-emerald-400 text-[10px] flex items-center gap-1"><span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />Live</span></div><div className="text-[10px] text-zinc-500">AI Assistant • CoinGecko Live</div></div></div>
          <div className="flex items-center gap-1.5"><button onClick={()=>setMessages([messages[0]])} className="hidden md:flex items-center gap-1 px-2.5 h-7 rounded-full bg-zinc-800 text-[11px]"><Plus className="w-3 h-3" />New</button>{!isMobile && <button onClick={()=>setFullscreen(!fullscreen)} className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center">{fullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}</button>}<button onClick={onClose} className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center"><X className="w-3.5 h-3.5" /></button></div>
        </div>
        <div ref={messagesRef} className="flex-1 overflow-y-auto bg-[#121212] overscroll-contain"><div className={`${isFull ? 'max-w-3xl mx-auto w-full px-6 py-6' : 'px-4 py-4'} space-y-6`}>
          {messages.map(m=>{
            const isUser=m.sender==='user';
            if(isUser) return <div key={m.id} className="flex justify-end"><div className="max-w-[80%] bg-[#242424] border border-[#2E2E2E] rounded-2xl rounded-br-md px-4 py-2.5 text-[14px]">{m.text}</div></div>;
            return (<div key={m.id} className="flex gap-3"><div className="w-7 h-7 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0"><Sparkles className="w-3.5 h-3.5 text-emerald-400" /></div><div className="flex-1"><div className="flex items-center gap-2 mb-1"><span className="text-[11px] font-semibold text-emerald-400">Orb — AI Assistant</span><span className="text-[10px] text-zinc-500 ml-auto">{new Date(m.timestamp).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span></div><div className="border-l-2 border-emerald-500 pl-4 py-1 text-[14px] leading-relaxed whitespace-pre-wrap">{clean(m.text)}</div><div className="text-[10px] text-zinc-500 mt-2">Sources: Market data • Updated live</div></div></div>);
          })}
          {loading && <div className="flex gap-3"><div className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center"><Bot className="w-3.5 h-3.5 text-emerald-400" /></div><div className="bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-400 flex items-center gap-2"><span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />Analyzing...</div></div>}
          <div ref={endRef} />
        </div></div>
        <div className={`shrink-0 bg-[#0E0E0E] border-t border-[#1E1E1E] ${isFull ? 'p-4 pb-[max(1rem,env(safe-area-inset-bottom))]' : 'p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]'}`}><div className={`${isFull ? 'max-w-3xl mx-auto' : ''}`}><div className="flex items-center gap-2 bg-[#1A1A1A] border border-emerald-500/20 rounded-full px-4 h-[44px]"><input onFocus={()=>{setKeyboardOpen(true); setDragY(0); setTimeout(()=>endRef.current?.scrollIntoView({behavior:'smooth'}),300);}} onBlur={()=>setKeyboardOpen(false)} value={inputVal} onChange={e=>setInputVal(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} placeholder="Ask about crypto, prices, trends..." className="flex-1 bg-transparent outline-none text-[14px] placeholder-zinc-500" /><button onClick={()=>send()} className="w-8 h-8 rounded-full bg-emerald-500 text-black flex items-center justify-center"><Send className="w-3.5 h-3.5" /></button></div><div className="text-[10px] text-zinc-600 text-center mt-2">Orb can make mistakes. Verify important financial information.</div></div></div>
      </div>
    </>
  );
};
