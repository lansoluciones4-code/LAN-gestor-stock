'use client';

import { useMemo, useState } from 'react';
import { type ProductDef } from '@/features/product/domain/product.schema';
import { type LandingCategory, type LandingSection } from '@/features/device/actions/public-device.actions';

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

const CATALOG_SECTIONS: { id: LandingSection; label: string }[] = [
  { id: 'tech', label: 'Tecnología' },
  { id: 'libreria', label: 'Librería' },
];

export function CatalogClient({ products, categories, showPrices }: CatalogClientProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const itemsPerPage = 16;

  const { section, setSection, search, setSearch, selectedCategory, setSelectedCategory, minPrice, setMinPrice, maxPrice, setMaxPrice, page, setPage, totalPages, paginatedProducts, clearFilters } = useCatalogFilters({ products, itemsPerPage });

  const sectionCategories = useMemo(() => categories.filter((c) => c.section === section), [categories, section]);

  return (
    <div className='h-full max-w-[1600px] mx-auto px-4 sm:px-8 pb-4 sm:pb-8 flex flex-col min-h-0'>
      <div className='shrink-0 flex mx-auto sm:mx-0 w-full sm:w-fit rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-1 mb-6'>
        {CATALOG_SECTIONS.map((s) => (
          <button
            key={s.id}
            type='button'
            onClick={() => setSection(s.id)}
            className={`flex-1 sm:flex-none px-6 py-2.5 text-sm font-bold rounded-lg transition-all outline-none focus:outline-none ${section === s.id ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow' : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'}`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className='flex flex-col lg:flex-row gap-10 h-full min-h-0'>
        {/* Sidebar container - Fixed height matching parent */}
        <aside className='hidden lg:block w-72 shrink-0 h-full'>
          <CatalogSidebar
            categories={sectionCategories}
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
              categories={sectionCategories}
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
              showPrices={showPrices}
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
        categories={sectionCategories}
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
