import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  Tv,
  Shield,
  Layers,
  Sparkles,
  Upload,
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
  StickerOverlay,
  VideoEffectsConfig,
} from '../types';
import { renderCompositeFrame, getResolutionDimensions } from '../services/videoEngine';

interface CanvasPreviewProps {
  aspectRatio: AspectRatioType;
  fitMode: FitMode;
  onChangeFitMode: (mode: FitMode) => void;
  activeClip: VideoClip | null;
  textOverlays: TextOverlay[];
  stickers?: StickerOverlay[];
  effectsConfig?: VideoEffectsConfig;
  duration?: number;
  filters: VideoFilters;
  antiCopyright: AntiCopyrightConfig;
  superRes: SuperResolutionConfig;
  transition: TransitionConfig;
  currentTime: number;
  onTimeUpdate: (time: number) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onUploadFile: (file: File) => void;
}

export const CanvasPreview: React.FC<CanvasPreviewProps> = ({
  aspectRatio,
  fitMode,
  onChangeFitMode,
  activeClip,
  textOverlays,
  stickers,
  effectsConfig,
  duration = 12,
  filters,
  antiCopyright,
  superRes,
  transition,
  currentTime,
  onTimeUpdate,
  isPlaying,
  onTogglePlay,
  onUploadFile,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const imageElementRef = useRef<HTMLImageElement | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [sourceLoaded, setSourceLoaded] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Aspect ratio dimension calculation
  const { width: targetW, height: targetH } = getResolutionDimensions(aspectRatio, '1080p');

  // Load active clip media into hidden video or image element
  useEffect(() => {
    if (!activeClip) {
      setSourceLoaded(false);
      return;
    }

    const isVideo =
      activeClip.src.endsWith('.mp4') ||
      activeClip.src.endsWith('.webm') ||
      activeClip.src.startsWith('blob:') ||
      activeClip.src.includes('video');

    if (isVideo) {
      if (!videoElementRef.current) {
        const v = document.createElement('video');
        v.crossOrigin = 'anonymous';
        v.playsInline = true;
        v.muted = isMuted;
        v.loop = true;
        videoElementRef.current = v;
      }
      const v = videoElementRef.current;
      v.src = activeClip.src;
      v.currentTime = currentTime;
      v.playbackRate = antiCopyright.enabled ? antiCopyright.tempoShift : activeClip.speed || 1.0;
      v.onloadeddata = () => setSourceLoaded(true);
    } else {
      // Image source
      if (!imageElementRef.current) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        imageElementRef.current = img;
      }
      const img = imageElementRef.current;
      img.src = activeClip.src;
      img.onload = () => setSourceLoaded(true);
    }
  }, [activeClip?.src, antiCopyright.enabled, antiCopyright.tempoShift]);

  // Handle Play/Pause
  useEffect(() => {
    if (videoElementRef.current && sourceLoaded) {
      if (isPlaying) {
        videoElementRef.current.playbackRate = antiCopyright.enabled
          ? antiCopyright.tempoShift
          : activeClip?.speed || 1.0;
        videoElementRef.current.play().catch(() => {});
      } else {
        videoElementRef.current.pause();
      }
    }
  }, [isPlaying, sourceLoaded, antiCopyright.enabled, antiCopyright.tempoShift, activeClip?.speed]);

  // Handle Playback Loop animation
  useEffect(() => {
    let animId: number;

    const tick = () => {
      if (isPlaying && activeClip) {
        if (videoElementRef.current) {
          onTimeUpdate(videoElementRef.current.currentTime);
          if (videoElementRef.current.currentTime >= (activeClip.endTime || activeClip.duration)) {
            videoElementRef.current.currentTime = activeClip.startTime || 0;
          }
        } else {
          // Photo Ken Burns animation tick
          const nextTime = currentTime + 0.033;
          if (nextTime >= (activeClip.duration || 10)) {
            onTimeUpdate(0);
          } else {
            onTimeUpdate(nextTime);
          }
        }
      }

      // Draw canvas
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        if (ctx) {
          const sourceElement = videoElementRef.current || imageElementRef.current;
          renderCompositeFrame({
            ctx,
            canvasWidth: targetW,
            canvasHeight: targetH,
            sourceElement,
            fitMode,
            filters,
            antiCopyright,
            superRes,
            isLowRes: activeClip?.isLowRes || false,
            currentTime,
            totalDuration: duration || activeClip?.duration || 12,
            textOverlays,
            stickers,
            effectsConfig,
            transition,
          });
        }
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [
    isPlaying,
    currentTime,
    activeClip,
    targetW,
    targetH,
    fitMode,
    filters,
    antiCopyright,
    superRes,
    transition,
    textOverlays,
    stickers,
    effectsConfig,
    duration,
    onTimeUpdate,
  ]);

  // Seek video element when currentTime changes externally (scrubber)
  useEffect(() => {
    if (videoElementRef.current && Math.abs(videoElementRef.current.currentTime - currentTime) > 0.25) {
      videoElementRef.current.currentTime = currentTime;
    }
  }, [currentTime]);

  const toggleMute = () => {
    if (videoElementRef.current) {
      videoElementRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms}`;
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        onUploadFile(e.dataTransfer.files[0]);
      }
    },
    [onUploadFile]
  );

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      className="flex-1 min-h-0 bg-slate-950/80 flex flex-col items-center justify-between p-3 md:p-6 overflow-hidden relative"
    >
      {/* Top Media Info Bar */}
      <div className="w-full max-w-4xl flex items-center justify-between text-xs text-slate-400 mb-2 px-2 shrink-0">
        <div className="flex items-center gap-3">
          <span className="font-mono text-slate-300">
            {formatTime(currentTime)} / {formatTime(activeClip?.duration || 10)}
          </span>

          {activeClip?.isLowRes && (
            <span className="flex items-center gap-1 text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 text-[11px]">
              <Tv className="w-3 h-3" />
              Source &lt;780p Auto-Upscaled to {superRes.upscaleTarget.toUpperCase()}
            </span>
          )}

          {antiCopyright.enabled && (
            <span className="hidden sm:flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 text-[11px]">
              <Shield className="w-3 h-3" />
              Content-ID Shield ({antiCopyright.tempoShift}x Micro-Pitch)
            </span>
          )}
        </div>

        {/* Fit Mode Switcher */}
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-0.5 rounded-md">
          <button
            onClick={() => onChangeFitMode('blur_fill')}
            className={`px-2 py-0.5 text-[11px] font-medium rounded transition-colors ${
              fitMode === 'blur_fill'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Auto Gaussian Blur Mirror Background (Viral Reels style)"
          >
            Blur Mirror
          </button>
          <button
            onClick={() => onChangeFitMode('fit')}
            className={`px-2 py-0.5 text-[11px] font-medium rounded transition-colors ${
              fitMode === 'fit'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Fit inside frame (Letterbox)"
          >
            Fit
          </button>
          <button
            onClick={() => onChangeFitMode('fill')}
            className={`px-2 py-0.5 text-[11px] font-medium rounded transition-colors ${
              fitMode === 'fill'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Crop to fill full screen"
          >
            Crop Fill
          </button>
        </div>
      </div>

      {/* Main Video Viewport Canvas */}
      <div className="relative flex-1 min-h-0 flex items-center justify-center w-full max-w-4xl my-auto">
        <div
          className="relative max-h-full max-w-full rounded-xl overflow-hidden shadow-2xl shadow-black border border-slate-800 bg-black flex items-center justify-center transition-all duration-300"
          style={{
            aspectRatio:
              aspectRatio === '9:16'
                ? '9 / 16'
                : aspectRatio === '1:1'
                ? '1 / 1'
                : aspectRatio === '4:5'
                ? '4 / 5'
                : aspectRatio === '16:9'
                ? '16 / 9'
                : '4 / 3',
            maxHeight: 'calc(100vh - 330px)',
          }}
        >
          <canvas
            ref={canvasRef}
            width={targetW}
            height={targetH}
            className="w-full h-full object-contain cursor-pointer"
            onClick={onTogglePlay}
          />

          {/* Quick Play Overlay Button when paused */}
          {!isPlaying && (
            <button
              onClick={onTogglePlay}
              className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-slate-900/80 hover:bg-cyan-500 text-white hover:text-slate-950 border border-slate-700/80 flex items-center justify-center transition-all shadow-xl backdrop-blur-sm group"
              title="Click to play"
            >
              <Play className="w-6 h-6 ml-1 group-hover:scale-110 transition-transform" />
            </button>
          )}

          {/* Drag & Drop Prompt if no clip */}
          {!activeClip && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-950/80">
              <Upload className="w-10 h-10 text-cyan-400 mb-3 animate-bounce" />
              <p className="text-sm font-semibold text-slate-200">Drag & Drop any Video / Clip Here</p>
              <p className="text-xs text-slate-400 mt-1">Or choose a preset sample from the left panel</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="mt-4 px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700"
              >
                Browse Video
              </button>
            </div>
          )}
        </div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            onUploadFile(e.target.files[0]);
          }
        }}
        accept="video/*,image/*"
        className="hidden"
      />

      {/* Playback Transport Bar */}
      <div className="w-full max-w-4xl flex items-center justify-between bg-slate-900/90 border border-slate-800 px-4 py-2 rounded-xl mt-3 shrink-0 shadow-lg backdrop-blur-md">
        <div className="flex items-center gap-2">
          {/* Play / Pause */}
          <button
            onClick={onTogglePlay}
            className="w-9 h-9 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center justify-center transition-transform active:scale-95 shadow-md shadow-cyan-500/20"
            title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
          </button>

          {/* Rewind */}
          <button
            onClick={() => onTimeUpdate(0)}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            title="Restart clip"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Mute */}
          <button
            onClick={toggleMute}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>

        {/* Current Timecode */}
        <div className="text-xs font-mono text-slate-300 tracking-wider">
          {formatTime(currentTime)} <span className="text-slate-500">/</span> {formatTime(activeClip?.duration || 10)}
        </div>

        {/* Right Quick Badges */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-[11px] font-mono text-cyan-300">
            <span>{aspectRatio}</span>
            <span className="text-slate-600">·</span>
            <span>{targetW}x{targetH}</span>
          </div>

          <button
            onClick={() => {
              if (canvasRef.current) {
                if (canvasRef.current.requestFullscreen) {
                  canvasRef.current.requestFullscreen();
                }
              }
            }}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            title="Fullscreen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
