import { MarkdownRenderer } from 'obsidian';
import { ICard, CardRenderingMode, CardContentType } from '../../domain/card/Card';
import { ISettingsService } from '../../domain/settings/SettingsInterfaces';
import { ObsidianService } from '../core/ObsidianService';

/**
 * 카드 렌더링 서비스 인터페이스
 */
export interface ICardRenderingService {
  /**
   * 카드 렌더링
   * @param card 카드
   * @param container 컨테이너 요소
   */
  renderCard(card: ICard, container: HTMLElement): void;
  
  /**
   * 카드 헤더 렌더링
   * @param card 카드
   * @param container 컨테이너 요소
   */
  renderHeader(card: ICard, container: HTMLElement): void;
  
  /**
   * 카드 본문 렌더링
   * @param card 카드
   * @param container 컨테이너 요소
   */
  renderBody(card: ICard, container: HTMLElement): void;
  
  /**
   * 카드 푸터 렌더링
   * @param card 카드
   * @param container 컨테이너 요소
   */
  renderFooter(card: ICard, container: HTMLElement): void;
  
  /**
   * 카드 콘텐츠 렌더링
   * @param card 카드
   * @param contentType 콘텐츠 타입
   * @param container 컨테이너 요소
   * @param renderingMode 렌더링 모드
   */
  renderContent(card: ICard, contentType: CardContentType, container: HTMLElement, renderingMode?: CardRenderingMode): void;
  
  /**
   * 캐시 초기화
   */
  clearCache(): void;
}

// 캐시 키 생성 함수
const createCacheKey = (cardId: string, contentType: string, renderingMode: string): string => {
  return `${cardId}:${contentType}:${renderingMode}`;
};

/**
 * 카드 렌더링 서비스
 * 카드 렌더링 관련 기능을 관리합니다.
 */
export class CardRenderingService implements ICardRenderingService {
  private obsidianService: ObsidianService;
  private settingsService: ISettingsService;
  
  // 콘텐츠 렌더링 결과 캐시
  private contentCache: Map<string, string> = new Map();
  
  /**
   * 생성자
   * @param obsidianService Obsidian 서비스
   * @param settingsService 설정 서비스
   */
  constructor(obsidianService: ObsidianService, settingsService: ISettingsService) {
    this.obsidianService = obsidianService;
    this.settingsService = settingsService;
  }
  
  /**
   * 캐시 초기화
   */
  clearCache(): void {
    this.contentCache.clear();
  }
  
  /**
   * 카드 렌더링
   * @param card 카드
   * @param container 컨테이너 요소
   */
  renderCard(card: ICard, container: HTMLElement): void {
    this.renderHeader(card, container);
    this.renderBody(card, container);
    this.renderFooter(card, container);
  }
  
  /**
   * 카드 헤더 렌더링
   * @param card 카드
   * @param container 컨테이너 요소
   */
  renderHeader(card: ICard, container: HTMLElement): void {
    const headerContainer = container.createDiv({ cls: 'card-header' });
    
    // 헤더 스타일 적용
    const headerStyle = card.displaySettings?.cardStyle?.header;
    if (headerStyle) {
      if (headerStyle.backgroundColor) headerContainer.style.backgroundColor = headerStyle.backgroundColor;
      if (headerStyle.fontSize) headerContainer.style.fontSize = `${headerStyle.fontSize}px`;
      if (headerStyle.borderStyle) headerContainer.style.borderStyle = headerStyle.borderStyle;
      if (headerStyle.borderColor) headerContainer.style.borderColor = headerStyle.borderColor;
      if (headerStyle.borderWidth) headerContainer.style.borderWidth = `${headerStyle.borderWidth}px`;
      if (headerStyle.borderRadius) headerContainer.style.borderRadius = `${headerStyle.borderRadius}px`;
    }
    
    // 설정에서 다중 콘텐츠 타입 가져오기
    const settings = this.settingsService.getSettings();
    const headerContentMultiple = settings.cardHeaderContentMultiple?.filter(item => item !== 'none') || [];
    
    // 다중 콘텐츠 타입이 있는 경우
    if (headerContentMultiple.length > 0) {
      // 각 콘텐츠 타입에 대해 렌더링
      const contentElements: HTMLElement[] = [];
      
      for (const contentType of headerContentMultiple) {
        const contentEl = headerContainer.createDiv({ cls: 'card-header-content-item' });
        this.renderContent(card, contentType, contentEl);
        
        // 내용이 있는 경우에만 추가
        if (contentEl.textContent && contentEl.textContent.trim() !== '') {
          contentElements.push(contentEl);
        } else {
          contentEl.remove();
        }
      }
      
      // 콘텐츠 요소들 사이에 구분자 추가
      if (contentElements.length > 1) {
        for (let i = 0; i < contentElements.length - 1; i++) {
          contentElements[i].style.marginBottom = '4px';
        }
      }
    } 
    // 단일 콘텐츠 타입인 경우
    else {
      const headerContent = card.displaySettings?.headerContent;
      if (headerContent) {
        this.renderContent(card, headerContent, headerContainer);
      }
    }
  }
  
  /**
   * 카드 본문 렌더링
   * @param card 카드
   * @param container 컨테이너 요소
   */
  renderBody(card: ICard, container: HTMLElement): void {
    const bodyContainer = container.createDiv({ cls: 'card-body' });
    
    // 설정에서 카드 높이 가져오기
    const settings = this.settingsService.getSettings();
    const layoutSettings = settings.layout || {
      cardThresholdHeight: 150
    };
    
    // 본문 최소 높이 계산 (헤더와 푸터 높이를 고려)
    const headerFooterHeight = 60; // 헤더와 푸터의 대략적인 높이 (패딩 포함)
    const minBodyHeight = Math.max(20, layoutSettings.cardThresholdHeight - headerFooterHeight);
    
    // 본문 최소 높이 설정
    bodyContainer.style.minHeight = `${minBodyHeight}px`;
    
    // 본문 스타일 적용
    const bodyStyle = card.displaySettings?.cardStyle?.body;
    if (bodyStyle) {
      if (bodyStyle.backgroundColor) bodyContainer.style.backgroundColor = bodyStyle.backgroundColor;
      if (bodyStyle.fontSize) bodyContainer.style.fontSize = `${bodyStyle.fontSize}px`;
      if (bodyStyle.borderStyle) bodyContainer.style.borderStyle = bodyStyle.borderStyle;
      if (bodyStyle.borderColor) bodyContainer.style.borderColor = bodyStyle.borderColor;
      if (bodyStyle.borderWidth) bodyContainer.style.borderWidth = `${bodyStyle.borderWidth}px`;
      if (bodyStyle.borderRadius) bodyContainer.style.borderRadius = `${bodyStyle.borderRadius}px`;
    }
    
    // 기본 스타일 설정
    bodyContainer.style.padding = '10px';
    bodyContainer.style.flex = '1';
    bodyContainer.style.overflow = 'auto';
    
    // 설정에서 다중 콘텐츠 타입 가져오기
    const bodyContentMultiple = settings.cardBodyContentMultiple?.filter(item => item !== 'none') || [];
    
    // 다중 콘텐츠 타입이 있는 경우
    if (bodyContentMultiple.length > 0) {
      // 각 콘텐츠 타입에 대해 렌더링
      const contentElements: HTMLElement[] = [];
      
      for (const contentType of bodyContentMultiple) {
        const contentEl = bodyContainer.createDiv({ cls: 'card-body-content-item' });
        this.renderContent(card, contentType, contentEl);
        
        // 내용이 있는 경우에만 추가
        if (contentEl.textContent && contentEl.textContent.trim() !== '') {
          contentElements.push(contentEl);
        } else {
          contentEl.remove();
        }
      }
      
      // 콘텐츠 요소들 사이에 구분자 추가
      if (contentElements.length > 1) {
        for (let i = 0; i < contentElements.length - 1; i++) {
          contentElements[i].style.marginBottom = '8px';
        }
      }
    } 
    // 단일 콘텐츠 타입인 경우
    else {
      const bodyContent = card.displaySettings?.bodyContent;
      if (bodyContent) {
        this.renderContent(card, bodyContent, bodyContainer);
      }
    }
  }
  
  /**
   * 카드 푸터 렌더링
   * @param card 카드
   * @param container 컨테이너 요소
   */
  renderFooter(card: ICard, container: HTMLElement): void {
    const footerContainer = container.createDiv({ cls: 'card-footer' });
    
    // 푸터 스타일 적용
    const footerStyle = card.displaySettings?.cardStyle?.footer;
    if (footerStyle) {
      if (footerStyle.backgroundColor) footerContainer.style.backgroundColor = footerStyle.backgroundColor;
      if (footerStyle.fontSize) footerContainer.style.fontSize = `${footerStyle.fontSize}px`;
      if (footerStyle.borderStyle) footerContainer.style.borderStyle = footerStyle.borderStyle;
      if (footerStyle.borderColor) footerContainer.style.borderColor = footerStyle.borderColor;
      if (footerStyle.borderWidth) footerContainer.style.borderWidth = `${footerStyle.borderWidth}px`;
      if (footerStyle.borderRadius) footerContainer.style.borderRadius = `${footerStyle.borderRadius}px`;
    }
    
    // 기본 스타일 설정
    footerContainer.style.padding = '6px 8px';
    footerContainer.style.color = 'var(--text-muted)';
    
    // 설정에서 다중 콘텐츠 타입 가져오기
    const settings = this.settingsService.getSettings();
    const footerContentMultiple = settings.cardFooterContentMultiple?.filter(item => item !== 'none') || [];
    
    // 다중 콘텐츠 타입이 있는 경우
    if (footerContentMultiple.length > 0) {
      // 각 콘텐츠 타입에 대해 렌더링
      const contentElements: HTMLElement[] = [];
      
      for (const contentType of footerContentMultiple) {
        const contentEl = footerContainer.createDiv({ cls: 'card-footer-content-item' });
        this.renderContent(card, contentType, contentEl);
        
        // 내용이 있는 경우에만 추가
        if (contentEl.textContent && contentEl.textContent.trim() !== '') {
          contentElements.push(contentEl);
        } else {
          contentEl.remove();
        }
      }
      
      // 콘텐츠 요소들 사이에 구분자 추가
      if (contentElements.length > 1) {
        for (let i = 0; i < contentElements.length - 1; i++) {
          contentElements[i].style.marginBottom = '4px';
        }
      }
    } 
    // 단일 콘텐츠 타입인 경우
    else {
      const footerContent = card.displaySettings?.footerContent;
      if (footerContent) {
        this.renderContent(card, footerContent, footerContainer);
      }
    }
  }
  
  /**
   * 카드 콘텐츠 렌더링
   * @param card 카드
   * @param contentType 콘텐츠 타입
   * @param container 컨테이너 요소
   * @param renderingMode 렌더링 모드
   */
  renderContent(card: ICard, contentType: CardContentType, container: HTMLElement, renderingMode: CardRenderingMode = 'text'): void {
    const cardId = card.getId ? card.getId() : (card.id || card.path || '알 수 없음');
    const cacheKey = createCacheKey(cardId, contentType, renderingMode);
    
    // 캐시에서 콘텐츠 확인
    let content = this.contentCache.get(cacheKey);
    
    // 캐시에 없는 경우 콘텐츠 생성
    if (content === undefined) {
      content = this.generateContent(card, contentType);
      
      // 캐시에 저장
      this.contentCache.set(cacheKey, content);
    }
    
    // 콘텐츠 렌더링
    if (renderingMode === 'markdown' && content) {
      this.renderMarkdown(content, container, card.file);
    } else {
      container.setText(content || '');
    }
    
    // 디버깅: 콘텐츠 결과 로깅 (개발 모드에서만)
    if (this.settingsService.getSettings().debugMode) {
      console.log(`카드 콘텐츠 결과 - 콘텐츠 타입: ${contentType}, 내용: ${content}`);
    }
  }
  
  /**
   * 콘텐츠 생성
   * @param card 카드
   * @param contentType 콘텐츠 타입
   * @returns 생성된 콘텐츠
   */
  private generateContent(card: ICard, contentType: CardContentType): string {
    let content = '';
    
    // 콘텐츠 타입에 따라 내용 가져오기
    switch (contentType) {
      case 'filename':
        content = card.title;
        break;
      case 'title':
        content = card.title;
        break;
      case 'firstheader':
        content = card.firstHeader || card.title;
        break;
      case 'content':
        content = this.getContentPreview(card.content);
        break;
      case 'tags':
        content = card.tags.join(', ');
        break;
      case 'path':
        content = card.getPath ? card.getPath() : (card.path || '');
        break;
      case 'created':
        content = card.getCreatedTime ? this.formatDate(card.getCreatedTime()) : '';
        break;
      case 'modified':
        content = card.getModifiedTime ? this.formatDate(card.getModifiedTime()) : '';
        break;
      case 'frontmatter':
        // 프론트매터 키가 지정되지 않은 경우 모든 프론트매터 표시
        if (!card.frontmatter) {
          content = '';
        } else {
          content = JSON.stringify(card.frontmatter, null, 2);
        }
        break;
      default:
        // 프론트매터 키인 경우
        if (card.frontmatter && card.frontmatter[contentType]) {
          content = String(card.frontmatter[contentType]);
        } else {
          content = '';
        }
    }
    
    return content;
  }
  
  /**
   * 마크다운 렌더링
   * @param markdown 마크다운 텍스트
   * @param container 컨테이너 요소
   * @param file 파일
   */
  private renderMarkdown(markdown: string, container: HTMLElement, file: any): void {
    try {
      const activeLeaf = this.obsidianService.getWorkspace().activeLeaf;
      
      if (activeLeaf) {
        MarkdownRenderer.renderMarkdown(
          markdown,
          container,
          file.path,
          activeLeaf as any
        );
      } else {
        // activeLeaf가 없는 경우 텍스트로 표시
        container.setText(markdown);
      }
    } catch (error) {
      console.error('마크다운 렌더링 오류:', error);
      container.setText(markdown);
    }
  }
  
  /**
   * 내용 미리보기 가져오기
   * @param content 전체 내용
   * @returns 미리보기 내용
   */
  private getContentPreview(content: string): string {
    const settings = this.settingsService.getSettings();
    
    if (!content || content.trim() === '') {
      return '내용이 없습니다.';
    }
    
    // 프론트매터 제거 (--- 또는 +++ 사이의 내용)
    let cleanContent = content.replace(/^---[\s\S]*?---\n/m, '');
    cleanContent = cleanContent.replace(/^\+\+\+[\s\S]*?\+\+\+\n/m, '');
    
    // 빈 줄 제거 및 공백 정리
    cleanContent = cleanContent.split('\n')
      .filter(line => line.trim() !== '')
      .join('\n')
      .trim();
    
    // 내용이 없는 경우
    if (!cleanContent || cleanContent.trim() === '') {
      return '내용이 없습니다.';
    }
    
    // 내용 길이 제한
    if (settings.limitContentLength && settings.contentMaxLength) {
      // 줄 단위로 제한
      const lines = cleanContent.split('\n');
      const maxLines = Math.min(5, lines.length); // 최대 5줄까지만 표시
      
      let preview = lines.slice(0, maxLines).join('\n');
      
      // 글자 수 제한
      if (preview.length > settings.contentMaxLength) {
        preview = preview.substring(0, settings.contentMaxLength) + '...';
      } else if (lines.length > maxLines) {
        preview += '...';
      }
      
      return preview;
    }
    
    return cleanContent;
  }
  
  /**
   * 날짜 포맷팅
   * @param timestamp 타임스탬프
   * @returns 포맷팅된 날짜 문자열
   */
  private formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleString();
  }
} 