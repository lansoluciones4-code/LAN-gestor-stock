'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronsUpDown, Search, X, Plus, Pencil } from 'lucide-react';

interface Option {
  id: string;
  name: string;
  /** Only meaningful combined with `onDeleteOption` — shows a small remove button for this row. */
  deletable?: boolean;
}

interface ComboboxProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  addNewLabel?: string;
  onAddNew?: () => void;
  className?: string;
  'data-testid'?: string;
  searchTestId?: string;
  /**
   * Text-value mode: `value`/`onChange` carry the raw text itself (not an option id).
   * Typing something that doesn't match an existing option offers a "Usar '<texto>'" row.
   */
  freeText?: boolean;
  /** Called when the small "x" on a `deletable` option is clicked. */
  onDeleteOption?: (id: string) => void;
  /** Shows a pencil icon on every row, which turns it into an inline text input to rename that option. */
  editable?: boolean;
  /** Called with (id, newName) when an inline rename is confirmed. */
  onEditOption?: (id: string, newValue: string) => void;
}

export function Combobox({ options, value, onChange, placeholder = 'Seleccionar...', searchPlaceholder = 'Buscar...', emptyMessage = 'No se encontraron resultados.', addNewLabel, onAddNew, className = '', 'data-testid': testId, searchTestId, freeText = false, onDeleteOption, editable = false, onEditOption }: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [mounted, setMounted] = React.useState(false);
  const [dropdownStyle, setDropdownStyle] = React.useState<{ top: number; left: number; width: number } | null>(null);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editValue, setEditValue] = React.useState('');
  const containerRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.id === value);
  const displayLabel = selectedOption ? selectedOption.name : freeText && value ? value : undefined;

  const filteredOptions = options.filter((opt) => opt.name.toLowerCase().includes(search.toLowerCase()));
  const trimmedSearch = search.trim();
  const hasExactMatch = filteredOptions.some((opt) => opt.name.toLowerCase() === trimmedSearch.toLowerCase());
  const showCreateRow = freeText && trimmedSearch.length > 0 && !hasExactMatch;

  React.useEffect(() => setMounted(true), []);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (containerRef.current?.contains(target)) return;
      if (dropdownRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // El desplegable se porta a document.body (ver render) para no quedar recortado por ningún
  // ancestro con overflow (ej. un modal alto con scroll) — por eso su posición se calcula a mano
  // en cada apertura, scroll o resize, en vez de dejarlo `absolute` dentro de su propio contenedor.
  React.useEffect(() => {
    if (!open) return;

    const updatePosition = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      setDropdownStyle({ top: rect.bottom, left: rect.left, width: rect.width });
    };

    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [open]);

  React.useEffect(() => {
    if (!open) setEditingId(null);
  }, [open]);

  const startEdit = (opt: Option) => {
    setEditingId(opt.id);
    setEditValue(opt.name);
  };

  const confirmEdit = () => {
    const trimmed = editValue.trim();
    const opt = options.find((o) => o.id === editingId);
    if (trimmed && opt && trimmed !== opt.name && editingId) {
      onEditOption?.(editingId, trimmed);
    }
    setEditingId(null);
  };

  return (
    <div
      className={`relative ${className}`}
      ref={containerRef}
      data-testid={testId}
    >
      <button
        type='button'
        ref={triggerRef}
        onClick={() => setOpen(!open)}
        title={displayLabel}
        className='flex h-10 w-full items-center justify-between rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-500 transition-colors'
      >
        <span className='truncate'>{displayLabel ?? placeholder}</span>
        <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
      </button>

      {open &&
        mounted &&
        dropdownStyle &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{ position: 'fixed', top: dropdownStyle.top, left: dropdownStyle.left, width: dropdownStyle.width }}
            className='z-50 mt-1 max-h-60 overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl animate-in fade-in zoom-in-95 duration-200'
          >
            <div className='flex items-center border-b border-zinc-100 dark:border-zinc-800 px-3'>
              <Search className='mr-2 h-4 w-4 shrink-0 opacity-50' />
              <input
                className='flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-zinc-500 disabled:cursor-not-allowed disabled:opacity-50'
                placeholder={searchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
                data-testid={searchTestId}
              />
              {search && (
                <button onClick={() => setSearch('')}>
                  <X className='h-4 w-4 opacity-50 hover:opacity-100' />
                </button>
              )}
            </div>
            <div className='overflow-y-auto max-h-[200px] custom-scrollbar border-b border-zinc-100 dark:border-zinc-800'>
              {addNewLabel && (
                <button
                  type='button'
                  className='flex w-full items-center py-2.5 px-3 text-sm font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/20 transition-colors shrink-0 border-b border-zinc-50 dark:border-zinc-800/50'
                  onClick={() => {
                    onAddNew?.();
                    setOpen(false);
                  }}
                >
                  {addNewLabel}
                </button>
              )}

              {showCreateRow && (
                <button
                  type='button'
                  className='flex w-full items-center py-2.5 px-3 text-sm font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/20 transition-colors shrink-0 border-b border-zinc-50 dark:border-zinc-800/50'
                  onClick={() => {
                    onChange(trimmedSearch);
                    setOpen(false);
                    setSearch('');
                  }}
                >
                  <Plus className='mr-2 h-4 w-4 shrink-0' />
                  Usar &quot;{trimmedSearch}&quot;
                </button>
              )}

              {filteredOptions.length === 0 && !addNewLabel && !showCreateRow && <div className='py-6 text-center text-sm text-zinc-500'>{emptyMessage}</div>}

              {filteredOptions.map((opt) => {
                const optValue = freeText ? opt.name : opt.id;

                if (editingId === opt.id) {
                  return (
                    <div
                      key={opt.id}
                      className='relative flex w-full items-center gap-1 px-3 py-1.5'
                    >
                      <input
                        autoFocus
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            confirmEdit();
                          }
                          if (e.key === 'Escape') {
                            e.preventDefault();
                            setEditingId(null);
                          }
                        }}
                        className='flex-1 min-w-0 h-8 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-2 text-sm outline-none focus:ring-2 focus:ring-zinc-500'
                      />
                      <button
                        type='button'
                        title='Guardar'
                        className='shrink-0 p-1.5 rounded text-zinc-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors'
                        onClick={(e) => {
                          e.stopPropagation();
                          confirmEdit();
                        }}
                      >
                        <Check className='h-3.5 w-3.5' />
                      </button>
                      <button
                        type='button'
                        title='Cancelar'
                        className='shrink-0 p-1.5 rounded text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors'
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingId(null);
                        }}
                      >
                        <X className='h-3.5 w-3.5' />
                      </button>
                    </div>
                  );
                }

                return (
                  <div
                    key={opt.id}
                    className='relative flex w-full items-center group'
                  >
                    <button
                      type='button'
                      title={opt.name}
                      className='relative flex flex-1 min-w-0 cursor-default select-none items-center rounded-sm py-2 px-3 text-sm outline-none hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-left font-medium'
                      onClick={() => {
                        onChange(optValue);
                        setOpen(false);
                        setSearch('');
                      }}
                    >
                      <Check className={`mr-2 h-4 w-4 shrink-0 ${value === optValue ? 'opacity-100' : 'opacity-0'} text-zinc-500`} />
                      <span className='truncate'>{opt.name}</span>
                    </button>
                    {editable && onEditOption && (
                      <button
                        type='button'
                        title='Editar nombre'
                        className='shrink-0 p-1.5 rounded text-zinc-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-500/10 transition-colors'
                        onClick={(e) => {
                          e.stopPropagation();
                          startEdit(opt);
                        }}
                      >
                        <Pencil className='h-3.5 w-3.5' />
                      </button>
                    )}
                    {opt.deletable && onDeleteOption && (
                      <button
                        type='button'
                        title='Eliminar de las sugerencias'
                        className='shrink-0 p-1.5 mr-1.5 rounded text-zinc-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors'
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteOption(opt.id);
                        }}
                      >
                        <X className='h-3.5 w-3.5' />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
