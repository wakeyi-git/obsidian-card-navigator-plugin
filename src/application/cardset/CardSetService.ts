import { TFile } from 'obsidian';
import { CardSetSourceType, ICardSet, ICardSetSource, ICardSetState } from '../../domain/cardset/CardSet';
import { ICardSetSourceManager } from '../../domain/cardset/CardSetInterfaces';
import { DomainEventBus } from '../../core/events/DomainEventBus';
import { EventType, SettingsChangedEventData } from '../../domain/events/EventTypes';
import { ICardSetSourceController } from '../../domain/interaction/InteractionInterfaces';
import { ISettingsService, CardSetSourceMode } from '../../domain/settings/SettingsInterfaces';
import { ObsidianService } from '../../infrastructure/obsidian/adapters/ObsidianService';
import { createCardSetId, createEmptyCardSetId, createFolderCardSetId, createTagCardSetId, createSearchCardSetId, isSameCardSetId } from '../../domain/cardset/CardSetUtils';

/**
 * 빈 카드셋 소스 클래스
 */
class EmptyCardSetSource implements ICardSetSource {
  type: CardSetSourceType = 'folder';
  currentCardSet: string | null = null;
  
  isCardSetFixed(): boolean {
    return false;
  }
  
  getState(): ICardSetState {
    return {
      currentCardSet: null,
      isFixed: false
    };
  }
}

/**
 * 카드셋 서비스 인터페이스
 */
export interface ICardSetService extends ICardSetSourceManager, ICardSetSourceController {
  /**
   * 현재 카드셋 가져오기
   * @returns 현재 카드셋
   */
  getCurrentCardSet(): Promise<ICardSet>;
  
  /**
   * 활성 파일 변경 처리
   * @param file 활성 파일
   */
  handleActiveFileChanged(file: TFile | null): Promise<void>;
  
  /**
   * 서비스 정리 및 리소스 해제
   */
  cleanup(): void;
  
  /**
   * 이벤트 버스 가져오기
   * @returns 이벤트 버스
   */
  getEventBus(): DomainEventBus;
  
  /**
   * 현재 카드셋 소스 모드 가져오기
   * @returns 카드셋 소스 모드
   */
  getCardSetSourceMode(): CardSetSourceMode;
  
  /**
   * 카드셋 소스 모드 설정
   * @param mode 카드셋 소스 모드
   */
  setCardSetSourceMode(mode: CardSetSourceMode): Promise<void>;
  
  /**
   * 하위 폴더 포함 여부 가져오기
   * @returns 하위 폴더 포함 여부
   */
  getIncludeSubfolders(): boolean;
  
  /**
   * 하위 폴더 포함 여부 설정
   * @param include 하위 폴더 포함 여부
   */
  setIncludeSubfolders(include: boolean): Promise<void>;
  
  /**
   * 카드셋 고정 여부 가져오기
   * @returns 카드셋 고정 여부
   */
  isCardSetFixed(): boolean;
  
  /**
   * 카드셋 고정 여부 설정
   * @param fixed 카드셋 고정 여부
   */
  setCardSetFixed(fixed: boolean): Promise<void>;
}

/**
 * 카드셋 서비스
 * 카드셋 관련 기능을 관리합니다.
 */
export class CardSetService implements ICardSetService {
  private obsidianService: ObsidianService;
  private settingsService: ISettingsService;
  private eventBus: DomainEventBus;
  private currentCardSetSource: CardSetSourceType;
  private previousCardSetSource: CardSetSourceType;
  private currentCardSet: ICardSet | null = null;
  private folderCardSet: ICardSetSource | null = null;
  private tagCardSet: ICardSetSource | null = null;
  private searchCardSet: ICardSetSource | null = null;
  
  // 이벤트 중복 발생 방지를 위한 변수 추가
  private lastEmittedCardSetId: string | null = null;
  private lastEmittedCardSetTime: number = 0;
  private isRefreshingCardSet: boolean = false;
  private pendingRefresh: boolean = false;
  
  /**
   * 생성자
   * @param obsidianService Obsidian 서비스
   * @param settingsService 설정 서비스
   * @param eventBus 이벤트 버스
   */
  constructor(
    obsidianService: ObsidianService,
    settingsService: ISettingsService,
    eventBus: DomainEventBus
  ) {
    this.obsidianService = obsidianService;
    this.settingsService = settingsService;
    this.eventBus = eventBus;
    
    // 설정에서 초기 카드셋 소스 가져오기
    const settings = this.settingsService.getSettings();
    this.currentCardSetSource = settings.useLastCardSetSourceOnLoad && settings.lastCardSetSource
      ? settings.lastCardSetSource
      : settings.defaultCardSetSource;
    this.previousCardSetSource = this.currentCardSetSource;
    
    // 이벤트 리스너 등록
    this.eventBus.on(EventType.SETTINGS_CHANGED, this.onSettingsChanged.bind(this));
  }
  
  /**
   * 현재 카드셋 소스 가져오기
   * @returns 현재 카드셋 소스
   */
  getCurrentSource(): ICardSetSource {
    switch (this.currentCardSetSource) {
      case 'folder':
        return this.folderCardSet || this.createEmptyCardSet();
      case 'tag':
        return this.tagCardSet || this.createEmptyCardSet();
      case 'search':
        return this.searchCardSet || this.createEmptyCardSet();
      default:
        return this.createEmptyCardSet();
    }
  }
  
  /**
   * 현재 카드셋 소스 타입 가져오기
   * @returns 현재 카드셋 소스 타입
   */
  getCurrentSourceType(): CardSetSourceType {
    return this.currentCardSetSource;
  }
  
  /**
   * 카드셋 소스 변경
   * @param sourceType 변경할 소스 타입
   */
  async changeSource(sourceType: CardSetSourceType): Promise<void> {
    if (this.currentCardSetSource === sourceType) return;
    
    this.previousCardSetSource = this.currentCardSetSource;
    this.currentCardSetSource = sourceType;
    
    // 설정 업데이트
    await this.settingsService.updateSettings({
      lastCardSetSource: sourceType
    });
    
    // 이벤트 발생
    this.eventBus.emit(EventType.CARD_SET_SOURCE_CHANGED, {
      source: sourceType
    });
    
    // 카드셋 새로고침
    await this.refreshCardSet();
  }
  
  /**
   * 폴더 카드셋 소스 가져오기
   * @returns 폴더 카드셋 소스
   */
  getFolderSource(): ICardSetSource {
    return this.folderCardSet || this.createEmptyCardSet();
  }
  
  /**
   * 태그 카드셋 소스 가져오기
   * @returns 태그 카드셋 소스
   */
  getTagSource(): ICardSetSource {
    return this.tagCardSet || this.createEmptyCardSet();
  }
  
  /**
   * 이전 카드셋 소스 가져오기
   * @returns 이전 카드셋 소스
   */
  getPreviousSourceType(): CardSetSourceType {
    return this.previousCardSetSource;
  }
  
  /**
   * 이전 카드셋 소스 타입 가져오기
   * @returns 이전 카드셋 소스 타입
   */
  getPreviousCardSetSource(): CardSetSourceType {
    return this.previousCardSetSource;
  }
  
  /**
   * 카드 세트 변경
   * @param type 변경할 카드 세트 타입
   */
  async changeCardSetSource(type: CardSetSourceType): Promise<void> {
    await this.changeSource(type);
  }
  
  /**
   * 카드 세트 선택
   * @param cardSet 선택할 카드 세트
   * @param isFixed 고정 여부
   */
  async selectCardSet(cardSet: string, isFixed = false): Promise<void> {
    const settings = this.settingsService.getSettings();
    
    // 현재 카드셋 소스에 따라 다른 처리
    if (this.currentCardSetSource === 'folder') {
      await this.settingsService.updateSettings({
        lastFolderCardSet: cardSet,
        lastFolderCardSetFixed: isFixed
      });
      
      if (isFixed) {
        await this.settingsService.updateSettings({
          defaultFolderCardSet: cardSet,
          isCardSetFixed: true
        });
      }
    } else if (this.currentCardSetSource === 'tag') {
      await this.settingsService.updateSettings({
        lastTagCardSet: cardSet,
        lastTagCardSetFixed: isFixed
      });
      
      if (isFixed) {
        await this.settingsService.updateSettings({
          defaultTagCardSet: cardSet,
          isCardSetFixed: true
        });
      }
    }
    
    // 카드셋 새로고침
    await this.refreshCardSet();
    
    // 이벤트 발생
    this.eventBus.emit(EventType.CARDSET_CHANGED, {
      cardSet,
      sourceType: this.currentCardSetSource,
      isFixed
    });
  }
  
  /**
   * 카드셋 소스 변경 알림
   * @param sourceType 소스 타입
   */
  notifyCardSetSourceChanged(sourceType: CardSetSourceType): void {
    this.eventBus.emit(EventType.CARD_SET_SOURCE_CHANGED, {
      source: sourceType
    });
  }
  
  /**
   * 현재 카드셋 가져오기
   * @returns 현재 카드셋
   */
  async getCurrentCardSet(): Promise<ICardSet> {
    console.log('getCurrentCardSet 호출됨');
    
    if (!this.currentCardSet) {
      console.log('현재 카드셋이 없어 새로고침 실행');
      await this.refreshCardSet();
    } else {
      console.log('현재 카드셋 존재:', {
        id: this.currentCardSet.id,
        source: this.currentCardSet.source,
        파일수: this.currentCardSet.files?.length || 0
      });
    }
    
    if (this.currentCardSet) {
      return this.currentCardSet;
    }
    
    // 빈 카드셋 생성
    console.log('빈 카드셋 생성 및 반환');
    return {
      id: createEmptyCardSetId('folder'),
      name: '빈 카드셋',
      sourceType: this.currentCardSetSource,
      source: '',
      type: 'active',
      files: []
    };
  }
  
  /**
   * 활성 파일 변경 처리
   * @param file 활성 파일
   */
  async handleActiveFileChanged(file: TFile | null): Promise<void> {
    // 파일이 없는 경우 처리 중단
    if (!file) {
      console.log('활성 파일이 없음, 처리 중단');
      return;
    }
    
    // 이미 카드셋 새로고침 중이면 중복 처리 방지
    if (this.isRefreshingCardSet) {
      this.pendingRefresh = true;
      console.log('이미 카드셋 새로고침 중, 대기 상태로 전환');
      return;
    }

    const settings = this.settingsService.getSettings();
    
    console.log('활성 파일 변경됨:', file?.path);
    console.log('활성 파일 부모 폴더:', file?.parent?.path);
    
    // 고정된 카드셋인 경우 처리 중단
    if (settings.isCardSetFixed) {
      console.log('고정된 카드셋 사용 중, 활성 파일 변경 무시');
      return;
    }
    
    // 폴더 카드셋인 경우 폴더 변경 확인
    if (this.currentCardSetSource === 'folder') {
      const currentFolderPath = this.currentCardSet?.source || '';
      const newFolderPath = file?.parent?.path || '';
      
      console.log('폴더 비교:', currentFolderPath, '->', newFolderPath);
      
      // 폴더가 변경되었고 고정된 카드셋이 아닌 경우
      if (currentFolderPath !== newFolderPath) {
        console.log('폴더 변경 감지:', currentFolderPath, '->', newFolderPath);
        
        // 이전 카드셋 ID 저장
        const previousCardSetId = this.currentCardSet?.id;
        
        // 카드셋 새로고침
        await this.refreshCardSet();
        
        // 카드셋이 실제로 변경된 경우에만 이벤트 발생
        if (this.currentCardSet && !isSameCardSetId(previousCardSetId, this.currentCardSet.id, false)) {
          this.emitCardSetChangedEvent(newFolderPath, 'folder', false, previousCardSetId);
        } else {
          console.log('카드셋 ID가 변경되지 않음, 이벤트 발생 생략');
        }
      } else {
        console.log('폴더 변경 없음, 처리 생략');
      }
    } else if (this.currentCardSetSource === 'tag') {
      // 태그 카드셋인 경우 태그 변경 확인
      const previousCardSetId = this.currentCardSet?.id;
      
      // 카드셋 새로고침
      await this.refreshCardSet();
      
      // 카드셋이 실제로 변경된 경우에만 이벤트 발생
      if (this.currentCardSet && !isSameCardSetId(previousCardSetId, this.currentCardSet.id, false)) {
        const cardSet = this.getTagsFromFile(file).join(', ');
        this.emitCardSetChangedEvent(cardSet, 'tag', false, previousCardSetId);
      } else {
        console.log('활성 파일 변경되었으나 카드셋 ID 변경 없음, 이벤트 발생 생략');
      }
    }
  }
  
  /**
   * 카드셋 새로고침
   */
  async refreshCardSet(): Promise<void> {
    // 이미 새로고침 중이면 중복 실행 방지
    if (this.isRefreshingCardSet) {
      this.pendingRefresh = true;
      console.log('이미 카드셋 새로고침 중, 대기 상태로 전환');
      return;
    }
    
    this.isRefreshingCardSet = true;
    this.pendingRefresh = false;
    
    try {
      console.log('카드셋 새로고침 시작');
      
      // 이전 카드셋 저장
      const previousCardSet = this.currentCardSet;
      const previousCardSetId = previousCardSet?.id;
      const previousCardSetFiles = previousCardSet?.files?.length || 0;
      
      // 카드셋 소스에 따라 카드셋 새로고침
      switch (this.currentCardSetSource) {
        case 'folder':
          this.currentCardSet = await this.refreshFolderCardSet();
          break;
        case 'tag':
          this.currentCardSet = await this.refreshTagCardSet();
          break;
        case 'search':
          this.currentCardSet = await this.refreshSearchCardSet();
          break;
        default:
          this.currentCardSet = await this.refreshFolderCardSet();
      }
      
      // 중복 파일 제거
      if (this.currentCardSet && this.currentCardSet.files && this.currentCardSet.files.length > 0) {
        const uniqueFiles = new Map<string, TFile>();
        
        // 중복 제거를 위해 Map 사용
        this.currentCardSet.files.forEach(file => {
          uniqueFiles.set(file.path, file);
        });
        
        // 중복 제거된 파일 배열로 변환
        this.currentCardSet.files = Array.from(uniqueFiles.values());
      }
      
      // 카드셋 변경 이벤트 발생 (카드셋이 변경된 경우에만)
      if (this.currentCardSet) {
        const currentCardSetFiles = this.currentCardSet.files.length;
        
        // 카드셋 ID가 변경되었거나 파일 수가 변경된 경우에만 이벤트 발생
        const isCardSetIdChanged = !previousCardSetId || !isSameCardSetId(previousCardSetId, this.currentCardSet.id, false);
        const isFileCountChanged = previousCardSetFiles !== currentCardSetFiles;
        
        if (isCardSetIdChanged || isFileCountChanged) {
          // 파일 목록이 변경된 경우에만 CARDS_CHANGED 이벤트 발생
          if (isFileCountChanged && this.currentCardSet.id) {
            this.emitCardsChangedEvent(this.currentCardSet.files, currentCardSetFiles);
          }
        }
      }
    } catch (error) {
      console.error('카드셋 새로고침 오류:', error);
      
      // 오류 발생 시 빈 카드셋 생성
      this.currentCardSet = {
        id: 'error-cardset',
        name: '오류 발생',
        sourceType: this.currentCardSetSource,
        source: '',
        type: 'active',
        files: []
      };
    } finally {
      this.isRefreshingCardSet = false;
      
      // 대기 중인 새로고침이 있으면 실행
      if (this.pendingRefresh) {
        console.log('대기 중인 카드셋 새로고침 실행');
        setTimeout(() => this.refreshCardSet(), 50);
      }
    }
  }
  
  /**
   * 폴더 카드셋 새로고침
   * @returns 폴더 카드셋
   */
  private async refreshFolderCardSet(): Promise<ICardSet> {
    console.log('폴더 카드셋 새로고침 시작');
    console.log('refreshFolderCardSet 호출 스택:', new Error().stack);
    
    // 폴더 카드셋 소스가 있는 경우 해당 소스에서 카드셋 가져오기
    if (this.folderCardSet) {
      console.log('폴더 카드셋 소스 사용');
      const cardSet = await (this.folderCardSet as any).getCardSet();
      console.log('폴더 카드셋 소스에서 가져온 카드셋:', {
        id: cardSet.id,
        source: cardSet.source,
        파일수: cardSet.files?.length || 0
      });
      return cardSet;
    }
    
    // 설정에서 기본 폴더 카드셋 가져오기
    const settings = this.settingsService.getSettings();
    const defaultFolderCardSet = settings.defaultFolderCardSet;
    const includeSubfolders = settings.includeSubfolders;
    
    console.log('설정 정보:', {
      defaultFolderCardSet,
      includeSubfolders,
      isCardSetFixed: settings.isCardSetFixed
    });
    
    // 고정된 카드셋이고 기본 폴더가 설정되어 있는 경우
    if (settings.isCardSetFixed && defaultFolderCardSet) {
      console.log('고정된 폴더 카드셋 사용:', defaultFolderCardSet);
      const files = this.obsidianService.getMarkdownFilesInFolder(defaultFolderCardSet, includeSubfolders);
      console.log('고정된 폴더에서 찾은 파일 수:', files.length);
      
      // 카드셋 ID 생성
      const cardSetId = createFolderCardSetId(defaultFolderCardSet);
      console.log('카드셋 ID 생성(고정):', cardSetId);
      
      return {
        id: cardSetId,
        name: defaultFolderCardSet || '루트',
        sourceType: 'folder',
        source: defaultFolderCardSet,
        type: 'fixed',
        files: files
      };
    }
    
    // 활성 파일의 폴더 가져오기
    const activeFile = this.obsidianService.getActiveFile();
    const folderPath = activeFile?.parent?.path || '';
    
    console.log('활성 파일 정보:', {
      activeFile: activeFile?.path,
      folderPath: folderPath
    });
    
    // 이전 카드셋의 폴더 경로 확인
    const previousFolderPath = this.currentCardSet?.source || '';
    
    // 폴더 경로가 변경된 경우 로그 출력
    if (previousFolderPath && previousFolderPath !== folderPath) {
      console.log('폴더 경로 변경됨:', previousFolderPath, '->', folderPath);
      console.log('이전 카드셋 ID:', this.currentCardSet?.id);
      console.log('예상 새 카드셋 ID:', createFolderCardSetId(folderPath));
    } else {
      console.log('폴더 경로 유지됨:', folderPath);
    }
    
    // 활성 파일의 폴더가 있는 경우 해당 폴더의 카드셋 반환
    if (folderPath) {
      console.log('활성 파일 폴더 카드셋 사용:', folderPath);
      const files = this.obsidianService.getMarkdownFilesInFolder(folderPath, includeSubfolders);
      console.log('활성 파일 폴더에서 찾은 파일 수:', files.length);
      
      // 카드셋 ID 생성
      const cardSetId = createFolderCardSetId(folderPath);
      console.log('카드셋 ID 생성(활성):', cardSetId);
      
      return {
        id: cardSetId,
        name: folderPath || '루트',
        sourceType: 'folder',
        source: folderPath,
        type: 'active',
        files: files
      };
    }
    
    // 활성 파일이 없는 경우 루트 폴더 사용
    console.log('활성 파일이 없어 루트 폴더 사용');
    const rootFiles = this.obsidianService.getMarkdownFilesInFolder('/', includeSubfolders);
    console.log('루트 폴더에서 찾은 파일 수:', rootFiles.length);
    
    if (rootFiles.length > 0) {
      // 카드셋 ID 생성
      const cardSetId = createFolderCardSetId('/');
      console.log('카드셋 ID 생성(루트):', cardSetId);
      
      return {
        id: cardSetId,
        name: '/',
        sourceType: 'folder',
        source: '/',
        type: 'active',
        files: rootFiles
      };
    }
    
    // 파일이 없는 경우 빈 카드셋 반환
    console.log('파일을 찾을 수 없어 빈 카드셋 반환');
    return {
      id: createEmptyCardSetId('folder'),
      name: '빈 폴더 카드셋',
      sourceType: 'folder',
      source: '',
      type: 'active',
      files: []
    };
  }
  
  /**
   * 태그 카드셋 새로고침
   * @returns 태그 카드셋
   */
  private async refreshTagCardSet(): Promise<ICardSet> {
    console.log('태그 카드셋 새로고침 시작');
    
    // 태그 카드셋 소스가 있는 경우 해당 소스에서 카드셋 가져오기
    if (this.tagCardSet) {
      console.log('태그 카드셋 소스 사용');
      const cardSet = await (this.tagCardSet as any).getCardSet();
      return cardSet;
    }
    
    // 설정에서 기본 태그 카드셋 가져오기
    const settings = this.settingsService.getSettings();
    const defaultTagCardSet = settings.defaultTagCardSet;
    const tagCaseSensitive = settings.tagCaseSensitive;
    
    console.log('태그 설정 정보:', {
      defaultTagCardSet,
      tagCaseSensitive,
      isCardSetFixed: settings.isCardSetFixed
    });
    
    // 고정된 카드셋이고 기본 태그가 설정되어 있는 경우
    if (settings.isCardSetFixed && defaultTagCardSet) {
      console.log('고정된 태그 카드셋 사용:', defaultTagCardSet);
      
      // 태그로 파일 필터링
      const allFiles = this.obsidianService.getMarkdownFiles();
      console.log('전체 마크다운 파일 수:', allFiles.length);
      
      const taggedFiles = allFiles.filter(file => {
        const metadata = this.obsidianService.getMetadataCache().getFileCache(file);
        if (!metadata) return false;
        
        // 프론트매터 태그 확인
        const frontmatterTags = metadata.frontmatter?.tags || [];
        const tags = Array.isArray(frontmatterTags) ? frontmatterTags : [frontmatterTags];
        
        // 인라인 태그 확인
        const inlineTags = metadata.tags?.map(t => t.tag.substring(1)) || [];
        
        // 모든 태그 합치기
        const allTags = [...tags, ...inlineTags];
        
        // 태그 비교 함수
        const compareTag = tagCaseSensitive 
          ? (tag: string) => tag === defaultTagCardSet
          : (tag: string) => tag.toLowerCase() === defaultTagCardSet.toLowerCase();
        
        return allTags.some(compareTag);
      });
      
      console.log('태그가 있는 파일 수:', taggedFiles.length);
      
      return {
        id: createTagCardSetId(defaultTagCardSet),
        name: `#${defaultTagCardSet}`,
        sourceType: 'tag',
        source: defaultTagCardSet,
        type: 'fixed',
        files: taggedFiles
      };
    }
    
    // 활성 파일의 태그 가져오기
    const activeFile = this.obsidianService.getActiveFile();
    console.log('활성 파일:', activeFile?.path);
    
    if (activeFile) {
      const metadata = this.obsidianService.getMetadataCache().getFileCache(activeFile);
      console.log('활성 파일 메타데이터:', metadata);
      
      if (metadata) {
        // 프론트매터 태그 확인
        const frontmatterTags = metadata.frontmatter?.tags || [];
        const tags = Array.isArray(frontmatterTags) ? frontmatterTags : [frontmatterTags];
        
        // 인라인 태그 확인
        const inlineTags = metadata.tags?.map(t => t.tag.substring(1)) || [];
        
        // 모든 태그 합치기
        const allTags = [...tags, ...inlineTags];
        console.log('활성 파일 태그:', allTags);
        
        if (allTags.length > 0) {
          const firstTag = allTags[0];
          console.log('첫 번째 태그 사용:', firstTag);
          
          // 태그로 파일 필터링
          const allFiles = this.obsidianService.getMarkdownFiles();
          const taggedFiles = allFiles.filter(file => {
            const fileMetadata = this.obsidianService.getMetadataCache().getFileCache(file);
            if (!fileMetadata) return false;
            
            // 프론트매터 태그 확인
            const fileFrontmatterTags = fileMetadata.frontmatter?.tags || [];
            const fileTags = Array.isArray(fileFrontmatterTags) ? fileFrontmatterTags : [fileFrontmatterTags];
            
            // 인라인 태그 확인
            const fileInlineTags = fileMetadata.tags?.map(t => t.tag.substring(1)) || [];
            
            // 모든 태그 합치기
            const fileAllTags = [...fileTags, ...fileInlineTags];
            
            // 태그 비교 함수
            const compareTag = tagCaseSensitive 
              ? (tag: string) => tag === firstTag
              : (tag: string) => tag.toLowerCase() === firstTag.toLowerCase();
            
            return fileAllTags.some(compareTag);
          });
          
          console.log('태그가 있는 파일 수:', taggedFiles.length);
          
          return {
            id: createTagCardSetId(firstTag),
            name: `#${firstTag}`,
            sourceType: 'tag',
            source: firstTag,
            type: 'active',
            files: taggedFiles
          };
        }
      }
    }
    
    console.log('태그를 찾을 수 없어 빈 카드셋 반환');
    return {
      id: 'empty-tag',
      name: '빈 태그 카드셋',
      sourceType: 'tag',
      source: '',
      type: 'active',
      files: []
    };
  }
  
  /**
   * 검색 카드셋 새로고침
   * @returns 검색 카드셋
   */
  private async refreshSearchCardSet(): Promise<ICardSet> {
    if (this.searchCardSet) {
      const cardSet = await (this.searchCardSet as any).getCardSet();
      return cardSet;
    }
    return {
      id: 'empty-search',
      name: '빈 검색 카드셋',
      sourceType: 'search',
      source: '',
      type: 'active',
      files: []
    };
  }
  
  /**
   * 빈 카드셋 생성
   * @returns 빈 카드셋
   */
  private createEmptyCardSet(): ICardSetSource {
    return new EmptyCardSetSource();
  }
  
  /**
   * 파일에서 태그 가져오기
   * @param file 파일
   * @returns 태그 목록
   */
  private getTagsFromFile(file: TFile | null): string[] {
    if (!file) return [];
    
    const cache = this.obsidianService.getMetadataCache().getFileCache(file);
    if (!cache || !cache.tags) return [];
    
    return cache.tags.map(tag => tag.tag);
  }
  
  /**
   * 설정 변경 이벤트 처리
   * @param data 이벤트 데이터
   */
  private onSettingsChanged(data: SettingsChangedEventData): Promise<void> {
    // 카드셋 관련 설정이 변경된 경우에만 카드셋 새로고침
    const cardSetSettings = [
      'defaultCardSetSource', 'includeSubfolders',
      'defaultFolderCardSet', 'defaultTagCardSet', 'isCardSetFixed'
    ];
    
    if (data.changedKeys.some(key => cardSetSettings.includes(key))) {
      return this.refreshCardSet();
    }
    
    return Promise.resolve();
  }
  
  /**
   * 서비스 정리 및 리소스 해제
   */
  cleanup(): void {
    this.currentCardSet = null;
    this.folderCardSet = null;
    this.tagCardSet = null;
    this.searchCardSet = null;
    
    this.eventBus.off(EventType.SETTINGS_CHANGED, this.onSettingsChanged);
    console.log('카드셋 서비스 정리 완료');
  }
  
  /**
   * 이벤트 버스 가져오기
   * @returns 이벤트 버스
   */
  getEventBus(): DomainEventBus {
    return this.eventBus;
  }
  
  /**
   * 카드셋 변경 이벤트 발생
   * @param cardSet 카드셋 이름
   * @param sourceType 소스 타입
   * @param isFixed 고정 여부
   * @param previousCardSetId 이전 카드셋 ID
   */
  private emitCardSetChangedEvent(
    cardSet: string,
    sourceType: CardSetSourceType,
    isFixed: boolean,
    previousCardSetId?: string
  ): void {
    // 현재 카드셋 ID
    const currentCardSetId = this.currentCardSet?.id;
    
    // 이전 카드셋 ID와 현재 카드셋 ID가 같으면 이벤트 발생 생략
    if (previousCardSetId && currentCardSetId && isSameCardSetId(previousCardSetId, currentCardSetId, false)) {
      console.log('이전 카드셋 ID와 현재 카드셋 ID가 동일함, 이벤트 발생 생략');
      return;
    }
    
    // 이미 동일한 이벤트가 최근에 발생했는지 확인 (1000ms 이내)
    const now = Date.now();
    if (
      currentCardSetId === this.lastEmittedCardSetId && 
      now - this.lastEmittedCardSetTime < 1000
    ) {
      console.log('동일한 카드셋 변경 이벤트가 최근에 발생함, 중복 발생 방지');
      return;
    }
    
    // 이벤트 발생 정보 업데이트
    this.lastEmittedCardSetId = currentCardSetId || null;
    this.lastEmittedCardSetTime = now;
    
    console.log('카드셋 변경 이벤트 발생:', {
      cardSet,
      sourceType,
      isFixed,
      previousCardSetId,
      currentCardSetId
    });
    
    // 이벤트 발생
    this.eventBus.emit(EventType.CARDSET_CHANGED, {
      cardSet,
      sourceType,
      isFixed,
      previousCardSetId
    });
  }
  
  /**
   * 카드 변경 이벤트 발생
   * @param files 파일 목록
   * @param totalCount 전체 파일 수
   */
  private emitCardsChangedEvent(files: TFile[], totalCount: number): void {
    console.log('카드 변경 이벤트 발생:', {
      totalCount
    });
    
    this.eventBus.emit(EventType.CARDS_CHANGED, {
      cards: files.map(file => this.obsidianService.getCardFromFile(file)),
      totalCount,
      filteredCount: totalCount
    });
  }
  
  /**
   * 현재 카드셋 소스 모드 가져오기
   * @returns 카드셋 소스 모드
   */
  getCardSetSourceMode(): CardSetSourceMode {
    const settings = this.settingsService.getSettings();
    return settings.cardSetSourceMode || CardSetSourceMode.FOLDER;
  }
  
  /**
   * 카드셋 소스 모드 설정
   * @param mode 카드셋 소스 모드
   */
  async setCardSetSourceMode(mode: CardSetSourceMode): Promise<void> {
    // 현재 모드와 같으면 아무 작업도 하지 않음
    if (this.getCardSetSourceMode() === mode) return;
    
    // 설정 업데이트
    await this.settingsService.updateSettings({
      cardSetSourceMode: mode
    });
    
    // 이벤트 발생
    this.eventBus.emit(EventType.CARD_SET_SOURCE_CHANGED, {
      mode: mode
    });
    
    // 카드셋 새로고침
    await this.refreshCardSet();
  }
  
  /**
   * 하위 폴더 포함 여부 가져오기
   * @returns 하위 폴더 포함 여부
   */
  getIncludeSubfolders(): boolean {
    const settings = this.settingsService.getSettings();
    return settings.includeSubfolders || false;
  }
  
  /**
   * 하위 폴더 포함 여부 설정
   * @param include 하위 폴더 포함 여부
   */
  async setIncludeSubfolders(include: boolean): Promise<void> {
    // 현재 값과 같으면 아무 작업도 하지 않음
    if (this.getIncludeSubfolders() === include) return;
    
    // 설정 업데이트
    await this.settingsService.updateSettings({
      includeSubfolders: include
    });
    
    // 카드셋 새로고침
    await this.refreshCardSet();
    
    // 이벤트 발생
    this.eventBus.emit(EventType.CARDSET_CHANGED, {
      includeSubfolders: include
    });
  }
  
  /**
   * 카드셋 고정 여부 가져오기
   * @returns 카드셋 고정 여부
   */
  isCardSetFixed(): boolean {
    const settings = this.settingsService.getSettings();
    return settings.isCardSetFixed || false;
  }
  
  /**
   * 카드셋 고정 여부 설정
   * @param fixed 카드셋 고정 여부
   */
  async setCardSetFixed(fixed: boolean): Promise<void> {
    // 현재 값과 같으면 아무 작업도 하지 않음
    if (this.isCardSetFixed() === fixed) return;
    
    // 설정 업데이트
    await this.settingsService.updateSettings({
      isCardSetFixed: fixed
    });
    
    // 카드셋 새로고침
    await this.refreshCardSet();
    
    // 이벤트 발생
    this.eventBus.emit(EventType.CARDSET_FIXED_CHANGED, {
      isFixed: fixed
    });
  }
} 