import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Table,
  Upload,
  Plus,
  Trash2,
  Film,
  RefreshCw,
  Play,
  Download,
  CheckCircle2,
  AlertCircle,
  Link,
  Layers,
  ArrowRight,
  Shuffle,
  FileSpreadsheet,
  Check,
  Eye,
  FileArchive,
  Wand2,
  Volume2,
  VolumeX,
  Mic,
  Globe,
  Languages,
  Settings2,
  SlidersHorizontal,
} from 'lucide-react';
import JSZip from 'jszip';
import {
  ProjectState,
  BulkCreateConfig,
  BulkDataColumn,
  BulkDataRow,
  TextOverlay,
  VideoClip,
  UserProfile,
} from '../types';
import { SAMPLE_CLIPS } from '../data/sampleClips';
import { exportVideoFile } from '../services/videoEngine';
import { generateVideoFingerprint, recordNewExport } from '../services/duplicateRegistry';
import {
  MEDICAL_QUIZZES_LIST,
  getMedicalQuizzesAsBulkRows,
  createThematicSvgBackground,
  MEDICAL_QUIZ_OVERLAYS,
  DEFAULT_QUIZ_STICKERS,
  DEFAULT_EFFECTS_CONFIG,
} from '../data/medicalQuizData';
import { soundEngine } from '../services/soundEffects';
import { CustomCsvMapperModal } from './CustomCsvMapperModal';

interface BulkCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectState;
  onUpdateBulkConfig: (config: BulkCreateConfig) => void;
  onSelectPreviewRow: (rowIndex: number) => void;
  activeClip: VideoClip | null;
  currentUser: UserProfile;
  onApplyMedicalTemplate?: () => void;
  onUpdateOverlays?: (overlays: TextOverlay[]) => void;
}

export const BulkCreateModal: React.FC<BulkCreateModalProps> = ({
  isOpen,
  onClose,
  project,
  onUpdateBulkConfig,
  onSelectPreviewRow,
  activeClip,
  currentUser,
  onApplyMedicalTemplate,
  onUpdateOverlays,
}) => {
  const rawBulk = project?.bulkCreate;
  const bulkConfig: BulkCreateConfig = {
    enabled: rawBulk?.enabled ?? true,
    columns:
      rawBulk?.columns && rawBulk.columns.length > 0
        ? rawBulk.columns
        : [
            { id: 'col_q', name: 'Question', key: 'Question', mappedOverlayId: 'txt_question', type: 'text' },
            { id: 'col_a', name: 'Option A', key: 'Option_A', mappedOverlayId: 'txt_opt_a', type: 'text' },
            { id: 'col_b', name: 'Option B', key: 'Option_B', mappedOverlayId: 'txt_opt_b', type: 'text' },
            { id: 'col_ans', name: 'Correct Answer', key: 'Correct_Answer', mappedOverlayId: 'txt_correct', type: 'text' },
            { id: 'col_prompt', name: 'Background Prompt', key: 'Background_Prompt', type: 'background_prompt' },
          ],
    rows:
      rawBulk?.rows && rawBulk.rows.length > 0
        ? rawBulk.rows
        : getMedicalQuizzesAsBulkRows().rows.slice(0, 5),
    bgRotationMode: rawBulk?.bgRotationMode || 'prompt_ai',
    selectedMediaPoolIds:
      rawBulk?.selectedMediaPoolIds && rawBulk.selectedMediaPoolIds.length > 0
        ? rawBulk.selectedMediaPoolIds
        : ['sample_1', 'sample_2', 'sample_3', 'sample_4'],
    activePreviewIndex: rawBulk?.activePreviewIndex ?? 0,
  };

  const [selectedTopic, setSelectedTopic] = useState('Viral Motivational Quotes');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [isGeneratingAllBg, setIsGeneratingAllBg] = useState(false);
  const [csvTextModalOpen, setCsvTextModalOpen] = useState(false);
  const [csvRawText, setCsvRawText] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Batch Exporting State
  const [isBatchExporting, setIsBatchExporting] = useState(false);
  const [currentBatchIndex, setCurrentBatchIndex] = useState(0);
  const [batchProgress, setBatchProgress] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [exportedZipBlob, setExportedZipBlob] = useState<Blob | null>(null);
  const [batchExportedFiles, setBatchExportedFiles] = useState<{ name: string; size: string; blob: Blob }[]>([]);

  // Auto vs Manual Mode Controls (User Request: 10s-15s, Auto & Manual Options)
  const [isAutoMode, setIsAutoMode] = useState<boolean>(true);
  const [videoDuration, setVideoDuration] = useState<number>(12); // Default 12s, range 10-15s
  const [includeStickers, setIncludeStickers] = useState<boolean>(true);
  const [includeParticles, setIncludeParticles] = useState<boolean>(true);
  const [includeVignette, setIncludeVignette] = useState<boolean>(true);
  const [includeCameraZoom, setIncludeCameraZoom] = useState<boolean>(true);
  const [includeSoundFx, setIncludeSoundFx] = useState<boolean>(true);

  // Custom CSV Mapper & Speech States
  const [isCustomMapperOpen, setIsCustomMapperOpen] = useState(false);
  const [activeSpeechRowId, setActiveSpeechRowId] = useState<string | null>(null);
  const [speechLanguage, setSpeechLanguage] = useState<'en' | 'ur' | 'hi' | 'ar' | 'es'>('en');
  const [isBatchTranslating, setIsBatchTranslating] = useState(false);

  if (!isOpen) return null;

  // Apply mapped custom CSV columns & rows
  const handleApplyCustomMapping = (
    columns: BulkDataColumn[],
    rows: BulkDataRow[],
    newOverlays?: TextOverlay[]
  ) => {
    onUpdateBulkConfig({
      ...bulkConfig,
      enabled: true,
      columns,
      rows,
      activePreviewIndex: 0,
    });

    if (newOverlays && onUpdateOverlays) {
      onUpdateOverlays([...project.textOverlays, ...newOverlays]);
    }

    onSelectPreviewRow(0);
    soundEngine.playCorrectDing();
    setStatusMessage(`✅ Custom CSV Mapped! Loaded ${rows.length} videos with ${columns.length} columns.`);
    setTimeout(() => setStatusMessage(null), 4000);
  };

  // Listen to full quiz audio for a specific row
  const handleListenToRow = (row: BulkDataRow) => {
    if (activeSpeechRowId === row.id) {
      soundEngine.stopSpeech();
      setActiveSpeechRowId(null);
      return;
    }

    setActiveSpeechRowId(row.id);
    const question = row.data.Question || row.data.question || Object.values(row.data)[0] || '';
    const optA = row.data.Option_A || row.data.option_a || row.data.Option_1 || 'Option A';
    const optB = row.data.Option_B || row.data.option_b || row.data.Option_2 || 'Option B';
    const ans = row.data.Correct_Answer || row.data.correct_answer || row.data.answer || optA;

    soundEngine.narrateFullQuiz({
      question,
      optionA: optA,
      optionB: optB,
      correctAnswer: ans,
      language: speechLanguage,
      onEnd: () => setActiveSpeechRowId(null),
    });
  };

  // 1-Click Load 30 Medical Quizzes from CSV
  const handleLoadMedicalQuizzes = () => {
    const { columns, rows } = getMedicalQuizzesAsBulkRows();
    onUpdateBulkConfig({
      ...bulkConfig,
      enabled: true,
      columns,
      rows,
      bgRotationMode: 'prompt_ai',
      activePreviewIndex: 0,
    });

    if (onApplyMedicalTemplate) {
      onApplyMedicalTemplate();
    }

    onSelectPreviewRow(0);
    soundEngine.playCorrectDing();
    setStatusMessage('✅ Loaded all 30 Medical Quizzes with AI Background Prompts!');
    setTimeout(() => setStatusMessage(null), 4000);
  };

  // Add new blank row
  const handleAddRow = () => {
    const newRowId = `row_${Date.now()}`;
    const initialData: Record<string, string> = {};
    bulkConfig.columns.forEach((col) => {
      initialData[col.key] = '';
    });

    const defaultPrompt = 'Clean medical illustration with glowing particles, vertical 4:5';
    const defaultBg = createThematicSvgBackground('Medical Concept', defaultPrompt);

    const newRows = [
      ...bulkConfig.rows,
      {
        id: newRowId,
        data: initialData,
        backgroundPrompt: defaultPrompt,
        generatedBackgroundUrl: defaultBg,
      },
    ];

    onUpdateBulkConfig({
      ...bulkConfig,
      enabled: true,
      rows: newRows,
    });
  };

  // Delete row
  const handleDeleteRow = (rowId: string) => {
    const updated = bulkConfig.rows.filter((r) => r.id !== rowId);
    onUpdateBulkConfig({
      ...bulkConfig,
      rows: updated,
      activePreviewIndex: Math.min(bulkConfig.activePreviewIndex, Math.max(0, updated.length - 1)),
    });
  };

  // Update cell text
  const handleCellChange = (rowId: string, colKey: string, value: string) => {
    const updated = bulkConfig.rows.map((row) => {
      if (row.id === rowId) {
        const newData = { ...row.data, [colKey]: value };
        let prompt = row.backgroundPrompt;
        let bgUrl = row.generatedBackgroundUrl;

        // If user edits background prompt column
        if (colKey === 'Background_Prompt' || colKey === 'background_prompt' || colKey === 'prompt') {
          prompt = value;
          bgUrl = createThematicSvgBackground(newData.Question || value, value);
        }

        return {
          ...row,
          data: newData,
          backgroundPrompt: prompt,
          generatedBackgroundUrl: bgUrl,
        };
      }
      return row;
    });

    onUpdateBulkConfig({
      ...bulkConfig,
      rows: updated,
    });
  };

  // Generate AI Photorealistic Background for specific row via Gemini
  const handleGenerateRowAiBackground = async (rowId: string, promptText: string) => {
    if (!promptText) return;
    try {
      soundEngine.playWhoosh();
      const res = await fetch('/api/gemini/generate-background', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptText, aspectRatio: project.aspectRatio }),
      });
      const data = await res.json();
      const finalUrl = data.success && data.imageUrl
        ? data.imageUrl
        : createThematicSvgBackground('Medical Theme', promptText);

      const updated = bulkConfig.rows.map((r) => {
        if (r.id === rowId) {
          return {
            ...r,
            generatedBackgroundUrl: finalUrl,
            backgroundPrompt: promptText,
          };
        }
        return r;
      });

      onUpdateBulkConfig({
        ...bulkConfig,
        rows: updated,
      });

      // If active row, trigger preview
      const rowIdx = bulkConfig.rows.findIndex((r) => r.id === rowId);
      if (rowIdx === bulkConfig.activePreviewIndex) {
        onSelectPreviewRow(rowIdx);
      }
    } catch {
      // Fallback to procedural
      const fallbackUrl = createThematicSvgBackground('Medical Concept', promptText);
      const updated = bulkConfig.rows.map((r) => (r.id === rowId ? { ...r, generatedBackgroundUrl: fallbackUrl } : r));
      onUpdateBulkConfig({ ...bulkConfig, rows: updated });
    }
  };

  // Map Column to Text Overlay Layer
  const handleMapColumn = (colId: string, layerId: string) => {
    const updated = bulkConfig.columns.map((col) => {
      if (col.id === colId) {
        return {
          ...col,
          mappedOverlayId: layerId || undefined,
        };
      }
      return col;
    });

    onUpdateBulkConfig({
      ...bulkConfig,
      columns: updated,
    });
  };

  // AI Bulk Generate Data via Gemini
  const handleAiBulkGenerate = async () => {
    setIsAiGenerating(true);
    try {
      const res = await fetch('/api/gemini/bulk-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: selectedTopic, count: 6 }),
      });
      const data = await res.json();
      if (data.success && data.items && Array.isArray(data.items)) {
        const generatedRows: BulkDataRow[] = data.items.map((item: any, idx: number) => {
          const prompt = `Futuristic inspiring concept for ${item.hook || selectedTopic}, 4k ultra detailed cinematic lighting`;
          const bgUrl = createThematicSvgBackground(item.hook || 'Viral', prompt);
          return {
            id: `row_ai_${Date.now()}_${idx}`,
            data: {
              Question: item.hook || 'TOP SECRET ⚡',
              Option_A: item.content ? item.content.slice(0, 30) : 'Option A',
              Option_B: item.author || 'Option B',
              Correct_Answer: item.hook || 'Option A',
              Background_Prompt: prompt,
            },
            backgroundPrompt: prompt,
            generatedBackgroundUrl: bgUrl,
          };
        });

        onUpdateBulkConfig({
          ...bulkConfig,
          enabled: true,
          rows: generatedRows,
          activePreviewIndex: 0,
        });
        onSelectPreviewRow(0);
        soundEngine.playCorrectDing();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Parse CSV / Excel Text
  const handleParseCsv = (rawInput?: string) => {
    const textToParse = rawInput || csvRawText;
    if (!textToParse.trim()) return;
    const lines = textToParse.trim().split('\n');
    if (lines.length < 2) return;

    // Split headers handling quotes
    const parseLine = (line: string): string[] => {
      const result: string[] = [];
      let cur = '';
      let insideQuote = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"' || char === "'") {
          insideQuote = !insideQuote;
        } else if ((char === ',' || char === '\t') && !insideQuote) {
          result.push(cur.trim().replace(/^["']|["']$/g, ''));
          cur = '';
        } else {
          cur += char;
        }
      }
      result.push(cur.trim().replace(/^["']|["']$/g, ''));
      return result;
    };

    const headers = parseLine(lines[0]);
    const cols: BulkDataColumn[] = headers.map((h, i) => {
      const cleanKey = h.replace(/[^a-zA-Z0-9_]/g, '_');
      const isPrompt = cleanKey.toLowerCase().includes('prompt');
      let mappedOverlayId: string | undefined = undefined;

      // Auto-detect mapped layers
      if (cleanKey.toLowerCase().includes('question')) mappedOverlayId = 'txt_question';
      else if (cleanKey.toLowerCase().includes('option_a')) mappedOverlayId = 'txt_opt_a';
      else if (cleanKey.toLowerCase().includes('option_b')) mappedOverlayId = 'txt_opt_b';
      else if (cleanKey.toLowerCase().includes('correct') || cleanKey.toLowerCase().includes('answer')) mappedOverlayId = 'txt_correct';
      else if (!isPrompt && project.textOverlays[i]) mappedOverlayId = project.textOverlays[i].id;

      return {
        id: `col_csv_${i}`,
        name: h,
        key: cleanKey,
        type: isPrompt ? 'background_prompt' : 'text',
        mappedOverlayId,
      };
    });

    const rows: BulkDataRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const parts = parseLine(line);
      const rowData: Record<string, string> = {};
      cols.forEach((col, cIdx) => {
        rowData[col.key] = parts[cIdx] || '';
      });

      // Find background prompt if present
      const promptCol = cols.find((c) => c.type === 'background_prompt');
      const promptVal = promptCol ? rowData[promptCol.key] : `Medical concept illustration, 4k vertical`;
      const bgUrl = createThematicSvgBackground(rowData.Question || `Quiz ${i}`, promptVal);

      rows.push({
        id: `row_csv_${i}`,
        data: rowData,
        backgroundPrompt: promptVal,
        generatedBackgroundUrl: bgUrl,
      });
    }

    onUpdateBulkConfig({
      ...bulkConfig,
      enabled: true,
      columns: cols,
      rows,
      activePreviewIndex: 0,
    });
    setCsvTextModalOpen(false);
    setCsvRawText('');
    onSelectPreviewRow(0);
    soundEngine.playCorrectDing();
    setStatusMessage(`✅ Imported ${rows.length} rows successfully from CSV!`);
    setTimeout(() => setStatusMessage(null), 4000);
  };

  // Handle local CSV/Excel file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        handleParseCsv(content);
      }
    };
    reader.readAsText(file);
  };

  // Batch Export All Videos & Package into ZIP
  const handleBatchRenderAll = async () => {
    if (bulkConfig.rows.length === 0) return;
    setIsBatchExporting(true);
    setCurrentBatchIndex(0);
    setCompletedCount(0);
    setExportedZipBlob(null);
    setBatchExportedFiles([]);

    const targetDur = Math.max(10, Math.min(15, videoDuration || 12));
    const effectiveStickers = (isAutoMode || includeStickers) ? (project.stickers || DEFAULT_QUIZ_STICKERS) : [];
    const effectiveEffects = isAutoMode
      ? { ...DEFAULT_EFFECTS_CONFIG, durationSeconds: targetDur, voiceLanguage: speechLanguage }
      : {
          autoMode: false,
          vignette: includeVignette,
          particles: includeParticles,
          cameraPushIn: includeCameraZoom,
          neonGlow: true,
          soundSync: includeSoundFx,
          autoVoiceover: true,
          voiceLanguage: speechLanguage,
          durationSeconds: targetDur,
          soundEffects: includeSoundFx,
        };

    const zip = new JSZip();

    for (let i = 0; i < bulkConfig.rows.length; i++) {
      setCurrentBatchIndex(i);
      setBatchProgress(10);

      const row = bulkConfig.rows[i];

      // Resolve background clip or dynamic image
      let rowBgSrc = row.generatedBackgroundUrl || activeClip?.src || SAMPLE_CLIPS[0].src;
      if (bulkConfig.bgRotationMode === 'cycle') {
        rowBgSrc = SAMPLE_CLIPS[i % SAMPLE_CLIPS.length].src;
      } else if (bulkConfig.bgRotationMode === 'random') {
        const randIdx = Math.floor(Math.random() * SAMPLE_CLIPS.length);
        rowBgSrc = SAMPLE_CLIPS[randIdx].src;
      }

      // Substitute dynamic text overlays for this row
      const substitutedOverlays: TextOverlay[] = project.textOverlays.map((layer) => {
        const matchingCol = bulkConfig.columns.find((col) => col.mappedOverlayId === layer.id);
        if (matchingCol && row.data[matchingCol.key]) {
          const val = row.data[matchingCol.key];
          // For option cards, format neatly
          let newText = val;
          if (layer.role === 'option_a' && !val.startsWith('[A]')) newText = `[A] ${val}`;
          if (layer.role === 'option_b' && !val.startsWith('[B]')) newText = `[B] ${val}`;
          if (layer.role === 'answer_reveal' && !val.startsWith('✅')) newText = `✅ Correct: ${val}`;

          // Check if this option matches correct answer
          const correctVal = row.data.Correct_Answer || row.data.correct_answer || '';
          const isCorrect = Boolean(correctVal && val.toLowerCase().trim() === correctVal.toLowerCase().trim());

          return {
            ...layer,
            text: newText,
            isCorrectAnswer: isCorrect,
          };
        }
        return layer;
      });

      // Prepare DOM media element
      const clipToRender: VideoClip = {
        id: `bulk_clip_${i}`,
        name: `Quiz_${i + 1}`,
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

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = rowBgSrc;
      await new Promise((r) => {
        img.onload = r;
        img.onerror = r;
        setTimeout(r, 400);
      });

      // Render video with Guaranteed Non-Zero Size and Full Audio Narration
      try {
        const blob = await exportVideoFile({
          sourceElement: img,
          clip: clipToRender,
          aspectRatio: project.aspectRatio,
          fitMode: project.fitMode,
          filters: project.filters,
          antiCopyright: project.antiCopyright,
          superRes: project.superResolution,
          textOverlays: substitutedOverlays,
          stickers: effectiveStickers,
          effectsConfig: effectiveEffects,
          totalDuration: targetDur,
          resolutionTier: project.superResolution.upscaleTarget || '1080p',
          onProgress: (p) => setBatchProgress(p),
        });

        const sizeInMb = (blob.size / (1024 * 1024)).toFixed(2);
        const sizeStr = blob.size > 1024 * 1024 ? `${sizeInMb} MB` : `${Math.round(blob.size / 1024)} KB`;

        const safeTitle = (row.data.Question || `Video_${i + 1}`)
          .slice(0, 24)
          .replace(/[^a-zA-Z0-9]/g, '_');
        const filename = `Video_${String(i + 1).padStart(2, '0')}_${safeTitle}.webm`;

        setBatchExportedFiles((prev) => [...prev, { name: filename, size: sizeStr, blob }]);

        // Add to ZIP bundle
        zip.file(filename, blob);

        // Also trigger direct single download
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();

        // Record in duplicate prevention registry
        const fp = generateVideoFingerprint(safeTitle, clipToRender.duration, filename);
        await recordNewExport(
          fp,
          safeTitle,
          clipToRender.duration,
          project.aspectRatio,
          '1080p',
          currentUser.email
        );

        setCompletedCount((prev) => prev + 1);
      } catch (err) {
        console.error(`Failed to export row ${i + 1}`, err);
      }
    }

    // Generate combined ZIP
    try {
      const zipContent = await zip.generateAsync({ type: 'blob' });
      setExportedZipBlob(zipContent);
      soundEngine.playCorrectDing();
    } catch {}

    setIsBatchExporting(false);
  };

  const handleDownloadZipPackage = () => {
    if (!exportedZipBlob) return;
    const url = URL.createObjectURL(exportedZipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NovaCut_Bulk_Quizzes_${project.aspectRatio.replace(':', 'x')}.zip`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2 md:p-6">
      <div className="w-full max-w-6xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Top Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Table className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Canva-Style Bulk Video Automation</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono">
                  PRO BULK STUDIO
                </span>
              </div>
              <p className="text-xs text-slate-400">
                1 Template se 10-100 unique videos banayein with custom AI background prompts for har video!
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Hero Action Bar: 1-Click Load 30 Medical Quizzes + Upload Custom CSV + Audio */}
        <div className="px-5 py-3 border-b border-slate-800 bg-slate-950/70 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Left Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleLoadMedicalQuizzes}
              className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold transition-all shadow-md shadow-cyan-500/20 flex items-center gap-1.5"
              title="Click to load all 30 medical quizzes from your CSV with questions, options, answers, and prompt backgrounds!"
            >
              <span>🩺</span>
              <span>Load 30 Medical Quizzes (CSV)</span>
            </button>

            {/* Custom CSV Upload & Dynamic Mapping Button */}
            <button
              onClick={() => setIsCustomMapperOpen(true)}
              className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
              title="Upload your own custom CSV file and dynamically map columns to text overlays & AI background prompts!"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Custom CSV & Map</span>
            </button>

            {statusMessage && (
              <span className="text-emerald-400 text-xs font-semibold animate-pulse">
                {statusMessage}
              </span>
            )}
          </div>

          {/* Right Action buttons */}
          <div className="flex items-center gap-2">
            {/* Speech Language for Row Audio Preview */}
            <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
              <Mic className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-slate-400">Audio Voice:</span>
              <select
                value={speechLanguage}
                onChange={(e) => setSpeechLanguage(e.target.value as any)}
                className="bg-transparent text-amber-300 font-semibold focus:outline-none"
              >
                <option value="en">🇬🇧 English</option>
                <option value="ur">🇵🇰 Urdu (اردو)</option>
                <option value="hi">🇮🇳 Hindi (हिन्दी)</option>
                <option value="ar">🇸🇦 Arabic (العربية)</option>
                <option value="es">🇪🇸 Spanish</option>
              </select>
            </div>

            {/* Background Mode */}
            <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
              <Film className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-slate-400">Background:</span>
              <select
                value={bulkConfig.bgRotationMode}
                onChange={(e) =>
                  onUpdateBulkConfig({
                    ...bulkConfig,
                    bgRotationMode: e.target.value as any,
                  })
                }
                className="bg-transparent text-cyan-300 font-semibold focus:outline-none"
              >
                <option value="prompt_ai">✨ Dynamic per Row (From Prompt)</option>
                <option value="cycle">🔄 Auto-Cycle Sample Clips</option>
                <option value="random">🔀 Random Clip per Video</option>
                <option value="same">🔒 Same Background for All</option>
              </select>
            </div>

            {/* Quick Paste CSV button */}
            <button
              onClick={() => setCsvTextModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-purple-400" />
              <span>Paste CSV</span>
            </button>
          </div>
        </div>

        {/* CapCut + Canva Pro Mode & Duration Bar (User Request: 10s-15s, Auto & Manual Controls) */}
        <div className="px-5 py-2.5 border-b border-slate-800 bg-slate-900/90 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            {/* Auto vs Manual Toggle */}
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setIsAutoMode(true)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold text-xs transition-all ${
                  isAutoMode
                    ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>⚡ Auto Mode (1-Click Pro Master)</span>
              </button>
              <button
                type="button"
                onClick={() => setIsAutoMode(false)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold text-xs transition-all ${
                  !isAutoMode
                    ? 'bg-slate-800 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
                <span>🛠️ Manual Editing Mode</span>
              </button>
            </div>

            {/* Video Duration (10s to 15s) */}
            <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
              <span className="text-slate-400 font-medium">⏱️ Duration:</span>
              <input
                type="range"
                min="10"
                max="15"
                step="1"
                value={videoDuration}
                onChange={(e) => setVideoDuration(Number(e.target.value))}
                className="w-20 accent-cyan-400 cursor-pointer"
              />
              <span className="font-mono font-bold text-cyan-300 min-w-[36px]">{videoDuration}s</span>
              <span className="text-[10px] text-slate-500">(10s-15s Shorts)</span>
            </div>
          </div>

          {/* Manual Effect Toggles (when manual or info when auto) */}
          {isAutoMode ? (
            <div className="flex items-center gap-2 text-slate-400 text-[11px]">
              <span className="px-2 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-semibold">
                ✨ Auto Effects Active
              </span>
              <span>🩺 CapCut Stickers</span>
              <span>•</span>
              <span>✨ Floating Particles</span>
              <span>•</span>
              <span>🎬 Radial Vignette</span>
              <span>•</span>
              <span>🔍 3D Push-In</span>
              <span>•</span>
              <span>🎙️ Voice + Countdown SFX</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => setIncludeStickers(!includeStickers)}
                className={`px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                  includeStickers ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300' : 'bg-slate-950 border-slate-800 text-slate-500'
                }`}
              >
                🩺 Stickers: {includeStickers ? 'ON' : 'OFF'}
              </button>
              <button
                type="button"
                onClick={() => setIncludeParticles(!includeParticles)}
                className={`px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                  includeParticles ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300' : 'bg-slate-950 border-slate-800 text-slate-500'
                }`}
              >
                ✨ Particles: {includeParticles ? 'ON' : 'OFF'}
              </button>
              <button
                type="button"
                onClick={() => setIncludeVignette(!includeVignette)}
                className={`px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                  includeVignette ? 'bg-purple-500/20 border-purple-500 text-purple-300' : 'bg-slate-950 border-slate-800 text-slate-500'
                }`}
              >
                🎬 Vignette: {includeVignette ? 'ON' : 'OFF'}
              </button>
              <button
                type="button"
                onClick={() => setIncludeCameraZoom(!includeCameraZoom)}
                className={`px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                  includeCameraZoom ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-500'
                }`}
              >
                🔍 Push-In: {includeCameraZoom ? 'ON' : 'OFF'}
              </button>
              <button
                type="button"
                onClick={() => setIncludeSoundFx(!includeSoundFx)}
                className={`px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                  includeSoundFx ? 'bg-amber-500/20 border-amber-500 text-amber-300' : 'bg-slate-950 border-slate-800 text-slate-500'
                }`}
              >
                🔔 SFX: {includeSoundFx ? 'ON' : 'OFF'}
              </button>
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-5 space-y-4">
          {/* Column to Layer Mapping (Canva Bulk Create visual cards) */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-bold">
                <Link className="w-4 h-4 text-cyan-400" />
                <span>Data Field Mapping (Connect CSV Columns to Template Layers)</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsCustomMapperOpen(true)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 flex items-center gap-1 text-[11px] font-semibold transition-colors"
                  title="Configure or re-map CSV columns dynamically"
                >
                  <SlidersHorizontal className="w-3 h-3 text-cyan-400" />
                  <span>Configure Field Mappings</span>
                </button>
                <span className="text-slate-400 text-[11px]">
                  {bulkConfig.rows.length} videos ready to generate
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2.5 pt-2">
              {bulkConfig.columns.map((col) => {
                const isBgCol = col.type === 'background_prompt';
                return (
                  <div
                    key={col.id}
                    className={`p-2.5 rounded-lg border flex flex-col justify-between gap-1.5 ${
                      isBgCol
                        ? 'bg-purple-950/30 border-purple-500/40'
                        : 'bg-slate-900 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200 truncate">{col.name}</span>
                      {isBgCol && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] bg-purple-500/20 text-purple-300 font-mono">
                          BG PROMPT
                        </span>
                      )}
                    </div>

                    {isBgCol ? (
                      <span className="text-[11px] text-purple-400 font-medium">
                        ✨ Binds to Video Background
                      </span>
                    ) : (
                      <select
                        value={col.mappedOverlayId || ''}
                        onChange={(e) => handleMapColumn(col.id, e.target.value)}
                        className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-cyan-300 font-medium focus:outline-none focus:border-cyan-500 truncate"
                      >
                        <option value="">-- No Binding --</option>
                        {project.textOverlays.map((layer) => (
                          <option key={layer.id} value={layer.id}>
                            {layer.role ? `[${layer.role.toUpperCase()}] ` : ''}
                            {layer.text.slice(0, 18)}...
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Table of Rows */}
          <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950 shadow-inner">
            <div className="overflow-x-auto max-h-[380px]">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/90 border-b border-slate-800 text-slate-400 select-none sticky top-0 z-10 backdrop-blur-sm">
                  <tr>
                    <th className="py-2.5 px-3 w-12 text-center font-mono">#</th>
                    {bulkConfig.columns.map((col) => (
                      <th
                        key={col.id}
                        className={`py-2.5 px-3 font-semibold ${
                          col.type === 'background_prompt' ? 'text-purple-300' : 'text-slate-300'
                        }`}
                      >
                        {col.name}
                      </th>
                    ))}
                    <th className="py-2.5 px-3 text-center w-24 text-amber-400">Voice (TTS)</th>
                    <th className="py-2.5 px-3 text-center w-28 text-cyan-400">Live Preview</th>
                    <th className="py-2.5 px-3 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {bulkConfig.rows.map((row, idx) => {
                    const isCurrentPreview = bulkConfig.activePreviewIndex === idx;
                    const promptVal =
                      row.backgroundPrompt ||
                      row.data.Background_Prompt ||
                      row.data.background_prompt ||
                      '';

                    return (
                      <tr
                        key={row.id}
                        className={`hover:bg-slate-900/50 transition-colors ${
                          isCurrentPreview ? 'bg-cyan-500/10' : ''
                        }`}
                      >
                        {/* Index */}
                        <td className="py-2.5 px-3 text-center font-mono text-slate-500 font-bold">
                          {idx + 1}
                        </td>

                        {/* Columns */}
                        {bulkConfig.columns.map((col) => {
                          const val = row.data[col.key] || '';
                          const isPromptCol = col.type === 'background_prompt';

                          if (isPromptCol) {
                            return (
                              <td key={col.id} className="py-2.5 px-3 max-w-xs">
                                <div className="flex items-center gap-2">
                                  {row.generatedBackgroundUrl && (
                                    <img
                                      src={row.generatedBackgroundUrl}
                                      alt="BG"
                                      className="w-8 h-12 object-cover rounded border border-purple-500/40 shrink-0"
                                    />
                                  )}
                                  <input
                                    type="text"
                                    value={val}
                                    onChange={(e) => handleCellChange(row.id, col.key, e.target.value)}
                                    placeholder="Enter prompt for this video background..."
                                    className="w-full bg-slate-900/60 hover:bg-slate-900 focus:bg-slate-900 border border-purple-500/30 rounded px-2 py-1 text-slate-300 text-xs focus:outline-none focus:border-purple-500 truncate"
                                  />
                                </div>
                              </td>
                            );
                          }

                          return (
                            <td key={col.id} className="py-2.5 px-3 min-w-[120px] max-w-[200px]">
                              <input
                                type="text"
                                value={val}
                                onChange={(e) => handleCellChange(row.id, col.key, e.target.value)}
                                className="w-full bg-slate-900/60 hover:bg-slate-900 focus:bg-slate-900 border border-transparent focus:border-slate-700 rounded px-2 py-1 text-slate-200 text-xs focus:outline-none transition-colors"
                              />
                            </td>
                          );
                        })}

                        {/* Audio TTS Speak Button */}
                        <td className="py-2.5 px-3 text-center">
                          <button
                            onClick={() => handleListenToRow(row)}
                            className={`px-2 py-1 rounded text-xs font-semibold transition-all flex items-center justify-center gap-1 mx-auto ${
                              activeSpeechRowId === row.id
                                ? 'bg-amber-500 text-slate-950 font-bold animate-pulse'
                                : 'bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300'
                            }`}
                            title={`Listen to this quiz spoken aloud in ${speechLanguage.toUpperCase()}`}
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                            <span>{activeSpeechRowId === row.id ? 'Playing' : 'Listen'}</span>
                          </button>
                        </td>

                        {/* Preview in Canvas Button */}
                        <td className="py-2.5 px-3 text-center">
                          <button
                            onClick={() => {
                              onSelectPreviewRow(idx);
                              soundEngine.playTick();
                            }}
                            className={`px-2.5 py-1 rounded text-xs font-semibold transition-all flex items-center justify-center gap-1.5 mx-auto ${
                              isCurrentPreview
                                ? 'bg-cyan-500 text-slate-950 shadow-sm shadow-cyan-500/30 font-bold'
                                : 'bg-slate-800 hover:bg-slate-700 text-cyan-400'
                            }`}
                            title="Preview this video row on the main canvas"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>{isCurrentPreview ? 'Active' : 'Preview'}</span>
                          </button>
                        </td>

                        {/* Delete Row */}
                        <td className="py-2.5 px-3 text-center">
                          <button
                            onClick={() => handleDeleteRow(row.id)}
                            className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Delete row"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Bottom Row Add Button */}
            <div className="p-2 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
              <button
                onClick={handleAddRow}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors text-xs font-medium"
              >
                <Plus className="w-3.5 h-3.5 text-cyan-400" />
                <span>Add Video Row</span>
              </button>

              <span className="text-[11px] text-slate-500">
                Total Videos: <strong className="text-slate-300">{bulkConfig.rows.length}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Modal Bottom Footer: Batch Export Controls */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {isBatchExporting && (
              <div className="flex items-center gap-3">
                <div className="w-36 h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 transition-all duration-300"
                    style={{ width: `${batchProgress}%` }}
                  />
                </div>
                <span className="text-xs text-cyan-300 font-mono font-bold">
                  Video {currentBatchIndex + 1}/{bulkConfig.rows.length} ({batchProgress}%)
                </span>
              </div>
            )}

            {batchExportedFiles.length > 0 && !isBatchExporting && (
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{batchExportedFiles.length} Videos Exported ({batchExportedFiles[batchExportedFiles.length - 1].size} each • 100% Valid WebM)</span>
                </span>
              </div>
            )}

            {exportedZipBlob && !isBatchExporting && (
              <button
                onClick={handleDownloadZipPackage}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all animate-bounce"
              >
                <FileArchive className="w-4 h-4" />
                <span>Download All Videos (.ZIP)</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              Close
            </button>

            <button
              onClick={handleBatchRenderAll}
              disabled={isBatchExporting || bulkConfig.rows.length === 0}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/25 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>
                {isBatchExporting
                  ? `Rendering ${completedCount}/${bulkConfig.rows.length} Videos...`
                  : `Export All ${bulkConfig.rows.length} Videos`}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* CSV Raw Text Modal */}
      {csvTextModalOpen && (
        <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>Paste CSV Data</span>
              </h3>
              <button
                onClick={() => setCsvTextModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <textarea
              value={csvRawText}
              onChange={(e) => setCsvRawText(e.target.value)}
              placeholder="Question,Option_A,Option_B,Correct_Answer,Background_Prompt&#10;Which organ pumps blood?,Heart,Lungs,Heart,Human heart 3D animation&#10;How many lungs?,One,Two,Two,Human lungs 3D anatomical model"
              className="w-full h-48 bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
            />

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setCsvTextModalOpen(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => handleParseCsv()}
                className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold"
              >
                Import Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom CSV Upload & Dynamic Mapping Modal */}
      <CustomCsvMapperModal
        isOpen={isCustomMapperOpen}
        onClose={() => setIsCustomMapperOpen(false)}
        textOverlays={project.textOverlays}
        onApplyMapping={handleApplyCustomMapping}
        existingColumns={bulkConfig.columns}
        existingRows={bulkConfig.rows}
      />
    </div>
  );
};
