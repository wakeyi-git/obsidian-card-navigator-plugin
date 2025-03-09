import { App, TFile, TFolder, getAllTags } from 'obsidian';
import { ICard } from '../domain/card/Card';
import { CardSetSourceType, ICardSetSource, ICardSetState, ICardSet } from '../domain/cardset/CardSet';
import { 
  ICardSetSelectionManager, 
  ICardSetFilterManager, 
  ICardSetFileManager, 
  ICardSetStateManager, 
  ICardSetSearchManager, 
  ICardSetEventManager,
  ICardSetSourceManager,
} from '../domain/cardset/CardSetInterfaces';
import { SearchType } from '../domain/search/index';
import { ICardService } from './CardService';
import { ISearchService } from './SearchService';
import { EventType, EventListener } from '../domain/events/EventTypes';
import { TypedEventEmitter } from '../infrastructure/EventEmitter';
import { DomainEventBus } from '../domain/events/DomainEventBus';
import { CardSetError, InitializationError } from '../domain/errors';

/**
 * 카드셋 서비스 이벤트 타입
 */
export type CardSetServiceEvent = 
  | 'cardSetChanged'
  | 'sourceChanged'
  | 'includeSubfoldersChanged'
  | 'tagCaseSensitiveChanged';

/**
 * 카드셋 변경 이벤트 데이터 인터페이스
 */
export interface CardSetChangedEventData {
  cardSet: string | null;
  sourceType: CardSetSourceType;
  isFixed: boolean;
}

/**
 * 소스 변경 이벤트 데이터 인터페이스
 */
export interface SourceChangedEventData {
  previousSourceType: CardSetSourceType;
  newSourceType: CardSetSourceType;
}

/**
 * 확장된 카드셋 소스 인터페이스
 */
export interface IExtendedCardSetSource extends ICardSetSource {
  /**
   * 초기화
   */
  initialize(): Promise<void>;
  
  /**
   * 초기화 해제
   */
  reset(): void;
  
  /**
   * 카드셋 선택
   * @param cardSet 선택할 카드셋
   * @param isFixed 고정 여부
   */
  selectCardSet(cardSet: string, isFixed: boolean): void;
  
  /**
   * 카드셋 목록 가져오기
   * @returns 카드셋 목록
   */
  getCardSets(): Promise<ICardSet[]>;
  
  /**
   * 필터 옵션 목록 가져오기
   * @returns 필터 옵션 목록
   */
  getFilterOptions(): Promise<string[]>;
  
  /**
   * 파일 목록 가져오기
   * @returns 파일 경로 목록
   */
  getFiles(): Promise<string[]>;
  
  /**
   * 카드 목록 가져오기
   * @param cardService 카드 서비스
   * @returns 카드 목록
   */
  getCards(cardService: ICardService): Promise<ICard[]>;
  
  /**
   * 상태 설정
   * @param state 카드셋 상태
   */
  setState(state: ICardSetState): void;
  
  /**
   * 하위 폴더 포함 여부 설정 (폴더 소스인 경우)
   * @param include 하위 폴더 포함 여부
   */
  setIncludeSubfolders?(include: boolean): void;
  
  /**
   * 하위 폴더 포함 여부 가져오기 (폴더 소스인 경우)
   * @returns 하위 폴더 포함 여부
   */
  getIncludeSubfolders?(): boolean;
  
  /**
   * 태그 대소문자 구분 여부 설정 (태그 소스인 경우)
   * @param caseSensitive 대소문자 구분 여부
   */
  setCaseSensitive?(caseSensitive: boolean): void;
  
  /**
   * 태그 대소문자 구분 여부 가져오기 (태그 소스인 경우)
   * @returns 대소문자 구분 여부
   */
  isCaseSensitive?(): boolean;
}

/**
 * 카드셋 관리를 위한 서비스 인터페이스입니다.
 */
export interface ICardSetService {
  /**
   * 검색 서비스 설정
   * @param searchService 검색 서비스
   */
  setSearchService(searchService: ISearchService): void;
  
  /**
   * 서비스 초기화
   */
  initialize(): Promise<void>;
  
  /**
   * 설정 초기화
   */
  reset(): void;
  
  /**
   * 현재 카드셋 소스 가져오기
   */
  getCurrentSource(): IExtendedCardSetSource;
  
  /**
   * 현재 카드셋 소스 타입 가져오기
   */
  getCurrentSourceType(): CardSetSourceType;
  
  /**
   * 하위 폴더 포함 여부 설정
   * @param include 하위 폴더 포함 여부
   */
  setIncludeSubfolders(include: boolean): void;
  
  /**
   * 하위 폴더 포함 여부 가져오기
   */
  getIncludeSubfolders(): boolean;
  
  /**
   * 카드셋 목록 가져오기
   */
  getCardSets(): Promise<ICardSet[]>;
  
  /**
   * 필터 옵션 목록 가져오기
   */
  getFilterOptions(): Promise<string[]>;
  
  /**
   * 파일 목록 가져오기
   */
  getFiles(): Promise<string[]>;
  
  /**
   * 카드셋 소스 적용
   * @param cards 카드 목록
   */
  applySource(cards: ICard[]): Promise<ICard[]>;
  
  /**
   * 활성 파일 변경 이벤트 처리
   * @param file 활성 파일
   */
  handleActiveFileChange(file: TFile | null): Promise<boolean>;
  
  /**
   * 카드 목록 가져오기
   */
  getCards(): Promise<ICard[]>;
  
  /**
   * 검색 소스 설정
   * @param query 검색 쿼리
   * @param searchType 검색 타입
   * @param caseSensitive 대소문자 구분 여부
   * @param frontmatterKey 프론트매터 키
   */
  configureSearchSource(query: string, searchType?: SearchType, caseSensitive?: boolean, frontmatterKey?: string): void;
  
  /**
   * 폴더 카드셋 소스 가져오기
   */
  getFolderSource(): IExtendedCardSetSource;
  
  /**
   * 태그 카드셋 소스 가져오기
   */
  getTagSource(): IExtendedCardSetSource;
  
  /**
   * 이전 카드셋 소스 타입 가져오기
   */
  getPreviousSourceType(): CardSetSourceType;
  
  /**
   * 태그 대소문자 구분 여부 설정
   * @param caseSensitive 대소문자 구분 여부
   */
  setTagCaseSensitive(caseSensitive: boolean): void;
  
  /**
   * 태그 대소문자 구분 여부 확인
   */
  isTagCaseSensitive(): boolean;
  
  /**
   * 현재 카드셋 소스 상태 저장
   */
  saveCurrentSourceState(): void;
  
  /**
   * 이전 카드셋 소스 상태 복원
   */
  restorePreviousSourceState(): void;
  
  /**
   * 이전 카드셋 소스 타입 가져오기
   */
  getPreviousCardSetSource(): CardSetSourceType;
  
  /**
   * 이벤트 리스너 등록
   * @param event 이벤트 이름
   * @param listener 리스너 함수
   */
  on(event: CardSetServiceEvent, listener: (...args: any[]) => void): void;
  
  /**
   * 이벤트 리스너 제거
   * @param event 이벤트 이름
   * @param listener 리스너 함수
   */
  off(event: CardSetServiceEvent, listener: (...args: any[]) => void): void;
  
  /**
   * 현재 카드셋 가져오기
   */
  getCurrentCardSet(): ICardSet | null;
  
  /**
   * 이전 폴더 카드셋 가져오기
   */
  getPreviousFolderCardSet(): ICardSet | null;
  
  /**
   * 이전 태그 카드셋 가져오기
   */
  getPreviousTagCardSet(): ICardSet | null;
  
  /**
   * 카드셋 설정
   * @param cardSet 카드셋
   * @param isFixed 고정 여부
   */
  setCardSet(cardSet: ICardSet, isFixed: boolean): Promise<void>;
  
  /**
   * 카드셋 선택
   * @param cardSet 선택할 카드셋
   * @param isFixed 고정 여부
   */
  selectCardSet(cardSet: string, isFixed: boolean): Promise<void>;
}

/**
 * 카드셋 서비스 구현 클래스
 * 카드셋 관리를 위한 서비스입니다.
 */
export class CardSetService implements ICardSetService {
  private app: App;
  private currentSource: IExtendedCardSetSource;
  private folderSource: IExtendedCardSetSource;
  private tagSource: IExtendedCardSetSource;
  private includeSubfolders = true;
  private cardService: ICardService;
  private searchService: ISearchService | null = null;
  private previousSource: IExtendedCardSetSource | null = null;
  private previousSourceType: CardSetSourceType | null = null;
  private previousState: ICardSetState | null = null;
  private tagCaseSensitive = false;
  private eventEmitter = new CardSetEventEmitter();
  private eventBus = DomainEventBus.getInstance();
  
  // 카드 세트 관리를 위한 변수
  private currentCardSet: ICardSet | null = null;
  private previousFolderCardSet: ICardSet | null = null;
  private previousTagCardSet: ICardSet | null = null;
  
  private isInitialized = false;
  
  constructor(app: App, cardService: ICardService, defaultSourceType: CardSetSourceType = 'folder') {
    this.app = app;
    this.cardService = cardService;
    
    // 폴더 카드셋 소스 생성
    this.folderSource = defaultSourceType === 'folder' ? new FolderCardSetSource(app) : new TagCardSetSource(app);
    
    // 태그 카드셋 소스 생성
    this.tagSource = defaultSourceType === 'tag' ? new TagCardSetSource(app) : new FolderCardSetSource(app);
    
    // 기본 카드셋 소스 설정
    this.currentSource = defaultSourceType === 'folder' ? this.folderSource : this.tagSource;
  }
  
  /**
   * 검색 서비스 설정
   * @param searchService 검색 서비스
   */
  setSearchService(searchService: ISearchService): void {
    this.searchService = searchService;
  }
  
  /**
   * 서비스 초기화
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }
    
    try {
      // 폴더 소스 초기화
      await this.folderSource.initialize();
      
      // 태그 소스 초기화
      await this.tagSource.initialize();
      
      // 초기화 완료
      this.isInitialized = true;
    } catch (error) {
      console.error('[CardSetService] 초기화 오류:', error);
      throw new InitializationError('카드셋 서비스 초기화 중 오류가 발생했습니다.');
    }
  }
  
  /**
   * 설정 초기화
   */
  reset(): void {
    // 폴더 카드셋 소스 초기화
    this.folderSource.reset();
    
    // 태그 카드셋 소스 초기화
    this.tagSource.reset();
    
    // 현재 카드셋 소스 초기화
    this.currentSource.reset();
    
    // 이전 상태 초기화
    this.previousSource = null;
    this.currentCardSet = null;
    this.previousFolderCardSet = null;
    this.previousTagCardSet = null;
  }
  
  /**
   * 현재 카드셋 소스 가져오기
   */
  getCurrentSource(): IExtendedCardSetSource {
    return this.currentSource;
  }
  
  /**
   * 현재 카드셋 소스 타입 가져오기
   */
  getCurrentSourceType(): CardSetSourceType {
    return this.currentSource.type;
  }
  
  /**
   * 현재 카드셋 가져오기
   * @returns 현재 카드셋
   */
  getCurrentCardSet(): ICardSet | null {
    return this.currentCardSet;
  }
  
  /**
   * 이전 폴더 카드셋 가져오기
   * @returns 이전 폴더 카드셋
   */
  getPreviousFolderCardSet(): ICardSet | null {
    return this.previousFolderCardSet;
  }
  
  /**
   * 이전 태그 카드셋 가져오기
   * @returns 이전 태그 카드셋
   */
  getPreviousTagCardSet(): ICardSet | null {
    return this.previousTagCardSet;
  }
  
  /**
   * 카드셋 설정
   * @param cardSet 카드셋
   * @param isFixed 고정 여부
   */
  async setCardSet(cardSet: ICardSet, isFixed: boolean): Promise<void> {
    // 카드셋 설정
    const { source, sourceType } = cardSet;
    
    // 소스 타입이 다른 경우 소스 변경
    if (sourceType !== this.getCurrentSourceType()) {
      await this.changeCardSetSource(sourceType);
    }
    
    // 현재 카드셋 소스에 카드셋 설정
    this.currentSource.selectCardSet(source, isFixed);
    
    // 현재 카드셋 업데이트
    const cardSets = await this.getCardSets();
    const foundCardSet = cardSets.find(cs => cs.source === source);
    
    if (foundCardSet) {
      this.currentCardSet = foundCardSet;
      
      // 소스 타입에 따라 이전 카드셋 저장
      if (sourceType === 'folder') {
        this.previousFolderCardSet = foundCardSet;
      } else if (sourceType === 'tag') {
        this.previousTagCardSet = foundCardSet;
      }
      
      // 이벤트 발생
      this.emit('cardSetChanged', {
        cardSet: source,
        sourceType: this.getCurrentSourceType(),
        isFixed: isFixed
      });
    }
  }
  
  /**
   * 카드셋 소스 변경하기
   * @param sourceType 변경할 소스 타입
   */
  async changeCardSetSource(sourceType: CardSetSourceType): Promise<void> {
    console.log(`[CardSetService] 카드셋 소스 변경: ${sourceType}`);
    
    // 이전 카드셋 소스 저장
    const previousSourceType = this.currentSource.type;
    
    // 같은 소스 타입으로 변경하는 경우 중복 처리 방지
    if (previousSourceType === sourceType) {
      console.log(`[CardSetService] 이미 ${sourceType} 소스 타입입니다. 변경 작업을 건너뜁니다.`);
      return;
    }
    
    // 소스 타입 변경
    await this.changeSource(sourceType);
    
    // 소스 타입에 따른 추가 작업
    switch (sourceType) {
      case 'folder':
        // 이전 폴더 카드셋이 있으면 복원
        if (this.previousFolderCardSet) {
          await this.selectCardSet(this.previousFolderCardSet.source, this.isCardSetFixed());
          this.currentCardSet = this.previousFolderCardSet;
        }
        break;
      case 'tag':
        // 이전 태그 카드셋이 있으면 복원
        if (this.previousTagCardSet) {
          await this.selectCardSet(this.previousTagCardSet.source, this.isCardSetFixed());
          this.currentCardSet = this.previousTagCardSet;
        }
        break;
      case 'search':
        // 검색 소스로 변경하기 전에 현재 상태 저장
        this.saveCurrentSourceState();
        break;
    }
    
    console.log(`[CardSetService] 카드셋 소스 변경 완료: ${previousSourceType} -> ${sourceType}`);
  }
  
  /**
   * 카드셋 소스 변경
   * @param sourceType 변경할 카드셋 소스 타입
   */
  private async changeSource(sourceType: CardSetSourceType): Promise<void> {
    // 현재 소스 타입과 같으면 변경하지 않음
    if (sourceType === this.getCurrentSourceType()) {
      return;
    }
    
    // 이전 소스 타입 저장
    const previousSourceType = this.getCurrentSourceType();
    
    // 소스 타입에 따라 소스 변경
    switch (sourceType) {
      case 'folder':
        this.currentSource = this.folderSource;
        break;
      case 'tag':
        this.currentSource = this.tagSource;
        break;
      case 'search':
        // 검색 서비스가 설정되지 않은 경우 오류
        if (!this.searchService) {
          throw new CardSetError('검색 서비스가 설정되지 않았습니다.');
        }
        
        // 검색 소스 가져오기
        this.currentSource = this.searchService.getSearchSource();
        break;
      default:
        throw new CardSetError(`지원하지 않는 카드셋 소스 타입: ${sourceType}`);
    }
    
    // 이벤트 발생
    this.emit('sourceChanged', {
      previousSourceType,
      newSourceType: this.getCurrentSourceType()
    });
  }
  
  /**
   * 현재 선택된 카드셋 소스 가져오기
   * @returns 현재 선택된 카드셋 소스
   */
  getCurrentCardSetSource(): string | null {
    return this.currentSource.currentCardSet;
  }
  
  /**
   * 카드셋 고정 여부 가져오기
   * @returns 카드셋 고정 여부
   */
  isCardSetFixed(): boolean {
    return this.currentSource.isCardSetFixed();
  }
  
  /**
   * 하위 폴더 포함 여부 설정
   * @param include 하위 폴더 포함 여부
   */
  setIncludeSubfolders(include: boolean): void {
    // 인스턴스 변수 업데이트
    this.includeSubfolders = include;
    
    // 폴더 카드셋 소스에 설정 적용
    if (this.folderSource && typeof this.folderSource.setIncludeSubfolders === 'function') {
      this.folderSource.setIncludeSubfolders(include);
    }
    
    // 이벤트 발생
    this.emit('includeSubfoldersChanged', include);
  }
  
  /**
   * 하위 폴더 포함 여부 가져오기
   * @returns 하위 폴더 포함 여부
   */
  getIncludeSubfolders(): boolean {
    return this.includeSubfolders;
  }
  
  /**
   * 카드셋 목록 가져오기
   * @returns 카드셋 목록
   */
  async getCardSets(): Promise<ICardSet[]> {
    // 현재 소스에서 카드셋 목록을 가져옴
    const cardSets = await this.currentSource.getCardSets();
    
    return cardSets;
  }
  
  /**
   * 필터 옵션 목록 가져오기
   * @returns 필터 옵션 목록
   */
  async getFilterOptions(): Promise<string[]> {
    return this.currentSource.getFilterOptions();
  }
  
  /**
   * 현재 카드셋 소스에 따라 파일 목록 가져오기
   * @returns 파일 경로 목록
   */
  async getFiles(): Promise<string[]> {
    return this.currentSource.getFiles();
  }
  
  /**
   * 현재 카드셋 소스를 카드 목록에 적용
   * @param cards 카드 목록
   * @returns 필터링된 카드 목록
   */
  async applySource(cards: ICard[]): Promise<ICard[]> {
    if (this.currentSource.type === 'folder') {
      // 폴더 소스인 경우
      const folderFiles = await this.getFiles();
      return cards.filter(card => folderFiles.includes(card.getPath()));
    } else if (this.currentSource.type === 'tag') {
      // 태그 소스인 경우
      const tagFiles = await this.getFiles();
      return cards.filter(card => tagFiles.includes(card.getPath()));
    } else if (this.currentSource.type === 'search') {
      // 검색 소스인 경우
      const searchFiles = await this.getFiles();
      return cards.filter(card => searchFiles.includes(card.getPath()));
    }
    
    // 기본적으로 모든 카드 반환
    return cards;
  }
  
  /**
   * 활성 파일 변경 이벤트 처리
   * @param file 활성 파일
   * @returns 카드셋이 변경되었는지 여부
   */
  async handleActiveFileChange(file: TFile | null): Promise<boolean> {
    // 카드셋이 고정되어 있으면 변경하지 않음
    if (this.isCardSetFixed()) {
      return false;
    }
    
    // 파일이 없으면 처리하지 않음
    if (!file) {
      return false;
    }
    
    // 현재 카드셋 소스 타입에 따라 처리
    if (this.currentSource.type === 'folder') {
      // 폴더 소스인 경우 파일의 폴더 경로 가져오기
      const folderPath = file.parent ? file.parent.path : '/';
      
      // 현재 카드셋과 다른 경우에만 변경
      if (this.currentSource.currentCardSet !== folderPath) {
        await this.selectCardSet(folderPath, false);
        return true;
      }
    } else if (this.currentSource.type === 'tag') {
      // 태그 소스인 경우 파일의 태그 목록 가져오기
      const fileCache = this.app.metadataCache.getFileCache(file);
      if (fileCache && fileCache.tags && fileCache.tags.length > 0) {
        // 첫 번째 태그 사용
        const firstTag = fileCache.tags[0].tag;
        
        // 현재 카드셋과 다른 경우에만 변경
        if (this.currentSource.currentCardSet !== firstTag) {
          await this.selectCardSet(firstTag, false);
          return true;
        }
      }
    }
    
    return false;
  }
  
  /**
   * 현재 카드셋 소스에 따라 카드 목록을 가져옵니다.
   * @returns 카드 목록
   */
  async getCards(): Promise<ICard[]> {
    return this.currentSource.getCards(this.cardService);
  }
  
  /**
   * 검색 소스 설정
   * @param query 검색 쿼리
   * @param searchType 검색 타입
   * @param caseSensitive 대소문자 구분 여부
   * @param frontmatterKey 프론트매터 키 (검색 타입이 frontmatter인 경우)
   */
  configureSearchSource(query: string, searchType?: SearchType, caseSensitive?: boolean, frontmatterKey?: string): void {
    if (this.searchService) {
      this.searchService.configureSearchSource(query, searchType, caseSensitive, frontmatterKey);
    }
  }
  
  /**
   * 폴더 카드셋 소스 가져오기
   * @returns 폴더 카드셋 소스 객체
   */
  getFolderSource(): IExtendedCardSetSource {
    return this.folderSource;
  }
  
  /**
   * 태그 카드셋 소스 가져오기
   * @returns 태그 카드셋 소스 객체
   */
  getTagSource(): IExtendedCardSetSource {
    return this.tagSource;
  }
  
  /**
   * 이전 카드셋 소스 가져오기
   * @returns 이전 카드셋 소스
   */
  getPreviousSourceType(): CardSetSourceType {
    return this.previousSource ? this.previousSource.type : 'folder';
  }
  
  /**
   * 태그 대소문자 구분 여부 설정
   * @param caseSensitive 대소문자 구분 여부
   */
  setTagCaseSensitive(caseSensitive: boolean): void {
    if (this.tagSource && typeof this.tagSource.setCaseSensitive === 'function') {
      this.tagSource.setCaseSensitive(caseSensitive);
      
      // 이벤트 발생
      this.emit('tagCaseSensitiveChanged', caseSensitive);
    }
  }
  
  /**
   * 태그 대소문자 구분 여부 확인
   * @returns 대소문자 구분 여부
   */
  isTagCaseSensitive(): boolean {
    return this.tagSource && typeof this.tagSource.isCaseSensitive === 'function' 
      ? this.tagSource.isCaseSensitive() 
      : false;
  }
  
  /**
   * 현재 카드셋 소스 상태 저장
   */
  saveCurrentSourceState(): void {
    // 이전 소스 타입 저장
    this.previousSourceType = this.getCurrentSourceType();
    
    // 이전 소스 저장
    this.previousSource = this.getCurrentSource();
    
    // 이전 상태 저장
    this.previousState = this.getCurrentSource().getState();
  }
  
  /**
   * 이전 카드셋 소스 상태 복원
   */
  restorePreviousSourceState(): void {
    if (this.previousSource && this.previousState) {
      // 이전 소스 타입으로 변경
      if (this.previousSourceType === 'folder') {
        this.currentSource = this.folderSource;
      } else if (this.previousSourceType === 'tag') {
        this.currentSource = this.tagSource;
      }
      
      // 이전 상태 복원
      this.currentSource.setState(this.previousState);
      
      // 이벤트 발생
      this.emit('sourceChanged', {
        previousSourceType: 'search',
        newSourceType: this.previousSourceType
      });
      
      // 이전 소스 정보 초기화
      this.previousSource = null;
      this.previousSourceType = null;
      this.previousState = null;
    }
  }
  
  /**
   * 이전 카드셋 소스 타입 가져오기
   * @returns 이전 카드셋 소스 타입
   */
  getPreviousCardSetSource(): CardSetSourceType {
    return this.previousSource ? this.previousSource.type : 'folder';
  }
  
  /**
   * 이벤트 리스너 등록
   * @param event 이벤트 이름
   * @param listener 리스너 함수
   */
  on(event: CardSetServiceEvent, listener: (...args: any[]) => void): void {
    this.eventEmitter.on(event, listener);
  }
  
  /**
   * 이벤트 리스너 제거
   * @param event 이벤트 이름
   * @param listener 리스너 함수
   */
  off(event: CardSetServiceEvent, listener: (...args: any[]) => void): void {
    this.eventEmitter.off(event, listener);
  }

  /**
   * 이벤트 발생
   * @param event 이벤트 이름
   * @param args 이벤트 인자
   */
  private emit(event: CardSetServiceEvent, ...args: any[]): void {
    this.eventEmitter.emit(event, ...args);
    
    // 도메인 이벤트 버스로도 이벤트 발생
    switch (event) {
      case 'cardSetChanged':
        const cardSetData = args[0] as CardSetChangedEventData;
        this.eventBus.emit(EventType.CARD_SET_CHANGED, cardSetData);
        break;
      case 'sourceChanged':
        const sourceData = args[0] as SourceChangedEventData;
        this.eventBus.emit(EventType.SOURCE_CHANGED, sourceData);
        break;
      case 'includeSubfoldersChanged':
        this.eventBus.emit(EventType.INCLUDE_SUBFOLDERS_CHANGED, args[0] as boolean);
        break;
      case 'tagCaseSensitiveChanged':
        this.eventBus.emit(EventType.TAG_CASE_SENSITIVE_CHANGED, args[0] as boolean);
        break;
    }
  }

  /**
   * 카드셋 선택
   * @param cardSet 선택할 카드셋
   * @param isFixed 고정 여부
   */
  async selectCardSet(cardSet: string, isFixed: boolean): Promise<void> {
    console.log(`[CardSetService] 카드셋 선택: ${cardSet}, 고정 여부: ${isFixed}`);
    
    // 현재 카드셋 소스에 카드셋 설정
    this.currentSource.selectCardSet(cardSet, isFixed);
    
    // 현재 카드셋 업데이트
    const cardSets = await this.getCardSets();
    const selectedCardSet = cardSets.find(cs => cs.source === cardSet);
    
    if (selectedCardSet) {
      this.currentCardSet = selectedCardSet;
      
      // 소스 타입에 따라 이전 카드셋 저장
      if (this.currentSource.type === 'folder') {
        this.previousFolderCardSet = selectedCardSet;
      } else if (this.currentSource.type === 'tag') {
        this.previousTagCardSet = selectedCardSet;
      }
    }
    
    // 이벤트 발생
    this.emit('cardSetChanged', {
      cardSet,
      sourceType: this.getCurrentSourceType(),
      isFixed: this.isCardSetFixed()
    });
    
    console.log(`[CardSetService] 카드셋 선택 완료: ${cardSet}`);
  }
}

/**
 * 타입이 지정된 이벤트 이미터 클래스
 */
class CardSetEventEmitter {
  private events: Map<CardSetServiceEvent, Array<(...args: any[]) => void>> = new Map();
  
  /**
   * 이벤트 리스너 등록
   * @param event 이벤트 이름
   * @param listener 리스너 함수
   */
  on(event: CardSetServiceEvent, listener: (...args: any[]) => void): void {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)?.push(listener);
  }
  
  /**
   * 이벤트 리스너 제거
   * @param event 이벤트 이름
   * @param listener 리스너 함수
   */
  off(event: CardSetServiceEvent, listener: (...args: any[]) => void): void {
    if (!this.events.has(event)) {
      return;
    }
    
    const listeners = this.events.get(event);
    if (!listeners) return;
    
    const index = listeners.indexOf(listener);
    if (index !== -1) {
      listeners.splice(index, 1);
    }
  }
  
  /**
   * 이벤트 발생
   * @param event 이벤트 이름
   * @param args 이벤트 인자
   */
  emit(event: CardSetServiceEvent, ...args: any[]): void {
    if (!this.events.has(event)) {
      return;
    }
    
    const listeners = this.events.get(event);
    if (!listeners) return;
    
    listeners.forEach(listener => {
      listener(...args);
    });
  }
}

/**
 * 폴더 카드셋 소스 클래스
 */
class FolderCardSetSource implements IExtendedCardSetSource {
  type: CardSetSourceType = 'folder';
  currentCardSet: string | null = null;
  private app: App;
  private isFixed: boolean = false;
  private includeSubfolders: boolean = true;
  
  constructor(app: App) {
    this.app = app;
  }
  
  async initialize(): Promise<void> {
    // 초기화 로직
  }
  
  reset(): void {
    this.currentCardSet = null;
    this.isFixed = false;
  }
  
  selectCardSet(cardSet: string, isFixed: boolean): void {
    this.currentCardSet = cardSet;
    this.isFixed = isFixed;
  }
  
  async getCardSets(): Promise<ICardSet[]> {
    // 폴더 목록을 카드셋으로 변환
    return [];
  }
  
  async getFilterOptions(): Promise<string[]> {
    // 필터 옵션 목록 반환
    return [];
  }
  
  async getFiles(): Promise<string[]> {
    // 파일 목록 반환
    return [];
  }
  
  async getCards(cardService: ICardService): Promise<ICard[]> {
    // 카드 목록 반환
    return [];
  }
  
  setState(state: ICardSetState): void {
    this.currentCardSet = state.currentCardSet;
    this.isFixed = state.isFixed;
  }
  
  isCardSetFixed(): boolean {
    return this.isFixed;
  }
  
  getState(): ICardSetState {
    return {
      currentCardSet: this.currentCardSet,
      isFixed: this.isFixed
    };
  }
  
  setIncludeSubfolders(include: boolean): void {
    this.includeSubfolders = include;
  }
  
  getIncludeSubfolders(): boolean {
    return this.includeSubfolders;
  }
}

/**
 * 태그 카드셋 소스 클래스
 */
class TagCardSetSource implements IExtendedCardSetSource {
  type: CardSetSourceType = 'tag';
  currentCardSet: string | null = null;
  private app: App;
  private isFixed: boolean = false;
  private caseSensitive: boolean = false;
  
  constructor(app: App) {
    this.app = app;
  }
  
  async initialize(): Promise<void> {
    // 초기화 로직
  }
  
  reset(): void {
    this.currentCardSet = null;
    this.isFixed = false;
  }
  
  selectCardSet(cardSet: string, isFixed: boolean): void {
    this.currentCardSet = cardSet;
    this.isFixed = isFixed;
  }
  
  async getCardSets(): Promise<ICardSet[]> {
    // 태그 목록을 카드셋으로 변환
    return [];
  }
  
  async getFilterOptions(): Promise<string[]> {
    // 필터 옵션 목록 반환
    return [];
  }
  
  async getFiles(): Promise<string[]> {
    // 파일 목록 반환
    return [];
  }
  
  async getCards(cardService: ICardService): Promise<ICard[]> {
    // 카드 목록 반환
    return [];
  }
  
  setState(state: ICardSetState): void {
    this.currentCardSet = state.currentCardSet;
    this.isFixed = state.isFixed;
  }
  
  isCardSetFixed(): boolean {
    return this.isFixed;
  }
  
  getState(): ICardSetState {
    return {
      currentCardSet: this.currentCardSet,
      isFixed: this.isFixed
    };
  }
  
  setCaseSensitive(caseSensitive: boolean): void {
    this.caseSensitive = caseSensitive;
  }
  
  isCaseSensitive(): boolean {
    return this.caseSensitive;
  }
} 