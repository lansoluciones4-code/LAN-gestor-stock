import { Banknote, Landmark, CreditCard, Wallet, type LucideIcon } from 'lucide-react';

export type PaymentType = 'efectivo' | 'transferencia' | 'debito' | 'credito';

export const PAYMENT_TYPES: PaymentType[] = ['transferencia', 'efectivo', 'debito', 'credito'];

interface PaymentTypeMeta {
  label: string;
  short: string;
  icon: LucideIcon;
  /** Apagado en reposo. */
  resting: string;
  /** Se ilumina al pasar el mouse (usar junto con `transition-colors`). */
  hover: string;
  /** Elegido dentro del selector de tipo de pago. */
  selected: string;
  /** Para badges/chips de sólo lectura (historial, comprobante). */
  badge: string;
}

const META: Record<PaymentType, PaymentTypeMeta> = {
  transferencia: {
    label: 'Transferencia',
    short: 'TR',
    icon: Landmark,
    resting: 'bg-yellow-200 dark:bg-yellow-500/25 border-yellow-400 dark:border-yellow-700/60 text-yellow-900 dark:text-yellow-300',
    hover: 'hover:bg-yellow-300 dark:hover:bg-yellow-500/40 hover:border-yellow-500 dark:hover:border-yellow-500',
    selected: 'border-yellow-600 dark:border-yellow-400 bg-yellow-400 dark:bg-yellow-500/60 text-yellow-950 dark:text-yellow-50 ring-2 ring-yellow-300 dark:ring-yellow-400/40 shadow-md',
    badge: 'bg-yellow-200 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-400',
  },
  efectivo: {
    label: 'Efectivo',
    short: 'EF',
    icon: Banknote,
    resting: 'bg-emerald-200 dark:bg-emerald-500/25 border-emerald-400 dark:border-emerald-700/60 text-emerald-900 dark:text-emerald-300',
    hover: 'hover:bg-emerald-300 dark:hover:bg-emerald-500/40 hover:border-emerald-500 dark:hover:border-emerald-500',
    selected: 'border-emerald-600 dark:border-emerald-400 bg-emerald-400 dark:bg-emerald-500/60 text-emerald-950 dark:text-emerald-50 ring-2 ring-emerald-300 dark:ring-emerald-400/40 shadow-md',
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  },
  debito: {
    label: 'Débito',
    short: 'DEB',
    icon: CreditCard,
    resting: 'bg-blue-200 dark:bg-blue-500/25 border-blue-400 dark:border-blue-700/60 text-blue-900 dark:text-blue-300',
    hover: 'hover:bg-blue-300 dark:hover:bg-blue-500/40 hover:border-blue-500 dark:hover:border-blue-500',
    selected: 'border-blue-600 dark:border-blue-400 bg-blue-400 dark:bg-blue-500/60 text-blue-950 dark:text-blue-50 ring-2 ring-blue-300 dark:ring-blue-400/40 shadow-md',
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  },
  credito: {
    label: 'Crédito',
    short: 'CRED',
    icon: Wallet,
    resting: 'bg-orange-200 dark:bg-orange-500/25 border-orange-400 dark:border-orange-700/60 text-orange-900 dark:text-orange-300',
    hover: 'hover:bg-orange-300 dark:hover:bg-orange-500/40 hover:border-orange-500 dark:hover:border-orange-500',
    selected: 'border-orange-600 dark:border-orange-400 bg-orange-400 dark:bg-orange-500/60 text-orange-950 dark:text-orange-50 ring-2 ring-orange-300 dark:ring-orange-400/40 shadow-md',
    badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  },
};

const FALLBACK: PaymentTypeMeta = {
  label: 'Otro',
  short: '--',
  icon: Wallet,
  resting: 'bg-zinc-50 dark:bg-zinc-500/10 border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400',
  hover: 'hover:bg-zinc-100 dark:hover:bg-zinc-500/20',
  selected: 'border-zinc-500 bg-zinc-100 dark:bg-zinc-500/25 text-zinc-700 dark:text-zinc-300',
  badge: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400',
};

export function getPaymentTypeMeta(type: string): PaymentTypeMeta {
  return META[type as PaymentType] ?? FALLBACK;
}
