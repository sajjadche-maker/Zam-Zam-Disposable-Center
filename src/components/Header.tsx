import React, { useState } from 'react';
import { useKhata } from '../context/KhataContext';
import { usePWAInstall } from '../hooks/usePWAInstall';
import {
  Lock,
  Download,
  Wifi,
  WifiOff,
  Globe,
  Plus,
  Smartphone
} from 'lucide-react';
import { Language } from '../types';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenQuickSale: () => void;
  onOpenMobileGuide: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenQuickSale,
  onOpenMobileGuide,
}) => {
  const { shopSettings, language, setLanguage, securitySettings, lockApp, t } = useKhata();
  const { isInstallable, install, isIOS } = usePWAInstall();
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const navItems = [
    { id: 'dashboard', label: t.tabs.dashboard },
    { id: 'sales', label: t.tabs.sales },
    { id: 'expenses', label: t.tabs.expenses },
    { id: 'stock', label: t.tabs.stock },
    { id: 'khata', label: t.tabs.khata },
    { id: 'reports', label: t.tabs.reports },
    { id: 'settings', label: t.tabs.settings },
  ];

  const handleLangToggle = () => {
    const sequence: Language[] = ['roman_urdu', 'urdu', 'english'];
    const nextIdx = (sequence.indexOf(language) + 1) % sequence.length;
    setLanguage(sequence[nextIdx]);
  };

  const getLangBadge = () => {
    if (language === 'urdu') return 'اردو';
    if (language === 'english') return 'ENG';
    return 'Roman Urdu';
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4 md:gap-8">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-2.5 text-left group focus:outline-none"
          >
            <div className="w-10 h-10 rounded-xl bg-white p-0.5 flex items-center justify-center shadow-sm border border-slate-700/80 overflow-hidden shrink-0 group-hover:border-emerald-500 transition">
              <img src="/zamzam_logo.png" alt="ZamZam Logo" className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col min-w-0 max-w-[190px] sm:max-w-none">
              <span className="text-sm sm:text-base font-bold text-white tracking-tight leading-none group-hover:text-emerald-400 transition truncate sm:whitespace-nowrap">
                {shopSettings.businessName || t.appName}
              </span>
              <span className="text-[11px] text-slate-400 font-medium leading-tight whitespace-nowrap mt-0.5 truncate">
                {shopSettings.phone ? `WhatsApp: ${shopSettings.phone}` : (language === 'urdu' ? 'ڈسپوزیبل و شاپنگ بیگز' : 'Digital Khata')}
              </span>
            </div>
          </button>

          {/* Offline / Online Micro-Indicator */}
          <div
            className={`hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium ${
              isOnline
                ? 'text-emerald-400 bg-emerald-950/40 border border-emerald-500/20'
                : 'text-amber-400 bg-amber-950/50 border border-amber-500/30'
            }`}
            title={isOnline ? 'Online / Device Local' : 'Offline Mode Active'}
          >
            {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            <span>{isOnline ? 'Offline Ready' : 'Offline'}</span>
          </div>
        </div>

        {/* Zone 2: Navigation Links (Desktop) */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                  isActive
                    ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700/80'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Actions (Quick Sale, Language, Lock, PWA) */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Quick Sale CTA */}
          <button
            onClick={onOpenQuickSale}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition shadow-sm whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden sm:inline">{t.dashboard.newSale}</span>
            <span className="sm:hidden">Bikri</span>
          </button>

          {/* Mobile Setup Guide Button */}
          <button
            onClick={onOpenMobileGuide}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-sky-300 rounded-lg text-xs font-semibold border border-sky-500/30 transition whitespace-nowrap shrink-0"
            title="Mobile Par App Chalane Ka Tareeqa & QR Code"
          >
            <Smartphone className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden md:inline">Mobile App</span>
          </button>

          {/* Download HTML Single File */}
          <a
            href="/zamzam_disposable.html"
            download="ZamZam_Disposable_App.html"
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 rounded-lg text-xs font-semibold border border-emerald-500/30 transition whitespace-nowrap shrink-0"
            title="Download Standalone Single-File HTML"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden lg:inline">Save HTML</span>
          </a>

          {/* Language Switcher */}
          <button
            onClick={handleLangToggle}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700/60 transition whitespace-nowrap shrink-0"
            title="Switch Language (Roman Urdu / اردو / English)"
          >
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px] font-semibold">{getLangBadge()}</span>
          </button>

          {/* Quick Lock Button */}
          {securitySettings.pinEnabled && (
            <button
              onClick={lockApp}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 border border-slate-700/60 transition"
              title={t.security.lockNow}
            >
              <Lock className="w-4 h-4" />
            </button>
          )}

          {/* PWA Install Button (Chromium / Desktop) */}
          {isInstallable && (
            <button
              onClick={install}
              className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/30 text-emerald-300 text-xs font-medium transition"
              title="Install App on Device"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install</span>
            </button>
          )}

          {/* iOS Install Guide trigger */}
          {isIOS && (
            <button
              onClick={() => setShowIOSPrompt(true)}
              className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-medium transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>iOS</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="lg:hidden flex items-center overflow-x-auto no-scrollbar px-3 py-2 border-t border-slate-800/80 gap-1 bg-slate-900/90">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition ${
                isActive
                  ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {/* iOS Safari Install Guide Modal */}
      {showIOSPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-slate-200">
            <h3 className="text-base font-bold text-white mb-2">
              iPhone / iPad Par Install Karein
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              1. Safari browser ke niche <strong>Share</strong> (تیر کا نشان) بٹن دبائیں۔<br />
              2. فہرست میں نیچے جا کر <strong>Add to Home Screen</strong> منتخب کریں۔
            </p>
            <button
              onClick={() => setShowIOSPrompt(false)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold text-white transition"
            >
              Theek Hai (Close)
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
