import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export function BackButton() {
  return (
    <Link
      href='/home'
      className='inline-flex items-center gap-2 text-sm font-bold text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors mb-8 group'
    >
      <ChevronLeft className='w-4 h-4' />
      Volver al catálogo
    </Link>
  );
}
