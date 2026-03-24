import { z } from 'zod';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { devices } from '@/lib/db/schema';

/**
 * Input Schema for creating/updating devices.
 */
export const deviceSchema = createInsertSchema(devices, {
  name: z.string().min(1, 'El nombre es obligatorio').max(100, 'El nombre no puede exceder los 100 caracteres'),
})
  .pick({ name: true })
  .extend({
    id: z.string().optional(),
  });

export type DeviceInput = z.infer<typeof deviceSchema>;

/**
 * Definition schema for reading devices.
 */
export const deviceDefSchema = createSelectSchema(devices).extend({
  createdAt: z.union([z.date(), z.string()]),
  updatedAt: z.union([z.date(), z.string()]),
});

export type DeviceDef = z.infer<typeof deviceDefSchema>;
