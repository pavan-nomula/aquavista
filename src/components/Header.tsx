import React, { useState, useEffect } from 'react';
import { useAquavista } from '../context/AquavistaContext';
import {
  Activity,
  Wifi,
  WifiOff,
  Clock,
  Maximize2,
  Bell,
  Sparkles,
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    telemetry,
    connectionStatus,
    setConnectionStatus,
    lastSyncSecondsAgo,
    alerts,
    setActiveTab,
    devices,
    demoMode,
    setDemoMode,
    esp32Ip,
  } = useAquavista();

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const unreadAlerts = alerts.filter(a => !a.read).length;

  const isCritical = telemetry.waterLevel < 30 || telemetry.tds > 450 || telemetry.temperature > 28.5 || devices.heater.isInterlocked;
  const isAttention = telemetry.tds > 320 || telemetry.temperature > 27.5 || telemetry.temperature < 25.0;

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full px-4 sm:px-6 py-3.5 bg-ocean-950/90 backdrop-blur-md border-b border-ocean-700/50">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Left: Clean Brand */}
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-display font-extrabold tracking-tight text-white flex items-center gap-1.5">
              AQUA<span className="text-cyan-400">VISTA</span>
            </h1>
            <p className="text-xs text-slate-400 font-medium">
              Smart Aquarium Monitoring & Management System
            </p>
          </div>

          <div className="hidden md:block h-6 w-[1px] bg-ocean-700" />

          {/* System Status */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono border">
            {connectionStatus === 'offline' ? (
              <span className="text-slate-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-500" /> System Status: Offline
              </span>
            ) : isCritical ? (
              <span className="text-rose-400 border-rose-500/30 bg-rose-500/10 flex items-center gap-1.5 px-2 py-0.5 rounded-full animate-pulse">
                <span className="w-2 h-2 rounded-full bg-rose-500" /> System Status: Critical
              </span>
            ) : isAttention ? (
              <span className="text-amber-400 border-amber-500/30 bg-amber-500/10 flex items-center gap-1.5 px-2 py-0.5 rounded-full">
                <span className="w-2 h-2 rounded-full bg-amber-500" /> System Status: Attention
              </span>
            ) : (
              <span className="text-emerald-400 border-emerald-500/30 bg-emerald-500/10 flex items-center gap-1.5 px-2 py-0.5 rounded-full">
                <span className="w-2 h-2 rounded-full bg-emerald-400" /> System Status: Normal
              </span>
            )}
          </div>
        </div>

        {/* Right: Controller link, sync, demo tag, and actions */}
        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
          {/* Demo Mode Badge */}
          <button
            onClick={() => setDemoMode(!demoMode)}
            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold flex items-center gap-1.5 border transition-all ${
              demoMode
                ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
                : 'bg-ocean-900 border-ocean-700 text-slate-500 hover:text-slate-400'
            }`}
            title="Click to toggle Demo Mode"
          >
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>{demoMode ? 'DEMO MODE' : 'LIVE HW'}</span>
          </button>

          {/* Controller status */}
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-2.5 py-1 rounded-lg border text-xs font-mono flex items-center gap-2 transition-all ${
              connectionStatus === 'connected'
                ? 'bg-ocean-900 border-ocean-700 text-slate-300 hover:border-cyan-500/50'
                : 'bg-rose-950/40 border-rose-600/40 text-rose-300 hover:border-rose-400'
            }`}
            title="Configure ESP32 Connection in Settings"
          >
            {connectionStatus === 'connected' ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-slate-400">ESP32:</span>
                <span className="text-emerald-400 font-bold">{esp32Ip}</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-rose-400" />
                <span className="text-slate-400">ESP32:</span>
                <span className="font-bold text-rose-400">{esp32Ip || 'Set IP'}</span>
              </>
            )}
          </button>

          {/* Sync Ticker */}
          <div className="hidden lg:flex items-center gap-1.5 px-2 py-1 rounded-lg bg-ocean-900 border border-ocean-800 text-xs font-mono text-slate-400">
            <Activity className="w-3 h-3 text-cyan-400 animate-pulse" />
            <span>Sync: {lastSyncSecondsAgo}s ago</span>
          </div>

          {/* Live Clock */}
          <div className="hidden xl:flex items-center gap-1.5 px-2 py-1 rounded-lg bg-ocean-900 border border-ocean-800 text-xs font-mono text-slate-300">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{currentTime.toLocaleTimeString()}</span>
          </div>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg bg-ocean-900 border border-ocean-700 text-slate-400 hover:text-white transition-colors"
            title="Toggle Fullscreen View"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          {/* Notification Bell */}
          <button
            onClick={() => setActiveTab('alerts')}
            className="relative p-1.5 rounded-lg bg-ocean-900 border border-ocean-700 text-slate-400 hover:text-white transition-colors"
            title="View Alerts & Activity"
          >
            <Bell className="w-4 h-4" />
            {unreadAlerts > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-[10px] font-bold text-white flex items-center justify-center">
                {unreadAlerts}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
