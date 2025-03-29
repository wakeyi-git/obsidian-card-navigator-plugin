import { App, TFile } from 'obsidian';
import { Card } from './Card';
import { Preset } from './Preset';
import { Layout, LayoutType, LayoutDirection, ILayoutConfig, ICardPosition } from './Layout';
import { ICardRenderConfig } from './Card';
import { ICardService } from '../services/CardService';

/**
 * 카드셋 타입
 */
export type CardSetType = 'folder' | 'tag' | 'link' | 'search';

/**
 * 카드 필터 타입
 */
export type CardFilter = {
  /** 필터 타입 */
  type: 'search' | 'tag' | 'folder' | 'date';
  /** 필터 기준 */
  criteria: {
    /** 검색어 */
    value?: string;
    /** 태그 목록 */
    tags?: string[];
    /** 폴더 경로 */
    folderPath?: string;
    /** 시작일 */
    startDate?: Date;
    /** 종료일 */
    endDate?: Date;
  };
};

/**
 * 카드 정렬 타입
 */
export type CardSort = {
  /** 정렬 기준 */
  criterion: 'fileName' | 'createdAt' | 'updatedAt' | 'firstHeader';
  /** 정렬 순서 */
  order: 'asc' | 'desc';
};

/**
 * 링크 타입
 */
export type LinkType = 'backlink' | 'outgoing';

/**
 * 링크 설정
 */
export interface ILinkConfig {
  /** 링크 타입 */
  type: LinkType;
  /** 링크 레벨 */
  depth: number;
  /** 포함할 링크 패턴 */
  includePatterns?: string[];
  /** 제외할 링크 패턴 */
  excludePatterns?: string[];
}

/**
 * 카드셋 설정 인터페이스
 */
export interface ICardSetConfig {
  /**
   * 카드셋 타입
   */
  type: CardSetType;

  /**
   * 소스 값 (폴더 경로, 태그, 링크 등)
   */
  value: string;

  /**
   * 하위 폴더 포함 여부
   */
  includeSubfolders?: boolean;

  /**
   * 소스 폴더
   */
  sourceFolder?: string;

  /**
   * 허용된 파일 확장자
   */
  allowedExtensions?: string[];

  /**
   * 정렬 기준
   */
  sortBy: 'fileName' | 'firstHeader' | 'createdAt' | 'updatedAt' | 'custom';

  /**
   * 정렬 순서
   */
  sortOrder: 'asc' | 'desc';

  /**
   * 커스텀 정렬 필드
   */
  customSortField?: string;

  /**
   * 우선순위 태그
   */
  priorityTags?: string[];

  /**
   * 우선순위 폴더
   */
  priorityFolders?: string[];

  /**
   * 링크 설정
   */
  linkConfig?: ILinkConfig;

  /**
   * 링크 카드셋의 경우 링크 깊이
   */
  linkLevel?: number;

  /**
   * 링크 카드셋의 경우 링크 타입
   */
  linkType?: LinkType;

  /**
   * 폴더 카드셋의 경우 활성 폴더 여부
   */
  isActiveFolder?: boolean;

  /**
   * 태그 카드셋의 경우 활성 태그 여부
   */
  isActiveTag?: boolean;

  /**
   * 추가 설정
   */
  options?: any;
}

/**
 * 카드셋 필터 인터페이스
 */
export interface ICardSetFilters {
  /**
   * 태그 목록
   */
  tags?: string[];

  /**
   * 날짜 범위
   */
  dateRange?: {
    /**
     * 시작일
     */
    start?: Date;

    /**
     * 종료일
     */
    end?: Date;

    /**
     * 날짜 필드
     */
    dateField: 'createdAt' | 'updatedAt';
  };

  /**
   * 프론트매터
   */
  frontmatter?: Record<string, any>;
}

/**
 * 카드셋 정렬 설정 인터페이스
 */
export interface ICardSetSortConfig {
  /**
   * 정렬 필드
   */
  field: 'fileName' | 'firstHeader' | 'createdAt' | 'updatedAt' | 'custom';

  /**
   * 정렬 순서
   */
  order: 'asc' | 'desc';

  /**
   * 커스텀 필드
   */
  customField?: string;
}

/**
 * 카드셋 인터페이스
 */
export interface ICardSet {
  id: string;
  name: string;
  description: string;
  config: ICardSetConfig;
  layoutConfig: ILayoutConfig;
  cardRenderConfig: ICardRenderConfig;
  cards: Card[];
  activeCardId?: string;
  focusedCardId?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 카드셋 클래스
 */
export class CardSet implements ICardSet {
  private _id: string;
  private _name: string;
  private _description: string;
  private _config: ICardSetConfig;
  private _layout: Layout;
  private _cardRenderConfig: ICardRenderConfig;
  private _cards: Card[];
  private _activeCardId?: string;
  private _focusedCardId?: string;
  private _createdAt: Date;
  private _updatedAt: Date;

  constructor(
    id: string,
    name: string,
    description: string,
    config: ICardSetConfig,
    private readonly app: App,
    private readonly cardService: ICardService,
    layoutConfig: ILayoutConfig = {
      type: LayoutType.GRID,
      direction: LayoutDirection.VERTICAL,
      fixedHeight: true,
      minCardWidth: 200,
      minCardHeight: 150,
      cardWidth: 200,
      cardHeight: 150,
      gap: 16,
      padding: 16,
      viewportWidth: 800,
      viewportHeight: 600
    },
    cardRenderConfig: ICardRenderConfig = {
      header: {
        showFileName: true,
        showFirstHeader: true,
        showTags: true,
        showCreatedDate: false,
        showUpdatedDate: false,
        showProperties: [],
        renderMarkdown: true
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
        showTags: false,
        showCreatedDate: false,
        showUpdatedDate: false,
        showProperties: [],
        renderMarkdown: true
      },
      renderAsHtml: true
    },
    cards: Card[] = [],
    activeCardId?: string,
    focusedCardId?: string,
    createdAt: Date = new Date(),
    updatedAt: Date = new Date()
  ) {
    this._id = id;
    this._name = name;
    this._description = description;
    this._config = {
      ...config,
      sortBy: config.sortBy || 'fileName',
      sortOrder: config.sortOrder || 'asc'
    };
    this._layout = new Layout(id, name, description, layoutConfig);
    this._cardRenderConfig = cardRenderConfig;
    this._cards = cards;
    this._activeCardId = activeCardId;
    this._focusedCardId = focusedCardId;
    this._createdAt = createdAt;
    this._updatedAt = updatedAt;
  }

  get id(): string {
    return this._id;
  }

  get name(): string {
    return this._name;
  }

  get description(): string {
    return this._description;
  }

  get config(): ICardSetConfig {
    return this._config;
  }

  get layoutConfig(): ILayoutConfig {
    return this._layout.config;
  }

  get cardRenderConfig(): ICardRenderConfig {
    return this._cardRenderConfig;
  }

  get cards(): Card[] {
    return this._cards;
  }

  get activeCardId(): string | undefined {
    return this._activeCardId;
  }

  get focusedCardId(): string | undefined {
    return this._focusedCardId;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  set name(name: string) {
    this._name = name;
    this._updatedAt = new Date();
  }

  set description(description: string) {
    this._description = description;
    this._updatedAt = new Date();
  }

  set config(config: ICardSetConfig) {
    this._config = config;
    this._updatedAt = new Date();
  }

  set layoutConfig(config: ILayoutConfig) {
    this._layout.config = config;
    this._updatedAt = new Date();
  }

  set cardRenderConfig(config: ICardRenderConfig) {
    this._cardRenderConfig = config;
    this._updatedAt = new Date();
  }

  set activeCardId(cardId: string | undefined) {
    this._activeCardId = cardId;
    this._updatedAt = new Date();
  }

  set focusedCardId(cardId: string | undefined) {
    this._focusedCardId = cardId;
    this._updatedAt = new Date();
  }

  addCard(card: Card): void {
    this._cards.push(card);
    this._updatedAt = new Date();
  }

  removeCard(cardId: string): void {
    this._cards = this._cards.filter(card => card.id !== cardId);
    if (this._activeCardId === cardId) {
      this._activeCardId = undefined;
    }
    if (this._focusedCardId === cardId) {
      this._focusedCardId = undefined;
    }
    this._updatedAt = new Date();
  }

  getCard(cardId: string): Card | undefined {
    return this._cards.find(card => card.id === cardId);
  }

  getActiveCard(): Card | undefined {
    return this._activeCardId ? this.getCard(this._activeCardId) : undefined;
  }

  getFocusedCard(): Card | undefined {
    return this._focusedCardId ? this.getCard(this._focusedCardId) : undefined;
  }

  /**
   * 카드 정렬
   */
  sortCards(): void {
    this._cards.sort((a, b) => {
      const sortBy = this._config.sortBy;
      const sortOrder = this._config.sortOrder;

      let comparison = 0;
      switch (sortBy) {
        case 'fileName':
          comparison = a.fileName.localeCompare(b.fileName);
          break;
        case 'firstHeader':
          comparison = (a.firstHeader || '').localeCompare(b.firstHeader || '');
          break;
        case 'createdAt':
          comparison = a.createdAt - b.createdAt;
          break;
        case 'updatedAt':
          comparison = a.updatedAt - b.updatedAt;
          break;
        case 'custom':
          if (this._config.customSortField) {
            const aValue = a.frontmatter?.[this._config.customSortField] || '';
            const bValue = b.frontmatter?.[this._config.customSortField] || '';
            comparison = aValue.localeCompare(bValue);
          }
          break;
        default:
          comparison = 0;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    this._updatedAt = new Date();
  }

  private getCardPriority(card: Card): number {
    let priority = 0;

    // 우선순위 태그 체크
    if (this._config.priorityTags?.length) {
      const tagPriority = this._config.priorityTags.findIndex(tag =>
        card.tags.includes(tag)
      );
      if (tagPriority !== -1) {
        priority += (this._config.priorityTags.length - tagPriority) * 2;
      }
    }

    // 우선순위 폴더 체크
    if (this._config.priorityFolders?.length) {
      const folderPriority = this._config.priorityFolders.findIndex(folder =>
        card.filePath.startsWith(folder)
      );
      if (folderPriority !== -1) {
        priority += (this._config.priorityFolders.length - folderPriority) * 2;
      }
    }

    return priority;
  }

  filterCards(predicate: (card: Card) => boolean): void {
    this._cards = this._cards.filter(predicate);
    if (this._activeCardId && !this.getCard(this._activeCardId)) {
      this._activeCardId = undefined;
    }
    if (this._focusedCardId && !this.getCard(this._focusedCardId)) {
      this._focusedCardId = undefined;
    }
    this._updatedAt = new Date();
  }

  clone(): CardSet {
    return new CardSet(
      this._id,
      this._name,
      this._description,
      { ...this._config },
      this.app,
      this.cardService,
      { ...this._layout.config },
      { ...this._cardRenderConfig },
      this._cards.map(card => card.clone()),
      this._activeCardId,
      this._focusedCardId,
      new Date(this._createdAt),
      new Date(this._updatedAt)
    );
  }

  /**
   * 카드 목록 설정
   */
  setCards(cards: Card[]): void {
    this._cards = cards;
    this._updatedAt = new Date();
  }

  /**
   * 카드셋 타입 업데이트
   */
  updateType(type: CardSetType): void {
    this._config.type = type;
    this._updatedAt = new Date();
  }

  /**
   * 프리셋 적용
   */
  applyPreset(preset: Preset): void {
    // 카드셋 설정 업데이트
    this._config = {
      ...this._config,
      ...preset.cardSetConfig
    };

    // 레이아웃 설정 업데이트
    this._layout.config = {
      ...this._layout.config,
      ...preset.layoutConfig
    };

    // 카드 렌더링 설정 업데이트
    this._cardRenderConfig = {
      ...this._cardRenderConfig,
      ...preset.cardRenderConfig
    };

    this._updatedAt = new Date();
  }

  /**
   * 링크로부터 카드 추가
   */
  async addCardsByLink(filePath: string): Promise<void> {
    const { linkConfig } = this._config;
    if (!linkConfig) return;

    const sourceCard = await this.cardService.getCardByPath(filePath);
    if (!sourceCard) return;

    const links = await this.getLinks(sourceCard, linkConfig);
    for (const link of links) {
      const card = await this.cardService.getCardByPath(link);
      if (card) {
        this.addCard(card);
      }
    }
  }

  /**
   * 링크 수집
   */
  private async getLinks(card: Card, config: ILinkConfig): Promise<string[]> {
    const links: string[] = [];
    const visited = new Set<string>();

    await this.collectLinks(card, config, links, visited, 0);
    return links;
  }

  /**
   * 링크 수집 재귀 함수
   */
  private async collectLinks(
    card: Card,
    config: ILinkConfig,
    links: string[],
    visited: Set<string>,
    currentDepth: number
  ): Promise<void> {
    if (currentDepth >= config.depth || visited.has(card.filePath)) {
      return;
    }

    visited.add(card.filePath);

    const file = this.app.vault.getAbstractFileByPath(card.filePath);
    if (!(file instanceof TFile)) return;

    const content = await this.app.vault.read(file);
    const matches = content.match(/\[\[([^\]]+)\]\]/g) || [];

    for (const match of matches) {
      const linkPath = match.slice(2, -2);
      const linkedFile = this.app.vault.getAbstractFileByPath(linkPath);
      
      if (!linkedFile || !(linkedFile instanceof TFile)) continue;

      // 패턴 필터링
      if (config.includePatterns?.length && 
          !config.includePatterns.some(pattern => linkPath.includes(pattern))) {
        continue;
      }
      if (config.excludePatterns?.length && 
          config.excludePatterns.some(pattern => linkPath.includes(pattern))) {
        continue;
      }

      links.push(linkPath);
      const linkedCard = await this.cardService.getCardByPath(linkPath);
      if (linkedCard) {
        await this.collectLinks(linkedCard, config, links, visited, currentDepth + 1);
      }
    }
  }

  /**
   * 카드셋이 파일을 포함하는지 확인
   */
  includesFile(file: TFile): boolean {
    switch (this._config.type) {
      case 'folder':
        return this._includesFileInFolder(file);
      case 'tag':
        return this._includesFileWithTag(file);
      case 'link':
        return this._includesFileWithLink(file);
      case 'search':
        return this._includesFileInSearch(file);
      default:
        return false;
    }
  }

  /**
   * 폴더 카드셋이 파일을 포함하는지 확인
   */
  private _includesFileInFolder(file: TFile): boolean {
    const filePath = file.path;
    const folderPath = this._config.value;

    if (this._config.isActiveFolder) {
      // 활성 폴더인 경우 현재 파일의 폴더와 비교
      const activeFolder = file.parent?.path || '';
      return filePath.startsWith(activeFolder);
    }

    if (this._config.includeSubfolders) {
      return filePath.startsWith(folderPath);
    }

    return file.parent?.path === folderPath;
  }

  /**
   * 태그 카드셋이 파일을 포함하는지 확인
   */
  private _includesFileWithTag(file: TFile): boolean {
    const fileCache = this.app.metadataCache.getFileCache(file);
    const fileTags = fileCache?.tags || [];

    if (this._config.isActiveTag) {
      // 활성 태그인 경우 현재 파일의 태그와 비교
      const activeTags = this._getActiveFileTags();
      return activeTags.some(tag => fileTags.some(t => t.tag === tag));
    }

    return fileTags.some(t => t.tag === this._config.value);
  }

  /**
   * 링크 카드셋이 파일을 포함하는지 확인
   */
  private _includesFileWithLink(file: TFile): boolean {
    // TODO: 링크 관련 로직 구현
    return false;
  }

  /**
   * 검색 카드셋이 파일을 포함하는지 확인
   */
  private _includesFileInSearch(file: TFile): boolean {
    // 검색 카드셋의 경우 항상 false를 반환
    // 실제 검색 결과는 ObsidianSearchService에서 처리됨
    return false;
  }

  /**
   * 활성 파일의 태그 가져오기
   */
  private _getActiveFileTags(): string[] {
    const activeFile = this.app.workspace.getActiveFile();
    if (!activeFile) return [];
    
    const fileCache = this.app.metadataCache.getFileCache(activeFile);
    return (fileCache?.tags || []).map(t => t.tag);
  }

  /**
   * 레이아웃 계산
   */
  calculateLayout(): void {
    this._layout.calculateLayout(this._cards);
    this._updatedAt = new Date();
  }

  /**
   * 뷰포트 업데이트
   */
  updateViewport(width: number, height: number): void {
    this._layout.updateViewport(width, height);
    this._updatedAt = new Date();
  }

  /**
   * 카드 위치 가져오기
   */
  getCardPosition(cardId: string): ICardPosition | undefined {
    return this._layout.getCardPosition(cardId);
  }

  /**
   * 카드 위치 업데이트
   */
  updateCardPosition(cardId: string, position: Omit<ICardPosition, 'cardId'>): void {
    this._layout.updateCardPosition(cardId, position);
    this._updatedAt = new Date();
  }

  /**
   * 카드 위치 추가
   */
  addCardPosition(position: ICardPosition): void {
    this._layout.addCardPosition(position);
    this._updatedAt = new Date();
  }

  /**
   * 카드 위치 제거
   */
  removeCardPosition(cardId: string): void {
    this._layout.removeCardPosition(cardId);
    this._updatedAt = new Date();
  }

  /**
   * 카드 위치 초기화
   */
  resetCardPositions(): void {
    this._layout.resetCardPositions();
    this._updatedAt = new Date();
  }

  /**
   * 기본 레이아웃 설정 생성
   */
  private _createDefaultLayoutConfig(): ILayoutConfig {
    return {
      type: LayoutType.GRID,
      direction: LayoutDirection.VERTICAL,
      fixedHeight: true,
      minCardWidth: 200,
      minCardHeight: 150,
      cardWidth: 200,
      cardHeight: 150,
      gap: 16,
      padding: 16,
      viewportWidth: 800,
      viewportHeight: 600
    };
  }
} 