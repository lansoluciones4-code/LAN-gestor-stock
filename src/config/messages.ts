/**
 * Centralized messages for the application.
 * This includes success messages, validation errors, and system errors.
 */
export const MESSAGES = {
  SUCCESS: {
    CREATED: (entity: string) => `${entity} registrado/a exitosamente`,
    UPDATED: (entity: string) => `${entity} actualizado/a exitosamente`,
    DELETED: (entity: string) => `${entity} eliminado/a exitosamente`,
    ACTIVATED: (entity: string) => `${entity} activado/a exitosamente`,
    DEACTIVATED: (entity: string) => `${entity} desactivado/a exitosamente`,
    REACTIVATED: (entity: string) => `El/la ${entity} ya existía (inactivo) y ha sido reactivado con los nuevos datos`,
  },
  ERROR: {
    VALIDATION: {
      INVALID_DATA: 'Los datos proporcionados no son válidos.',
      REQUIRED_FIELD: 'Este campo es obligatorio.',
      INVALID_FORMAT: (field: string) => `El formato del campo ${field} no es válido.`,
    },
    DATABASE: {
      UNIQUE_VIOLATION: 'Ya existe un registro con esos datos (DNI, nombre o código duplicado).',
      FOREIGN_KEY_VIOLATION: 'No se puede completar la operación porque existen registros relacionados.',
      NOT_FOUND: (entity: string) => `El/la ${entity} seleccionado ya no existe.`,
      CONCURRENCY: 'Los datos en el servidor han cambiado. Por favor, sincroniza la lista e intenta nuevamente.',
      GENERIC: (entity: string) => `Ocurrió un error inesperado al procesar el/la ${entity}.`,
      RELATION_NOT_FOUND: 'Una de las entidades relacionadas ya no existe. Por favor, sincroniza los datos.',
    },
    AUTH: {
      UNAUTHORIZED: 'No tienes permisos para realizar esta acción.',
      INVALID_CREDENTIALS: 'Usuario o contraseña incorrectos.',
      SESSION_EXPIRED: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
    },
    GENERIC: 'Ha ocurrido un error inesperado. Por favor, intenta nuevamente.',
  },
} as const;
