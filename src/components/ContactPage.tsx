import React, { useState } from 'react';
import { ArrowLeft, Mail, Send, CheckCircle2, MessageSquare, Clock } from 'lucide-react';

interface ContactPageProps {
  onBack: () => void;
}

export const ContactPage: React.FC<ContactPageProps> = ({ onBack }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;

    setIsSubmitted(true);
    setToastMessage('Message sent! Our support team will get back to you shortly.');
    setName('');
    setEmail('');
    setMessage('');

    setTimeout(() => {
      setIsSubmitted(false);
    }, 4000);

    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-8 text-white bg-black min-h-[calc(100vh-110px)] animate-in fade-in duration-150 relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl bg-[#111111] border border-emerald-500/40 text-white shadow-2xl animate-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Back Button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#111111] hover:bg-[#1a1a1a] text-neutral-300 hover:text-white border border-[#222222] transition-all text-xs font-semibold mb-8 active:scale-95"
      >
        <ArrowLeft className="w-4 h-4 text-emerald-400" />
        <span>Back to Heatmap</span>
      </button>

      {/* Hero Header */}
      <div className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-2">
          Contact Us
        </h1>
        <p className="text-sm text-neutral-400">
          Have feedback, integration inquiries, or coin listing questions? Get in touch with the Orbix team.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Contact Information & Channels */}
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-[#0a0a0a] border border-[#1c1c1c]">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-[#141414] text-emerald-400">
                <Mail className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">Official Email</h3>
            </div>
            <a
              href="mailto:hello@orbix.live"
              className="text-base font-mono font-semibold text-white hover:text-emerald-400 transition-colors"
            >
              hello@orbix.live
            </a>
            <p className="text-xs text-neutral-500 mt-2">
              For direct partnerships and API inquiries.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#0a0a0a] border border-[#1c1c1c]">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-[#141414] text-sky-400">
                <Clock className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">Response Window</h3>
            </div>
            <p className="text-sm text-white font-medium">Within 24 Hours</p>
            <p className="text-xs text-neutral-500 mt-1">
              Active around the clock across all timezones.
            </p>
          </div>
        </div>

        {/* Contact Form */}
        <div className="md:col-span-2 p-6 sm:p-8 rounded-2xl bg-[#090909] border border-[#1a1a1a]">
          <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-emerald-400" />
            <span>Send a Direct Message</span>
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
                Your Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Satoshi Nakamoto"
                className="w-full px-4 py-2.5 rounded-xl bg-black border border-[#222222] focus:border-emerald-500 text-sm text-white placeholder-neutral-600 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="satoshi@domain.com"
                className="w-full px-4 py-2.5 rounded-xl bg-black border border-[#222222] focus:border-emerald-500 text-sm text-white placeholder-neutral-600 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
                Message
              </label>
              <textarea
                required
                rows={4}
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Describe your inquiry or question..."
                className="w-full px-4 py-2.5 rounded-xl bg-black border border-[#222222] focus:border-emerald-500 text-sm text-white placeholder-neutral-600 focus:outline-none transition-all resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitted}
              className="w-full py-3 px-6 rounded-xl bg-white hover:bg-neutral-200 text-black text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitted ? 'Sending...' : 'Send Message'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
