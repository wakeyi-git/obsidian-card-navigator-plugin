import { App } from 'obsidian';
import { ICardSetService } from '../../core/interfaces/service/ICardSetService';
import { ISearchService } from '../../core/interfaces/service/ISearchService';
import { Card } from '../../core/models/Card';
import { CardSet } from '../../core/models/CardSet';
import { CardFilterOption, CardFilterType, CardGroupOption, CardSetMode, CardSetOptions, CardSortOption } from '../../core/types/cardset.types';
import { ErrorHandler } from '../../utils/error/ErrorHandler';
import { Log } from '../../utils/log/Log';
import { generateUniqueId } from '../../utils/helpers/string.helper';

/**
 * 카드셋 필터 서비스 클래스
 * 카드셋 필터링 관련 기능을 제공합니다.
 */
export class CardSetFilterService implements ICardSetService {
  private activeFilters: CardFilterOption[] = [];
  private subscriptions: Map<string, (cardSet: CardSet) => void> = new Map();
  
  /**
   * 카드셋 필터 서비스 생성자
   * @param app Obsidian 앱 인스턴스
   * @param cardSetService 카드셋 서비스 인스턴스
   * @param searchService 검색 서비스 인스턴스 (선택적)
   */
  constructor(
    private readonly app: App, 
    private readonly cardSetService: ICardSetService, 
    private readonly searchService: ISearchService | null = null
  ) {
    this.activeFilters = [];
    this.subscriptions = new Map();
    
    try {
      Log.debug('카드셋 필터 서비스 생성됨');
    } catch (error) {
      ErrorHandler.handleError('카드셋 필터 서비스 생성 중 오류 발생', error);
    }
  }
  
  /**
   * 카드셋 필터 서비스 초기화
   * @param options 카드셋 옵션
   */
  initialize(options?: Partial<CardSetOptions>): void {
    try {
      Log.debug('카드셋 필터 서비스 초기화');
      
      // 기본 카드셋 서비스 초기화
      this.cardSetService.initialize(options);
      
      // 카드셋 변경 이벤트 구독
      const subscriptionId = this.cardSetService.subscribeToChanges(cardSet => {
        // 필터가 활성화된 경우 필터 적용
        if (this.activeFilters.length > 0) {
          this.applyFilters();
        } else {
          // 필터가 없는 경우 그대로 전달
          this.notifySubscribers(cardSet);
        }
      });
      
      Log.debug(`카드셋 변경 이벤트 구독 ID: ${subscriptionId}`);
    } catch (error) {
      ErrorHandler.handleError('카드셋 필터 서비스 초기화 중 오류 발생', error);
    }
  }
  
  /**
   * 카드셋 모드 설정
   * @param mode 카드셋 모드
   * @param options 모드별 옵션
   */
  async setMode(mode: CardSetMode, options?: Partial<CardSetOptions>): Promise<void> {
    try {
      Log.debug(`카드셋 모드 설정: ${mode}`);
      await this.cardSetService.setMode(mode, options);
      // 모드 변경 시 필터 초기화
      this.clearFilters();
    } catch (error) {
      ErrorHandler.handleError('카드셋 모드 설정 중 오류 발생', error);
    }
  }
  
  /**
   * 현재 카드셋 모드 가져오기
   * @returns 카드셋 모드
   */
  getMode(): CardSetMode {
    try {
      return this.cardSetService.getMode();
    } catch (error) {
      ErrorHandler.handleError('카드셋 모드 가져오기 중 오류 발생', error);
      return CardSetMode.ACTIVE_FOLDER;
    }
  }
  
  /**
   * 현재 카드셋 가져오기
   * @returns 현재 카드셋
   */
  getCurrentCardSet(): CardSet {
    try {
      return this.cardSetService.getCurrentCardSet();
    } catch (error) {
      ErrorHandler.handleError('현재 카드셋 가져오기 중 오류 발생', error);
      return new CardSet('empty', CardSetMode.ACTIVE_FOLDER, null, []);
    }
  }
  
  /**
   * 카드셋 업데이트
   * @param forceRefresh 강제 새로고침 여부
   */
  async updateCardSet(forceRefresh?: boolean): Promise<void> {
    try {
      Log.debug('카드셋 업데이트');
      await this.cardSetService.updateCardSet(forceRefresh);
      
      // 필터가 활성화된 경우 필터 적용
      if (this.activeFilters.length > 0) {
        await this.applyFilters();
      }
    } catch (error) {
      ErrorHandler.handleError('카드셋 업데이트 중 오류 발생', error);
    }
  }
  
  /**
   * 카드 ID로 카드 가져오기
   * @param cardId 카드 ID
   * @returns 카드 객체 또는 null
   */
  async getCard(cardId: string): Promise<Card | null> {
    try {
      return await this.cardSetService.getCard(cardId);
    } catch (error) {
      ErrorHandler.handleError('카드 가져오기 중 오류 발생', error);
      return null;
    }
  }
  
  /**
   * 모든 카드 가져오기
   * @returns 카드 배열
   */
  async getAllCards(): Promise<Card[]> {
    try {
      return await this.cardSetService.getAllCards();
    } catch (error) {
      ErrorHandler.handleError('모든 카드 가져오기 중 오류 발생', error);
      return [];
    }
  }
  
  /**
   * 카드 정렬
   * @param sortOption 정렬 옵션
   */
  async sortCards(sortOption: CardSortOption): Promise<void> {
    try {
      await this.cardSetService.sortCards(sortOption);
    } catch (error) {
      ErrorHandler.handleError('카드 정렬 중 오류 발생', error);
    }
  }
  
  /**
   * 현재 정렬 옵션 가져오기
   * @returns 정렬 옵션
   */
  getSortOption(): CardSortOption {
    try {
      return this.cardSetService.getSortOption();
    } catch (error) {
      ErrorHandler.handleError('정렬 옵션 가져오기 중 오류 발생', error);
      return { field: 'name', direction: 'asc' };
    }
  }
  
  /**
   * 카드 필터링
   * @param filterOptions 필터 옵션 배열
   * @returns 필터링된 카드 배열
   */
  async filterCards(filterOptions: CardFilterOption[]): Promise<Card[]> {
    try {
      return await this.cardSetService.filterCards(filterOptions);
    } catch (error) {
      ErrorHandler.handleError('카드 필터링 중 오류 발생', error);
      return [];
    }
  }
  
  /**
   * 카드 그룹화
   * @param groupOption 그룹 옵션
   * @returns 그룹화된 카드 맵
   */
  async groupCards(groupOption: CardGroupOption): Promise<Map<string, Card[]>> {
    try {
      return await this.cardSetService.groupCards(groupOption);
    } catch (error) {
      ErrorHandler.handleError('카드 그룹화 중 오류 발생', error);
      return new Map<string, Card[]>();
    }
  }
  
  /**
   * 필터링된 카드셋 적용
   * @param filteredCards 필터링된 카드 배열
   */
  applyFilteredCards(filteredCards: Card[]): void {
    try {
      this.cardSetService.applyFilteredCards(filteredCards);
      this.notifySubscribers(this.getCurrentCardSet());
    } catch (error) {
      ErrorHandler.handleError('필터링된 카드셋 적용 중 오류 발생', error);
    }
  }
  
  /**
   * 카드셋 옵션 가져오기
   * @returns 카드셋 옵션
   */
  getOptions(): CardSetOptions {
    try {
      return this.cardSetService.getOptions();
    } catch (error) {
      ErrorHandler.handleError('카드셋 옵션 가져오기 중 오류 발생', error);
      return {
        mode: CardSetMode.ACTIVE_FOLDER,
        sortOption: { field: 'name', direction: 'asc' },
        filterOptions: [],
        groupOption: { by: 'none' },
        autoRefresh: true
      };
    }
  }
  
  /**
   * 카드셋 옵션 설정
   * @param options 카드셋 옵션
   */
  setOptions(options: Partial<CardSetOptions>): void {
    try {
      this.cardSetService.setOptions(options);
    } catch (error) {
      ErrorHandler.handleError('카드셋 옵션 설정 중 오류 발생', error);
    }
  }
  
  /**
   * 현재 필터 적용
   * @returns 필터링된 카드 배열
   */
  async applyFilters(): Promise<Card[]> {
    try {
      if (this.activeFilters.length === 0) {
        // 필터가 없으면 모든 카드 반환
        const allCards = await this.getAllCards();
        this.applyFilteredCards(allCards);
        return allCards;
      }
      
      // 필터 적용
      const filteredCards = await this.filterCards(this.activeFilters);
      this.applyFilteredCards(filteredCards);
      return filteredCards;
    } catch (error) {
      ErrorHandler.handleError('필터 적용 중 오류 발생', error);
      return [];
    }
  }
  
  /**
   * 필터 추가
   * @param filterOption 필터 옵션
   */
  addFilter(filterOption: CardFilterOption): void {
    try {
      // 이미 동일한 필터가 있는지 확인
      const existingFilterIndex = this.activeFilters.findIndex(
        filter => 
          filter.type === filterOption.type && 
          filter.value === filterOption.value &&
          filter.field === filterOption.field
      );
      
      if (existingFilterIndex === -1) {
        // 새 필터 추가
        this.activeFilters.push(filterOption);
        Log.debug(`필터 추가됨: ${filterOption.type} - ${filterOption.value}`);
        
        // 필터 적용
        this.applyFilters();
      }
    } catch (error) {
      ErrorHandler.handleError('필터 추가 중 오류 발생', error);
    }
  }
  
  /**
   * 필터 제거
   * @param filterOption 필터 옵션
   */
  removeFilter(filterOption: CardFilterOption): void {
    try {
      // 필터 찾기
      const filterIndex = this.activeFilters.findIndex(
        filter => 
          filter.type === filterOption.type && 
          filter.value === filterOption.value &&
          filter.field === filterOption.field
      );
      
      if (filterIndex !== -1) {
        // 필터 제거
        this.activeFilters.splice(filterIndex, 1);
        Log.debug(`필터 제거됨: ${filterOption.type} - ${filterOption.value}`);
        
        // 필터 적용
        this.applyFilters();
      }
    } catch (error) {
      ErrorHandler.handleError('필터 제거 중 오류 발생', error);
    }
  }
  
  /**
   * 모든 필터 제거
   */
  clearFilters(): void {
    try {
      if (this.activeFilters.length > 0) {
        this.activeFilters = [];
        Log.debug('모든 필터 제거됨');
        
        // 필터 적용 (모든 카드 표시)
        this.applyFilters();
      }
    } catch (error) {
      ErrorHandler.handleError('필터 제거 중 오류 발생', error);
    }
  }
  
  /**
   * 현재 활성화된 필터 가져오기
   * @returns 활성화된 필터 배열
   */
  getActiveFilters(): CardFilterOption[] {
    return [...this.activeFilters];
  }
  
  /**
   * 카드셋 변경 이벤트 구독
   * @param callback 콜백 함수
   * @returns 구독 ID
   */
  subscribeToChanges(callback: (cardSet: CardSet) => void): string {
    const subscriptionId = generateUniqueId();
    this.subscriptions.set(subscriptionId, callback);
    return subscriptionId;
  }
  
  /**
   * 카드셋 변경 구독 취소
   * @param subscriptionId 구독 ID
   */
  unsubscribeFromChanges(subscriptionId: string): void {
    this.subscriptions.delete(subscriptionId);
  }
  
  /**
   * 구독자에게 변경 알림
   * @param cardSet 카드셋
   */
  private notifySubscribers(cardSet: CardSet): void {
    for (const callback of this.subscriptions.values()) {
      try {
        callback(cardSet);
      } catch (error) {
        ErrorHandler.handleError('카드셋 변경 알림 중 오류 발생', error);
      }
    }
  }
  
  /**
   * 필터 옵션 생성
   * @param type 필터 타입
   * @param value 필터 값
   * @param field 필드 이름 (프론트매터 필터에 사용)
   * @returns 필터 옵션
   */
  createFilterOption(
    type: CardFilterType, 
    value: string, 
    field?: string
  ): CardFilterOption {
    return {
      type,
      value,
      field
    };
  }
  
  /**
   * 카드셋 필터 서비스 파괴
   */
  destroy(): void {
    try {
      this.subscriptions.clear();
      this.activeFilters = [];
      this.cardSetService.destroy();
      Log.debug('카드셋 필터 서비스 파괴됨');
    } catch (error) {
      ErrorHandler.handleError('카드셋 필터 서비스 파괴 중 오류 발생', error);
    }
  }
} 