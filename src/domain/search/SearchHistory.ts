/**
 * 검색 기록 클래스
 * 검색 기록을 관리합니다.
 */
export class SearchHistory {
  private history: string[] = [];
  private maxSize: number;

  constructor(maxSize: number = 10) {
    this.maxSize = maxSize;
  }

  /**
   * 검색 기록 추가
   * @param query 검색어
   */
  add(query: string): void {
    if (!query || query.trim() === '') return;
    
    // 중복 제거
    this.history = this.history.filter(item => item !== query);
    
    // 최신 기록을 맨 앞에 추가
    this.history.unshift(query);
    
    // 최대 크기 유지
    if (this.history.length > this.maxSize) {
      this.history = this.history.slice(0, this.maxSize);
    }
  }

  /**
   * 검색 기록 가져오기
   * @returns 검색 기록 목록
   */
  getHistory(): string[] {
    return [...this.history];
  }

  /**
   * 검색 기록 초기화
   */
  clear(): void {
    this.history = [];
  }

  /**
   * 검색 기록 설정
   * @param history 검색 기록 목록
   */
  setHistory(history: string[]): void {
    this.history = [...history];
    
    // 최대 크기 유지
    if (this.history.length > this.maxSize) {
      this.history = this.history.slice(0, this.maxSize);
    }
  }

  /**
   * 검색 기록 직렬화
   * @returns 직렬화된 검색 기록
   */
  serialize(): string[] {
    return [...this.history];
  }

  /**
   * 검색 기록 역직렬화
   * @param data 역직렬화할 데이터
   */
  deserialize(data: string[]): void {
    this.setHistory(data);
  }
} 