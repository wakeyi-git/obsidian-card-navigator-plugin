import { App, TFile, MetadataCache } from 'obsidian';
import { ICard } from '../../domain/card/Card';
import { 
  ISearchRepository, 
  ISearchOptions, 
  ISearchResult,
  SearchType
} from '../../domain/search/Search';
import { ObsidianCardAdapter } from '../adapters/ObsidianCardAdapter';

/**
 * Obsidian 검색 저장소
 * 카드 검색과 관련된 기능을 제공합니다.
 */
export class ObsidianSearchRepository implements ISearchRepository {
  private cardAdapter: ObsidianCardAdapter;

  constructor(
    private app: App,
    private metadataCache: MetadataCache
  ) {
    this.cardAdapter = new ObsidianCardAdapter(app);
  }

  async search(query: string, options: ISearchOptions): Promise<ISearchResult[]> {
    const results: ISearchResult[] = [];
    const files = this.app.vault.getMarkdownFiles();
    const searchType = options.type || 'filename';
    const caseSensitive = options.caseSensitive || false;
    const fuzzy = options.fuzzy || false;

    for (const file of files) {
      const card = await this.cardAdapter.toCard(file);
      const matches = await this.findMatches(card, file, query, searchType, caseSensitive, fuzzy);
      if (matches.length > 0) {
        results.push({
          card,
          score: this.calculateScore(matches.map(m => m.text), query),
          matches
        });
      }
    }

    return results.sort((a, b) => b.score - a.score);
  }

  getSuggestions(query: string, type: SearchType, limit: number = 10): string[] {
    const suggestions = new Set<string>();
    const normalizedQuery = query.toLowerCase();
    const files = this.app.vault.getMarkdownFiles();

    for (const file of files) {
      const card = this.cardAdapter.toCard(file);

      switch (type) {
        case 'filename':
          if (file.basename.toLowerCase().includes(normalizedQuery)) {
            suggestions.add(file.basename);
          }
          break;

        case 'tag':
          const cache = this.metadataCache.getFileCache(file);
          cache?.tags?.forEach(tag => {
            if (tag.tag.toLowerCase().includes(normalizedQuery)) {
              suggestions.add(tag.tag.substring(1));
            }
          });
          break;

        case 'path':
          if (file.path.toLowerCase().includes(normalizedQuery)) {
            suggestions.add(file.path);
          }
          break;

        case 'frontmatter':
          const metadata = this.metadataCache.getFileCache(file);
          if (metadata?.frontmatter) {
            Object.entries(metadata.frontmatter).forEach(([key, value]) => {
              const stringValue = String(value);
              if (stringValue.toLowerCase().includes(normalizedQuery)) {
                suggestions.add(`${key}: ${stringValue}`);
              }
            });
          }
          break;
      }

      if (suggestions.size >= limit) {
        break;
      }
    }

    return Array.from(suggestions).slice(0, limit);
  }

  private async findMatches(
    card: ICard,
    file: TFile,
    query: string,
    type: SearchType,
    caseSensitive: boolean,
    fuzzy: boolean
  ): Promise<{ field: string; text: string; positions: number[]; }[]> {
    const matches: { field: string; text: string; positions: number[]; }[] = [];
    const normalizedQuery = caseSensitive ? query : query.toLowerCase();
    const cache = this.metadataCache.getFileCache(file);

    switch (type) {
      case 'filename':
        const filename = caseSensitive ? card.title : card.title.toLowerCase();
        if (this.matchText(filename, normalizedQuery, fuzzy)) {
          matches.push({
            field: 'filename',
            text: card.title,
            positions: this.findMatchPositions(filename, normalizedQuery)
          });
        }
        break;

      case 'content':
        const content = await this.app.vault.read(file);
        const normalizedContent = caseSensitive ? content : content.toLowerCase();
        const contentMatches = this.findContentMatches(normalizedContent, normalizedQuery, fuzzy);
        matches.push(...contentMatches.map(match => ({
          field: 'content',
          text: match,
          positions: this.findMatchPositions(match.toLowerCase(), normalizedQuery)
        })));
        break;

      case 'tag':
        cache?.tags?.forEach(tag => {
          const normalizedTag = caseSensitive ? tag.tag : tag.tag.toLowerCase();
          if (this.matchText(normalizedTag, normalizedQuery, fuzzy)) {
            matches.push({
              field: 'tag',
              text: tag.tag,
              positions: this.findMatchPositions(normalizedTag, normalizedQuery)
            });
          }
        });
        break;

      case 'path':
        const path = caseSensitive ? file.path : file.path.toLowerCase();
        if (this.matchText(path, normalizedQuery, fuzzy)) {
          matches.push({
            field: 'path',
            text: file.path,
            positions: this.findMatchPositions(path, normalizedQuery)
          });
        }
        break;

      case 'frontmatter':
        if (cache?.frontmatter) {
          Object.entries(cache.frontmatter).forEach(([key, value]) => {
            const stringValue = String(value);
            const normalizedValue = caseSensitive ? stringValue : stringValue.toLowerCase();
            if (this.matchText(normalizedValue, normalizedQuery, fuzzy)) {
              matches.push({
                field: `frontmatter.${key}`,
                text: stringValue,
                positions: this.findMatchPositions(normalizedValue, normalizedQuery)
              });
            }
          });
        }
        break;

      case 'create':
      case 'modify':
        const stat = await this.app.vault.adapter.stat(file.path);
        if (!stat) {
          break;
        }
        const timestamp = type === 'create' ? stat.ctime : stat.mtime;
        const date = new Date(timestamp);
        const queryDate = new Date(query);
        
        if (!isNaN(queryDate.getTime()) && date.toDateString() === queryDate.toDateString()) {
          matches.push({
            field: type,
            text: date.toISOString(),
            positions: [0]
          });
        }
        break;

      case 'regex':
        try {
          const content = await this.app.vault.read(file);
          const regex = new RegExp(query, caseSensitive ? '' : 'i');
          const regexMatches = content.match(regex);
          if (regexMatches) {
            matches.push(...regexMatches.map(match => ({
              field: 'regex',
              text: match,
              positions: this.findMatchPositions(match, query)
            })));
          }
        } catch {
          // 유효하지 않은 정규식은 무시
        }
        break;
    }

    return matches;
  }

  private findContentMatches(content: string, query: string, fuzzy: boolean): string[] {
    const matches: string[] = [];
    const lines = content.split('\n');
    
    for (const line of lines) {
      if (this.matchText(line, query, fuzzy)) {
        matches.push(line.trim());
      }
    }

    return matches;
  }

  private matchText(text: string, query: string, fuzzy: boolean): boolean {
    if (fuzzy) {
      return this.fuzzyMatch(text, query);
    }
    return text.includes(query);
  }

  private fuzzyMatch(text: string, query: string): boolean {
    let textIndex = 0;
    let queryIndex = 0;

    while (textIndex < text.length && queryIndex < query.length) {
      if (text[textIndex] === query[queryIndex]) {
        queryIndex++;
      }
      textIndex++;
    }

    return queryIndex === query.length;
  }

  private findMatchPositions(text: string, query: string): number[] {
    const positions: number[] = [];
    let index = text.indexOf(query);
    
    while (index !== -1) {
      positions.push(index);
      index = text.indexOf(query, index + 1);
    }
    
    return positions;
  }

  private calculateScore(matches: string[], query: string): number {
    let score = 0;
    const queryLength = query.length;

    for (const match of matches) {
      // 정확한 일치에 대해 높은 점수 부여
      if (match === query) {
        score += 10;
      }
      
      // 부분 일치에 대해 점수 부여
      const matchLength = match.length;
      const lengthDiff = Math.abs(matchLength - queryLength);
      score += 5 / (1 + lengthDiff);

      // 일치하는 문자 수에 따른 점수
      let matchingChars = 0;
      for (let i = 0; i < queryLength; i++) {
        if (match.includes(query[i])) {
          matchingChars++;
        }
      }
      score += matchingChars / queryLength;
    }

    return score;
  }
} 