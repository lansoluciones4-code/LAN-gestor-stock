/**
 * Prepares a string for search by removing diacritics (accents) and converting to lowercase.
 */
export function normalizeForSearch(str: string | null | undefined): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

/**
 * Converts a string into a URL-friendly slug (lowercase, no accents, hyphens for spaces).
 */
export function slugify(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

/**
 * Validates that a number (or string representation of a number) has at most the specified number of decimals.
 */
export function isValidDecimal(value: number | string, maxDecimals: number = 2): boolean {
  const numStr = value.toString();
  if (!numStr.includes('.')) return true;
  const decimals = numStr.split('.')[1];
  return decimals.length <= maxDecimals;
}

/**
 * Rounds a number to a specified number of decimal places.
 */
export function roundToDecimals(num: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round((num + Number.EPSILON) * factor) / factor;
}

/**
 * Converts a 'YYYY-MM-DD' calendar-day string (as picked by the user in Argentina) into the
 * actual start/end instants of that day. Uses a hardcoded '-03:00' offset instead of the server's
 * local timezone — the server (Docker container) runs in UTC, so `new Date(str + 'T00:00:00')`
 * (no offset) would silently compute midnight UTC instead of midnight ART, shifting every date
 * filter by 3 hours. Argentina has not observed daylight saving time since 2009, so a fixed
 * -03:00 offset is safe year-round.
 */
export function argDateRangeBounds(startDate?: string, endDate?: string): { start: Date; end: Date } {
  const start = startDate ? new Date(`${startDate}T00:00:00-03:00`) : new Date(0);
  const end = endDate ? new Date(`${endDate}T23:59:59-03:00`) : new Date();
  return { start, end };
}

/** Keys that browsers inject into number inputs but are invalid for price fields. */
export const PRICE_BLOCKED_KEYS = ['-', '.', ',', 'e', 'E', '+'];

/**
 * Keyboard handler for price / integer inputs.
 * Allows digits, a single comma as decimal separator, and control keys.
 * Prevents any other character from being typed.
 */
export function blockInvalidPriceKey(e: React.KeyboardEvent<HTMLInputElement>): void {
  const { key, currentTarget, ctrlKey, metaKey } = e;
  const CONTROL_KEYS = ['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete', 'Enter'];

  // Only one comma allowed
  if (key === ',' && currentTarget.value.includes(',')) {
    e.preventDefault();
    return;
  }

  if (!/^[0-9]$/.test(key) && key !== ',' && !CONTROL_KEYS.includes(key) && !ctrlKey && !metaKey) {
    e.preventDefault();
  }
}
