import { ICard } from '../domain/card/Card';
import { ISort, SortType, SortDirection } from '../domain/sorting/Sort';
import { FilenameSort } from '../domain/sorting/FilenameSort';
import { DateSort } from '../domain/sorting/DateSort';
import { FrontmatterSort } from '../domain/sorting/FrontmatterSort';

/**
 * 정렬 서비스 인터페이스
 * 정렬 관리를 위한 인터페이스입니다.
 */
export interface ISortService {
  /**
   * 현재 정렬 가져오기
   * @returns 현재 정렬
   */
  getCurrentSort(): ISort | null;
  
  /**
   * 정렬 설정
   * @param sort 설정할 정렬
   */
  setSort(sort: ISort): void;
  
  /**
   * 정렬 타입 설정
   * @param type 정렬 타입
   * @param direction 정렬 방향 (선택 사항)
   * @param frontmatterKey 프론트매터 키 (frontmatter 타입인 경우)
   */
  setSortType(type: SortType, direction?: SortDirection, frontmatterKey?: string): void;
  
  /**
   * 정렬 방향 전환
   * 현재 정렬 방향을 반대로 전환합니다.
   */
  toggleSortDirection(): void;
  
  /**
   * 정렬 적용
   * @param cards 카드 목록
   * @returns 정렬된 카드 목록
   */
  applySort(cards: ICard[]): ICard[];
  
  /**
   * 정렬 초기화
   */
  clearSort(): void;
  
  /**
   * 서비스 초기화
   */
  initialize(): void;
  
  /**
   * 설정 초기화
   */
  reset(): void;
}

/**
 * 정렬 서비스 클래스
 * 정렬 관리를 위한 클래스입니다.
 */
export class SortService implements ISortService {
  private currentSort: ISort | null = null;
  
  constructor(initialSort?: ISort) {
    this.currentSort = initialSort || null;
  }
  
  initialize(): void {
    // 기본 정렬 설정
    if (!this.currentSort) {
      this.setSortType('filename', 'asc');
    }
  }
  
  reset(): void {
    this.clearSort();
    this.initialize();
  }
  
  getCurrentSort(): ISort | null {
    return this.currentSort;
  }
  
  setSort(sort: ISort): void {
    this.currentSort = sort;
  }
  
  setSortType(type: SortType, direction: SortDirection = 'asc', frontmatterKey?: string): void {
    switch (type) {
      case 'filename':
        this.currentSort = new FilenameSort(direction);
        break;
      case 'created':
        this.currentSort = new DateSort('created', direction);
        break;
      case 'modified':
        this.currentSort = new DateSort('modified', direction);
        break;
      case 'frontmatter':
        this.currentSort = new FrontmatterSort(frontmatterKey || '', direction);
        break;
      default:
        this.currentSort = new FilenameSort(direction);
    }
  }
  
  toggleSortDirection(): void {
    if (this.currentSort) {
      this.currentSort.toggleDirection();
    }
  }
  
  applySort(cards: ICard[]): ICard[] {
    if (!this.currentSort) {
      return [...cards];
    }
    
    return this.currentSort.apply(cards);
  }
  
  clearSort(): void {
    this.currentSort = null;
  }
  
  /**
   * 정렬 타입 변경
   * @param type 변경할 정렬 타입
   * @param direction 정렬 방향
   * @param frontmatterKey 프론트매터 키 (frontmatter 타입인 경우)
   */
  changeSortType(type: SortType, direction?: SortDirection, frontmatterKey?: string): void {
    if (!this.currentSort || this.currentSort.type !== type) {
      // 새로운 정렬 객체 생성
      this.setSortType(type, direction || 'asc', frontmatterKey);
    } else if (direction && this.currentSort.direction !== direction) {
      this.currentSort.direction = direction;
    }
    
    // frontmatter 타입인 경우 키 설정
    if (type === 'frontmatter' && this.currentSort && frontmatterKey) {
      this.currentSort.frontmatterKey = frontmatterKey;
    }
  }
} 