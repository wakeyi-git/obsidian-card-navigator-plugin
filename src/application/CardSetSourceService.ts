import { App, TFile } from 'obsidian';
import { CardSetService, ICardSetService, CardSetServiceEvent, CardSetChangedEventData } from './CardSetService';
import { ICardSetSource, CardSetSourceType, ICardSetState } from '../domain/cardset/CardSet';
import { ICard } from '../domain/card/Card';
import { ICardService } from './CardService';
import { ISearchService } from './SearchService';
import { EventEmitter } from 'events';
import CardNavigatorPlugin from '../main';
import { SearchType } from '../domain/search/Search';
import { FolderCardSetSource } from '../domain/cardset/FolderCardSetSource';
import { TagCardSetSource } from '../domain/cardset/TagCardSetSource';

/**
 * 카드셋 소스 서비스 인터페이스
 * 플러그인 설정과 이벤트 처리를 추가한 카드셋 서비스 인터페이스입니다.
 */
export interface ICardSetSourceService extends ICardSetService {
  /**
   * 플러그인 설정에 카드셋 상태 저장
   */
  saveSettingsToPlugin(): Promise<void>;
  
  /**
   * 플러그인 설정에서 카드셋 상태 로드
   */
  loadSettingsFromPlugin(): Promise<void>;
  
  /**
   * 검색 카드셋 소스 설정
   * @param query 검색 쿼리
   * @param searchType 검색 타입
   * @param caseSensitive 대소문자 구분 여부
   * @param frontmatterKey 프론트매터 키 (검색 타입이 frontmatter인 경우)
   */
  configureSearchCardSetSource(query: string, searchType?: SearchType, caseSensitive?: boolean, frontmatterKey?: string): void;
}

/**
 * 카드셋 소스 서비스 클래스
 * 컴포지션 패턴을 사용하여 CardSetService를 확장하고 플러그인 설정과 이벤트 처리를 추가합니다.
 */
export class CardSetSourceService implements ICardSetSourceService {
  private plugin: CardNavigatorPlugin;
  private cardSetService: CardSetService;
  private eventEmitter: EventEmitter;
  
  /**
   * 생성자
   * @param app Obsidian App 객체
   * @param cardService 카드 서비스
   * @param defaultSourceType 기본 카드셋 소스 타입
   * @param plugin 플러그인 인스턴스
   */
  constructor(
    app: App, 
    cardService: ICardService, 
    defaultSourceType: CardSetSourceType = 'folder',
    plugin: CardNavigatorPlugin
  ) {
    this.plugin = plugin;
    
    // 카드셋 서비스 초기화
    this.cardSetService = new CardSetService(app, cardService, defaultSourceType);
    
    // 이벤트 이미터 초기화
    this.eventEmitter = new EventEmitter();
    
    // 카드셋 서비스 이벤트 연결
    this.cardSetService.on('cardSetChanged', (...args) => {
      this.eventEmitter.emit('cardSetChanged', ...args);
    });
    
    this.cardSetService.on('sourceChanged', (...args) => {
      this.eventEmitter.emit('sourceChanged', ...args);
    });
    
    this.cardSetService.on('includeSubfoldersChanged', (...args) => {
      this.eventEmitter.emit('includeSubfoldersChanged', ...args);
    });
    
    this.cardSetService.on('tagCaseSensitiveChanged', (...args) => {
      this.eventEmitter.emit('tagCaseSensitiveChanged', ...args);
    });
  }
  
  /**
   * 플러그인 설정에 카드셋 상태 저장
   */
  async saveSettingsToPlugin(): Promise<void> {
    try {
      // 현재 카드셋 소스 타입 가져오기
      const currentSourceType = this.getCurrentSourceType();
      
      // 카드셋 고정 여부 설정
      this.plugin.settings.isCardSetFixed = this.isCardSetFixed();
      
      // 카드셋 소스 타입에 따라 처리
      if (currentSourceType === 'folder') {
        // 폴더 모드
        const currentCardSet = this.getCurrentCardSet();
        if (currentCardSet) {
          this.plugin.settings.defaultFolderCardSet = currentCardSet;
          console.log(`[CardSetSourceService] 폴더 카드셋 설정 업데이트: ${currentCardSet}`);
        }
      } else if (currentSourceType === 'tag') {
        // 태그 모드
        const currentCardSet = this.getCurrentCardSet();
        if (currentCardSet) {
          this.plugin.settings.defaultTagCardSet = currentCardSet;
          console.log(`[CardSetSourceService] 태그 카드셋 설정 업데이트: ${currentCardSet}`);
        }
      }
      
      // 하위 폴더 포함 여부 설정
      this.plugin.settings.includeSubfolders = this.getIncludeSubfolders();
      
      // 태그 대소문자 구분 여부 설정
      this.plugin.settings.tagCaseSensitive = this.isTagCaseSensitive();
      
      // 설정 저장
      await this.plugin.saveSettings();
      
      console.log(`[CardSetSourceService] 플러그인 설정 저장 완료`);
    } catch (error) {
      console.error(`[CardSetSourceService] 플러그인 설정 저장 오류:`, error);
      throw error;
    }
  }
  
  /**
   * 플러그인 설정에서 카드셋 상태 로드
   */
  async loadSettingsFromPlugin(): Promise<void> {
    try {
      // 카드셋 고정 여부 설정
      const isFixed = this.plugin.settings.isCardSetFixed;
      
      // 하위 폴더 포함 여부 설정
      this.setIncludeSubfolders(this.plugin.settings.includeSubfolders);
      
      // 태그 대소문자 구분 여부 설정
      this.setTagCaseSensitive(this.plugin.settings.tagCaseSensitive ?? false);
      
      // 현재 카드셋 소스 타입 가져오기
      const currentSourceType = this.getCurrentSourceType();
      
      // 카드셋 소스 타입에 따라 처리
      if (currentSourceType === 'folder') {
        // 폴더 모드
        const defaultFolderCardSet = this.plugin.settings.defaultFolderCardSet;
        if (defaultFolderCardSet) {
          await this.selectCardSet(defaultFolderCardSet, isFixed);
          console.log(`[CardSetSourceService] 폴더 카드셋 설정 로드: ${defaultFolderCardSet}`);
        }
      } else if (currentSourceType === 'tag') {
        // 태그 모드
        const defaultTagCardSet = this.plugin.settings.defaultTagCardSet;
        if (defaultTagCardSet) {
          await this.selectCardSet(defaultTagCardSet, isFixed);
          console.log(`[CardSetSourceService] 태그 카드셋 설정 로드: ${defaultTagCardSet}`);
        }
      }
      
      console.log(`[CardSetSourceService] 플러그인 설정 로드 완료`);
    } catch (error) {
      console.error(`[CardSetSourceService] 플러그인 설정 로드 오류:`, error);
    }
  }
  
  /**
   * 카드셋 선택
   * @param cardSet 선택할 카드셋
   * @param isFixed 고정 여부
   */
  async selectCardSet(cardSet: string, isFixed?: boolean): Promise<void> {
    try {
      console.log(`[CardSetSourceService] 카드셋 선택: ${cardSet}, 고정: ${isFixed}`);
      
      // 카드셋 서비스에 카드셋 선택 위임
      await this.cardSetService.selectCardSet(cardSet, isFixed);
      
      // 플러그인 설정에 저장
      await this.saveSettingsToPlugin();
      
      console.log(`[CardSetSourceService] 카드셋 선택 완료: ${cardSet}`);
    } catch (error) {
      console.error(`[CardSetSourceService] 카드셋 선택 오류:`, error);
      throw error;
    }
  }
  
  /**
   * 카드셋 소스 변경
   * @param sourceType 변경할 카드셋 소스 타입
   */
  async changeSource(sourceType: CardSetSourceType): Promise<void> {
    try {
      console.log(`[CardSetSourceService] 카드셋 소스 변경: ${sourceType}`);
      
      // 카드셋 서비스에 소스 변경 위임
      await this.cardSetService.changeSource(sourceType);
      
      // 플러그인 설정 업데이트
      this.plugin.settings.defaultCardSetSource = sourceType;
      await this.plugin.saveSettings();
      
      console.log(`[CardSetSourceService] 카드셋 소스 변경 완료: ${sourceType}`);
    } catch (error) {
      console.error(`[CardSetSourceService] 카드셋 소스 변경 오류:`, error);
      throw error;
    }
  }
  
  /**
   * 하위 폴더 포함 여부 설정
   * @param include 하위 폴더 포함 여부
   */
  setIncludeSubfolders(include: boolean): void {
    // 카드셋 서비스에 위임
    this.cardSetService.setIncludeSubfolders(include);
    
    // 플러그인 설정 업데이트
    this.plugin.settings.includeSubfolders = include;
    this.plugin.saveSettings();
  }
  
  /**
   * 태그 대소문자 구분 여부 설정
   * @param caseSensitive 대소문자 구분 여부
   */
  setTagCaseSensitive(caseSensitive: boolean): void {
    this.cardSetService.setTagCaseSensitive(caseSensitive);
  }
  
  // 카드셋 서비스 메서드 위임
  getCurrentSource(): ICardSetSource {
    return this.cardSetService.getCurrentSource();
  }
  
  getCurrentSourceType(): CardSetSourceType {
    return this.cardSetService.getCurrentSourceType();
  }
  
  getCurrentCardSet(): string | null {
    const currentCardSet = this.cardSetService.getCurrentCardSet();
    console.log(`[CardSetSourceService] getCurrentCardSet 호출: ${currentCardSet}`);
    return currentCardSet;
  }
  
  isCardSetFixed(): boolean {
    return this.cardSetService.isCardSetFixed();
  }
  
  getIncludeSubfolders(): boolean {
    return this.cardSetService.getIncludeSubfolders();
  }
  
  async getCardSets(): Promise<string[]> {
    return this.cardSetService.getCardSets();
  }
  
  async getFilterOptions(): Promise<string[]> {
    return this.cardSetService.getFilterOptions();
  }
  
  async getFiles(): Promise<string[]> {
    return this.cardSetService.getFiles();
  }
  
  async applySource(cards: ICard[]): Promise<ICard[]> {
    return this.cardSetService.applySource(cards);
  }
  
  /**
   * 서비스 초기화
   */
  async initialize(): Promise<void> {
    // 플러그인 설정에서 초기 상태 로드
    await this.loadSettingsFromPlugin();
    
    // 추가 초기화 작업 수행
    await this.cardSetService.initialize();
  }
  
  reset(): void {
    this.cardSetService.reset();
  }
  
  async handleActiveFileChange(file: TFile | null): Promise<boolean> {
    return this.cardSetService.handleActiveFileChange(file);
  }
  
  async getCards(): Promise<ICard[]> {
    return this.cardSetService.getCards();
  }
  
  configureSearchSource(query: string, searchType?: SearchType, caseSensitive?: boolean, frontmatterKey?: string): void {
    this.cardSetService.configureSearchSource(query, searchType, caseSensitive, frontmatterKey);
  }
  
  getFolderSource(): FolderCardSetSource {
    return this.cardSetService.getFolderSource();
  }
  
  getTagSource(): TagCardSetSource {
    return this.cardSetService.getTagSource();
  }
  
  getPreviousSourceType(): CardSetSourceType {
    return this.cardSetService.getPreviousSourceType();
  }
  
  isTagCaseSensitive(): boolean {
    return this.cardSetService.isTagCaseSensitive();
  }
  
  saveCurrentSourceState(): void {
    this.cardSetService.saveCurrentSourceState();
  }
  
  restorePreviousSourceState(): void {
    this.cardSetService.restorePreviousSourceState();
  }
  
  setSearchService(searchService: ISearchService): void {
    this.cardSetService.setSearchService(searchService);
  }
  
  getPreviousCardSetSource(): CardSetSourceType {
    return this.cardSetService.getPreviousCardSetSource();
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
   * 검색 카드셋 소스 설정
   * @param query 검색 쿼리
   * @param searchType 검색 타입
   * @param caseSensitive 대소문자 구분 여부
   * @param frontmatterKey 프론트매터 키 (검색 타입이 frontmatter인 경우)
   */
  configureSearchCardSetSource(query: string, searchType?: SearchType, caseSensitive?: boolean, frontmatterKey?: string): void {
    // 현재 소스 상태 저장
    this.saveCurrentSourceState();
    
    // 검색 소스로 변경
    this.changeSource('search').then(() => {
      // 검색 설정
      this.configureSearchSource(query, searchType, caseSensitive, frontmatterKey);
    });
  }
} 