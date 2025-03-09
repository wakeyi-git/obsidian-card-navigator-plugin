import { ICard } from '../card/Card';

/**
 * 정렬 타입 정의
 */
export type SortType = 'filename' | 'created' | 'modified' | 'frontmatter' | 'tag' | 'folder';

/**
 * 정렬 방향 정의
 */
export type SortDirection = 'asc' | 'desc';

/**
 * 정렬 인터페이스
 * 카드를 정렬하기 위한 인터페이스입니다.
 */
export interface ISort {
  /**
   * 정렬 타입
   */
  type: SortType;
  
  /**
   * 정렬 방향
   */
  direction: SortDirection;
  
  /**
   * 프론트매터 키 (frontmatter 타입인 경우)
   */
  frontmatterKey?: string;
  
  /**
   * 정렬 적용
   * 주어진 카드 목록에 정렬을 적용합니다.
   * @param cards 카드 목록
   * @returns 정렬된 카드 목록
   */
  apply(cards: ICard[]): ICard[];
  
  /**
   * 정렬 방향 전환
   * 현재 정렬 방향을 반대로 전환합니다.
   */
  toggleDirection(): void;
  
  /**
   * 두 카드 비교
   * 정렬 기준에 따라 두 카드를 비교합니다.
   * @param a 첫 번째 카드
   * @param b 두 번째 카드
   * @returns 비교 결과 (-1, 0, 1)
   */
  compare(a: ICard, b: ICard): number;
}

/**
 * 정렬 추상 클래스
 * 정렬 인터페이스를 구현하는 추상 클래스입니다.
 */
export abstract class Sort implements ISort {
  type: SortType;
  direction: SortDirection;
  frontmatterKey?: string;
  
  constructor(
    type: SortType,
    direction: SortDirection = 'asc',
    frontmatterKey?: string
  ) {
    this.type = type;
    this.direction = direction;
    this.frontmatterKey = frontmatterKey;
  }
  
  abstract apply(cards: ICard[]): ICard[];
  
  toggleDirection(): void {
    this.direction = this.direction === 'asc' ? 'desc' : 'asc';
  }
  
  /**
   * 정렬 함수
   * 두 카드를 비교하여 정렬 순서를 결정합니다.
   * @param a 첫 번째 카드
   * @param b 두 번째 카드
   * @param getValue 값을 가져오는 함수
   * @returns 정렬 순서
   */
  protected compareValues<T>(a: T, b: T): number {
    if (a === b) return 0;
    
    if (a === null || a === undefined) return this.direction === 'asc' ? -1 : 1;
    if (b === null || b === undefined) return this.direction === 'asc' ? 1 : -1;
    
    if (typeof a === 'string' && typeof b === 'string') {
      return this.direction === 'asc'
        ? a.localeCompare(b)
        : b.localeCompare(a);
    }
    
    if (typeof a === 'number' && typeof b === 'number') {
      return this.direction === 'asc' ? a - b : b - a;
    }
    
    // 기본 비교
    const aStr = String(a);
    const bStr = String(b);
    
    return this.direction === 'asc'
      ? aStr.localeCompare(bStr)
      : bStr.localeCompare(aStr);
  }
  
  abstract compare(a: ICard, b: ICard): number;
} 