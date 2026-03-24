import { z } from 'zod';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { auditLogs } from '@/lib/db/schema';

/**
 * Audit Log Definition for UI display.
 */
export const auditLogDefSchema = createSelectSchema(auditLogs).extend({
  createdAt: z.union([z.date(), z.string()]),
});

export type AuditLogDef = z.infer<typeof auditLogDefSchema>;

/**
 * Internal Input Schema for recording logs.
 */
export const auditLogInputSchema = createInsertSchema(auditLogs)
  .pick({ userId: true, action: true, entity: true, entityId: true, detail: true });

export type AuditLogInput = z.infer<typeof auditLogInputSchema>;
