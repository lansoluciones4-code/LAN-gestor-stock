/**
 * Toggle genérico de dos botones — para cualquier campo de formulario que solo admite click,
 * sin escritura libre (ej. respuestas Sí/No de "Recepción de Equipo", o el par Original/Alternativo
 * del cargador de notebook). `YesNoToggle` es el atajo para el caso booleano más común.
 */
interface ToggleOption<T> {
  value: T;
  label: string;
}

interface TwoOptionToggleProps<T extends string | boolean> {
  label?: string;
  value: T;
  options: readonly [ToggleOption<T>, ToggleOption<T>];
  onChange: (value: T) => void;
}

export function TwoOptionToggle<T extends string | boolean>({ label, value, options, onChange }: TwoOptionToggleProps<T>) {
  return (
    <div>
      {label && <label className='block text-xs font-medium mb-1.5 text-zinc-700 dark:text-zinc-300'>{label}</label>}
      <div className='grid grid-cols-2 gap-2'>
        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <button
              key={String(opt.value)}
              type='button'
              onClick={() => onChange(opt.value)}
              className={`flex items-center justify-center px-3 py-2 rounded-lg border-2 transition-all font-bold text-xs uppercase ${
                active ? 'border-sky-500 bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400' : 'border-transparent bg-zinc-50 dark:bg-zinc-950 text-zinc-400'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const YES_NO_OPTIONS = [
  { value: true, label: 'Sí' },
  { value: false, label: 'No' },
] as const;

export function YesNoToggle({ label, value, onChange }: { label?: string; value: boolean; onChange: (value: boolean) => void }) {
  return (
    <TwoOptionToggle
      label={label}
      value={value}
      options={YES_NO_OPTIONS}
      onChange={onChange}
    />
  );
}
