import { MarkdownRenderer, TFile, App, Component } from 'obsidian';
import { Card } from '../../core/models/Card';
import { CardRenderOptions } from '../../core/types/card.types';
import { ThemeMode } from '../../core/types/common.types';
import { ICardRenderService } from '../../core/interfaces/service/ICardRenderService';
import { ErrorHandler } from '../../utils/error/ErrorHandler';
import { Log } from '../../utils/log/Log';
import { CARD_CLASS_NAMES } from '../../styles/components/card.styles';
import { ErrorCode } from '../../core/constants/error.constants';

/**
 * CardRenderService 클래스는 카드 렌더링 관련 기능을 제공합니다.
 */
export class CardRenderService extends Component implements ICardRenderService {
  private isInitialized: boolean = false;
  private renderOptions: CardRenderOptions;
  private themeChangeHandler: () => void;
  protected readonly app: App;

  /**
   * CardRenderService 생성자
   * @param app Obsidian 앱 인스턴스
   */
  constructor(app: App) {
    super();
    this.app = app;
    this.renderOptions = this.getDefaultRenderOptions();
    this.themeChangeHandler = this.handleThemeChange.bind(this);
  }

  /**
   * 컴포넌트가 로드될 때 호출됩니다.
   */
  onload(): void {
    super.onload();
    this.initialize();
  }

  /**
   * 컴포넌트가 언로드될 때 호출됩니다.
   */
  onunload(): void {
    super.onunload();
    this.destroy();
  }

  /**
   * 기본 렌더링 옵션을 가져옵니다.
   * @returns 기본 렌더링 옵션
   */
  private getDefaultRenderOptions(): CardRenderOptions {
    return {
      showFileName: true,
      showFirstHeader: true,
      showContent: true,
      maxBodyLength: 200,
      showTags: true,
      showCreationDate: true,
      showModificationDate: true,
      fileNameFontSize: 14,
      titleFontSize: 16,
      bodyFontSize: 14,
      tagsFontSize: 12,
      renderMarkdown: true,
      highlightCodeBlocks: true,
      renderMathEquations: true,
      showImages: true,
      themeMode: 'system',
      showEmptyTagsMessage: true,
      maxTagCount: 0,
      useTagColors: true,
      tagColorMap: {}
    };
  }

  /**
   * 서비스를 초기화합니다.
   * @param options 초기화 옵션
   */
  public initialize(options?: Partial<CardRenderOptions>): void {
    try {
      if (options) {
        this.setRenderOptions(options);
      }
      
      // 테마 변경 이벤트 리스너 등록
      this.registerEvent(
        this.app.workspace.on('css-change', this.themeChangeHandler)
      );
      
      this.isInitialized = true;
      Log.debug('CardRenderService', '카드 렌더링 서비스 초기화 완료');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      ErrorHandler.handleError('CardRenderService.initialize', `초기화 실패: ${errorMessage}`, true);
    }
  }

  /**
   * 렌더링 옵션을 설정합니다.
   * @param options 렌더링 옵션
   */
  public setRenderOptions(options: Partial<CardRenderOptions>): void {
    try {
      this.renderOptions = { ...this.renderOptions, ...options };
      Log.debug('CardRenderService', '렌더링 옵션 설정 완료');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      ErrorHandler.handleError('CardRenderService.setRenderOptions', `옵션 설정 실패: ${errorMessage}`, true);
    }
  }

  /**
   * 현재 렌더링 옵션을 가져옵니다.
   * @returns 현재 렌더링 옵션
   */
  public getRenderOptions(): CardRenderOptions {
    return { ...this.renderOptions };
  }

  /**
   * 카드 요소를 생성합니다.
   * @param card 카드 객체
   * @param options 렌더링 옵션 (선택적)
   * @returns 생성된 카드 HTML 요소
   */
  public createCardElement(card: Card, options?: Partial<CardRenderOptions>): HTMLElement {
    try {
      if (!this.isInitialized) {
        throw new Error('카드 렌더링 서비스가 초기화되지 않았습니다.');
      }
      
      const mergedOptions = options ? { ...this.renderOptions, ...options } : this.renderOptions;
      
      const cardElement = document.createElement('div');
      cardElement.classList.add(CARD_CLASS_NAMES.CARD.CONTAINER);
      cardElement.dataset.cardId = card.id;
      
      this.applyThemeClass(cardElement, mergedOptions);
      
      const headerElement = this.renderCardTitle(card, mergedOptions);
      cardElement.appendChild(headerElement);
      
      const bodyElement = this.renderCardContent(card, mergedOptions);
      cardElement.appendChild(bodyElement);
      
      const footerElement = this.renderCardFooter(card, mergedOptions);
      cardElement.appendChild(footerElement);
      
      Log.debug('CardRenderService', `카드 렌더링 완료: ${card.id}`);
      return cardElement;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      ErrorHandler.handleError('CardRenderService.createCardElement', `카드 생성 실패: ${card.id}, 오류: ${errorMessage}`, true);
      return this.createErrorCardElement(card);
    }
  }

  /**
   * 오류 발생 시 표시할 카드 요소를 생성합니다.
   * @param card 카드 객체
   * @returns 오류 카드 요소
   */
  private createErrorCardElement(card: Card): HTMLElement {
    const errorCardElement = document.createElement('div');
    errorCardElement.classList.add(CARD_CLASS_NAMES.CARD.CONTAINER, CARD_CLASS_NAMES.STATUS.ERROR);
    errorCardElement.dataset.cardId = card.id;
    errorCardElement.textContent = `카드 렌더링 오류: ${card.filename || card.id}`;
    return errorCardElement;
  }

  /**
   * 카드 요소를 업데이트합니다.
   * @param element 업데이트할 카드 요소
   * @param card 카드 객체
   * @param options 렌더링 옵션 (선택적)
   * @returns 업데이트된 카드 HTML 요소
   */
  public updateCardElement(element: HTMLElement, card: Card, options?: Partial<CardRenderOptions>): HTMLElement {
    try {
      if (!element) throw new Error('업데이트할 요소가 없습니다.');
      
      // 렌더링 옵션 병합
      const mergedOptions = options ? { ...this.renderOptions, ...options } : this.renderOptions;
      
      // 테마 클래스 적용
      this.applyThemeClass(element, mergedOptions);
      
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
      return element;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      ErrorHandler.handleError('CardRenderService.updateCardElement', `카드 업데이트 실패: ${card.id}, 오류: ${errorMessage}`, true);
      return this.createErrorCardElement(card);
    }
  }

  /**
   * 카드 요소에 스타일을 적용합니다.
   * @param element 스타일을 적용할 카드 요소
   * @param options 스타일 옵션
   */
  public applyCardStyle(element: HTMLElement, options?: Partial<CardRenderOptions>): void {
    try {
      if (!element) return;
      
      const mergedOptions = options ? { ...this.renderOptions, ...options } : this.renderOptions;
      
      // 테마 클래스 적용
      this.applyThemeClass(element, mergedOptions);
      
      // 헤더 스타일 적용
      const header = element.querySelector(`.${CARD_CLASS_NAMES.COMPONENTS.HEADER}`);
      if (header) {
        (header as HTMLElement).style.fontSize = `${mergedOptions.fileNameFontSize}px`;
      }
      
      // 본문 스타일 적용
      const body = element.querySelector(`.${CARD_CLASS_NAMES.COMPONENTS.BODY}`);
      if (body) {
        (body as HTMLElement).style.fontSize = `${mergedOptions.bodyFontSize}px`;
      }
      
      // 태그 스타일 적용
      const tags = element.querySelectorAll(`.${CARD_CLASS_NAMES.CONTENT.TAG}`);
      tags.forEach(tag => {
        (tag as HTMLElement).style.fontSize = `${mergedOptions.tagsFontSize}px`;
      });
      
      Log.debug('CardRenderService', '카드 스타일 적용 완료');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      ErrorHandler.handleError('CardRenderService.applyCardStyle', `스타일 적용 실패: ${errorMessage}`, false);
    }
  }

  /**
   * 카드 제목을 렌더링합니다.
   * @param card 카드 객체
   * @param options 렌더링 옵션 (선택적)
   * @returns 제목 요소
   */
  public renderCardTitle(card: Card, options?: Partial<CardRenderOptions>): HTMLElement {
    try {
      const mergedOptions = options ? { ...this.renderOptions, ...options } : this.renderOptions;
      
      const headerElement = document.createElement('div');
      headerElement.classList.add(CARD_CLASS_NAMES.COMPONENTS.HEADER);
      
      let title = '';
      if (mergedOptions.showFileName) {
        title = card.filename;
      } else if (mergedOptions.showFirstHeader && card.firstHeader) {
        title = card.firstHeader;
      } else {
        title = card.filename;
      }
      
      headerElement.textContent = this.truncateText(title, 50);
      
      return headerElement;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      ErrorHandler.handleError('CardRenderService.renderCardTitle', `제목 렌더링 실패: ${card.id}, 오류: ${errorMessage}`, false);
      return this.createErrorElement('제목을 렌더링할 수 없습니다');
    }
  }

  /**
   * 카드 내용을 렌더링합니다.
   * @param card 카드 객체
   * @param options 렌더링 옵션 (선택적)
   * @returns 내용 요소
   */
  public renderCardContent(card: Card, options?: Partial<CardRenderOptions>): HTMLElement {
    try {
      const mergedOptions = options ? { ...this.renderOptions, ...options } : this.renderOptions;
      
      const bodyElement = document.createElement('div');
      bodyElement.classList.add(CARD_CLASS_NAMES.COMPONENTS.BODY);
      
      if (!mergedOptions.showContent || !card.content) {
        return bodyElement;
      }
      
      let content = card.content || '';
      if (this.renderOptions.maxBodyLength > 0 && content.length > this.renderOptions.maxBodyLength) {
        content = content.substring(0, this.renderOptions.maxBodyLength) + '...';
      }
      
      if (mergedOptions.renderMarkdown) {
        const renderedHtml = this.renderMarkdown(content, card);
        bodyElement.innerHTML = renderedHtml;
        
        if (!mergedOptions.renderMathEquations) {
          this.disableMathJax(bodyElement);
        }
        
        if (!mergedOptions.highlightCodeBlocks) {
          this.disableCodeBlocks(bodyElement);
        }
        
        if (!mergedOptions.showImages) {
          this.disableImages(bodyElement);
        }
        
        this.setupLinkHover(bodyElement);
        this.setupImageZoom(bodyElement);
      } else {
        bodyElement.textContent = content;
      }
      
      return bodyElement;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      ErrorHandler.handleError('CardRenderService.renderCardContent', `내용 렌더링 실패: ${card.id}, 오류: ${errorMessage}`, false);
      return this.createErrorElement('내용을 렌더링할 수 없습니다');
    }
  }

  /**
   * 카드 푸터를 렌더링합니다.
   * @param card 카드 객체
   * @param options 렌더링 옵션 (선택적)
   * @returns 푸터 요소
   */
  public renderCardFooter(card: Card, options?: Partial<CardRenderOptions>): HTMLElement {
    try {
      const mergedOptions = options ? { ...this.renderOptions, ...options } : this.renderOptions;
      
      const footerElement = document.createElement('div');
      footerElement.classList.add(CARD_CLASS_NAMES.COMPONENTS.FOOTER);
      
      if (mergedOptions.showTags && card.tags && card.tags.length > 0) {
        const tagsContainer = this.renderCardTags(card.tags, mergedOptions);
        footerElement.appendChild(tagsContainer);
      }
      
      const dateContainer = document.createElement('div');
      dateContainer.classList.add(CARD_CLASS_NAMES.CONTENT.DATES);
      
      if (mergedOptions.showCreationDate && card.creationDate) {
        const creationTimeElement = document.createElement('span');
        creationTimeElement.classList.add(CARD_CLASS_NAMES.CONTENT.CREATION_TIME);
        creationTimeElement.textContent = this.formatDate(card.creationDate);
        dateContainer.appendChild(creationTimeElement);
      }
      
      if (mergedOptions.showModificationDate && card.modificationDate) {
        const modificationTimeElement = document.createElement('span');
        modificationTimeElement.classList.add(CARD_CLASS_NAMES.CONTENT.MODIFICATION_TIME);
        modificationTimeElement.textContent = this.formatDate(card.modificationDate);
        dateContainer.appendChild(modificationTimeElement);
      }
      
      footerElement.appendChild(dateContainer);
      
      return footerElement;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      ErrorHandler.handleError('CardRenderService.renderCardFooter', `푸터 렌더링 실패: ${card.id}, 오류: ${errorMessage}`, false);
      return this.createErrorElement('푸터를 렌더링할 수 없습니다');
    }
  }

  /**
   * 카드 태그를 렌더링합니다.
   * @param tags 태그 배열
   * @param options 렌더링 옵션 (선택적)
   * @returns 태그 컨테이너 요소
   */
  public renderCardTags(tags: string[], options?: Partial<CardRenderOptions>): HTMLElement {
    try {
      const mergedOptions = options ? { ...this.renderOptions, ...options } : this.renderOptions;
      
      const tagsContainer = document.createElement('div');
      tagsContainer.classList.add(CARD_CLASS_NAMES.CONTENT.TAGS);
      
      const maxTags = 5;
      const tagsToShow = tags.slice(0, maxTags);
      
      tagsToShow.forEach(tag => {
        const tagElement = document.createElement('span');
        tagElement.classList.add(CARD_CLASS_NAMES.CONTENT.TAG);
        tagElement.textContent = tag.replace('#', '');
        tagsContainer.appendChild(tagElement);
      });
      
      if (tags.length > maxTags) {
        const moreTagsElement = document.createElement('span');
        moreTagsElement.classList.add(CARD_CLASS_NAMES.CONTENT.TAG, CARD_CLASS_NAMES.CONTENT.MORE_TAGS);
        moreTagsElement.textContent = `+${tags.length - maxTags}`;
        tagsContainer.appendChild(moreTagsElement);
      }
      
      return tagsContainer;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      ErrorHandler.handleError('CardRenderService.renderCardTags', `태그 렌더링 실패: ${errorMessage}`, false);
      return this.createErrorElement('태그를 렌더링할 수 없습니다');
    }
  }

  /**
   * 마크다운 텍스트를 HTML로 렌더링합니다.
   * @param markdown 마크다운 텍스트
   * @param card 관련 카드 객체 (선택 사항)
   * @returns 렌더링된 HTML
   */
  public renderMarkdown(markdown: string, card?: Card): string {
    try {
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
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      ErrorHandler.handleError('CardRenderService.renderMarkdown', `마크다운 렌더링 실패: ${errorMessage}`, false);
      return '';
    }
  }

  /**
   * MathJax 요소를 비활성화합니다.
   * @param element 대상 요소
   */
  private disableMathJax(element: HTMLElement): void {
    const mathElements = element.querySelectorAll('.math');
    mathElements.forEach(mathElement => {
      mathElement.classList.add(CARD_CLASS_NAMES.DISABLED.MATH);
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
      codeBlock.classList.add(CARD_CLASS_NAMES.DISABLED.CODE);
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
      placeholder.classList.add(CARD_CLASS_NAMES.DISABLED.IMAGE);
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
      link.addEventListener('mouseenter', (event: Event) => {
        this.handleLinkHover(event as MouseEvent);
      });
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
      image.classList.add(CARD_CLASS_NAMES.INTERACTION.ZOOMABLE);
      image.addEventListener('click', (event: Event) => {
        this.handleImageClick(event as MouseEvent);
      });
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
    errorElement.classList.add(CARD_CLASS_NAMES.STATUS.ERROR);
    errorElement.textContent = message;
    return errorElement;
  }

  /**
   * 테마 변경 이벤트 핸들러
   */
  private handleThemeChange(): void {
    try {
      // 시스템 테마가 변경되었을 때 처리 로직
      Log.debug('CardRenderService', '테마 변경 감지됨');
      
      // 필요한 경우 여기서 카드 요소들을 업데이트할 수 있음
      // 예: 이벤트를 발생시켜 카드 컨테이너에 알림
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      ErrorHandler.handleError('CardRenderService.handleThemeChange', `테마 변경 처리 실패: ${errorMessage}`, false);
    }
  }

  /**
   * 서비스 정리
   * 렌더링 서비스가 사용한 리소스를 정리합니다.
   */
  public destroy(): void {
    try {
      this.isInitialized = false;
      Log.debug('CardRenderService', '카드 렌더링 서비스 정리 완료');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      ErrorHandler.handleError('CardRenderService.destroy', `정리 실패: ${errorMessage}`, true);
    }
  }

  /**
   * 시스템 테마 설정을 감지하고 적용합니다.
   * @returns 감지된 테마 모드 ('light' 또는 'dark')
   */
  private detectSystemTheme(): ThemeMode {
    try {
      // Obsidian API를 통해 현재 테마 모드 확인
      const isDarkMode = document.body.classList.contains('theme-dark');
      return isDarkMode ? 'dark' : 'light';
    } catch (error) {
      // 브라우저의 미디어 쿼리를 사용하여 시스템 테마 감지 (폴백)
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
      return 'light';
    }
  }

  /**
   * 현재 적용할 테마 모드를 가져옵니다.
   * @param options 렌더링 옵션
   * @returns 적용할 테마 모드 ('light' 또는 'dark')
   */
  private getEffectiveThemeMode(options?: Partial<CardRenderOptions>): ThemeMode {
    const mergedOptions = options ? { ...this.renderOptions, ...options } : this.renderOptions;
    
    // 'system' 설정인 경우 시스템 테마 감지
    if (mergedOptions.themeMode === 'system') {
      return this.detectSystemTheme();
    }
    
    return mergedOptions.themeMode;
  }

  /**
   * 카드 요소에 테마 클래스를 적용합니다.
   * @param element 카드 요소
   * @param options 렌더링 옵션
   */
  private applyThemeClass(element: HTMLElement, options?: Partial<CardRenderOptions>): void {
    try {
      const themeMode = this.getEffectiveThemeMode(options);
      
      // 기존 테마 클래스 제거
      element.classList.remove(
        CARD_CLASS_NAMES.THEME.LIGHT,
        CARD_CLASS_NAMES.THEME.DARK,
        CARD_CLASS_NAMES.THEME.SYSTEM
      );
      
      // 새 테마 클래스 추가
      element.classList.add(CARD_CLASS_NAMES.THEME[themeMode.toUpperCase() as keyof typeof CARD_CLASS_NAMES.THEME]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      ErrorHandler.handleError('CardRenderService.applyThemeClass', `테마 클래스 적용 실패: ${errorMessage}`, false);
    }
  }

  /**
   * 마크다운 텍스트를 HTML 문자열로 변환
   */
  public convertMarkdownToHtml(markdown: string, card?: Card): string {
    try {
      if (!markdown) return '';
      
      // 기존의 renderMarkdown 메서드 로직 재사용
      return this.renderMarkdown(markdown, card);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      ErrorHandler.handleError('CardRenderService.convertMarkdownToHtml', `마크다운 변환 실패: ${errorMessage}`, false);
      return '';
    }
  }

  /**
   * 마크다운 컨텐츠를 HTML 요소에 렌더링
   */
  public async renderMarkdownToElement(
    content: string,
    element: HTMLElement,
    sourcePath: string | null
  ): Promise<void> {
    try {
      if (!content || !element) return;
      
      await MarkdownRenderer.render(
        this.app,
        content,
        element,
        sourcePath || '',
        this
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      ErrorHandler.handleError('CardRenderService.renderMarkdownToElement', `마크다운 렌더링 실패: ${errorMessage}`, false);
    }
  }

  /**
   * 카드 객체의 컨텐츠를 렌더링
   */
  public renderCardContentFromCard(
    card: Card,
    options?: Partial<CardRenderOptions>
  ): HTMLElement {
    try {
      const mergedOptions = options ? { ...this.renderOptions, ...options } : this.renderOptions;
      return this.renderCardContent(card, mergedOptions);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      ErrorHandler.handleError('CardRenderService.renderCardContentFromCard', `카드 컨텐츠 렌더링 실패: ${errorMessage}`, false);
      return this.createErrorElement('카드 컨텐츠를 렌더링할 수 없습니다');
    }
  }

  /**
   * 문자열 컨텐츠를 HTML 요소에 렌더링
   */
  public async renderContentToElement(
    content: string,
    element: HTMLElement,
    options: CardRenderOptions,
    file: TFile | null
  ): Promise<void> {
    try {
      if (!content || !element) return;

      if (options.renderMarkdown && file) {
        await this.renderMarkdownToElement(content, element, file.path);
      } else {
        element.textContent = content;
      }

      if (options.renderMathEquations) {
        await this.renderMathEquations(element);
      }

      if (options.highlightCodeBlocks) {
        await this.highlightCodeBlocks(element);
      }

      if (options.showImages) {
        await this.renderImages(element, file?.path || '');
      }

      this.resizeRenderedContent(element, options);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      ErrorHandler.handleError('CardRenderService.renderContentToElement', `컨텐츠 렌더링 실패: ${errorMessage}`, false);
    }
  }

  /**
   * 수학 수식을 렌더링
   */
  public async renderMathEquations(element: HTMLElement): Promise<void> {
    try {
      const mathElements = element.querySelectorAll('.math');
      if (!mathElements.length) return;

      // Obsidian의 MathJax 렌더링 로직
      for (const mathElement of Array.from(mathElements)) {
        // MathJax 렌더링을 위해 Obsidian의 postProcessor 사용
        await this.app.workspace.trigger('math:render', mathElement);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      ErrorHandler.handleError('CardRenderService.renderMathEquations', `수식 렌더링 실패: ${errorMessage}`, false);
    }
  }

  /**
   * 코드 블록을 하이라이팅
   */
  public async highlightCodeBlocks(element: HTMLElement): Promise<void> {
    try {
      const codeBlocks = element.querySelectorAll('pre code');
      if (!codeBlocks.length) return;

      for (const codeBlock of Array.from(codeBlocks)) {
        const language = codeBlock.className.replace('language-', '');
        
        // Obsidian의 코드 하이라이팅 이벤트 트리거
        await this.app.workspace.trigger('code-block:render', codeBlock, language);
        
        // 코드 블록에 복사 버튼 추가
        this.addCopyButton(codeBlock as HTMLElement);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      ErrorHandler.handleError('CardRenderService.highlightCodeBlocks', `코드 하이라이팅 실패: ${errorMessage}`, false);
    }
  }

  /**
   * 코드 블록에 복사 버튼 추가
   */
  private addCopyButton(codeBlock: HTMLElement): void {
    const copyButton = document.createElement('button');
    copyButton.className = CARD_CLASS_NAMES.INTERACTION.COPY_BUTTON;
    copyButton.textContent = '복사';
    copyButton.onclick = async () => {
      try {
        await navigator.clipboard.writeText(codeBlock.textContent || '');
        copyButton.textContent = '복사됨';
        setTimeout(() => {
          copyButton.textContent = '복사';
        }, 2000);
      } catch (error) {
        copyButton.textContent = '복사 실패';
      }
    };
    
    const wrapper = document.createElement('div');
    wrapper.className = CARD_CLASS_NAMES.COMPONENTS.CODE_WRAPPER;
    codeBlock.parentNode?.insertBefore(wrapper, codeBlock);
    wrapper.appendChild(codeBlock);
    wrapper.appendChild(copyButton);
  }

  /**
   * 이미지를 렌더링
   */
  public async renderImages(element: HTMLElement, basePath: string): Promise<void> {
    try {
      const images = element.querySelectorAll('img');
      if (!images.length) return;

      for (const img of Array.from(images)) {
        const src = img.getAttribute('src');
        if (!src) continue;

        // 상대 경로를 절대 경로로 변환
        const absolutePath = this.resolveImagePath(src, basePath);
        
        try {
          // Obsidian의 이미지 처리 API를 사용하여 이미지 로드
          const imageFile = this.app.vault.getAbstractFileByPath(absolutePath);
          if (imageFile && imageFile instanceof TFile) {
            const imageUrl = await this.app.vault.adapter.getResourcePath(imageFile.path);
            img.src = imageUrl;
            
            // 이미지 로드 이벤트 처리
            img.onload = () => this.handleImageLoad(img as HTMLImageElement);
            img.onerror = () => this.handleImageError(img as HTMLImageElement);
            
            // 이미지 클릭 이벤트 설정
            this.setupImageInteraction(img as HTMLImageElement);
          }
        } catch (imageError) {
          // 이미지 로드 실패 시 플레이스홀더로 대체
          this.replaceWithPlaceholder(img as HTMLImageElement);
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      ErrorHandler.handleError('CardRenderService.renderImages', `이미지 렌더링 실패: ${errorMessage}`, false);
    }
  }

  /**
   * 이미지 경로 해석
   */
  private resolveImagePath(src: string, basePath: string): string {
    if (src.startsWith('http://') || src.startsWith('https://')) {
      return src;
    }
    
    const baseDir = basePath.split('/').slice(0, -1).join('/');
    return src.startsWith('/') ? src.slice(1) : `${baseDir}/${src}`;
  }

  /**
   * 이미지 로드 성공 처리
   */
  private handleImageLoad(img: HTMLImageElement): void {
    img.classList.add(CARD_CLASS_NAMES.STATUS.LOADED);
    this.resizeImage(img);
  }

  /**
   * 이미지 로드 실패 처리
   */
  private handleImageError(img: HTMLImageElement): void {
    this.replaceWithPlaceholder(img);
  }

  /**
   * 이미지를 플레이스홀더로 대체
   */
  private replaceWithPlaceholder(img: HTMLImageElement): void {
    const placeholder = document.createElement('div');
    placeholder.className = CARD_CLASS_NAMES.STATUS.IMAGE_ERROR;
    placeholder.textContent = '[이미지 로드 실패]';
    img.parentNode?.replaceChild(placeholder, img);
  }

  /**
   * 이미지 크기 조정
   */
  private resizeImage(img: HTMLImageElement): void {
    const maxWidth = 300; // 최대 너비
    const maxHeight = 200; // 최대 높이
    
    if (img.naturalWidth > maxWidth || img.naturalHeight > maxHeight) {
      const ratio = Math.min(maxWidth / img.naturalWidth, maxHeight / img.naturalHeight);
      img.style.width = `${img.naturalWidth * ratio}px`;
      img.style.height = `${img.naturalHeight * ratio}px`;
    }
  }

  /**
   * 이미지 상호작용 설정
   */
  private setupImageInteraction(img: HTMLImageElement): void {
    img.classList.add(CARD_CLASS_NAMES.INTERACTION.ZOOMABLE);
    img.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // 이미지 확대/축소 모달 표시
      this.app.workspace.trigger('image:zoom', img);
    };
  }

  /**
   * 렌더링된 요소의 크기를 조정
   */
  public resizeRenderedContent(element: HTMLElement, options: CardRenderOptions): void {
    try {
      // 컨텐츠 크기 조정 로직
      if (options.maxBodyLength > 0) {
        const content = element.textContent || '';
        if (content.length > options.maxBodyLength) {
          element.textContent = this.truncateText(content, options.maxBodyLength);
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      ErrorHandler.handleError('CardRenderService.resizeRenderedContent', `컨텐츠 크기 조정 실패: ${errorMessage}`, false);
    }
  }
}