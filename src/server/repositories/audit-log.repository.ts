import { desc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { auditLogs, users } from '@/lib/db/schema';
import type { AuditLogInput } from '@/schemas/audit-log.schema';

export class AuditLogRepository {
  async getAllLogs() {
    return await db.query.auditLogs.findMany({
      orderBy: [desc(auditLogs.createdAt)],
      with: {
        user: true,
      },
      limit: 100,
    });
  }

  async getLogsByEntity(entity: string, entityId?: string) {
    return await db.query.auditLogs.findMany({
      where: (logs, { eq, and }) => 
        entityId ? and(eq(logs.entity, entity), eq(logs.entityId, entityId)) : eq(logs.entity, entity),
      orderBy: [desc(auditLogs.createdAt)],
      with: {
        user: true,
      },
    });
  }

  async createLog(input: AuditLogInput) {
    const result = await db
      .insert(auditLogs)
      .values({
        userId: input.userId,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId,
        detail: input.detail,
      })
      .returning();
    return result[0];
  }
}

export const auditLogRepository = new AuditLogRepository();
