import React, { useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { Bot, User, Sparkles, Send, Volume2, Mic } from 'lucide-react';

interface LiveChatDisplayProps {
  messages: ChatMessage[];
  inputText: string;
  setInputText: (text: string) => void;
  onSendMessage: (text: string) => void;
  isStreaming: boolean;
  isRecording: boolean;
  onToggleRecording: () => void;
  activePersona: string;
  micLevel?: number;
  micError?: string | null;
}

export const LiveChatDisplay: React.FC<LiveChatDisplayProps> = ({
  messages,
  inputText,
  setInputText,
  onSendMessage,
  isStreaming,
  isRecording,
  onToggleRecording,
  activePersona,
  micLevel = 0,
  micError,
}) => {
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, isStreaming, isRecording]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  return (
    <div 
      className="relative flex flex-col w-full max-w-lg lg:max-w-xl h-full min-h-0 max-h-[calc(100vh-160px)] rounded-2xl bg-cyan-950/20 border border-cyan-500/35 backdrop-blur-md shadow-[0_0_40px_rgba(0,229,255,0.12)] overflow-hidden"
      id="live-chatting-display"
    >
      {/* Top Header matching Mockup 2.png: "live chatting display" in cursive cyan font */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-cyan-500/20 bg-cyan-950/30">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
          <h2 className="text-xl sm:text-2xl font-serif italic text-cyan-300 tracking-wide drop-shadow-[0_0_12px_rgba(0,229,255,0.6)]">
            live chatting display
          </h2>
        </div>
        
        <span className="text-xs px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 font-mono">
          {activePersona}
        </span>
      </div>

      {/* Mic Permission Banner if mic error occurs */}
      {micError && (
        <div className="px-4 py-2 bg-rose-500/20 border-b border-rose-500/30 text-rose-200 text-xs text-center flex items-center justify-center gap-2">
          <span>{micError}</span>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div 
        ref={chatScrollRef}
        className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 scrollbar-thin scrollbar-thumb-cyan-500/30 scrollbar-track-transparent"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-cyan-200/60 space-y-3">
            <Bot className="w-10 h-10 text-cyan-400/50" />
            <p className="text-sm font-serif italic text-cyan-300/80">
              Voice assistant ready. Tap START or speak into mic to converse in real-time.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex items-end gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {/* AI Avatar Label Prefix */}
                {!isUser && (
                  <span className="text-xs font-serif italic font-semibold text-cyan-300 pb-1 select-none">
                    ai:
                  </span>
                )}

                {/* Message Bubble - Matching mockup translucent capsule style */}
                <div
                  className={`max-w-[82%] px-4 py-2.5 rounded-2xl text-sm font-sans backdrop-blur-md shadow-md transition-all ${
                    isUser
                      ? 'bg-cyan-500/20 text-cyan-100 border border-cyan-400/40 rounded-br-none'
                      : 'bg-cyan-900/40 text-cyan-50 border border-cyan-500/30 rounded-bl-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                </div>

                {/* User Label Suffix matching Mockup 2.png ":me" */}
                {isUser && (
                  <span className="text-xs font-serif italic font-semibold text-cyan-300 pb-1 select-none">
                    :me
                  </span>
                )}
              </div>
            );
          })
        )}

        {/* Live Microphone Recording Waveform Indicator */}
        {isRecording && (
          <div className="flex items-center gap-2 text-rose-300 text-xs italic font-serif">
            <span>:me</span>
            <div className="px-4 py-2 rounded-2xl bg-rose-950/50 border border-rose-500/40 flex items-center gap-2 shadow-lg shadow-rose-900/30">
              <span className="font-sans font-semibold text-rose-300 text-xs">Listening...</span>
              <div className="flex items-center gap-1 h-4">
                {[0.4, 0.9, 0.6, 1.0, 0.5, 0.8].map((h, i) => (
                  <div
                    key={i}
                    className="w-1 rounded-full bg-rose-400 animate-pulse"
                    style={{
                      height: `${Math.max(4, Math.min(18, (h + micLevel) * 16))}px`,
                      animationDelay: `${i * 100}ms`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Streaming Indicator */}
        {isStreaming && (
          <div className="flex items-center gap-2 text-cyan-300 text-xs italic font-serif">
            <span>ai:</span>
            <div className="px-3 py-2 rounded-2xl bg-cyan-900/40 border border-cyan-500/30 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
      </div>

      {/* Input bar inside chat container */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-cyan-500/20 bg-cyan-950/40 flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleRecording}
          className={`p-2.5 rounded-xl border transition-all ${
            isRecording
              ? 'bg-rose-500/30 border-rose-400 text-rose-300 animate-pulse'
              : 'bg-cyan-500/10 border-cyan-400/30 text-cyan-300 hover:bg-cyan-500/20'
          }`}
          title={isRecording ? 'Stop Recording' : 'Hold or Tap to Speak'}
        >
          <Mic className="w-4 h-4" />
        </button>

        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type a prompt or query..."
          className="flex-1 bg-cyan-950/50 text-cyan-100 placeholder-cyan-400/50 text-sm px-4 py-2.5 rounded-xl border border-cyan-500/30 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/50"
        />

        <button
          type="submit"
          disabled={!inputText.trim()}
          className="p-2.5 rounded-xl bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400 disabled:opacity-40 disabled:hover:bg-cyan-500 transition-all shadow-md shadow-cyan-500/20"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
