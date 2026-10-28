import React, { useState, useEffect } from 'react';
import { KhataProvider, useKhata } from './context/KhataContext';
import { Header } from './components/Header';
import { SecurityLock } from './components/SecurityLock';
import { DashboardView } from './components/DashboardView';
import { SalesView } from './components/SalesView';
import { ExpensesView } from './components/ExpensesView';
import { InventoryView } from './components/InventoryView';
import { KhataView } from './components/KhataView';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { InvoiceReceiptModal } from './components/InvoiceReceiptModal';
import { MobileInstallGuideModal } from './components/MobileInstallGuideModal';
import { InstallAppBanner } from './components/InstallAppBanner';
import { WifiOff, ShoppingBag, Receipt, Package, Wallet, Shield } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { language, activeInvoiceToView, setActiveInvoiceToView, securitySettings } = useKhata();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [showMobileGuide, setShowMobileGuide] = useState(false);

  // Quick Action Modal states triggered from Dashboard
  const [directExpenseModal, setDirectExpenseModal] = useState(false);
  const [directStockInModal, setDirectStockInModal] = useState(false);
  const [directPaymentModal, setDirectPaymentModal] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Sync html language and direction
    document.documentElement.lang = language === 'urdu' ? 'ur' : language === 'english' ? 'en' : 'ur-Latn';
    document.documentElement.dir = language === 'urdu' ? 'rtl' : 'ltr';

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [language]);

  const handleOpenQuickSale = () => {
    setActiveTab('sales');
  };

  const handleOpenExpenseModal = () => {
    setActiveTab('expenses');
    setDirectExpenseModal(true);
  };

  const handleOpenStockInModal = () => {
    setActiveTab('stock');
    setDirectStockInModal(true);
  };

  const handleOpenPaymentModal = () => {
    setActiveTab('khata');
    setDirectPaymentModal(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/20 selection:text-emerald-300">
      {/* 1. Security Lock Overlay (if enabled & app is locked) */}
      <SecurityLock />

      {/* 2. Top Bar Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenQuickSale={handleOpenQuickSale}
        onOpenMobileGuide={() => setShowMobileGuide(true)}
      />

      {/* 2.5 Prominent Mobile Install Banner (Play Store style) */}
      <InstallAppBanner onOpenManualGuide={() => setShowMobileGuide(true)} />

      {/* 3. Main Workspace Canvas */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'dashboard' && (
          <DashboardView
            onNavigateTab={(tab) => setActiveTab(tab)}
            onOpenQuickSale={handleOpenQuickSale}
            onOpenExpenseModal={handleOpenExpenseModal}
            onOpenStockInModal={handleOpenStockInModal}
            onOpenPaymentModal={handleOpenPaymentModal}
          />
        )}

        {activeTab === 'sales' && <SalesView />}

        {activeTab === 'expenses' && (
          <ExpensesView
            isOpenAddModalDirectly={directExpenseModal}
            onCloseDirectModal={() => setDirectExpenseModal(false)}
          />
        )}

        {activeTab === 'stock' && (
          <InventoryView
            isOpenStockInDirectly={directStockInModal}
            onCloseDirectModal={() => setDirectStockInModal(false)}
          />
        )}

        {activeTab === 'khata' && (
          <KhataView
            isOpenPaymentModalDirectly={directPaymentModal}
            onCloseDirectModal={() => setDirectPaymentModal(false)}
          />
        )}

        {activeTab === 'reports' && <ReportsView />}

        {activeTab === 'settings' && <SettingsView />}
      </main>

      {/* 4. Active Printable Invoice Modal */}
      <InvoiceReceiptModal
        sale={activeInvoiceToView}
        onClose={() => setActiveInvoiceToView(null)}
      />

      {/* 5. Mobile Setup & QR Code Install Modal */}
      <MobileInstallGuideModal
        isOpen={showMobileGuide}
        onClose={() => setShowMobileGuide(false)}
      />

      {/* 5. Offline Toast Indicator (if disconnected from network) */}
      {!isOnline && (
        <div className="fixed bottom-4 left-4 z-40 flex items-center gap-2 rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-bold text-white shadow-xl border border-amber-400/40">
          <WifiOff className="w-4 h-4 shrink-0" />
          <span>Offline Mode: Aapka hisab kitab local memory mein bilkul mehfooz chal raha hai.</span>
        </div>
      )}

      {/* 6. Mobile Bottom Quick Bar for Fast Shopkeeper Access */}
      <nav className="sm:hidden sticky bottom-0 z-30 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 grid grid-cols-5 px-1 py-1 text-center">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`py-1.5 flex flex-col items-center justify-center text-[10px] font-medium transition ${
            activeTab === 'dashboard' ? 'text-emerald-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Receipt className="w-4 h-4 mb-0.5" />
          <span>Roznamcha</span>
        </button>

        <button
          onClick={() => setActiveTab('sales')}
          className={`py-1.5 flex flex-col items-center justify-center text-[10px] font-medium transition ${
            activeTab === 'sales' ? 'text-emerald-400 font-bold' : 'text-slate-400'
          }`}
        >
          <ShoppingBag className="w-4 h-4 mb-0.5" />
          <span>Bikri (POS)</span>
        </button>

        <button
          onClick={() => setActiveTab('stock')}
          className={`py-1.5 flex flex-col items-center justify-center text-[10px] font-medium transition ${
            activeTab === 'stock' ? 'text-emerald-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Package className="w-4 h-4 mb-0.5" />
          <span>Stock</span>
        </button>

        <button
          onClick={() => setActiveTab('khata')}
          className={`py-1.5 flex flex-col items-center justify-center text-[10px] font-medium transition ${
            activeTab === 'khata' ? 'text-emerald-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Wallet className="w-4 h-4 mb-0.5" />
          <span>Udhaar</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`py-1.5 flex flex-col items-center justify-center text-[10px] font-medium transition ${
            activeTab === 'settings' ? 'text-emerald-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Shield className="w-4 h-4 mb-0.5" />
          <span>PIN/Data</span>
        </button>
      </nav>
    </div>
  );
};

export default function App() {
  return (
    <KhataProvider>
      <MainAppContent />
    </KhataProvider>
  );
}
