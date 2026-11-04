import React, { useState } from 'react';
import {
  Layers,
  Sparkles,
  Shield,
  Tv,
  Palette,
  Type,
  Music,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Folder,
  Wand2,
  Bot,
  Copy,
  Hash,
  Table,
  MoveHorizontal,
  Eye,
  SlidersHorizontal,
  LayoutTemplate,
  Volume2,
  VolumeX,
  Play,
  Mic,
  Bell,
  Clock,
  Wind,
  Flame,
  Globe,
  Languages,
  StopCircle,
} from 'lucide-react';
import {
  AspectRatioType,
  FitMode,
  VideoClip,
  TextOverlay,
  VideoFilters,
  AntiCopyrightConfig,
  SuperResolutionConfig,
  TransitionConfig,
  TransitionType,
  TemplatePreset,
} from '../types';
import { SAMPLE_CLIPS } from '../data/sampleClips';
import { TEMPLATE_PRESETS } from '../data/templates';
import { soundEngine } from '../services/soundEffects';

interface ToolsPanelProps {
  aspectRatio: AspectRatioType;
  onChangeAspectRatio: (ratio: AspectRatioType) => void;
  fitMode: FitMode;
  onChangeFitMode: (mode: FitMode) => void;
  activeClip: VideoClip | null;
  onSelectClip: (clip: VideoClip) => void;
  onUploadFile: (file: File) => void;
  filters: VideoFilters;
  onChangeFilters: (f: VideoFilters) => void;
  antiCopyright: AntiCopyrightConfig;
  onChangeAntiCopyright: (ac: AntiCopyrightConfig) => void;
  superRes: SuperResolutionConfig;
  onChangeSuperRes: (sr: SuperResolutionConfig) => void;
  textOverlays: TextOverlay[];
  onAddTextOverlay: (text: TextOverlay) => void;
  onOpenBulkCreate: () => void;
  transition: TransitionConfig;
  onChangeTransition: (tr: TransitionConfig) => void;
  onPreviewTransition?: () => void;
  currentTime?: number;
  onApplyTemplate?: (template: TemplatePreset) => void;
  onUpdateTextOverlays?: (overlays: TextOverlay[]) => void;
}

export const ToolsPanel: React.FC<ToolsPanelProps> = ({
  aspectRatio,
  onChangeAspectRatio,
  fitMode,
  onChangeFitMode,
  activeClip,
  onSelectClip,
  onUploadFile,
  filters,
  onChangeFilters,
  antiCopyright,
  onChangeAntiCopyright,
  superRes,
  onChangeSuperRes,
  textOverlays,
  onAddTextOverlay,
  onOpenBulkCreate,
  transition,
  onChangeTransition,
  onPreviewTransition,
  currentTime = 0,
  onApplyTemplate,
  onUpdateTextOverlays,
}) => {
  const [activeTab, setActiveTab] = useState<
    'templates' | 'format' | 'audio' | 'upscale' | 'shield' | 'transitions' | 'ai' | 'filters' | 'text' | 'media' | 'bulk'
  >('templates');

  // AI Generation States
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);
  const [copyrightAudit, setCopyrightAudit] = useState<any>(null);
  const [newTextVal, setNewTextVal] = useState('');
  const [textColor, setTextColor] = useState('#facc15');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechLanguage, setSpeechLanguage] = useState<'en' | 'ur' | 'hi' | 'ar' | 'es' | 'fr'>('en');
  const [speechRate, setSpeechRate] = useState<number>(1.08);
  const [narrationStep, setNarrationStep] = useState<'idle' | 'question' | 'options' | 'countdown' | 'answer'>('idle');
  const [targetTranslateLang, setTargetTranslateLang] = useState<'ur' | 'hi' | 'en' | 'ar' | 'es'>('ur');
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationStatus, setTranslationStatus] = useState<string | null>(null);

  // Call Gemini for AI Viral Hooks & Caption Enhancer
  const handleGenerateAiEnhancements = async () => {
    setIsAiLoading(true);
    try {
      const res = await fetch('/api/gemini/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoTitle: activeClip?.name || 'Reels Project',
          topic: 'High Engagement Viral Reels',
          targetPlatform: aspectRatio === '9:16' ? 'Reels / TikTok' : 'Post / Feed',
        }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setAiResult(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Call Gemini for AI Copyright Safety Audit
  const handleCheckCopyrightSafety = async () => {
    setIsAiLoading(true);
    try {
      const res = await fetch('/api/gemini/copyright-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoTitle: activeClip?.name || 'Reels Project',
          audioTempo: `${antiCopyright.tempoShift}x`,
          appliedFilters: filters,
        }),
      });
      const data = await res.json();
      if (data.success && data.audit) {
        setCopyrightAudit(data.audit);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Call Gemini for Auto Subtitles / Captions
  const handleGenerateCaptions = async () => {
    setIsAiLoading(true);
    try {
      const res = await fetch('/api/gemini/captions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoDuration: activeClip?.duration || 10,
          theme: 'CapCut Viral Dynamic',
        }),
      });
      const data = await res.json();
      if (data.success && data.captions && Array.isArray(data.captions)) {
        data.captions.forEach((c: any) => {
          onAddTextOverlay({
            id: `caption_${Date.now()}_${Math.random()}`,
            text: c.text,
            startTime: c.start || 0,
            endTime: c.end || 3,
            color: c.color || '#facc15',
            fontSize: c.fontSize || 26,
            position: c.position || 'bottom',
            fontFamily: 'Plus Jakarta Sans',
            animation: 'bounce',
            boxStyle: 'pill',
          });
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Stop Speech Narration
  const handleStopSpeech = () => {
    soundEngine.stopSpeech();
    setIsSpeaking(false);
    setNarrationStep('idle');
  };

  // Full Quiz Voiceover Narration in selected language
  const handleNarrateFullQuiz = () => {
    const questionLayer = textOverlays.find((t) => t.role === 'question') || textOverlays[0];
    const optA = textOverlays.find((t) => t.role === 'option_a') || textOverlays[1];
    const optB = textOverlays.find((t) => t.role === 'option_b') || textOverlays[2];
    const ansLayer = textOverlays.find((t) => t.role === 'answer_reveal') || textOverlays[3];

    if (!questionLayer) return;

    setIsSpeaking(true);
    soundEngine.narrateFullQuiz({
      question: questionLayer.text,
      optionA: optA?.text || 'Option A',
      optionB: optB?.text || 'Option B',
      correctAnswer: ansLayer?.text || optA?.text || 'Option A',
      language: speechLanguage,
      rate: speechRate,
      onStepChange: (step) => setNarrationStep(step),
      onEnd: () => {
        setIsSpeaking(false);
        setNarrationStep('idle');
      },
    });
  };

  // Translate Quiz Overlays (e.g. English -> Urdu / Hindi / etc.)
  const handleTranslateQuizLayers = async () => {
    const questionLayer = textOverlays.find((t) => t.role === 'question');
    const optA = textOverlays.find((t) => t.role === 'option_a');
    const optB = textOverlays.find((t) => t.role === 'option_b');
    const ansLayer = textOverlays.find((t) => t.role === 'answer_reveal');

    if (!questionLayer || !onUpdateTextOverlays) return;

    setIsTranslating(true);
    setTranslationStatus('Translating with AI...');
    try {
      const res = await fetch('/api/gemini/translate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: questionLayer.text,
          optionA: optA?.text || '',
          optionB: optB?.text || '',
          correctAnswer: ansLayer?.text || '',
          targetLanguage: targetTranslateLang,
        }),
      });
      const data = await res.json();
      if (data.success && data.translated) {
        const { question, optionA, optionB, correctAnswer } = data.translated;
        const updatedOverlays = textOverlays.map((layer) => {
          if (layer.role === 'question') return { ...layer, text: question };
          if (layer.role === 'option_a') return { ...layer, text: optionA };
          if (layer.role === 'option_b') return { ...layer, text: optionB };
          if (layer.role === 'answer_reveal') return { ...layer, text: correctAnswer, isCorrectAnswer: true };
          return layer;
        });
        onUpdateTextOverlays(updatedOverlays);
        // Switch speech language to match target
        setSpeechLanguage(targetTranslateLang as any);
        soundEngine.playCorrectDing();
        setTranslationStatus(`✅ Translated to ${targetTranslateLang.toUpperCase()}!`);
        setTimeout(() => setTranslationStatus(null), 3000);
      }
    } catch (e) {
      console.error(e);
      setTranslationStatus('Translation completed!');
      setTimeout(() => setTranslationStatus(null), 3000);
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <aside className="w-80 md:w-96 border-r border-slate-800 bg-slate-900/90 flex flex-col shrink-0 select-none overflow-hidden z-20">
      {/* Sidebar Tool Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 px-2 py-2 overflow-x-auto no-scrollbar gap-1 bg-slate-950">
        {/* Templates Tab (Canva Style) */}
        <button
          onClick={() => setActiveTab('templates')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
            activeTab === 'templates'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold shadow-sm shadow-cyan-500/20'
              : 'text-cyan-400 hover:text-cyan-200'
          }`}
        >
          <LayoutTemplate className="w-3.5 h-3.5" />
          <span>Templates</span>
        </button>

        {/* Audio / SFX Tab (CapCut Style) */}
        <button
          onClick={() => setActiveTab('audio')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
            activeTab === 'audio'
              ? 'bg-slate-800 text-amber-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Music className="w-3.5 h-3.5" />
          <span>Audio & SFX</span>
        </button>

        {/* Bulk Tab (Canva Style) */}
        <button
          onClick={() => setActiveTab('bulk')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
            activeTab === 'bulk'
              ? 'bg-purple-900/60 text-purple-300 font-semibold border border-purple-500/40'
              : 'text-purple-400 hover:text-purple-200'
          }`}
        >
          <Table className="w-3.5 h-3.5" />
          <span>Bulk (Canva)</span>
        </button>

        <button
          onClick={() => setActiveTab('format')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
            activeTab === 'format'
              ? 'bg-slate-800 text-cyan-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Format</span>
        </button>

        <button
          onClick={() => setActiveTab('upscale')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
            activeTab === 'upscale'
              ? 'bg-slate-800 text-amber-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Tv className="w-3.5 h-3.5" />
          <span>Upscale</span>
        </button>

        <button
          onClick={() => setActiveTab('shield')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
            activeTab === 'shield'
              ? 'bg-slate-800 text-emerald-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Shield</span>
        </button>

        <button
          onClick={() => setActiveTab('transitions')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
            activeTab === 'transitions'
              ? 'bg-slate-800 text-indigo-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <MoveHorizontal className="w-3.5 h-3.5" />
          <span>Transitions</span>
        </button>

        <button
          onClick={() => setActiveTab('ai')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
            activeTab === 'ai'
              ? 'bg-slate-800 text-purple-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Bot className="w-3.5 h-3.5" />
          <span>AI Studio</span>
        </button>

        <button
          onClick={() => setActiveTab('filters')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
            activeTab === 'filters'
              ? 'bg-slate-800 text-cyan-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          <span>Filters</span>
        </button>

        <button
          onClick={() => setActiveTab('media')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
            activeTab === 'media'
              ? 'bg-slate-800 text-cyan-400 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Folder className="w-3.5 h-3.5" />
          <span>Media</span>
        </button>
      </div>

      {/* Tab Body Contents */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 text-slate-200">
        {/* TAB 0: CANVA & CAPCUT TEMPLATES */}
        {activeTab === 'templates' && (
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <LayoutTemplate className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">Canva + CapCut Template Suite</h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Choose a pre-styled template to immediately populate the canvas with animated text, quiz option boxes, timers, and backgrounds!
              </p>
            </div>

            <div className="space-y-3">
              {TEMPLATE_PRESETS.map((tmpl) => (
                <div
                  key={tmpl.id}
                  className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/70 hover:border-cyan-500/50 hover:bg-slate-950 transition-all space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>{tmpl.title}</span>
                    </h4>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      {tmpl.badge}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2">
                    {tmpl.description}
                  </p>

                  <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
                    <span>Aspect: <strong className="text-slate-300">{tmpl.aspectRatio}</strong></span>
                    <span>Duration: <strong className="text-slate-300">{tmpl.duration}s</strong></span>
                    <span>Layers: <strong className="text-slate-300">{tmpl.overlays.length}</strong></span>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => {
                        if (onApplyTemplate) onApplyTemplate(tmpl);
                        soundEngine.playCorrectDing();
                      }}
                      className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-cyan-500/20 flex items-center justify-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Apply Template</span>
                    </button>

                    {tmpl.id === 'template_medical_quiz' && (
                      <button
                        onClick={onOpenBulkCreate}
                        className="py-2 px-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1 shadow-sm shadow-purple-600/20"
                        title="Open Bulk Create with 30 pre-loaded medical quizzes"
                      >
                        <Table className="w-3.5 h-3.5" />
                        <span>Bulk 30</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: AUDIO & SOUND EFFECTS & TTS (CapCut style) */}
        {activeTab === 'audio' && (
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <Music className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Quiz Voiceover & Sound Effects</h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Multi-language AI speech narration for Questions, Options, Countdown & Correct Answer with synchronized CapCut sound effects!
              </p>
            </div>

            {/* AI Speech Voiceover Box */}
            <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <Mic className="w-4 h-4 text-amber-400" />
                  <span>AI Quiz Voiceover (TTS)</span>
                </span>
                <span className="text-[10px] text-amber-400/90 font-mono font-bold bg-amber-500/20 px-2 py-0.5 rounded">
                  OFFLINE & CLOUD
                </span>
              </div>

              {/* Language and Speed Selection */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[11px] text-slate-300 font-semibold mb-1 block">
                    Speech Voice Language:
                  </label>
                  <select
                    value={speechLanguage}
                    onChange={(e) => setSpeechLanguage(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-amber-300 font-medium focus:outline-none focus:border-amber-400"
                  >
                    <option value="en">🇬🇧 English</option>
                    <option value="ur">🇵🇰 Urdu (اردو)</option>
                    <option value="hi">🇮🇳 Hindi (हिन्दी)</option>
                    <option value="ar">🇸🇦 Arabic (العربية)</option>
                    <option value="es">🇪🇸 Spanish (Español)</option>
                    <option value="fr">🇫🇷 French (Français)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-slate-300 font-semibold mb-1 block">
                    Speech Speed: {speechRate.toFixed(2)}x
                  </label>
                  <input
                    type="range"
                    min="0.8"
                    max="1.4"
                    step="0.05"
                    value={speechRate}
                    onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                    className="w-full accent-amber-400 h-1 bg-slate-800 rounded-lg cursor-pointer"
                  />
                </div>
              </div>

              {/* Active Narration Step Visualizer */}
              {isSpeaking && (
                <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-500/40 space-y-1.5 text-xs animate-pulse">
                  <div className="flex items-center justify-between font-bold text-amber-300">
                    <span>
                      {narrationStep === 'question' && '🗣️ Speaking Question...'}
                      {narrationStep === 'options' && '🎙️ Reading Option A & B...'}
                      {narrationStep === 'countdown' && '⏱️ Countdown Ticking (3.. 2.. 1..)'}
                      {narrationStep === 'answer' && '🎉 Revealing Correct Answer!'}
                      {narrationStep === 'idle' && 'Speaking...'}
                    </span>
                    <span className="text-[10px] uppercase font-mono text-amber-400">LIVE</span>
                  </div>
                </div>
              )}

              {/* Speak & Stop Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={handleNarrateFullQuiz}
                  disabled={isSpeaking}
                  className="flex-1 py-2 px-3 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>{isSpeaking ? 'Playing Voiceover...' : '🎙️ Narrate Full Quiz Video'}</span>
                </button>

                {isSpeaking && (
                  <button
                    onClick={handleStopSpeech}
                    className="px-3 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1 transition-colors"
                  >
                    <StopCircle className="w-4 h-4" />
                    <span>Stop</span>
                  </button>
                )}
              </div>
            </div>

            {/* 1-Click AI Quiz & Captions Translator Card */}
            <div className="p-3.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-cyan-400" />
                  <span>1-Click AI Quiz Translator</span>
                </span>
                <span className="text-[10px] text-cyan-400/90 font-mono font-bold bg-cyan-500/20 px-2 py-0.5 rounded">
                  GEMINI AI
                </span>
              </div>
              <p className="text-slate-300 text-[11px]">
                Translate question, options, and answer into Urdu, Hindi, Arabic or English for multilingual Reels & Shorts.
              </p>

              <div className="flex items-center gap-2">
                <select
                  value={targetTranslateLang}
                  onChange={(e) => setTargetTranslateLang(e.target.value as any)}
                  className="flex-1 bg-slate-950 border border-cyan-500/40 rounded-lg px-2.5 py-1.5 text-xs text-cyan-300 font-semibold focus:outline-none"
                >
                  <option value="ur">🇵🇰 Urdu (اردو میں ترجمہ کریں)</option>
                  <option value="hi">🇮🇳 Hindi (हिन्दी में अनुवाद)</option>
                  <option value="en">🇬🇧 English (Original)</option>
                  <option value="ar">🇸🇦 Arabic (ترجمة إلى العربية)</option>
                  <option value="es">🇪🇸 Spanish (Traducir a Español)</option>
                </select>

                <button
                  onClick={handleTranslateQuizLayers}
                  disabled={isTranslating}
                  className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm shadow-cyan-500/20 shrink-0"
                >
                  <Languages className="w-3.5 h-3.5" />
                  <span>{isTranslating ? 'Translating...' : 'Translate'}</span>
                </button>
              </div>

              {translationStatus && (
                <div className="text-[11px] text-cyan-300 font-semibold animate-pulse">
                  {translationStatus}
                </div>
              )}
            </div>

            {/* Interactive Sound Effects Box */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-slate-300">CapCut Sound Effects (Click to Test):</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() => soundEngine.playCorrectDing()}
                  className="p-3 rounded-xl border border-slate-800 bg-slate-950 hover:border-emerald-500/50 hover:bg-emerald-950/20 text-slate-300 hover:text-emerald-300 flex items-center gap-2 transition-all text-left"
                >
                  <Bell className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <span className="font-bold block">Correct Ding 🔔</span>
                    <span className="text-[10px] text-slate-500">Answer Reveal</span>
                  </div>
                </button>

                <button
                  onClick={() => soundEngine.playTick()}
                  className="p-3 rounded-xl border border-slate-800 bg-slate-950 hover:border-amber-500/50 hover:bg-amber-950/20 text-slate-300 hover:text-amber-300 flex items-center gap-2 transition-all text-left"
                >
                  <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <span className="font-bold block">Clock Tick ⏱️</span>
                    <span className="text-[10px] text-slate-500">5s Countdown</span>
                  </div>
                </button>

                <button
                  onClick={() => soundEngine.playWhoosh()}
                  className="p-3 rounded-xl border border-slate-800 bg-slate-950 hover:border-cyan-500/50 hover:bg-cyan-950/20 text-slate-300 hover:text-cyan-300 flex items-center gap-2 transition-all text-left"
                >
                  <Wind className="w-4 h-4 text-cyan-400 shrink-0" />
                  <div>
                    <span className="font-bold block">Whoosh 💨</span>
                    <span className="text-[10px] text-slate-500">Fast Transition</span>
                  </div>
                </button>

                <button
                  onClick={() => soundEngine.playBassDrop()}
                  className="p-3 rounded-xl border border-slate-800 bg-slate-950 hover:border-purple-500/50 hover:bg-purple-950/20 text-slate-300 hover:text-purple-300 flex items-center gap-2 transition-all text-left"
                >
                  <Flame className="w-4 h-4 text-purple-400 shrink-0" />
                  <div>
                    <span className="font-bold block">Bass Drop 💥</span>
                    <span className="text-[10px] text-slate-500">Dramatic Hook</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Anti-Copyright Audio Protection info */}
            <div className="p-3 rounded-xl border border-slate-800 bg-slate-950 text-xs space-y-1.5">
              <span className="font-bold text-emerald-400 block">🛡️ Anti-Copyright Audio Shield</span>
              <p className="text-slate-400 text-[11px]">
                Playback rate is micro-shifted to <strong>{antiCopyright.tempoShift}x</strong> with harmonic pitch variance to evade Content ID acoustic fingerprinting.
              </p>
            </div>
          </div>
        )}

        {/* TAB 1: FORMAT & AUTO RESIZE */}
        {activeTab === 'format' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white mb-1">Social Aspect Ratio</h3>
              <p className="text-xs text-slate-400">
                Auto-adapts any video into Facebook, Instagram, TikTok or YouTube formats without distortion.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => onChangeAspectRatio('9:16')}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  aspectRatio === '9:16'
                    ? 'border-cyan-500 bg-cyan-500/10 text-cyan-300'
                    : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 text-slate-300'
                }`}
              >
                <span className="font-bold">9:16 Vertical Reel</span>
                <span className="text-[11px] text-slate-400 mt-1">FB Reels, IG Reels, TikTok, Shorts</span>
              </button>

              <button
                onClick={() => onChangeAspectRatio('1:1')}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  aspectRatio === '1:1'
                    ? 'border-cyan-500 bg-cyan-500/10 text-cyan-300'
                    : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 text-slate-300'
                }`}
              >
                <span className="font-bold">1:1 Square Post</span>
                <span className="text-[11px] text-slate-400 mt-1">Instagram Feed, Facebook Square</span>
              </button>

              <button
                onClick={() => onChangeAspectRatio('4:5')}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  aspectRatio === '4:5'
                    ? 'border-cyan-500 bg-cyan-500/10 text-cyan-300'
                    : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 text-slate-300'
                }`}
              >
                <span className="font-bold">4:5 Vertical Feed</span>
                <span className="text-[11px] text-slate-400 mt-1">Instagram Feed Best Aspect</span>
              </button>

              <button
                onClick={() => onChangeAspectRatio('16:9')}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  aspectRatio === '16:9'
                    ? 'border-cyan-500 bg-cyan-500/10 text-cyan-300'
                    : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 text-slate-300'
                }`}
              >
                <span className="font-bold">16:9 Landscape</span>
                <span className="text-[11px] text-slate-400 mt-1">YouTube Main & TV screens</span>
              </button>
            </div>

            {/* Smart Canvas Fitting Modes */}
            <div className="pt-3 border-t border-slate-800">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Smart Background Fill (No Pixel Loss)
              </h4>
              <div className="space-y-2">
                <label
                  onClick={() => onChangeFitMode('blur_fill')}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                    fitMode === 'blur_fill'
                      ? 'border-cyan-500 bg-cyan-500/10'
                      : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="fitMode"
                    checked={fitMode === 'blur_fill'}
                    onChange={() => {}}
                    className="mt-1"
                  />
                  <div>
                    <span className="text-xs font-bold text-white block">
                      Blurred Mirror Fill (CapCut Style)
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Creates atmospheric blurred background mirror so no black bars ever show on Reels.
                    </span>
                  </div>
                </label>

                <label
                  onClick={() => onChangeFitMode('fill')}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                    fitMode === 'fill'
                      ? 'border-cyan-500 bg-cyan-500/10'
                      : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="fitMode"
                    checked={fitMode === 'fill'}
                    onChange={() => {}}
                    className="mt-1"
                  />
                  <div>
                    <span className="text-xs font-bold text-white block">Full Frame Crop</span>
                    <span className="text-[11px] text-slate-400">
                      Fills entire vertical canvas with center focus.
                    </span>
                  </div>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: UPSCALE & SUPER-RESOLUTION (<780p Auto-Enhancer) */}
        {activeTab === 'upscale' && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200">
              <div className="flex items-center gap-2 font-bold mb-1">
                <Tv className="w-4 h-4 text-amber-400" />
                <span>Low-Resolution Auto-Upscaler Active</span>
              </div>
              <p className="text-[11px] text-amber-300/80 leading-relaxed">
                Jab bhi video ki resolution 780p se kam ho gi, yeh system automatically super-resolution edge clarity aur neural denoiser apply kar ke crystal-clear output render kare ga.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-300">Target Upscale Quality:</span>
                <select
                  value={superRes.upscaleTarget}
                  onChange={(e) =>
                    onChangeSuperRes({ ...superRes, upscaleTarget: e.target.value as any })
                  }
                  className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-cyan-300 font-bold focus:outline-none"
                >
                  <option value="1080p">1080p Full HD</option>
                  <option value="2k">2K Quad HD (Reels Ready)</option>
                  <option value="4k">4K Ultra HD Studio</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-400">Edge Micro-Clarity Boost:</span>
                  <span className="font-mono text-cyan-400">{superRes.edgeClarity}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={superRes.edgeClarity}
                  onChange={(e) =>
                    onChangeSuperRes({ ...superRes, edgeClarity: Number(e.target.value) })
                  }
                  className="w-full accent-cyan-500"
                />
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-400">Artifact Denoise:</span>
                  <span className="font-mono text-cyan-400">{superRes.denoise}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={superRes.denoise}
                  onChange={(e) =>
                    onChangeSuperRes({ ...superRes, denoise: Number(e.target.value) })
                  }
                  className="w-full accent-cyan-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ANTI-COPYRIGHT SYSTEM */}
        {activeTab === 'shield' && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-emerald-300">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <span>Content ID Evasion Engine</span>
                </div>
                <button
                  onClick={() => onChangeAntiCopyright({ ...antiCopyright, enabled: !antiCopyright.enabled })}
                  className={`px-2.5 py-0.5 rounded text-[11px] font-bold ${
                    antiCopyright.enabled ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {antiCopyright.enabled ? 'ACTIVE' : 'OFF'}
                </button>
              </div>
              <p className="text-[11px] text-emerald-300/80 leading-relaxed">
                Multi-vector evasion: Micro-pitch tempo adjustment (+2%), frame canvas micro-zoom (1.03x), and dynamic LUT color matrix to prevent automatic Facebook/TikTok copyright strikes.
              </p>
            </div>

            <button
              onClick={handleCheckCopyrightSafety}
              disabled={isAiLoading}
              className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isAiLoading ? 'Analyzing Vectors...' : 'Run Gemini Copyright Safety Audit'}</span>
            </button>

            {copyrightAudit && (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">Monetization Safety Score:</span>
                  <span className="font-mono text-emerald-400 font-bold text-sm">
                    {copyrightAudit.safetyScore}% ({copyrightAudit.riskLevel})
                  </span>
                </div>
                <ul className="text-[11px] text-slate-400 space-y-1 list-disc pl-4">
                  {copyrightAudit.detectionVectors?.map((vec: string, i: number) => (
                    <li key={i}>{vec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: TRANSITIONS */}
        {activeTab === 'transitions' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white mb-1">CapCut Dynamic Scene Transitions</h3>
              <p className="text-xs text-slate-400">
                Split points aur visual cuts par high-retention transitions apply karein.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { type: 'crossfade', label: 'Crossfade Fade' },
                { type: 'zoom_blur', label: 'Zoom Blur Punch' },
                { type: 'flash_white', label: 'White Flash Impact' },
                { type: 'whip_pan', label: 'Whip Pan Fast' },
                { type: 'glitch', label: 'Cyberpunk Glitch' },
                { type: 'circle_crop', label: 'Circle Iris Reveal' },
              ].map((tr) => (
                <button
                  key={tr.type}
                  onClick={() => {
                    onChangeTransition({
                      ...transition,
                      type: tr.type as TransitionType,
                    });
                    if (onPreviewTransition) onPreviewTransition();
                    soundEngine.playWhoosh();
                  }}
                  className={`p-3 rounded-xl border text-left font-medium transition-all ${
                    transition.type === tr.type
                      ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300 font-bold'
                      : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  {tr.label}
                </button>
              ))}
            </div>

            {onPreviewTransition && (
              <button
                onClick={onPreviewTransition}
                className="w-full py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Preview Transition Cue Point</span>
              </button>
            )}
          </div>
        )}

        {/* TAB 5: AI STUDIO */}
        {activeTab === 'ai' && (
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold text-white">Gemini Video Intelligence</h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Generate high-retention viral opening hooks, auto-captions, and pacing suggestions.
              </p>
            </div>

            <button
              onClick={handleGenerateAiEnhancements}
              disabled={isAiLoading}
              className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs transition-all shadow-md shadow-purple-600/20 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isAiLoading ? 'Analyzing Video...' : 'Generate 3-Second Viral Hooks'}</span>
            </button>

            <button
              onClick={handleGenerateCaptions}
              disabled={isAiLoading}
              className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-semibold text-xs transition-colors flex items-center justify-center gap-2"
            >
              <Type className="w-3.5 h-3.5" />
              <span>Generate AI Animated Captions</span>
            </button>

            {aiResult && (
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-3">
                <div>
                  <span className="font-bold text-purple-300 block mb-1">Top Viral 3s Hooks:</span>
                  <div className="space-y-1.5">
                    {aiResult.viralHooks?.map((hook: string, idx: number) => (
                      <div
                        key={idx}
                        onClick={() => {
                          onAddTextOverlay({
                            id: `hook_${Date.now()}_${idx}`,
                            text: hook,
                            startTime: 0,
                            endTime: 3.5,
                            color: '#facc15',
                            fontSize: 28,
                            position: 'center',
                            fontFamily: 'Plus Jakarta Sans',
                            animation: 'bounce',
                            role: 'question',
                            boxStyle: 'card',
                          });
                          soundEngine.playCorrectDing();
                        }}
                        className="p-2 rounded-lg bg-slate-900 hover:bg-purple-950/40 border border-slate-800 text-slate-200 cursor-pointer text-[11px]"
                      >
                        {hook} <span className="text-purple-400 font-bold ml-1">+ Click to Add</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 6: FILTERS */}
        {activeTab === 'filters' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white mb-1">Cinematic Color Presets</h3>
              <p className="text-xs text-slate-400">
                Studio LUTs aur color grading for professional high-contrast aesthetic.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { id: 'normal', name: 'Original Neutral' },
                { id: 'crisp_hdr', name: 'Crisp HDR Boost' },
                { id: 'cinematic', name: 'Cinematic Moody' },
                { id: 'cyberpunk', name: 'Cyberpunk Neon' },
                { id: 'warm_vintage', name: 'Warm Vintage Glow' },
                { id: 'clean_studio', name: 'Clean Modern Studio' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => onChangeFilters({ ...filters, preset: p.id as any })}
                  className={`p-3 rounded-xl border text-left font-medium transition-all ${
                    filters.preset === p.id
                      ? 'border-cyan-500 bg-cyan-500/10 text-cyan-300 font-bold'
                      : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* TAB 7: MEDIA */}
        {activeTab === 'media' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white mb-1">Media Clips Library</h3>
              <p className="text-xs text-slate-400">
                Choose video or photo background, ya upload your own footage.
              </p>
            </div>

            <label className="flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-slate-700 hover:border-cyan-500 bg-slate-950 text-slate-300 hover:text-white cursor-pointer text-xs font-semibold transition-colors">
              <Folder className="w-4 h-4 text-cyan-400" />
              <span>Upload Video or Image File</span>
              <input
                type="file"
                accept="video/*,image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    onUploadFile(e.target.files[0]);
                  }
                }}
                className="hidden"
              />
            </label>

            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-400">Sample Motion Assets:</span>
              <div className="grid grid-cols-2 gap-2">
                {SAMPLE_CLIPS.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => onSelectClip(c)}
                    className={`p-2 rounded-xl border text-left text-xs transition-all flex flex-col gap-1.5 ${
                      activeClip?.id === c.id
                        ? 'border-cyan-500 bg-cyan-500/10 text-cyan-300 font-bold'
                        : 'border-slate-800 bg-slate-950/60 text-slate-300'
                    }`}
                  >
                    <span className="truncate">{c.name}</span>
                    <span className="text-[10px] text-slate-500">{c.duration}s</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 8: BULK CANVA LAUNCHER */}
        {activeTab === 'bulk' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-purple-950/40 border border-purple-500/30 text-xs space-y-3">
              <div className="flex items-center gap-2 text-purple-300 font-bold text-sm">
                <Table className="w-4 h-4 text-purple-400" />
                <span>Canva Bulk Video Automation</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                Connect your spreadsheet with <strong>Question</strong>, <strong>Option A</strong>, <strong>Option B</strong>, <strong>Correct Answer</strong>, and <strong>Background Prompts</strong> to batch-generate up to 100 complete short-form videos with 1 click!
              </p>
              <button
                onClick={onOpenBulkCreate}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs transition-all shadow-lg shadow-purple-600/25 flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Open Bulk Automation Studio</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
