import { TFile } from 'obsidian';
import { CardSetSourceType, ICardSet } from '../../domain/cardset/CardSet';
import { ICardSetSourceManager } from '../../domain/cardset/CardSetInterfaces';
import { DomainEventBus } from '../../domain/events/DomainEventBus';
import { EventType, SettingsChangedEventData } from '../../domain/events/EventTypes';
import { ICardSetSourceController } from '../../domain/interaction/InteractionInterfaces';
import { ISettingsService } from '../../domain/settings/SettingsInterfaces';
import { ObsidianService } from '../core/ObsidianService';

/**
 * 카드셋 서비스 인터페이스
 */
export interface ICardSetService extends ICardSetSourceManager, ICardSetSourceController {
  /**
   * 현재 카드셋 가져오기
   * @returns 현재 카드셋
   */
  getCurrentCardSet(): Promise<ICardSet>;
  
  /**
   * 활성 파일 변경 처리
   * @param file 활성 파일
   */
  handleActiveFileChanged(file: TFile | null): Promise<void>;
}

/**
 * 카드셋 서비스
 * 카드셋 관련 기능을 관리합니다.
 */
export class CardSetService implements ICardSetService {
  private obsidianService: ObsidianService;
  private settingsService: ISettingsService;
  private eventBus: DomainEventBus;
  private currentCardSetSource: CardSetSourceType;
  private previousCardSetSource: CardSetSourceType;
  private currentCardSet: ICardSet | null = null;
  private folderCardSet: ICardSet | null = null;
  private tagCardSet: ICardSet | null = null;
  private searchCardSet: ICardSet | null = null;
  
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
    
    // 설정에서 초기 카드셋 소스 가져오기
    const settings = this.settingsService.getSettings();
    this.currentCardSetSource = settings.useLastCardSetSourceOnLoad && settings.lastCardSetSource
      ? settings.lastCardSetSource
      : settings.defaultCardSetSource;
    this.previousCardSetSource = this.currentCardSetSource;
    
    // 이벤트 리스너 등록
    this.eventBus.on(EventType.SETTINGS_CHANGED, this.onSettingsChanged.bind(this));
  }
  
  /**
   * 현재 카드셋 소스 가져오기
   * @returns 현재 카드셋 소스
   */
  getCurrentSource(): ICardSet {
    return this.currentCardSet || this.createEmptyCardSet();
  }
  
  /**
   * 현재 카드셋 소스 타입 가져오기
   * @returns 현재 카드셋 소스 타입
   */
  getCurrentSourceType(): CardSetSourceType {
    return this.currentCardSetSource;
  }
  
  /**
   * 카드셋 소스 변경
   * @param sourceType 변경할 카드셋 소스 타입
   */
  async changeSource(sourceType: CardSetSourceType): Promise<void> {
    if (this.currentCardSetSource === sourceType) {
      return;
    }
    
    this.previousCardSetSource = this.currentCardSetSource;
    this.currentCardSetSource = sourceType;
    
    // 설정 업데이트
    await this.settingsService.updateSettings({
      lastCardSetSource: sourceType
    });
    
    // 카드셋 새로고침
    await this.refreshCardSet();
    
    // 이벤트 발생
    this.eventBus.emit(EventType.CARDSET_SOURCE_CHANGED, {
      previousSourceType: this.previousCardSetSource,
      newSourceType: sourceType
    });
  }
  
  /**
   * 폴더 카드셋 소스 가져오기
   * @returns 폴더 카드셋 소스 객체
   */
  getFolderSource(): ICardSet {
    return this.folderCardSet || this.createEmptyCardSet();
  }
  
  /**
   * 태그 카드셋 소스 가져오기
   * @returns 태그 카드셋 소스 객체
   */
  getTagSource(): ICardSet {
    return this.tagCardSet || this.createEmptyCardSet();
  }
  
  /**
   * 이전 카드셋 소스 가져오기
   * @returns 이전 카드셋 소스
   */
  getPreviousSourceType(): CardSetSourceType {
    return this.previousCardSetSource;
  }
  
  /**
   * 이전 카드셋 소스 타입 가져오기
   * @returns 이전 카드셋 소스 타입
   */
  getPreviousCardSetSource(): CardSetSourceType {
    return this.previousCardSetSource;
  }
  
  /**
   * 카드 세트 변경
   * @param type 변경할 카드 세트 타입
   */
  async changeCardSetSource(type: CardSetSourceType): Promise<void> {
    await this.changeSource(type);
  }
  
  /**
   * 카드 세트 선택
   * @param cardSet 선택할 카드 세트
   * @param isFixed 고정 여부
   */
  async selectCardSet(cardSet: string, isFixed: boolean = false): Promise<void> {
    const settings = this.settingsService.getSettings();
    
    // 현재 카드셋 소스에 따라 다른 처리
    if (this.currentCardSetSource === 'folder') {
      await this.settingsService.updateSettings({
        lastFolderCardSet: cardSet,
        lastFolderCardSetFixed: isFixed
      });
      
      if (isFixed) {
        await this.settingsService.updateSettings({
          defaultFolderCardSet: cardSet,
          isCardSetFixed: true
        });
      }
    } else if (this.currentCardSetSource === 'tag') {
      await this.settingsService.updateSettings({
        lastTagCardSet: cardSet,
        lastTagCardSetFixed: isFixed
      });
      
      if (isFixed) {
        await this.settingsService.updateSettings({
          defaultTagCardSet: cardSet,
          isCardSetFixed: true
        });
      }
    }
    
    // 카드셋 새로고침
    await this.refreshCardSet();
    
    // 이벤트 발생
    this.eventBus.emit(EventType.CARDSET_CHANGED, {
      cardSet,
      sourceType: this.currentCardSetSource,
      isFixed
    });
  }
  
  /**
   * 카드셋 소스 변경 알림 처리
   * @param cardSetSourceType 변경된 카드셋 소스 타입
   */
  notifyCardSetSourceChanged(cardSetSourceType: CardSetSourceType): void {
    this.currentCardSetSource = cardSetSourceType;
    this.refreshCardSet();
  }
  
  /**
   * 현재 카드셋 가져오기
   * @returns 현재 카드셋
   */
  async getCurrentCardSet(): Promise<ICardSet> {
    if (!this.currentCardSet) {
      await this.refreshCardSet();
    }
    return this.currentCardSet || this.createEmptyCardSet();
  }
  
  /**
   * 활성 파일 변경 처리
   * @param file 활성 파일
   */
  async handleActiveFileChanged(file: TFile | null): Promise<void> {
    const settings = this.settingsService.getSettings();
    
    // 고정된 카드셋이 아닌 경우에만 활성 파일 변경에 따라 카드셋 변경
    if (!settings.isCardSetFixed) {
      await this.refreshCardSet();
      
      // 이벤트 발생
      const cardSet = this.currentCardSetSource === 'folder'
        ? file?.parent?.path || ''
        : this.getTagsFromFile(file).join(', ');
      
      this.eventBus.emit(EventType.CARDSET_CHANGED, {
        cardSet,
        sourceType: this.currentCardSetSource,
        isFixed: false
      });
    }
  }
  
  /**
   * 카드셋 새로고침
   */
  private async refreshCardSet(): Promise<void> {
    // 현재 카드셋 소스에 따라 다른 처리
    switch (this.currentCardSetSource) {
      case 'folder':
        this.currentCardSet = await this.refreshFolderCardSet();
        break;
      case 'tag':
        this.currentCardSet = await this.refreshTagCardSet();
        break;
      case 'search':
        this.currentCardSet = await this.refreshSearchCardSet();
        break;
    }
  }
  
  /**
   * 폴더 카드셋 새로고침
   * @returns 새로고침된 폴더 카드셋
   */
  private async refreshFolderCardSet(): Promise<ICardSet> {
    // 구현 필요
    return this.createEmptyCardSet();
  }
  
  /**
   * 태그 카드셋 새로고침
   * @returns 새로고침된 태그 카드셋
   */
  private async refreshTagCardSet(): Promise<ICardSet> {
    // 구현 필요
    return this.createEmptyCardSet();
  }
  
  /**
   * 검색 카드셋 새로고침
   * @returns 새로고침된 검색 카드셋
   */
  private async refreshSearchCardSet(): Promise<ICardSet> {
    // 구현 필요
    return this.createEmptyCardSet();
  }
  
  /**
   * 빈 카드셋 생성
   * @returns 빈 카드셋
   */
  private createEmptyCardSet(): ICardSet {
    return {
      getType: () => 'empty',
      getSource: () => '',
      getFiles: () => [],
      getCards: () => [],
      isEmpty: () => true
    };
  }
  
  /**
   * 파일에서 태그 가져오기
   * @param file 파일
   * @returns 태그 목록
   */
  private getTagsFromFile(file: TFile | null): string[] {
    if (!file) return [];
    
    const cache = this.obsidianService.getMetadataCache().getFileCache(file);
    if (!cache || !cache.tags) return [];
    
    return cache.tags.map(tag => tag.tag);
  }
  
  /**
   * 설정 변경 이벤트 처리
   * @param data 이벤트 데이터
   */
  private onSettingsChanged(data: SettingsChangedEventData): Promise<void> {
    // 카드셋 관련 설정이 변경된 경우에만 카드셋 새로고침
    const cardSetSettings = [
      'defaultCardSetSource', 'includeSubfolders',
      'defaultFolderCardSet', 'defaultTagCardSet', 'isCardSetFixed'
    ];
    
    if (data.changedKeys.some(key => cardSetSettings.includes(key))) {
      return this.refreshCardSet();
    }
    
    return Promise.resolve();
  }
} 