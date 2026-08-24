'use client';

import { useEffect, useRef } from 'react';
import { incrementProductViewAction } from '@/features/product/actions/public-product.actions';

/** Suma una vista al producto al montarse — una sola vez por sesión de navegador (sessionStorage), sin trackear IP. */
export function TrackProductView({ productId }: { productId: string }) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;

    const key = `viewed:${productId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');
    } catch {
      // sessionStorage puede fallar (modo privado, etc.) — seguimos y contamos igual, solo se pierde el dedupe.
    }

    incrementProductViewAction(productId);
  }, [productId]);

  return null;
}
