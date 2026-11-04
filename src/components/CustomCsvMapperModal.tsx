import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Download,
  ArrowRight,
  Plus,
  RefreshCw,
  Eye,
  Sliders,
  HelpCircle,
  FileText,
} from 'lucide-react';
import {
  BulkDataColumn,
  BulkDataRow,
  TextOverlay,
} from '../types';
import {
  parseCsvText,
  generateSampleCsvContent,
  ParsedCsvResult,
} from '../utils/csvParser';
import { createThematicSvgBackground } from '../data/medicalQuizData';
import { soundEngine } from '../services/soundEffects';

export interface ColumnMappingConfig {
  headerName: string;
  cleanKey: string;
  targetType: 'overlay' | 'background_prompt' | 'new_layer' | 'ignore';
  mappedOverlayId?: string;
  newLayerName?: string;
}

interface CustomCsvMapperModalProps {
  isOpen: boolean;
  onClose: () => void;
  textOverlays: TextOverlay[];
  onApplyMapping: (
    columns: BulkDataColumn[],
    rows: BulkDataRow[],
    newOverlays?: TextOverlay[]
  ) => void;
  existingColumns?: BulkDataColumn[];
  existingRows?: BulkDataRow[];
}

export const CustomCsvMapperModal: React.FC<CustomCsvMapperModalProps> = ({
  isOpen,
  onClose,
  textOverlays,
  onApplyMapping,
  existingColumns,
  existingRows,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<string | null>(null);
  const [rawText, setRawText] = useState<string>('');
  const [parsedData, setParsedData] = useState<ParsedCsvResult | null>(null);
  const [mappings, setMappings] = useState<ColumnMappingConfig[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [previewTab, setPreviewTab] = useState<'mapping' | 'table_preview'>('mapping');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-generate smart initial mappings when parsedData changes
  const autoDetectMappings = (headers: string[]): ColumnMappingConfig[] => {
    return headers.map((header) => {
      const lower = header.toLowerCase().trim();
      const cleanKey = header.replace(/[^a-zA-Z0-9_]/g, '_');

      // 1. Background prompt check
      if (
        lower.includes('prompt') ||
        lower.includes('background') ||
        lower.includes('bg_') ||
        lower === 'bg' ||
        lower.includes('visual') ||
        lower.includes('image_desc')
      ) {
        return {
          headerName: header,
          cleanKey,
          targetType: 'background_prompt',
        };
      }

      // 2. Question / Hook / Headline check
      if (
        lower.includes('question') ||
        lower.includes('hook') ||
        lower.includes('title') ||
        lower.includes('headline')
      ) {
        const questionLayer = textOverlays.find(
          (t) =>
            t.role === 'question' ||
            t.role === 'hook' ||
            t.id.includes('head') ||
            t.id === 'txt_question'
        );
        if (questionLayer) {
          return {
            headerName: header,
            cleanKey,
            targetType: 'overlay',
            mappedOverlayId: questionLayer.id,
          };
        }
      }

      // 3. Option A check
      if (
        lower.includes('option_a') ||
        lower.includes('option a') ||
        lower.includes('opt_a') ||
        lower.includes('choice_a') ||
        lower === 'a' ||
        lower === 'option 1'
      ) {
        const optALayer = textOverlays.find(
          (t) => t.role === 'option_a' || t.id === 'txt_opt_a'
        );
        if (optALayer) {
          return {
            headerName: header,
            cleanKey,
            targetType: 'overlay',
            mappedOverlayId: optALayer.id,
          };
        }
      }

      // 4. Option B check
      if (
        lower.includes('option_b') ||
        lower.includes('option b') ||
        lower.includes('opt_b') ||
        lower.includes('choice_b') ||
        lower === 'b' ||
        lower === 'option 2'
      ) {
        const optBLayer = textOverlays.find(
          (t) => t.role === 'option_b' || t.id === 'txt_opt_b'
        );
        if (optBLayer) {
          return {
            headerName: header,
            cleanKey,
            targetType: 'overlay',
            mappedOverlayId: optBLayer.id,
          };
        }
      }

      // 5. Correct Answer check
      if (
        lower.includes('correct') ||
        lower.includes('answer') ||
        lower.includes('ans') ||
        lower.includes('solution') ||
        lower === 'result'
      ) {
        const ansLayer = textOverlays.find(
          (t) => t.role === 'answer_reveal' || t.id === 'txt_correct'
        );
        if (ansLayer) {
          return {
            headerName: header,
            cleanKey,
            targetType: 'overlay',
            mappedOverlayId: ansLayer.id,
          };
        }
      }

      // 6. Generic match with existing overlays
      const matchedLayer = textOverlays.find(
        (t) =>
          t.text.toLowerCase().includes(lower) ||
          (t.role && lower.includes(t.role.toLowerCase()))
      );
      if (matchedLayer) {
        return {
          headerName: header,
          cleanKey,
          targetType: 'overlay',
          mappedOverlayId: matchedLayer.id,
        };
      }

      // Default: If unmapped, let user decide or create new layer
      return {
        headerName: header,
        cleanKey,
        targetType: 'ignore',
      };
    });
  };

  // If existing rows/columns exist, initialize with them if user opens mapper
  useEffect(() => {
    if (existingColumns && existingColumns.length > 0 && (!parsedData || parsedData.headers.length === 0)) {
      const headers = existingColumns.map((c) => c.name);
      const rows = (existingRows || []).map((r) => r.data);
      const initialMappings: ColumnMappingConfig[] = existingColumns.map((c) => ({
        headerName: c.name,
        cleanKey: c.key,
        targetType: c.type === 'background_prompt' ? 'background_prompt' : c.mappedOverlayId ? 'overlay' : 'ignore',
        mappedOverlayId: c.mappedOverlayId,
      }));

      setParsedData({
        headers,
        rows,
        rawRows: rows.map((r) => headers.map((h) => r[h.replace(/[^a-zA-Z0-9_]/g, '_')] || '')),
        delimiter: ',',
        rowCount: rows.length,
      });
      setMappings(initialMappings);
    }
  }, [existingColumns, existingRows]);

  if (!isOpen) return null;

  const handleProcessText = (content: string, name?: string, sizeStr?: string) => {
    const result = parseCsvText(content);
    if (result.headers.length === 0 || result.rowCount === 0) {
      alert('Could not detect valid CSV headers or rows. Please check file format.');
      return;
    }

    setParsedData(result);
    setFileName(name || 'Custom_Data.csv');
    setFileSize(sizeStr || `${(content.length / 1024).toFixed(1)} KB`);
    const initialMap = autoDetectMappings(result.headers);
    setMappings(initialMap);
    soundEngine.playCorrectDing();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        handleProcessText(
          content,
          file.name,
          `${(file.size / 1024).toFixed(1)} KB`
        );
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        handleProcessText(
          content,
          file.name,
          `${(file.size / 1024).toFixed(1)} KB`
        );
      }
    };
    reader.readAsText(file);
  };

  const handleDownloadTemplate = (type: 'medical_quiz' | 'viral_quotes' | 'general') => {
    const csvStr = generateSampleCsvContent(type);
    const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NovaCut_${type}_template.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    soundEngine.playTick();
  };

  const handleTargetTypeChange = (
    headerName: string,
    targetType: ColumnMappingConfig['targetType']
  ) => {
    setMappings((prev) =>
      prev.map((m) => {
        if (m.headerName === headerName) {
          let mappedOverlayId = m.mappedOverlayId;
          if (targetType === 'overlay' && !mappedOverlayId) {
            mappedOverlayId = textOverlays[0]?.id;
          }
          return {
            ...m,
            targetType,
            mappedOverlayId: targetType === 'overlay' ? mappedOverlayId : undefined,
          };
        }
        return m;
      })
    );
  };

  const handleOverlaySelect = (headerName: string, overlayId: string) => {
    setMappings((prev) =>
      prev.map((m) => {
        if (m.headerName === headerName) {
          return {
            ...m,
            targetType: 'overlay',
            mappedOverlayId: overlayId,
          };
        }
        return m;
      })
    );
  };

  const handleResetAutoMapping = () => {
    if (!parsedData) return;
    setMappings(autoDetectMappings(parsedData.headers));
    soundEngine.playWhoosh();
  };

  // Commit and apply mapping
  const handleApply = () => {
    if (!parsedData || parsedData.rowCount === 0) return;

    // Detect if new layers need to be created
    const newLayersToCreate: TextOverlay[] = [];
    const finalColumns: BulkDataColumn[] = [];

    mappings.forEach((m, idx) => {
      if (m.targetType === 'ignore') return;

      if (m.targetType === 'background_prompt') {
        finalColumns.push({
          id: `col_bg_${idx}`,
          name: m.headerName,
          key: m.cleanKey,
          type: 'background_prompt',
        });
      } else if (m.targetType === 'new_layer') {
        const newLayerId = `txt_layer_${Date.now()}_${idx}`;
        const newLayer: TextOverlay = {
          id: newLayerId,
          text: `{${m.headerName}}`,
          startTime: 0,
          endTime: 8,
          color: '#ffffff',
          fontSize: 24,
          position: 'center',
          fontFamily: 'Plus Jakarta Sans',
          animation: 'fade',
          boxStyle: 'pill',
          role: 'custom',
        };
        newLayersToCreate.push(newLayer);

        finalColumns.push({
          id: `col_custom_${idx}`,
          name: m.headerName,
          key: m.cleanKey,
          type: 'text',
          mappedOverlayId: newLayerId,
        });
      } else if (m.targetType === 'overlay') {
        finalColumns.push({
          id: `col_mapped_${idx}`,
          name: m.headerName,
          key: m.cleanKey,
          type: 'text',
          mappedOverlayId: m.mappedOverlayId,
        });
      }
    });

    // Build BulkDataRows
    const promptMapping = mappings.find((m) => m.targetType === 'background_prompt');

    const finalRows: BulkDataRow[] = parsedData.rows.map((rowObj, rowIdx) => {
      const rowData: Record<string, string> = {};
      mappings.forEach((m) => {
        rowData[m.cleanKey] = rowObj[m.headerName] || '';
      });

      let promptVal = promptMapping ? rowObj[promptMapping.headerName] : '';
      if (!promptVal) {
        const firstVal = Object.values(rowObj)[0] || `Video ${rowIdx + 1}`;
        promptVal = `High quality visual for ${firstVal}, cinematic lighting 4k vertical`;
      }

      const generatedBg = createThematicSvgBackground(
        rowObj.Question || rowObj.Title || `Video ${rowIdx + 1}`,
        promptVal
      );

      return {
        id: `bulk_row_${Date.now()}_${rowIdx}`,
        data: rowData,
        backgroundPrompt: promptVal,
        generatedBackgroundUrl: generatedBg,
      };
    });

    soundEngine.playCorrectDing();
    onApplyMapping(
      finalColumns,
      finalRows,
      newLayersToCreate.length > 0 ? newLayersToCreate : undefined
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 md:p-6">
      <div className="w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <FileSpreadsheet className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Custom CSV Upload & Dynamic Field Mapper</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono">
                  AUTO-MAP ENGINE
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Upload your own CSV / Excel data, map columns to text layers & AI background prompts for automated video generation.
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

        {/* Top Controls: Upload / Paste & Template Download */}
        <div className="px-6 py-3 border-b border-slate-800 bg-slate-950/70 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'upload'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload CSV File</span>
            </button>

            <button
              onClick={() => setActiveTab('paste')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
                activeTab === 'paste'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Paste Raw CSV / TSV</span>
            </button>
          </div>

          {/* Sample Template Downloads */}
          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-[11px]">Need a sample format?</span>
            <button
              onClick={() => handleDownloadTemplate('medical_quiz')}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1 text-[11px] font-medium transition-colors"
              title="Download 5-column Medical Quiz sample CSV with Question, Option A, Option B, Answer, and AI Background Prompt"
            >
              <Download className="w-3 h-3 text-cyan-400" />
              <span>Medical Quiz Template</span>
            </button>
            <button
              onClick={() => handleDownloadTemplate('viral_quotes')}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1 text-[11px] font-medium transition-colors"
              title="Download Viral Quotes Template"
            >
              <Download className="w-3 h-3 text-purple-400" />
              <span>Quotes Template</span>
            </button>
          </div>
        </div>

        {/* Main Body */}
        <div className="flex-1 overflow-auto p-6 space-y-6">
          {/* File Input / Paste Section if not yet parsed or user wants to re-upload */}
          {activeTab === 'upload' ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-cyan-400 bg-cyan-500/10'
                  : parsedData
                  ? 'border-slate-700 hover:border-cyan-500/60 bg-slate-950/60'
                  : 'border-slate-700 hover:border-cyan-500 bg-slate-950/80'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt,.tsv"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="flex flex-col items-center justify-center gap-2">
                <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-400">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-200">
                    {fileName ? (
                      <span className="text-cyan-400 flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        {fileName} ({fileSize})
                      </span>
                    ) : (
                      'Click to choose or Drag & Drop your CSV / TSV file here'
                    )}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Supports Microsoft Excel, Google Sheets, Canva, and ChatGPT exported CSV files
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300">
                  Paste Tab-Separated or Comma-Separated Values:
                </label>
                <button
                  onClick={() => {
                    setRawText(generateSampleCsvContent('medical_quiz'));
                  }}
                  className="text-xs text-cyan-400 hover:underline"
                >
                  Insert Sample Data
                </button>
              </div>
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Question,Option_A,Option_B,Correct_Answer,Background_Prompt&#10;What is the largest organ?,Skin,Liver,Skin,Human skin microscopic glowing dermal cells 4k"
                rows={5}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
              />
              <div className="flex justify-end">
                <button
                  onClick={() => handleProcessText(rawText, 'Pasted_Data.csv')}
                  disabled={!rawText.trim()}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Parse & Map Columns</span>
                </button>
              </div>
            </div>
          )}

          {/* Parsed Summary and Dynamic Column Mapping */}
          {parsedData && parsedData.headers.length > 0 && (
            <div className="space-y-4 pt-2">
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold text-xs flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{parsedData.rowCount} Rows Detected</span>
                  </div>
                  <div className="px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-semibold text-xs">
                    {parsedData.headers.length} Headers Found
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-xs">
                    <button
                      onClick={() => setPreviewTab('mapping')}
                      className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                        previewTab === 'mapping'
                          ? 'bg-cyan-500 text-slate-950'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Field Mappings ({mappings.filter((m) => m.targetType !== 'ignore').length} Active)
                    </button>
                    <button
                      onClick={() => setPreviewTab('table_preview')}
                      className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                        previewTab === 'table_preview'
                          ? 'bg-cyan-500 text-slate-950'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Sample Data Preview
                    </button>
                  </div>

                  <button
                    onClick={handleResetAutoMapping}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 transition-colors"
                    title="Re-run intelligent fuzzy match to map columns to template overlays"
                  >
                    <RefreshCw className="w-3 h-3 text-cyan-400" />
                    <span>Auto-Detect</span>
                  </button>
                </div>
              </div>

              {previewTab === 'mapping' ? (
                /* Dynamic Mapping Grid */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {mappings.map((mapping, idx) => {
                    const sampleVal = parsedData.rows[0]?.[mapping.headerName] || '';
                    const sampleVal2 = parsedData.rows[1]?.[mapping.headerName] || '';

                    return (
                      <div
                        key={mapping.headerName}
                        className={`p-3.5 rounded-xl border transition-all ${
                          mapping.targetType === 'background_prompt'
                            ? 'bg-purple-950/20 border-purple-500/40 shadow-sm shadow-purple-500/10'
                            : mapping.targetType === 'overlay'
                            ? 'bg-slate-950 border-cyan-500/40 shadow-sm shadow-cyan-500/5'
                            : mapping.targetType === 'new_layer'
                            ? 'bg-emerald-950/20 border-emerald-500/40'
                            : 'bg-slate-950/60 border-slate-800 opacity-60'
                        }`}
                      >
                        {/* Top: Header Name and Sample Preview */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <span className="font-mono text-xs font-bold text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                              {mapping.headerName}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-slate-500 font-mono">
                              Col {idx + 1}
                            </span>
                          </div>
                        </div>

                        {/* Sample Data Pill */}
                        <div className="mb-3 text-[11px] text-slate-400 truncate bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-800/80">
                          <span className="text-slate-500 mr-1">Sample:</span>
                          <span className="text-slate-200 font-medium">"{sampleVal}"</span>
                          {sampleVal2 && (
                            <span className="text-slate-400 ml-1.5 font-normal">
                              / "{sampleVal2}"
                            </span>
                          )}
                        </div>

                        {/* Target Selection */}
                        <div className="space-y-2">
                          <label className="text-[11px] font-semibold text-slate-300 block">
                            Map to Destination:
                          </label>

                          <div className="grid grid-cols-2 gap-1.5 text-xs">
                            {/* Option 1: Existing Overlay */}
                            <button
                              type="button"
                              onClick={() => handleTargetTypeChange(mapping.headerName, 'overlay')}
                              className={`p-1.5 rounded-lg border text-left font-semibold flex items-center gap-1.5 transition-colors ${
                                mapping.targetType === 'overlay'
                                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                              }`}
                            >
                              <Layers className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">Text Layer</span>
                            </button>

                            {/* Option 2: Background Prompt */}
                            <button
                              type="button"
                              onClick={() =>
                                handleTargetTypeChange(mapping.headerName, 'background_prompt')
                              }
                              className={`p-1.5 rounded-lg border text-left font-semibold flex items-center gap-1.5 transition-colors ${
                                mapping.targetType === 'background_prompt'
                                  ? 'bg-purple-500/20 border-purple-400 text-purple-300'
                                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                              }`}
                            >
                              <Sparkles className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">AI BG Prompt</span>
                            </button>

                            {/* Option 3: Create New Layer */}
                            <button
                              type="button"
                              onClick={() =>
                                handleTargetTypeChange(mapping.headerName, 'new_layer')
                              }
                              className={`p-1.5 rounded-lg border text-left font-semibold flex items-center gap-1.5 transition-colors ${
                                mapping.targetType === 'new_layer'
                                  ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                              }`}
                            >
                              <Plus className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">New Layer</span>
                            </button>

                            {/* Option 4: Ignore */}
                            <button
                              type="button"
                              onClick={() => handleTargetTypeChange(mapping.headerName, 'ignore')}
                              className={`p-1.5 rounded-lg border text-left font-semibold flex items-center gap-1.5 transition-colors ${
                                mapping.targetType === 'ignore'
                                  ? 'bg-slate-800 border-slate-700 text-slate-300'
                                  : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-400'
                              }`}
                            >
                              <X className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">Skip Column</span>
                            </button>
                          </div>

                          {/* Specific Overlay Picker Dropdown if targetType === 'overlay' */}
                          {mapping.targetType === 'overlay' && (
                            <div className="pt-1">
                              <select
                                value={mapping.mappedOverlayId || ''}
                                onChange={(e) =>
                                  handleOverlaySelect(mapping.headerName, e.target.value)
                                }
                                className="w-full bg-slate-900 border border-cyan-500/40 rounded-lg px-2.5 py-1.5 text-xs text-cyan-300 font-medium focus:outline-none focus:border-cyan-400 truncate"
                              >
                                {textOverlays.map((layer) => (
                                  <option key={layer.id} value={layer.id}>
                                    {layer.role ? `[${layer.role.toUpperCase()}] ` : ''}
                                    {layer.text.slice(0, 32)}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}

                          {mapping.targetType === 'background_prompt' && (
                            <div className="pt-1 text-[11px] text-purple-300 flex items-center gap-1.5 font-medium">
                              <span>✨ Generates dynamic AI background image per video</span>
                            </div>
                          )}

                          {mapping.targetType === 'new_layer' && (
                            <div className="pt-1 text-[11px] text-emerald-300 flex items-center gap-1.5 font-medium">
                              <span>➕ Adds a new text overlay on canvas bound to this column</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Sample Data Preview Table */
                <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
                  <div className="overflow-x-auto max-h-[300px]">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 select-none sticky top-0 z-10">
                        <tr>
                          <th className="py-2 px-3 w-10 text-center font-mono">#</th>
                          {mappings.map((m) => (
                            <th key={m.headerName} className="py-2 px-3 font-semibold text-slate-300">
                              <div className="flex flex-col">
                                <span>{m.headerName}</span>
                                <span
                                  className={`text-[10px] font-mono ${
                                    m.targetType === 'background_prompt'
                                      ? 'text-purple-400'
                                      : m.targetType === 'overlay'
                                      ? 'text-cyan-400'
                                      : m.targetType === 'new_layer'
                                      ? 'text-emerald-400'
                                      : 'text-slate-500 line-through'
                                  }`}
                                >
                                  {m.targetType === 'background_prompt'
                                    ? 'BG PROMPT'
                                    : m.targetType === 'overlay'
                                    ? textOverlays.find((o) => o.id === m.mappedOverlayId)?.role?.toUpperCase() || 'OVERLAY'
                                    : m.targetType === 'new_layer'
                                    ? 'NEW LAYER'
                                    : 'IGNORED'}
                                </span>
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {parsedData.rows.slice(0, 5).map((row, rIdx) => (
                          <tr key={rIdx} className="hover:bg-slate-900/40">
                            <td className="py-2 px-3 text-center font-mono text-slate-500 font-bold">
                              {rIdx + 1}
                            </td>
                            {mappings.map((m) => {
                              const val = row[m.headerName] || '';
                              return (
                                <td
                                  key={m.headerName}
                                  className={`py-2 px-3 max-w-xs truncate ${
                                    m.targetType === 'ignore' ? 'text-slate-600' : 'text-slate-200'
                                  }`}
                                  title={val}
                                >
                                  {val || <span className="text-slate-600 italic">empty</span>}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
          </div>

          <div className="flex items-center gap-3">
            {parsedData && (
              <span className="text-xs text-slate-400">
                Ready to generate{' '}
                <strong className="text-white">{parsedData.rowCount}</strong> videos with{' '}
                <strong className="text-cyan-400">
                  {mappings.filter((m) => m.targetType !== 'ignore').length}
                </strong>{' '}
                mapped fields
              </span>
            )}

            <button
              onClick={handleApply}
              disabled={!parsedData || parsedData.rowCount === 0}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/25 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Apply Mapping & Generate Videos</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
