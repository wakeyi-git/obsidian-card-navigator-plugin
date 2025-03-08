import { ICard } from '../card/Card';
import { ISort, SortDirection, SortType } from './Sort';

/**
 * 날짜 정렬 클래스
 * 생성일 또는 수정일 기준으로 카드를 정렬합니다.
 */
export class DateSort implements ISort {
  /**
   * 정렬 타입
   */
  type: SortType;
  
  /**
   * 정렬 방향
   */
  direction: SortDirection;
  
  /**
   * 날짜 필드 (created 또는 modified)
   */
  private dateField: 'created' | 'modified';
  
  /**
   * 생성자
   * @param direction 정렬 방향
   * @param dateField 날짜 필드 (created 또는 modified)
   */
  constructor(direction: SortDirection = 'asc', dateField: 'created' | 'modified' = 'modified') {
    this.direction = direction;
    this.dateField = dateField;
    this.type = dateField as SortType; // 'created' 또는 'modified'를 SortType으로 사용
  }
  
  /**
   * 정렬 적용
   * @param cards 카드 목록
   * @returns 정렬된 카드 목록
   */
  apply(cards: ICard[]): ICard[] {
    return [...cards].sort((a, b) => this.compare(a, b));
  }
  
  /**
   * 정렬 방향 전환
   */
  toggleDirection(): void {
    this.direction = this.direction === 'asc' ? 'desc' : 'asc';
  }
  
  /**
   * 두 카드 비교
   * @param a 첫 번째 카드
   * @param b 두 번째 카드
   * @returns 비교 결과
   */
  compare(a: ICard, b: ICard): number {
    const dateA = this.dateField === 'created' ? a.created : a.modified;
    const dateB = this.dateField === 'created' ? b.created : b.modified;
    
    // 날짜 비교
    const result = dateA - dateB;
    
    // 정렬 방향에 따라 결과 반환
    return this.direction === 'asc' ? result : -result;
  }
} 