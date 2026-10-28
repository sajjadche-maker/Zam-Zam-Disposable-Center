import React, { useState, useMemo } from 'react';
import { useKhata } from '../context/KhataContext';
import { ExpenseCategory, ExpenseRecord } from '../types';
import {
  Plus,
  Trash2,
  Calendar,
  DollarSign,
  TrendingDown,
  Filter,
  Search,
  Receipt
} from 'lucide-react';
import { getTodayString } from '../utils/storage';

interface ExpensesViewProps {
  isOpenAddModalDirectly?: boolean;
  onCloseDirectModal?: () => void;
}

export const ExpensesView: React.FC<ExpensesViewProps> = ({
  isOpenAddModalDirectly = false,
  onCloseDirectModal,
}) => {
  const { expenses, addExpense, deleteExpense, shopSettings, t } = useKhata();

  const [showAddModal, setShowAddModal] = useState(isOpenAddModalDirectly);
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory>('chai_food');
  const [amount, setAmount] = useState<number | ''>('');
  const [description, setDescription] = useState('');
  const [recipient, setRecipient] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank'>('cash');
  const [expenseDate, setExpenseDate] = useState(getTodayString(0));
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Handle direct modal prop change
  React.useEffect(() => {
    if (isOpenAddModalDirectly) {
      setShowAddModal(true);
    }
  }, [isOpenAddModalDirectly]);

  const categories: ExpenseCategory[] = [
    'rent',
    'electricity',
    'salaries',
    'chai_food',
    'transport',
    'maintenance',
    'packaging',
    'other',
  ];

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0) return;

    addExpense({
      date: expenseDate,
      category: selectedCategory,
      amount: Number(amount),
      paymentMethod,
      description,
      recipient: recipient || undefined,
    });

    // Reset Form
    setAmount('');
    setDescription('');
    setRecipient('');
    setShowAddModal(false);
    if (onCloseDirectModal) onCloseDirectModal();
  };

  // Metrics
  const todayStr = getTodayString(0);
  const currentMonthStr = todayStr.substring(0, 7);

  const todayTotal = useMemo(() => {
    return expenses
      .filter((e) => e.date === todayStr)
      .reduce((acc, e) => acc + e.amount, 0);
  }, [expenses, todayStr]);

  const monthTotal = useMemo(() => {
    return expenses
      .filter((e) => e.date.startsWith(currentMonthStr))
      .reduce((acc, e) => acc + e.amount, 0);
  }, [expenses, currentMonthStr]);

  // Category breakdown for this month
  const categoryBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    expenses
      .filter((e) => e.date.startsWith(currentMonthStr))
      .forEach((e) => {
        map[e.category] = (map[e.category] || 0) + e.amount;
      });

    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [expenses, currentMonthStr]);

  // Filtered Expenses List
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const matchesCat = filterCategory === 'all' || e.category === filterCategory;
      const matchesSearch =
        e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (e.recipient && e.recipient.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCat && matchesSearch;
    });
  }, [expenses, filterCategory, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Metric: Today Expenses */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium block">
              Aaj Ke Kharchay
            </span>
            <div className="text-xl font-bold text-rose-400 tabular-nums mt-0.5">
              {shopSettings.currency} {todayTotal.toLocaleString()}
            </div>
            <span className="text-[11px] text-slate-500">
              {expenses.filter((e) => e.date === todayStr).length} Kharchay darj
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
            <Receipt className="w-5 h-5" />
          </div>
        </div>

        {/* Metric: This Month Expenses */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium block">
              {t.expenses.totalExpensesMonth}
            </span>
            <div className="text-xl font-bold text-slate-100 tabular-nums mt-0.5">
              {shopSettings.currency} {monthTotal.toLocaleString()}
            </div>
            <span className="text-[11px] text-slate-500">
              {currentMonthStr} Ka Mahina
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>

        {/* Action Button */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-white block">
              Naya Kharcha Likhein
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Dukan, kiraya, bijli, chai ya mulazim ki tankhwah
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition shadow-sm flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Kharcha Likhein</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Categories breakdown + Expenses History Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Monthly Category Breakdown (4 Cols) */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white border-b border-slate-800 pb-2">
            Is Mahine Ke Kharchon Ki Taqseem
          </h3>

          <div className="space-y-3">
            {categoryBreakdown.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">
                Is mahine abhi tak koi kharcha darj nahi.
              </p>
            ) : (
              categoryBreakdown.map(([cat, amt]) => {
                const percent = monthTotal > 0 ? Math.round((amt / monthTotal) * 100) : 0;
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300 font-medium">
                        {t.expenses.categories[cat as ExpenseCategory] || cat}
                      </span>
                      <span className="font-bold text-white tabular-nums">
                        {shopSettings.currency} {amt.toLocaleString()} ({percent}%)
                      </span>
                    </div>
                    {/* Clean progress bar */}
                    <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-rose-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Expenses Table & Filters (8 Cols) */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Kharchay ki tafseel ya naam se talash..."
                className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-rose-500"
              />
            </div>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none"
            >
              <option value="all">Sab Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {t.expenses.categories[c]}
                </option>
              ))}
            </select>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2.5 px-3">Tareekh</th>
                  <th className="py-2.5 px-3">Qisam</th>
                  <th className="py-2.5 px-3">Tafseel (Notes)</th>
                  <th className="py-2.5 px-3">Kis Ko Diye</th>
                  <th className="py-2.5 px-3 text-right">Raqam</th>
                  <th className="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      {t.expenses.noExpenses}
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">
                        {exp.date} <span className="text-[10px] text-slate-500">({exp.time})</span>
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-white whitespace-nowrap">
                        {t.expenses.categories[exp.category] || exp.category}
                      </td>
                      <td className="py-2.5 px-3 text-slate-300 max-w-[200px] truncate">
                        {exp.description || '—'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">
                        {exp.recipient || '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-rose-400 font-mono tabular-nums">
                        -{shopSettings.currency} {exp.amount.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => {
                            if (window.confirm('Kya aap is kharchay ko delete karna chahte hain?')) {
                              deleteExpense(exp.id);
                            }
                          }}
                          className="p-1 rounded bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Expense Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-rose-400" />
              <span>{t.expenses.addExpense}</span>
            </h2>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {t.expenses.category}
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as ExpenseCategory)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-rose-500"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {t.expenses.categories[c]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {t.expenses.amount} (Rs.) *
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || '')}
                  placeholder="Raqam darj karein (e.g. 500)"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono text-sm font-bold focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {t.expenses.description}
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Kis cheez ke liye kharcha hua? (optional)"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    {t.expenses.recipient}
                  </label>
                  <input
                    type="text"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="Kis ko diye (optional)"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Tareekh
                  </label>
                  <input
                    type="date"
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    if (onCloseDirectModal) onCloseDirectModal();
                  }}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition shadow-sm"
                >
                  {t.expenses.saveExpense}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
