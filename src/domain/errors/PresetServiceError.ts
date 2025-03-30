/**
 * 프리셋 서비스 에러 클래스
 */
export class PresetServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PresetServiceError';
  }
} 