import { useState } from 'react';
import { roundToDecimals } from '@/lib/utils';

export interface PrintCartItem {
  id: string;
  pages: number;
  colorMode: 'color' | 'blanco_y_negro';
  unitPrice: number;
  subtotal: number;
}

export function usePrintCart() {
  const [items, setItems] = useState<PrintCartItem[]>([]);

  const addItem = (pages: number, colorMode: 'color' | 'blanco_y_negro', unitPrice: number) => {
    if (pages <= 0 || unitPrice < 0) return;
    setItems((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        pages,
        colorMode,
        unitPrice,
        subtotal: roundToDecimals(pages * unitPrice),
      },
    ]);
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const clearItems = () => setItems([]);

  const printTotal = roundToDecimals(items.reduce((acc, i) => acc + i.subtotal, 0));

  return {
    items,
    addItem,
    removeItem,
    clearItems,
    printTotal,
  };
}
