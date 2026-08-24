'use client';

import { useState, useMemo, useEffect, useDeferredValue } from 'react';
import { type ProductDef } from '@/features/product/domain/product.schema';
import { normalizeForSearch } from '@/lib/utils';

interface UseCatalogFiltersProps {
  products: ProductDef[];
  itemsPerPage: number;
}

export type CatalogSortBy = 'default' | 'price_asc' | 'price_desc' | 'most_viewed';

export function useCatalogFilters({ products, itemsPerPage }: UseCatalogFiltersProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [sortBy, setSortBy] = useState<CatalogSortBy>('default');
  const [page, setPage] = useState(1);

  // Use deferred value for search to keep the input snappy
  const deferredSearch = useDeferredValue(search);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [deferredSearch, selectedCategory, minPrice, maxPrice, sortBy]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // 1. Search filter (Fuzzy)
      const searchTerms = normalizeForSearch(deferredSearch).split(/\s+/).filter(Boolean);

      const combinedText = normalizeForSearch(`${p.device?.name || ''} ${p.device?.brand || ''} ${p.description || ''}`);
      const matchesSearch = searchTerms.every((term) => combinedText.includes(term));

      // 2. Category filter
      const matchesCategory = selectedCategory ? p.device?.category === selectedCategory : true;

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
    return [...filteredProducts].sort((a, b) => {
      if (a.stock > 0 && b.stock <= 0) return -1;
      if (a.stock <= 0 && b.stock > 0) return 1;
      return 0;
    });
  }, [filteredProducts, sortBy]);

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
