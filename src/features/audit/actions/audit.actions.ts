'use server';

import { z } from 'zod';
import { auditLogRepository } from '@/features/audit/repository/audit-log.repository';
import { auditLogDefSchema, type AuditLogDef } from '@/features/audit/domain/audit-log.schema';
import { verifyAuthOrAdmin } from '@/lib/auth/utils';

export async function fetchAuditLogs(options?: { page?: number; search?: string; startDate?: string; endDate?: string }): Promise<AuditLogDef[]> {
  try {
    await verifyAuthOrAdmin(true);
    const logs = await auditLogRepository.getAllLogs({
      ...options,
      limit: 50,
    });

    return z.array(auditLogDefSchema).parse(logs);
  } catch (error) {
    console.error('fetchAuditLogs error:', error);
    return [];
  }
}
