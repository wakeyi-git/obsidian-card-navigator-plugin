import { TFile } from 'obsidian';
import { SearchMatch, ISearchResult } from '../types/search.types';

/**
 * 검색 결과 모델 클래스
 * 검색 결과 데이터를 관리합니다.
 */
export class SearchResult implements ISearchResult {
  /**
   * 검색 결과 파일
   */
  public readonly file: TFile;
  
  /**
   * 검색 매치 배열
   */
  private _matches: SearchMatch[];
  
  /**
   * 검색어
   */
  public readonly searchTerm: string;
  
  /**
   * 검색 결과 점수
   * 높을수록 더 관련성이 높음
   */
  private _score: number;
  
  /**
   * 검색 결과 생성 시간
   */
  public readonly timestamp: number;
  
  /**
   * 검색 결과 생성자
   * @param file 검색 결과 파일
   * @param matches 검색 매치 배열
   * @param searchTerm 검색어
   * @param score 검색 결과 점수
   */
  constructor(
    file: TFile,
    matches: SearchMatch[],
    searchTerm: string,
    score: number = 0
  ) {
    this.file = file;
    this._matches = [...matches];
    this.searchTerm = searchTerm;
    this._score = score;
    this.timestamp = Date.now();
    this.updateScore();
  }
  
  /**
   * 매치 배열 가져오기
   */
  get matches(): SearchMatch[] {
    return [...this._matches];
  }
  
  /**
   * 점수 가져오기
   */
  get score(): number {
    return this._score;
  }
  
  /**
   * 매치 추가
   * @param match 추가할 매치
   */
  addMatch(match: SearchMatch): void {
    this._matches.push(match);
    this.updateScore();
  }
  
  /**
   * 매치 제거
   * @param index 제거할 매치 인덱스
   */
  removeMatch(index: number): void {
    if (index >= 0 && index < this._matches.length) {
      this._matches.splice(index, 1);
      this.updateScore();
    }
  }
  
  /**
   * 점수 업데이트
   * 매치 타입에 따라 가중치 부여
   */
  private updateScore(): void {
    // 기본 점수 계산 로직
    // 타입별 가중치: 제목 > 헤더 > 태그 > 내용 > 프론트매터
    const weights: Record<string, number> = {
      'title': 5,
      'header': 4,
      'tag': 3,
      'content': 2,
      'frontmatter': 1
    };
    
    this._score = this._matches.reduce((total, match) => {
      return total + (weights[match.type] || 1);
    }, 0);
  }
  
  /**
   * 매치 타입별 개수 가져오기
   * @returns 타입별 매치 개수
   */
  getMatchCountsByType(): Record<string, number> {
    const counts: Record<string, number> = {
      title: 0,
      header: 0,
      tag: 0,
      content: 0,
      frontmatter: 0
    };
    
    this._matches.forEach(match => {
      counts[match.type] = (counts[match.type] || 0) + 1;
    });
    
    return counts;
  }
  
  /**
   * 검색 결과 데이터로 변환
   * @returns 검색 결과 데이터
   */
  toData(): ISearchResult {
    return {
      file: this.file,
      matches: this.matches,
      searchTerm: this.searchTerm,
      score: this.score,
      timestamp: this.timestamp
    };
  }
  
  /**
   * 검색 결과 데이터에서 검색 결과 모델 생성
   * @param data 검색 결과 데이터
   * @returns 검색 결과 모델
   */
  static fromData(data: ISearchResult): SearchResult {
    const result = new SearchResult(
      data.file,
      data.matches,
      data.searchTerm,
      data.score
    );
    
    // timestamp 속성은 생성자에서 현재 시간으로 설정되므로,
    // 데이터의 timestamp를 반영하기 위해 Object.defineProperty 사용
    Object.defineProperty(result, 'timestamp', {
      value: data.timestamp,
      writable: false
    });
    
    return result;
  }
  
  /**
   * 검색 결과 비교 함수
   * 점수를 기준으로 내림차순 정렬
   * @param a 첫 번째 검색 결과
   * @param b 두 번째 검색 결과
   * @returns 비교 결과
   */
  static compare(a: SearchResult, b: SearchResult): number {
    return b.score - a.score;
  }
} 