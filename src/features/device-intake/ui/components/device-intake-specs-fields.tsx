'use client';

import { DEVICE_INTAKE_FIELDS, type EquipmentType } from '@/config/forms/device-intake-fields';
import { YesNoToggle, TwoOptionToggle } from '@/components/ui/two-option-toggle';

interface DeviceIntakeSpecsFieldsProps {
  equipmentType: EquipmentType;
  specs: Record<string, string | boolean>;
  onChange: (key: string, value: string | boolean) => void;
}

/** Renderiza los campos específicos del tipo de equipo, en el mismo orden que la planilla del Excel. */
export function DeviceIntakeSpecsFields({ equipmentType, specs, onChange }: DeviceIntakeSpecsFieldsProps) {
  const fields = DEVICE_INTAKE_FIELDS[equipmentType];

  return (
    <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3'>
      {fields.map((field) => {
        if (field.kind === 'boolean') {
          return (
            <YesNoToggle
              key={field.key}
              label={field.label}
              value={!!specs[field.key]}
              onChange={(value) => onChange(field.key, value)}
            />
          );
        }

        if (field.kind === 'choice' && field.choices) {
          const [a, b] = field.choices;
          return (
            <TwoOptionToggle
              key={field.key}
              label={field.label}
              value={(specs[field.key] as string) ?? a}
              options={[
                { value: a, label: a },
                { value: b, label: b },
              ]}
              onChange={(value) => onChange(field.key, value)}
            />
          );
        }

        return (
          <div key={field.key}>
            <label className='block text-xs font-medium mb-1.5 text-zinc-700 dark:text-zinc-300'>{field.label}</label>
            <input
              type='text'
              value={(specs[field.key] as string) ?? ''}
              onChange={(e) => onChange(field.key, e.target.value)}
              className='w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-zinc-500 bg-zinc-50 dark:bg-zinc-950 dark:text-zinc-100 border-zinc-300 dark:border-zinc-700 transition-colors'
            />
          </div>
        );
      })}
    </div>
  );
}
