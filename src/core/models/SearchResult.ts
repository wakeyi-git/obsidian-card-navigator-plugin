import { TFile } from 'obsidian';
import { ISearchResult, SearchMatch, SearchField } from '../types/search.types';

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
   * 검색어
   */
  public readonly searchTerm: string;
  
  /**
   * 일치 항목 배열
   */
  public matches: SearchMatch[] = [];
  
  /**
   * 검색 결과 점수
   */
  public score: number = 0;
  
  /**
   * 검색 결과 생성 시간
   */
  public readonly timestamp: number;
  
  /**
   * 검색 결과 생성자
   * @param file 검색 결과 파일
   * @param searchTerm 검색어
   * @param score 초기 점수
   * @param timestamp 타임스탬프
   */
  constructor(file: TFile, searchTerm: string, score: number = 0, timestamp: number = Date.now()) {
    this.file = file;
    this.searchTerm = searchTerm;
    this.score = score;
    this.timestamp = timestamp;
  }
  
  /**
   * 검색 일치 항목 추가
   * @param match 검색 일치 항목
   */
  addMatch(match: SearchMatch): void {
    this.matches.push(match);
    this.updateScore();
  }
  
  /**
   * 매치 제거
   * @param index 제거할 매치 인덱스
   */
  removeMatch(index: number): void {
    if (index >= 0 && index < this.matches.length) {
      this.matches.splice(index, 1);
      this.updateScore();
    }
  }
  
  /**
   * 검색 결과 점수 업데이트
   * 매치 타입에 따라 가중치 적용
   */
  private updateScore(): void {
    // 필드별 가중치 설정
    const weights: Record<string, number> = {
      [SearchField.FILENAME]: 5,
      [SearchField.HEADINGS]: 4,
      [SearchField.TAGS]: 3,
      [SearchField.FRONTMATTER]: 2,
      [SearchField.CONTENT]: 1
    };
    
    this.score = this.matches.reduce((total, match) => {
      // field가 없는 경우 type을 사용하거나 기본 가중치 1 적용
      if (!match.field && match.type) {
        // 이전 버전 호환을 위한 타입 매핑
        const typeToField: Record<string, SearchField> = {
          'title': SearchField.FILENAME,
          'header': SearchField.HEADINGS,
          'tag': SearchField.TAGS,
          'frontmatter': SearchField.FRONTMATTER,
          'content': SearchField.CONTENT
        };
        const mappedField = typeToField[match.type];
        return total + (mappedField ? weights[mappedField] || 1 : 1);
      }
      
      return total + (match.field ? weights[match.field] || 1 : 1);
    }, 0);
  }
  
  /**
   * 타입별 매치 개수 가져오기
   * @returns 타입별 매치 개수
   */
  getMatchCountsByType(): Record<string, number> {
    const counts: Record<string, number> = {
      [SearchField.FILENAME]: 0,
      [SearchField.HEADINGS]: 0,
      [SearchField.TAGS]: 0,
      [SearchField.CONTENT]: 0,
      [SearchField.FRONTMATTER]: 0
    };
    
    this.matches.forEach(match => {
      if (match.field) {
        counts[match.field] = (counts[match.field] || 0) + 1;
      } else if (match.type) {
        // 이전 버전 호환을 위한 타입 매핑
        const typeToField: Record<string, SearchField> = {
          'title': SearchField.FILENAME,
          'header': SearchField.HEADINGS,
          'tag': SearchField.TAGS,
          'frontmatter': SearchField.FRONTMATTER,
          'content': SearchField.CONTENT
        };
        const mappedField = typeToField[match.type];
        if (mappedField) {
          counts[mappedField] = (counts[mappedField] || 0) + 1;
        }
      }
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
      data.searchTerm,
      data.score,
      data.timestamp
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