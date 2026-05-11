import { useState } from 'react';
import { type ProductDef } from '@/features/product/domain/product.schema';
import { roundToDecimals } from '@/lib/utils';

export interface CartItem {
  productId: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  subtotal: number;
  name: string;
  desc: string;
  max: number;
}

export function useCart() {
  const [cart, setCart] = useState<CartItem[]>([]);

  const addToCart = (product: ProductDef) => {
    if (product.stock <= 0) return;
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
        return prev.map((i) => (i.productId === product.id ? { ...i, quantity: i.quantity + 1, subtotal: roundToDecimals((i.quantity + 1) * i.unitPrice) } : i));
      }
      return [
        ...prev,
        {
          productId: product.id,
          quantity: 1,
          unitPrice: product.salePrice,
          unitCost: product.purchasePrice,
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
          return { ...i, quantity: newQty, subtotal: roundToDecimals(newQty * i.unitPrice) };
        }
        return i;
      })
    );
  };

  const clearCart = () => setCart([]);

  const cartTotal = roundToDecimals(cart.reduce((acc, i) => acc + i.subtotal, 0));

  return {
    cart,
    addToCart,
    removeFromCart,
    updateCartQty,
    clearCart,
    cartTotal,
  };
}
