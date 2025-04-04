import { TFile } from 'obsidian';

/**
 * 활성 파일 감시자 인터페이스
 * - 옵시디언의 활성 파일 상태를 감시
 * - 활성 파일 변경 이벤트 처리
 */
export interface IActiveFileWatcher {
  /**
   * 서비스 초기화
   */
  initialize(): void;

  /**
   * 초기화 여부 확인
   */
  isInitialized(): boolean;

  /**
   * 서비스 정리
   */
  cleanup(): void;

  /**
   * 현재 활성 파일 조회
   */
  getActiveFile(): TFile | null;

  /**
   * 활성 파일 변경 이벤트 구독
   * @param callback 콜백 함수
   */
  subscribeToActiveFileChanges(callback: (file: TFile | null) => void): void;

  /**
   * 활성 파일 변경 이벤트 구독 해제
   * @param callback 콜백 함수
   */
  unsubscribeFromActiveFileChanges(callback: (file: TFile | null) => void): void;

  /**
   * 활성 파일 변경 이벤트 발생
   * @param file 활성 파일
   */
  notifyActiveFileChange(file: TFile | null): void;
} 