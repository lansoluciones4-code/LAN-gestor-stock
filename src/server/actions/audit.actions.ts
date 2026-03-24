'use server';

import { z } from 'zod';
import { auditLogRepository } from '@/server/repositories/audit-log.repository';
import { auditLogDefSchema, type AuditLogDef } from '@/schemas/audit-log.schema';
import { verifyAuthOrAdmin } from '@/lib/auth/utils';

export async function fetchAuditLogs(): Promise<AuditLogDef[]> {
  try {
    // Only admins can see logs
    await verifyAuthOrAdmin(true);
    const logs = await auditLogRepository.getAllLogs();
    
    // Convert dates to ISO strings if needed or just parse them
    return z.array(auditLogDefSchema).parse(logs);
  } catch (error) {
    console.error('fetchAuditLogs error:', error);
    return [];
  }
}
