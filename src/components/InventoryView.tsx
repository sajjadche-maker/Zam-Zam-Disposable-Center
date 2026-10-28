import React, { useState, useMemo } from 'react';
import { useKhata } from '../context/KhataContext';
import { ProductItem } from '../types';
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  ArrowUpRight,
  Edit,
  Trash2,
  TrendingUp,
  Boxes,
  MinusCircle,
  PlusCircle,
  X,
  FileSpreadsheet
} from 'lucide-react';
import { CsvImportModal } from './CsvImportModal';

interface InventoryViewProps {
  isOpenStockInDirectly?: boolean;
  onCloseDirectModal?: () => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  isOpenStockInDirectly = false,
  onCloseDirectModal,
}) => {
  const {
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    adjustStock,
    shopSettings,
    t
  } = useKhata();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ProductItem | null>(null);
  const [stockAdjustItem, setStockAdjustItem] = useState<{
    item: ProductItem;
    type: 'stock_in' | 'stock_out';
  } | null>(null);
  const [adjustQty, setAdjustQty] = useState<number | ''>('');
  const [adjustNotes, setAdjustNotes] = useState('');

  // Handle direct stock in open prop
  React.useEffect(() => {
    if (isOpenStockInDirectly && products.length > 0) {
      setStockAdjustItem({ item: products[0], type: 'stock_in' });
    }
  }, [isOpenStockInDirectly, products]);

  // Form state for add/edit item
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    nameUrdu: '',
    category: 'General',
    purchasePrice: '' as number | '',
    salePrice: '' as number | '',
    stockQuantity: '' as number | '',
    unit: 'kg',
    minStockAlert: 10,
  });

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category));
    return ['all', ...Array.from(set)];
  }, [products]);

  // Valuation metrics
  const totalCostValue = useMemo(() => {
    return products.reduce((acc, p) => acc + p.stockQuantity * p.purchasePrice, 0);
  }, [products]);

  const totalRetailValue = useMemo(() => {
    return products.reduce((acc, p) => acc + p.stockQuantity * p.salePrice, 0);
  }, [products]);

  const potentialProfit = totalRetailValue - totalCostValue;

  const lowStockItems = useMemo(() => {
    return products.filter((p) => p.stockQuantity <= p.minStockAlert);
  }, [products]);

  // Filtered List
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesLowStock = !filterLowStock || p.stockQuantity <= p.minStockAlert;
      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
      return matchesSearch && matchesLowStock && matchesCategory;
    });
  }, [products, searchQuery, filterLowStock, selectedCategory]);

  const handleOpenAdd = () => {
    const nextCode = (1000 + products.length + 1).toString();
    setFormData({
      code: nextCode,
      name: '',
      nameUrdu: '',
      category: 'General',
      purchasePrice: '',
      salePrice: '',
      stockQuantity: '',
      unit: 'kg',
      minStockAlert: 10,
    });
    setEditingItem(null);
    setShowAddModal(true);
  };

  const handleOpenEdit = (item: ProductItem) => {
    setEditingItem(item);
    setFormData({
      code: item.code,
      name: item.name,
      nameUrdu: item.nameUrdu || '',
      category: item.category,
      purchasePrice: item.purchasePrice,
      salePrice: item.salePrice,
      stockQuantity: item.stockQuantity,
      unit: item.unit,
      minStockAlert: item.minStockAlert,
    });
    setShowAddModal(true);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.salePrice) return;

    if (editingItem) {
      updateProduct(editingItem.id, {
        code: formData.code,
        name: formData.name,
        nameUrdu: formData.nameUrdu || undefined,
        category: formData.category,
        purchasePrice: Number(formData.purchasePrice) || 0,
        salePrice: Number(formData.salePrice) || 0,
        stockQuantity: Number(formData.stockQuantity) || 0,
        unit: formData.unit,
        minStockAlert: Number(formData.minStockAlert) || 5,
      });
    } else {
      addProduct({
        code: formData.code,
        name: formData.name,
        nameUrdu: formData.nameUrdu || undefined,
        category: formData.category,
        purchasePrice: Number(formData.purchasePrice) || 0,
        salePrice: Number(formData.salePrice) || 0,
        stockQuantity: Number(formData.stockQuantity) || 0,
        unit: formData.unit,
        minStockAlert: Number(formData.minStockAlert) || 5,
      });
    }

    setShowAddModal(false);
    setEditingItem(null);
  };

  const handleStockAdjustmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockAdjustItem || !adjustQty || adjustQty <= 0) return;

    adjustStock(
      stockAdjustItem.item.id,
      Number(adjustQty),
      stockAdjustItem.type,
      adjustNotes || (stockAdjustItem.type === 'stock_in' ? 'Maal aya' : 'Nuqsan / Zaya')
    );

    setStockAdjustItem(null);
    setAdjustQty('');
    setAdjustNotes('');
    if (onCloseDirectModal) onCloseDirectModal();
  };

  return (
    <div className="space-y-6">
      {/* Stock Valuation KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Items */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-xs text-slate-400 font-medium block">
            {t.stock.totalItems}
          </span>
          <div className="text-xl sm:text-2xl font-bold text-white tabular-nums mt-1">
            {products.length}
          </div>
          <span className="text-[11px] text-slate-500">
            {lowStockItems.length} Kam stock ashya
          </span>
        </div>

        {/* Total Cost Value */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-xs text-slate-400 font-medium block">
            {t.stock.totalStockCost}
          </span>
          <div className="text-xl sm:text-2xl font-bold text-slate-200 tabular-nums mt-1">
            {shopSettings.currency} {totalCostValue.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-500">
            Khareed bunyad par
          </span>
        </div>

        {/* Total Retail Value */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-xs text-slate-400 font-medium block">
            {t.stock.totalStockRetail}
          </span>
          <div className="text-xl sm:text-2xl font-bold text-emerald-400 tabular-nums mt-1">
            {shopSettings.currency} {totalRetailValue.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-500">
            Bikri qeemat bunyad par
          </span>
        </div>

        {/* Potential Profit */}
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-xs text-slate-400 font-medium block">
            {t.stock.potentialProfit}
          </span>
          <div className="text-xl sm:text-2xl font-bold text-sky-400 tabular-nums mt-1">
            +{shopSettings.currency} {potentialProfit.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-500">
            Mukammal bikne par munafa
          </span>
        </div>
      </div>

      {/* Control Bar: Search, Category Filters, Add Item */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.stock.searchPlaceholder}
              className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setFilterLowStock(!filterLowStock)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition border flex items-center gap-1.5 ${
                filterLowStock
                  ? 'bg-amber-950/60 border-amber-500/50 text-amber-300'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{t.stock.lowStockOnly} ({lowStockItems.length})</span>
            </button>

            <button
              onClick={() => setShowCsvModal(true)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 border border-slate-700 hover:border-emerald-500/40 text-xs font-bold rounded-lg transition shadow-sm flex items-center gap-1.5 shrink-0"
              title="CSV File Se Bulk Stock Upload Karein"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>CSV Bulk Upload</span>
            </button>

            <button
              onClick={handleOpenAdd}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition shadow-sm flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>{t.stock.addNewItem}</span>
            </button>
          </div>
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
                  : 'text-slate-400 hover:text-slate-200 bg-slate-800/40'
              }`}
            >
              {cat === 'all' ? 'All Categories' : cat}
            </button>
          ))}
        </div>

        {/* Stock Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-2.5 px-3">Code</th>
                <th className="py-2.5 px-3">Cheez Ka Naam</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3 text-right">Khareed (Cost)</th>
                <th className="py-2.5 px-3 text-right">Bikri (Sale)</th>
                <th className="py-2.5 px-3 text-right">Munafa / Unit</th>
                <th className="py-2.5 px-3 text-center">Mojooda Stock</th>
                <th className="py-2.5 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center text-slate-500">
                        <Boxes className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-white">Koi item nahi mila</p>
                        <p className="text-xs text-slate-500">Naya item shamil karein ya CSV file se bulk stock upload karein</p>
                      </div>
                      <div className="flex items-center gap-2 pt-2">
                        <button
                          onClick={handleOpenAdd}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition shadow-sm flex items-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>{t.stock.addNewItem}</span>
                        </button>
                        <button
                          onClick={() => setShowCsvModal(true)}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 text-xs font-bold rounded-lg transition flex items-center gap-1.5"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                          <span>CSV Bulk Upload</span>
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isOutOfStock = p.stockQuantity <= 0;
                  const isLow = p.stockQuantity <= p.minStockAlert;
                  const unitProfit = p.salePrice - p.purchasePrice;

                  return (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-2.5 px-3 font-mono text-slate-400 font-semibold">
                        #{p.code}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-white">
                        <div>
                          <span>{p.name}</span>
                          {p.nameUrdu && (
                            <span className="block text-[11px] text-slate-400 font-urdu">
                              {p.nameUrdu}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">
                        {p.category}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-slate-300">
                        {shopSettings.currency} {p.purchasePrice}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold tabular-nums text-white">
                        {shopSettings.currency} {p.salePrice}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-emerald-400">
                        +{shopSettings.currency} {unitProfit}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold font-mono tabular-nums ${
                            isOutOfStock
                              ? 'bg-rose-950/80 text-rose-400 border border-rose-500/30'
                              : isLow
                              ? 'bg-amber-950/80 text-amber-300 border border-amber-500/30'
                              : 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {p.stockQuantity} {p.unit}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {/* Quick Stock In */}
                          <button
                            onClick={() => setStockAdjustItem({ item: p, type: 'stock_in' })}
                            title="Maal Aya (Stock In)"
                            className="p-1 rounded bg-slate-800 hover:bg-emerald-950/70 text-emerald-400 transition"
                          >
                            <PlusCircle className="w-3.5 h-3.5" />
                          </button>

                          {/* Quick Stock Out */}
                          <button
                            onClick={() => setStockAdjustItem({ item: p, type: 'stock_out' })}
                            title="Nuqsan / Wapas (Stock Out)"
                            className="p-1 rounded bg-slate-800 hover:bg-rose-950/70 text-rose-400 transition"
                          >
                            <MinusCircle className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit Item */}
                          <button
                            onClick={() => handleOpenEdit(p)}
                            title="Edit"
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Item */}
                          <button
                            onClick={() => {
                              if (window.confirm(t.stock.deleteConfirm)) {
                                deleteProduct(p.id);
                              }
                            }}
                            title="Delete"
                            className="p-1 rounded bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-emerald-400" />
                <span>{editingItem ? t.stock.editItem : t.stock.addNewItem}</span>
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    {t.stock.itemName} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Basmati Rice"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Urdu Naam (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.nameUrdu}
                    onChange={(e) => setFormData({ ...formData, nameUrdu: e.target.value })}
                    placeholder="مثلاً باسمتی چاول"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs font-urdu focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    {t.stock.code}
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="1001"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    {t.stock.category}
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="Grains, Dairy, Oils..."
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    {t.stock.costPrice} (Rs.)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.purchasePrice}
                    onChange={(e) => setFormData({ ...formData, purchasePrice: parseFloat(e.target.value) || '' })}
                    placeholder="250"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    {t.stock.salePrice} (Rs.) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={formData.salePrice}
                    onChange={(e) => setFormData({ ...formData, salePrice: parseFloat(e.target.value) || '' })}
                    placeholder="300"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs font-mono font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    {t.stock.unit}
                  </label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none"
                  >
                    <option value="kg">kg (کلو)</option>
                    <option value="gram">gram (گرام)</option>
                    <option value="piece">piece (عدد)</option>
                    <option value="pack">pack (پیکٹ)</option>
                    <option value="carton">carton (پیٹی)</option>
                    <option value="bag">bag (بوری/بیگ)</option>
                    <option value="litre">litre (لٹر)</option>
                    <option value="pouch">pouch (پاؤچ)</option>
                    <option value="dozen">dozen (درجن)</option>
                    <option value="meter">meter (میٹر)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    {t.stock.stockQty}
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.stockQuantity}
                    onChange={(e) => setFormData({ ...formData, stockQuantity: parseFloat(e.target.value) || '' })}
                    placeholder="50"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    {t.stock.minAlert}
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formData.minStockAlert}
                    onChange={(e) => setFormData({ ...formData, minStockAlert: parseInt(e.target.value) || 5 })}
                    placeholder="10"
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition shadow-sm"
                >
                  {t.stock.saveItem}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock In / Out Adjustment Modal */}
      {stockAdjustItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              {stockAdjustItem.type === 'stock_in' ? (
                <PlusCircle className="w-5 h-5 text-emerald-400" />
              ) : (
                <MinusCircle className="w-5 h-5 text-rose-400" />
              )}
              <span>
                {stockAdjustItem.type === 'stock_in' ? 'Maal Aya (Stock In)' : 'Nuqsan / Wapas (Stock Out)'}
              </span>
            </h3>

            <div className="p-3 bg-slate-800/60 rounded-xl mb-4 border border-slate-700/60 text-xs">
              <span className="text-slate-400 block font-mono">#{stockAdjustItem.item.code}</span>
              <span className="text-white font-bold text-sm block mt-0.5">{stockAdjustItem.item.name}</span>
              <span className="text-slate-400 mt-1 block">
                Mojooda Stock: <strong className="text-emerald-400">{stockAdjustItem.item.stockQuantity} {stockAdjustItem.item.unit}</strong>
              </span>
            </div>

            <form onSubmit={handleStockAdjustmentSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {stockAdjustItem.type === 'stock_in' ? 'Kitna Naya Maal Aya?' : 'Kitna Stock Kam Hua?'} *
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(parseFloat(e.target.value) || '')}
                  placeholder={`Tadaad (${stockAdjustItem.item.unit})`}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono text-sm font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Wajah / Supplier Note
                </label>
                <input
                  type="text"
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  placeholder="e.g. Mandi se khareeda / Damage hua"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setStockAdjustItem(null);
                    if (onCloseDirectModal) onCloseDirectModal();
                  }}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  className={`flex-1 py-2 text-white rounded-lg text-xs font-bold transition shadow-sm ${
                    stockAdjustItem.type === 'stock_in'
                      ? 'bg-emerald-600 hover:bg-emerald-500'
                      : 'bg-rose-600 hover:bg-rose-500'
                  }`}
                >
                  Tasdeeq Karein
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Bulk Import Modal */}
      <CsvImportModal
        isOpen={showCsvModal}
        onClose={() => setShowCsvModal(false)}
      />
    </div>
  );
};
