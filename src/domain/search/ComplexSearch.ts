import { App } from 'obsidian';
import { ICard } from '../card/Card';
import { ISearch, SearchType } from './Search';
import { ContentSearch } from './ContentSearch';
import { FilenameSearch } from './FilenameSearch';
import { TagSearch } from './TagSearch';

/**
 * 복합 검색 클래스
 * 여러 검색 조건을 조합하여 검색합니다.
 */
export class ComplexSearch implements ISearch {
  private app: App;
  private query: string;
  private caseSensitive: boolean;
  private searches: ISearch[] = [];

  constructor(app: App, query = '', caseSensitive = false) {
    this.app = app;
    this.query = query;
    this.caseSensitive = caseSensitive;
    this.parseQuery();
  }

  getType(): SearchType {
    return 'complex';
  }

  getQuery(): string {
    return this.query;
  }

  setQuery(query: string): void {
    this.query = query;
    this.parseQuery();
  }

  isCaseSensitive(): boolean {
    return this.caseSensitive;
  }

  setCaseSensitive(caseSensitive: boolean): void {
    this.caseSensitive = caseSensitive;
    this.parseQuery();
  }

  private parseQuery(): void {
    this.searches = [];
    
    if (!this.query) return;
    
    const terms = this.query.split(' ').filter(term => term.trim() !== '');
    
    for (const term of terms) {
      if (term.startsWith('#')) {
        // 태그 검색
        this.searches.push(new TagSearch(this.app, term.substring(1), this.caseSensitive));
      } else if (term.startsWith('content:')) {
        // 내용 검색
        this.searches.push(new ContentSearch(this.app, term.substring(8), this.caseSensitive));
      } else {
        // 기본 파일명 검색
        this.searches.push(new FilenameSearch(this.app, term, this.caseSensitive));
      }
    }
  }

  async match(card: ICard): Promise<boolean> {
    if (this.searches.length === 0) return true;
    
    for (const search of this.searches) {
      if (!(await search.match(card))) {
        return false;
      }
    }
    
    return true;
  }

  async search(cards: ICard[]): Promise<ICard[]> {
    if (this.searches.length === 0) return cards;
    
    let results = [...cards];
    
    for (const search of this.searches) {
      results = await search.search(results);
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