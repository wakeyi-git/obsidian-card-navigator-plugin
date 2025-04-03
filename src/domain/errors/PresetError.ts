/**
 * 프리셋 에러 클래스
 */
export class PresetError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PresetError';
  }

  /**
   * 에러 정보를 문자열로 변환
   */
  toString(): string {
    const details = [
      this.message,
    ].filter(Boolean);

    return details.join('\n');
  }
} 