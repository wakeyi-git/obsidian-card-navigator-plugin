import { App, TFile } from 'obsidian';
import { IMode, ModeType, CardSetType } from '../domain/mode/Mode';
import { FolderMode } from '../domain/mode/FolderMode';
import { TagMode } from '../domain/mode/TagMode';
import { SearchType, SearchScope } from '../domain/search/Search';
import { ICard } from '../domain/card/Card';
import { ICardService } from './CardService';
import { ISearchService } from './SearchService';

/**
 * 모드 서비스 인터페이스
 * 모드 관리를 위한 인터페이스입니다.
 */
export interface IModeService {
  /**
   * 현재 모드 가져오기
   * @returns 현재 모드
   */
  getCurrentMode(): IMode;
  
  /**
   * 현재 모드 타입 가져오기
   * @returns 현재 모드 타입
   */
  getCurrentModeType(): ModeType;
  
  /**
   * 모드 변경
   * @param modeType 변경할 모드 타입
   */
  changeMode(modeType: ModeType): Promise<void>;
  
  /**
   * 카드 세트 선택
   * @param cardSet 선택할 카드 세트
   * @param isFixed 고정 여부 (true: 지정 폴더/태그, false: 활성 폴더/태그)
   */
  selectCardSet(cardSet: string, isFixed?: boolean): void;
  
  /**
   * 현재 선택된 카드 세트 가져오기
   * @returns 현재 선택된 카드 세트
   */
  getCurrentCardSet(): string | null;
  
  /**
   * 카드 세트 고정 여부 가져오기
   * @returns 카드 세트 고정 여부
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
   * 카드 세트 목록 가져오기
   * @returns 카드 세트 목록
   */
  getCardSets(): Promise<string[]>;
  
  /**
   * 필터 옵션 목록 가져오기
   * @returns 필터 옵션 목록
   */
  getFilterOptions(): Promise<string[]>;
  
  /**
   * 현재 모드에 따라 파일 목록 가져오기
   * @returns 파일 경로 목록
   */
  getFiles(): Promise<string[]>;
  
  /**
   * 현재 모드를 카드 목록에 적용
   * @param cards 카드 목록
   * @returns 필터링된 카드 목록
   */
  applyMode(cards: ICard[]): Promise<ICard[]>;
  
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
   * @returns 카드 세트가 변경되었는지 여부
   */
  handleActiveFileChange(file: TFile | null): Promise<boolean>;
  
  /**
   * 현재 모드에 따라 카드 목록을 가져옵니다.
   * @returns 카드 목록
   */
  getCards(): Promise<ICard[]>;
  
  /**
   * 검색 모드 설정
   * @param query 검색 쿼리
   * @param searchType 검색 타입
   * @param caseSensitive 대소문자 구분 여부
   * @param frontmatterKey 프론트매터 키 (검색 타입이 frontmatter인 경우)
   */
  configureSearchMode(query: string, searchType?: SearchType, caseSensitive?: boolean, frontmatterKey?: string): void;
  
  /**
   * 폴더 모드 가져오기
   * @returns 폴더 모드 객체
   */
  getFolderMode(): FolderMode;
  
  /**
   * 태그 모드 가져오기
   * @returns 태그 모드 객체
   */
  getTagMode(): TagMode;
  
  /**
   * 이전 모드 가져오기
   * @returns 이전 모드
   */
  getPreviousMode(): ModeType;
  
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
   * 현재 모드 상태 저장
   * 검색 모드로 전환하기 전에 현재 모드 상태를 저장합니다.
   */
  saveCurrentModeState(): void;
  
  /**
   * 이전 모드 상태 복원
   * 검색 모드에서 이전 모드로 돌아갑니다.
   */
  restorePreviousModeState(): void;
  
  /**
   * 검색 서비스 설정
   * @param searchService 검색 서비스
   */
  setSearchService(searchService: ISearchService): void;
}

/**
 * 모드 서비스 구현
 * 모드 관리를 위한 서비스입니다.
 */
export class ModeService implements IModeService {
  private app: App;
  private currentMode: IMode;
  private folderMode: FolderMode;
  private tagMode: TagMode;
  private isFixed = false;
  private includeSubfolders = true;
  private cardService: ICardService;
  private previousMode: { type: ModeType; state: any } | null = null;
  private previousCardSet: { [key in ModeType]?: string } = {}; // 모드별 이전 카드 세트 저장
  private service: any; // 임시로 any 타입 사용
  private searchService: ISearchService | null = null;
  
  constructor(app: App, cardService: ICardService, defaultModeType: ModeType = 'folder', service?: any) {
    this.app = app;
    this.cardService = cardService;
    this.service = service;
    
    // 모드 객체 생성
    this.folderMode = new FolderMode(app);
    this.tagMode = new TagMode(app);
    
    // 기본 모드 설정
    if (defaultModeType === 'folder') {
      this.currentMode = this.folderMode;
    } else if (defaultModeType === 'tag') {
      this.currentMode = this.tagMode;
    } else {
      // 기본값은 폴더 모드
      this.currentMode = this.folderMode;
    }
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
    // 초기화 로직
    console.log('[ModeService] 초기화 완료');
  }
  
  /**
   * 설정 초기화
   */
  reset(): void {
    this.folderMode.reset();
    this.tagMode.reset();
    this.isFixed = false;
    this.includeSubfolders = true;
    this.previousMode = null;
    this.previousCardSet = {};
  }
  
  /**
   * 현재 모드 가져오기
   * @returns 현재 모드
   */
  getCurrentMode(): IMode {
    return this.currentMode;
  }
  
  /**
   * 현재 모드 타입 가져오기
   * @returns 현재 모드 타입
   */
  getCurrentModeType(): ModeType {
    return this.currentMode.type;
  }
  
  /**
   * 모드 변경
   * @param modeType 변경할 모드 타입
   */
  async changeMode(modeType: ModeType): Promise<void> {
    // 이미 같은 모드인 경우 변경하지 않음
    if (this.currentMode.type === modeType) {
      return;
    }
    
    // 모드 변경
    switch (modeType) {
      case 'folder':
        this.currentMode = this.folderMode;
        break;
      case 'tag':
        this.currentMode = this.tagMode;
        break;
      case 'search':
        // 검색 모드로 변경 시 현재 모드 상태 저장
        this.saveCurrentModeState();
        break;
      default:
        // 기본값은 폴더 모드
        this.currentMode = this.folderMode;
        break;
    }
    
    // 모드 변경 이벤트 발생
    if (this.service) {
      this.service.notifyModeChanged(modeType);
    }
  }
  
  /**
   * 카드 세트 선택
   * @param cardSet 선택할 카드 세트
   * @param isFixed 고정 여부 (true: 지정 폴더/태그, false: 활성 폴더/태그)
   */
  selectCardSet(cardSet: string, isFixed?: boolean): void {
    // 카드 세트 고정 여부 설정
    if (isFixed !== undefined) {
      this.isFixed = isFixed;
    }
    
    // 현재 모드에 카드 세트 선택
    this.currentMode.selectCardSet(cardSet, this.isFixed);
    
    // 이전 카드 세트 저장
    const currentCardSet = this.getCurrentCardSet();
    if (currentCardSet !== null) {
      this.previousCardSet[this.currentMode.type] = currentCardSet;
    }
  }
  
  /**
   * 현재 선택된 카드 세트 가져오기
   * @returns 현재 선택된 카드 세트
   */
  getCurrentCardSet(): string | null {
    return this.currentMode.currentCardSet;
  }
  
  /**
   * 카드 세트 고정 여부 가져오기
   * @returns 카드 세트 고정 여부
   */
  isCardSetFixed(): boolean {
    return this.isFixed;
  }
  
  /**
   * 하위 폴더 포함 여부 설정
   * @param include 하위 폴더 포함 여부
   */
  setIncludeSubfolders(include: boolean): void {
    this.includeSubfolders = include;
    
    // 폴더 모드에만 적용
    if (this.currentMode.type === 'folder') {
      (this.currentMode as FolderMode).setIncludeSubfolders(include);
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
   * 카드 세트 목록 가져오기
   * @returns 카드 세트 목록
   */
  async getCardSets(): Promise<string[]> {
    return await this.currentMode.getCardSets();
  }
  
  /**
   * 필터 옵션 목록 가져오기
   * @returns 필터 옵션 목록
   */
  async getFilterOptions(): Promise<string[]> {
    return await this.currentMode.getFilterOptions();
  }
  
  /**
   * 현재 모드에 따라 파일 목록 가져오기
   * @returns 파일 경로 목록
   */
  async getFiles(): Promise<string[]> {
    if (this.currentMode.type === 'search' && this.searchService) {
      // 검색 모드인 경우 검색 서비스를 통해 파일 목록 가져오기
      const query = this.searchService.getQuery();
      const searchType = this.searchService.getSearchType();
      const caseSensitive = this.searchService.isCaseSensitive();
      const frontmatterKey = this.searchService.getFrontmatterKey();
      
      return await this.searchService.getFilesForSearch(query, searchType, caseSensitive, frontmatterKey);
    }
    
    return await this.currentMode.getFiles();
  }
  
  /**
   * 현재 모드를 카드 목록에 적용
   * @param cards 카드 목록
   * @returns 필터링된 카드 목록
   */
  async applyMode(cards: ICard[]): Promise<ICard[]> {
    if (!cards || cards.length === 0) {
      return [];
    }
    
    try {
      if (this.currentMode.type === 'search' && this.searchService) {
        // 검색 모드인 경우 검색 서비스를 통해 카드 필터링
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
      
      // 현재 모드에 따라 카드 필터링
      const files = await this.currentMode.getFiles();
      
      // 파일 경로로 카드 필터링
      return cards.filter(card => files.includes(card.path));
    } catch (error) {
      console.error(`[ModeService] 모드 적용 오류:`, error);
      return cards;
    }
  }
  
  /**
   * 활성 파일 변경 이벤트 처리
   * @param file 활성 파일
   * @returns 카드 세트가 변경되었는지 여부
   */
  async handleActiveFileChange(file: TFile | null): Promise<boolean> {
    // 검색 모드인 경우 처리하지 않음
    if (this.currentMode.type === 'search') {
      return false;
    }
    
    // 카드 세트가 고정된 경우 처리하지 않음
    if (this.isFixed) {
      return false;
    }
    
    // 파일이 없는 경우 처리하지 않음
    if (!file) {
      return false;
    }
    
    try {
      let newCardSet: string | null = null;
      
      // 현재 모드에 따라 활성 카드 세트 결정
      if (this.currentMode.type === 'folder') {
        // 폴더 모드인 경우 파일의 폴더 경로를 활성 카드 세트로 설정
        const folderPath = file.parent ? file.parent.path : '';
        newCardSet = folderPath;
      } else if (this.currentMode.type === 'tag') {
        // 태그 모드인 경우 파일의 첫 번째 태그를 활성 카드 세트로 설정
        const cache = this.app.metadataCache.getFileCache(file);
        if (cache && cache.tags && cache.tags.length > 0) {
          newCardSet = cache.tags[0].tag;
        } else {
          // 태그가 없는 경우 null로 설정
          newCardSet = null;
        }
      }
      
      // 카드 세트가 변경된 경우 업데이트
      if (newCardSet !== this.currentMode.currentCardSet) {
        this.currentMode.selectCardSet(newCardSet, false);
        return true;
      }
    } catch (error) {
      console.error(`[ModeService] 활성 파일 변경 처리 오류:`, error);
    }
    
    return false;
  }
  
  /**
   * 현재 모드에 따라 카드 목록을 가져옵니다.
   * @returns 카드 목록
   */
  async getCards(): Promise<ICard[]> {
    try {
      if (this.currentMode.type === 'search' && this.searchService) {
        // 검색 모드인 경우 검색 서비스를 통해 카드 가져오기
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
        
        // 파일 경로로 카드 가져오기
        return await this.cardService.getCardsByPaths(filePaths);
      }
      
      // 현재 모드에 따라 파일 목록 가져오기
      const files = await this.currentMode.getFiles();
      
      // 파일 경로로 카드 가져오기
      return await this.cardService.getCardsByPaths(files);
    } catch (error) {
      console.error(`[ModeService] 카드 목록 가져오기 오류:`, error);
      return [];
    }
  }
  
  /**
   * 검색 모드 설정
   * @param query 검색 쿼리
   * @param searchType 검색 타입
   * @param caseSensitive 대소문자 구분 여부
   * @param frontmatterKey 프론트매터 키 (검색 타입이 frontmatter인 경우)
   */
  configureSearchMode(query: string, searchType: SearchType = 'filename', caseSensitive = false, frontmatterKey?: string): void {
    if (!this.searchService) {
      console.error('[ModeService] 검색 서비스가 설정되지 않았습니다.');
      return;
    }
    
    // 검색 서비스에 검색 설정
    this.searchService.setQuery(query);
    this.searchService.setSearchType(searchType, frontmatterKey);
    this.searchService.setCaseSensitive(caseSensitive);
    
    // 현재 모드 상태 저장
    if (this.currentMode.type !== 'search') {
      this.saveCurrentModeState();
    }
  }
  
  /**
   * 폴더 모드 가져오기
   * @returns 폴더 모드 객체
   */
  getFolderMode(): FolderMode {
    return this.folderMode;
  }
  
  /**
   * 태그 모드 가져오기
   * @returns 태그 모드 객체
   */
  getTagMode(): TagMode {
    return this.tagMode;
  }
  
  /**
   * 이전 모드 가져오기
   * @returns 이전 모드
   */
  getPreviousMode(): ModeType {
    if (this.searchService) {
      return this.searchService.getPreviousMode();
    }
    
    return this.previousMode ? this.previousMode.type : 'folder';
  }
  
  /**
   * 태그 대소문자 구분 여부 설정
   * @param caseSensitive 대소문자 구분 여부
   */
  setTagCaseSensitive(caseSensitive: boolean): void {
    if (this.tagMode) {
      this.tagMode.setCaseSensitive(caseSensitive);
    }
  }
  
  /**
   * 태그 대소문자 구분 여부 확인
   * @returns 대소문자 구분 여부
   */
  isTagCaseSensitive(): boolean {
    if (this.tagMode) {
      return this.tagMode.isCaseSensitive();
    }
    return false;
  }
  
  /**
   * 현재 모드 상태 저장
   * 검색 모드로 전환하기 전에 현재 모드 상태를 저장합니다.
   */
  saveCurrentModeState(): void {
    // 이미 검색 모드인 경우 저장하지 않음
    if (this.currentMode.type === 'search') {
      return;
    }
    
    // 현재 모드 상태 저장
    this.previousMode = {
      type: this.currentMode.type,
      state: this.serializeModeState(this.currentMode)
    };
    
    // 이전 카드 세트 저장
    const currentCardSet = this.getCurrentCardSet();
    if (currentCardSet !== null) {
      this.previousCardSet[this.currentMode.type] = currentCardSet;
    }
    
    // 검색 서비스에 이전 모드 정보 설정
    if (this.searchService) {
      const cardSetType: CardSetType = this.isCardSetFixed() ? 'fixed' : 'active';
      this.searchService.setPreviousModeInfo(
        this.currentMode.type,
        this.getCurrentCardSet(),
        cardSetType
      );
    }
  }
  
  /**
   * 이전 모드 상태 복원
   * 검색 모드에서 이전 모드로 돌아갑니다.
   */
  restorePreviousModeState(): void {
    // 검색 모드가 아닌 경우 복원하지 않음
    if (this.currentMode.type !== 'search') {
      return;
    }
    
    // 이전 모드가 없는 경우 기본 모드(폴더)로 복원
    if (!this.previousMode) {
      this.changeMode('folder');
      return;
    }
    
    // 이전 모드로 변경
    this.changeMode(this.previousMode.type);
    
    // 이전 모드 상태 복원
    if (this.previousMode.state) {
      this.deserializeModeState(this.currentMode, this.previousMode.state);
    }
    
    // 이전 카드 세트 복원
    const previousCardSet = this.previousCardSet[this.currentMode.type];
    if (previousCardSet) {
      this.selectCardSet(previousCardSet, this.isCardSetFixed());
    }
  }
  
  /**
   * 모드 상태 직렬화
   * @param mode 직렬화할 모드
   * @returns 직렬화된 모드 상태
   */
  private serializeModeState(mode: IMode): any {
    const state: any = {
      currentCardSet: mode.currentCardSet,
      isFixed: this.isFixed
    };
    
    // 모드별 추가 상태 저장
    if (mode.type === 'folder') {
      state.includeSubfolders = this.includeSubfolders;
    } else if (mode.type === 'tag') {
      state.caseSensitive = (mode as TagMode).isCaseSensitive();
    }
    
    return state;
  }
  
  /**
   * 모드 상태 역직렬화
   * @param mode 역직렬화할 모드
   * @param state 역직렬화할 상태
   */
  private deserializeModeState(mode: IMode, state: any): void {
    // 카드 세트 복원
    if (state.currentCardSet !== undefined) {
      mode.selectCardSet(state.currentCardSet, state.isFixed);
    }
    
    // 고정 여부 복원
    if (state.isFixed !== undefined) {
      this.isFixed = state.isFixed;
    }
    
    // 모드별 추가 상태 복원
    if (mode.type === 'folder' && state.includeSubfolders !== undefined) {
      this.includeSubfolders = state.includeSubfolders;
      (mode as FolderMode).setIncludeSubfolders(state.includeSubfolders);
    } else if (mode.type === 'tag' && state.caseSensitive !== undefined) {
      (mode as TagMode).setCaseSensitive(state.caseSensitive);
    }
  }
} 