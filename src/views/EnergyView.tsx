import React, { useState } from 'react';
import { useAquavista } from '../context/AquavistaContext';
import {
  Zap,
  Leaf,
  Clock,
  BarChart3,
  PieChart as PieIcon,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export const EnergyView: React.FC = () => {
  const { energy, toggleEnergySavingMode } = useAquavista();
  const [timeFilter, setTimeFilter] = useState<'today' | '7d' | '30d'>('today');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Zap className="w-5 h-5 text-cyan-400" />
            Energy Management
          </h2>
          <p className="text-xs text-slate-400 font-medium">
            Track daily device runtimes and estimated energy consumption
          </p>
        </div>

        {/* Energy Saving Mode Toggle */}
        <button
          onClick={toggleEnergySavingMode}
          className={`px-4 py-2 rounded-xl text-xs font-bold font-mono flex items-center gap-2 transition-all ${
            energy.energySavingMode
              ? 'bg-emerald-500 text-ocean-950 font-bold shadow-sm'
              : 'bg-ocean-900 border border-ocean-700 text-slate-300 hover:text-white'
          }`}
        >
          <Leaf className="w-4 h-4" />
          <span>{energy.energySavingMode ? 'ENERGY SAVING ACTIVE' : 'ENERGY SAVING MODE'}</span>
        </button>
      </div>

      {/* Hero Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel rounded-2xl p-5 border border-ocean-700/60">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-1">
            <span>Today's Energy</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-ocean-900 text-cyan-300 border border-ocean-800">
              Estimated
            </span>
          </div>
          <div className="text-3xl font-mono font-bold text-white">
            {energy.todayWh} <span className="text-sm font-normal text-slate-400">Wh</span>
          </div>
          <p className="text-[11px] text-slate-500 font-mono mt-1">Power rating × Device runtime</p>
        </div>

        <div className="glass-panel rounded-2xl p-5 border border-ocean-700/60">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-1">
            <span>This Week</span>
            <Clock className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-3xl font-mono font-bold text-white">
            {energy.thisWeekKwh} <span className="text-sm font-normal text-slate-400">kWh</span>
          </div>
          <p className="text-[11px] text-slate-500 font-mono mt-1">7-Day total</p>
        </div>

        <div className="glass-panel rounded-2xl p-5 border border-ocean-700/60">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-1">
            <span>This Month</span>
            <Zap className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-mono font-bold text-white">
            {energy.thisMonthKwh} <span className="text-sm font-normal text-slate-400">kWh</span>
          </div>
          <p className="text-[11px] text-slate-500 font-mono mt-1">Monthly estimated total</p>
        </div>
      </div>

      {/* Device Breakdown & Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Device Breakdown List */}
        <div className="glass-panel rounded-2xl p-5 border border-ocean-700/60 space-y-4">
          <div className="flex items-center justify-between border-b border-ocean-800 pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-cyan-400" />
              Device Breakdown
            </h3>
            <span className="text-xs font-mono text-slate-400">Total: {energy.todayWh} Wh</span>
          </div>

          <div className="space-y-3">
            {energy.deviceBreakdown.map(item => (
              <div key={item.device} className="p-3 rounded-xl bg-ocean-900 border border-ocean-800">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-white">{item.label}</span>
                  <span className="font-mono font-bold text-white">{item.energyWh} Wh</span>
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>Runtime: {item.runtimeFormatted}</span>
                  <span>{item.percentage}%</span>
                </div>
                <div className="w-full bg-ocean-950 rounded-full h-1.5 mt-2 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hourly Profile Histogram */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-5 border border-ocean-700/60 space-y-4">
          <div className="flex items-center justify-between border-b border-ocean-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-cyan-400" />
                Hourly Energy Consumption
              </h3>
              <p className="text-xs text-slate-400">Cumulative hourly device energy</p>
            </div>

            {/* Filter pills */}
            <div className="flex gap-1 bg-ocean-900 p-1 rounded-lg border border-ocean-800 text-[11px] font-mono">
              {(['today', '7d', '30d'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setTimeFilter(f)}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    timeFilter === f ? 'bg-cyan-500 text-ocean-950 font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {f === 'today' ? 'Today' : f === '7d' ? '7 Days' : '30 Days'}
                </button>
              ))}
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={energy.history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="p-3 rounded-xl bg-ocean-950 border border-ocean-700 text-xs font-mono space-y-1">
                          <p className="text-slate-400 font-bold mb-1">Time: {label}</p>
                          <p className="text-rose-400">Heater: {payload.find(p => p.dataKey === 'heater')?.value} Wh</p>
                          <p className="text-sky-300">Light: {payload.find(p => p.dataKey === 'light')?.value} Wh</p>
                          <p className="text-cyan-300">Oxygen: {payload.find(p => p.dataKey === 'oxygenPump')?.value} Wh</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="heater" stackId="a" fill="#f43f5e" />
                <Bar dataKey="light" stackId="a" fill="#38bdf8" />
                <Bar dataKey="oxygenPump" stackId="a" fill="#00f5d4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <p className="text-[11px] text-slate-500 font-mono">
            * Energy calculation is estimated via device rated power × runtime hours.
          </p>
        </div>
      </div>
    </div>
  );
};
