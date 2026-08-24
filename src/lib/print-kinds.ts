import { Copy, Printer, Monitor, Layers, FileText, type LucideIcon } from 'lucide-react';

export type PrintKind = 'fotocopia' | 'impresion' | 'ciber' | 'anillado_plastificado' | 'tramite';

/** Qué campo extra pide el formulario de carga, además del monto. */
export type PrintKindExtraField = 'none' | 'colorMode' | 'title';

interface PrintKindMeta {
  label: string;
  icon: LucideIcon;
  extraField: PrintKindExtraField;
}

const META: Record<PrintKind, PrintKindMeta> = {
  fotocopia: { label: 'Fotocopia', icon: Copy, extraField: 'none' },
  impresion: { label: 'Impresión', icon: Printer, extraField: 'colorMode' },
  ciber: { label: 'Hora de Ciber', icon: Monitor, extraField: 'none' },
  anillado_plastificado: { label: 'Anillados/Plastificados', icon: Layers, extraField: 'none' },
  tramite: { label: 'Trámite Online', icon: FileText, extraField: 'title' },
};

const FALLBACK: PrintKindMeta = { label: 'Impresión', icon: Printer, extraField: 'none' };

export function getPrintKindMeta(kind: string): PrintKindMeta {
  return META[kind as PrintKind] ?? FALLBACK;
}

interface PrintItemLike {
  kind: string;
  colorMode?: string | null;
  title?: string | null;
}

/** Texto de línea para carrito e impresión de recibo — cubre los 5 kinds. */
export function formatPrintItemLabel(item: PrintItemLike): string {
  switch (item.kind as PrintKind) {
    case 'tramite':
      return item.title ? `Trámite: ${item.title}` : 'Trámite Online';
    case 'ciber':
      return 'Hora de Ciber';
    case 'anillado_plastificado':
      return 'Anillados/Plastificados';
    case 'fotocopia':
      return 'Fotocopia';
    case 'impresion':
    default:
      if (item.colorMode === 'color') return 'Impresión Color';
      if (item.colorMode === 'blanco_y_negro') return 'Impresión Blanco y Negro';
      return 'Impresión';
  }
}
