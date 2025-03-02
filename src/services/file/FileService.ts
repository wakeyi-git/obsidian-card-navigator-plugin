import { App, TFile, TFolder, Vault, normalizePath } from 'obsidian';
import { ErrorHandler } from '../../utils/error/ErrorHandler';
import { Log } from '../../utils/log/Log';
import { getMarkdownFilesFromFolder } from '../../utils/helpers/file.helper';

/**
 * FileService 클래스는 Obsidian의 파일 시스템과 상호작용하는 기능을 제공합니다.
 */
export class FileService {
  private app: App;
  private vault: Vault;

  /**
   * FileService 생성자
   * @param app Obsidian 앱 인스턴스
   */
  constructor(app: App) {
    this.app = app;
    this.vault = app.vault;
    
    Log.debug('FileService', '파일 서비스 초기화 완료');
  }

  /**
   * 지정된 경로의 파일을 가져옵니다.
   * @param path 파일 경로
   * @returns 파일 객체 또는 null
   */
  public getFile(path: string): TFile | null {
    try {
      const normalizedPath = normalizePath(path);
      const file = this.vault.getAbstractFileByPath(normalizedPath);
      
      if (!file || !(file instanceof TFile)) {
        return null;
      }
      
      return file;
    } catch (error) {
      ErrorHandler.handleError(`파일 가져오기 실패: ${path}`, error);
      return null;
    }
  }

  /**
   * 지정된 경로의 폴더를 가져옵니다.
   * @param path 폴더 경로
   * @returns 폴더 객체 또는 null
   */
  public getFolder(path: string): TFolder | null {
    try {
      const normalizedPath = normalizePath(path);
      const folder = this.vault.getAbstractFileByPath(normalizedPath);
      
      if (!folder || !(folder instanceof TFolder)) {
        return null;
      }
      
      return folder;
    } catch (error) {
      ErrorHandler.handleError(`폴더 가져오기 실패: ${path}`, error);
      return null;
    }
  }

  /**
   * 지정된 폴더의 모든 마크다운 파일을 가져옵니다.
   * @param folderPath 폴더 경로
   * @param recursive 하위 폴더 포함 여부
   * @param includeHidden 숨김 파일 포함 여부
   * @returns 마크다운 파일 배열
   */
  public getMarkdownFiles(folderPath: string, recursive: boolean = true, includeHidden: boolean = false): TFile[] {
    try {
      const folder = this.getFolder(folderPath);
      
      if (!folder) {
        Log.warn('FileService', `폴더를 찾을 수 없음: ${folderPath}`);
        return [];
      }
      
      return getMarkdownFilesFromFolder(folder, recursive, includeHidden);
    } catch (error) {
      ErrorHandler.handleError(`마크다운 파일 가져오기 실패: ${folderPath}`, error);
      return [];
    }
  }

  /**
   * 볼트의 모든 마크다운 파일을 가져옵니다.
   * @param includeHidden 숨김 파일 포함 여부
   * @returns 마크다운 파일 배열
   */
  public getAllMarkdownFiles(includeHidden: boolean = false): TFile[] {
    try {
      return this.getMarkdownFiles('/', true, includeHidden);
    } catch (error) {
      ErrorHandler.handleError('모든 마크다운 파일 가져오기 실패', error);
      return [];
    }
  }

  /**
   * 활성 파일을 가져옵니다.
   * @returns 활성 파일 또는 null
   */
  public getActiveFile(): TFile | null {
    try {
      return this.app.workspace.getActiveFile();
    } catch (error) {
      ErrorHandler.handleError('활성 파일 가져오기 실패', error);
      return null;
    }
  }

  /**
   * 활성 파일이 위치한 폴더의 경로를 가져옵니다.
   * @returns 활성 폴더 경로 또는 null
   */
  public getActiveFolderPath(): string | null {
    try {
      const activeFile = this.getActiveFile();
      
      if (!activeFile) {
        return null;
      }
      
      const pathParts = activeFile.path.split('/');
      pathParts.pop(); // 파일명 제거
      
      return pathParts.join('/');
    } catch (error) {
      ErrorHandler.handleError('활성 폴더 경로 가져오기 실패', error);
      return null;
    }
  }

  /**
   * 파일 내용을 가져옵니다.
   * @param file 파일 객체
   * @returns 파일 내용 또는 null
   */
  public async getFileContent(file: TFile): Promise<string | null> {
    try {
      return await this.vault.read(file);
    } catch (error) {
      ErrorHandler.handleError(`파일 내용 가져오기 실패: ${file.path}`, error);
      return null;
    }
  }

  /**
   * 파일을 생성합니다.
   * @param path 파일 경로
   * @param content 파일 내용
   * @returns 생성된 파일 또는 null
   */
  public async createFile(path: string, content: string = ''): Promise<TFile | null> {
    try {
      const normalizedPath = normalizePath(path);
      
      // 이미 존재하는 파일인지 확인
      const existingFile = this.getFile(normalizedPath);
      if (existingFile) {
        Log.warn('FileService', `파일이 이미 존재함: ${normalizedPath}`);
        return existingFile;
      }
      
      // 파일 생성
      const file = await this.vault.create(normalizedPath, content);
      Log.debug('FileService', `파일 생성 완료: ${normalizedPath}`);
      
      return file;
    } catch (error) {
      ErrorHandler.handleError(`파일 생성 실패: ${path}`, error);
      return null;
    }
  }

  /**
   * 파일 내용을 수정합니다.
   * @param file 파일 객체
   * @param content 새 파일 내용
   * @returns 성공 여부
   */
  public async updateFile(file: TFile, content: string): Promise<boolean> {
    try {
      await this.vault.modify(file, content);
      Log.debug('FileService', `파일 수정 완료: ${file.path}`);
      
      return true;
    } catch (error) {
      ErrorHandler.handleError(`파일 수정 실패: ${file.path}`, error);
      return false;
    }
  }

  /**
   * 파일을 삭제합니다.
   * @param file 파일 객체
   * @returns 성공 여부
   */
  public async deleteFile(file: TFile): Promise<boolean> {
    try {
      await this.vault.delete(file);
      Log.debug('FileService', `파일 삭제 완료: ${file.path}`);
      
      return true;
    } catch (error) {
      ErrorHandler.handleError(`파일 삭제 실패: ${file.path}`, error);
      return false;
    }
  }

  /**
   * 파일 이름을 변경합니다.
   * @param file 파일 객체
   * @param newPath 새 파일 경로
   * @returns 성공 여부
   */
  public async renameFile(file: TFile, newPath: string): Promise<boolean> {
    try {
      const normalizedPath = normalizePath(newPath);
      
      await this.vault.rename(file, normalizedPath);
      Log.debug('FileService', `파일 이름 변경 완료: ${file.path} -> ${normalizedPath}`);
      
      return true;
    } catch (error) {
      ErrorHandler.handleError(`파일 이름 변경 실패: ${file.path} -> ${newPath}`, error);
      return false;
    }
  }

  /**
   * 폴더를 생성합니다.
   * @param path 폴더 경로
   * @returns 생성된 폴더 또는 null
   */
  public async createFolder(path: string): Promise<TFolder | null> {
    try {
      const normalizedPath = normalizePath(path);
      
      // 이미 존재하는 폴더인지 확인
      const existingFolder = this.getFolder(normalizedPath);
      if (existingFolder) {
        Log.warn('FileService', `폴더가 이미 존재함: ${normalizedPath}`);
        return existingFolder;
      }
      
      // 폴더 생성
      const folder = await this.vault.createFolder(normalizedPath);
      Log.debug('FileService', `폴더 생성 완료: ${normalizedPath}`);
      
      return folder;
    } catch (error) {
      ErrorHandler.handleError(`폴더 생성 실패: ${path}`, error);
      return null;
    }
  }

  /**
   * 폴더를 삭제합니다.
   * @param folder 폴더 객체
   * @returns 성공 여부
   */
  public async deleteFolder(folder: TFolder): Promise<boolean> {
    try {
      await this.vault.delete(folder);
      Log.debug('FileService', `폴더 삭제 완료: ${folder.path}`);
      
      return true;
    } catch (error) {
      ErrorHandler.handleError(`폴더 삭제 실패: ${folder.path}`, error);
      return false;
    }
  }

  /**
   * 파일을 열어 편집합니다.
   * @param file 파일 객체
   * @param newLeaf 새 탭에서 열기 여부
   * @returns 성공 여부
   */
  public async openFile(file: TFile, newLeaf: boolean = false): Promise<boolean> {
    try {
      await this.app.workspace.getLeaf(newLeaf).openFile(file);
      Log.debug('FileService', `파일 열기 완료: ${file.path}`);
      
      return true;
    } catch (error) {
      ErrorHandler.handleError(`파일 열기 실패: ${file.path}`, error);
      return false;
    }
  }

  /**
   * 파일이 존재하는지 확인합니다.
   * @param path 파일 경로
   * @returns 존재 여부
   */
  public fileExists(path: string): boolean {
    return this.getFile(path) !== null;
  }

  /**
   * 폴더가 존재하는지 확인합니다.
   * @param path 폴더 경로
   * @returns 존재 여부
   */
  public folderExists(path: string): boolean {
    return this.getFolder(path) !== null;
  }

  /**
   * 파일 경로에서 파일 이름을 추출합니다.
   * @param path 파일 경로
   * @param includeExtension 확장자 포함 여부
   * @returns 파일 이름
   */
  public getFileName(path: string, includeExtension: boolean = true): string {
    const normalizedPath = normalizePath(path);
    const pathParts = normalizedPath.split('/');
    const fileName = pathParts.pop() || '';
    
    if (!includeExtension) {
      const nameParts = fileName.split('.');
      if (nameParts.length > 1) {
        nameParts.pop();
        return nameParts.join('.');
      }
    }
    
    return fileName;
  }

  /**
   * 파일 경로에서 폴더 경로를 추출합니다.
   * @param path 파일 경로
   * @returns 폴더 경로
   */
  public getFolderPath(path: string): string {
    const normalizedPath = normalizePath(path);
    const pathParts = normalizedPath.split('/');
    pathParts.pop();
    
    return pathParts.join('/');
  }

  /**
   * 파일 경로에서 확장자를 추출합니다.
   * @param path 파일 경로
   * @returns 확장자
   */
  public getFileExtension(path: string): string {
    const fileName = this.getFileName(path);
    const nameParts = fileName.split('.');
    
    if (nameParts.length > 1) {
      return nameParts.pop() || '';
    }
    
    return '';
  }

  /**
   * 파일이 마크다운 파일인지 확인합니다.
   * @param file 파일 객체
   * @returns 마크다운 파일 여부
   */
  public isMarkdownFile(file: TFile): boolean {
    return file.extension === 'md';
  }

  /**
   * 파일이 이미지 파일인지 확인합니다.
   * @param file 파일 객체
   * @returns 이미지 파일 여부
   */
  public isImageFile(file: TFile): boolean {
    const imageExtensions = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'svg', 'webp'];
    return imageExtensions.includes(file.extension.toLowerCase());
  }

  /**
   * 파일이 숨김 파일인지 확인합니다.
   * @param file 파일 객체
   * @returns 숨김 파일 여부
   */
  public isHiddenFile(file: TFile): boolean {
    return file.path.startsWith('.') || file.path.contains('/.') || file.path.contains('/_');
  }
} 