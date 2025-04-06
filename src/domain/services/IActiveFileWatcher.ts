import { TFile } from 'obsidian';

/**
 * 활성 파일 감시자 인터페이스
 * - 옵시디언의 활성 파일 상태를 감시
 * - 활성 파일 변경 이벤트 처리
 */
export interface IActiveFileWatcher {
  /**
   * 초기화
   */
  initialize(): void;

  /**
   * 초기화 여부 확인
   */
  isInitialized(): boolean;

  /**
   * 정리
   */
  cleanup(): void;

  /**
   * 현재 활성 파일 조회
   */
  getActiveFile(): TFile | null;

  /**
   * 활성 파일 변경 이벤트 발생
   */
  notifyFileChange(file: TFile | null): void;

  /**
   * 감시 시작
   */
  start(): void;

  /**
   * 감시 중지
   */
  stop(): void;
} 