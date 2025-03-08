/**
 * 타이머 유틸리티 클래스
 * 성능 측정을 위한 타이머 관리 유틸리티입니다.
 */
export class TimerUtil {
  private static activeTimers: Set<string> = new Set();
  private static timerCounter: number = 0;
  
  /**
   * 타이머 시작
   * 고유한 타이머 ID를 생성하고 타이머를 시작합니다.
   * @param baseLabel 타이머 기본 레이블
   * @returns 생성된 타이머 ID
   */
  static startTimer(baseLabel: string): string {
    // 고유한 타이머 ID 생성
    const timerId = `${baseLabel}-${Date.now()}-${this.timerCounter++}`;
    
    // 타이머가 이미 존재하는지 확인
    if (this.activeTimers.has(timerId)) {
      console.warn(`타이머 '${timerId}'가 이미 존재합니다.`);
      return timerId;
    }
    
    // 타이머 시작
    this.activeTimers.add(timerId);
    console.time(timerId);
    return timerId;
  }
  
  /**
   * 타이머 종료
   * 지정된 타이머를 종료합니다.
   * @param timerId 타이머 ID
   */
  static endTimer(timerId: string): void {
    // 타이머가 존재하는지 확인
    if (!this.activeTimers.has(timerId)) {
      console.warn(`타이머 '${timerId}'가 존재하지 않습니다.`);
      return;
    }
    
    // 타이머 종료
    console.timeEnd(timerId);
    this.activeTimers.delete(timerId);
  }
  
  /**
   * 모든 타이머 종료
   * 활성화된 모든 타이머를 종료합니다.
   */
  static endAllTimers(): void {
    this.activeTimers.forEach(timerId => {
      console.timeEnd(timerId);
    });
    this.activeTimers.clear();
  }
  
  /**
   * 타이머 존재 여부 확인
   * @param timerId 타이머 ID
   * @returns 타이머 존재 여부
   */
  static hasTimer(timerId: string): boolean {
    return this.activeTimers.has(timerId);
  }
} 