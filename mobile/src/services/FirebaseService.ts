import {
  getFirebaseAuthInstance,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  fbSignOut,
  sendPasswordResetEmail,
  updateProfile,
} from '../config/firebase';
import {User, Business, InventoryItem, SaleItem, Customer, StockMovement} from '../types';
import {StorageService} from './StorageService';

const API_BASE = process.env.API_URL || 'https://ganza-backend1.onrender.com';

async function getIdTokenInternal(forceRefresh = false): Promise<string | null> {
  try {
    const auth = getFirebaseAuthInstance();
    const user = auth.currentUser;
    if (!user) return null;
    return await user.getIdToken(forceRefresh);
  } catch {
    return null;
  }
}

export class FirebaseService {
  private static instance: FirebaseService;

  static getInstance(): FirebaseService {
    if (!FirebaseService.instance) {
      FirebaseService.instance = new FirebaseService();
    }
    return FirebaseService.instance;
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const auth = getFirebaseAuthInstance();
      const fbUser = auth.currentUser;
      if (!fbUser) return null;
      return {
        uid: fbUser.uid,
        email: fbUser.email || '',
        displayName: fbUser.displayName || fbUser.email?.split('@')[0] || '',
        businessId: undefined,
        createdAt: fbUser.metadata.creationTime ? Date.parse(fbUser.metadata.creationTime) : Date.now(),
      };
    } catch {
      return null;
    }
  }

  async signUp(email: string, password: string, displayName: string): Promise<User> {
    if (!email || !password) throw new Error('Email na password birakenewe');
    if (password.length < 6) throw new Error('Password igomba kuba nibura inyuguti 6');
    const auth = getFirebaseAuthInstance();
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName && cred.user) {
      try {
        await updateProfile(cred.user, {displayName});
      } catch {}
    }
    // Optionally also register business membership via backend
    try {
      const token = await cred.user.getIdToken();
      await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json', Authorization: `Bearer ${token}`},
        body: JSON.stringify({email, displayName}),
      }).catch(() => {});
    } catch {}
    return {
      uid: cred.user.uid,
      email: cred.user.email || email,
      displayName: displayName || cred.user.displayName || email.split('@')[0],
      createdAt: Date.now(),
    };
  }

  async signIn(email: string, password: string): Promise<User> {
    if (!email || !password) throw new Error('Email na password birakenewe');
    const auth = getFirebaseAuthInstance();
    const cred = await signInWithEmailAndPassword(auth, email, password);
    // Cache token for offline backend calls
    const token = await cred.user.getIdToken();
    await StorageService.setItem('@ganza_id_token', token).catch(() => {});
    return {
      uid: cred.user.uid,
      email: cred.user.email || email,
      displayName: cred.user.displayName || email.split('@')[0],
      businessId: undefined,
      createdAt: cred.user.metadata.creationTime ? Date.parse(cred.user.metadata.creationTime) : Date.now(),
    };
  }

  async signOut(): Promise<void> {
    const auth = getFirebaseAuthInstance();
    await fbSignOut(auth);
    await StorageService.removeItem('@ganza_id_token').catch(() => {});
  }

  async resetPassword(email: string): Promise<void> {
    if (!email) throw new Error('Shyiramo email');
    const auth = getFirebaseAuthInstance();
    await sendPasswordResetEmail(auth, email);
  }

  async getIdToken(forceRefresh = false): Promise<string> {
    const token = await getIdTokenInternal(forceRefresh);
    if (token) {
      await StorageService.setItem('@ganza_id_token', token).catch(() => {});
      return token;
    }
    const cached = await StorageService.getItem('@ganza_id_token').catch(() => null);
    return cached || '';
  }

  // ---------- Backend-synced data ----------
  private async authHeaders(): Promise<Record<string, string>> {
    const token = await this.getIdToken();
    const headers: Record<string, string> = {'Content-Type': 'application/json'};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  }

  async getBusiness(businessId: string): Promise<Business | null> {
    if (!businessId) return null;
    const res = await this.sendToBackend<Business>(`/api/businesses/${businessId}`, 'GET');
    return res.data || null;
  }

  async getInventory(businessId: string): Promise<InventoryItem[]> {
    if (!businessId) return [];
    try {
      const res = await this.sendToBackend<{items: InventoryItem[]; data?: InventoryItem[]}>(
        `/api/inventory?businessId=${encodeURIComponent(businessId)}`,
        'GET'
      );
      if (res.data) {
        const anyData = res.data as unknown as {items?: InventoryItem[]} & InventoryItem[] & {data?: InventoryItem[]};
        if (Array.isArray(anyData)) return anyData as unknown as InventoryItem[];
        if ((anyData as {items?: InventoryItem[]}).items) return (anyData as {items: InventoryItem[]}).items;
        if ((anyData as {data?: InventoryItem[]}).data) return (anyData as {data: InventoryItem[]}).data!;
        return [];
      }
      // fallback cache
      const cached = await StorageService.getCache().catch(() => null);
      return (cached as any)?.inventory?.filter((i: InventoryItem) => i.businessId === businessId) || [];
    } catch {
      const cached = await StorageService.getCache().catch(() => null);
      return (cached as any)?.inventory?.filter((i: InventoryItem) => i.businessId === businessId) || [];
    }
  }

  async getInventoryItem(itemId: string): Promise<InventoryItem | null> {
    const res = await this.sendToBackend<InventoryItem>(`/api/inventory/${itemId}`, 'GET');
    return res.data || null;
  }

  async saveInventoryItem(item: InventoryItem): Promise<string> {
    // input validation — never trust UI
    if (!item.name || !item.name.trim()) throw new Error('Izina ry\'ibicuruzwa rirakenewe');
    if (item.quantity < 0) throw new Error('Umubare ntiwabasha kuba mubi');
    if (item.unitPrice < 0) throw new Error('Igiciro ntiwabasha kuba mubi');
    // integer-safe currency: ensure whole RWF
    item.unitPrice = Math.round(item.unitPrice);
    item.totalValue = Math.round(item.quantity * item.unitPrice);

    const isUpdate = Boolean(item.id && !item.id.startsWith('inv-temp'));
    const endpoint = isUpdate ? `/api/inventory/${item.id}` : '/api/inventory';
    const method = isUpdate ? 'PUT' : 'POST';
    try {
      const res = await this.sendToBackend<{id: string}>(endpoint, method, item);
      if (res.success && res.data?.id) return res.data.id;
      // if backend fails but offline, queue
      throw new Error(res.error || 'Save failed');
    } catch (e) {
      // offline fallback: queue & cache locally
      await StorageService.addToQueue({endpoint, method, data: item}).catch(() => {});
      const cache = (await StorageService.getCache().catch(() => null)) || {};
      const inventory: InventoryItem[] = (cache as any).inventory || [];
      const idx = inventory.findIndex((x: InventoryItem) => x.id === item.id);
      if (idx >= 0) inventory[idx] = item;
      else inventory.push(item);
      await StorageService.setCache({...cache, inventory}).catch(() => {});
      // still return id so UI can proceed; sync will happen later
      return item.id;
    }
  }

  async deleteInventoryItem(itemId: string): Promise<void> {
    if (!itemId) throw new Error('itemId missing');
    try {
      const res = await this.sendToBackend(`/api/inventory/${itemId}`, 'DELETE');
      if (!res.success) throw new Error(res.error || 'Delete failed');
    } catch (e) {
      await StorageService.addToQueue({endpoint: `/api/inventory/${itemId}`, method: 'DELETE', data: {}}).catch(() => {});
      const cache = (await StorageService.getCache().catch(() => null)) || {};
      const inventory: InventoryItem[] = (cache as any).inventory || [];
      await StorageService.setCache({
        ...cache,
        inventory: inventory.filter((x: InventoryItem) => x.id !== itemId),
      }).catch(() => {});
      throw e;
    }
  }

  async getSales(businessId: string): Promise<SaleItem[]> {
    if (!businessId) return [];
    try {
      const res = await this.sendToBackend<{sales: SaleItem[]} & SaleItem[]>(
        `/api/sales?businessId=${encodeURIComponent(businessId)}`,
        'GET'
      );
      if (res.data) {
        const anyData = res.data as unknown as {sales?: SaleItem[]} & SaleItem[];
        if (Array.isArray(anyData)) return anyData as unknown as SaleItem[];
        if ((anyData as {sales?: SaleItem[]}).sales) return (anyData as {sales: SaleItem[]}).sales;
        return [];
      }
      const cached = await StorageService.getCache().catch(() => null);
      return (cached as any)?.sales?.filter((s: SaleItem) => s.businessId === businessId) || [];
    } catch {
      const cached = await StorageService.getCache().catch(() => null);
      return (cached as any)?.sales?.filter((s: SaleItem) => s.businessId === businessId) || [];
    }
  }

  async saveSale(sale: SaleItem): Promise<string> {
    if (sale.quantity <= 0) throw new Error('Umubare ugomba kuba hejuru ya 0');
    if (sale.totalValue <= 0) throw new Error('Agaciro kose ntihagomba kuba 0');
    sale.totalValue = Math.round(sale.quantity * sale.unitPrice);
    try {
      const res = await this.sendToBackend<{id: string}>('/api/sales', 'POST', sale);
      if (res.success && res.data?.id) return res.data.id;
      throw new Error(res.error || 'Sale save failed');
    } catch (e) {
      await StorageService.addToQueue({endpoint: '/api/sales', method: 'POST', data: sale}).catch(() => {});
      const cache = (await StorageService.getCache().catch(() => null)) || {};
      const sales: SaleItem[] = (cache as any).sales || [];
      sales.push(sale);
      await StorageService.setCache({...cache, sales}).catch(() => {});
      return sale.id;
    }
  }

  async getCustomers(businessId: string): Promise<Customer[]> {
    if (!businessId) return [];
    try {
      const res = await this.sendToBackend<{customers: Customer[]} & Customer[]>(
        `/api/customers?businessId=${encodeURIComponent(businessId)}`,
        'GET'
      );
      if (res.data) {
        const anyData = res.data as unknown as {customers?: Customer[]} & Customer[];
        if (Array.isArray(anyData)) return anyData as unknown as Customer[];
        if ((anyData as {customers?: Customer[]}).customers) return (anyData as {customers: Customer[]}).customers;
        return [];
      }
      const cached = await StorageService.getCache().catch(() => null);
      return (cached as any)?.customers?.filter((c: Customer) => c.businessId === businessId) || [];
    } catch {
      const cached = await StorageService.getCache().catch(() => null);
      return (cached as any)?.customers?.filter((c: Customer) => c.businessId === businessId) || [];
    }
  }

  async saveCustomer(customer: Customer): Promise<string> {
    if (!customer.name.trim()) throw new Error('Izina rirakenewe');
    if (!customer.phone.trim()) throw new Error('Telefoni irakenewe');
    try {
      const res = await this.sendToBackend<{id: string}>('/api/customers', 'POST', customer);
      if (res.success && res.data?.id) return res.data.id;
      throw new Error(res.error || 'Save failed');
    } catch (e) {
      await StorageService.addToQueue({endpoint: '/api/customers', method: 'POST', data: customer}).catch(() => {});
      const cache = (await StorageService.getCache().catch(() => null)) || {};
      const customers: Customer[] = (cache as any).customers || [];
      customers.push(customer);
      await StorageService.setCache({...cache, customers}).catch(() => {});
      return customer.id;
    }
  }

  async getStockMovements(businessId: string): Promise<StockMovement[]> {
    if (!businessId) return [];
    const res = await this.sendToBackend<{movements: StockMovement[]}>(`/api/stock-movements?businessId=${encodeURIComponent(businessId)}`, 'GET');
    const anyData = res.data as unknown as {movements?: StockMovement[]} & StockMovement[];
    if (!anyData) return [];
    if (Array.isArray(anyData)) return anyData as unknown as StockMovement[];
    return (anyData as {movements: StockMovement[]}).movements || [];
  }

  async uploadImage(imageUri: string, path: string): Promise<string> {
    // Image is uploaded via backend to Firebase Storage (never direct admin SDK in client)
    // We send base64 or multipart through /api/uploads. For bare RN, we use fetch with FormData.
    try {
      const headers = await this.authHeaders();
      // Remove content-type for FormData so RN sets boundary
      delete (headers as Record<string, string>)['Content-Type'];
      const formData = new FormData();
      // @ts-ignore RN FormData file
      formData.append('file', {uri: imageUri, name: path.split('/').pop() || 'photo.jpg', type: 'image/jpeg'} as unknown as Blob);
      formData.append('path', path);
      const res = await fetch(`${API_BASE}/api/uploads`, {
        method: 'POST',
        headers: {Authorization: headers['Authorization'] || ''} as unknown as Record<string, string>,
        body: formData as unknown as BodyInit,
      });
      const json = await res.json();
      if (json.url) return json.url as string;
      if (json.data?.url) return json.data.url as string;
      return imageUri;
    } catch {
      return imageUri;
    }
  }

  async sendToBackend<T>(endpoint: string, method: string, data?: unknown): Promise<{success: boolean; data?: T; error?: string}> {
    try {
      const headers = await this.authHeaders();
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
      });
      const result = (await response.json()) as {success: boolean; data?: T; error?: string; message?: string};
      if (!response.ok) {
        return {success: false, error: result.error || result.message || `HTTP ${response.status}`};
      }
      return result;
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Habaye ikibazo. Ongera ugerageze.';
      return {success: false, error: msg};
    }
  }

  async uploadCameraResult(result: unknown): Promise<void> {
    const headers = await this.authHeaders();
    await fetch(`${API_BASE}/api/camera-results`, {
      method: 'POST',
      headers,
      body: JSON.stringify(result),
    }).catch(() => {});
  }
}

export const firebaseService = FirebaseService.getInstance();
