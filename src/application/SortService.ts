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
  
  /**
   * 우선 순위 태그 설정
   * @param tags 우선 순위 태그 목록
   */
  setPriorityTags(tags: string[]): void;
  
  /**
   * 우선 순위 태그 가져오기
   * @returns 우선 순위 태그 목록
   */
  getPriorityTags(): string[];
  
  /**
   * 우선 순위 폴더 설정
   * @param folders 우선 순위 폴더 목록
   */
  setPriorityFolders(folders: string[]): void;
  
  /**
   * 우선 순위 폴더 가져오기
   * @returns 우선 순위 폴더 목록
   */
  getPriorityFolders(): string[];
}

/**
 * 정렬 서비스 구현 클래스
 * 정렬 관리를 위한 클래스입니다.
 */
export class SortService implements ISortService {
  private currentSort: ISort | null = null;
  private priorityTags: string[] = [];
  private priorityFolders: string[] = [];
  
  /**
   * 생성자
   * @param settings 설정 객체 (선택 사항)
   */
  constructor(settings?: any) {
    if (settings) {
      this.priorityTags = settings.priorityTags || [];
      this.priorityFolders = settings.priorityFolders || [];
      
      // 기본 정렬 설정
      if (settings.sortBy) {
        this.setSortType(
          settings.sortBy as SortType, 
          settings.sortOrder as SortDirection, 
          settings.customSortKey
        );
      }
    }
  }
  
  /**
   * 우선 순위 태그 설정
   * @param tags 우선 순위 태그 목록
   */
  setPriorityTags(tags: string[]): void {
    this.priorityTags = tags;
    console.log(`[SortService] 우선 순위 태그 설정: ${tags.join(', ')}`);
  }
  
  /**
   * 우선 순위 태그 가져오기
   * @returns 우선 순위 태그 목록
   */
  getPriorityTags(): string[] {
    return this.priorityTags;
  }
  
  /**
   * 우선 순위 폴더 설정
   * @param folders 우선 순위 폴더 목록
   */
  setPriorityFolders(folders: string[]): void {
    this.priorityFolders = folders;
    console.log(`[SortService] 우선 순위 폴더 설정: ${folders.join(', ')}`);
  }
  
  /**
   * 우선 순위 폴더 가져오기
   * @returns 우선 순위 폴더 목록
   */
  getPriorityFolders(): string[] {
    return this.priorityFolders;
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
  
  /**
   * 현재 정렬 가져오기
   * @returns 현재 정렬
   */
  getCurrentSort(): ISort | null {
    return this.currentSort;
  }
  
  /**
   * 정렬 설정
   * @param sort 설정할 정렬
   */
  setSort(sort: ISort): void {
    this.currentSort = sort;
  }
  
  /**
   * 정렬 타입 설정
   * @param type 정렬 타입
   * @param direction 정렬 방향 (선택 사항)
   * @param frontmatterKey 프론트매터 키 (frontmatter 타입인 경우)
   */
  setSortType(type: SortType, direction?: SortDirection, frontmatterKey?: string): void {
    // 현재 정렬 방향 가져오기 (없으면 기본값 'asc')
    const currentDirection = this.currentSort?.direction || 'asc';
    
    // 새 정렬 방향 (지정된 방향 또는 현재 방향)
    const newDirection = direction || currentDirection;
    
    // 정렬 타입에 따라 적절한 정렬 객체 생성
    switch (type) {
      case 'filename':
        this.currentSort = new FilenameSort(newDirection);
        break;
      case 'created':
        this.currentSort = new DateSort(newDirection, 'created');
        break;
      case 'modified':
        this.currentSort = new DateSort(newDirection, 'modified');
        break;
      case 'frontmatter':
        if (!frontmatterKey) {
          console.warn('프론트매터 정렬에는 frontmatterKey가 필요합니다.');
          return;
        }
        this.currentSort = new FrontmatterSort(newDirection, frontmatterKey);
        break;
      default:
        console.warn(`지원되지 않는 정렬 타입: ${type}`);
        break;
    }
  }
  
  /**
   * 정렬 방향 전환
   * 현재 정렬 방향을 반대로 전환합니다.
   */
  toggleSortDirection(): void {
    if (this.currentSort) {
      this.currentSort.toggleDirection();
    }
  }
  
  applySort(cards: ICard[]): ICard[] {
    if (!this.currentSort) {
      return [...cards];
    }
    
    // 우선 순위 태그와 폴더를 고려하여 정렬
    if (this.priorityTags.length > 0 || this.priorityFolders.length > 0) {
      // 카드 복사본 생성
      const sortedCards = [...cards];
      
      // 우선 순위 점수 계산 함수
      const getPriorityScore = (card: ICard): number => {
        let score = 0;
        
        // 우선 순위 태그 점수 계산
        if (this.priorityTags.length > 0 && card.tags) {
          for (const tag of card.tags) {
            const tagIndex = this.priorityTags.indexOf(tag);
            if (tagIndex !== -1) {
              // 인덱스가 작을수록 높은 점수 부여 (우선 순위가 높음)
              score += this.priorityTags.length - tagIndex;
            }
          }
        }
        
        // 우선 순위 폴더 점수 계산
        if (this.priorityFolders.length > 0 && card.path) {
          for (const folder of this.priorityFolders) {
            if (card.path.startsWith(folder)) {
              const folderIndex = this.priorityFolders.indexOf(folder);
              // 인덱스가 작을수록 높은 점수 부여 (우선 순위가 높음)
              score += this.priorityFolders.length - folderIndex;
              break; // 가장 우선 순위가 높은 폴더만 고려
            }
          }
        }
        
        return score;
      };
      
      // 우선 순위 점수에 따라 정렬
      sortedCards.sort((a, b) => {
        const scoreA = getPriorityScore(a);
        const scoreB = getPriorityScore(b);
        
        // 우선 순위 점수가 다르면 점수에 따라 정렬
        if (scoreA !== scoreB) {
          return scoreB - scoreA; // 높은 점수가 먼저 오도록
        }
        
        // 우선 순위 점수가 같으면 기본 정렬 적용
        return this.currentSort!.compare(a, b);
      });
      
      return sortedCards;
    }
    
    // 우선 순위가 없으면 기본 정렬 적용
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