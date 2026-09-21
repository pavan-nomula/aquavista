import React, { useState } from 'react';
import { useAquavista } from '../context/AquavistaContext';
import {
  Settings as SettingsIcon,
  CheckCircle,
  Save,
  Thermometer,
  Layers,
  Droplets,
  CalendarClock,
  Sparkles,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const {
    automation,
    updateAutomation,
    demoMode,
    setDemoMode,
    connectionStatus,
  } = useAquavista();

  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-cyan-400" />
            System Settings
          </h2>
          <p className="text-xs text-slate-400 font-medium">
            Configure target thresholds, operating schedules, and system modes
          </p>
        </div>

        <button
          onClick={handleSave}
          className="px-4 py-2 rounded-xl text-xs font-bold font-mono bg-cyan-500 text-ocean-950 hover:bg-cyan-400 flex items-center gap-2 transition-all self-start sm:self-auto"
        >
          {saveSuccess ? (
            <>
              <CheckCircle className="w-4 h-4" /> Saved Successfully
            </>
          ) : (
            <>
              <Save className="w-4 h-4" /> Save Settings
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* 1. Temperature Setpoint */}
        <div className="glass-panel rounded-2xl p-5 border border-ocean-700/60 space-y-3">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Thermometer className="w-4 h-4 text-rose-400" />
            <span>Target Temperature</span>
          </div>
          <div className="flex justify-between text-xs font-mono">
            <span className="text-slate-400">Setpoint</span>
            <span className="text-rose-400 font-bold">{automation.temperature.targetTemp}°C</span>
          </div>
          <input
            type="range"
            min="22"
            max="30"
            step="0.5"
            value={automation.temperature.targetTemp}
            onChange={e =>
              updateAutomation({
                temperature: { ...automation.temperature, targetTemp: parseFloat(e.target.value) },
              })
            }
            className="w-full h-2 bg-ocean-800 rounded-lg appearance-none cursor-pointer accent-rose-400"
          />
          <p className="text-[11px] text-slate-500">Heater regulates aquarium water to this setpoint.</p>
        </div>

        {/* 2. TDS Warning Limit */}
        <div className="glass-panel rounded-2xl p-5 border border-ocean-700/60 space-y-3">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Layers className="w-4 h-4 text-amber-400" />
            <span>TDS Warning Threshold</span>
          </div>
          <div className="flex justify-between text-xs font-mono">
            <span className="text-slate-400">Attention Limit</span>
            <span className="text-amber-400 font-bold">{automation.tds.warningThreshold} ppm</span>
          </div>
          <input
            type="range"
            min="200"
            max="450"
            step="10"
            value={automation.tds.warningThreshold}
            onChange={e =>
              updateAutomation({
                tds: { ...automation.tds, warningThreshold: parseInt(e.target.value) },
              })
            }
            className="w-full h-2 bg-ocean-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
          />
          <p className="text-[11px] text-slate-500">Raises an attention warning when Total Dissolved Solids exceed threshold.</p>
        </div>

        {/* 3. Water Level Limits */}
        <div className="glass-panel rounded-2xl p-5 border border-ocean-700/60 space-y-3">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Droplets className="w-4 h-4 text-cyan-400" />
            <span>Water Level Limits</span>
          </div>
          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between">
              <span className="text-slate-400">Minimum Level (Auto-fill trigger):</span>
              <span className="text-amber-400 font-bold">{automation.waterLevel.minThreshold}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Target Level (Fill cutoff):</span>
              <span className="text-cyan-300 font-bold">{automation.waterLevel.targetThreshold}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Safe Minimum (Heater lockout):</span>
              <span className="text-rose-400 font-bold">{automation.waterLevel.dangerLowThreshold}%</span>
            </div>
          </div>
        </div>

        {/* 4. Operating Mode & System */}
        <div className="glass-panel rounded-2xl p-5 border border-ocean-700/60 space-y-4">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <CalendarClock className="w-4 h-4 text-sky-400" />
            <span>System & Hardware Status</span>
          </div>

          <div className="p-3 rounded-xl bg-ocean-900 border border-ocean-800 text-xs font-mono space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Hardware Controller:</span>
              <span className="text-white font-bold">ESP32</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Connection Status:</span>
              <span className={connectionStatus === 'connected' ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                {connectionStatus === 'connected' ? 'Connected' : 'Offline'}
              </span>
            </div>
          </div>

          {/* Demo Mode Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-ocean-900 border border-ocean-800">
            <div>
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Demo Simulation Mode
              </span>
              <p className="text-[11px] text-slate-400">Generates simulated sensor changes for demonstrations</p>
            </div>
            <button
              onClick={() => setDemoMode(!demoMode)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                demoMode ? 'bg-cyan-500 text-ocean-950' : 'bg-ocean-800 text-slate-400 hover:text-white'
              }`}
            >
              {demoMode ? 'ENABLED' : 'DISABLED'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
