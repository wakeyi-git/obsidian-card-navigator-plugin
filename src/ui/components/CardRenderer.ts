import { App } from 'obsidian';
import { Card } from '@/domain/models/Card';
import { ICardStyle } from '@/domain/models/Card';
import { DomainEventDispatcher } from '@/domain/events/DomainEventDispatcher';
import { CardRenderedEvent } from '@/domain/events/CardEvents';
import { MarkdownRenderer } from '@/domain/utils/markdownRenderer';
import { ICardRenderConfig } from '@/domain/models/Card';
import { Debouncer } from '@/domain/utils/Debouncer';
import { TFile } from 'obsidian';
import { ICardService } from '@/domain/services/ICardService';
import { LoggingService } from '@/infrastructure/services/LoggingService';

/**
 * 카드 렌더러 클래스
 * 카드 모델을 HTML 요소로 렌더링하는 클래스
 */
export class CardRenderer {
  private readonly markdownRenderer: MarkdownRenderer;
  private readonly app: App;
  private readonly eventDispatcher: DomainEventDispatcher;
  private readonly cardService: ICardService;
  private readonly loggingService: LoggingService;
  private renderQueue: Set<string> = new Set();
  private renderCache: Map<string, string> = new Map();
  private renderConfig: ICardRenderConfig;
  private isRendering: boolean = false;
  private renderDebouncer: Debouncer<[], Promise<void>>;

  constructor(
    app: App,
    eventDispatcher: DomainEventDispatcher,
    cardService: ICardService,
    loggingService: LoggingService
  ) {
    this.app = app;
    this.eventDispatcher = eventDispatcher;
    this.cardService = cardService;
    this.loggingService = loggingService;
    this.markdownRenderer = new MarkdownRenderer(app);
    this.renderConfig = {
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
        showFileName: true,
        showFirstHeader: false,
        showTags: false,
        showCreatedDate: false,
        showUpdatedDate: false,
        showProperties: [],
        renderMarkdown: true
      },
      renderAsHtml: true
    };

    this.renderDebouncer = new Debouncer(async () => {
      await this.processRenderQueue();
    }, 16);
  }

  /**
   * 렌더링 설정 업데이트
   */
  public updateRenderConfig(config: ICardRenderConfig): void {
    this.renderConfig = config;
    this.renderCache.clear();
  }

  /**
   * 카드 렌더링 (기본 메서드)
   * @param card 렌더링할 카드
   * @param style 적용할 스타일
   * @returns 렌더링된 HTML 요소
   */
  public async render(card: Card, style?: ICardStyle): Promise<HTMLElement> {
    return this._render(card, style);
  }

  /**
   * 카드 렌더링 (캐시 및 큐 처리 포함)
   * @param card 렌더링할 카드
   * @param style 적용할 스타일
   * @returns 렌더링된 HTML 요소
   */
  public async renderCard(card: Card, style?: ICardStyle): Promise<HTMLElement> {
    // 캐시된 렌더링 결과가 있는지 확인
    const cachedHtml = this.renderCache.get(card.id);
    if (cachedHtml) {
      const element = document.createElement('div');
      element.dataset.cardId = card.id;
      element.innerHTML = cachedHtml;
      if (style) {
        this._applyStyle(element, style);
      }
      return element;
    }

    // 렌더링 큐에 추가
    this.renderQueue.add(card.id);
    this.scheduleRender();

    // 임시 렌더링 결과 반환
    const element = document.createElement('div');
    element.dataset.cardId = card.id;
    element.innerHTML = this.renderPlaceholder(card);
    if (style) {
      this._applyStyle(element, style);
    }
    return element;
  }

  /**
   * 렌더링 스케줄링
   */
  private scheduleRender(): void {
    this.renderDebouncer.debounce();
  }

  /**
   * 렌더링 큐 처리
   */
  private async processRenderQueue(): Promise<void> {
    if (this.isRendering || this.renderQueue.size === 0) return;

    this.isRendering = true;
    const batchSize = 5;
    const cards = Array.from(this.renderQueue).slice(0, batchSize);

    try {
      await Promise.all(
        cards.map(async (cardId) => {
          const card = await this.cardService.getCardById(cardId);
          if (!card) return;

          const element = await this._render(card);
          const html = element.outerHTML;
          this.renderCache.set(cardId, html);
          this.renderQueue.delete(cardId);

          this.eventDispatcher.dispatch(new CardRenderedEvent(cardId, html));
        })
      );
    } finally {
      this.isRendering = false;
    }

    if (this.renderQueue.size > 0) {
      this.scheduleRender();
    }
  }

  /**
   * 카드 렌더링 (내부 구현)
   */
  private async _render(card: Card, style?: ICardStyle): Promise<HTMLElement> {
    try {
      // 카드 컨테이너 생성
      const cardElement = document.createElement('div');
      cardElement.dataset.cardId = card.id;
      
      // 기본 스타일 적용
      if (style) {
        this._applyStyle(cardElement, style);
      }
      
      // 헤더 렌더링
      const headerHtml = await this._renderHeader(card);
      const headerElement = document.createElement('div');
      headerElement.innerHTML = headerHtml;
      cardElement.appendChild(headerElement);
      
      // 바디 렌더링
      const bodyHtml = await this._renderBody(card);
      const bodyElement = document.createElement('div');
      bodyElement.innerHTML = bodyHtml;
      cardElement.appendChild(bodyElement);
      
      // 풋터 렌더링
      const footerHtml = await this._renderFooter(card);
      const footerElement = document.createElement('div');
      footerElement.innerHTML = footerHtml;
      cardElement.appendChild(footerElement);
      
      // 이벤트 리스너 등록
      this._attachEventListeners(cardElement, card);
      
      return cardElement;
    } catch (error) {
      console.error('카드 렌더링 중 오류 발생:', error);
      return this._createFallbackElement(card);
    }
  }

  /**
   * 헤더 렌더링
   */
  private async _renderHeader(card: Card): Promise<string> {
    const { header } = this.renderConfig;
    let html = '<div class="card-header">';
    
    if (header.showFileName) {
      html += `<div class="card-title">${card.fileName}</div>`;
    }
    
    if (header.showFirstHeader && card.firstHeader) {
      html += `<div class="card-first-header">${card.firstHeader}</div>`;
    }
    
    if (header.showTags && card.tags.length > 0) {
      html += `<div class="card-tags">${card.tags.map(tag => `<span class="card-tag">${tag}</span>`).join('')}</div>`;
    }
    
    html += '</div>';
    return html;
  }

  /**
   * 본문 렌더링
   */
  private async _renderBody(card: Card): Promise<string> {
    const { body } = this.renderConfig;
    let html = '<div class="card-body">';
    
    if (body.showContent) {
      let content = card.content;
      if (body.contentLength && body.contentLength > 0) {
        content = content.slice(0, body.contentLength) + '...';
      }
      
      if (body.renderMarkdown) {
        content = await this._renderMarkdown(content);
      }
      
      html += `<div class="card-content">${content}</div>`;
    }
    
    html += '</div>';
    return html;
  }

  /**
   * 푸터 렌더링
   */
  private async _renderFooter(card: Card): Promise<string> {
    const { footer } = this.renderConfig;
    let html = '<div class="card-footer">';
    
    if (footer.showFileName) {
      html += `<div class="card-file-name">${card.fileName}</div>`;
    }
    
    if (footer.showCreatedDate) {
      html += `<div class="card-created-date">${new Date(card.createdAt).toLocaleDateString()}</div>`;
    }
    
    if (footer.showUpdatedDate) {
      html += `<div class="card-updated-date">${new Date(card.updatedAt).toLocaleDateString()}</div>`;
    }
    
    html += '</div>';
    return html;
  }

  /**
   * 스타일 적용
   */
  private _applyStyle(element: HTMLElement, style: ICardStyle): void {
    // 카드 스타일
    if (style.card) {
      element.style.background = style.card.background;
      element.style.fontSize = style.card.fontSize;
      element.style.borderColor = style.card.borderColor;
      element.style.borderWidth = style.card.borderWidth;
    }
    
    // 헤더 스타일
    const headerElement = element.querySelector('.card-header') as HTMLElement;
    if (headerElement && style.header) {
      headerElement.style.background = style.header.background;
      headerElement.style.fontSize = style.header.fontSize;
      headerElement.style.borderColor = style.header.borderColor;
      headerElement.style.borderWidth = style.header.borderWidth;
    }
    
    // 바디 스타일
    const bodyElement = element.querySelector('.card-body') as HTMLElement;
    if (bodyElement && style.body) {
      bodyElement.style.background = style.body.background;
      bodyElement.style.fontSize = style.body.fontSize;
      bodyElement.style.borderColor = style.body.borderColor;
      bodyElement.style.borderWidth = style.body.borderWidth;
    }
    
    // 풋터 스타일
    const footerElement = element.querySelector('.card-footer') as HTMLElement;
    if (footerElement && style.footer) {
      footerElement.style.background = style.footer.background;
      footerElement.style.fontSize = style.footer.fontSize;
      footerElement.style.borderColor = style.footer.borderColor;
      footerElement.style.borderWidth = style.footer.borderWidth;
    }
  }

  /**
   * 임시 렌더링 결과 생성
   */
  private renderPlaceholder(card: Card): string {
    return `
      <div class="card-header">
        <div class="card-title">${card.fileName}</div>
      </div>
      <div class="card-body">
        <div class="card-content loading">로딩 중...</div>
      </div>
    `;
  }

  /**
   * 캐시 정리
   */
  public clearCache(): void {
    this.renderCache.clear();
    this.renderQueue.clear();
  }

  /**
   * 렌더러 정리
   */
  public cleanup(): void {
    this.renderDebouncer.cancel();
    this.clearCache();
  }

  /**
   * 파일로부터 카드 렌더링
   */
  public async renderCardFromFile(file: TFile): Promise<HTMLElement | null> {
    try {
      this.loggingService.debug('파일로부터 카드 요소 생성 시작:', file.path);

      const card = await this.cardService.createFromFile(file);
      if (!card) {
        this.loggingService.warn('카드를 생성할 수 없음');
        return null;
      }

      const cardElement = await this._render(card);
      if (!cardElement) {
        this.loggingService.warn('카드 요소를 생성할 수 없음');
        return null;
      }

      this.loggingService.debug('파일로부터 카드 요소 생성 완료');
      return cardElement;
    } catch (error) {
      this.loggingService.error('파일로부터 카드 요소 생성 실패:', error);
      throw error;
    }
  }

  private _attachEventListeners(element: HTMLElement, card: Card): void {
    element.addEventListener('click', () => {
      this.cardService.getCardById(card.id).then((updatedCard: Card | null) => {
        if (updatedCard) {
          updatedCard.setActive(true);
        }
      });
    });
    
    // 우클릭 이벤트
    element.addEventListener('contextmenu', (event: MouseEvent) => {
      event.preventDefault();
      // TODO: 컨텍스트 메뉴 구현
    });
    
    // 드래그 이벤트
    element.draggable = true;
    element.addEventListener('dragstart', (event: DragEvent) => {
      if (event.dataTransfer) {
        event.dataTransfer.setData('text/plain', card.id);
      }
    });
    
    element.addEventListener('dragover', (event: DragEvent) => {
      event.preventDefault();
      element.classList.add('drag-over');
    });
    
    element.addEventListener('dragleave', () => {
      element.classList.remove('drag-over');
    });
    
    element.addEventListener('drop', (event: DragEvent) => {
      event.preventDefault();
      element.classList.remove('drag-over');
      if (event.dataTransfer) {
        const sourceCardId = event.dataTransfer.getData('text/plain');
        // TODO: 링크 생성 구현
      }
    });
  }

  private _createFallbackElement(card: Card): HTMLElement {
    const fallbackElement = document.createElement('div');
    fallbackElement.className = 'card';
    fallbackElement.dataset.cardId = card.id;
    
    const headerElement = document.createElement('div');
    headerElement.className = 'card-header';
    headerElement.innerHTML = `
      <div class="card-title">${card.fileName}</div>
      ${card.firstHeader ? `<div class="card-first-header">${card.firstHeader}</div>` : ''}
    `;
    
    const bodyElement = document.createElement('div');
    bodyElement.className = 'card-body';
    bodyElement.innerHTML = '<div class="card-content">렌더링 실패</div>';
    
    const footerElement = document.createElement('div');
    footerElement.className = 'card-footer';
    footerElement.innerHTML = `
      <div class="card-tags">${card.tags.map(tag => `<span class="card-tag">${tag}</span>`).join('')}</div>
      <div class="card-date">${new Date(card.updatedAt).toLocaleDateString()}</div>
    `;
    
    fallbackElement.appendChild(headerElement);
    fallbackElement.appendChild(bodyElement);
    fallbackElement.appendChild(footerElement);
    
    return fallbackElement;
  }

  private async _renderMarkdown(content: string): Promise<string> {
    try {
      // 마크다운 렌더링 옵션 설정
      const renderOptions = {
        showImages: true,
        highlightCode: true,
        supportCallouts: true,
        supportMath: true,
        sanitize: true
      };
      
      // 마크다운 렌더링
      const renderedContent = await this.markdownRenderer.render(content, renderOptions);
      
      // 이미지 경로 수정
      return renderedContent.replace(
        /src="([^"]+)"/g,
        (match: string, src: string) => {
          const absolutePath = this.app.vault.adapter.getResourcePath(src);
          return `src="${absolutePath}"`;
        }
      );
    } catch (error) {
      console.error('마크다운 렌더링 중 오류 발생:', error);
      return content;
    }
  }

  /**
   * 카드 요소 업데이트
   */
  private async _updateCardElement(cardElement: HTMLElement, file: TFile): Promise<void> {
    try {
      this.loggingService.debug('카드 요소 업데이트 시작:', file.path);

      const cardId = cardElement.dataset.cardId;
      if (!cardId) {
        this.loggingService.warn('카드 ID를 찾을 수 없음');
        return;
      }

      const card = await this.cardService.getCardById(cardId);
      if (!card) {
        this.loggingService.warn('카드를 찾을 수 없음');
        return;
      }

      const updatedElement = await this._render(card);
      cardElement.innerHTML = updatedElement.innerHTML;
      this.loggingService.debug('카드 요소 업데이트 완료');
    } catch (error) {
      this.loggingService.error('카드 요소 업데이트 실패:', error);
      throw error;
    }
  }
} 