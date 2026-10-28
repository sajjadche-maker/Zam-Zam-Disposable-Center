export type Language = 'roman_urdu' | 'urdu' | 'english';

export type ExpenseCategory =
  | 'rent'
  | 'electricity'
  | 'salaries'
  | 'chai_food'
  | 'transport'
  | 'maintenance'
  | 'packaging'
  | 'other';

export type PaymentMethod = 'cash' | 'credit' | 'bank';

export interface ProductItem {
  id: string;
  code: string;
  name: string;
  nameUrdu?: string;
  category: string;
  purchasePrice: number; // Cost price (Khareed)
  salePrice: number;     // Selling price (Bikri)
  stockQuantity: number; // Current stock
  unit: string;          // kg, piece, pack, carton, litre, etc.
  minStockAlert: number; // Low stock threshold
  updatedAt: string;
}

export interface SaleCartItem {
  itemId: string;
  code: string;
  name: string;
  unit: string;
  quantity: number;
  purchasePrice: number;
  salePrice: number;
  total: number;
  profit: number;
}

export interface SaleRecord {
  id: string;
  invoiceNumber: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  customerName: string;
  customerPhone?: string;
  customerId?: string;
  items: SaleCartItem[];
  subtotal: number;
  discount: number;
  total: number;
  totalProfit: number;
  paymentMethod: PaymentMethod;
  amountPaid: number;
  balanceDue: number;
  notes?: string;
}

export interface ExpenseRecord {
  id: string;
  date: string; // YYYY-MM-DD
  time: string;
  category: ExpenseCategory;
  amount: number;
  paymentMethod: 'cash' | 'bank';
  description: string;
  recipient?: string;
}

export interface CustomerRecord {
  id: string;
  name: string;
  phone: string;
  address?: string;
  balance: number; // positive = customer owes us money (Udhaar)
  totalPurchases: number;
  createdAt: string;
}

export interface CustomerTransaction {
  id: string;
  customerId: string;
  date: string;
  type: 'credit_sale' | 'payment_received';
  amount: number;
  previousBalance: number;
  newBalance: number;
  notes?: string;
  invoiceNumber?: string;
}

export interface StockTransaction {
  id: string;
  itemId: string;
  itemName: string;
  date: string;
  type: 'stock_in' | 'stock_out' | 'sale' | 'adjustment';
  quantity: number;
  costPrice?: number;
  previousStock: number;
  newStock: number;
  notes?: string;
}

export interface SecuritySettings {
  pinEnabled: boolean;
  pinCode: string; // 4-digit code e.g. "1234"
  biometricsEnabled: boolean;
  securityQuestion: string;
  securityAnswer: string;
  autoLockMinutes: number; // 0 = immediately, 1, 5, 15, -1 = never
  isLocked: boolean;
  lastActiveTimestamp: number;
}

export interface ShopSettings {
  businessName: string;
  businessNameUrdu?: string;
  tagline: string;
  ownerName: string;
  phone: string;
  phone2?: string;
  address: string;
  currency: string;
  language: Language;
  invoiceFooterNote: string;
}

export interface AppDataBackup {
  version: string;
  exportedAt: string;
  shopSettings: ShopSettings;
  securitySettings: Omit<SecuritySettings, 'isLocked' | 'lastActiveTimestamp'>;
  products: ProductItem[];
  sales: SaleRecord[];
  expenses: ExpenseRecord[];
  customers: CustomerRecord[];
  customerTransactions: CustomerTransaction[];
  stockTransactions: StockTransaction[];
}
