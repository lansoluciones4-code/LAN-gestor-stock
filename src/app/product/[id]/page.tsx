import { fetchProductById } from '@/features/product/actions/product.actions';
import { notFound } from 'next/navigation';
import { slugify } from '@/lib/utils';
import { BackButton } from '../components/back-button';
import { ProductImageView } from '../components/product-image-view';
import { ProductInfo } from '../components/product-info';

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  const product = await fetchProductById(id);

  if (!product) {
    notFound();
  }

  const deviceName = product.device?.name || 'Accesorio Apple';
  const isOutOfStock = product.stock <= 0;

  return (
    <div className='lg:h-screen lg:overflow-hidden bg-white dark:bg-zinc-950 pt-8 md:pt-10 pb-4 md:pb-4 px-4 sm:px-6 flex flex-col'>
      <div className='max-w-7xl mx-auto w-full flex-1 flex flex-col min-h-0'>
        <div className='shrink-0'>
          <BackButton />
        </div>

        <div className='flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 xl:gap-24 overflow-hidden lg:overflow-visible'>
          <div className='flex items-center lg:justify-center justify-start'>
            <ProductImageView
              images={product.images || []}
              deviceName={deviceName}
              isOutOfStock={isOutOfStock}
            />
          </div>

          <div className='flex flex-col justify-center 2xl:overflow-y-auto custom-scrollbar pr-0 2xl:pr-6 pb-8 lg:pb-0'>
            <ProductInfo
              deviceName={deviceName}
              salePrice={product.salePrice}
              description={product.description}
              isOutOfStock={isOutOfStock}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
