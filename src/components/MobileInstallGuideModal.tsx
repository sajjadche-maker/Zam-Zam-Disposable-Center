import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  Smartphone,
  X,
  Copy,
  Check,
  Share2,
  ExternalLink,
  QrCode,
  ShieldCheck,
  WifiOff
} from 'lucide-react';
import { useKhata } from '../context/KhataContext';

interface MobileInstallGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileInstallGuideModal: React.FC<MobileInstallGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { shopSettings } = useKhata();
  const [qrUrl, setQrUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [activeDeviceTab, setActiveDeviceTab] = useState<'android' | 'iphone'>('android');

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  useEffect(() => {
    if (currentUrl) {
      QRCode.toDataURL(currentUrl, {
        width: 240,
        margin: 2,
        color: {
          dark: '#020617',
          light: '#ffffff',
        },
      })
        .then((url) => setQrUrl(url))
        .catch((err) => console.error('QR code error', err));
    }
  }, [currentUrl]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendToWhatsApp = () => {
    const text = `*${shopSettings.businessName}* App Link:\n${currentUrl}\n\nIs link ko apne mobile mein Chrome ya Safari mein kholein aur "Add to Home screen" karein.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-900/95">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white">
                Mobile Par App Kese Chalayein?
              </h2>
              <span className="text-[11px] text-slate-400">
                Apne Android ya iPhone par foran chalayein
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs">
          {/* Quick Method 1: Scan QR Code */}
          <div className="p-4 bg-slate-850 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            {qrUrl ? (
              <div className="bg-white p-2 rounded-xl shadow shrink-0">
                <img
                  src={qrUrl}
                  alt="App Mobile QR Code"
                  className="w-32 h-32 object-contain"
                />
              </div>
            ) : (
              <div className="w-32 h-32 bg-slate-800 rounded-xl flex items-center justify-center text-slate-500">
                <QrCode className="w-8 h-8" />
              </div>
            )}
            <div className="space-y-2">
              <span className="inline-block px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 font-bold text-[10px] border border-emerald-500/30">
                Tareeqa # 1: Camera Se Scan Karein
              </span>
              <h3 className="text-sm font-bold text-white">
                Mobile Camera Se QR Code Scan Karein
              </h3>
              <p className="text-slate-400 leading-relaxed text-[11px]">
                Apne mobile phone ka Camera on kar ke is QR code ke samne karein, link par click karein aur app aapke mobile par khul jayegi!
              </p>
            </div>
          </div>

          {/* Quick Method 2: Share via WhatsApp or Copy Link */}
          <div className="space-y-2">
            <span className="text-slate-400 font-semibold block">
              Tareeqa # 2: Link Mobile Par Bhejein:
            </span>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={currentUrl}
                className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 font-mono text-[11px] truncate focus:outline-none"
              />
              <button
                onClick={handleCopy}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg font-semibold transition flex items-center gap-1.5 shrink-0"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copy Ho Gaya' : 'Copy Link'}</span>
              </button>
              <button
                onClick={handleSendToWhatsApp}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold transition shadow flex items-center gap-1.5 shrink-0"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </button>
            </div>
          </div>

          {/* Step by Step Guide: Android vs iPhone */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-xs">
                Mobile Par As Real App Install Karne Ka Tareeqa:
              </span>
              <div className="flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700/60">
                <button
                  onClick={() => setActiveDeviceTab('android')}
                  className={`px-3 py-1 rounded-md text-[11px] font-bold transition ${
                    activeDeviceTab === 'android'
                      ? 'bg-emerald-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Android Phone
                </button>
                <button
                  onClick={() => setActiveDeviceTab('iphone')}
                  className={`px-3 py-1 rounded-md text-[11px] font-bold transition ${
                    activeDeviceTab === 'iphone'
                      ? 'bg-emerald-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  iPhone (Apple)
                </button>
              </div>
            </div>

            {activeDeviceTab === 'android' ? (
              <div className="p-4 bg-slate-800/50 border border-slate-700/60 rounded-xl space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    1
                  </span>
                  <p className="text-slate-200">
                    Mobile mein <strong>Google Chrome</strong> browser ke andar ye link kholein.
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    2
                  </span>
                  <p className="text-slate-200">
                    Chrome ke ooper dayen taraf <strong>3 Dots (⋮)</strong> wale menu par click karein.
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    3
                  </span>
                  <p className="text-slate-200">
                    Menu mein se <strong className="text-emerald-400">"Install app"</strong> ya <strong className="text-emerald-400">"Add to Home screen"</strong> par click karein.
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    4
                  </span>
                  <p className="text-slate-200">
                    Aapke mobile ki screen par <strong>ZamZam Disposable</strong> ka app icon ban jayega!
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-800/50 border border-slate-700/60 rounded-xl space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-sky-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    1
                  </span>
                  <p className="text-slate-200">
                    iPhone ke <strong>Safari</strong> browser mein ye link kholein.
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-sky-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    2
                  </span>
                  <p className="text-slate-200">
                    Safari ke bilkul niche <strong>Share (تیر کا نشان)</strong> button dabayein.
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-sky-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    3
                  </span>
                  <p className="text-slate-200">
                    Niche scroll karein aur <strong className="text-sky-400">"Add to Home Screen"</strong> par tap karein.
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-sky-600 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    4
                  </span>
                  <p className="text-slate-200">
                    Ooper <strong>"Add"</strong> dabayein. App aapke iPhone ki home screen par save ho jayegi!
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Benefits Callout */}
          <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl flex items-center gap-3">
            <WifiOff className="w-5 h-5 text-emerald-400 shrink-0" />
            <p className="text-[11px] text-emerald-200 leading-tight">
              <strong>Offline Sahulat:</strong> Mobile par install karne ke baad ye app internet / Wi-Fi ke baghair bhi 100% tezi se chalegi aur sara record mehfooz rahega!
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 bg-slate-900 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition"
          >
            Theek Hai, Samajh Gaya
          </button>
        </div>
      </div>
    </div>
  );
};
