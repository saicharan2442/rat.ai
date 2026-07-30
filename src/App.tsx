/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { MatrixBackground } from './components/MatrixBackground';
import { Header } from './components/Header';
import { AvatarCanvas } from './components/AvatarCanvas';
import { LiveChatDisplay } from './components/LiveChatDisplay';
import { VoiceController } from './components/VoiceController';
import { AvatarStudioModal } from './components/AvatarStudioModal';
import { SettingsModal } from './components/SettingsModal';
import { ChatMessage, Expression, Viseme, AvatarPreset } from './types';

export default function App() {
  // Helper to strip accidental facial expression tags from text
  const cleanText = (raw: string) => {
    if (!raw) return '';
    return raw
      .replace(/\*?\*?\bFacial expression\b:?\s*\w*\*?\*?/gi, '')
      .replace(/\[\s*\bFacial expression\b:?\s*\w*\s*\]/gi, '')
      .replace(/\(\s*\bFacial expression\b:?\s*\w*\s*\)/gi, '')
      .replace(/\*?\*?\bExpression\b:?\s*\w*\*?\*?/gi, '')
      .replace(/\n\s*\n/g, '\n')
      .trim();
  };

  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'ai',
      text: "Hello! I am Rat AI, your real-world voice assistant. Tap START or speak to me!",
      timestamp: new Date(),
      expression: 'happy',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);

  // Avatar & Voice Engine State
  const [expression, setExpression] = useState<Expression>('happy');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState('Rat Voice');
  const [viseme, setViseme] = useState<Viseme>('REST');
  const [liveTranscript, setLiveTranscript] = useState('');

  // Refs for continuous phone call loop without closure staleness
  const isVoiceActiveRef = useRef(false);
  const isSpeakingRef = useRef(false);
  const isStreamingRef = useRef(false);

  useEffect(() => { isVoiceActiveRef.current = isVoiceActive; }, [isVoiceActive]);
  useEffect(() => { isSpeakingRef.current = isSpeaking; }, [isSpeaking]);
  useEffect(() => { isStreamingRef.current = isStreaming; }, [isStreaming]);

  // Avatar Customization State
  const [activeAvatar, setActiveAvatar] = useState<AvatarPreset>({
    id: 'rat_3d',
    name: 'Rat.ai',
    type: '3d_charan',
    description: '3D stylized Rat character with real-time physics & spring body kinematics',
    sweaterColor: '#64748b',
    pantsColor: '#1e293b',
  });
  const [customAvatarImg, setCustomAvatarImg] = useState<string | null>(null);

  // Settings State
  const [personaName, setPersonaName] = useState('Rat.ai');
  const [systemPrompt, setSystemPrompt] = useState(
    'You are Rat.ai, a clever, witty, and friendly 3D Rat AI voice assistant.'
  );
  const [speechRate, setSpeechRate] = useState(1.0);
  const [speechPitch, setSpeechPitch] = useState(1.0);

  // Modals
  const [isStudioOpen, setIsStudioOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Web Audio Context & Speech Synthesis References
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Initialize Web Audio Analyzer for real-time lip-sync
  const getAudioContextAndAnalyser = () => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        audioCtxRef.current = new AudioCtx();
        analyserRef.current = audioCtxRef.current.createAnalyser();
        analyserRef.current.fftSize = 256;
      }
    }
    if (audioCtxRef.current?.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    if (analyserRef.current && analyserRef.current !== analyserNode) {
      setAnalyserNode(analyserRef.current);
    }
    return { ctx: audioCtxRef.current, analyser: analyserRef.current };
  };

  // Play Audio & Drive Real-time Lip-Sync Animation
  const playTTSAudio = async (text: string) => {
    if (isMuted) return;
    const spokenText = cleanText(text);
    if (!spokenText) return;

    try {
      // 1. Request Gemini TTS Audio from server
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: spokenText, voiceName: selectedVoice }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.audio && !data.fallbackToBrowserSpeech) {
          const { ctx, analyser } = getAudioContextAndAnalyser();
          if (ctx && analyser) {
            if (ctx.state === 'suspended') {
              ctx.resume();
            }
            setAnalyserNode(analyser);
            (window as any).__ratAudioAnalyser = analyser;

            // Decode base64 PCM audio to AudioBuffer
            const binary = atob(data.audio);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

            // Create AudioBuffer from 24kHz 16-bit PCM
            const samples = bytes.length / 2;
            const buffer = ctx.createBuffer(1, samples, data.sampleRate || 24000);
            const channelData = buffer.getChannelData(0);
            const dataView = new DataView(bytes.buffer);

            for (let i = 0; i < samples; i++) {
              channelData[i] = dataView.getInt16(i * 2, true) / 32768;
            }

            const source = ctx.createBufferSource();
            source.buffer = buffer;
            source.playbackRate.value = speechRate;

            // Robotic Audio DSP Effect Chain (Cyber Metallic Rat Voice)
            const robotFilter = ctx.createBiquadFilter();
            robotFilter.type = 'peaking';
            robotFilter.frequency.value = 1650;
            robotFilter.Q.value = 3.5;
            robotFilter.gain.value = 7;

            const lowCut = ctx.createBiquadFilter();
            lowCut.type = 'highpass';
            lowCut.frequency.value = 180;

            // Metallic Ring Modulator
            const osc = ctx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.value = 48; // 48Hz metallic robotic carrier buzz

            const oscGain = ctx.createGain();
            oscGain.gain.value = 0.18;

            const ringModGain = ctx.createGain();
            ringModGain.gain.value = 1.0;

            osc.connect(oscGain);
            oscGain.connect(ringModGain.gain);
            osc.start(0);

            source.connect(lowCut);
            lowCut.connect(robotFilter);
            robotFilter.connect(ringModGain);
            ringModGain.connect(analyser);
            analyser.connect(ctx.destination);

            setIsSpeaking(true);
            setViseme('A');

            source.onended = () => {
              try { osc.stop(); } catch (e) {}
              setIsSpeaking(false);
              setViseme('REST');
              setLiveTranscript('');
              // If continuous call is active, auto restart listening for next user turn!
              if (isVoiceActiveRef.current) {
                setTimeout(() => {
                  if (isVoiceActiveRef.current) {
                    startListening();
                  }
                }, 350);
              }
            };

            source.start(0);
            return;
          }
        }
      }
    } catch (e) {
      console.warn("Server TTS fallback to browser synthesis:", e);
    }

    // Fallback: Web Speech Synthesis API
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(spokenText);
      utterance.rate = speechRate;
      utterance.pitch = Math.max(0.3, speechPitch * 0.65); // Deep robotic pitch tone

      const visemesList: Viseme[] = ['A', 'E', 'O', 'I', 'U', 'E', 'A', 'O'];
      let vIdx = 0;
      let visemeInterval: any = null;
      let keepAliveInterval: any = null;

      utterance.onstart = () => {
        setIsSpeaking(true);
        setViseme('A');

        // Continuous viseme cycling so lips move constantly even for long sentences
        visemeInterval = setInterval(() => {
          if (window.speechSynthesis.speaking) {
            vIdx = (vIdx + 1) % visemesList.length;
            setViseme(visemesList[vIdx]);
          } else {
            clearInterval(visemeInterval);
          }
        }, 110);

        // Keep-alive to prevent Chrome speech synthesis from stalling on sentences > 15s
        keepAliveInterval = setInterval(() => {
          if (window.speechSynthesis.speaking) {
            window.speechSynthesis.pause();
            window.speechSynthesis.resume();
          } else {
            clearInterval(keepAliveInterval);
          }
        }, 7500);
      };

      utterance.onboundary = () => {
        vIdx = (vIdx + 1) % visemesList.length;
        setViseme(visemesList[vIdx]);
      };

      const finishSpeech = () => {
        if (visemeInterval) clearInterval(visemeInterval);
        if (keepAliveInterval) clearInterval(keepAliveInterval);
        setIsSpeaking(false);
        setViseme('REST');
        setLiveTranscript('');
        if (isVoiceActiveRef.current) {
          setTimeout(() => {
            if (isVoiceActiveRef.current) {
              startListening();
            }
          }, 350);
        }
      };

      utterance.onend = finishSpeech;
      utterance.onerror = finishSpeech;

      window.speechSynthesis.speak(utterance);
    }
  };

  // Main Handler to Send Message to AI Agent
  const handleSendMessage = async (userText: string) => {
    if (!userText.trim()) return;

    // Stop active speech
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setIsSpeaking(false);

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: userText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsStreaming(true);
    setExpression('thinking');

    try {
      const history = messages.slice(-8).map((m) => ({
        role: m.sender === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }],
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          history,
          avatarPersona: personaName,
        }),
      });

      const data = await res.json();
      setIsStreaming(false);

      if (!res.ok) throw new Error(data.error || 'Failed to receive response');

      const rawReply = data.text || "I'm listening, how can I assist you further?";
      const aiReply = cleanText(rawReply);
      const nextExpression: Expression = data.expression || 'explaining';

      setExpression(nextExpression);

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: aiReply,
        timestamp: new Date(),
        expression: nextExpression,
      };

      setMessages((prev) => [...prev, aiMsg]);

      // Trigger Voice TTS Playback & Lip-Sync Animation
      playTTSAudio(aiReply);
    } catch (err: any) {
      setIsStreaming(false);
      setExpression('neutral');

      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'ai',
        text: "I'm having trouble connecting right now. Please verify your GEMINI_API_KEY in secrets.",
        timestamp: new Date(),
        expression: 'surprised',
      };
      setMessages((prev) => [...prev, errorMsg]);
    }
  };

  // Voice & Audio Recording State
  const [micLevel, setMicLevel] = useState(0);
  const [micError, setMicError] = useState<string | null>(null);
  const micAnalyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const micAnimRef = useRef<number | null>(null);

  // Stop & Clean up active microphone stream
  const cleanupMicStream = () => {
    if (micAnimRef.current) cancelAnimationFrame(micAnimRef.current);
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
    }
    setMicLevel(0);
  };

  // Web Speech / Microphone Input Handler with continuous call & real-time transcript
  const startListening = async () => {
    setMicError(null);

    // Stop active SpeechSynthesis
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setIsSpeaking(false);

    // Try SpeechRecognition if available, but wrap with MediaRecorder fallback
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setExpression('listening');
      };

      recognition.onresult = (event: any) => {
        let interimText = '';
        let finalText = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const textChunk = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalText += textChunk;
          } else {
            interimText += textChunk;
          }
        }

        const displayPhrase = finalText || interimText;
        if (displayPhrase) {
          setLiveTranscript(displayPhrase);
        }

        if (finalText.trim()) {
          const userSpeech = finalText.trim();
          setIsListening(false);
          try { recognition.stop(); } catch (e) {}
          handleSendMessage(userSpeech);
        }
      };

      recognition.onerror = (err: any) => {
        console.warn("SpeechRecognition error, falling back to MediaRecorder:", err.error);
        if (err.error !== 'no-speech' && err.error !== 'aborted') {
          setIsListening(false);
          startMediaRecorderCapture();
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        // Continuous phone call loop: auto re-listen if call is active and AI is not speaking/thinking
        if (isVoiceActiveRef.current && !isSpeakingRef.current && !isStreamingRef.current) {
          setTimeout(() => {
            if (isVoiceActiveRef.current && !isSpeakingRef.current && !isStreamingRef.current) {
              startListening();
            }
          }, 300);
        }
      };

      try {
        recognitionRef.current = recognition;
        recognition.start();
        return;
      } catch (e) {
        console.warn("SpeechRecognition start failed:", e);
      }
    }

    // Direct Fallback: MediaRecorder audio stream capture via Gemini Transcribe
    startMediaRecorderCapture();
  };

  // Direct Audio Stream Capture using MediaRecorder & Web Audio API
  const startMediaRecorderCapture = async () => {
    cleanupMicStream();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;

      const { ctx } = getAudioContextAndAnalyser();
      if (ctx) {
        const source = ctx.createMediaStreamSource(stream);
        const micAnalyser = ctx.createAnalyser();
        micAnalyser.fftSize = 256;
        source.connect(micAnalyser);
        micAnalyserRef.current = micAnalyser;

        // Monitor real-time user voice level
        const trackMicLevel = () => {
          if (!micAnalyserRef.current) return;
          const dataArray = new Uint8Array(micAnalyserRef.current.frequencyBinCount);
          micAnalyserRef.current.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
          const avg = sum / dataArray.length;
          setMicLevel(Math.min(1, avg / 60));
          micAnimRef.current = requestAnimationFrame(trackMicLevel);
        };
        trackMicLevel();
      }

      // Determine supported mimeType
      let mimeType = 'audio/webm';
      if (!MediaRecorder.isTypeSupported('audio/webm')) {
        if (MediaRecorder.isTypeSupported('audio/mp4')) mimeType = 'audio/mp4';
        else if (MediaRecorder.isTypeSupported('audio/ogg')) mimeType = 'audio/ogg';
        else mimeType = '';
      }

      const mediaRecorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        setIsListening(false);
        cleanupMicStream();

        const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType || 'audio/webm' });
        if (audioBlob.size < 500) return; // ignore tiny empty recordings

        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64Audio = (reader.result as string)?.split(',')[1];
          if (base64Audio) {
            setIsStreaming(true);
            setExpression('thinking');
            try {
              const res = await fetch('/api/transcribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  audioData: base64Audio,
                  mimeType: mediaRecorder.mimeType || 'audio/webm',
                }),
              });
              const data = await res.json();
              if (data.transcription && data.transcription.trim()) {
                handleSendMessage(data.transcription.trim());
              } else {
                setIsStreaming(false);
                setExpression('neutral');
              }
            } catch (err) {
              console.error("Transcription error:", err);
              setIsStreaming(false);
              setExpression('neutral');
            }
          }
        };
        reader.readAsDataURL(audioBlob);
      };

      setIsListening(true);
      setExpression('listening');
      mediaRecorder.start(200);

      // Record for up to 6 seconds then auto stop & transcribe
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
      }, 6000);
    } catch (err: any) {
      console.error("Microphone access failed:", err);
      setIsListening(false);
      setExpression('neutral');
      setMicError(
        "Microphone access blocked. Click the mic/lock icon in your browser address bar to allow audio."
      );
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    } else {
      cleanupMicStream();
      setIsListening(false);
    }
  };

  // Toggle Continuous Phone Call Mode (START / END)
  const handleToggleVoice = () => {
    if (isVoiceActive) {
      setIsVoiceActive(false);
      isVoiceActiveRef.current = false;
      setLiveTranscript('');
      stopListening();
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      setIsVoiceActive(true);
      isVoiceActiveRef.current = true;
      setLiveTranscript('');
      getAudioContextAndAnalyser();
      startListening();
    }
  };

  return (
    <div className="h-screen max-h-screen w-full flex flex-col justify-between text-slate-100 font-sans selection:bg-cyan-500 selection:text-slate-950 overflow-hidden relative">
      {/* 1. Canvas Matrix Binary Background matching 1.png */}
      <MatrixBackground />

      {/* 2. Top Header matching charan.ai branding in 2.png */}
      <Header
        onOpenStudio={() => setIsStudioOpen(true)}
        activePersona={personaName}
      />

      {/* 3. Main Split Content Area matching Mockup 2.png - Single Frame No Scroll */}
      <main className="flex-1 min-h-0 w-full max-w-7xl mx-auto px-4 sm:px-6 py-2 flex flex-col lg:flex-row items-center justify-between gap-6 z-10 overflow-hidden">
        
        {/* Left Column: Blender Studio Project Storm 3D Avatar Display */}
        <div className="w-full lg:w-1/2 h-full min-h-0 flex flex-col items-center justify-center overflow-hidden">
          <AvatarCanvas
            expression={expression}
            isSpeaking={isSpeaking}
            isListening={isListening}
            audioAnalyser={analyserNode || analyserRef.current}
            viseme={viseme}
            avatarImage={customAvatarImg || activeAvatar.imageUrl}
            avatarName={activeAvatar.name}
            onOpenStudio={() => setIsStudioOpen(true)}
          />
        </div>

        {/* Right Column: "live chatting display" Glassmorphism Box (Matches 2.png) */}
        <div className="w-full lg:w-1/2 h-full min-h-0 flex flex-col items-center justify-center overflow-hidden">
          <LiveChatDisplay
            messages={messages}
            inputText={inputText}
            setInputText={setInputText}
            onSendMessage={handleSendMessage}
            isStreaming={isStreaming}
            isRecording={isListening}
            onToggleRecording={() => {
              if (isListening) stopListening();
              else startListening();
            }}
            activePersona={personaName}
            micLevel={micLevel}
            micError={micError}
          />
        </div>
      </main>

      {/* 4. Bottom Controls Bar featuring Prominent Neon START/END Call Button */}
      <footer className="w-full max-w-7xl mx-auto px-4 sm:px-6 pb-3 pt-1 z-20 shrink-0">
        <VoiceController
          isVoiceActive={isVoiceActive}
          onToggleVoice={handleToggleVoice}
          isMuted={isMuted}
          onToggleMute={() => setIsMuted(!isMuted)}
          selectedVoice={selectedVoice}
          onChangeVoice={setSelectedVoice}
          onOpenSettings={() => setIsSettingsOpen(true)}
          liveTranscript={liveTranscript}
          isListening={isListening}
          isStreaming={isStreaming}
          isSpeaking={isSpeaking}
        />
      </footer>

      {/* Modals */}
      <AvatarStudioModal
        isOpen={isStudioOpen}
        onClose={() => setIsStudioOpen(false)}
        activeAvatar={activeAvatar}
        onSelectAvatar={(preset) => {
          setActiveAvatar(preset);
          setCustomAvatarImg(null);
        }}
        onCustomImageGenerated={(imgUrl, name) => {
          setCustomAvatarImg(imgUrl);
          setPersonaName(name);
        }}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        personaName={personaName}
        setPersonaName={setPersonaName}
        systemPrompt={systemPrompt}
        setSystemPrompt={setSystemPrompt}
        speechRate={speechRate}
        setSpeechRate={setSpeechRate}
        speechPitch={speechPitch}
        setSpeechPitch={setSpeechPitch}
      />
    </div>
  );
}
