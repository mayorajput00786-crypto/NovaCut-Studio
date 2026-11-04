import React, { useState } from 'react';
import {
  X,
  Crown,
  Key,
  Mail,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { UserProfile } from '../types';
import { loginWithEmailOrKey, OWNER_EMAIL } from '../services/authService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onLoginSuccess: (user: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLoginSuccess,
}) => {
  const [emailInput, setEmailInput] = useState('');
  const [licenseKeyInput, setLicenseKeyInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const user = await loginWithEmailOrKey(emailInput, licenseKeyInput);
      onLoginSuccess(user);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Please check credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  // Instant 1-Click Master Owner Login
  const handleInstantOwnerLogin = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const user = await loginWithEmailOrKey(OWNER_EMAIL);
      onLoginSuccess(user);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center">
              <Key className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">License & Account Login</h3>
              <p className="text-xs text-slate-400">Unlock Studio 4K Export, Cloud Sync & Admin Hub</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* OWNER SUPERADMIN ONE-CLICK BUTTON */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-500/30 text-xs space-y-3">
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-amber-400 fill-amber-400/20" />
              <span className="font-bold text-white">Master Owner Auto-Login:</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Agar aap <span className="font-mono text-amber-300 font-semibold">{OWNER_EMAIL}</span> hain
              to aapko kisi bhi key ki zaroorat nahi hai. Auto-authentication har device par active hai!
            </p>

            <button
              onClick={handleInstantOwnerLogin}
              disabled={isLoading}
              className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-amber-500/20 active:scale-95"
            >
              <Crown className="w-3.5 h-3.5 fill-current" />
              <span>Login as Owner (josnking01@gmail.com)</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-px bg-slate-800 flex-1" />
            <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Or Customer License</span>
            <div className="h-px bg-slate-800 flex-1" />
          </div>

          {/* Regular Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>Your Email Address</span>
              </label>
              <input
                type="email"
                placeholder="name@company.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-slate-400" />
                <span>Subscription License Key</span>
              </label>
              <input
                type="text"
                placeholder="e.g. NOVA-VIP7-8821-XP99"
                value={licenseKeyInput}
                onChange={(e) => setLicenseKeyInput(e.target.value.toUpperCase())}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-cyan-300 font-mono placeholder-slate-600 focus:outline-none focus:border-cyan-500"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">
                Keys are issued by the owner admin or your team administrator.
              </span>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors shadow-md shadow-cyan-500/20"
            >
              {isLoading ? 'Verifying...' : 'Validate Key & Login'}
            </button>
          </form>

          {/* Current Status */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Current Status:</span>
            <span className="font-semibold text-slate-200">{currentUser.displayName}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
