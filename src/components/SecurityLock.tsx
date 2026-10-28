import React, { useState, useEffect, useCallback } from 'react';
import { useKhata } from '../context/KhataContext';
import { Lock, Fingerprint, Delete, ShieldAlert, KeyRound, CheckCircle2 } from 'lucide-react';

export const SecurityLock: React.FC = () => {
  const {
    securitySettings,
    shopSettings,
    verifyPin,
    verifyBiometrics,
    resetPinWithSecurityAnswer,
    t
  } = useKhata();

  const [enteredPin, setEnteredPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isShaking, setIsShaking] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [newPin, setNewPin] = useState('');
  const [recoveryError, setRecoveryError] = useState('');
  const [recoverySuccess, setRecoverySuccess] = useState(false);
  const [isBiometricScanning, setIsBiometricScanning] = useState(false);

  // If not locked, do not render
  if (!securitySettings.isLocked) {
    return null;
  }

  const handleDigit = useCallback((digit: string) => {
    if (enteredPin.length < 4) {
      const nextPin = enteredPin + digit;
      setEnteredPin(nextPin);
      setErrorMsg('');

      if (nextPin.length === 4) {
        // Auto-check PIN on 4th digit
        setTimeout(() => {
          const success = verifyPin(nextPin);
          if (!success) {
            setIsShaking(true);
            setErrorMsg(t.security.wrongPin);
            setTimeout(() => {
              setEnteredPin('');
              setIsShaking(false);
            }, 600);
          } else {
            setEnteredPin('');
          }
        }, 120);
      }
    }
  }, [enteredPin, verifyPin, t.security.wrongPin]);

  const handleDelete = useCallback(() => {
    setEnteredPin((prev) => prev.slice(0, -1));
    setErrorMsg('');
  }, []);

  const handleClear = useCallback(() => {
    setEnteredPin('');
    setErrorMsg('');
  }, []);

  const handleBiometricClick = async () => {
    setIsBiometricScanning(true);
    setErrorMsg('');
    try {
      const ok = await verifyBiometrics();
      if (!ok) {
        setErrorMsg('Fingerprint tasdeeq na ho saki. PIN darj karein.');
      }
    } catch {
      setErrorMsg('Fingerprint error. PIN code istemal karein.');
    } finally {
      setIsBiometricScanning(false);
    }
  };

  const handleRecoverySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError('');
    if (!securityAnswer.trim()) {
      setRecoveryError('Jawab darj karein');
      return;
    }
    if (newPin.length !== 4) {
      setRecoveryError('Naya PIN lazmi 4 hindo ka hona chahiye');
      return;
    }

    const success = resetPinWithSecurityAnswer(securityAnswer, newPin);
    if (success) {
      setRecoverySuccess(true);
      setTimeout(() => {
        setShowForgotModal(false);
        setRecoverySuccess(false);
        setSecurityAnswer('');
        setNewPin('');
      }, 1000);
    } else {
      setRecoveryError('Jawab durust nahi hai. Dobara check karein.');
    }
  };

  // Physical keyboard listener for desktop users
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showForgotModal) return;
      if (e.key >= '0' && e.key <= '9') {
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      } else if (e.key === 'Escape') {
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDigit, handleDelete, handleClear, showForgotModal]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950 p-4 select-none">
      <div
        className={`w-full max-w-sm flex flex-col items-center bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl transition-transform ${
          isShaking ? 'animate-bounce' : ''
        }`}
      >
        {/* App Lock Emblem */}
        <div className="w-20 h-20 rounded-2xl bg-white p-1 border-2 border-emerald-500/40 flex items-center justify-center shadow-xl mb-3 overflow-hidden">
          <img src="/zamzam_logo.png" alt="ZamZam Logo" className="w-full h-full object-contain" />
        </div>

        <h1 className="text-xl font-bold text-white text-center tracking-tight">
          {shopSettings.businessName}
        </h1>
        <p className="text-xs text-slate-400 mt-1 text-center">
          {t.security.enterPinToUnlock}
        </p>

        {/* 4 PIN Dots */}
        <div className="flex items-center justify-center gap-4 my-6">
          {[0, 1, 2, 3].map((idx) => {
            const isFilled = enteredPin.length > idx;
            return (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full transition-all duration-150 ${
                  isFilled
                    ? 'bg-emerald-400 scale-110 shadow-[0_0_12px_rgba(52,211,153,0.6)]'
                    : 'border-2 border-slate-700 bg-slate-800'
                }`}
              />
            );
          })}
        </div>

        {/* Error message */}
        {errorMsg && (
          <p className="text-xs text-rose-400 font-medium text-center mb-4 min-h-[1.25rem]">
            {errorMsg}
          </p>
        )}
        {!errorMsg && <div className="min-h-[1.25rem] mb-4" />}

        {/* Keypad Grid */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-[280px]">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigit(digit)}
              className="h-14 rounded-xl bg-slate-800/80 hover:bg-slate-700 active:bg-slate-600 text-white text-xl font-semibold transition flex items-center justify-center border border-slate-700/50 shadow-sm"
            >
              {digit}
            </button>
          ))}

          {/* Biometric / Clear Button */}
          {securitySettings.biometricsEnabled ? (
            <button
              type="button"
              onClick={handleBiometricClick}
              disabled={isBiometricScanning}
              title={t.security.useFingerprint}
              className={`h-14 rounded-xl text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/10 active:bg-emerald-500/20 transition flex flex-col items-center justify-center ${
                isBiometricScanning ? 'animate-pulse' : ''
              }`}
            >
              <Fingerprint className="w-6 h-6" />
              <span className="text-[10px] mt-0.5 text-emerald-300">Biometric</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleClear}
              className="h-14 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-medium transition flex items-center justify-center"
            >
              Clear
            </button>
          )}

          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="h-14 rounded-xl bg-slate-800/80 hover:bg-slate-700 active:bg-slate-600 text-white text-xl font-semibold transition flex items-center justify-center border border-slate-700/50 shadow-sm"
          >
            0
          </button>

          <button
            type="button"
            onClick={handleDelete}
            title="Delete"
            className="h-14 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 active:bg-slate-700 transition flex items-center justify-center border border-slate-700/30"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Forgot PIN / Recovery link */}
        <div className="mt-6 flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={() => setShowForgotModal(true)}
            className="text-xs text-slate-400 hover:text-emerald-400 transition underline underline-offset-4"
          >
            {t.security.forgotPin}
          </button>
        </div>
      </div>

      {/* Forgot PIN Recovery Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center gap-3 text-amber-400 mb-4">
              <KeyRound className="w-6 h-6 shrink-0" />
              <h2 className="text-lg font-bold text-white">
                {t.security.forgotPin}
              </h2>
            </div>

            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              {t.security.securityQuestionDesc}
            </p>

            <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 mb-4">
              <span className="text-xs text-slate-400 block mb-1">
                {t.security.securityQuestion}:
              </span>
              <p className="text-sm font-medium text-amber-200">
                {securitySettings.securityQuestion}
              </p>
            </div>

            {recoverySuccess ? (
              <div className="p-4 bg-emerald-950/60 border border-emerald-500/30 rounded-xl text-emerald-300 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span className="text-sm font-medium">PIN kamyabi se tabdeel aur unlock ho gaya!</span>
              </div>
            ) : (
              <form onSubmit={handleRecoverySubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    {t.security.securityAnswer}
                  </label>
                  <input
                    type="text"
                    required
                    value={securityAnswer}
                    onChange={(e) => setSecurityAnswer(e.target.value)}
                    placeholder="Apna jawab likhein (e.g. lahore)"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Naya 4-Digit PIN Code
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    required
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="4 hindo ka naya PIN (e.g. 1234)"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm font-mono tracking-widest focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {recoveryError && (
                  <p className="text-xs text-rose-400 flex items-center gap-1.5 font-medium">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    {recoveryError}
                  </p>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotModal(false);
                      setRecoveryError('');
                    }}
                    className="flex-1 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700 transition"
                  >
                    {t.common.cancel}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-500 transition shadow-sm"
                  >
                    PIN Reset & Unlock
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
