import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertOctagon,
  PauseCircle,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  PackageCheck,
  Laptop,
} from 'lucide-react';

export interface LicenseStatusMetric {
  key: 'active' | 'available' | 'expired' | 'revoked' | 'suspended';
  label: string;
  count: number;
  percentage: number;
  color: string;
  bgColor: string;
  borderColor: string;
  hoverColor: string;
  description: string;
  badgeClass: string;
}

interface LicenseDistributionChartProps {
  metrics: {
    totalLicenses: number;
    activeLicenses: number;
    availableLicenses: number;
    expiredLicenses: number;
    suspendedLicenses: number;
    revokedLicenses: number;
    totalCustomers?: number;
    activeDevices?: number;
    totalOwners?: number;
  } | null;
  licenses?: any[];
  onSelectStatusFilter?: (status: string) => void;
  compact?: boolean;
}

export const LicenseDistributionChart: React.FC<LicenseDistributionChartProps> = ({
  metrics,
  licenses = [],
  onSelectStatusFilter,
  compact = false,
}) => {
  const [activeView, setActiveView] = useState<'status' | 'plans'>('status');
  const [hoveredStatus, setHoveredStatus] = useState<string | null>(null);

  if (!metrics) {
    return (
      <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 text-center text-slate-500 font-sans text-xs">
        Loading license metrics distribution...
      </div>
    );
  }

  const total = metrics.totalLicenses || 0;

  // Status distributions
  const statusData: LicenseStatusMetric[] = [
    {
      key: 'active',
      label: 'Active Deployments',
      count: metrics.activeLicenses,
      percentage: total > 0 ? (metrics.activeLicenses / total) * 100 : 0,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500',
      borderColor: 'border-emerald-500/40',
      hoverColor: 'group-hover:bg-emerald-400',
      description: 'Customer devices currently authenticated and operating in production.',
      badgeClass: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
    },
    {
      key: 'available',
      label: 'Available Stock',
      count: metrics.availableLicenses,
      percentage: total > 0 ? (metrics.availableLicenses / total) * 100 : 0,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500',
      borderColor: 'border-cyan-500/40',
      hoverColor: 'group-hover:bg-cyan-400',
      description: 'Generated unactivated keys stored in inventory ready for assignment.',
      badgeClass: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
    },
    {
      key: 'expired',
      label: 'Expired Terms',
      count: metrics.expiredLicenses,
      percentage: total > 0 ? (metrics.expiredLicenses / total) * 100 : 0,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500',
      borderColor: 'border-amber-500/40',
      hoverColor: 'group-hover:bg-amber-400',
      description: 'Subscriptions past expiration timestamp requiring customer renewal.',
      badgeClass: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    },
    {
      key: 'revoked',
      label: 'Revoked Keys',
      count: metrics.revokedLicenses,
      percentage: total > 0 ? (metrics.revokedLicenses / total) * 100 : 0,
      color: 'text-rose-400',
      bgColor: 'bg-rose-500',
      borderColor: 'border-rose-500/40',
      hoverColor: 'group-hover:bg-rose-400',
      description: 'Permanently decommissioned keys with hardware bindings removed.',
      badgeClass: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
    },
    {
      key: 'suspended',
      label: 'Suspended (Paused)',
      count: metrics.suspendedLicenses,
      percentage: total > 0 ? (metrics.suspendedLicenses / total) * 100 : 0,
      color: 'text-violet-400',
      bgColor: 'bg-violet-500',
      borderColor: 'border-violet-500/40',
      hoverColor: 'group-hover:bg-violet-400',
      description: 'Admin-paused keys temporarily prevented from launching features.',
      badgeClass: 'bg-violet-500/10 text-violet-300 border-violet-500/30',
    },
  ];

  // Plan type distributions
  const planCounts: Record<string, number> = {
    monthly: 0,
    annual: 0,
    lifetime: 0,
    trial: 0,
    custom: 0,
  };

  licenses.forEach((l) => {
    const t = l.type || 'monthly';
    if (planCounts[t] !== undefined) {
      planCounts[t]++;
    } else {
      planCounts.custom = (planCounts.custom || 0) + 1;
    }
  });

  const planData = [
    {
      key: 'lifetime',
      label: 'Lifetime VIP',
      count: planCounts.lifetime,
      percentage: total > 0 ? (planCounts.lifetime / total) * 100 : 0,
      color: 'text-amber-400',
      bgColor: 'bg-amber-400',
      description: 'Permanent unrestricted access licenses',
    },
    {
      key: 'monthly',
      label: 'Pro Monthly',
      count: planCounts.monthly,
      percentage: total > 0 ? (planCounts.monthly / total) * 100 : 0,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-400',
      description: '30-day recurring creator licenses',
    },
    {
      key: 'annual',
      label: 'Enterprise Annual',
      count: planCounts.annual,
      percentage: total > 0 ? (planCounts.annual / total) * 100 : 0,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-400',
      description: '365-day studio deployment licenses',
    },
    {
      key: 'trial',
      label: 'Trial & Custom',
      count: planCounts.trial + (planCounts.custom || 0),
      percentage: total > 0 ? ((planCounts.trial + (planCounts.custom || 0)) / total) * 100 : 0,
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-400',
      description: 'Evaluation and temporary trial licenses',
    },
  ];

  const maxStatusCount = Math.max(...statusData.map((s) => s.count), 1);
  const maxPlanCount = Math.max(...planData.map((p) => p.count), 1);

  // Operational metrics
  const activeAndAvailable = metrics.activeLicenses + metrics.availableLicenses;
  const portfolioHealthRate = total > 0 ? Math.round((activeAndAvailable / total) * 100) : 100;
  const utilizationRate =
    metrics.activeLicenses + metrics.availableLicenses > 0
      ? Math.round(
          (metrics.activeLicenses / (metrics.activeLicenses + metrics.availableLicenses)) * 100
        )
      : 0;

  const handleBarClick = (key: string) => {
    if (onSelectStatusFilter) {
      onSelectStatusFilter(key);
    }
  };

  // Compact Mode (for embedding in Table Header or Quick Bar)
  if (compact) {
    return (
      <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
        <div className="flex items-center justify-between text-xs mb-2">
          <div className="flex items-center gap-1.5 font-medium text-slate-300">
            <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
            <span>License Distribution</span>
          </div>
          <span className="text-[11px] font-mono text-slate-400 tabular-nums">
            {metrics.totalLicenses} Total Keys · {portfolioHealthRate}% Health Ratio
          </span>
        </div>

        {/* Stacked Proportional Bar */}
        <div className="w-full h-3 rounded-full bg-slate-900 border border-slate-800 overflow-hidden flex">
          {statusData.map((s) => {
            if (s.percentage === 0) return null;
            return (
              <div
                key={s.key}
                title={`${s.label}: ${s.count} (${s.percentage.toFixed(1)}%)`}
                onClick={() => handleBarClick(s.key)}
                style={{ width: `${s.percentage}%` }}
                className={`h-full ${s.bgColor} cursor-pointer hover:opacity-90 transition-opacity`}
              />
            );
          })}
        </div>

        {/* Mini Legend */}
        <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-2 text-[11px]">
          {statusData.map((s) => (
            <button
              key={s.key}
              onClick={() => handleBarClick(s.key)}
              className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors group"
            >
              <span className={`w-2 h-2 rounded-full ${s.bgColor}`} />
              <span className="font-sans">{s.label.split(' ')[0]}:</span>
              <span className="font-mono tabular-nums text-slate-200 group-hover:text-cyan-300">
                {s.count}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Full Expanded Visual Dashboard Bar Chart
  return (
    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 mb-4 shadow-xl">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              License Status & Inventory Distribution
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                Live Telemetry
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Interactive distribution analysis across active client deployments, stock, and expired licenses.
            </p>
          </div>
        </div>

        {/* Dimension Switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-xl border border-slate-800 self-stretch sm:self-auto">
          <button
            onClick={() => setActiveView('status')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              activeView === 'status'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>By Status</span>
          </button>
          <button
            onClick={() => setActiveView('plans')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              activeView === 'plans'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>By Plan Model</span>
          </button>
        </div>
      </div>

      {/* Main Bar Chart Section */}
      <div className="mt-5 grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left Column: Visual Bar Chart Canvas (8 cols) */}
        <div className="lg:col-span-8 flex flex-col justify-between p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
            <span className="font-semibold text-slate-300">
              {activeView === 'status' ? 'Status Volume Comparison (Absolute vs Proportion)' : 'Plan Type Portfolio Allocation'}
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              Click any bar to filter records
            </span>
          </div>

          {activeView === 'status' ? (
            /* STATUS VERTICAL COMPARATIVE BARS */
            <div className="space-y-4">
              {/* Stacked 100% Proportion Ribbon */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[11px] text-slate-400">
                  <span>Relative Status Composition</span>
                  <span className="font-mono tabular-nums text-slate-300">{total} Total Registered</span>
                </div>
                <div className="w-full h-4 rounded-lg bg-slate-950 border border-slate-800 overflow-hidden flex p-0.5 gap-0.5">
                  {statusData.map((s) => {
                    if (s.count === 0) return null;
                    const widthPercent = total > 0 ? (s.count / total) * 100 : 0;
                    return (
                      <div
                        key={s.key}
                        onClick={() => handleBarClick(s.key)}
                        onMouseEnter={() => setHoveredStatus(s.key)}
                        onMouseLeave={() => setHoveredStatus(null)}
                        style={{ width: `${Math.max(widthPercent, 2)}%` }}
                        className={`h-full ${s.bgColor} rounded-sm cursor-pointer transition-all hover:brightness-125 hover:scale-y-105 relative group`}
                        title={`${s.label}: ${s.count} keys (${widthPercent.toFixed(1)}%)`}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Vertical / Horizontal Column Bars Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
                {statusData.map((s) => {
                  const barHeightPct = maxStatusCount > 0 ? Math.max((s.count / maxStatusCount) * 100, s.count > 0 ? 12 : 4) : 4;
                  const isHovered = hoveredStatus === s.key;

                  return (
                    <div
                      key={s.key}
                      onClick={() => handleBarClick(s.key)}
                      onMouseEnter={() => setHoveredStatus(s.key)}
                      onMouseLeave={() => setHoveredStatus(null)}
                      className={`group cursor-pointer flex flex-col justify-end p-2.5 rounded-xl border transition-all ${
                        isHovered
                          ? 'bg-slate-800/80 border-cyan-500/60 shadow-lg -translate-y-0.5'
                          : 'bg-slate-950/70 border-slate-800/70 hover:bg-slate-900/90 hover:border-slate-700'
                      }`}
                    >
                      {/* Bar Height Container */}
                      <div className="h-32 flex flex-col justify-end items-center relative w-full mb-2">
                        {/* Numerical Value Tag on top */}
                        <div
                          className={`mb-1 px-1.5 py-0.5 rounded text-[10px] font-mono tabular-nums font-bold transition-all ${
                            s.count > 0 ? s.badgeClass : 'text-slate-600 bg-slate-900'
                          }`}
                        >
                          {s.count}
                        </div>

                        {/* Bar Pillar */}
                        <div className="w-full max-w-[48px] h-full flex items-end justify-center rounded-lg bg-slate-950/80 p-1 border border-slate-800/50">
                          <div
                            style={{ height: `${barHeightPct}%` }}
                            className={`w-full rounded-md ${s.bgColor} transition-all duration-300 ${s.hoverColor} group-hover:shadow-[0_0_12px_rgba(56,189,248,0.25)] flex items-center justify-center`}
                          />
                        </div>
                      </div>

                      {/* Label & Percentage */}
                      <div className="text-center pt-1 border-t border-slate-800/60">
                        <div className="text-xs font-semibold text-slate-200 group-hover:text-cyan-300 transition-colors truncate">
                          {s.label.split(' ')[0]}
                        </div>
                        <div className="text-[11px] font-mono tabular-nums text-slate-400 mt-0.5">
                          {s.percentage.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* PLAN TYPE BREAKDOWN BARS */
            <div className="space-y-4 py-2">
              <div className="space-y-3">
                {planData.map((p) => {
                  const widthPercent = maxPlanCount > 0 ? Math.max((p.count / maxPlanCount) * 100, p.count > 0 ? 8 : 2) : 2;

                  return (
                    <div
                      key={p.key}
                      className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/70 hover:border-slate-700 transition-all"
                    >
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${p.bgColor}`} />
                          <span className="font-semibold text-slate-200">{p.label}</span>
                          <span className="text-[11px] text-slate-500 font-sans hidden sm:inline">
                            · {p.description}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 font-mono tabular-nums text-xs">
                          <span className="font-bold text-white">{p.count} keys</span>
                          <span className="text-slate-400">({p.percentage.toFixed(1)}%)</span>
                        </div>
                      </div>

                      {/* Bar Track */}
                      <div className="w-full h-2.5 rounded-full bg-slate-900 border border-slate-800/80 overflow-hidden">
                        <div
                          style={{ width: `${widthPercent}%` }}
                          className={`h-full ${p.bgColor} rounded-full transition-all duration-300`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Strategic Metrics & Status Diagnostics (4 cols) */}
        <div className="lg:col-span-4 flex flex-col justify-between gap-3">
          {/* Health Score Card */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                Portfolio Health Index
              </span>
              <span className="text-xs font-mono font-bold text-emerald-400">
                {portfolioHealthRate}% Healthy
              </span>
            </div>

            <div className="w-full h-2 rounded-full bg-slate-950 border border-slate-800 overflow-hidden mb-3">
              <div
                style={{ width: `${portfolioHealthRate}%` }}
                className={`h-full ${
                  portfolioHealthRate >= 75
                    ? 'bg-emerald-500'
                    : portfolioHealthRate >= 50
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
                } rounded-full`}
              />
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Ratio of usable keys (Active Deployments + Unactivated Inventory) against decommissioned or expired seats.
            </p>
          </div>

          {/* Key Indicators Mini Grid */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <div className="text-[11px] text-slate-400 flex items-center gap-1">
                <Laptop className="w-3 h-3 text-cyan-400" />
                <span>Device Seats</span>
              </div>
              <div className="text-base font-bold text-cyan-300 font-mono mt-1">
                {metrics.activeDevices || 0}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Online machines</div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <div className="text-[11px] text-slate-400 flex items-center gap-1">
                <PackageCheck className="w-3 h-3 text-emerald-400" />
                <span>Stock Surplus</span>
              </div>
              <div className="text-base font-bold text-emerald-300 font-mono mt-1">
                {metrics.availableLicenses}
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">Ready to assign</div>
            </div>
          </div>

          {/* Quick Filter Action Links */}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs">
            <div className="text-[11px] font-semibold text-slate-400 mb-2 flex items-center justify-between">
              <span>Quick Status Filters</span>
              <span className="text-[10px] text-slate-500 font-mono">1-Click Jump</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => handleBarClick('active')}
                className="px-2 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-medium flex items-center gap-1 transition-colors"
              >
                <CheckCircle2 className="w-3 h-3" /> Active ({metrics.activeLicenses})
              </button>
              <button
                onClick={() => handleBarClick('available')}
                className="px-2 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-[11px] font-medium flex items-center gap-1 transition-colors"
              >
                <PackageCheck className="w-3 h-3" /> Available ({metrics.availableLicenses})
              </button>
              <button
                onClick={() => handleBarClick('expired')}
                className="px-2 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[11px] font-medium flex items-center gap-1 transition-colors"
              >
                <Clock className="w-3 h-3" /> Expired ({metrics.expiredLicenses})
              </button>
              <button
                onClick={() => handleBarClick('revoked')}
                className="px-2 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[11px] font-medium flex items-center gap-1 transition-colors"
              >
                <AlertOctagon className="w-3 h-3" /> Revoked ({metrics.revokedLicenses})
              </button>
              {metrics.suspendedLicenses > 0 && (
                <button
                  onClick={() => handleBarClick('suspended')}
                  className="px-2 py-1 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 border border-violet-500/30 text-[11px] font-medium flex items-center gap-1 transition-colors"
                >
                  <PauseCircle className="w-3 h-3" /> Suspended ({metrics.suspendedLicenses})
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
