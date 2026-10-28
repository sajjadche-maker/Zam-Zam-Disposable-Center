import {
  AppDataBackup,
  CustomerRecord,
  CustomerTransaction,
  ExpenseRecord,
  ProductItem,
  SaleRecord,
  SecuritySettings,
  ShopSettings,
  StockTransaction
} from '../types';

const STORAGE_KEYS = {
  SHOP_SETTINGS: 'karobar_shop_settings',
  SECURITY_SETTINGS: 'karobar_security_settings',
  PRODUCTS: 'karobar_products',
  SALES: 'karobar_sales',
  EXPENSES: 'karobar_expenses',
  CUSTOMERS: 'karobar_customers',
  CUSTOMER_TRANSACTIONS: 'karobar_customer_txs',
  STOCK_TRANSACTIONS: 'karobar_stock_txs',
};

// Default Business Settings for ZamZam Disposable and Shopping bags center
export const DEFAULT_SHOP_SETTINGS: ShopSettings = {
  businessName: 'ZamZam Disposable and Shopping bags center',
  businessNameUrdu: 'زم زم ڈسپوزیبل اینڈ شاپنگ بیگز سینٹر',
  tagline: 'All Kinds of Shopping Bags, Disposable Crockery & Packaging Solutions',
  ownerName: 'Muhammad Sajjad',
  phone: '03145725727',
  phone2: '03129077476',
  address: 'Main Wholesale Market, Commercial Area',
  currency: '₨',
  language: 'roman_urdu',
  invoiceFooterNote: 'Bika hua maal wapas ya tabdeel nahi hoga. Cash check kar ke lein. Shukriya!',
};

export const DEFAULT_SECURITY_SETTINGS: SecuritySettings = {
  pinEnabled: false,
  pinCode: '1234', // default demo PIN
  biometricsEnabled: true,
  securityQuestion: 'Aap ka pasandeeda shehar konsa hai?',
  securityAnswer: 'lahore',
  autoLockMinutes: 5,
  isLocked: false,
  lastActiveTimestamp: Date.now(),
};

// Format date helper YYYY-MM-DD
export const getTodayString = (offsetDays = 0): string => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
};

export const getNowTimeString = (): string => {
  const d = new Date();
  return d.toTimeString().substring(0, 5);
};

export const INITIAL_PRODUCTS: ProductItem[] = [
  {
    id: 'prod_1',
    code: '1001',
    name: 'Shopping Bag White 8x10 (Small)',
    nameUrdu: 'شاپنگ بیگ سفید ۸x۱۰ چھوٹا',
    category: 'Shopping Bags',
    purchasePrice: 330,
    salePrice: 380,
    stockQuantity: 65,
    unit: 'kg',
    minStockAlert: 15,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod_2',
    code: '1002',
    name: 'Shopping Bag Color Super 10x14 (Medium)',
    nameUrdu: 'شاپنگ بیگ کلر سپر ۱۰x۱۴ درمیانہ',
    category: 'Shopping Bags',
    purchasePrice: 340,
    salePrice: 400,
    stockQuantity: 80,
    unit: 'kg',
    minStockAlert: 20,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod_3',
    code: '1003',
    name: 'Shopping Bag Heavy Duty 14x18 (Large)',
    nameUrdu: 'شاپنگ بیگ ہیوی ڈیوٹی ۱۴x۱۸ بڑا',
    category: 'Shopping Bags',
    purchasePrice: 350,
    salePrice: 420,
    stockQuantity: 45,
    unit: 'kg',
    minStockAlert: 10,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod_4',
    code: '1004',
    name: 'Shopping Bag Jumbo Extra 16x22',
    nameUrdu: 'شاپنگ بیگ جمبو ایکسٹرا ۱۶x۲۲',
    category: 'Shopping Bags',
    purchasePrice: 360,
    salePrice: 440,
    stockQuantity: 30,
    unit: 'kg',
    minStockAlert: 10,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod_5',
    code: '1005',
    name: 'D-Cut Fancy Printed Bags (Pack of 100)',
    nameUrdu: 'ڈی کٹ فینسی پرنٹڈ بیگز (۱۰۰ عدد)',
    category: 'Shopping Bags',
    purchasePrice: 460,
    salePrice: 560,
    stockQuantity: 25,
    unit: 'pack',
    minStockAlert: 5,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod_6',
    code: '1006',
    name: 'Garbage Bags Black Heavy 30x40',
    nameUrdu: 'کوڑا کرکٹ بیگز بلیک رول',
    category: 'Garbage Bags',
    purchasePrice: 220,
    salePrice: 280,
    stockQuantity: 40,
    unit: 'roll',
    minStockAlert: 8,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod_7',
    code: '1007',
    name: 'Disposable Foam Plates 10 inch (100 Pcs)',
    nameUrdu: 'ڈسپوزیبل فوم پلیٹس ۱۰ انچ (۱۰۰ عدد)',
    category: 'Disposable Crockery',
    purchasePrice: 520,
    salePrice: 620,
    stockQuantity: 18,
    unit: 'pack',
    minStockAlert: 6,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod_8',
    code: '1008',
    name: 'Disposable Foam Plates Biryani/Rice (100 Pcs)',
    nameUrdu: 'ڈسپوزیبل فوم پلیٹس بریانی (۱۰۰ عدد)',
    category: 'Disposable Crockery',
    purchasePrice: 380,
    salePrice: 460,
    stockQuantity: 35,
    unit: 'pack',
    minStockAlert: 10,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod_9',
    code: '1009',
    name: 'Disposable Plastic Glasses 250ml (50 Pcs)',
    nameUrdu: 'ڈسپوزیبل گلاس ۲۵۰ ایم ایل (۵۰ عدد)',
    category: 'Disposable Crockery',
    purchasePrice: 140,
    salePrice: 180,
    stockQuantity: 50,
    unit: 'pack',
    minStockAlert: 15,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod_10',
    code: '1010',
    name: 'Paper Tea Cups 200ml Chai (50 Pcs)',
    nameUrdu: 'پیپر چائے کپ ۲۰۰ ایم ایل (۵۰ عدد)',
    category: 'Disposable Crockery',
    purchasePrice: 110,
    salePrice: 150,
    stockQuantity: 60,
    unit: 'pack',
    minStockAlert: 20,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod_11',
    code: '1011',
    name: 'Disposable Plastic Spoons White (100 Pcs)',
    nameUrdu: 'ڈسپوزیبل چمچ سفید (۱۰۰ عدد)',
    category: 'Disposable Crockery',
    purchasePrice: 160,
    salePrice: 220,
    stockQuantity: 45,
    unit: 'pack',
    minStockAlert: 10,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod_12',
    code: '1012',
    name: 'Food Packing Boxes 500ml with Lid (Carton 250 pcs)',
    nameUrdu: 'فوڈ پیکنگ بکس ۵۰۰ ایم ایل (کارٹن ۲۵۰)',
    category: 'Food Packaging',
    purchasePrice: 1850,
    salePrice: 2200,
    stockQuantity: 12,
    unit: 'carton',
    minStockAlert: 4,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod_13',
    code: '1013',
    name: 'Aluminum Foil Roll 1kg Food Grade',
    nameUrdu: 'ایلومینیم فوائل رول ۱ کلو',
    category: 'Food Packaging',
    purchasePrice: 750,
    salePrice: 890,
    stockQuantity: 15,
    unit: 'roll',
    minStockAlert: 5,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod_14',
    code: '1014',
    name: 'Packing Tape 2 inch Transparent (Dozen 12 rolls)',
    nameUrdu: 'پیکنگ ٹیپ ۲ انچ شفاف (۱۲ رول درجن)',
    category: 'Packaging Supplies',
    purchasePrice: 1100,
    salePrice: 1350,
    stockQuantity: 8, // Low stock alert
    unit: 'dozen',
    minStockAlert: 10,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod_15',
    code: '1015',
    name: 'Paper Napkins / Tissue Bundle (10 packs)',
    nameUrdu: 'پیپر ٹشو نیپکن بنڈل (۱۰ پیکٹ)',
    category: 'Disposable Crockery',
    purchasePrice: 480,
    salePrice: 580,
    stockQuantity: 20,
    unit: 'bundle',
    minStockAlert: 6,
    updatedAt: new Date().toISOString(),
  },
];

export const INITIAL_CUSTOMERS: CustomerRecord[] = [
  {
    id: 'cust_1',
    name: 'Al-Madina Biryani & Pulao Center',
    phone: '0301-7654321',
    address: 'Near General Bus Stand',
    balance: 5600, // Udhaar due
    totalPurchases: 42000,
    createdAt: getTodayString(-30),
  },
  {
    id: 'cust_2',
    name: 'Gourmet Sweets & Bakers',
    phone: '0321-9876543',
    address: 'Main Commercial Chowk',
    balance: 14800,
    totalPurchases: 85000,
    createdAt: getTodayString(-60),
  },
  {
    id: 'cust_3',
    name: 'Khan Chai Hotel & Dhaba',
    phone: '0333-5551234',
    address: 'Truck Stand, G.T. Road',
    balance: 3200,
    totalPurchases: 26000,
    createdAt: getTodayString(-15),
  },
  {
    id: 'cust_4',
    name: 'Fast Food Express',
    phone: '0345-4447890',
    address: 'Food Street Plaza',
    balance: 7500,
    totalPurchases: 54000,
    createdAt: getTodayString(-45),
  },
];

export const INITIAL_SALES: SaleRecord[] = [
  {
    id: 'sale_1',
    invoiceNumber: 'ZZ-1001',
    date: getTodayString(0),
    time: '10:15',
    customerName: 'Aam Grahak (Walk-in)',
    items: [
      {
        itemId: 'prod_2',
        code: '1002',
        name: 'Shopping Bag Color Super 10x14 (Medium)',
        unit: 'kg',
        quantity: 5,
        purchasePrice: 340,
        salePrice: 400,
        total: 2000,
        profit: 300,
      },
      {
        itemId: 'prod_10',
        code: '1010',
        name: 'Paper Tea Cups 200ml Chai (50 Pcs)',
        unit: 'pack',
        quantity: 4,
        purchasePrice: 110,
        salePrice: 150,
        total: 600,
        profit: 160,
      },
    ],
    subtotal: 2600,
    discount: 50,
    total: 2550,
    totalProfit: 410,
    paymentMethod: 'cash',
    amountPaid: 2550,
    balanceDue: 0,
    notes: 'Subah ki bikri (Bohni)',
  },
  {
    id: 'sale_2',
    invoiceNumber: 'ZZ-1002',
    date: getTodayString(0),
    time: '12:30',
    customerName: 'Al-Madina Biryani & Pulao Center',
    customerId: 'cust_1',
    customerPhone: '0301-7654321',
    items: [
      {
        itemId: 'prod_8',
        code: '1008',
        name: 'Disposable Foam Plates Biryani/Rice (100 Pcs)',
        unit: 'pack',
        quantity: 10,
        purchasePrice: 380,
        salePrice: 460,
        total: 4600,
        profit: 800,
      },
      {
        itemId: 'prod_11',
        code: '1011',
        name: 'Disposable Plastic Spoons White (100 Pcs)',
        unit: 'pack',
        quantity: 10,
        purchasePrice: 160,
        salePrice: 220,
        total: 2200,
        profit: 600,
      },
      {
        itemId: 'prod_3',
        code: '1003',
        name: 'Shopping Bag Heavy Duty 14x18 (Large)',
        unit: 'kg',
        quantity: 10,
        purchasePrice: 350,
        salePrice: 420,
        total: 4200,
        profit: 700,
      },
    ],
    subtotal: 11000,
    discount: 200,
    total: 10800,
    totalProfit: 1900,
    paymentMethod: 'credit',
    amountPaid: 5000,
    balanceDue: 5800,
    notes: 'Rs 5000 cash diya, baqi khate mein likha',
  },
  {
    id: 'sale_3',
    invoiceNumber: 'ZZ-1003',
    date: getTodayString(-2),
    time: '15:20',
    customerName: 'Gourmet Sweets & Bakers',
    customerId: 'cust_2',
    customerPhone: '0321-9876543',
    items: [
      {
        itemId: 'prod_5',
        code: '1005',
        name: 'D-Cut Fancy Printed Bags (Pack of 100)',
        unit: 'pack',
        quantity: 5,
        purchasePrice: 460,
        salePrice: 560,
        total: 2800,
        profit: 500,
      },
      {
        itemId: 'prod_14',
        code: '1014',
        name: 'Packing Tape 2 inch Transparent (Dozen 12 rolls)',
        unit: 'dozen',
        quantity: 2,
        purchasePrice: 1100,
        salePrice: 1350,
        total: 2700,
        profit: 500,
      },
    ],
    subtotal: 5500,
    discount: 0,
    total: 5500,
    totalProfit: 1000,
    paymentMethod: 'cash',
    amountPaid: 5500,
    balanceDue: 0,
  },
  {
    id: 'sale_4',
    invoiceNumber: 'ZZ-1004',
    date: getTodayString(-4),
    time: '16:45',
    customerName: 'Fast Food Express',
    customerId: 'cust_4',
    customerPhone: '0345-4447890',
    items: [
      {
        itemId: 'prod_12',
        code: '1012',
        name: 'Food Packing Boxes 500ml with Lid (Carton 250 pcs)',
        unit: 'carton',
        quantity: 2,
        purchasePrice: 1850,
        salePrice: 2200,
        total: 4400,
        profit: 700,
      },
      {
        itemId: 'prod_9',
        code: '1009',
        name: 'Disposable Plastic Glasses 250ml (50 Pcs)',
        unit: 'pack',
        quantity: 10,
        purchasePrice: 140,
        salePrice: 180,
        total: 1800,
        profit: 400,
      },
    ],
    subtotal: 6200,
    discount: 100,
    total: 6100,
    totalProfit: 1000,
    paymentMethod: 'cash',
    amountPaid: 6100,
    balanceDue: 0,
  },
];

export const INITIAL_EXPENSES: ExpenseRecord[] = [
  {
    id: 'exp_1',
    date: getTodayString(0),
    time: '11:00',
    category: 'chai_food',
    amount: 150,
    paymentMethod: 'cash',
    description: 'Chai aur pani subah',
    recipient: 'Khan Chai Hotel',
  },
  {
    id: 'exp_2',
    date: getTodayString(-3),
    time: '14:30',
    category: 'transport',
    amount: 750,
    paymentMethod: 'cash',
    description: 'Bags factory se dukan tak loader ka kiraya',
    recipient: 'Loader Driver',
  },
  {
    id: 'exp_3',
    date: getTodayString(-6),
    time: '17:00',
    category: 'electricity',
    amount: 3200,
    paymentMethod: 'bank',
    description: 'Dukan ka bijli ka bill',
    recipient: 'WAPDA',
  },
];

export const INITIAL_CUSTOMER_TRANSACTIONS: CustomerTransaction[] = [
  {
    id: 'ctx_1',
    customerId: 'cust_1',
    date: getTodayString(-10),
    type: 'payment_received',
    amount: 4000,
    previousBalance: 3800,
    newBalance: 0,
    notes: 'Naqd wasool hua',
  },
  {
    id: 'ctx_2',
    customerId: 'cust_1',
    date: getTodayString(0),
    type: 'credit_sale',
    amount: 5800,
    previousBalance: 0,
    newBalance: 5800,
    notes: 'Sale ZZ-1002 Baqi Udhaar',
    invoiceNumber: 'ZZ-1002',
  },
];

export const INITIAL_STOCK_TRANSACTIONS: StockTransaction[] = [
  {
    id: 'stx_1',
    itemId: 'prod_1',
    itemName: 'Shopping Bag White 8x10',
    date: getTodayString(-5),
    type: 'stock_in',
    quantity: 100,
    costPrice: 330,
    previousStock: 0,
    newStock: 100,
    notes: 'Factory se naya maal aya',
  },
];

// Helper Storage Getters & Setters
export function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    const parsed = JSON.parse(raw);

    // Auto-migrate shop settings to ZamZam Disposable & Shopping Bags Center
    if (key === STORAGE_KEYS.SHOP_SETTINGS && parsed) {
      if (
        !parsed.businessName ||
        parsed.businessName.includes('Bismillah') ||
        parsed.businessName === '' ||
        !parsed.phone2
      ) {
        const upgraded = {
          ...DEFAULT_SHOP_SETTINGS,
          ...parsed,
          businessName: 'ZamZam Disposable and Shopping bags center',
          businessNameUrdu: 'زم زم ڈسپوزیبل اینڈ شاپنگ بیگز سینٹر',
          phone: '03145725727',
          phone2: '03129077476',
        };
        saveToStorage(STORAGE_KEYS.SHOP_SETTINGS, upgraded);
        return upgraded as unknown as T;
      }
    }

    return parsed;
  } catch (e) {
    console.error(`Error loading key "${key}" from storage:`, e);
    return defaultValue;
  }
}

export function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error saving key "${key}" to storage:`, e);
  }
}

// Backup Generator
export function generateBackupData(): AppDataBackup {
  return {
    version: '1.1.0',
    exportedAt: new Date().toISOString(),
    shopSettings: loadFromStorage(STORAGE_KEYS.SHOP_SETTINGS, DEFAULT_SHOP_SETTINGS),
    securitySettings: {
      pinEnabled: loadFromStorage(STORAGE_KEYS.SECURITY_SETTINGS, DEFAULT_SECURITY_SETTINGS).pinEnabled,
      pinCode: loadFromStorage(STORAGE_KEYS.SECURITY_SETTINGS, DEFAULT_SECURITY_SETTINGS).pinCode,
      biometricsEnabled: loadFromStorage(STORAGE_KEYS.SECURITY_SETTINGS, DEFAULT_SECURITY_SETTINGS).biometricsEnabled,
      securityQuestion: loadFromStorage(STORAGE_KEYS.SECURITY_SETTINGS, DEFAULT_SECURITY_SETTINGS).securityQuestion,
      securityAnswer: loadFromStorage(STORAGE_KEYS.SECURITY_SETTINGS, DEFAULT_SECURITY_SETTINGS).securityAnswer,
      autoLockMinutes: loadFromStorage(STORAGE_KEYS.SECURITY_SETTINGS, DEFAULT_SECURITY_SETTINGS).autoLockMinutes,
    },
    products: loadFromStorage(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS),
    sales: loadFromStorage(STORAGE_KEYS.SALES, INITIAL_SALES),
    expenses: loadFromStorage(STORAGE_KEYS.EXPENSES, INITIAL_EXPENSES),
    customers: loadFromStorage(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS),
    customerTransactions: loadFromStorage(STORAGE_KEYS.CUSTOMER_TRANSACTIONS, INITIAL_CUSTOMER_TRANSACTIONS),
    stockTransactions: loadFromStorage(STORAGE_KEYS.STOCK_TRANSACTIONS, INITIAL_STOCK_TRANSACTIONS),
  };
}

// Download Backup as JSON
export function triggerBackupDownload(): void {
  const backup = generateBackupData();
  const dateStr = getTodayString(0);
  const jsonStr = JSON.stringify(backup, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `zamzam-bags-backup-${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Restore Backup from parsed object
export function restoreBackupData(data: AppDataBackup): boolean {
  if (!data || !Array.isArray(data.products) || !Array.isArray(data.sales)) {
    throw new Error('Invalid backup file format.');
  }

  saveToStorage(STORAGE_KEYS.SHOP_SETTINGS, data.shopSettings || DEFAULT_SHOP_SETTINGS);
  saveToStorage(STORAGE_KEYS.SECURITY_SETTINGS, {
    ...DEFAULT_SECURITY_SETTINGS,
    ...(data.securitySettings || {}),
    isLocked: false,
    lastActiveTimestamp: Date.now(),
  });
  saveToStorage(STORAGE_KEYS.PRODUCTS, data.products || []);
  saveToStorage(STORAGE_KEYS.SALES, data.sales || []);
  saveToStorage(STORAGE_KEYS.EXPENSES, data.expenses || []);
  saveToStorage(STORAGE_KEYS.CUSTOMERS, data.customers || []);
  saveToStorage(STORAGE_KEYS.CUSTOMER_TRANSACTIONS, data.customerTransactions || []);
  saveToStorage(STORAGE_KEYS.STOCK_TRANSACTIONS, data.stockTransactions || []);

  return true;
}

// Reset everything to clean initial state for ZamZam Disposable & Shopping Bags Center
export function resetAllData(): void {
  localStorage.clear();
  saveToStorage(STORAGE_KEYS.SHOP_SETTINGS, DEFAULT_SHOP_SETTINGS);
  saveToStorage(STORAGE_KEYS.SECURITY_SETTINGS, DEFAULT_SECURITY_SETTINGS);
  saveToStorage(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
  saveToStorage(STORAGE_KEYS.SALES, INITIAL_SALES);
  saveToStorage(STORAGE_KEYS.EXPENSES, INITIAL_EXPENSES);
  saveToStorage(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
  saveToStorage(STORAGE_KEYS.CUSTOMER_TRANSACTIONS, INITIAL_CUSTOMER_TRANSACTIONS);
  saveToStorage(STORAGE_KEYS.STOCK_TRANSACTIONS, INITIAL_STOCK_TRANSACTIONS);
}
