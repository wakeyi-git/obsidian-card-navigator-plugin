import { App } from 'obsidian';
import { ICardService } from '../../core/interfaces/service/ICardService';
import { ICardSetManager } from '../../core/interfaces/manager/ICardSetManager';
import { ICardSetService } from '../../core/interfaces/service/ICardSetService';
import { Card } from '../../core/models/Card';
import { CardSet } from '../../core/models/CardSet';
import { CardFilterOption, CardGroupOption, CardSetMode, CardSetOptions, CardSortOption } from '../../core/types/cardset.types';
import { ErrorHandler } from '../../utils/error/ErrorHandler';
import { Log } from '../../utils/log/Log';

/**
 * 카드셋 서비스 클래스
 * 카드셋 관련 기능을 제공합니다.
 */
export class CardSetService implements ICardSetService {
  private app: App;
  private cardService: ICardService;
  private cardSetManager: ICardSetManager;
  
  /**
   * 카드셋 서비스 생성자
   * @param app Obsidian 앱 인스턴스
   * @param cardService 카드 서비스 인스턴스
   * @param cardSetManager 카드셋 관리자 인스턴스
   */
  constructor(app: App, cardService: ICardService, cardSetManager: ICardSetManager) {
    try {
      this.app = app;
      this.cardService = cardService;
      this.cardSetManager = cardSetManager;
      
      Log.debug('카드셋 서비스 생성됨');
    } catch (error) {
      ErrorHandler.handleError('카드셋 서비스 생성 중 오류 발생', error);
    }
  }
  
  /**
   * 카드셋 초기화
   * @param options 카드셋 옵션
   */
  initialize(options?: Partial<CardSetOptions>): void {
    try {
      Log.debug('카드셋 서비스 초기화');
      
      // 카드셋 관리자 초기화
      this.cardSetManager.initialize(options);
    } catch (error) {
      ErrorHandler.handleError('카드셋 서비스 초기화 중 오류 발생', error);
    }
  }
  
  /**
   * 카드셋 모드 설정
   * @param mode 카드셋 모드
   * @param options 모드별 옵션
   */
  async setMode(mode: CardSetMode, options?: any): Promise<void> {
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
    return this.cardSetManager.getCurrentCardSet();
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
      // 카드셋 관리자에서 카드 가져오기
      const card = this.cardSetManager.getCard(cardId);
      
      // 카드가 없는 경우 null 반환
      if (!card) {
        return null;
      }
      
      return card;
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
      // 카드셋 관리자에서 모든 카드 가져오기
      return this.cardSetManager.getAllCards();
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
      Log.debug(`카드 정렬: ${sortOption.by}, ${sortOption.direction}`);
      
      // 카드셋 관리자에 정렬 요청
      this.cardSetManager.sortCards(sortOption);
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
      const allCards = this.cardSetManager.getAllCards();
      
      // 필터 함수 생성
      const filterFn = (card: Card) => {
        // 모든 필터 조건을 만족해야 함
        return filterOptions.every(option => this.applyFilter(card, option));
      };
      
      // 필터 적용
      return this.cardSetManager.filterCards(filterFn);
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
      
      // 카드셋 관리자에 검색 요청
      return this.cardSetManager.searchCards(query);
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
   * 카드셋 서비스 파괴
   */
  destroy(): void {
    try {
      Log.debug('카드셋 서비스 파괴');
      
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
          return card.folderPath === filterOption.value || 
                 card.folderPath.startsWith(filterOption.value + '/');
        
        case 'frontmatter':
          // 프론트매터 필터
          if (!filterOption.field || !card.frontmatter) {
            return false;
          }
          
          const fieldValue = card.frontmatter[filterOption.field];
          
          // 필드가 없는 경우
          if (fieldValue === undefined) {
            return false;
          }
          
          // 연산자에 따라 비교
          switch (filterOption.operator) {
            case 'equals':
              return fieldValue === filterOption.value;
            case 'contains':
              return String(fieldValue).includes(String(filterOption.value));
            case 'greater-than':
              return Number(fieldValue) > Number(filterOption.value);
            case 'less-than':
              return Number(fieldValue) < Number(filterOption.value);
            default:
              return String(fieldValue) === String(filterOption.value);
          }
        
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
          return card.folderPath || 'root';
        
        case 'tag':
          // 태그 그룹화 (첫 번째 태그 사용)
          return card.tags.length > 0 ? card.tags[0] : 'untagged';
        
        case 'date':
          // 날짜 그룹화 (수정일 기준)
          const date = new Date(card.mtime);
          return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        case 'custom-field':
          // 사용자 정의 필드 그룹화
          if (!groupOption.field || !card.frontmatter) {
            return 'unknown';
          }
          
          const fieldValue = card.frontmatter[groupOption.field];
          return fieldValue !== undefined ? String(fieldValue) : 'unknown';
        
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