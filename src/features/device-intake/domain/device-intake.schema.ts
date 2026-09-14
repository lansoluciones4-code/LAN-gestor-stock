import { z } from 'zod';
import { createSelectSchema } from 'drizzle-zod';
import { deviceIntakes } from '@/lib/db/schema';
import { DEVICE_INTAKE_FIELDS, type EquipmentType } from '@/config/forms/device-intake-fields';

/** Arma el shape Zod de `specs` para un tipo de equipo, a partir de DEVICE_INTAKE_FIELDS (única fuente de verdad de esos campos). */
function buildSpecsShape(type: EquipmentType) {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const field of DEVICE_INTAKE_FIELDS[type]) {
    if (field.kind === 'boolean') {
      shape[field.key] = z.boolean().default(false);
    } else if (field.kind === 'choice') {
      const [a, b] = field.choices!;
      shape[field.key] = z.enum([a, b]).default(a);
    } else {
      shape[field.key] = z.string().trim().default('');
    }
  }
  return z.object(shape);
}

export const deviceIntakeSpecsSchemas = {
  consola: buildSpecsShape('consola'),
  pc_escritorio: buildSpecsShape('pc_escritorio'),
  notebook: buildSpecsShape('notebook'),
};

const commonInputFields = {
  receivedByName: z.string().trim().min(2, 'Ingresá quién recibió el equipo').max(100, 'Nombre demasiado largo'),
  description: z.string().trim().min(2, 'Describí brevemente el motivo (ayuda-memoria interna)').max(1000, 'Descripción demasiado larga'),
  // Sin `.default()` a propósito: el form siempre manda un string explícito (aunque sea ''), y
  // .default() acá desalinea el tipo "input" que espera el resolver de react-hook-form.
  intakeReason: z.string().trim().max(1000, 'Texto demasiado largo'),
  observations: z.string().trim().max(1000, 'Texto demasiado largo'),
};

/** Los campos comunes solos, sin `specs` ni `equipmentType` — usado como resolver de react-hook-form (los campos dinámicos de `specs` se manejan aparte, ver DeviceIntakeSpecsFields). */
export const deviceIntakeCommonFieldsSchema = z.object(commonInputFields);

/** Input del formulario (react-hook-form): sin `customerId` — el cliente se resuelve aparte, vía SaleCustomerPicker (mismo patrón que Repuestos). */
export const deviceIntakeFormSchema = z.discriminatedUnion('equipmentType', [
  z.object({ equipmentType: z.literal('consola'), ...commonInputFields, specs: deviceIntakeSpecsSchemas.consola }),
  z.object({ equipmentType: z.literal('pc_escritorio'), ...commonInputFields, specs: deviceIntakeSpecsSchemas.pc_escritorio }),
  z.object({ equipmentType: z.literal('notebook'), ...commonInputFields, specs: deviceIntakeSpecsSchemas.notebook }),
]);
export type DeviceIntakeFormInput = z.infer<typeof deviceIntakeFormSchema>;

/** Input real de la Server Action de creación: agrega el `customerId` ya resuelto. */
export const deviceIntakeCreateSchema = z.discriminatedUnion('equipmentType', [
  z.object({ equipmentType: z.literal('consola'), customerId: z.string().uuid('Seleccioná un cliente'), ...commonInputFields, specs: deviceIntakeSpecsSchemas.consola }),
  z.object({ equipmentType: z.literal('pc_escritorio'), customerId: z.string().uuid('Seleccioná un cliente'), ...commonInputFields, specs: deviceIntakeSpecsSchemas.pc_escritorio }),
  z.object({ equipmentType: z.literal('notebook'), customerId: z.string().uuid('Seleccioná un cliente'), ...commonInputFields, specs: deviceIntakeSpecsSchemas.notebook }),
]);
export type DeviceIntakeInput = z.infer<typeof deviceIntakeCreateSchema>;

/**
 * Update: no permite cambiar `equipmentType` (implicaría un `specs` incompatible con lo ya
 * cargado) — por eso `specs` queda como record suelto acá; la action valida su forma real contra
 * `deviceIntakeSpecsSchemas[existente.equipmentType]` antes de guardar.
 */
export const deviceIntakeUpdateSchema = z.object({
  version: z.number().int().min(1),
  customerId: z.string().uuid('Seleccioná un cliente').optional(),
  receivedByName: commonInputFields.receivedByName.optional(),
  description: commonInputFields.description.optional(),
  intakeReason: commonInputFields.intakeReason.optional(),
  observations: commonInputFields.observations.optional(),
  specs: z.record(z.string(), z.any()).optional(),
});
export type DeviceIntakeUpdateInput = z.infer<typeof deviceIntakeUpdateSchema>;

/** Input del formulario de Diagnóstico Final — siempre empieza con quién lo escribe. */
export const deviceIntakeDiagnosisSchema = z.object({
  version: z.number().int().min(1),
  diagnosisAuthorName: z.string().trim().min(2, 'Ingresá quién realiza el diagnóstico').max(100, 'Nombre demasiado largo'),
  diagnosisDetail: z.string().trim().min(2, 'Describí el diagnóstico final').max(2000, 'Texto demasiado largo'),
});
export type DeviceIntakeDiagnosisInput = z.infer<typeof deviceIntakeDiagnosisSchema>;

/** Row schema de lectura desde la DB. */
export const deviceIntakeRowSchema = createSelectSchema(deviceIntakes)
  .extend({
    createdAt: z.union([z.date(), z.string()]),
    updatedAt: z.union([z.date(), z.string()]),
    diagnosedAt: z.union([z.date(), z.string()]).nullable(),
    specs: z.record(z.string(), z.unknown()),
    customer: z
      .object({ id: z.string(), name: z.string(), documentNumber: z.string().optional(), phone: z.string().optional() })
      .nullish(),
    photos: z.array(z.object({ publicId: z.string(), url: z.string() })).default([]),
  })
  .transform((row) => ({
    ...row,
    /** true si ya se cargó el Diagnóstico Final. */
    diagnosed: !!row.diagnosedAt,
  }));

export type DeviceIntakeDef = z.infer<typeof deviceIntakeRowSchema>;
