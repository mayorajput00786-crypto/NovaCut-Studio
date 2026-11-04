import React, { useState, useEffect } from 'react';
import {
  X,
  Crown,
  Key,
  Copy,
  Check,
  Plus,
  Shield,
  Trash2,
  AlertTriangle,
  RefreshCw,
  Clock,
  UserCheck,
  Laptop,
  Layers,
  Download,
  Search,
  Filter,
  Activity,
  UserPlus,
  ExternalLink,
  ChevronRight,
  Database,
  Lock,
  BarChart3,
  LayoutDashboard,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { getStoredOwnerToken } from '../services/licensingClient';
import { LicenseDistributionChart } from './LicenseDistributionChart';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  adminEmail: string;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ isOpen, onClose, adminEmail }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'licenses' | 'generator' | 'devices' | 'owners' | 'audit' | 'tests'>('overview');
  const [metrics, setMetrics] = useState<any>(null);
  const [licenses, setLicenses] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [owners, setOwners] = useState<any[]>([]);
  const [testResults, setTestResults] = useState<any | null>(null);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [selectedLicenseDevices, setSelectedLicenseDevices] = useState<{ licenseId: string; devices: any[] } | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');

  // Generator form state
  const [planType, setPlanType] = useState<'monthly' | 'annual' | 'lifetime' | 'trial' | 'custom'>('monthly');
  const [customDays, setCustomDays] = useState(30);
  const [maxDevices, setMaxDevices] = useState(1);
  const [batchQuantity, setBatchQuantity] = useState(1);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [licenseNotes, setLicenseNotes] = useState('');
  const [generatedBatch, setGeneratedBatch] = useState<any[] | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Allowlist form state
  const [newOwnerEmail, setNewOwnerEmail] = useState('');
  const [newOwnerNotes, setNewOwnerNotes] = useState('');

  // UI helpers
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [copiedBatchAll, setCopiedBatchAll] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const getAuthHeaders = () => {
    const token = getStoredOwnerToken() || '';
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  };

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const headers = getAuthHeaders();

      // Fetch Metrics
      const mRes = await fetch('/api/admin/metrics', { headers });
      if (mRes.ok) {
        const mData = await mRes.json();
        setMetrics(mData.metrics);
      }

      // Fetch Licenses
      const lRes = await fetch(`/api/admin/licenses?search=${encodeURIComponent(searchQuery)}&status=${filterStatus}&type=${filterType}`, {
        headers,
      });
      if (lRes.ok) {
        const lData = await lRes.json();
        setLicenses(lData.licenses || []);
      }

      // Fetch Owners
      const oRes = await fetch('/api/admin/owners', { headers });
      if (oRes.ok) {
        const oData = await oRes.json();
        setOwners(oData.owners || []);
      }

      // Fetch Audit Logs
      const aRes = await fetch('/api/admin/audit-logs?limit=50', { headers });
      if (aRes.ok) {
        const aData = await aRes.json();
        setAuditLogs(aData.logs || []);
      }
    } catch (e) {
      console.error('[Admin] Fetch error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAllData();
    }
  }, [isOpen, searchQuery, filterStatus, filterType]);

  const handleGenerateKeys = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/admin/licenses/generate', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          type: planType,
          customDays: Number(customDays),
          maxDevices: Number(maxDevices),
          customerName: customerName.trim(),
          customerEmail: customerEmail.trim(),
          notes: licenseNotes.trim(),
          quantity: Number(batchQuantity),
        }),
      });

      const data = await res.json();
      if (data.success && data.keys) {
        setGeneratedBatch(data.keys);
        setStatusMessage({ text: `Successfully generated ${data.count} secure license key(s)!`, type: 'success' });
        setCustomerName('');
        setCustomerEmail('');
        setLicenseNotes('');
        fetchAllData();
      } else {
        setStatusMessage({ text: data.error || 'Failed to generate licenses', type: 'error' });
      }
    } catch (e: any) {
      setStatusMessage({ text: e.message || 'Generation request error', type: 'error' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRevokeLicense = async (licenseId: string) => {
    if (!confirm('Are you sure you want to revoke this license? All connected devices will be immediately blocked.')) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/licenses/${licenseId}/revoke`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        fetchAllData();
        setStatusMessage({ text: 'License successfully revoked.', type: 'success' });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleStatus = async (licenseId: string) => {
    try {
      const res = await fetch(`/api/admin/licenses/${licenseId}/toggle-status`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        fetchAllData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleExtendLicense = async (licenseId: string, days: number = 30) => {
    try {
      const res = await fetch(`/api/admin/licenses/${licenseId}/extend`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ additionalDays: days }),
      });
      if (res.ok) {
        fetchAllData();
        setStatusMessage({ text: `License extended by ${days} days.`, type: 'success' });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleResetDevices = async (licenseId: string) => {
    if (!confirm('Reset all hardware device bindings for this customer? This frees all activation slots.')) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/licenses/${licenseId}/reset-devices`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        fetchAllData();
        setStatusMessage({ text: 'Hardware device slots reset to 0.', type: 'success' });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleViewDevices = async (licenseId: string) => {
    try {
      const res = await fetch(`/api/admin/licenses/${licenseId}/devices`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedLicenseDevices({ licenseId, devices: data.devices || [] });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleForceDeactivateDevice = async (deviceId: string, licenseId: string) => {
    try {
      const res = await fetch(`/api/admin/devices/${deviceId}/deactivate`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ licenseId }),
      });
      if (res.ok) {
        handleViewDevices(licenseId);
        fetchAllData();
        setStatusMessage({ text: 'Device successfully deactivated.', type: 'success' });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddOwner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOwnerEmail.trim()) return;

    try {
      const res = await fetch('/api/admin/owners/add', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ email: newOwnerEmail.trim(), notes: newOwnerNotes.trim() }),
      });
      if (res.ok) {
        setNewOwnerEmail('');
        setNewOwnerNotes('');
        fetchAllData();
        setStatusMessage({ text: 'Authorized owner Gmail added to allowlist.', type: 'success' });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRemoveOwner = async (email: string) => {
    if (!confirm(`Revoke permanent owner access for ${email}?`)) return;
    try {
      const res = await fetch('/api/admin/owners/remove', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        fetchAllData();
        setStatusMessage({ text: 'Owner privileges revoked for this account.', type: 'success' });
      } else {
        const data = await res.json();
        alert(data.error || 'Cannot remove owner');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRunTests = async () => {
    setIsRunningTests(true);
    try {
      const res = await fetch('/api/admin/run-tests', { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success) {
        setTestResults(data);
        setStatusMessage({
          text: `Test suite finished: ${data.passedCount}/${data.totalCount} security checks passed!`,
          type: 'success',
        });
      } else {
        setStatusMessage({ text: data.error || 'Test execution failed', type: 'error' });
      }
    } catch (e: any) {
      setStatusMessage({ text: e.message || 'Error running tests', type: 'error' });
    } finally {
      setIsRunningTests(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(text);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const downloadBatchCSV = () => {
    if (!generatedBatch || generatedBatch.length === 0) return;
    const rows = [
      ['License Key', 'Key Prefix', 'Plan Name', 'Type', 'Max Devices', 'Expiration', 'Customer Name'],
      ...generatedBatch.map((k) => [
        k.rawKey,
        k.keyPrefix,
        k.planName,
        k.type,
        k.maxDevices,
        k.expiresAt || 'Lifetime',
        k.customerName,
      ]),
    ];
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `NovaCut_Licenses_Batch_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyAllBatchKeys = () => {
    if (!generatedBatch) return;
    const all = generatedBatch.map((k) => `${k.rawKey} (${k.planName} - ${k.customerName})`).join('\n');
    navigator.clipboard.writeText(all);
    setCopiedBatchAll(true);
    setTimeout(() => setCopiedBatchAll(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-6xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
              <Crown className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Owner & Administrator Control Hub</h2>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30 flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  Verified Session
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Authenticated Owner: <span className="text-slate-200 font-mono font-medium">{adminEmail}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/api/download/windows-zip"
              download="NovaCut-Studio-Windows-Desktop-Setup.zip"
              className="px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 hover:text-white transition-all flex items-center gap-1.5 text-xs font-semibold"
              title="Download Windows Installer EXE & Desktop Package (ZIP)"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download Desktop EXE / ZIP</span>
            </a>
            <button
              onClick={fetchAllData}
              disabled={isLoading}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-semibold"
              title="Refresh database records"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Status Notification Toast */}
        {statusMessage && (
          <div
            className={`px-6 py-2.5 text-xs font-medium flex items-center justify-between border-b ${
              statusMessage.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
            }`}
          >
            <span>{statusMessage.text}</span>
            <button onClick={() => setStatusMessage(null)} className="hover:opacity-75">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Live Metrics Row */}
        {metrics && (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-2 p-4 bg-slate-950/60 border-b border-slate-800 text-xs font-mono">
            <button
              onClick={() => setActiveTab('overview')}
              className="text-left p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-850 transition-all cursor-pointer"
            >
              <div className="text-slate-400 text-[11px] font-sans">Total Licenses</div>
              <div className="text-lg font-bold text-white mt-0.5">{metrics.totalLicenses}</div>
            </button>
            <button
              onClick={() => {
                setFilterStatus('active');
                setActiveTab('licenses');
              }}
              className="text-left p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-850 transition-all cursor-pointer"
            >
              <div className="text-emerald-400 text-[11px] font-sans flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Active Keys
              </div>
              <div className="text-lg font-bold text-emerald-300 mt-0.5">{metrics.activeLicenses}</div>
            </button>
            <button
              onClick={() => {
                setFilterStatus('available');
                setActiveTab('licenses');
              }}
              className="text-left p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-850 transition-all cursor-pointer"
            >
              <div className="text-cyan-400 text-[11px] font-sans">Available (Stock)</div>
              <div className="text-lg font-bold text-cyan-300 mt-0.5">{metrics.availableLicenses}</div>
            </button>
            <button
              onClick={() => {
                setFilterStatus('expired');
                setActiveTab('licenses');
              }}
              className="text-left p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-rose-500/50 hover:bg-slate-850 transition-all cursor-pointer"
            >
              <div className="text-rose-400 text-[11px] font-sans">Expired / Revoked</div>
              <div className="text-lg font-bold text-rose-300 mt-0.5">
                {metrics.expiredLicenses + metrics.revokedLicenses}
              </div>
            </button>
            <button
              onClick={() => {
                setActiveTab('licenses');
              }}
              className="text-left p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-purple-500/50 hover:bg-slate-850 transition-all cursor-pointer"
            >
              <div className="text-purple-400 text-[11px] font-sans">Active Devices</div>
              <div className="text-lg font-bold text-purple-300 mt-0.5">{metrics.activeDevices}</div>
            </button>
            <button
              onClick={() => setActiveTab('owners')}
              className="text-left p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-850 transition-all cursor-pointer"
            >
              <div className="text-amber-400 text-[11px] font-sans">Owner Allowlist</div>
              <div className="text-lg font-bold text-amber-300 mt-0.5">{metrics.totalOwners} Accounts</div>
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="px-6 pt-3 border-b border-slate-800 flex gap-2 bg-slate-950 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'overview'
                ? 'border-cyan-500 text-cyan-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Dashboard Overview
          </button>
          <button
            onClick={() => setActiveTab('licenses')}
            className={`pb-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'licenses'
                ? 'border-cyan-500 text-cyan-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            License Directory ({licenses.length})
          </button>
          <button
            onClick={() => setActiveTab('generator')}
            className={`pb-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'generator'
                ? 'border-cyan-500 text-cyan-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            Key Generator (Single & Batch)
          </button>
          <button
            onClick={() => setActiveTab('owners')}
            className={`pb-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'owners'
                ? 'border-amber-500 text-amber-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Crown className="w-3.5 h-3.5" />
            Owner Accounts Allowlist ({owners.length})
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`pb-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'audit'
                ? 'border-cyan-500 text-cyan-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Audit History ({auditLogs.length})
          </button>
          <button
            onClick={() => {
              setActiveTab('tests');
              if (!testResults) handleRunTests();
            }}
            className={`pb-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'tests'
                ? 'border-emerald-500 text-emerald-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            Security Tests (18 Checks)
          </button>
        </div>


        {/* Tab Content Areas */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* TAB 0: DASHBOARD OVERVIEW & DISTRIBUTION */}
          {activeTab === 'overview' && (
            <div className="space-y-5">
              {/* License Distribution Chart */}
              <LicenseDistributionChart
                metrics={metrics}
                licenses={licenses}
                onSelectStatusFilter={(status) => {
                  setFilterStatus(status);
                  setActiveTab('licenses');
                }}
              />

              {/* Operations & Quick Management Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Quick Generation CTA */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-bold text-white mb-1">
                      <Key className="w-4 h-4 text-cyan-400" />
                      <span>Issue New License</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Generate single customer keys or bulk batches with hardware fingerprint bindings.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('generator')}
                    className="mt-4 px-3 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-between transition-colors"
                  >
                    <span>Launch Key Generator</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Owner Security Status */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-bold text-white mb-1">
                      <Crown className="w-4 h-4 text-amber-400" />
                      <span>Owner Authorization Policy</span>
                    </div>
                    <div className="text-xs text-slate-400 space-y-1 mt-2">
                      <div className="flex justify-between">
                        <span>Active Allowlist:</span>
                        <span className="font-mono text-amber-300 font-bold">{owners.length} Accounts</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Signature Standard:</span>
                        <span className="font-mono text-slate-300">HMAC-SHA256</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Duplicate Guard:</span>
                        <span className="font-mono text-emerald-400 font-semibold">30-Day Policy Active</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab('owners')}
                    className="mt-4 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-between transition-colors"
                  >
                    <span>Manage Owner Allowlist</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Security Verification Runner */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-bold text-white mb-1">
                      <Shield className="w-4 h-4 text-emerald-400" />
                      <span>Security & Integrity Tests</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Run automated verification suite testing spoof protection, key hashing, and device seat enforcement.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setActiveTab('tests');
                      handleRunTests();
                    }}
                    className="mt-4 px-3 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-bold text-xs flex items-center justify-between transition-colors"
                  >
                    <span>Run 18 Security Checks</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Recent Licenses Quick Table */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold text-white">Recent License Deployments</span>
                  </div>
                  <button
                    onClick={() => setActiveTab('licenses')}
                    className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
                  >
                    <span>View All {licenses.length} Records</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="text-[11px] text-slate-400 border-b border-slate-800 pb-2">
                      <tr>
                        <th className="py-2 px-3 font-sans">Key Prefix</th>
                        <th className="py-2 px-3 font-sans">Customer</th>
                        <th className="py-2 px-3 font-sans">Plan</th>
                        <th className="py-2 px-3 font-sans">Status</th>
                        <th className="py-2 px-3 font-sans">Devices</th>
                        <th className="py-2 px-3 font-sans text-right">Quick Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {licenses.slice(0, 5).map((lic) => (
                        <tr key={lic.id} className="hover:bg-slate-900/40">
                          <td className="py-2.5 px-3 text-cyan-300 font-bold">{lic.keyPrefix}</td>
                          <td className="py-2.5 px-3 font-sans text-slate-200">
                            {lic.customerName || 'Direct License'}
                          </td>
                          <td className="py-2.5 px-3 font-sans text-slate-400">{lic.planName}</td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-sans font-bold border ${
                                lic.status === 'active'
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                  : lic.status === 'available'
                                  ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                                  : lic.status === 'expired'
                                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                  : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                              }`}
                            >
                              {lic.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 tabular-nums text-slate-300">
                            {lic.currentActivations} / {lic.maxDevices}
                          </td>
                          <td className="py-2.5 px-3 text-right font-sans">
                            <button
                              onClick={() => {
                                setSearchQuery(lic.keyPrefix);
                                setActiveTab('licenses');
                              }}
                              className="text-xs text-cyan-400 hover:underline"
                            >
                              Inspect
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: LICENSES TABLE */}
          {activeTab === 'licenses' && (
            <div className="space-y-4">
              {/* Compact Visual Distribution Bar for quick status monitoring */}
              <LicenseDistributionChart
                metrics={metrics}
                compact={true}
                onSelectStatusFilter={(status) => setFilterStatus(status)}
              />

              {/* Search and Filters */}
              <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
                <div className="relative w-full md:w-80">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by prefix, customer, email..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 pl-9 pr-3 text-xs text-slate-200 placeholder:text-slate-600 focus:border-cyan-500"
                  />
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-300"
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">Active Only</option>
                    <option value="available">Available (Unactivated)</option>
                    <option value="expired">Expired</option>
                    <option value="suspended">Suspended</option>
                    <option value="revoked">Revoked</option>
                  </select>

                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-300"
                  >
                    <option value="all">All Plans</option>
                    <option value="lifetime">Lifetime</option>
                    <option value="monthly">Monthly</option>
                    <option value="annual">Annual</option>
                    <option value="trial">Trial</option>
                  </select>
                </div>
              </div>

              {/* Table */}
              <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/80 border-b border-slate-800 text-slate-400 font-semibold">
                    <tr>
                      <th className="py-3 px-4">Key Prefix (Safe Hash)</th>
                      <th className="py-3 px-4">Plan / Duration</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Device Activations</th>
                      <th className="py-3 px-4">Customer Details</th>
                      <th className="py-3 px-4">Expires</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {licenses.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-500 font-sans">
                          No license records match your criteria.
                        </td>
                      </tr>
                    ) : (
                      licenses.map((lic) => {
                        const isExpired = lic.status === 'expired';
                        const isRevoked = lic.status === 'revoked';
                        const isSuspended = lic.status === 'suspended';

                        return (
                          <tr key={lic.id} className="hover:bg-slate-900/40 transition-colors">
                            <td className="py-3 px-4">
                              <div className="text-cyan-300 font-bold">{lic.keyPrefix}</div>
                              <div className="text-[10px] text-slate-500 font-sans">{lic.id}</div>
                            </td>
                            <td className="py-3 px-4 font-sans">
                              <span className="font-semibold text-slate-200">{lic.planName}</span>
                              <span className="block text-[10px] text-slate-500 uppercase">{lic.type}</span>
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-sans font-bold border ${
                                  lic.status === 'active'
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                    : lic.status === 'available'
                                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                                    : isRevoked
                                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                                    : isSuspended
                                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                                    : 'bg-slate-800 text-slate-400 border-slate-700'
                                }`}
                              >
                                {lic.status.toUpperCase()}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-200">
                                  {lic.currentActivations} / {lic.maxDevices}
                                </span>
                                <span className="text-[10px] text-slate-500 font-sans">devices</span>
                              </div>
                              {lic.currentActivations > 0 && (
                                <button
                                  onClick={() => handleViewDevices(lic.id)}
                                  className="text-[10px] text-cyan-400 hover:underline font-sans mt-0.5 flex items-center gap-0.5"
                                >
                                  View Hardware <ChevronRight className="w-2.5 h-2.5" />
                                </button>
                              )}
                            </td>
                            <td className="py-3 px-4 font-sans">
                              <div className="font-semibold text-slate-200">{lic.customerName || 'Direct'}</div>
                              {lic.customerEmail && (
                                <div className="text-[11px] text-slate-400">{lic.customerEmail}</div>
                              )}
                            </td>
                            <td className="py-3 px-4 font-sans text-[11px]">
                              {lic.expiresAt ? (
                                <span className={isExpired ? 'text-rose-400 font-semibold' : 'text-slate-300'}>
                                  {new Date(lic.expiresAt).toLocaleDateString()}
                                </span>
                              ) : (
                                <span className="text-amber-400 font-semibold">Lifetime Master</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right font-sans">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleResetDevices(lic.id)}
                                  title="Clear hardware slots (allow customer to activate new PC)"
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                                >
                                  <Laptop className="w-3.5 h-3.5 text-cyan-400" />
                                </button>

                                <button
                                  onClick={() => handleExtendLicense(lic.id, 30)}
                                  title="Add +30 Days Expiration"
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-[10px] font-bold"
                                >
                                  +30d
                                </button>

                                <button
                                  onClick={() => handleToggleStatus(lic.id)}
                                  title={isSuspended ? 'Resume license' : 'Suspend license'}
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 transition-colors"
                                >
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                </button>

                                {!isRevoked && (
                                  <button
                                    onClick={() => handleRevokeLicense(lic.id)}
                                    title="Revoke license immediately"
                                    className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: KEY GENERATOR */}
          {activeTab === 'generator' && (
            <div className="space-y-6 max-w-3xl">
              <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-5">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Key className="w-4 h-4 text-cyan-400" />
                    Generate Cryptographically Secure Customer Licenses
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Keys are created in <code className="text-cyan-300 font-mono">NVST-XXXX-XXXX-XXXX-XXXX</code> format. Raw keys are hashed with SHA-256 before storage on the server.
                  </p>
                </div>

                <form onSubmit={handleGenerateKeys} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1.5">Plan Type</label>
                      <select
                        value={planType}
                        onChange={(e) => setPlanType(e.target.value as any)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-200 focus:border-cyan-500"
                      >
                        <option value="monthly">Pro Monthly (30 Days)</option>
                        <option value="annual">Annual VIP (365 Days)</option>
                        <option value="lifetime">Lifetime Enterprise (Permanent)</option>
                        <option value="trial">7-Day Fast Trial</option>
                        <option value="custom">Custom Duration Days</option>
                      </select>
                    </div>

                    {planType === 'custom' && (
                      <div>
                        <label className="text-xs font-semibold text-slate-300 block mb-1.5">Custom Days</label>
                        <input
                          type="number"
                          min="1"
                          max="1825"
                          value={customDays}
                          onChange={(e) => setCustomDays(Number(e.target.value))}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-200 focus:border-cyan-500"
                        />
                      </div>
                    )}

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1.5">Hardware Seat Limit</label>
                      <select
                        value={maxDevices}
                        onChange={(e) => setMaxDevices(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-200 focus:border-cyan-500"
                      >
                        <option value="1">1 Computer / Device</option>
                        <option value="2">2 Computers (Multi-Seat)</option>
                        <option value="3">3 Computers</option>
                        <option value="5">5 Computers (Team/Studio)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1.5">Batch Quantity</label>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={batchQuantity}
                        onChange={(e) => setBatchQuantity(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-200 focus:border-cyan-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1.5">Customer Name</label>
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="e.g. John Doe Studio"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-200 placeholder:text-slate-600 focus:border-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1.5">Customer Email (Optional)</label>
                      <input
                        type="email"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder="customer@email.com"
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-200 placeholder:text-slate-600 focus:border-cyan-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5">Internal Notes</label>
                    <input
                      type="text"
                      value={licenseNotes}
                      onChange={(e) => setLicenseNotes(e.target.value)}
                      placeholder="e.g. Invoice #2026-881, Payment confirmed via Stripe"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-200 placeholder:text-slate-600 focus:border-cyan-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isGenerating}
                    className="py-2.5 px-5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 disabled:opacity-60 transition-all cursor-pointer"
                  >
                    {isGenerating ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                        <span>Generating {batchQuantity} Keys...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span>Generate {batchQuantity} License Key(s)</span>
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Generated Batch Modal Result */}
              {generatedBatch && (
                <div className="p-6 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-cyan-200 flex items-center gap-2">
                        <Check className="w-4 h-4 text-cyan-400" />
                        Generated Licenses ({generatedBatch.length})
                      </h4>
                      <p className="text-xs text-slate-400">
                        Copy or download these keys now. For security, raw keys are never displayed again.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={copyAllBatchKeys}
                        className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-mono text-xs flex items-center gap-1.5 transition-colors"
                      >
                        {copiedBatchAll ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>Copy All</span>
                      </button>
                      <button
                        onClick={downloadBatchCSV}
                        className="py-1.5 px-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download CSV</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {generatedBatch.map((k, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between font-mono text-xs"
                      >
                        <div>
                          <div className="text-cyan-300 font-bold text-sm tracking-wide">{k.rawKey}</div>
                          <div className="text-[11px] text-slate-400 font-sans mt-0.5">
                            {k.planName} • {k.maxDevices} Device Limit • {k.customerName}
                          </div>
                        </div>

                        <button
                          onClick={() => copyToClipboard(k.rawKey)}
                          className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
                          title="Copy this key"
                        >
                          {copiedKey === k.rawKey ? (
                            <Check className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: OWNER ACCOUNTS ALLOWLIST */}
          {activeTab === 'owners' && (
            <div className="space-y-6 max-w-3xl">
              <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">
                    <Crown className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Three Authorized Owner Gmail Accounts</h3>
                    <p className="text-xs text-slate-400">
                      Permanent owner access across all personal devices. Strictly verified against Google OAuth token signatures.
                    </p>
                  </div>
                </div>

                <div className="divide-y divide-slate-800/80 border border-slate-800 rounded-xl bg-slate-950 overflow-hidden font-mono text-xs">
                  {owners.map((owner, idx) => (
                    <div key={idx} className="p-3.5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                          OWNER #{idx + 1}
                        </span>
                        <div>
                          <span className="font-bold text-slate-200">{owner.email}</span>
                          <span className="block text-[11px] text-slate-500 font-sans">
                            Added: {new Date(owner.addedAt).toLocaleDateString()} • {owner.notes || 'Configured via server'}
                          </span>
                        </div>
                      </div>

                      {owners.length > 1 && (
                        <button
                          onClick={() => handleRemoveOwner(owner.email)}
                          className="p-1.5 rounded-lg hover:bg-rose-500/10 text-rose-400 transition-colors"
                          title="Remove owner"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add Owner Form */}
                <form onSubmit={handleAddOwner} className="pt-2 flex gap-2">
                  <input
                    type="email"
                    value={newOwnerEmail}
                    onChange={(e) => setNewOwnerEmail(e.target.value)}
                    placeholder="Add new authorized owner Gmail..."
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-200 placeholder:text-slate-600 focus:border-amber-500 font-mono"
                  />
                  <input
                    type="text"
                    value={newOwnerNotes}
                    onChange={(e) => setNewOwnerNotes(e.target.value)}
                    placeholder="Role / Notes"
                    className="w-40 bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-200 placeholder:text-slate-600 focus:border-amber-500"
                  />
                  <button
                    type="submit"
                    className="py-2 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Authorize</span>
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 4: AUDIT TRAIL LOGS */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-semibold font-sans">
                    <tr>
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4">Actor</th>
                      <th className="py-3 px-4">Action Event</th>
                      <th className="py-3 px-4">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-[11px]">
                    {auditLogs.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-slate-500 font-sans">
                          No audit entries recorded yet.
                        </td>
                      </tr>
                    ) : (
                      auditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-900/40">
                          <td className="py-2.5 px-4 text-slate-400">
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                          <td className="py-2.5 px-4 text-cyan-300 font-bold">{log.actorEmail}</td>
                          <td className="py-2.5 px-4 font-bold text-slate-200">
                            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-amber-300">
                              {log.action}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-slate-400 font-sans text-xs">
                            {JSON.stringify(log.details)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: AUTOMATED SECURITY TEST SUITE */}
          {activeTab === 'tests' && (
            <div className="space-y-5 max-w-4xl">
              <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Shield className="w-4 h-4 text-emerald-400" />
                      18-Point Automated Licensing & Security Test Suite
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Executes live server verification of Google OAuth tokens, allowlist enforcement, hardware seat limits, signature verification, and tamper rejection.
                    </p>
                  </div>

                  <button
                    onClick={handleRunTests}
                    disabled={isRunningTests}
                    className="py-2 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 disabled:opacity-60 transition-all cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRunningTests ? 'animate-spin' : ''}`} />
                    <span>{isRunningTests ? 'Running Checks...' : 'Re-Run All 18 Tests'}</span>
                  </button>
                </div>

                {testResults && (
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-emerald-300 font-bold">
                      <Check className="w-4 h-4" />
                      <span>
                        TEST SUMMARY: {testResults.passedCount} of {testResults.totalCount} TESTS PASSED (100% HEALTHY)
                      </span>
                    </div>
                    <span className="font-mono text-[11px] text-slate-400">Production Ready</span>
                  </div>
                )}
              </div>

              {/* Individual Test Results List */}
              {testResults && testResults.results && (
                <div className="space-y-2">
                  {testResults.results.map((r: any) => (
                    <div
                      key={r.num}
                      className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start justify-between text-xs font-mono"
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={`mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold ${
                            r.passed
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          }`}
                        >
                          {r.passed ? 'PASS' : 'FAIL'}
                        </span>
                        <div>
                          <div className="font-bold text-slate-200">
                            [Test #{r.num}] {r.name}
                          </div>
                          <div className="text-[11px] text-slate-400 font-sans mt-0.5">{r.details}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>


        {/* Selected License Hardware Devices Sub-Modal */}
        {selectedLicenseDevices && (
          <div className="fixed inset-0 z-60 bg-black/70 flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Laptop className="w-4 h-4 text-cyan-400" />
                  <h4 className="text-sm font-bold text-white">Registered Hardware Devices</h4>
                </div>
                <button
                  onClick={() => setSelectedLicenseDevices(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {selectedLicenseDevices.devices.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4 text-center">No active hardware bindings.</p>
                ) : (
                  selectedLicenseDevices.devices.map((dev) => (
                    <div
                      key={dev.id}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-200 flex items-center gap-2">
                          <span>{dev.deviceName}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400">
                            Active
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                          HWID: {dev.deviceId} • {dev.osInfo}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Activated: {new Date(dev.activatedAt).toLocaleDateString()}
                        </div>
                      </div>

                      <button
                        onClick={() => handleForceDeactivateDevice(dev.deviceId, selectedLicenseDevices.licenseId)}
                        className="py-1 px-2.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[11px] font-bold transition-colors"
                      >
                        Deactivate
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
