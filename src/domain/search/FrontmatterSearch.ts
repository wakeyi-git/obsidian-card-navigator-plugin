import { App } from 'obsidian';
import { ICard } from '../card/Card';
import { ISearch, SearchType } from './Search';

/**
 * 프론트매터 검색 클래스
 * 프론트매터 필드를 기준으로 검색합니다.
 */
export class FrontmatterSearch implements ISearch {
  private app: App;
  private query: string;
  private caseSensitive: boolean;
  private frontmatterKey: string;

  constructor(app: App, query: string = '', frontmatterKey: string = '', caseSensitive: boolean = false) {
    this.app = app;
    this.query = query;
    this.frontmatterKey = frontmatterKey;
    this.caseSensitive = caseSensitive;
  }

  getType(): SearchType {
    return 'frontmatter';
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

  getFrontmatterKey(): string {
    return this.frontmatterKey;
  }

  setFrontmatterKey(key: string): void {
    this.frontmatterKey = key;
  }

  async match(card: ICard): Promise<boolean> {
    if (!this.query || !this.frontmatterKey) return true;
    
    // 프론트매터가 없는 경우
    if (!card.frontmatter) return false;
    
    // 프론트매터 키가 없는 경우
    if (!(this.frontmatterKey in card.frontmatter)) return false;
    
    const value = card.frontmatter[this.frontmatterKey];
    
    // 값이 없는 경우
    if (value === undefined || value === null) return false;
    
    // 값을 문자열로 변환
    const valueStr = String(value);
    
    // 대소문자 구분 여부에 따라 검색
    if (this.caseSensitive) {
      return valueStr.includes(this.query);
    } else {
      return valueStr.toLowerCase().includes(this.query.toLowerCase());
    }
  }

  async search(cards: ICard[]): Promise<ICard[]> {
    if (!this.query || !this.frontmatterKey) return cards;
    
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
      frontmatterKey: this.frontmatterKey,
      caseSensitive: this.caseSensitive
    };
  }
} 