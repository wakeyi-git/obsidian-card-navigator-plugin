import { TFile, TFolder } from 'obsidian';

/**
 * 파일 서비스 인터페이스
 * Obsidian의 파일 시스템과 상호작용하는 기능을 제공합니다.
 */
export interface IFileService {
  /**
   * 지정된 경로의 파일을 가져옵니다.
   * @param path 파일 경로
   * @returns 파일 객체 또는 null
   */
  getFile(path: string): TFile | null;

  /**
   * 지정된 경로의 폴더를 가져옵니다.
   * @param path 폴더 경로
   * @returns 폴더 객체 또는 null
   */
  getFolder(path: string): TFolder | null;

  /**
   * 지정된 폴더의 모든 마크다운 파일을 가져옵니다.
   * @param folderPath 폴더 경로
   * @param recursive 하위 폴더 포함 여부
   * @param sortByName 이름으로 정렬 여부
   * @returns 파일 배열
   */
  getMarkdownFiles(folderPath: string, recursive?: boolean, sortByName?: boolean): TFile[];

  /**
   * 볼트의 모든 마크다운 파일을 가져옵니다.
   * @returns 파일 배열
   */
  getAllMarkdownFiles(): TFile[];

  /**
   * 파일이 존재하는지 확인합니다.
   * @param path 파일 경로
   * @returns 존재 여부
   */
  fileExists(path: string): boolean;

  /**
   * 폴더가 존재하는지 확인합니다.
   * @param path 폴더 경로
   * @returns 존재 여부
   */
  folderExists(path: string): boolean;

  /**
   * 파일이 마크다운 파일인지 확인합니다.
   * @param file 파일 객체
   * @returns 마크다운 파일 여부
   */
  isMarkdownFile(file: TFile): boolean;

  /**
   * 파일이 이미지 파일인지 확인합니다.
   * @param file 파일 객체
   * @returns 이미지 파일 여부
   */
  isImageFile(file: TFile): boolean;
  
  /**
   * 파일의 내용을 가져옵니다.
   * @param file 파일 객체
   * @returns 파일 내용
   */
  getFileContent(file: TFile): Promise<string>;
  
  /**
   * 파일을 삭제합니다.
   * @param file 파일 객체
   * @returns 삭제 성공 여부
   */
  deleteFile(file: TFile): Promise<boolean>;
} 