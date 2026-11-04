/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { CanvasPreview } from './components/CanvasPreview';
import { Timeline } from './components/Timeline';
import { ToolsPanel } from './components/ToolsPanel';
import { AdminPanel } from './components/AdminPanel';
import { CustomerActivationModal } from './components/CustomerActivationModal';
import { ExportModal } from './components/ExportModal';
import { BulkCreateModal } from './components/BulkCreateModal';
import { DownloadPackageModal } from './components/DownloadPackageModal';
import {
  ProjectState,
  AspectRatioType,
  FitMode,
  VideoClip,
  TextOverlay,
  VideoFilters,
  AntiCopyrightConfig,
  SuperResolutionConfig,
  UserProfile,
  TemplatePreset,
} from './types';
import {
  getInitialProject,
  saveProjectLocally,
  syncProjectToCloud,
  exportProjectFile,
  importProjectFromFile,
} from './services/cloudSync';
import {
  checkAuthStatus,
  deactivateLicenseOnThisDevice,
  getStoredCustomerLease,
  clearAllAuth,
} from './services/licensingClient';
import { SAMPLE_CLIPS } from './data/sampleClips';
import {
  MEDICAL_QUIZZES_LIST,
  getMedicalQuizzesAsBulkRows,
  createThematicSvgBackground,
  MEDICAL_QUIZ_OVERLAYS,
  DEFAULT_QUIZ_STICKERS,
  DEFAULT_EFFECTS_CONFIG,
} from './data/medicalQuizData';
import { TEMPLATE_PRESETS } from './data/templates';
import { soundEngine } from './services/soundEffects';

export default function App() {
  const [project, setProject] = useState<ProjectState>(() => getInitialProject());
  const [currentUser, setCurrentUser] = useState<UserProfile>({
    email: 'guest@desktop.local',
    role: 'guest',
    isOwner: false,
    displayName: 'Unlicensed Installation',
    plan: 'Activation Required',
    permissions: ['preview'],
  });
  const [activeClip, setActiveClip] = useState<VideoClip | null>(() => {
    const initialHeartSvg = createThematicSvgBackground(
      MEDICAL_QUIZZES_LIST[0].question,
      MEDICAL_QUIZZES_LIST[0].backgroundPrompt
    );
    return {
      id: 'clip_medical_1',
      name: 'Clean 3D Heart Illustration',
      src: initialHeartSvg,
      duration: 12,
      width: 1080,
      height: 1920,
      startTime: 0,
      endTime: 12,
      volume: 1.0,
      speed: 1.0,
      isLowRes: false,
    };
  });
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isCloudSynced, setIsCloudSynced] = useState<boolean>(false);

  // Modals
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [isBulkCreateOpen, setIsBulkCreateOpen] = useState<boolean>(false);
  const [isManageLicenseOpen, setIsManageLicenseOpen] = useState<boolean>(false);
  const [isDownloadOpen, setIsDownloadOpen] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Initialize and check hardware-bound licensing status on launch
  useEffect(() => {
    checkAuthStatus().then((status) => {
      setCurrentUser(status.user);
      if (!status.isAuthenticated) {
        setIsAuthOpen(true);
      }
    });
  }, []);


  // Online / Offline synchronization listener
  useEffect(() => {
    const handleOnline = () => {
      syncProjectToCloud(project, currentUser.email).then((ok) => {
        setIsCloudSynced(ok);
      });
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [project, currentUser.email]);

  // Periodic Auto-Save
  useEffect(() => {
    const timer = setTimeout(() => {
      saveProjectLocally(project);
    }, 1000);
    return () => clearTimeout(timer);
  }, [project]);

  // Handle uploaded video file
  const handleUploadFile = (file: File) => {
    const isVideo = file.type.startsWith('video');
    const objectUrl = URL.createObjectURL(file);

    if (isVideo) {
      const v = document.createElement('video');
      v.preload = 'metadata';
      v.src = objectUrl;
      v.onloadedmetadata = () => {
        const width = v.videoWidth || 1080;
        const height = v.videoHeight || 1920;
        const duration = Math.round(v.duration) || 10;
        const isLowRes = width < 780 || height < 780;

        const newClip: VideoClip = {
          id: `clip_${Date.now()}`,
          name: file.name,
          src: objectUrl,
          duration,
          width,
          height,
          startTime: 0,
          endTime: duration,
          volume: 1.0,
          speed: 1.0,
          isLowRes,
        };

        setActiveClip(newClip);
        setProject((prev) => ({
          ...prev,
          duration,
          currentTime: 0,
          superResolution: {
            ...prev.superResolution,
            autoEnhanceLowRes: isLowRes ? true : prev.superResolution.autoEnhanceLowRes,
          },
        }));
      };
    } else {
      // Photo / image file
      const img = new Image();
      img.src = objectUrl;
      img.onload = () => {
        const width = img.naturalWidth || 1080;
        const height = img.naturalHeight || 1920;
        const isLowRes = width < 780 || height < 780;

        const newClip: VideoClip = {
          id: `clip_${Date.now()}`,
          name: file.name,
          src: objectUrl,
          duration: 10,
          width,
          height,
          startTime: 0,
          endTime: 10,
          volume: 1.0,
          speed: 1.0,
          isLowRes,
        };

        setActiveClip(newClip);
      };
    }
  };

  // Keyboard shortcut: Spacebar to toggle Play/Pause
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && (e.target as HTMLElement).tagName !== 'INPUT') {
        e.preventDefault();
        setIsPlaying((p) => !p);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleManualSync = async () => {
    const ok = await syncProjectToCloud(project, currentUser.email);
    setIsCloudSynced(ok);
  };

  const handleSplitClip = () => {
    if (!activeClip) return;
    // Add text split marker or cue
    const splitText: TextOverlay = {
      id: `split_${Date.now()}`,
      text: '✂️ SCENE CUT',
      startTime: project.currentTime,
      endTime: Math.min(project.duration, project.currentTime + 1.5),
      color: '#38bdf8',
      fontSize: 22,
      position: 'center',
      fontFamily: 'Plus Jakarta Sans',
      animation: 'pop',
    };
    setProject((prev) => ({
      ...prev,
      textOverlays: [...prev.textOverlays, splitText],
    }));
  };

  const handleAddTextOverlay = (overlay: TextOverlay) => {
    setProject((prev) => ({
      ...prev,
      textOverlays: [...prev.textOverlays, overlay],
    }));
  };

  const handleDeleteTextOverlay = (id: string) => {
    setProject((prev) => ({
      ...prev,
      textOverlays: prev.textOverlays.filter((t) => t.id !== id),
    }));
  };

  const handleSelectPreviewRow = (rowIndex: number) => {
    const bulk = project?.bulkCreate;
    if (!bulk || !bulk.rows || !bulk.rows[rowIndex]) return;
    const row = bulk.rows[rowIndex];

    // Auto-change background for this preview row based on row's generated image or background prompt
    let rowBgSrc = row.generatedBackgroundUrl;
    if (!rowBgSrc && row.backgroundPrompt) {
      rowBgSrc = createThematicSvgBackground(
        row.data.Question || `Quiz ${rowIndex + 1}`,
        row.backgroundPrompt
      );
    }
    if (!rowBgSrc) {
      if (bulk.bgRotationMode === 'cycle') {
        rowBgSrc = SAMPLE_CLIPS[rowIndex % SAMPLE_CLIPS.length].src;
      } else if (bulk.bgRotationMode === 'random') {
        const randIdx = Math.floor(Math.random() * SAMPLE_CLIPS.length);
        rowBgSrc = SAMPLE_CLIPS[randIdx].src;
      } else if (bulk.bgRotationMode === 'specific' && row.backgroundMediaId) {
        rowBgSrc = SAMPLE_CLIPS.find((c) => c.id === row.backgroundMediaId)?.src || activeClip?.src || SAMPLE_CLIPS[0].src;
      } else {
        rowBgSrc = activeClip?.src || SAMPLE_CLIPS[0].src;
      }
    }

    const targetDur = project.duration || 12;
    const updatedClip: VideoClip = {
      id: `row_bg_${rowIndex}`,
      name: row.data.Question || `Video ${rowIndex + 1}`,
      src: rowBgSrc,
      duration: targetDur,
      width: 1080,
      height: 1920,
      startTime: 0,
      endTime: targetDur,
      volume: 1.0,
      speed: 1.0,
      isLowRes: false,
    };
    setActiveClip(updatedClip);

    // Substitute text overlays with formatted option values and correct answer flags
    const correctVal = row.data.Correct_Answer || row.data.correct_answer || '';
    const updatedOverlays = project.textOverlays.map((layer) => {
      const matchingCol = (bulk.columns || []).find((col) => col.mappedOverlayId === layer.id);
      if (matchingCol && row.data && row.data[matchingCol.key]) {
        const val = row.data[matchingCol.key];
        let newText = val;
        if (layer.role === 'option_a' && !val.startsWith('[A]')) newText = `[A] ${val}`;
        if (layer.role === 'option_b' && !val.startsWith('[B]')) newText = `[B] ${val}`;
        if (layer.role === 'answer_reveal' && !val.startsWith('✅')) newText = `✅ Correct: ${val}`;

        const isCorrect = Boolean(correctVal && val.toLowerCase().trim() === correctVal.toLowerCase().trim());
        return {
          ...layer,
          text: newText,
          isCorrectAnswer: isCorrect,
        };
      }
      return layer;
    });

    setProject((prev) => ({
      ...prev,
      currentTime: 0, // Reset scrubber to 0 so countdown & animation replay!
      textOverlays: updatedOverlays,
      bulkCreate: {
        ...(prev.bulkCreate || bulk),
        activePreviewIndex: rowIndex,
      },
    }));
  };

  const handleApplyTemplate = (tmpl: TemplatePreset) => {
    setProject((prev) => ({
      ...prev,
      title: `${tmpl.title} Project`,
      aspectRatio: tmpl.aspectRatio,
      duration: tmpl.duration,
      currentTime: 0,
      textOverlays: tmpl.overlays,
      activeTemplateId: tmpl.id,
      bulkCreate: tmpl.bulkColumns ? {
        ...prev.bulkCreate,
        enabled: true,
        columns: tmpl.bulkColumns,
      } : prev.bulkCreate,
    }));

    if (tmpl.defaultBgPrompt) {
      const bgUrl = createThematicSvgBackground(tmpl.title, tmpl.defaultBgPrompt);
      setActiveClip({
        id: `tmpl_bg_${tmpl.id}`,
        name: tmpl.title,
        src: bgUrl,
        duration: tmpl.duration,
        width: 1080,
        height: 1920,
        startTime: 0,
        endTime: tmpl.duration,
        volume: 1.0,
        speed: 1.0,
        isLowRes: false,
      });
    }
  };

  const handleApplyMedicalTemplate = () => {
    const { columns, rows } = getMedicalQuizzesAsBulkRows();
    const firstBg = rows[0]?.generatedBackgroundUrl || createThematicSvgBackground('Heart', MEDICAL_QUIZZES_LIST[0].backgroundPrompt);
    setActiveClip({
      id: 'clip_medical_1',
      name: 'Clean 3D Heart Illustration',
      src: firstBg,
      duration: 12,
      width: 1080,
      height: 1920,
      startTime: 0,
      endTime: 12,
      volume: 1.0,
      speed: 1.0,
      isLowRes: false,
    });
    setProject((prev) => ({
      ...prev,
      title: '30 Short Medical Quizzes (Canva + CapCut Suite)',
      aspectRatio: '9:16',
      duration: 12,
      currentTime: 0,
      textOverlays: MEDICAL_QUIZ_OVERLAYS,
      stickers: DEFAULT_QUIZ_STICKERS,
      effectsConfig: DEFAULT_EFFECTS_CONFIG,
      bulkCreate: {
        enabled: true,
        columns,
        rows,
        bgRotationMode: 'prompt_ai',
        selectedMediaPoolIds: ['sample_1', 'sample_2', 'sample_3', 'sample_4'],
        activePreviewIndex: 0,
      },
    }));
  };

  const handlePreviewTransition = () => {
    const cue = project.transition.triggerTime || 3.5;
    const startSeek = Math.max(0, cue - 1.2);
    setProject((prev) => ({ ...prev, currentTime: startSeek }));
    setIsPlaying(true);
  };

  const handleImportFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const imported = await importProjectFromFile(e.target.files[0]);
        setProject(imported);
      } catch (err) {
        console.error('Failed to import project', err);
      }
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* 1. TOP HEADER */}
      <Header
        projectTitle={project.title}
        onUpdateTitle={(title) => setProject((prev) => ({ ...prev, title }))}
        aspectRatio={project.aspectRatio}
        onChangeAspectRatio={(ratio) => setProject((prev) => ({ ...prev, aspectRatio: ratio }))}
        antiCopyrightEnabled={project.antiCopyright.enabled}
        onToggleAntiCopyright={() =>
          setProject((prev) => ({
            ...prev,
            antiCopyright: {
              ...prev.antiCopyright,
              enabled: !prev.antiCopyright.enabled,
            },
          }))
        }
        isLowResSource={activeClip?.isLowRes || false}
        isCloudSynced={isCloudSynced}
        onManualSync={handleManualSync}
        currentUser={currentUser}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenAuth={() => {
          if (currentUser.role === 'owner_admin') {
            setIsAdminOpen(true);
          } else if (currentUser.role === 'licensed_user') {
            setIsManageLicenseOpen(true);
          } else {
            setIsAuthOpen(true);
          }
        }}
        onOpenExport={() => setIsExportOpen(true)}
        onExportProjectFile={() => exportProjectFile(project)}
        onImportProjectFile={() => fileInputRef.current?.click()}
        onOpenBulkCreate={() => setIsBulkCreateOpen(true)}
        onOpenDownloadModal={() => setIsDownloadOpen(true)}
      />

      {/* Hidden input for importing .novaproject files */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImportFileChange}
        accept=".novaproject,application/json"
        className="hidden"
      />

      {/* 2. MAIN WORKSPACE (TOOLS SIDEBAR + CANVAS PREVIEW) */}
      <main className="flex-1 min-h-0 flex overflow-hidden">
        {/* Left Tools & Settings Panel */}
        <ToolsPanel
          aspectRatio={project.aspectRatio}
          onChangeAspectRatio={(ratio) => setProject((prev) => ({ ...prev, aspectRatio: ratio }))}
          fitMode={project.fitMode}
          onChangeFitMode={(mode) => setProject((prev) => ({ ...prev, fitMode: mode }))}
          activeClip={activeClip}
          onSelectClip={(clip) => {
            setActiveClip(clip);
            setProject((prev) => ({
              ...prev,
              duration: clip.duration,
              currentTime: 0,
            }));
          }}
          onUploadFile={handleUploadFile}
          filters={project.filters}
          onChangeFilters={(f) => setProject((prev) => ({ ...prev, filters: f }))}
          antiCopyright={project.antiCopyright}
          onChangeAntiCopyright={(ac) => setProject((prev) => ({ ...prev, antiCopyright: ac }))}
          superRes={project.superResolution}
          onChangeSuperRes={(sr) => setProject((prev) => ({ ...prev, superResolution: sr }))}
          textOverlays={project.textOverlays}
          onAddTextOverlay={handleAddTextOverlay}
          onOpenBulkCreate={() => setIsBulkCreateOpen(true)}
          transition={project.transition}
          onChangeTransition={(tr) => setProject((prev) => ({ ...prev, transition: tr }))}
          onPreviewTransition={handlePreviewTransition}
          currentTime={project.currentTime}
          onApplyTemplate={handleApplyTemplate}
          onUpdateTextOverlays={(overlays) => setProject((prev) => ({ ...prev, textOverlays: overlays }))}
        />

        {/* Center Live Video Canvas Preview */}
        <CanvasPreview
          aspectRatio={project.aspectRatio}
          fitMode={project.fitMode}
          onChangeFitMode={(mode) => setProject((prev) => ({ ...prev, fitMode: mode }))}
          activeClip={activeClip}
          textOverlays={project.textOverlays}
          stickers={project.stickers}
          effectsConfig={project.effectsConfig}
          duration={project.duration || 12}
          filters={project.filters}
          antiCopyright={project.antiCopyright}
          superRes={project.superResolution}
          transition={project.transition}
          currentTime={project.currentTime}
          onTimeUpdate={(time) => setProject((prev) => ({ ...prev, currentTime: time }))}
          isPlaying={isPlaying}
          onTogglePlay={() => setIsPlaying((p) => !p)}
          onUploadFile={handleUploadFile}
        />
      </main>

      {/* 3. BOTTOM MULTI-TRACK TIMELINE */}
      <Timeline
        duration={project.duration}
        currentTime={project.currentTime}
        onSeek={(time) => setProject((prev) => ({ ...prev, currentTime: time }))}
        activeClip={activeClip}
        textOverlays={project.textOverlays}
        onAddText={() => {
          const newText: TextOverlay = {
            id: `txt_${Date.now()}`,
            text: '✨ NEW SUBTITLE',
            startTime: project.currentTime,
            endTime: Math.min(project.duration, project.currentTime + 3),
            color: '#facc15',
            fontSize: 26,
            position: 'center',
            fontFamily: 'Plus Jakarta Sans',
            animation: 'pop',
          };
          handleAddTextOverlay(newText);
        }}
        onDeleteText={handleDeleteTextOverlay}
        onSplitClip={handleSplitClip}
        antiCopyright={project.antiCopyright}
        transition={project.transition}
      />

      {/* 4. MODALS */}
      <AdminPanel
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        adminEmail={currentUser.email}
      />

      <CustomerActivationModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        canDismiss={true}
        onSuccess={(user) => {
          setCurrentUser(user);
          setIsAuthOpen(false);
          if (user.role === 'owner_admin') {
            setIsAdminOpen(true);
          }
        }}
      />

      {/* Customer License Management & Deactivation Dialog */}
      {isManageLicenseOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
                  ✓
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Active License Installation</h3>
                  <p className="text-[11px] text-slate-400">Machine slot bound & verified</p>
                </div>
              </div>
              <button
                onClick={() => setIsManageLicenseOpen(false)}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 font-mono">
                <div className="flex justify-between text-slate-400">
                  <span>Licensed To:</span>
                  <span className="text-slate-200 font-bold">{currentUser.displayName}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Key Hash Prefix:</span>
                  <span className="text-cyan-300 font-bold">{currentUser.licenseKey || 'NVST-PRO-****'}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Plan Type:</span>
                  <span className="text-emerald-400 font-bold">{currentUser.plan}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Expires:</span>
                  <span className="text-slate-300">
                    {currentUser.expiresAt ? new Date(currentUser.expiresAt).toLocaleDateString() : 'Permanent Lifetime'}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
                Need to transfer this license to a new computer? Click below to release this device slot.
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={async () => {
                    if (confirm('Deactivate license on this PC? You can reactivate on a different computer using your license key.')) {
                      await deactivateLicenseOnThisDevice();
                      setCurrentUser({
                        email: 'guest@desktop.local',
                        role: 'guest',
                        isOwner: false,
                        displayName: 'Unlicensed Installation',
                        plan: 'Activation Required',
                        permissions: ['preview'],
                      });
                      setIsManageLicenseOpen(false);
                      setIsAuthOpen(true);
                    }
                  }}
                  className="flex-1 py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold transition-colors cursor-pointer"
                >
                  Deactivate & Release Slot
                </button>
                <button
                  type="button"
                  onClick={() => setIsManageLicenseOpen(false)}
                  className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        projectTitle={project.title}
        activeClip={activeClip}
        aspectRatio={project.aspectRatio}
        fitMode={project.fitMode}
        filters={project.filters}
        antiCopyright={project.antiCopyright}
        superRes={project.superResolution}
        textOverlays={project.textOverlays}
        stickers={project.stickers}
        effectsConfig={project.effectsConfig}
        duration={project.duration || 12}
        currentUser={currentUser}
        transition={project.transition}
      />

      <BulkCreateModal
        isOpen={isBulkCreateOpen}
        onClose={() => setIsBulkCreateOpen(false)}
        project={project}
        onUpdateBulkConfig={(bulkConfig) =>
          setProject((prev) => ({
            ...prev,
            bulkCreate: bulkConfig,
          }))
        }
        onSelectPreviewRow={handleSelectPreviewRow}
        activeClip={activeClip}
        currentUser={currentUser}
        onApplyMedicalTemplate={handleApplyMedicalTemplate}
        onUpdateOverlays={(overlays) => setProject((prev) => ({ ...prev, textOverlays: overlays }))}
      />

      <DownloadPackageModal
        isOpen={isDownloadOpen}
        onClose={() => setIsDownloadOpen(false)}
      />
    </div>
  );
}
