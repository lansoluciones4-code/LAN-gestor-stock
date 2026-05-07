import { z } from 'zod';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { devices } from '@/lib/db/schema';

/** Input schema for creating a device/category (form → server). */
export const deviceCreateSchema = createInsertSchema(devices, {
  name: z.string().trim().min(1, 'El nombre es obligatorio').max(100, 'El nombre no puede exceder los 100 caracteres'),
}).pick({ name: true });

export type DeviceInput = z.infer<typeof deviceCreateSchema>;

/** Input schema for updating a device (partial fields + version). */
export const deviceUpdateSchema = deviceCreateSchema.partial().extend({
  version: z.number().int().min(1),
});
export type DeviceUpdateInput = z.infer<typeof deviceUpdateSchema>;

/** Row schema for reading a device from the DB. */
export const deviceRowSchema = createSelectSchema(devices).extend({
  version: z.number(),
  createdAt: z.union([z.date(), z.string()]),
  updatedAt: z.union([z.date(), z.string()]),
});

export type DeviceDef = z.infer<typeof deviceRowSchema>;


