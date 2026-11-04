import React, { useRef, useState } from 'react';
import {
  Scissors,
  Plus,
  Trash2,
  ZoomIn,
  ZoomOut,
  Type,
  Music,
  Video,
  ShieldAlert,
  Sparkles,
  MoveHorizontal,
} from 'lucide-react';
import { VideoClip, TextOverlay, AntiCopyrightConfig, TransitionConfig } from '../types';

interface TimelineProps {
  duration: number;
  currentTime: number;
  onSeek: (time: number) => void;
  activeClip: VideoClip | null;
  textOverlays: TextOverlay[];
  onAddText: () => void;
  onDeleteText: (id: string) => void;
  onSplitClip: () => void;
  antiCopyright: AntiCopyrightConfig;
  transition?: TransitionConfig;
}

export const Timeline: React.FC<TimelineProps> = ({
  duration,
  currentTime,
  onSeek,
  activeClip,
  textOverlays,
  onAddText,
  onDeleteText,
  onSplitClip,
  antiCopyright,
  transition,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1); // 0.75x to 2x

  const totalDuration = Math.max(1, duration || 10);
  const playheadPercent = Math.min(100, Math.max(0, (currentTime / totalDuration) * 100));

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    onSeek(ratio * totalDuration);
  };

  // Generate tick markers
  const ticks = [];
  const step = totalDuration <= 15 ? 1 : 2;
  for (let t = 0; t <= totalDuration; t += step) {
    ticks.push(t);
  }

  return (
    <div className="h-48 border-t border-slate-800 bg-slate-950 flex flex-col shrink-0 select-none z-20">
      {/* Timeline Action Header */}
      <div className="h-10 border-b border-slate-800 px-4 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          {/* Split / Cut Tool */}
          <button
            onClick={onSplitClip}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors"
            title="Split clip at playhead"
          >
            <Scissors className="w-3.5 h-3.5 text-cyan-400" />
            <span>Split Clip</span>
          </button>

          {/* Add Text Overlay */}
          <button
            onClick={onAddText}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors"
            title="Add text caption overlay at current position"
          >
            <Type className="w-3.5 h-3.5 text-amber-400" />
            <span>Add Text</span>
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoomLevel((z) => Math.max(0.75, z - 0.25))}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-mono text-slate-400">{Math.round(zoomLevel * 100)}%</span>
          <button
            onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.25))}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Tracks Container with Playhead */}
      <div
        ref={containerRef}
        onClick={handleTimelineClick}
        className="flex-1 overflow-x-auto relative cursor-pointer px-4 py-2 flex flex-col justify-between"
      >
        {/* Time Ruler */}
        <div className="h-5 border-b border-slate-800/80 flex items-end relative mb-1.5 pointer-events-none">
          {ticks.map((t) => {
            const leftPercent = (t / totalDuration) * 100;
            return (
              <div
                key={t}
                className="absolute flex flex-col items-center text-[10px] font-mono text-slate-500 transform -translate-x-1/2"
                style={{ left: `${leftPercent}%` }}
              >
                <span>{t}s</span>
                <div className="h-1.5 w-px bg-slate-700 mt-0.5" />
              </div>
            );
          })}
        </div>

        {/* TRACK 1: Text / Subtitle Overlays */}
        <div className="h-7 bg-slate-900/60 rounded border border-slate-800/80 relative mb-1 flex items-center overflow-hidden">
          <div className="absolute left-2 text-[10px] text-slate-500 font-semibold uppercase tracking-wider flex items-center gap-1 z-10 pointer-events-none">
            <Type className="w-3 h-3 text-amber-400" />
            <span>Text / Captions</span>
          </div>

          {textOverlays.map((t) => {
            const leftPct = (t.startTime / totalDuration) * 100;
            const widthPct = Math.max(4, ((t.endTime - t.startTime) / totalDuration) * 100);
            return (
              <div
                key={t.id}
                className="absolute h-5 top-1 rounded bg-amber-500/20 border border-amber-500/40 text-amber-200 text-[10px] font-medium px-2 flex items-center justify-between group shadow-sm z-10 overflow-hidden"
                style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                onClick={(e) => e.stopPropagation()}
              >
                <span className="truncate">{t.text}</span>
                <button
                  onClick={() => onDeleteText(t.id)}
                  className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity ml-1"
                  title="Delete text layer"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>

        {/* TRACK 2: Main Video Track */}
        <div className="h-10 bg-slate-900 rounded border border-cyan-500/30 relative mb-1 flex items-center overflow-hidden">
          <div className="absolute left-2 text-[10px] text-cyan-400 font-semibold uppercase tracking-wider flex items-center gap-1 z-10 pointer-events-none">
            <Video className="w-3.5 h-3.5" />
            <span>{activeClip?.name || 'Primary Video Clip'}</span>
          </div>

          {/* Filmstrip mock preview */}
          <div className="w-full h-full bg-gradient-to-r from-cyan-950/40 via-cyan-900/20 to-cyan-950/40 flex items-center justify-around opacity-30">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="h-full w-8 border-r border-slate-800" />
            ))}
          </div>
        </div>

        {/* TRACK 3: Audio & Anti-Copyright Modulation Track */}
        <div className="h-7 bg-slate-900/60 rounded border border-slate-800/80 relative flex items-center overflow-hidden">
          <div className="absolute left-2 text-[10px] text-slate-500 font-semibold uppercase tracking-wider flex items-center gap-1 z-10 pointer-events-none">
            <Music className="w-3 h-3 text-indigo-400" />
            <span>Audio {antiCopyright.enabled ? `(Shielded ${antiCopyright.tempoShift}x)` : 'Track'}</span>
          </div>

          {/* Audio Waveform Simulation */}
          <div className="w-full h-full flex items-center gap-1 px-20 opacity-30">
            {Array.from({ length: 48 }).map((_, i) => (
              <div
                key={i}
                className="w-1 bg-indigo-400 rounded-full"
                style={{ height: `${20 + ((i * 17) % 60)}%` }}
              />
            ))}
          </div>
        </div>

        {/* Transition Marker Cue Pin */}
        {transition && transition.type !== 'none' && (
          <div
            className="absolute top-0 bottom-0 z-20 pointer-events-auto flex flex-col items-center cursor-pointer group"
            style={{ left: `${(transition.triggerTime / totalDuration) * 100}%` }}
            onClick={(e) => {
              e.stopPropagation();
              onSeek(transition.triggerTime);
            }}
            title={`Transition: ${transition.type.replace('_', ' ')} (${transition.duration}s at ${transition.triggerTime.toFixed(1)}s)`}
          >
            {/* Top Badge */}
            <div className="px-2 py-0.5 rounded-full bg-indigo-600 hover:bg-indigo-500 border border-indigo-400 text-white text-[9px] font-bold shadow-md shadow-indigo-600/30 flex items-center gap-1 transform -translate-x-1/2 -translate-y-1 group-hover:scale-105 transition-all">
              <MoveHorizontal className="w-2.5 h-2.5" />
              <span className="capitalize">{transition.type.replace('_', ' ')}</span>
            </div>
            {/* Dashed vertical marker line */}
            <div className="w-px flex-1 border-r border-dashed border-indigo-400/80 -translate-x-[0.5px]" />
          </div>
        )}

        {/* Real-Time Interactive Playhead Needle */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-cyan-400 z-30 pointer-events-none shadow-lg shadow-cyan-400/50"
          style={{ left: `${playheadPercent}%` }}
        >
          {/* Top playhead handle */}
          <div className="w-3 h-3.5 bg-cyan-400 rounded-b -translate-x-[5px] -translate-y-1 shadow-md flex items-center justify-center">
            <div className="w-1 h-1 bg-slate-950 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
};
