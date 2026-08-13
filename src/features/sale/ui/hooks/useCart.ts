import { useState } from 'react';
import { type ProductDef } from '@/features/product/domain/product.schema';
import { roundToDecimals } from '@/lib/utils';

export interface CartItem {
  productId: string;
  quantity: number;
  /** Precio de lista del producto, sin descuentos. */
  listPrice: number;
  unitPrice: number;
  unitCost: number;
  /** Descuento aplicado a este producto en particular (0-100). */
  discountPercentage: number;
  subtotal: number;
  name: string;
  desc: string;
  max: number;
}

const computeItem = (quantity: number, listPrice: number, discountPercentage: number) => {
  const unitPrice = roundToDecimals(listPrice * (1 - discountPercentage / 100));
  return { unitPrice, subtotal: roundToDecimals(unitPrice * quantity) };
};

export function useCart() {
  const [cart, setCart] = useState<CartItem[]>([]);

  const addToCart = (product: ProductDef) => {
    if (product.stock <= 0) return;
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
        const newQty = existing.quantity + 1;
        return prev.map((i) => (i.productId === product.id ? { ...i, quantity: newQty, ...computeItem(newQty, i.listPrice, i.discountPercentage) } : i));
      }
      return [
        ...prev,
        {
          productId: product.id,
          quantity: 1,
          listPrice: product.salePrice,
          unitPrice: product.salePrice,
          unitCost: product.purchasePrice,
          discountPercentage: 0,
          subtotal: product.salePrice,
          name: `${product.device?.name || 'Equipo'}`,
          desc: product.description || '',
          max: product.stock,
        },
      ];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((i) => i.productId !== productId));
  };

  const updateCartQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev.map((i) => {
        if (i.productId === productId) {
          const newQty = i.quantity + delta;
          if (newQty > i.max || newQty < 1) return i;
          return { ...i, quantity: newQty, ...computeItem(newQty, i.listPrice, i.discountPercentage) };
        }
        return i;
      })
    );
  };

  const setItemDiscount = (productId: string, discountPercentage: number) => {
    const clamped = Math.min(100, Math.max(0, discountPercentage));
    setCart((prev) => prev.map((i) => (i.productId === productId ? { ...i, discountPercentage: clamped, ...computeItem(i.quantity, i.listPrice, clamped) } : i)));
  };

  const clearCart = () => setCart([]);

  const cartTotal = roundToDecimals(cart.reduce((acc, i) => acc + i.subtotal, 0));

  return {
    cart,
    addToCart,
    removeFromCart,
    updateCartQty,
    setItemDiscount,
    clearCart,
    cartTotal,
  };
}
