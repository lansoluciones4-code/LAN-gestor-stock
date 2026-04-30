import { auditLogRepository } from '@/features/audit/repository/audit-log.repository';
import type { AuditLogInput } from '@/features/audit/domain/audit-log.schema';
import { db } from './db';

/**
 * Utility to record an audit log entry.
 * Supports optional transaction instance.
 */
export async function recordAuditLog(userId: string | undefined, action: AuditLogInput['action'], entity: string, entityId?: string, detail?: any, dbtx: any = db) {
  await auditLogRepository.createLog(
    {
      userId,
      action,
      entity,
      entityId,
      detail,
    },
    dbtx
  );
}
