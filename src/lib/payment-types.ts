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
    resting: 'bg-yellow-200 dark:bg-yellow-500/20 border-yellow-400 dark:border-yellow-700/60 text-yellow-800 dark:text-yellow-400',
    hover: 'hover:bg-yellow-300 dark:hover:bg-yellow-500/35 hover:border-yellow-500 dark:hover:border-yellow-500',
    selected: 'border-yellow-500 bg-yellow-300 dark:bg-yellow-500/40 text-yellow-900 dark:text-yellow-300',
    badge: 'bg-yellow-200 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-400',
  },
  efectivo: {
    label: 'Efectivo',
    short: 'EF',
    icon: Banknote,
    resting: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-400',
    hover: 'hover:bg-emerald-100 dark:hover:bg-emerald-500/20 hover:border-emerald-300 dark:hover:border-emerald-700',
    selected: 'border-emerald-500 bg-emerald-100 dark:bg-emerald-500/25 text-emerald-800 dark:text-emerald-300',
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  },
  debito: {
    label: 'Débito',
    short: 'DEB',
    icon: CreditCard,
    resting: 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-900/40 text-blue-700 dark:text-blue-400',
    hover: 'hover:bg-blue-100 dark:hover:bg-blue-500/20 hover:border-blue-300 dark:hover:border-blue-700',
    selected: 'border-blue-500 bg-blue-100 dark:bg-blue-500/25 text-blue-800 dark:text-blue-300',
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  },
  credito: {
    label: 'Crédito',
    short: 'CRED',
    icon: Wallet,
    resting: 'bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-900/40 text-orange-700 dark:text-orange-400',
    hover: 'hover:bg-orange-100 dark:hover:bg-orange-500/20 hover:border-orange-300 dark:hover:border-orange-700',
    selected: 'border-orange-500 bg-orange-100 dark:bg-orange-500/25 text-orange-800 dark:text-orange-300',
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
