import React from 'react';
import { useAquavista } from '../context/AquavistaContext';
import { ActiveTab } from '../types/aquavista';
import {
  LayoutDashboard,
  Activity,
  Droplets,
  Power,
  CalendarClock,
  Zap,
  BellRing,
  Settings,
  Wifi,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, alerts, connectionStatus } = useAquavista();

  const navItems: Array<{ id: ActiveTab; label: string; icon: React.ReactNode; badge?: number }> = [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'monitoring', label: 'Monitoring', icon: <Activity className="w-4 h-4" /> },
    { id: 'water', label: 'Water Management', icon: <Droplets className="w-4 h-4" /> },
    { id: 'devices', label: 'Devices', icon: <Power className="w-4 h-4" /> },
    { id: 'schedules', label: 'Schedules', icon: <CalendarClock className="w-4 h-4" /> },
    { id: 'energy', label: 'Energy', icon: <Zap className="w-4 h-4" /> },
    {
      id: 'alerts',
      label: 'Alerts',
      icon: <BellRing className="w-4 h-4" />,
      badge: alerts.filter(a => !a.read).length,
    },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <aside className="w-full lg:w-56 bg-ocean-950/90 lg:min-h-[calc(100vh-65px)] border-r border-ocean-700/50 flex flex-col justify-between p-3 sm:p-4 shrink-0">
      {/* Navigation list */}
      <div className="space-y-1">
        <div className="px-3 py-1.5 text-[11px] font-mono font-semibold text-slate-500 uppercase tracking-wider">
          Menu
        </div>

        <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 scrollbar-none">
          {navItems.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-ocean-800/50 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={isActive ? 'text-cyan-400' : 'text-slate-400'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="px-1.5 py-0.2 text-[10px] font-bold font-mono rounded-full bg-rose-500 text-white">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Clean controller footer */}
      <div className="hidden lg:block pt-3 border-t border-ocean-800/80">
        <div className="p-2.5 rounded-xl bg-ocean-900 border border-ocean-800 text-xs font-mono space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Controller:</span>
            <span className="text-white font-bold">ESP32</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Status:</span>
            <span className={connectionStatus === 'connected' ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
              {connectionStatus === 'connected' ? 'Connected' : 'Offline'}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};
