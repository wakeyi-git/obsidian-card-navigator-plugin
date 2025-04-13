import { ICard } from './Card';

/**
 * 카드셋 타입 열거형
 * 
 * @example
 * ```typescript
 * const type = CardSetType.FOLDER; // 폴더 카드셋
 * ```
 */
export enum CardSetType {
  /** 폴더 카드셋 */
  FOLDER = 'folder',
  /** 태그 카드셋 */
  TAG = 'tag',
  /** 링크 카드셋 */
  LINK = 'link'
}

/**
 * 링크 타입 열거형
 */
export enum LinkType {
  /** 백링크 */
  BACKLINK = 'backlink',
  /** 아웃고잉링크 */
  OUTGOING = 'outgoing'
}

/**
 * 카드셋 기준 인터페이스
 * 
 * @example
 * ```typescript
 * // 폴더 카드셋
 * const criteria: ICardSetCriteria = {
 *   type: CardSetType.FOLDER,
 *   folderPath: '/프로젝트'
 * };
 * 
 * // 태그 카드셋
 * const criteria: ICardSetCriteria = {
 *   type: CardSetType.TAG,
 *   tag: '#프로젝트'
 * };
 * 
 * // 링크 카드셋
 * const criteria: ICardSetCriteria = {
 *   type: CardSetType.LINK,
 *   filePath: '/notes/note1.md',
 *   linkType: 'backlink' // 'backlink' | 'outgoing'
 * };
 * ```
 */
export interface ICardSetCriteria {
  /** 카드셋 타입 */
  type: CardSetType;
  /** 폴더 모드 (active: 활성 폴더, specified: 지정 폴더) */
  folderMode?: 'active' | 'specified';
  /** 폴더 경로 */
  folderPath?: string;
  /** 태그 모드 (active: 활성 태그, specified: 지정 태그) */
  tagMode?: 'active' | 'specified';
  /** 태그 */
  tag?: string;
  /** 파일 경로 */
  filePath?: string;
  /** 링크 타입 */
  linkType?: LinkType;
}

/**
 * 날짜 범위 인터페이스
 * 
 * @example
 * ```typescript
 * const range: IDateRange = {
 *   start: new Date('2024-01-01'),
 *   end: new Date('2024-12-31')
 * };
 * ```
 */
export interface IDateRange {
  /** 시작일 */
  readonly start: Date;
  /** 종료일 */
  readonly end: Date;
}

/**
 * 카드셋 필터 설정 인터페이스
 * 
 * @example
 * ```typescript
 * const filter: ICardSetFilter = {
 *   includeSubfolders: true,
 *   includeSubtags: true,
 *   linkDepth: 1,
 *   createdDateRange: {
 *     start: new Date('2024-01-01'),
 *     end: new Date('2024-12-31')
 *   },
 *   modifiedDateRange: {
 *     start: new Date('2024-01-01'),
 *     end: new Date('2024-12-31')
 *   }
 * };
 * ```
 */
export interface ICardSetFilter {
  /** 하위 폴더 포함 여부 (폴더 카드셋) */
  readonly includeSubfolders?: boolean;
  /** 하위 태그 포함 여부 (태그 카드셋) */
  readonly includeSubtags?: boolean;
  /** 태그 대소문자 구분 여부 (태그 카드셋) */
  readonly tagCaseSensitive?: boolean;
  /** 링크 깊이 (링크 카드셋) */
  readonly linkDepth?: number;
  /** 생성일 범위 */
  readonly createdDateRange?: IDateRange;
  /** 수정일 범위 */
  readonly modifiedDateRange?: IDateRange;
}

/**
 * 카드셋 설정 인터페이스
 * 
 * @example
 * ```typescript
 * const config: ICardSetConfig = {
 *   criteria: {
 *     type: CardSetType.FOLDER,
 *     folderPath: '/프로젝트'
 *   },
 *   filter: {
 *     includeSubfolders: true,
 *     includeSubtags: false,
 *     linkDepth: 1,
 *     priorityTags: ['중요'],
 *     priorityFolders: ['/프로젝트'],
 *     createdDateRange: {
 *       start: new Date('2024-01-01'),
 *       end: new Date('2024-12-31')
 *     }
 *   },
 *   sortConfig: DEFAULT_SORT_CONFIG,
 *   searchConfig: DEFAULT_SEARCH_CONFIG
 * };
 * ```
 */
export interface ICardSetConfig {
  /** 카드셋 기준 */
  readonly criteria: ICardSetCriteria;
  /** 카드셋 필터 */
  readonly filter: ICardSetFilter;
}

/**
 * 카드셋 인터페이스
 * 
 * @example
 * ```typescript
 * const cardSet: ICardSet = {
 *   id: 'card-set-1',
 *   config: {
 *     criteria: {
 *       type: CardSetType.FOLDER,
 *       folderPath: '/프로젝트'
 *     },
 *     filter: {
 *       includeSubfolders: true,
 *       includeSubtags: false,
 *       linkDepth: 1
 *     },
 *     sortConfig: DEFAULT_SORT_CONFIG,
 *     searchConfig: DEFAULT_SEARCH_CONFIG
 *   },
 *   cards: [],
 *   cardCount: 0
 * };
 * ```
 */
export interface ICardSet {
  /** 카드셋 ID */
  readonly id: string;
  /** 카드셋 타입 */
  readonly type: CardSetType;
  /** 카드셋 기준 */
  readonly criteria: ICardSetCriteria;
  /** 카드셋 설정 */
  readonly config: ICardSetConfig;
  /** 카드 목록 */
  readonly cards: readonly ICard[];
  /** 카드 수 */
  readonly cardCount: number;
  /** 활성 여부 */
  readonly isActive: boolean;
  /** 마지막 업데이트 시간 */
  readonly lastUpdated: Date;
}

/**
 * 기본 카드셋 필터
 */
export const DEFAULT_CARD_SET_FILTER: ICardSetFilter = {
  includeSubfolders: false,
  includeSubtags: false,
  tagCaseSensitive: false,
  linkDepth: 1
};

/**
 * 기본 카드셋 기준
 */
export const DEFAULT_CARD_SET_CRITERIA: ICardSetCriteria = {
  type: CardSetType.FOLDER,
  folderPath: '/'
};

/**
 * 기본 카드셋 설정
 */
export const DEFAULT_CARD_SET_CONFIG: ICardSetConfig = {
  criteria: DEFAULT_CARD_SET_CRITERIA,
  filter: DEFAULT_CARD_SET_FILTER
};

/**
 * 기본 카드셋
 */
export const DEFAULT_CARD_SET: ICardSet = {
  id: 'default-card-set',
  config: DEFAULT_CARD_SET_CONFIG,
  cards: [],
  cardCount: 0,
  isActive: true,
  lastUpdated: new Date(),
  type: CardSetType.FOLDER,
  criteria: DEFAULT_CARD_SET_CRITERIA
};

/**
 * 카드셋 클래스
 */
export class CardSet implements ICardSet {
  readonly id: string;
  readonly config: ICardSetConfig;
  readonly cards: readonly ICard[];
  readonly cardCount: number;
  readonly isActive: boolean;
  readonly lastUpdated: Date;
  readonly type: CardSetType;
  readonly criteria: ICardSetCriteria;

  constructor(type: CardSetType, config: ICardSetConfig) {
    this.id = `card-set-${Date.now()}`;
    this.config = config;
    this.cards = [];
    this.cardCount = 0;
    this.isActive = true;
    this.lastUpdated = new Date();
    this.type = type;
    this.criteria = config.criteria;
  }
}