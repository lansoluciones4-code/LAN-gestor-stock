'use client';

import { useState } from 'react';
import { type ProductDef } from '@/features/product/domain/product.schema';
import { type DeviceDef } from '@/features/device/domain/device.schema';

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
  const itemsPerPage = 16;

  const { search, setSearch, selectedCategory, setSelectedCategory, minPrice, setMinPrice, maxPrice, setMaxPrice, page, setPage, totalPages, paginatedProducts, clearFilters } = useCatalogFilters({ products, itemsPerPage });

  return (
    <div className='h-full max-w-[1600px] mx-auto px-4 sm:px-8 pb-4 sm:pb-8 flex flex-col min-h-0'>
      <div className='flex flex-col lg:flex-row gap-10 h-full min-h-0'>
        {/* Sidebar container - Fixed height matching parent */}
        <aside className='hidden lg:block w-72 shrink-0 h-full'>
          <CatalogSidebar
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
        </aside>

        <main className='flex-1 flex flex-col min-h-0 space-y-8 lg:overflow-y-auto pr-0 lg:pr-6 custom-scrollbar pb-8 lg:pb-0 relative'>
          {/* Sticky Controls */}
          <div className='sticky top-0 z-10 bg-[#F5F5F7] dark:bg-zinc-950 pt-2 pb-4 -mx-2 px-2'>
            <CatalogControls
              search={search}
              onSearchChange={setSearch}
              onOpenFilters={() => setIsSidebarOpen(true)}
              selectedCategory={selectedCategory}
              categories={categories}
              onClearCategory={() => setSelectedCategory(null)}
              minPrice={minPrice}
              onMinPriceChange={setMinPrice}
              maxPrice={maxPrice}
              onMaxPriceChange={setMaxPrice}
            />
          </div>

          <div className='flex-1'>
            <CatalogGrid
              products={paginatedProducts}
              onResetFilters={clearFilters}
            />
          </div>

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
