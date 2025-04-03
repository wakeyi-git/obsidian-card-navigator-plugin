export interface IErrorHandler {
  handleError(error: Error, context: string): void;
} 