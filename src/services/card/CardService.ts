import { CachedMetadata, TFile } from 'obsidian';
import { Card, ICard, ICardDisplaySettings, CardContentType } from '../../domain/card/Card';
import { DomainEventBus } from '../../domain/events/DomainEventBus';
import { CardSetChangedEventData, EventType, SettingsChangedEventData } from '../../domain/events/EventTypes';
import { ICardManager } from '../../domain/interaction/InteractionInterfaces';
import { ISettingsService } from '../../domain/settings/SettingsInterfaces';
import { ObsidianService } from '../core/ObsidianService';

/**
 * 카드 서비스 인터페이스
 */
export interface ICardService extends ICardManager {
  /**
   * 카드 가져오기
   * @param id 카드 ID
   * @returns 카드 또는 undefined
   */
  getCardById(id: string): Promise<ICard | undefined>;
  
  /**
   * 경로로 카드 가져오기
   * @param path 파일 경로
   * @returns 카드 또는 null
   */
  getCardByPath(path: string): Promise<ICard | null>;
  
  /**
   * 파일로부터 카드 생성
   * @param file 파일
   * @returns 생성된 카드
   */
  createCardFromFile(file: TFile): Promise<ICard>;
}

/**
 * 카드 서비스
 * 카드 관련 기능을 관리합니다.
 */
export class CardService implements ICardService {
  private obsidianService: ObsidianService;
  private settingsService: ISettingsService;
  private eventBus: DomainEventBus;
  private cards: ICard[] = [];
  
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
    this.eventBus.on(EventType.CARDSET_CHANGED, this.onCardSetChanged.bind(this));
    this.eventBus.on(EventType.SETTINGS_CHANGED, this.onSettingsChanged.bind(this));
  }
  
  /**
   * 카드 목록 가져오기
   * @returns 카드 목록
   */
  async getCards(): Promise<ICard[]> {
    if (this.cards.length === 0) {
      await this.refreshCards();
    }
    return this.cards;
  }
  
  /**
   * 현재 카드 목록 가져오기
   * @returns 현재 카드 목록
   */
  getCurrentCards(): ICard[] {
    return this.cards;
  }
  
  /**
   * 카드 저장소 새로고침
   */
  async refreshCards(): Promise<void> {
    // 현재 카드셋 소스에 따라 파일 목록 가져오기
    const files = this.obsidianService.getMarkdownFiles();
    
    // 파일로부터 카드 생성
    this.cards = await Promise.all(files.map(file => this.createCardFromFile(file)));
    
    // 카드 변경 이벤트 발생
    this.eventBus.emit(EventType.CARDS_CHANGED, {
      cards: this.cards,
      totalCount: this.cards.length,
      filteredCount: this.cards.length
    });
  }
  
  /**
   * 카드 가져오기
   * @param id 카드 ID
   * @returns 카드 또는 undefined
   */
  async getCardById(id: string): Promise<ICard | undefined> {
    const cards = await this.getCards();
    return cards.find(card => card.getId() === id);
  }
  
  /**
   * 경로로 카드 가져오기
   * @param path 파일 경로
   * @returns 카드 또는 null
   */
  async getCardByPath(path: string): Promise<ICard | null> {
    try {
      const file = this.obsidianService.getVault().getAbstractFileByPath(path);
      if (file instanceof TFile) {
        return await this.obsidianService.getCardFromFile(file);
      }
    } catch (error) {
      console.error('카드 가져오기 오류:', error);
    }
    return null;
  }
  
  /**
   * 파일로부터 카드 생성
   * @param file 파일
   * @returns 생성된 카드
   */
  async createCardFromFile(file: TFile): Promise<ICard> {
    // 파일 내용 읽기
    const content = await this.obsidianService.read(file);
    
    // 메타데이터 가져오기
    const metadata = this.obsidianService.getMetadataCache().getFileCache(file);
    
    // 카드 생성
    return this.createCard(file, content, metadata);
  }
  
  /**
   * 카드 생성
   * @param file 파일
   * @param content 내용
   * @param metadata 메타데이터
   * @returns 생성된 카드
   */
  private createCard(file: TFile, content: string, metadata: CachedMetadata | null): ICard {
    // 설정 가져오기
    const settings = this.settingsService.getSettings();
    
    // 태그 추출
    const tags = metadata?.tags?.map(tag => tag.tag) || [];
    
    // 프론트매터 추출
    const frontmatter = metadata?.frontmatter || {};
    
    // 첫 번째 헤더 추출
    const firstHeader = metadata?.headings?.[0]?.heading || '';
    
    // 카드 표시 설정
    const displaySettings: ICardDisplaySettings = {
      headerContent: settings.cardHeaderContent as CardContentType,
      bodyContent: settings.cardBodyContent as CardContentType,
      footerContent: settings.cardFooterContent as CardContentType,
      renderingMode: 'text', // 기본값
      cardStyle: {
        normal: {
          backgroundColor: settings.normalCardBgColor,
          borderStyle: settings.normalCardBorderStyle,
          borderColor: settings.normalCardBorderColor,
          borderWidth: settings.normalCardBorderWidth,
          borderRadius: settings.normalCardBorderRadius
        },
        active: {
          backgroundColor: settings.activeCardBgColor,
          borderStyle: settings.activeCardBorderStyle,
          borderColor: settings.activeCardBorderColor,
          borderWidth: settings.activeCardBorderWidth,
          borderRadius: settings.activeCardBorderRadius
        },
        focused: {
          backgroundColor: settings.focusedCardBgColor,
          borderStyle: settings.focusedCardBorderStyle,
          borderColor: settings.focusedCardBorderColor,
          borderWidth: settings.focusedCardBorderWidth,
          borderRadius: settings.focusedCardBorderRadius
        },
        header: {
          backgroundColor: settings.headerBgColor,
          fontSize: settings.headerFontSize,
          borderStyle: settings.headerBorderStyle,
          borderColor: settings.headerBorderColor,
          borderWidth: settings.headerBorderWidth,
          borderRadius: settings.headerBorderRadius
        },
        body: {
          backgroundColor: settings.bodyBgColor,
          fontSize: settings.bodyFontSize,
          borderStyle: settings.bodyBorderStyle,
          borderColor: settings.bodyBorderColor,
          borderWidth: settings.bodyBorderWidth,
          borderRadius: settings.bodyBorderRadius
        },
        footer: {
          backgroundColor: settings.footerBgColor,
          fontSize: settings.footerFontSize,
          borderStyle: settings.footerBorderStyle,
          borderColor: settings.footerBorderColor,
          borderWidth: settings.footerBorderWidth,
          borderRadius: settings.footerBorderRadius
        }
      }
    };
    
    return new Card(
      file,
      content,
      tags,
      frontmatter,
      firstHeader,
      displaySettings,
      metadata || undefined
    );
  }
  
  /**
   * 카드셋 변경 이벤트 처리
   * @param data 이벤트 데이터
   */
  private onCardSetChanged(_data: CardSetChangedEventData): void {
    this.refreshCards();
  }
  
  /**
   * 설정 변경 이벤트 처리
   * @param data 이벤트 데이터
   */
  private onSettingsChanged(data: SettingsChangedEventData): void {
    // 카드 표시 관련 설정이 변경된 경우에만 카드 새로고침
    const cardDisplaySettings = [
      'cardHeaderContent', 'cardBodyContent', 'cardFooterContent',
      'normalCardBgColor', 'activeCardBgColor', 'focusedCardBgColor',
      'headerBgColor', 'bodyBgColor', 'footerBgColor',
      'headerFontSize', 'bodyFontSize', 'footerFontSize',
      'normalCardBorderStyle', 'normalCardBorderColor', 'normalCardBorderWidth', 'normalCardBorderRadius',
      'activeCardBorderStyle', 'activeCardBorderColor', 'activeCardBorderWidth', 'activeCardBorderRadius',
      'focusedCardBorderStyle', 'focusedCardBorderColor', 'focusedCardBorderWidth', 'focusedCardBorderRadius',
      'headerBorderStyle', 'headerBorderColor', 'headerBorderWidth', 'headerBorderRadius',
      'bodyBorderStyle', 'bodyBorderColor', 'bodyBorderWidth', 'bodyBorderRadius',
      'footerBorderStyle', 'footerBorderColor', 'footerBorderWidth', 'footerBorderRadius'
    ];
    
    if (data.changedKeys.some(key => cardDisplaySettings.includes(key))) {
      this.refreshCards();
    }
  }
} 