import { desc, ilike, or, and, eq, gte, lte, sql, exists } from 'drizzle-orm';
import { db } from '@/lib/db';
import { auditLogs, users } from '@/lib/db/schema';
import type { AuditLogInput } from '@/schemas/audit-log.schema';

export class AuditLogRepository {
  async getAllLogs(options?: { page?: number; limit?: number; search?: string; startDate?: string; endDate?: string }) {
    const { page = 1, limit = 50, search, startDate, endDate } = options || {};
    const offset = (page - 1) * limit;

    return await db.query.auditLogs.findMany({
      where: (logs) => {
        const conditions = [];

        if (search) {
          const s = `%${search}%`;
          
          // Map Spanish entity names to technical values for searching (allowing partial matches)
          const entityMapping = [
            { label: 'usuario', value: 'USER' },
            { label: 'proveedor', value: 'PROVIDER' },
            { label: 'producto', value: 'PRODUCT' },
            { label: 'cliente', value: 'CUSTOMER' },
            { label: 'equipo', value: 'DEVICE' },
            { label: 'venta', value: 'SALE' },
          ];
          
          const searchLower = search.toLowerCase().trim();
          const matchingEntities = entityMapping
            .filter(m => m.label.includes(searchLower))
            .map(m => m.value);

          const searchConditions = [
            ilike(logs.action, s),
            ilike(logs.entity, s),
            ilike(logs.username, s),
            sql`${logs.entityId}::text ilike ${s}`,
            // Subquery to match username in users table
            exists(
              db.select({ id: users.id })
                .from(users)
                .where(and(eq(users.id, logs.userId), ilike(users.username, s)))
            )
          ];

          if (matchingEntities.length > 0) {
            const entCond = or(...matchingEntities.map(val => eq(logs.entity, val)));
            if (entCond) searchConditions.push(entCond);
          }

          const cond = or(...searchConditions);
          if (cond) conditions.push(cond);
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
