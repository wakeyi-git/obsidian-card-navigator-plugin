import { App, TFile } from 'obsidian';
import { SearchSettings } from '../../core/types/search.types';
import { ErrorHandler } from '../../utils/error/ErrorHandler';
import { SearchHistoryService } from './SearchHistoryService';

/**
 * 검색 제안 서비스 클래스
 * 검색 제안 기능을 관리합니다.
 */
export class SearchSuggestionService {
  /**
   * Obsidian 앱 인스턴스
   */
  private app: App;

  /**
   * 검색 설정
   */
  private settings: SearchSettings;

  /**
   * 검색 기록 서비스
   */
  private searchHistoryService: SearchHistoryService;

  /**
   * 생성자
   * @param app Obsidian 앱 인스턴스
   * @param settings 검색 설정
   * @param searchHistoryService 검색 기록 서비스
   */
  constructor(app: App, settings: SearchSettings, searchHistoryService: SearchHistoryService) {
    this.app = app;
    this.settings = settings;
    this.searchHistoryService = searchHistoryService;
  }

  /**
   * 검색어에 대한 제안 생성
   * @param query 검색어
   * @param maxSuggestions 최대 제안 수
   * @returns 제안 목록
   */
  public getSuggestions(query: string, maxSuggestions: number = 5): string[] {
    try {
      if (!this.settings.enableSearchSuggestions || !query.trim()) {
        return [];
      }

      const suggestions: string[] = [];
      const lowerQuery = query.toLowerCase();

      // 검색 기록에서 제안 추가
      this.addHistorySuggestions(suggestions, lowerQuery, maxSuggestions);

      // 파일 이름에서 제안 추가
      if (this.settings.searchInFilename) {
        this.addFilenameSuggestions(suggestions, lowerQuery, maxSuggestions);
      }

      // 태그에서 제안 추가
      if (this.settings.searchInTags) {
        this.addTagSuggestions(suggestions, lowerQuery, maxSuggestions);
      }

      // 중복 제거 및 최대 개수 제한
      return [...new Set(suggestions)].slice(0, maxSuggestions);
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        '검색 제안을 생성하는 중 오류가 발생했습니다.',
        error
      );
      return [];
    }
  }

  /**
   * 검색 기록에서 제안 추가
   * @param suggestions 제안 배열
   * @param lowerQuery 소문자 변환된 검색어
   * @param maxSuggestions 최대 제안 수
   */
  private addHistorySuggestions(suggestions: string[], lowerQuery: string, maxSuggestions: number): void {
    try {
      const history = this.searchHistoryService.getSearchHistory();
      
      for (const item of history) {
        if (suggestions.length >= maxSuggestions) break;
        
        if (item.toLowerCase().includes(lowerQuery) && !suggestions.includes(item)) {
          suggestions.push(item);
        }
      }
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        '검색 기록에서 제안을 추가하는 중 오류가 발생했습니다.',
        error
      );
    }
  }

  /**
   * 파일 이름에서 제안 추가
   * @param suggestions 제안 배열
   * @param lowerQuery 소문자 변환된 검색어
   * @param maxSuggestions 최대 제안 수
   */
  private addFilenameSuggestions(suggestions: string[], lowerQuery: string, maxSuggestions: number): void {
    try {
      const files = this.app.vault.getMarkdownFiles();
      
      for (const file of files) {
        if (suggestions.length >= maxSuggestions) break;
        
        const filename = file.basename.toLowerCase();
        if (filename.includes(lowerQuery)) {
          const suggestion = lowerQuery.length > 2 ? file.basename : lowerQuery;
          if (!suggestions.includes(suggestion)) {
            suggestions.push(suggestion);
          }
        }
      }
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        '파일 이름에서 제안을 추가하는 중 오류가 발생했습니다.',
        error
      );
    }
  }

  /**
   * 태그에서 제안 추가
   * @param suggestions 제안 배열
   * @param lowerQuery 소문자 변환된 검색어
   * @param maxSuggestions 최대 제안 수
   */
  private addTagSuggestions(suggestions: string[], lowerQuery: string, maxSuggestions: number): void {
    try {
      const allTags = this.getAllTags();
      
      for (const tag of allTags) {
        if (suggestions.length >= maxSuggestions) break;
        
        if (tag.toLowerCase().includes(lowerQuery) && !suggestions.includes(tag)) {
          suggestions.push(tag);
        }
      }
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        '태그에서 제안을 추가하는 중 오류가 발생했습니다.',
        error
      );
    }
  }

  /**
   * 모든 태그 가져오기
   * @returns 태그 배열
   */
  private getAllTags(): string[] {
    try {
      const tags: Set<string> = new Set();
      const files = this.app.vault.getMarkdownFiles();
      
      for (const file of files) {
        const cache = this.app.metadataCache.getFileCache(file);
        if (cache && cache.tags) {
          for (const tagObj of cache.tags) {
            tags.add(tagObj.tag);
          }
        }
      }
      
      return Array.from(tags);
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        '모든 태그를 가져오는 중 오류가 발생했습니다.',
        error
      );
      return [];
    }
  }

  /**
   * 설정 업데이트
   * @param settings 새 검색 설정
   */
  public updateSettings(settings: SearchSettings): void {
    this.settings = settings;
  }
} 