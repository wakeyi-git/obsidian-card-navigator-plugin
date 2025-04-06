import { TFile } from 'obsidian';

/**
 * 파일 서비스 인터페이스
 */
export interface IFileService {
  /**
   * 파일을 엽니다.
   * @param file - 열 파일
   */
  openFile(file: TFile): Promise<void>;

  /**
   * 여러 파일을 엽니다.
   * @param files - 열 파일 목록
   */
  openFiles(files: TFile[]): Promise<void>;

  /**
   * 파일을 편집 모드로 엽니다.
   * @param file - 편집할 파일
   */
  openFileForEditing(file: TFile): Promise<void>;

  /**
   * 에디터에 링크를 삽입합니다.
   * @param file - 링크할 파일
   */
  insertLinkToEditor(file: TFile): Promise<void>;

  /**
   * 파일에 링크를 삽입합니다.
   * @param sourceFile - 링크를 삽입할 파일
   * @param targetFile - 링크할 파일
   */
  insertLinkToFile(sourceFile: TFile, targetFile: TFile): Promise<void>;
} 