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
}

/**
 * 카드 렌더링 서비스
 * 카드 렌더링 관련 기능을 관리합니다.
 */
export class CardRenderingService implements ICardRenderingService {
  private obsidianService: ObsidianService;
  private settingsService: ISettingsService;
  
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
    
    // 헤더 콘텐츠 렌더링
    const headerContent = card.displaySettings?.headerContent;
    if (headerContent) {
      this.renderContent(card, headerContent, headerContainer, card.displaySettings?.renderingMode);
    }
  }
  
  /**
   * 카드 본문 렌더링
   * @param card 카드
   * @param container 컨테이너 요소
   */
  renderBody(card: ICard, container: HTMLElement): void {
    const bodyContainer = container.createDiv({ cls: 'card-body' });
    
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
    
    // 본문 콘텐츠 렌더링
    const bodyContent = card.displaySettings?.bodyContent;
    if (bodyContent) {
      this.renderContent(card, bodyContent, bodyContainer, card.displaySettings?.renderingMode);
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
    
    // 푸터 콘텐츠 렌더링
    const footerContent = card.displaySettings?.footerContent;
    if (footerContent) {
      this.renderContent(card, footerContent, footerContainer, card.displaySettings?.renderingMode);
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
        content = card.getPath();
        break;
      case 'created':
        content = this.formatDate(card.getCreatedTime());
        break;
      case 'modified':
        content = this.formatDate(card.getModifiedTime());
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
    
    // 렌더링 모드에 따라 렌더링
    if (renderingMode === 'html') {
      // HTML 렌더링
      this.renderMarkdown(content, container, card.file);
    } else {
      // 일반 텍스트 렌더링
      container.setText(content);
    }
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
    
    // 내용 길이 제한
    if (settings.limitContentLength && settings.contentMaxLength) {
      if (content.length > settings.contentMaxLength) {
        return content.substring(0, settings.contentMaxLength) + '...';
      }
    }
    
    return content;
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