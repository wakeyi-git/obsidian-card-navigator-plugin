import { App } from 'obsidian';
import { ICard } from '../card/Card';
import { ISearch, SearchType } from './Search';

/**
 * 파일명 검색 클래스
 * 파일명을 기준으로 검색합니다.
 */
export class FilenameSearch implements ISearch {
  private app: App;
  private query: string;
  private caseSensitive: boolean;

  constructor(app: App, query = '', caseSensitive = false) {
    this.app = app;
    this.query = query;
    this.caseSensitive = caseSensitive;
  }

  getType(): SearchType {
    return 'filename';
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
    
    const filename = card.title || '';
    
    if (this.caseSensitive) {
      return filename.includes(this.query);
    } else {
      return filename.toLowerCase().includes(this.query.toLowerCase());
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