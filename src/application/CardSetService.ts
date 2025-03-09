import { App, TFile } from 'obsidian';
import { ICardSetSource, CardSetSourceType, CardSetType } from '../domain/cardset/CardSet';
import { FolderCardSetSource } from '../domain/cardset/FolderCardSetSource';
import { TagCardSetSource } from '../domain/cardset/TagCardSetSource';
import { SearchType, SearchScope } from '../domain/search/Search';
import { ICard } from '../domain/card/Card';
import { ICardService } from './CardService';
import { ISearchService } from './SearchService';

/**
 * 카드셋 서비스 인터페이스
 * 카드셋 관리를 위한 인터페이스입니다.
 */
export interface ICardSetService {
  /**
   * 현재 카드셋 소스 가져오기
   * @returns 현재 카드셋 소스
   */
  getCurrentSource(): ICardSetSource;
  
  /**
   * 현재 카드셋 소스 타입 가져오기
   * @returns 현재 카드셋 소스 타입
   */
  getCurrentSourceType(): CardSetSourceType;
  
  /**
   * 카드셋 소스 변경
   * @param sourceType 변경할 카드셋 소스 타입
   */
  changeSource(sourceType: CardSetSourceType): Promise<void>;
  
  /**
   * 카드셋 선택
   * @param cardSet 선택할 카드셋
   * @param isFixed 고정 여부 (true: 지정 폴더/태그, false: 활성 폴더/태그)
   */
  selectCardSet(cardSet: string, isFixed?: boolean): void;
  
  /**
   * 현재 선택된 카드셋 가져오기
   * @returns 현재 선택된 카드셋
   */
  getCurrentCardSet(): string | null;
  
  /**
   * 카드셋 고정 여부 가져오기
   * @returns 카드셋 고정 여부
   */
  isCardSetFixed(): boolean;
  
  /**
   * 하위 폴더 포함 여부 설정
   * @param include 하위 폴더 포함 여부
   */
  setIncludeSubfolders(include: boolean): void;
  
  /**
   * 하위 폴더 포함 여부 가져오기
   * @returns 하위 폴더 포함 여부
   */
  getIncludeSubfolders(): boolean;
  
  /**
   * 카드셋 목록 가져오기
   * @returns 카드셋 목록
   */
  getCardSets(): Promise<string[]>;
  
  /**
   * 필터 옵션 목록 가져오기
   * @returns 필터 옵션 목록
   */
  getFilterOptions(): Promise<string[]>;
  
  /**
   * 현재 카드셋 소스에 따라 파일 목록 가져오기
   * @returns 파일 경로 목록
   */
  getFiles(): Promise<string[]>;
  
  /**
   * 현재 카드셋 소스를 카드 목록에 적용
   * @param cards 카드 목록
   * @returns 필터링된 카드 목록
   */
  applySource(cards: ICard[]): Promise<ICard[]>;
  
  /**
   * 서비스 초기화
   */
  initialize(): Promise<void>;
  
  /**
   * 설정 초기화
   */
  reset(): void;
  
  /**
   * 활성 파일 변경 이벤트 처리
   * @param file 활성 파일
   * @returns 카드셋이 변경되었는지 여부
   */
  handleActiveFileChange(file: TFile | null): Promise<boolean>;
  
  /**
   * 현재 카드셋 소스에 따라 카드 목록을 가져옵니다.
   * @returns 카드 목록
   */
  getCards(): Promise<ICard[]>;
  
  /**
   * 검색 소스 설정
   * @param query 검색 쿼리
   * @param searchType 검색 타입
   * @param caseSensitive 대소문자 구분 여부
   * @param frontmatterKey 프론트매터 키 (검색 타입이 frontmatter인 경우)
   */
  configureSearchSource(query: string, searchType?: SearchType, caseSensitive?: boolean, frontmatterKey?: string): void;
  
  /**
   * 폴더 카드셋 소스 가져오기
   * @returns 폴더 카드셋 소스 객체
   */
  getFolderSource(): FolderCardSetSource;
  
  /**
   * 태그 카드셋 소스 가져오기
   * @returns 태그 카드셋 소스 객체
   */
  getTagSource(): TagCardSetSource;
  
  /**
   * 이전 카드셋 소스 가져오기
   * @returns 이전 카드셋 소스
   */
  getPreviousSourceType(): CardSetSourceType;
  
  /**
   * 태그 대소문자 구분 여부 설정
   * @param caseSensitive 대소문자 구분 여부
   */
  setTagCaseSensitive(caseSensitive: boolean): void;
  
  /**
   * 태그 대소문자 구분 여부 확인
   * @returns 대소문자 구분 여부
   */
  isTagCaseSensitive(): boolean;
  
  /**
   * 현재 카드셋 소스 상태 저장
   * 검색 소스로 전환하기 전에 현재 카드셋 소스 상태를 저장합니다.
   */
  saveCurrentSourceState(): void;
  
  /**
   * 이전 카드셋 소스 상태 복원
   * 검색 소스에서 이전 카드셋 소스로 돌아갑니다.
   */
  restorePreviousSourceState(): void;
  
  /**
   * 검색 서비스 설정
   * @param searchService 검색 서비스
   */
  setSearchService(searchService: ISearchService): void;
  
  /**
   * 이전 카드셋 소스 타입 가져오기
   * @returns 이전 카드셋 소스 타입
   */
  getPreviousCardSetSource(): CardSetSourceType;
}

/**
 * 카드셋 서비스 클래스
 * 카드셋 관리를 위한 서비스 클래스입니다.
 */
export class CardSetService implements ICardSetService {
  private app: App;
  private currentSource: ICardSetSource;
  private folderSource: FolderCardSetSource;
  private tagSource: TagCardSetSource;
  private isFixed = false;
  private includeSubfolders = true;
  private cardService: ICardService;
  private previousSource: { type: CardSetSourceType; state: any } | null = null;
  private previousCardSet: { [key in CardSetSourceType]?: string } = {}; // 소스별 이전 카드셋 저장
  private service: any; // 임시로 any 타입 사용
  private searchService: ISearchService | null = null;
  
  constructor(app: App, cardService: ICardService, defaultSourceType: CardSetSourceType = 'folder', service?: any) {
    this.app = app;
    this.cardService = cardService;
    this.service = service;
    
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
    this.previousCardSet = {};
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
   * 카드셋 소스 변경
   * @param sourceType 변경할 카드셋 소스 타입
   */
  async changeSource(sourceType: CardSetSourceType): Promise<void> {
    console.log(`[CardSetService] 카드셋 소스 변경: ${sourceType}`);
    
    // 이전 카드셋 소스 저장
    const previousSourceType = this.currentSource.type;
    
    // 이전 카드셋 저장
    this.previousCardSet[previousSourceType] = this.currentSource.currentCardSet || '';
    
    // 새 카드셋 소스 설정
    switch (sourceType) {
      case 'folder':
        this.currentSource = this.folderSource;
        break;
      case 'tag':
        this.currentSource = this.tagSource;
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
    
    // 이전에 저장된 카드셋이 있으면 복원
    const savedCardSet = this.previousCardSet[sourceType];
    if (savedCardSet) {
      this.currentSource.selectCardSet(savedCardSet, this.isFixed);
      console.log(`[CardSetService] 이전 카드셋 복원: ${savedCardSet}`);
    }
    
    console.log(`[CardSetService] 카드셋 소스 변경 완료: ${previousSourceType} -> ${this.currentSource.type}`);
  }
  
  /**
   * 카드셋 선택
   * @param cardSet 선택할 카드셋
   * @param isFixed 고정 여부
   */
  selectCardSet(cardSet: string, isFixed?: boolean): void {
    console.log(`[CardSetService] 카드셋 선택: ${cardSet}, 고정 여부: ${isFixed}`);
    
    // 현재 카드셋 소스에 카드셋 설정
    this.currentSource.selectCardSet(cardSet, isFixed);
    
    // 고정 여부 설정
    if (isFixed !== undefined) {
      this.isFixed = isFixed;
    }
  }
  
  /**
   * 현재 선택된 카드셋 가져오기
   * @returns 현재 선택된 카드셋
   */
  getCurrentCardSet(): string | null {
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
  async getCardSets(): Promise<string[]> {
    return this.currentSource.getCardSets();
  }
  
  /**
   * 필터 옵션 목록 가져오기
   * @returns 필터 옵션 목록
   */
  async getFilterOptions(): Promise<string[]> {
    return this.currentSource.getFilterOptions();
  }
  
  /**
   * 파일 목록 가져오기
   * @returns 파일 경로 목록
   */
  async getFiles(): Promise<string[]> {
    return this.currentSource.getFiles();
  }
  
  /**
   * 카드셋 소스 적용
   * @param cards 카드 목록
   * @returns 필터링된 카드 목록
   */
  async applySource(cards: ICard[]): Promise<ICard[]> {
    try {
      console.log(`[CardSetService] 카드셋 소스 적용: ${this.currentSource.type}, 카드 수: ${cards.length}`);
      
      if (this.currentSource.type === 'search' && this.searchService) {
        // 검색 소스인 경우 검색 서비스를 통해 카드 필터링
        const query = this.searchService.getQuery();
        const searchType = this.searchService.getSearchType();
        const caseSensitive = this.searchService.isCaseSensitive();
        const frontmatterKey = this.searchService.getFrontmatterKey();
        
        // 검색 서비스를 통해 파일 목록 가져오기
        const filePaths = await this.searchService.getFilesForSearch(
          query, 
          searchType, 
          caseSensitive, 
          frontmatterKey
        );
        
        // 파일 경로로 카드 필터링
        return cards.filter(card => filePaths.includes(card.path));
      }
      
      // 현재 카드셋 소스에 따라 카드 필터링
      const files = await this.currentSource.getFiles();
      
      // 파일 경로로 카드 필터링
      return cards.filter(card => files.includes(card.path));
    } catch (error) {
      console.error(`[CardSetService] 카드셋 소스 적용 오류:`, error);
      return cards;
    }
  }
  
  /**
   * 활성 파일 변경 이벤트 처리
   * @param file 활성 파일
   * @returns 카드셋이 변경되었는지 여부
   */
  async handleActiveFileChange(file: TFile | null): Promise<boolean> {
    if (!file) {
      return false;
    }
    
    // 카드셋이 고정된 경우 변경하지 않음
    if (this.isCardSetFixed()) {
      return false;
    }
    
    try {
      let newCardSet: string | null = null;
      
      // 현재 카드셋 소스에 따라 활성 카드셋 결정
      if (this.currentSource.type === 'folder') {
        // 폴더 소스인 경우 파일의 폴더 경로를 활성 카드셋으로 설정
        const folderPath = file.parent ? file.parent.path : '';
        newCardSet = folderPath;
      } else if (this.currentSource.type === 'tag') {
        // 태그 소스인 경우 파일의 모든 태그를 활성 카드셋으로 설정
        // TagCardSetSource의 getAllTagsFromFile 메서드를 사용하여 모든 태그 가져오기
        const tagSource = this.currentSource as TagCardSetSource;
        const allTags = await tagSource.getAllTagsFromFile(file);
        
        if (allTags.length > 0) {
          // 중복 제거 후 쉼표로 구분하여 하나의 문자열로 결합
          newCardSet = [...new Set(allTags)].join(',');
        } else {
          // 태그가 없는 경우 null로 설정
          newCardSet = null;
        }
      }
      
      // 카드셋이 변경된 경우 업데이트
      if (newCardSet !== this.currentSource.currentCardSet) {
        this.currentSource.selectCardSet(newCardSet, false);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error(`[CardSetService] 활성 파일 변경 처리 오류:`, error);
      return false;
    }
  }
  
  /**
   * 카드 목록 가져오기
   * @returns 카드 목록
   */
  async getCards(): Promise<ICard[]> {
    try {
      // 카드 서비스를 통해 모든 카드 가져오기
      const allCards = await this.cardService.getAllCards();
      
      // 현재 카드셋 소스에 따라 카드 필터링
      return this.applySource(allCards);
    } catch (error) {
      console.error(`[CardSetService] 카드 가져오기 오류:`, error);
      return [];
    }
  }
  
  /**
   * 검색 소스 설정
   * @param query 검색 쿼리
   * @param searchType 검색 타입
   * @param caseSensitive 대소문자 구분 여부
   * @param frontmatterKey 프론트매터 키 (검색 타입이 frontmatter인 경우)
   */
  configureSearchSource(query: string, searchType: SearchType = 'filename', caseSensitive = false, frontmatterKey?: string): void {
    if (!this.searchService) {
      console.error(`[CardSetService] 검색 서비스가 설정되지 않았습니다.`);
      return;
    }
    
    // 검색 서비스 설정
    this.searchService.setQuery(query);
    this.searchService.setSearchType(searchType);
    this.searchService.setCaseSensitive(caseSensitive);
    
    if (frontmatterKey) {
      this.searchService.setFrontmatterKey(frontmatterKey);
    }
  }
  
  /**
   * 폴더 카드셋 소스 가져오기
   * @returns 폴더 카드셋 소스
   */
  getFolderSource(): FolderCardSetSource {
    return this.folderSource;
  }
  
  /**
   * 태그 카드셋 소스 가져오기
   * @returns 태그 카드셋 소스
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
    console.log(`[CardSetService] 태그 대소문자 구분 여부 설정: ${caseSensitive}`);
    
    // 태그 카드셋 소스에 설정 적용
    if (this.tagSource) {
      this.tagSource.setCaseSensitive(caseSensitive);
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
    console.log(`[CardSetService] 현재 카드셋 소스 상태 저장: ${this.currentSource.type}`);
    
    // 현재 카드셋 소스 상태 저장
    this.previousSource = {
      type: this.currentSource.type,
      state: this.serializeSourceState(this.currentSource)
    };
  }
  
  /**
   * 이전 카드셋 소스 상태 복원
   * 검색 소스에서 이전 카드셋 소스로 돌아갑니다.
   */
  restorePreviousSourceState(): void {
    if (!this.previousSource) {
      console.log(`[CardSetService] 복원할 이전 카드셋 소스 상태가 없습니다.`);
      return;
    }
    
    console.log(`[CardSetService] 이전 카드셋 소스 상태 복원: ${this.previousSource.type}`);
    
    // 이전 카드셋 소스로 변경
    switch (this.previousSource.type) {
      case 'folder':
        this.currentSource = this.folderSource;
        break;
      case 'tag':
        this.currentSource = this.tagSource;
        break;
      default:
        console.error(`[CardSetService] 알 수 없는 카드셋 소스 타입: ${this.previousSource.type}`);
        return;
    }
    
    // 이전 상태 복원
    this.deserializeSourceState(this.currentSource, this.previousSource.state);
    
    // 이전 상태 초기화
    this.previousSource = null;
  }
  
  /**
   * 카드셋 소스 상태 직렬화
   * @param source 카드셋 소스
   * @returns 직렬화된 상태
   */
  private serializeSourceState(source: ICardSetSource): any {
    return {
      currentCardSet: source.currentCardSet,
      isFixed: source.isCardSetFixed(),
      // 소스별 추가 상태 저장
      folderState: source.type === 'folder' ? {
        includeSubfolders: (source as FolderCardSetSource).getIncludeSubfolders()
      } : null,
      tagState: source.type === 'tag' ? {
        caseSensitive: (source as TagCardSetSource).isCaseSensitive()
      } : null
    };
  }
  
  /**
   * 카드셋 소스 상태 역직렬화
   * @param source 카드셋 소스
   * @param state 직렬화된 상태
   */
  private deserializeSourceState(source: ICardSetSource, state: any): void {
    // 기본 상태 복원
    source.selectCardSet(state.currentCardSet, state.isFixed);
    
    // 소스별 추가 상태 복원
    if (source.type === 'folder' && state.folderState) {
      (source as FolderCardSetSource).setIncludeSubfolders(state.folderState.includeSubfolders);
    } else if (source.type === 'tag' && state.tagState) {
      (source as TagCardSetSource).setCaseSensitive(state.tagState.caseSensitive);
    }
  }
  
  /**
   * 이전 카드셋 소스 타입 가져오기
   * @returns 이전 카드셋 소스 타입
   */
  getPreviousCardSetSource(): CardSetSourceType {
    return this.previousSource ? this.previousSource.type : 'folder';
  }
} 