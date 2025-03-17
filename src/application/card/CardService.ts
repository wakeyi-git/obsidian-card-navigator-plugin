import { ICard, CardContentType, ICardDisplaySettings, IDateFormatSettings, IFrontmatterFormatSettings } from '../../domain/card/Card';
import { CardState } from '../../domain/card/CardState';
import { ICardManager } from '../../domain/card/ICardManager';
import { DomainEventBus } from '../../core/events/DomainEventBus';
import { EventType, IEventPayloads } from '../../core/events/EventTypes';
import { DomainErrorBus } from '../../core/errors/DomainErrorBus';
import { ErrorCode } from '../../core/errors/ErrorTypes';
import { DomainError } from '../../core/errors/DomainError';

/**
 * 포맷된 카드 콘텐츠 인터페이스
 * 카드의 헤더, 본문, 푸터의 포맷된 내용을 정의합니다.
 */
export interface IFormattedCardContent {
  /**
   * 포맷된 헤더 콘텐츠
   */
  header: string;
  
  /**
   * 포맷된 본문 콘텐츠
   */
  body: string;
  
  /**
   * 포맷된 푸터 콘텐츠
   */
  footer: string;
}

/**
 * 카드 서비스 인터페이스
 */
export interface ICardService {
  /**
   * 카드 생성
   */
  createCard(content: string): ICard;

  /**
   * 카드 수정
   */
  updateCard(card: ICard): void;

  /**
   * 카드 삭제
   */
  deleteCard(cardId: string): void;

  /**
   * 카드 상태 변경
   */
  updateCardState(cardId: string, state: Partial<CardState>): void;

  /**
   * 카드 선택
   */
  selectCard(cardId: string): void;

  /**
   * 카드 선택 해제
   */
  deselectCard(cardId: string): void;

  /**
   * 모든 카드 선택 해제
   */
  deselectAllCards(): void;

  /**
   * 카드 포커스
   */
  focusCard(cardId: string): void;

  /**
   * 카드 포커스 해제
   */
  unfocusCard(cardId: string): void;

  /**
   * 카드 열기
   */
  openCard(cardId: string): void;

  /**
   * 카드 닫기
   */
  closeCard(cardId: string): void;

  /**
   * 카드 ID로 카드 조회
   */
  getCard(cardId: string): ICard | undefined;

  /**
   * 서비스 정리
   */
  destroy(): void;

  /**
   * 카드 콘텐츠를 템플릿에 따라 가공하여 반환합니다.
   */
  formatCardContent(card: ICard, displaySettings?: ICardDisplaySettings): IFormattedCardContent;
}

/**
 * 카드 서비스 구현체
 */
export class CardService implements ICardService {
  private cards: Map<string, ICard> = new Map();
  private eventBus: DomainEventBus;
  private errorBus: DomainErrorBus;

  constructor(
    private readonly cardManager: ICardManager
  ) {
    this.eventBus = DomainEventBus.getInstance();
    this.errorBus = DomainErrorBus.getInstance();
  }

  /**
   * 카드 생성
   */
  createCard(content: string): ICard {
    const card = this.cardManager.createCard(content);
    this.cards.set(card.getId(), card);
    this.publishCardCreated(card);
    return card;
  }

  /**
   * 카드 수정
   */
  updateCard(card: ICard): void {
    if (this.cards.has(card.getId())) {
      this.cards.set(card.getId(), card);
      this.cardManager.updateCard(card);
      this.publishCardUpdated(card);
    }
  }

  /**
   * 카드 삭제
   */
  deleteCard(cardId: string): void {
    const card = this.cards.get(cardId);
    if (card) {
      this.cards.delete(cardId);
      this.cardManager.deleteCard(card);
      this.publishCardDeleted(card);
    }
  }

  /**
   * 카드 상태 변경 이벤트 발행
   */
  private publishCardStateChanged(cardId: string, state: CardState): void {
    this.eventBus.publish(EventType.CARD_STATE_CHANGED, {
      card: cardId,
      state: {
        ...state,
        activeCardId: state.isOpen ? cardId : null,
        focusedCardId: state.isFocused ? cardId : null,
        selectedCardIds: new Set(state.isSelected ? [cardId] : []),
        index: Array.from(this.cards.keys()).indexOf(cardId)
      }
    }, 'CardService');
  }

  /**
   * ID로 카드 가져오기
   */
  private getCardById(cardId: string): ICard | undefined {
    return this.cards.get(cardId);
  }

  /**
   * 카드 상태 업데이트
   */
  async updateCardState(cardId: string, state: Partial<CardState>): Promise<void> {
    const card = this.getCardById(cardId);
    if (!card) {
      this.errorBus.publish(ErrorCode.CARD_NOT_FOUND, {
        cardId,
        details: { message: '카드를 찾을 수 없습니다.' }
      }, 'CardService');
      return;
    }

    const currentState = card.getState();
    const newState = { ...currentState, ...state };
    card.setState(newState);

    this.publishCardStateChanged(cardId, newState);
  }

  /**
   * 카드 선택
   */
  selectCard(cardId: string): void {
    const card = this.cards.get(cardId);
    if (card) {
      this.cardManager.selectCard(card);
      this.eventBus.publish(EventType.CARD_SELECTED, { card: cardId });
    }
  }

  /**
   * 카드 선택 해제
   */
  deselectCard(cardId: string): void {
    const card = this.cards.get(cardId);
    if (card) {
      this.cardManager.deselectCard(card);
      this.eventBus.publish(EventType.CARD_DESELECTED, { card: cardId });
    }
  }

  /**
   * 모든 카드 선택 해제
   */
  deselectAllCards(): void {
    this.cardManager.deselectAllCards();
    this.eventBus.publish(EventType.CARDS_DESELECTED, {});
  }

  /**
   * 카드 포커스
   */
  focusCard(cardId: string): void {
    const card = this.cards.get(cardId);
    if (card) {
      this.cardManager.focusCard(card);
      this.eventBus.publish(EventType.CARD_FOCUSED, { card: cardId });
    }
  }

  /**
   * 카드 포커스 해제
   */
  unfocusCard(cardId: string): void {
    const card = this.cards.get(cardId);
    if (card) {
      this.cardManager.unfocusCard(card);
      this.eventBus.publish(EventType.CARD_UNFOCUSED, { card: cardId });
    }
  }

  /**
   * 카드 열기
   */
  openCard(cardId: string): void {
    const card = this.cards.get(cardId);
    if (card) {
      this.cardManager.openCard(card);
      this.eventBus.publish(EventType.CARD_OPENED, { card: cardId });
    }
  }

  /**
   * 카드 닫기
   */
  closeCard(cardId: string): void {
    const card = this.cards.get(cardId);
    if (card) {
      this.cardManager.closeCard(card);
      this.eventBus.publish(EventType.CARD_CLOSED, { card: cardId });
    }
  }

  /**
   * 카드 ID로 카드 조회
   */
  getCard(cardId: string): ICard | undefined {
    return this.cards.get(cardId);
  }

  /**
   * 서비스 정리
   */
  destroy(): void {
    this.cards.clear();
    this.eventBus.publish(EventType.CARD_SERVICE_DESTROYED, {});
  }

  /**
   * 카드 생성 이벤트 발행
   */
  private publishCardCreated(card: ICard): void {
    this.eventBus.publish(EventType.CARD_CREATED, {
      card: card.getId()
    }, 'CardService');
  }

  /**
   * 카드 업데이트 이벤트 발행
   */
  private publishCardUpdated(card: ICard): void {
    this.eventBus.publish(EventType.CARD_UPDATED, {
      card: card.getId()
    });
  }

  /**
   * 카드 삭제 이벤트 발행
   */
  private publishCardDeleted(card: ICard): void {
    this.eventBus.publish(EventType.CARD_DELETED, {
      card: card.getId()
    });
  }

  /**
   * 카드 제거 이벤트 발행
   */
  private publishCardDestroyed(cardId: string): void {
    this.eventBus.publish(EventType.CARD_DESTROYED, {
      cardId
    }, 'CardService');
  }

  /**
   * 카드 콘텐츠를 템플릿에 따라 가공하여 반환합니다.
   */
  formatCardContent(card: ICard, displaySettings?: ICardDisplaySettings): IFormattedCardContent {
    return {
      header: this.processContent(card, displaySettings?.headerContent),
      body: this.processContent(card, displaySettings?.bodyContent),
      footer: this.processContent(card, displaySettings?.footerContent)
    };
  }

  /**
   * 콘텐츠 타입에 따라 카드 내용을 처리합니다.
   */
  private processContent(card: ICard, contentType?: CardContentType | string): string {
    if (!contentType) {
      return this.getDefaultContent(card, contentType);
    }

    if (typeof contentType === 'string' && contentType.includes('{{')) {
      return this.processTemplate(card, contentType);
    }

    return this.getContentByType(card, contentType as CardContentType);
  }

  /**
   * 기본 콘텐츠를 반환합니다.
   */
  private getDefaultContent(card: ICard, contentType?: CardContentType | string): string {
    switch (contentType) {
      case 'header':
        return card.getHeaderContent();
      case 'body':
        return card.getBodyContent();
      case 'footer':
        return card.getFooterContent();
      default:
        return '';
    }
  }

  /**
   * 콘텐츠 타입에 따라 카드 내용을 가져옵니다.
   */
  private getContentByType(card: ICard, type: CardContentType): string {
    switch (type) {
      case 'filename':
        return card.filename;
      case 'title':
        return card.getTitle();
      case 'firstheader':
        return card.firstHeader || '';
      case 'content':
        return card.getContent();
      case 'tags':
        return this.formatTags(card.getTags());
      case 'path':
        return card.getPath();
      case 'created':
        return this.formatDate(card.getCreated(), card.displaySettings?.dateFormat);
      case 'modified':
        return this.formatDate(card.getUpdated(), card.displaySettings?.dateFormat);
      case 'frontmatter':
        return this.formatFrontmatter(card.frontmatter || {}, card.displaySettings?.frontmatterFormat);
      default:
        return '';
    }
  }

  /**
   * 템플릿 문자열을 처리합니다.
   */
  private processTemplate(card: ICard, template: string): string {
    return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
      const trimmedKey = key.trim();
      return this.getCardValue(card, trimmedKey);
    });
  }

  /**
   * 카드에서 지정된 키에 해당하는 값을 가져옵니다.
   */
  private getCardValue(card: ICard, key: string): string {
    switch (key) {
      case 'title':
        return card.getTitle();
      case 'filename':
        return card.filename;
      case 'content':
        return card.getContent();
      case 'path':
        return card.getPath();
      case 'tags':
        return this.formatTags(card.getTags());
      case 'created':
        return this.formatDate(card.getCreated(), card.displaySettings?.dateFormat);
      case 'modified':
        return this.formatDate(card.getUpdated(), card.displaySettings?.dateFormat);
      case 'firstheader':
        return card.firstHeader || '';
      default:
        if (key.startsWith('frontmatter.')) {
          const field = key.split('.')[1];
          return card.frontmatter?.[field]?.toString() || '';
        }
        return '';
    }
  }

  /**
   * 태그를 형식화합니다.
   */
  private formatTags(tags: string[]): string {
    return tags.length > 0 ? tags.map(tag => `#${tag}`).join(' ') : '';
  }

  /**
   * 날짜를 형식화합니다.
   */
  private formatDate(timestamp: number, settings?: IDateFormatSettings): string {
    const date = new Date(timestamp);

    if (!settings) {
      return date.toLocaleString();
    }

    if (settings.useRelativeTime) {
      const diff = Date.now() - timestamp;
      const seconds = Math.floor(diff / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);

      if (days > 0) return `${days}일 전`;
      if (hours > 0) return `${hours}시간 전`;
      if (minutes > 0) return `${minutes}분 전`;
      return `${seconds}초 전`;
    }

    try {
      return date.toLocaleString(settings.locale, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (error) {
      return date.toLocaleString();
    }
  }

  /**
   * 프론트매터를 형식화합니다.
   */
  private formatFrontmatter(frontmatter: Record<string, any>, settings?: IFrontmatterFormatSettings): string {
    if (!settings) {
      return JSON.stringify(frontmatter, null, 2);
    }

    const fields = settings.fields.length > 0 ? settings.fields : Object.keys(frontmatter);
    const formatField = (field: string) => {
      const label = settings.labels[field] || field;
      const value = frontmatter[field];
      return { label, value };
    };

    switch (settings.format) {
      case 'list':
        return fields
          .map(field => {
            const { label, value } = formatField(field);
            return `- ${label}: ${value}`;
          })
          .join('\n');

      case 'table':
        return fields
          .map(field => {
            const { label, value } = formatField(field);
            return `| ${label} | ${value} |`;
          })
          .join('\n');

      case 'inline':
        return fields
          .map(field => {
            const { label, value } = formatField(field);
            return `${label}: ${value}`;
          })
          .join(settings.separator || ' | ');

      default:
        return JSON.stringify(frontmatter, null, 2);
    }
  }
} 