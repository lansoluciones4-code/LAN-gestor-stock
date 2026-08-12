'use client';

import { useEffect, useState } from 'react';
import { IdCard, User, Phone, Mail, Loader2, CheckCircle2, RotateCcw } from 'lucide-react';
import { fetchCustomerByDocumentNumberAction } from '@/features/customer/actions/customer.actions';

export type SaleCustomerSelection =
  | { mode: 'final' }
  | { mode: 'existing'; customerId: string; label: string }
  | { mode: 'new'; data: { name: string; phone: string; email: string; documentNumber: string } };

export function isCustomerSelectionValid(selection: SaleCustomerSelection): boolean {
  if (selection.mode === 'final') return true;
  if (selection.mode === 'existing') return !!selection.customerId;
  const { name, phone, email, documentNumber } = selection.data;
  return name.trim().length >= 2 && phone.trim().length > 0 && email.trim().length > 0 && documentNumber.trim().length > 0;
}

interface SaleCustomerPickerProps {
  onChange: (selection: SaleCustomerSelection) => void;
}

export function SaleCustomerPicker({ onChange }: SaleCustomerPickerProps) {
  const [tab, setTab] = useState<'final' | 'data'>('final');
  const [documentNumber, setDocumentNumber] = useState('');
  const [lookupStatus, setLookupStatus] = useState<'idle' | 'loading' | 'found' | 'not_found'>('idle');
  const [found, setFound] = useState<{ id: string; name: string; phone: string; email: string } | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (tab === 'final') {
      onChange({ mode: 'final' });
      return;
    }
    if (found) {
      onChange({ mode: 'existing', customerId: found.id, label: found.name });
    } else {
      onChange({ mode: 'new', data: { name, phone, email, documentNumber } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, found, name, phone, email, documentNumber]);

  useEffect(() => {
    if (tab !== 'data') return;
    const normalized = documentNumber.replace(/[.\-]/g, '').trim();
    if (normalized.length < 4) {
      setLookupStatus('idle');
      setFound(null);
      return;
    }
    setLookupStatus('loading');
    const timeout = setTimeout(async () => {
      const result = await fetchCustomerByDocumentNumberAction(documentNumber);
      if (result) {
        setFound({ id: result.id, name: result.name, phone: result.phone, email: result.email });
        setLookupStatus('found');
      } else {
        setFound(null);
        setLookupStatus('not_found');
      }
    }, 400);
    return () => clearTimeout(timeout);
  }, [documentNumber, tab]);

  return (
    <div className='w-full space-y-2'>
      <div className='flex rounded-lg bg-zinc-100 dark:bg-zinc-800/50 p-1'>
        <button
          type='button'
          onClick={() => setTab('final')}
          className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-md transition-all ${tab === 'final' ? 'bg-white dark:bg-zinc-700 shadow text-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'}`}
        >
          Consumidor Final
        </button>
        <button
          type='button'
          onClick={() => setTab('data')}
          className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-md transition-all ${tab === 'data' ? 'bg-white dark:bg-zinc-700 shadow text-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'}`}
        >
          Cargar Datos
        </button>
      </div>

      {tab === 'data' && (
        <div className='space-y-2 p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg'>
          <label className='block text-[10px] font-black uppercase text-zinc-400 tracking-widest'>DNI / CUIT</label>
          <div className='relative'>
            <IdCard className='absolute left-3 top-2.5 h-4 w-4 text-zinc-400' />
            <input
              type='text'
              value={documentNumber}
              onChange={(e) => setDocumentNumber(e.target.value.replace(/[^0-9.\-]/g, ''))}
              className='w-full pl-9 pr-9 py-2 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:border-zinc-500'
            />
            {lookupStatus === 'loading' && <Loader2 className='absolute right-3 top-2.5 h-4 w-4 text-zinc-400 animate-spin' />}
            {lookupStatus === 'found' && <CheckCircle2 className='absolute right-3 top-2.5 h-4 w-4 text-emerald-500' />}
          </div>

          {lookupStatus === 'found' && found && (
            <div className='flex items-center justify-between gap-2 p-2 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-900/30 rounded-lg'>
              <div className='min-w-0'>
                <p className='text-xs font-bold text-zinc-800 dark:text-zinc-100 truncate'>{found.name}</p>
                <p className='text-[10px] text-zinc-500 truncate'>{[found.phone, found.email].filter(Boolean).join(' · ') || 'Sin datos de contacto'}</p>
              </div>
              <button
                type='button'
                onClick={() => {
                  setDocumentNumber('');
                  setFound(null);
                  setLookupStatus('idle');
                }}
                className='shrink-0 p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200'
                title='Buscar otro cliente'
              >
                <RotateCcw className='w-3.5 h-3.5' />
              </button>
            </div>
          )}

          {lookupStatus === 'not_found' && (
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-2'>
              <div className='sm:col-span-2'>
                <label className='block text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-1'>Nombre completo</label>
                <div className='relative'>
                  <User className='absolute left-3 top-2.5 h-4 w-4 text-zinc-400' />
                  <input
                    type='text'
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className='w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:border-zinc-500'
                  />
                </div>
              </div>
              <div>
                <label className='block text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-1'>Teléfono</label>
                <div className='relative'>
                  <Phone className='absolute left-3 top-2.5 h-4 w-4 text-zinc-400' />
                  <input
                    type='text'
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className='w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:border-zinc-500'
                  />
                </div>
              </div>
              <div>
                <label className='block text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-1'>Email</label>
                <div className='relative'>
                  <Mail className='absolute left-3 top-2.5 h-4 w-4 text-zinc-400' />
                  <input
                    type='email'
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className='w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:border-zinc-500'
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
