'use client';

import { useState } from 'react';
import { type ProductDef } from '@/schemas/product.schema';
import { type DeviceDef } from '@/schemas/device.schema';

import { useCatalogFilters } from './catalog/use-catalog-filters';
import { CatalogSidebar } from './catalog/catalog-sidebar';
import { CatalogControls } from './catalog/catalog-controls';
import { CatalogGrid } from './catalog/catalog-grid';
import { CatalogPagination } from './catalog/catalog-pagination';
import { MobileFilterDrawer } from './catalog/mobile-filter-drawer';

interface CatalogClientProps {
  products: ProductDef[];
  categories: DeviceDef[];
}

export function CatalogClient({ products, categories }: CatalogClientProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const itemsPerPage = 8;

  const {
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
    clearFilters,
  } = useCatalogFilters({ products, itemsPerPage });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-24">
      <div className="flex flex-col lg:flex-row gap-8">
        <CatalogSidebar
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          minPrice={minPrice}
          onMinPriceChange={setMinPrice}
          maxPrice={maxPrice}
          onMaxPriceChange={setMaxPrice}
        />

        <main className="flex-1 space-y-8">
          <CatalogControls
            search={search}
            onSearchChange={setSearch}
            onOpenFilters={() => setIsSidebarOpen(true)}
            selectedCategory={selectedCategory}
            categories={categories}
            onClearCategory={() => setSelectedCategory(null)}
          />

          <CatalogGrid 
            products={paginatedProducts} 
            onResetFilters={clearFilters} 
          />

          <CatalogPagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </main>
      </div>

      <MobileFilterDrawer
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        minPrice={minPrice}
        onMinPriceChange={setMinPrice}
        maxPrice={maxPrice}
        onMaxPriceChange={setMaxPrice}
      />
    </div>
  );
}
