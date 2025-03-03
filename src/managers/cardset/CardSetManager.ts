import { App, TFile } from 'obsidian';
import { ICardService } from '../../core/interfaces/service/ICardService';
import { ICardSetManager } from '../../core/interfaces/manager/ICardSetManager';
import { ISearchService } from '../../core/interfaces/service/ISearchService';
import { Card } from '../../core/models/Card';
import { CardSet } from '../../core/models/CardSet';
import { CardSetMode, CardSetOptions, CardSortOption, ICardSet } from '../../core/types/cardset.types';
import { ErrorHandler } from '../../utils/error/ErrorHandler';
import { Log } from '../../utils/log/Log';
import { getDirectoryPath, getMarkdownFilesInFolder } from '../../utils/helpers/file.helper';
import { ErrorCode } from '../../core/constants/error.constants';
import { ICardSetProvider } from '../../core/interfaces/manager/ICardSetProvider';
import { CardSetProviderFactory } from './CardSetProviderFactory';
import { CardSetProviderRegistry } from './CardSetProviderRegistry';
import { CardSetStateManager } from './CardSetStateManager';

/**
 * 카드셋 관리자 클래스
 * 카드셋 제공자와 상태를 관리하고 카드셋 작업을 조정합니다.
 */
export class CardSetManager implements ICardSetManager {
  /**
   * Obsidian 앱 인스턴스
   */
  private app: App;
  
  /**
   * 카드 서비스
   */
  private cardService: ICardService;
  
  /**
   * 검색 서비스
   */
  private searchService: ISearchService;
  
  /**
   * 카드셋 상태 관리자
   */
  private stateManager: CardSetStateManager;
  
  /**
   * 카드셋 제공자 레지스트리
   */
  private providerRegistry: CardSetProviderRegistry;
  
  /**
   * 카드셋 제공자 팩토리
   */
  private providerFactory: CardSetProviderFactory;
  
  /**
   * 카드셋 관리자 생성자
   * @param app Obsidian 앱 인스턴스
   * @param cardService 카드 서비스
   * @param searchService 검색 서비스
   */
  constructor(app: App, cardService: ICardService, searchService: ISearchService) {
    this.app = app;
    this.cardService = cardService;
    this.searchService = searchService;
    this.stateManager = new CardSetStateManager();
    this.providerRegistry = new CardSetProviderRegistry();
    this.providerFactory = new CardSetProviderFactory(app);
    
    // 기본 제공자 등록
    this.registerDefaultProviders();
  }
  
  /**
   * 기본 카드셋 제공자 등록
   */
  private registerDefaultProviders(): void {
    try {
      // 각 모드에 대한 제공자 생성 및 등록
      Object.values(CardSetMode).forEach(mode => {
        const provider = this.providerFactory.createProvider(mode);
        if (provider) {
          // 제공자에 현재 옵션 설정
          provider.setOptions(this.stateManager.getOptions());
          
          // 제공자 등록
          this.providerRegistry.registerProvider(mode, provider);
          
          // 카드셋 로드 콜백 설정
          this.setupProviderCallback(provider);
        }
      });
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        '기본 카드셋 제공자 등록 중 오류 발생',
        error
      );
    }
  }
  
  /**
   * 제공자 콜백 설정
   * @param provider 카드셋 제공자
   */
  private setupProviderCallback(provider: ICardSetProvider): void {
    // 카드셋 변경 이벤트 리스너 추가
    provider.addEventListener('cardSetChanged', (cardSet: CardSet) => {
      if (this.stateManager.getMode() === provider.mode) {
        // CardSet을 ICardSet으로 취급하여 전달
        this.stateManager.setCurrentCardSet(cardSet as any);
      }
    });
  }
  
  /**
   * 카드셋 제공자 등록
   * @param provider 카드셋 제공자
   */
  registerProvider(provider: ICardSetProvider): void {
    try {
      // 제공자에 현재 옵션 설정
      provider.setOptions(this.stateManager.getOptions());
      
      // 제공자 등록
      this.providerRegistry.registerProvider(provider.mode, provider);
      
      // 카드셋 로드 콜백 설정
      this.setupProviderCallback(provider);
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        `카드셋 제공자 등록 중 오류 발생: ${provider.mode}`,
        error
      );
    }
  }
  
  /**
   * 카드셋 관리자 초기화
   */
  async initialize(options?: Partial<CardSetOptions>): Promise<void> {
    try {
      // 옵션이 제공된 경우 설정
      if (options) {
        this.stateManager.setOptions(options);
      }
      
      // 모든 제공자 초기화
      this.providerRegistry.initializeAllProviders();
      
      // 현재 모드의 제공자 로드 시작
      const currentMode = this.stateManager.getMode();
      const provider = this.providerRegistry.getProvider(currentMode);
      
      if (provider) {
        await provider.loadCardSet();
      }
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        '카드셋 관리자 초기화 중 오류 발생',
        error
      );
    }
  }
  
  /**
   * 카드셋 관리자 정리
   */
  cleanup(): void {
    try {
      // 모든 제공자 정리
      this.providerRegistry.cleanupAllProviders();
      
      // 상태 관리자 정리
      this.stateManager.destroy();
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        '카드셋 관리자 정리 중 오류 발생',
        error
      );
    }
  }
  
  /**
   * 카드셋 모드 설정
   * @param mode 카드셋 모드
   * @param options 모드별 옵션
   */
  async setMode(mode: CardSetMode, options?: Partial<CardSetOptions>): Promise<void> {
    try {
      // 이전 모드와 동일하면 무시
      if (this.stateManager.getMode() === mode) {
        return;
      }
      
      // 상태 관리자에 모드 설정
      this.stateManager.setMode(mode);
      
      // 옵션이 제공된 경우 설정
      if (options) {
        this.stateManager.setOptions(options);
      }
      
      // 새 모드의 제공자 가져오기
      const provider = this.providerRegistry.getProvider(mode);
      
      if (provider) {
        // 제공자에 현재 옵션 설정
        provider.setOptions(this.stateManager.getOptions());
        
        // 카드셋 로드
        await provider.loadCardSet();
      }
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        `카드셋 모드 설정 중 오류 발생: ${mode}`,
        error
      );
    }
  }
  
  /**
   * 현재 카드셋 모드 가져오기
   * @returns 카드셋 모드
   */
  getMode(): CardSetMode {
    return this.stateManager.getMode();
  }
  
  /**
   * 카드셋 옵션 설정
   * @param options 카드셋 옵션
   */
  setOptions(options: Partial<CardSetOptions>): void {
    try {
      // 상태 관리자에 옵션 설정
      this.stateManager.setOptions(options);
      
      // 모든 제공자에 옵션 전파
      this.providerRegistry.getAllProviders().forEach(provider => {
        provider.setOptions(this.stateManager.getOptions());
      });
      
      // 현재 모드의 제공자 새로고침
      const currentMode = this.stateManager.getMode();
      const provider = this.providerRegistry.getProvider(currentMode);
      
      if (provider) {
        provider.refreshCardSet(this.toCardSet(this.stateManager.getCurrentCardSet()));
      }
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        '카드셋 옵션 설정 중 오류 발생',
        error
      );
    }
  }
  
  /**
   * 카드셋 옵션 가져오기
   * @returns 카드셋 옵션
   */
  getOptions(): CardSetOptions {
    return this.stateManager.getOptions();
  }
  
  /**
   * 현재 카드셋 가져오기
   * @returns 카드셋
   */
  getCurrentCardSet(): ICardSet {
    return this.stateManager.getCurrentCardSet();
  }
  
  /**
   * 카드셋 정렬 옵션 설정
   * @param sortOption 정렬 옵션
   */
  async setSortOption(sortOption: CardSortOption): Promise<void> {
    try {
      // 상태 관리자에 정렬 옵션 설정
      this.stateManager.setSortOption(sortOption);
      
      // 현재 모드의 제공자 가져오기
      const provider = this.providerRegistry.getProvider(this.stateManager.getMode());
      
      if (provider) {
        provider.refreshCardSet(this.toCardSet(this.stateManager.getCurrentCardSet()));
      }
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        '카드셋 정렬 옵션 설정 중 오류 발생',
        error
      );
    }
  }
  
  /**
   * 현재 정렬 옵션 가져오기
   * @returns 정렬 옵션
   */
  getSortOption(): CardSortOption {
    return this.stateManager.getSortOption();
  }
  
  /**
   * 카드셋 업데이트
   * @param forceRefresh 강제 새로고침 여부
   */
  async updateCardSet(forceRefresh: boolean = false): Promise<void> {
    try {
      // 현재 모드의 제공자 가져오기
      const provider = this.providerRegistry.getProvider(this.stateManager.getMode());
      
      if (provider) {
        provider.refreshCardSet(this.toCardSet(this.stateManager.getCurrentCardSet()));
      }
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        '카드셋 업데이트 중 오류 발생',
        error
      );
    }
  }
  
  /**
   * 파일이 현재 카드셋에 포함되는지 확인
   * @param file 확인할 파일
   * @returns 포함 여부
   */
  isFileIncluded(file: TFile): boolean {
    try {
      const currentMode = this.stateManager.getMode();
      const provider = this.providerRegistry.getProvider(currentMode);
      
      if (provider) {
        return provider.containsFile(file);
      }
      
      return false;
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        '파일 포함 여부 확인 중 오류 발생',
        error
      );
      return false;
    }
  }
  
  /**
   * 카드셋 변경 이벤트 구독
   * @param callback 콜백 함수
   * @returns 구독 ID
   */
  subscribeToChanges(callback: (cardSet: ICardSet) => void): string {
    return this.stateManager.subscribeToChanges(callback);
  }
  
  /**
   * 카드셋 변경 구독 취소
   * @param subscriptionId 구독 ID
   */
  unsubscribeFromChanges(subscriptionId: string): void {
    this.stateManager.unsubscribeFromChanges(subscriptionId);
  }
  
  /**
   * 카드셋에 파일 추가
   * @param file 파일
   * @returns 추가 성공 여부
   */
  async addFile(file: TFile): Promise<boolean> {
    try {
      // 현재 모드의 제공자 가져오기
      const provider = this.providerRegistry.getProvider(this.stateManager.getMode());
      
      if (provider && provider.containsFile(file)) {
        await provider.handleFileChange(file, 'create', this.toCardSet(this.stateManager.getCurrentCardSet()));
        return true;
      }
      
      return false;
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        `파일 추가 중 오류 발생: ${file.path}`,
        error
      );
      return false;
    }
  }
  
  /**
   * 카드셋에서 파일 제거
   * @param filePath 파일 경로
   * @returns 제거 성공 여부
   */
  removeFile(filePath: string): boolean {
    try {
      // 현재 카드셋 가져오기
      const currentCardSet = this.stateManager.getCurrentCardSet();
      
      // 파일이 카드셋에 포함되어 있는지 확인
      if (currentCardSet.files.some(file => file.path === filePath)) {
        // 현재 모드의 제공자 가져오기
        const provider = this.providerRegistry.getProvider(this.stateManager.getMode());
        
        if (provider) {
          provider.handleFileChange(null, 'delete', this.toCardSet(currentCardSet));
          return true;
        }
      }
      
      return false;
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        `파일 제거 중 오류 발생: ${filePath}`,
        error
      );
      return false;
    }
  }
  
  /**
   * 파일 변경 처리
   * @param file 변경된 파일
   * @param changeType 변경 유형
   */
  async handleFileChange(file: TFile | null, changeType: string): Promise<void> {
    try {
      // 현재 모드의 제공자 가져오기
      const provider = this.providerRegistry.getProvider(this.stateManager.getMode());
      
      if (provider) {
        await provider.handleFileChange(file, changeType, this.toCardSet(this.stateManager.getCurrentCardSet()));
      }
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        `파일 변경 처리 중 오류 발생: ${file?.path || 'unknown'}`,
        error
      );
    }
  }
  
  /**
   * 카드셋 파괴
   */
  destroy(): void {
    this.cleanup();
  }
  
  /**
   * ICardSet을 CardSet으로 변환
   * @param cardSet ICardSet 인터페이스 구현체
   * @returns CardSet 인스턴스
   */
  private toCardSet(cardSet: ICardSet): CardSet {
    if (cardSet instanceof CardSet) {
      return cardSet;
    }
    
    // ICardSet 인터페이스만 구현한 객체인 경우 CardSet 인스턴스로 변환
    return new CardSet(
      cardSet.id,
      cardSet.mode,
      cardSet.source,
      cardSet.files,
      cardSet.lastUpdated
    );
  }
  
  /**
   * 카드셋 모드 문자열 설정
   * @param mode 카드셋 모드 문자열
   */
  async setCardSetType(mode: string): Promise<void> {
    try {
      // 카드셋 모드 문자열을 CardSetMode로 변환
      const cardSetMode = this.convertStringToCardSetMode(mode);
      
      // 변환된 모드로 설정
      await this.setMode(cardSetMode);
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        `카드셋 모드 설정 중 오류 발생: ${mode}`,
        error
      );
    }
  }
  
  /**
   * 문자열을 CardSetMode로 변환
   * @param mode 모드 문자열
   * @returns 변환된 CardSetMode
   */
  private convertStringToCardSetMode(mode: string): CardSetMode {
    switch (mode.toLowerCase()) {
      case 'active-folder':
        return CardSetMode.ACTIVE_FOLDER;
      case 'selected-folder':
        return CardSetMode.SELECTED_FOLDER;
      case 'vault':
        return CardSetMode.VAULT;
      case 'search-results':
        return CardSetMode.SEARCH_RESULTS;
      case 'tag':
        return CardSetMode.TAG;
      case 'custom':
        return CardSetMode.CUSTOM;
      default:
        return CardSetMode.ACTIVE_FOLDER;
    }
  }
} 