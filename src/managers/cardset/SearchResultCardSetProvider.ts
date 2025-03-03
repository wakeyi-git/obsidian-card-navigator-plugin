import { App, TFile } from 'obsidian';
import { AbstractCardSetProvider } from './AbstractCardSetProvider';
import { CardSet } from '../../core/models/CardSet';
import { CardSetMode } from '../../core/types/cardset.types';
import { SearchQuery, SearchResult } from '../../core/types/search.types';
import { ErrorHandler } from '../../utils/error/ErrorHandler';

/**
 * 검색 결과를 기반으로 카드셋을 제공하는 클래스
 */
export class SearchResultCardSetProvider extends AbstractCardSetProvider {
  /**
   * 현재 검색 쿼리
   * @private
   */
  private currentQuery: SearchQuery | null = null;

  /**
   * 검색 결과
   * @private
   */
  private searchResults: SearchResult[] = [];

  /**
   * SearchResultCardSetProvider 생성자
   * @param app Obsidian 앱 인스턴스
   */
  constructor(app: App) {
    super(app, CardSetMode.SEARCH_RESULTS);
  }

  /**
   * 검색 쿼리 설정
   * @param query 검색 쿼리
   */
  public setSearchQuery(query: SearchQuery): void {
    try {
      this.currentQuery = query;
      this.refreshCardSet();
    } catch (error) {
      ErrorHandler.getInstance().handleError('검색 쿼리 설정 중 오류 발생', error);
    }
  }

  /**
   * 현재 검색 쿼리 반환
   * @returns 현재 검색 쿼리
   */
  public getSearchQuery(): SearchQuery | null {
    return this.currentQuery;
  }

  /**
   * 검색 결과 설정
   * @param results 검색 결과
   */
  public setSearchResults(results: SearchResult[]): void {
    try {
      this.searchResults = results;
      this.refreshCardSet();
    } catch (error) {
      ErrorHandler.getInstance().handleError('검색 결과 설정 중 오류 발생', error);
    }
  }

  /**
   * 현재 검색 결과 반환
   * @returns 현재 검색 결과
   */
  public getSearchResults(): SearchResult[] {
    return this.searchResults;
  }

  /**
   * 카드셋 로드
   * @returns 로드된 카드셋
   */
  async loadCardSet(): Promise<CardSet> {
    try {
      if (!this.searchResults || this.searchResults.length === 0) {
        this.currentCardSet = new CardSet(
          `search-${Date.now()}`,
          CardSetMode.SEARCH_RESULTS,
          this.currentQuery ? JSON.stringify(this.currentQuery) : null,
          []
        );
        return this.currentCardSet;
      }

      // 검색 결과에서 파일 추출
      const files = this.getFilesFromSearchResults();
      
      this.currentCardSet = new CardSet(
        `search-${Date.now()}`,
        CardSetMode.SEARCH_RESULTS,
        this.currentQuery ? JSON.stringify(this.currentQuery) : null,
        files
      );
      return this.currentCardSet;
    } catch (error) {
      ErrorHandler.getInstance().handleError('검색 결과 카드셋 로드 중 오류 발생', error);
      this.currentCardSet = new CardSet(
        `search-error-${Date.now()}`,
        CardSetMode.SEARCH_RESULTS,
        null,
        []
      );
      return this.currentCardSet;
    }
  }

  /**
   * 파일이 현재 카드셋에 포함되는지 확인
   * @param file 확인할 파일
   * @returns 포함 여부
   */
  public isFileIncluded(file: TFile): boolean {
    if (!file || file.extension !== 'md' || !this.searchResults || this.searchResults.length === 0) {
      return false;
    }

    return this.searchResults.some(result => result.file && result.file.path === file.path);
  }

  /**
   * 검색 결과에서 파일 추출
   * @returns 파일 배열
   * @private
   */
  private getFilesFromSearchResults(): TFile[] {
    try {
      // 중복 제거를 위한 Set 사용
      const fileSet = new Set<TFile>();
      
      this.searchResults.forEach(result => {
        if (result.file && result.file.extension === 'md') {
          fileSet.add(result.file);
        }
      });
      
      return Array.from(fileSet);
    } catch (error) {
      ErrorHandler.getInstance().handleError('검색 결과에서 파일 추출 중 오류 발생', error);
      return [];
    }
  }
} 