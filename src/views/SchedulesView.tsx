import React, { useState } from 'react';
import { useAquavista } from '../context/AquavistaContext';
import {
  CalendarClock,
  Thermometer,
  Droplets,
  Sun,
  Wind,
  ToggleLeft,
  ToggleRight,
  Utensils,
  Plus,
  Trash2,
  CheckCircle2,
  Sparkles,
  Clock,
  Layers,
} from 'lucide-react';
import { PortionSize } from '../types/aquavista';

export const SchedulesView: React.FC = () => {
  const {
    automation,
    updateAutomation,
    feeder,
    triggerFeed,
    updateFeederSettings,
    addFeedingSchedule,
    toggleFeedingSchedule,
    deleteFeedingSchedule,
    refillFoodHopper,
  } = useAquavista();

  const [isAddingSchedule, setIsAddingSchedule] = useState(false);
  const [newTime, setNewTime] = useState('12:00');
  const [newLabel, setNewLabel] = useState('Midday Feeding');
  const [newPortion, setNewPortion] = useState<PortionSize>('medium');

  const handleAddScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTime) return;

    addFeedingSchedule({
      time: newTime,
      label: newLabel || 'Scheduled Feeding',
      portion: newPortion,
      enabled: true,
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    });

    setIsAddingSchedule(false);
    setNewLabel('Midday Feeding');
  };

  const formatCountdown = (secs: number) => {
    if (secs >= 3600) {
      const h = Math.floor(secs / 3600);
      const m = Math.floor((secs % 3600) / 60);
      return `${h}h ${m.toString().padStart(2, '0')}m`;
    }
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <CalendarClock className="w-5 h-5 text-cyan-400" />
          Device Schedules & Automation
        </h2>
        <p className="text-xs text-slate-400 font-medium">
          Configure automatic fish feeding schedules and intelligent sensor-based aquarium controls
        </p>
      </div>

      {/* 1. MASTER AUTOMATIC FISH FEEDER & SCHEDULING CARD (TOP PROMINENT) */}
      <div className="glass-panel rounded-2xl p-6 border border-ocean-700/60 space-y-6">
        {/* Anti-Overfeeding Safety & Timing Mode Bar */}
        <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-950/40 via-ocean-900 to-ocean-950 border border-emerald-500/30 flex items-center justify-between flex-wrap gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm">
              🛡️
            </div>
            <div>
              <div className="font-bold text-white flex items-center gap-2">
                <span>Anti-Overfeed Guard Active</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                  {feeder.feedsTodayCount ?? 1} / {feeder.maxDailyFeeds ?? 3} feeds today (Safe)
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Protects fishes from deadly overfeeding. Dispenses only at scheduled times (2-3 times daily).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-[11px] font-mono">Timing Mode:</span>
            <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold border bg-emerald-500/20 text-emerald-300 border-emerald-500/40">
              📅 Daily Schedule (Real Time)
            </span>
          </div>
        </div>
        {/* Feeder Top Header */}
        <div className="flex items-center justify-between flex-wrap gap-4 border-b border-ocean-800/80 pb-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shadow-lg shadow-amber-500/10">
              <Utensils className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-lg font-bold text-white">Smart Automatic Fish Feeder</h3>
                <span
                  className={`px-2.5 py-0.5 text-xs font-mono rounded-full border ${
                    feeder.autoMode
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-slate-700/50 text-slate-400 border-slate-600/40'
                  }`}
                >
                  {feeder.autoMode ? '● AUTOMATIC MODE ACTIVE' : '○ MANUAL MODE ONLY'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Automated nutrient flake dispenser with daily scheduled timers and food hopper monitoring
              </p>
            </div>
          </div>

          {/* Master Toggle & Quick Dispense Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => triggerFeed(feeder.portionSize, 'manual')}
              disabled={feeder.isDispensing}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                feeder.isDispensing
                  ? 'bg-amber-500/30 text-amber-200 border border-amber-500/50 animate-pulse'
                  : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 hover:scale-105 active:scale-95 shadow-md shadow-amber-500/10'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>{feeder.isDispensing ? 'Dispensing Food...' : 'Dispense Test Feed'}</span>
            </button>

            <button
              onClick={() => updateFeederSettings({ autoMode: !feeder.autoMode })}
              className="flex items-center gap-1.5 p-1 rounded-xl transition-colors cursor-pointer"
              title="Toggle Automatic Mode"
            >
              {feeder.autoMode ? (
                <ToggleRight className="w-10 h-10 text-emerald-400" />
              ) : (
                <ToggleLeft className="w-10 h-10 text-slate-600" />
              )}
            </button>
          </div>
        </div>

        {/* Status & Diagnostics 4-Tile Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Next Feed Countdown */}
          <div className="p-4 rounded-xl bg-ocean-900/80 border border-ocean-800 space-y-1">
            <span className="text-slate-400 text-xs flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-cyan-400" /> Next Auto Feed
            </span>
            <div className="text-xl font-bold font-mono text-cyan-300">
              {feeder.autoMode ? formatCountdown(feeder.nextFeedInSeconds) : 'Paused'}
            </div>
            <span className="text-[11px] text-slate-500">
              {feeder.autoMode ? 'Countdown active' : 'Enable auto mode above'}
            </span>
          </div>

          {/* Last Fed Timestamp */}
          <div className="p-4 rounded-xl bg-ocean-900/80 border border-ocean-800 space-y-1">
            <span className="text-slate-400 text-xs flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Last Fed Time
            </span>
            <div className="text-base font-bold text-white font-mono">
              {feeder.lastFedTimestamp || 'Not recorded'}
            </div>
            <span className="text-[11px] text-emerald-400 capitalize">
              Dispensed via: {feeder.lastFedSource}
            </span>
          </div>

          {/* Food Hopper Capacity */}
          <div className="p-4 rounded-xl bg-ocean-900/80 border border-ocean-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-xs flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-400" /> Hopper Level
              </span>
              <button
                onClick={refillFoodHopper}
                className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
                title="Refill container to 100%"
              >
                Refill (100%)
              </button>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold font-mono text-amber-300">
                {feeder.hopperLevelPercent}%
              </span>
              <span className="text-[11px] text-slate-400">~{Math.round(feeder.hopperLevelPercent * 0.25)} days</span>
            </div>
            <div className="w-full h-2 bg-ocean-950 rounded-full overflow-hidden border border-ocean-800">
              <div
                className={`h-full transition-all duration-500 ${
                  feeder.hopperLevelPercent > 40 ? 'bg-amber-400' : 'bg-rose-400'
                }`}
                style={{ width: `${feeder.hopperLevelPercent}%` }}
              />
            </div>
          </div>

          {/* Default Portion Selector */}
          <div className="p-4 rounded-xl bg-ocean-900/80 border border-ocean-800 space-y-2">
            <span className="text-slate-400 text-xs flex items-center gap-1.5">
              <Utensils className="w-3.5 h-3.5 text-amber-400" /> Portion Size
            </span>
            <div className="grid grid-cols-3 gap-1.5 pt-0.5">
              {(['small', 'medium', 'large'] as PortionSize[]).map((p) => (
                <button
                  key={p}
                  onClick={() => updateFeederSettings({ portionSize: p })}
                  className={`py-1.5 px-1 rounded-lg text-xs font-mono capitalize transition-all cursor-pointer ${
                    feeder.portionSize === p
                      ? 'bg-amber-500/25 text-amber-300 font-bold border border-amber-500/40 shadow-sm'
                      : 'bg-ocean-950 text-slate-400 hover:text-white border border-ocean-800'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            <span className="text-[11px] text-slate-500 block">
              {feeder.portionSize === 'small' ? '2-3 flakes (light)' : feeder.portionSize === 'large' ? '8-10 flakes (generous)' : '4-6 flakes (standard)'}
            </span>
          </div>
        </div>

        {/* Configured Feeding Schedules List */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              Scheduled Daily Feeding Times ({feeder.schedules.length})
            </h4>

            <button
              onClick={() => setIsAddingSchedule(!isAddingSchedule)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-medium transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isAddingSchedule ? 'Cancel' : 'Add Feeding Time'}</span>
            </button>
          </div>

          {/* Expandable Add Schedule Form */}
          {isAddingSchedule && (
            <form
              onSubmit={handleAddScheduleSubmit}
              className="p-4 rounded-xl bg-ocean-900 border border-cyan-500/40 space-y-3 transition-all animate-fadeIn"
            >
              <div className="text-xs font-bold text-cyan-300">Add New Daily Feeding Time</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-mono text-slate-400 block mb-1">Time (24h)</label>
                  <input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    required
                    className="w-full px-3 py-1.5 rounded-lg bg-ocean-950 border border-ocean-800 text-white font-mono text-xs focus:border-cyan-400 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-mono text-slate-400 block mb-1">Schedule Label</label>
                  <input
                    type="text"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    placeholder="e.g. Afternoon Snack"
                    className="w-full px-3 py-1.5 rounded-lg bg-ocean-950 border border-ocean-800 text-white text-xs focus:border-cyan-400 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-mono text-slate-400 block mb-1">Portion</label>
                  <select
                    value={newPortion}
                    onChange={(e) => setNewPortion(e.target.value as PortionSize)}
                    className="w-full px-3 py-1.5 rounded-lg bg-ocean-950 border border-ocean-800 text-white font-mono text-xs focus:border-cyan-400 outline-none capitalize cursor-pointer"
                  >
                    <option value="small">Small (Light)</option>
                    <option value="medium">Medium (Standard)</option>
                    <option value="large">Large (Generous)</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingSchedule(false)}
                  className="px-3 py-1 text-xs rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-ocean-950 font-bold text-xs transition-colors cursor-pointer"
                >
                  Save Schedule
                </button>
              </div>
            </form>
          )}

          {/* Schedule Slots Table/Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {feeder.schedules.map((slot) => (
              <div
                key={slot.id}
                className={`p-3.5 rounded-xl border transition-all ${
                  slot.enabled
                    ? 'bg-ocean-900/90 border-ocean-700/80 shadow-sm'
                    : 'bg-ocean-950/60 border-ocean-800/40 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="text-xl font-bold font-mono text-white tracking-wider">
                    {slot.time}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleFeedingSchedule(slot.id)}
                      className="text-slate-400 hover:text-cyan-300 transition-colors p-1 cursor-pointer"
                      title={slot.enabled ? 'Disable slot' : 'Enable slot'}
                    >
                      {slot.enabled ? (
                        <ToggleRight className="w-6 h-6 text-emerald-400" />
                      ) : (
                        <ToggleLeft className="w-6 h-6 text-slate-600" />
                      )}
                    </button>
                    <button
                      onClick={() => deleteFeedingSchedule(slot.id)}
                      className="text-slate-500 hover:text-rose-400 transition-colors p-1 cursor-pointer"
                      title="Delete slot"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-1 text-xs font-medium text-slate-300">{slot.label}</div>

                <div className="mt-2.5 flex items-center justify-between text-[11px] font-mono">
                  <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 capitalize">
                    {slot.portion}
                  </span>
                  <span className="text-slate-400 text-[10px]">Every day</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. SENSOR-BASED & ENVIRONMENTAL DEVICE AUTOMATION (2x2 Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Temperature Automation */}
        <div className="glass-panel rounded-2xl p-5 border border-ocean-700/60 space-y-4">
          <div className="flex items-center justify-between border-b border-ocean-800 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                <Thermometer className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Temperature Control</h3>
                <p className="text-xs text-slate-400">Heater thermostat with hysteresis</p>
              </div>
            </div>

            <button
              onClick={() =>
                updateAutomation({
                  temperature: {
                    ...automation.temperature,
                    enabled: !automation.temperature.enabled,
                  },
                })
              }
              className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                automation.temperature.enabled ? 'text-cyan-400' : 'text-slate-600'
              }`}
            >
              {automation.temperature.enabled ? (
                <ToggleRight className="w-8 h-8" />
              ) : (
                <ToggleLeft className="w-8 h-8" />
              )}
            </button>
          </div>

          <div className="p-3.5 rounded-xl bg-ocean-900 border border-ocean-800 space-y-1.5 font-mono text-xs">
            <div className="text-slate-300">
              • Turn Heater <span className="text-rose-400 font-bold">ON</span> if temperature &lt;{' '}
              <span className="text-white font-bold">
                {(automation.temperature.targetTemp - automation.temperature.hysteresis).toFixed(1)}°C
              </span>
            </div>
            <div className="text-slate-300">
              • Turn Heater <span className="text-slate-400 font-bold">OFF</span> when target{' '}
              <span className="text-rose-400 font-bold">{automation.temperature.targetTemp}°C</span> is reached
            </div>
            <div className="text-slate-500 text-[11px]">
              * Hysteresis (±0.3°C) prevents rapid relay switching.
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">Target Temperature</span>
              <span className="text-rose-400 font-bold">{automation.temperature.targetTemp}°C</span>
            </div>
            <input
              type="range"
              min="22"
              max="30"
              step="0.5"
              value={automation.temperature.targetTemp}
              onChange={(e) =>
                updateAutomation({
                  temperature: {
                    ...automation.temperature,
                    targetTemp: parseFloat(e.target.value),
                  },
                })
              }
              className="w-full h-2 bg-ocean-800 rounded-lg appearance-none cursor-pointer accent-rose-400"
            />
          </div>
        </div>

        {/* Water Level Automation */}
        <div className="glass-panel rounded-2xl p-5 border border-ocean-700/60 space-y-4">
          <div className="flex items-center justify-between border-b border-ocean-800 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                <Droplets className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Automatic Water Replenishment</h3>
                <p className="text-xs text-slate-400">Maintains target water level</p>
              </div>
            </div>

            <button
              onClick={() =>
                updateAutomation({
                  waterLevel: {
                    ...automation.waterLevel,
                    enabled: !automation.waterLevel.enabled,
                  },
                })
              }
              className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                automation.waterLevel.enabled ? 'text-cyan-400' : 'text-slate-600'
              }`}
            >
              {automation.waterLevel.enabled ? (
                <ToggleRight className="w-8 h-8" />
              ) : (
                <ToggleLeft className="w-8 h-8" />
              )}
            </button>
          </div>

          <div className="p-3.5 rounded-xl bg-ocean-900 border border-ocean-800 space-y-1.5 font-mono text-xs">
            <div className="text-slate-300">
              • Turn Fill Pump <span className="text-emerald-400 font-bold">ON</span> if level &lt;{' '}
              <span className="text-amber-400 font-bold">{automation.waterLevel.minThreshold}%</span>
            </div>
            <div className="text-slate-300">
              • Turn Fill Pump <span className="text-slate-400 font-bold">OFF</span> when target{' '}
              <span className="text-cyan-400 font-bold">{automation.waterLevel.targetThreshold}%</span> is reached
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">Trigger Threshold</span>
              <span className="text-amber-400 font-bold">{automation.waterLevel.minThreshold}%</span>
            </div>
            <input
              type="range"
              min="35"
              max="65"
              step="5"
              value={automation.waterLevel.minThreshold}
              onChange={(e) =>
                updateAutomation({
                  waterLevel: {
                    ...automation.waterLevel,
                    minThreshold: parseInt(e.target.value),
                  },
                })
              }
              className="w-full h-2 bg-ocean-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>
        </div>

        {/* Light Schedule */}
        <div className="glass-panel rounded-2xl p-5 border border-ocean-700/60 space-y-4">
          <div className="flex items-center justify-between border-b border-ocean-800 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
                <Sun className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Aquarium Light Schedule</h3>
                <p className="text-xs text-slate-400">Daily photoperiod timing</p>
              </div>
            </div>

            <button
              onClick={() =>
                updateAutomation({
                  lighting: {
                    ...automation.lighting,
                    enabled: !automation.lighting.enabled,
                  },
                })
              }
              className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                automation.lighting.enabled ? 'text-cyan-400' : 'text-slate-600'
              }`}
            >
              {automation.lighting.enabled ? (
                <ToggleRight className="w-8 h-8" />
              ) : (
                <ToggleLeft className="w-8 h-8" />
              )}
            </button>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono text-slate-400">
              <span>00:00</span>
              <span className="text-sky-300 font-bold">Light ON: 18:00 – 22:00</span>
              <span>24:00</span>
            </div>
            <div className="w-full h-5 bg-ocean-950 rounded-lg border border-ocean-800 flex overflow-hidden p-0.5">
              <div className="h-full bg-ocean-950 w-[75%]" />
              <div className="h-full bg-sky-400 rounded w-[16.6%] flex items-center justify-center text-[10px] font-mono font-bold text-ocean-950">
                ON
              </div>
              <div className="h-full bg-ocean-950 w-[8.4%]" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-3 rounded-xl bg-ocean-900 border border-ocean-800">
              <span className="text-slate-500 block text-[10px]">ON TIME</span>
              <span className="text-white font-bold">{automation.lighting.onTime}</span>
            </div>
            <div className="p-3 rounded-xl bg-ocean-900 border border-ocean-800">
              <span className="text-slate-500 block text-[10px]">OFF TIME</span>
              <span className="text-white font-bold">{automation.lighting.offTime}</span>
            </div>
          </div>
        </div>

        {/* Oxygen Pump Schedule */}
        <div className="glass-panel rounded-2xl p-5 border border-ocean-700/60 space-y-4">
          <div className="flex items-center justify-between border-b border-ocean-800 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                <Wind className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Oxygen Pump Schedule</h3>
                <p className="text-xs text-slate-400">Daily aeration operating hours</p>
              </div>
            </div>

            <button
              onClick={() =>
                updateAutomation({
                  oxygenPump: {
                    ...automation.oxygenPump,
                    enabled: !automation.oxygenPump.enabled,
                  },
                })
              }
              className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                automation.oxygenPump.enabled ? 'text-cyan-400' : 'text-slate-600'
              }`}
            >
              {automation.oxygenPump.enabled ? (
                <ToggleRight className="w-8 h-8" />
              ) : (
                <ToggleLeft className="w-8 h-8" />
              )}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-3 rounded-xl bg-ocean-900 border border-ocean-800">
              <span className="text-slate-500 block text-[10px]">START TIME</span>
              <span className="text-cyan-300 font-bold">{automation.oxygenPump.onTime}</span>
            </div>
            <div className="p-3 rounded-xl bg-ocean-900 border border-ocean-800">
              <span className="text-slate-500 block text-[10px]">STOP TIME</span>
              <span className="text-cyan-300 font-bold">{automation.oxygenPump.offTime}</span>
            </div>
          </div>

          <div className="text-xs font-mono text-slate-400">
            Current Schedule: <span className="text-white font-bold">06:00 – 22:00</span>
          </div>
        </div>
      </div>
    </div>
  );
};
