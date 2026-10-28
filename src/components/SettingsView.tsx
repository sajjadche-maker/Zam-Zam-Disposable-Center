import React, { useState, useRef } from 'react';
import { useKhata } from '../context/KhataContext';
import { usePWAInstall } from '../hooks/usePWAInstall';
import {
  Shield,
  Lock,
  Fingerprint,
  Download,
  Upload,
  RefreshCw,
  Trash2,
  Store,
  Globe,
  Wifi,
  Smartphone,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Language } from '../types';

export const SettingsView: React.FC = () => {
  const {
    shopSettings,
    updateShopSettings,
    securitySettings,
    updateSecuritySettings,
    lockApp,
    language,
    setLanguage,
    exportBackup,
    importBackup,
    reloadDemoData,
    wipeAllData,
    t
  } = useKhata();

  const { isInstallable, install, isInstalled, isIOS } = usePWAInstall();

  // Business Profile Form
  const [businessName, setBusinessName] = useState(shopSettings.businessName);
  const [businessNameUrdu, setBusinessNameUrdu] = useState(shopSettings.businessNameUrdu || '');
  const [ownerName, setOwnerName] = useState(shopSettings.ownerName);
  const [phone, setPhone] = useState(shopSettings.phone);
  const [phone2, setPhone2] = useState(shopSettings.phone2 || '03129077476');
  const [address, setAddress] = useState(shopSettings.address);
  const [currency, setCurrency] = useState(shopSettings.currency);
  const [invoiceNote, setInvoiceNote] = useState(shopSettings.invoiceFooterNote);
  const [profileSavedMsg, setProfileSavedMsg] = useState(false);

  // Security Form
  const [pinEnabled, setPinEnabled] = useState(securitySettings.pinEnabled);
  const [pinCode, setPinCode] = useState(securitySettings.pinCode);
  const [biometricsEnabled, setBiometricsEnabled] = useState(securitySettings.biometricsEnabled);
  const [autoLockMinutes, setAutoLockMinutes] = useState(securitySettings.autoLockMinutes);
  const [securityQuestion, setSecurityQuestion] = useState(securitySettings.securityQuestion);
  const [securityAnswer, setSecurityAnswer] = useState(securitySettings.securityAnswer);
  const [securitySavedMsg, setSecuritySavedMsg] = useState(false);

  // Backup file ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [backupMsg, setBackupMsg] = useState<{ text: string; error?: boolean } | null>(null);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateShopSettings({
      businessName,
      businessNameUrdu: businessNameUrdu || undefined,
      ownerName,
      phone,
      phone2: phone2 || undefined,
      address,
      currency,
      invoiceFooterNote: invoiceNote,
    });
    setProfileSavedMsg(true);
    setTimeout(() => setProfileSavedMsg(false), 2500);
  };

  const handleSaveSecurity = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinCode.length !== 4) {
      alert('PIN Code lazmi 4 hindo ka hona chahiye (e.g. 1234)');
      return;
    }
    updateSecuritySettings({
      pinEnabled,
      pinCode,
      biometricsEnabled,
      autoLockMinutes,
      securityQuestion,
      securityAnswer,
    });
    setSecuritySavedMsg(true);
    setTimeout(() => setSecuritySavedMsg(false), 2500);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await importBackup(file);
      setBackupMsg({ text: 'Backup kamyabi se restore ho gaya!' });
    } catch (err) {
      setBackupMsg({ text: 'Backup file ghalat hai ya corrupt hai.', error: true });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
      setTimeout(() => setBackupMsg(null), 4000);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* 1. Security & Lock Settings (Top Priority per user prompt) */}
      <div className="p-5 sm:p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>{t.security.title}</span>
                {securitySettings.pinEnabled && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/30 font-semibold">
                    {t.security.enabled}
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">
                {t.security.subtitle}
              </p>
            </div>
          </div>

          {securitySettings.pinEnabled && (
            <button
              onClick={lockApp}
              className="px-3.5 py-2 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 self-start sm:self-auto"
            >
              <Lock className="w-4 h-4" />
              <span>{t.security.lockNow}</span>
            </button>
          )}
        </div>

        <form onSubmit={handleSaveSecurity} className="space-y-4">
          {/* PIN Enable Toggle */}
          <div className="flex items-center justify-between p-3.5 bg-slate-850 rounded-xl border border-slate-800">
            <div>
              <span className="text-xs font-bold text-white block">
                {t.security.pinStatus}
              </span>
              <span className="text-[11px] text-slate-400">
                App kholte waqt 4-digit PIN code talab karein
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={pinEnabled}
                onChange={(e) => setPinEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {pinEnabled && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    4-Digit PIN Code *
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 1234"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono text-base tracking-widest font-bold focus:outline-none focus:border-emerald-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Default demo PIN: 1234
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    {t.security.autoLockTime}
                  </label>
                  <select
                    value={autoLockMinutes}
                    onChange={(e) => setAutoLockMinutes(parseInt(e.target.value))}
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-emerald-500"
                  >
                    <option value={0}>{t.security.immediately}</option>
                    <option value={1}>{t.security.oneMinute}</option>
                    <option value={5}>{t.security.fiveMinutes}</option>
                    <option value={-1}>{t.security.never}</option>
                  </select>
                </div>
              </div>

              {/* Biometrics Toggle */}
              <div className="flex items-center justify-between p-3.5 bg-slate-850 rounded-xl border border-slate-800">
                <div className="flex items-center gap-2.5">
                  <Fingerprint className="w-5 h-5 text-emerald-400" />
                  <div>
                    <span className="text-xs font-bold text-white block">
                      {t.security.biometrics}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {t.security.biometricsDesc}
                    </span>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={biometricsEnabled}
                    onChange={(e) => setBiometricsEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {/* Recovery Question */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5 bg-slate-850 rounded-xl border border-slate-800">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    {t.security.securityQuestion}
                  </label>
                  <input
                    type="text"
                    value={securityQuestion}
                    onChange={(e) => setSecurityQuestion(e.target.value)}
                    placeholder="e.g. Aap ka pasandeeda shehar?"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    {t.security.securityAnswer}
                  </label>
                  <input
                    type="text"
                    value={securityAnswer}
                    onChange={(e) => setSecurityAnswer(e.target.value)}
                    placeholder="Jawab (e.g. lahore)"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            {securitySavedMsg && (
              <span className="text-xs text-emerald-400 flex items-center gap-1 font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Security settings mehfooz ho gayin!</span>
              </span>
            )}
            {!securitySavedMsg && <div />}

            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition shadow-sm"
            >
              Security Settings Save
            </button>
          </div>
        </form>
      </div>

      {/* 2. Backup, Restore & Offline Status (User requested) */}
      <div className="p-5 sm:p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">
              {t.settings.backupTitle} & Offline System
            </h2>
            <p className="text-xs text-slate-400">
              {t.settings.backupDesc}
            </p>
          </div>
        </div>

        {/* Offline Status Callout */}
        <div className="p-3.5 bg-emerald-950/30 border border-emerald-500/30 rounded-xl flex items-center gap-3">
          <Wifi className="w-5 h-5 text-emerald-400 shrink-0" />
          <div className="text-xs text-emerald-200">
            <strong className="text-white block font-semibold">{t.settings.offlineReady}</strong>
            Aapka sara karobari hisab kitab browser memory aur local database mein mahfooz hai. Internet na hone par bhi har feature kaam karega.
          </div>
        </div>

        {/* Backup & Restore Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Download Backup */}
          <button
            type="button"
            onClick={exportBackup}
            className="p-4 bg-slate-850 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-left transition flex items-start gap-3 group"
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-white block">
                {t.settings.downloadBackup}
              </span>
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                Ek click mein apni tamam sales, stock aur khata file download karein.
              </span>
            </div>
          </button>

          {/* Restore Backup */}
          <div>
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-full p-4 bg-slate-850 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-left transition flex items-start gap-3 group"
            >
              <div className="w-9 h-9 rounded-lg bg-sky-600/20 text-sky-400 flex items-center justify-center shrink-0 group-hover:bg-sky-600 group-hover:text-white transition">
                <Upload className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">
                  {t.settings.restoreBackup}
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  Pehlay se download shuda JSON backup file upload kar ke hisab wapas layein.
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Download Standalone Single-File HTML App */}
        <div className="p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold text-emerald-300 block">
              💾 Standalone Single-File HTML App Download
            </span>
            <span className="text-[11px] text-slate-300 mt-0.5 block">
              Is app ki mukammal single-file .html file download karein jise kisi bhi mobile, computer ya USB mein rakh kar double-click se direct bina internet chala sakein ge.
            </span>
          </div>
          <a
            href="/zamzam_disposable.html"
            download="ZamZam_Disposable_App.html"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition shadow shrink-0 whitespace-nowrap flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download HTML File</span>
          </a>
        </div>

        {/* Download Complete Project Source Code (ZIP) */}
        <div className="p-4 bg-sky-950/20 border border-sky-500/30 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold text-sky-300 block">
              💻 Complete Source Code (ZIP File) Download
            </span>
            <span className="text-[11px] text-slate-300 mt-0.5 block">
              Is app ka mukammal React, TypeScript aur Tailwind source code (tamam components, pages, aur icons) ZIP file mein download karein. VS Code mein open kar ke <code className="text-sky-300 font-mono">npm install</code> aur <code className="text-sky-300 font-mono">npm run dev</code> se chala sakte hain.
            </span>
          </div>
          <a
            href="/zamzam_khata_source_code.zip"
            download="zamzam_khata_source_code.zip"
            className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold transition shadow shrink-0 whitespace-nowrap flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Source Code (ZIP)</span>
          </a>
        </div>

        {/* Status notification */}
        {backupMsg && (
          <div
            className={`p-3 rounded-lg text-xs font-semibold flex items-center gap-2 ${
              backupMsg.error
                ? 'bg-rose-950/80 text-rose-300 border border-rose-500/30'
                : 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30'
            }`}
          >
            {backupMsg.error ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            <span>{backupMsg.text}</span>
          </div>
        )}

        {/* Maintenance / Demo Buttons */}
        <div className="pt-3 border-t border-slate-800 flex flex-wrap gap-2 justify-between items-center">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Demo data dobara load karna chahte hain?')) {
                  reloadDemoData();
                }
              }}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium border border-slate-700 transition flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{t.settings.loadDemoData}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              if (window.confirm(t.settings.resetConfirm)) {
                wipeAllData();
              }
            }}
            className="px-3 py-1.5 bg-rose-950/40 hover:bg-rose-950/80 text-rose-400 border border-rose-800/40 rounded-lg text-xs font-medium transition flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{t.settings.resetData}</span>
          </button>
        </div>
      </div>

      {/* 3. Business Profile & Language Settings */}
      <div className="p-5 sm:p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white p-1 flex items-center justify-center shadow-md border border-slate-700 overflow-hidden">
              <img src="/zamzam_logo.png" alt="ZamZam Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {t.settings.shopDetails}
              </h2>
              <p className="text-xs text-slate-400">
                Rasid aur bill par dukan ka naam, pata aur rabta number
              </p>
            </div>
          </div>
          <span className="text-[10px] px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/30">
            Official Logo Active
          </span>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {t.settings.shopName} *
              </label>
              <input
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Bismillah General Store"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Urdu Naam (Optional)
              </label>
              <input
                type="text"
                value={businessNameUrdu}
                onChange={(e) => setBusinessNameUrdu(e.target.value)}
                placeholder="بسم اللہ جنرل اسٹور"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs font-urdu focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {t.settings.ownerName}
              </label>
              <input
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="Muhammad Sajjad"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                WhatsApp # 1 *
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="03145725727"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                WhatsApp # 2
              </label>
              <input
                type="text"
                value={phone2}
                onChange={(e) => setPhone2(e.target.value)}
                placeholder="03129077476"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {t.settings.currency}
              </label>
              <input
                type="text"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                placeholder="₨"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              {t.settings.address}
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Shop # 14, Main Bazar, G.T. Road"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Bill Ke Niche Ka Note (Invoice Footer)
            </label>
            <input
              type="text"
              value={invoiceNote}
              onChange={(e) => setInvoiceNote(e.target.value)}
              placeholder="Bika hua maal wapas ya tabdeel ho sakta hai. Shukriya!"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Language Selector */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              {t.settings.language}
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setLanguage('roman_urdu')}
                className={`py-2 px-3 text-xs font-bold rounded-lg border transition ${
                  language === 'roman_urdu'
                    ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                Roman Urdu
              </button>
              <button
                type="button"
                onClick={() => setLanguage('urdu')}
                className={`py-2 px-3 text-xs font-bold font-urdu rounded-lg border transition ${
                  language === 'urdu'
                    ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                اردو (Urdu)
              </button>
              <button
                type="button"
                onClick={() => setLanguage('english')}
                className={`py-2 px-3 text-xs font-bold rounded-lg border transition ${
                  language === 'english'
                    ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                English
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            {profileSavedMsg && (
              <span className="text-xs text-emerald-400 flex items-center gap-1 font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Maloomat kamyabi se mehfooz ho gayin!</span>
              </span>
            )}
            {!profileSavedMsg && <div />}

            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition shadow-sm"
            >
              {t.common.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
