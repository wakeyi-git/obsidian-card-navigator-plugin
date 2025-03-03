import { App } from 'obsidian';
import { ICardService } from '../../core/interfaces/service/ICardService';
import { ICardSetManager } from '../../core/interfaces/manager/ICardSetManager';
import { ICardSetService } from '../../core/interfaces/service/ICardSetService';
import { Card } from '../../core/models/Card';
import { CardSet } from '../../core/models/CardSet';
import { CardFilterOption, CardGroupOption, CardSetMode, CardSetOptions, CardSortOption } from '../../core/types/cardset.types';
import { ErrorHandler } from '../../utils/error/ErrorHandler';
import { Log } from '../../utils/log/Log';
import { generateUniqueId } from '../../utils/helpers/string.helper';

/**
 * 카드셋 서비스 클래스
 * 카드셋 관련 고수준 기능을 제공합니다.
 */
export class CardSetService implements ICardSetService {
  private subscriptions: Map<string, (cardSet: CardSet) => void>;
  
  /**
   * 카드셋 서비스 생성자
   * @param app Obsidian 앱 인스턴스
   * @param cardService 카드 서비스 인스턴스
   * @param cardSetManager 카드셋 관리자 인스턴스
   */
  constructor(
    private readonly app: App, 
    private readonly cardService: ICardService, 
    private readonly cardSetManager: ICardSetManager
  ) {
    this.subscriptions = new Map();
    
    try {
      Log.debug('카드셋 서비스 생성됨');
    } catch (error) {
      ErrorHandler.handleError('카드셋 서비스 생성 중 오류 발생', error);
    }
  }
  
  /**
   * 카드셋 서비스 초기화
   * @param options 카드셋 옵션
   */
  initialize(options?: Partial<CardSetOptions>): void {
    try {
      Log.debug('카드셋 서비스 초기화');
      
      // 카드셋 관리자 초기화
      this.cardSetManager.initialize(options);
      
      // 카드셋 변경 이벤트 구독
      const subscriptionId = this.cardSetManager.subscribeToChanges(cardSet => {
        // ICardSet을 CardSet으로 변환
        const convertedCardSet = new CardSet(
          cardSet.id,
          cardSet.mode,
          cardSet.source,
          cardSet.files,
          cardSet.lastUpdated
        );
        
        // 구독자에게 알림
        this.notifySubscribers(convertedCardSet);
      });
      
      Log.debug(`카드셋 변경 이벤트 구독 ID: ${subscriptionId}`);
    } catch (error) {
      ErrorHandler.handleError('카드셋 서비스 초기화 중 오류 발생', error);
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
      
      // 카드셋 관리자에 모드 설정
      await this.cardSetManager.setMode(mode, options);
    } catch (error) {
      ErrorHandler.handleError(`카드셋 모드 설정 중 오류 발생: ${mode}`, error);
    }
  }
  
  /**
   * 현재 카드셋 모드 가져오기
   * @returns 카드셋 모드
   */
  getMode(): CardSetMode {
    return this.cardSetManager.getMode();
  }
  
  /**
   * 현재 카드셋 가져오기
   * @returns 카드셋
   */
  getCurrentCardSet(): CardSet {
    const cardSet = this.cardSetManager.getCurrentCardSet();
    // ICardSet을 CardSet으로 변환
    return new CardSet(
      cardSet.id,
      cardSet.mode,
      cardSet.source,
      cardSet.files,
      cardSet.lastUpdated
    );
  }
  
  /**
   * 카드셋 업데이트
   * @param forceRefresh 강제 새로고침 여부
   */
  async updateCardSet(forceRefresh: boolean = false): Promise<void> {
    try {
      Log.debug(`카드셋 업데이트 (강제 새로고침: ${forceRefresh})`);
      
      // 카드셋 관리자에 업데이트 요청
      await this.cardSetManager.updateCardSet(forceRefresh);
    } catch (error) {
      ErrorHandler.handleError('카드셋 업데이트 중 오류 발생', error);
    }
  }
  
  /**
   * 카드 가져오기
   * @param cardId 카드 ID
   * @returns 카드
   */
  async getCard(cardId: string): Promise<Card | null> {
    try {
      // 카드 서비스를 통해 카드 가져오기
      const card = this.cardService.getCardByPath(cardId);
      return card || null;
    } catch (error) {
      ErrorHandler.handleError(`카드 가져오기 중 오류 발생: ${cardId}`, error);
      return null;
    }
  }
  
  /**
   * 모든 카드 가져오기
   * @returns 카드 배열
   */
  async getAllCards(): Promise<Card[]> {
    try {
      // 현재 카드셋의 모든 파일에 대해 카드 생성
      const cardSet = this.getCurrentCardSet();
      const cards: Card[] = [];
      
      for (const file of cardSet.files) {
        const card = this.cardService.getCardByPath(file.path);
        if (card) {
          cards.push(card);
        }
      }
      
      return cards;
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
      Log.debug(`카드 정렬: ${sortOption.field}, ${sortOption.direction}`);
      
      // 카드셋 관리자에 정렬 옵션 설정
      this.cardSetManager.setSortOption(sortOption);
      
      // 카드셋 업데이트
      await this.updateCardSet(true);
    } catch (error) {
      ErrorHandler.handleError('카드 정렬 중 오류 발생', error);
    }
  }
  
  /**
   * 현재 정렬 옵션 가져오기
   * @returns 정렬 옵션
   */
  getSortOption(): CardSortOption {
    return this.cardSetManager.getSortOption();
  }
  
  /**
   * 카드 필터링
   * @param filterOptions 필터 옵션 배열
   * @returns 필터링된 카드 배열
   */
  async filterCards(filterOptions: CardFilterOption[]): Promise<Card[]> {
    try {
      Log.debug(`카드 필터링: ${filterOptions.length}개 필터`);
      
      // 필터 옵션이 없는 경우 모든 카드 반환
      if (!filterOptions.length) {
        return this.getAllCards();
      }
      
      // 모든 카드 가져오기
      const allCards = await this.getAllCards();
      
      // 필터 함수 생성
      const filterFn = (card: Card) => {
        // 모든 필터 조건을 만족해야 함
        return filterOptions.every(option => this.applyFilter(card, option));
      };
      
      // 필터 적용
      return allCards.filter(filterFn);
    } catch (error) {
      ErrorHandler.handleError('카드 필터링 중 오류 발생', error);
      return [];
    }
  }
  
  /**
   * 필터링된 카드셋 적용
   * @param filteredCards 필터링된 카드 배열
   */
  applyFilteredCards(filteredCards: Card[]): void {
    try {
      Log.debug(`필터링된 카드셋 적용: ${filteredCards.length}개 카드`);
      
      // 필터링된 카드에 해당하는 파일만 포함하는 새 카드셋 생성
      const currentCardSet = this.getCurrentCardSet();
      const filteredFiles = currentCardSet.files.filter(file => 
        filteredCards.some(card => card.path === file.path)
      );
      
      // 카드셋 업데이트
      const updatedCardSet = currentCardSet.refresh(filteredFiles);
      
      // 구독자에게 알림
      this.notifySubscribers(updatedCardSet);
    } catch (error) {
      ErrorHandler.handleError('필터링된 카드셋 적용 중 오류 발생', error);
    }
  }
  
  /**
   * 카드 그룹화
   * @param groupOption 그룹 옵션
   * @returns 그룹화된 카드 맵
   */
  async groupCards(groupOption: CardGroupOption): Promise<Map<string, Card[]>> {
    try {
      Log.debug(`카드 그룹화: ${groupOption.by}`);
      
      // 그룹화가 없는 경우 단일 그룹으로 반환
      if (groupOption.by === 'none') {
        const allCards = await this.getAllCards();
        const result = new Map<string, Card[]>();
        result.set('all', allCards);
        return result;
      }
      
      // 모든 카드 가져오기
      const allCards = await this.getAllCards();
      
      // 그룹화 결과
      const result = new Map<string, Card[]>();
      
      // 카드 그룹화
      for (const card of allCards) {
        // 그룹 키 가져오기
        const groupKey = this.getGroupKey(card, groupOption);
        
        // 그룹이 없는 경우 생성
        if (!result.has(groupKey)) {
          result.set(groupKey, []);
        }
        
        // 그룹에 카드 추가
        result.get(groupKey)?.push(card);
      }
      
      return result;
    } catch (error) {
      ErrorHandler.handleError('카드 그룹화 중 오류 발생', error);
      return new Map<string, Card[]>();
    }
  }
  
  /**
   * 카드 검색
   * @param query 검색 쿼리
   * @returns 검색 결과 카드 배열
   */
  async searchCards(query: string): Promise<Card[]> {
    try {
      Log.debug(`카드 검색: ${query}`);
      
      // 검색 쿼리가 비어있는 경우 모든 카드 반환
      if (!query.trim()) {
        return this.getAllCards();
      }
      
      // 모든 카드 가져오기
      const allCards = await this.getAllCards();
      
      // 검색 쿼리로 필터링
      return allCards.filter(card => {
        const title = card.getTitle().toLowerCase();
        const content = (card.content || '').toLowerCase();
        const searchQuery = query.toLowerCase();
        
        return title.includes(searchQuery) || content.includes(searchQuery);
      });
    } catch (error) {
      ErrorHandler.handleError(`카드 검색 중 오류 발생: ${query}`, error);
      return [];
    }
  }
  
  /**
   * 카드셋 옵션 가져오기
   * @returns 카드셋 옵션
   */
  getOptions(): CardSetOptions {
    return this.cardSetManager.getOptions();
  }
  
  /**
   * 카드셋 옵션 설정
   * @param options 카드셋 옵션
   */
  setOptions(options: Partial<CardSetOptions>): void {
    try {
      Log.debug('카드셋 옵션 설정');
      
      // 카드셋 관리자에 옵션 설정
      this.cardSetManager.setOptions(options);
    } catch (error) {
      ErrorHandler.handleError('카드셋 옵션 설정 중 오류 발생', error);
    }
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
   * 구독자에게 알림
   * @param cardSet 카드셋
   */
  private notifySubscribers(cardSet: CardSet): void {
    this.subscriptions.forEach(callback => {
      try {
        callback(cardSet);
      } catch (error) {
        ErrorHandler.handleError('카드셋 변경 알림 중 오류 발생', error);
      }
    });
  }
  
  /**
   * 카드셋 서비스 파괴
   */
  destroy(): void {
    try {
      Log.debug('카드셋 서비스 파괴');
      
      // 구독 정리
      this.subscriptions.clear();
      
      // 카드셋 관리자 파괴
      this.cardSetManager.destroy();
    } catch (error) {
      ErrorHandler.handleError('카드셋 서비스 파괴 중 오류 발생', error);
    }
  }
  
  /**
   * 필터 적용
   * @param card 카드
   * @param filterOption 필터 옵션
   * @returns 필터 적용 결과
   */
  private applyFilter(card: Card, filterOption: CardFilterOption): boolean {
    try {
      switch (filterOption.type) {
        case 'tag':
          // 태그 필터
          return card.tags.some(tag => tag === filterOption.value);
        
        case 'folder':
          // 폴더 필터
          return card.path === filterOption.value || 
                 card.path.startsWith(filterOption.value + '/');
        
        case 'frontmatter':
          // 프론트매터 필터 (Card 모델에 frontmatter 속성이 없으므로 항상 false 반환)
          return false;
        
        case 'custom':
          // 사용자 정의 필터 (추가 구현 필요)
          return true;
        
        default:
          return true;
      }
    } catch (error) {
      ErrorHandler.handleError('필터 적용 중 오류 발생', error);
      return true;
    }
  }
  
  /**
   * 그룹 키 가져오기
   * @param card 카드
   * @param groupOption 그룹 옵션
   * @returns 그룹 키
   */
  private getGroupKey(card: Card, groupOption: CardGroupOption): string {
    try {
      switch (groupOption.by) {
        case 'folder':
          // 폴더 그룹화
          const folderPath = card.path.split('/').slice(0, -1).join('/');
          return folderPath || 'root';
        
        case 'tag':
          // 태그 그룹화 (첫 번째 태그 사용)
          return card.tags.length > 0 ? card.tags[0] : 'untagged';
        
        case 'date':
          // 날짜 그룹화 (수정일 기준)
          const date = new Date(card.modificationDate);
          return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        case 'custom-field':
          // 사용자 정의 필드 그룹화 (Card 모델에 frontmatter 속성이 없으므로 'unknown' 반환)
          return 'unknown';
        
        case 'none':
        default:
          return 'all';
      }
    } catch (error) {
      ErrorHandler.handleError('그룹 키 가져오기 중 오류 발생', error);
      return 'error';
    }
  }
} 