import { CachedMetadata, TFile } from 'obsidian';
import { Card, ICard, CardContentType } from '../../domain/card/Card';
import { DomainEventBus } from '../../domain/events/DomainEventBus';
import { EventType } from '../../domain/events/EventTypes';
import { ISettingsService } from '../../domain/settings/SettingsInterfaces';
import { ObsidianService } from '../core/ObsidianService';

/**
 * 카드 생성 서비스 인터페이스
 * 카드 생성 관련 기능을 정의합니다.
 */
export interface ICardCreationService {
  /**
   * 파일로부터 카드 생성
   * @param file 파일
   * @returns 생성된 카드
   */
  createCardFromFile(file: TFile): Promise<ICard>;
  
  /**
   * 카드 캐시 초기화
   */
  clearCardCache(): void;
}

/**
 * 카드 생성 서비스
 * 카드 생성 관련 기능을 구현합니다.
 */
export class CardCreationService implements ICardCreationService {
  private obsidianService: ObsidianService;
  private settingsService: ISettingsService;
  private eventBus: DomainEventBus;
  private cardCache: Map<string, ICard> = new Map();
  
  /**
   * 생성자
   * @param obsidianService Obsidian 서비스
   * @param settingsService 설정 서비스
   * @param eventBus 이벤트 버스
   */
  constructor(
    obsidianService: ObsidianService,
    settingsService: ISettingsService,
    eventBus: DomainEventBus
  ) {
    this.obsidianService = obsidianService;
    this.settingsService = settingsService;
    this.eventBus = eventBus;
    
    // 이벤트 리스너 등록
    this.registerEventListeners();
  }
  
  /**
   * 이벤트 리스너 등록
   */
  private registerEventListeners(): void {
    // 설정 변경 이벤트 리스너
    this.eventBus.on(EventType.SETTINGS_CHANGED, () => {
      // 설정이 변경되면 카드 캐시 초기화
      this.clearCardCache();
    });
  }
  
  /**
   * 파일로부터 카드 생성
   * @param file 파일
   * @returns 생성된 카드
   */
  async createCardFromFile(file: TFile): Promise<ICard> {
    // 캐시에서 카드 확인
    const cachedCard = this.cardCache.get(file.path);
    if (cachedCard) {
      return cachedCard;
    }
    
    // 파일 내용 및 메타데이터 가져오기
    const content = await this.obsidianService.getFileContent(file);
    const metadata = this.obsidianService.getFileMetadata(file);
    
    // 카드 생성
    const card = this.createCard(file, content, metadata);
    
    // 카드 캐시에 저장
    this.cardCache.set(file.path, card);
    
    return card;
  }
  
  /**
   * 카드 생성
   * @param file 파일
   * @param content 파일 내용
   * @param metadata 파일 메타데이터
   * @returns 생성된 카드
   */
  private createCard(file: TFile, content: string, metadata: CachedMetadata | null): ICard {
    const settings = this.settingsService.getSettings();
    
    // 카드 기본 정보 설정
    const card = new Card();
    card.id = file.path;
    card.path = file.path;
    card.filename = file.basename;
    card.extension = file.extension;
    card.created = file.stat.ctime;
    card.modified = file.stat.mtime;
    
    // 제목 설정
    if (settings.titleSource === 'firstheader' && metadata?.headings && metadata.headings.length > 0) {
      card.title = metadata.headings[0].heading;
    } else {
      card.title = file.basename;
    }
    
    // 내용 설정
    card.content = content;
    
    // 태그 설정
    if (metadata?.tags) {
      card.tags = metadata.tags.map(tag => tag.tag);
    }
    
    // 헤더 콘텐츠 설정
    const headerContentTypes = settings.cardHeaderContentMultiple || [settings.cardHeaderContent || 'filename'];
    card.headerContent = this.getCardContent(headerContentTypes, card, metadata, settings.cardHeaderFrontmatterKey);
    
    // 바디 콘텐츠 설정
    const bodyContentTypes = settings.cardBodyContentMultiple || [settings.cardBodyContent || 'content'];
    card.bodyContent = this.getCardContent(bodyContentTypes, card, metadata, settings.cardBodyFrontmatterKey);
    
    // 풋터 콘텐츠 설정
    const footerContentTypes = settings.cardFooterContentMultiple || [settings.cardFooterContent || 'tags'];
    card.footerContent = this.getCardContent(footerContentTypes, card, metadata, settings.cardFooterFrontmatterKey);
    
    // 카드 메서드 설정
    this.ensureCardMethods(card);
    
    return card;
  }
  
  /**
   * 카드 콘텐츠 가져오기
   * @param contentTypes 콘텐츠 타입 배열
   * @param card 카드
   * @param metadata 메타데이터
   * @param frontmatterKey 프론트매터 키
   * @returns 카드 콘텐츠
   */
  private getCardContent(
    contentTypes: string[],
    card: ICard,
    metadata: CachedMetadata | null,
    frontmatterKey?: string
  ): string {
    if (contentTypes.includes('none') || contentTypes.length === 0) {
      return '';
    }
    
    const contentParts: string[] = [];
    
    for (const type of contentTypes) {
      switch (type) {
        case 'filename':
          contentParts.push(card.filename);
          break;
        case 'firstheader':
          if (metadata?.headings && metadata.headings.length > 0) {
            contentParts.push(metadata.headings[0].heading);
          }
          break;
        case 'content':
          const settings = this.settingsService.getSettings();
          let contentText = card.content || '';
          
          // 프론트매터 포함 여부
          if (!settings.includeFrontmatterInContent) {
            contentText = this.removeFrontmatter(contentText);
          }
          
          // 첫 번째 헤더 포함 여부
          if (!settings.includeFirstHeaderInContent && metadata?.headings && metadata.headings.length > 0) {
            const firstHeader = metadata.headings[0].heading;
            const headerRegex = new RegExp(`^#+ ${firstHeader}`, 'm');
            contentText = contentText.replace(headerRegex, '');
          }
          
          // 내용 길이 제한
          if (settings.limitContentLength && contentText.length > (settings.contentMaxLength || 200)) {
            contentText = contentText.substring(0, settings.contentMaxLength || 200) + '...';
          }
          
          contentParts.push(contentText);
          break;
        case 'tags':
          if (card.tags && card.tags.length > 0) {
            contentParts.push(card.tags.map(tag => `#${tag}`).join(' '));
          }
          break;
        case 'date':
          const date = new Date(card.modified);
          contentParts.push(date.toLocaleDateString());
          break;
        case 'frontmatter':
          if (frontmatterKey && metadata?.frontmatter && metadata.frontmatter[frontmatterKey]) {
            contentParts.push(`${frontmatterKey}: ${metadata.frontmatter[frontmatterKey]}`);
          }
          break;
      }
    }
    
    return contentParts.join(' | ');
  }
  
  /**
   * 프론트매터 제거
   * @param content 내용
   * @returns 프론트매터가 제거된 내용
   */
  private removeFrontmatter(content: string): string {
    const frontmatterRegex = /^---\n([\s\S]*?)\n---\n/;
    return content.replace(frontmatterRegex, '');
  }
  
  /**
   * 카드 메서드 설정
   * @param card 카드
   */
  private ensureCardMethods(card: ICard): void {
    // 카드 메서드가 이미 설정되어 있는지 확인
    if (typeof card.getTitle === 'function') {
      return;
    }
    
    // 카드 메서드 설정
    card.getTitle = function(): string {
      return this.title || this.filename || '';
    };
    
    card.getContent = function(): string {
      return this.content || '';
    };
    
    card.getTags = function(): string[] {
      return this.tags || [];
    };
    
    card.getPath = function(): string {
      return this.path || '';
    };
    
    card.getCreated = function(): number {
      return this.created || 0;
    };
    
    card.getModified = function(): number {
      return this.modified || 0;
    };
  }
  
  /**
   * 카드 캐시 초기화
   */
  clearCardCache(): void {
    this.cardCache.clear();
  }
} 