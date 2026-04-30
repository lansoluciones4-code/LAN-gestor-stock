import { desc, or, and, eq, gte, lte, sql, exists } from 'drizzle-orm';
import { db } from '@/lib/db';
import { auditLogs, users, products, customers, providers, devices } from '@/lib/db/schema';
import { type AuditLogInput } from '@/features/audit/domain/audit-log.schema';
import { normalizeForSearch } from '@/lib/utils';

export class AuditLogRepository {
  async getAllLogs(options?: { page?: number; limit?: number; search?: string; startDate?: string; endDate?: string }) {
    const { page = 1, limit = 50, search, startDate, endDate } = options || {};
    const offset = (page - 1) * limit;

    return await db.query.auditLogs.findMany({
      where: (logs) => {
        const conditions = [];

        if (search) {
          // Map Spanish entity names to technical values
          const entityMapping = [
            { label: 'usuario', value: 'USER' },
            { label: 'proveedor', value: 'PROVIDER' },
            { label: 'producto', value: 'PRODUCT' },
            { label: 'cliente', value: 'CUSTOMER' },
            { label: 'equipo', value: 'DEVICE' },
            { label: 'venta', value: 'SALE' },
          ];

          // Map Action labels for better searchability
          const actionMapping = [
            { label: 'pérdida', value: 'PÉRDIDA' },
            { label: 'creación', value: 'CREAR' },
            { label: 'edición', value: 'ACTUALIZAR' },
            { label: 'borrado', value: 'ELIMINAR' },
            { label: 'baja', value: 'ELIMINAR' },
          ];

          const searchNormalized = normalizeForSearch(search);
          const s = `%${searchNormalized}%`;

          const matchingEntities = entityMapping.filter((m) => normalizeForSearch(m.label).includes(searchNormalized)).map((m) => m.value);

          const matchingActions = actionMapping.filter((m) => normalizeForSearch(m.label).includes(searchNormalized)).map((m) => m.value);

          const searchConditions = [
            sql`unaccent(${logs.action}) ilike unaccent(${s})`,
            sql`unaccent(${logs.entity}) ilike unaccent(${s})`,
            sql`unaccent(${logs.detail}::text) ilike unaccent(${s})`,
            sql`${logs.id}::text ilike ${s}`,
            sql`${logs.entityId}::text ilike ${s}`,
            // Match operator username
            exists(
              db
                .select({ id: users.id })
                .from(users)
                .where(and(eq(users.id, logs.userId), sql`unaccent(${users.username}) ilike unaccent(${s})`))
            ),
            // Match Product Name via Device
            exists(
              db
                .select({ id: products.id })
                .from(products)
                .innerJoin(devices, eq(products.deviceId, devices.id))
                .where(and(eq(products.id, logs.entityId), or(sql`unaccent(${devices.name}) ilike unaccent(${s})`, sql`unaccent(${products.description}) ilike unaccent(${s})`)))
            ),
            // Match Customer Name
            exists(
              db
                .select({ id: customers.id })
                .from(customers)
                .where(and(eq(customers.id, logs.entityId), sql`unaccent(${customers.name}) ilike unaccent(${s})`))
            ),
            // Match Provider Name
            exists(
              db
                .select({ id: providers.id })
                .from(providers)
                .where(and(eq(providers.id, logs.entityId), sql`unaccent(${providers.name}) ilike unaccent(${s})`))
            ),
            // Match Device Name
            exists(
              db
                .select({ id: devices.id })
                .from(devices)
                .where(and(eq(devices.id, logs.entityId), sql`unaccent(${devices.name}) ilike unaccent(${s})`))
            ),
            // Match Target User Name
            exists(
              db
                .select({ id: users.id })
                .from(users)
                .where(and(eq(users.id, logs.entityId), sql`unaccent(${users.username}) ilike unaccent(${s})`))
            ),
          ];

          if (matchingEntities.length > 0) {
            const entCond = or(...matchingEntities.map((val) => eq(logs.entity, val)));
            if (entCond) searchConditions.push(entCond);
          }

          if (matchingActions.length > 0) {
            const actCond = or(...matchingActions.map((val) => eq(logs.action, val)));
            if (actCond) searchConditions.push(actCond);
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
        user: { columns: { id: true, username: true } },
        product: { with: { device: { columns: { name: true } } }, columns: { id: true } },
        customer: { columns: { id: true, name: true } },
        provider: { columns: { id: true, name: true } },
        device: { columns: { id: true, name: true } },
        sale: { columns: { id: true, total: true } },
        targetUser: { columns: { id: true, username: true } },
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
        user: { columns: { id: true, username: true } },
        product: { with: { device: { columns: { name: true } } }, columns: { id: true } },
        customer: { columns: { id: true, name: true } },
        provider: { columns: { id: true, name: true } },
        device: { columns: { id: true, name: true } },
        sale: { columns: { id: true, total: true } },
        targetUser: { columns: { id: true, username: true } },
      },
    });
  }

  async createLog(input: AuditLogInput, dbtx: any = db) {
    const result = await dbtx
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
