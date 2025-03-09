import { ICard } from '../domain/card/index';
import { ICardList, ISort, SortType, SortDirection, IPrioritySettings } from '../domain/cardlist/index';
import { ICardSet } from '../domain/cardset/index';

/**
 * 카드 리스트 서비스 인터페이스
 * 카드 리스트 관련 기능을 제공합니다.
 */
export interface ICardListService {
  /**
   * 카드셋으로부터 카드 리스트 생성
   * @param cardSet 카드셋
   * @param cards 카드 목록
   * @param sort 정렬 (선택 사항)
   * @param prioritySettings 우선 순위 설정 (선택 사항)
   * @returns 카드 리스트
   */
  createCardList(cardSet: ICardSet, cards: ICard[], sort?: ISort, prioritySettings?: IPrioritySettings): ICardList;
  
  /**
   * 정렬 생성
   * @param type 정렬 타입
   * @param direction 정렬 방향
   * @param frontmatterKey 프론트매터 키 (frontmatter 타입인 경우)
   * @returns 정렬 객체
   */
  createSort(type: SortType, direction: SortDirection, frontmatterKey?: string): ISort;
  
  /**
   * 우선 순위 설정 생성
   * @param priorityTags 우선 순위 태그 목록
   * @param priorityFolders 우선 순위 폴더 목록
   * @param applyPriorities 우선 순위 적용 여부
   * @returns 우선 순위 설정
   */
  createPrioritySettings(priorityTags: string[], priorityFolders: string[], applyPriorities: boolean): IPrioritySettings;
}

/**
 * 카드 리스트 클래스
 * ICardList 인터페이스를 구현합니다.
 */
class CardList implements ICardList {
  private cards: ICard[];
  private sourceCardSet: ICardSet;
  private currentSort?: ISort;
  private currentPrioritySettings?: IPrioritySettings;
  
  constructor(cardSet: ICardSet, cards: ICard[], sort?: ISort, prioritySettings?: IPrioritySettings) {
    this.sourceCardSet = cardSet;
    this.cards = [...cards]; // 원본 배열 복사
    
    // 정렬 적용
    if (sort) {
      this.applySort(sort);
    }
    
    // 우선 순위 적용
    if (prioritySettings) {
      this.applyPrioritySettings(prioritySettings);
    }
  }
  
  /**
   * 카드 목록 가져오기
   * @returns 카드 목록
   */
  getCards(): ICard[] {
    return [...this.cards]; // 복사본 반환
  }
  
  /**
   * 특정 위치의 카드 가져오기
   * @param index 인덱스
   * @returns 카드 또는 undefined
   */
  getCardAt(index: number): ICard | undefined {
    if (index < 0 || index >= this.cards.length) {
      return undefined;
    }
    return this.cards[index];
  }
  
  /**
   * 카드 목록 크기 가져오기
   * @returns 카드 목록 크기
   */
  getSize(): number {
    return this.cards.length;
  }
  
  /**
   * 정렬 적용하기
   * @param sort 정렬 객체
   * @returns 정렬된 카드 리스트
   */
  applySort(sort: ISort): ICardList {
    this.currentSort = sort;
    this.cards = sort.apply(this.cards);
    return this;
  }
  
  /**
   * 우선 순위 설정 적용하기
   * @param prioritySettings 우선 순위 설정
   * @returns 우선 순위가 적용된 카드 리스트
   */
  applyPrioritySettings(prioritySettings: IPrioritySettings): ICardList {
    this.currentPrioritySettings = prioritySettings;
    
    if (prioritySettings.applyPriorities && this.currentSort) {
      // 현재 정렬에 우선 순위 설정 적용
      this.currentSort.prioritySettings = prioritySettings;
      this.cards = this.currentSort.applyPriorities(this.cards);
    }
    
    return this;
  }
  
  /**
   * 페이지네이션 적용하기
   * @param page 페이지 번호
   * @param pageSize 페이지 크기
   * @returns 페이지네이션이 적용된 카드 리스트
   */
  applyPagination(page: number, pageSize: number): ICardList {
    const startIndex = page * pageSize;
    const endIndex = startIndex + pageSize;
    
    // 페이지네이션 적용된 새 카드 리스트 생성
    const paginatedCardList = new CardList(this.sourceCardSet, this.cards.slice(startIndex, endIndex));
    
    // 현재 정렬 및 우선 순위 설정 복사
    paginatedCardList.currentSort = this.currentSort;
    paginatedCardList.currentPrioritySettings = this.currentPrioritySettings;
    
    return paginatedCardList;
  }
  
  /**
   * 현재 적용된 정렬 가져오기
   * @returns 현재 정렬 또는 undefined
   */
  getCurrentSort(): ISort | undefined {
    return this.currentSort;
  }
  
  /**
   * 원본 카드셋 가져오기
   * @returns 원본 카드셋
   */
  getSourceCardSet(): ICardSet {
    return this.sourceCardSet;
  }
}

/**
 * 정렬 클래스
 * ISort 인터페이스를 구현합니다.
 */
class Sort implements ISort {
  type: SortType;
  direction: SortDirection;
  frontmatterKey?: string;
  prioritySettings?: IPrioritySettings;
  
  constructor(type: SortType, direction: SortDirection, frontmatterKey?: string, prioritySettings?: IPrioritySettings) {
    this.type = type;
    this.direction = direction;
    this.frontmatterKey = frontmatterKey;
    this.prioritySettings = prioritySettings;
  }
  
  /**
   * 정렬 적용
   * @param cards 카드 목록
   * @returns 정렬된 카드 목록
   */
  apply(cards: ICard[]): ICard[] {
    // 카드 복사
    const sortedCards = [...cards];
    
    // 정렬
    sortedCards.sort((a, b) => this.compare(a, b));
    
    // 우선 순위 적용
    if (this.prioritySettings && this.prioritySettings.applyPriorities) {
      return this.applyPriorities(sortedCards);
    }
    
    return sortedCards;
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
   * @returns 비교 결과 (-1, 0, 1)
   */
  compare(a: ICard, b: ICard): number {
    let result = 0;
    
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
          
          // 값이 없는 경우 처리
          if (valueA === undefined && valueB === undefined) {
            result = 0;
          } else if (valueA === undefined) {
            result = -1;
          } else if (valueB === undefined) {
            result = 1;
          } else {
            // 값 타입에 따른 비교
            if (typeof valueA === 'number' && typeof valueB === 'number') {
              result = valueA - valueB;
            } else if (typeof valueA === 'string' && typeof valueB === 'string') {
              result = valueA.localeCompare(valueB);
            } else if (valueA instanceof Date && valueB instanceof Date) {
              result = valueA.getTime() - valueB.getTime();
            } else {
              // 그 외의 경우 문자열로 변환하여 비교
              result = String(valueA).localeCompare(String(valueB));
            }
          }
        }
        break;
        
      case 'tag':
        // 첫 번째 태그로 비교
        const tagA = a.tags.length > 0 ? a.tags[0] : '';
        const tagB = b.tags.length > 0 ? b.tags[0] : '';
        result = tagA.localeCompare(tagB);
        break;
        
      case 'folder':
        // 파일 경로에서 폴더 추출
        const pathA = a.getPath();
        const pathB = b.getPath();
        const folderA = pathA.substring(0, pathA.lastIndexOf('/'));
        const folderB = pathB.substring(0, pathB.lastIndexOf('/'));
        result = folderA.localeCompare(folderB);
        break;
        
      default:
        result = 0;
    }
    
    // 정렬 방향 적용
    return this.direction === 'asc' ? result : -result;
  }
  
  /**
   * 우선 순위 설정 적용
   * @param cards 카드 목록
   * @returns 우선 순위가 적용된 카드 목록
   */
  applyPriorities(cards: ICard[]): ICard[] {
    if (!this.prioritySettings || !this.prioritySettings.applyPriorities) {
      return cards;
    }
    
    const { priorityTags, priorityFolders } = this.prioritySettings;
    
    // 우선 순위가 없는 경우 원본 반환
    if (priorityTags.length === 0 && priorityFolders.length === 0) {
      return cards;
    }
    
    // 우선 순위 카드와 일반 카드 분리
    const priorityCards: ICard[] = [];
    const normalCards: ICard[] = [];
    
    for (const card of cards) {
      let isPriority = false;
      
      // 우선 순위 태그 확인
      if (priorityTags.length > 0) {
        for (const tag of card.tags) {
          if (priorityTags.includes(tag)) {
            isPriority = true;
            break;
          }
        }
      }
      
      // 우선 순위 폴더 확인
      if (!isPriority && priorityFolders.length > 0) {
        const path = card.getPath();
        const folder = path.substring(0, path.lastIndexOf('/'));
        
        for (const priorityFolder of priorityFolders) {
          if (folder === priorityFolder || folder.startsWith(priorityFolder + '/')) {
            isPriority = true;
            break;
          }
        }
      }
      
      // 우선 순위에 따라 분류
      if (isPriority) {
        priorityCards.push(card);
      } else {
        normalCards.push(card);
      }
    }
    
    // 각 그룹 내에서 정렬
    priorityCards.sort((a, b) => this.compare(a, b));
    
    // 우선 순위 카드를 앞에 배치
    return [...priorityCards, ...normalCards];
  }
}

/**
 * 우선 순위 설정 클래스
 * IPrioritySettings 인터페이스를 구현합니다.
 */
class PrioritySettings implements IPrioritySettings {
  priorityTags: string[];
  priorityFolders: string[];
  applyPriorities: boolean;
  
  constructor(priorityTags: string[], priorityFolders: string[], applyPriorities: boolean) {
    this.priorityTags = priorityTags;
    this.priorityFolders = priorityFolders;
    this.applyPriorities = applyPriorities;
  }
}

/**
 * 카드 리스트 서비스 클래스
 * 카드 리스트 관련 기능을 제공합니다.
 */
export class CardListService implements ICardListService {
  /**
   * 카드셋으로부터 카드 리스트 생성
   * @param cardSet 카드셋
   * @param cards 카드 목록
   * @param sort 정렬 (선택 사항)
   * @param prioritySettings 우선 순위 설정 (선택 사항)
   * @returns 카드 리스트
   */
  createCardList(cardSet: ICardSet, cards: ICard[], sort?: ISort, prioritySettings?: IPrioritySettings): ICardList {
    return new CardList(cardSet, cards, sort, prioritySettings);
  }
  
  /**
   * 정렬 생성
   * @param type 정렬 타입
   * @param direction 정렬 방향
   * @param frontmatterKey 프론트매터 키 (frontmatter 타입인 경우)
   * @returns 정렬 객체
   */
  createSort(type: SortType, direction: SortDirection, frontmatterKey?: string): ISort {
    return new Sort(type, direction, frontmatterKey);
  }
  
  /**
   * 우선 순위 설정 생성
   * @param priorityTags 우선 순위 태그 목록
   * @param priorityFolders 우선 순위 폴더 목록
   * @param applyPriorities 우선 순위 적용 여부
   * @returns 우선 순위 설정
   */
  createPrioritySettings(priorityTags: string[], priorityFolders: string[], applyPriorities: boolean): IPrioritySettings {
    return new PrioritySettings(priorityTags, priorityFolders, applyPriorities);
  }
} 