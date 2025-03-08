import { ICard } from '../card/Card';
import { ISort, SortDirection } from './Sort';

/**
 * 파일명 정렬 클래스
 * 카드를 파일명으로 정렬하는 클래스입니다.
 */
export class FilenameSort implements ISort {
  type: 'filename' = 'filename';
  direction: SortDirection;
  frontmatterKey?: string;
  
  constructor(direction: SortDirection = 'asc') {
    this.direction = direction;
  }
  
  apply(cards: ICard[]): ICard[] {
    return this.sort(cards);
  }
  
  sort(cards: ICard[]): ICard[] {
    return [...cards].sort((a, b) => {
      const titleA = a.title.toLowerCase();
      const titleB = b.title.toLowerCase();
      
      if (this.direction === 'asc') {
        return titleA.localeCompare(titleB);
      } else {
        return titleB.localeCompare(titleA);
      }
    });
  }
  
  toggleDirection(): void {
    this.direction = this.direction === 'asc' ? 'desc' : 'asc';
  }
  
  /**
   * 두 카드 비교
   * 파일명을 기준으로 두 카드를 비교합니다.
   * @param a 첫 번째 카드
   * @param b 두 번째 카드
   * @returns 비교 결과 (-1, 0, 1)
   */
  compare(a: ICard, b: ICard): number {
    const titleA = a.title.toLowerCase();
    const titleB = b.title.toLowerCase();
    
    if (this.direction === 'asc') {
      return titleA.localeCompare(titleB);
    } else {
      return titleB.localeCompare(titleA);
    }
  }
} 