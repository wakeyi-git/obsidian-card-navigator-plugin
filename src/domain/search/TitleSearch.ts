import { App } from 'obsidian';
import { ICard } from '../card/Card';
import { ISearch, SearchType } from './Search';

/**
 * 제목 검색 클래스
 * 제목을 기준으로 검색합니다.
 */
export class TitleSearch implements ISearch {
  private app: App;
  private query: string;
  private caseSensitive: boolean;

  constructor(app: App, query: string = '', caseSensitive: boolean = false) {
    this.app = app;
    this.query = query;
    this.caseSensitive = caseSensitive;
  }

  getType(): SearchType {
    return 'title';
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

  async match(card: ICard): Promise<boolean> {
    if (!this.query) return true;
    
    const title = card.title || '';
    
    if (this.caseSensitive) {
      return title.includes(this.query);
    } else {
      return title.toLowerCase().includes(this.query.toLowerCase());
    }
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
      caseSensitive: this.caseSensitive
    };
  }
} 