import React from 'react';
import { useAquavista } from '../context/AquavistaContext';
import {
  Flame,
  Droplets,
  ArrowDownCircle,
  Wind,
  Sun,
  ShieldAlert,
  Power,
} from 'lucide-react';

export const DeviceControlView: React.FC = () => {
  const {
    devices,
    toggleDevice,
    setHeaterTarget,
    telemetry,
  } = useAquavista();

  const formatRuntime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <Power className="w-5 h-5 text-cyan-400" />
          Device Control
        </h2>
        <p className="text-xs text-slate-400 font-medium">
          Manual device switching, target temperature setting, and daily runtime tracking
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* 1. Aquarium Heater */}
        <div className={`glass-panel rounded-2xl p-5 border transition-all ${
          devices.heater.isInterlocked
            ? 'border-rose-500/40 bg-rose-950/20'
            : devices.heater.on
            ? 'border-rose-500/30'
            : 'border-ocean-700/60'
        }`}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                devices.heater.on ? 'bg-rose-500/20 text-rose-400' : 'bg-ocean-800 text-slate-500'
              }`}>
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Aquarium Heater</h3>
                <p className="text-xs text-slate-400 font-mono">50W Submersible Heater</p>
              </div>
            </div>

            {/* Toggle Switch */}
            <button
              onClick={() => toggleDevice('heater')}
              className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none ${
                devices.heater.on ? 'bg-rose-500' : 'bg-ocean-800'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                  devices.heater.on ? 'translate-x-8' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Safety Interlock Notice */}
          {devices.heater.isInterlocked && (
            <div className="mb-4 p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center gap-2 text-xs font-mono text-rose-300">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>Heater disabled — low water level (&lt; 30%)</span>
            </div>
          )}

          {/* Runtime & State */}
          <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-ocean-900 border border-ocean-800 text-xs font-mono mb-4">
            <div>
              <span className="text-slate-500 block text-[10px]">CURRENT TEMP</span>
              <span className="text-white font-bold">{telemetry.temperature.toFixed(1)}°C</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">TARGET TEMP</span>
              <span className="text-rose-400 font-bold">{devices.heater.targetTemp.toFixed(1)}°C</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">RUNTIME TODAY</span>
              <span className="text-slate-300 font-bold">{formatRuntime(devices.heater.runtimeSeconds)}</span>
            </div>
          </div>

          {/* Target Temperature Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">Target Temperature</span>
              <span className="text-rose-400 font-bold">{devices.heater.targetTemp}°C</span>
            </div>
            <input
              type="range"
              min="22"
              max="30"
              step="0.5"
              value={devices.heater.targetTemp}
              onChange={e => setHeaterTarget(parseFloat(e.target.value))}
              className="w-full h-2 bg-ocean-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
            />
          </div>
        </div>

        {/* 2. Oxygen / Aeration Pump */}
        <div className={`glass-panel rounded-2xl p-5 border transition-all ${
          devices.airPump.on ? 'border-cyan-500/30' : 'border-ocean-700/60'
        }`}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                devices.airPump.on ? 'bg-cyan-500/20 text-cyan-400' : 'bg-ocean-800 text-slate-500'
              }`}>
                <Wind className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Oxygen / Aeration Pump</h3>
                <p className="text-xs text-slate-400 font-mono">5W Aeration Pump</p>
              </div>
            </div>

            <button
              onClick={() => toggleDevice('airPump')}
              className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none ${
                devices.airPump.on ? 'bg-cyan-500' : 'bg-ocean-800'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                  devices.airPump.on ? 'translate-x-8' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-ocean-900 border border-ocean-800 text-xs font-mono">
            <div>
              <span className="text-slate-500 block text-[10px]">CURRENT STATE</span>
              <span className="text-cyan-300 font-bold">{devices.airPump.on ? 'ON (Active)' : 'OFF'}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">RUNTIME TODAY</span>
              <span className="text-white font-bold">{formatRuntime(devices.airPump.runtimeSeconds)}</span>
            </div>
          </div>
        </div>

        {/* 3. Aquarium Light */}
        <div className={`glass-panel rounded-2xl p-5 border transition-all ${
          devices.light.on ? 'border-sky-500/30' : 'border-ocean-700/60'
        }`}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                devices.light.on ? 'bg-sky-500/20 text-sky-400' : 'bg-ocean-800 text-slate-500'
              }`}>
                <Sun className="w-5 h-5 text-sky-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Aquarium Light</h3>
                <p className="text-xs text-slate-400 font-mono">10W Overhead Aquarium Light</p>
              </div>
            </div>

            <button
              onClick={() => toggleDevice('light')}
              className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none ${
                devices.light.on ? 'bg-sky-500' : 'bg-ocean-800'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                  devices.light.on ? 'translate-x-8' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-ocean-900 border border-ocean-800 text-xs font-mono">
            <div>
              <span className="text-slate-500 block text-[10px]">AMBIENT LIGHT (LDR)</span>
              <span className="text-amber-300 font-bold">{telemetry.lightLevel} lux</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">RUNTIME TODAY</span>
              <span className="text-white font-bold">{formatRuntime(devices.light.runtimeSeconds)}</span>
            </div>
          </div>
        </div>

        {/* 4. Water Filling Pump */}
        <div className={`glass-panel rounded-2xl p-5 border transition-all ${
          devices.fillPump.on ? 'border-emerald-500/30' : 'border-ocean-700/60'
        }`}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                devices.fillPump.on ? 'bg-emerald-500/20 text-emerald-400' : 'bg-ocean-800 text-slate-500'
              }`}>
                <Droplets className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Water Filling Pump</h3>
                <p className="text-xs text-slate-400 font-mono">25W Fill Pump</p>
              </div>
            </div>

            <button
              onClick={() => toggleDevice('fillPump')}
              className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none ${
                devices.fillPump.on ? 'bg-emerald-500' : 'bg-ocean-800'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                  devices.fillPump.on ? 'translate-x-8' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-ocean-900 border border-ocean-800 text-xs font-mono">
            <div>
              <span className="text-slate-500 block text-[10px]">WATER LEVEL</span>
              <span className="text-white font-bold">{telemetry.waterLevel.toFixed(1)}%</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">RUNTIME TODAY</span>
              <span className="text-slate-300 font-bold">{formatRuntime(devices.fillPump.runtimeSeconds)}</span>
            </div>
          </div>
        </div>

        {/* 5. Water Drain / Cleaning Pump */}
        <div className={`glass-panel rounded-2xl p-5 border md:col-span-2 transition-all ${
          devices.drainPump.on ? 'border-amber-500/30' : 'border-ocean-700/60'
        }`}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                devices.drainPump.on ? 'bg-amber-500/20 text-amber-400' : 'bg-ocean-800 text-slate-500'
              }`}>
                <ArrowDownCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Water Drain / Cleaning Pump</h3>
                <p className="text-xs text-slate-400 font-mono">30W Sump Drain Pump</p>
              </div>
            </div>

            <button
              onClick={() => toggleDevice('drainPump')}
              className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none ${
                devices.drainPump.on ? 'bg-amber-500' : 'bg-ocean-800'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                  devices.drainPump.on ? 'translate-x-8' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 rounded-xl bg-ocean-900 border border-ocean-800 text-xs font-mono">
            <div>
              <span className="text-slate-500 block text-[10px]">STATE</span>
              <span className="text-amber-400 font-bold">{devices.drainPump.on ? 'DRAINING' : 'OFF'}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">RUNTIME TODAY</span>
              <span className="text-white font-bold">{formatRuntime(devices.drainPump.runtimeSeconds)}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">MUTEX LOCK</span>
              <span className="text-emerald-400 font-bold">Armed (Blocks Fill)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
