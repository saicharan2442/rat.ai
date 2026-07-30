import React from 'react';
import { Sparkles, Cpu, Mic, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  onOpenStudio: () => void;
  activePersona: string;
}

export const Header: React.FC<HeaderProps> = ({ onOpenStudio, activePersona }) => {
  return (
    <header className="w-full flex items-center justify-between px-6 py-4 border-b border-cyan-500/20 bg-slate-950/40 backdrop-blur-md z-20">
      {/* Top Left Logo: "rat.ai" in cyan italic script font */}
      <div className="flex items-center gap-3">
        <h1 className="text-2xl sm:text-3xl font-serif italic font-bold text-cyan-300 tracking-wider drop-shadow-[0_0_15px_rgba(0,229,255,0.8)] select-none">
          rat.ai
        </h1>
        <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300">
          <Cpu className="w-3 h-3 text-cyan-400 animate-pulse" />
          Gemini 3.6
        </span>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-xs font-mono text-cyan-300/80 bg-cyan-950/60 px-3 py-1.5 rounded-xl border border-cyan-500/20">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Live AI Voice Engine</span>
        </div>
      </div>
    </header>
  );
};
