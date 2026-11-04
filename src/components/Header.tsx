import React from 'react';
import {
  Sparkles,
  ShieldCheck,
  Cloud,
  CloudOff,
  Crown,
  Download,
  Key,
  FolderOpen,
  FolderArchive,
  Save,
  Tv,
  Table,
} from 'lucide-react';
import { AspectRatioType, UserProfile } from '../types';

interface HeaderProps {
  projectTitle: string;
  onUpdateTitle: (newTitle: string) => void;
  aspectRatio: AspectRatioType;
  onChangeAspectRatio: (ratio: AspectRatioType) => void;
  antiCopyrightEnabled: boolean;
  onToggleAntiCopyright: () => void;
  isLowResSource: boolean;
  isCloudSynced: boolean;
  onManualSync: () => void;
  currentUser: UserProfile;
  onOpenAdmin: () => void;
  onOpenAuth: () => void;
  onOpenExport: () => void;
  onExportProjectFile: () => void;
  onImportProjectFile: () => void;
  onOpenBulkCreate: () => void;
  onOpenDownloadModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  projectTitle,
  onUpdateTitle,
  aspectRatio,
  onChangeAspectRatio,
  antiCopyrightEnabled,
  onToggleAntiCopyright,
  isLowResSource,
  isCloudSynced,
  onManualSync,
  currentUser,
  onOpenAdmin,
  onOpenAuth,
  onOpenExport,
  onExportProjectFile,
  onImportProjectFile,
  onOpenBulkCreate,
  onOpenDownloadModal,
}) => {
  const isOwner = currentUser.isOwner || currentUser.role === 'owner_admin';

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-950 px-4 md:px-6 flex items-center justify-between gap-4 select-none shrink-0 z-30">
      {/* Brand & Project Name */}
      <div className="flex items-center gap-4 min-w-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-base tracking-tight text-white hidden sm:inline whitespace-nowrap">
            NovaCut<span className="text-cyan-400"> Studio</span>
          </span>
        </div>

        <div className="h-4 w-px bg-slate-800 hidden md:block" />

        {/* Project Title Input */}
        <input
          type="text"
          value={projectTitle}
          onChange={(e) => onUpdateTitle(e.target.value)}
          className="bg-slate-900/60 hover:bg-slate-900 focus:bg-slate-900 border border-transparent focus:border-slate-700 px-2.5 py-1 text-xs md:text-sm font-medium rounded-md text-slate-200 focus:outline-none transition-colors max-w-[160px] md:max-w-[220px] truncate"
          title="Click to rename project"
        />

        {/* Low Resolution Auto-Detection Badge */}
        {isLowResSource && (
          <div
            className="hidden xl:flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium bg-amber-500/10 border border-amber-500/30 text-amber-300"
            title="Source is under 780p. AI Super-Resolution & Clarity Upscaler is active!"
          >
            <Tv className="w-3.5 h-3.5" />
            <span>&lt;780p Auto-Upscaler Active</span>
          </div>
        )}
      </div>

      {/* Middle Center Controls: Aspect Ratio Presets */}
      <div className="hidden lg:flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg">
        <button
          onClick={() => onChangeAspectRatio('9:16')}
          className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
            aspectRatio === '9:16'
              ? 'bg-cyan-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Facebook Reels, Instagram Reels, TikTok, Shorts (9:16)"
        >
          Reels (9:16)
        </button>
        <button
          onClick={() => onChangeAspectRatio('1:1')}
          className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
            aspectRatio === '1:1'
              ? 'bg-cyan-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Instagram & Facebook Square Post (1:1)"
        >
          Post (1:1)
        </button>
        <button
          onClick={() => onChangeAspectRatio('4:5')}
          className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
            aspectRatio === '4:5'
              ? 'bg-cyan-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Instagram Portrait Feed (4:5)"
        >
          Portrait (4:5)
        </button>
        <button
          onClick={() => onChangeAspectRatio('16:9')}
          className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
            aspectRatio === '16:9'
              ? 'bg-cyan-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="YouTube Standard & Landscape (16:9)"
        >
          Landscape (16:9)
        </button>
      </div>

      {/* Right Controls: Anti-Copyright Toggle, Cloud Sync, Admin/License & Export */}
      <div className="flex items-center gap-2 md:gap-3 shrink-0">
        {/* Anti-Copyright Shield Quick Toggle */}
        <button
          onClick={onToggleAntiCopyright}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${
            antiCopyrightEnabled
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 shadow-sm shadow-emerald-500/10'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-300'
          }`}
          title={
            antiCopyrightEnabled
              ? 'Anti-Copyright Shield is ON (Micro-tempo, film grain & perceptual variance active)'
              : 'Click to enable Anti-Copyright Content-ID Shield'
          }
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">
            {antiCopyrightEnabled ? 'Shield Active' : 'Shield Off'}
          </span>
        </button>

        {/* Cloud Sync & Offline Indicator */}
        <button
          onClick={onManualSync}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 transition-colors"
          title={
            isCloudSynced
              ? 'Project is Synced to Cloud & Stored Offline'
              : 'Saved locally in Offline Mode. Click to Sync'
          }
        >
          {isCloudSynced ? (
            <Cloud className="w-3.5 h-3.5 text-cyan-400" />
          ) : (
            <CloudOff className="w-3.5 h-3.5 text-amber-400" />
          )}
          <span className="hidden md:inline font-mono text-[11px]">
            {isCloudSynced ? 'Cloud Synced' : 'Offline Ready'}
          </span>
        </button>

        {/* Backup File / Project Menu */}
        <div className="hidden sm:flex items-center gap-1">
          <button
            onClick={onExportProjectFile}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors"
            title="Download .novaproject file (Offline Backup)"
          >
            <Save className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onImportProjectFile}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors"
            title="Open/Import .novaproject file"
          >
            <FolderOpen className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Master Owner Admin or License Key Button */}
        {isOwner ? (
          <button
            onClick={onOpenAdmin}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 text-amber-300 hover:border-amber-400 text-xs font-semibold transition-all shadow-sm shadow-amber-500/10"
            title="SuperAdmin Owner Portal (josnking01@gmail.com)"
          >
            <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
            <span className="hidden sm:inline">Owner Admin</span>
          </button>
        ) : (
          <button
            onClick={onOpenAuth}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 transition-colors"
            title="Enter license key or owner login"
          >
            <Key className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">
              {currentUser.role === 'licensed_user' ? 'Pro License' : 'License / Login'}
            </span>
          </button>
        )}

        {/* Canva Bulk Create Engine */}
        <button
          onClick={onOpenBulkCreate}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs tracking-wide transition-all shadow-md shadow-purple-600/25 active:scale-95"
          title="Canva Bulk Video Studio (30 Pre-loaded Medical Quizzes & AI Backgrounds)"
        >
          <Table className="w-3.5 h-3.5 text-white" />
          <span className="hidden sm:inline">Bulk 30 Quizzes</span>
        </button>

        {/* Desktop EXE & Project ZIP Download Button */}
        <button
          onClick={onOpenDownloadModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/40 text-amber-300 hover:text-white font-semibold text-xs tracking-wide transition-all shadow-sm active:scale-95"
          title="Download Windows EXE Installer & Project ZIP Archive"
        >
          <FolderArchive className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Download EXE / ZIP</span>
        </button>

        {/* Primary Action: Export Video Studio */}
        <button
          onClick={onOpenExport}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs tracking-wide transition-all shadow-md shadow-cyan-500/20 active:scale-95"
        >
          <Download className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Export</span>
        </button>
      </div>
    </header>
  );
};
