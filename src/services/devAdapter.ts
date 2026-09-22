/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * WoodApp Isolated Development Adapter
 * Provides realistic initial wood business data for offline/preview mode.
 * Completely isolated from main API architecture.
 */

import {
  InventoryItem,
  StockMovement,
  Customer,
  Supplier,
  Sale,
  Purchase,
  CameraDevice,
  CameraEvent,
  DashboardSummary,
  NotificationItem,
  UserProfile,
} from '../types/frontend.ts';

export const INITIAL_USER: UserProfile = {
  id: 'user_boss_kigali_01',
  email: 'kwizerajaiid@gmail.com',
  fullName: 'Kwizera Jean Claude',
  role: 'owner',
  phone: '+250 788 123 456',
  businessId: 'biz_wood_kigali_01',
  businessName: 'Kigali Wood & Timber Yard',
};

export const INITIAL_INVENTORY: InventoryItem[] = [
  {
    id: 'inv_eucalyptus_01',
    businessId: 'biz_wood_kigali_01',
    species: 'Eucalyptus',
    name: 'Eucalyptus (Inturusu)',
    dimensions: { length: 3, width: 15, thickness: 5, displayStr: '3m × 15cm × 5cm' },
    quantity: 45,
    minThreshold: 10,
    costPrice: 25000,
    sellingPrice: 30000,
    totalValue: 1350000, // 45 * 30000
    status: 'hahagije',
    locationArea: 'Ububiko A (Hasi)',
    imageUrl: 'https://images.unsplash.com/photo-1546484396-fb3fc6f95f98?w=800&auto=format&fit=crop&q=80',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'inv_pine_01',
    businessId: 'biz_wood_kigali_01',
    species: 'Pine',
    name: 'Pine (Pini)',
    dimensions: { length: 4, width: 20, thickness: 2.5, displayStr: '4m × 20cm × 2.5cm' },
    quantity: 5,
    minThreshold: 12,
    costPrice: 22000,
    sellingPrice: 28000,
    totalValue: 140000,
    status: 'bike',
    locationArea: 'Ububiko B (Hejuru)',
    imageUrl: 'https://images.unsplash.com/photo-1516455590571-18256e5bb9ff?w=800&auto=format&fit=crop&q=80',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'inv_teak_01',
    businessId: 'biz_wood_kigali_01',
    species: 'Teak',
    name: 'Teak (Tiki y’Imbaho Nziza)',
    dimensions: { length: 2.5, width: 25, thickness: 5, displayStr: '2.5m × 25cm × 5cm' },
    quantity: 28,
    minThreshold: 5,
    costPrice: 50000,
    sellingPrice: 65000,
    totalValue: 1820000,
    status: 'hahagije',
    locationArea: 'Icyumba cy’Imbaho z’Agaciro',
    imageUrl: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800&auto=format&fit=crop&q=80',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'inv_cypress_01',
    businessId: 'biz_wood_kigali_01',
    species: 'Cypress',
    name: 'Cypress (Icyipure)',
    dimensions: { length: 3, width: 10, thickness: 10, displayStr: '3m × 10cm × 10cm' },
    quantity: 0,
    minThreshold: 8,
    costPrice: 15000,
    sellingPrice: 19000,
    totalValue: 0,
    status: 'byarashize',
    locationArea: 'Ububiko A',
    imageUrl: 'https://images.unsplash.com/photo-1502005229762-ee1b2da97e06?w=800&auto=format&fit=crop&q=80',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'inv_grevillea_01',
    businessId: 'biz_wood_kigali_01',
    species: 'Grevillea',
    name: 'Grevillea (Gereveliya)',
    dimensions: { length: 3, width: 12, thickness: 3, displayStr: '3m × 12cm × 3cm' },
    quantity: 18,
    minThreshold: 6,
    costPrice: 12000,
    sellingPrice: 16000,
    totalValue: 288000,
    status: 'hahagije',
    locationArea: 'Aho basudira',
    imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&auto=format&fit=crop&q=80',
    updatedAt: new Date().toISOString(),
  },
];

export const INITIAL_STOCK_MOVEMENTS: Record<string, StockMovement[]> = {
  inv_eucalyptus_01: [
    {
      id: 'mov_01',
      inventoryId: 'inv_eucalyptus_01',
      speciesName: 'Eucalyptus',
      type: 'adjustment',
      quantityDelta: 15,
      balanceAfter: 45,
      reason: 'Wongeye stock',
      timestamp: 'Uyu munsi, 09:30',
    },
    {
      id: 'mov_02',
      inventoryId: 'inv_eucalyptus_01',
      speciesName: 'Eucalyptus',
      type: 'sale',
      quantityDelta: -10,
      balanceAfter: 30,
      reason: 'Wagurishije (Jean)',
      timestamp: 'Ejo hashize, 14:15',
    },
    {
      id: 'mov_03',
      inventoryId: 'inv_eucalyptus_01',
      speciesName: 'Eucalyptus',
      type: 'purchase',
      quantityDelta: 20,
      balanceAfter: 40,
      reason: 'Waziguze (Gicumbi Forest)',
      timestamp: 'Tariki 18 Nzeri',
    },
  ],
};

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust_jean_01',
    businessId: 'biz_wood_kigali_01',
    name: 'Jean Baptiste Rugamba',
    phone: '+250 788 456 789',
    address: 'Gisozi, Kigali',
    totalPurchases: 750000,
    totalPaid: 600000,
    remainingDebt: 150000,
    status: 'haracyabura',
    lastPurchaseDate: 'Ejo hashize',
  },
  {
    id: 'cust_aimee_02',
    businessId: 'biz_wood_kigali_01',
    name: 'Aimee Mukamana (Carpentry Atelier)',
    phone: '+250 783 112 233',
    address: 'Kimironko, Kigali',
    totalPurchases: 1200000,
    totalPaid: 1200000,
    remainingDebt: 0,
    status: 'yishyuwe',
    lastPurchaseDate: 'Uyu munsi',
  },
  {
    id: 'cust_eric_03',
    businessId: 'biz_wood_kigali_01',
    name: 'Ingénieur Eric Habimana',
    phone: '+250 785 998 877',
    address: 'Nyarutarama',
    totalPurchases: 950000,
    totalPaid: 750000,
    remainingDebt: 200000,
    status: 'haracyabura',
    lastPurchaseDate: 'Tariki 19 Nzeri',
  },
];

export const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: 'supp_01',
    businessId: 'biz_wood_kigali_01',
    name: 'Koperative y’Abahinzi b’Ibiti Gicumbi',
    phone: '+250 788 334 455',
    location: 'Gicumbi, Amajyaruguru',
    totalSupplied: 4500000,
    totalPaid: 4100000,
    remainingDebt: 400000,
  },
  {
    id: 'supp_02',
    businessId: 'biz_wood_kigali_01',
    name: 'Rwanda Wood Sawmill Nyungwe',
    phone: '+250 788 667 788',
    location: 'Nyamagabe',
    totalSupplied: 6200000,
    totalPaid: 6200000,
    remainingDebt: 0,
  },
];

export const INITIAL_CAMERAS: CameraDevice[] = [
  {
    id: 'cam_ububiko',
    businessId: 'biz_wood_kigali_01',
    name: 'Ububiko (Stock Yard)',
    location: 'Ububiko',
    status: 'online',
    lastUpdate: 'Aho ako kanya',
    resolution: '4K UltraHD',
    previewColor: 'from-[#3A271E] to-[#1B120E]',
  },
  {
    id: 'cam_ahobakorera',
    businessId: 'biz_wood_kigali_01',
    name: 'Aho Bakorera (Atelier & Sawmill)',
    location: 'Aho bakorera',
    status: 'online',
    lastUpdate: 'Aho ako kanya',
    resolution: '1080p 60fps',
    previewColor: 'from-[#2B1D16] to-[#3A271E]',
  },
  {
    id: 'cam_ahobapakira',
    businessId: 'biz_wood_kigali_01',
    name: 'Aho Bapakira (Loading Bay)',
    location: 'Aho bapakira',
    status: 'online',
    lastUpdate: 'Aho ako kanya',
    resolution: '1080p 30fps',
    previewColor: 'from-[#5A3B28] to-[#2B1D16]',
  },
  {
    id: 'cam_reception',
    businessId: 'biz_wood_kigali_01',
    name: 'Aho Abakiriya Bakirira (Counter)',
    location: 'Aho abakiriya bakirira',
    status: 'online',
    lastUpdate: 'Aho ako kanya',
    resolution: '1080p 30fps',
    previewColor: 'from-[#3A271E] to-[#241A15]',
  },
  {
    id: 'cam_hanze',
    businessId: 'biz_wood_kigali_01',
    name: 'Hanze (Irembo n’Imodoka)',
    location: 'Hanze',
    status: 'online',
    lastUpdate: 'Aho ako kanya',
    resolution: '4K UltraHD',
    previewColor: 'from-[#1B120E] to-[#2B1D16]',
  },
];

export const INITIAL_CAMERA_EVENTS: CameraEvent[] = [
  {
    id: 'ev_01',
    cameraId: 'cam_ahobapakira',
    cameraName: 'Aho Bapakira',
    eventType: 'loading_started',
    title: 'Imodoka irimo gupakira imbaho',
    timestamp: '10:14 uyu munsi',
    details: 'Daihatsu RAC 421 K yageze mu kibuga cyo gupakiriramo.',
  },
  {
    id: 'ev_02',
    cameraId: 'cam_ububiko',
    cameraName: 'Ububiko',
    eventType: 'stock_movement',
    title: 'Imbaho za Eucalyptus zimuwe',
    timestamp: '09:40 uyu munsi',
    details: 'Abakozi 2 barimo kwinjiza imbaho 15 muri stock A.',
  },
];

export const INITIAL_SALES: Sale[] = [
  {
    id: 'sale_01',
    businessId: 'biz_wood_kigali_01',
    customerName: 'Jean Baptiste Rugamba',
    customerId: 'cust_jean_01',
    items: [
      {
        inventoryId: 'inv_eucalyptus_01',
        species: 'Eucalyptus',
        dimensionsStr: '3m × 15cm × 5cm',
        quantity: 10,
        unitPrice: 30000,
        subtotal: 300000,
      },
      {
        inventoryId: 'inv_pine_01',
        species: 'Pine',
        dimensionsStr: '4m × 20cm × 2.5cm',
        quantity: 5,
        unitPrice: 28000,
        subtotal: 140000,
      }
    ],
    totalAmount: 440000,
    amountPaid: 300000,
    amountRemaining: 140000,
    paymentMethod: 'momo',
    status: 'partial',
    createdAt: 'Uyu munsi, 10:15',
    notes: 'Yatanze 300,000 kuri MoMo, asigaye azayazana kuwa gatanu.',
  },
  {
    id: 'sale_02',
    businessId: 'biz_wood_kigali_01',
    customerName: 'Aimee Mukamana',
    customerId: 'cust_aimee_02',
    items: [
      {
        inventoryId: 'inv_teak_01',
        species: 'Teak',
        dimensionsStr: '2.5m × 25cm × 5cm',
        quantity: 8,
        unitPrice: 65000,
        subtotal: 520000,
      }
    ],
    totalAmount: 520000,
    amountPaid: 520000,
    amountRemaining: 0,
    paymentMethod: 'bank',
    status: 'paid',
    createdAt: 'Uyu munsi, 08:50',
    notes: 'Yishyuwe yose kuri Bank transfer.',
  }
];

export const INITIAL_DASHBOARD: DashboardSummary = {
  todaySales: 1850000,
  todayExpenses: 230000,
  todayProfit: 620000,
  inventoryTotalValue: 3450000,
  unpaidCustomerDebts: 350000,
  unpaidSupplierDebts: 400000,
  lowStockCount: 2,
  totalPieces: 96,
};

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif_01',
    title: 'Imbaho zongerewe',
    message: '🟢 Wongeye imbaho 20 za Eucalyptus muri stock.',
    type: 'success',
    timestamp: 'Mu kanya gashize',
    isRead: false,
  },
  {
    id: 'notif_02',
    title: 'Kwishyura k’Umukiriya',
    message: '💰 Jean yishyuye 100,000 RWF kuri MoMo.',
    type: 'success',
    timestamp: 'Isaha 1 ishize',
    isRead: false,
  },
  {
    id: 'notif_03',
    title: 'Stock igiye gushira',
    message: '🟡 Eucalyptus isigaje imbaho 5 gusa.',
    type: 'warning',
    timestamp: 'Amasaha 3 ashize',
    isRead: false,
  },
  {
    id: 'notif_04',
    title: 'Imbaho zarashize',
    message: '🔴 Cypress yarashize burundu mu bubiko.',
    type: 'danger',
    timestamp: 'Ejo hashize',
    isRead: true,
  },
];
