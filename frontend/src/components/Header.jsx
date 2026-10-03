import React from 'react';
import { Calendar, Volume2, VolumeX, AudioLines } from 'lucide-react';

export default function Header({
  selectedMonth,
  selectedYear,
  onMonthChange,
  onYearChange,
  voiceEnabled,
  onVoiceToggle
}) {
  return (
    <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 mb-10 border-b border-white/10">
      {/* BRAND & SUBTITLE */}
      <div className="flex items-center gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center font-heading text-xl font-bold shadow-md shrink-0">
          E
        </div>
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-heading font-bold tracking-tight text-[#FCFBF9]">
              Expense<span className="text-xs tracking-[0.05em] uppercase font-semibold text-neutral-400 ml-1.5 px-2 py-0.5 rounded bg-white/5 border border-white/10 font-sans">AI</span>
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-mono tracking-[0.05em] uppercase bg-white/5 text-neutral-300 border border-white/10 rounded flex items-center gap-1">
              <AudioLines className="w-3 h-3 text-indigo-400" /> ElevenLabs Voice
            </span>
          </div>
          <p class="text-xs text-neutral-400 font-sans tracking-normal mt-0.5">Private monthly financial intelligence powered by open-source AI & ElevenLabs TTS</p>
        </div>
      </div>

      {/* CONTROLS: VOICE TOGGLE & MONTH SELECTOR */}
      <div className="flex items-center gap-3">
        {/* VOICE MUTE / UNMUTE TOGGLE */}
        <button 
          type="button" 
          onClick={onVoiceToggle}
          title="Toggle Voice Feedback Audio"
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition border ${
            voiceEnabled 
              ? 'bg-[#121212] border-emerald-500/30 text-emerald-300' 
              : 'bg-[#121212] border-white/10 text-neutral-400 opacity-80'
          }`}
        >
          {voiceEnabled ? (
            <Volume2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <VolumeX className="w-4 h-4 text-neutral-400" />
          )}
          <span className="font-sans">{voiceEnabled ? 'Voice ON' : 'Voice OFF'}</span>
        </button>

        {/* MONTH & YEAR SELECTOR DROPDOWN */}
        <div className="flex items-center gap-2 bg-[#121212] border border-white/10 px-3 py-1.5 rounded-lg shadow-sm">
          <Calendar className="w-3.5 h-3.5 text-neutral-400" />
          <select 
            value={selectedMonth} 
            onChange={(e) => onMonthChange(parseInt(e.target.value))}
            className="bg-transparent text-xs font-semibold text-[#FCFBF9] uppercase tracking-[0.05em] focus:outline-none cursor-pointer py-1 font-sans"
          >
            <option value={1} className="bg-[#121212] text-[#FCFBF9]">January</option>
            <option value={2} className="bg-[#121212] text-[#FCFBF9]">February</option>
            <option value={3} className="bg-[#121212] text-[#FCFBF9]">March</option>
            <option value={4} className="bg-[#121212] text-[#FCFBF9]">April</option>
            <option value={5} className="bg-[#121212] text-[#FCFBF9]">May</option>
            <option value={6} className="bg-[#121212] text-[#FCFBF9]">June</option>
            <option value={7} className="bg-[#121212] text-[#FCFBF9]">July</option>
            <option value={8} className="bg-[#121212] text-[#FCFBF9]">August</option>
            <option value={9} className="bg-[#121212] text-[#FCFBF9]">September</option>
            <option value={10} className="bg-[#121212] text-[#FCFBF9]">October</option>
            <option value={11} className="bg-[#121212] text-[#FCFBF9]">November</option>
            <option value={12} className="bg-[#121212] text-[#FCFBF9]">December</option>
          </select>
          <span className="text-neutral-600">/</span>
          <select 
            value={selectedYear} 
            onChange={(e) => onYearChange(parseInt(e.target.value))}
            className="bg-transparent text-xs font-semibold text-[#FCFBF9] font-mono focus:outline-none cursor-pointer py-1 pr-1"
          >
            <option value={2025} className="bg-[#121212] text-[#FCFBF9]">2025</option>
            <option value={2026} className="bg-[#121212] text-[#FCFBF9]">2026</option>
            <option value={2027} className="bg-[#121212] text-[#FCFBF9]">2027</option>
          </select>
        </div>
      </div>
    </header>
  );
}
