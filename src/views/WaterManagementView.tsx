import React, { useState } from 'react';
import { useAquavista } from '../context/AquavistaContext';
import {
  Droplets,
  RefreshCw,
  CheckCircle2,
  Layers,
  ArrowDownCircle,
  ArrowUpCircle,
  ShieldCheck,
  Play,
  XCircle,
  Clock,
} from 'lucide-react';

export const WaterManagementView: React.FC = () => {
  const {
    telemetry,
    cleaningState,
    startWaterChange,
    abortWaterChange,
    automation,
    updateAutomation,
    devices,
  } = useAquavista();

  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const isCycleActive =
    cleaningState.status === 'draining' || cleaningState.status === 'refilling';

  const phases = [
    { key: 'draining', label: 'Drain Tank', desc: 'Removing old water via drain pump' },
    { key: 'refilling', label: 'Refill Tank', desc: 'Adding fresh water via fill pump' },
    { key: 'completed', label: 'Complete', desc: 'Water change completed successfully' },
  ];

  const getPhaseIndex = (status: string) => {
    switch (status) {
      case 'draining': return 0;
      case 'refilling': return 1;
      case 'completed': return 2;
      default: return -1;
    }
  };

  const currentPhaseIdx = getPhaseIndex(cleaningState.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Droplets className="w-5 h-5 text-cyan-400" />
            Water Management
          </h2>
          <p className="text-xs text-slate-400 font-medium">
            Monitor water level, TDS quality, and execute automated water changes
          </p>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center gap-2 bg-ocean-900 p-1 rounded-xl border border-ocean-700 self-start sm:self-auto">
          <span className="text-xs font-mono text-slate-400 px-2 font-medium">Water Change Mode:</span>
          <button
            onClick={() =>
              updateAutomation({
                tds: { ...automation.tds, autoWaterChangeEnabled: false },
              })
            }
            className={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition-all ${
              !automation.tds.autoWaterChangeEnabled
                ? 'bg-cyan-500 text-ocean-950 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            MANUAL
          </button>
          <button
            onClick={() =>
              updateAutomation({
                tds: { ...automation.tds, autoWaterChangeEnabled: true },
              })
            }
            className={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition-all ${
              automation.tds.autoWaterChangeEnabled
                ? 'bg-cyan-500 text-ocean-950 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            AUTO
          </button>
        </div>
      </div>

      {/* 4 Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-2xl border border-ocean-700/60">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-1">
            <span>Water Level</span>
            <Droplets className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-white">
            {telemetry.waterLevel.toFixed(1)}%
          </div>
          <p className="text-[11px] text-slate-500 font-mono mt-1">Normal: 70 – 85%</p>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-ocean-700/60">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-1">
            <span>TDS</span>
            <Layers className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-mono font-bold text-white">
            {telemetry.tds} <span className="text-xs text-slate-400 font-normal">ppm</span>
          </div>
          <p className="text-[11px] text-slate-500 font-mono mt-1">Water Quality Indicator</p>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-ocean-700/60">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-1">
            <span>Water Status</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-base font-bold text-emerald-400 mt-1">
            Normal Quality
          </div>
          <p className="text-[11px] text-slate-500 font-mono mt-1">TDS within threshold</p>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-ocean-700/60">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-1">
            <span>Last Water Change</span>
            <Clock className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-sm font-mono font-bold text-white mt-1">
            {cleaningState.lastCompleted}
          </div>
          <p className="text-[11px] text-slate-500 font-mono mt-1">Status: Up to date</p>
        </div>
      </div>

      {/* Water Change Workflow Section */}
      <div className="glass-panel rounded-2xl p-6 border border-ocean-700/60 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-ocean-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <RefreshCw className={`w-4 h-4 text-cyan-400 ${isCycleActive ? 'animate-spin' : ''}`} />
              Water Change Workflow
            </h3>
            <p className="text-xs text-slate-400">
              {isCycleActive ? `Status: ${cleaningState.phase}` : 'Automated drain and refill cycle'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {isCycleActive ? (
              <button
                onClick={abortWaterChange}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 flex items-center gap-1.5"
              >
                <XCircle className="w-4 h-4" /> Stop Cycle
              </button>
            ) : (
              <button
                onClick={() => setShowConfirmModal(true)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold font-mono bg-cyan-500 text-ocean-950 hover:bg-cyan-400 flex items-center gap-2"
              >
                <Play className="w-4 h-4 fill-ocean-950" /> START WATER CHANGE
              </button>
            )}
          </div>
        </div>

        {/* 3-Phase Process Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {phases.map((phase, idx) => {
            const isPassed = currentPhaseIdx > idx || cleaningState.status === 'completed';
            const isCurrent = currentPhaseIdx === idx && isCycleActive;
            return (
              <div
                key={phase.key}
                className={`p-4 rounded-xl border transition-all ${
                  isCurrent
                    ? 'bg-cyan-500/15 border-cyan-400'
                    : isPassed
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : 'bg-ocean-900 border-ocean-800'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold ${
                      isCurrent
                        ? 'bg-cyan-400 text-ocean-950'
                        : isPassed
                        ? 'bg-emerald-400 text-ocean-950'
                        : 'bg-ocean-800 text-slate-500'
                    }`}
                  >
                    {isPassed ? '✓' : idx + 1}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 uppercase">
                    Step {idx + 1}
                  </span>
                </div>
                <h4 className={`text-sm font-bold ${isCurrent ? 'text-cyan-300' : isPassed ? 'text-emerald-300' : 'text-slate-400'}`}>
                  {phase.label}
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  {phase.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* Safety Protocol Note */}
        <div className="p-4 rounded-xl bg-ocean-900 border border-ocean-800 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-300 space-y-1">
            <p className="font-bold text-white">Safety Interlocks Armed:</p>
            <p className="text-slate-400 leading-relaxed">
              • Fill pump and drain pump never run simultaneously.
              <br />
              • Heater is disabled if water level falls below 30%.
              <br />
              • Fill pump cuts off automatically at 85% target level.
            </p>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="max-w-sm w-full rounded-2xl bg-ocean-900 border border-ocean-700 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                <RefreshCw className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">Start water change?</h4>
                <p className="text-xs text-slate-400">Automated drain and refill cycle</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-ocean-950 border border-ocean-800 text-xs font-mono space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Current Water Level:</span>
                <span className="text-white font-bold">{telemetry.waterLevel.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Current TDS:</span>
                <span className="text-amber-400 font-bold">{telemetry.tds} ppm</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  startWaterChange(50, 85);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold font-mono bg-cyan-500 text-ocean-950 hover:bg-cyan-400"
              >
                Start
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
