import React, { useState, useMemo } from 'react';
import { useKhata } from '../context/KhataContext';
import { CustomerRecord } from '../types';
import {
  Users,
  Plus,
  Search,
  Wallet,
  Phone,
  Share2,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  X,
  Printer,
  CreditCard,
  MessageCircle
} from 'lucide-react';

interface KhataViewProps {
  isOpenPaymentModalDirectly?: boolean;
  onCloseDirectModal?: () => void;
}

export const KhataView: React.FC<KhataViewProps> = ({
  isOpenPaymentModalDirectly = false,
  onCloseDirectModal,
}) => {
  const {
    customers,
    customerTransactions,
    addCustomer,
    recordCustomerPayment,
    shopSettings,
    t
  } = useKhata();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRecord | null>(null);

  // Modals
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(isOpenPaymentModalDirectly);
  const [paymentCustomerId, setPaymentCustomerId] = useState<string>('');
  const [paymentAmount, setPaymentAmount] = useState<number | ''>('');
  const [paymentNotes, setPaymentNotes] = useState('');

  // Add customer form state
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');
  const [newCustOpeningBalance, setNewCustOpeningBalance] = useState<number | ''>('');

  React.useEffect(() => {
    if (isOpenPaymentModalDirectly) {
      setShowPaymentModal(true);
      if (customers.length > 0 && !paymentCustomerId) {
        setPaymentCustomerId(customers[0].id);
      }
    }
  }, [isOpenPaymentModalDirectly, customers, paymentCustomerId]);

  // Total receivables
  const totalReceivable = useMemo(() => {
    return customers.reduce((acc, c) => acc + (c.balance || 0), 0);
  }, [customers]);

  const debtorCount = useMemo(() => {
    return customers.filter((c) => c.balance > 0).length;
  }, [customers]);

  // Filtered Customers
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      return (
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.phone && c.phone.includes(searchQuery))
      );
    });
  }, [customers, searchQuery]);

  // Customer Ledger Transactions
  const activeCustomerTransactions = useMemo(() => {
    if (!selectedCustomer) return [];
    return customerTransactions.filter((tx) => tx.customerId === selectedCustomer.id);
  }, [selectedCustomer, customerTransactions]);

  const handleAddCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) return;

    addCustomer(
      {
        name: newCustName.trim(),
        phone: newCustPhone.trim(),
        address: newCustAddress.trim() || undefined,
      },
      Number(newCustOpeningBalance) || 0
    );

    setNewCustName('');
    setNewCustPhone('');
    setNewCustAddress('');
    setNewCustOpeningBalance('');
    setShowAddCustomerModal(false);
  };

  const handleRecordPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentCustomerId || !paymentAmount || paymentAmount <= 0) return;

    recordCustomerPayment(paymentCustomerId, Number(paymentAmount), paymentNotes);

    setPaymentAmount('');
    setPaymentNotes('');
    setShowPaymentModal(false);
    if (onCloseDirectModal) onCloseDirectModal();

    // If currently viewing customer, update selection
    if (selectedCustomer && selectedCustomer.id === paymentCustomerId) {
      const updated = customers.find((c) => c.id === paymentCustomerId);
      if (updated) setSelectedCustomer(updated);
    }
  };

  // WhatsApp Reminder Link
  const handleSendWhatsAppReminder = (cust: CustomerRecord) => {
    const rawMsg = t.khata.reminderMsg.replace('[AMOUNT]', `${shopSettings.currency} ${cust.balance.toLocaleString()}`);
    const fullMsg = `*${shopSettings.businessName}*\n${rawMsg}\n\nRabta: ${shopSettings.phone}`;
    const encoded = encodeURIComponent(fullMsg);

    if (cust.phone) {
      const clean = cust.phone.replace(/\D/g, '');
      const intl = clean.startsWith('0') ? '92' + clean.slice(1) : clean;
      window.open(`https://wa.me/${intl}?text=${encoded}`, '_blank');
    } else {
      navigator.clipboard.writeText(fullMsg);
      alert('Customer ka phone number nahi hai. Message copy kar liya gaya hai.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & KPI Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Udhaar Due */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium block">
              {t.khata.totalReceivable}
            </span>
            <div className="text-xl sm:text-2xl font-bold text-amber-300 tabular-nums mt-0.5">
              {shopSettings.currency} {totalReceivable.toLocaleString()}
            </div>
            <span className="text-[11px] text-slate-500">
              {debtorCount} Grahak se wasool karni hai
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>

        {/* Total Customers */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 font-medium block">
              {t.khata.totalCustomers}
            </span>
            <div className="text-xl sm:text-2xl font-bold text-white tabular-nums mt-0.5">
              {customers.length}
            </div>
            <span className="text-[11px] text-slate-500">
              Darj shuda grahak
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-white block">
              Wasooli / Naya Khata
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Cash wasool karein ya naya grahak darj karein
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                if (customers.length > 0) {
                  setPaymentCustomerId(customers[0].id);
                }
                setShowPaymentModal(true);
              }}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition shadow-sm"
            >
              + Wasooli
            </button>
            <button
              onClick={() => setShowAddCustomerModal(true)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-lg transition"
            >
              + Grahak
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Customer List + Detail Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Customers List (5 Cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white">Grahak List</h3>
            <button
              onClick={() => setShowAddCustomerModal(true)}
              className="text-xs text-emerald-400 font-semibold hover:underline flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Naya Grahak</span>
            </button>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.khata.searchCustomer}
              className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="divide-y divide-slate-800/80 max-h-[500px] overflow-y-auto pr-1">
            {filteredCustomers.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                Koi grahak nahi mila.
              </div>
            ) : (
              filteredCustomers.map((cust) => {
                const isSelected = selectedCustomer?.id === cust.id;
                return (
                  <div
                    key={cust.id}
                    onClick={() => setSelectedCustomer(cust)}
                    className={`py-3 px-2 rounded-xl transition cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-slate-800 border border-slate-700'
                        : 'hover:bg-slate-800/50'
                    }`}
                  >
                    <div>
                      <h4 className="text-xs font-bold text-white">{cust.name}</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        <span>{cust.phone || 'No Phone'}</span>
                        {cust.address && <span>· {cust.address}</span>}
                      </p>
                    </div>

                    <div className="text-right">
                      <div
                        className={`text-xs font-bold font-mono tabular-nums ${
                          cust.balance > 0 ? 'text-amber-400' : 'text-slate-400'
                        }`}
                      >
                        {shopSettings.currency} {cust.balance.toLocaleString()}
                      </div>
                      <span className="text-[10px] text-slate-500 block">
                        {cust.balance > 0 ? 'Udhaar Baqi' : 'Hisab Barabar'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Customer Detailed Ledger (7 Cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          {selectedCustomer ? (
            <div className="space-y-4">
              {/* Selected Customer Header Banner */}
              <div className="p-4 bg-slate-800/60 border border-slate-700/60 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] text-slate-400 font-mono block">
                    Grahak ID: #{selectedCustomer.id.slice(-4)}
                  </span>
                  <h3 className="text-base font-bold text-white mt-0.5">
                    {selectedCustomer.name}
                  </h3>
                  <div className="text-xs text-slate-300 mt-1 flex flex-wrap gap-2">
                    {selectedCustomer.phone && <span>📞 {selectedCustomer.phone}</span>}
                    {selectedCustomer.address && <span>📍 {selectedCustomer.address}</span>}
                  </div>
                </div>

                <div className="text-right sm:border-l sm:border-slate-700 sm:pl-4">
                  <span className="text-xs text-slate-400 block">Kul Baqi Udhaar</span>
                  <div className="text-xl font-black text-amber-400 font-mono tabular-nums">
                    {shopSettings.currency} {selectedCustomer.balance.toLocaleString()}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => {
                        setPaymentCustomerId(selectedCustomer.id);
                        setShowPaymentModal(true);
                      }}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition"
                    >
                      + Wasooli
                    </button>
                    {selectedCustomer.balance > 0 && (
                      <button
                        onClick={() => handleSendWhatsAppReminder(selectedCustomer)}
                        className="px-3 py-1 bg-green-600 hover:bg-green-500 text-white text-xs font-semibold rounded-lg transition flex items-center gap-1"
                        title="Send WhatsApp Reminder"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Transactions History Table */}
              <div>
                <h4 className="text-xs font-bold text-slate-300 mb-2">
                  {selectedCustomer.name} Ka Khatay Ka Record
                </h4>

                <div className="overflow-x-auto border border-slate-800 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 bg-slate-850">
                        <th className="py-2.5 px-3">Tareekh</th>
                        <th className="py-2.5 px-3">Tafseel (Notes)</th>
                        <th className="py-2.5 px-3 text-right">Udhaar Diya (+)</th>
                        <th className="py-2.5 px-3 text-right">Wasooli Hui (-)</th>
                        <th className="py-2.5 px-3 text-right">Baqi Raqam</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {activeCustomerTransactions.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-500">
                            Is grahak ki abhi tak koi transaction record nahi.
                          </td>
                        </tr>
                      ) : (
                        activeCustomerTransactions.map((tx) => (
                          <tr key={tx.id} className="hover:bg-slate-800/40 transition">
                            <td className="py-2.5 px-3 text-slate-400 font-mono">
                              {tx.date}
                            </td>
                            <td className="py-2.5 px-3 text-slate-200">
                              {tx.notes || (tx.type === 'credit_sale' ? 'Sauda Udhaar' : 'Cash Wasooli')}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono tabular-nums text-amber-400 font-bold">
                              {tx.type === 'credit_sale' ? `+${shopSettings.currency} ${tx.amount.toLocaleString()}` : '—'}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono tabular-nums text-emerald-400 font-bold">
                              {tx.type === 'payment_received' ? `-${shopSettings.currency} ${tx.amount.toLocaleString()}` : '—'}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono tabular-nums text-white font-bold">
                              {shopSettings.currency} {tx.newBalance.toLocaleString()}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-24 text-center text-slate-500 flex flex-col items-center justify-center">
              <Users className="w-12 h-12 text-slate-700 mb-3" />
              <p className="text-xs">
                Bayen janib se kisi grahak par click karein taake uska khata aur tareekh dekh sakein.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add Customer Modal */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-400" />
              <span>{t.khata.addCustomer}</span>
            </h3>

            <form onSubmit={handleAddCustomerSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {t.khata.customerName} *
                </label>
                <input
                  type="text"
                  required
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder="Grahak ka naam (e.g. Tariq Mehmood)"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {t.khata.phone}
                </label>
                <input
                  type="text"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  placeholder="0300-1234567"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {t.khata.address}
                </label>
                <input
                  type="text"
                  value={newCustAddress}
                  onChange={(e) => setNewCustAddress(e.target.value)}
                  placeholder="Mohalla, Gali ya Dukan ka pata"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Pichla Sabqa Udhaar (Opening Balance)
                </label>
                <input
                  type="number"
                  min={0}
                  value={newCustOpeningBalance}
                  onChange={(e) => setNewCustOpeningBalance(parseFloat(e.target.value) || '')}
                  placeholder="0"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(false)}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition shadow-sm"
                >
                  Grahak Shamil Karein
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment / Wasooli Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-emerald-400" />
              <span>{t.khata.recordPaymentTitle}</span>
            </h3>

            <form onSubmit={handleRecordPaymentSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Kis Grahak Se Wasool Hua? *
                </label>
                <select
                  required
                  value={paymentCustomerId}
                  onChange={(e) => setPaymentCustomerId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-emerald-500"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} (Baqi Udhaar: Rs. {c.balance.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {t.khata.amountReceived} (Rs.) *
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || '')}
                  placeholder="Raqam darj karein"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono text-sm font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Tafseel / Zariya (Notes)
                </label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="Naqd mila / Easypaisa se wasool hua"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowPaymentModal(false);
                    if (onCloseDirectModal) onCloseDirectModal();
                  }}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition shadow-sm"
                >
                  {t.khata.savePayment}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
