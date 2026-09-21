import React from 'react';
import { useAquavista } from '../context/AquavistaContext';
import { ShieldAlert, X } from 'lucide-react';

export const SafetyInterlockBanner: React.FC = () => {
  const { safetyNotice, clearSafetyNotice } = useAquavista();

  if (!safetyNotice) return null;

  return (
    <div className="mx-4 sm:mx-8 mb-4 p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/40 backdrop-blur-md flex items-center justify-between gap-3 shadow-lg animate-fadeIn">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-500/30 flex items-center justify-center shrink-0">
          <ShieldAlert className="w-4 h-4 text-rose-400" />
        </div>
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-rose-300 font-mono">
            Safety Interlock Activated
          </h4>
          <p className="text-xs text-rose-100 font-medium">
            {safetyNotice}
          </p>
        </div>
      </div>
      <button
        onClick={clearSafetyNotice}
        className="p-1.5 rounded-lg text-rose-300 hover:text-white hover:bg-rose-500/20 transition-colors"
        title="Dismiss notice"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
