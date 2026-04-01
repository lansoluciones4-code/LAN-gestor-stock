import { desc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { auditLogs, users } from '@/lib/db/schema';
import type { AuditLogInput } from '@/schemas/audit-log.schema';

export class AuditLogRepository {
  async getAllLogs(options?: { page?: number; limit?: number; search?: string; startDate?: string; endDate?: string }) {
    const { page = 1, limit = 50, search, startDate, endDate } = options || {};
    const offset = (page - 1) * limit;

    return await db.query.auditLogs.findMany({
      where: (logs, { eq, and, or, like, gte, lte }) => {
        const conditions = [];

        if (search) {
          const s = `%${search.toLowerCase()}%`;
          conditions.push(or(like(logs.action, s), like(logs.entity, s), like(logs.entityId, s)));
        }

        if (startDate) {
          conditions.push(gte(logs.createdAt, new Date(startDate + 'T00:00:00')));
        }
        if (endDate) {
          conditions.push(lte(logs.createdAt, new Date(endDate + 'T23:59:59')));
        }

        return conditions.length > 0 ? and(...conditions) : undefined;
      },
      orderBy: [desc(auditLogs.createdAt)],
      with: {
        user: true,
      },
      limit: limit,
      offset: offset,
    });
  }

  async getLogsByEntity(entity: string, entityId?: string) {
    return await db.query.auditLogs.findMany({
      where: (logs, { eq, and }) => (entityId ? and(eq(logs.entity, entity), eq(logs.entityId, entityId)) : eq(logs.entity, entity)),
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
