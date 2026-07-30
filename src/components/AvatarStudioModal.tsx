import React, { useState } from 'react';
import { X, Sparkles, Upload, Check, Wand2, RefreshCw, UserCheck } from 'lucide-react';
import { AvatarPreset } from '../types';

interface AvatarStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeAvatar: AvatarPreset;
  onSelectAvatar: (preset: AvatarPreset) => void;
  onCustomImageGenerated: (imageUrl: string, name: string) => void;
}

export const AvatarStudioModal: React.FC<AvatarStudioModalProps> = ({
  isOpen,
  onClose,
  activeAvatar,
  onSelectAvatar,
  onCustomImageGenerated,
}) => {
  const [activeTab, setActiveTab] = useState<'presets' | 'generate' | 'upload'>('presets');
  const [prompt, setPrompt] = useState('Photorealistic portrait of a friendly AI voice assistant guide with warm smiling expression');
  const [style, setStyle] = useState('3d photoreal');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPreview, setGeneratedPreview] = useState<string | null>(null);
  const [customName, setCustomName] = useState('Custom AI Assistant');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const presets: AvatarPreset[] = [
    {
      id: 'rat_3d',
      name: 'Rat.ai 3D',
      type: '3d_charan',
      description: '3D stylized Rat character with real-time physics body & tail kinematics',
      sweaterColor: '#64748b',
      pantsColor: '#1e293b',
    },
    {
      id: 'project_storm',
      name: 'Cyber Storm 3D',
      type: '3d_charan',
      description: 'Blender Studio 3D hero with high collar jacket & cyber hair',
      sweaterColor: '#0284c7',
      pantsColor: '#1e293b',
    },
    {
      id: 'photoreal_aria',
      name: 'Aria Photo-Real',
      type: 'photoreal_aria',
      description: 'Photorealistic female voice assistant with vibrant futuristic lighting',
      sweaterColor: '#00e5ff',
      pantsColor: '#1e293b',
      imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
    },
  ];

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/generate-avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, style }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate avatar');

      if (data.imageUrl) {
        setGeneratedPreview(data.imageUrl);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplyGenerated = () => {
    if (!generatedPreview) return;
    onCustomImageGenerated(generatedPreview, customName);
    onClose();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onCustomImageGenerated(reader.result, file.name.replace(/\.[^/.]+$/, ''));
        onClose();
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-cyan-500/40 rounded-3xl shadow-[0_0_50px_rgba(0,229,255,0.2)] overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-cyan-500/20 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <h3 className="text-xl font-bold text-white font-serif italic">Avatar & Photo-Real Studio</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-6">
          <button
            onClick={() => setActiveTab('presets')}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
              activeTab === 'presets'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Avatar Presets
          </button>
          <button
            onClick={() => setActiveTab('generate')}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'generate'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wand2 className="w-4 h-4 text-cyan-400" />
            Generate AI Avatar
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-4 py-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'upload'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-4 h-4" />
            Upload Photo
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === 'presets' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {presets.map((preset) => {
                const isSelected = activeAvatar.id === preset.id && !activeAvatar.imageUrl;
                return (
                  <div
                    key={preset.id}
                    onClick={() => {
                      onSelectAvatar(preset);
                      onClose();
                    }}
                    className={`relative cursor-pointer p-4 rounded-2xl border-2 transition-all flex flex-col items-center text-center group ${
                      isSelected
                        ? 'border-cyan-400 bg-cyan-950/40 shadow-lg shadow-cyan-500/20'
                        : 'border-slate-800 bg-slate-900/60 hover:border-cyan-500/50 hover:bg-slate-800/80'
                    }`}
                  >
                    {preset.type === '3d_charan' ? (
                      <div className="w-20 h-24 rounded-2xl bg-yellow-400/20 border border-yellow-400/50 flex items-center justify-center mb-3">
                        <span className="text-2xl">👦</span>
                      </div>
                    ) : (
                      <img
                        src={preset.imageUrl}
                        alt={preset.name}
                        className="w-20 h-24 object-cover rounded-2xl mb-3 border border-cyan-500/30"
                      />
                    )}

                    <h4 className="text-sm font-bold text-white mb-1">{preset.name}</h4>
                    <p className="text-xs text-slate-400 leading-snug">{preset.description}</p>

                    {isSelected && (
                      <span className="absolute top-3 right-3 p-1 rounded-full bg-cyan-500 text-slate-950">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'generate' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-cyan-300 uppercase tracking-wider mb-2">
                  Avatar Persona Description Prompt
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-950 border border-cyan-500/30 text-cyan-100 rounded-xl p-3 text-sm focus:outline-none focus:border-cyan-400"
                  placeholder="Describe your photorealistic or 3D AI avatar..."
                />
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Style Preset</label>
                  <select
                    value={style}
                    onChange={(e) => setStyle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-xl px-3 py-2 text-sm"
                  >
                    <option value="3d photoreal">3D Photoreal Character</option>
                    <option value="futuristic cyber">Futuristic Cyber Assistant</option>
                    <option value="realistic portrait">Realistic Portrait Photo</option>
                  </select>
                </div>

                <div className="flex-1">
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Avatar Display Name</label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-xl px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full py-3 rounded-xl bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Generating Photo-Real Avatar...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    <span>Generate Avatar with Gemini</span>
                  </>
                )}
              </button>

              {errorMsg && <p className="text-xs text-rose-400">{errorMsg}</p>}

              {generatedPreview && (
                <div className="p-4 rounded-2xl bg-slate-950 border border-cyan-500/40 flex flex-col items-center gap-3">
                  <img
                    src={generatedPreview}
                    alt="Generated Avatar"
                    className="w-40 h-48 object-cover rounded-2xl border-2 border-cyan-400 shadow-lg shadow-cyan-500/30"
                  />
                  <button
                    onClick={handleApplyGenerated}
                    className="px-6 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400 transition-all flex items-center gap-1.5 text-sm"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Set as Active Avatar</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-cyan-500/30 rounded-2xl bg-slate-950/40 space-y-4 text-center">
              <Upload className="w-12 h-12 text-cyan-400 animate-bounce" />
              <div>
                <h4 className="text-base font-bold text-white mb-1">Upload Your Custom Avatar Image</h4>
                <p className="text-xs text-slate-400 max-w-sm">
                  Upload any front-facing photo or portrait. The agent will speak and sync expressions live!
                </p>
              </div>
              <label className="cursor-pointer px-6 py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400 transition-all text-sm">
                <span>Choose Image File</span>
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
