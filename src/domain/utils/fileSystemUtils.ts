import { TFile, TAbstractFile, TFolder } from 'obsidian';

/**
 * 파일 시스템 유틸리티
 */
export class FileSystemUtils {
  /**
   * 파일 경로에서 파일명 추출
   */
  static getFileName(filePath: string): string {
    return filePath.split('/').pop() || '';
  }

  /**
   * 파일 경로에서 확장자 추출
   */
  static getFileExtension(filePath: string): string {
    const fileName = this.getFileName(filePath);
    const extension = fileName.split('.').pop();
    return extension ? `.${extension}` : '';
  }

  /**
   * 파일 경로에서 디렉토리 경로 추출
   */
  static getDirectoryPath(filePath: string): string {
    const parts = filePath.split('/');
    parts.pop();
    return parts.join('/');
  }

  /**
   * 파일 경로가 유효한지 확인
   */
  static isValidFilePath(filePath: string): boolean {
    return /^[a-zA-Z0-9\-_/\.]+$/.test(filePath);
  }

  /**
   * 파일이 마크다운 파일인지 확인
   */
  static isMarkdownFile(file: TAbstractFile): boolean {
    return file instanceof TFile && file.extension === 'md';
  }

  /**
   * 파일이 폴더인지 확인
   */
  static isFolder(file: TAbstractFile): boolean {
    return file instanceof TFolder;
  }

  /**
   * 파일 경로가 특정 폴더 내에 있는지 확인
   */
  static isInFolder(filePath: string, folderPath: string): boolean {
    return filePath.startsWith(folderPath + '/');
  }

  /**
   * 파일 경로의 깊이 계산
   */
  static getPathDepth(filePath: string): number {
    return filePath.split('/').length - 1;
  }

  /**
   * 상대 경로를 절대 경로로 변환
   */
  static toAbsolutePath(relativePath: string, basePath: string): string {
    if (relativePath.startsWith('/')) {
      return relativePath;
    }
    return `${basePath}/${relativePath}`;
  }

  /**
   * 절대 경로를 상대 경로로 변환
   */
  static toRelativePath(absolutePath: string, basePath: string): string {
    if (!absolutePath.startsWith(basePath)) {
      return absolutePath;
    }
    return absolutePath.slice(basePath.length + 1);
  }

  /**
   * 파일 경로 정규화
   */
  static normalizePath(path: string): string {
    return path.replace(/\\/g, '/').replace(/\/+/g, '/');
  }

  /**
   * 파일 경로 결합
   */
  static joinPath(...paths: string[]): string {
    return paths
      .map(path => path.replace(/^\/+|\/+$/g, ''))
      .filter(Boolean)
      .join('/');
  }

  /**
   * 파일 경로 분리
   */
  static splitPath(path: string): string[] {
    return path.split('/').filter(Boolean);
  }

  /**
   * 파일 경로의 부모 경로 반환
   */
  static getParentPath(path: string): string {
    const parts = this.splitPath(path);
    parts.pop();
    return parts.join('/');
  }

  /**
   * 파일 경로의 마지막 부분 반환
   */
  static getBaseName(path: string): string {
    const parts = this.splitPath(path);
    return parts[parts.length - 1] || '';
  }
} 