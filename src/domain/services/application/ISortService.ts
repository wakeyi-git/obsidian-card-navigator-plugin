import { ISortConfig } from '../../models/Sort';
import { ICard } from '../../models/Card';

/**
 * 정렬 서비스 인터페이스
 * 
 * @remarks
 * 정렬 서비스는 카드 목록의 정렬과 정렬 설정의 유효성 검사를 담당합니다.
 */
export interface ISortService {
  /**
   * 초기화
   */
  initialize(): void;

  /**
   * 정리
   */
  cleanup(): void;

  /**
   * 카드 목록 정렬
   * @param cards 정렬할 카드 목록
   * @param config 정렬 설정
   * @returns 정렬된 카드 목록
   */
  sortCards(cards: readonly ICard[], config: ISortConfig): Promise<readonly ICard[]>;

  /**
   * 정렬 설정 유효성 검사
   * @param config 검사할 정렬 설정
   * @returns 유효성 여부
   */
  validateSortConfig(config: ISortConfig): boolean;
} 