import { z } from 'zod';

export const deviceSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Name is required').max(100, 'Name cannot exceed 100 characters'),
});

export type DeviceInput = z.infer<typeof deviceSchema>;
