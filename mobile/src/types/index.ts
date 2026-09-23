export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DetectedBoard {
  id: string;
  confidence: number;
  boundingBox: BoundingBox;
}

export interface BoardDetectionResult {
  count: number;
  confidence: number;
  boards: DetectedBoard[];
  timestamp: number;
}

export interface WoodDetectionService {
  detectBoards(imageUri: string): Promise<BoardDetectionResult>;
}

export interface InventoryItem {
  id: string;
  businessId: string;
  name: string;
  category: string; // woodType alias
  woodType?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalValue: number;
  imageUrl: string;
  detectionResult: BoardDetectionResult | null;
  createdAt: number;
  updatedAt: number;
  isUserCorrected?: boolean;
  // GANZA wood-stock extensions — honest measurement
  dimensions?: {
    length: number; // meters
    width: number; // meters
    thickness: number; // meters
    displayStr: string;
  };
  volumeM3?: number; // total volume for this lot
  areaM2?: number;
  totalLengthM?: number;
  priceBasis?: 'piece' | 'm' | 'm2' | 'm3';
  pricePerUnit?: number;
  measurementMethod?: 'reference_ruler' | 'reference_object' | 'ar_depth' | 'manual' | 'estimated';
  confidence?: number;
  source?: 'scan' | 'manual';
  groups?: Array<{
    woodType: string;
    quantity: number;
    dimensions: {length: number; width: number; thickness: number; displayStr: string};
  }>;
  syncStatus?: 'synced' | 'pending' | 'failed';
}

export interface SaleItem {
  id: string;
  businessId: string;
  inventoryItemId: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalValue: number;
  customerId: string;
  customerName: string;
  paymentAmount: number;
  paymentMethod: string;
  status: SaleStatus;
  createdAt: number;
}

export type SaleStatus = 'pending' | 'confirmed' | 'cancelled';

export interface Customer {
  id: string;
  businessId: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  createdAt: number;
}

export interface User {
  uid: string;
  email: string;
  displayName: string;
  businessId?: string;
  createdAt: number;
}

export interface Business {
  id: string;
  name: string;
  address: string;
  phone: string;
  ownerId: string;
  createdAt: number;
}

export interface StockMovement {
  id: string;
  businessId: string;
  inventoryItemId: string;
  type: 'add' | 'remove' | 'adjust';
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  reason?: string;
  createdAt: number;
}

export interface DashboardData {
  totalStock: number;
  totalInventoryValue: number;
  todaySales: number;
  monthlySales: number;
  numberOfProducts: number;
  lowStockItems: number;
  recentTransactions: TransactionItem[];
}

export interface TransactionItem {
  id: string;
  type: 'sale' | 'restock' | 'adjustment';
  itemName: string;
  quantity: number;
  value: number;
  date: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export type Language = 'kin' | 'en' | 'fr';

export interface Translation {
  [key: string]: string;
}
