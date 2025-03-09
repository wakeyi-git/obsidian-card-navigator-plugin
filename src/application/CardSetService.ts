import { App, TFile } from 'obsidian';
import { ICard } from '../domain/card/Card';
import { CardSetSourceType, ICardSetSource, ICardSetState, ICardSet, ICardSetManager } from '../domain/cardset/CardSet';
import { FolderCardSetSource } from '../domain/cardset/FolderCardSetSource';
import { TagCardSetSource } from '../domain/cardset/TagCardSetSource';
import { SearchType } from '../domain/search/Search';
import { ICardService } from './CardService';
import { ISearchService } from './SearchService';
import { EventType, EventListener } from '../domain/events/EventTypes';
import { TypedEventEmitter } from '../infrastructure/EventEmitter';
import { 
  ICardSetSelectionManager, 
  ICardSetFilterManager, 
  ICardSetFileManager, 
  ICardSetStateManager, 
  ICardSetSearchManager, 
  ICardSetEventManager 
} from '../domain/cardset/CardSetInterfaces';

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
 * 카드셋 서비스 인터페이스
 * 카드셋 관리를 위한 서비스 인터페이스입니다.
 */
export interface ICardSetService extends ICardSetManager {
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
  getCurrentSource(): ICardSetSource;
  
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
  getFolderSource(): FolderCardSetSource;
  
  /**
   * 태그 카드셋 소스 가져오기
   */
  getTagSource(): TagCardSetSource;
  
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
}

/**
 * 카드셋 서비스 구현 클래스
 * 카드셋 관리를 위한 서비스입니다.
 */
export class CardSetService implements ICardSetService {
  private app: App;
  private currentSource: ICardSetSource;
  private folderSource: FolderCardSetSource;
  private tagSource: TagCardSetSource;
  private includeSubfolders = true;
  private cardService: ICardService;
  private previousSource: { type: CardSetSourceType; state: ICardSetState } | null = null;
  
  // 카드 세트 관리를 위한 변수
  private currentCardSet: ICardSet | null = null;
  private previousFolderCardSet: ICardSet | null = null;
  private previousTagCardSet: ICardSet | null = null;
  
  private searchService: ISearchService | null = null;
  protected eventEmitter: TypedEventEmitter;
  
  constructor(app: App, cardService: ICardService, defaultSourceType: CardSetSourceType = 'folder') {
    this.app = app;
    this.cardService = cardService;
    this.eventEmitter = new TypedEventEmitter();
    
    // 폴더 카드셋 소스 생성
    this.folderSource = new FolderCardSetSource(app);
    
    // 태그 카드셋 소스 생성
    this.tagSource = new TagCardSetSource(app);
    
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
    // 초기화 작업 수행
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
   * @returns 현재 카드셋 소스
   */
  getCurrentSource(): ICardSetSource {
    return this.currentSource;
  }
  
  /**
   * 현재 카드셋 소스 타입 가져오기
   * @returns 현재 카드셋 소스 타입
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
   * 카드셋 설정하기
   * @param cardSet 설정할 카드셋
   * @param isFixed 고정 여부
   */
  async setCardSet(cardSet: ICardSet, isFixed?: boolean): Promise<void> {
    // 현재 카드셋 설정
    this.currentCardSet = cardSet;
    
    // 소스 타입에 따라 이전 카드셋 저장
    if (cardSet.sourceType === 'folder') {
      this.previousFolderCardSet = cardSet;
    } else if (cardSet.sourceType === 'tag') {
      this.previousTagCardSet = cardSet;
    }
    
    // 현재 소스에 카드셋 설정
    await this.selectCardSet(cardSet.source, isFixed);
  }
  
  /**
   * 카드셋 소스 변경하기
   * @param sourceType 변경할 소스 타입
   */
  async changeCardSetSource(sourceType: CardSetSourceType): Promise<void> {
    console.log(`[CardSetService] 카드셋 소스 변경: ${sourceType}`);
    
    // 이전 카드셋 소스 저장
    const previousSourceType = this.currentSource.type;
    
    // 새 카드셋 소스 설정
    switch (sourceType) {
      case 'folder':
        this.currentSource = this.folderSource;
        
        // 이전 폴더 카드셋이 있으면 복원
        if (this.previousFolderCardSet) {
          await this.selectCardSet(this.previousFolderCardSet.source, this.isCardSetFixed());
          this.currentCardSet = this.previousFolderCardSet;
        }
        break;
      case 'tag':
        this.currentSource = this.tagSource;
        
        // 이전 태그 카드셋이 있으면 복원
        if (this.previousTagCardSet) {
          await this.selectCardSet(this.previousTagCardSet.source, this.isCardSetFixed());
          this.currentCardSet = this.previousTagCardSet;
        }
        break;
      case 'search':
        // 검색 소스로 변경하기 전에 현재 상태 저장
        this.saveCurrentSourceState();
        
        // 검색 서비스가 있는 경우 검색 소스 설정
        if (this.searchService) {
          this.currentSource = this.searchService.getSearchSource();
        } else {
          console.error(`[CardSetService] 검색 서비스가 설정되지 않았습니다.`);
        }
        break;
      default:
        console.error(`[CardSetService] 알 수 없는 카드셋 소스 타입: ${sourceType}`);
        return;
    }
    
    // 이벤트 발생
    this.eventEmitter.emit(EventType.SOURCE_CHANGED, {
      previousSourceType,
      newSourceType: sourceType
    });
    
    console.log(`[CardSetService] 카드셋 소스 변경 완료: ${previousSourceType} -> ${this.currentSource.type}`);
  }
  
  /**
   * 카드셋 선택
   * @param cardSet 선택할 카드셋
   * @param isFixed 고정 여부
   */
  async selectCardSet(cardSet: string, isFixed?: boolean): Promise<void> {
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
    this.eventEmitter.emit(EventType.CARD_SET_CHANGED, {
      cardSet,
      sourceType: this.getCurrentSourceType(),
      isFixed: this.isCardSetFixed()
    });
    
    console.log(`[CardSetService] 카드셋 선택 완료: ${cardSet}`);
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
    console.log(`[CardSetService] 하위 폴더 포함 여부 설정: ${include}`);
    
    this.includeSubfolders = include;
    
    // 폴더 카드셋 소스에 설정 적용
    if (this.folderSource) {
      this.folderSource.setIncludeSubfolders(include);
    }
    
    // 이벤트 발생
    this.eventEmitter.emit(EventType.INCLUDE_SUBFOLDERS_CHANGED, include);
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
    // 현재 소스에서 카드셋 목록을 문자열 배열로 가져옴
    const cardSetStrings = await this.currentSource.getCardSets();
    
    // 문자열 배열을 ICardSet 배열로 변환
    const cardSets: ICardSet[] = cardSetStrings.map(source => {
      const name = source === '/' ? '루트' : source.split('/').pop() || source;
      return {
        id: source,
        name,
        sourceType: this.getCurrentSourceType(),
        source,
        type: 'active'
      };
    });
    
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
    // 현재 카드셋 소스에 따라 카드 목록 필터링
    if (this.currentSource.type === 'folder') {
      // 폴더 소스인 경우
      const folderFiles = await this.getFiles();
      return cards.filter(card => folderFiles.includes(card.path));
    } else if (this.currentSource.type === 'tag') {
      // 태그 소스인 경우
      const tagFiles = await this.getFiles();
      return cards.filter(card => tagFiles.includes(card.path));
    } else if (this.currentSource.type === 'search') {
      // 검색 소스인 경우
      const searchFiles = await this.getFiles();
      return cards.filter(card => searchFiles.includes(card.path));
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
  getFolderSource(): FolderCardSetSource {
    return this.folderSource;
  }
  
  /**
   * 태그 카드셋 소스 가져오기
   * @returns 태그 카드셋 소스 객체
   */
  getTagSource(): TagCardSetSource {
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
    if (this.tagSource) {
      this.tagSource.setCaseSensitive(caseSensitive);
      
      // 이벤트 발생
      this.eventEmitter.emit(EventType.TAG_CASE_SENSITIVE_CHANGED, caseSensitive);
    }
  }
  
  /**
   * 태그 대소문자 구분 여부 확인
   * @returns 대소문자 구분 여부
   */
  isTagCaseSensitive(): boolean {
    return this.tagSource ? this.tagSource.isCaseSensitive() : false;
  }
  
  /**
   * 현재 카드셋 소스 상태 저장
   * 검색 소스로 전환하기 전에 현재 카드셋 소스 상태를 저장합니다.
   */
  saveCurrentSourceState(): void {
    this.previousSource = {
      type: this.currentSource.type,
      state: this.currentSource.getState()
    };
  }
  
  /**
   * 이전 카드셋 소스 상태 복원
   * 검색 소스에서 이전 카드셋 소스로 돌아갑니다.
   */
  restorePreviousSourceState(): void {
    if (this.previousSource) {
      const { type, state } = this.previousSource;
      
      // 이전 소스 타입으로 변경
      if (type === 'folder') {
        this.currentSource = this.folderSource;
      } else if (type === 'tag') {
        this.currentSource = this.tagSource;
      }
      
      // 이전 상태 복원
      this.currentSource.setState(state);
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
    // EventType으로 변환
    const eventType = this.convertToEventType(event);
    if (eventType) {
      this.eventEmitter.on(eventType, listener as EventListener<any>);
    }
  }
  
  /**
   * 이벤트 리스너 제거
   * @param event 이벤트 이름
   * @param listener 리스너 함수
   */
  off(event: CardSetServiceEvent, listener: (...args: any[]) => void): void {
    // EventType으로 변환
    const eventType = this.convertToEventType(event);
    if (eventType) {
      this.eventEmitter.off(eventType, listener as EventListener<any>);
    }
  }
  
  /**
   * CardSetServiceEvent를 EventType으로 변환
   * @param event CardSetServiceEvent
   * @returns EventType 또는 undefined
   */
  private convertToEventType(event: CardSetServiceEvent): EventType | undefined {
    switch (event) {
      case 'cardSetChanged':
        return EventType.CARD_SET_CHANGED;
      case 'sourceChanged':
        return EventType.SOURCE_CHANGED;
      case 'includeSubfoldersChanged':
        return EventType.INCLUDE_SUBFOLDERS_CHANGED;
      case 'tagCaseSensitiveChanged':
        return EventType.TAG_CASE_SENSITIVE_CHANGED;
      default:
        return undefined;
    }
  }
} 