import { z } from 'zod';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { auditLogs } from '@/lib/db/schema';

/**
 * Audit Log Definition for UI display.
 */
export const auditLogDefSchema = createSelectSchema(auditLogs).extend({
  createdAt: z.union([z.date(), z.string()]),
  user: z
    .object({
      id: z.string(),
      username: z.string(),
    })
    .optional()
    .nullable(),
  product: z
    .object({
      id: z.string(),
      device: z.object({ name: z.string() }).optional(),
    })
    .optional()
    .nullable(),
  customer: z
    .object({
      id: z.string(),
      name: z.string(),
    })
    .optional()
    .nullable(),
  provider: z
    .object({
      id: z.string(),
      name: z.string(),
    })
    .optional()
    .nullable(),
  device: z
    .object({
      id: z.string(),
      name: z.string(),
    })
    .optional()
    .nullable(),
  sale: z
    .object({
      id: z.string(),
      total: z.string(),
    })
    .optional()
    .nullable(),
  targetUser: z
    .object({
      id: z.string(),
      username: z.string(),
    })
    .optional()
    .nullable(),
});

export type AuditLogDef = z.infer<typeof auditLogDefSchema>;

/**
 * Internal Input Schema for recording logs.
 */
export const auditLogInputSchema = createInsertSchema(auditLogs).pick({ userId: true, action: true, entity: true, entityId: true, detail: true });

export type AuditLogInput = z.infer<typeof auditLogInputSchema>;
