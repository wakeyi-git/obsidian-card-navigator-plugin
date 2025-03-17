import { ICard } from '../../domain/card/Card';
import { ICardDisplaySettings } from '../../domain/card/Card';
import { ICardStyle } from '../../domain/card/Card';
import { DomainEventBus } from '../../core/events/DomainEventBus';
import { EventType } from '../../core/events/EventTypes';
import { DomainErrorBus } from '../../core/errors/DomainErrorBus';
import { ErrorCode } from '../../core/errors/ErrorTypes';

/**
 * 카드 컴포넌트
 * 카드의 UI를 렌더링하고 관리하는 컴포넌트입니다.
 */
export class CardComponent {
  private element: HTMLElement;
  private card: ICard;
  private displaySettings: ICardDisplaySettings;
  private style: ICardStyle;
  private isActive: boolean = false;
  private isFocused: boolean = false;
  private eventBus: DomainEventBus;
  private errorBus: DomainErrorBus;

  constructor(
    card: ICard,
    displaySettings: ICardDisplaySettings,
    style: ICardStyle
  ) {
    this.eventBus = DomainEventBus.getInstance();
    this.errorBus = DomainErrorBus.getInstance();
    
    try {
      this.card = card;
      this.displaySettings = displaySettings;
      this.style = style;
      this.element = this.createCardElement();
    } catch (error) {
      this.errorBus.publish(ErrorCode.CARD_CREATION_FAILED, {
        cardData: card,
        cause: error instanceof Error ? error : new Error('알 수 없는 오류가 발생했습니다.')
      });
      throw error;
    }
  }

  /**
   * 카드 요소 생성
   */
  private createCardElement(): HTMLElement {
    const element = document.createElement('div');
    element.className = 'card-navigator-card';
    element.dataset.cardId = this.card.getId();
    
    // 헤더 생성
    if (this.displaySettings.headerContent) {
      const header = this.createHeader();
      element.appendChild(header);
    }

    // 본문 생성
    if (this.displaySettings.bodyContent) {
      const body = this.createBody();
      element.appendChild(body);
    }

    // 푸터 생성
    if (this.displaySettings.footerContent) {
      const footer = this.createFooter();
      element.appendChild(footer);
    }

    // 이벤트 리스너 등록
    this.registerEventListeners(element);

    return element;
  }

  /**
   * 헤더 요소 생성
   */
  private createHeader(): HTMLElement {
    const header = document.createElement('div');
    header.className = 'card-navigator-card-header';
    
    const content = this.getContentByType(this.displaySettings.headerContent);
    if (content) {
      header.textContent = content;
    }

    // 스타일 적용
    if (this.style.header) {
      this.applyStyle(header, this.style.header);
    }

    return header;
  }

  /**
   * 본문 요소 생성
   */
  private createBody(): HTMLElement {
    const body = document.createElement('div');
    body.className = 'card-navigator-card-body';
    
    const content = this.getContentByType(this.displaySettings.bodyContent);
    if (content) {
      body.textContent = content;
    }

    // 스타일 적용
    if (this.style.body) {
      this.applyStyle(body, this.style.body);
    }

    return body;
  }

  /**
   * 푸터 요소 생성
   */
  private createFooter(): HTMLElement {
    const footer = document.createElement('div');
    footer.className = 'card-navigator-card-footer';
    
    const content = this.getContentByType(this.displaySettings.footerContent);
    if (content) {
      footer.textContent = content;
    }

    // 스타일 적용
    if (this.style.footer) {
      this.applyStyle(footer, this.style.footer);
    }

    return footer;
  }

  /**
   * 콘텐츠 타입에 따른 내용 반환
   */
  private getContentByType(contentType: string | undefined): string {
    if (!contentType) return '';

    switch (contentType) {
      case 'filename':
        return this.card.getTitle();
      case 'firstheader':
        return this.card.firstHeader || '';
      case 'content':
        return this.card.getContent();
      case 'tags':
        return this.card.getTags().map(tag => `#${tag}`).join(' ');
      case 'path':
        return this.card.getPath();
      case 'created':
        return new Date(this.card.getCreated()).toLocaleDateString();
      case 'modified':
        return new Date(this.card.getUpdated()).toLocaleDateString();
      case 'frontmatter':
        return this.formatFrontmatter(this.card.getMetadata());
      default:
        return this.card.getMetadata()?.[contentType] || '';
    }
  }

  /**
   * 프론트매터 포맷팅
   */
  private formatFrontmatter(metadata: Record<string, any>): string {
    return Object.entries(metadata)
      .filter(([key]) => key !== 'tags')
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');
  }

  /**
   * 스타일 적용
   */
  private applyStyle(element: HTMLElement, style: any): void {
    if (style.backgroundColor) {
      element.style.backgroundColor = style.backgroundColor;
    }
    if (style.fontSize) {
      element.style.fontSize = `${style.fontSize}px`;
    }
    if (style.borderStyle) {
      element.style.borderStyle = style.borderStyle;
    }
    if (style.borderColor) {
      element.style.borderColor = style.borderColor;
    }
    if (style.borderWidth) {
      element.style.borderWidth = `${style.borderWidth}px`;
    }
    if (style.borderRadius) {
      element.style.borderRadius = `${style.borderRadius}px`;
    }
  }

  /**
   * 이벤트 리스너 등록
   */
  private registerEventListeners(element: HTMLElement): void {
    // 클릭 이벤트
    element.addEventListener('click', () => {
      this.onClick();
    });

    // 더블 클릭 이벤트
    element.addEventListener('dblclick', () => {
      this.onDoubleClick();
    });

    // 컨텍스트 메뉴 이벤트
    element.addEventListener('contextmenu', (e) => {
      this.onContextMenu(e);
    });
  }

  /**
   * 클릭 이벤트 핸들러
   */
  private onClick(): void {
    this.eventBus.publish(EventType.CARD_CLICKED, {
      card: this.card.getId()
    }, 'CardComponent');
  }

  /**
   * 더블 클릭 이벤트 핸들러
   */
  private onDoubleClick(): void {
    this.eventBus.publish(EventType.CARD_DOUBLE_CLICKED, {
      card: this.card.getId()
    }, 'CardComponent');
  }

  /**
   * 컨텍스트 메뉴 이벤트 핸들러
   */
  private onContextMenu(e: MouseEvent): void {
    e.preventDefault();
    this.eventBus.publish(EventType.CARD_CONTEXT_MENU, {
      card: this.card.getId()
    }, 'CardComponent');
  }

  /**
   * 카드 활성화
   */
  setActive(active: boolean): void {
    this.isActive = active;
    this.updateCardStyle();
  }

  /**
   * 카드 포커스
   */
  setFocused(focused: boolean): void {
    this.isFocused = focused;
    this.updateCardStyle();
  }

  /**
   * 카드 스타일 업데이트
   */
  private updateCardStyle(): void {
    const style = this.isFocused
      ? this.style.focused
      : this.isActive
      ? this.style.active
      : this.style.normal;

    if (style) {
      this.applyStyle(this.element, style);
    }
  }

  /**
   * 카드 요소 가져오기
   */
  getElement(): HTMLElement {
    return this.element;
  }

  /**
   * 카드 가져오기
   */
  getCard(): ICard {
    return this.card;
  }

  /**
   * 카드 업데이트
   */
  update(card: ICard): void {
    try {
      this.card = card;
      // innerHTML 대신 요소를 직접 제거하고 다시 생성
      while (this.element.firstChild) {
        this.element.removeChild(this.element.firstChild);
      }
      
      if (this.displaySettings.headerContent) {
        this.element.appendChild(this.createHeader());
      }
      if (this.displaySettings.bodyContent) {
        this.element.appendChild(this.createBody());
      }
      if (this.displaySettings.footerContent) {
        this.element.appendChild(this.createFooter());
      }

      this.eventBus.publish(EventType.CARD_UPDATED, {
        card: card.getId()
      }, 'CardComponent');
    } catch (error) {
      this.errorBus.publish(ErrorCode.CARD_UPDATE_FAILED, {
        cardId: card.getId(),
        updates: {},
        cause: error instanceof Error ? error : new Error('알 수 없는 오류가 발생했습니다.')
      });
      throw error;
    }
  }

  /**
   * 카드 제거
   */
  destroy(): void {
    try {
      this.element.remove();
      this.eventBus.publish(EventType.CARD_DESTROYED, {
        cardId: this.card.getId()
      }, 'CardComponent');
    } catch (error) {
      this.errorBus.publish(ErrorCode.CARD_DELETION_FAILED, {
        cardId: this.card.getId(),
        cause: error instanceof Error ? error : new Error('알 수 없는 오류가 발생했습니다.')
      });
      throw error;
    }
  }
} 