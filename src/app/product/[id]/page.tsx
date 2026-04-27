import { fetchProductById } from '@/server/actions/product.actions';
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
  const imagePath = `/products/${slugify(deviceName)}.webp`;

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 pt-24 pb-16 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <BackButton />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24">
          <ProductImageView 
            imagePath={imagePath} 
            deviceName={deviceName} 
            isOutOfStock={isOutOfStock} 
          />
          
          <ProductInfo 
            deviceName={deviceName}
            salePrice={product.salePrice}
            description={product.description}
            isOutOfStock={isOutOfStock}
          />
        </div>
      </div>
    </div>
  );
}
