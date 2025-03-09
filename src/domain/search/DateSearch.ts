import { App } from 'obsidian';
import { ICard } from '../card/Card';
import { ISearch, SearchType } from './Search';

/**
 * 날짜 검색 타입
 */
type DateSearchType = 'creation' | 'modification';

/**
 * 날짜 검색 클래스
 * 생성일 또는 수정일을 기준으로 검색합니다.
 */
export class DateSearch implements ISearch {
  private app: App;
  private query: string;
  private caseSensitive: boolean;
  private dateType: DateSearchType;

  constructor(app: App, query = '', dateType: DateSearchType = 'creation', caseSensitive = false) {
    this.app = app;
    this.query = query;
    this.dateType = dateType;
    this.caseSensitive = caseSensitive;
  }

  getType(): SearchType {
    return 'date';
  }

  getQuery(): string {
    return this.query;
  }

  setQuery(query: string): void {
    this.query = query;
  }

  isCaseSensitive(): boolean {
    return this.caseSensitive;
  }

  setCaseSensitive(caseSensitive: boolean): void {
    this.caseSensitive = caseSensitive;
  }

  /**
   * 날짜 문자열을 타임스탬프로 변환
   * @param dateStr 날짜 문자열 (today, yesterday, YYYY-MM-DD 등)
   * @returns 타임스탬프
   */
  private getTimestampFromDateString(dateStr: string): number {
    const now = new Date();
    
    if (dateStr === 'today') {
      // 오늘 날짜의 시작 (00:00:00)
      return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    } else if (dateStr === 'yesterday') {
      // 어제 날짜의 시작 (00:00:00)
      return new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).getTime();
    } else if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      // YYYY-MM-DD 형식
      return new Date(dateStr).getTime();
    } else {
      // 기본값: 오늘
      return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    }
  }

  async match(card: ICard): Promise<boolean> {
    if (!this.query) return true;
    
    const timestamp = this.dateType === 'creation' ? card.created : card.modified;
    const queryTimestamp = this.getTimestampFromDateString(this.query);
    
    // 날짜 비교 (같은 날짜인지)
    const cardDate = new Date(timestamp);
    const queryDate = new Date(queryTimestamp);
    
    return (
      cardDate.getFullYear() === queryDate.getFullYear() &&
      cardDate.getMonth() === queryDate.getMonth() &&
      cardDate.getDate() === queryDate.getDate()
    );
  }

  async search(cards: ICard[]): Promise<ICard[]> {
    if (!this.query) return cards;
    
    const results: ICard[] = [];
    
    for (const card of cards) {
      if (await this.match(card)) {
        results.push(card);
      }
    }
    
    return results;
  }

  serialize() {
    return {
      type: this.getType(),
      query: this.query,
      dateType: this.dateType,
      caseSensitive: this.caseSensitive
    };
  }
} 