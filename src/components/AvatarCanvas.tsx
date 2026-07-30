import React, { useEffect, useRef, useState } from 'react';
import { Expression, Viseme } from '../types';
import { Sparkles, Volume2, Zap } from 'lucide-react';

interface AvatarCanvasProps {
  expression: Expression;
  isSpeaking: boolean;
  isListening: boolean;
  audioAnalyser?: AnalyserNode | null;
  viseme?: Viseme;
  avatarImage?: string | null;
  avatarName?: string;
  onOpenStudio?: () => void;
}

// Spring physics solver state for organic motion
interface PhysicsSpring {
  pos: number;
  target: number;
  vel: number;
  stiffness: number;
  damping: number;
}

export const AvatarCanvas: React.FC<AvatarCanvasProps> = ({
  expression,
  isSpeaking,
  isListening,
  audioAnalyser,
  viseme = 'REST',
  avatarImage,
  avatarName = 'Rat.ai',
  onOpenStudio,
}) => {
  const [currentViseme, setCurrentViseme] = useState<Viseme>('REST');
  const [blink, setBlink] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  
  // Real-time Physics-based Body Kinematics State for Rat.ai
  const [physicsState, setPhysicsState] = useState({
    headTilt: 0,        // Head tilt angle
    headX: 0,           // Head horizontal sway
    headY: 0,           // Head vertical bounce
    bodySway: 0,        // Body spine rotation
    chestY: 0,          // Breathing chest expansion
    leftEarRot: 0,      // Left ear twitch angle
    rightEarRot: 0,     // Right ear twitch angle
    whiskerTwitch: 0,   // Whisker vibration
    tailSway1: 0,       // Tail base angle
    tailSway2: 0,       // Tail mid angle
    tailSway3: 0,       // Tail tip angle
    eyeX: 0,            // Eye pupil horizontal gaze offset
    eyeY: 0,            // Eye pupil vertical gaze offset
    leftHandX: 65,      // Left paw coordinates
    leftHandY: 252,
    leftWristRot: -12,
    rightHandX: 315,    // Right paw coordinates
    rightHandY: 252,
    rightWristRot: 12,
    fingerSplay: 0,     // Finger open/closed flex state
  });

  const animRef = useRef<number | null>(null);
  const physicsFrameRef = useRef<number | null>(null);

  // Springs for multi-joint kinematics (Head, Body, Ears, Tail, Paws)
  const springsRef = useRef<{
    headTilt: PhysicsSpring;
    headX: PhysicsSpring;
    headY: PhysicsSpring;
    bodySway: PhysicsSpring;
    chestY: PhysicsSpring;
    leftEarRot: PhysicsSpring;
    rightEarRot: PhysicsSpring;
    whiskerTwitch: PhysicsSpring;
    tailSway1: PhysicsSpring;
    tailSway2: PhysicsSpring;
    tailSway3: PhysicsSpring;
    eyeX: PhysicsSpring;
    eyeY: PhysicsSpring;
    leftHandX: PhysicsSpring;
    leftHandY: PhysicsSpring;
    leftWristRot: PhysicsSpring;
    rightHandX: PhysicsSpring;
    rightHandY: PhysicsSpring;
    rightWristRot: PhysicsSpring;
    fingerSplay: PhysicsSpring;
  }>({
    headTilt: { pos: 0, target: 0, vel: 0, stiffness: 0.08, damping: 0.75 },
    headX: { pos: 0, target: 0, vel: 0, stiffness: 0.06, damping: 0.8 },
    headY: { pos: 0, target: 0, vel: 0, stiffness: 0.09, damping: 0.7 },
    bodySway: { pos: 0, target: 0, vel: 0, stiffness: 0.05, damping: 0.82 },
    chestY: { pos: 0, target: 0, vel: 0, stiffness: 0.1, damping: 0.85 },
    leftEarRot: { pos: 0, target: 0, vel: 0, stiffness: 0.15, damping: 0.65 },
    rightEarRot: { pos: 0, target: 0, vel: 0, stiffness: 0.15, damping: 0.65 },
    whiskerTwitch: { pos: 0, target: 0, vel: 0, stiffness: 0.2, damping: 0.6 },
    tailSway1: { pos: 0, target: 0, vel: 0, stiffness: 0.04, damping: 0.85 },
    tailSway2: { pos: 0, target: 0, vel: 0, stiffness: 0.05, damping: 0.82 },
    tailSway3: { pos: 0, target: 0, vel: 0, stiffness: 0.06, damping: 0.78 },
    eyeX: { pos: 0, target: 0, vel: 0, stiffness: 0.14, damping: 0.7 },
    eyeY: { pos: 0, target: 0, vel: 0, stiffness: 0.14, damping: 0.7 },
    leftHandX: { pos: 65, target: 65, vel: 0, stiffness: 0.07, damping: 0.72 },
    leftHandY: { pos: 252, target: 252, vel: 0, stiffness: 0.07, damping: 0.72 },
    leftWristRot: { pos: -12, target: -12, vel: 0, stiffness: 0.09, damping: 0.75 },
    rightHandX: { pos: 315, target: 315, vel: 0, stiffness: 0.07, damping: 0.72 },
    rightHandY: { pos: 252, target: 252, vel: 0, stiffness: 0.07, damping: 0.72 },
    rightWristRot: { pos: 12, target: 12, vel: 0, stiffness: 0.09, damping: 0.75 },
    fingerSplay: { pos: 0, target: 0, vel: 0, stiffness: 0.12, damping: 0.7 },
  });

  // Track cursor position & movement timestamp for rat eye gaze tracking
  const mousePosRef = useRef({ x: 0, y: 0 });
  const lastMouseMoveTimeRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const relX = (e.clientX - rect.left) / rect.width - 0.5;
      const relY = (e.clientY - rect.top) / rect.height - 0.5;
      mousePosRef.current = { x: relX, y: relY };
      lastMouseMoveTimeRef.current = performance.now();
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Audio frequency analyzer loop for real-time lip-sync mouth opening
  useEffect(() => {
    let active = true;

    const analyzeAudio = () => {
      if (!active) return;

      if (isSpeaking) {
        let level = 0.5;

        const activeAnalyser = audioAnalyser || (window as any).__ratAudioAnalyser;

        if (activeAnalyser) {
          try {
            const dataArray = new Uint8Array(activeAnalyser.frequencyBinCount);
            activeAnalyser.getByteFrequencyData(dataArray);

            // Focus on primary vocal frequency range (bins 1 to 36: ~100Hz to 3500Hz)
            const vocalBins = Math.min(dataArray.length, 36);
            let sum = 0;
            let peak = 0;
            for (let i = 1; i < vocalBins; i++) {
              sum += dataArray[i];
              if (dataArray[i] > peak) peak = dataArray[i];
            }
            const avg = sum / Math.max(1, vocalBins - 1);
            level = Math.min(1, (avg * 0.5 + peak * 0.5) / 38);
          } catch (e) {
            level = 0.5;
          }
        }

        // Combine audio level with continuous phonetic pronunciation oscillation so lips always articulate naturally
        const now = Date.now();
        const phoneticSequence: Viseme[] = ['A', 'E', 'O', 'I', 'U', 'E', 'A', 'O'];
        const phonemeIndex = Math.floor((now / 110) % phoneticSequence.length);
        const timeViseme = phoneticSequence[phonemeIndex];

        const speechOsc = Math.sin(now / 70) * 0.4 + Math.cos(now / 110) * 0.3;
        const effectiveLevel = Math.max(0.32, level * 0.65 + Math.abs(speechOsc) * 0.45);

        setAudioLevel(effectiveLevel);

        if (effectiveLevel > 0.68) {
          setCurrentViseme('A');
        } else if (effectiveLevel > 0.50) {
          setCurrentViseme('O');
        } else if (effectiveLevel > 0.35) {
          setCurrentViseme('E');
        } else if (effectiveLevel > 0.20) {
          setCurrentViseme('I');
        } else {
          setCurrentViseme(timeViseme);
        }
      } else {
        setCurrentViseme(viseme || 'REST');
        setAudioLevel(0);
      }

      animRef.current = requestAnimationFrame(analyzeAudio);
    };

    analyzeAudio();

    return () => {
      active = false;
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [audioAnalyser, isSpeaking, viseme]);

  // Real-time Physics Simulation Loop (Spring-Damping Kinetics for Rat Body, Tail & Paws)
  useEffect(() => {
    let active = true;
    let lastTime = performance.now();

    const updatePhysics = (now: number) => {
      if (!active) return;
      const dt = Math.min(0.033, (now - lastTime) / 1000);
      lastTime = now;

      const t = now / 1000;
      const springs = springsRef.current;
      const mouse = mousePosRef.current;

      // 1. Compute Organic Physics Targets
      // Breathing sine wave
      const breathPhase = Math.sin(t * 1.8);
      springs.chestY.target = breathPhase * 2.5;

      // Interactive cursor head-look target
      const lookX = mouse.x * 12;
      const lookY = mouse.y * 8;

      // Eye & Hand gaze tracking: when cursor moves, rat eyes and hands follow cursor; when stationary, they return to normal
      const isCursorActive = (now - lastMouseMoveTimeRef.current) < 700;
      let handOffsetX = 0;
      let handOffsetY = 0;

      if (isCursorActive) {
        springs.eyeX.target = Math.max(-5.5, Math.min(5.5, mouse.x * 12));
        springs.eyeY.target = Math.max(-4.5, Math.min(4.5, mouse.y * 10));
        handOffsetX = Math.max(-35, Math.min(35, mouse.x * 50));
        handOffsetY = Math.max(-25, Math.min(25, mouse.y * 40));
      } else {
        springs.eyeX.target = 0;
        springs.eyeY.target = 0;
      }

      // Tail organic swish (multistage sine wave)
      const tailWave1 = Math.sin(t * 2.2);
      const tailWave2 = Math.cos(t * 2.8 + 0.5);
      const tailWave3 = Math.sin(t * 3.4 + 1.0);

      springs.tailSway1.target = tailWave1 * 18 + lookX * 0.3;
      springs.tailSway2.target = tailWave2 * 24;
      springs.tailSway3.target = tailWave3 * 30;

      // Whisker vibration
      springs.whiskerTwitch.target = isSpeaking ? Math.sin(t * 22) * 4 : Math.sin(t * 4) * 1.5;

      // Occasional cute ear twitches
      if (Math.random() < 0.015) {
        springs.leftEarRot.target = (Math.random() - 0.5) * 12;
      } else if (Math.random() < 0.015) {
        springs.rightEarRot.target = (Math.random() - 0.5) * 12;
      }

      if (isSpeaking) {
        // Conversational speech gesture dynamics
        const gesturePulse = Math.sin(t * 5.2 + audioLevel * 4);

        springs.headTilt.target = Math.sin(t * 3) * 5 + lookX * 0.4;
        springs.headX.target = lookX * 0.8 + Math.sin(t * 2.5) * 3;
        springs.headY.target = lookY * 0.5 + Math.abs(gesturePulse) * -3;
        springs.bodySway.target = Math.sin(t * 2) * 3.5;

        // Ear perk while speaking
        springs.leftEarRot.target = -4 + Math.sin(t * 6) * 3;
        springs.rightEarRot.target = 4 - Math.sin(t * 6) * 3;

        // Left Paw Gesturing + cursor influence
        springs.leftHandX.target = 60 + Math.sin(t * 4) * 22 + audioLevel * 15 + handOffsetX * 0.5;
        springs.leftHandY.target = 230 + Math.cos(t * 3.5) * 28 - audioLevel * 20 + handOffsetY * 0.5;
        springs.leftWristRot.target = -18 + Math.sin(t * 4.5) * 25 + handOffsetX * 0.2;

        // Right Paw Gesturing + cursor influence
        springs.rightHandX.target = 320 + Math.cos(t * 3.8) * 22 - audioLevel * 15 + handOffsetX * 0.5;
        springs.rightHandY.target = 235 + Math.sin(t * 4.2) * 26 - audioLevel * 18 + handOffsetY * 0.5;
        springs.rightWristRot.target = 18 + Math.cos(t * 4.5) * 25 + handOffsetX * 0.2;

        springs.fingerSplay.target = 0.6 + Math.abs(gesturePulse) * 0.4;
      } else if (isListening) {
        // Attentive listening posture + cursor hand reach
        springs.headTilt.target = -4 + lookX * 0.3;
        springs.headX.target = lookX * 0.6;
        springs.headY.target = 4;
        springs.bodySway.target = lookX * 0.2;

        springs.leftEarRot.target = -8;
        springs.rightEarRot.target = 8;

        springs.leftHandX.target = 75 + handOffsetX;
        springs.leftHandY.target = 260 + breathPhase * 2 + handOffsetY;
        springs.leftWristRot.target = -8 + handOffsetX * 0.3;

        springs.rightHandX.target = 305 + handOffsetX;
        springs.rightHandY.target = 260 + breathPhase * 2 + handOffsetY;
        springs.rightWristRot.target = 8 + handOffsetX * 0.3;

        springs.fingerSplay.target = 0.2;
      } else {
        // Idle posture + cursor hand reach
        const idleShift = Math.sin(t * 0.5);

        springs.headTilt.target = Math.sin(t * 0.8) * 2 + lookX * 0.3;
        springs.headX.target = lookX * 0.5 + idleShift * 2;
        springs.headY.target = lookY * 0.4 + breathPhase;
        springs.bodySway.target = idleShift * 1.5;

        springs.leftHandX.target = 68 + idleShift * 3 + handOffsetX;
        springs.leftHandY.target = 255 + breathPhase * 3 + handOffsetY;
        springs.leftWristRot.target = -10 + idleShift * 3 + handOffsetX * 0.3;

        springs.rightHandX.target = 312 - idleShift * 3 + handOffsetX;
        springs.rightHandY.target = 255 + breathPhase * 3 + handOffsetY;
        springs.rightWristRot.target = 10 - idleShift * 3 + handOffsetX * 0.3;

        springs.fingerSplay.target = 0.1;
      }

      // Expression adjustments
      if (expression === 'surprised') {
        springs.headY.target -= 6;
        springs.leftEarRot.target = -15;
        springs.rightEarRot.target = 15;
        springs.leftHandY.target -= 25;
        springs.rightHandY.target -= 25;
        springs.fingerSplay.target = 1.0;
      } else if (expression === 'thinking') {
        springs.headTilt.target = 8;
        springs.leftEarRot.target = -10;
        springs.rightHandX.target = 270;
        springs.rightHandY.target = 210;
        springs.rightWristRot.target = 40;
      }

      // 2. Solve Spring Physics Equations (Hooke's Law with Damping)
      Object.keys(springs).forEach((key) => {
        const s = (springs as any)[key] as PhysicsSpring;
        const force = (s.target - s.pos) * s.stiffness;
        s.vel = (s.vel + force) * s.damping;
        s.pos += s.vel;
      });

      // 3. Update State for Rat SVG Renderer
      setPhysicsState({
        headTilt: springs.headTilt.pos,
        headX: springs.headX.pos,
        headY: springs.headY.pos,
        bodySway: springs.bodySway.pos,
        chestY: springs.chestY.pos,
        leftEarRot: springs.leftEarRot.pos,
        rightEarRot: springs.rightEarRot.pos,
        whiskerTwitch: springs.whiskerTwitch.pos,
        tailSway1: springs.tailSway1.pos,
        tailSway2: springs.tailSway2.pos,
        tailSway3: springs.tailSway3.pos,
        eyeX: springs.eyeX.pos,
        eyeY: springs.eyeY.pos,
        leftHandX: springs.leftHandX.pos,
        leftHandY: springs.leftHandY.pos,
        leftWristRot: springs.leftWristRot.pos,
        rightHandX: springs.rightHandX.pos,
        rightHandY: springs.rightHandY.pos,
        rightWristRot: springs.rightWristRot.pos,
        fingerSplay: springs.fingerSplay.pos,
      });

      physicsFrameRef.current = requestAnimationFrame(updatePhysics);
    };

    physicsFrameRef.current = requestAnimationFrame(updatePhysics);

    return () => {
      active = false;
      if (physicsFrameRef.current) cancelAnimationFrame(physicsFrameRef.current);
    };
  }, [isSpeaking, isListening, audioLevel, expression]);

  // Eye blinking loop
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 160);
    }, 3800 + Math.random() * 2000);

    return () => clearInterval(blinkInterval);
  }, []);

  // Compute mouth parameters based on viseme and audio level for Rat teeth/snout lip-sync
  const getMouthPath = () => {
    // Priority: when speaking, use currentViseme (from audio frequency) or fallback to viseme prop from parent
    const activeViseme = isSpeaking 
      ? (currentViseme && currentViseme !== 'REST' ? currentViseme : (viseme && viseme !== 'REST' ? viseme : 'E'))
      : viseme;
    
    const now = Date.now();
    // Pronunciation oscillation so mouth & lips articulate continuously without freezing during long sentences
    const speakOsc = isSpeaking ? Math.sin(now / 65) * 2.5 : 0;
    // When speaking, ensure a strong baseline boost so lips open and articulate clearly
    const boost = isSpeaking ? Math.max(0.35, audioLevel * 0.85) : 0;

    switch (activeViseme) {
      case 'A':
        return { ry: 15 + boost * 12 + speakOsc, rx: 15 + boost * 4 - speakOsc * 0.4, mouthY: 153 + boost * 5, innerColor: '#2d0609' };
      case 'E':
        return { ry: 9.5 + boost * 9 + speakOsc, rx: 17 + boost * 3 - speakOsc * 0.4, mouthY: 151 + boost * 4, innerColor: '#2d0609' };
      case 'I':
        return { ry: 6.5 + boost * 7 + speakOsc, rx: 16 + boost * 3 - speakOsc * 0.4, mouthY: 150 + boost * 3, innerColor: '#2d0609' };
      case 'O':
        return { ry: 17 + boost * 12 + speakOsc, rx: 12 + boost * 3 - speakOsc * 0.4, mouthY: 154 + boost * 5, innerColor: '#1f0305' };
      case 'U':
        return { ry: 12 + boost * 10 + speakOsc, rx: 10 + boost * 3 - speakOsc * 0.4, mouthY: 152 + boost * 4, innerColor: '#1f0305' };
      case 'SMILE':
      case 'M':
        return { ry: 4 + boost * 4 + Math.abs(speakOsc) * 0.5, rx: 14, mouthY: 149.5, innerColor: '#4c1118' };
      default:
        if (isSpeaking) {
          return { ry: 9 + boost * 8 + speakOsc, rx: 15 + boost * 3 - speakOsc * 0.4, mouthY: 151 + boost * 3, innerColor: '#2d0609' };
        }
        if (expression === 'happy') return { ry: 4, rx: 13, mouthY: 149, innerColor: '#4c1118' };
        if (expression === 'surprised') return { ry: 14, rx: 10, mouthY: 154, innerColor: '#1f0305' };
        return { ry: 2.5, rx: 10, mouthY: 148.5, innerColor: '#3a0d12' };
    }
  };

  const mouthParams = getMouthPath();

  const getEyebrowOffset = () => {
    if (expression === 'surprised') return -6;
    if (expression === 'thinking') return -2;
    if (expression === 'happy') return -3;
    if (isListening) return -4;
    return 0;
  };

  const eyebrowOffset = getEyebrowOffset();

  return (
    <div 
      ref={containerRef}
      className="relative flex flex-col items-center justify-center w-full h-full max-h-[calc(100vh-160px)] select-none overflow-hidden" 
      id="avatar-container"
    >
      {/* Custom Generated Image OR 3D Rat.ai Character */}
      {avatarImage ? (
        <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-2">
          <div className="relative w-64 sm:w-72 md:w-80 h-[80%] max-h-[420px] rounded-3xl overflow-hidden border-2 border-cyan-400/40 shadow-2xl shadow-cyan-900/50 bg-slate-900/80 backdrop-blur-md flex items-center justify-center">
            <img 
              src={avatarImage} 
              alt="Custom Avatar" 
              className={`w-full h-full object-cover transition-transform duration-500 ${
                isSpeaking ? 'scale-[1.03]' : 'scale-100'
              }`}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60" />
            
            {isSpeaking && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-4 py-2 rounded-full bg-cyan-950/80 border border-cyan-400/60 backdrop-blur-md">
                <Volume2 className="w-4 h-4 text-cyan-300 animate-pulse" />
                <span className="text-xs font-semibold text-cyan-200 tracking-wide">Speaking...</span>
                <div className="flex items-center gap-1 ml-1 h-3">
                  {[0.4, 0.9, 0.6, 0.8, 0.5].map((h, i) => (
                    <div 
                      key={i} 
                      className="w-1 bg-cyan-300 rounded-full animate-bounce"
                      style={{ 
                        height: `${Math.max(3, h * audioLevel * 14)}px`,
                        animationDelay: `${i * 120}ms`
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Stylized 3D "Rat.ai" Character with Physics Body, Ears, Tail, & Hand Kinematics */
        <div className="relative z-10 w-full h-full flex items-center justify-center overflow-visible">
          <svg
            viewBox="0 0 380 500"
            className="w-full h-full max-h-[440px] sm:max-h-[480px] lg:max-h-[500px] drop-shadow-[0_12px_36px_rgba(0,229,255,0.35)]"
            id="rat-ai-svg"
          >
            <defs>
              {/* Rat Fur Shading Gradient */}
              <linearGradient id="ratFurGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#94a3b8" />
                <stop offset="50%" stopColor="#64748b" />
                <stop offset="100%" stopColor="#334155" />
              </linearGradient>

              {/* Rat Inner Ear Pink Gradient */}
              <linearGradient id="ratPinkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fda4af" />
                <stop offset="60%" stopColor="#f43f5e" />
                <stop offset="100%" stopColor="#e11d48" />
              </linearGradient>

              {/* Rat Tail Pink Gradient */}
              <linearGradient id="ratTailGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#fecdd3" />
                <stop offset="50%" stopColor="#f43f5e" />
                <stop offset="100%" stopColor="#9f1239" />
              </linearGradient>

              {/* Rat Cyber Hoodie / Vest Gradients */}
              <linearGradient id="ratJacketGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1e293b" />
                <stop offset="50%" stopColor="#0f172a" />
                <stop offset="100%" stopColor="#0284c7" />
              </linearGradient>

              {/* Neon Cyber Trim */}
              <linearGradient id="neonTrimGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#00e5ff" />
                <stop offset="50%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#0284c7" />
              </linearGradient>
            </defs>

            {/* REAL-TIME ANIMATED RAT TAIL KINEMATICS */}
            <g id="rat-tail-kinematics">
              {(() => {
                const bx = 190 + physicsState.bodySway * 1.2; // Tail base anchored to body
                const by = 350 + physicsState.chestY;
                const s1 = physicsState.tailSway1;
                const s2 = physicsState.tailSway2;
                const s3 = physicsState.tailSway3;

                // 3-point Bézier spline for flexible rat tail
                const p1x = bx - 20 + s1;
                const p1y = by + 30;
                const p2x = bx - 60 + s1 + s2;
                const p2y = by + 70;
                const p3x = bx - 100 + s1 + s2 + s3;
                const p3y = by + 95;

                return (
                  <path
                    d={`M${bx} ${by} Q${p1x} ${p1y} ${p2x} ${p2y} T${p3x} ${p3y}`}
                    stroke="url(#ratTailGrad)"
                    strokeWidth="9"
                    strokeLinecap="round"
                    fill="none"
                    className="drop-shadow-[0_4px_10px_rgba(244,63,94,0.3)]"
                  />
                );
              })()}
            </g>

            {/* LEGS & PAWS */}
            <g id="rat-legs-paws">
              {/* Left Foot */}
              <ellipse cx="155" cy="455" rx="20" ry="9" fill="url(#ratPinkGrad)" />
              <path d="M140 450 L135 456 M148 450 L146 458 M156 450 L156 459" stroke="#be123c" strokeWidth="2" />

              {/* Right Foot */}
              <ellipse cx="225" cy="455" rx="20" ry="9" fill="url(#ratPinkGrad)" />
              <path d="M210 450 L205 456 M218 450 L216 458 M226 450 L226 459" stroke="#be123c" strokeWidth="2" />

              {/* Left Leg */}
              <path d="M148 330 L142 450 L172 450 L168 330 Z" fill="url(#ratFurGrad)" />
              
              {/* Right Leg */}
              <path d="M208 330 L202 450 L232 450 L228 330 Z" fill="url(#ratFurGrad)" />
            </g>

            {/* TORSO & RAT.AI CYBER JACKET WITH SPINE PHYSICS */}
            <g 
              id="rat-torso-jacket"
              transform={`rotate(${physicsState.bodySway} 190 315) translate(0, ${physicsState.chestY})`}
            >
              {/* Cyber Jacket Base */}
              <path
                d="M125 210 Q190 195 255 210 L262 335 Q190 345 118 335 Z"
                fill="url(#ratJacketGrad)"
              />

              {/* Soft Rat Belly Fur Patch */}
              <path
                d="M152 225 Q190 220 228 225 L232 325 Q190 332 148 325 Z"
                fill="#cbd5e1"
                opacity="0.9"
              />

              {/* Neon Cyber Center Zipper */}
              <line x1="190" y1="220" x2="190" y2="335" stroke="#00e5ff" strokeWidth="3" />

              {/* Rat.ai Logo Chest Emblem */}
              <g transform="translate(168, 240)">
                <circle cx="22" cy="12" r="16" fill="#0f172a" stroke="#00e5ff" strokeWidth="2" />
                <text x="22" y="16" textAnchor="middle" fill="#00e5ff" fontSize="10" fontWeight="bold" fontFamily="monospace">
                  RAT
                </text>
              </g>

              {/* Cyber Jacket Collar */}
              <path
                d="M148 210 Q190 225 232 210 L240 178 Q190 168 140 178 Z"
                fill="#0f172a"
                stroke="#00e5ff"
                strokeWidth="2"
              />
            </g>

            {/* ARTICULATED REAL-TIME RAT PAWS & ARMS WITH JOINT KINEMATICS */}
            <g id="rat-articulated-arms">
              {/* LEFT PAW & ARM KINEMATICS */}
              {(() => {
                const sx = 130; // Shoulder joint
                const sy = 210;
                const hx = physicsState.leftHandX; // Paw position solver
                const hy = physicsState.leftHandY;
                
                // Calculate elbow joint using 2-link inverse kinematics
                const dx = hx - sx;
                const dy = hy - sy;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const ex = (sx + hx) / 2 - (dy / (dist || 1)) * 22;
                const ey = (sy + hy) / 2 + (dx / (dist || 1)) * 22;

                const splay = physicsState.fingerSplay;

                return (
                  <g id="left-rat-paw-kinematics">
                    {/* Upper Arm Fur */}
                    <path
                      d={`M${sx - 10} ${sy} Q${ex - 12} ${ey - 10} ${ex - 8} ${ey} L${ex + 12} ${ey + 10} Q${sx + 15} ${sy + 10} ${sx + 8} ${sy} Z`}
                      fill="url(#ratJacketGrad)"
                    />
                    {/* Forearm Fur */}
                    <path
                      d={`M${ex - 8} ${ey} Q${(ex + hx) / 2 - 8} ${(ey + hy) / 2} ${hx - 10} ${hy - 6} L${hx + 10} ${hy + 6} Q${(ex + hx) / 2 + 8} ${(ey + hy) / 2} ${ex + 12} ${ey + 10} Z`}
                      fill="url(#ratFurGrad)"
                    />
                    {/* Neon Cuff */}
                    <path d={`M${hx - 12} ${hy - 6} L${hx + 12} ${hy + 6}`} stroke="#00e5ff" strokeWidth="4" strokeLinecap="round" />

                    {/* Left Pink Rat Paw & Articulated Claws */}
                    <g transform={`translate(${hx}, ${hy}) rotate(${physicsState.leftWristRot})`}>
                      {/* Palm */}
                      <ellipse cx="0" cy="0" rx="13" ry="10" fill="url(#ratPinkGrad)" />
                      
                      {/* Claw 1 */}
                      <path 
                        d={`M-8 -4 Q-16 ${-14 - splay * 8} -12 ${-22 - splay * 10}`} 
                        stroke="url(#ratPinkGrad)" strokeWidth="4" strokeLinecap="round" fill="none" 
                      />
                      {/* Claw 2 */}
                      <path 
                        d={`M0 -6 Q-4 ${-18 - splay * 10} 0 ${-26 - splay * 12}`} 
                        stroke="url(#ratPinkGrad)" strokeWidth="4" strokeLinecap="round" fill="none" 
                      />
                      {/* Claw 3 */}
                      <path 
                        d={`M8 -4 Q12 ${-14 - splay * 8} 10 ${-22 - splay * 10}`} 
                        stroke="url(#ratPinkGrad)" strokeWidth="3.8" strokeLinecap="round" fill="none" 
                      />
                    </g>
                  </g>
                );
              })()}

              {/* RIGHT PAW & ARM KINEMATICS */}
              {(() => {
                const sx = 250; // Shoulder joint
                const sy = 210;
                const hx = physicsState.rightHandX; // Paw position solver
                const hy = physicsState.rightHandY;
                
                // Calculate elbow joint using 2-link inverse kinematics
                const dx = hx - sx;
                const dy = hy - sy;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const ex = (sx + hx) / 2 + (dy / (dist || 1)) * 22;
                const ey = (sy + hy) / 2 - (dx / (dist || 1)) * 22;

                const splay = physicsState.fingerSplay;

                return (
                  <g id="right-rat-paw-kinematics">
                    {/* Upper Arm Fur */}
                    <path
                      d={`M${sx - 8} ${sy} Q${ex - 12} ${ey - 10} ${ex - 12} ${ey + 10} L${ex + 8} ${ey} Q${sx + 12} ${sy + 10} ${sx + 8} ${sy} Z`}
                      fill="url(#ratJacketGrad)"
                    />
                    {/* Forearm Fur */}
                    <path
                      d={`M${ex - 12} ${ey + 10} Q${(ex + hx) / 2 - 8} ${(ey + hy) / 2} ${hx - 10} ${hy + 6} L${hx + 10} ${hy - 6} Q${(ex + hx) / 2 + 8} ${(ey + hy) / 2} ${ex + 8} ${ey} Z`}
                      fill="url(#ratFurGrad)"
                    />
                    {/* Neon Cuff */}
                    <path d={`M${hx - 12} ${hy + 6} L${hx + 12} ${hy - 6}`} stroke="#00e5ff" strokeWidth="4" strokeLinecap="round" />

                    {/* Right Pink Rat Paw & Articulated Claws */}
                    <g transform={`translate(${hx}, ${hy}) rotate(${physicsState.rightWristRot})`}>
                      {/* Palm */}
                      <ellipse cx="0" cy="0" rx="13" ry="10" fill="url(#ratPinkGrad)" />
                      
                      {/* Claw 1 */}
                      <path 
                        d={`M-8 -4 Q-12 ${-14 - splay * 8} -10 ${-22 - splay * 10}`} 
                        stroke="url(#ratPinkGrad)" strokeWidth="3.8" strokeLinecap="round" fill="none" 
                      />
                      {/* Claw 2 */}
                      <path 
                        d={`M0 -6 Q4 ${-18 - splay * 10} 0 ${-26 - splay * 12}`} 
                        stroke="url(#ratPinkGrad)" strokeWidth="4" strokeLinecap="round" fill="none" 
                      />
                      {/* Claw 3 */}
                      <path 
                        d={`M8 -4 Q16 ${-14 - splay * 8} 12 ${-22 - splay * 10}`} 
                        stroke="url(#ratPinkGrad)" strokeWidth="4" strokeLinecap="round" fill="none" 
                      />
                    </g>
                  </g>
                );
              })()}
            </g>

            {/* NECK WITH HEAD KINEMATICS */}
            <g transform={`translate(${physicsState.headX * 0.4}, ${physicsState.headY * 0.4})`}>
              <rect x="178" y="160" width="24" height="28" rx="6" fill="url(#ratFurGrad)" />
            </g>

            {/* HEAD & STYLIZED RAT.AI FACE WITH PHYSICS TILTS, EARS & WHISKERS */}
            <g 
              id="rat-head-face"
              transform={`translate(${physicsState.headX}, ${physicsState.headY}) rotate(${physicsState.headTilt} 190 120)`}
            >
              {/* LARGE CUTE ROUNDED RAT EARS WITH SPRING TWITCH PHYSICS */}
              {/* Left Rat Ear */}
              <g transform={`rotate(${physicsState.leftEarRot} 125 80)`}>
                <ellipse cx="125" cy="80" rx="34" ry="42" fill="url(#ratFurGrad)" />
                <ellipse cx="127" cy="82" rx="24" ry="32" fill="url(#ratPinkGrad)" />
              </g>

              {/* Right Rat Ear */}
              <g transform={`rotate(${physicsState.rightEarRot} 255 80)`}>
                <ellipse cx="255" cy="80" rx="34" ry="42" fill="url(#ratFurGrad)" />
                <ellipse cx="253" cy="82" rx="24" ry="32" fill="url(#ratPinkGrad)" />
              </g>

              {/* Head Base Fur Skull */}
              <path
                d="M138 120 Q138 72 190 72 Q242 72 242 120 Q242 178 190 182 Q138 178 138 120 Z"
                fill="url(#ratFurGrad)"
              />

              {/* Rat Head Tuft / Cyber Cap */}
              <path
                d="M160 76 Q190 60 220 76 Q200 68 190 66 Q180 68 160 76 Z"
                fill="#38bdf8"
              />

              {/* Eyebrows */}
              <path
                d={`M156 ${100 + eyebrowOffset} Q170 ${94 + eyebrowOffset} 180 ${101 + eyebrowOffset}`}
                stroke="#0f172a"
                strokeWidth="4"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d={`M200 ${101 + eyebrowOffset} Q210 ${94 + eyebrowOffset} 224 ${100 + eyebrowOffset}`}
                stroke="#0f172a"
                strokeWidth="4"
                strokeLinecap="round"
                fill="none"
              />

              {/* Expressive Glossy Rat Eyes */}
              <g id="rat-eyes">
                {blink ? (
                  <>
                    <line x1="158" y1="116" x2="182" y2="116" stroke="#0f172a" strokeWidth="4" strokeLinecap="round" />
                    <line x1="198" y1="116" x2="222" y2="116" stroke="#0f172a" strokeWidth="4" strokeLinecap="round" />
                  </>
                ) : (
                  <>
                    {/* Sclera */}
                    <ellipse cx="170" cy="116" rx="12" ry="11" fill="#ffffff" />
                    <ellipse cx="210" cy="116" rx="12" ry="11" fill="#ffffff" />

                    {/* Dark Glossy Rat Pupil / Iris */}
                    <circle cx={170 + (physicsState.eyeX || 0)} cy={116 + (physicsState.eyeY || 0)} r="7.5" fill="#0f172a" />
                    <circle cx={210 + (physicsState.eyeX || 0)} cy={116 + (physicsState.eyeY || 0)} r="7.5" fill="#0f172a" />

                    {/* Cute Glint Highlights */}
                    <circle cx={167 + (physicsState.eyeX || 0)} cy={112 + (physicsState.eyeY || 0)} r="3" fill="#ffffff" />
                    <circle cx={207 + (physicsState.eyeX || 0)} cy={112 + (physicsState.eyeY || 0)} r="3" fill="#ffffff" />
                    <circle cx={173 + (physicsState.eyeX || 0)} cy={119 + (physicsState.eyeY || 0)} r="1.5" fill="#38bdf8" />
                    <circle cx={213 + (physicsState.eyeX || 0)} cy={119 + (physicsState.eyeY || 0)} r="1.5" fill="#38bdf8" />
                  </>
                )}
              </g>

              {/* RAT SNOUT & PINK NOSE */}
              <path
                d="M162 130 Q190 124 218 130 L206 141 Q190 143 174 141 Z"
                fill="#e2e8f0"
              />
              
              {/* Pink Rat Nose */}
              <ellipse cx="190" cy="135" rx="7.5" ry="5.5" fill="url(#ratPinkGrad)" />
              <ellipse cx="188" cy="133.5" rx="2.5" ry="1.5" fill="#ffffff" opacity="0.8" />

              {/* DYNAMIC TWITCHING WHISKERS */}
              <g id="rat-whiskers" stroke="#cbd5e1" strokeWidth="1.8" strokeLinecap="round">
                {/* Left Whiskers */}
                <line x1="168" y1="138" x2={110 + physicsState.whiskerTwitch} y2={126 - physicsState.whiskerTwitch * 0.5} />
                <line x1="166" y1="142" x2={105 - physicsState.whiskerTwitch} y2={142 + physicsState.whiskerTwitch * 0.5} />
                <line x1="168" y1="146" x2={112 + physicsState.whiskerTwitch} y2={156 + physicsState.whiskerTwitch * 0.5} />

                {/* Right Whiskers */}
                <line x1="212" y1="138" x2={270 - physicsState.whiskerTwitch} y2={126 - physicsState.whiskerTwitch * 0.5} />
                <line x1="214" y1="142" x2={275 + physicsState.whiskerTwitch} y2={142 + physicsState.whiskerTwitch * 0.5} />
                <line x1="212" y1="146" x2={268 - physicsState.whiskerTwitch} y2={156 - physicsState.whiskerTwitch * 0.5} />
              </g>

              {/* SPEECH LIP-SYNC MOUTH & BUCK RAT TEETH */}
              <g id="rat-mouth-viseme-animation">
                {/* Outer Pink Lips Stroke & Dark Mouth Cavity */}
                <ellipse
                  cx="190"
                  cy={mouthParams.mouthY}
                  rx={mouthParams.rx}
                  ry={mouthParams.ry}
                  fill={mouthParams.innerColor}
                  stroke="#e11d48"
                  strokeWidth="2"
                />

                {/* Cute Pink Tongue inside open mouth */}
                {mouthParams.ry > 5 && (
                  <path
                    d={`M${190 - mouthParams.rx + 3} ${mouthParams.mouthY + 1} Q190 ${mouthParams.mouthY + mouthParams.ry - 1} ${190 + mouthParams.rx - 3} ${mouthParams.mouthY + 1} Z`}
                    fill="#f43f5e"
                    opacity="0.9"
                  />
                )}

                {/* Rat Buck Incisors (Teeth) mounted under nose at top lip edge */}
                <path
                  d="M185 142 L185 149 L189.5 149 L189.5 142 Z M190.5 142 L190.5 149 L195 149 L195 142 Z"
                  fill="#ffffff"
                  stroke="#94a3b8"
                  strokeWidth="0.8"
                />

                {/* Expressive Lower Lip line that articulates down with viseme mouth opening */}
                <path
                  d={`M${190 - mouthParams.rx} ${mouthParams.mouthY} Q190 ${mouthParams.mouthY + mouthParams.ry + 2} ${190 + mouthParams.rx} ${mouthParams.mouthY}`}
                  fill="none"
                  stroke="#fda4af"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </g>
            </g>
          </svg>
        </div>
      )}
    </div>
  );
};

