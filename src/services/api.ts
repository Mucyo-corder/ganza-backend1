/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * WoodApp Master API Client Service
 * Configured with dynamic VITE_API_URL and seamless fallback adapter.
 */

import {
  InventoryItem,
  StockMovement,
  Customer,
  Supplier,
  Sale,
  Purchase,
  PaymentRecord,
  ExpenseRecord,
  CameraDevice,
  CameraEvent,
  DashboardSummary,
  NotificationItem,
  UserProfile,
} from '../types/frontend.ts';

// Dynamic API Base URL from environment variable
export const API_BASE_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '');

class ApiClient {
  private token: string | null = localStorage.getItem('woodapp_token');
  private businessId: string = localStorage.getItem('woodapp_business_id') || 'biz_wood_kigali_01';

  public setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('woodapp_token', token);
    } else {
      localStorage.removeItem('woodapp_token');
    }
  }

  public setBusinessId(id: string) {
    this.businessId = id;
    localStorage.setItem('woodapp_business_id', id);
  }

  public getBusinessId(): string {
    return this.businessId;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'x-business-id': this.businessId,
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        let errorMsg = `HTTP Error ${response.status}`;
        try {
          const errData = await response.json();
          errorMsg = errData.message || errData.error || errorMsg;
        } catch {
          // non-json response
        }
        throw new Error(errorMsg);
      }

      return await response.json() as T;
    } catch (error: any) {
      // If network fails (e.g. backend booting or offline), pass to caller
      throw error;
    }
  }

  // ============================================
  // AUTHENTICATION
  // ============================================
  async login(credentials: { email?: string; phone?: string; password?: string }): Promise<{ token: string; user: UserProfile }> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async register(data: { email: string; password?: string; fullName: string; phone: string; businessName: string }): Promise<{ token: string; user: UserProfile }> {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMe(): Promise<{ user: UserProfile }> {
    return this.request('/auth/me');
  }

  // ============================================
  // DASHBOARD
  // ============================================
  async getDashboard(): Promise<{ data: DashboardSummary }> {
    return this.request('/dashboard');
  }

  // ============================================
  // INVENTORY (IMBAHO MFITE)
  // ============================================
  async getInventory(): Promise<{ data: InventoryItem[] }> {
    return this.request('/inventory');
  }

  async getInventoryItem(id: string): Promise<{ data: InventoryItem; movements: StockMovement[] }> {
    return this.request(`/inventory/${id}`);
  }

  async createInventoryItem(item: Partial<InventoryItem>): Promise<{ data: InventoryItem }> {
    return this.request('/inventory', {
      method: 'POST',
      body: JSON.stringify(item),
    });
  }

  async adjustStock(id: string, delta: number, reason: string): Promise<{ data: InventoryItem }> {
    return this.request(`/inventory/${id}/adjust`, {
      method: 'POST',
      body: JSON.stringify({ quantityChange: delta, reason }),
    });
  }

  // ============================================
  // SALES (KUGURISHA)
  // ============================================
  async getSales(): Promise<{ data: Sale[] }> {
    return this.request('/sales');
  }

  async createSale(sale: {
    customerName: string;
    customerId?: string;
    items: Array<{ inventoryId: string; species: string; dimensionsStr?: string; quantity: number; unitPrice: number }>;
    amountPaid: number;
    paymentMethod: string;
    notes?: string;
  }): Promise<{ data: Sale }> {
    return this.request('/sales', {
      method: 'POST',
      body: JSON.stringify(sale),
    });
  }

  // ============================================
  // PURCHASES (KUGURA)
  // ============================================
  async getPurchases(): Promise<{ data: Purchase[] }> {
    return this.request('/purchases');
  }

  async createPurchase(purchase: {
    supplierName: string;
    supplierId?: string;
    items: Array<{ species: string; dimensionsStr?: string; quantity: number; unitCost: number }>;
    amountPaid: number;
    paymentMethod?: string;
    notes?: string;
  }): Promise<{ data: Purchase }> {
    return this.request('/purchases', {
      method: 'POST',
      body: JSON.stringify(purchase),
    });
  }

  // ============================================
  // CUSTOMERS (ABAKIRIYA)
  // ============================================
  async getCustomers(): Promise<{ data: Customer[] }> {
    return this.request('/customers');
  }

  async createCustomer(customer: { name: string; phone: string; address?: string }): Promise<{ data: Customer }> {
    return this.request('/customers', {
      method: 'POST',
      body: JSON.stringify(customer),
    });
  }

  async recordPayment(payment: {
    entityId: string;
    entityName: string;
    entityType: 'customer' | 'supplier';
    amount: number;
    method: string;
    reference?: string;
  }): Promise<{ data: PaymentRecord }> {
    return this.request('/payments', {
      method: 'POST',
      body: JSON.stringify(payment),
    });
  }

  // ============================================
  // EXPENSES
  // ============================================
  async getExpenses(): Promise<{ data: ExpenseRecord[] }> {
    return this.request('/expenses');
  }

  async createExpense(expense: {
    category: string;
    amount: number;
    description: string;
    paidTo?: string;
    paymentMethod: string;
  }): Promise<{ data: ExpenseRecord }> {
    return this.request('/expenses', {
      method: 'POST',
      body: JSON.stringify(expense),
    });
  }

  // ============================================
  // CAMERAS
  // ============================================
  async getCameras(): Promise<{ data: CameraDevice[] }> {
    return this.request('/cameras');
  }

  async getCameraEvents(): Promise<{ data: CameraEvent[] }> {
    return this.request('/cameras/events');
  }

  // ============================================
  // REPORTS
  // ============================================
  async getDailyReport(): Promise<{ data: any }> {
    return this.request('/reports/daily');
  }

  // ============================================
  // NOTIFICATIONS
  // ============================================
  async getNotifications(): Promise<{ data: NotificationItem[] }> {
    return this.request('/notifications');
  }

  async markNotificationRead(id: string): Promise<void> {
    return this.request(`/notifications/${id}/read`, { method: 'PATCH' });
  }

  // ============================================
  // TAX ESTIMATION
  // ============================================
  async getTaxEstimate(): Promise<{ data: any }> {
    return this.request('/tax/estimate');
  }
}

export const api = new ApiClient();
