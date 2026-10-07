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
  Wifi,
  WifiOff,
  Radio,
  RefreshCw,
  Lock,
  Unlock,
  KeyRound,
  ShieldCheck,
} from 'lucide-react';
import { fetchEspStatus } from '../services/hardwareService';

export const SettingsView: React.FC = () => {
  const {
    automation,
    updateAutomation,
    connectionStatus,
    esp32Ip,
    setEsp32Ip,
    isUnlocked,
    lockControls,
    openPinModal,
    changePin,
  } = useAquavista();

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [ipInput, setIpInput] = useState(esp32Ip);
  const [testState, setTestState] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMsg, setTestMsg] = useState('');

  // Passcode Security state
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [pinFeedback, setPinFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const handleTestConnection = async () => {
    setTestState('testing');
    setTestMsg('Pinging ESP32 REST server...');
    try {
      const clean = ipInput.trim().replace(/^https?:\/\//, '').replace(/\/+$/, '');
      const data = await fetchEspStatus(clean, 3000);
      setTestState('success');
      setTestMsg(`Connected! Temp: ${data.temperature}°C, Water: ${data.waterLevel}%, TDS: ${data.tds} ppm`);
      setEsp32Ip(clean);
    } catch {
      setTestState('error');
      setTestMsg('Connection failed. Make sure your ESP32 is powered on and on the same WiFi network.');
    }
  };

  const handleSave = () => {
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleUpdatePin = (e: React.FormEvent) => {
    e.preventDefault();
    const res = changePin(currentPinInput, newPinInput);
    if (res.success) {
      setPinFeedback({ type: 'success', msg: res.message });
      setCurrentPinInput('');
      setNewPinInput('');
      setTimeout(() => setPinFeedback(null), 4000);
    } else {
      setPinFeedback({ type: 'error', msg: res.message });
    }
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
        </div>

        {/* 5. Access Control & Security Passcode */}
        <div className="glass-panel rounded-2xl p-5 border border-amber-500/30 md:col-span-2 space-y-4 bg-gradient-to-br from-ocean-900/80 to-amber-950/20">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <KeyRound className="w-4 h-4 text-amber-400" />
              <span>Access Control & Security Passcode</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[11px] font-mono px-2.5 py-0.5 rounded-full border ${
                isUnlocked
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
              }`}>
                {isUnlocked ? 'Operator Mode: UNLOCKED' : 'Public Mode: LOCKED (Monitor Only)'}
              </span>
              <button
                type="button"
                onClick={() => {
                  if (isUnlocked) {
                    lockControls();
                  } else {
                    openPinModal('unlock operator controls');
                  }
                }}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                  isUnlocked
                    ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border-rose-500/40'
                    : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/40'
                }`}
              >
                {isUnlocked ? (
                  <>
                    <Lock className="w-3 h-3" /> Lock Controls Now
                  </>
                ) : (
                  <>
                    <Unlock className="w-3 h-3" /> Enter PIN to Unlock
                  </>
                )}
              </button>
            </div>
          </div>

          <p className="text-xs text-slate-400">
            Anyone with your web link can view live sensor telemetry. However, manual actuator controls (Fish Feeder, Relays, Pumps, Heater) are protected by a 4-digit PIN.
          </p>

          <form onSubmit={handleUpdatePin} className="p-4 rounded-xl bg-ocean-950/70 border border-ocean-800 space-y-3">
            <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-cyan-400" /> Change Security Passcode (PIN)
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1 font-mono">Current PIN (Default: 1986)</label>
                <input
                  type="password"
                  maxLength={4}
                  value={currentPinInput}
                  onChange={e => setCurrentPinInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 1986"
                  className="w-full px-3 py-2 rounded-xl bg-ocean-900 border border-ocean-700 text-white font-mono text-sm focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1 font-mono">New 4-Digit PIN</label>
                <input
                  type="password"
                  maxLength={4}
                  value={newPinInput}
                  onChange={e => setNewPinInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="New 4-digits"
                  className="w-full px-3 py-2 rounded-xl bg-ocean-900 border border-ocean-700 text-cyan-300 font-mono text-sm focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={currentPinInput.length !== 4 || newPinInput.length !== 4}
                  className="w-full py-2 px-4 rounded-xl text-xs font-mono font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 flex items-center justify-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5" /> Save New PIN
                </button>
              </div>
            </div>

            {pinFeedback && (
              <div className={`p-2.5 rounded-lg text-xs font-mono flex items-center gap-2 ${
                pinFeedback.type === 'success'
                  ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-950/60 border border-rose-500/40 text-rose-300'
              }`}>
                {pinFeedback.type === 'success' ? (
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <Lock className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span>{pinFeedback.msg}</span>
              </div>
            )}
          </form>
        </div>

        {/* 6. ESP32 Network Controller Link */}
        <div className="glass-panel rounded-2xl p-5 border border-cyan-500/30 md:col-span-2 space-y-4 bg-gradient-to-br from-ocean-900/80 to-cyan-950/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <Radio className="w-4 h-4 text-cyan-400" />
              <span>ESP32 Hardware Controller Link (WiFi REST API)</span>
            </div>
            <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              No Cloud / Local LAN
            </span>
          </div>

          <p className="text-xs text-slate-400">
            Enter your ESP32's local IP address (displayed on your aquarium LCD or Arduino Serial Monitor at startup).
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 font-mono text-xs">
                http://
              </div>
              <input
                type="text"
                value={ipInput}
                onChange={e => setIpInput(e.target.value)}
                placeholder="192.168.1.39"
                className="w-full pl-16 pr-4 py-2.5 rounded-xl bg-ocean-950 border border-ocean-700 text-cyan-300 font-mono text-xs focus:outline-none focus:border-cyan-400 transition-colors"
              />
            </div>

            <button
              onClick={handleTestConnection}
              disabled={testState === 'testing'}
              className="px-4 py-2.5 rounded-xl text-xs font-mono font-bold bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {testState === 'testing' ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Testing...
                </>
              ) : (
                <>
                  <Wifi className="w-3.5 h-3.5" /> Test & Connect
                </>
              )}
            </button>
          </div>

          {/* Test feedback */}
          {testState !== 'idle' && (
            <div
              className={`p-3 rounded-xl border text-xs font-mono flex items-start gap-2 ${
                testState === 'success'
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                  : testState === 'error'
                  ? 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                  : 'bg-ocean-900 border-ocean-700 text-slate-300'
              }`}
            >
              {testState === 'success' ? (
                <Wifi className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : testState === 'error' ? (
                <WifiOff className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              ) : (
                <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin shrink-0 mt-0.5" />
              )}
              <span>{testMsg}</span>
            </div>
          )}

          <div className="pt-2 border-t border-ocean-800 text-[11px] text-slate-500 flex flex-wrap gap-x-4 gap-y-1">
            <span>• Direct REST endpoints: <code className="text-cyan-400">/api/status</code>, <code className="text-cyan-400">/api/device</code>, <code className="text-cyan-400">/api/feed</code></span>
            <span>• Cross-Origin CORS enabled</span>
            <span>• Vercel Deployment: <a href="https://aquavista-dashboard.vercel.app/" target="_blank" rel="noreferrer" className="text-cyan-400 underline hover:text-cyan-300">aquavista-dashboard.vercel.app</a></span>
          </div>
        </div>
      </div>
    </div>
  );
};
