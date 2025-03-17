import { ICard } from '../card/Card';
import { CardSetSourceMode, CardSetType } from '../cardset/CardSet';

/**
 * 검색 타입
 */
export type SearchType = 'filename' | 'content' | 'tag' | 'path' | 'frontmatter' | 'create' | 'modify' | 'regex' | 'folder' | 'title' | 'file' | 'complex' | 'date';

/**
 * 검색 범위 타입
 */
export type SearchScope = 'all' | 'current';

/**
 * 검색 필드 인터페이스
 */
export interface ISearchField {
  type: string;
  query: string;
  searchType: SearchType;
  caseSensitive: boolean;
  frontmatterKey?: string;
  dateRange?: {
    start?: string;
    end?: string;
  };
}

/**
 * 검색 제안 인터페이스
 */
export interface ISearchSuggestion {
  text: string;
  type: SearchType;
  description?: string;
  highlightIndices?: [number, number][];
}

/**
 * 검색 제안 그룹 인터페이스
 */
export interface ISearchSuggestionGroup {
  title: string;
  suggestions: ISearchSuggestion[];
}

/**
 * 검색 결과 인터페이스
 */
export interface ISearchResult {
  card: ICard;
  score: number;
  matches: {
    field: string;
    text: string;
    positions: number[];
  }[];
}

/**
 * 검색 옵션 인터페이스
 */
export interface ISearchOptions {
  query?: string;
  caseSensitive: boolean;
  fuzzy: boolean;
  fields: string[];
  limit?: number;
  scope?: SearchScope;
  type?: SearchType;
}

/**
 * 검색 이벤트 페이로드 인터페이스
 */
export interface SearchStartedPayload {
  query: string;
  options: ISearchOptions;
}

export interface SearchCompletedPayload {
  query: string;
  results: ISearchResult[];
  options: ISearchOptions;
}

export interface SearchPerformedPayload {
  query: string;
  options: ISearchOptions;
  results: ISearchResult[];
  queries: { field: string; query: string }[];
}

export interface IndexUpdatedPayload {
  cardCount: number;
}

/**
 * 검색 인덱스 인터페이스
 */
export interface ISearchIndex {
  add(card: ICard): void;
  remove(cardId: string): void;
  search(query: string, options: ISearchOptions): Promise<ISearchResult[]>;
  clear(): void;
  getSuggestions(query: string, limit?: number): string[];
}

/**
 * 검색 이벤트 발행자 인터페이스
 */
export interface ISearchEventPublisher {
  publishSearchStarted(payload: SearchStartedPayload): void;
  publishSearchCompleted(payload: SearchCompletedPayload): void;
  publishSearchPerformed(payload: SearchPerformedPayload): void;
  publishIndexUpdated(payload: IndexUpdatedPayload): void;
}

/**
 * 검색 서비스 인터페이스
 */
export interface ISearchService {
  search(query: string, options?: Partial<ISearchOptions>): Promise<ISearchResult[]>;
  searchMultiple(queries: { field: string; query: string }[]): Promise<ISearchResult[]>;
  updateIndex(cards: ICard[]): Promise<void>;
  getSuggestions(query: string, limit?: number): string[];
  match(card: ICard): Promise<boolean>;
  getType(): SearchType;
  getQuery(): string;
  isCaseSensitive(): boolean;
  getSearchFields(): ISearchField[];
}

/**
 * 검색 저장소 인터페이스
 */
export interface ISearchRepository {
  search(query: string, options: ISearchOptions): Promise<ISearchResult[]>;
  getSuggestions(query: string, type: SearchType, limit?: number): string[];
} 