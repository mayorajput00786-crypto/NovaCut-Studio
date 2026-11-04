export type AspectRatioType = '9:16' | '1:1' | '16:9' | '4:5' | '4:3';

export type FitMode = 'blur_fill' | 'fit' | 'fill' | 'color';

export interface VideoClip {
  id: string;
  name: string;
  src: string;
  duration: number; // in seconds
  width: number;
  height: number;
  startTime: number;
  endTime: number;
  volume: number; // 0 to 1
  speed: number; // 0.25 to 2.0
  isLowRes: boolean; // true if width < 780 or height < 780
}

export interface TextOverlay {
  id: string;
  text: string;
  startTime: number;
  endTime: number;
  color: string;
  backgroundColor?: string;
  fontSize: number;
  position: 'top' | 'center' | 'bottom' | 'custom';
  x?: number; // percentage
  y?: number; // percentage
  fontFamily: string;
  animation?: 'fade' | 'bounce' | 'pop' | 'typewriter' | 'none';
  role?: 'question' | 'option_a' | 'option_b' | 'answer_reveal' | 'badge' | 'timer' | 'subtitles' | 'general' | 'hook' | 'custom';
  isCorrectAnswer?: boolean;
  revealedAt?: number; // time in seconds when this option illuminates or reveals
  boxStyle?: 'pill' | 'card' | 'badge' | 'neon' | 'glow' | 'minimal';
}

export interface VideoFilters {
  brightness: number; // 50 to 150
  contrast: number; // 50 to 150
  saturation: number; // 0 to 200
  sepia: number; // 0 to 100
  blur: number; // 0 to 10
  hueRotate: number; // 0 to 360
  preset: 'normal' | 'cinematic' | 'cyberpunk' | 'warm_vintage' | 'crisp_hdr' | 'clean_studio';
}

export interface AntiCopyrightConfig {
  enabled: boolean;
  tempoShift: number; // e.g. 1.02 (+2%)
  microPitchVariance: boolean;
  microZoom: number; // e.g. 1.03 (3% zoom to break spatial fingerprint)
  horizontalFlip: boolean;
  filmGrain: boolean;
  colorShiftLut: boolean;
  subtleAudioDither: boolean;
}

export interface SuperResolutionConfig {
  autoEnhanceLowRes: boolean;
  sharpness: number; // 0 to 100
  denoise: number; // 0 to 100
  edgeClarity: number; // 0 to 100
  upscaleTarget: '1080p' | '2k' | '4k';
}

export interface UserProfile {
  email: string;
  role: 'owner_admin' | 'licensed_user' | 'guest';
  isOwner: boolean;
  displayName: string;
  plan: string;
  licenseKey?: string;
  expiresAt?: string | null;
  unlimited?: boolean;
  permissions: string[];
}

export interface ExportHistoryItem {
  id: string;
  hash: string;
  title: string;
  duration: number;
  aspectRatio: string;
  resolution: string;
  exportedAt: string;
  exportedBy: string;
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  previousExport?: ExportHistoryItem;
  remainingDays?: number;
  message?: string;
}

export interface BulkDataColumn {
  id: string;
  name: string;
  key: string;
  mappedOverlayId?: string; // which text layer this column binds to
  type?: 'text' | 'background_prompt' | 'background_media';
}

export interface BulkDataRow {
  id: string;
  data: Record<string, string>; // e.g. { Question: '...', Option_A: '...', Option_B: '...', Correct_Answer: '...', Background_Prompt: '...' }
  backgroundMediaId?: string; // specific background media clip id or url
  backgroundPrompt?: string; // prompt describing image or video background
  generatedBackgroundUrl?: string; // generated AI image URL or rendered asset
}

export interface BulkCreateConfig {
  enabled: boolean;
  columns: BulkDataColumn[];
  rows: BulkDataRow[];
  bgRotationMode: 'cycle' | 'random' | 'specific' | 'same' | 'prompt_ai';
  selectedMediaPoolIds: string[];
  activePreviewIndex: number;
}

export type TransitionType =
  | 'none'
  | 'crossfade'
  | 'slide_left'
  | 'slide_right'
  | 'zoom_blur'
  | 'flash_white'
  | 'whip_pan'
  | 'glitch'
  | 'circle_crop';

export interface TransitionConfig {
  type: TransitionType;
  duration: number; // in seconds (e.g. 0.8)
  triggerTime: number; // in seconds (split point)
  direction?: 'left' | 'right';
}

export interface AudioTrackConfig {
  id: string;
  name: string;
  category: 'quiz' | 'chill' | 'energy' | 'cinematic';
  volume: number; // 0 to 1
  enabled: boolean;
  soundEffectsEnabled: boolean;
}

export interface TemplatePreset {
  id: string;
  title: string;
  category: 'quiz' | 'reels' | 'quote' | 'trivia' | 'product';
  description: string;
  badge: string;
  aspectRatio: AspectRatioType;
  duration: number;
  overlays: TextOverlay[];
  defaultBgPrompt?: string;
  sampleBackgroundUrl?: string;
  bulkColumns?: BulkDataColumn[];
}

export interface StickerOverlay {
  id: string;
  type: 'emoji' | 'badge' | 'timer' | 'arrow' | 'fire' | 'checkmark' | 'sparkle' | 'quiz_card';
  content: string; // e.g. '🩺', '⏱️', '💯', '🔥', '✅', '💡', '🧠'
  label?: string; // e.g. 'MEDICAL QUIZ', 'DID YOU KNOW?'
  x: number; // percentage (0-100)
  y: number; // percentage (0-100)
  scale: number; // 0.5 to 2.0
  animation?: 'pulse' | 'bounce' | 'spin' | 'float' | 'none';
  startTime: number;
  endTime: number;
}

export interface VideoEffectsConfig {
  autoMode: boolean; // true = 1-click auto mode, false = manual
  vignette: boolean;
  particles: boolean;
  cameraPushIn: boolean; // Ken Burns slow zoom
  neonGlow: boolean;
  soundSync: boolean;
  autoVoiceover: boolean; // Voice generator audio embedded in export!
  voiceLanguage: 'en' | 'ur' | 'hi' | 'ar' | 'es';
  durationSeconds: number; // 10 to 15 seconds (default 12)
  soundEffects: boolean; // Countdown ticks + winner chime
}

export interface ProjectState {
  id: string;
  title: string;
  aspectRatio: AspectRatioType;
  fitMode: FitMode;
  clips: VideoClip[];
  textOverlays: TextOverlay[];
  stickers?: StickerOverlay[];
  effectsConfig?: VideoEffectsConfig;
  filters: VideoFilters;
  antiCopyright: AntiCopyrightConfig;
  superResolution: SuperResolutionConfig;
  bulkCreate: BulkCreateConfig;
  transition: TransitionConfig;
  audioTrack?: AudioTrackConfig;
  activeTemplateId?: string;
  currentTime: number;
  duration: number;
  isCloudSynced: boolean;
  lastSavedAt: string;
}

