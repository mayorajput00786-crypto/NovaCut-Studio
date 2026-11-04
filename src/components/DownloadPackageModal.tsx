import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  FolderArchive,
  FileCode,
  HardDrive,
  CheckCircle2,
  ExternalLink,
  Laptop,
  Terminal,
  ShieldCheck,
  Sparkles,
  Info,
  Check,
  Copy,
  AlertTriangle,
  Play,
  Globe,
} from 'lucide-react';

interface DownloadPackageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PackageFileInfo {
  id: string;
  name: string;
  type: string;
  description: string;
  sizeBytes: number;
  sizeFormatted: string;
  downloadUrl: string;
}

const getLiveAppUrl = () => typeof window !== 'undefined' ? window.location.origin : '';

export const DownloadPackageModal: React.FC<DownloadPackageModalProps> = ({ isOpen, onClose }) => {
  const [fileList, setFileList] = useState<PackageFileInfo[]>([
    {
      id: 'exe-v2',
      name: 'NovaCut-Studio-Desktop-Setup-v2.exe',
      type: 'Windows Native Installer v2.0 (EXE)',
      description: 'Native 64-bit Windows GUI installer v2.0 — creates Desktop shortcut & opens live app window directly without localhost error',
      sizeBytes: 44032,
      sizeFormatted: '43.0 KB',
      downloadUrl: '/api/download/exe-v2',
    },
    {
      id: 'windows-zip-v2',
      name: 'NovaCut-Studio-Windows-Desktop-Setup-v2.zip',
      type: 'Complete Windows Desktop Package v2.0 (ZIP)',
      description: 'Complete 5.3 MB verified ZIP with offline PowerShell server, native EXE, batch launchers, and Urdu documentation',
      sizeBytes: 5552706,
      sizeFormatted: '5.3 MB',
      downloadUrl: '/api/download/windows-zip-v2',
    },
    {
      id: 'quick-launcher',
      name: 'NovaCut-Desktop-QuickLauncher.bat',
      type: '1-Click Desktop Launcher Script (BAT)',
      description: 'Instant 2 KB 1-click script — creates desktop icon and opens NovaCut Studio window immediately',
      sizeBytes: 2100,
      sizeFormatted: '2.0 KB',
      downloadUrl: '/api/download/quick-launcher',
    },
    {
      id: 'html-launcher',
      name: 'Launch-NovaCut-Studio.html',
      type: 'Direct 1-Click Browser Launcher (HTML)',
      description: 'Zero install — double-click to open NovaCut Studio directly in any browser with full master admin privileges',
      sizeBytes: 748,
      sizeFormatted: '1.0 KB',
      downloadUrl: '/api/download/html-launcher',
    },
    {
      id: 'project-zip',
      name: 'NovaCut-Studio-Complete-Project.zip',
      type: 'Full Source Code & Production Build (ZIP)',
      description: 'Full project source code, UI components, Gemini AI server, licensing engine, and tests',
      sizeBytes: 84125481,
      sizeFormatted: '80.2 MB',
      downloadUrl: '/api/download/project-zip',
    },
  ]);

  const [activeTab, setActiveTab] = useState<'downloads' | 'guide'>('downloads');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [downloadSuccessId, setDownloadSuccessId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetch(`/api/download/info?t=${Date.now()}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.files) && data.files.length > 0) {
            setFileList(data.files);
          }
        })
        .catch(() => {
          // fallback to defaults already in state
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Robust Blob-based download with cache-busting
  const handleDownload = async (file: PackageFileInfo) => {
    try {
      setDownloadingId(file.id);
      setDownloadProgress(15);

      const bustUrl = `${file.downloadUrl}?t=${Date.now()}`;
      const response = await fetch(bustUrl);
      if (!response.ok) {
        throw new Error(`Download failed with status ${response.status}`);
      }

      setDownloadProgress(65);
      const blob = await response.blob();
      setDownloadProgress(90);

      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setDownloadProgress(100);
      setDownloadSuccessId(file.id);

      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
        setDownloadingId(null);
        setDownloadProgress(0);
      }, 1500);

      setTimeout(() => {
        setDownloadSuccessId(null);
      }, 4000);
    } catch (err) {
      console.error('Download error, falling back to direct anchor:', err);
      window.open(`${file.downloadUrl}?t=${Date.now()}`, '_blank');
      setDownloadingId(null);
      setDownloadProgress(0);
    }
  };

  const handleCopyLink = (file: PackageFileInfo) => {
    const fullUrl = `${window.location.origin}${file.downloadUrl}?t=${Date.now()}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(file.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Download className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  NovaCut Studio — Windows Desktop v2.0 Setup
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Fixed & Ready
                </span>
              </div>
              <p className="text-xs text-slate-400">
                ونڈوز ڈیسک ٹاپ سافٹ ویئر v2.0 — بغیر کسی لوکل ہوسٹ یا کنکشن ایرر کے
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-6">
          <button
            onClick={() => setActiveTab('downloads')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'downloads'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FolderArchive className="w-4 h-4" />
            <span>فائلز ڈاؤن لوڈ کریں (Download Files v2.0)</span>
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'guide'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Laptop className="w-4 h-4" />
            <span>مسئلہ حل کی مکمل رہنمائی (Urdu Guide)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-slate-200 text-sm">
          {activeTab === 'downloads' ? (
            <div className="space-y-4">
              {/* Instant 1-Click Browser Launch Banner */}
              <div className="bg-gradient-to-r from-cyan-950/60 to-indigo-950/60 border border-cyan-800/50 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
                <div className="flex items-start gap-3">
                  <Globe className="w-6 h-6 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-bold text-white">فوری ڈیسک ٹاپ ونڈو اوپن کریں (Direct Instant Launch)</h3>
                    <p className="text-xs text-slate-300">
                      بغیر کسی انسٹالیشن کے فوراً NovaCut Studio کو مکمل اسکرین میں کھولیں
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => window.open(getLiveAppUrl(), '_blank')}
                  className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 active:scale-95 transition-all shrink-0"
                >
                  <Play className="w-4 h-4 fill-slate-950" />
                  <span>Open NovaCut Now</span>
                </button>
              </div>

              {/* Error Resolution Notice */}
              <div className="bg-emerald-950/30 border border-emerald-800/50 rounded-xl p-4 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-300 space-y-1">
                  <p className="font-semibold text-emerald-300">
                    "localhost refused to connect" کا مسئلہ مستقل حل ہو گیا ہے!
                  </p>
                  <p className="text-slate-300">
                    پرانا شارٹ کٹ لوکل ہوسٹ سے جڑا تھا جو بند تھا۔ نیا <strong className="text-white font-mono">Setup-v2.exe</strong> اور نیا شارٹ کٹ براہ راست لائیو اسٹوڈیو کو فل اسکرین ڈیسک ٹاپ موڈ میں چلاتا ہے، اب کبھی بھی کنکشن ایرر نہیں آئے گا۔
                  </p>
                </div>
              </div>

              {/* Download Cards */}
              <div className="grid gap-3">
                {fileList.map((file) => {
                  const isExe = file.id.includes('exe');
                  const isWinZip = file.id.includes('zip') && !file.id.includes('project');
                  const isBat = file.id.includes('launcher') || file.id.includes('quick');
                  const isHtml = file.id.includes('html');
                  const isDownloading = downloadingId === file.id;
                  const isSuccess = downloadSuccessId === file.id;

                  return (
                    <div
                      key={file.id}
                      className={`group bg-slate-950/70 border rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all hover:shadow-lg ${
                        isExe
                          ? 'border-amber-500/50 hover:border-amber-400 bg-amber-950/15'
                          : isWinZip
                          ? 'border-cyan-500/50 hover:border-cyan-400 bg-cyan-950/15'
                          : isBat
                          ? 'border-emerald-500/40 hover:border-emerald-400 bg-emerald-950/10'
                          : 'border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start gap-3.5 min-w-0 flex-1">
                        <div
                          className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
                            isExe
                              ? 'bg-gradient-to-tr from-amber-500 to-orange-600 text-white'
                              : isWinZip
                              ? 'bg-gradient-to-tr from-cyan-500 to-blue-600 text-white'
                              : isBat
                              ? 'bg-gradient-to-tr from-emerald-500 to-teal-600 text-white'
                              : isHtml
                              ? 'bg-gradient-to-tr from-sky-500 to-indigo-600 text-white'
                              : 'bg-gradient-to-tr from-purple-500 to-indigo-600 text-white'
                          }`}
                        >
                          {isExe ? (
                            <HardDrive className="w-5 h-5" />
                          ) : isWinZip ? (
                            <FolderArchive className="w-5 h-5" />
                          ) : isBat ? (
                            <Terminal className="w-5 h-5" />
                          ) : isHtml ? (
                            <Globe className="w-5 h-5" />
                          ) : (
                            <FileCode className="w-5 h-5" />
                          )}
                        </div>

                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-white text-sm font-mono truncate">
                              {file.name}
                            </span>
                            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                              {file.sizeFormatted}
                            </span>
                            {isExe && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                تجویز کردہ (v2.0 Fixed)
                              </span>
                            )}
                            {isWinZip && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                                Complete Offline Package
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400">
                            {file.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full md:w-auto shrink-0 justify-end">
                        <button
                          onClick={() => handleCopyLink(file)}
                          title="Copy Direct Link"
                          className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors text-xs flex items-center justify-center"
                        >
                          {copiedId === file.id ? (
                            <Check className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>

                        <a
                          href={`${file.downloadUrl}?t=${Date.now()}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Open direct download in new browser tab"
                          className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors text-xs flex items-center justify-center"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>

                        <button
                          onClick={() => handleDownload(file)}
                          disabled={isDownloading}
                          className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs tracking-wide transition-all shadow-md active:scale-95 min-w-[140px] ${
                            isSuccess
                              ? 'bg-emerald-500 text-slate-950 font-extrabold'
                              : isExe
                              ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-orange-500/20'
                              : isWinZip
                              ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/20'
                              : isBat
                              ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                              : isHtml
                              ? 'bg-sky-500 hover:bg-sky-400 text-slate-950'
                              : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                          }`}
                        >
                          {isSuccess ? (
                            <>
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Downloaded!</span>
                            </>
                          ) : isDownloading ? (
                            <>
                              <div className="w-3.5 h-3.5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                              <span>{downloadProgress}% Saving...</span>
                            </>
                          ) : (
                            <>
                              <Download className="w-4 h-4 stroke-[2.5]" />
                              <span>Download File</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Master Owner Notice */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 text-xs text-slate-400 space-y-1.5">
                <div className="flex items-center gap-2 text-amber-400 font-semibold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>ماسٹر اونر رسائی (Master Owner Pre-Configured)</span>
                </div>
                <p>
                  اس سافٹ ویئر میں آپ کے ای میل ایڈریسز (
                  <span className="text-slate-200 font-mono">mayorajput00786@gmail.com</span> اور{' '}
                  <span className="text-slate-200 font-mono">josnking01@gmail.com</span>) مستقل ماسٹر اونر کے
                  طور پر سیٹ ہیں۔ سافٹ ویئر چلاتے ہی یہ خودکار لاگ ان ہو جائے گا۔
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
              <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-5 space-y-4">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  <span>"localhost refused to connect" کیوں آیا اور اب کیسے چلے گا؟</span>
                </div>

                <div className="space-y-3 text-slate-300">
                  <p className="text-slate-300">
                    پہلے آپ کے کمپیوٹر پر بنے شارٹ کٹ نے <code className="text-amber-300">localhost:3000</code> کھولنے کی کوشش کی تھی، لیکن چونکہ لوکل سرور آن نہیں تھا اس لیے براؤزر نے Refuse کر دیا۔
                  </p>
                  <p className="text-emerald-300 font-semibold">
                    اب نیا سیٹ اپ v2.0 کیسے استعمال کریں:
                  </p>
                  <ol className="list-decimal list-inside space-y-2 text-slate-300">
                    <li>
                      اپنے ڈیسک ٹاپ پر موجود پرانے "NovaCut Studio" شارٹ کٹ کو ڈیلیٹ کر دیں۔
                    </li>
                    <li>
                      اوپر <strong className="text-amber-300 font-mono">NovaCut-Studio-Desktop-Setup-v2.exe</strong> ڈاؤن لوڈ کر کے چلائیں۔
                    </li>
                    <li>
                      یہ نیا شارٹ کٹ بنا دے گا اور جب آپ <strong>Yes</strong> کریں گے تو لائیو سافٹ ویئر فل اسکرین ونڈو میں اوپن ہو جائے گا۔
                    </li>
                    <li>
                      یا آپ صرف <strong className="text-emerald-300 font-mono">NovaCut-Desktop-QuickLauncher.bat</strong> پر ڈبل کلک کر کے بھی ایک سیکنڈ میں سافٹ ویئر لانچ کر سکتے ہیں!
                    </li>
                  </ol>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-cyan-400" />
            <span>Version 2.0 with instant cloud launcher & zero connection errors</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
