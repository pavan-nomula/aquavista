import React, { useState } from 'react';
import { useAquavista } from '../context/AquavistaContext';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Thermometer,
  Droplets,
  Layers,
  Sun,
} from 'lucide-react';

export const LiveMonitoringView: React.FC = () => {
  const { telemetry, telemetryHistory } = useAquavista();
  const [selectedSensor, setSelectedSensor] = useState<'temperature' | 'waterLevel' | 'tds' | 'lightLevel'>('temperature');
  const [timeRange, setTimeRange] = useState<'24h' | '7d'>('24h');

  const sensorConfigs = {
    temperature: {
      label: 'Water Temperature',
      unit: '°C',
      color: '#f43f5e',
      gradientId: 'tempGrad',
      domain: [22, 30],
      current: telemetry.temperature.toFixed(1),
      normalRange: '24.5°C – 27.5°C',
      desc: 'Aquarium water temperature monitored for tropical biotope stability.',
    },
    waterLevel: {
      label: 'Water Level',
      unit: '%',
      color: '#00f5d4',
      gradientId: 'levelGrad',
      domain: [0, 100],
      current: telemetry.waterLevel.toFixed(1),
      normalRange: '70% – 85%',
      desc: 'Current aquarium water level. Safe minimum cutoff for heater is 30%.',
    },
    tds: {
      label: 'TDS (Total Dissolved Solids)',
      unit: 'ppm',
      color: '#f59e0b',
      gradientId: 'tdsGrad',
      domain: [150, 450],
      current: telemetry.tds,
      normalRange: '150 – 320 ppm',
      desc: 'Water Quality Indicator. Reflects dissolved solids and minerals in aquarium water.',
    },
    lightLevel: {
      label: 'Ambient Light (LDR)',
      unit: 'lux',
      color: '#fbbf24',
      gradientId: 'luxGrad',
      domain: [0, 700],
      current: telemetry.lightLevel,
      normalRange: '200 – 600 lux',
      desc: 'LDR light sensor monitoring ambient room brightness for lighting schedules.',
    },
  };

  const currentConfig = sensorConfigs[selectedSensor];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Sensor Telemetry & Trends</h2>
          <p className="text-xs text-slate-400 font-medium">
            Real-time telemetry from the 4 onboard monitoring sensors
          </p>
        </div>

        {/* Time range selector */}
        <div className="flex items-center gap-1 bg-ocean-900 p-1 rounded-xl border border-ocean-700 self-start sm:self-auto">
          <button
            onClick={() => setTimeRange('24h')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
              timeRange === '24h'
                ? 'bg-cyan-500 text-ocean-950 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Past 24 Hours
          </button>
          <button
            onClick={() => setTimeRange('7d')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
              timeRange === '7d'
                ? 'bg-cyan-500 text-ocean-950 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            7 Days
          </button>
        </div>
      </div>

      {/* 4 Sensor Cards Selector */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {(Object.keys(sensorConfigs) as Array<keyof typeof sensorConfigs>).map(key => {
          const cfg = sensorConfigs[key];
          const isSelected = selectedSensor === key;
          return (
            <div
              key={key}
              onClick={() => setSelectedSensor(key)}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                isSelected
                  ? 'bg-ocean-800 border-cyan-400 shadow-sm'
                  : 'bg-ocean-900 border-ocean-800 hover:border-ocean-700'
              }`}
            >
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 truncate">
                {cfg.label}
              </div>
              <div className="text-2xl font-mono font-bold text-white">
                {cfg.current} <span className="text-xs text-slate-400 font-normal">{cfg.unit}</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Normal: {cfg.normalRange}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Sensor Chart */}
      <div className="glass-panel rounded-2xl p-5 border border-ocean-700/60 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-ocean-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              {currentConfig.label} Trend
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                {currentConfig.unit}
              </span>
            </h3>
            <p className="text-xs text-slate-400">{currentConfig.desc}</p>
          </div>

          <div className="text-xs font-mono text-slate-400">
            Target Range: <span className="text-white font-bold">{currentConfig.normalRange}</span>
          </div>
        </div>

        {/* Recharts Area Chart */}
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={telemetryHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id={currentConfig.gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={currentConfig.color} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={currentConfig.color} stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="timeLabel" stroke="#64748b" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis domain={currentConfig.domain} stroke="#64748b" tick={{ fontSize: 11, fill: '#64748b' }} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="p-3 rounded-xl bg-ocean-950 border border-ocean-700 text-xs font-mono">
                        <p className="text-slate-400 mb-1">Time: {label}</p>
                        <p className="text-white font-bold text-sm">
                          {payload[0].value} {currentConfig.unit}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey={selectedSensor}
                stroke={currentConfig.color}
                strokeWidth={2.5}
                fillOpacity={1}
                fill={`url(#${currentConfig.gradientId})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
