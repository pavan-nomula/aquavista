import React from 'react';
import { SensorStatus } from '../types/aquavista';
import { TrendingUp, TrendingDown, Minus, CheckCircle, AlertTriangle, AlertOctagon, WifiOff } from 'lucide-react';

interface SensorCardProps {
  label: string;
  value: string | number;
  unit: string;
  status: SensorStatus;
  normalRange: string;
  description?: string;
  trend?: 'up' | 'down' | 'steady';
  trendValue?: string;
  icon: React.ReactNode;
  accentColor?: string; // hex or tailwind
  sparklineData?: number[];
  onClick?: () => void;
}

export const SensorCard: React.FC<SensorCardProps> = ({
  label,
  value,
  unit,
  status,
  normalRange,
  description,
  trend = 'steady',
  trendValue,
  icon,
  sparklineData = [20, 25, 22, 28, 26, 30, 27, 29],
  onClick,
}) => {
  const getStatusBadge = () => {
    switch (status) {
      case 'normal':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle className="w-3 h-3" /> Normal
          </span>
        );
      case 'attention':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30 animate-pulse">
            <AlertTriangle className="w-3 h-3" /> Attention
          </span>
        );
      case 'critical':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-500/15 text-rose-300 border border-rose-500/30 animate-pulse">
            <AlertOctagon className="w-3 h-3" /> Critical
          </span>
        );
      case 'offline':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-700/40 text-slate-400 border border-slate-600/30">
            <WifiOff className="w-3 h-3" /> Offline
          </span>
        );
    }
  };

  // Sparkline SVG path
  const minVal = Math.min(...sparklineData);
  const maxVal = Math.max(...sparklineData);
  const range = maxVal - minVal || 1;
  const svgPoints = sparklineData
    .map((val, idx) => {
      const x = (idx / (sparklineData.length - 1)) * 60;
      const y = 20 - ((val - minVal) / range) * 16;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <div
      onClick={onClick}
      className="group relative rounded-2xl glass-card p-4 sm:p-5 flex flex-col justify-between cursor-pointer border border-ocean-700/50 hover:border-cyan-400/40 hover:shadow-aqua-glow transition-all duration-300"
    >
      {/* Top row: Icon & Status */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-ocean-800/80 border border-ocean-600/60 flex items-center justify-center text-cyan-400 group-hover:text-cyan-300 group-hover:scale-105 transition-all">
            {icon}
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-300 tracking-wide uppercase">{label}</h4>
            <p className="text-[11px] text-slate-500 font-mono">Range: {normalRange}</p>
          </div>
        </div>
        {getStatusBadge()}
      </div>

      {/* Main Metric Value */}
      <div className="flex items-baseline justify-between mt-1 mb-2">
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl sm:text-3xl font-mono font-bold text-white tracking-tight group-hover:text-cyan-100 transition-colors">
            {value}
          </span>
          <span className="text-sm font-semibold text-slate-400">{unit}</span>
        </div>

        {/* Mini Sparkline */}
        <div className="w-16 h-6">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 60 20">
            <polyline
              fill="none"
              stroke={status === 'critical' ? '#f43f5e' : status === 'attention' ? '#f59e0b' : '#00f5d4'}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={svgPoints}
            />
          </svg>
        </div>
      </div>

      {/* Footer: Trend & Clarification */}
      <div className="pt-2 border-t border-ocean-700/40 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-1 font-mono">
          {trend === 'up' && <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />}
          {trend === 'down' && <TrendingDown className="w-3.5 h-3.5 text-amber-400" />}
          {trend === 'steady' && <Minus className="w-3.5 h-3.5 text-slate-400" />}
          <span>{trendValue || 'Stable'}</span>
        </div>
        {description && (
          <span className="text-[10px] text-slate-500 truncate max-w-[170px]" title={description}>
            {description}
          </span>
        )}
      </div>
    </div>
  );
};
