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
 * Converts a string to sentence case (First letter uppercase, rest lowercase).
 */
export function toSentenceCase(str: string | null | undefined): string {
  if (!str) return '';
  const lowercase = str.toLowerCase();
  return lowercase.charAt(0).toUpperCase() + lowercase.slice(1);
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
