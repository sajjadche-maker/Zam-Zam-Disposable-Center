import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, X, CheckCircle, ShieldCheck } from 'lucide-react';

interface InstallAppBannerProps {
  onOpenManualGuide: () => void;
}

export const InstallAppBanner: React.FC<InstallAppBannerProps> = ({ onOpenManualGuide }) => {
  const { isInstallable, isInstalled, install, isIOS } = usePWAInstall();
  const [isDismissed, setIsDismissed] = useState(false);

  // If already running as an installed standalone app, do not show
  if (isInstalled || isDismissed) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const ok = await install();
      if (!ok) {
        onOpenManualGuide();
      }
    } else {
      // If browser hasn't fired beforeinstallprompt or is iOS / unsupported, open guide
      onOpenManualGuide();
    }
  };

  return (
    <aside
      aria-label="App installation banner"
      className="bg-gradient-to-r from-emerald-900/90 via-slate-900 to-slate-900 border-b border-emerald-500/30 px-3 sm:px-6 py-2.5 text-white shadow-md relative z-30 transition-all no-print"
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white p-0.5 border border-emerald-500/40 flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
            <img src="/zamzam_logo.png" alt="ZamZam Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-bold text-white tracking-tight">
                ZamZam Khata App Mobile Mein Install Karein
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/30 text-emerald-300 uppercase">
                Play Store App
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-tight mt-0.5">
              Mobile par install kar ke har waqt bina internet (offline) foran chalayein.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={handleInstallClick}
            className="flex-1 sm:flex-initial px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg text-xs font-black transition shadow flex items-center justify-center gap-1.5 whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>📲 Mobile Mein Install Karein</span>
          </button>

          <button
            onClick={() => setIsDismissed(true)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
