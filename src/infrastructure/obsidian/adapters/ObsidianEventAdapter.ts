/**
 * Obsidian 이벤트 어댑터 인터페이스
 * Obsidian 이벤트를 도메인 이벤트로 변환하여 전파합니다.
 */
export interface IObsidianEventAdapter {
  /**
   * 이벤트 리스너 등록
   */
  registerEvents(): void;
  
  /**
   * 이벤트 리스너 제거
   */
  unregisterEvents(): void;
} 