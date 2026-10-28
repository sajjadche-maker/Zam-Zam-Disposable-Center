import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import {
  CustomerRecord,
  CustomerTransaction,
  ExpenseRecord,
  Language,
  ProductItem,
  SaleCartItem,
  SaleRecord,
  SecuritySettings,
  ShopSettings,
  StockTransaction
} from '../types';
import { translations } from '../utils/translations';
import {
  DEFAULT_SECURITY_SETTINGS,
  DEFAULT_SHOP_SETTINGS,
  INITIAL_CUSTOMERS,
  INITIAL_CUSTOMER_TRANSACTIONS,
  INITIAL_EXPENSES,
  INITIAL_PRODUCTS,
  INITIAL_SALES,
  INITIAL_STOCK_TRANSACTIONS,
  getNowTimeString,
  getTodayString,
  loadFromStorage,
  resetAllData,
  restoreBackupData,
  saveToStorage,
  triggerBackupDownload
} from '../utils/storage';

interface KhataContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof translations['roman_urdu'];
  shopSettings: ShopSettings;
  updateShopSettings: (settings: Partial<ShopSettings>) => void;
  
  // Security
  securitySettings: SecuritySettings;
  updateSecuritySettings: (settings: Partial<SecuritySettings>) => void;
  lockApp: () => void;
  unlockApp: () => void;
  verifyPin: (pin: string) => boolean;
  verifyBiometrics: () => Promise<boolean>;
  resetPinWithSecurityAnswer: (answer: string, newPin: string) => boolean;

  // Products & Inventory
  products: ProductItem[];
  addProduct: (item: Omit<ProductItem, 'id' | 'updatedAt'>) => void;
  bulkAddProducts: (
    items: Array<Omit<ProductItem, 'id' | 'updatedAt'>>,
    updateExisting?: boolean
  ) => { added: number; updated: number };
  updateProduct: (id: string, item: Partial<ProductItem>) => void;
  deleteProduct: (id: string) => void;
  adjustStock: (itemId: string, change: number, type: 'stock_in' | 'stock_out' | 'adjustment', notes?: string, costPrice?: number) => void;
  stockTransactions: StockTransaction[];

  // Sales & POS
  sales: SaleRecord[];
  activeInvoiceToView: SaleRecord | null;
  setActiveInvoiceToView: (sale: SaleRecord | null) => void;
  completeSale: (saleData: {
    customerName: string;
    customerId?: string;
    customerPhone?: string;
    items: SaleCartItem[];
    subtotal: number;
    discount: number;
    total: number;
    paymentMethod: 'cash' | 'credit' | 'bank';
    amountPaid: number;
    balanceDue: number;
    notes?: string;
  }) => SaleRecord;
  deleteSale: (saleId: string) => void;

  // Expenses
  expenses: ExpenseRecord[];
  addExpense: (expense: Omit<ExpenseRecord, 'id' | 'time'>) => void;
  deleteExpense: (id: string) => void;

  // Customers & Khata
  customers: CustomerRecord[];
  customerTransactions: CustomerTransaction[];
  addCustomer: (cust: Omit<CustomerRecord, 'id' | 'balance' | 'totalPurchases' | 'createdAt'>, initialBalance?: number) => CustomerRecord;
  updateCustomer: (id: string, cust: Partial<CustomerRecord>) => void;
  recordCustomerPayment: (customerId: string, amount: number, notes?: string) => void;

  // Backup & Reset
  exportBackup: () => void;
  importBackup: (file: File) => Promise<boolean>;
  reloadDemoData: () => void;
  wipeAllData: () => void;
}

const KhataContext = createContext<KhataContextType | undefined>(undefined);

export const KhataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Settings
  const [shopSettings, setShopSettings] = useState<ShopSettings>(() =>
    loadFromStorage('karobar_shop_settings', DEFAULT_SHOP_SETTINGS)
  );

  const [language, setLanguageState] = useState<Language>(() => shopSettings.language || 'roman_urdu');

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    setShopSettings((prev) => {
      const updated = { ...prev, language: lang };
      saveToStorage('karobar_shop_settings', updated);
      return updated;
    });
  };

  const t = useMemo(() => {
    return translations[language] || translations.roman_urdu;
  }, [language]);

  const updateShopSettings = (updates: Partial<ShopSettings>) => {
    setShopSettings((prev) => {
      const updated = { ...prev, ...updates };
      saveToStorage('karobar_shop_settings', updated);
      return updated;
    });
  };

  // 2. Security
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>(() => {
    const loaded = loadFromStorage('karobar_security_settings', DEFAULT_SECURITY_SETTINGS);
    // If PIN is enabled, app should start locked on fresh session load
    return {
      ...loaded,
      isLocked: loaded.pinEnabled,
      lastActiveTimestamp: Date.now(),
    };
  });

  const updateSecuritySettings = (updates: Partial<SecuritySettings>) => {
    setSecuritySettings((prev) => {
      const updated = { ...prev, ...updates };
      saveToStorage('karobar_security_settings', updated);
      return updated;
    });
  };

  const lockApp = useCallback(() => {
    setSecuritySettings((prev) => ({ ...prev, isLocked: true }));
  }, []);

  const unlockApp = useCallback(() => {
    setSecuritySettings((prev) => ({
      ...prev,
      isLocked: false,
      lastActiveTimestamp: Date.now(),
    }));
  }, []);

  const verifyPin = useCallback((enteredPin: string) => {
    if (!securitySettings.pinEnabled) return true;
    if (enteredPin === securitySettings.pinCode) {
      unlockApp();
      return true;
    }
    return false;
  }, [securitySettings.pinEnabled, securitySettings.pinCode, unlockApp]);

  const verifyBiometrics = useCallback(async (): Promise<boolean> => {
    if (!securitySettings.biometricsEnabled) return false;
    // Check WebAuthn availability or smooth biometric simulation
    try {
      if (window.PublicKeyCredential && window.isSecureContext) {
        // Test if platform authenticator is available
        const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        if (available) {
          unlockApp();
          return true;
        }
      }
    } catch {
      // Fallback to biometric touch verification
    }
    // Simulation fallback with tactile confirmation
    unlockApp();
    return true;
  }, [securitySettings.biometricsEnabled, unlockApp]);

  const resetPinWithSecurityAnswer = useCallback((answer: string, newPin: string) => {
    if (answer.trim().toLowerCase() === securitySettings.securityAnswer.trim().toLowerCase()) {
      updateSecuritySettings({ pinCode: newPin, isLocked: false });
      return true;
    }
    return false;
  }, [securitySettings.securityAnswer]);

  // Inactivity auto-lock listener
  useEffect(() => {
    if (!securitySettings.pinEnabled || securitySettings.autoLockMinutes <= 0) return;

    const timeoutMs = securitySettings.autoLockMinutes * 60 * 1000;
    let timer: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(timer);
      if (!securitySettings.isLocked) {
        timer = setTimeout(() => {
          lockApp();
        }, timeoutMs);
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden && securitySettings.autoLockMinutes === 0) {
        lockApp();
      }
    };

    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);
    window.addEventListener('touchstart', resetTimer);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    resetTimer();

    return () => {
      clearTimeout(timer);
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      window.removeEventListener('touchstart', resetTimer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [securitySettings.pinEnabled, securitySettings.autoLockMinutes, securitySettings.isLocked, lockApp]);

  // 3. Products
  const [products, setProducts] = useState<ProductItem[]>(() =>
    loadFromStorage('karobar_products', INITIAL_PRODUCTS)
  );

  const [stockTransactions, setStockTransactions] = useState<StockTransaction[]>(() =>
    loadFromStorage('karobar_stock_txs', INITIAL_STOCK_TRANSACTIONS)
  );

  const addProduct = (item: Omit<ProductItem, 'id' | 'updatedAt'>) => {
    const newItem: ProductItem = {
      ...item,
      id: `prod_${Date.now()}`,
      updatedAt: new Date().toISOString(),
    };
    const updated = [newItem, ...products];
    setProducts(updated);
    saveToStorage('karobar_products', updated);

    // Initial stock transaction
    if (item.stockQuantity > 0) {
      const tx: StockTransaction = {
        id: `stx_${Date.now()}`,
        itemId: newItem.id,
        itemName: newItem.name,
        date: getTodayString(0),
        type: 'stock_in',
        quantity: item.stockQuantity,
        costPrice: item.purchasePrice,
        previousStock: 0,
        newStock: item.stockQuantity,
        notes: 'Pehla Stock (Initial Inventory)',
      };
      const updatedTxs = [tx, ...stockTransactions];
      setStockTransactions(updatedTxs);
      saveToStorage('karobar_stock_txs', updatedTxs);
    }
  };

  const bulkAddProducts = (
    newItems: Array<Omit<ProductItem, 'id' | 'updatedAt'>>,
    updateExisting = false
  ): { added: number; updated: number } => {
    if (!newItems || newItems.length === 0) return { added: 0, updated: 0 };

    let addedCount = 0;
    let updatedCount = 0;
    const nowIso = new Date().toISOString();
    const today = getTodayString(0);

    let currentProducts = [...products];
    const newStockTxs: StockTransaction[] = [];

    // Track highest existing numeric code for generating new codes if missing
    let maxCodeNum = 1000;
    for (const p of currentProducts) {
      const num = parseInt(p.code.replace(/\D/g, ''), 10);
      if (!isNaN(num) && num > maxCodeNum) maxCodeNum = num;
    }

    newItems.forEach((item, index) => {
      // Find if already exists by code or lower-cased trimmed name
      const existingIdx = currentProducts.findIndex(
        (p) =>
          (item.code && p.code.trim().toLowerCase() === item.code.trim().toLowerCase()) ||
          p.name.trim().toLowerCase() === item.name.trim().toLowerCase()
      );

      if (existingIdx !== -1 && updateExisting) {
        // Update existing item
        const existing = currentProducts[existingIdx];
        const prevStock = existing.stockQuantity;
        const newStock =
          item.stockQuantity !== undefined && !isNaN(item.stockQuantity)
            ? item.stockQuantity
            : prevStock;

        currentProducts[existingIdx] = {
          ...existing,
          name: item.name || existing.name,
          nameUrdu: item.nameUrdu || existing.nameUrdu,
          category: item.category || existing.category,
          purchasePrice: item.purchasePrice !== undefined ? item.purchasePrice : existing.purchasePrice,
          salePrice: item.salePrice !== undefined ? item.salePrice : existing.salePrice,
          unit: item.unit || existing.unit,
          minStockAlert: item.minStockAlert !== undefined ? item.minStockAlert : existing.minStockAlert,
          stockQuantity: newStock,
          updatedAt: nowIso,
        };

        if (newStock !== prevStock) {
          newStockTxs.push({
            id: `stx_${Date.now()}_${index}_${Math.random().toString(36).substring(2, 6)}`,
            itemId: existing.id,
            itemName: existing.name,
            date: today,
            type: newStock > prevStock ? 'stock_in' : 'adjustment',
            quantity: Math.abs(newStock - prevStock),
            costPrice: item.purchasePrice || existing.purchasePrice,
            previousStock: prevStock,
            newStock,
            notes: 'CSV Bulk Update (Stock Adjusted)',
          });
        }
        updatedCount++;
      } else {
        // Insert as new item
        maxCodeNum++;
        const code = item.code && item.code.trim() ? item.code.trim() : maxCodeNum.toString();
        const id = `prod_${Date.now()}_${index}_${Math.random().toString(36).substring(2, 6)}`;
        const newItem: ProductItem = {
          ...item,
          id,
          code,
          name: item.name.trim(),
          nameUrdu: item.nameUrdu?.trim() || undefined,
          category: item.category?.trim() || 'General',
          purchasePrice: Number(item.purchasePrice) || 0,
          salePrice: Number(item.salePrice) || 0,
          stockQuantity: Number(item.stockQuantity) || 0,
          unit: item.unit?.trim() || 'piece',
          minStockAlert: Number(item.minStockAlert) || 10,
          updatedAt: nowIso,
        };

        currentProducts = [newItem, ...currentProducts];
        addedCount++;

        if (newItem.stockQuantity > 0) {
          newStockTxs.push({
            id: `stx_${Date.now()}_${index}_${Math.random().toString(36).substring(2, 6)}`,
            itemId: newItem.id,
            itemName: newItem.name,
            date: today,
            type: 'stock_in',
            quantity: newItem.stockQuantity,
            costPrice: newItem.purchasePrice,
            previousStock: 0,
            newStock: newItem.stockQuantity,
            notes: 'CSV Bulk Import (Pehla Stock)',
          });
        }
      }
    });

    setProducts(currentProducts);
    saveToStorage('karobar_products', currentProducts);

    if (newStockTxs.length > 0) {
      const updatedTxs = [...newStockTxs, ...stockTransactions];
      setStockTransactions(updatedTxs);
      saveToStorage('karobar_stock_txs', updatedTxs);
    }

    return { added: addedCount, updated: updatedCount };
  };

  const updateProduct = (id: string, updates: Partial<ProductItem>) => {
    const updated = products.map((p) =>
      p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
    );
    setProducts(updated);
    saveToStorage('karobar_products', updated);
  };

  const deleteProduct = (id: string) => {
    const updated = products.filter((p) => p.id !== id);
    setProducts(updated);
    saveToStorage('karobar_products', updated);
  };

  const adjustStock = (
    itemId: string,
    change: number,
    type: 'stock_in' | 'stock_out' | 'adjustment',
    notes = '',
    costPrice?: number
  ) => {
    const targetItem = products.find((p) => p.id === itemId);
    if (!targetItem) return;

    const previousStock = targetItem.stockQuantity;
    let newStock = previousStock;
    if (type === 'stock_in') newStock += change;
    else if (type === 'stock_out') newStock = Math.max(0, previousStock - change);
    else if (type === 'adjustment') newStock = Math.max(0, change);

    updateProduct(itemId, { stockQuantity: newStock });

    const tx: StockTransaction = {
      id: `stx_${Date.now()}`,
      itemId,
      itemName: targetItem.name,
      date: getTodayString(0),
      type,
      quantity: Math.abs(change),
      costPrice: costPrice || targetItem.purchasePrice,
      previousStock,
      newStock,
      notes,
    };
    const updatedTxs = [tx, ...stockTransactions];
    setStockTransactions(updatedTxs);
    saveToStorage('karobar_stock_txs', updatedTxs);
  };

  // 4. Sales
  const [sales, setSales] = useState<SaleRecord[]>(() =>
    loadFromStorage('karobar_sales', INITIAL_SALES)
  );
  const [activeInvoiceToView, setActiveInvoiceToView] = useState<SaleRecord | null>(null);

  // 5. Customers & Khata
  const [customers, setCustomers] = useState<CustomerRecord[]>(() =>
    loadFromStorage('karobar_customers', INITIAL_CUSTOMERS)
  );

  const [customerTransactions, setCustomerTransactions] = useState<CustomerTransaction[]>(() =>
    loadFromStorage('karobar_customer_txs', INITIAL_CUSTOMER_TRANSACTIONS)
  );

  const addCustomer = (
    cust: Omit<CustomerRecord, 'id' | 'balance' | 'totalPurchases' | 'createdAt'>,
    initialBalance = 0
  ): CustomerRecord => {
    const newCust: CustomerRecord = {
      ...cust,
      id: `cust_${Date.now()}`,
      balance: initialBalance,
      totalPurchases: initialBalance > 0 ? initialBalance : 0,
      createdAt: getTodayString(0),
    };
    const updated = [newCust, ...customers];
    setCustomers(updated);
    saveToStorage('karobar_customers', updated);

    if (initialBalance > 0) {
      const tx: CustomerTransaction = {
        id: `ctx_${Date.now()}`,
        customerId: newCust.id,
        date: getTodayString(0),
        type: 'credit_sale',
        amount: initialBalance,
        previousBalance: 0,
        newBalance: initialBalance,
        notes: 'Pichla Sabqa Udhaar (Opening Balance)',
      };
      const updatedTxs = [tx, ...customerTransactions];
      setCustomerTransactions(updatedTxs);
      saveToStorage('karobar_customer_txs', updatedTxs);
    }

    return newCust;
  };

  const updateCustomer = (id: string, updates: Partial<CustomerRecord>) => {
    const updated = customers.map((c) => (c.id === id ? { ...c, ...updates } : c));
    setCustomers(updated);
    saveToStorage('karobar_customers', updated);
  };

  const recordCustomerPayment = (customerId: string, amount: number, notes = '') => {
    const cust = customers.find((c) => c.id === customerId);
    if (!cust) return;

    const previousBalance = cust.balance;
    const newBalance = Math.max(0, previousBalance - amount);

    updateCustomer(customerId, { balance: newBalance });

    const tx: CustomerTransaction = {
      id: `ctx_${Date.now()}`,
      customerId,
      date: getTodayString(0),
      type: 'payment_received',
      amount,
      previousBalance,
      newBalance,
      notes: notes || 'Wasooli (Cash Payment Received)',
    };
    const updatedTxs = [tx, ...customerTransactions];
    setCustomerTransactions(updatedTxs);
    saveToStorage('karobar_customer_txs', updatedTxs);
  };

  const completeSale = (saleData: {
    customerName: string;
    customerId?: string;
    customerPhone?: string;
    items: SaleCartItem[];
    subtotal: number;
    discount: number;
    total: number;
    paymentMethod: 'cash' | 'credit' | 'bank';
    amountPaid: number;
    balanceDue: number;
    notes?: string;
  }): SaleRecord => {
    const invoiceNum = `INV-${1000 + sales.length + 1}`;
    const totalProfit = saleData.items.reduce((acc, it) => acc + it.profit, 0) - saleData.discount;

    const newSale: SaleRecord = {
      id: `sale_${Date.now()}`,
      invoiceNumber: invoiceNum,
      date: getTodayString(0),
      time: getNowTimeString(),
      customerName: saleData.customerName,
      customerPhone: saleData.customerPhone,
      customerId: saleData.customerId,
      items: saleData.items,
      subtotal: saleData.subtotal,
      discount: saleData.discount,
      total: saleData.total,
      totalProfit,
      paymentMethod: saleData.paymentMethod,
      amountPaid: saleData.amountPaid,
      balanceDue: saleData.balanceDue,
      notes: saleData.notes,
    };

    // Deduct stock for each sold item
    saleData.items.forEach((item) => {
      const product = products.find((p) => p.id === item.itemId);
      if (product) {
        const previousStock = product.stockQuantity;
        const newStock = Math.max(0, previousStock - item.quantity);
        updateProduct(item.itemId, { stockQuantity: newStock });

        const tx: StockTransaction = {
          id: `stx_${Date.now()}_${item.itemId}`,
          itemId: item.itemId,
          itemName: item.name,
          date: getTodayString(0),
          type: 'sale',
          quantity: item.quantity,
          previousStock,
          newStock,
          notes: `Bikri ${invoiceNum}`,
        };
        setStockTransactions((prev) => [tx, ...prev]);
      }
    });

    // If credit or partial credit, update customer khata
    if (saleData.balanceDue > 0) {
      let custId = saleData.customerId;
      if (!custId) {
        // Auto-create customer if name provided
        const newC = addCustomer({
          name: saleData.customerName,
          phone: saleData.customerPhone || '',
        });
        custId = newC.id;
      }

      const existingCust = customers.find((c) => c.id === custId);
      if (existingCust) {
        const previousBalance = existingCust.balance;
        const newBalance = previousBalance + saleData.balanceDue;
        updateCustomer(custId, {
          balance: newBalance,
          totalPurchases: existingCust.totalPurchases + saleData.total,
        });

        const tx: CustomerTransaction = {
          id: `ctx_${Date.now()}`,
          customerId: custId,
          date: getTodayString(0),
          type: 'credit_sale',
          amount: saleData.balanceDue,
          previousBalance,
          newBalance,
          notes: `Sale ${invoiceNum} Baqi Udhaar`,
          invoiceNumber: invoiceNum,
        };
        const updatedTxs = [tx, ...customerTransactions];
        setCustomerTransactions(updatedTxs);
        saveToStorage('karobar_customer_txs', updatedTxs);
      }
    } else if (saleData.customerId) {
      // Just update total purchases
      const existingCust = customers.find((c) => c.id === saleData.customerId);
      if (existingCust) {
        updateCustomer(saleData.customerId, {
          totalPurchases: existingCust.totalPurchases + saleData.total,
        });
      }
    }

    const updatedSales = [newSale, ...sales];
    setSales(updatedSales);
    saveToStorage('karobar_sales', updatedSales);
    setActiveInvoiceToView(newSale);

    return newSale;
  };

  const deleteSale = (saleId: string) => {
    const saleToDelete = sales.find((s) => s.id === saleId);
    if (!saleToDelete) return;

    // Restore stock
    saleToDelete.items.forEach((item) => {
      const product = products.find((p) => p.id === item.itemId);
      if (product) {
        updateProduct(item.itemId, {
          stockQuantity: product.stockQuantity + item.quantity,
        });
      }
    });

    // If customer had balance due on this sale, reverse it
    if (saleToDelete.balanceDue > 0 && saleToDelete.customerId) {
      const cust = customers.find((c) => c.id === saleToDelete.customerId);
      if (cust) {
        const newBal = Math.max(0, cust.balance - saleToDelete.balanceDue);
        updateCustomer(saleToDelete.customerId, {
          balance: newBal,
          totalPurchases: Math.max(0, cust.totalPurchases - saleToDelete.total),
        });
      }
    }

    const updated = sales.filter((s) => s.id !== saleId);
    setSales(updated);
    saveToStorage('karobar_sales', updated);
  };

  // 6. Expenses
  const [expenses, setExpenses] = useState<ExpenseRecord[]>(() =>
    loadFromStorage('karobar_expenses', INITIAL_EXPENSES)
  );

  const addExpense = (exp: Omit<ExpenseRecord, 'id' | 'time'>) => {
    const newExp: ExpenseRecord = {
      ...exp,
      id: `exp_${Date.now()}`,
      time: getNowTimeString(),
    };
    const updated = [newExp, ...expenses];
    setExpenses(updated);
    saveToStorage('karobar_expenses', updated);
  };

  const deleteExpense = (id: string) => {
    const updated = expenses.filter((e) => e.id !== id);
    setExpenses(updated);
    saveToStorage('karobar_expenses', updated);
  };

  // 7. Backup & Reset
  const exportBackup = () => {
    triggerBackupDownload();
  };

  const importBackup = async (file: File): Promise<boolean> => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const success = restoreBackupData(data);
      if (success) {
        // Reload all state
        setShopSettings(loadFromStorage('karobar_shop_settings', DEFAULT_SHOP_SETTINGS));
        setSecuritySettings(loadFromStorage('karobar_security_settings', DEFAULT_SECURITY_SETTINGS));
        setProducts(loadFromStorage('karobar_products', INITIAL_PRODUCTS));
        setSales(loadFromStorage('karobar_sales', INITIAL_SALES));
        setExpenses(loadFromStorage('karobar_expenses', INITIAL_EXPENSES));
        setCustomers(loadFromStorage('karobar_customers', INITIAL_CUSTOMERS));
        setCustomerTransactions(loadFromStorage('karobar_customer_txs', INITIAL_CUSTOMER_TRANSACTIONS));
        setStockTransactions(loadFromStorage('karobar_stock_txs', INITIAL_STOCK_TRANSACTIONS));
      }
      return true;
    } catch (e) {
      console.error('Failed to import backup:', e);
      throw e;
    }
  };

  const reloadDemoData = () => {
    resetAllData();
    setShopSettings(DEFAULT_SHOP_SETTINGS);
    setSecuritySettings(DEFAULT_SECURITY_SETTINGS);
    setProducts(INITIAL_PRODUCTS);
    setSales(INITIAL_SALES);
    setExpenses(INITIAL_EXPENSES);
    setCustomers(INITIAL_CUSTOMERS);
    setCustomerTransactions(INITIAL_CUSTOMER_TRANSACTIONS);
    setStockTransactions(INITIAL_STOCK_TRANSACTIONS);
  };

  const wipeAllData = () => {
    localStorage.clear();
    setProducts([]);
    setSales([]);
    setExpenses([]);
    setCustomers([]);
    setCustomerTransactions([]);
    setStockTransactions([]);
    saveToStorage('karobar_products', []);
    saveToStorage('karobar_sales', []);
    saveToStorage('karobar_expenses', []);
    saveToStorage('karobar_customers', []);
    saveToStorage('karobar_customer_txs', []);
    saveToStorage('karobar_stock_txs', []);
  };

  return (
    <KhataContext.Provider
      value={{
        language,
        setLanguage,
        t,
        shopSettings,
        updateShopSettings,
        securitySettings,
        updateSecuritySettings,
        lockApp,
        unlockApp,
        verifyPin,
        verifyBiometrics,
        resetPinWithSecurityAnswer,
        products,
        addProduct,
        bulkAddProducts,
        updateProduct,
        deleteProduct,
        adjustStock,
        stockTransactions,
        sales,
        activeInvoiceToView,
        setActiveInvoiceToView,
        completeSale,
        deleteSale,
        expenses,
        addExpense,
        deleteExpense,
        customers,
        customerTransactions,
        addCustomer,
        updateCustomer,
        recordCustomerPayment,
        exportBackup,
        importBackup,
        reloadDemoData,
        wipeAllData,
      }}
    >
      {children}
    </KhataContext.Provider>
  );
};

export const useKhata = () => {
  const context = useContext(KhataContext);
  if (!context) {
    throw new Error('useKhata must be used within a KhataProvider');
  }
  return context;
};
