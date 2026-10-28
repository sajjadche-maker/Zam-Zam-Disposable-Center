import React, { useState, useMemo } from 'react';
import { useKhata } from '../context/KhataContext';
import { ProductItem, SaleCartItem, PaymentMethod, SaleRecord } from '../types';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Printer,
  CheckCircle,
  Eye,
  ShoppingBag,
  CreditCard,
  User,
  History,
  Tag,
  ArrowRight
} from 'lucide-react';
import { getTodayString } from '../utils/storage';

export const SalesView: React.FC = () => {
  const {
    products,
    customers,
    sales,
    completeSale,
    deleteSale,
    setActiveInvoiceToView,
    shopSettings,
    t
  } = useKhata();

  const [activeSubTab, setActiveSubTab] = useState<'pos' | 'history'>('pos');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [cart, setCart] = useState<SaleCartItem[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customCustomerName, setCustomCustomerName] = useState<string>('Aam Grahak (Walk-in)');
  const [customCustomerPhone, setCustomCustomerPhone] = useState<string>('');
  const [cashTendered, setCashTendered] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [historySearch, setHistorySearch] = useState('');
  const [historyDateFilter, setHistoryDateFilter] = useState<'all' | 'today' | 'yesterday'>('today');

  // Categories extraction
  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category));
    return ['all', ...Array.from(set)];
  }, [products]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.code.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCat = selectedCategory === 'all' || p.category === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [products, searchQuery, selectedCategory]);

  // Cart Calculations
  const subtotal = cart.reduce((acc, it) => acc + it.total, 0);
  const netTotal = Math.max(0, subtotal - discount);
  const changeDue = cashTendered > netTotal ? cashTendered - netTotal : 0;
  const balanceDue =
    paymentMethod === 'credit'
      ? Math.max(0, netTotal - cashTendered)
      : paymentMethod === 'cash' && cashTendered < netTotal && cashTendered > 0
      ? netTotal - cashTendered
      : 0;

  // Add Item to Cart
  const handleAddToCart = (product: ProductItem) => {
    setCart((prev) => {
      const existing = prev.find((it) => it.itemId === product.id);
      if (existing) {
        const nextQty = existing.quantity + 1;
        const total = nextQty * existing.salePrice;
        const profit = total - nextQty * existing.purchasePrice;
        return prev.map((it) =>
          it.itemId === product.id ? { ...it, quantity: nextQty, total, profit } : it
        );
      } else {
        const quantity = 1;
        const total = product.salePrice;
        const profit = total - product.purchasePrice;
        return [
          ...prev,
          {
            itemId: product.id,
            code: product.code,
            name: product.name,
            unit: product.unit,
            quantity,
            purchasePrice: product.purchasePrice,
            salePrice: product.salePrice,
            total,
            profit,
          },
        ];
      }
    });
  };

  const handleUpdateQty = (itemId: string, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveItem(itemId);
      return;
    }
    setCart((prev) =>
      prev.map((it) => {
        if (it.itemId === itemId) {
          const total = newQty * it.salePrice;
          const profit = total - newQty * it.purchasePrice;
          return { ...it, quantity: newQty, total, profit };
        }
        return it;
      })
    );
  };

  const handleRemoveItem = (itemId: string) => {
    setCart((prev) => prev.filter((it) => it.itemId !== itemId));
  };

  const handleCustomerSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedCustomerId(val);
    if (!val) {
      setCustomCustomerName('Aam Grahak (Walk-in)');
      setCustomCustomerPhone('');
    } else {
      const cust = customers.find((c) => c.id === val);
      if (cust) {
        setCustomCustomerName(cust.name);
        setCustomCustomerPhone(cust.phone || '');
      }
    }
  };

  // Submit Sale
  const handleCompleteSale = () => {
    if (cart.length === 0) return;

    let amountPaid = netTotal;
    let due = 0;

    if (paymentMethod === 'credit') {
      amountPaid = cashTendered;
      due = Math.max(0, netTotal - cashTendered);
    } else if (paymentMethod === 'cash') {
      amountPaid = cashTendered > 0 ? Math.min(cashTendered, netTotal) : netTotal;
      due = Math.max(0, netTotal - amountPaid);
    }

    completeSale({
      customerName: customCustomerName || 'Aam Grahak',
      customerId: selectedCustomerId || undefined,
      customerPhone: customCustomerPhone || undefined,
      items: cart,
      subtotal,
      discount,
      total: netTotal,
      paymentMethod,
      amountPaid,
      balanceDue: due,
      notes: notes || undefined,
    });

    // Reset Cart
    setCart([]);
    setDiscount(0);
    setCashTendered(0);
    setNotes('');
  };

  // Filtered History
  const filteredSalesHistory = useMemo(() => {
    const today = getTodayString(0);
    const yesterday = getTodayString(-1);

    return sales.filter((s) => {
      const matchesSearch =
        s.invoiceNumber.toLowerCase().includes(historySearch.toLowerCase()) ||
        s.customerName.toLowerCase().includes(historySearch.toLowerCase());

      let matchesDate = true;
      if (historyDateFilter === 'today') matchesDate = s.date === today;
      else if (historyDateFilter === 'yesterday') matchesDate = s.date === yesterday;

      return matchesSearch && matchesDate;
    });
  }, [sales, historySearch, historyDateFilter]);

  return (
    <div className="space-y-4">
      {/* View Switcher: POS Terminal vs Sales History */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('pos')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeSubTab === 'pos'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>{t.sales.newBill} (POS)</span>
          </button>
          <button
            onClick={() => setActiveSubTab('history')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeSubTab === 'history'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <History className="w-4 h-4" />
            <span>{t.sales.recentInvoices} ({sales.length})</span>
          </button>
        </div>

        <div className="text-xs text-slate-400 hidden sm:block">
          <span>{products.length} Items Mojood</span>
        </div>
      </div>

      {activeSubTab === 'pos' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Product Catalog & Search (7 Cols) */}
          <div className="lg:col-span-7 space-y-3">
            {/* Search and Category Bar */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t.sales.searchProduct}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                      selectedCategory === cat
                        ? 'bg-slate-800 text-emerald-400 border border-emerald-500/30'
                        : 'text-slate-400 hover:text-slate-200 bg-slate-900/60'
                    }`}
                  >
                    {cat === 'all' ? t.sales.allCategories : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[560px] overflow-y-auto pr-1">
              {filteredProducts.map((p) => {
                const isOutOfStock = p.stockQuantity <= 0;
                const isLowStock = p.stockQuantity <= p.minStockAlert;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleAddToCart(p)}
                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between group ${
                      isOutOfStock
                        ? 'bg-slate-900/40 border-slate-800/50 opacity-60 cursor-not-allowed'
                        : 'bg-slate-900 border-slate-800 hover:border-emerald-500/50 hover:bg-slate-850'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 text-[10px] text-slate-400 mb-1">
                        <span className="font-mono">#{p.code}</span>
                        <span
                          className={`font-semibold ${
                            isOutOfStock
                              ? 'text-rose-400'
                              : isLowStock
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                          }`}
                        >
                          {p.stockQuantity} {p.unit}
                        </span>
                      </div>
                      <h3 className="text-xs font-bold text-white group-hover:text-emerald-300 transition line-clamp-2">
                        {p.name}
                      </h3>
                      {p.nameUrdu && (
                        <p className="text-[11px] text-slate-400 font-urdu mt-0.5 line-clamp-1">
                          {p.nameUrdu}
                        </p>
                      )}
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-400 tabular-nums">
                        {shopSettings.currency} {p.salePrice}
                      </span>
                      <span className="w-5 h-5 rounded-md bg-slate-800 group-hover:bg-emerald-600 group-hover:text-white text-slate-300 flex items-center justify-center transition">
                        <Plus className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Active Cart / Bill Generation (5 Cols) */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-xl">
            <div>
              {/* Cart Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-white">{t.sales.cartItems}</h2>
                  <span className="text-xs text-slate-400">({cart.length})</span>
                </div>
                {cart.length > 0 && (
                  <button
                    onClick={() => setCart([])}
                    className="text-xs text-rose-400 hover:underline"
                  >
                    Khali Karein
                  </button>
                )}
              </div>

              {/* Cart Items List */}
              <div className="divide-y divide-slate-800/80 max-h-[240px] overflow-y-auto my-2 pr-1">
                {cart.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-500">
                    {t.sales.emptyCart}
                  </div>
                ) : (
                  cart.map((item) => (
                    <div key={item.itemId} className="py-2.5 flex items-center justify-between gap-2 text-xs">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-white truncate">{item.name}</h4>
                        <div className="text-[11px] text-slate-400 mt-0.5 tabular-nums">
                          {shopSettings.currency} {item.salePrice} / {item.unit}
                        </div>
                      </div>

                      {/* Quantity Controller */}
                      <div className="flex items-center gap-1.5 bg-slate-800/90 rounded-lg p-0.5 border border-slate-700/60">
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(item.itemId, item.quantity - 1)}
                          className="w-6 h-6 flex items-center justify-center text-slate-300 hover:text-white rounded hover:bg-slate-700"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) => handleUpdateQty(item.itemId, parseInt(e.target.value) || 1)}
                          className="w-8 text-center bg-transparent text-white text-xs font-bold font-mono focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(item.itemId, item.quantity + 1)}
                          className="w-6 h-6 flex items-center justify-center text-slate-300 hover:text-white rounded hover:bg-slate-700"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Subtotal & Delete */}
                      <div className="text-right pl-2">
                        <div className="font-bold text-white tabular-nums">
                          {shopSettings.currency} {item.total}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.itemId)}
                          className="text-slate-500 hover:text-rose-400 text-[10px] mt-0.5"
                        >
                          Hata dein
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Bill Controls & Checkout Form */}
            <div className="pt-3 border-t border-slate-800 space-y-3">
              {/* Customer Selection */}
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  {t.sales.customer}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={selectedCustomerId}
                    onChange={handleCustomerSelect}
                    className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">{t.sales.walkInCustomer}</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.balance > 0 ? `(Udhaar: ${c.balance})` : ''}
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    value={customCustomerName}
                    onChange={(e) => setCustomCustomerName(e.target.value)}
                    placeholder="Grahak ka naam"
                    className="px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Payment Mode Selector */}
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  {t.sales.paymentMode}
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['cash', 'credit', 'bank'] as PaymentMethod[]).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setPaymentMethod(mode)}
                      className={`py-1.5 text-xs font-semibold rounded-lg border transition ${
                        paymentMethod === mode
                          ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      {mode === 'cash' ? t.sales.cash : mode === 'credit' ? t.sales.credit : t.sales.bank}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cash Tendered vs Change Calculation */}
              {paymentMethod === 'cash' && (
                <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-800/40 rounded-xl border border-slate-700/50">
                  <div>
                    <label className="block text-[10px] text-slate-400">
                      Customer Se Li Gayi Cash
                    </label>
                    <input
                      type="number"
                      value={cashTendered || ''}
                      onChange={(e) => setCashTendered(parseFloat(e.target.value) || 0)}
                      placeholder={netTotal.toString()}
                      className="w-full px-2 py-1 mt-0.5 bg-slate-800 border border-slate-700 rounded text-white text-xs font-mono font-bold focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400">
                      Wapas Karni Hai (Change)
                    </label>
                    <div className="px-2 py-1 mt-0.5 bg-slate-900 border border-slate-800 rounded text-emerald-400 font-mono font-bold text-xs">
                      {shopSettings.currency} {changeDue.toLocaleString()}
                    </div>
                  </div>
                </div>
              )}

              {/* Discount Input */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">{t.sales.discount}:</span>
                <div className="flex items-center gap-1">
                  <span className="text-slate-500 font-mono">Rs.</span>
                  <input
                    type="number"
                    min={0}
                    value={discount || ''}
                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="w-20 px-2 py-1 bg-slate-800 border border-slate-700 rounded text-right text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Grand Net Total Banner */}
              <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-emerald-300 font-semibold block">
                    {t.sales.netTotal}
                  </span>
                  <div className="text-2xl font-black text-white tabular-nums tracking-tight">
                    {shopSettings.currency} {netTotal.toLocaleString()}
                  </div>
                </div>

                <button
                  type="button"
                  disabled={cart.length === 0}
                  onClick={handleCompleteSale}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-md ${
                    cart.length > 0
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <span>{t.sales.confirmSale}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Sales History View */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Bill number ya customer se talash karein..."
                className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center gap-1.5">
              {(['today', 'yesterday', 'all'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setHistoryDateFilter(filter)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    historyDateFilter === filter
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {filter === 'today' ? 'Aaj' : filter === 'yesterday' ? 'Kal' : 'Sab'}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2.5 px-3">Bill #</th>
                  <th className="py-2.5 px-3">Tareekh</th>
                  <th className="py-2.5 px-3">Grahak (Customer)</th>
                  <th className="py-2.5 px-3">Adaigi</th>
                  <th className="py-2.5 px-3 text-right">Meezan</th>
                  <th className="py-2.5 px-3 text-right">Munafa</th>
                  <th className="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredSalesHistory.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      Koi record nahi mila.
                    </td>
                  </tr>
                ) : (
                  filteredSalesHistory.map((sale) => (
                    <tr key={sale.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-2.5 px-3 font-mono font-bold text-white">
                        {sale.invoiceNumber}
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">
                        {sale.date} <span className="text-[10px] text-slate-500">({sale.time})</span>
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-200">
                        {sale.customerName}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`text-[11px] font-semibold ${
                            sale.paymentMethod === 'credit'
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                          }`}
                        >
                          {sale.paymentMethod === 'credit' ? 'Udhaar' : 'Naqad'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-white font-mono tabular-nums">
                        {shopSettings.currency} {sale.total.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold text-emerald-400 font-mono tabular-nums">
                        +{shopSettings.currency} {sale.totalProfit.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setActiveInvoiceToView(sale)}
                            title="Rasid Dekhein / Print"
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(t.sales.deleteSaleConfirm)) {
                                deleteSale(sale.id);
                              }
                            }}
                            title="Delete Sale & Restore Stock"
                            className="p-1 rounded bg-slate-800 hover:bg-rose-950/60 text-rose-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
