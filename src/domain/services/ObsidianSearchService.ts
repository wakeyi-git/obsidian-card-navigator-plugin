import { App, TFile, SearchComponent } from 'obsidian';
import { ICardRenderConfig, ICardStyle } from '../models/Card';
import { ISearchService } from './SearchService';
import { Card } from '../models/Card';
import { CardSet } from '../models/CardSet';
import { ISearchOptions, ISearchResult } from '../models/Search';
import { CardService } from './CardService';
import { DomainEventDispatcher } from '../events/DomainEventDispatcher';
import { CardRepository } from '../repositories/CardRepository';

/**
 * 검색 결과 인터페이스
 */
interface SearchResult {
  file: TFile;
  content: string;
  firstHeader?: string;
  tags?: string[];
  frontmatter?: Record<string, any>;
}

/**
 * Obsidian 검색 서비스
 */
export class ObsidianSearchService implements ISearchService {
  private searchComponent: SearchComponent;
  private cardService: CardService;
  private eventDispatcher: DomainEventDispatcher;

  constructor(
    private readonly app: App,
    containerEl: HTMLElement
  ) {
    this.searchComponent = new SearchComponent(containerEl);
    this.eventDispatcher = new DomainEventDispatcher();
    const cardRepository = new CardRepository(app);
    this.cardService = new CardService(app, cardRepository, this.eventDispatcher);
  }

  /**
   * 검색 쿼리 유효성 검사
   */
  isValidQuery(query: string): boolean {
    return query.trim().length > 0;
  }

  /**
   * 검색 결과 필터링
   */
  filterResults(cards: Card[], query: string, options: ISearchOptions): Card[] {
    if (!query) return cards;

    const searchPattern = this._createSearchPattern(query, options);
    
    return cards.filter(card => {
      if (options.fields.title && searchPattern.test(card.fileName)) return true;
      if (options.fields.content && searchPattern.test(card.content)) return true;
      if (options.fields.tags && card.tags.some(tag => searchPattern.test(tag))) return true;
      if (options.fields.path && searchPattern.test(card.filePath)) return true;
      return false;
    });
  }

  /**
   * 실시간 검색
   */
  async searchRealtime(query: string, options: ISearchOptions): Promise<ISearchResult> {
    return this.search(query, options);
  }

  /**
   * 검색 실행
   */
  async search(query: string, options: ISearchOptions): Promise<ISearchResult> {
    const cards = await this._performSearch(query, options);
    
    return {
      cards,
      cardSet: new CardSet(
        'search-result',
        '검색 결과',
        '검색 결과 카드셋',
        {
          type: 'search',
          value: query,
          options,
          sortBy: 'fileName',
          sortOrder: 'asc',
          includeSubfolders: true
        },
        this.app,
        this.cardService,
        undefined,
        undefined,
        cards,
        undefined,
        undefined,
        new Date(),
        new Date()
      ),
      query,
      options
    };
  }

  /**
   * 실제 검색 수행
   */
  private async _performSearch(query: string, options: ISearchOptions): Promise<Card[]> {
    const searchResults = await this._executeSearch(query);
    const cards = searchResults.map((result: SearchResult) => {
      const file = result.file;
      if (!file || !(file instanceof TFile)) return null;

      return new Card(
        file.path,
        file.path,
        file.name,
        result.firstHeader || '',
        result.content,
        result.tags || [],
        file.stat.ctime,
        file.stat.mtime,
        result.frontmatter || {},
        this.getDefaultRenderConfig(),
        this.getDefaultStyle()
      );
    }).filter((card: Card | null): card is Card => card !== null);

    return this.filterResults(cards, query, options);
  }

  /**
   * 검색 실행
   */
  private async _executeSearch(query: string): Promise<SearchResult[]> {
    const files = this.app.vault.getMarkdownFiles();
    const results: SearchResult[] = [];
    
    for (const file of files) {
      try {
        const content = await this.app.vault.read(file);
        if (content.toLowerCase().includes(query.toLowerCase())) {
          results.push({
            file,
            content,
            firstHeader: this._extractFirstHeader(content),
            tags: this._extractTags(content),
            frontmatter: this._extractFrontmatter(content)
          });
        }
      } catch (error) {
        console.error(`Error reading file ${file.path}:`, error);
      }
    }
    
    return results;
  }

  /**
   * 검색 패턴 생성
   */
  private _createSearchPattern(query: string, options: ISearchOptions): RegExp {
    let pattern = query;
    
    if (!options.useRegex) {
      pattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    
    if (options.wholeWord) {
      pattern = `\\b${pattern}\\b`;
    }
    
    return new RegExp(pattern, options.caseSensitive ? '' : 'i');
  }

  /**
   * 검색 결과 렌더링 설정 가져오기
   */
  getDefaultRenderConfig(): ICardRenderConfig {
    return {
      header: {
        showFileName: true,
        showFirstHeader: true,
        showTags: true,
        showCreatedDate: true,
        showUpdatedDate: true,
        showProperties: [],
        renderMarkdown: false
      },
      body: {
        showFileName: false,
        showFirstHeader: false,
        showContent: true,
        showTags: false,
        showCreatedDate: false,
        showUpdatedDate: false,
        showProperties: [],
        contentLength: 200,
        renderMarkdown: true
      },
      footer: {
        showFileName: false,
        showFirstHeader: false,
        showTags: true,
        showCreatedDate: true,
        showUpdatedDate: true,
        showProperties: [],
        renderMarkdown: false
      },
      renderAsHtml: false
    };
  }

  /**
   * 기본 스타일 반환
   */
  getDefaultStyle(): ICardStyle {
    return {
      card: {
        background: '#ffffff',
        fontSize: '14px',
        borderColor: '#e0e0e0',
        borderWidth: '1px'
      },
      activeCard: {
        background: '#e3f2fd',
        fontSize: '14px',
        borderColor: '#2196f3',
        borderWidth: '2px'
      },
      focusedCard: {
        background: '#fff3e0',
        fontSize: '14px',
        borderColor: '#ff9800',
        borderWidth: '2px'
      },
      header: {
        background: '#f8f9fa',
        fontSize: '16px',
        borderColor: '#e0e0e0',
        borderWidth: '1px'
      },
      body: {
        background: '#ffffff',
        fontSize: '14px',
        borderColor: '#e0e0e0',
        borderWidth: '1px'
      },
      footer: {
        background: '#f8f9fa',
        fontSize: '12px',
        borderColor: '#e0e0e0',
        borderWidth: '1px'
      }
    };
  }

  /**
   * 첫 번째 헤더 추출
   */
  private _extractFirstHeader(content: string): string {
    const headerMatch = content.match(/^#\s+(.+)$/m);
    return headerMatch ? headerMatch[1] : '';
  }

  /**
   * 프론트매터 추출
   */
  private _extractFrontmatter(content: string): Record<string, any> {
    const frontmatter: Record<string, any> = {};
    const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (frontMatterMatch) {
      const frontMatterContent = frontMatterMatch[1];
      const lines = frontMatterContent.split('\n');
      for (const line of lines) {
        const [key, ...values] = line.split(':').map(s => s.trim());
        if (key && values.length > 0) {
          frontmatter[key] = values.join(':');
        }
      }
    }
    return frontmatter;
  }

  /**
   * 태그 추출
   */
  private _extractTags(content: string): string[] {
    const tags: string[] = [];
    const tagMatch = content.match(/#[\w-]+/g);
    if (tagMatch) {
      tags.push(...tagMatch);
    }
    return tags;
  }
} 