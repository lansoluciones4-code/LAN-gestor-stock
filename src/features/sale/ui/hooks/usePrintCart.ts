import { useState } from 'react';
import { roundToDecimals } from '@/lib/utils';
import { type PrintKind } from '@/lib/print-kinds';

export interface PrintCartItem {
  id: string;
  /** null cuando el color no aplica (Venta Rápida nunca lo pregunta, ni los kinds nuevos) — solo es un valor real en Impresiones de Nueva Venta. */
  colorMode: 'color' | 'blanco_y_negro' | null;
  kind: PrintKind;
  /** Solo usado con kind: 'tramite' — nombre del trámite cargado a mano. */
  title?: string;
  /** Importe total cargado originalmente, sin descuento. */
  listAmount: number;
  /** Descuento aplicado a esta impresión en particular (0-100). */
  discountPercentage: number;
  subtotal: number;
}

export interface PrintCartItemExtra {
  title?: string;
}

const computeItem = (listAmount: number, discountPercentage: number) => ({
  subtotal: roundToDecimals(listAmount * (1 - discountPercentage / 100)),
});

// crypto.randomUUID() requiere contexto seguro (HTTPS o localhost) y falla al
// entrar por la IP de la LAN en HTTP plano — este id es solo de estado local.
const generateId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export function usePrintCart() {
  const [items, setItems] = useState<PrintCartItem[]>([]);

  const addItem = (colorMode: 'color' | 'blanco_y_negro' | null, amount: number, kind: PrintKind = 'impresion', extra?: PrintCartItemExtra) => {
    if (amount <= 0) return;
    setItems((prev) => [
      ...prev,
      {
        id: generateId(),
        colorMode,
        kind,
        title: extra?.title,
        listAmount: amount,
        discountPercentage: 0,
        ...computeItem(amount, 0),
      },
    ]);
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const setItemDiscount = (id: string, discountPercentage: number) => {
    const clamped = Math.min(100, Math.max(0, discountPercentage));
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, discountPercentage: clamped, ...computeItem(i.listAmount, clamped) } : i)));
  };

  const clearItems = () => setItems([]);

  const printTotal = roundToDecimals(items.reduce((acc, i) => acc + i.subtotal, 0));

  return {
    items,
    addItem,
    removeItem,
    setItemDiscount,
    clearItems,
    printTotal,
  };
}
