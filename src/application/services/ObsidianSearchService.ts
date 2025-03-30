import { App, TFile, SearchComponent } from 'obsidian';
import { ICardRenderConfig, ICardStyle } from '@/domain/models/Card';
import { Card } from '@/domain/models/Card';
import { CardSet, CardSetType, ICardSetConfig } from '@/domain/models/CardSet';
import { ISearchOptions, ISearchResult } from '@/domain/models/Search';
import { CardService } from './CardService';
import { DomainEventDispatcher } from '@/domain/events/DomainEventDispatcher';
import { CardRepository } from '@/infrastructure/repositories/CardRepository';
import { CardSetCreatedEvent, CardSetUpdatedEvent, CardSetDeletedEvent } from '@/domain/events/CardSetEvents';
import { IPresetService } from '@/domain/services/IPresetService';
import { v4 as uuidv4 } from 'uuid';
import { ILayoutConfig } from '@/domain/models/Layout';
import { ILayoutService } from '@/domain/services/ILayoutService';
import { ICardSetRepository } from '@/domain/repositories/ICardSetRepository';
import { LoggingService } from '@/infrastructure/services/LoggingService';
import { CardFilter } from '@/domain/models/CardSet';
import { IObsidianSearchService } from '@/domain/services/IObsidianSearchService';

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
export class ObsidianSearchService implements IObsidianSearchService {
  private searchComponent: SearchComponent | null = null;
  private searchResults: ISearchResult | null = null;
  private isSearching = false;
  private cardService: CardService;
  private eventDispatcher: DomainEventDispatcher;
  private _cardSets: Map<string, CardSet> = new Map();
  private readonly loggingService: LoggingService;

  constructor(
    private readonly app: App,
    containerEl: HTMLElement,
    private readonly layoutService: ILayoutService,
    private readonly presetService: IPresetService,
    private readonly cardSetRepository: ICardSetRepository
  ) {
    this.loggingService = new LoggingService(app);
    this.eventDispatcher = new DomainEventDispatcher(this.loggingService);
    const cardRepository = new CardRepository(app);
    this.cardService = new CardService(app, cardRepository, this.eventDispatcher);
  }

  /**
   * 서비스 초기화
   */
  initialize(): void {
    this.loggingService.info('ObsidianSearchService 초기화');
  }

  /**
   * 서비스 정리
   */
  cleanup(): void {
    this.loggingService.info('ObsidianSearchService 정리');
    this.clearSearchResults();
  }

  /**
   * 검색 결과 업데이트
   */
  updateSearchResults(results: ISearchResult): void {
    this.searchResults = results;
    this.loggingService.info(`검색 결과 업데이트: ${results.cards.length}개`);
  }

  /**
   * 검색 결과 초기화
   */
  clearSearchResults(): void {
    this.searchResults = null;
    this.loggingService.info('검색 결과 초기화');
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
        this.layoutService,
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

  /**
   * 카드셋 생성
   */
  async createCardSet(
    name: string,
    description: string,
    config: ICardSetConfig,
    layoutConfig: ILayoutConfig,
    cardRenderConfig: ICardRenderConfig
  ): Promise<CardSet> {
    const id = uuidv4();
    const cardSet = new CardSet(
      id,
      name,
      description,
      config,
      this.app,
      this.cardService,
      this.layoutService,
      layoutConfig,
      cardRenderConfig
    );

    await this._saveCardSet(cardSet);
    this.eventDispatcher.dispatch(new CardSetCreatedEvent(cardSet));
    return cardSet;
  }

  /**
   * 카드셋 업데이트
   */
  async updateCardSet(cardSet: CardSet): Promise<void> {
    await this._saveCardSet(cardSet);
    this.eventDispatcher.dispatch(new CardSetUpdatedEvent(cardSet));
  }

  /**
   * 카드셋 삭제
   */
  async deleteCardSet(id: string): Promise<void> {
    this._cardSets.delete(id);
    this.eventDispatcher.dispatch(new CardSetDeletedEvent(id));
  }

  /**
   * 카드셋에 카드 추가
   */
  async addCardToSet(cardSetId: string, cardId: string): Promise<void> {
    const cardSet = await this.getCardSet(cardSetId);
    if (!cardSet) {
      throw new Error(`CardSet not found: ${cardSetId}`);
    }

    const card = await this.cardService.getCardById(cardId);
    if (!card) {
      throw new Error(`Card not found: ${cardId}`);
    }

    cardSet.addCard(card);
    await this.updateCardSet(cardSet);
  }

  /**
   * 카드셋에서 카드 제거
   */
  async removeCardFromSet(cardSetId: string, cardId: string): Promise<void> {
    const cardSet = await this.getCardSet(cardSetId);
    if (!cardSet) {
      throw new Error(`CardSet not found: ${cardSetId}`);
    }

    cardSet.removeCard(cardId);
    await this.updateCardSet(cardSet);
  }

  /**
   * 카드셋 활성 카드 설정
   */
  async setActiveCard(cardSetId: string, cardId: string): Promise<void> {
    const cardSet = await this.getCardSet(cardSetId);
    if (!cardSet) {
      throw new Error(`CardSet not found: ${cardSetId}`);
    }

    cardSet.activeCardId = cardId;
    await this.updateCardSet(cardSet);
  }

  /**
   * 카드셋 포커스 카드 설정
   */
  async setFocusedCard(cardSetId: string, cardId: string): Promise<void> {
    const cardSet = await this.getCardSet(cardSetId);
    if (!cardSet) {
      throw new Error(`CardSet not found: ${cardSetId}`);
    }

    cardSet.focusedCardId = cardId;
    await this.updateCardSet(cardSet);
  }

  /**
   * 카드셋 카드 정렬
   */
  async sortCards(cardSetId: string): Promise<void> {
    const cardSet = await this.getCardSet(cardSetId);
    if (!cardSet) {
      throw new Error(`CardSet not found: ${cardSetId}`);
    }

    cardSet.sortCards();
    await this.updateCardSet(cardSet);
  }

  /**
   * 카드셋 카드 필터링
   */
  async filterCards(cardSetId: string, filter: CardFilter): Promise<void> {
    const cardSet = await this.getCardSet(cardSetId);
    if (!cardSet) {
      throw new Error(`CardSet not found: ${cardSetId}`);
    }

    cardSet.filterCards(filter);
    await this.updateCardSet(cardSet);
  }

  /**
   * 카드셋 조회
   */
  async getCardSet(id: string): Promise<CardSet | undefined> {
    return this._cardSets.get(id);
  }

  /**
   * 모든 카드셋 조회
   */
  async getAllCardSets(): Promise<CardSet[]> {
    return Array.from(this._cardSets.values());
  }

  /**
   * 카드셋 타입 업데이트
   */
  async updateCardSetType(cardSetId: string, type: CardSetType): Promise<void> {
    const cardSet = await this.getCardSet(cardSetId);
    if (!cardSet) {
      throw new Error(`CardSet not found: ${cardSetId}`);
    }

    cardSet.updateType(type);
    await this.updateCardSet(cardSet);
  }

  /**
   * 프리셋 적용
   */
  async applyPreset(cardSetId: string, presetId: string): Promise<void> {
    const cardSet = await this.getCardSet(cardSetId);
    if (!cardSet) {
      throw new Error(`CardSet not found: ${cardSetId}`);
    }

    const preset = await this.presetService.getPreset(presetId);
    if (!preset) {
      throw new Error(`Preset not found: ${presetId}`);
    }

    cardSet.applyPreset(preset);
    await this.updateCardSet(cardSet);
  }

  /**
   * 카드셋 저장
   */
  private async _saveCardSet(cardSet: CardSet): Promise<void> {
    this._cardSets.set(cardSet.id, cardSet);
  }

  /**
   * 카드 필터링
   */
  private _filterCards(cards: Card[], filter: CardFilter): Card[] {
    return cards.filter(card => {
      switch (filter.type) {
        case 'tag':
          return filter.criteria.tags?.some(tag => card.tags.includes(tag)) ?? false;
        case 'folder':
          return filter.criteria.folderPath ? card.filePath.startsWith(filter.criteria.folderPath) : false;
        case 'date':
          return this._isDateInRange(card, filter);
        case 'search':
          return this._matchesSearch(card, filter);
        default:
          return false;
      }
    });
  }

  /**
   * 날짜 범위 체크
   */
  private _isDateInRange(card: Card, filter: CardFilter): boolean {
    if (filter.type !== 'date' || !filter.criteria.startDate || !filter.criteria.endDate) return false;
    
    const cardDate = new Date(card.updatedAt);
    const startDate = new Date(filter.criteria.startDate);
    const endDate = new Date(filter.criteria.endDate);
    
    return cardDate >= startDate && cardDate <= endDate;
  }

  /**
   * 검색어 매칭
   */
  private _matchesSearch(card: Card, filter: CardFilter): boolean {
    if (filter.type !== 'search' || !filter.criteria.value) return false;
    
    const searchText = filter.criteria.value.toLowerCase();
    return (
      card.fileName.toLowerCase().includes(searchText) ||
      card.content.toLowerCase().includes(searchText) ||
      card.tags.some(tag => tag.toLowerCase().includes(searchText)) ||
      card.filePath.toLowerCase().includes(searchText)
    );
  }

  /**
   * 카드 조회
   */
  private async _getCard(cardId: string): Promise<Card | null> {
    try {
      this.loggingService.debug('카드 조회 시작:', cardId);

      const card = await this.cardService.getCardById(cardId);
      if (!card) {
        this.loggingService.warn('카드를 찾을 수 없음');
        return null;
      }

      this.loggingService.debug('카드 조회 완료');
      return card;
    } catch (error) {
      this.loggingService.error('카드 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 검색 중인지 확인
   */
  isSearchingActive(): boolean {
    return this.isSearching;
  }
} 