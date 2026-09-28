/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * WoodApp Backend - TypeScript Type Definitions
 * System y'ubucuruzi bw'imbaho n'ibiti mu Rwanda.
 */

export type UserRole = 'owner' | 'boss' | 'accountant' | 'manager' | 'worker';

export type LanguageCode = 'rw' | 'en' | 'fr';

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: UserRole;
  businessId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Business {
  id: string;
  name: string;
  ownerId: string;
  phone: string;
  email?: string;
  tinNumber?: string;
  address: {
    district: string;
    sector?: string;
    description?: string;
  };
  currency: string;
  settings: {
    language: LanguageCode;
    lowStockThresholdDefault: number;
    vatRatePercent: number;
    withholdingTaxRatePercent: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Membership {
  id: string;
  businessId: string;
  userId: string;
  role: UserRole;
  status: 'active' | 'suspended';
  createdAt: string;
  updatedAt: string;
}

export type WoodSpecies = 
  | 'Eucalyptus' 
  | 'Pine' 
  | 'Teak' 
  | 'Muvumu' 
  | 'Cypress' 
  | 'Mango' 
  | 'Mahogany' 
  | string;

export type MeasurementUnit = 
  | 'piece' 
  | 'board' 
  | 'plank' 
  | 'sheet' 
  | 'cubic_meter' 
  | 'square_meter' 
  | 'meter' 
  | 'kg';

export interface Product {
  id: string;
  businessId: string;
  name: string;
  woodType: string;
  species: WoodSpecies;
  description?: string;
  unit: MeasurementUnit;
  defaultBuyingPrice: number;
  defaultSellingPrice: number;
  minimumStock: number;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryItem {
  id: string;
  businessId: string;
  productId?: string;
  productName: string;
  woodType: string;
  species: WoodSpecies;
  dimensions: {
    length: number;    // Uburebure (e.g. in meters or cm)
    width: number;     // Ubugari (e.g. in cm or mm)
    thickness: number; // Umubyimba (e.g. in cm or mm)
    dimensionUnit: 'cm' | 'mm' | 'm';
  };
  quantity: number;
  unit: MeasurementUnit;
  buyingPrice: number;    // Igiciro cyo kugura
  sellingPrice: number;   // Igiciro cyo kugurisha
  totalValue: number;     // Agaciro kose (quantity * buyingPrice)
  minimumStock: number;   // Hasigaye bike warning limit
  location: string;       // Aho bibitswe (e.g. Ububiko A, Shed 2)
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  createdAt: string;
  updatedAt: string;
}

export type StockMovementType = 
  | 'purchase' 
  | 'sale' 
  | 'adjustment' 
  | 'return' 
  | 'damaged' 
  | 'transfer' 
  | 'manual_add' 
  | 'manual_remove';

export interface StockMovement {
  id: string;
  businessId: string;
  inventoryId: string;
  productId: string;
  productName: string;
  type: StockMovementType;
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  referenceType: 'purchase' | 'sale' | 'adjustment' | 'manual';
  referenceId: string;
  reason: string;
  createdBy: string;
  createdAt: string;
}

export interface SaleItem {
  inventoryId: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  costPerUnit: number;
  totalCost: number;
}

export type PaymentStatus = 'paid' | 'partially_paid' | 'overdue' | 'unpaid';

export interface Sale {
  id: string;
  businessId: string;
  customerId: string;
  customerName: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  total: number;
  totalCost: number;
  profit: number;
  amountPaid: number;
  amountDue: number;
  paymentStatus: PaymentStatus;
  saleDate: string;
  createdBy: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseItem {
  inventoryId?: string;
  productId: string;
  productName: string;
  woodType: string;
  species: WoodSpecies;
  dimensions: {
    length: number;
    width: number;
    thickness: number;
    dimensionUnit: 'cm' | 'mm' | 'm';
  };
  quantity: number;
  unit: MeasurementUnit;
  unitCost: number;
  totalCost: number;
  sellingPrice: number;
}

export interface Purchase {
  id: string;
  businessId: string;
  supplierId: string;
  supplierName: string;
  items: PurchaseItem[];
  subtotal: number;
  discount: number;
  total: number;
  amountPaid: number;
  amountDue: number;
  paymentStatus: PaymentStatus;
  purchaseDate: string;
  createdBy: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type PaymentMethod = 'cash' | 'mobile_money' | 'bank' | 'card' | 'other';

export interface Payment {
  id: string;
  businessId: string;
  type: 'customer_payment' | 'supplier_payment';
  customerId?: string;
  supplierId?: string;
  saleId?: string;
  purchaseId?: string;
  amount: number;
  method: PaymentMethod;
  reference?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  businessId: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  totalPurchases: number;
  totalPaid: number;
  outstandingBalance: number;
  status: 'paid' | 'outstanding' | 'overdue';
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: string;
  businessId: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  totalPurchases: number;
  totalPaid: number;
  outstandingBalance: number; // Amafaranga business igifitiye supplier
  createdAt: string;
  updatedAt: string;
}

export type ExpenseCategory = 
  | 'transport' 
  | 'salaries' 
  | 'rent' 
  | 'electricity' 
  | 'internet' 
  | 'repairs' 
  | 'fuel' 
  | 'materials' 
  | 'marketing' 
  | 'other';

export interface Expense {
  id: string;
  businessId: string;
  category: ExpenseCategory;
  categoryNameRw: string;
  description: string;
  amount: number;
  paymentMethod: PaymentMethod;
  date: string;
  createdBy: string;
  createdAt: string;
}

export type FinancialAccount = 
  | 'cash' 
  | 'bank' 
  | 'inventory' 
  | 'sales_revenue' 
  | 'accounts_receivable' 
  | 'accounts_payable' 
  | 'cost_of_goods_sold' 
  | 'expenses' 
  | 'profit';

export interface FinancialTransaction {
  id: string;
  businessId: string;
  type: 'sale' | 'purchase' | 'payment_received' | 'payment_made' | 'expense' | 'inventory_adjustment';
  referenceType: 'sales' | 'purchases' | 'payments' | 'expenses' | 'inventory';
  referenceId: string;
  debit: number;
  credit: number;
  account: FinancialAccount;
  description: string;
  createdAt: string;
}

export interface DashboardSummary {
  range: string;
  salesTotal: number;              // Amafaranga nagurishije
  cashReceived: number;            // Amafaranga yakiriwe
  expensesTotal: number;           // Amafaranga nakoresheje
  estimatedProfit: number;         // Inyungu
  inventoryTotalValue: number;     // Agaciro k’imbaho ziri muri stock
  accountsReceivable: number;      // Amafaranga abakiriya batarishyura
  accountsPayable: number;         // Amafaranga dufitiye abandi
  lowStockCount: number;           // Imbaho zisigaye nke
  outOfStockCount: number;         // Imbaho zarashize
  recentTransactions: Array<{
    id: string;
    type: string;
    description: string;
    amount: number;
    date: string;
  }>;
  alerts: Array<{
    type: 'warning' | 'info' | 'error';
    title: string;
    message: string;
  }>;
}

export interface DailyReport {
  id: string;
  businessId: string;
  reportDate: string;
  salesTotal: number;
  cashReceived: number;
  accountsReceivableTotal: number;
  purchasesTotal: number;
  expensesTotal: number;
  profitTotal: number;
  stockMovementsCount: number;
  payingCustomersCount: number;
  debtorsCount: number;
  suppliersPaidTotal: number;
  alerts: string[];
  whatsAppPayload?: {
    recipientPhone: string;
    formattedText: string;
  };
  createdAt: string;
}

export type CameraLocation = 
  | 'ububiko' 
  | 'aho_bakorera' 
  | 'aho_bapakira' 
  | 'aho_abakiriya_bakirira' 
  | 'hanze';

export interface Camera {
  id: string;
  businessId: string;
  name: string;
  location: CameraLocation;
  provider: string;
  streamUrl: string;
  snapshotUrl?: string;
  status: 'online' | 'offline' | 'error';
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export type CameraEventType = 
  | 'person_detected' 
  | 'loading_started' 
  | 'loading_finished' 
  | 'stock_movement_detected' 
  | 'customer_detected' 
  | 'unusual_activity' 
  | 'camera_offline';

export interface CameraEvent {
  id: string;
  businessId: string;
  cameraId: string;
  eventType: CameraEventType;
  timestamp: string;
  confidence: number;
  metadata?: Record<string, unknown>;
  snapshotUrl?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  businessId: string;
  userId?: string;
  type: 'low_stock' | 'debt_reminder' | 'payment_received' | 'new_sale' | 'camera_alert' | 'system';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  businessId: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  timestamp: string;
  ipAddress?: string;
}
