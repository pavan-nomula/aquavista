import React, { useState, useEffect } from 'react';
import { Waves, CheckCircle2 } from 'lucide-react';

interface BootSplashProps {
  onComplete: () => void;
}

export const BootSplash: React.FC<BootSplashProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    const startTime = Date.now();
    const duration = 1000; // Fast, elegant 1s loading

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.floor((elapsed / duration) * 100));
      setProgress(pct);

      if (elapsed >= duration) {
        clearInterval(timer);
        setIsFading(true);
        setTimeout(onComplete, 250);
      }
    }, 30);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#070d18] transition-opacity duration-300 ${
        isFading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="relative flex flex-col items-center max-w-sm px-6 text-center">
        {/* Animated Brand Wave */}
        <div className="w-16 h-16 rounded-2xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center mb-5">
          <Waves className="w-8 h-8 text-cyan-400 animate-pulse" />
        </div>

        {/* Clean Title */}
        <h1 className="text-2xl font-display font-extrabold tracking-tight text-white mb-1">
          AQUA<span className="text-cyan-400">VISTA</span>
        </h1>
        <p className="text-xs text-slate-400 font-medium mb-6">
          Smart Aquarium Monitoring & Management System
        </p>

        {/* Progress Bar */}
        <div className="w-64 bg-ocean-900 rounded-full h-1.5 mb-3 overflow-hidden border border-ocean-800">
          <div
            className="h-full bg-cyan-400 rounded-full transition-all duration-75"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Status Message */}
        <div className="h-5 flex items-center justify-center gap-2 text-xs font-mono text-slate-400">
          {progress >= 100 ? (
            <span className="text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> Ready
            </span>
          ) : (
            <span>Connecting to aquarium controller...</span>
          )}
        </div>
      </div>
    </div>
  );
};
