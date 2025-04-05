/**
 * 쓰로틀 유틸리티 클래스
 * 일정 시간 내에 함수가 최대 한 번만 실행되도록 보장
 */
export class Throttler<T extends any[], R> {
  private lastCallTime: number = 0;
  private lastResult: R | null = null;
  private pendingCall: boolean = false;
  private pendingArgs: T | null = null;

  constructor(
    private readonly fn: (...args: T) => R,
    private readonly delay: number
  ) {}

  /**
   * 쓰로틀된 함수 호출
   * @param args 함수 인자
   * @returns 함수 실행 결과 또는 마지막 실행 결과
   */
  public throttle(...args: T): R {
    const now = Date.now();
    
    // 마지막 호출 이후 지정된 딜레이만큼 시간이 지났는지 확인
    if (now - this.lastCallTime >= this.delay) {
      // 마지막 호출로부터 충분한 시간이 지났으므로 즉시 실행
      return this.executeNow(args);
    }
    
    // 아직 딜레이 내에 있고, 대기 중인 호출이 없으면 다음 딜레이 후에 실행될 호출 예약
    if (!this.pendingCall) {
      this.pendingCall = true;
      this.pendingArgs = args;
      
      const timeUntilNextCall = this.delay - (now - this.lastCallTime);
      setTimeout(() => {
        if (this.pendingArgs) {
          this.executeNow(this.pendingArgs);
          this.pendingCall = false;
          this.pendingArgs = null;
        }
      }, timeUntilNextCall);
    } else {
      // 이미 대기 중인 호출이 있으면 인자만 새 것으로 업데이트
      this.pendingArgs = args;
    }
    
    // 딜레이 내에 있으면 마지막 실행 결과 반환
    return this.lastResult as R;
  }
  
  /**
   * 쓰로틀 무시하고 함수 즉시 실행
   * @param args 함수 인자
   * @returns 함수 실행 결과
   */
  public executeNow(args: T): R {
    this.lastCallTime = Date.now();
    this.lastResult = this.fn(...args);
    return this.lastResult;
  }
  
  /**
   * 대기 중인 호출 취소
   */
  public cancel(): void {
    this.pendingCall = false;
    this.pendingArgs = null;
  }
  
  /**
   * 마지막 실행 결과 가져오기
   */
  public getLastResult(): R | null {
    return this.lastResult;
  }
} 