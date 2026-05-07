'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, ChevronLeft, ChevronRight } from 'lucide-react';

interface ProductImageViewProps {
  images?: { publicId: string; url: string }[];
  deviceName: string;
  isOutOfStock: boolean;
}

export function ProductImageView({ images = [], deviceName, isOutOfStock }: ProductImageViewProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const hasImages = images.length > 0;

  const nextImage = (e?: any) => {
    if (e?.preventDefault) e.preventDefault();
    if (images.length > 1) {
      setDirection(1);
      setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    }
  };

  const prevImage = (e?: any) => {
    if (e?.preventDefault) e.preventDefault();
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
    <div className='relative aspect-square rounded-[2.5rem] bg-white dark:bg-black border border-zinc-100 dark:border-zinc-800 flex items-center justify-center overflow-hidden shadow-sm w-full max-w-xl mx-auto group'>
      {!hasImages ? (
        <div className='flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-600 transition-opacity duration-300'>
          <Package className='w-16 h-16 stroke-[1.5] mb-4' />
          <span className='text-xs font-medium tracking-widest uppercase'>Pronto</span>
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
              transition={{ type: "tween", duration: 0.4, ease: "easeInOut" }}
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
                className="absolute left-0 top-1/2 -translate-y-1/2 bg-white/80 dark:bg-black/50 p-3 rounded-full text-zinc-800 dark:text-zinc-200 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white dark:hover:bg-black shadow-md"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-0 top-1/2 -translate-y-1/2 bg-white/80 dark:bg-black/50 p-3 rounded-full text-zinc-800 dark:text-zinc-200 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white dark:hover:bg-black shadow-md"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex gap-2">
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentImageIndex(i)}
                    className={`w-2 h-2 rounded-full transition-colors ${i === currentImageIndex ? 'bg-zinc-800 dark:bg-zinc-200' : 'bg-zinc-300 dark:bg-zinc-700'}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {isOutOfStock && (
        <div className='absolute top-8 right-8'>
          <span className='bg-zinc-900 dark:bg-black text-white text-[10px] font-bold px-4 py-2 rounded-full uppercase tracking-[0.2em] shadow-2xl'>Agotado</span>
        </div>
      )}
    </div>
  );
}
