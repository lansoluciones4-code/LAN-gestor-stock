'use client';

import { useState, useMemo, useEffect, useRef, useDeferredValue } from 'react';
import { type ProductDef } from '@/features/product/domain/product.schema';
import { normalizeForSearch } from '@/lib/utils';

interface UseCatalogFiltersProps {
  products: ProductDef[];
  itemsPerPage: number;
}

export type CatalogSortBy = 'default' | 'price_asc' | 'price_desc' | 'most_viewed';

/** Recuerda en qué categoría/página estaba el usuario dentro de la misma pestaña, para que
 * volver desde la ficha de producto (o con el botón atrás del navegador) no lo mande siempre
 * a HOME página 1. Solo categoría+página, no el resto de los filtros — es lo que se pidió. */
const CATALOG_FILTERS_STORAGE_KEY = 'catalog-filters-v1';

export function useCatalogFilters({ products, itemsPerPage }: UseCatalogFiltersProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [sortBy, setSortBy] = useState<CatalogSortBy>('default');
  const [page, setPage] = useState(1);

  // Use deferred value for search to keep the input snappy
  const deferredSearch = useDeferredValue(search);

  // Restaura categoría/página guardadas de una visita anterior en esta pestaña (una sola vez al
  // montar). El efecto de abajo resetea la página cada vez que cambia la categoría — y cambiarla
  // acá para restaurar dispara ese mismo efecto una vez de más, pisando la página restaurada. En
  // vez de usar un timer (nada garantiza que corra antes de que React vuelva a renderizar), contamos
  // exactamente cuántos disparos hay que ignorar: el del montaje en sí, más uno extra únicamente si
  // la categoría restaurada difiere de la inicial (que es la única de las dos que ese efecto observa).
  const resetPageSkipsRef = useRef(1);
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(CATALOG_FILTERS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as { category?: string | null; page?: number };
        if (parsed.category !== undefined && parsed.category !== null) {
          resetPageSkipsRef.current = 2;
          setSelectedCategory(parsed.category);
        }
        if (parsed.page) setPage(parsed.page);
      }
    } catch {
      // sessionStorage no disponible (navegación privada, etc.) — seguimos con los valores por defecto.
    }
  }, []);

  // Reset page when filters change (salvo los disparos causados por el restore de arriba)
  useEffect(() => {
    if (resetPageSkipsRef.current > 0) {
      resetPageSkipsRef.current -= 1;
      return;
    }
    setPage(1);
  }, [deferredSearch, selectedCategory, minPrice, maxPrice, sortBy]);

  // Guarda categoría/página actuales para la próxima vez que se entre a esta pantalla.
  useEffect(() => {
    try {
      sessionStorage.setItem(CATALOG_FILTERS_STORAGE_KEY, JSON.stringify({ category: selectedCategory, page }));
    } catch {
      // no-op
    }
  }, [selectedCategory, page]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // 1. Search filter (Fuzzy)
      const searchTerms = normalizeForSearch(deferredSearch).split(/\s+/).filter(Boolean);

      const combinedText = normalizeForSearch(`${p.device?.name || ''} ${p.device?.brand || ''} ${p.description || ''}`);
      const matchesSearch = searchTerms.every((term) => combinedText.includes(term));

      // 2. Category filter — sin categoría seleccionada estamos en "HOME": solo destacados.
      const matchesCategory = selectedCategory ? p.device?.category === selectedCategory : !!p.featuredAt;

      // 3. Price range filter
      const price = p.salePrice;
      const min = minPrice ? parseFloat(minPrice) : 0;
      const max = maxPrice ? parseFloat(maxPrice) : Infinity;
      const matchesPrice = price >= min && price <= max;

      return matchesSearch && matchesCategory && matchesPrice;
    });
  }, [products, deferredSearch, selectedCategory, minPrice, maxPrice]);

  const sortedProducts = useMemo(() => {
    if (sortBy === 'price_asc') return [...filteredProducts].sort((a, b) => a.salePrice - b.salePrice);
    if (sortBy === 'price_desc') return [...filteredProducts].sort((a, b) => b.salePrice - a.salePrice);
    if (sortBy === 'most_viewed') return [...filteredProducts].sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0));
    // Orden "Relevancia" en HOME: respeta el curado del admin — el último producto marcado
    // como destacado aparece primero. En una categoría normal, en stock primero.
    if (selectedCategory === null) {
      return [...filteredProducts].sort((a, b) => new Date(b.featuredAt ?? 0).getTime() - new Date(a.featuredAt ?? 0).getTime());
    }
    return [...filteredProducts].sort((a, b) => {
      if (a.stock > 0 && b.stock <= 0) return -1;
      if (a.stock <= 0 && b.stock > 0) return 1;
      return 0;
    });
  }, [filteredProducts, sortBy, selectedCategory]);

  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);
  const paginatedProducts = sortedProducts.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const clearFilters = () => {
    setSearch('');
    setSelectedCategory(null);
    setMinPrice('');
    setMaxPrice('');
    setSortBy('default');
  };

  return {
    search,
    setSearch,
    selectedCategory,
    setSelectedCategory,
    minPrice,
    setMinPrice,
    maxPrice,
    setMaxPrice,
    sortBy,
    setSortBy,
    page,
    setPage,
    totalPages,
    paginatedProducts,
    totalResults: sortedProducts.length,
    clearFilters,
    isFiltered: !!(search || selectedCategory || minPrice || maxPrice),
  };
}
