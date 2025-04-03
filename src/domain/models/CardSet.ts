import { ICard } from './Card';
import { ISearchFilter } from './SearchFilter';
import { ISortConfig } from './SortConfig';

/**
 * 카드셋 타입
 */
export enum CardSetType {
  FOLDER = 'folder',
  TAG = 'tag',
  LINK = 'link'
}

/**
 * 링크 타입
 */
export type LinkType = 'backlink' | 'outgoing';

/**
 * 링크 설정
 */
export interface ILinkConfig {
  /** 링크 타입 */
  type: LinkType;
  /** 링크 레벨 (1: 직접 링크, 2: 2단계 링크, ...) */
  level: number;
  /** 백링크 포함 여부 */
  includeBacklinks: boolean;
  /** 아웃고잉 링크 포함 여부 */
  includeOutgoingLinks: boolean;
  /** 포함 패턴 */
  includePatterns?: string[];
  /** 제외 패턴 */
  excludePatterns?: string[];
}

/**
 * 카드셋 설정
 */
export interface ICardSetConfig {
  /** 폴더 경로 */
  folderPath?: string;
  /** 하위 폴더 포함 여부 */
  includeSubfolders?: boolean;
  /** 태그 목록 */
  tags?: string[];
  /** 링크 설정 */
  linkConfig?: ILinkConfig;
  /** 검색 필터 */
  searchFilter?: ISearchFilter;
  /** 정렬 설정 */
  sortConfig?: ISortConfig;
}

/**
 * 카드셋 옵션
 */
export interface ICardSetOptions {
  /** 하위 폴더 포함 여부 */
  includeSubfolders?: boolean;
  /** 정렬 설정 */
  sortConfig?: ISortConfig;
}

/**
 * 카드셋 인터페이스
 * - 카드들의 집합을 관리
 * - 카드셋의 타입과 설정을 관리
 */
export interface ICardSet {
  /** 카드셋 ID */
  readonly id: string;
  /** 카드셋 타입 (폴더, 태그, 링크) */
  readonly type: CardSetType;
  /** 카드셋 기준 (폴더 경로 또는 태그) */
  readonly criteria: string;
  /** 카드셋 설정 */
  readonly config: ICardSetConfig;
  /** 카드셋 옵션 */
  readonly options: ICardSetOptions;
  /** 카드 목록 */
  readonly cards: readonly ICard[];

  /**
   * 카드 셋 유효성 검사
   */
  validate(): boolean;
}

/**
 * 기본 링크 설정
 */
export const DEFAULT_LINK_CONFIG: ILinkConfig = {
  type: 'backlink',
  level: 1,
  includeBacklinks: true,
  includeOutgoingLinks: false,
  includePatterns: [],
  excludePatterns: []
};

/**
 * 기본 카드셋 설정
 */
export const DEFAULT_CARD_SET_CONFIG: ICardSetConfig = {
  folderPath: '',
  includeSubfolders: false,
  tags: [],
  linkConfig: DEFAULT_LINK_CONFIG,
  searchFilter: undefined,
  sortConfig: undefined
};

/**
 * 기본 카드셋 옵션
 */
export const DEFAULT_CARD_SET_OPTIONS: ICardSetOptions = {
  includeSubfolders: false,
  sortConfig: undefined
};

/**
 * 기본 카드셋
 */
export const DEFAULT_CARD_SET: ICardSet = {
  id: '',
  type: CardSetType.FOLDER,
  criteria: '',
  config: DEFAULT_CARD_SET_CONFIG,
  options: DEFAULT_CARD_SET_OPTIONS,
  cards: [],

  validate(): boolean {
    return this.id !== '' && this.cards.length >= 0;
  }
}; 