import { CardNavigatorPlugin } from '../../main';
import { CardContentType } from '../../domain/card/Card';

/**
 * 카드 미리보기 컴포넌트
 * 설정 UI에서 카드 미리보기를 표시하는 컴포넌트입니다.
 */
export class CardPreview {
  private plugin: CardNavigatorPlugin;
  private container: HTMLElement | null = null;
  private cardElement: HTMLElement | null = null;
  private headerElement: HTMLElement | null = null;
  private bodyElement: HTMLElement | null = null;
  private footerElement: HTMLElement | null = null;
  
  /**
   * 생성자
   * @param plugin 플러그인 인스턴스
   */
  constructor(plugin: CardNavigatorPlugin) {
    this.plugin = plugin;
  }
  
  /**
   * 컴포넌트 렌더링
   * @param container 컨테이너 요소
   */
  render(container: HTMLElement): void {
    this.container = container;
    
    // 카드 요소 생성
    this.cardElement = container.createDiv({ cls: 'card-navigator-preview-card' });
    
    // 헤더 요소 생성
    this.headerElement = this.cardElement.createDiv({ cls: 'card-navigator-preview-header' });
    
    // 바디 요소 생성
    this.bodyElement = this.cardElement.createDiv({ cls: 'card-navigator-preview-body' });
    
    // 풋터 요소 생성
    this.footerElement = this.cardElement.createDiv({ cls: 'card-navigator-preview-footer' });
    
    // 미리보기 업데이트
    this.update();
  }
  
  /**
   * 미리보기 업데이트
   */
  update(): void {
    if (!this.cardElement || !this.headerElement || !this.bodyElement || !this.footerElement) return;
    
    const settings = this.plugin.settings;
    
    // 샘플 데이터 가져오기
    const sampleType = settings.previewSampleType || 'sample1';
    const sampleData = this.getSampleData(sampleType);
    
    // 헤더 내용 설정
    this.headerElement.setText(this.getContentPreview(settings.cardHeaderContent as CardContentType, sampleData));
    
    // 바디 내용 설정
    this.bodyElement.setText(this.getContentPreview(settings.cardBodyContent as CardContentType, sampleData));
    
    // 풋터 내용 설정
    this.footerElement.setText(this.getContentPreview(settings.cardFooterContent as CardContentType, sampleData));
    
    // 카드 스타일 적용
    this.applyCardStyles();
  }
  
  /**
   * 카드 스타일 적용
   */
  private applyCardStyles(): void {
    if (!this.cardElement || !this.headerElement || !this.bodyElement || !this.footerElement) return;
    
    const settings = this.plugin.settings;
    
    // 카드 스타일 적용
    this.cardElement.style.width = `${settings.cardWidth}px`;
    this.cardElement.style.height = `${settings.cardHeight}px`;
    this.cardElement.style.backgroundColor = settings.normalCardBgColor || 'var(--background-primary)';
    this.cardElement.style.borderStyle = settings.normalCardBorderStyle || 'solid';
    this.cardElement.style.borderColor = settings.normalCardBorderColor || 'var(--background-modifier-border)';
    this.cardElement.style.borderWidth = `${settings.normalCardBorderWidth || 1}px`;
    this.cardElement.style.borderRadius = `${settings.normalCardBorderRadius || 5}px`;
    this.cardElement.style.display = 'flex';
    this.cardElement.style.flexDirection = 'column';
    this.cardElement.style.overflow = 'hidden';
    this.cardElement.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.1)';
    
    // 헤더 스타일 적용
    this.headerElement.style.backgroundColor = settings.headerBgColor || 'var(--background-secondary)';
    this.headerElement.style.fontSize = `${settings.headerFontSize || 16}px`;
    this.headerElement.style.padding = '8px';
    this.headerElement.style.fontWeight = 'bold';
    this.headerElement.style.borderBottom = `${settings.headerBorderWidth || 1}px ${settings.headerBorderStyle || 'solid'} ${settings.headerBorderColor || 'var(--background-modifier-border)'}`;
    
    // 바디 스타일 적용
    this.bodyElement.style.backgroundColor = settings.bodyBgColor || 'var(--background-primary)';
    this.bodyElement.style.fontSize = `${settings.bodyFontSize || 14}px`;
    this.bodyElement.style.padding = '10px';
    this.bodyElement.style.flex = '1';
    this.bodyElement.style.overflow = 'hidden';
    this.bodyElement.style.textOverflow = 'ellipsis';
    
    // 풋터 스타일 적용
    this.footerElement.style.backgroundColor = settings.footerBgColor || 'var(--background-secondary-alt)';
    this.footerElement.style.fontSize = `${settings.footerFontSize || 12}px`;
    this.footerElement.style.padding = '6px 8px';
    this.footerElement.style.borderTop = `${settings.footerBorderWidth || 1}px ${settings.footerBorderStyle || 'solid'} ${settings.footerBorderColor || 'var(--background-modifier-border)'}`;
    this.footerElement.style.color = 'var(--text-muted)';
  }
  
  /**
   * 콘텐츠 미리보기 가져오기
   * @param contentType 콘텐츠 타입
   * @param sampleData 샘플 데이터
   * @returns 미리보기 텍스트
   */
  private getContentPreview(contentType: CardContentType, sampleData: any): string {
    switch (contentType) {
      case 'filename':
        return sampleData.filename || '파일명.md';
      case 'title':
        return sampleData.title || '노트 제목';
      case 'firstheader':
        return sampleData.firstHeader || '첫 번째 헤더';
      case 'content':
        return sampleData.content || '노트 내용 미리보기...';
      case 'tags':
        return sampleData.tags || '#태그1 #태그2';
      case 'path':
        return sampleData.path || '폴더/하위폴더/파일명.md';
      case 'created':
        return sampleData.created || '2023-01-01 12:00:00';
      case 'modified':
        return sampleData.modified || '2023-01-02 15:30:00';
      case 'frontmatter':
        const frontmatterKey = this.plugin.settings.frontmatterKey || 'status';
        return sampleData.frontmatter?.[frontmatterKey] || `${frontmatterKey}: 값`;
      default:
        if (typeof contentType === 'string' && contentType.trim() !== '') {
          return sampleData.frontmatter?.[contentType] || `${contentType}: 값`;
        }
        return '내용 없음';
    }
  }
  
  /**
   * 샘플 데이터 가져오기
   * @param sampleType 샘플 타입
   * @returns 샘플 데이터
   */
  private getSampleData(sampleType: string): any {
    switch (sampleType) {
      case 'sample1':
        return {
          filename: '기본노트.md',
          title: '기본 노트 제목',
          firstHeader: '# 첫 번째 헤더',
          content: '이것은 기본 노트의 내용입니다. 카드 미리보기에 표시되는 내용입니다.',
          tags: '#기본 #노트',
          path: '기본폴더/기본노트.md',
          created: '2023-01-01 12:00:00',
          modified: '2023-01-02 15:30:00',
          frontmatter: {
            status: '진행중',
            priority: '중간',
            category: '일반'
          }
        };
      case 'sample2':
        return {
          filename: '태그노트.md',
          title: '태그가 있는 노트',
          firstHeader: '# 태그 노트 헤더',
          content: '이 노트에는 여러 태그가 포함되어 있습니다. 태그를 사용하여 노트를 분류할 수 있습니다.',
          tags: '#프로젝트 #할일 #중요 #마감임박',
          path: '프로젝트/태그노트.md',
          created: '2023-02-15 09:45:00',
          modified: '2023-02-16 14:20:00',
          frontmatter: {
            status: '검토중',
            priority: '높음',
            category: '프로젝트'
          }
        };
      case 'sample3':
        return {
          filename: '프론트매터노트.md',
          title: '프론트매터가 있는 노트',
          firstHeader: '# 프론트매터 노트',
          content: '이 노트에는 다양한 프론트매터 속성이 포함되어 있습니다. 프론트매터를 사용하여 메타데이터를 관리할 수 있습니다.',
          tags: '#메타데이터 #프론트매터',
          path: '메타데이터/프론트매터노트.md',
          created: '2023-03-10 11:30:00',
          modified: '2023-03-12 16:45:00',
          frontmatter: {
            status: '완료',
            priority: '매우 높음',
            category: '문서화',
            author: '사용자',
            version: '1.0.0',
            due: '2023-04-01',
            related: ['관련노트1', '관련노트2']
          }
        };
      default:
        return {
          filename: '기본노트.md',
          title: '기본 노트 제목',
          firstHeader: '# 첫 번째 헤더',
          content: '이것은 기본 노트의 내용입니다. 카드 미리보기에 표시되는 내용입니다.',
          tags: '#기본 #노트',
          path: '기본폴더/기본노트.md',
          created: '2023-01-01 12:00:00',
          modified: '2023-01-02 15:30:00',
          frontmatter: {
            status: '진행중',
            priority: '중간',
            category: '일반'
          }
        };
    }
  }
} 