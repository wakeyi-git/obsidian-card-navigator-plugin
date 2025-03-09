import { ICard } from '../card/Card';
import { Search } from './Search';
import { App, TFile } from 'obsidian';

/**
 * 날짜 검색 클래스
 * 생성일 또는 수정일 기반 검색을 위한 클래스입니다.
 */
export class DateSearch extends Search {
  private dateType: 'creation' | 'modification';
  private startDate: Date | null = null;
  private endDate: Date | null = null;
  private app: App;

  /**
   * 생성자
   * @param app Obsidian App 객체
   * @param query 검색어 (날짜 형식: YYYY-MM-DD 또는 범위: YYYY-MM-DD YYYY-MM-DD)
   * @param dateType 날짜 타입 (creation: 생성일, modification: 수정일)
   * @param caseSensitive 대소문자 구분 여부
   */
  constructor(app: App, query = '', dateType: 'creation' | 'modification' = 'creation', caseSensitive = false) {
    super(dateType === 'creation' ? 'create' : 'modify', query, caseSensitive);
    this.dateType = dateType;
    this.app = app;
    this.parseDateQuery(query);
  }

  /**
   * 날짜 검색 타입 가져오기
   * @returns 날짜 검색 타입
   */
  getDateType(): 'creation' | 'modification' {
    return this.dateType;
  }

  /**
   * 시작 날짜 가져오기
   * @returns 시작 날짜
   */
  getStartDate(): Date | null {
    return this.startDate;
  }

  /**
   * 종료 날짜 가져오기
   * @returns 종료 날짜
   */
  getEndDate(): Date | null {
    return this.endDate;
  }

  /**
   * 검색어 설정 (날짜 형식)
   * @param query 검색어
   */
  setQuery(query: string): void {
    super.setQuery(query);
    this.parseDateQuery(query);
  }

  /**
   * 날짜 검색어 파싱
   * @param query 검색어
   */
  private parseDateQuery(query: string): void {
    this.startDate = null;
    this.endDate = null;

    if (!query) return;

    // 날짜 범위 검색 (시작일과 종료일)
    if (query.includes('[start date]:') && query.includes('[end date]:')) {
      const startMatch = query.match(/\[start date\]:(\d{4}-\d{2}-\d{2})/);
      const endMatch = query.match(/\[end date\]:(\d{4}-\d{2}-\d{2})/);

      if (startMatch && startMatch[1]) {
        this.startDate = new Date(startMatch[1]);
      }

      if (endMatch && endMatch[1]) {
        this.endDate = new Date(endMatch[1]);
        // 종료일은 해당 일의 마지막 시간으로 설정
        this.endDate.setHours(23, 59, 59, 999);
      }
    }
    // 단일 날짜 검색
    else {
      const dateMatch = query.match(/(\d{4}-\d{2}-\d{2})/);
      if (dateMatch && dateMatch[1]) {
        this.startDate = new Date(dateMatch[1]);
        this.endDate = new Date(dateMatch[1]);
        this.endDate.setHours(23, 59, 59, 999);
      }
    }
  }

  /**
   * 날짜 검색 수행
   * @param cards 검색할 카드 목록
   * @returns 검색 결과 카드 목록
   */
  search(cards: ICard[]): ICard[] {
    if (!this.startDate && !this.endDate) {
      return cards;
    }

    return cards.filter(card => {
      let cardDate: Date | null = null;

      // 날짜 타입에 따라 카드의 날짜 가져오기
      if (this.dateType === 'creation') {
        cardDate = card.created ? new Date(card.created) : null;
      } else if (this.dateType === 'modification') {
        cardDate = card.modified ? new Date(card.modified) : null;
      }

      if (!cardDate) {
        return false;
      }

      // 시작일만 있는 경우
      if (this.startDate && !this.endDate) {
        return cardDate >= this.startDate;
      }
      // 종료일만 있는 경우
      else if (!this.startDate && this.endDate) {
        return cardDate <= this.endDate;
      }
      // 시작일과 종료일 모두 있는 경우
      else if (this.startDate && this.endDate) {
        return cardDate >= this.startDate && cardDate <= this.endDate;
      }

      return false;
    });
  }

  /**
   * 검색 객체 직렬화
   * @returns 직렬화된 검색 객체
   */
  serialize(): any {
    return {
      ...super.serialize(),
      dateType: this.dateType,
      startDate: this.startDate ? this.startDate.toISOString() : null,
      endDate: this.endDate ? this.endDate.toISOString() : null
    };
  }

  /**
   * 파일이 검색 조건과 일치하는지 확인
   * @param file 확인할 파일
   * @returns 일치 여부
   */
  async match(file: TFile): Promise<boolean> {
    if (!this.startDate) return true;
    
    try {
      let fileDate: Date;
      
      if (this.dateType === 'creation') {
        // 생성일 가져오기
        fileDate = new Date(file.stat.ctime);
      } else {
        // 수정일 가져오기
        fileDate = new Date(file.stat.mtime);
      }
      
      // 날짜 범위 검사
      if (this.startDate && this.endDate) {
        // 시작일과 종료일 모두 있는 경우 (범위 검색)
        return fileDate >= this.startDate && fileDate <= this.endDate;
      } else {
        // 시작일만 있는 경우 (단일 날짜 검색)
        const startOfDay = new Date(this.startDate);
        const endOfDay = new Date(this.startDate);
        endOfDay.setHours(23, 59, 59, 999);
        
        return fileDate >= startOfDay && fileDate <= endOfDay;
      }
    } catch (error) {
      console.error(`[DateSearch] 파일 날짜 검색 오류 (${file.path}):`, error);
      return false;
    }
  }
} 