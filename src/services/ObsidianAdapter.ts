import { App, TFile, MetadataCache, Vault, TFolder, CachedMetadata, Workspace, EventRef } from 'obsidian';
import { IObsidianAdapter, IVaultAdapter, IWorkspaceAdapter, IMetadataCacheAdapter } from '../domain/obsidian/ObsidianAdapter';
import { IVault, IWorkspace, IMetadataCache } from '../domain/obsidian/ObsidianInterfaces';

/**
 * Obsidian 어댑터
 * Obsidian API와의 상호작용을 담당합니다.
 */
export class ObsidianAdapter implements IObsidianAdapter {
  /**
   * Obsidian 앱 인스턴스
   */
  private app: App;
  private vaultAdapter: VaultAdapter;
  private workspaceAdapter: WorkspaceAdapter;
  private metadataCacheAdapter: MetadataCacheAdapter;
  
  /**
   * 생성자
   * @param app Obsidian 앱 인스턴스
   */
  constructor(app: App) {
    this.app = app;
    this.vaultAdapter = new VaultAdapter(app.vault);
    this.workspaceAdapter = new WorkspaceAdapter(app.workspace);
    this.metadataCacheAdapter = new MetadataCacheAdapter(app.metadataCache, app);
  }
  
  /**
   * Obsidian 앱 인스턴스 반환
   * @returns App 인스턴스
   */
  public getApp(): App {
    return this.app;
  }
  
  /**
   * Vault 어댑터 반환
   * @returns Vault 어댑터
   */
  public getVault(): IVault {
    return this.vaultAdapter;
  }
  
  /**
   * Workspace 어댑터 반환
   * @returns Workspace 어댑터
   */
  public getWorkspace(): IWorkspace {
    return this.workspaceAdapter;
  }
  
  /**
   * MetadataCache 어댑터 반환
   * @returns MetadataCache 어댑터
   */
  public getMetadataCache(): IMetadataCache {
    return this.metadataCacheAdapter;
  }
  
  /**
   * 파일 열기
   * @param path 파일 경로
   */
  public async openFile(path: string): Promise<void> {
    const file = this.getFileByPath(path);
    if (!file) return;
    
    await this.app.workspace.getLeaf().openFile(file);
  }
  
  /**
   * 파일을 편집 모드로 열기
   * @param path 파일 경로
   */
  public async openFileInEditMode(path: string): Promise<void> {
    const file = this.getFileByPath(path);
    if (!file) return;
    
    const leaf = this.app.workspace.getLeaf();
    await leaf.openFile(file);
    
    // 편집 모드로 전환
    leaf.setEphemeralState({ mode: 'source' });
  }
  
  /**
   * 새 노트 생성 다이얼로그 표시
   * @param options 옵션
   */
  public showNewNoteDialog(options: { onSubmit: (path: string) => void }): void {
    // 새 노트 생성 다이얼로그 표시 로직
    // Obsidian API를 사용하여 구현
  }
  
  /**
   * 새 노트 생성
   * @param path 파일 경로
   * @returns 생성된 파일
   */
  public async createNewNote(path: string): Promise<TFile | null> {
    try {
      return await this.app.vault.create(path, '');
    } catch (error) {
      console.error('노트 생성 중 오류 발생:', error);
      return null;
    }
  }
  
  /**
   * 이벤트 리스너 해제
   */
  public unregisterEvents(): void {
    // 이벤트 리스너 해제 로직
  }
  
  /**
   * 경로로 파일 가져오기
   * @param path 파일 경로
   * @returns 파일 객체
   */
  private getFileByPath(path: string): TFile | null {
    const file = this.app.vault.getAbstractFileByPath(path);
    if (file instanceof TFile) {
      return file;
    }
    return null;
  }
}

/**
 * Vault 어댑터 클래스
 * Obsidian의 Vault 기능을 추상화하여 제공합니다.
 */
export class VaultAdapter implements IVaultAdapter {
  private vault: Vault;
  
  /**
   * 생성자
   * @param vault Obsidian Vault 인스턴스
   */
  constructor(vault: Vault) {
    this.vault = vault;
  }
  
  /**
   * 원본 Vault 인스턴스 가져오기
   */
  getVault(): Vault {
    return this.vault;
  }
  
  /**
   * 모든 마크다운 파일 가져오기
   */
  getMarkdownFiles(): TFile[] {
    return this.vault.getMarkdownFiles();
  }
  
  /**
   * 특정 폴더의 마크다운 파일 가져오기
   * @param folderPath 폴더 경로
   * @param recursive 하위 폴더 포함 여부
   */
  getMarkdownFilesInFolder(folderPath: string, recursive: boolean): TFile[] {
    const folder = this.getFolder(folderPath);
    if (!folder) return [];
    
    const files = this.getMarkdownFiles();
    return files.filter(file => {
      if (recursive) {
        return file.path.startsWith(folder.path);
      } else {
        const filePath = file.path;
        const folderPathWithSlash = folder.path.endsWith('/') ? folder.path : folder.path + '/';
        const relativePath = filePath.substring(folderPathWithSlash.length);
        return filePath.startsWith(folderPathWithSlash) && !relativePath.includes('/');
      }
    });
  }
  
  /**
   * 파일 내용 읽기
   * @param file 파일 객체
   */
  async read(file: TFile): Promise<string> {
    return await this.vault.read(file);
  }
  
  /**
   * 파일 내용 쓰기
   * @param file 파일 객체
   * @param content 파일 내용
   */
  async write(file: TFile, content: string): Promise<void> {
    await this.vault.modify(file, content);
  }
  
  /**
   * 폴더 가져오기
   * @param path 폴더 경로
   */
  getFolder(path: string): TFolder | null {
    const abstractFile = this.vault.getAbstractFileByPath(path);
    if (abstractFile instanceof TFolder) {
      return abstractFile;
    }
    return null;
  }
  
  /**
   * 모든 폴더 가져오기
   */
  getFolders(): TFolder[] {
    const folders: TFolder[] = [];
    this.vault.getAllLoadedFiles().forEach(file => {
      if (file instanceof TFolder) {
        folders.push(file);
      }
    });
    return folders;
  }
}

/**
 * Workspace 어댑터 클래스
 * Obsidian의 Workspace 기능을 추상화하여 제공합니다.
 */
export class WorkspaceAdapter implements IWorkspaceAdapter {
  private workspace: Workspace;
  
  /**
   * 생성자
   * @param workspace Obsidian Workspace 인스턴스
   */
  constructor(workspace: Workspace) {
    this.workspace = workspace;
  }
  
  /**
   * 원본 Workspace 인스턴스 가져오기
   */
  getWorkspace(): Workspace {
    return this.workspace;
  }
  
  /**
   * 현재 활성화된 파일 가져오기
   */
  getActiveFile(): TFile | null {
    return this.workspace.getActiveFile();
  }
  
  /**
   * 이벤트 리스너 등록
   * @param event 이벤트 이름
   * @param callback 콜백 함수
   */
  on(event: string, callback: (...args: any[]) => any): EventRef {
    // @ts-ignore - Obsidian API의 타입 정의가 완전하지 않아 무시
    return this.workspace.on(event, callback);
  }
  
  /**
   * 이벤트 리스너 제거
   * @param event 이벤트 이름
   * @param callback 콜백 함수
   */
  off(event: string, callback: (...args: any[]) => any): void {
    // @ts-ignore - Obsidian API의 타입 정의가 완전하지 않아 무시
    this.workspace.off(event, callback);
  }
  
  /**
   * 이벤트 트리거
   * @param event 이벤트 이름
   * @param args 이벤트 인자
   */
  trigger(event: string, ...args: any[]): void {
    // @ts-ignore - Obsidian API의 타입 정의가 완전하지 않아 무시
    this.workspace.trigger(event, ...args);
  }
}

/**
 * MetadataCache 어댑터 클래스
 * Obsidian의 MetadataCache 기능을 추상화하여 제공합니다.
 */
export class MetadataCacheAdapter implements IMetadataCacheAdapter {
  private metadataCache: MetadataCache;
  private app: App;
  
  /**
   * 생성자
   * @param metadataCache Obsidian MetadataCache 인스턴스
   * @param app Obsidian App 인스턴스
   */
  constructor(metadataCache: MetadataCache, app: App) {
    this.metadataCache = metadataCache;
    this.app = app;
  }
  
  /**
   * 원본 MetadataCache 인스턴스 가져오기
   */
  getMetadataCache(): MetadataCache {
    return this.metadataCache;
  }
  
  /**
   * 파일 메타데이터 가져오기
   * @param file 파일 객체
   */
  getFileMetadata(file: TFile): CachedMetadata | null {
    return this.metadataCache.getFileCache(file);
  }
  
  /**
   * 태그로 파일 검색
   * @param tag 태그
   */
  getFilesWithTag(tag: string): TFile[] {
    const files: TFile[] = [];
    const allFiles = this.app.vault.getMarkdownFiles();
    
    for (const file of allFiles) {
      const metadata = this.metadataCache.getFileCache(file);
      if (metadata && metadata.tags) {
        const hasTag = metadata.tags.some(t => t.tag === tag || t.tag === '#' + tag);
        if (hasTag) {
          files.push(file);
        }
      }
    }
    
    return files;
  }
  
  /**
   * 프론트매터 키로 파일 검색
   * @param key 프론트매터 키
   * @param value 프론트매터 값
   */
  getFilesWithFrontmatter(key: string, value?: any): TFile[] {
    const files: TFile[] = [];
    const allFiles = this.app.vault.getMarkdownFiles();
    
    for (const file of allFiles) {
      const metadata = this.metadataCache.getFileCache(file);
      if (metadata && metadata.frontmatter) {
        const frontmatterValue = metadata.frontmatter[key];
        if (frontmatterValue !== undefined) {
          if (value === undefined || frontmatterValue === value) {
            files.push(file);
          }
        }
      }
    }
    
    return files;
  }
} 