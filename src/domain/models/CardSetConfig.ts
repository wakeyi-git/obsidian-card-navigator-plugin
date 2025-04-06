import { IFilterConfig, DEFAULT_FILTER_CONFIG } from './FilterConfig';
import { ISortConfig, DEFAULT_SORT_CONFIG } from './SortConfig';
import { ISearchConfig, DEFAULT_SEARCH_CONFIG } from './SearchConfig';

/**
 * 카드셋 타입 열거형
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
 * 폴더 카드셋 설정 인터페이스
 */
export interface IFolderCardSetConfig {
  /** 폴더 경로 */
  readonly path: string;
  /** 하위 폴더 포함 여부 */
  readonly includeSubfolders: boolean;
}

/**
 * 태그 카드셋 설정 인터페이스
 */
export interface ITagCardSetConfig {
  /** 태그 목록 */
  readonly tags: string[];
  /** 대소문자 일치 여부 */
  readonly caseSensitive: boolean;
  /** 중첩 태그 포함 여부 */
  readonly includeNestedTags: boolean;
}

/**
 * 링크 카드셋 설정 인터페이스
 */
export interface ILinkCardSetConfig {
  /** 링크 레벨 */
  readonly level: number;
  /** 아웃고잉 링크 포함 여부 */
  readonly includeOutgoingLinks: boolean;
  /** 백링크 포함 여부 */
  readonly includeBacklinks: boolean;
}

/**
 * 카드셋 설정 인터페이스
 */
export interface ICardSetConfig {
  /** 카드셋 타입 */
  readonly type: CardSetType;
  /** 폴더 설정 */
  readonly folder?: IFolderCardSetConfig;
  /** 태그 설정 */
  readonly tag?: ITagCardSetConfig;
  /** 링크 설정 */
  readonly link?: ILinkCardSetConfig;
  /** 필터 설정 */
  readonly filterConfig: IFilterConfig;
  /** 정렬 설정 */
  readonly sortConfig: ISortConfig;
  /** 검색 설정 */
  readonly searchConfig: ISearchConfig;
}

/**
 * 기본 폴더 카드셋 설정
 */
export const DEFAULT_FOLDER_CARD_SET_CONFIG: ICardSetConfig = {
  type: CardSetType.FOLDER,
  folder: {
    path: '',
    includeSubfolders: true
  },
  filterConfig: DEFAULT_FILTER_CONFIG,
  sortConfig: DEFAULT_SORT_CONFIG,
  searchConfig: DEFAULT_SEARCH_CONFIG
};

/**
 * 기본 태그 카드셋 설정
 */
export const DEFAULT_TAG_CARD_SET_CONFIG: ICardSetConfig = {
  type: CardSetType.TAG,
  tag: {
    tags: [],
    caseSensitive: false,
    includeNestedTags: true
  },
  filterConfig: DEFAULT_FILTER_CONFIG,
  sortConfig: DEFAULT_SORT_CONFIG,
  searchConfig: DEFAULT_SEARCH_CONFIG
};

/**
 * 기본 링크 카드셋 설정
 */
export const DEFAULT_LINK_CARD_SET_CONFIG: ICardSetConfig = {
  type: CardSetType.LINK,
  link: {
    level: 1,
    includeOutgoingLinks: true,
    includeBacklinks: true
  },
  filterConfig: DEFAULT_FILTER_CONFIG,
  sortConfig: DEFAULT_SORT_CONFIG,
  searchConfig: DEFAULT_SEARCH_CONFIG
};

/**
 * 기본 카드셋 설정 생성
 * @param type 카드셋 타입
 * @returns 기본 카드셋 설정
 */
export function createDefaultConfig(type: CardSetType): ICardSetConfig {
  switch (type) {
    case CardSetType.FOLDER:
      return DEFAULT_FOLDER_CARD_SET_CONFIG;
    case CardSetType.TAG:
      return DEFAULT_TAG_CARD_SET_CONFIG;
    case CardSetType.LINK:
      return DEFAULT_LINK_CARD_SET_CONFIG;
    default:
      throw new Error(`Unknown card set type: ${type}`);
  }
} 