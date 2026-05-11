'use client';

import { Package, DollarSign, User, Hash, FileText, ToggleLeft, List, AlertCircle, Info } from 'lucide-react';

const KEY_LABELS: Record<string, string> = {
  // Sale
  snapshotTotal: 'Total (al momento)',
  total: 'Total',
  customerName: 'Cliente',
  vendorUsername: 'Vendedor',
  itemCount: 'Cantidad de artículos',
  items: 'Artículos',
  paymentTypes: 'Medios de pago',
  discountAmount: 'Descuento ($)',
  discountPercentage: 'Descuento (%)',
  // User
  username: 'Usuario',
  role: 'Rol',
  changes: 'Cambios aplicados',
  // Product
  deviceName: 'Equipo',
  providerName: 'Proveedor',
  productName: 'Producto',
  description: 'Descripción',
  stock: 'Stock actual',
  stockAlMomento: 'Stock al momento',
  stockBefore: 'Stock anterior',
  stockAfter: 'Stock resultante',
  purchasePrice: 'Precio de compra',
  salePrice: 'Precio de venta',
  showOnLanding: 'Visible en landing',
  quantity: 'Cantidad',
  reason: 'Motivo',
  // Customer / Provider / Device
  name: 'Nombre',
  phone: 'Teléfono',
  email: 'Email',
  documentNumber: 'N° de documento',
  // Generic
  active: 'Estado activo',
  action: 'Acción sobre estado',
  note: 'Nota',
  method: 'Método de sesión',
  message: 'Mensaje',
};

const PRICE_KEYS = new Set(['total', 'snapshotTotal', 'purchasePrice', 'salePrice', 'unitPrice', 'discountAmount']);

type DetailValue = string | number | boolean | null | undefined | Record<string, unknown> | unknown[];

function formatPrice(val: string | number): string {
  const n = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(n)) return String(val);
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(n);
}

function BooleanBadge({ value }: { value: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${value ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
      <ToggleLeft className='w-3 h-3' />
      {value ? 'Sí' : 'No'}
    </span>
  );
}

function PaymentBadge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    efectivo: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    transferencia: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${colors[type] ?? 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'}`}>
      {type}
    </span>
  );
}

function ItemRow({ item }: { item: Record<string, unknown> }) {
  return (
    <div className='flex items-start justify-between gap-2 py-1.5 border-b border-zinc-100 dark:border-zinc-800 last:border-0'>
      <div className='flex items-center gap-2'>
        <Package className='w-3.5 h-3.5 text-zinc-400 shrink-0' />
        <span className='text-zinc-700 dark:text-zinc-300 text-[12px]'>
          {String(item.productName ?? 'Producto')}
          {item.description ? <span className='text-zinc-400 ml-1'>· {String(item.description)}</span> : null}
        </span>
      </div>
      <div className='flex items-center gap-3 shrink-0 text-[12px]'>
        <span className='text-zinc-500'>x{String(item.quantity)}</span>
        {item.unitPrice ? <span className='font-semibold text-zinc-700 dark:text-zinc-200'>{formatPrice(item.unitPrice as string)}</span> : null}
      </div>
    </div>
  );
}

function renderValue(key: string, value: DetailValue): React.ReactNode {
  if (value === null || value === undefined) return <span className='text-zinc-400 italic text-[12px]'>—</span>;

  if (typeof value === 'boolean') return <BooleanBadge value={value} />;

  if (key === 'paymentTypes' && Array.isArray(value)) {
    if (value.length === 0) return <span className='text-zinc-400 italic text-[12px]'>—</span>;
    return (
      <div className='flex flex-wrap gap-1.5'>
        {value.map((type, i) => <PaymentBadge key={i} type={String(type)} />)}
      </div>
    );
  }

  if (key === 'items' && Array.isArray(value)) {
    if (value.length === 0) return <span className='text-zinc-400 italic text-[12px]'>Sin artículos</span>;
    return (
      <div className='w-full rounded-lg border border-zinc-100 dark:border-zinc-800 overflow-hidden bg-zinc-50 dark:bg-zinc-800/40 px-3 pt-1 pb-0'>
        {value.map((item, i) => <ItemRow key={i} item={item as Record<string, unknown>} />)}
      </div>
    );
  }

  if (key === 'changes' && typeof value === 'object' && !Array.isArray(value)) {
    const entries = Object.entries(value as Record<string, unknown>).filter(([, v]) => v !== undefined);
    if (entries.length === 0) return <span className='text-zinc-400 italic text-[12px]'>Sin cambios</span>;
    return (
      <div className='space-y-1 w-full'>
        {entries.map(([k, v]) => (
          <div key={k} className='flex items-center gap-2 text-[12px]'>
            <span className='text-zinc-400 min-w-[110px]'>{KEY_LABELS[k] ?? k}</span>
            <span className='text-zinc-700 dark:text-zinc-200 font-medium'>{String(v)}</span>
          </div>
        ))}
      </div>
    );
  }

  if (Array.isArray(value)) {
    return (
      <ul className='list-disc list-inside space-y-0.5'>
        {value.map((v, i) => <li key={i} className='text-[12px] text-zinc-700 dark:text-zinc-300'>{String(v)}</li>)}
      </ul>
    );
  }

  if (PRICE_KEYS.has(key)) {
    const n = parseFloat(String(value));
    if (!isNaN(n) && n > 0) return <span className='font-semibold text-emerald-600 dark:text-emerald-400'>{formatPrice(n)}</span>;
  }

  if (key === 'role') {
    const colors: Record<string, string> = {
      admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      vendedor: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
    };
    return <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize ${colors[String(value)] ?? 'bg-zinc-100 text-zinc-600'}`}>{String(value)}</span>;
  }

  const strVal = String(value);
  if (strVal === '0' || strVal === '0.00') return <span className='text-zinc-400 text-[12px]'>0</span>;

  return <span className='text-zinc-700 dark:text-zinc-200 text-[13px]'>{strVal}</span>;
}

const KEY_ICONS: Record<string, React.ReactNode> = {
  items: <List className='w-3.5 h-3.5' />,
  total: <DollarSign className='w-3.5 h-3.5' />,
  snapshotTotal: <DollarSign className='w-3.5 h-3.5' />,
  purchasePrice: <DollarSign className='w-3.5 h-3.5' />,
  salePrice: <DollarSign className='w-3.5 h-3.5' />,
  username: <User className='w-3.5 h-3.5' />,
  name: <User className='w-3.5 h-3.5' />,
  customerName: <User className='w-3.5 h-3.5' />,
  vendorUsername: <User className='w-3.5 h-3.5' />,
  documentNumber: <Hash className='w-3.5 h-3.5' />,
  note: <Info className='w-3.5 h-3.5' />,
  reason: <AlertCircle className='w-3.5 h-3.5' />,
  description: <FileText className='w-3.5 h-3.5' />,
};

const WIDE_KEYS = new Set(['items', 'changes', 'paymentTypes']);

type Props = { detail: Record<string, unknown> | null | undefined };

export function AuditDetailRenderer({ detail }: Props) {
  if (!detail || Object.keys(detail).length === 0) {
    return (
      <div className='text-zinc-400 italic text-sm text-center py-4'>
        No hay detalles adicionales registrados.
      </div>
    );
  }

  const entries = Object.entries(detail);

  return (
    <div className='space-y-3'>
      {entries.map(([key, value]) => {
        const label = KEY_LABELS[key] ?? key;
        const icon = KEY_ICONS[key];
        const isWide = WIDE_KEYS.has(key);

        return (
          <div
            key={key}
            className={`flex gap-3 ${isWide ? 'flex-col' : 'items-start justify-between'}`}
          >
            <div className='flex items-center gap-1.5 text-[11px] font-bold text-zinc-400 uppercase tracking-widest shrink-0 min-w-[130px]'>
              {icon && <span className='text-zinc-400'>{icon}</span>}
              {label}
            </div>
            <div className={isWide ? 'w-full' : 'text-right max-w-[60%]'}>
              {renderValue(key, value as DetailValue)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
