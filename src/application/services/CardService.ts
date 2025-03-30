import { App, TFile } from 'obsidian';
import { Card, ICardRenderConfig, ICardStyle } from '@/domain/models/Card';
import { CardCreatedEvent, CardUpdatedEvent, CardDeletedEvent } from '@/domain/events/CardEvents';
import { DomainEventDispatcher } from '@/domain/events/DomainEventDispatcher';
import { ICardRepository } from '@/domain/repositories/ICardRepository';
import { ICardService } from '@/domain/services/ICardService';

/**
 * 카드 서비스 클래스
 */
export class CardService implements ICardService {
  private readonly _cards: Map<string, Card>;
  private readonly app: App;
  private readonly defaultRenderConfig: ICardRenderConfig;
  private readonly defaultStyle: ICardStyle;

  constructor(
    app: App,
    private readonly cardRepository: ICardRepository,
    private readonly eventDispatcher: DomainEventDispatcher
  ) {
    this._cards = new Map();
    this.app = app;
    this.defaultRenderConfig = this.getDefaultRenderConfig();
    this.defaultStyle = this.getDefaultStyle();
  }

  /**
   * ID로 카드 조회
   */
  async getCardById(id: string): Promise<Card | null> {
    const card = await this.cardRepository.findById(id);
    return card || null;
  }

  /**
   * 파일로부터 카드 생성
   */
  async createFromFile(file: TFile): Promise<Card> {
    try {
      console.debug(`[CardNavigator] 파일로부터 카드 생성 시작: ${file.path}`);
      
      // 새 카드 생성
      const card = await this.cardRepository.getOrCreateCard(file);
      
      // 이벤트 발생
      this.eventDispatcher.dispatch(new CardCreatedEvent(card));
      
      console.debug(`[CardNavigator] 새 카드 생성 완료`);
      return card;
    } catch (error) {
      console.error(`[CardNavigator] 카드 생성 실패: ${file.path}`, error);
      throw error;
    }
  }

  /**
   * 파일로부터 카드 조회
   */
  async getCardByFile(file: TFile): Promise<Card | null> {
    try {
      console.debug(`[CardNavigator] 파일 경로로 카드 조회 시작: ${file.path}`);
      
      // 기존 카드 확인
      const existingCard = await this.cardRepository.findByPath(file.path);
      if (existingCard) {
        console.debug(`[CardNavigator] 기존 카드 발견: ${file.path}`);
        return existingCard;
      }

      console.debug(`[CardNavigator] 카드를 찾을 수 없음`);
      return null;
    } catch (error) {
      console.error(`[CardNavigator] 카드 조회 실패: ${file.path}`, error);
      return null;
    }
  }

  /**
   * 카드 업데이트
   */
  async updateCard(card: Card): Promise<void> {
    const file = this.app.vault.getAbstractFileByPath(card.filePath);
    if (!file || !(file instanceof TFile)) {
      throw new Error(`File not found: ${card.filePath}`);
    }

    const content = await this.app.vault.read(file);
    const frontmatter = this.parseFrontmatter(content);
    const firstHeader = this.extractFirstHeader(content);
    const tags = this.extractTags(content);
    const updatedAt = new Date(file.stat.mtime);

    card.updateContent(content);
    this.eventDispatcher.dispatch(new CardUpdatedEvent(card));
  }

  /**
   * 카드 삭제
   */
  async deleteCard(cardId: string): Promise<void> {
    const card = this._cards.get(cardId);
    if (card) {
      this._cards.delete(cardId);
      this.eventDispatcher.dispatch(new CardDeletedEvent(cardId));
    }
  }

  /**
   * 모든 카드 조회
   */
  async getCards(): Promise<Card[]> {
    return this.cardRepository.findAll();
  }

  /**
   * 카드 렌더링
   */
  async renderCard(card: Card, config: ICardRenderConfig): Promise<string> {
    const header = this.renderHeader(card, config.header);
    const body = await this.renderBody(card, config.body);
    const footer = this.renderFooter(card, config.footer);

    return `
      <div class="card ${card.isActive ? 'active' : ''} ${card.isFocused ? 'focused' : ''}">
        ${header}
        ${body}
        ${footer}
      </div>
    `;
  }

  /**
   * 헤더 렌더링
   */
  private renderHeader(card: Card, config: ICardRenderConfig['header']): string {
    if (!config.showFileName && !config.showFirstHeader) return '';

    const headerContent = config.renderMarkdown
      ? this.renderMarkdown(card.firstHeader || card.fileName)
      : card.firstHeader || card.fileName;

    return `
      <div class="card-header">
        ${headerContent}
      </div>
    `;
  }

  /**
   * 본문 렌더링
   */
  private async renderBody(card: Card, config: ICardRenderConfig['body']): Promise<string> {
    if (!config.showContent) return '';

    const bodyContent = config.renderMarkdown
      ? await this.renderMarkdown(card.content || '')
      : card.content || '';

    return `
      <div class="card-body">
        ${bodyContent}
      </div>
    `;
  }

  /**
   * 마크다운 렌더링
   */
  private async renderMarkdown(content: string): Promise<string> {
    // TODO: Obsidian의 마크다운 렌더링 API를 사용하여 구현
    return content;
  }

  /**
   * 풋터 렌더링
   */
  private renderFooter(card: Card, config: ICardRenderConfig['footer']): string {
    if (!config.showTags && !config.showCreatedDate && !config.showUpdatedDate) return '';

    const footerContent = [];

    if (config.showTags && card.tags.length > 0) {
      footerContent.push(`<div class="card-tags">${card.tags.join(', ')}</div>`);
    }

    if (config.showCreatedDate) {
      footerContent.push(`<div class="card-created-date">Created: ${new Date(card.createdAt).toLocaleDateString()}</div>`);
    }

    if (config.showUpdatedDate) {
      footerContent.push(`<div class="card-updated-date">Updated: ${new Date(card.updatedAt).toLocaleDateString()}</div>`);
    }

    return `
      <div class="card-footer">
        ${footerContent.join('')}
      </div>
    `;
  }

  /**
   * 프론트매터 파싱
   */
  private parseFrontmatter(content: string): Record<string, any> {
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) {
      return {};
    }

    const frontmatter = frontmatterMatch[1];
    const lines = frontmatter.split('\n');
    const result: Record<string, any> = {};

    for (const line of lines) {
      const [key, ...values] = line.split(':').map(s => s.trim());
      if (key && values.length > 0) {
        result[key] = values.join(':');
      }
    }

    return result;
  }

  /**
   * 첫 번째 헤더 추출
   */
  private extractFirstHeader(content: string): string {
    const headerMatch = content.match(/^#\s+(.+)$/m);
    return headerMatch ? headerMatch[1] : '';
  }

  /**
   * 태그 추출
   */
  private extractTags(content: string): string[] {
    const tagMatches = content.match(/#[\w-]+/g) || [];
    return tagMatches.map(tag => tag.slice(1));
  }

  /**
   * 기본 렌더링 설정 반환
   */
  getDefaultRenderConfig(): ICardRenderConfig {
    return {
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
   * 파일 경로로 카드 조회
   */
  async getCardByPath(filePath: string): Promise<Card | null> {
    const file = this.app.vault.getAbstractFileByPath(filePath);
    if (!file || !(file instanceof TFile)) {
      return null;
    }

    // 기존 카드 확인
    const existingCard = await this.cardRepository.findByPath(filePath);
    if (existingCard) {
      return existingCard;
    }

    // 새 카드 생성
    return this.createFromFile(file);
  }
} 