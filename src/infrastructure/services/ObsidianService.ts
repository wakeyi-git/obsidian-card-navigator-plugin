import { App, CachedMetadata, EventRef, MetadataCache, Plugin, TFile, TFolder, Vault, View, Workspace, WorkspaceLeaf, MarkdownRenderer } from 'obsidian';
import { IObsidianApp, IVault, IWorkspace, IMetadataCache, IObsidianService } from '../adapters/ObsidianInterfaces';
import { Card, ICard } from '../../domain/card/Card';

/**
 * Obsidian 서비스
 * Obsidian API를 추상화하여 플러그인 내에서 일관된 방식으로 Obsidian 기능을 사용할 수 있게 합니다.
 */
export class ObsidianService implements IObsidianService {
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
      
      // 디버그 로그 추가
      console.log('폴더 경로:', folderPath);
      console.log('하위 폴더 포함 여부:', recursive);
      console.log('전체 마크다운 파일 수:', files.length);
      
      // 루트 폴더인 경우
      if (folderPath === '/' || folderPath === '') {
        const result = recursive ? files : files.filter(file => !file.path.includes('/') || file.path.lastIndexOf('/') === 0);
        console.log('루트 폴더 파일 수:', result.length);
        return result;
      }
      
      // 폴더 경로가 '/'로 끝나지 않으면 추가
      const normalizedPath = folderPath.endsWith('/') ? folderPath : folderPath + '/';
      console.log('정규화된 폴더 경로:', normalizedPath);
      
      const result = files.filter(file => {
        const filePath = file.path;
        
        if (recursive) {
          // 하위 폴더 포함: 파일 경로가 지정된 폴더 경로로 시작하는지 확인
          return filePath === normalizedPath.slice(0, -1) || filePath.startsWith(normalizedPath);
        } else {
          // 하위 폴더 미포함: 파일이 정확히 지정된 폴더에 있는지 확인
          const fileDir = filePath.substring(0, filePath.lastIndexOf('/') + 1);
          return fileDir === normalizedPath;
        }
      });
      
      console.log('필터링된 파일 수:', result.length);
      console.log('필터링된 파일 목록:', result.map(f => f.path));
      
      return result;
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
     * @returns 폴더 객체 배열
     */
    getFoldersAsObjects(): TFolder[] {
      const folders: TFolder[] = [];
      this.app.vault.getAllLoadedFiles().forEach(file => {
        if (file instanceof TFolder) {
          folders.push(file);
        }
      });
      return folders;
    }
    
    /**
     * 모든 폴더 경로 가져오기
     * @returns 폴더 경로 배열
     */
    getFolderPaths(): string[] {
      const folders: string[] = [];
      const rootFolder = this.app.vault.getRoot();
      
      // 루트 폴더 추가
      folders.push('/');
      
      // 재귀적으로 모든 폴더 추가
      this.traverseFolders(rootFolder, folders);
      
      return folders;
    }
    
    /**
     * 폴더 순회하여 경로 추가
     * @param folder 폴더
     * @param paths 경로 배열
     * @param parentPath 부모 경로
     */
    private traverseFolders(folder: TFolder, paths: string[], parentPath: string = ''): void {
      for (const child of folder.children) {
        if (child instanceof TFolder) {
          const path = parentPath ? `${parentPath}/${child.name}` : child.name;
          paths.push(path);
          this.traverseFolders(child, paths, path);
        }
      }
    }
  
    /**
     * 모든 태그 가져오기
     * @returns 태그 배열
     */
    getAllTags(): string[] {
      const allTags = new Set<string>();
      const files = this.getMarkdownFiles();
      
      for (const file of files) {
        const fileTags = this.getTagsFromFile(file);
        fileTags.forEach(tag => allTags.add(tag));
      }
      
      return Array.from(allTags).sort();
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
    async getCardFromFile(file: TFile): Promise<any> {
      const metadata = this.app.metadataCache.getFileCache(file);
      const frontmatter = metadata?.frontmatter || {};
      const firstHeader = metadata?.headings?.[0]?.heading || '';
      
      // 실제 파일 내용 읽기
      let content = await this.read(file);
      
      // 내용이 없는 경우 기본 메시지 표시
      if (!content || content.trim() === '') {
        content = '카드 내용이 없습니다.';
      }
      
      return {
        id: file.path,
        path: file.path,
        title: file.basename,
        content: content,
        tags: this.getTagsFromFile(file),
        frontmatter: frontmatter,
        firstHeader: firstHeader,
        displaySettings: {
          headerContent: 'filename',
          bodyContent: 'content',
          footerContent: 'tags',
          renderingMode: 'text'
        },
        getId: () => file.path,
        getPath: () => file.path,
        getCreatedTime: () => file.stat.ctime,
        getModifiedTime: () => file.stat.mtime
      };
    }
    
    /**
     * 파일에서 태그 가져오기
     * @param file 파일
     * @returns 태그 배열
     */
    getTagsFromFile(file: TFile): string[] {
      const cache = this.app.metadataCache.getFileCache(file);
      const tags: string[] = [];
      
      if (cache) {
        // 프론트매터 태그
        if (cache.frontmatter && cache.frontmatter.tags) {
          if (Array.isArray(cache.frontmatter.tags)) {
            tags.push(...cache.frontmatter.tags);
          } else if (typeof cache.frontmatter.tags === 'string') {
            tags.push(cache.frontmatter.tags);
          }
        }
        
        // 인라인 태그
        if (cache.tags) {
          cache.tags.forEach(tag => {
            if (!tags.includes(tag.tag)) {
              tags.push(tag.tag);
            }
          });
        }
      }
      
      return tags;
    }
    
    /**
     * 파일 내용 읽기
     * @param file 파일 객체
     * @returns 파일 내용
     */
    async readFile(file: TFile): Promise<string> {
      return await this.app.vault.read(file);
    }
    
    /**
     * 파일 캐시 가져오기
     * @param file 파일 객체
     * @returns 파일 캐시 메타데이터
     */
    async getFileCache(file: TFile): Promise<CachedMetadata> {
      return this.app.metadataCache.getFileCache(file) || { frontmatter: {}, headings: [], links: [], embeds: [], tags: [] };
    }
    
    /**
     * 파일 메타데이터 가져오기
     * @param file 파일 객체
     * @returns 파일 메타데이터
     */
    getFileMetadata(file: TFile): CachedMetadata | null {
      return this.app.metadataCache.getFileCache(file);
    }
    
    /**
     * 태그로 파일 검색
     * @param tag 태그
     * @returns 태그가 있는 파일 목록
     */
    getFilesWithTag(tag: string): TFile[] {
      const files: TFile[] = [];
      const allFiles = this.app.vault.getMarkdownFiles();
      
      for (const file of allFiles) {
        const cache = this.app.metadataCache.getFileCache(file);
        if (cache && cache.tags) {
          const hasTags = cache.tags.some(t => t.tag === tag || t.tag === `#${tag}`);
          if (hasTags) {
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
     * @returns 프론트매터 키/값이 있는 파일 목록
     */
    getFilesWithFrontmatter(key: string, value?: any): TFile[] {
      const files: TFile[] = [];
      const allFiles = this.app.vault.getMarkdownFiles();
      
      for (const file of allFiles) {
        const cache = this.app.metadataCache.getFileCache(file);
        if (cache && cache.frontmatter) {
          if (key in cache.frontmatter) {
            if (value === undefined || cache.frontmatter[key] === value) {
              files.push(file);
            }
          }
        }
      }
      
      return files;
    }
  
    /**
     * App 인스턴스 가져오기
     * @returns App 인스턴스
     */
    getApp(): App {
      return this.app;
    }
  
    /**
     * 모든 폴더 가져오기 (경로 문자열 형태)
     * @returns 폴더 경로 문자열 배열
     */
    getFolders(): string[] {
      const folders: string[] = ['/'];
      this.app.vault.getAllLoadedFiles().forEach(file => {
        if (file instanceof TFolder) {
          folders.push(file.path);
        }
      });
      return folders;
    }
    
    /**
     * 태그 목록 가져오기
     * @returns 태그 목록
     */
    getTags(): string[] {
      const tags = new Set<string>();
      this.getMarkdownFiles().forEach(file => {
        const cache = this.getFileMetadata(file);
        cache?.tags?.forEach(tag => tags.add(tag.tag.substring(1)));
      });
      return Array.from(tags);
    }
  
    /**
     * 프론트매터 키 제안 가져오기
     * @param query 검색어
     * @returns 프론트매터 키 제안 배열
     */
    async getFrontmatterKeys(query: string): Promise<string[]> {
      const keys = new Set<string>();
      this.getMarkdownFiles().forEach(file => {
        const cache = this.getFileMetadata(file);
        if (cache?.frontmatter) {
          Object.keys(cache.frontmatter)
            .filter(key => key.toLowerCase().includes(query.toLowerCase()))
            .forEach(key => keys.add(key));
        }
      });
      return Array.from(keys);
    }
  
    /**
     * 프론트매터 값 제안 가져오기
     * @param key 프론트매터 키
     * @param query 검색어
     * @returns 프론트매터 값 제안 배열
     */
    async getFrontmatterValues(key: string, query: string): Promise<string[]> {
      const values = new Set<string>();
      this.getMarkdownFiles().forEach(file => {
        const cache = this.getFileMetadata(file);
        const value = cache?.frontmatter?.[key];
        if (value && String(value).toLowerCase().includes(query.toLowerCase())) {
          values.add(String(value));
        }
      });
      return Array.from(values);
    }
  
    /**
     * 태그 제안 가져오기
     * @param query 검색어
     * @returns 태그 제안 배열
     */
    getTagSuggestions(query: string): Promise<string[]> {
      const tags = new Set<string>();
      this.getMarkdownFiles().forEach(file => {
        const cache = this.getFileMetadata(file);
        cache?.tags?.forEach(tag => {
          if (tag.tag.toLowerCase().includes(query.toLowerCase())) {
            tags.add(tag.tag.substring(1));
          }
        });
      });
      return Promise.resolve(Array.from(tags));
    }
  
    /**
     * 경로 제안 가져오기
     * @param query 검색어
     * @returns 경로 제안 배열
     */
    getPathSuggestions(query: string): Promise<string[]> {
      return Promise.resolve(
        this.getFolders()
          .filter(path => path.toLowerCase().includes(query.toLowerCase()))
      );
    }
  
    /**
     * 파일명 제안 가져오기
     * @param query 검색어
     * @returns 파일명 제안 배열
     */
    getFilenameSuggestions(query: string): Promise<string[]> {
      return Promise.resolve(
        this.getMarkdownFiles()
          .filter(file => file.basename.toLowerCase().includes(query.toLowerCase()))
          .map(file => file.basename)
      );
    }

    /**
     * 마크다운을 HTML로 렌더링
     * @param containerEl 컨테이너 엘리먼트
     * @param markdown 마크다운 소스
     * @param context 렌더링 컨텍스트
     */
    async renderMarkdown(containerEl: HTMLElement, markdown: string, context?: any): Promise<void> {
      await MarkdownRenderer.renderMarkdown(markdown, containerEl, '', context);
    }

    /**
     * 컨테이너의 내용 제거
     * @param containerEl 컨테이너 엘리먼트
     */
    clearContainer(containerEl: HTMLElement): void {
      containerEl.empty();
    }

    /**
     * 파일을 카드로 변환
     * @param file 파일 객체
     * @returns 카드 객체
     */
    async fileToCard(file: TFile): Promise<ICard> {
      const content = await this.app.vault.read(file);
      const metadata = this.app.metadataCache.getFileCache(file);
      const tags = metadata?.tags?.map(tag => tag.tag) || [];
      const frontmatter = metadata?.frontmatter || {};
      const firstHeader = metadata?.headings?.[0]?.heading;

      return new Card(
        file.path,
        file.name,
        content,
        tags,
        frontmatter,
        firstHeader,
        undefined,
        metadata || undefined,
        file.stat.ctime,
        file.stat.mtime
      );
    }
  } 