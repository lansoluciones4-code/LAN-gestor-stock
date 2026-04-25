export class ConcurrencyError extends Error {
  constructor(message = 'La entidad fue modificada por otro usuario o proceso. Por favor, recarga los datos e intenta nuevamente.') {
    super(message);
    this.name = 'ConcurrencyError';
  }
}
