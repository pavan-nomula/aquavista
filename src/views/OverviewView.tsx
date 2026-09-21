import React, { useState } from 'react';
import { useAquavista } from '../context/AquavistaContext';
import { AquariumVisualization } from '../components/AquariumVisualization';
import { SensorCard } from '../components/SensorCard';
import {
  Thermometer,
  Droplets,
  Layers,
  Sun,
  Flame,
  Wind,
  ArrowUpCircle,
  ArrowDownCircle,
  Zap,
  Clock,
  CheckCircle2,
  ChevronRight,
  RefreshCw,
  Utensils,
} from 'lucide-react';

export const OverviewView: React.FC = () => {
  const {
    telemetry,
    devices,
    toggleDevice,
    setActiveTab,
    cleaningState,
    startWaterChange,
    energy,
    activityLog,
    feeder,
  } = useAquavista();

  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const getTempStatus = () => {
    if (telemetry.temperature < 23 || telemetry.temperature > 29) return 'critical';
    if (telemetry.temperature < 24.5 || telemetry.temperature > 27.5) return 'attention';
    return 'normal';
  };

  const getLevelStatus = () => {
    if (telemetry.waterLevel < 30 || telemetry.waterLevel > 95) return 'critical';
    if (telemetry.waterLevel < 50 || telemetry.waterLevel > 90) return 'attention';
    return 'normal';
  };

  const getTdsStatus = () => {
    if (telemetry.tds > 450) return 'critical';
    if (telemetry.tds > 320) return 'attention';
    return 'normal';
  };

  const formatRuntime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const isCleaningActive = cleaningState.status === 'draining' || cleaningState.status === 'refilling';

  return (
    <div className="space-y-6">
      {/* 1. Aquarium Visualization */}
      <section>
        <AquariumVisualization />
      </section>

      {/* 2. Compact 4 Sensors Row */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Aquarium Vital Sensors</h2>
          <button
            onClick={() => setActiveTab('monitoring')}
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
          >
            Detailed Trends <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <SensorCard
            label="Water Temperature"
            value={telemetry.temperature.toFixed(1)}
            unit="°C"
            status={getTempStatus()}
            normalRange="24.5 – 27.5°C"
            description="Optimal tropical range"
            icon={<Thermometer className="w-5 h-5 text-rose-400" />}
            onClick={() => setActiveTab('monitoring')}
          />

          <SensorCard
            label="Water Level"
            value={telemetry.waterLevel.toFixed(1)}
            unit="%"
            status={getLevelStatus()}
            normalRange="70 – 85%"
            description="Minimum safe cutoff: 30%"
            icon={<Droplets className="w-5 h-5 text-cyan-400" />}
            onClick={() => setActiveTab('water')}
          />

          <SensorCard
            label="TDS"
            value={telemetry.tds}
            unit="ppm"
            status={getTdsStatus()}
            normalRange="150 – 320 ppm"
            description="Water Quality Indicator"
            icon={<Layers className="w-5 h-5 text-amber-400" />}
            onClick={() => setActiveTab('water')}
          />

          <SensorCard
            label="Ambient Light (LDR)"
            value={telemetry.lightLevel}
            unit="lux"
            status="normal"
            normalRange="200 – 600 lux"
            description="Ambient room light"
            icon={<Sun className="w-5 h-5 text-amber-300" />}
            onClick={() => setActiveTab('monitoring')}
          />
        </div>
      </section>

      {/* 3. Device Status Row (5 Actual Actuators) */}
      <section className="glass-panel rounded-2xl p-5 border border-ocean-700/60 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Device Status & Quick Control</h3>
            <p className="text-xs text-slate-400">Click any device to manually toggle state</p>
          </div>
          <button
            onClick={() => setActiveTab('devices')}
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
          >
            All Device Controls <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Heater */}
          <div
            onClick={() => toggleDevice('heater')}
            className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
              devices.heater.isInterlocked
                ? 'bg-rose-950/20 border-rose-600/40 opacity-70'
                : devices.heater.on
                ? 'bg-rose-500/15 border-rose-500/40'
                : 'bg-ocean-900 border-ocean-800 hover:border-ocean-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <Flame className={`w-4 h-4 ${devices.heater.on ? 'text-rose-400' : 'text-slate-500'}`} />
              <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                devices.heater.isInterlocked ? 'bg-rose-500/20 text-rose-400' : devices.heater.on ? 'bg-rose-500/20 text-rose-300' : 'bg-ocean-800 text-slate-400'
              }`}>
                {devices.heater.isInterlocked ? 'LOCKOUT' : devices.heater.on ? 'ON' : 'OFF'}
              </span>
            </div>
            <p className="text-xs font-bold text-white">Heater</p>
            <p className="text-[11px] text-slate-400 font-mono mt-1">Runtime: {formatRuntime(devices.heater.runtimeSeconds)}</p>
          </div>

          {/* Oxygen Pump */}
          <div
            onClick={() => toggleDevice('airPump')}
            className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
              devices.airPump.on
                ? 'bg-cyan-500/15 border-cyan-500/40'
                : 'bg-ocean-900 border-ocean-800 hover:border-ocean-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <Wind className={`w-4 h-4 ${devices.airPump.on ? 'text-cyan-400' : 'text-slate-500'}`} />
              <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                devices.airPump.on ? 'bg-cyan-500/20 text-cyan-300' : 'bg-ocean-800 text-slate-400'
              }`}>
                {devices.airPump.on ? 'ON' : 'OFF'}
              </span>
            </div>
            <p className="text-xs font-bold text-white">Oxygen Pump</p>
            <p className="text-[11px] text-slate-400 font-mono mt-1">Runtime: {formatRuntime(devices.airPump.runtimeSeconds)}</p>
          </div>

          {/* Aquarium Light */}
          <div
            onClick={() => toggleDevice('light')}
            className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
              devices.light.on
                ? 'bg-sky-500/15 border-sky-500/40'
                : 'bg-ocean-900 border-ocean-800 hover:border-ocean-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <Sun className={`w-4 h-4 ${devices.light.on ? 'text-sky-400' : 'text-slate-500'}`} />
              <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                devices.light.on ? 'bg-sky-500/20 text-sky-300' : 'bg-ocean-800 text-slate-400'
              }`}>
                {devices.light.on ? 'ON' : 'OFF'}
              </span>
            </div>
            <p className="text-xs font-bold text-white">Aquarium Light</p>
            <p className="text-[11px] text-slate-400 font-mono mt-1">Runtime: {formatRuntime(devices.light.runtimeSeconds)}</p>
          </div>

          {/* Fill Pump */}
          <div
            onClick={() => toggleDevice('fillPump')}
            className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
              devices.fillPump.on
                ? 'bg-emerald-500/15 border-emerald-500/40'
                : 'bg-ocean-900 border-ocean-800 hover:border-ocean-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <ArrowUpCircle className={`w-4 h-4 ${devices.fillPump.on ? 'text-emerald-400' : 'text-slate-500'}`} />
              <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                devices.fillPump.on ? 'bg-emerald-500/20 text-emerald-300' : 'bg-ocean-800 text-slate-400'
              }`}>
                {devices.fillPump.on ? 'FILLING' : 'OFF'}
              </span>
            </div>
            <p className="text-xs font-bold text-white">Fill Pump</p>
            <p className="text-[11px] text-slate-400 font-mono mt-1">Runtime: {formatRuntime(devices.fillPump.runtimeSeconds)}</p>
          </div>

          {/* Drain Pump */}
          <div
            onClick={() => toggleDevice('drainPump')}
            className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
              devices.drainPump.on
                ? 'bg-amber-500/15 border-amber-500/40'
                : 'bg-ocean-900 border-ocean-800 hover:border-ocean-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <ArrowDownCircle className={`w-4 h-4 ${devices.drainPump.on ? 'text-amber-400' : 'text-slate-500'}`} />
              <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                devices.drainPump.on ? 'bg-amber-500/20 text-amber-300' : 'bg-ocean-800 text-slate-400'
              }`}>
                {devices.drainPump.on ? 'DRAINING' : 'OFF'}
              </span>
            </div>
            <p className="text-xs font-bold text-white">Drain Pump</p>
            <p className="text-[11px] text-slate-400 font-mono mt-1">Runtime: {formatRuntime(devices.drainPump.runtimeSeconds)}</p>
          </div>

          {/* Smart Fish Feeder */}
          <div
            onClick={() => setActiveTab('schedules')}
            className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
              feeder.isDispensing
                ? 'bg-amber-500/20 border-amber-500/50 animate-pulse'
                : feeder.autoMode
                ? 'bg-amber-500/10 border-amber-500/30 hover:border-amber-500/50'
                : 'bg-ocean-900 border-ocean-800 hover:border-ocean-700'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <Utensils className={`w-4 h-4 ${feeder.autoMode ? 'text-amber-400' : 'text-slate-500'}`} />
              <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                feeder.isDispensing
                  ? 'bg-amber-500/30 text-amber-200'
                  : feeder.autoMode
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-ocean-800 text-slate-400'
              }`}>
                {feeder.isDispensing ? 'DISPENSING' : feeder.autoMode ? 'AUTO' : 'MANUAL'}
              </span>
            </div>
            <p className="text-xs font-bold text-white">Smart Feeder</p>
            <p className="text-[11px] text-slate-400 font-mono mt-1">
              {feeder.autoMode
                ? `Next: ${Math.floor(feeder.nextFeedInSeconds / 60)}m ${feeder.nextFeedInSeconds % 60}s`
                : `Hopper: ${feeder.hopperLevelPercent}%`}
            </p>
          </div>
        </div>
      </section>

      {/* 4. Water Management & Energy Snapshot (2 Cols) */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Water Management Card */}
        <div className="glass-panel rounded-2xl p-5 border border-ocean-700/60 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 font-mono flex items-center gap-1.5">
                <Droplets className="w-4 h-4" /> Water Management
              </span>
              <span className="text-xs font-mono text-slate-400">
                Last: {cleaningState.lastCompleted}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-ocean-900 border border-ocean-800 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 font-medium">Water Quality Status</span>
                <p className="text-sm font-bold text-emerald-400 flex items-center gap-1.5 mt-0.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Normal (TDS {telemetry.tds} ppm)
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 font-medium">Level</span>
                <p className="text-sm font-mono font-bold text-white mt-0.5">{telemetry.waterLevel.toFixed(1)}%</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('water')}
              className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-ocean-900 text-slate-300 hover:text-white border border-ocean-700 transition-colors text-center"
            >
              Water Management Hub
            </button>
            {!isCleaningActive ? (
              <button
                onClick={() => setShowConfirmModal(true)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold font-mono bg-cyan-500 text-ocean-950 hover:bg-cyan-400 transition-colors shrink-0"
              >
                START WATER CHANGE
              </button>
            ) : (
              <span className="px-4 py-2.5 rounded-xl text-xs font-bold font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                {cleaningState.phase}...
              </span>
            )}
          </div>
        </div>

        {/* Energy Today Card */}
        <div className="glass-panel rounded-2xl p-5 border border-ocean-700/60 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 font-mono flex items-center gap-1.5">
                <Zap className="w-4 h-4" /> Energy Today
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-ocean-900 border border-ocean-800 text-slate-400">
                Estimated Energy
              </span>
            </div>

            <div className="flex items-baseline justify-between p-3.5 rounded-xl bg-ocean-900 border border-ocean-800">
              <div>
                <span className="text-2xl sm:text-3xl font-mono font-bold text-white">{energy.todayWh}</span>
                <span className="text-xs font-semibold text-slate-400 ml-1">Wh</span>
              </div>
              <div className="text-right text-xs font-mono text-slate-400">
                <div>Active Load: <span className="text-cyan-300 font-bold">{energy.livePowerWatts}W</span></div>
                <div className="text-[11px] text-slate-500 mt-0.5">Week: {energy.thisWeekKwh} kWh</div>
              </div>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('energy')}
            className="w-full py-2.5 rounded-xl text-xs font-semibold bg-ocean-900 text-slate-300 hover:text-white border border-ocean-700 transition-colors text-center"
          >
            View Energy & Runtime Breakdown
          </button>
        </div>
      </section>

      {/* 5. Recent Activity */}
      <section className="glass-panel rounded-2xl p-5 border border-ocean-700/60 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" /> Recent Activity
          </h3>
          <button
            onClick={() => setActiveTab('alerts')}
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
          >
            View All Logs <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {activityLog.slice(0, 3).map(act => (
            <div key={act.id} className="p-3 rounded-xl bg-ocean-900/80 border border-ocean-800 text-xs font-mono">
              <div className="flex items-center justify-between text-slate-400 text-[10px] mb-1">
                <span>{act.timestamp}</span>
                <span className="text-cyan-400">{act.device}</span>
              </div>
              <p className="text-white font-medium truncate">{act.event}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Simple Water Change Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="max-w-sm w-full rounded-2xl bg-ocean-900 border border-ocean-700 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                <RefreshCw className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">Start Water Change?</h4>
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
              <div className="flex justify-between">
                <span className="text-slate-400">Drain Target:</span>
                <span className="text-cyan-300 font-bold">50%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Refill Target:</span>
                <span className="text-emerald-300 font-bold">85%</span>
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
