import { App } from 'obsidian';
import { ICard } from '../card/Card';
import { ISearch, SearchType } from './Search';

/**
 * 파일 검색 클래스
 * 파일 경로를 기준으로 검색합니다.
 */
export class FileSearch implements ISearch {
  private app: App;
  private query: string;
  private caseSensitive: boolean;

  constructor(app: App, query: string = '', caseSensitive: boolean = false) {
    this.app = app;
    this.query = query;
    this.caseSensitive = caseSensitive;
  }

  getType(): SearchType {
    return 'file';
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
    
    const path = card.path || '';
    
    if (this.caseSensitive) {
      return path.includes(this.query);
    } else {
      return path.toLowerCase().includes(this.query.toLowerCase());
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