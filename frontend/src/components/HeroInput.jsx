import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Mic } from 'lucide-react';

export default function HeroInput({ onSubmit, isLoading }) {
  const [prompt, setPrompt] = useState('');

  const sampleChips = [
    { label: '☕ 450 CCD coffee', value: '450 CCD coffee' },
    { label: '💼 25000 salary from tech company', value: '25000 salary from tech company' },
    { label: '🚗 650 Uber cab to office', value: '650 Uber cab to office' },
    { label: '⚡ 2400 electricity bill payment', value: '2400 electricity bill payment' }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;
    onSubmit(prompt.trim());
    setPrompt('');
  };

  const handleChipClick = (val) => {
    setPrompt(val);
  };

  return (
    <section className="mb-12">
      <div className="vercel-card p-6 sm:p-8 rounded-xl border border-white/10 relative overflow-hidden">
        
        {/* HEADER BADGES */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.05em] font-semibold text-neutral-400">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
              Ollama Gemma 2 Local Model
            </span>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-purple-300 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded">
              <Mic className="w-3 h-3" /> Natural Language Input
            </span>
          </div>

          <span className="text-[11px] font-mono text-neutral-400 border border-white/10 px-2 py-0.5 rounded">
            Private & AI Ready
          </span>
        </div>

        {/* HERO TITLE */}
        <h2 className="text-2xl sm:text-3xl font-heading font-bold text-[#FCFBF9] tracking-tight mb-2">
          Natural Language Expense Input
        </h2>
        <p className="text-sm text-neutral-400 mb-6 leading-relaxed font-sans">
          Type transaction updates in natural English or Hinglish. AI will extract the transaction details.
        </p>

        {/* FORM INPUT */}
        <form onSubmit={handleSubmit}>
          <div className="flex flex-col sm:flex-row items-stretch gap-3 bg-[#0A0A0A] p-2 rounded-lg border border-white/15 focus-within:border-white transition-all shadow-inner">
            <div className="flex-1 flex items-center px-3 gap-3">
              <Sparkles className="w-4 h-4 text-neutral-400 shrink-0" />
              <input 
                type="text" 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Type anything... e.g., 'aaj 450 CCD coffee pe spent kiye' or 'got 25000 salary'" 
                className="w-full bg-transparent text-sm sm:text-base text-[#FCFBF9] placeholder-neutral-500 focus:outline-none py-2.5 font-sans"
                disabled={isLoading}
                autoComplete="off"
              />
            </div>
            <motion.button 
              type="submit" 
              disabled={isLoading}
              whileTap={{ scale: 0.98 }}
              className="px-6 py-3 rounded-md bg-white text-black font-semibold text-xs uppercase tracking-[0.05em] hover:bg-neutral-200 transition-all flex items-center justify-center gap-2 shrink-0 disabled:opacity-50 font-sans"
            >
              {isLoading ? (
                <>
                  <span>Parsing AI...</span>
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                </>
              ) : (
                <>
                  <span>Add Expense</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </div>
        </form>

        {/* QUICK CHIPS */}
        <div className="flex flex-wrap items-center gap-2 mt-4 text-xs text-neutral-400">
          <span className="text-[11px] uppercase tracking-[0.05em] font-semibold text-neutral-500 font-sans">Quick Try:</span>
          {sampleChips.map((chip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleChipClick(chip.value)}
              className="sample-chip px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-neutral-300 border border-white/10 transition font-sans"
            >
              {chip.label}
            </button>
          ))}
        </div>

      </div>
    </section>
  );
}
