import { TFile } from 'obsidian';

/**
 * 클립보드 서비스 인터페이스
 * - 파일 링크 복사
 * - 파일 내용 복사
 * - 여러 파일의 링크/내용 복사
 */
export interface IClipboardService {
  /**
   * 서비스 초기화
   */
  initialize(): void;

  /**
   * 서비스 정리
   */
  cleanup(): void;

  /**
   * 파일 링크 복사
   * @param file 파일
   */
  copyLink(file: TFile): Promise<void>;

  /**
   * 파일 내용 복사
   * @param file 파일
   */
  copyContent(file: TFile): Promise<void>;

  /**
   * 여러 파일의 링크 복사
   * @param files 파일 목록
   */
  copyLinks(files: TFile[]): Promise<void>;

  /**
   * 여러 파일의 내용 복사
   * @param files 파일 목록
   */
  copyContents(files: TFile[]): Promise<void>;
} 