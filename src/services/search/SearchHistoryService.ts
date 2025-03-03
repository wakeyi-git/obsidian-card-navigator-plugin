import { SearchSettings } from '../../core/types/search.types';
import { ErrorHandler } from '../../utils/error/ErrorHandler';

/**
 * 검색 기록 서비스 클래스
 * 사용자의 검색 기록을 관리합니다.
 */
export class SearchHistoryService {
  /**
   * 검색 기록 배열
   */
  private searchHistory: string[] = [];

  /**
   * 검색 설정
   */
  private settings: SearchSettings;

  /**
   * 생성자
   * @param settings 검색 설정
   */
  constructor(settings: SearchSettings) {
    this.settings = settings;
    this.loadSearchHistory();
  }

  /**
   * 검색 기록 로드
   */
  private loadSearchHistory(): void {
    try {
      const savedHistory = localStorage.getItem('card-navigator-search-history');
      if (savedHistory) {
        this.searchHistory = JSON.parse(savedHistory);
        
        // 최대 항목 수에 맞게 조정
        if (this.searchHistory.length > this.settings.maxSearchHistoryItems) {
          this.searchHistory = this.searchHistory.slice(0, this.settings.maxSearchHistoryItems);
          this.saveSearchHistory();
        }
      }
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        '검색 기록을 로드하는 중 오류가 발생했습니다.',
        error
      );
      this.searchHistory = [];
    }
  }

  /**
   * 검색 기록 저장
   */
  private saveSearchHistory(): void {
    try {
      if (this.settings.saveSearchHistory) {
        localStorage.setItem('card-navigator-search-history', JSON.stringify(this.searchHistory));
      }
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        '검색 기록을 저장하는 중 오류가 발생했습니다.',
        error
      );
    }
  }

  /**
   * 검색어를 기록에 추가
   * @param query 검색어
   */
  public addSearchQuery(query: string): void {
    try {
      if (!this.settings.saveSearchHistory || !query.trim()) {
        return;
      }

      // 중복 검색어 제거
      this.searchHistory = this.searchHistory.filter(item => item !== query);
      
      // 새 검색어를 배열 앞에 추가
      this.searchHistory.unshift(query);
      
      // 최대 항목 수 제한
      if (this.searchHistory.length > this.settings.maxSearchHistoryItems) {
        this.searchHistory = this.searchHistory.slice(0, this.settings.maxSearchHistoryItems);
      }
      
      this.saveSearchHistory();
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        '검색어를 기록에 추가하는 중 오류가 발생했습니다.',
        error
      );
    }
  }

  /**
   * 검색 기록 가져오기
   * @returns 검색 기록 배열
   */
  public getSearchHistory(): string[] {
    return [...this.searchHistory];
  }

  /**
   * 특정 검색어 삭제
   * @param query 삭제할 검색어
   */
  public removeSearchQuery(query: string): void {
    try {
      this.searchHistory = this.searchHistory.filter(item => item !== query);
      this.saveSearchHistory();
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        '검색어를 삭제하는 중 오류가 발생했습니다.',
        error
      );
    }
  }

  /**
   * 검색 기록 전체 삭제
   */
  public clearSearchHistory(): void {
    try {
      this.searchHistory = [];
      this.saveSearchHistory();
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        '검색 기록을 삭제하는 중 오류가 발생했습니다.',
        error
      );
    }
  }

  /**
   * 설정 업데이트
   * @param settings 새 검색 설정
   */
  public updateSettings(settings: SearchSettings): void {
    try {
      this.settings = settings;
      
      // 설정 변경에 따라 기록 조정
      if (this.searchHistory.length > this.settings.maxSearchHistoryItems) {
        this.searchHistory = this.searchHistory.slice(0, this.settings.maxSearchHistoryItems);
        this.saveSearchHistory();
      }
      
      // 기록 저장 설정이 꺼진 경우 로컬 스토리지에서 삭제
      if (!this.settings.saveSearchHistory) {
        localStorage.removeItem('card-navigator-search-history');
      }
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        '검색 설정을 업데이트하는 중 오류가 발생했습니다.',
        error
      );
    }
  }
} 