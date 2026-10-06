'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { type ProductDef } from '@/features/product/domain/product.schema';
import { buildRestockText, type RestockSection } from '@/features/product/domain/restock-text';
import { ToggleFilter } from '@/components/ui/toggle-filter';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Button } from '@/components/ui/button';
import { copyToClipboard } from '@/lib/utils';
import { TEST_IDS } from '@/constants/test-ids';

const MAX_TEXT_ROWS = 12;

interface OutOfStockPanelProps {
  /** Filas en 0 que muestra la grilla (ya filtradas). */
  visibleProducts: ProductDef[];
  /** Todos los productos — para no pedir un modelo que todavía tiene stock en otra fila. */
  allProducts: ProductDef[];
  sections: Record<RestockSection, boolean>;
  onSectionsChange: (sections: Record<RestockSection, boolean>) => void;
  startDate: string;
  endDate: string;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onCopyError: (message: string) => void;
}

/** Panel de "Solo sin stock": filtro por rubro + fechas, y la lista para copiar y mandarle al proveedor. */
export function OutOfStockPanel({ visibleProducts, allProducts, sections, onSectionsChange, startDate, endDate, onStartDateChange, onEndDateChange, onCopyError }: OutOfStockPanelProps) {
  const [copied, setCopied] = useState(false);
  const copiedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current);
  }, []);

  const selectedSections = (Object.keys(sections) as RestockSection[]).filter((s) => sections[s]);
  const { text, count } = buildRestockText(visibleProducts, allProducts, selectedSections);

  const handleCopy = async () => {
    const ok = await copyToClipboard(text);
    if (!ok) return onCopyError('No se pudo copiar la lista. Seleccioná el texto y copialo a mano.');
    setCopied(true);
    if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current);
    copiedTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className='mb-4 p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm flex flex-col gap-3 shrink-0 animate-in fade-in slide-in-from-top-1 duration-200'>
      <div className='flex flex-wrap items-center gap-2'>
        {/* En mobile los dos checks van lado a lado (ToggleFilter es w-full debajo de sm). */}
        <div className='grid grid-cols-2 gap-2 w-full sm:flex sm:w-auto'>
          <ToggleFilter id='outOfStockTech' checked={sections.tech} onChange={(checked) => onSectionsChange({ ...sections, tech: checked })} label='TECH' data-testid={TEST_IDS.productos.toggleSinStockTech} />
          <ToggleFilter id='outOfStockLibreria' checked={sections.libreria} onChange={(checked) => onSectionsChange({ ...sections, libreria: checked })} label='LIBRERÍA' data-testid={TEST_IDS.productos.toggleSinStockLibreria} />
        </div>
        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onStartChange={onStartDateChange}
          onEndChange={onEndDateChange}
          onClear={() => {
            onStartDateChange('');
            onEndDateChange('');
          }}
        />
      </div>

      {selectedSections.length > 0 &&
        (count === 0 ? (
          <p className='text-sm text-zinc-500 dark:text-zinc-400'>No hay productos para reponer en los rubros elegidos.</p>
        ) : (
          <div className='flex flex-col gap-2'>
            <div className='flex items-center justify-between gap-2'>
              <span className='text-xs font-bold uppercase tracking-widest text-zinc-400'>
                {count} {count === 1 ? 'producto' : 'productos'} para reponer
              </span>
              <Button variant={copied ? 'success' : 'secondary'} size='sm' onClick={handleCopy} leftIcon={copied ? <Check className='w-4 h-4' /> : <Copy className='w-4 h-4' />} data-testid={TEST_IDS.productos.btnCopiarSinStock}>
                {copied ? '¡Copiado!' : 'Copiar'}
              </Button>
            </div>
            <textarea
              readOnly
              value={text}
              rows={Math.min(text.split('\n').length, MAX_TEXT_ROWS)}
              onFocus={(e) => e.currentTarget.select()}
              className='w-full px-3 py-2 text-sm font-mono bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg resize-none custom-scrollbar focus:outline-none focus:border-zinc-500 text-zinc-700 dark:text-zinc-300'
              data-testid={TEST_IDS.productos.textoSinStock}
            />
          </div>
        ))}
    </div>
  );
}
