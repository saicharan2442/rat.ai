export type Expression = 'neutral' | 'happy' | 'thinking' | 'speaking' | 'listening' | 'surprised' | 'explaining';

export type Viseme = 'REST' | 'A' | 'E' | 'I' | 'O' | 'U' | 'M' | 'SMILE';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
  expression?: Expression;
  audioUrl?: string;
  isStreaming?: boolean;
}

export interface AvatarPreset {
  id: string;
  name: string;
  type: '3d_charan' | 'photoreal_aria' | 'photoreal_leo' | 'custom';
  description: string;
  sweaterColor: string;
  pantsColor: string;
  imageUrl?: string;
}

export interface VoiceConfig {
  name: string;
  pitch: number;
  rate: number;
  language: string;
  gender: 'male' | 'female' | 'neutral';
}

export interface VisemeFrame {
  viseme: Viseme;
  durationMs: number;
  intensity: number;
}
