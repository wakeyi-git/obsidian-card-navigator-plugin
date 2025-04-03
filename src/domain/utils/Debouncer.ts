/**
 * 디바운스 유틸리티 클래스
 * 연속된 호출을 일정 시간 동안 기다린 후 마지막 호출만 실행
 */
export class Debouncer<T extends any[], R> {
  private timeoutId: number | null = null;
  private lastArgs: T | null = null;
  private lastResult: R | null = null;

  constructor(
    private readonly fn: (...args: T) => R,
    private readonly delay: number
  ) {}

  /**
   * 디바운스된 함수 호출
   * @param args 함수 인자
   * @returns 함수 실행 결과
   */
  public debounce(...args: T): R {
    this.lastArgs = args;

    if (this.timeoutId !== null) {
      window.clearTimeout(this.timeoutId);
    }

    this.timeoutId = window.setTimeout(() => {
      if (this.lastArgs) {
        this.lastResult = this.fn(...this.lastArgs);
      }
      this.timeoutId = null;
    }, this.delay);

    return this.lastResult as R;
  }

  /**
   * 디바운스 취소
   */
  public cancel(): void {
    if (this.timeoutId !== null) {
      window.clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    this.lastArgs = null;
    this.lastResult = null;
  }

  /**
   * 디바운스된 함수 즉시 실행
   * @param args 함수 인자
   * @returns 함수 실행 결과
   */
  public execute(...args: T): R {
    this.lastArgs = args;
    this.lastResult = this.fn(...args);
    return this.lastResult;
  }
} 