import React, { useState, useEffect, useCallback } from 'react';
import { useAquavista } from '../context/AquavistaContext';
import { ShieldAlert, Lock, Unlock, X, Delete, KeyRound, AlertCircle, CheckCircle2 } from 'lucide-react';

export const SecurityPinModal: React.FC = () => {
  const {
    isPinModalOpen,
    pinModalPurpose,
    closePinModal,
    unlockControls,
  } = useAquavista();

  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState(false);

  // Reset when modal opens
  useEffect(() => {
    if (isPinModalOpen) {
      setPin('');
      setErrorMsg(null);
      setSuccessMsg(false);
    }
  }, [isPinModalOpen]);

  // Handle PIN submission
  const handleSubmitPin = useCallback((pinToTest: string) => {
    if (pinToTest.length !== 4) return;

    const ok = unlockControls(pinToTest);
    if (ok) {
      setSuccessMsg(true);
      setErrorMsg(null);
    } else {
      setErrorMsg('Incorrect Passcode. Access Denied.');
      setPin('');
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try { navigator.vibrate(200); } catch {}
      }
    }
  }, [unlockControls]);

  // Add digit
  const handleDigit = useCallback((d: string) => {
    if (pin.length >= 4) return;
    setErrorMsg(null);
    const nextPin = pin + d;
    setPin(nextPin);
    if (nextPin.length === 4) {
      setTimeout(() => handleSubmitPin(nextPin), 150);
    }
  }, [pin, handleSubmitPin]);

  // Backspace
  const handleBackspace = useCallback(() => {
    setErrorMsg(null);
    setPin(prev => prev.slice(0, -1));
  }, []);

  // Clear
  const handleClear = useCallback(() => {
    setErrorMsg(null);
    setPin('');
  }, []);

  // Physical keyboard support
  useEffect(() => {
    if (!isPinModalOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        closePinModal();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isPinModalOpen, handleDigit, handleBackspace, closePinModal]);

  if (!isPinModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ocean-950/80 backdrop-blur-md animate-fade-in">
      <div 
        className="w-full max-w-sm rounded-3xl bg-gradient-to-b from-ocean-900 to-ocean-950 border border-cyan-500/30 p-6 shadow-2xl shadow-cyan-950/60 relative overflow-hidden text-center"
        onClick={e => e.stopPropagation()}
      >
        {/* Glow ambient accent */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={closePinModal}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-ocean-800/60 transition-colors"
          title="Cancel"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Security Icon */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mb-4 shadow-inner shadow-cyan-500/20">
          {successMsg ? (
            <Unlock className="w-8 h-8 text-emerald-400 animate-bounce" />
          ) : (
            <Lock className="w-8 h-8 text-cyan-400 animate-pulse" />
          )}
        </div>

        {/* Title & Info */}
        <h3 className="text-xl font-bold text-white tracking-wide">
          Security Passcode
        </h3>
        <p className="text-xs text-slate-400 mt-1 max-w-[280px] mx-auto">
          Enter 4-digit PIN to authorize <span className="text-cyan-300 font-semibold">{pinModalPurpose}</span>
        </p>

        {/* 4-Digit Indicator Dots */}
        <div className="flex justify-center items-center gap-4 my-6">
          {[0, 1, 2, 3].map(idx => {
            const isFilled = pin.length > idx;
            return (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                  successMsg
                    ? 'bg-emerald-400 border-emerald-400 shadow-md shadow-emerald-500/40 scale-110'
                    : errorMsg
                    ? 'bg-rose-500 border-rose-500 shadow-md shadow-rose-500/40'
                    : isFilled
                    ? 'bg-cyan-400 border-cyan-400 shadow-md shadow-cyan-500/50 scale-110'
                    : 'bg-ocean-950 border-ocean-700'
                }`}
              />
            );
          })}
        </div>

        {/* Status Alert */}
        {errorMsg && (
          <div className="flex items-center justify-center gap-1.5 text-xs text-rose-400 font-semibold mb-3 bg-rose-950/40 border border-rose-500/30 rounded-lg py-1 px-3 animate-shake">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-400 font-semibold mb-3 bg-emerald-950/40 border border-emerald-500/30 rounded-lg py-1 px-3">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>Authorized! Executing action...</span>
          </div>
        )}

        {/* Numeric On-Screen Keypad */}
        <div className="grid grid-cols-3 gap-2.5 max-w-[260px] mx-auto mb-4">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
            <button
              key={num}
              onClick={() => handleDigit(num)}
              disabled={successMsg}
              className="h-12 rounded-xl bg-ocean-800/60 hover:bg-ocean-700/80 active:bg-cyan-500/20 active:border-cyan-500/40 border border-ocean-700/50 text-white font-mono text-lg font-bold transition-all shadow-sm flex items-center justify-center"
            >
              {num}
            </button>
          ))}
          <button
            onClick={handleClear}
            disabled={successMsg}
            className="h-12 rounded-xl bg-ocean-900/60 hover:bg-ocean-800/80 border border-ocean-700/40 text-slate-400 hover:text-white font-mono text-xs font-semibold transition-all flex items-center justify-center"
          >
            CLEAR
          </button>
          <button
            onClick={() => handleDigit('0')}
            disabled={successMsg}
            className="h-12 rounded-xl bg-ocean-800/60 hover:bg-ocean-700/80 active:bg-cyan-500/20 active:border-cyan-500/40 border border-ocean-700/50 text-white font-mono text-lg font-bold transition-all shadow-sm flex items-center justify-center"
          >
            0
          </button>
          <button
            onClick={handleBackspace}
            disabled={successMsg}
            className="h-12 rounded-xl bg-ocean-900/60 hover:bg-ocean-800/80 border border-ocean-700/40 text-slate-400 hover:text-rose-400 transition-all flex items-center justify-center"
            title="Backspace"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Helper Hint */}
        <p className="text-[11px] text-slate-500 font-mono">
          Default Passcode: <span className="text-cyan-400 font-bold">1986</span>
          <br />
          <span className="text-slate-600">(Changeable anytime in Settings)</span>
        </p>
      </div>
    </div>
  );
};
