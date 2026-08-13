import { useState } from 'react';
import { type TechnicalServiceDef } from '@/features/technical-service/domain/technical-service.schema';
import { roundToDecimals } from '@/lib/utils';

export interface ServiceCartItem {
  technicalServiceId: string;
  name: string;
  quantity: number;
  /** Valor de catálogo del servicio al momento de agregarlo, sin descuento. */
  listValue: number;
  unitValue: number;
  /** Descuento aplicado a este servicio en particular (0-100). */
  discountPercentage: number;
  subtotal: number;
}

const computeItem = (quantity: number, listValue: number, discountPercentage: number) => {
  const unitValue = roundToDecimals(listValue * (1 - discountPercentage / 100));
  return { unitValue, subtotal: roundToDecimals(unitValue * quantity) };
};

export function useServiceCart() {
  const [items, setItems] = useState<ServiceCartItem[]>([]);

  const addItem = (service: TechnicalServiceDef) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.technicalServiceId === service.id);
      if (existing) {
        const newQty = existing.quantity + 1;
        return prev.map((i) => (i.technicalServiceId === service.id ? { ...i, quantity: newQty, ...computeItem(newQty, i.listValue, i.discountPercentage) } : i));
      }
      return [
        ...prev,
        {
          technicalServiceId: service.id,
          name: service.name,
          quantity: 1,
          listValue: service.value,
          discountPercentage: 0,
          unitValue: service.value,
          subtotal: service.value,
        },
      ];
    });
  };

  const removeItem = (technicalServiceId: string) => {
    setItems((prev) => prev.filter((i) => i.technicalServiceId !== technicalServiceId));
  };

  const updateQty = (technicalServiceId: string, delta: number) => {
    setItems((prev) =>
      prev.map((i) => {
        if (i.technicalServiceId === technicalServiceId) {
          const newQty = i.quantity + delta;
          if (newQty < 1) return i;
          return { ...i, quantity: newQty, ...computeItem(newQty, i.listValue, i.discountPercentage) };
        }
        return i;
      })
    );
  };

  const setItemDiscount = (technicalServiceId: string, discountPercentage: number) => {
    const clamped = Math.min(100, Math.max(0, discountPercentage));
    setItems((prev) => prev.map((i) => (i.technicalServiceId === technicalServiceId ? { ...i, discountPercentage: clamped, ...computeItem(i.quantity, i.listValue, clamped) } : i)));
  };

  const clearItems = () => setItems([]);

  const serviceTotal = roundToDecimals(items.reduce((acc, i) => acc + i.subtotal, 0));

  return {
    items,
    addItem,
    removeItem,
    updateQty,
    setItemDiscount,
    clearItems,
    serviceTotal,
  };
}
