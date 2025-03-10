import { App, TFile, TFolder, CachedMetadata, Workspace, Vault, MetadataCache, EventRef } from 'obsidian';

/**
 * Obsidian 앱 인터페이스
 * Obsidian 앱의 주요 기능을 추상화합니다.
 */
export interface IObsidianApp {
  /**
   * Vault 인스턴스 가져오기
   */
  getVault(): Vault;
  
  /**
   * MetadataCache 인스턴스 가져오기
   */
  getMetadataCache(): MetadataCache;
  
  /**
   * 파일 열기
   * @param path 파일 경로
   */
  openFile(path: string): Promise<void>;
  
  /**
   * 파일을 편집 모드로 열기
   * @param path 파일 경로
   */
  openFileInEditMode(path: string): Promise<void>;
  
  /**
   * 새 노트 생성 다이얼로그 표시
   * @param options 옵션
   */
  showNewNoteDialog(options: { onSubmit: (path: string) => void }): void;
  
  /**
   * 새 노트 생성
   * @param path 파일 경로
   * @returns 생성된 파일
   */
  createNewNote(path: string): Promise<TFile | null>;
  
  /**
   * 이벤트 리스너 해제
   */
  unregisterEvents(): void;
}

/**
 * Vault 인터페이스
 * Obsidian의 Vault 기능을 추상화합니다.
 */
export interface IVault {
  /**
   * 원본 Vault 인스턴스 가져오기
   */
  getVault(): Vault;
  
  /**
   * 모든 마크다운 파일 가져오기
   */
  getMarkdownFiles(): TFile[];
  
  /**
   * 특정 폴더의 마크다운 파일 가져오기
   * @param folderPath 폴더 경로
   * @param recursive 하위 폴더 포함 여부
   */
  getMarkdownFilesInFolder(folderPath: string, recursive: boolean): TFile[];
  
  /**
   * 파일 내용 읽기
   * @param file 파일 객체
   */
  read(file: TFile): Promise<string>;
  
  /**
   * 파일 내용 쓰기
   * @param file 파일 객체
   * @param content 파일 내용
   */
  write(file: TFile, content: string): Promise<void>;
  
  /**
   * 폴더 가져오기
   * @param path 폴더 경로
   */
  getFolder(path: string): TFolder | null;
  
  /**
   * 모든 폴더 가져오기
   */
  getFolders(): TFolder[];
}

/**
 * Workspace 인터페이스
 * Obsidian의 Workspace 기능을 추상화합니다.
 */
export interface IWorkspace {
  /**
   * 원본 Workspace 인스턴스 가져오기
   */
  getWorkspace(): Workspace;
  
  /**
   * 현재 활성화된 파일 가져오기
   */
  getActiveFile(): TFile | null;
  
  /**
   * 이벤트 리스너 등록
   * @param event 이벤트 이름
   * @param callback 콜백 함수
   */
  on(event: string, callback: (...args: any[]) => any): EventRef;
  
  /**
   * 이벤트 리스너 제거
   * @param event 이벤트 이름
   * @param callback 콜백 함수
   */
  off(event: string, callback: (...args: any[]) => any): void;
  
  /**
   * 이벤트 트리거
   * @param event 이벤트 이름
   * @param args 이벤트 인자
   */
  trigger(event: string, ...args: any[]): void;
}

/**
 * MetadataCache 인터페이스
 * Obsidian의 MetadataCache 기능을 추상화합니다.
 */
export interface IMetadataCache {
  /**
   * 원본 MetadataCache 인스턴스 가져오기
   */
  getMetadataCache(): MetadataCache;
  
  /**
   * 파일 메타데이터 가져오기
   * @param file 파일 객체
   */
  getFileMetadata(file: TFile): CachedMetadata | null;
  
  /**
   * 태그로 파일 검색
   * @param tag 태그
   */
  getFilesWithTag(tag: string): TFile[];
  
  /**
   * 프론트매터 키로 파일 검색
   * @param key 프론트매터 키
   * @param value 프론트매터 값
   */
  getFilesWithFrontmatter(key: string, value?: any): TFile[];
} 