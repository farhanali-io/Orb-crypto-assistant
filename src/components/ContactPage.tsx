import React, { useState } from 'react';
import { ArrowLeft, ArrowUpRight, Circle, Mail, Clock, Share2, Twitter, Instagram, Facebook, CheckCircle2 } from 'lucide-react';

interface ContactPageProps {
  onBack: () => void;
}

export const ContactPage: React.FC<ContactPageProps> = ({ onBack }) => {
  const [formData, setFormData] = useState({ name: '', email: '', subject: 'General question', message: '' });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) return;
    
    // Simulate form submission
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      setFormData({ name: '', email: '', subject: 'General question', message: '' });
    }, 4000);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-slate-300 font-sans pb-24">
      {/* Background Grid Pattern */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-[0.03]" 
        style={{ 
          backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', 
          backgroundSize: '40px 40px' 
        }} 
      />

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        
        {/* Back Button */}
        <div className="pt-8 pb-12">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#111] hover:bg-[#1a1a1a] text-slate-400 hover:text-white border border-[#222] transition-all text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to App</span>
          </button>
        </div>

        {/* Hero Section */}
        <div className="mb-20 max-w-4xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#111] border border-[#222] mb-8">
            <Circle className="w-2.5 h-2.5 fill-emerald-500 text-emerald-500" />
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-slate-400">
              Contact Orbix
            </span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white uppercase tracking-tight leading-[1.1] mb-8">
            Contact Orbix
          </h1>
          
          <p className="text-base sm:text-lg text-slate-400 leading-relaxed max-w-2xl mb-8">
            Have a question, a correction, or an idea for Orbix? Send us a message and a real person will read it.
          </p>

          <a 
            href="mailto:hello@orbix.live"
            className="inline-flex items-center gap-2 text-sm font-medium text-white hover:text-emerald-400 transition-colors border-b border-white/20 hover:border-emerald-400 pb-1"
          >
            Email Us Directly
            <ArrowUpRight className="w-4 h-4" />
          </a>
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-gradient-to-r from-[#222] via-[#222] to-transparent mb-20" />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-24">
          
          {/* Left Column: Info */}
          <div>
            <div className="inline-flex items-center gap-2 mb-6">
              <Circle className="w-2.5 h-2.5 fill-white text-white" />
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-slate-400">
                Get In Touch
              </span>
            </div>
            
            <h2 className="text-3xl sm:text-4xl font-bold text-white uppercase tracking-tight mb-6">
              Send Us A Message
            </h2>
            
            <p className="text-sm sm:text-base text-slate-400 leading-relaxed mb-10 max-w-sm">
              Questions, corrections and ideas are all welcome. Fill in the form, or reach us directly below.
            </p>

            <div className="space-y-8">
              {/* Email */}
              <div className="flex items-start gap-5">
                <div className="w-12 h-12 rounded-full border border-[#333] flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5 text-slate-300" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">Email Orbix</h3>
                  <a href="mailto:hello@orbix.live" className="text-sm text-slate-400 hover:text-emerald-400 transition-colors">hello@orbix.live</a>
                </div>
              </div>

              {/* Response Time */}
              <div className="flex items-start gap-5">
                <div className="w-12 h-12 rounded-full border border-[#333] flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 text-slate-300" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">Response Time</h3>
                  <p className="text-sm text-slate-400">We reply to every message within 24 hours.</p>
                </div>
              </div>

              {/* Socials */}
              <div className="flex items-start gap-5">
                <div className="w-12 h-12 rounded-full border border-[#333] flex items-center justify-center shrink-0">
                  <Share2 className="w-5 h-5 text-slate-300" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Follow Orbix</h3>
                  <div className="flex items-center gap-4 text-slate-400">
                    <a href="#" className="hover:text-white transition-colors"><Twitter className="w-4 h-4" /></a>
                    <a href="#" className="hover:text-white transition-colors"><Instagram className="w-4 h-4" /></a>
                    <a href="#" className="hover:text-white transition-colors"><Facebook className="w-4 h-4" /></a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Form */}
          <div className="bg-[#0a0a0a] border border-[#222] p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-bold tracking-wider text-slate-400 uppercase mb-2">Name</label>
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Your name"
                    className="w-full bg-[#111] border border-[#333] rounded px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-slate-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold tracking-wider text-slate-400 uppercase mb-2">Email</label>
                  <input 
                    type="email" 
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="you@example.com"
                    className="w-full bg-[#111] border border-[#333] rounded px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-slate-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold tracking-wider text-slate-400 uppercase mb-2">Subject</label>
                <select
                  value={formData.subject}
                  onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  className="w-full bg-[#111] border border-[#333] rounded px-3 py-2.5 text-sm text-white focus:outline-none focus:border-slate-500 transition-colors appearance-none"
                >
                  <option value="General question">General question</option>
                  <option value="Report a bug">Report a bug</option>
                  <option value="Feature request">Feature request</option>
                  <option value="Data correction">Data correction</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold tracking-wider text-slate-400 uppercase mb-2">Message</label>
                <textarea 
                  required
                  rows={5}
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  placeholder="Tell us what is on your mind. If you are reporting a wrong price or a missing coin, include the coin name and the page link."
                  className="w-full bg-[#111] border border-[#333] rounded px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-slate-500 transition-colors resize-none"
                />
              </div>

              <div className="pt-2">
                <button 
                  type="submit"
                  disabled={isSubmitted}
                  className="inline-flex items-center gap-2 text-sm font-medium text-white hover:text-emerald-400 transition-colors group disabled:opacity-50"
                >
                  {isSubmitted ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      Message Sent Successfully!
                    </>
                  ) : (
                    <>
                      <Circle className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                      Send Message
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>

        </div>
      </div>
    </div>
  );
};
