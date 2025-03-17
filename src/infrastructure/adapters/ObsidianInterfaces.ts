import { App, TFile, TFolder, CachedMetadata, Workspace, Vault, MetadataCache, EventRef } from 'obsidian';
import { ICard } from '../../domain/card/Card';

/**
 * Obsidian 서비스 인터페이스
 * Obsidian 관련 기능을 제공하는 통합 인터페이스입니다.
 */
export interface IObsidianService extends IObsidianApp, IVault, IWorkspace, IMetadataCache {
  /**
   * 파일 내용 읽기
   * @param file 파일 객체
   * @returns 파일 내용
   */
  readFile(file: TFile): Promise<string>;
  
  /**
   * 파일 캐시 가져오기
   * @param file 파일 객체
   * @returns 파일 캐시 메타데이터
   */
  getFileCache(file: TFile): Promise<CachedMetadata>;
  
  /**
   * 파일을 카드로 변환
   * @param file 파일 객체
   * @returns 카드 객체
   */
  fileToCard(file: TFile): Promise<ICard>;
  
  /**
   * 모든 폴더 가져오기 (경로 문자열 형태)
   * @returns 폴더 경로 문자열 배열
   */
  getFolders(): string[];
  
  /**
   * 모든 폴더 경로 가져오기
   * @returns 폴더 경로 배열
   */
  getFolderPaths(): string[];
  
  /**
   * 모든 폴더를 객체 형태로 가져오기
   * @returns 폴더 객체 배열
   */
  getFoldersAsObjects(): TFolder[];

  /**
   * 프론트매터 키 제안 가져오기
   * @param query 검색어
   * @returns 프론트매터 키 제안 배열
   */
  getFrontmatterKeys(query: string): Promise<string[]>;

  /**
   * 프론트매터 값 제안 가져오기
   * @param key 프론트매터 키
   * @param query 검색어
   * @returns 프론트매터 값 제안 배열
   */
  getFrontmatterValues(key: string, query: string): Promise<string[]>;

  /**
   * 태그 제안 가져오기
   * @param query 검색어
   * @returns 태그 제안 배열
   */
  getTagSuggestions(query: string): Promise<string[]>;

  /**
   * 경로 제안 가져오기
   * @param query 검색어
   * @returns 경로 제안 배열
   */
  getPathSuggestions(query: string): Promise<string[]>;

  /**
   * 파일명 제안 가져오기
   * @param query 검색어
   * @returns 파일명 제안 배열
   */
  getFilenameSuggestions(query: string): Promise<string[]>;

  /**
   * 모든 태그 목록을 가져옵니다.
   * @returns 태그 목록
   */
  getTags(): string[];
}

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
   * 모든 폴더 가져오기 (경로 문자열 형태)
   * @returns 폴더 경로 문자열 배열
   */
  getFolders(): string[];
  
  /**
   * 모든 폴더를 객체 형태로 가져오기
   * @returns 폴더 객체 배열
   */
  getFoldersAsObjects(): TFolder[];
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
   * 이벤트 등록
   * @param event 이벤트 참조
   */
  registerEvent(event: EventRef): void;
}

/**
 * Workspace 이벤트 타입
 */
export type WorkspaceEventType = 
  | 'quick-preview'
  | 'file-open'
  | 'file-menu'
  | 'folder-menu'
  | 'active-leaf-change'
  | 'layout-change'
  | 'css-change'
  | 'resize'
  | 'click'
  | 'editor-change'
  | 'editor-paste'
  | 'editor-drop'
  | 'quit';

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