import { ISettingsService } from '../../domain/settings/SettingsInterfaces';

/**
 * 검색 히스토리 서비스 인터페이스
 */
export interface ISearchHistoryService {
  /**
   * 검색 히스토리 가져오기
   * @returns 검색 히스토리
   */
  getHistory(): string[];
  
  /**
   * 검색 히스토리에 추가
   * @param query 검색어
   */
  addToHistory(query: string): void;
  
  /**
   * 검색 히스토리 삭제
   * @param query 검색어
   */
  removeFromHistory(query: string): void;
  
  /**
   * 검색 히스토리 초기화
   */
  clearHistory(): void;
  
  /**
   * 최대 히스토리 크기 설정
   * @param size 최대 크기
   */
  setMaxHistorySize(size: number): void;
}

/**
 * 검색 히스토리 서비스
 * 검색 히스토리를 관리합니다.
 */
export class SearchHistoryService implements ISearchHistoryService {
  private history: string[] = [];
  private maxHistorySize = 10;
  private settingsService: ISettingsService;
  
  /**
   * 생성자
   * @param settingsService 설정 서비스
   */
  constructor(settingsService: ISettingsService) {
    this.settingsService = settingsService;
    this.loadHistory();
  }
  
  /**
   * 검색 히스토리 가져오기
   * @returns 검색 히스토리
   */
  getHistory(): string[] {
    return [...this.history];
  }
  
  /**
   * 검색 히스토리에 추가
   * @param query 검색어
   */
  addToHistory(query: string): void {
    if (!query.trim()) return;
    
    // 이미 있는 경우 제거
    this.removeFromHistory(query);
    
    // 앞에 추가
    this.history.unshift(query);
    
    // 최대 크기 유지
    if (this.history.length > this.maxHistorySize) {
      this.history = this.history.slice(0, this.maxHistorySize);
    }
    
    // 저장
    this.saveHistory();
  }
  
  /**
   * 검색 히스토리 삭제
   * @param query 검색어
   */
  removeFromHistory(query: string): void {
    const index = this.history.indexOf(query);
    if (index !== -1) {
      this.history.splice(index, 1);
      this.saveHistory();
    }
  }
  
  /**
   * 검색 히스토리 초기화
   */
  clearHistory(): void {
    this.history = [];
    this.saveHistory();
  }
  
  /**
   * 최대 히스토리 크기 설정
   * @param size 최대 크기
   */
  setMaxHistorySize(size: number): void {
    this.maxHistorySize = size;
    
    // 크기 조정
    if (this.history.length > this.maxHistorySize) {
      this.history = this.history.slice(0, this.maxHistorySize);
      this.saveHistory();
    }
  }
  
  /**
   * 검색 히스토리 로드
   */
  private loadHistory(): void {
    const settings = this.settingsService.getSettings();
    this.history = settings.searchHistory || [];
    this.maxHistorySize = settings.maxSearchHistory || 10;
  }
  
  /**
   * 검색 히스토리 저장
   */
  private saveHistory(): void {
    this.settingsService.updateSettings({
      searchHistory: this.history
    });
  }
} 