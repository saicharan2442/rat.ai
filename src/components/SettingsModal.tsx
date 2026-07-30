import React from 'react';
import { X, Sliders, Volume2, Bot, Sparkles } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  personaName: string;
  setPersonaName: (name: string) => void;
  systemPrompt: string;
  setSystemPrompt: (prompt: string) => void;
  speechRate: number;
  setSpeechRate: (rate: number) => void;
  speechPitch: number;
  setSpeechPitch: (pitch: number) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  personaName,
  setPersonaName,
  systemPrompt,
  setSystemPrompt,
  speechRate,
  setSpeechRate,
  speechPitch,
  setSpeechPitch,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-slate-900 border border-cyan-500/40 rounded-3xl shadow-[0_0_50px_rgba(0,229,255,0.2)] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-cyan-500/20 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <h3 className="text-xl font-bold text-white font-serif italic">Assistant Voice & AI Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-5 text-sm">
          <div>
            <label className="block text-xs font-semibold text-cyan-300 uppercase tracking-wider mb-1.5">
              Assistant Name / Persona
            </label>
            <input
              type="text"
              value={personaName}
              onChange={(e) => setPersonaName(e.target.value)}
              className="w-full bg-slate-950 border border-cyan-500/30 text-cyan-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-cyan-300 uppercase tracking-wider mb-1.5">
              System Persona Prompt Instructions
            </label>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              rows={3}
              className="w-full bg-slate-950 border border-cyan-500/30 text-cyan-100 rounded-xl p-3 text-sm focus:outline-none focus:border-cyan-400"
              placeholder="e.g. You are a helpful AI assistant like Alexa or Character.ai..."
            />
          </div>

          {/* Speech Rate & Pitch sliders */}
          <div className="space-y-4 pt-2 border-t border-slate-800">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-300">Speech Speed: {speechRate}x</label>
              </div>
              <input
                type="range"
                min="0.75"
                max="1.5"
                step="0.05"
                value={speechRate}
                onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 bg-slate-950 h-2 rounded-lg cursor-pointer"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-300">Speech Pitch Tone: {speechPitch}</label>
              </div>
              <input
                type="range"
                min="0.8"
                max="1.3"
                step="0.05"
                value={speechPitch}
                onChange={(e) => setSpeechPitch(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 bg-slate-950 h-2 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400 transition-all text-sm mt-4"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};
