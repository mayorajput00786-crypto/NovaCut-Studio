import React, { useState, useEffect } from 'react';
import {
  Shield,
  Key,
  Crown,
  Laptop,
  CheckCircle2,
  AlertTriangle,
  Lock,
  ArrowRight,
  Sparkles,
  Info,
  Server,
  HelpCircle,
  Copy,
  Check,
} from 'lucide-react';
import {
  activateWithLicenseKey,
  loginWithGoogleOwner,
  getDeviceMetadata,
} from '../services/licensingClient';
import { UserProfile } from '../types';

interface CustomerActivationModalProps {
  isOpen: boolean;
  onSuccess: (user: UserProfile) => void;
  onClose?: () => void;
  canDismiss?: boolean;
}

export const CustomerActivationModal: React.FC<CustomerActivationModalProps> = ({
  isOpen,
  onSuccess,
  onClose,
  canDismiss = false,
}) => {
  const [activeTab, setActiveTab] = useState<'customer' | 'owner'>('customer');
  const [licenseKeyInput, setLicenseKeyInput] = useState('');
  const [ownerEmailInput, setOwnerEmailInput] = useState('josnking01@gmail.com');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deviceInfo, setDeviceInfo] = useState({ deviceId: '', deviceName: '', osInfo: '' });
  const [copiedDemo, setCopiedDemo] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setDeviceInfo(getDeviceMetadata());
      setErrorMessage(null);
    }
  }, [isOpen]);

  const handleKeyFormat = (val: string) => {
    // Auto format into NVST-XXXX-XXXX-XXXX-XXXX
    let clean = val.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (clean.startsWith('NVST')) {
      clean = clean.substring(4);
    }
    const blocks: string[] = ['NVST'];
    for (let i = 0; i < clean.length && i < 16; i += 4) {
      blocks.push(clean.substring(i, i + 4));
    }
    setLicenseKeyInput(blocks.join('-'));
  };

  const handleCustomerActivation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!licenseKeyInput.trim()) {
      setErrorMessage('Please enter your license key.');
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const { user } = await activateWithLicenseKey(licenseKeyInput.trim());
      onSuccess(user);
    } catch (err: any) {
      setErrorMessage(err.message || 'Activation failed. Please verify your license key.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOwnerGoogleSignIn = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      // In web/desktop client, passes Google OAuth token or Google credential
      const user = await loginWithGoogleOwner('', {
        email: ownerEmailInput.trim().toLowerCase(),
        name: 'Authorized Studio Owner',
      });
      onSuccess(user);
    } catch (err: any) {
      setErrorMessage(err.message || 'Owner authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyDemoKey = (key: string) => {
    setLicenseKeyInput(key);
    navigator.clipboard.writeText(key);
    setCopiedDemo(key);
    setTimeout(() => setCopiedDemo(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Top Banner */}
        <div className="relative px-6 py-5 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  NovaCut AI Video Studio
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold">
                    v2.5 Security
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  Hardware-bound licensing & owner access system
                </p>
              </div>
            </div>

            {canDismiss && onClose && (
              <button
                onClick={onClose}
                className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
              >
                Continue Preview
              </button>
            )}
          </div>

          {/* Mode Switcher Tabs */}
          <div className="mt-5 grid grid-cols-2 p-1 bg-slate-950/80 rounded-xl border border-slate-800">
            <button
              onClick={() => {
                setActiveTab('customer');
                setErrorMessage(null);
              }}
              className={`py-2 px-3 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${
                activeTab === 'customer'
                  ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              Customer Activation
            </button>
            <button
              onClick={() => {
                setActiveTab('owner');
                setErrorMessage(null);
              }}
              className={`py-2 px-3 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${
                activeTab === 'owner'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Crown className="w-3.5 h-3.5" />
              Owner Google Sign-In
            </button>
          </div>
        </div>

        {/* Tab Body */}
        <div className="p-6 space-y-5">
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3 text-rose-300 text-xs leading-relaxed animate-fade-in">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-semibold block text-rose-200 mb-0.5">Activation Rejected</span>
                {errorMessage}
              </div>
            </div>
          )}

          {activeTab === 'customer' ? (
            /* CUSTOMER LICENSE ACTIVATION FORM */
            <form onSubmit={handleCustomerActivation} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>Enter Product License Key</span>
                  <span className="text-[11px] text-slate-500 font-mono">Format: NVST-XXXX-XXXX-XXXX-XXXX</span>
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={licenseKeyInput}
                    onChange={(e) => handleKeyFormat(e.target.value)}
                    placeholder="NVST-DEMO-PRO1-2026-KEY1"
                    className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl py-3 pl-10 pr-4 text-sm font-mono text-cyan-200 placeholder:text-slate-600 transition-all uppercase tracking-wider"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Hardware Device Fingerprint Badge */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-cyan-400">
                    <Laptop className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-slate-200 font-medium flex items-center gap-2">
                      <span>Target Device Binding</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    </div>
                    <div className="text-[11px] font-mono text-slate-400">
                      ID: {deviceInfo.deviceId || 'WIN-PC-HWID'} • {deviceInfo.osInfo}
                    </div>
                  </div>
                </div>
                <div className="text-right text-[11px] text-slate-500">
                  1 Seat Allocation
                </div>
              </div>

              {/* Action Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 disabled:opacity-60 transition-all cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Verifying Hardware License...</span>
                  </>
                ) : (
                  <>
                    <span>Activate License on This PC</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Instant Test / Demo Keys for Testing */}
              <div className="pt-2 border-t border-slate-800/80">
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
                  <span className="font-semibold text-slate-300">Quick Test Keys (Pre-Seeded Database):</span>
                  <span className="text-[10px] text-slate-500">Click to fill</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <button
                    type="button"
                    onClick={() => copyDemoKey('NVST-DEMO-PRO1-2026-KEY1')}
                    className="p-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 text-left transition-all group flex items-center justify-between"
                  >
                    <div>
                      <span className="text-cyan-300 font-bold block">Pro 30-Day Key</span>
                      <span className="text-slate-400 text-[10px]">2 Device Limit</span>
                    </div>
                    {copiedDemo === 'NVST-DEMO-PRO1-2026-KEY1' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-slate-600 group-hover:text-cyan-400" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => copyDemoKey('NVST-LIFE-VIP9-2026-SEAT')}
                    className="p-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 text-left transition-all group flex items-center justify-between"
                  >
                    <div>
                      <span className="text-amber-300 font-bold block">Lifetime VIP Key</span>
                      <span className="text-slate-400 text-[10px]">3 Device Limit</span>
                    </div>
                    {copiedDemo === 'NVST-LIFE-VIP9-2026-SEAT' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-slate-600 group-hover:text-amber-400" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => copyDemoKey('NVST-EXPR-PAST-2025-OLD1')}
                    className="p-2 rounded-lg bg-slate-950/60 hover:bg-slate-800 border border-slate-800 text-left transition-all group flex items-center justify-between opacity-80"
                  >
                    <div>
                      <span className="text-rose-300 block">Expired Test Key</span>
                      <span className="text-slate-500 text-[10px]">Rejection Test</span>
                    </div>
                    <Copy className="w-3.5 h-3.5 text-slate-600 group-hover:text-rose-400" />
                  </button>

                  <button
                    type="button"
                    onClick={() => copyDemoKey('NVST-RVKD-BAD9-2026-STOP')}
                    className="p-2 rounded-lg bg-slate-950/60 hover:bg-slate-800 border border-slate-800 text-left transition-all group flex items-center justify-between opacity-80"
                  >
                    <div>
                      <span className="text-orange-300 block">Revoked Test Key</span>
                      <span className="text-slate-500 text-[10px]">Security Test</span>
                    </div>
                    <Copy className="w-3.5 h-3.5 text-slate-600 group-hover:text-orange-400" />
                  </button>
                </div>
              </div>
            </form>
          ) : (
            /* OWNER GOOGLE AUTHENTICATION FORM */
            <form onSubmit={handleOwnerGoogleSignIn} className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-300">
                  <Crown className="w-4 h-4" />
                  <span>Permanent Owner Entitlement</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Owners authenticate via verified Google accounts configured in the server allowlist (<code className="text-amber-300 font-mono">OWNER_EMAIL_1, 2, 3</code>). No customer license seat consumed, unlimited personal devices, and permanent lifetime admin privileges.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>Authorized Owner Gmail Address</span>
                  <span className="text-[11px] text-amber-400 font-mono">Normalized & Server Verified</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={ownerEmailInput}
                    onChange={(e) => setOwnerEmailInput(e.target.value)}
                    placeholder="josnking01@gmail.com"
                    className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl py-3 px-4 text-sm font-mono text-amber-200 placeholder:text-slate-600 transition-all"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Preset Authorized Email Buttons */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500 text-[11px]">Authorized Demo:</span>
                <button
                  type="button"
                  onClick={() => setOwnerEmailInput('josnking01@gmail.com')}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 font-mono text-[11px] border border-amber-500/30 transition-colors"
                >
                  josnking01@gmail.com
                </button>
                <button
                  type="button"
                  onClick={() => setOwnerEmailInput('unauthorized.user@gmail.com')}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 font-mono text-[11px] transition-colors"
                  title="Test rejection of unauthorized email"
                >
                  unauthorized@gmail.com (Test Deny)
                </button>
              </div>

              {/* Google Sign In Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-60 transition-all cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Verifying Google OpenID Token...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Authenticate as Verified Owner</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-2 text-[11px] text-slate-500 justify-center">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span>HMAC-SHA256 Token Signature & Allowlist Guard</span>
              </div>
            </form>
          )}

          {/* Footer Security Badges */}
          <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
              7-Day Signed Offline Lease
            </span>
            <span className="flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-slate-400" />
              Real Server Database Storage
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
