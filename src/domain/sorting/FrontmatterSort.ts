import { ICard } from '../card/Card';
import { ISort, SortDirection } from './Sort';

/**
 * 프론트매터 정렬 클래스
 * 카드를 프론트매터 값으로 정렬하는 클래스입니다.
 */
export class FrontmatterSort implements ISort {
  type: 'frontmatter' = 'frontmatter';
  direction: SortDirection;
  frontmatterKey: string;
  
  constructor(key: string, direction: SortDirection = 'asc') {
    this.frontmatterKey = key;
    this.direction = direction;
  }
  
  apply(cards: ICard[]): ICard[] {
    return this.sort(cards);
  }
  
  sort(cards: ICard[]): ICard[] {
    return [...cards].sort((a, b) => {
      const frontmatterA = a.frontmatter || {};
      const frontmatterB = b.frontmatter || {};
      
      const valueA = frontmatterA[this.frontmatterKey];
      const valueB = frontmatterB[this.frontmatterKey];
      
      // 값이 없는 경우 처리
      if (valueA === undefined && valueB === undefined) return 0;
      if (valueA === undefined) return this.direction === 'asc' ? 1 : -1;
      if (valueB === undefined) return this.direction === 'asc' ? -1 : 1;
      
      // 값 비교
      if (typeof valueA === 'number' && typeof valueB === 'number') {
        return this.direction === 'asc' ? valueA - valueB : valueB - valueA;
      }
      
      // 문자열로 변환하여 비교
      const strA = String(valueA).toLowerCase();
      const strB = String(valueB).toLowerCase();
      
      return this.direction === 'asc' 
        ? strA.localeCompare(strB) 
        : strB.localeCompare(strA);
    });
  }
  
  toggleDirection(): void {
    this.direction = this.direction === 'asc' ? 'desc' : 'asc';
  }
} 