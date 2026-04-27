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
