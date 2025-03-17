import { ICard } from '../../domain/card/Card';
import { ICardDisplaySettings } from '../../domain/card/Card';
import { ICardStyle } from '../../domain/card/Card';
import { DomainEventBus } from '../../core/events/DomainEventBus';
import { EventType } from '../../core/events/EventTypes';
import { DomainErrorBus } from '../../core/errors/DomainErrorBus';
import { ErrorCode } from '../../core/errors/ErrorTypes';
import { MarkdownRendererService } from '../../infrastructure/services/MarkdownRenderer';
import { App } from 'obsidian';

/**
 * 카드 컴포넌트
 * 카드의 UI를 렌더링하고 관리하는 컴포넌트입니다.
 */
export class CardComponent {
  private element: HTMLElement;
  private headerElement: HTMLElement;
  private bodyElement: HTMLElement;
  private footerElement: HTMLElement;
  private card: ICard;
  private displaySettings: ICardDisplaySettings;
  private style: ICardStyle;
  private isActive: boolean = false;
  private isFocused: boolean = false;
  private eventBus: DomainEventBus;
  private errorBus: DomainErrorBus;
  private renderer: MarkdownRendererService;

  constructor(
    card: ICard,
    displaySettings: ICardDisplaySettings,
    style: ICardStyle,
    renderer: MarkdownRendererService,
    eventBus: DomainEventBus,
    errorBus: DomainErrorBus
  ) {
    this.card = card;
    this.displaySettings = displaySettings;
    this.style = style;
    this.renderer = renderer;
    this.eventBus = eventBus;
    this.errorBus = errorBus;
    
    this.element = this.createCardElement();
    this.headerElement = this.createHeaderElement();
    this.bodyElement = this.createBodyElement();
    this.footerElement = this.createFooterElement();
    this.renderContent();
  }

  /**
   * 카드 요소 생성
   */
  private createCardElement(): HTMLElement {
    const element = document.createElement('div');
    element.className = 'card-navigator-card';
    element.dataset.cardId = this.card.getId();
    return element;
  }

  /**
   * 헤더 요소 생성
   */
  private createHeaderElement(): HTMLElement {
    const element = document.createElement('div');
    element.className = 'card-navigator-card-header';
    this.element.appendChild(element);
    return element;
  }

  /**
   * 본문 요소 생성
   */
  private createBodyElement(): HTMLElement {
    const element = document.createElement('div');
    element.className = 'card-navigator-card-body';
    this.element.appendChild(element);
    return element;
  }

  /**
   * 푸터 요소 생성
   */
  private createFooterElement(): HTMLElement {
    const element = document.createElement('div');
    element.className = 'card-navigator-card-footer';
    this.element.appendChild(element);
    return element;
  }

  /**
   * 카드 초기화
   */
  private async initializeCard(): Promise<void> {
    try {
      // 헤더 생성
      if (this.displaySettings.headerContent) {
        const header = await this.createHeader();
        this.element.appendChild(header);
      }

      // 본문 생성
      if (this.displaySettings.bodyContent) {
        const body = await this.createBody();
        this.element.appendChild(body);
      }

      // 푸터 생성
      if (this.displaySettings.footerContent) {
        const footer = await this.createFooter();
        this.element.appendChild(footer);
      }

      // 이벤트 리스너 등록
      this.registerEventListeners(this.element);

      this.eventBus.publish(EventType.CARD_CREATED, {
        card: this.card.getId()
      }, 'CardComponent');
    } catch (error) {
      this.errorBus.publish(ErrorCode.CARD_CREATION_FAILED, {
        cardData: this.card,
        cause: error instanceof Error ? error : new Error('알 수 없는 오류가 발생했습니다.')
      });
      throw error;
    }
  }

  /**
   * 헤더 요소 생성
   */
  private async createHeader(): Promise<HTMLElement> {
    const header = document.createElement('div');
    header.className = 'card-navigator-card-header';
    
    const content = this.getContentByType(this.displaySettings.headerContent);
    if (content) {
      if (this.displaySettings.renderingMode === 'markdown') {
        header.innerHTML = await this.renderer.render(content);
      } else if (this.displaySettings.renderingMode === 'html') {
        header.innerHTML = content;
      } else {
        header.textContent = content;
      }
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
  private async createBody(): Promise<HTMLElement> {
    const body = document.createElement('div');
    body.className = 'card-navigator-card-body';
    
    const content = this.getContentByType(this.displaySettings.bodyContent);
    if (content) {
      if (this.displaySettings.renderingMode === 'markdown') {
        body.innerHTML = await this.renderer.render(content);
      } else if (this.displaySettings.renderingMode === 'html') {
        body.innerHTML = content;
      } else {
        body.textContent = content;
      }
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
  private async createFooter(): Promise<HTMLElement> {
    const footer = document.createElement('div');
    footer.className = 'card-navigator-card-footer';
    
    const content = this.getContentByType(this.displaySettings.footerContent);
    if (content) {
      if (this.displaySettings.renderingMode === 'markdown') {
        footer.innerHTML = await this.renderer.render(content);
      } else if (this.displaySettings.renderingMode === 'html') {
        footer.innerHTML = content;
      } else {
        footer.textContent = content;
      }
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
  async update(card: ICard): Promise<void> {
    try {
      this.card = card;
      // innerHTML 대신 요소를 직접 제거하고 다시 생성
      while (this.element.firstChild) {
        this.element.removeChild(this.element.firstChild);
      }
      
      if (this.displaySettings.headerContent) {
        const header = await this.createHeader();
        this.element.appendChild(header);
      }
      if (this.displaySettings.bodyContent) {
        const body = await this.createBody();
        this.element.appendChild(body);
      }
      if (this.displaySettings.footerContent) {
        const footer = await this.createFooter();
        this.element.appendChild(footer);
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

  /**
   * 카드 내용을 렌더링합니다.
   */
  private async renderContent(): Promise<void> {
    try {
      const header = await this.renderer.render(this.card.getHeaderContent());
      const body = await this.renderer.render(this.card.getBodyContent());
      const footer = await this.renderer.render(this.card.getFooterContent());

      this.headerElement.innerHTML = header;
      this.bodyElement.innerHTML = body;
      this.footerElement.innerHTML = footer;

      this.eventBus.publish(EventType.CARD_RENDERED, {
        cardId: this.card.getId()
      });
    } catch (error) {
      this.errorBus.publish(ErrorCode.CARD_RENDER_FAILED, {
        cardId: this.card.getId(),
        cause: error instanceof Error ? error : new Error('알 수 없는 오류가 발생했습니다.')
      });
    }
  }
} 