/**
 * 기본 이벤트 클래스 - 모든 이벤트의 기본이 되는 클래스
 */
export abstract class BaseEvent {
  /**
   * 이벤트 발생 시간
   */
  public readonly timestamp: number;

  /**
   * 이벤트 생성자
   * @param type 이벤트 타입
   */
  constructor(public readonly type: string) {
    this.timestamp = Date.now();
  }
} 