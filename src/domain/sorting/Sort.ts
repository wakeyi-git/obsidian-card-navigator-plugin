import { ICard } from '../card/Card';
import { ISort, SortType, SortDirection, IPrioritySettings } from './SortingInterfaces';

/**
 * 정렬 클래스
 * 카드를 정렬하기 위한 클래스입니다.
 */
export class Sort implements ISort {
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
   * 우선 순위 설정
   */
  prioritySettings?: IPrioritySettings;
  
  /**
   * 생성자
   * @param type 정렬 타입
   * @param direction 정렬 방향
   * @param frontmatterKey 프론트매터 키 (frontmatter 타입인 경우)
   * @param prioritySettings 우선 순위 설정
   */
  constructor(
    type: SortType, 
    direction: SortDirection, 
    frontmatterKey?: string, 
    prioritySettings?: IPrioritySettings
  ) {
    this.type = type;
    this.direction = direction;
    this.frontmatterKey = frontmatterKey;
    this.prioritySettings = prioritySettings;
  }
  
  /**
   * 정렬 적용
   * 주어진 카드 목록에 정렬을 적용합니다.
   * @param cards 카드 목록
   * @returns 정렬된 카드 목록
   */
  apply(cards: ICard[]): ICard[] {
    // 우선 순위 설정이 있고 적용 가능한 경우 우선 순위 적용
    if (this.prioritySettings && this.prioritySettings.applyPriorities) {
      return this.applyPriorities(cards);
    }
    
    // 정렬 적용
    return [...cards].sort((a, b) => this.compare(a, b));
  }
  
  /**
   * 정렬 방향 전환
   * 현재 정렬 방향을 반대로 전환합니다.
   */
  toggleDirection(): void {
    this.direction = this.direction === 'asc' ? 'desc' : 'asc';
  }
  
  /**
   * 두 카드 비교
   * 정렬 기준에 따라 두 카드를 비교합니다.
   * @param a 첫 번째 카드
   * @param b 두 번째 카드
   * @returns 비교 결과 (-1, 0, 1)
   */
  compare(a: ICard, b: ICard): number {
    let result = 0;
    
    // 정렬 타입에 따라 비교
    switch (this.type) {
      case 'filename':
        result = a.title.localeCompare(b.title);
        break;
      case 'created':
        result = a.getCreatedTime() - b.getCreatedTime();
        break;
      case 'modified':
        result = a.getModifiedTime() - b.getModifiedTime();
        break;
      case 'frontmatter':
        if (this.frontmatterKey) {
          const valueA = a.frontmatter?.[this.frontmatterKey];
          const valueB = b.frontmatter?.[this.frontmatterKey];
          
          if (valueA === undefined && valueB === undefined) {
            result = 0;
          } else if (valueA === undefined) {
            result = 1;
          } else if (valueB === undefined) {
            result = -1;
          } else if (typeof valueA === 'number' && typeof valueB === 'number') {
            result = valueA - valueB;
          } else {
            result = String(valueA).localeCompare(String(valueB));
          }
        }
        break;
      case 'tag':
        // 태그 기준 정렬 (첫 번째 태그 기준)
        const tagA = a.tags.length > 0 ? a.tags[0] : '';
        const tagB = b.tags.length > 0 ? b.tags[0] : '';
        result = tagA.localeCompare(tagB);
        break;
      case 'folder':
        // 폴더 기준 정렬
        result = a.getPath().localeCompare(b.getPath());
        break;
      default:
        result = 0;
    }
    
    // 정렬 방향에 따라 결과 조정
    return this.direction === 'asc' ? result : -result;
  }
  
  /**
   * 우선 순위 설정 적용
   * 우선 순위 태그와 폴더를 기준으로 카드를 정렬합니다.
   * @param cards 카드 목록
   * @returns 우선 순위가 적용된 카드 목록
   */
  applyPriorities(cards: ICard[]): ICard[] {
    if (!this.prioritySettings) {
      return this.apply(cards);
    }
    
    const { priorityTags, priorityFolders } = this.prioritySettings;
    
    // 우선 순위 태그 또는 폴더가 없는 경우 일반 정렬 적용
    if (priorityTags.length === 0 && priorityFolders.length === 0) {
      return this.apply(cards);
    }
    
    // 우선 순위 태그를 포함하는 카드와 그렇지 않은 카드로 분리
    const priorityTagCards: ICard[] = [];
    const priorityFolderCards: ICard[] = [];
    const otherCards: ICard[] = [];
    
    for (const card of cards) {
      // 우선 순위 태그 확인
      const hasTagPriority = priorityTags.length > 0 && 
        card.tags.some(tag => priorityTags.includes(tag));
      
      // 우선 순위 폴더 확인
      const hasFolderPriority = priorityFolders.length > 0 && 
        priorityFolders.some(folder => card.getPath().startsWith(folder));
      
      if (hasTagPriority) {
        priorityTagCards.push(card);
      } else if (hasFolderPriority) {
        priorityFolderCards.push(card);
      } else {
        otherCards.push(card);
      }
    }
    
    // 각 그룹 내에서 정렬 적용
    const sortedPriorityTagCards = [...priorityTagCards].sort((a, b) => this.compare(a, b));
    const sortedPriorityFolderCards = [...priorityFolderCards].sort((a, b) => this.compare(a, b));
    const sortedOtherCards = [...otherCards].sort((a, b) => this.compare(a, b));
    
    // 우선 순위 태그 카드, 우선 순위 폴더 카드, 기타 카드 순으로 결합
    return [...sortedPriorityTagCards, ...sortedPriorityFolderCards, ...sortedOtherCards];
  }
} 