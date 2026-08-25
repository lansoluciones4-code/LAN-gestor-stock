'use client';

import { useMemo, useState } from 'react';
import { type ProductDef } from '@/features/product/domain/product.schema';
import { type LandingCategory } from '@/features/device/actions/public-device.actions';

import { useCatalogFilters } from './catalog/use-catalog-filters';
import { CatalogSidebar } from './catalog/catalog-sidebar';
import { CatalogControls } from './catalog/catalog-controls';
import { CatalogGrid } from './catalog/catalog-grid';
import { CatalogPagination } from './catalog/catalog-pagination';
import { MobileFilterDrawer } from './catalog/mobile-filter-drawer';

interface CatalogClientProps {
  products: ProductDef[];
  categories: LandingCategory[];
  showPrices: boolean;
}

export function CatalogClient({ products, categories, showPrices }: CatalogClientProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const itemsPerPage = 16;

  const { search, setSearch, selectedCategory, setSelectedCategory, minPrice, setMinPrice, maxPrice, setMaxPrice, sortBy, setSortBy, page, setPage, totalPages, paginatedProducts, clearFilters } = useCatalogFilters({ products, itemsPerPage });

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0 });
  };

  const handleCategoryChange = (categoryId: string | null) => {
    setSelectedCategory(categoryId);
    window.scrollTo({ top: 0 });
  };

  // Una categoría solo se muestra como filtro si tiene al menos un producto visible en el catálogo
  // (los productos ocultos desde el gestor ya vienen excluidos de `products`).
  const visibleCategories = useMemo(
    () => categories.filter((cat) => products.some((p) => p.device?.category === cat.name)),
    [categories, products]
  );

  return (
    <div className='max-w-[1600px] mx-auto px-4 sm:px-8 pb-4 sm:pb-8 flex flex-col'>
      <div className='flex flex-col lg:flex-row gap-10'>
        {/* Sidebar container - stretches to match main's height via flex align-items: stretch */}
        <aside className='hidden lg:block w-72 shrink-0'>
          <CatalogSidebar
            categories={visibleCategories}
            selectedCategory={selectedCategory}
            onSelectCategory={handleCategoryChange}
          />
        </aside>

        <main className='flex-1 flex flex-col space-y-8 pr-0 lg:pr-6 pb-8 lg:pb-0 relative'>
          {/* Sticky Controls */}
          <div className='sticky top-0 z-10 bg-[#F5F5F7] dark:bg-zinc-950 pt-2 pb-4 -mx-2 px-2'>
            <CatalogControls
              search={search}
              onSearchChange={setSearch}
              onOpenFilters={() => setIsSidebarOpen(true)}
              selectedCategory={selectedCategory}
              categories={visibleCategories}
              onClearCategory={() => handleCategoryChange(null)}
              minPrice={minPrice}
              onMinPriceChange={setMinPrice}
              maxPrice={maxPrice}
              onMaxPriceChange={setMaxPrice}
              sortBy={sortBy}
              onSortChange={setSortBy}
            />
            <CatalogPagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>

          <div className='flex-1'>
            <CatalogGrid
              products={paginatedProducts}
              onResetFilters={clearFilters}
              showPrices={showPrices}
            />
          </div>

          <CatalogPagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </main>
      </div>

      <MobileFilterDrawer
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        categories={visibleCategories}
        selectedCategory={selectedCategory}
        onSelectCategory={handleCategoryChange}
        minPrice={minPrice}
        onMinPriceChange={setMinPrice}
        maxPrice={maxPrice}
        onMaxPriceChange={setMaxPrice}
      />
    </div>
  );
}
