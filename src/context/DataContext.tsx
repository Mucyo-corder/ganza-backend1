/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * WoodApp Central Business Data Context
 * Manages timber inventory, sales, purchases, customer debts, and metrics.
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
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
  ExpenseRecord,
  ActivityLog,
} from '../types/frontend.ts';
import {
  INITIAL_INVENTORY,
  INITIAL_CUSTOMERS,
  INITIAL_SUPPLIERS,
  INITIAL_SALES,
  INITIAL_CAMERAS,
  INITIAL_CAMERA_EVENTS,
  INITIAL_DASHBOARD,
  INITIAL_NOTIFICATIONS,
  INITIAL_STOCK_MOVEMENTS,
} from '../services/devAdapter.ts';
import { api } from '../services/api.ts';

interface DataContextType {
  inventory: InventoryItem[];
  customers: Customer[];
  suppliers: Supplier[];
  sales: Sale[];
  purchases: Purchase[];
  expenses: ExpenseRecord[];
  activities: ActivityLog[];
  cameras: CameraDevice[];
  cameraEvents: CameraEvent[];
  dashboard: DashboardSummary;
  notifications: NotificationItem[];
  movements: Record<string, StockMovement[]>;
  loading: boolean;
  refreshData: () => Promise<void>;
  addInventoryItem: (item: Omit<InventoryItem, 'id' | 'businessId' | 'totalValue' | 'status' | 'updatedAt'>) => Promise<void>;
  adjustStock: (inventoryId: string, quantityDelta: number, reason: string) => Promise<void>;
  addSale: (saleData: {
    customerName: string;
    customerId?: string;
    inventoryId: string;
    quantity: number;
    unitPrice: number;
    amountPaid: number;
    paymentMethod: 'momo' | 'cash' | 'bank' | 'credit';
    notes?: string;
  }) => Promise<void>;
  addPurchase: (purchaseData: {
    supplierName: string;
    supplierId?: string;
    species: any;
    dimensionsStr: string;
    quantity: number;
    unitCost: number;
    amountPaid: number;
    paymentMethod?: string;
    notes?: string;
  }) => Promise<void>;
  addExpense: (data: {
    category: any;
    description: string;
    amount: number;
    paymentMethod?: 'momo' | 'cash' | 'bank';
    paidTo?: string;
  }) => Promise<void>;
  addCustomer: (data: { name: string; phone: string; address?: string }) => Promise<void>;
  addSupplier: (data: { name: string; phone: string; location?: string }) => Promise<void>;
  recordCustomerPayment: (customerId: string, amount: number, method: 'momo' | 'cash' | 'bank') => Promise<void>;
  markNotificationRead: (id: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    const saved = localStorage.getItem('woodapp_inv');
    return saved ? JSON.parse(saved) : INITIAL_INVENTORY;
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('woodapp_cust');
    return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>(INITIAL_SUPPLIERS);

  const [sales, setSales] = useState<Sale[]>(() => {
    const saved = localStorage.getItem('woodapp_sales');
    return saved ? JSON.parse(saved) : INITIAL_SALES;
  });

  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([
    {
      id: 'exp_01',
      businessId: 'biz_wood_kigali_01',
      category: 'transport',
      description: 'Imodoka yazanye imbaho za Eucalyptus i Gicumbi',
      amount: 120000,
      paymentMethod: 'momo',
      paidTo: 'Shoferi Claude',
      createdAt: 'Uyu munsi, 08:30',
    },
    {
      id: 'exp_02',
      businessId: 'biz_wood_kigali_01',
      category: 'labor',
      description: 'Ibihembo by’abakarani bapakiye imbaho (Day labor)',
      amount: 45000,
      paymentMethod: 'cash',
      paidTo: 'Abakarani 4',
      createdAt: 'Uyu munsi, 11:00',
    },
    {
      id: 'exp_03',
      businessId: 'biz_wood_kigali_01',
      category: 'fuel',
      description: 'Lisansi ya generator na moto yo kubaruza',
      amount: 35000,
      paymentMethod: 'momo',
      paidTo: 'Station SP Nyabugogo',
      createdAt: 'Ejo hashize',
    },
  ]);
  const [activities, setActivities] = useState<ActivityLog[]>([
    {
      id: 'act_01',
      title: 'Igurisha rishya',
      description: 'Wagurishije imbaho 10 za Eucalyptus kuri Jean Baptiste Rugamba',
      timestamp: '10:15 uyu munsi',
      type: 'sale',
    },
    {
      id: 'act_02',
      title: 'Kwinjiza imbaho',
      description: 'Koperative Gicumbi yazanye imbaho 50 za Pine',
      timestamp: '09:00 uyu munsi',
      type: 'purchase',
    },
    {
      id: 'act_03',
      title: 'Kwishyura umwenda',
      description: 'Ingénieur Habimana yishyuye 200,000 RWF kuri MoMo',
      timestamp: 'Ejo hashize',
      type: 'system',
    },
  ]);
  const [cameras] = useState<CameraDevice[]>(INITIAL_CAMERAS);
  const [cameraEvents] = useState<CameraEvent[]>(INITIAL_CAMERA_EVENTS);
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const saved = localStorage.getItem('woodapp_notifs');
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  const [movements, setMovements] = useState<Record<string, StockMovement[]>>(() => {
    const saved = localStorage.getItem('woodapp_movs');
    return saved ? JSON.parse(saved) : INITIAL_STOCK_MOVEMENTS;
  });

  const [loading, setLoading] = useState(false);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('woodapp_inv', JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem('woodapp_cust', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('woodapp_sales', JSON.stringify(sales));
  }, [sales]);

  useEffect(() => {
    localStorage.setItem('woodapp_notifs', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('woodapp_movs', JSON.stringify(movements));
  }, [movements]);

  // Compute live dashboard metrics
  const computeDashboard = (): DashboardSummary => {
    const totalInventoryValue = inventory.reduce((sum, item) => sum + item.totalValue, 0);
    const totalPieces = inventory.reduce((sum, item) => sum + item.quantity, 0);
    const lowStockCount = inventory.filter((i) => i.status === 'bike' || i.status === 'byarashize').length;
    const unpaidCustDebts = customers.reduce((sum, c) => sum + (c.remainingDebt || 0), 0);
    const unpaidSuppDebts = suppliers.reduce((sum, s) => sum + (s.remainingDebt || 0), 0);
    const todaySalesRevenue = sales.reduce((sum, s) => sum + s.totalAmount, 0);
    const todaySalesVal = todaySalesRevenue > 0 ? todaySalesRevenue : INITIAL_DASHBOARD.todaySales;

    return {
      todaySales: todaySalesVal,
      todayIncome: todaySalesVal,
      todayExpenses: INITIAL_DASHBOARD.todayExpenses,
      todayProfit: Math.max(0, todaySalesVal - INITIAL_DASHBOARD.todayExpenses - (totalInventoryValue * 0.15)),
      inventoryTotalValue: totalInventoryValue,
      totalStockValue: totalInventoryValue,
      unpaidCustomerDebts: unpaidCustDebts,
      unpaidSupplierDebts: unpaidSuppDebts,
      lowStockCount,
      totalPieces,
      totalStockPieces: totalPieces,
    };
  };

  const [dashboard, setDashboard] = useState<DashboardSummary>(computeDashboard());

  useEffect(() => {
    setDashboard(computeDashboard());
  }, [inventory, customers, sales]);

  const refreshData = async () => {
    setLoading(true);
    try {
      // Try hitting backend if online
      const invRes = await api.getInventory().catch(() => null);
      if (invRes && invRes.data && invRes.data.length > 0) {
        setInventory(invRes.data);
      }
      const custRes = await api.getCustomers().catch(() => null);
      if (custRes && custRes.data && custRes.data.length > 0) {
        setCustomers(custRes.data);
      }
    } finally {
      setLoading(false);
    }
  };

  const addInventoryItem = async (itemData: Omit<InventoryItem, 'id' | 'businessId' | 'totalValue' | 'status' | 'updatedAt'>) => {
    const totalValue = itemData.quantity * itemData.sellingPrice;
    const status = itemData.quantity === 0 ? 'byarashize' : itemData.quantity <= itemData.minThreshold ? 'bike' : 'hahagije';
    const newId = 'inv_' + Date.now();

    const newItem: InventoryItem = {
      ...itemData,
      id: newId,
      businessId: api.getBusinessId(),
      totalValue,
      status,
      updatedAt: new Date().toISOString(),
    };

    setInventory((prev) => [newItem, ...prev]);

    // Add initial movement
    const movement: StockMovement = {
      id: 'mov_' + Date.now(),
      inventoryId: newId,
      speciesName: itemData.species,
      type: 'purchase',
      quantityDelta: itemData.quantity,
      balanceAfter: itemData.quantity,
      reason: 'Wongeye stock ya mbere',
      timestamp: 'Ubu ako kanya',
    };

    setMovements((prev) => ({
      ...prev,
      [newId]: [movement],
    }));

    // Post to backend in background
    api.createInventoryItem(newItem).catch(() => {});
  };

  const adjustStock = async (inventoryId: string, delta: number, reason: string) => {
    setInventory((prev) =>
      prev.map((item) => {
        if (item.id === inventoryId) {
          const newQty = Math.max(0, item.quantity + delta);
          const newStatus = newQty === 0 ? 'byarashize' : newQty <= item.minThreshold ? 'bike' : 'hahagije';
          return {
            ...item,
            quantity: newQty,
            totalValue: newQty * item.sellingPrice,
            status: newStatus,
            updatedAt: new Date().toISOString(),
          };
        }
        return item;
      })
    );

    const targetItem = inventory.find((i) => i.id === inventoryId);
    const balanceAfter = targetItem ? Math.max(0, targetItem.quantity + delta) : delta;

    const movement: StockMovement = {
      id: 'mov_' + Date.now(),
      inventoryId,
      speciesName: targetItem?.species || 'Imbaho',
      type: delta >= 0 ? 'adjustment' : 'loss',
      quantityDelta: delta,
      balanceAfter,
      reason,
      timestamp: 'Ubu ako kanya',
    };

    setMovements((prev) => ({
      ...prev,
      [inventoryId]: [movement, ...(prev[inventoryId] || [])],
    }));

    // Try backend
    api.adjustStock(inventoryId, delta, reason).catch(() => {});
  };

  const addSale = async (saleData: {
    customerName: string;
    customerId?: string;
    inventoryId: string;
    quantity: number;
    unitPrice: number;
    amountPaid: number;
    paymentMethod: 'momo' | 'cash' | 'bank' | 'credit';
    notes?: string;
  }) => {
    const targetItem = inventory.find((i) => i.id === saleData.inventoryId);
    const subtotal = saleData.quantity * saleData.unitPrice;
    const remaining = Math.max(0, subtotal - saleData.amountPaid);
    const saleStatus = remaining === 0 ? 'paid' : saleData.amountPaid === 0 ? 'credit' : 'partial';

    const newSale: Sale = {
      id: 'sale_' + Date.now(),
      businessId: api.getBusinessId(),
      customerName: saleData.customerName,
      customerId: saleData.customerId,
      items: [
        {
          inventoryId: saleData.inventoryId,
          species: targetItem?.species || 'Eucalyptus',
          dimensionsStr: targetItem?.dimensions.displayStr || '3m × 15cm × 5cm',
          quantity: saleData.quantity,
          unitPrice: saleData.unitPrice,
          subtotal,
        },
      ],
      totalAmount: subtotal,
      amountPaid: saleData.amountPaid,
      amountRemaining: remaining,
      paymentMethod: saleData.paymentMethod,
      status: saleStatus,
      createdAt: 'Uyu munsi, ' + new Date().toLocaleTimeString('rw-RW', { hour: '2-digit', minute: '2-digit' }),
      notes: saleData.notes,
    };

    setSales((prev) => [newSale, ...prev]);

    // Deduct stock
    adjustStock(saleData.inventoryId, -saleData.quantity, `Wagurishije (${saleData.customerName})`);

    // If remaining debt, update or create customer debt
    if (remaining > 0 && saleData.customerName) {
      setCustomers((prev) => {
        const existing = prev.find((c) => c.name.toLowerCase() === saleData.customerName.toLowerCase());
        if (existing) {
          return prev.map((c) =>
            c.id === existing.id
              ? {
                  ...c,
                  totalPurchases: c.totalPurchases + subtotal,
                  totalPaid: c.totalPaid + saleData.amountPaid,
                  remainingDebt: c.remainingDebt + remaining,
                  status: 'haracyabura',
                  lastPurchaseDate: 'Uyu munsi',
                }
              : c
          );
        } else {
          const newCust: Customer = {
            id: 'cust_' + Date.now(),
            businessId: api.getBusinessId(),
            name: saleData.customerName,
            phone: '+250 788 000 000',
            totalPurchases: subtotal,
            totalPaid: saleData.amountPaid,
            remainingDebt: remaining,
            status: 'haracyabura',
            lastPurchaseDate: 'Uyu munsi',
          };
          return [newCust, ...prev];
        }
      });
    }

    // Add notification
    const newNotif: NotificationItem = {
      id: 'notif_' + Date.now(),
      title: 'Igurisha rishya',
      message: `💰 Wagurishije imbaho ${saleData.quantity} kuri ${subtotal.toLocaleString()} RWF (${saleData.customerName}).`,
      type: 'success',
      timestamp: 'Mu kanya gashize',
      isRead: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const addPurchase = async (purchaseData: {
    supplierName: string;
    supplierId?: string;
    species: any;
    dimensionsStr: string;
    quantity: number;
    unitCost: number;
    amountPaid: number;
    paymentMethod?: string;
    notes?: string;
  }) => {
    const subtotal = purchaseData.quantity * purchaseData.unitCost;
    const remaining = Math.max(0, subtotal - purchaseData.amountPaid);

    const newPurchase: Purchase = {
      id: 'pur_' + Date.now(),
      businessId: api.getBusinessId(),
      supplierName: purchaseData.supplierName,
      supplierId: purchaseData.supplierId,
      items: [
        {
          species: purchaseData.species,
          dimensionsStr: purchaseData.dimensionsStr,
          quantity: purchaseData.quantity,
          unitCost: purchaseData.unitCost,
          subtotal,
        },
      ],
      totalAmount: subtotal,
      amountPaid: purchaseData.amountPaid,
      amountRemaining: remaining,
      createdAt: 'Uyu munsi, ' + new Date().toLocaleTimeString('rw-RW', { hour: '2-digit', minute: '2-digit' }),
      notes: purchaseData.notes,
    };

    setPurchases((prev) => [newPurchase, ...prev]);

    // Check if item exists in inventory, or add to existing
    const existing = inventory.find(
      (i) => i.species === purchaseData.species && i.dimensions.displayStr === purchaseData.dimensionsStr
    );

    if (existing) {
      adjustStock(existing.id, purchaseData.quantity, `Waziguze (${purchaseData.supplierName})`);
    } else {
      addInventoryItem({
        species: purchaseData.species,
        name: `${purchaseData.species} (${purchaseData.dimensionsStr})`,
        dimensions: { length: 3, width: 15, thickness: 5, displayStr: purchaseData.dimensionsStr },
        quantity: purchaseData.quantity,
        minThreshold: 5,
        costPrice: purchaseData.unitCost,
        sellingPrice: Math.round(purchaseData.unitCost * 1.25),
        locationArea: 'Ububiko A',
      });
    }

    const newNotif: NotificationItem = {
      id: 'notif_' + Date.now(),
      title: 'Imbaho zageze mu bubiko',
      message: `🟢 Wongeye imbaho ${purchaseData.quantity} za ${purchaseData.species} muri stock.`,
      type: 'success',
      timestamp: 'Mu kanya gashize',
      isRead: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const addCustomer = async (data: { name: string; phone: string; address?: string }) => {
    const newCustomer: Customer = {
      id: 'cust_' + Date.now(),
      businessId: api.getBusinessId(),
      name: data.name,
      phone: data.phone,
      address: data.address,
      totalPurchases: 0,
      totalPaid: 0,
      remainingDebt: 0,
      status: 'yishyuwe',
      lastPurchaseDate: 'Nta yo',
    };

    setCustomers((prev) => [newCustomer, ...prev]);
    api.createCustomer(data).catch(() => {});
  };

  const recordCustomerPayment = async (customerId: string, amount: number, method: 'momo' | 'cash' | 'bank') => {
    setCustomers((prev) =>
      prev.map((cust) => {
        if (cust.id === customerId) {
          const newRemaining = Math.max(0, cust.remainingDebt - amount);
          return {
            ...cust,
            totalPaid: cust.totalPaid + amount,
            remainingDebt: newRemaining,
            status: newRemaining === 0 ? 'yishyuwe' : 'haracyabura',
          };
        }
        return cust;
      })
    );

    const targetCustomer = customers.find((c) => c.id === customerId);
    const newNotif: NotificationItem = {
      id: 'notif_' + Date.now(),
      title: 'Kwishyura k’umwenda',
      message: `💰 ${targetCustomer?.name || 'Umukiriya'} yishyuye ${amount.toLocaleString()} RWF kuri ${method.toUpperCase()}.`,
      type: 'success',
      timestamp: 'Mu kanya gashize',
      isRead: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const addSupplier = async (data: { name: string; phone: string; location?: string }) => {
    const newSupp: Supplier = {
      id: 'supp_' + Date.now(),
      businessId: api.getBusinessId(),
      name: data.name,
      phone: data.phone,
      location: data.location || 'Rwanda',
      totalSupplied: 0,
      totalPaid: 0,
      remainingDebt: 0,
    };
    setSuppliers((prev) => [newSupp, ...prev]);
  };

  const addExpense = async (data: {
    category: any;
    description: string;
    amount: number;
    paymentMethod?: 'momo' | 'cash' | 'bank';
    paidTo?: string;
  }) => {
    const newExp: ExpenseRecord = {
      id: 'exp_' + Date.now(),
      businessId: api.getBusinessId(),
      category: data.category || 'other',
      description: data.description,
      amount: data.amount,
      paymentMethod: data.paymentMethod || 'cash',
      paidTo: data.paidTo,
      createdAt: 'Uyu munsi, ' + new Date().toLocaleTimeString('rw-RW', { hour: '2-digit', minute: '2-digit' }),
    };
    setExpenses((prev) => [newExp, ...prev]);

    const newActivity: ActivityLog = {
      id: 'act_' + Date.now(),
      title: 'Amafaranga yasohotse',
      description: `${data.description} (${data.amount.toLocaleString()} RWF)`,
      timestamp: 'Aho ako kanya',
      type: 'system',
    };
    setActivities((prev) => [newActivity, ...prev]);
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  return (
    <DataContext.Provider
      value={{
        inventory,
        customers,
        suppliers,
        sales,
        purchases,
        expenses,
        activities,
        cameras,
        cameraEvents,
        dashboard,
        notifications,
        movements,
        loading,
        refreshData,
        addInventoryItem,
        adjustStock,
        addSale,
        addPurchase,
        addExpense,
        addCustomer,
        addSupplier,
        recordCustomerPayment,
        markNotificationRead,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
