import { TFile } from 'obsidian';

/**
 * 파일 서비스 인터페이스
 * - 파일 열기
 * - 파일 편집
 * - 파일 간 링크 생성
 */
export interface IFileService {
  /**
   * 서비스 초기화
   */
  initialize(): void;

  /**
   * 서비스 정리
   */
  cleanup(): void;

  /**
   * 파일 열기
   * @param file 파일
   */
  openFile(file: TFile): Promise<void>;

  /**
   * 여러 파일 열기
   * @param files 파일 목록
   */
  openFiles(files: TFile[]): Promise<void>;

  /**
   * 파일 편집을 위해 열기
   * @param file 파일
   */
  openFileForEditing(file: TFile): Promise<void>;

  /**
   * 편집창에 링크 삽입
   * @param file 파일
   */
  insertLinkToEditor(file: TFile): Promise<void>;

  /**
   * 파일에 링크 삽입
   * @param sourceFile 소스 파일
   * @param targetFile 대상 파일
   */
  insertLinkToFile(sourceFile: TFile, targetFile: TFile): Promise<void>;
} 