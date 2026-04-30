import { MESSAGES } from '@/config/messages';

/**
 * User-friendly messages for common Database errors
 */
export function handleDatabaseError(error: any, entityName: string): string {
  // Extraemos toda la información posible del error de Drizzle/Postgres
  const code = error.code || error.originalError?.code || '';
  const message = (error.message || '').toLowerCase();
  const detail = (error.detail || error.originalError?.detail || '').toLowerCase();

  // El código 23503 es el estándar de Postgres para Foreign Key Violation
  const isForeignKey = code === '23503' || message.includes('23503') || message.includes('foreign key') || message.includes('violates foreign key constraint') || detail.includes('foreign key') || detail.includes('violates foreign key constraint');

  if (isForeignKey) {
    return MESSAGES.ERROR.DATABASE.RELATION_NOT_FOUND;
  }

  // 23505: Unique Violation
  const isUnique = code === '23505' || message.includes('unique constraint') || message.includes('already exists');
  if (isUnique) {
    return MESSAGES.ERROR.DATABASE.UNIQUE_VIOLATION;
  }

  // Si llegamos aquí y es un error de "Failed query", devolvemos algo genérico pero amigable
  if (message.includes('failed query')) {
    return MESSAGES.ERROR.DATABASE.CONCURRENCY;
  }

  if (error.name === 'ConcurrencyError') {
    return MESSAGES.ERROR.DATABASE.CONCURRENCY;
  }

  if (error.name === 'DuplicateEntityError') {
    return MESSAGES.ERROR.DATABASE.UNIQUE_VIOLATION;
  }

  return error.message || MESSAGES.ERROR.DATABASE.GENERIC(entityName);
}
