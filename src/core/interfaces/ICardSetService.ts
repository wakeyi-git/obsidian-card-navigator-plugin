import { Card } from '../models/Card';
import { CardSet } from '../models/CardSet';
import { CardFilterOption, CardGroupOption, CardSetMode, CardSetOptions, CardSortOption } from '../types/cardset.types';
import { ICardSetManager } from './ICardSetManager';

/**
 * 카드셋 서비스 인터페이스
 * 카드셋 관련 고수준 기능을 제공합니다.
 */
export interface ICardSetService {
  /**
   * 카드셋 서비스 초기화
   * @param cardSetManager 카드셋 관리자
   * @param options 카드셋 옵션
   */
  initialize(cardSetManager: ICardSetManager, options?: Partial<CardSetOptions>): void;
  
  /**
   * 카드셋 모드 설정
   * @param mode 카드셋 모드
   * @param options 모드별 옵션
   */
  setMode(mode: CardSetMode, options?: Partial<CardSetOptions>): Promise<void>;
  
  /**
   * 현재 카드셋 모드 가져오기
   * @returns 카드셋 모드
   */
  getMode(): CardSetMode;
  
  /**
   * 현재 카드셋 가져오기
   * @returns 카드셋
   */
  getCurrentCardSet(): CardSet;
  
  /**
   * 카드셋 업데이트
   * @param forceRefresh 강제 새로고침 여부
   */
  updateCardSet(forceRefresh?: boolean): Promise<void>;
  
  /**
   * 카드 ID로 카드 가져오기
   * @param cardId 카드 ID
   * @returns 카드 또는 null
   */
  getCard(cardId: string): Promise<Card | null>;
  
  /**
   * 현재 카드셋의 모든 카드 가져오기
   * @returns 카드 배열
   */
  getAllCards(): Promise<Card[]>;
  
  /**
   * 카드셋 정렬
   * @param sortOption 정렬 옵션
   */
  sortCards(sortOption: CardSortOption): Promise<void>;
  
  /**
   * 현재 정렬 옵션 가져오기
   * @returns 정렬 옵션
   */
  getSortOption(): CardSortOption;
  
  /**
   * 카드 필터링
   * @param filterOptions 필터 옵션 배열
   * @returns 필터링된 카드 배열
   */
  filterCards(filterOptions: CardFilterOption[]): Promise<Card[]>;
  
  /**
   * 카드 그룹화
   * @param groupOption 그룹 옵션
   * @returns 그룹화된 카드 맵
   */
  groupCards(groupOption: CardGroupOption): Promise<Map<string, Card[]>>;
  
  /**
   * 필터링된 카드셋 적용
   * @param filteredCards 필터링된 카드 배열
   */
  applyFilteredCards(filteredCards: Card[]): void;
  
  /**
   * 카드셋 옵션 가져오기
   * @returns 카드셋 옵션
   */
  getOptions(): CardSetOptions;
  
  /**
   * 카드셋 옵션 설정
   * @param options 카드셋 옵션
   */
  setOptions(options: Partial<CardSetOptions>): void;
  
  /**
   * 카드셋 변경 이벤트 구독
   * @param callback 콜백 함수
   * @returns 구독 ID
   */
  subscribeToChanges(callback: (cardSet: CardSet) => void): string;
  
  /**
   * 카드셋 변경 구독 취소
   * @param subscriptionId 구독 ID
   */
  unsubscribeFromChanges(subscriptionId: string): void;
  
  /**
   * 카드셋 서비스 파괴
   */
  destroy(): void;
} 