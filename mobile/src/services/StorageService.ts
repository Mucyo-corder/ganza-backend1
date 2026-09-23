import AsyncStorage from '@react-native-async-storage/async-storage';
import {BoardDetectionResult} from '../types';

const CACHE_KEY = '@ganza_cache';
const QUEUE_KEY = '@ganza_pending_queue';

/**
 * Offline-first storage
 * - Caches inventory/sales/customers locally
 * - Queues mutations when offline, with idempotency keys & conflict-safe timestamps
 */

export class StorageService {
  // Generic KV for tokens etc
  static async getItem(key: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(key);
    } catch {
      return null;
    }
  }
  static async setItem(key: string, value: string): Promise<void> {
    try {
      await AsyncStorage.setItem(key, value);
    } catch {}
  }
  static async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch {}
  }

  static async getCache(): Promise<{
    inventory?: unknown[];
    sales?: unknown[];
    customers?: unknown[];
    detections?: BoardDetectionResult[];
    [k: string]: unknown;
  } | null> {
    try {
      const data = await AsyncStorage.getItem(CACHE_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  static async setCache(data: unknown): Promise<void> {
    try {
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to cache data:', e);
    }
  }

  static async getPendingQueue(): Promise<Array<{endpoint: string; method: string; data: unknown; timestamp: number; idempotencyKey?: string}>> {
    try {
      const data = await AsyncStorage.getItem(QUEUE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static async addToQueue(operation: {endpoint: string; method: string; data: unknown}): Promise<void> {
    try {
      const queue = await this.getPendingQueue();
      // Duplicate prevention: dedupe by endpoint+id if same inventory/sale id within 60s
      const id = (operation.data as {id?: string})?.id;
      const now = Date.now();
      const isDuplicate = id
        ? queue.some(
            q =>
              q.endpoint === operation.endpoint &&
              (q.data as {id?: string})?.id === id &&
              now - q.timestamp < 60_000
          )
        : false;
      if (isDuplicate) return;
      queue.push({
        ...operation,
        timestamp: now,
        idempotencyKey: id ? `${operation.endpoint}:${id}:${now}` : `${operation.endpoint}:${now}`,
      });
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    } catch (e) {
      console.error('Failed to add to queue:', e);
    }
  }

  static async clearQueue(): Promise<void> {
    try {
      await AsyncStorage.removeItem(QUEUE_KEY);
    } catch (e) {
      console.error('Failed to clear queue:', e);
    }
  }

  static async removeFromQueue(predicate: (op: {endpoint: string; method: string; data: unknown; timestamp: number}) => boolean): Promise<void> {
    try {
      const queue = await this.getPendingQueue();
      const filtered = queue.filter(op => !predicate(op));
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(filtered));
    } catch {}
  }

  static async saveDetectionResult(result: BoardDetectionResult): Promise<void> {
    try {
      const cache = (await this.getCache()) || {};
      const detections = (cache.detections as BoardDetectionResult[]) || [];
      detections.push(result);
      // keep last 50
      const trimmed = detections.slice(-50);
      await this.setCache({...cache, detections: trimmed});
    } catch (e) {
      console.error('Failed to save detection result:', e);
    }
  }
}

export const storageService = StorageService;
