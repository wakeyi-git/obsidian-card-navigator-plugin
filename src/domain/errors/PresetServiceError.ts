/**
 * 프리셋 서비스 에러 클래스
 */
export class PresetServiceError extends Error {
  constructor(
    message: string,
    public readonly presetId?: string,
    public readonly presetName?: string,
    public readonly operation?: 'create' | 'update' | 'delete' | 'load' | 'apply' | 'initialize' | 'cleanup' | 'export' | 'import' | 'mapFolder' | 'mapTag' | 'removeMapping' | 'updatePriority',
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'PresetServiceError';
  }

  /**
   * 에러 정보를 문자열로 변환
   */
  toString(): string {
    const details = [
      this.message,
      this.presetId && `프리셋 ID: ${this.presetId}`,
      this.presetName && `프리셋 이름: ${this.presetName}`,
      this.operation && `작업: ${this.operation}`,
      this.cause && `원인: ${this.cause.message}`
    ].filter(Boolean);

    return details.join('\n');
  }
} 