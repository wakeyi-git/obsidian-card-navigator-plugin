import { App, CachedMetadata, EventRef, MetadataCache, Plugin, TFile, TFolder, Vault, View, Workspace, WorkspaceLeaf } from 'obsidian';
import { IObsidianApp, IVault, IWorkspace } from '../../domain/obsidian/ObsidianInterfaces';

/**
 * Obsidian 서비스
 * Obsidian API를 추상화하여 플러그인 내에서 일관된 방식으로 Obsidian 기능을 사용할 수 있게 합니다.
 */
export class ObsidianService implements IObsidianApp, IVault, IWorkspace {
  private app: App;
  private plugin: Plugin;
  
  /**
   * 생성자
   * @param app Obsidian App 인스턴스
   * @param plugin 플러그인 인스턴스
   */
  constructor(app: App, plugin: Plugin) {
    this.app = app;
    this.plugin = plugin;
  }
  
  // IObsidianApp 인터페이스 구현
  
  /**
   * Vault 인스턴스 가져오기
   * @returns Vault 인스턴스
   */
  getVault(): Vault {
    return this.app.vault;
  }
  
  /**
   * MetadataCache 인스턴스 가져오기
   * @returns MetadataCache 인스턴스
   */
  getMetadataCache(): MetadataCache {
    return this.app.metadataCache;
  }
  
  /**
   * 파일 열기
   * @param path 파일 경로
   */
  async openFile(path: string): Promise<void> {
    const file = this.app.vault.getAbstractFileByPath(path);
    if (file instanceof TFile) {
      await this.app.workspace.getLeaf().openFile(file);
    }
  }
  
  /**
   * 파일을 편집 모드로 열기
   * @param path 파일 경로
   */
  async openFileInEditMode(path: string): Promise<void> {
    const file = this.app.vault.getAbstractFileByPath(path);
    if (file instanceof TFile) {
      const leaf = this.app.workspace.getLeaf();
      await leaf.openFile(file);
      leaf.setEphemeralState({ mode: 'source' });
    }
  }
  
  /**
   * 새 노트 생성 다이얼로그 표시
   * @param options 옵션
   */
  showNewNoteDialog(options: { onSubmit: (path: string) => void }): void {
    // 구현 필요
  }
  
  /**
   * 새 노트 생성
   * @param path 파일 경로
   * @returns 생성된 파일
   */
  async createNewNote(path: string): Promise<TFile | null> {
    try {
      return await this.app.vault.create(path, '');
    } catch (error) {
      console.error('노트 생성 실패:', error);
      return null;
    }
  }
  
  /**
   * 이벤트 리스너 해제
   */
  unregisterEvents(): void {
    // 구현 필요
  }
  
  // IVault 인터페이스 구현
  
  /**
   * 원본 Vault 인스턴스 가져오기
   */
  getVaultInstance(): Vault {
    return this.app.vault;
  }
  
  /**
   * 모든 마크다운 파일 가져오기
   */
  getMarkdownFiles(): TFile[] {
    return this.app.vault.getMarkdownFiles();
  }
  
  /**
   * 특정 폴더의 마크다운 파일 가져오기
   * @param folderPath 폴더 경로
   * @param recursive 하위 폴더 포함 여부
   */
  getMarkdownFilesInFolder(folderPath: string, recursive: boolean): TFile[] {
    const files = this.app.vault.getMarkdownFiles();
    
    if (folderPath === '/') {
      return recursive ? files : files.filter(file => !file.path.includes('/'));
    }
    
    return files.filter(file => {
      const filePath = file.path;
      const fileDir = filePath.substring(0, filePath.lastIndexOf('/') + 1);
      
      if (recursive) {
        return fileDir.startsWith(folderPath);
      } else {
        return fileDir === folderPath;
      }
    });
  }
  
  /**
   * 파일 내용 읽기
   * @param file 파일 객체
   */
  async read(file: TFile): Promise<string> {
    return await this.app.vault.read(file);
  }
  
  /**
   * 파일 내용 쓰기
   * @param file 파일 객체
   * @param content 파일 내용
   */
  async write(file: TFile, content: string): Promise<void> {
    await this.app.vault.modify(file, content);
  }
  
  /**
   * 폴더 가져오기
   * @param path 폴더 경로
   */
  getFolder(path: string): TFolder | null {
    const folder = this.app.vault.getAbstractFileByPath(path);
    return folder instanceof TFolder ? folder : null;
  }
  
  /**
   * 모든 폴더 가져오기
   */
  getFolders(): TFolder[] {
    const folders: TFolder[] = [];
    this.app.vault.getAllLoadedFiles().forEach(file => {
      if (file instanceof TFolder) {
        folders.push(file);
      }
    });
    return folders;
  }
  
  // IWorkspace 인터페이스 구현
  
  /**
   * Workspace 인스턴스 가져오기
   */
  getWorkspace(): Workspace {
    return this.app.workspace;
  }
  
  /**
   * 활성 파일 가져오기
   */
  getActiveFile(): TFile | null {
    return this.app.workspace.getActiveFile();
  }
  
  /**
   * 활성 리프 가져오기
   */
  getActiveLeaf(): WorkspaceLeaf | null {
    return this.app.workspace.activeLeaf;
  }
  
  /**
   * 이벤트 등록
   * @param event 이벤트 참조
   */
  registerEvent(event: EventRef): void {
    this.plugin.registerEvent(event);
  }
  
  /**
   * 파일 열림 이벤트 등록
   * @param callback 콜백 함수
   */
  registerFileOpenEvent(callback: (file: TFile | null) => any): void {
    this.registerEvent(this.app.workspace.on('file-open', callback));
  }
  
  /**
   * 활성 리프 변경 이벤트 등록
   * @param callback 콜백 함수
   */
  registerActiveLeafChangeEvent(callback: (leaf: WorkspaceLeaf | null) => any): void {
    this.registerEvent(this.app.workspace.on('active-leaf-change', callback));
  }
  
  /**
   * 레이아웃 변경 이벤트 등록
   * @param callback 콜백 함수
   */
  registerLayoutChangeEvent(callback: () => any): void {
    this.registerEvent(this.app.workspace.on('layout-change', callback));
  }
  
  /**
   * 앱 종료 이벤트 등록
   * @param callback 콜백 함수
   */
  registerQuitEvent(callback: (tasks: any) => any): void {
    this.registerEvent(this.app.workspace.on('quit', callback));
  }
  
  /**
   * 에디터 변경 이벤트 등록
   * @param callback 콜백 함수
   */
  registerEditorChangeEvent(callback: (editor: any, info: any) => any): void {
    this.registerEvent(this.app.workspace.on('editor-change', callback));
  }
  
  /**
   * CSS 변경 이벤트 등록
   * @param callback 콜백 함수
   */
  registerCssChangeEvent(callback: () => any): void {
    this.registerEvent(this.app.workspace.on('css-change', callback));
  }
  
  /**
   * 리사이즈 이벤트 등록
   * @param callback 콜백 함수
   */
  registerResizeEvent(callback: () => any): void {
    this.registerEvent(this.app.workspace.on('resize', callback));
  }
  
  /**
   * 뷰 등록
   * @param viewType 뷰 타입
   * @param viewCreator 뷰 생성자
   */
  registerView(viewType: string, viewCreator: (leaf: WorkspaceLeaf) => View): void {
    this.plugin.registerView(viewType, viewCreator);
  }
  
  /**
   * 뷰 활성화
   * @param viewType 뷰 타입
   * @returns 활성화된 리프
   */
  async activateView(viewType: string): Promise<WorkspaceLeaf | null> {
    // 이미 열려있는 뷰 확인
    const leaves = this.app.workspace.getLeavesOfType(viewType);
    if (leaves.length > 0) {
      this.app.workspace.revealLeaf(leaves[0]);
      return leaves[0];
    }
    
    // 새 뷰 열기
    const leaf = this.app.workspace.getRightLeaf(false);
    if (leaf) {
      await leaf.setViewState({ type: viewType, active: true });
      this.app.workspace.revealLeaf(leaf);
      return leaf;
    }
    
    return null;
  }
  
  /**
   * 리본 아이콘 추가
   * @param icon 아이콘 ID
   * @param title 툴팁 텍스트
   * @param callback 클릭 콜백
   */
  addRibbonIcon(icon: string, title: string, callback: (evt: MouseEvent) => void): HTMLElement {
    return this.plugin.addRibbonIcon(icon, title, callback);
  }
  
  /**
   * 명령어 등록
   * @param id 명령어 ID
   * @param name 명령어 이름
   * @param callback 명령어 콜백
   */
  addCommand(id: string, name: string, callback: () => void): void {
    this.plugin.addCommand({
      id,
      name,
      callback
    });
  }
  
  /**
   * 파일에서 카드 생성
   * @param file 파일
   * @returns 카드 객체
   */
  getCardFromFile(file: TFile): any {
    const metadata = this.app.metadataCache.getFileCache(file);
    const frontmatter = metadata?.frontmatter || {};
    const firstHeader = metadata?.headings?.[0]?.heading || '';
    
    // 간단한 미리보기 텍스트 생성 (실제 파일 내용은 비동기적으로 가져와야 하므로 여기서는 간단한 미리보기만 제공)
    let previewContent = '카드 내용 미리보기...';
    if (metadata?.sections && metadata.sections.length > 0) {
      // 첫 번째 섹션의 내용 사용 (프론트매터 제외)
      const firstNonFrontmatterSection = metadata.sections.find(s => s.type !== 'frontmatter');
      if (firstNonFrontmatterSection) {
        previewContent = '이 카드에는 내용이 있습니다. 클릭하여 확인하세요.';
      }
    }
    
    return {
      id: file.path,
      path: file.path,
      title: file.basename,
      content: previewContent,
      tags: this.getTagsFromFile(file),
      frontmatter: frontmatter,
      firstHeader: firstHeader,
      displaySettings: {
        headerContent: 'filename',
        bodyContent: 'content',
        footerContent: 'tags',
        renderingMode: 'text'
      },
      getPath: () => file.path,
      getCreatedTime: () => file.stat.ctime,
      getModifiedTime: () => file.stat.mtime
    };
  }
  
  /**
   * 파일에서 태그 가져오기
   * @param file 파일
   * @returns 태그 목록
   */
  private getTagsFromFile(file: TFile): string[] {
    const metadata = this.app.metadataCache.getFileCache(file);
    const tags: string[] = [];
    
    // 프론트매터 태그
    if (metadata?.frontmatter?.tags) {
      if (Array.isArray(metadata.frontmatter.tags)) {
        tags.push(...metadata.frontmatter.tags);
      } else if (typeof metadata.frontmatter.tags === 'string') {
        tags.push(metadata.frontmatter.tags);
      }
    }
    
    // 인라인 태그
    if (metadata?.tags) {
      tags.push(...metadata.tags.map(t => t.tag.substring(1)));
    }
    
    return tags;
  }
} 