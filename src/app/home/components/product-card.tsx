'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { type ProductDef } from '@/features/product/domain/product.schema';
import { Package, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { ContactButtons } from '@/components/contact/contact-buttons';

interface ProductCardProps {
  product: ProductDef & { images?: { publicId: string; url: string }[] };
}

export function ProductCard({ product }: ProductCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const deviceName = product.device?.name || 'Accesorio Apple';
  const isOutOfStock = product.stock <= 0;
  
  const images = product.images || [];
  const hasImages = images.length > 0;

  const nextImage = (e?: React.MouseEvent | TouchEvent | MouseEvent | PointerEvent) => {
    if (e?.preventDefault) e.preventDefault(); // Prevent navigating to product detail
    if (images.length > 1) {
      setDirection(1);
      setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    }
  };

  const prevImage = (e?: React.MouseEvent | TouchEvent | MouseEvent | PointerEvent) => {
    if (e?.preventDefault) e.preventDefault(); // Prevent navigating to product detail
    if (images.length > 1) {
      setDirection(-1);
      setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    }
  };

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? '100%' : '-100%',
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (dir: number) => ({
      x: dir < 0 ? '100%' : '-100%',
      opacity: 0
    })
  };

  const handleDragEnd = (e: any, { offset, velocity }: any) => {
    const swipe = swipePower(offset.x, velocity.x);
    if (swipe < -swipeConfidenceThreshold) {
      nextImage();
    } else if (swipe > swipeConfidenceThreshold) {
      prevImage();
    }
  };

  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className={`h-full group relative flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500 ${isOutOfStock ? 'opacity-70 grayscale-[0.3]' : ''}`}
    >
      <Link
        href={`/product/${product.id}`}
        className='flex flex-col flex-1'
      >
        <div className='relative aspect-square w-full bg-white dark:bg-black flex items-center justify-center overflow-hidden'>
          {!hasImages ? (
            <div className='flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-600 transition-opacity duration-300'>
              <Package className='w-8 h-8 sm:w-12 sm:h-12 stroke-[1.5] mb-2 sm:mb-3' />
              <span className='text-[9px] sm:text-[10px] font-medium tracking-widest uppercase'>Pronto</span>
            </div>
          ) : (
              <div className='relative w-full h-full overflow-hidden'>
                <AnimatePresence initial={false} custom={direction} mode="popLayout">
                  <motion.img
                    key={currentImageIndex}
                    src={images[currentImageIndex].url}
                    alt={`${deviceName} - ${currentImageIndex + 1}`}
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ type: "tween", duration: 0.3, ease: "easeInOut" }}
                    drag={images.length > 1 ? "x" : false}
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={1}
                    onDragEnd={handleDragEnd}
                    className='object-cover w-full h-full absolute inset-0 cursor-grab active:cursor-grabbing'
                  />
                </AnimatePresence>
              
              {/* Carousel Controls */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 dark:bg-black/50 p-1.5 rounded-full text-zinc-800 dark:text-zinc-200 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white dark:hover:bg-black"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 dark:bg-black/50 p-1.5 rounded-full text-zinc-800 dark:text-zinc-200 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white dark:hover:bg-black"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {images.map((_, i) => (
                      <div
                        key={i}
                        className={`w-1.5 h-1.5 rounded-full transition-colors ${i === currentImageIndex ? 'bg-zinc-800 dark:bg-zinc-200' : 'bg-zinc-300 dark:bg-zinc-700'}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {isOutOfStock && (
            <div className='absolute inset-x-0 bottom-4 flex justify-center'>
              <span className='bg-zinc-900/80 dark:bg-black/80 backdrop-blur-md text-white text-[10px] sm:text-xs font-semibold px-3 sm:px-4 py-1 sm:py-1.5 rounded-full uppercase tracking-wider'>Agotado</span>
            </div>
          )}
        </div>

        <div className='flex flex-col flex-1 p-3 sm:p-4 text-center'>
          <h3 className='text-xs sm:text-base font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight mb-1 sm:mb-1.5 line-clamp-1'>{deviceName}</h3>
          <p className='text-[11px] sm:text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2 mb-2 sm:mb-3 leading-relaxed flex-1'>{product.description || 'Diseñado con precisión para ofrecer la mejor experiencia y protección.'}</p>
          <div className='mb-3'>
            <span className='text-sm sm:text-lg font-medium tracking-tight text-zinc-900 dark:text-zinc-100'>${product.salePrice.toLocaleString('es-AR')}</span>
          </div>
        </div>
      </Link>

      {!isOutOfStock && (
        <div className='px-3 pb-4 pt-0 mt-auto'>
          <ContactButtons
            product={{ name: deviceName, description: product.description }}
            size='sm'
            showLabels={false}
          />
        </div>
      )}
    </motion.div>
  );
}

