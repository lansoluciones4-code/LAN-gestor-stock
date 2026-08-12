'use client';

import { useState, useMemo, useEffect, useDeferredValue } from 'react';
import { type ProductDef } from '@/features/product/domain/product.schema';
import { type LandingSection } from '@/features/device/actions/public-device.actions';
import { normalizeForSearch } from '@/lib/utils';

interface UseCatalogFiltersProps {
  products: ProductDef[];
  itemsPerPage: number;
}

export function useCatalogFilters({ products, itemsPerPage }: UseCatalogFiltersProps) {
  const [section, setSectionState] = useState<LandingSection>('tech');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [page, setPage] = useState(1);

  // Use deferred value for search to keep the input snappy
  const deferredSearch = useDeferredValue(search);

  // Changing section resets the category filter — categories belong to a single section.
  const setSection = (s: LandingSection) => {
    setSectionState(s);
    setSelectedCategory(null);
  };

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [deferredSearch, selectedCategory, minPrice, maxPrice, section]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // 1. Section filter (Tecnología / Librería)
      const matchesSection = p.device?.section === section;

      // 2. Search filter (Fuzzy)
      const searchTerms = normalizeForSearch(deferredSearch).split(/\s+/).filter(Boolean);

      const combinedText = normalizeForSearch(`${p.device?.name || ''} ${p.device?.brand || ''} ${p.description || ''}`);
      const matchesSearch = searchTerms.every((term) => combinedText.includes(term));

      // 3. Category filter
      const matchesCategory = selectedCategory ? p.device?.category === selectedCategory : true;

      // 4. Price range filter
      const price = p.salePrice;
      const min = minPrice ? parseFloat(minPrice) : 0;
      const max = maxPrice ? parseFloat(maxPrice) : Infinity;
      const matchesPrice = price >= min && price <= max;

      return matchesSection && matchesSearch && matchesCategory && matchesPrice;
    });
  }, [products, section, deferredSearch, selectedCategory, minPrice, maxPrice]);

  const sortedProducts = useMemo(() => {
    return [...filteredProducts].sort((a, b) => {
      if (a.stock > 0 && b.stock <= 0) return -1;
      if (a.stock <= 0 && b.stock > 0) return 1;
      return 0;
    });
  }, [filteredProducts]);

  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);
  const paginatedProducts = sortedProducts.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const clearFilters = () => {
    setSearch('');
    setSelectedCategory(null);
    setMinPrice('');
    setMaxPrice('');
  };

  return {
    section,
    setSection,
    search,
    setSearch,
    selectedCategory,
    setSelectedCategory,
    minPrice,
    setMinPrice,
    maxPrice,
    setMaxPrice,
    page,
    setPage,
    totalPages,
    paginatedProducts,
    totalResults: sortedProducts.length,
    clearFilters,
    isFiltered: !!(search || selectedCategory || minPrice || maxPrice),
  };
}
