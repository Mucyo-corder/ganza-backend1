import {StorageService} from './StorageService';
import {firebaseService} from './FirebaseService';

export class OfflineService {
  private static instance: OfflineService;
  private isOnline = true;
  private listeners: Set<(online: boolean) => void> = new Set();
  private syncing = false;
  private interval: ReturnType<typeof setInterval> | null = null;

  static getInstance(): OfflineService {
    if (!OfflineService.instance) {
      OfflineService.instance = new OfflineService();
    }
    return OfflineService.instance;
  }

  async initialize(): Promise<void> {
    // Web: listen to navigator.onLine
    if (typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('online', () => this.setOnline(true));
      window.addEventListener('offline', () => this.setOnline(false));
      this.isOnline = navigator.onLine;
    }
    // RN: try NetInfo if installed
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const NetInfo = require('@react-native-community/netinfo');
      NetInfo.addEventListener((state: {isConnected: boolean | null}) => {
        this.setOnline(Boolean(state.isConnected));
      });
      const state = await NetInfo.fetch();
      this.setOnline(Boolean(state.isConnected));
    } catch {
      // NetInfo not installed – fallback to periodic fetch probe
    }
    // Periodic sync every 30s when online
    if (!this.interval) {
      this.interval = setInterval(() => {
        if (this.isOnline && !this.syncing) this.syncPendingOperations().catch(() => {});
      }, 30_000);
    }
    // Initial sync if online
    if (this.isOnline) this.syncPendingOperations().catch(() => {});
  }

  private setOnline(online: boolean) {
    const was = this.isOnline;
    this.isOnline = online;
    if (was !== online) {
      this.listeners.forEach(cb => cb(online));
      if (online) this.syncPendingOperations().catch(() => {});
    }
  }

  isConnected(): boolean {
    return this.isOnline;
  }

  subscribe(callback: (online: boolean) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  async queueOperation(operation: {endpoint: string; method: string; data: unknown}): Promise<void> {
    await StorageService.addToQueue(operation);
    if (this.isOnline) await this.syncPendingOperations().catch(() => {});
  }

  async syncPendingOperations(): Promise<void> {
    if (this.syncing) return;
    this.syncing = true;
    try {
      const queue = await StorageService.getPendingQueue();
      if (queue.length === 0) return;
      const remaining: typeof queue = [];
      for (const op of queue) {
        try {
          const res = await firebaseService.sendToBackend(op.endpoint, op.method, op.data);
          if (!res.success) {
            // Keep for retry unless 4xx client error (except 429)
            remaining.push(op);
          }
        } catch {
          remaining.push(op);
        }
      }
      if (remaining.length === 0) {
        await StorageService.clearQueue();
      } else if (remaining.length !== queue.length) {
        // Partial success – rewrite queue with remaining
        const {default: AsyncStorage} = await import('@react-native-async-storage/async-storage');
        await AsyncStorage.setItem('@ganza_pending_queue', JSON.stringify(remaining));
      }
    } finally {
      this.syncing = false;
    }
  }

  destroy(): void {
    if (this.interval) clearInterval(this.interval);
    this.interval = null;
  }
}

export const offlineService = OfflineService.getInstance();
