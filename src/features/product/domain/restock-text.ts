import type { ProductDef } from '@/features/product/domain/product.schema';
import { formatDeviceLabel } from '@/lib/utils';

export type RestockSection = 'tech' | 'libreria';

/** Mismo modelo + misma descripción = mismo producto a reponer, aunque esté repartido en varias filas (lotes). */
function restockKey(p: Pick<ProductDef, 'deviceId' | 'description'>) {
  return `${p.deviceId}|${(p.description ?? '').trim().toLowerCase()}`;
}

/**
 * Arma el texto "SIN STOCK:" que se copia para mandarle al proveedor — una sola lista, sin separar por rubro.
 * - `visible`: las filas en 0 que muestra la grilla (ya filtradas por búsqueda, precio, fechas y rubro).
 * - `all`: todos los productos — un modelo con stock en otra fila no se pide, aunque una fila vieja esté en 0.
 * - `sections`: los rubros elegidos (TECH/LIBRERÍA); solo filtran, no aparecen en el texto.
 * Cada producto aparece una sola vez, en orden alfabético.
 */
export function buildRestockText(visible: ProductDef[], all: ProductDef[], sections: RestockSection[]): { text: string; count: number } {
  const keysWithStock = new Set(all.filter((p) => p.stock > 0).map(restockKey));

  const lines = new Map<string, string>();
  for (const p of visible) {
    if (p.stock > 0 || !sections.includes(p.device?.section as RestockSection)) continue;
    const key = restockKey(p);
    if (keysWithStock.has(key) || lines.has(key)) continue;
    const description = (p.description ?? '').trim();
    lines.set(key, `- ${formatDeviceLabel(p.device)}${description ? ` (${description})` : ''}`);
  }
  if (lines.size === 0) return { text: '', count: 0 };

  const sorted = [...lines.values()].sort((a, b) => a.localeCompare(b, 'es'));
  return { text: ['SIN STOCK:', ...sorted].join('\n'), count: sorted.length };
}
