export class ErrorHandlerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ErrorHandlerError';
  }
} 