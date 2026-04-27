/**
 * Normalizes a string by removing diacritics (accents) and converting to lowercase.
 * Useful for case-insensitive and accent-insensitive searches.
 */
export function normalizeString(str: string | null | undefined): string {
  if (!str) return '';
  return str
    .normalize('NFD') // Decomposes accented characters (e.g., 'á' -> 'a' + '´')
    .replace(/[\u0300-\u036f]/g, '') // Removes the accents
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
