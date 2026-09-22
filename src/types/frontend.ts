/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * WoodApp Frontend TypeScript Definitions
 */

export type UserRole = 'owner' | 'boss' | 'manager' | 'accountant' | 'worker' | 'stock_keeper';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  phone?: string;
  businessId: string;
  businessName: string;
}

export interface BusinessInfo {
  id: string;
  name: string;
  ownerName: string;
  phone: string;
  location: string;
  currency: string;
  timberTypes: string[];
}

export type WoodSpecies = 
  | 'Eucalyptus'
  | 'Pine'
  | 'Teak'
  | 'Grevillea'
  | 'Cypress'
  | 'Muvumu'
  | 'Furniture'
  | 'Ibindi';

export type StockStatus = 'hahagije' | 'bike' | 'byarashize'; // in_stock, low_stock, out_of_stock

export interface TimberDimensions {
  length: number;    // meters
  width: number;     // cm
  thickness: number; // cm
  displayStr?: string; // e.g. "3m × 15cm × 5cm"
}

export interface InventoryItem {
  id: string;
  businessId: string;
  species: WoodSpecies;
  name: string;
  dimensions: TimberDimensions;
  quantity: number;
  minThreshold: number;
  costPrice: number;    // Igiciro cyo kugura (RWF)
  sellingPrice: number; // Igiciro cyo kugurisha (RWF)
  totalValue: number;   // quantity * sellingPrice
  status: StockStatus;
  locationArea: string; // e.g., "Ububiko A", "Icyumba 2"
  imageUrl?: string;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  inventoryId: string;
  speciesName: string;
  type: 'purchase' | 'sale' | 'adjustment' | 'loss';
  quantityDelta: number; // +20 or -10
  balanceAfter: number;
  reason: string; // e.g. "Waziguze", "Wagurishije", "Wongeye stock"
  timestamp: string;
}

export interface Customer {
  id: string;
  businessId: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  totalPurchases: number; // Yaguze
  totalPaid: number;      // Yishyuye
  remainingDebt: number;  // Asigaje
  status: 'yishyuwe' | 'haracyabura';
  lastPurchaseDate?: string;
}

export interface Supplier {
  id: string;
  businessId: string;
  name: string;
  phone: string;
  location?: string;
  totalSupplied: number;
  totalPaid: number;
  remainingDebt: number;
}

export interface SaleItem {
  inventoryId: string;
  species: WoodSpecies;
  dimensionsStr: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Sale {
  id: string;
  businessId: string;
  customerName: string;
  customerId?: string;
  items: SaleItem[];
  totalAmount: number;
  amountPaid: number;
  amountRemaining: number;
  paymentMethod: 'momo' | 'cash' | 'bank' | 'credit';
  status: 'paid' | 'partial' | 'credit';
  createdAt: string;
  notes?: string;
}

export interface PurchaseItem {
  inventoryId?: string;
  species: WoodSpecies;
  dimensionsStr: string;
  quantity: number;
  unitCost: number;
  subtotal: number;
}

export interface Purchase {
  id: string;
  businessId: string;
  supplierName: string;
  supplierId?: string;
  items: PurchaseItem[];
  totalAmount: number;
  amountPaid: number;
  amountRemaining: number;
  createdAt: string;
  notes?: string;
}

export interface PaymentRecord {
  id: string;
  businessId: string;
  entityName: string;
  entityType: 'customer' | 'supplier';
  amount: number;
  method: 'momo' | 'cash' | 'bank';
  reference?: string;
  createdAt: string;
}

export interface ExpenseRecord {
  id: string;
  businessId: string;
  category: 'transport' | 'labor' | 'rent' | 'fuel' | 'equipment' | 'other';
  description: string;
  amount: number;
  paymentMethod: 'momo' | 'cash' | 'bank';
  paidTo?: string;
  createdAt: string;
}

export interface CameraDevice {
  id: string;
  businessId: string;
  name: string;
  location: 'Ububiko' | 'Aho bakorera' | 'Aho bapakira' | 'Aho abakiriya bakirira' | 'Hanze';
  status: 'online' | 'offline';
  lastUpdate: string;
  resolution: string;
  streamUrl?: string;
  previewColor?: string;
}

export interface CameraEvent {
  id: string;
  cameraId: string;
  cameraName: string;
  eventType: 'loading_started' | 'stock_movement' | 'motion' | 'offline_alert';
  title: string;
  timestamp: string;
  details?: string;
}

export interface DashboardSummary {
  todaySales: number;        // Nagurishije
  todayExpenses: number;     // Nakoresheje
  todayProfit: number;       // Inyungu
  inventoryTotalValue: number; // Agaciro k’imbaho
  unpaidCustomerDebts: number; // Abakiriya batarishyura
  unpaidSupplierDebts: number; // Abo dufitiye amafaranga
  lowStockCount: number;
  totalPieces: number;
  todayIncome?: number;
  totalStockValue?: number;
  totalStockPieces?: number;
}

export interface ActivityLog {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type?: 'sale' | 'purchase' | 'stock' | 'system' | 'payment' | 'camera';
  amount?: number;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'danger' | 'info';
  timestamp: string;
  isRead: boolean;
}
