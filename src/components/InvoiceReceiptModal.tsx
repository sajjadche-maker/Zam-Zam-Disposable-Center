import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { useKhata } from '../context/KhataContext';
import { SaleRecord } from '../types';
import {
  Printer,
  X,
  Share2,
  Check,
  MessageSquare,
  Phone,
  FileText,
  Download,
  Palette,
  QrCode as QrIcon,
  ShoppingBag,
  Sparkles,
  CreditCard,
  Wallet,
  Clock,
  Calendar,
  User,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface InvoiceReceiptModalProps {
  sale: SaleRecord | null;
  onClose: () => void;
}

type ReceiptTheme = 'emerald' | 'sapphire' | 'amber' | 'purple';

export const InvoiceReceiptModal: React.FC<InvoiceReceiptModalProps> = ({
  sale,
  onClose,
}) => {
  const { shopSettings, t } = useKhata();
  const [copied, setCopied] = useState(false);
  const [downloadingImage, setDownloadingImage] = useState(false);
  const [receiptFormat, setReceiptFormat] = useState<'thermal' | 'full'>('thermal');
  const [activeTheme, setActiveTheme] = useState<ReceiptTheme>('emerald');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const receiptRef = useRef<HTMLDivElement>(null);

  const phoneNumbersFormatted = [shopSettings.phone, shopSettings.phone2].filter(Boolean).join(' / ');

  // Generate dynamic QR code encoding invoice details and WhatsApp chat
  useEffect(() => {
    if (sale) {
      const primaryPhone = shopSettings.phone.replace(/\D/g, '') || '03145725727';
      const cleanPhone = primaryPhone.startsWith('0') ? '92' + primaryPhone.slice(1) : primaryPhone;
      const qrPayload = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
        `Assalam-o-Alaikum! ZamZam Disposable Bill #${sale.invoiceNumber} verified. Total: Rs.${sale.total.toLocaleString()}`
      )}`;

      QRCode.toDataURL(qrPayload, {
        width: 160,
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      })
        .then((url) => setQrCodeDataUrl(url))
        .catch((err) => console.error('QR code generation error:', err));
    }
  }, [sale, shopSettings.phone]);

  if (!sale) return null;

  const handlePrint = () => {
    window.print();
  };

  // Generate high-resolution receipt photo via canvas for WhatsApp image sharing
  const handleDownloadImage = async () => {
    setDownloadingImage(true);
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const scale = 2; // High-DPI
      const width = 420;
      // Estimate height based on item count
      const height = 780 + sale.items.length * 36;

      canvas.width = width * scale;
      canvas.height = height * scale;
      ctx.scale(scale, scale);

      // Background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      // Theme colors
      const themeColors = {
        emerald: { primary: '#059669', dark: '#064e3b', light: '#ecfdf5', accent: '#f59e0b' },
        sapphire: { primary: '#2563eb', dark: '#1e3a8a', light: '#eff6ff', accent: '#06b6d4' },
        amber: { primary: '#d97706', dark: '#78350f', light: '#fffbeb', accent: '#ea580c' },
        purple: { primary: '#7c3aed', dark: '#4c1d95', light: '#faf5ff', accent: '#ec4899' },
      }[activeTheme];

      // Top colored header banner
      const gradient = ctx.createLinearGradient(0, 0, width, 0);
      gradient.addColorStop(0, themeColors.dark);
      gradient.addColorStop(1, themeColors.primary);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, 142);

      // Draw official logo in header
      try {
        const logoImg = new Image();
        logoImg.src = '/zamzam_logo.png';
        await new Promise((resolve) => {
          logoImg.onload = () => {
            ctx.save();
            ctx.beginPath();
            ctx.arc(width / 2, 35, 25, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
            ctx.drawImage(logoImg, width / 2 - 23, 12, 46, 46);
            ctx.restore();
            resolve(true);
          };
          logoImg.onerror = () => resolve(false);
        });
      } catch (e) {
        // Continue if logo fails
      }

      // Shop Name & Details
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(shopSettings.businessName.toUpperCase(), width / 2, 80);

      if (shopSettings.businessNameUrdu) {
        ctx.font = 'bold 13px sans-serif';
        ctx.fillStyle = '#a7f3d0';
        ctx.fillText(shopSettings.businessNameUrdu, width / 2, 100);
      }

      ctx.font = 'bold 12px monospace';
      ctx.fillStyle = '#fef08a';
      ctx.fillText(`WhatsApp: ${phoneNumbersFormatted}`, width / 2, 122);

      // Receipt Meta Box
      ctx.fillStyle = themeColors.light;
      ctx.fillRect(16, 128, width - 32, 64);
      ctx.strokeStyle = '#e2e8f0';
      ctx.strokeRect(16, 128, width - 32, 64);

      ctx.textAlign = 'left';
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText(`Grahak: ${sale.customerName}`, 26, 148);

      ctx.font = '11px sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.fillText(`Tareekh: ${sale.date} (${sale.time})`, 26, 172);

      ctx.textAlign = 'right';
      ctx.fillStyle = themeColors.primary;
      ctx.font = 'bold 14px monospace';
      ctx.fillText(`BILL #${sale.invoiceNumber}`, width - 26, 148);

      if (sale.customerPhone) {
        ctx.font = '11px monospace';
        ctx.fillStyle = '#334155';
        ctx.fillText(`Mob: ${sale.customerPhone}`, width - 26, 172);
      }

      // Table Header
      let y = 212;
      ctx.fillStyle = themeColors.primary;
      ctx.fillRect(16, y, width - 32, 28);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('#  Cheez / Tafseel', 26, y + 18);
      ctx.textAlign = 'center';
      ctx.fillText('Tadaad', width - 140, y + 18);
      ctx.textAlign = 'right';
      ctx.fillText('Rate', width - 85, y + 18);
      ctx.fillText('Raqam', width - 26, y + 18);

      // Table Items
      y += 32;
      ctx.font = '11px sans-serif';
      sale.items.forEach((it, idx) => {
        if (idx % 2 === 1) {
          ctx.fillStyle = '#f8fafc';
          ctx.fillRect(16, y - 14, width - 32, 28);
        }

        ctx.textAlign = 'left';
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 11px sans-serif';
        const truncatedName = it.name.length > 22 ? it.name.substring(0, 20) + '..' : it.name;
        ctx.fillText(`${idx + 1}. ${truncatedName}`, 26, y + 4);

        ctx.textAlign = 'center';
        ctx.font = '11px monospace';
        ctx.fillStyle = '#475569';
        ctx.fillText(`${it.quantity} ${it.unit}`, width - 140, y + 4);

        ctx.textAlign = 'right';
        ctx.fillText(`${it.salePrice}`, width - 85, y + 4);

        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 11px monospace';
        ctx.fillText(`${it.total.toLocaleString()}`, width - 26, y + 4);

        y += 28;
      });

      // Divider
      y += 8;
      ctx.strokeStyle = '#cbd5e1';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(16, y);
      ctx.lineTo(width - 16, y);
      ctx.stroke();
      ctx.setLineDash([]);

      // Financials
      y += 24;
      ctx.textAlign = 'left';
      ctx.font = '12px sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.fillText('Meezan (Subtotal):', 26, y);
      ctx.textAlign = 'right';
      ctx.font = 'bold 12px monospace';
      ctx.fillStyle = '#0f172a';
      ctx.fillText(`Rs. ${sale.subtotal.toLocaleString()}`, width - 26, y);

      if (sale.discount > 0) {
        y += 22;
        ctx.textAlign = 'left';
        ctx.fillStyle = '#059669';
        ctx.font = '12px sans-serif';
        ctx.fillText('Chhoot (Discount):', 26, y);
        ctx.textAlign = 'right';
        ctx.font = 'bold 12px monospace';
        ctx.fillText(`-Rs. ${sale.discount.toLocaleString()}`, width - 26, y);
      }

      // Net Total Banner
      y += 18;
      ctx.fillStyle = themeColors.primary;
      ctx.fillRect(16, y, width - 32, 42);
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText('KUL RAQAM (TOTAL):', 28, y + 26);
      ctx.textAlign = 'right';
      ctx.font = 'black 17px monospace';
      ctx.fillText(`Rs. ${sale.total.toLocaleString()}`, width - 28, y + 27);

      // Payment Breakdown
      y += 62;
      ctx.textAlign = 'left';
      ctx.font = '12px sans-serif';
      ctx.fillStyle = '#475569';
      ctx.fillText(`Wasool Shuda (${sale.paymentMethod.toUpperCase()}):`, 26, y);
      ctx.textAlign = 'right';
      ctx.font = 'bold 12px monospace';
      ctx.fillStyle = '#059669';
      ctx.fillText(`Rs. ${sale.amountPaid.toLocaleString()}`, width - 26, y);

      if (sale.balanceDue > 0) {
        y += 28;
        ctx.fillStyle = '#fee2e2';
        ctx.fillRect(16, y - 16, width - 32, 32);
        ctx.strokeStyle = '#f87171';
        ctx.strokeRect(16, y - 16, width - 32, 32);

        ctx.textAlign = 'left';
        ctx.font = 'bold 13px sans-serif';
        ctx.fillStyle = '#991b1b';
        ctx.fillText('⚠️ Baqi Udhaar (Balance):', 28, y + 5);
        ctx.textAlign = 'right';
        ctx.font = 'black 14px monospace';
        ctx.fillText(`Rs. ${sale.balanceDue.toLocaleString()}`, width - 28, y + 5);
      } else {
        y += 24;
        ctx.fillStyle = '#ecfdf5';
        ctx.fillRect(16, y - 14, width - 32, 28);
        ctx.textAlign = 'center';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillStyle = '#047857';
        ctx.fillText('✓ Puri Raqam Wasool Shuda (PAID IN FULL)', width / 2, y + 4);
      }

      // QR Code Rendering
      if (qrCodeDataUrl) {
        y += 44;
        const qrImage = new Image();
        qrImage.src = qrCodeDataUrl;
        await new Promise((resolve) => {
          qrImage.onload = () => {
            ctx.drawImage(qrImage, (width - 70) / 2, y, 70, 70);
            resolve(true);
          };
          qrImage.onerror = () => resolve(false);
        });
        y += 82;
      } else {
        y += 40;
      }

      // Footer note
      ctx.textAlign = 'center';
      ctx.fillStyle = '#64748b';
      ctx.font = 'italic 11px sans-serif';
      ctx.fillText(shopSettings.invoiceFooterNote, width / 2, y);

      y += 18;
      ctx.font = 'bold 10px sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('ZamZam Disposable & Shopping Bags Center', width / 2, y);

      // Trigger download
      const link = document.createElement('a');
      link.download = `ZamZam-Receipt-${sale.invoiceNumber}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Failed to create receipt image:', err);
    } finally {
      setDownloadingImage(false);
    }
  };

  const handleShareWhatsApp = (preferredNumber?: string) => {
    const itemsList = sale.items
      .map((it, idx) => `  ${idx + 1}. *${it.name}* (${it.quantity} ${it.unit}) @ Rs.${it.salePrice} = *Rs.${it.total.toLocaleString()}*`)
      .join('\n');

    const msg = `🛍️ *${shopSettings.businessName.toUpperCase()}*\n` +
      `✨ *${shopSettings.businessNameUrdu || 'زم زم ڈسپوزیبل اینڈ شاپنگ بیگز'}*\n` +
      `📞 WhatsApp: ${phoneNumbersFormatted}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🧾 *INVOICE / RASID:* #${sale.invoiceNumber}\n` +
      `📅 *Tareekh:* ${sale.date} (${sale.time})\n` +
      `👤 *Grahak (Customer):* ${sale.customerName}\n` +
      (sale.customerPhone ? `📱 *Mobile:* ${sale.customerPhone}\n` : '') +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `📦 *ASHYA (PURCHASED ITEMS):*\n${itemsList}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `💰 *Meezan (Subtotal):* Rs. ${sale.subtotal.toLocaleString()}\n` +
      (sale.discount > 0 ? `🎁 *Chhoot (Discount):* -Rs. ${sale.discount.toLocaleString()}\n` : '') +
      `🏷️ *KUL RAQAM (NET TOTAL): Rs. ${sale.total.toLocaleString()}*\n` +
      `💵 *Wasool Hui (Paid):* Rs. ${sale.amountPaid.toLocaleString()} (${sale.paymentMethod.toUpperCase()})\n` +
      (sale.balanceDue > 0
        ? `⚠️ *BAQI UDHAAR (BALANCE): Rs. ${sale.balanceDue.toLocaleString()}*\n`
        : `✅ *HISAB MUKAMMAL (PAID IN FULL)*\n`) +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `🤝 _${shopSettings.invoiceFooterNote}_\n` +
      `✨ _ZamZam Disposable and Shopping bags center_`;

    const encoded = encodeURIComponent(msg);

    if (sale.customerPhone && !preferredNumber) {
      const cleanPhone = sale.customerPhone.replace(/\D/g, '');
      const intlPhone = cleanPhone.startsWith('0') ? '92' + cleanPhone.slice(1) : cleanPhone;
      window.open(`https://wa.me/${intlPhone}?text=${encoded}`, '_blank');
    } else if (preferredNumber) {
      const cleanPhone = preferredNumber.replace(/\D/g, '');
      const intlPhone = cleanPhone.startsWith('0') ? '92' + cleanPhone.slice(1) : cleanPhone;
      window.open(`https://wa.me/${intlPhone}?text=${encoded}`, '_blank');
    } else {
      navigator.clipboard.writeText(msg);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // Theme styling dictionaries
  const themes = {
    emerald: {
      name: 'Emerald Royale',
      badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      headerBg: 'from-emerald-950 via-emerald-900 to-teal-950',
      bannerBg: 'bg-gradient-to-r from-emerald-700 to-teal-700',
      textAccent: 'text-emerald-700',
      totalBg: 'from-emerald-700 to-teal-700',
      borderTone: 'border-emerald-300',
      lightTint: 'bg-emerald-50/70',
      badgeBg: 'bg-emerald-100 text-emerald-900',
      dotColor: '#059669',
    },
    sapphire: {
      name: 'Sapphire Corporate',
      badge: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
      headerBg: 'from-slate-950 via-blue-950 to-indigo-950',
      bannerBg: 'bg-gradient-to-r from-blue-700 to-indigo-700',
      textAccent: 'text-blue-700',
      totalBg: 'from-blue-700 to-indigo-700',
      borderTone: 'border-blue-300',
      lightTint: 'bg-blue-50/70',
      badgeBg: 'bg-blue-100 text-blue-900',
      dotColor: '#2563eb',
    },
    amber: {
      name: 'Amber Gold',
      badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      headerBg: 'from-stone-950 via-amber-950 to-yellow-950',
      bannerBg: 'bg-gradient-to-r from-amber-600 to-orange-600',
      textAccent: 'text-amber-700',
      totalBg: 'from-amber-600 to-orange-600',
      borderTone: 'border-amber-300',
      lightTint: 'bg-amber-50/70',
      badgeBg: 'bg-amber-100 text-amber-900',
      dotColor: '#d97706',
    },
    purple: {
      name: 'Royal Velvet',
      badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
      headerBg: 'from-slate-950 via-purple-950 to-fuchsia-950',
      bannerBg: 'bg-gradient-to-r from-purple-700 to-fuchsia-700',
      textAccent: 'text-purple-700',
      totalBg: 'from-purple-700 to-fuchsia-700',
      borderTone: 'border-purple-300',
      lightTint: 'bg-purple-50/70',
      badgeBg: 'bg-purple-100 text-purple-900',
      dotColor: '#7c3aed',
    },
  };

  const curr = themes[activeTheme];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-2 sm:p-4 overflow-y-auto backdrop-blur-xs">
      <div
        className={`w-full ${
          receiptFormat === 'full' ? 'max-w-3xl' : 'max-w-md'
        } bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] transition-all duration-200`}
      >
        {/* Top Controls Header */}
        <div className="no-print flex flex-wrap items-center justify-between px-3 sm:px-5 py-3 border-b border-slate-800 bg-slate-900/95 gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Deluxe Rasid</span>
            </span>
            <span className="text-xs text-slate-400 font-mono font-bold">
              #{sale.invoiceNumber}
            </span>
          </div>

          {/* Theme Color Selector */}
          <div className="flex items-center gap-1.5 bg-slate-850 p-1 rounded-xl border border-slate-800">
            <Palette className="w-3.5 h-3.5 text-slate-400 ml-1" />
            {(['emerald', 'sapphire', 'amber', 'purple'] as ReceiptTheme[]).map((thm) => (
              <button
                key={thm}
                onClick={() => setActiveTheme(thm)}
                className={`w-5 h-5 rounded-full transition-transform ${
                  thm === 'emerald'
                    ? 'bg-emerald-500'
                    : thm === 'sapphire'
                    ? 'bg-blue-500'
                    : thm === 'amber'
                    ? 'bg-amber-500'
                    : 'bg-purple-500'
                } ${
                  activeTheme === thm
                    ? 'ring-2 ring-white scale-110 shadow'
                    : 'opacity-60 hover:opacity-100 hover:scale-105'
                }`}
                title={themes[thm].name}
              />
            ))}
          </div>

          {/* Format Switcher */}
          <div className="flex items-center gap-1 bg-slate-800 p-0.5 rounded-lg border border-slate-700/60">
            <button
              onClick={() => setReceiptFormat('thermal')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition ${
                receiptFormat === 'thermal'
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Slip (80mm)
            </button>
            <button
              onClick={() => setReceiptFormat('full')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition ${
                receiptFormat === 'full'
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              A4 Sheet
            </button>
          </div>

          <div className="flex items-center gap-1.5 ml-auto">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition shadow-sm"
              title="Print Bill"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Sharing & Export Bar */}
        <div className="no-print bg-slate-850 px-3 sm:px-5 py-2.5 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-emerald-400 font-bold text-[11px]">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp Share:</span>
            </span>

            {/* Direct WhatsApp Buttons */}
            {sale.customerPhone && (
              <button
                onClick={() => handleShareWhatsApp()}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold transition shadow-xs flex items-center gap-1"
                title={`Send bill directly to ${sale.customerName}`}
              >
                <span>Grahak ({sale.customerName.slice(0, 10)})</span>
              </button>
            )}

            <button
              onClick={() => handleShareWhatsApp(shopSettings.phone)}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-300 rounded text-[11px] font-mono transition"
            >
              0314-5725727
            </button>
            <button
              onClick={() => handleShareWhatsApp(shopSettings.phone2)}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-300 rounded text-[11px] font-mono transition"
            >
              0312-9077476
            </button>
          </div>

          <div className="flex items-center gap-1.5 ml-auto">
            {/* Download Image Button */}
            <button
              onClick={handleDownloadImage}
              disabled={downloadingImage}
              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-[11px] font-bold transition shadow-xs flex items-center gap-1.5"
              title="Rasid ki picture download karein WhatsApp status ya photo bhejne ke liye"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{downloadingImage ? 'Bana Raha Hai...' : 'Photo Download (PNG)'}</span>
            </button>

            <button
              onClick={() => handleShareWhatsApp()}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-[11px] font-semibold transition flex items-center gap-1"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : null}
              <span>{copied ? 'Copy Ho Gaya!' : 'Text Copy'}</span>
            </button>
          </div>
        </div>

        {/* Printable Receipt Canvas */}
        <div className="p-3 sm:p-6 overflow-y-auto bg-slate-950/90 flex justify-center items-start">
          {receiptFormat === 'thermal' ? (
            /* ============================================================ */
            /* 1. COLORFUL DELUXE THERMAL SLIP (80mm)                        */
            /* ============================================================ */
            <div
              ref={receiptRef}
              className="receipt-printable relative bg-white text-slate-900 rounded-2xl shadow-2xl max-w-[360px] w-full mx-auto border-2 border-slate-200/90 overflow-hidden font-sans text-xs selection:bg-emerald-100"
            >
              {/* Decorative Colorful Header Banner */}
              <div className={`p-4 bg-gradient-to-r ${curr.headerBg} text-white text-center relative overflow-hidden`}>
                {/* Background decorative circles */}
                <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-white/5 pointer-events-none" />
                <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-white/5 pointer-events-none" />

                {/* Official ZamZam Logo Badge */}
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white p-1 border-2 border-white/60 shadow-lg mb-2 overflow-hidden mx-auto">
                  <img src="/zamzam_logo.png" alt="ZamZam Logo" className="w-full h-full object-contain" />
                </div>

                <h1 className="text-sm sm:text-base font-black tracking-tight uppercase text-white leading-tight">
                  {shopSettings.businessName}
                </h1>

                {shopSettings.businessNameUrdu && (
                  <p className="text-xs font-urdu font-bold text-emerald-300 mt-0.5" dir="rtl">
                    {shopSettings.businessNameUrdu}
                  </p>
                )}

                <p className="text-[10px] text-slate-300 font-medium mt-1">
                  {shopSettings.tagline}
                </p>

                {/* Contact Pill with WhatsApp Icon */}
                <div className="mt-2 inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-[11px] font-bold">
                  <Phone className="w-3 h-3 text-emerald-300" />
                  <span className="font-mono">{phoneNumbersFormatted}</span>
                </div>

                {shopSettings.address && (
                  <p className="text-[9px] text-slate-400 mt-1.5 max-w-[280px] mx-auto leading-tight">
                    {shopSettings.address}
                  </p>
                )}
              </div>

              {/* Colorful Metadata Card */}
              <div className="p-3.5 bg-slate-50 border-b border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-md bg-slate-900 text-white font-mono font-bold text-[11px] tracking-wide">
                    BILL #{sale.invoiceNumber}
                  </span>
                  <span className="text-[11px] text-slate-600 font-medium flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span>{sale.date}</span>
                    <span className="font-mono text-slate-400 text-[10px]">({sale.time})</span>
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[10px]">
                      {sale.customerName ? sale.customerName.charAt(0).toUpperCase() : 'G'}
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold block leading-none">
                        Grahak (Customer)
                      </span>
                      <span className="font-bold text-slate-900 text-xs">
                        {sale.customerName}
                      </span>
                    </div>
                  </div>

                  {sale.customerPhone && (
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block leading-none">
                        Phone
                      </span>
                      <span className="font-mono text-slate-800 text-xs font-semibold">
                        {sale.customerPhone}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Items Table */}
              <div className="p-3.5">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className={`border-b-2 ${curr.borderTone} text-slate-700 text-[10px] uppercase tracking-wider`}>
                      <th className="py-1.5 font-bold">Cheez / Item</th>
                      <th className="py-1.5 text-center font-bold">Qty</th>
                      <th className="py-1.5 text-right font-bold">Rate</th>
                      <th className="py-1.5 text-right font-bold">Raqam</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sale.items.map((it, idx) => (
                      <tr key={idx} className={idx % 2 === 1 ? curr.lightTint : ''}>
                        <td className="py-2 pr-1">
                          <div className="font-bold text-slate-900 leading-snug">
                            {it.name}
                          </div>
                          <span className={`inline-block text-[9px] font-bold px-1.5 py-0.2 rounded mt-0.5 ${curr.badgeBg}`}>
                            {it.unit}
                          </span>
                        </td>
                        <td className="py-2 text-center font-mono tabular-nums text-slate-700 font-semibold text-[11px]">
                          {it.quantity}
                        </td>
                        <td className="py-2 text-right font-mono tabular-nums text-slate-600 text-[11px]">
                          {it.salePrice}
                        </td>
                        <td className="py-2 text-right font-mono font-bold tabular-nums text-slate-950 text-xs">
                          {it.total.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Financial Calculation Box */}
              <div className="px-3.5 pb-3 space-y-1.5 text-xs">
                <div className="pt-2 border-t-2 border-dashed border-slate-300 space-y-1">
                  <div className="flex justify-between text-slate-600 text-[11px]">
                    <span>Meezan (Subtotal):</span>
                    <span className="font-mono tabular-nums font-semibold">
                      Rs. {sale.subtotal.toLocaleString()}
                    </span>
                  </div>

                  {sale.discount > 0 && (
                    <div className="flex justify-between items-center text-emerald-800 font-bold text-[11px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      <span className="flex items-center gap-1">
                        <span>🎁 Khas Bachat / Discount:</span>
                      </span>
                      <span className="font-mono tabular-nums">
                        -Rs. {sale.discount.toLocaleString()}
                      </span>
                    </div>
                  )}

                  {/* Grand Total Banner */}
                  <div className={`p-2.5 rounded-xl bg-gradient-to-r ${curr.totalBg} text-white shadow-md my-1.5 flex items-center justify-between`}>
                    <div>
                      <span className="text-[10px] text-white/80 font-bold uppercase tracking-wider block">
                        KUL RAQAM (NET TOTAL)
                      </span>
                      <span className="text-xs text-white/90 font-medium">
                        Ada Karne Wali Raqam
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-black font-mono tracking-tight tabular-nums">
                        ₨ {sale.total.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Payment Details */}
                  <div className="flex justify-between items-center text-slate-700 text-[11px] pt-1">
                    <span className="flex items-center gap-1 text-slate-500">
                      <CreditCard className="w-3 h-3" />
                      <span>Zariya-e-Adaigi (Mode):</span>
                    </span>
                    <span className="font-bold uppercase px-1.5 py-0.5 bg-slate-100 rounded text-slate-800 font-mono text-[10px]">
                      {sale.paymentMethod}
                    </span>
                  </div>

                  <div className="flex justify-between text-slate-800 text-[11px]">
                    <span className="text-slate-600">Wasool Hui (Paid):</span>
                    <span className="font-mono font-bold tabular-nums text-emerald-800">
                      Rs. {sale.amountPaid.toLocaleString()}
                    </span>
                  </div>

                  {/* Outstanding or Paid Stamp */}
                  {sale.balanceDue > 0 ? (
                    <div className="p-2 rounded-xl bg-rose-50 border border-rose-300 text-rose-950 flex items-center justify-between mt-2">
                      <div className="flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        <div>
                          <span className="text-[10px] font-black uppercase text-rose-800 block">
                            BAQI UDHAAR (BALANCE)
                          </span>
                          <span className="text-[10px] text-rose-700">Khata mein darj hai</span>
                        </div>
                      </div>
                      <div className="font-black font-mono text-sm text-rose-900 tabular-nums">
                        Rs. {sale.balanceDue.toLocaleString()}
                      </div>
                    </div>
                  ) : (
                    <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 flex items-center justify-center gap-1.5 font-bold text-xs mt-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>✓ Paid in Full (Puri Raqam Ada Hai)</span>
                    </div>
                  )}

                  {sale.notes && (
                    <div className="text-[10px] text-slate-500 italic p-1.5 bg-slate-50 rounded border border-slate-200 mt-1">
                      <strong>Note:</strong> {sale.notes}
                    </div>
                  )}
                </div>

                {/* Scannable WhatsApp QR Code & Verification Seal */}
                <div className="pt-3 border-t border-dashed border-slate-300 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {qrCodeDataUrl ? (
                      <div className="p-1 bg-white border border-slate-300 rounded-lg shadow-xs shrink-0">
                        <img
                          src={qrCodeDataUrl}
                          alt="Bill Verification QR"
                          className="w-14 h-14 object-contain"
                        />
                      </div>
                    ) : (
                      <div className="w-14 h-14 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                        <QrIcon className="w-6 h-6" />
                      </div>
                    )}
                    <div>
                      <span className="text-[9px] font-bold uppercase text-slate-500 block">
                        Scan Karein:
                      </span>
                      <p className="text-[10px] text-slate-700 leading-tight">
                        WhatsApp verification & Rabta ke liye
                      </p>
                    </div>
                  </div>

                  {/* Stamp Graphic */}
                  <div className="shrink-0 text-center">
                    {sale.balanceDue > 0 ? (
                      <div className="border-2 border-rose-600 rounded-lg px-2 py-1 rotate-[-8deg] bg-rose-50/50">
                        <span className="text-[9px] font-black uppercase text-rose-700 block tracking-wider leading-none">
                          UDHAAR BILL
                        </span>
                        <span className="text-[8px] font-bold text-rose-600 leading-none">
                          ZAMZAM KHATA
                        </span>
                      </div>
                    ) : (
                      <div className="border-2 border-emerald-600 rounded-lg px-2 py-1 rotate-[-8deg] bg-emerald-50/50">
                        <span className="text-[9px] font-black uppercase text-emerald-700 block tracking-wider leading-none">
                          WASOOL SHUDA
                        </span>
                        <span className="text-[8px] font-bold text-emerald-600 leading-none">
                          PAID IN FULL
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Note */}
                <div className="text-center pt-2 border-t border-slate-200 text-[10px] text-slate-500 space-y-0.5">
                  <p className="font-semibold text-slate-700">{shopSettings.invoiceFooterNote}</p>
                  <p className="text-[9px] text-slate-400">
                    ZamZam Disposable & Shopping Bags Center · Powered by Karobar Khata
                  </p>
                </div>
              </div>

              {/* Decorative Sawtooth Tear Edge at bottom */}
              <div className="h-2 w-full bg-slate-200 flex items-center justify-around overflow-hidden">
                {Array.from({ length: 30 }).map((_, i) => (
                  <span
                    key={i}
                    className="w-2 h-2 bg-slate-900 rotate-45 shrink-0 transform -translate-y-1.5"
                  />
                ))}
              </div>
            </div>
          ) : (
            /* ============================================================ */
            /* 2. FULL A4 EXECUTIVE INVOICE / SHEET FORMAT                   */
            /* ============================================================ */
            <div
              ref={receiptRef}
              className="receipt-printable bg-white text-slate-900 p-6 sm:p-8 rounded-2xl shadow-2xl max-w-2xl w-full mx-auto border-2 border-slate-300 font-sans text-xs selection:bg-emerald-100"
            >
              {/* Executive Header Banner */}
              <div className={`p-5 rounded-xl bg-gradient-to-r ${curr.headerBg} text-white mb-6 relative overflow-hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4`}>
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-white p-1 flex items-center justify-center shadow-lg border-2 border-white/60 overflow-hidden shrink-0">
                      <img src="/zamzam_logo.png" alt="ZamZam Logo" className="w-full h-full object-contain" />
                    </div>
                    <h1 className="text-lg sm:text-xl font-black uppercase tracking-tight text-white">
                      {shopSettings.businessName}
                    </h1>
                  </div>

                  {shopSettings.businessNameUrdu && (
                    <p className="text-sm font-urdu font-bold text-emerald-300" dir="rtl">
                      {shopSettings.businessNameUrdu}
                    </p>
                  )}

                  <p className="text-xs text-slate-300 max-w-sm">
                    {shopSettings.tagline}
                  </p>

                  <div className="pt-1 text-xs font-mono font-bold text-emerald-300 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" />
                    <span>WhatsApp: {phoneNumbersFormatted}</span>
                  </div>

                  {shopSettings.address && (
                    <p className="text-[11px] text-slate-400">
                      {shopSettings.address}
                    </p>
                  )}
                </div>

                {/* Right side Invoice Badge */}
                <div className="text-right sm:self-stretch flex flex-col justify-between items-end">
                  <div className="px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur-xs border border-white/20 text-right">
                    <span className="text-[10px] text-slate-300 uppercase font-bold block">
                      Commercial Invoice
                    </span>
                    <span className="text-base font-black font-mono text-white">
                      #{sale.invoiceNumber}
                    </span>
                  </div>

                  <div className="mt-2 text-right text-[11px] text-slate-300 space-y-0.5">
                    <div>Tareekh: <strong className="text-white">{sale.date}</strong></div>
                    <div>Waqt: <strong className="text-white">{sale.time}</strong></div>
                  </div>
                </div>
              </div>

              {/* Customer Box */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl mb-4 flex justify-between items-center">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">
                    Grahak / Bill Banam (Customer)
                  </span>
                  <div className="text-sm font-black text-slate-900 mt-0.5">
                    {sale.customerName}
                  </div>
                </div>
                {sale.customerPhone && (
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">
                      Mobile Number
                    </span>
                    <div className="text-xs font-mono font-bold text-slate-800 mt-0.5">
                      {sale.customerPhone}
                    </div>
                  </div>
                )}
              </div>

              {/* Items Table */}
              <table className="w-full text-left border border-slate-300 my-4 text-xs rounded-lg overflow-hidden">
                <thead className={`bg-gradient-to-r ${curr.bannerBg} text-white`}>
                  <tr>
                    <th className="p-2.5 w-10 text-center font-bold">#</th>
                    <th className="p-2.5 font-bold">Tafseel (Item Description)</th>
                    <th className="p-2.5 text-center font-bold">Tadaad (Qty)</th>
                    <th className="p-2.5 text-right font-bold">Rate</th>
                    <th className="p-2.5 text-right font-bold">Raqam (Total)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {sale.items.map((it, idx) => (
                    <tr key={idx} className={idx % 2 === 1 ? curr.lightTint : 'hover:bg-slate-50'}>
                      <td className="p-2.5 text-center font-mono text-slate-500 font-bold">
                        {idx + 1}
                      </td>
                      <td className="p-2.5 font-bold text-slate-900">
                        {it.name}
                        <span className={`ml-2 text-[10px] font-semibold px-1.5 py-0.5 rounded ${curr.badgeBg}`}>
                          {it.unit}
                        </span>
                      </td>
                      <td className="p-2.5 text-center font-mono font-semibold tabular-nums text-slate-700">
                        {it.quantity} {it.unit}
                      </td>
                      <td className="p-2.5 text-right font-mono tabular-nums text-slate-700">
                        Rs. {it.salePrice}
                      </td>
                      <td className="p-2.5 text-right font-mono font-bold tabular-nums text-slate-950">
                        Rs. {it.total.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Bottom Financial Card */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 my-4">
                {/* QR Code and Stamp on left */}
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  {qrCodeDataUrl && (
                    <img
                      src={qrCodeDataUrl}
                      alt="Verification QR"
                      className="w-16 h-16 object-contain bg-white p-1 rounded-lg border border-slate-300"
                    />
                  )}
                  <div className="text-xs space-y-1">
                    <span className="text-[10px] font-bold uppercase text-slate-500 block">
                      Digital Verification
                    </span>
                    <p className="text-[11px] text-slate-700">
                      ZamZam WhatsApp Rabta
                    </p>
                    {sale.balanceDue > 0 ? (
                      <span className="inline-block px-2 py-0.5 bg-rose-100 text-rose-800 rounded font-bold text-[10px]">
                        ⚠️ Udhaar Baqi: Rs. {sale.balanceDue.toLocaleString()}
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">
                        ✓ Paid In Full
                      </span>
                    )}
                  </div>
                </div>

                {/* Right side summary totals */}
                <div className="w-full sm:w-72 space-y-1.5 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-600">Subtotal:</span>
                    <span className="font-mono font-bold">
                      Rs. {sale.subtotal.toLocaleString()}
                    </span>
                  </div>

                  {sale.discount > 0 && (
                    <div className="flex justify-between py-1 border-b border-slate-200 text-emerald-800 font-bold">
                      <span>Discount (Chhoot):</span>
                      <span className="font-mono">
                        -Rs. {sale.discount.toLocaleString()}
                      </span>
                    </div>
                  )}

                  <div className={`flex justify-between p-2.5 rounded-lg bg-gradient-to-r ${curr.totalBg} text-white text-sm font-black`}>
                    <span>Net Total:</span>
                    <span className="font-mono">
                      Rs. {sale.total.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-600">Paid ({sale.paymentMethod.toUpperCase()}):</span>
                    <span className="font-mono font-bold text-emerald-800">
                      Rs. {sale.amountPaid.toLocaleString()}
                    </span>
                  </div>

                  {sale.balanceDue > 0 && (
                    <div className="flex justify-between p-2 bg-rose-50 border border-rose-300 rounded-lg font-black text-rose-900">
                      <span>Baqi Udhaar:</span>
                      <span className="font-mono">
                        Rs. {sale.balanceDue.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Authorized Signatures & Footer Note */}
              <div className="pt-6 border-t-2 border-slate-300 flex justify-between items-end text-[11px] text-slate-600 mt-4">
                <div className="max-w-xs">
                  <p className="font-bold text-slate-800">{shopSettings.invoiceFooterNote}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Thank you for your business!
                  </p>
                </div>

                <div className="text-center">
                  <div className="w-40 border-b border-slate-400 mb-1"></div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase">
                    Authorized Signature / Stamp
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="no-print p-3 sm:p-4 bg-slate-900 border-t border-slate-800 flex justify-between items-center gap-2">
          <div className="text-xs text-slate-400 hidden sm:block">
            Theme: <strong className="text-white">{curr.name}</strong> · WhatsApp:{' '}
            <span className="text-emerald-400 font-mono">{phoneNumbersFormatted}</span>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
            >
              {t.common.close}
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>Print Bill</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
