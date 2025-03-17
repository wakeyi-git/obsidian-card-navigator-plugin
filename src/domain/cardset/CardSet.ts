import { Card } from '../card/Card';
import { ILayout } from '../layout/Layout';


/**
 * 카드셋 소스 모드
 * 카드셋의 소스 유형을 정의합니다.
 */
export enum CardSetSourceMode {
  /**
   * 단일 파일 모드
   * 하나의 파일만을 카드셋으로 사용합니다.
   */
  FILE = 'file',

  /**
   * 폴더 모드
   * 특정 폴더 내의 모든 파일을 카드셋으로 사용합니다.
   */
  FOLDER = 'folder',

  /**
   * 태그 모드
   * 특정 태그가 지정된 모든 파일을 카드셋으로 사용합니다.
   */
  TAG = 'tag',

  /**
   * 검색 모드
   * 검색 결과에 해당하는 파일들을 카드셋으로 사용합니다.
   */
  SEARCH = 'search',

  /**
   * 즐겨찾기 모드
   * 즐겨찾기된 파일들을 카드셋으로 사용합니다.
   */
  STARRED = 'starred'
}

/**
 * 카드셋 타입 정의
 * 활성: 현재 열려 있는 노트에 따라 자동으로 변경됨
 * 지정: 사용자가 지정한 값으로 고정됨
 */
export type CardSetType = 'active' | 'fixed';

/**
 * 정렬 타입 정의
 */
export type SortType = 'filename' | 'created' | 'modified' | 'frontmatter' | 'tag' | 'folder';

/**
 * 정렬 방향 정의
 */
export type SortDirection = 'asc' | 'desc';

/**
 * 우선 순위 설정 인터페이스
 * 카드 정렬 시 특정 태그나 폴더를 우선시하기 위한 인터페이스입니다.
 */
export interface IPrioritySettings {
  /**
   * 우선 순위 태그 목록
   * 이 태그들을 포함하는 카드가 목록의 상단에 먼저 표시됩니다.
   */
  priorityTags: string[];
  
  /**
   * 우선 순위 폴더 목록
   * 이 폴더들에 있는 카드가 목록의 상단에 먼저 표시됩니다.
   */
  priorityFolders: string[];
  
  /**
   * 우선 순위 적용 여부
   * true인 경우 우선 순위 태그와 폴더를 적용합니다.
   */
  applyPriorities: boolean;
}

/**
 * 정렬 설정 인터페이스
 */
export interface ISortSettings {
  /**
   * 정렬 기준
   */
  sortBy: 'title' | 'modified' | 'created' | 'frontmatter' | 'tag' | 'folder';
  
  /**
   * 정렬 순서
   */
  sortOrder: 'asc' | 'desc';

  /**
   * 프론트매터 키 (frontmatter 타입인 경우)
   */
  frontmatterKey?: string;
}

/**
 * 페이지네이션 설정 인터페이스
 * 카드 목록의 페이지네이션을 위한 설정을 정의합니다.
 */
export interface IPaginationSettings {
  /**
   * 현재 페이지 번호 (1부터 시작)
   */
  page: number;
  
  /**
   * 페이지당 항목 수
   */
  pageSize: number;
}

/**
 * 카드셋 필터 설정
 */
export interface ICardSetFilter {
  tags?: string[];
  path?: string;
  created?: { start?: Date; end?: Date };
  modified?: { start?: Date; end?: Date };
  frontmatter?: Record<string, any>;
}

/**
 * 카드 정렬 기준
 */
export interface CardSortCriteria {
  type: 'filename' | 'created' | 'modified' | 'frontmatter' | 'tag' | 'folder';
  direction: 'asc' | 'desc';
  frontmatterKey?: string;
}

/**
 * 카드 필터 기준
 */
export interface CardFilterCriteria {
  tags?: string[];
  path?: string;
  created?: { from?: Date; to?: Date };
  modified?: { from?: Date; to?: Date };
  frontmatter?: Record<string, any>;
}

/**
 * 카드셋 인터페이스
 */
export interface ICardSet {
  /**
   * 카드셋 ID
   */
  id: string;

  /**
   * 카드셋 이름 (UI에 표시될 이름)
   */
  name: string;

  /**
   * 카드셋 소스 모드
   */
  sourceMode: CardSetSourceMode;

  /**
   * 카드셋 소스
   */
  source: string;

  /**
   * 카드셋 타입 (활성, 고정)
   */
  type: CardSetType;

  /**
   * 카드 목록
   */
  cards: Card[];

  /**
   * 정렬 설정
   */
  sortSettings?: ISortSettings;

  /**
   * 필터 설정
   */
  filterSettings?: ICardSetFilter;

  /**
   * 페이지네이션 설정
   */
  paginationSettings?: IPaginationSettings;

  /**
   * 추가 메타데이터 (선택 사항)
   */
  metadata?: Record<string, any>;

  getId(): string;
  getTitle(): string;
  getDescription(): string | undefined;
  getCards(): Card[];
  getLayout(): ILayout;
  getMetadata(): Record<string, any> | undefined;
  getCreated(): number;
  getUpdated(): number;
  setTitle(title: string): void;
  setDescription(description: string): void;
  setLayout(layout: ILayout): void;
  setMetadata(metadata: Record<string, any>): void;
  addCard(card: Card): void;
  removeCard(cardId: string): void;
  clearCards(): void;
  sortCards(criteria: CardSortCriteria): void;
  filterCards(criteria: CardFilterCriteria): void;
  searchCards(query: string): Card[];
}

/**
 * 카드셋 클래스
 */
export class CardSet implements ICardSet {
  private description?: string;
  private layout?: ILayout;
  private created: number = Date.now();
  private updated: number = Date.now();

  constructor(
    public readonly id: string,
    public name: string,
    public readonly sourceMode: CardSetSourceMode,
    public readonly source: string,
    public readonly type: CardSetType,
    public cards: Card[] = [],
    public sortSettings?: ISortSettings,
    public filterSettings?: ICardSetFilter,
    public paginationSettings?: IPaginationSettings,
    public metadata: Record<string, any> = {}
  ) {}

  /**
   * 카드셋 ID 생성
   */
  static createId(sourceMode: CardSetSourceMode, source: string): string {
    return `${sourceMode}:${source}`;
  }

  /**
   * 빈 카드셋 ID 생성
   */
  static createEmptyId(sourceMode: CardSetSourceMode): string {
    return `empty-${sourceMode}`;
  }

  /**
   * 카드셋 ID에서 소스 모드 추출
   */
  static extractSourceMode(cardSetId: string | undefined): CardSetSourceMode | null {
    if (!cardSetId) return null;
    
    if (cardSetId.startsWith('folder:')) {
      return CardSetSourceMode.FOLDER;
    } else if (cardSetId.startsWith('tag:')) {
      return CardSetSourceMode.TAG;
    } else if (cardSetId.startsWith('search:')) {
      return CardSetSourceMode.SEARCH;
    } else if (cardSetId.startsWith('empty-')) {
      const parts = cardSetId.split('-');
      if (parts.length > 1) {
        return parts[1] as CardSetSourceMode;
      }
    }
    return null;
  }

  /**
   * 카드셋 ID에서 소스 추출
   */
  static extractSource(cardSetId: string | undefined): string | null {
    if (!cardSetId) return null;
    
    if (cardSetId.startsWith('folder:') || cardSetId.startsWith('tag:') || cardSetId.startsWith('search:')) {
      const parts = cardSetId.split(':');
      if (parts.length > 1) {
        return parts.slice(1).join(':');
      }
    }
    return null;
  }

  /**
   * 두 카드셋 ID가 동일한지 확인
   */
  static isSameId(id1: string | undefined, id2: string | undefined): boolean {
    if (id1 === undefined && id2 === undefined) return true;
    if (id1 === undefined || id2 === undefined) return false;
    if (id1 === id2) return true;

    const sourceMode1 = CardSet.extractSourceMode(id1);
    const sourceMode2 = CardSet.extractSourceMode(id2);
    if (sourceMode1 !== sourceMode2) return false;

    const source1 = CardSet.extractSource(id1);
    const source2 = CardSet.extractSource(id2);
    return source1 === source2;
  }

  /**
   * 카드 추가
   */
  addCard(card: Card): void {
    this.cards.push(card);
    this.updated = Date.now();
  }

  /**
   * 카드 제거
   */
  removeCard(cardId: string): void {
    const index = this.cards.findIndex(card => card.getId() === cardId);
    if (index !== -1) {
      this.cards.splice(index, 1);
      this.updated = Date.now();
    }
  }

  /**
   * 정렬 설정 적용
   */
  applySorting(settings: ISortSettings): void {
    this.sortSettings = settings;
    this.cards.sort((a, b) => this.compareCards(a, b, settings));
  }

  /**
   * 두 카드 비교
   */
  private compareCards(a: Card, b: Card, settings: ISortSettings): number {
    let result = 0;
    
    // 정렬 타입에 따라 비교
    switch (settings.sortBy) {
      case 'title':
        result = a.getTitle().localeCompare(b.getTitle());
        break;
      case 'created':
        result = a.getCreated() - b.getCreated();
        break;
      case 'modified':
        result = a.getUpdated() - b.getUpdated();
        break;
      case 'frontmatter':
        if (settings.frontmatterKey) {
          const valueA = a.frontmatter?.[settings.frontmatterKey];
          const valueB = b.frontmatter?.[settings.frontmatterKey];
          
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
    return settings.sortOrder === 'asc' ? result : -result;
  }

  /**
   * 우선 순위 설정 적용
   */
  applyPrioritySettings(settings: IPrioritySettings): void {
    if (!settings.applyPriorities || 
        (settings.priorityTags.length === 0 && settings.priorityFolders.length === 0)) {
      return;
    }

    // 우선 순위 태그를 포함하는 카드와 그렇지 않은 카드로 분리
    const priorityTagCards: Card[] = [];
    const priorityFolderCards: Card[] = [];
    const otherCards: Card[] = [];
    
    for (const card of this.cards) {
      // 우선 순위 태그 확인
      const hasTagPriority = settings.priorityTags.length > 0 && 
        card.tags.some(tag => settings.priorityTags.includes(tag));
      
      // 우선 순위 폴더 확인
      const hasFolderPriority = settings.priorityFolders.length > 0 && 
        settings.priorityFolders.some(folder => card.getPath().startsWith(folder));
      
      if (hasTagPriority) {
        priorityTagCards.push(card);
      } else if (hasFolderPriority) {
        priorityFolderCards.push(card);
      } else {
        otherCards.push(card);
      }
    }
    
    // 각 그룹 내에서 정렬 적용 (현재 정렬 설정이 있는 경우)
    if (this.sortSettings) {
      priorityTagCards.sort((a, b) => this.compareCards(a, b, this.sortSettings!));
      priorityFolderCards.sort((a, b) => this.compareCards(a, b, this.sortSettings!));
      otherCards.sort((a, b) => this.compareCards(a, b, this.sortSettings!));
    }
    
    // 우선 순위 태그 카드, 우선 순위 폴더 카드, 기타 카드 순으로 결합
    this.cards = [...priorityTagCards, ...priorityFolderCards, ...otherCards];
  }

  /**
   * 페이지네이션 설정 적용
   */
  applyPagination(settings: IPaginationSettings): Card[] {
    this.paginationSettings = settings;
    const start = (settings.page - 1) * settings.pageSize;
    const end = start + settings.pageSize;
    return this.cards.slice(start, end);
  }

  /**
   * 현재 페이지의 카드 목록 가져오기
   */
  getCurrentPageCards(): Card[] {
    if (!this.paginationSettings) {
      return this.cards;
    }
    return this.applyPagination(this.paginationSettings);
  }

  /**
   * 전체 페이지 수 계산
   */
  getTotalPages(): number {
    if (!this.paginationSettings) {
      return 1;
    }
    return Math.ceil(this.cards.length / this.paginationSettings.pageSize);
  }

  /**
   * 현재 페이지 번호 가져오기
   */
  getCurrentPage(): number {
    return this.paginationSettings?.page ?? 1;
  }

  /**
   * 페이지당 항목 수 가져오기
   */
  getPageSize(): number {
    return this.paginationSettings?.pageSize ?? this.cards.length;
  }

  /**
   * 전체 카드 수 가져오기
   */
  getTotalCards(): number {
    return this.cards.length;
  }

  getId(): string {
    return this.id;
  }

  getTitle(): string {
    return this.name;
  }

  getDescription(): string | undefined {
    return this.description;
  }

  getCards(): Card[] {
    return this.cards;
  }

  getLayout(): ILayout {
    if (!this.layout) {
      throw new Error('Layout is not set');
    }
    return this.layout;
  }

  getMetadata(): Record<string, any> | undefined {
    return this.metadata;
  }

  getCreated(): number {
    return this.created;
  }

  getUpdated(): number {
    return this.updated;
  }

  setTitle(title: string): void {
    this.name = title;
    this.updated = Date.now();
  }

  setDescription(description: string): void {
    this.description = description;
    this.updated = Date.now();
  }

  setLayout(layout: ILayout): void {
    this.layout = layout;
    this.updated = Date.now();
  }

  setMetadata(metadata: Record<string, any>): void {
    this.metadata = metadata;
    this.updated = Date.now();
  }

  clearCards(): void {
    this.cards = [];
    this.updated = Date.now();
  }

  /**
   * 카드 정렬
   * @param criteria 정렬 기준
   */
  sortCards(criteria: CardSortCriteria): void {
    this.cards.sort((a, b) => {
      let result = 0;
      
      switch (criteria.type) {
        case 'filename':
          result = criteria.direction === 'asc' 
            ? a.getTitle().localeCompare(b.getTitle())
            : b.getTitle().localeCompare(a.getTitle());
          break;
        case 'created':
          result = criteria.direction === 'asc'
            ? a.getCreated() - b.getCreated()
            : b.getCreated() - a.getCreated();
          break;
        case 'modified':
          result = criteria.direction === 'asc'
            ? a.getUpdated() - b.getUpdated()
            : b.getUpdated() - a.getUpdated();
          break;
        case 'frontmatter':
          if (criteria.frontmatterKey) {
            const valueA = a.frontmatter?.[criteria.frontmatterKey];
            const valueB = b.frontmatter?.[criteria.frontmatterKey];
            
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
          const tagA = a.tags.length > 0 ? a.tags[0] : '';
          const tagB = b.tags.length > 0 ? b.tags[0] : '';
          result = tagA.localeCompare(tagB);
          break;
        case 'folder':
          result = a.getPath().localeCompare(b.getPath());
          break;
      }
      
      return criteria.direction === 'asc' ? result : -result;
    });

    this.updated = Date.now();
  }

  filterCards(criteria: CardFilterCriteria): void {
    this.cards = this.cards.filter(card => {
      // 태그 필터
      if (criteria.tags && criteria.tags.length > 0) {
        if (!criteria.tags.some(tag => card.tags.includes(tag))) {
          return false;
        }
      }

      // 경로 필터
      if (criteria.path) {
        if (!card.getPath().includes(criteria.path)) {
          return false;
        }
      }

      // 생성일 필터
      if (criteria.created) {
        const createdTime = card.getCreated();
        if (criteria.created.from && createdTime < criteria.created.from.getTime()) {
          return false;
        }
        if (criteria.created.to && createdTime > criteria.created.to.getTime()) {
          return false;
        }
      }

      // 수정일 필터
      if (criteria.modified) {
        const modifiedTime = card.getUpdated();
        if (criteria.modified.from && modifiedTime < criteria.modified.from.getTime()) {
          return false;
        }
        if (criteria.modified.to && modifiedTime > criteria.modified.to.getTime()) {
          return false;
        }
      }

      // 프론트매터 필터
      if (criteria.frontmatter) {
        for (const [key, value] of Object.entries(criteria.frontmatter)) {
          if (card.frontmatter?.[key] !== value) {
            return false;
          }
        }
      }

      return true;
    });

    this.updated = Date.now();
  }

  searchCards(query: string): Card[] {
    const searchQuery = query.toLowerCase();
    return this.cards.filter(card => {
      return (
        card.title.toLowerCase().includes(searchQuery) ||
        card.content.toLowerCase().includes(searchQuery) ||
        card.tags.some(tag => tag.toLowerCase().includes(searchQuery)) ||
        card.getPath().toLowerCase().includes(searchQuery)
      );
    });
  }
}

/**
 * 카드셋 상태 인터페이스
 * 카드셋의 현재 상태를 정의합니다.
 */
export interface ICardSetState {
  /**
   * 현재 선택된 카드셋
   */
  currentCardSet: string | null;
  
  /**
   * 카드셋 고정 여부
   */
  isFixed: boolean;
  
  /**
   * 추가 상태 정보 (선택 사항)
   */
  metadata?: Record<string, any>;
}

/**
 * 카드셋 소스 인터페이스
 * 카드셋 소스의 기본 기능을 정의합니다.
 */
export interface ICardSetSource {
  /**
   * 소스 모드
   */
  type: CardSetSourceMode;
  
  /**
   * 현재 선택된 카드셋
   */
  currentCardSet: string | null;
  
  /**
   * 카드셋 고정 여부 확인
   * @returns 고정 여부
   */
  isCardSetFixed(): boolean;
  
  /**
   * 현재 카드셋 상태 가져오기
   * @returns 카드셋 상태 객체
   */
  getState(): ICardSetState;
}

/**
 * 캐시 아이템 인터페이스
 * 캐시된 데이터 항목을 정의합니다.
 */
export interface ICacheItem<T> {
  /**
   * 캐시된 데이터
   */
  data: T;
  
  /**
   * 캐시 생성 시간 (타임스탬프)
   */
  timestamp: number;
} 