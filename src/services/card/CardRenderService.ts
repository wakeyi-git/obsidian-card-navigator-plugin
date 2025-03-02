import { MarkdownRenderer, TFile } from 'obsidian';
import { Card } from '../../core/models/Card';
import { CardRenderOptions } from '../../core/types/card.types';
import { ICardRenderService } from '../../core/interfaces/ICardRenderService';
import { ErrorHandler } from '../../utils/error/ErrorHandler';
import { Log } from '../../utils/log/Log';
import { LAYOUT_CLASS_NAMES } from '../../styles/components/layout.styles';

/**
 * CardRenderService 클래스는 카드 렌더링 관련 기능을 제공합니다.
 */
export class CardRenderService implements ICardRenderService {
  private app: any;
  private isInitialized: boolean = false;
  private renderOptions: CardRenderOptions;

  /**
   * CardRenderService 생성자
   * @param app Obsidian 앱 인스턴스
   */
  constructor(app: any) {
    this.app = app;
    this.renderOptions = this.getDefaultRenderOptions();
    
    Log.debug('CardRenderService', '카드 렌더링 서비스 초기화 완료');
    this.isInitialized = true;
  }

  /**
   * 기본 렌더링 옵션을 가져옵니다.
   * @returns 기본 렌더링 옵션
   */
  private getDefaultRenderOptions(): CardRenderOptions {
    return {
      renderMarkdown: true,
      renderMathJax: true,
      renderCodeBlocks: true,
      renderImages: true,
      maxContentLength: 150,
      maxTitleLength: 50,
      maxTagsCount: 5,
      showCreationTime: true,
      showModificationTime: true,
      dateFormat: 'YYYY-MM-DD',
      truncateContent: true,
      truncationMarker: '...',
      enableLinkHover: true,
      enableImageZoom: true
    };
  }

  /**
   * 렌더링 옵션을 설정합니다.
   * @param options 렌더링 옵션
   */
  public setOptions(options: Partial<CardRenderOptions>): void {
    ErrorHandler.captureErrorSync(() => {
      this.renderOptions = { ...this.renderOptions, ...options };
      
      Log.debug('CardRenderService', '렌더링 옵션 설정 완료');
    }, 'RENDER_OPTIONS_SET_ERROR', {}, true);
  }

  /**
   * 현재 렌더링 옵션을 가져옵니다.
   * @returns 현재 렌더링 옵션
   */
  public getOptions(): CardRenderOptions {
    return { ...this.renderOptions };
  }

  /**
   * 카드 요소를 렌더링합니다.
   * @param card 카드
   * @param options 렌더링 옵션 (선택적)
   * @returns 카드 요소
   */
  public renderCard(card: Card, options?: Partial<CardRenderOptions>): HTMLElement {
    return ErrorHandler.captureErrorSync(() => {
      if (!this.isInitialized) {
        throw new Error('카드 렌더링 서비스가 초기화되지 않았습니다.');
      }
      
      // 렌더링 옵션 병합
      const mergedOptions = options ? { ...this.renderOptions, ...options } : this.renderOptions;
      
      // 카드 요소 생성
      const cardElement = document.createElement('div');
      cardElement.classList.add('card-navigator-card');
      cardElement.dataset.cardId = card.id;
      
      // 카드 헤더 렌더링
      const headerElement = this.renderCardTitle(card, mergedOptions);
      cardElement.appendChild(headerElement);
      
      // 카드 본문 렌더링
      const bodyElement = this.renderCardContent(card, mergedOptions);
      cardElement.appendChild(bodyElement);
      
      // 카드 푸터 렌더링
      const footerElement = this.renderCardFooter(card, mergedOptions);
      cardElement.appendChild(footerElement);
      
      Log.debug('CardRenderService', `카드 렌더링 완료: ${card.id}`);
      return cardElement;
    }, 'CARD_RENDER_ERROR', { cardId: card.id }, true) || this.createErrorCardElement(card);
  }

  /**
   * 오류 발생 시 표시할 카드 요소를 생성합니다.
   * @param card 카드 객체
   * @returns 오류 카드 요소
   */
  private createErrorCardElement(card: Card): HTMLElement {
    const errorCardElement = document.createElement('div');
    errorCardElement.classList.add('card-navigator-card', 'card-navigator-error');
    errorCardElement.dataset.cardId = card.id;
    errorCardElement.textContent = `카드 렌더링 오류: ${card.title || card.id}`;
    return errorCardElement;
  }

  /**
   * 카드 요소를 업데이트합니다.
   * @param element 업데이트할 카드 요소
   * @param card 카드 객체
   * @param options 렌더링 옵션 (선택적)
   */
  public updateCardElement(element: HTMLElement, card: Card, options?: Partial<CardRenderOptions>): void {
    ErrorHandler.captureErrorSync(() => {
      if (!element) return;
      
      // 렌더링 옵션 병합
      const mergedOptions = options ? { ...this.renderOptions, ...options } : this.renderOptions;
      
      // 기존 내용 제거
      element.innerHTML = '';
      
      // 카드 헤더 렌더링
      const headerElement = this.renderCardTitle(card, mergedOptions);
      element.appendChild(headerElement);
      
      // 카드 본문 렌더링
      const bodyElement = this.renderCardContent(card, mergedOptions);
      element.appendChild(bodyElement);
      
      // 카드 푸터 렌더링
      const footerElement = this.renderCardFooter(card, mergedOptions);
      element.appendChild(footerElement);
      
      Log.debug('CardRenderService', `카드 업데이트 완료: ${card.id}`);
    }, 'CARD_UPDATE_ERROR', { cardId: card.id }, true);
  }

  /**
   * 카드 제목을 렌더링합니다.
   * @param card 카드 객체
   * @param options 렌더링 옵션 (선택적)
   * @returns 제목 요소
   */
  public renderCardTitle(card: Card, options?: Partial<CardRenderOptions>): HTMLElement {
    return ErrorHandler.captureErrorSync(() => {
      const mergedOptions = options ? { ...this.renderOptions, ...options } : this.renderOptions;
      
      const headerElement = document.createElement('div');
      headerElement.classList.add('card-navigator-card-header');
      
      // 제목 렌더링
      const title = this.truncateText(card.title, mergedOptions.maxTitleLength, mergedOptions.truncationMarker);
      headerElement.textContent = title;
      
      return headerElement;
    }, 'CARD_TITLE_RENDER_ERROR', { cardId: card.id }, false) || this.createErrorElement('제목을 렌더링할 수 없습니다');
  }

  /**
   * 카드 내용을 렌더링합니다.
   * @param card 카드 객체
   * @param options 렌더링 옵션 (선택적)
   * @returns 내용 요소
   */
  public renderCardContent(card: Card, options?: Partial<CardRenderOptions>): HTMLElement {
    return ErrorHandler.captureErrorSync(() => {
      const mergedOptions = options ? { ...this.renderOptions, ...options } : this.renderOptions;
      
      const bodyElement = document.createElement('div');
      bodyElement.classList.add('card-navigator-card-body');
      
      // 내용 준비
      let content = card.content || '';
      if (mergedOptions.truncateContent) {
        content = this.truncateText(content, mergedOptions.maxContentLength, mergedOptions.truncationMarker);
      }
      
      // 마크다운 렌더링 여부 확인
      if (mergedOptions.renderMarkdown) {
        const renderedHtml = this.renderMarkdown(content, mergedOptions);
        bodyElement.innerHTML = renderedHtml;
        
        // 렌더링 옵션에 따라 요소 처리
        if (!mergedOptions.renderMathJax) {
          this.disableMathJax(bodyElement);
        }
        
        if (!mergedOptions.renderCodeBlocks) {
          this.disableCodeBlocks(bodyElement);
        }
        
        if (!mergedOptions.renderImages) {
          this.disableImages(bodyElement);
        }
        
        // 링크 호버 설정
        if (mergedOptions.enableLinkHover) {
          this.setupLinkHover(bodyElement);
        }
        
        // 이미지 줌 설정
        if (mergedOptions.enableImageZoom) {
          this.setupImageZoom(bodyElement);
        }
      } else {
        bodyElement.textContent = content;
      }
      
      return bodyElement;
    }, 'CARD_CONTENT_RENDER_ERROR', { cardId: card.id }, false) || this.createErrorElement('내용을 렌더링할 수 없습니다');
  }

  /**
   * 카드 푸터를 렌더링합니다.
   * @param card 카드 객체
   * @param options 렌더링 옵션 (선택적)
   * @returns 푸터 요소
   */
  public renderCardFooter(card: Card, options?: Partial<CardRenderOptions>): HTMLElement {
    return ErrorHandler.captureErrorSync(() => {
      const mergedOptions = options ? { ...this.renderOptions, ...options } : this.renderOptions;
      
      const footerElement = document.createElement('div');
      footerElement.classList.add('card-navigator-card-footer');
      
      // 태그 렌더링
      if (card.tags && card.tags.length > 0) {
        const tagsContainer = this.renderCardTags(card.tags, mergedOptions);
        footerElement.appendChild(tagsContainer);
      }
      
      // 날짜 정보 렌더링
      const dateContainer = document.createElement('div');
      dateContainer.classList.add('card-navigator-card-dates');
      
      // 생성 시간 표시
      if (mergedOptions.showCreationTime && card.creationTime) {
        const creationTimeElement = document.createElement('span');
        creationTimeElement.classList.add('card-navigator-card-creation-time');
        creationTimeElement.textContent = this.formatDate(card.creationTime, mergedOptions.dateFormat);
        dateContainer.appendChild(creationTimeElement);
      }
      
      // 수정 시간 표시
      if (mergedOptions.showModificationTime && card.modificationTime) {
        const modificationTimeElement = document.createElement('span');
        modificationTimeElement.classList.add('card-navigator-card-modification-time');
        modificationTimeElement.textContent = this.formatDate(card.modificationTime, mergedOptions.dateFormat);
        dateContainer.appendChild(modificationTimeElement);
      }
      
      footerElement.appendChild(dateContainer);
      
      return footerElement;
    }, 'CARD_FOOTER_RENDER_ERROR', { cardId: card.id }, false) || this.createErrorElement('푸터를 렌더링할 수 없습니다');
  }

  /**
   * 카드 태그를 렌더링합니다.
   * @param tags 태그 배열
   * @param options 렌더링 옵션 (선택적)
   * @returns 태그 컨테이너 요소
   */
  public renderCardTags(tags: string[], options?: Partial<CardRenderOptions>): HTMLElement {
    return ErrorHandler.captureErrorSync(() => {
      const mergedOptions = options ? { ...this.renderOptions, ...options } : this.renderOptions;
      
      const tagsContainer = document.createElement('div');
      tagsContainer.classList.add('card-navigator-card-tags');
      
      // 최대 태그 수 제한
      const tagsToShow = tags.slice(0, mergedOptions.maxTagsCount);
      
      // 각 태그 렌더링
      tagsToShow.forEach(tag => {
        const tagElement = document.createElement('span');
        tagElement.classList.add('card-navigator-card-tag');
        tagElement.textContent = tag.replace('#', '');
        tagsContainer.appendChild(tagElement);
      });
      
      // 추가 태그가 있는 경우 표시
      if (tags.length > mergedOptions.maxTagsCount) {
        const moreTagsElement = document.createElement('span');
        moreTagsElement.classList.add('card-navigator-card-tag', 'card-navigator-more-tags');
        moreTagsElement.textContent = `+${tags.length - mergedOptions.maxTagsCount}`;
        tagsContainer.appendChild(moreTagsElement);
      }
      
      return tagsContainer;
    }, 'CARD_TAGS_RENDER_ERROR', {}, false) || this.createErrorElement('태그를 렌더링할 수 없습니다');
  }

  /**
   * 마크다운 텍스트를 HTML로 렌더링합니다.
   * @param markdown 마크다운 텍스트
   * @param options 렌더링 옵션 (선택적)
   * @returns 렌더링된 HTML 문자열
   */
  public renderMarkdown(markdown: string, options?: Partial<CardRenderOptions>): string {
    return ErrorHandler.captureErrorSync(() => {
      if (!markdown) return '';
      
      // 간단한 마크다운 변환 (실제 구현에서는 더 복잡한 마크다운 파서 사용)
      let html = markdown
        .replace(/#{1,6}\s+([^\n]+)/g, '<h3>$1</h3>') // 헤더
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>') // 굵게
        .replace(/\*([^*]+)\*/g, '<em>$1</em>') // 기울임
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>') // 링크
        .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">') // 이미지
        .replace(/`([^`]+)`/g, '<code>$1</code>') // 인라인 코드
        .replace(/\n/g, '<br>'); // 줄바꿈
      
      return html;
    }, 'MARKDOWN_RENDER_ERROR', {}, false) || '';
  }

  /**
   * MathJax 요소를 비활성화합니다.
   * @param element 대상 요소
   */
  private disableMathJax(element: HTMLElement): void {
    const mathElements = element.querySelectorAll('.math');
    mathElements.forEach(mathElement => {
      mathElement.classList.add('disabled-math');
      mathElement.textContent = '[수식]';
    });
  }

  /**
   * 코드 블록을 비활성화합니다.
   * @param element 대상 요소
   */
  private disableCodeBlocks(element: HTMLElement): void {
    const codeBlocks = element.querySelectorAll('pre code');
    codeBlocks.forEach(codeBlock => {
      codeBlock.classList.add('disabled-code');
      codeBlock.textContent = '[코드 블록]';
    });
  }

  /**
   * 이미지를 비활성화합니다.
   * @param element 대상 요소
   */
  private disableImages(element: HTMLElement): void {
    const images = element.querySelectorAll('img');
    images.forEach(image => {
      const placeholder = document.createElement('span');
      placeholder.classList.add('disabled-image');
      placeholder.textContent = '[이미지]';
      
      if (image.parentNode) {
        image.parentNode.replaceChild(placeholder, image);
      }
    });
  }

  /**
   * 링크 호버 기능을 설정합니다.
   * @param element 대상 요소
   */
  private setupLinkHover(element: HTMLElement): void {
    const links = element.querySelectorAll('a.internal-link');
    links.forEach(link => {
      link.addEventListener('mouseenter', this.handleLinkHover.bind(this));
    });
  }

  /**
   * 링크 호버 이벤트 핸들러
   * @param event 마우스 이벤트
   */
  private handleLinkHover(event: MouseEvent): void {
    // 링크 호버 처리 로직
    const target = event.target as HTMLElement;
    if (target && target.tagName === 'A') {
      // 링크 미리보기 등의 기능 구현
    }
  }

  /**
   * 이미지 줌 기능을 설정합니다.
   * @param element 대상 요소
   */
  private setupImageZoom(element: HTMLElement): void {
    const images = element.querySelectorAll('img');
    images.forEach(image => {
      image.classList.add('zoomable');
      image.addEventListener('click', this.handleImageClick.bind(this));
    });
  }

  /**
   * 이미지 클릭 이벤트 핸들러
   * @param event 마우스 이벤트
   */
  private handleImageClick(event: MouseEvent): void {
    // 이미지 클릭 처리 로직
    const target = event.target as HTMLElement;
    if (target && target.tagName === 'IMG') {
      // 이미지 확대 기능 구현
    }
  }

  /**
   * 텍스트를 지정된 길이로 자릅니다.
   * @param text 원본 텍스트
   * @param maxLength 최대 길이
   * @param truncationMarker 자름 표시 (기본값: '...')
   * @returns 잘린 텍스트
   */
  private truncateText(text: string, maxLength: number, truncationMarker: string = '...'): string {
    if (!text) return '';
    
    if (text.length <= maxLength) {
      return text;
    }
    
    return text.substring(0, maxLength) + truncationMarker;
  }

  /**
   * 내용 요약을 가져옵니다.
   * @param content 원본 내용
   * @param maxLength 최대 길이
   * @returns 요약된 내용
   */
  public getContentSummary(content: string, maxLength: number): string {
    if (!content) return '';
    
    // 줄바꿈, 여러 공백 제거
    const cleanedContent = content
      .replace(/\n+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    return this.truncateText(cleanedContent, maxLength);
  }

  /**
   * 날짜를 포맷팅합니다.
   * @param timestamp 타임스탬프
   * @param format 날짜 포맷 (기본값: 'YYYY-MM-DD')
   * @returns 포맷팅된 날짜 문자열
   */
  private formatDate(timestamp: number, format: string = 'YYYY-MM-DD'): string {
    const date = new Date(timestamp);
    
    // 간단한 날짜 포맷팅 (실제 구현에서는 더 강력한 날짜 라이브러리 사용)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return format
      .replace('YYYY', String(year))
      .replace('MM', month)
      .replace('DD', day);
  }

  /**
   * 오류 요소를 생성합니다.
   * @param message 오류 메시지
   * @returns 오류 요소
   */
  private createErrorElement(message: string): HTMLElement {
    const errorElement = document.createElement('div');
    errorElement.classList.add('card-navigator-error');
    errorElement.textContent = message;
    return errorElement;
  }
}