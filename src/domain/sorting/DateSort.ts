import { ICard } from '../card/Card';
import { ISort, SortDirection } from './Sort';

/**
 * 날짜 정렬 클래스
 * 카드를 생성일 또는 수정일로 정렬하는 클래스입니다.
 */
export class DateSort implements ISort {
  type: 'created' | 'modified';
  direction: SortDirection;
  frontmatterKey?: string;
  
  constructor(type: 'created' | 'modified', direction: SortDirection = 'desc') {
    this.type = type;
    this.direction = direction;
  }
  
  apply(cards: ICard[]): ICard[] {
    return this.sort(cards);
  }
  
  sort(cards: ICard[]): ICard[] {
    return [...cards].sort((a, b) => {
      const dateA = this.type === 'created' ? a.created : a.modified;
      const dateB = this.type === 'created' ? b.created : b.modified;
      
      if (!dateA && !dateB) return 0;
      if (!dateA) return this.direction === 'asc' ? 1 : -1;
      if (!dateB) return this.direction === 'asc' ? -1 : 1;
      
      if (this.direction === 'asc') {
        return dateA - dateB;
      } else {
        return dateB - dateA;
      }
    });
  }
  
  toggleDirection(): void {
    this.direction = this.direction === 'asc' ? 'desc' : 'asc';
  }
  
  /**
   * 두 카드 비교
   * 날짜를 기준으로 두 카드를 비교합니다.
   * @param a 첫 번째 카드
   * @param b 두 번째 카드
   * @returns 비교 결과 (-1, 0, 1)
   */
  compare(a: ICard, b: ICard): number {
    const dateA = this.type === 'created' ? a.created : a.modified;
    const dateB = this.type === 'created' ? b.created : b.modified;
    
    if (!dateA && !dateB) return 0;
    if (!dateA) return this.direction === 'asc' ? 1 : -1;
    if (!dateB) return this.direction === 'asc' ? -1 : 1;
    
    if (this.direction === 'asc') {
      return dateA - dateB;
    } else {
      return dateB - dateA;
    }
  }
} 