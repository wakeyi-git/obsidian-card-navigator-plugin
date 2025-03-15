import { TFile } from 'obsidian';
import { CardSetSourceType, ICardSet, ICardSetSource, ICardSetState } from '../../domain/cardset/CardSet';
import { ICardSetSourceManager } from '../../domain/cardset/CardSetInterfaces';
import { DomainEventBus } from '../../core/events/DomainEventBus';
import { EventType, SettingsChangedEventData } from '../../domain/events/EventTypes';
import { ICardSetSourceController } from '../../domain/interaction/InteractionInterfaces';
import { ISettingsService } from '../../domain/settings/SettingsInterfaces';
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
    const settings = this.settingsService.getSettings();
    
    console.log('활성 파일 변경됨:', file?.path);
    console.log('활성 파일 부모 폴더:', file?.parent?.path);
    
    // 폴더 카드셋인 경우 폴더 변경 확인
    if (this.currentCardSetSource === 'folder') {
      const currentFolderPath = this.currentCardSet?.source || '';
      const newFolderPath = file?.parent?.path || '';
      
      console.log('폴더 비교:', currentFolderPath, '->', newFolderPath);
      console.log('카드셋 고정 여부:', settings.isCardSetFixed);
      
      // 폴더가 변경되었고 고정된 카드셋이 아닌 경우
      if (currentFolderPath !== newFolderPath && !settings.isCardSetFixed) {
        console.log('폴더 변경 감지:', currentFolderPath, '->', newFolderPath);
        
        // 이전 카드셋 ID 저장
        const previousCardSetId = this.currentCardSet?.id;
        
        // 카드셋 새로고침 전 현재 카드셋 ID 로깅
        console.log('카드셋 새로고침 전 현재 카드셋:', {
          id: this.currentCardSet?.id,
          source: this.currentCardSet?.source,
          파일수: this.currentCardSet?.files?.length || 0
        });
        
        // 카드셋 새로고침
        await this.refreshCardSet();
        
        // 카드셋 새로고침 후 현재 카드셋 ID 로깅
        console.log('카드셋 새로고침 후 현재 카드셋:', {
          id: this.currentCardSet?.id,
          source: this.currentCardSet?.source,
          파일수: this.currentCardSet?.files?.length || 0
        });
        
        // 카드셋이 실제로 변경된 경우에만 이벤트 발생
        if (this.currentCardSet && !isSameCardSetId(previousCardSetId, this.currentCardSet.id)) {
          console.log('활성 파일 변경으로 카드셋 변경됨:', previousCardSetId, '->', this.currentCardSet.id);
          
          // 명시적으로 카드셋 변경 이벤트 발생
          console.log('카드셋 변경 이벤트 발생:', {
            이전ID: previousCardSetId,
            새ID: this.currentCardSet.id,
            폴더: newFolderPath
          });
          
          this.eventBus.emit(EventType.CARDSET_CHANGED, {
            cardSet: newFolderPath,
            sourceType: 'folder',
            isFixed: false,
            previousCardSetId: previousCardSetId
          });
        } else {
          console.log('카드셋 ID가 변경되지 않음:', previousCardSetId, '=', this.currentCardSet?.id);
        }
        
        return;
      } else {
        console.log('폴더 변경 없음 또는 고정된 카드셋 사용 중');
      }
    }
    
    // 고정된 카드셋이 아닌 경우에만 활성 파일 변경에 따라 카드셋 변경
    if (!settings.isCardSetFixed) {
      // 이전 카드셋 ID 저장
      const previousCardSetId = this.currentCardSet?.id;
      
      // 카드셋 새로고침
      await this.refreshCardSet();
      
      // 카드셋이 실제로 변경된 경우에만 이벤트 발생
      if (this.currentCardSet && !isSameCardSetId(previousCardSetId, this.currentCardSet.id)) {
        // 이벤트 발생
        const cardSet = this.currentCardSetSource === 'folder'
          ? file?.parent?.path || ''
          : this.getTagsFromFile(file).join(', ');
        
        console.log('활성 파일 변경으로 카드셋 변경됨:', previousCardSetId, '->', this.currentCardSet.id);
        
        this.eventBus.emit(EventType.CARDSET_CHANGED, {
          cardSet,
          sourceType: this.currentCardSetSource,
          isFixed: false,
          previousCardSetId: previousCardSetId
        });
      } else {
        console.log('활성 파일 변경되었으나 카드셋 ID 변경 없음, 이벤트 발생 생략');
      }
    } else {
      console.log('고정된 카드셋 사용 중, 활성 파일 변경 무시');
    }
  }
  
  /**
   * 카드셋 새로고침
   */
  async refreshCardSet(): Promise<void> {
    try {
      console.log('카드셋 새로고침 시작');
      console.log('현재 카드셋 소스:', this.currentCardSetSource);
      console.log('refreshCardSet 호출 스택:', new Error().stack);
      
      // 이전 카드셋 저장
      const previousCardSet = this.currentCardSet;
      const previousCardSetId = previousCardSet?.id;
      const previousCardSetFiles = previousCardSet?.files?.length || 0;
      
      // 폴더 카드셋이고 고정되지 않은 경우 활성 파일의 폴더 확인
      if (this.currentCardSetSource === 'folder' && !this.settingsService.getSettings().isCardSetFixed) {
        const activeFile = this.obsidianService.getActiveFile();
        if (activeFile && activeFile.parent) {
          const folderPath = activeFile.parent.path;
          const expectedCardSetId = createFolderCardSetId(folderPath);
          
          // 현재 카드셋 ID와 예상 카드셋 ID가 다른 경우 로그 출력
          if (previousCardSetId && !isSameCardSetId(previousCardSetId, expectedCardSetId)) {
            console.log('활성 폴더 변경 감지:', previousCardSetId, '->', expectedCardSetId);
          }
        }
      }
      
      // 카드셋 소스에 따라 카드셋 새로고침
      switch (this.currentCardSetSource) {
        case 'folder':
          console.log('폴더 카드셋 새로고침 시작');
          this.currentCardSet = await this.refreshFolderCardSet();
          console.log('폴더 카드셋 새로고침 완료:', this.currentCardSet);
          break;
        case 'tag':
          console.log('태그 카드셋 새로고침 시작');
          this.currentCardSet = await this.refreshTagCardSet();
          console.log('태그 카드셋 새로고침 완료:', this.currentCardSet);
          break;
        case 'search':
          console.log('검색 카드셋 새로고침 시작');
          this.currentCardSet = await this.refreshSearchCardSet();
          console.log('검색 카드셋 새로고침 완료:', this.currentCardSet);
          break;
        default:
          // 기본값은 폴더 카드셋
          console.log('기본 폴더 카드셋 새로고침 시작');
          this.currentCardSet = await this.refreshFolderCardSet();
          console.log('기본 폴더 카드셋 새로고침 완료:', this.currentCardSet);
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
        
        console.log('카드셋 파일 수(중복 제거 후):', this.currentCardSet.files.length);
      }
      
      // 카드셋 변경 이벤트 발생 (카드셋이 변경된 경우에만)
      if (this.currentCardSet) {
        const currentCardSetFiles = this.currentCardSet.files.length;
        console.log('카드셋 파일 수:', currentCardSetFiles);
        
        if (currentCardSetFiles > 0) {
          console.log('첫 번째 파일:', this.currentCardSet.files[0].path);
        } else {
          console.log('카드셋에 파일이 없습니다.');
        }
        
        // 카드셋 ID가 변경되었거나 파일 수가 변경된 경우에만 이벤트 발생
        const isCardSetIdChanged = !previousCardSetId || !isSameCardSetId(previousCardSetId, this.currentCardSet.id);
        const isFileCountChanged = previousCardSetFiles !== currentCardSetFiles;
        
        if (isCardSetIdChanged || isFileCountChanged) {
          if (isCardSetIdChanged) {
            console.log('카드셋 ID 변경됨:', previousCardSetId, '->', this.currentCardSet.id);
          }
          
          if (isFileCountChanged) {
            console.log('카드셋 파일 수 변경됨:', previousCardSetFiles, '->', currentCardSetFiles);
          }
          
          // 이벤트 발생 전 추가 검증
          if (this.currentCardSet.id) {
            this.eventBus.emit(EventType.CARDS_CHANGED, {
              cards: this.currentCardSet.files.map(file => this.obsidianService.getCardFromFile(file)),
              totalCount: currentCardSetFiles,
              filteredCount: currentCardSetFiles
            });
          } else {
            console.log('카드셋 ID가 없어 이벤트 발생 생략');
          }
        } else {
          console.log('카드셋 ID와 파일 수 변경 없음, 이벤트 발생 생략');
        }
        
        console.log('카드셋 새로고침 완료:', this.currentCardSet);
      } else {
        console.log('카드셋이 null입니다.');
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
      
      console.log('오류로 인해 빈 카드셋 생성:', this.currentCardSet);
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
} 