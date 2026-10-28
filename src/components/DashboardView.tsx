import React from 'react';
import { useKhata } from '../context/KhataContext';
import {
  TrendingUp,
  Receipt,
  Wallet,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  ShoppingBag,
  CreditCard,
  Package,
  Eye,
  FileText
} from 'lucide-react';
import { getTodayString } from '../utils/storage';
import { SaleRecord } from '../types';

interface DashboardViewProps {
  onNavigateTab: (tab: string) => void;
  onOpenQuickSale: () => void;
  onOpenExpenseModal: () => void;
  onOpenStockInModal: () => void;
  onOpenPaymentModal: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigateTab,
  onOpenQuickSale,
  onOpenExpenseModal,
  onOpenStockInModal,
  onOpenPaymentModal,
}) => {
  const {
    sales,
    expenses,
    products,
    customers,
    customerTransactions,
    shopSettings,
    setActiveInvoiceToView,
    t
  } = useKhata();

  const todayStr = getTodayString(0);

  // Today's Sales
  const todaySales = sales.filter((s) => s.date === todayStr);
  const todaySalesTotal = todaySales.reduce((acc, s) => acc + s.total, 0);
  const todaySalesProfit = todaySales.reduce((acc, s) => acc + s.totalProfit, 0);
  const todayCashSales = todaySales.filter((s) => s.paymentMethod === 'cash').reduce((acc, s) => acc + s.amountPaid, 0);

  // Today's Expenses
  const todayExpenses = expenses.filter((e) => e.date === todayStr);
  const todayExpensesTotal = todayExpenses.reduce((acc, e) => acc + e.amount, 0);

  // Today's Customer Payments Received
  const todayCustomerPayments = customerTransactions
    .filter((tx) => tx.date === todayStr && tx.type === 'payment_received')
    .reduce((acc, tx) => acc + tx.amount, 0);

  // Cash Inflow Today
  const totalCashInflow = todayCashSales + todayCustomerPayments;

  // Net Profit Today
  const todayNetProfit = todaySalesProfit - todayExpensesTotal;

  // Total Receivables (Udhaar)
  const totalReceivables = customers.reduce((acc, c) => acc + (c.balance || 0), 0);

  // Total Stock Valuation
  const totalStockCost = products.reduce((acc, p) => acc + p.stockQuantity * p.purchasePrice, 0);
  const totalStockRetail = products.reduce((acc, p) => acc + p.stockQuantity * p.salePrice, 0);

  // Low Stock Items
  const lowStockItems = products.filter((p) => p.stockQuantity <= p.minStockAlert);

  const formatAmount = (val: number) => {
    return `${shopSettings.currency} ${val.toLocaleString()}`;
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner & Quick Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white p-1 border border-slate-700/80 shadow-md shrink-0 flex items-center justify-center overflow-hidden">
            <img src="/zamzam_logo.png" alt="ZamZam Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
              <span>{t.dashboard.todayTitle}</span>
              <span aria-hidden="true">·</span>
              <span>{new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}</span>
            </div>
            <h1 className="text-lg sm:text-2xl font-bold text-white tracking-tight mt-1">
              {shopSettings.businessName}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {shopSettings.tagline || t.appSub}
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                WhatsApp: {shopSettings.phone} {shopSettings.phone2 ? `· ${shopSettings.phone2}` : ''}
              </span>
              <button
                onClick={() => onNavigateTab('reports')}
                className="text-[11px] font-semibold text-sky-400 hover:text-sky-300 underline underline-offset-2"
              >
                Haftawar & Mahana Record Dekhein &rarr;
              </button>
            </div>
          </div>
        </div>

        {/* Quick Actions Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenQuickSale}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition shadow-sm"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>{t.dashboard.newSale}</span>
          </button>
          <button
            onClick={onOpenExpenseModal}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-xl transition"
          >
            <Receipt className="w-4 h-4 text-rose-400" />
            <span>{t.dashboard.addExpense}</span>
          </button>
          <button
            onClick={onOpenStockInModal}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-xl transition"
          >
            <Package className="w-4 h-4 text-sky-400" />
            <span>{t.dashboard.stockIn}</span>
          </button>
          <button
            onClick={onOpenPaymentModal}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-xl transition"
          >
            <Wallet className="w-4 h-4 text-emerald-400" />
            <span>{t.dashboard.receivePayment}</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Today's Sales */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">{t.dashboard.todaySales}</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-white tabular-nums tracking-tight">
              {formatAmount(todaySalesTotal)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <span>{todaySales.length} {t.sales.cartItems}</span>
              <span aria-hidden="true">·</span>
              <span className="text-emerald-400">Naqd: {formatAmount(todayCashSales)}</span>
            </div>
          </div>
        </div>

        {/* Today's Expenses */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">{t.dashboard.todayExpenses}</span>
            <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-rose-400 tabular-nums tracking-tight">
              {formatAmount(todayExpensesTotal)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              <span>{todayExpenses.length} Kharchay darj</span>
            </div>
          </div>
        </div>

        {/* Today's Net Profit */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">{t.dashboard.todayProfit}</span>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
              todayNetProfit >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
            }`}>
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className={`text-xl sm:text-2xl font-bold tabular-nums tracking-tight ${
              todayNetProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {formatAmount(todayNetProfit)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              <span>Sales Nafa: {formatAmount(todaySalesProfit)}</span>
            </div>
          </div>
        </div>

        {/* Total Receivables (Udhaar) */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">{t.dashboard.totalCredit}</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-amber-300 tabular-nums tracking-tight">
              {formatAmount(totalReceivables)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
              <span>{customers.filter((c) => c.balance > 0).length} Grahak se lena hai</span>
              <button
                onClick={() => onNavigateTab('khata')}
                className="text-amber-400 hover:underline"
              >
                Khata &rarr;
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Bar: Cash In Hand & Stock Valuation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium block">
              {t.dashboard.cashInHand}
            </span>
            <div className="text-xl font-bold text-emerald-400 tabular-nums mt-0.5">
              {formatAmount(totalCashInflow)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Naqd Sales: {formatAmount(todayCashSales)} + Udhaar Wasooli: {formatAmount(todayCustomerPayments)}
            </div>
          </div>
          <button
            onClick={onOpenPaymentModal}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 rounded-lg transition"
          >
            + Wasooli
          </button>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium block">
              {t.dashboard.stockValue}
            </span>
            <div className="text-xl font-bold text-slate-100 tabular-nums mt-0.5">
              {formatAmount(totalStockCost)}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Bikri Value: {formatAmount(totalStockRetail)} · Ashya: {products.length}
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('stock')}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 rounded-lg transition"
          >
            Stock List
          </button>
        </div>
      </div>

      {/* Low Stock Warning Box */}
      {lowStockItems.length > 0 && (
        <div className="p-4 bg-amber-950/30 border border-amber-500/30 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-amber-300 block">
                {t.dashboard.lowStockAlert} ({lowStockItems.length} {t.stock.title})
              </span>
              <div className="text-xs text-amber-200/80 mt-0.5 flex flex-wrap gap-2">
                {lowStockItems.slice(0, 4).map((it) => (
                  <span key={it.id}>
                    <strong>{it.name}</strong> ({it.stockQuantity} {it.unit} baqi)
                  </span>
                ))}
                {lowStockItems.length > 4 && <span>+{lowStockItems.length - 4} aur</span>}
              </div>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('stock')}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-slate-950 text-xs font-bold rounded-lg transition shrink-0 whitespace-nowrap"
          >
            {t.dashboard.manageStock}
          </button>
        </div>
      )}

      {/* Two Column Section: Today's Sales & Today's Expenses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Recent Sales */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h2 className="text-sm font-bold text-white">
                  {t.dashboard.recentSales}
                </h2>
                <span className="text-xs text-slate-400">
                  {todaySales.length} Saude darj
                </span>
              </div>
              <button
                onClick={() => onNavigateTab('sales')}
                className="text-xs font-medium text-emerald-400 hover:text-emerald-300 hover:underline"
              >
                {t.dashboard.viewAll} &rarr;
              </button>
            </div>

            <div className="divide-y divide-slate-800/80 mt-2">
              {todaySales.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  {t.dashboard.noSalesToday}
                  <div className="mt-2">
                    <button
                      onClick={onOpenQuickSale}
                      className="text-emerald-400 hover:underline"
                    >
                      Pehli sale darj karein
                    </button>
                  </div>
                </div>
              ) : (
                todaySales.slice(0, 5).map((sale: SaleRecord) => (
                  <div
                    key={sale.id}
                    className="py-2.5 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{sale.customerName}</span>
                        <span className="text-[10px] text-slate-400">({sale.time})</span>
                      </div>
                      <div className="text-slate-400 text-[11px] mt-0.5">
                        <span>{sale.invoiceNumber}</span>
                        <span aria-hidden="true" className="mx-1">·</span>
                        <span className={sale.paymentMethod === 'credit' ? 'text-amber-400' : 'text-slate-400'}>
                          {sale.paymentMethod === 'credit' ? 'Udhaar' : 'Naqad'}
                        </span>
                        <span aria-hidden="true" className="mx-1">·</span>
                        <span className="text-emerald-400">Nafa: {formatAmount(sale.totalProfit)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white tabular-nums text-sm">
                        {formatAmount(sale.total)}
                      </span>
                      <button
                        onClick={() => setActiveInvoiceToView(sale)}
                        title="Rasid Dekhein / Print"
                        className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 mt-2 flex justify-between items-center text-xs">
            <span className="text-slate-400">Meezan Bikri:</span>
            <span className="font-bold text-emerald-400 tabular-nums">
              {formatAmount(todaySalesTotal)}
            </span>
          </div>
        </div>

        {/* Today's Expenses */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h2 className="text-sm font-bold text-white">
                  {t.dashboard.recentExpenses}
                </h2>
                <span className="text-xs text-slate-400">
                  {todayExpenses.length} Kharchay darj
                </span>
              </div>
              <button
                onClick={() => onNavigateTab('expenses')}
                className="text-xs font-medium text-emerald-400 hover:text-emerald-300 hover:underline"
              >
                {t.dashboard.viewAll} &rarr;
              </button>
            </div>

            <div className="divide-y divide-slate-800/80 mt-2">
              {todayExpenses.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  {t.dashboard.noExpensesToday}
                  <div className="mt-2">
                    <button
                      onClick={onOpenExpenseModal}
                      className="text-rose-400 hover:underline"
                    >
                      Kharcha likhein
                    </button>
                  </div>
                </div>
              ) : (
                todayExpenses.slice(0, 5).map((exp) => (
                  <div
                    key={exp.id}
                    className="py-2.5 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">
                          {t.expenses.categories[exp.category] || exp.category}
                        </span>
                        <span className="text-[10px] text-slate-400">({exp.time})</span>
                      </div>
                      <p className="text-slate-400 text-[11px] mt-0.5 truncate max-w-[200px]">
                        {exp.description || exp.recipient || 'Bilawaja kharcha'}
                      </p>
                    </div>

                    <div>
                      <span className="font-bold text-rose-400 tabular-nums text-sm">
                        -{formatAmount(exp.amount)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 mt-2 flex justify-between items-center text-xs">
            <span className="text-slate-400">Meezan Kharchay:</span>
            <span className="font-bold text-rose-400 tabular-nums">
              -{formatAmount(todayExpensesTotal)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
