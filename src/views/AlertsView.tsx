import React, { useState } from 'react';
import { useAquavista } from '../context/AquavistaContext';
import { AlertItem } from '../types/aquavista';
import {
  BellRing,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  Info,
  Clock,
  Trash2,
  CheckCheck,
  Flame,
  Wind,
  Droplets,
  Sun,
  ShieldAlert,
  ArrowDownCircle,
  ArrowUpCircle,
  Tag,
} from 'lucide-react';

export const AlertsView: React.FC = () => {
  const { alerts, markAlertRead, clearAlerts, activityLog } = useAquavista();
  const [filter, setFilter] = useState<'ALL' | 'CRITICAL' | 'WARNING' | 'INFO'>('ALL');

  const filteredAlerts = alerts.filter(a => {
    if (filter === 'ALL') return true;
    return a.type === filter;
  });

  const getAlertIcon = (type: AlertItem['type']) => {
    switch (type) {
      case 'CRITICAL':
        return <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0" />;
      case 'WARNING':
        return <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />;
      case 'SUCCESS':
        return <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />;
      case 'INFO':
      default:
        return <Info className="w-5 h-5 text-cyan-400 shrink-0" />;
    }
  };

  const getActivityIcon = (icon: string) => {
    switch (icon) {
      case 'Flame': return <Flame className="w-4 h-4 text-rose-400" />;
      case 'Wind': return <Wind className="w-4 h-4 text-cyan-400" />;
      case 'Lightbulb': return <Sun className="w-4 h-4 text-sky-400" />;
      case 'Droplets': return <Droplets className="w-4 h-4 text-emerald-400" />;
      case 'ArrowDownCircle': return <ArrowDownCircle className="w-4 h-4 text-amber-400" />;
      case 'ArrowUpCircle': return <ArrowUpCircle className="w-4 h-4 text-emerald-400" />;
      default: return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <BellRing className="w-5 h-5 text-cyan-400" />
            Alerts & System Activity Ledger
          </h2>
          <p className="text-xs text-slate-400 font-medium">
            Real-time incident audit log and chronological device activation trace
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={clearAlerts}
            className="px-3 py-1.5 rounded-xl text-xs font-mono font-medium text-slate-400 hover:text-white hover:bg-ocean-800 border border-ocean-700 transition-colors flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear All Alerts
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Alert Notifications Feed */}
        <div className="glass-panel rounded-2xl p-5 border border-ocean-700/60 space-y-4">
          <div className="flex items-center justify-between border-b border-ocean-700/50 pb-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              System Incident Feed
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-ocean-800 text-slate-300">
                {alerts.length}
              </span>
            </h3>

            {/* Filter Pills */}
            <div className="flex gap-1 bg-ocean-900/80 p-1 rounded-xl border border-ocean-800 text-[11px] font-mono">
              {(['ALL', 'CRITICAL', 'WARNING', 'INFO'] as const).map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className={`px-2 py-1 rounded-lg transition-colors ${
                    filter === cat ? 'bg-cyan-500 text-ocean-950 font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {filteredAlerts.length === 0 ? (
            <div className="py-12 text-center text-slate-500 font-mono text-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-500/40 mx-auto mb-2" />
              No active alerts in this category. System healthy.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
              {filteredAlerts.map(alert => (
                <div
                  key={alert.id}
                  onClick={() => markAlertRead(alert.id)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    alert.read
                      ? 'bg-ocean-900/40 border-ocean-800/80 opacity-75'
                      : alert.type === 'CRITICAL'
                      ? 'bg-rose-500/10 border-rose-500/40 shadow-coral-glow'
                      : alert.type === 'WARNING'
                      ? 'bg-amber-500/10 border-amber-500/40'
                      : 'bg-ocean-850 border-cyan-500/20'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {getAlertIcon(alert.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h4 className="text-xs font-bold text-white truncate">{alert.title}</h4>
                        <span className="text-[10px] font-mono text-slate-400 shrink-0">
                          {alert.timestamp}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed mb-2">
                        {alert.message}
                      </p>
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                        <span className="capitalize">Source: {alert.source}</span>
                        {!alert.read && (
                          <span className="text-cyan-400 font-semibold">● New</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 2. Chronological Device Activity Timeline */}
        <div className="glass-panel rounded-2xl p-5 border border-ocean-700/60 space-y-4">
          <div className="flex items-center justify-between border-b border-ocean-700/50 pb-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                Chronological Device Activation Trace
              </h3>
              <p className="text-xs text-slate-400 font-mono">Real-time actuator state transition history</p>
            </div>
          </div>

          <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
            {activityLog.map((act, idx) => (
              <div
                key={act.id}
                className="relative pl-6 pb-2.5 border-l border-ocean-700 last:border-transparent"
              >
                {/* Timeline Dot */}
                <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-ocean-900 border-2 border-cyan-400 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                </div>

                <div className="p-3 rounded-xl bg-ocean-900/70 border border-ocean-800/80 hover:border-ocean-700 transition-colors">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      {getActivityIcon(act.icon)}
                      <span className="text-xs font-bold text-white">{act.device}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">{act.timestamp}</span>
                  </div>

                  <p className="text-xs text-slate-300 font-mono mb-2">{act.event}</p>

                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-slate-500">Duration: {act.duration}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase ${
                        act.triggerType === 'Manual'
                          ? 'bg-purple-500/20 text-purple-300'
                          : act.triggerType === 'Scheduled'
                          ? 'bg-sky-500/20 text-sky-300'
                          : 'bg-emerald-500/20 text-emerald-300'
                      }`}
                    >
                      {act.triggerType}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
