/**
 * Currency & formatting – integer-safe RWF
 */
export function formatRWF(value: number): string {
  const rounded = Math.round(value);
  const formatted = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${formatted} RWF`;
}

export function parseRWF(value: string): number {
  return parseInt(value.replace(/[^\d]/g, ''), 10) || 0;
}

export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('rw-RW', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleString('rw-RW', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function calculateTotal(quantity: number, unitPrice: number): number {
  // integer-safe: quantities and prices are whole RWF
  return Math.round(quantity) * Math.round(unitPrice);
}

export function generateId(prefix = ''): string {
  return `${prefix}${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Compress/resize image before upload – keeps uploads < 1MB,
 * preserves aspect ratio. In bare RN, this can delegate to
 * `react-native-image-resizer` when installed; otherwise it returns original URI.
 */
export async function compressImageUri(uri: string, maxWidth = 1280, quality = 0.8): Promise<string> {
  try {
    // Try native resizer if available
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ImageResizer = require('react-native-image-resizer');
    const result = await ImageResizer.createResizedImage(uri, maxWidth, maxWidth, 'JPEG', Math.round(quality * 100), 0, undefined, false, {mode: 'contain'});
    return result.uri as string;
  } catch {
    return uri;
  }
}

export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.substring(0, maxLen) + '...';
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidPhone(phone: string): boolean {
  return /^\+?[\d\s\-()]{7,20}$/.test(phone);
}

export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}
