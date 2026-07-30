import React, { useEffect, useRef } from 'react';
import { Volume2, VolumeX, Radio, Settings2, PhoneCall, PhoneOff, Mic } from 'lucide-react';

interface VoiceControllerProps {
  isVoiceActive: boolean;
  onToggleVoice: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  selectedVoice: string;
  onChangeVoice: (voice: string) => void;
  onOpenSettings: () => void;
  liveTranscript?: string;
  isListening?: boolean;
  isStreaming?: boolean;
  isSpeaking?: boolean;
}

export const VoiceController: React.FC<VoiceControllerProps> = ({
  isVoiceActive,
  onToggleVoice,
  isMuted,
  onToggleMute,
  selectedVoice,
  onChangeVoice,
  onOpenSettings,
  liveTranscript = '',
  isListening = false,
  isStreaming = false,
  isSpeaking = false,
}) => {
  const voices = [
    { id: 'Rat Voice', name: 'Rat Voice (Cyber Robotic)' },
  ];

  const transcriptScrollRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll transcript to far right as new real-time words arrive (moves sentence left)
  useEffect(() => {
    if (transcriptScrollRef.current) {
      transcriptScrollRef.current.scrollLeft = transcriptScrollRef.current.scrollWidth;
    }
  }, [liveTranscript, isListening, isSpeaking, isStreaming, isVoiceActive]);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 w-full p-2.5 px-4 sm:px-5 rounded-2xl bg-cyan-950/50 border border-cyan-500/30 backdrop-blur-md shadow-xl">
      {/* Voice Selection & Settings Controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMute}
          className={`p-2 rounded-xl border transition-all ${
            isMuted
              ? 'bg-rose-500/20 border-rose-400 text-rose-300'
              : 'bg-cyan-500/10 border-cyan-400/30 text-cyan-300 hover:bg-cyan-500/20'
          }`}
          title={isMuted ? 'Unmute Agent' : 'Mute Agent'}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>

        <div className="flex items-center gap-2 text-xs text-cyan-200">
          <Radio className="w-4 h-4 text-cyan-400" />
          <span className="hidden sm:inline font-medium">Voice:</span>
          <select
            value={selectedVoice}
            onChange={(e) => onChangeVoice(e.target.value)}
            className="bg-cyan-950/80 border border-cyan-500/40 text-cyan-100 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-cyan-300"
          >
            {voices.map((v) => (
              <option key={v.id} value={v.id} className="bg-slate-900 text-cyan-100">
                {v.name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={onOpenSettings}
          className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 hover:bg-cyan-500/20 transition-all text-xs flex items-center gap-1"
          title="Open Assistant Settings"
        >
          <Settings2 className="w-4 h-4" />
          <span className="hidden md:inline">Settings</span>
        </button>
      </div>

      {/* Real-time Voice Transcript Display & START/END Button Container */}
      <div className="flex items-center gap-3 flex-1 justify-end min-w-0">
        {/* Real-Time User Voice-to-Text Display (Located directly on the left side of START/END button) */}
        <div 
          ref={transcriptScrollRef}
          className="flex-1 max-w-lg flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-slate-950/85 border border-cyan-500/50 text-xs text-cyan-100 min-w-0 overflow-x-auto whitespace-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden scroll-smooth shadow-inner shadow-cyan-950/80"
        >
          {isVoiceActive ? (
            <div className="flex items-center gap-2.5 min-w-max">
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isSpeaking ? 'bg-cyan-400' : isStreaming ? 'bg-amber-400' : 'bg-emerald-400'} opacity-75`}></span>
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isSpeaking ? 'bg-cyan-400' : isStreaming ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
              </span>
              <div className="font-mono flex items-center gap-1.5 whitespace-nowrap">
                {liveTranscript ? (
                  <span className="text-cyan-200 font-semibold whitespace-nowrap">
                    <span className="text-emerald-400 mr-1 font-bold">You:</span> "{liveTranscript}"
                  </span>
                ) : isStreaming ? (
                  <span className="text-amber-300 animate-pulse font-medium whitespace-nowrap">Rat.ai is thinking...</span>
                ) : isSpeaking ? (
                  <span className="text-cyan-300 animate-pulse font-medium whitespace-nowrap">Rat.ai is speaking...</span>
                ) : isListening ? (
                  <span className="text-emerald-300 animate-pulse font-medium whitespace-nowrap">Listening... Speak into microphone</span>
                ) : (
                  <span className="text-slate-400 font-medium whitespace-nowrap">Continuous Call Active</span>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-slate-400 font-mono text-xs whitespace-nowrap min-w-max">
              <Mic className="w-3.5 h-3.5 text-cyan-400/80 shrink-0 animate-pulse" />
              <span>Tap START for continuous voice call</span>
            </div>
          )}
        </div>

        {/* Continuous Call Phone START / END Button */}
        <button
          onClick={onToggleVoice}
          className={`relative group px-7 py-2.5 rounded-xl font-bold font-mono tracking-wider text-sm uppercase transition-all duration-300 shadow-lg border-2 shrink-0 ${
            isVoiceActive
              ? 'bg-rose-600 text-white border-rose-400 shadow-rose-600/50 hover:bg-rose-500 hover:border-rose-300 scale-105'
              : 'bg-cyan-400 text-slate-950 border-cyan-300 shadow-[0_0_24px_rgba(0,229,255,0.8)] hover:shadow-[0_0_36px_rgba(0,229,255,1)] hover:bg-cyan-300 scale-105'
          }`}
          id="start-voice-button"
        >
          <span className="flex items-center gap-2">
            {isVoiceActive ? (
              <>
                <PhoneOff className="w-4 h-4 text-white" />
                <span>END</span>
              </>
            ) : (
              <>
                <PhoneCall className="w-4 h-4 text-slate-950" />
                <span>START</span>
              </>
            )}
          </span>
        </button>
      </div>
    </div>
  );
};
