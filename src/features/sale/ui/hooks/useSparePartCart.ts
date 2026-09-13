import { useState } from 'react';
import { roundToDecimals } from '@/lib/utils';

/** Repuesto/art. usado pendiente de venta, tal como lo devuelve fetchPendingSparePartsForSale(). */
export interface PendingSparePart {
  id: string;
  title: string;
  condition: 'usado' | 'nuevo';
  cost: string | number;
  profitPercentage: string | number;
  customerName: string | null;
}

export interface SparePartCartItem {
  sparePartId: string;
  title: string;
  condition: 'usado' | 'nuevo';
  customerName: string | null;
  /** Precio que ve el vendedor en el carrito (costo + ganancia) — el servidor lo vuelve a calcular al confirmar, nunca confía en este valor. */
  subtotal: number;
}

/**
 * Carrito de repuestos/usados: cada uno es una unidad física única (sin cantidad) —
 * agregarlo dos veces no hace nada, ya está.
 */
export function useSparePartCart() {
  const [items, setItems] = useState<SparePartCartItem[]>([]);

  const addItem = (sparePart: PendingSparePart) => {
    setItems((prev) => {
      if (prev.some((i) => i.sparePartId === sparePart.id)) return prev;
      const cost = Number(sparePart.cost);
      const profitAmount = roundToDecimals(cost * (Number(sparePart.profitPercentage) / 100));
      return [
        ...prev,
        {
          sparePartId: sparePart.id,
          title: sparePart.title,
          condition: sparePart.condition,
          customerName: sparePart.customerName,
          subtotal: roundToDecimals(cost + profitAmount),
        },
      ];
    });
  };

  const removeItem = (sparePartId: string) => {
    setItems((prev) => prev.filter((i) => i.sparePartId !== sparePartId));
  };

  const clearItems = () => setItems([]);

  const sparePartTotal = roundToDecimals(items.reduce((acc, i) => acc + i.subtotal, 0));

  return {
    items,
    addItem,
    removeItem,
    clearItems,
    sparePartTotal,
  };
}
