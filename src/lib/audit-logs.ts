import { auditLogRepository } from '@/server/repositories/audit-log.repository';
import type { AuditLogInput } from '@/schemas/audit-log.schema';

/**
 * Utility to record an audit log entry.
 * It does NOT handle auth verification itself, assumes it's called within an action that has context.
 */
export async function recordAuditLog(userId: string | undefined, action: AuditLogInput['action'], entity: string, entityId?: string, detail?: any) {
  try {
    await auditLogRepository.createLog({
      userId,
      action,
      entity,
      entityId,
      detail,
    });
  } catch (error) {
    // Audit logs should ideally not break the main transaction if possible,
    // but in this system we just log the error.
    console.error('Failed to create audit log:', error);
  }
}
