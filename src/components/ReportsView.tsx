import React, { useState, useMemo } from 'react';
import { useKhata } from '../context/KhataContext';
import {
  FileText,
  Printer,
  Download,
  Calendar,
  ShoppingBag,
  TrendingUp,
  Package,
  CalendarDays,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Boxes
} from 'lucide-react';
import { getTodayString } from '../utils/storage';

export const ReportsView: React.FC = () => {
  const { sales, expenses, customerTransactions, shopSettings, t } = useKhata();

  const [activeReportMode, setActiveReportMode] = useState<'weekly' | 'monthly' | 'daily' | 'custom'>('weekly');
  
  // Weekly navigation offset (0 = current week, -1 = last week, etc.)
  const [weekOffset, setWeekOffset] = useState<number>(0);
  
  // Month selector YYYY-MM
  const currentYearMonth = getTodayString(0).slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentYearMonth);

  // Custom date range
  const [customStart, setCustomStart] = useState(getTodayString(-7));
  const [customEnd, setCustomEnd] = useState(getTodayString(0));

  // Calculate start & end dates based on activeReportMode
  const { startDate, endDate, periodLabel } = useMemo(() => {
    const today = new Date();

    if (activeReportMode === 'daily') {
      const todayStr = getTodayString(0);
      return {
        startDate: todayStr,
        endDate: todayStr,
        periodLabel: `Aaj Ka Roznamcha (${todayStr})`,
      };
    }

    if (activeReportMode === 'weekly') {
      // Calculate Monday to Sunday of the target week
      const current = new Date();
      current.setDate(current.getDate() + weekOffset * 7);
      
      const day = current.getDay();
      // Monday = 1, Sunday = 0
      const diffToMonday = current.getDate() - day + (day === 0 ? -6 : 1);
      
      const monday = new Date(current.setDate(diffToMonday));
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      const start = monday.toISOString().split('T')[0];
      const end = sunday.toISOString().split('T')[0];

      const label = weekOffset === 0
        ? `Is Hafte Ka Record (${start} ta ${end})`
        : weekOffset === -1
        ? `Pichlay Hafte Ka Record (${start} ta ${end})`
        : `Haftawar Record (${start} ta ${end})`;

      return { startDate: start, endDate: end, periodLabel: label };
    }

    if (activeReportMode === 'monthly') {
      const [year, month] = selectedMonth.split('-');
      const start = `${selectedMonth}-01`;
      // Last day of month
      const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
      const end = `${selectedMonth}-${String(lastDay).padStart(2, '0')}`;

      const monthName = new Date(parseInt(year), parseInt(month) - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' });
      return {
        startDate: start,
        endDate: end,
        periodLabel: `Mahana Record (${monthName})`,
      };
    }

    // Custom
    return {
      startDate: customStart,
      endDate: customEnd,
      periodLabel: `Makhsoos Muddat (${customStart} ta ${customEnd})`,
    };
  }, [activeReportMode, weekOffset, selectedMonth, customStart, customEnd]);

  // Filtered sales
  const periodSales = useMemo(() => {
    return sales.filter((s) => s.date >= startDate && s.date <= endDate);
  }, [sales, startDate, endDate]);

  // Filtered expenses
  const periodExpenses = useMemo(() => {
    return expenses.filter((e) => e.date >= startDate && e.date <= endDate);
  }, [expenses, startDate, endDate]);

  // Filtered customer payments
  const periodPayments = useMemo(() => {
    return customerTransactions.filter(
      (tx) => tx.date >= startDate && tx.date <= endDate && tx.type === 'payment_received'
    );
  }, [customerTransactions, startDate, endDate]);

  // Financial aggregates
  const totalSalesRevenue = periodSales.reduce((acc, s) => acc + s.total, 0);
  const totalSalesCost = periodSales.reduce((acc, s) => {
    const cost = s.items.reduce((iAcc, item) => iAcc + item.purchasePrice * item.quantity, 0);
    return acc + cost;
  }, 0);
  const grossProfit = totalSalesRevenue - totalSalesCost;
  const totalExpensesAmount = periodExpenses.reduce((acc, e) => acc + e.amount, 0);
  const netProfit = grossProfit - totalExpensesAmount;

  const totalCashCollected =
    periodSales
      .filter((s) => s.paymentMethod === 'cash')
      .reduce((acc, s) => acc + s.amountPaid, 0) +
    periodPayments.reduce((acc, p) => acc + p.amount, 0);

  const totalCreditGiven = periodSales
    .filter((s) => s.balanceDue > 0)
    .reduce((acc, s) => acc + s.balanceDue, 0);

  // Total quantity of bags & disposables sold in this period
  const totalItemsSold = periodSales.reduce((acc, s) => {
    return acc + s.items.reduce((iAcc, it) => iAcc + it.quantity, 0);
  }, 0);

  // Day-by-Day breakdown for Weekly mode
  const weeklyDayBreakdown = useMemo(() => {
    if (activeReportMode !== 'weekly') return [];

    const days = [];
    const curr = new Date(startDate);
    const end = new Date(endDate);

    while (curr <= end) {
      const dateStr = curr.toISOString().split('T')[0];
      const daySales = sales.filter((s) => s.date === dateStr);
      const dayExpenses = expenses.filter((e) => e.date === dateStr);
      const dayPayments = customerTransactions.filter((tx) => tx.date === dateStr && tx.type === 'payment_received');

      const sTotal = daySales.reduce((acc, s) => acc + s.total, 0);
      const sCost = daySales.reduce((acc, s) => acc + s.items.reduce((iAcc, it) => iAcc + it.purchasePrice * it.quantity, 0), 0);
      const eTotal = dayExpenses.reduce((acc, e) => acc + e.amount, 0);
      const net = (sTotal - sCost) - eTotal;
      const cashInflow = daySales.filter(s => s.paymentMethod === 'cash').reduce((acc, s) => acc + s.amountPaid, 0) + dayPayments.reduce((acc, p) => acc + p.amount, 0);

      const dayName = curr.toLocaleDateString('en-US', { weekday: 'short' });

      days.push({
        date: dateStr,
        dayName,
        salesCount: daySales.length,
        salesTotal: sTotal,
        expensesTotal: eTotal,
        netProfit: net,
        cashInflow,
      });

      curr.setDate(curr.getDate() + 1);
    }

    return days;
  }, [activeReportMode, startDate, endDate, sales, expenses, customerTransactions]);

  // Week-by-Week breakdown for Monthly mode
  const monthlyWeeksBreakdown = useMemo(() => {
    if (activeReportMode !== 'monthly') return [];

    // Break the month into 4 weeks
    const weeks = [
      { name: 'Hafta 1 (1st - 7th)', start: `${selectedMonth}-01`, end: `${selectedMonth}-07` },
      { name: 'Hafta 2 (8th - 14th)', start: `${selectedMonth}-08`, end: `${selectedMonth}-14` },
      { name: 'Hafta 3 (15th - 21st)', start: `${selectedMonth}-15`, end: `${selectedMonth}-21` },
      { name: 'Hafta 4 (22nd - End)', start: `${selectedMonth}-22`, end: endDate },
    ];

    return weeks.map((w) => {
      const wSales = sales.filter((s) => s.date >= w.start && s.date <= w.end);
      const wExp = expenses.filter((e) => e.date >= w.start && e.date <= w.end);
      const sTotal = wSales.reduce((acc, s) => acc + s.total, 0);
      const sCost = wSales.reduce((acc, s) => acc + s.items.reduce((iAcc, it) => iAcc + it.purchasePrice * it.quantity, 0), 0);
      const eTotal = wExp.reduce((acc, e) => acc + e.amount, 0);

      return {
        ...w,
        salesCount: wSales.length,
        salesTotal: sTotal,
        expensesTotal: eTotal,
        netProfit: (sTotal - sCost) - eTotal,
      };
    });
  }, [activeReportMode, selectedMonth, endDate, sales, expenses]);

  // Top products sold in this period
  const topProducts = useMemo(() => {
    const map: Record<string, { name: string; unit: string; qty: number; revenue: number; profit: number }> = {};

    periodSales.forEach((s) => {
      s.items.forEach((it) => {
        if (!map[it.itemId]) {
          map[it.itemId] = {
            name: it.name,
            unit: it.unit,
            qty: 0,
            revenue: 0,
            profit: 0,
          };
        }
        map[it.itemId].qty += it.quantity;
        map[it.itemId].revenue += it.total;
        map[it.itemId].profit += it.profit;
      });
    });

    return Object.values(map).sort((a, b) => b.revenue - a.revenue);
  }, [periodSales]);

  // Export CSV
  const handleExportCSV = () => {
    let csv = `Record Report - ${shopSettings.businessName}\n`;
    csv += `WhatsApp: ${shopSettings.phone} / ${shopSettings.phone2 || ''}\n`;
    csv += `Muddat: ${periodLabel} (${startDate} ta ${endDate})\n\n`;
    csv += `Kul Bikri (Total Sales),Rs. ${totalSalesRevenue}\n`;
    csv += `Maal Ki Khareed (Cost of Goods),Rs. ${totalSalesCost}\n`;
    csv += `Kacha Munafa (Gross Profit),Rs. ${grossProfit}\n`;
    csv += `Kul Kharchay (Total Expenses),Rs. ${totalExpensesAmount}\n`;
    csv += `Khalis Nafa (Net Profit),Rs. ${netProfit}\n`;
    csv += `Cash Wasooli (Cash Inflow),Rs. ${totalCashCollected}\n`;
    csv += `Naya Udhaar (Credit Given),Rs. ${totalCreditGiven}\n\n`;

    csv += `Top Selling Items:\n`;
    csv += `Cheez Ka Naam,Tadaad,Kul Bikri,Munafa\n`;
    topProducts.forEach((p) => {
      csv += `"${p.name}",${p.qty} ${p.unit},Rs. ${p.revenue},Rs. ${p.profit}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zamzam-record-${startDate}-to-${endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  const formatAmount = (num: number) => {
    return `${shopSettings.currency} ${num.toLocaleString()}`;
  };

  return (
    <div className="space-y-6">
      {/* View Switcher: Weekly Record vs Monthly Record vs Daily vs Custom */}
      <div className="no-print p-4 sm:p-5 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-emerald-400 font-bold mb-1">
            <CalendarRange className="w-4 h-4" />
            <span>Weekly & Monthly Records</span>
          </div>
          <h2 className="text-base font-bold text-white">
            {periodLabel}
          </h2>
          <p className="text-xs text-slate-400">
            Tareekh: <strong className="text-slate-200">{startDate}</strong> ta <strong className="text-slate-200">{endDate}</strong>
          </p>
        </div>

        {/* Navigation & Mode Selectors */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Main Mode Buttons */}
          <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700/60">
            <button
              onClick={() => setActiveReportMode('weekly')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeReportMode === 'weekly'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Haftawar (Weekly)</span>
            </button>

            <button
              onClick={() => setActiveReportMode('monthly')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeReportMode === 'monthly'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Mahana (Monthly)</span>
            </button>

            <button
              onClick={() => setActiveReportMode('daily')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeReportMode === 'daily'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Aaj (Daily)</span>
            </button>

            <button
              onClick={() => setActiveReportMode('custom')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeReportMode === 'custom'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Makhsoos</span>
            </button>
          </div>

          {/* Action buttons: Print & CSV */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/30 text-emerald-300 rounded-lg text-xs font-semibold transition flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Excel/CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sub-controllers based on mode */}
      {activeReportMode === 'weekly' && (
        <div className="no-print p-3 bg-slate-900/90 border border-slate-800 rounded-xl flex items-center justify-between gap-3 text-xs">
          <button
            onClick={() => setWeekOffset(weekOffset - 1)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Pichla Hafta (Previous Week)</span>
          </button>

          <div className="text-center">
            <span className="font-bold text-white block">
              {weekOffset === 0 ? 'Mojooda Hafta (Current Week)' : `${Math.abs(weekOffset)} Hafta Pehlay`}
            </span>
            <span className="text-[11px] text-slate-400">{startDate} ta {endDate}</span>
          </div>

          <button
            onClick={() => setWeekOffset(weekOffset + 1)}
            disabled={weekOffset >= 0}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1 ${
              weekOffset >= 0
                ? 'bg-slate-800/40 text-slate-600 cursor-not-allowed'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            <span>Agla Hafta (Next Week)</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {activeReportMode === 'monthly' && (
        <div className="no-print p-3 bg-slate-900/90 border border-slate-800 rounded-xl flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-300 font-medium">Mahina Chunein (Select Month):</span>
          </div>

          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
          />
        </div>
      )}

      {activeReportMode === 'custom' && (
        <div className="no-print p-3 bg-slate-900/90 border border-slate-800 rounded-xl flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Shuru Tareekh:</span>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Khatam Tareekh:</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs"
            />
          </div>
        </div>
      )}

      {/* Main Report Container */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-6">
        {/* Printable Letterhead */}
        <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-black text-white">
              {shopSettings.businessName}
            </h1>
            {shopSettings.businessNameUrdu && (
              <p className="text-sm font-urdu font-bold text-slate-300">
                {shopSettings.businessNameUrdu}
              </p>
            )}
            <p className="text-xs text-slate-400 mt-0.5">
              WhatsApp: <strong className="text-emerald-400 font-mono">{shopSettings.phone} {shopSettings.phone2 ? `· ${shopSettings.phone2}` : ''}</strong>
            </p>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
              {activeReportMode === 'weekly' ? 'Haftawar Record (Weekly Statement)' : activeReportMode === 'monthly' ? 'Mahana Record (Monthly Statement)' : 'Financial Record'}
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              {startDate} ta {endDate}
            </span>
          </div>
        </div>

        {/* Financial KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Sales */}
          <div className="p-4 bg-slate-850 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 font-medium block">
              Kul Bikri (Total Sales)
            </span>
            <div className="text-xl font-bold text-white tabular-nums mt-1">
              {formatAmount(totalSalesRevenue)}
            </div>
            <span className="text-[11px] text-slate-500">
              {periodSales.length} Bills / Invoices
            </span>
          </div>

          {/* Cost of Goods */}
          <div className="p-4 bg-slate-850 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 font-medium block">
              Maal Ki Khareed (Cost)
            </span>
            <div className="text-xl font-bold text-slate-300 tabular-nums mt-1">
              {formatAmount(totalSalesCost)}
            </div>
            <span className="text-[11px] text-slate-500">
              Bikne wale maal ki cost
            </span>
          </div>

          {/* Expenses */}
          <div className="p-4 bg-slate-850 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 font-medium block">
              Kul Kharchay (Expenses)
            </span>
            <div className="text-xl font-bold text-rose-400 tabular-nums mt-1">
              -{formatAmount(totalExpensesAmount)}
            </div>
            <span className="text-[11px] text-slate-500">
              {periodExpenses.length} Kharchay darj
            </span>
          </div>

          {/* Net Profit */}
          <div className="p-4 bg-emerald-950/40 rounded-xl border border-emerald-500/30">
            <span className="text-xs text-emerald-300 font-bold block">
              Khalis Nafa (Net Profit)
            </span>
            <div className={`text-2xl font-black tabular-nums mt-1 ${
              netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {formatAmount(netProfit)}
            </div>
            <span className="text-[11px] text-emerald-300/80">
              Kacha Nafa: {formatAmount(grossProfit)}
            </span>
          </div>
        </div>

        {/* Secondary Cash Flow Indicators */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-3.5 bg-slate-850 rounded-xl border border-slate-800 flex justify-between items-center">
            <div>
              <span className="text-xs text-slate-400 block">Kul Naqd Wasooli (Cash Inflow)</span>
              <div className="text-base font-bold text-emerald-400 tabular-nums mt-0.5">
                {formatAmount(totalCashCollected)}
              </div>
            </div>
            <span className="text-[11px] text-slate-500">Naqad Sales + Udhaar Wasooli</span>
          </div>

          <div className="p-3.5 bg-slate-850 rounded-xl border border-slate-800 flex justify-between items-center">
            <div>
              <span className="text-xs text-slate-400 block">Naya Udhaar Diya (Credit Given)</span>
              <div className="text-base font-bold text-amber-400 tabular-nums mt-0.5">
                {formatAmount(totalCreditGiven)}
              </div>
            </div>
            <span className="text-[11px] text-slate-500">Grahakon ke zimme likha</span>
          </div>
        </div>

        {/* Weekly Day-by-Day Table (Displayed when Weekly Mode is active) */}
        {activeReportMode === 'weekly' && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-emerald-400" />
              <span>Hafte Ke Rozana Records (Day-by-Day Breakdown)</span>
            </h3>

            <div className="overflow-x-auto border border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 bg-slate-850">
                    <th className="py-2.5 px-3">Din</th>
                    <th className="py-2.5 px-3">Tareekh</th>
                    <th className="py-2.5 px-3 text-center">Bikri (Bills)</th>
                    <th className="py-2.5 px-3 text-right">Meezan Bikri</th>
                    <th className="py-2.5 px-3 text-right">Kharchay</th>
                    <th className="py-2.5 px-3 text-right">Khalis Nafa</th>
                    <th className="py-2.5 px-3 text-right">Cash Wasooli</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {weeklyDayBreakdown.map((d) => (
                    <tr key={d.date} className="hover:bg-slate-800/40 transition">
                      <td className="py-2.5 px-3 font-bold text-white">
                        {d.dayName}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-400">
                        {d.date}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono tabular-nums text-slate-300">
                        {d.salesCount}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold tabular-nums text-white">
                        {formatAmount(d.salesTotal)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-rose-400">
                        {d.expensesTotal > 0 ? `-${formatAmount(d.expensesTotal)}` : 'Rs. 0'}
                      </td>
                      <td className={`py-2.5 px-3 text-right font-mono font-bold tabular-nums ${
                        d.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {formatAmount(d.netProfit)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-200">
                        {formatAmount(d.cashInflow)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Monthly Week-by-Week Table (Displayed when Monthly Mode is active) */}
        {activeReportMode === 'monthly' && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <span>Mahine Ke Haftawar Records (Week-by-Week Breakdown)</span>
            </h3>

            <div className="overflow-x-auto border border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 bg-slate-850">
                    <th className="py-2.5 px-3">Hafta</th>
                    <th className="py-2.5 px-3">Muddat</th>
                    <th className="py-2.5 px-3 text-center">Bikri (Bills)</th>
                    <th className="py-2.5 px-3 text-right">Meezan Bikri</th>
                    <th className="py-2.5 px-3 text-right">Kharchay</th>
                    <th className="py-2.5 px-3 text-right">Khalis Nafa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {monthlyWeeksBreakdown.map((w, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40 transition">
                      <td className="py-2.5 px-3 font-bold text-white">
                        {w.name}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-400">
                        {w.start} ta {w.end}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono tabular-nums text-slate-300">
                        {w.salesCount}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold tabular-nums text-white">
                        {formatAmount(w.salesTotal)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-rose-400">
                        {w.expensesTotal > 0 ? `-${formatAmount(w.expensesTotal)}` : 'Rs. 0'}
                      </td>
                      <td className={`py-2.5 px-3 text-right font-mono font-bold tabular-nums ${
                        w.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {formatAmount(w.netProfit)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Top Selling Products in this Period */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Boxes className="w-4 h-4 text-emerald-400" />
            <span>Ziada Farokht Hone Wali Ashya (Top Disposable & Bags Sold)</span>
          </h3>

          <div className="overflow-x-auto border border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 bg-slate-850">
                  <th className="py-2.5 px-3">Cheez Ka Naam</th>
                  <th className="py-2.5 px-3 text-center">Farokht Shuda Tadaad</th>
                  <th className="py-2.5 px-3 text-right">Kul Bikri (Revenue)</th>
                  <th className="py-2.5 px-3 text-right">Munafa (Profit)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {topProducts.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-500">
                      Is muddat mein koi bikri darj nahi hui.
                    </td>
                  </tr>
                ) : (
                  topProducts.map((p, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40 transition">
                      <td className="py-2.5 px-3 font-semibold text-white">
                        {p.name}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono tabular-nums text-slate-300">
                        {p.qty} {p.unit}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold tabular-nums text-white">
                        {formatAmount(p.revenue)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold tabular-nums text-emerald-400">
                        +{formatAmount(p.profit)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
