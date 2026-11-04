import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  AlertTriangle,
  CheckCircle2,
  Tv,
  Shield,
  Layers,
  Sparkles,
  Lock,
  Unlock,
  Loader2,
} from 'lucide-react';
import {
  AspectRatioType,
  FitMode,
  VideoClip,
  TextOverlay,
  VideoFilters,
  AntiCopyrightConfig,
  SuperResolutionConfig,
  UserProfile,
  DuplicateCheckResult,
  TransitionConfig,
  StickerOverlay,
  VideoEffectsConfig,
} from '../types';
import {
  generateVideoFingerprint,
  checkDuplicateExport,
  recordNewExport,
} from '../services/duplicateRegistry';
import { exportVideoFile, getResolutionDimensions } from '../services/videoEngine';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectTitle: string;
  activeClip: VideoClip | null;
  aspectRatio: AspectRatioType;
  fitMode: FitMode;
  filters: VideoFilters;
  antiCopyright: AntiCopyrightConfig;
  superRes: SuperResolutionConfig;
  textOverlays: TextOverlay[];
  stickers?: StickerOverlay[];
  effectsConfig?: VideoEffectsConfig;
  duration?: number;
  currentUser: UserProfile;
  transition: TransitionConfig;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  projectTitle,
  activeClip,
  aspectRatio,
  fitMode,
  filters,
  antiCopyright,
  superRes,
  textOverlays,
  stickers,
  effectsConfig,
  duration = 12,
  currentUser,
  transition,
}) => {
  const [resolutionTier, setResolutionTier] = useState<'720p' | '1080p' | '2k' | '4k'>('1080p');
  const [duplicateCheck, setDuplicateCheck] = useState<DuplicateCheckResult | null>(null);
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);
  const [adminBypassDuplicate, setAdminBypassDuplicate] = useState(false);

  // Export progress
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportComplete, setExportComplete] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [exportedFileSize, setExportedFileSize] = useState<string | null>(null);

  const isOwner = currentUser.role === 'owner_admin' || currentUser.email === 'josnking01@gmail.com';

  // Check 30-day duplicate restriction on modal open
  useEffect(() => {
    if (isOpen && activeClip) {
      setIsCheckingDuplicate(true);
      setAdminBypassDuplicate(false);
      setExportComplete(false);
      setExportProgress(0);

      const fp = generateVideoFingerprint(projectTitle, activeClip.duration, activeClip.name);

      checkDuplicateExport(fp, projectTitle, activeClip.duration)
        .then((res) => {
          setDuplicateCheck(res);
        })
        .finally(() => {
          setIsCheckingDuplicate(false);
        });
    }
  }, [isOpen, projectTitle, activeClip?.id, activeClip?.duration]);

  if (!isOpen) return null;

  const { width: finalW, height: finalH } = getResolutionDimensions(aspectRatio, resolutionTier);

  // Trigger Actual Video Rendering
  const handleStartExport = async () => {
    if (!activeClip) return;
    setIsExporting(true);
    setExportProgress(1);

    try {
      // Find source element (from DOM or create virtual element)
      let sourceElem: HTMLVideoElement | HTMLImageElement;
      const isVideo =
        activeClip.src.endsWith('.mp4') ||
        activeClip.src.endsWith('.webm') ||
        activeClip.src.startsWith('blob:') ||
        activeClip.src.includes('video');

      if (isVideo) {
        const v = document.createElement('video');
        v.crossOrigin = 'anonymous';
        v.src = activeClip.src;
        await new Promise((r) => {
          v.onloadedmetadata = r;
          setTimeout(r, 1200); // timeout fallback
        });
        sourceElem = v;
      } else {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = activeClip.src;
        await new Promise((r) => {
          img.onload = r;
          setTimeout(r, 800);
        });
        sourceElem = img;
      }

      const effectiveDuration = duration || activeClip.duration || 12;
      const exportClip: VideoClip = {
        ...activeClip,
        duration: effectiveDuration,
        endTime: effectiveDuration,
      };

      // Run canvas recorder
      const blob = await exportVideoFile({
        sourceElement: sourceElem,
        clip: exportClip,
        aspectRatio,
        fitMode,
        filters,
        antiCopyright,
        superRes,
        textOverlays,
        stickers,
        effectsConfig,
        totalDuration: effectiveDuration,
        transition,
        resolutionTier,
        onProgress: (p) => setExportProgress(p),
      });

      const sizeInMb = (blob.size / (1024 * 1024)).toFixed(2);
      const sizeStr = blob.size > 1024 * 1024 ? `${sizeInMb} MB` : `${Math.round(blob.size / 1024)} KB`;
      setExportedFileSize(sizeStr);

      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
      setExportComplete(true);

      // Automatically trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = `${projectTitle.replace(/\s+/g, '_')}_${resolutionTier}_${aspectRatio.replace(':', 'x')}.webm`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      // Record export in 30-day registry!
      const fp = generateVideoFingerprint(projectTitle, effectiveDuration, activeClip.name);
      await recordNewExport(
        fp,
        projectTitle,
        effectiveDuration,
        aspectRatio,
        `${finalW}x${finalH}`,
        currentUser.email
      );
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const isBlockedByDuplicate = duplicateCheck?.isDuplicate && !adminBypassDuplicate;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
              <Download className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Export Video Studio</h3>
              <p className="text-xs text-slate-400">High-Fidelity Canvas Rendering & Anti-Duplicate Check</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* 30-DAY DUPLICATE PREVENTION NOTICE */}
          {isCheckingDuplicate ? (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-3 text-xs text-slate-400">
              <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
              <span>Verifying 30-day perceptual video duplicate registry...</span>
            </div>
          ) : duplicateCheck?.isDuplicate ? (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-2">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                <span>Pehle Se Mojood Video Notice (30-Day Duplicate Lock)</span>
              </div>
              <p className="text-slate-200 leading-relaxed">
                {duplicateCheck.message ||
                  `Yeh video pehle hi export ho chuki hai. Duplication policy ke tehat aap is video ko ${duplicateCheck.remainingDays} din baad dobara bana sakte hain.`}
              </p>

              <div className="flex items-center justify-between pt-2 border-t border-amber-500/20 text-[11px]">
                <span className="font-mono text-amber-400 font-semibold">
                  Cooldown Remaining: {duplicateCheck.remainingDays} Days
                </span>

                {isOwner ? (
                  <button
                    onClick={() => setAdminBypassDuplicate(!adminBypassDuplicate)}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 font-semibold transition-colors"
                  >
                    {adminBypassDuplicate ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                    <span>{adminBypassDuplicate ? 'Admin Override Active' : 'Owner Admin Override'}</span>
                  </button>
                ) : (
                  <span className="text-slate-400">Duplicate protection enforced</span>
                )}
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs flex items-center gap-2 text-emerald-300">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Duplicate Check Cleared: Video is fresh and eligible for export!</span>
            </div>
          )}

          {/* Export Settings */}
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-2">Export Resolution</label>
              <div className="grid grid-cols-4 gap-2 text-xs">
                {(['720p', '1080p', '2k', '4k'] as const).map((tier) => (
                  <button
                    key={tier}
                    onClick={() => setResolutionTier(tier)}
                    className={`py-2 px-3 rounded-xl border text-center font-bold uppercase transition-all ${
                      resolutionTier === tier
                        ? 'border-cyan-400 bg-cyan-400/10 text-cyan-300'
                        : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {tier}
                  </button>
                ))}
              </div>
            </div>

            {/* Video Specs Summary */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1.5 font-mono">
              <div className="flex justify-between text-slate-400">
                <span>Output Geometry:</span>
                <span className="text-white font-semibold">
                  {finalW} x {finalH} ({aspectRatio})
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Smart Background:</span>
                <span className="text-cyan-400 font-semibold uppercase">{fitMode.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Transition:</span>
                <span className={transition.type !== 'none' ? 'text-indigo-400 font-bold' : 'text-slate-500'}>
                  {transition.type !== 'none' ? `${transition.type.replace('_', ' ').toUpperCase()} (${transition.duration}s)` : 'NONE'}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Anti-Copyright Shield:</span>
                <span className={antiCopyright.enabled ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
                  {antiCopyright.enabled ? `ACTIVE (${antiCopyright.tempoShift}x Micro-Pitch)` : 'INACTIVE'}
                </span>
              </div>
              {activeClip?.isLowRes && (
                <div className="flex justify-between text-slate-400">
                  <span>Low-Res Auto Enhancer:</span>
                  <span className="text-amber-400 font-bold">&lt;780p SD Boost to {resolutionTier.toUpperCase()}</span>
                </div>
              )}
            </div>

            {/* Rendering Progress Indicator */}
            {isExporting && (
              <div className="space-y-2 pt-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-cyan-400 flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Rendering Frames & Encoding...
                  </span>
                  <span className="font-mono text-white">{exportProgress}%</span>
                </div>
                <div className="h-2.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 transition-all duration-150"
                    style={{ width: `${exportProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Export Success Message */}
            {exportComplete && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <span className="font-bold">Video exported successfully!</span>
                    {exportedFileSize && (
                      <span className="ml-2 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-mono font-semibold">
                        {exportedFileSize} • Non-Zero Valid File
                      </span>
                    )}
                  </div>
                </div>
                {downloadUrl && (
                  <a
                    href={downloadUrl}
                    download={`${projectTitle}.webm`}
                    className="underline font-bold text-white hover:text-cyan-300"
                  >
                    Re-download
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
          >
            Cancel
          </button>

          <button
            onClick={handleStartExport}
            disabled={isExporting || isBlockedByDuplicate}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg text-xs font-bold transition-all shadow-md ${
              isBlockedByDuplicate
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/20 active:scale-95'
            }`}
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Exporting ({exportProgress}%)...</span>
              </>
            ) : isBlockedByDuplicate ? (
              <>
                <Lock className="w-4 h-4" />
                <span>Locked by 30-Day Duplicate Policy</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 stroke-[2.5]" />
                <span>Render & Download Video</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
