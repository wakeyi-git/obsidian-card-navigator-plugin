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
} 