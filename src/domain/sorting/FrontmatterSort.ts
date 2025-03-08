import { ICard } from '../card/Card';
import { ISort, SortDirection, SortType } from './Sort';

/**
 * 프론트매터 정렬 클래스
 * 프론트매터 값을 기준으로 카드를 정렬합니다.
 */
export class FrontmatterSort implements ISort {
  /**
   * 정렬 타입
   */
  type: SortType = 'frontmatter';
  
  /**
   * 정렬 방향
   */
  direction: SortDirection;
  
  /**
   * 프론트매터 키
   */
  frontmatterKey: string;
  
  /**
   * 생성자
   * @param direction 정렬 방향
   * @param frontmatterKey 프론트매터 키
   */
  constructor(direction: SortDirection = 'asc', frontmatterKey: string) {
    this.direction = direction;
    this.frontmatterKey = frontmatterKey;
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
    const valueA = this.getFrontmatterValue(a);
    const valueB = this.getFrontmatterValue(b);
    
    // 값이 없는 경우 처리
    if (valueA === undefined && valueB === undefined) return 0;
    if (valueA === undefined) return this.direction === 'asc' ? 1 : -1;
    if (valueB === undefined) return this.direction === 'asc' ? -1 : 1;
    
    // 값 타입에 따른 비교
    let result: number;
    
    if (typeof valueA === 'number' && typeof valueB === 'number') {
      // 숫자 비교
      result = valueA - valueB;
    } else if (typeof valueA === 'string' && typeof valueB === 'string') {
      // 문자열 비교
      result = valueA.localeCompare(valueB);
    } else if (valueA instanceof Date && valueB instanceof Date) {
      // 날짜 비교
      result = valueA.getTime() - valueB.getTime();
    } else {
      // 기타 타입은 문자열로 변환하여 비교
      result = String(valueA).localeCompare(String(valueB));
    }
    
    // 정렬 방향에 따라 결과 반환
    return this.direction === 'asc' ? result : -result;
  }
  
  /**
   * 프론트매터 값 가져오기
   * @param card 카드
   * @returns 프론트매터 값
   */
  private getFrontmatterValue(card: ICard): any {
    return card.frontmatter?.[this.frontmatterKey];
  }
} 