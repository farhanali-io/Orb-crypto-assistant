import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, Bot, User, ArrowDown } from 'lucide-react';
import { CryptoCoin } from '../types/crypto';
import { askOrbAssistant, ChatMessage } from '../services/askOrbService';

interface AskOrbChatProps {
  isOpen: boolean;
  onClose: () => void;
  isMobile: boolean;
  coins: CryptoCoin[];
}

const QUICK_CHIPS = [
  'Top Gainers?',
  'Why BTC down?',
  'What is Market Cap?',
];

export const AskOrbChat: React.FC<AskOrbChatProps> = ({
  isOpen,
  onClose,
  isMobile,
  coins,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: "Hi! I'm Ask Orb, your live crypto AI assistant.\nAsk me about any coin, market movers, or 24h stats.\nI provide instant answers using live CoinGecko data only.\nNot financial advice.",
      timestamp: Date.now(),
    },
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      // Focus input on laptop
      if (!isMobile) {
        setTimeout(() => inputRef.current?.focus(), 150);
      }
    }
  }, [isOpen, messages, isMobile]);

  if (!isOpen) return null;

  const handleSend = async (questionText?: string) => {
    const textToSend = (questionText || inputVal).trim();
    if (!textToSend || isLoading) return;

    setInputVal('');

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const answer = await askOrbAssistant(textToSend, coins);
      const botMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: answer,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, botMsg]);
    } catch {
      const errorMsg: ChatMessage = {
        id: `error-${Date.now()}`,
        sender: 'assistant',
        text: 'Unable to retrieve live market data right now.\nPlease check your connection and try asking again.\nWe track the Top 100 cryptocurrencies continuously.\nNot financial advice.',
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Mobile Backdrop: Dimmed background to close on click */}
      {isMobile && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[140] animate-in fade-in duration-200"
        />
      )}

      {/* Main Chat Container */}
      <div
        className={`fixed z-[150] flex flex-col bg-[#000000] border-[#2A2A2A] text-white overflow-hidden shadow-2xl transition-all duration-300 font-sans ${
          isMobile
            ? 'inset-x-0 bottom-0 h-[75vh] border-t rounded-t-[22px]'
            : 'bottom-6 right-6 w-[380px] h-[70vh] max-h-[640px] border rounded-2xl'
        }`}
        style={{
          boxShadow: isMobile
            ? '0 -10px 40px rgba(0, 0, 0, 0.95), 0 0 20px rgba(0, 255, 136, 0.12)'
            : '0 16px 50px rgba(0, 0, 0, 0.95), 0 0 24px rgba(0, 255, 136, 0.18)',
        }}
      >
        {/* Mobile Pull Handle */}
        {isMobile && (
          <div className="w-full pt-2.5 pb-1 flex justify-center shrink-0">
            <div className="w-10 h-1 bg-[#333333] rounded-full" />
          </div>
        )}

        {/* Chat Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#0A0A0A] border-b border-[#1E1E1E] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-[#00FF88]/15 border border-[#00FF88]/40 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-[#00FF88]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-white text-sm">Ask Orb - AI Assistant</span>
                <span className="w-2 h-2 rounded-full bg-[#00FF88] animate-pulse" />
              </div>
              <span className="text-[10px] text-neutral-400 font-mono">Live CoinGecko Data</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-[#1A1A1A] transition-colors cursor-pointer"
            title="Close Chat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Chips Row */}
        <div className="px-3 py-2 bg-[#050505] border-b border-[#181818] flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0">
          <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold pl-1 shrink-0">
            Quick:
          </span>
          {QUICK_CHIPS.map(chip => (
            <button
              key={chip}
              onClick={() => handleSend(chip)}
              disabled={isLoading}
              className="px-2.5 py-1 text-xs rounded-full bg-[#141414] hover:bg-[#202020] hover:text-[#00FF88] border border-[#262626] hover:border-[#00FF88]/40 text-neutral-300 font-medium whitespace-nowrap transition-all shrink-0 cursor-pointer disabled:opacity-50"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-[#000000] scrollbar-thin scrollbar-thumb-neutral-800">
          {messages.map(msg => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-6 h-6 rounded-full bg-[#161616] border border-[#2A2A2A] flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5 text-[#00FF88]" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-xs leading-relaxed ${
                    isUser
                      ? 'bg-[#1C1C1C] text-white border border-[#2E2E2E] rounded-br-none'
                      : 'bg-[#0E0E0E] text-neutral-200 border-l-2 border-l-[#00FF88] border-t border-r border-b border-[#1F1F1F] rounded-bl-none shadow-sm'
                  }`}
                >
                  {msg.text.split('\n').map((line, idx) => {
                    const isDisclaimer = line.trim().toLowerCase() === 'not financial advice.';
                    return (
                      <p
                        key={idx}
                        className={`${idx > 0 ? 'mt-1' : ''} ${
                          isDisclaimer
                            ? 'text-[10px] font-mono text-neutral-500 italic pt-1 border-t border-[#1C1C1C] mt-2'
                            : ''
                        }`}
                      >
                        {line}
                      </p>
                    );
                  })}
                </div>
                {isUser && (
                  <div className="w-6 h-6 rounded-full bg-[#242424] border border-[#3A3A3A] flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5 text-neutral-300" />
                  </div>
                )}
              </div>
            );
          })}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex gap-2.5 justify-start">
              <div className="w-6 h-6 rounded-full bg-[#161616] border border-[#2A2A2A] flex items-center justify-center shrink-0">
                <Bot className="w-3.5 h-3.5 text-[#00FF88]" />
              </div>
              <div className="bg-[#0E0E0E] border-l-2 border-l-[#00FF88] border border-[#1F1F1F] rounded-xl px-3.5 py-2 text-xs flex items-center gap-1.5 text-neutral-400">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00FF88] animate-ping" />
                <span>Ask Orb is analyzing live CoinGecko data...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Bottom Input Area */}
        <div className="p-3 bg-[#0A0A0A] border-t border-[#1E1E1E] shrink-0">
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about any coin..."
                disabled={isLoading}
                className="w-full h-10 pl-3.5 pr-3 bg-[#121212] hover:bg-[#161616] focus:bg-[#161616] border border-[#262626] focus:border-[#00FF88]/60 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none transition-all disabled:opacity-50"
              />
            </div>
            <button
              type="submit"
              disabled={!inputVal.trim() || isLoading}
              className="w-10 h-10 rounded-xl bg-[#00FF88] hover:bg-[#00E57A] disabled:bg-[#1A1A1A] text-black disabled:text-neutral-600 font-bold flex items-center justify-center shrink-0 transition-all cursor-pointer disabled:cursor-not-allowed shadow-[0_0_12px_rgba(0,255,136,0.3)] disabled:shadow-none"
              title="Send Message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </>
  );
};
