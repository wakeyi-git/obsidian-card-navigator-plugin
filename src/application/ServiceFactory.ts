import { App } from 'obsidian';
import { ICardRepository } from '../domain/card/CardRepository';
import CardNavigatorPlugin from '../main';

import { ICardService, CardService } from './CardService';
import { ICardSetService, CardSetService } from './CardSetService';
import { ICardSetSourceService, CardSetSourceService } from './CardSetSourceService';
import { ISearchService, SearchService } from './SearchService';
import { ISortService, SortService } from './SortService';
import { ILayoutService, LayoutService } from './LayoutService';
import { IPresetService, PresetService } from './PresetService';
import { ICardNavigatorService, CardNavigatorService } from './CardNavigatorService';
import { ISettingsService, SettingsService } from './SettingsService';

/**
 * 서비스 팩토리 클래스
 * 서비스 객체를 생성하고 의존성을 주입합니다.
 */
export class ServiceFactory {
  private app: App;
  private plugin: CardNavigatorPlugin;
  private cardRepository: ICardRepository;
  
  // 서비스 인스턴스 캐싱
  private cardService: ICardService | null = null;
  private cardSetService: ICardSetService | null = null;
  private cardSetSourceService: ICardSetSourceService | null = null;
  private searchService: ISearchService | null = null;
  private sortService: ISortService | null = null;
  private layoutService: ILayoutService | null = null;
  private presetService: IPresetService | null = null;
  private cardNavigatorService: ICardNavigatorService | null = null;
  private settingsService: ISettingsService | null = null;
  
  /**
   * 생성자
   * @param app Obsidian App 객체
   * @param plugin 플러그인 인스턴스
   * @param cardRepository 카드 저장소
   */
  constructor(app: App, plugin: CardNavigatorPlugin, cardRepository: ICardRepository) {
    this.app = app;
    this.plugin = plugin;
    this.cardRepository = cardRepository;
  }
  
  /**
   * 카드 서비스 가져오기
   * @returns 카드 서비스
   */
  getCardService(): ICardService {
    if (!this.cardService) {
      this.cardService = new CardService(this.app, this.cardRepository);
    }
    return this.cardService;
  }
  
  /**
   * 카드셋 서비스 가져오기
   * @returns 카드셋 서비스
   */
  getCardSetService(): ICardSetService {
    if (!this.cardSetService) {
      this.cardSetService = new CardSetService(
        this.app, 
        this.getCardService(), 
        this.plugin.settings.defaultCardSetSource
      );
    }
    return this.cardSetService;
  }
  
  /**
   * 카드셋 소스 서비스 가져오기
   * @returns 카드셋 소스 서비스
   */
  getCardSetSourceService(): ICardSetSourceService {
    if (!this.cardSetSourceService) {
      // 순환 참조 방지를 위해 생성만 하고 초기화는 나중에 수행
      this.cardSetSourceService = new CardSetSourceService(
        this.app, 
        this.getCardService(), 
        this.plugin.settings.defaultCardSetSource, 
        this.plugin
      );
      
      // 검색 서비스가 이미 생성되어 있다면 의존성 설정
      if (this.searchService) {
        this.cardSetSourceService.setSearchService(this.searchService);
      }
      
      // 카드 네비게이터 서비스가 이미 생성되어 있다면 의존성 설정
      if (this.cardNavigatorService) {
        this.cardNavigatorService.setCardSetSourceService(this.cardSetSourceService);
      }
    }
    return this.cardSetSourceService;
  }
  
  /**
   * 정렬 서비스 가져오기
   * @returns 정렬 서비스
   */
  getSortService(): ISortService {
    if (!this.sortService) {
      this.sortService = new SortService();
    }
    return this.sortService;
  }
  
  /**
   * 레이아웃 서비스 가져오기
   * @returns 레이아웃 서비스
   */
  getLayoutService(): ILayoutService {
    if (!this.layoutService) {
      this.layoutService = new LayoutService(this.plugin.settings);
    }
    return this.layoutService;
  }
  
  /**
   * 프리셋 서비스 가져오기
   * @returns 프리셋 서비스
   */
  getPresetService(): IPresetService {
    if (!this.presetService) {
      this.presetService = new PresetService(this.plugin.settings);
    }
    return this.presetService;
  }
  
  /**
   * 검색 서비스 가져오기
   * @returns 검색 서비스
   */
  getSearchService(): ISearchService {
    if (!this.searchService) {
      // 순환 참조 방지를 위해 먼저 서비스 생성
      this.searchService = new SearchService(
        this.getPresetService(), 
        this.getCardService(), 
        null, // 임시로 null 설정
        null  // 임시로 null 설정
      );
      
      // 카드셋 소스 서비스가 이미 생성되어 있다면 의존성 설정
      if (this.cardSetSourceService) {
        this.cardSetSourceService.setSearchService(this.searchService);
      }
      
      // 나중에 의존성 설정
      if (this.cardNavigatorService) {
        this.cardNavigatorService.setSearchService(this.searchService);
      }
    }
    return this.searchService;
  }
  
  /**
   * 카드 네비게이터 서비스 가져오기
   * @returns 카드 네비게이터 서비스
   */
  getCardNavigatorService(): ICardNavigatorService {
    if (!this.cardNavigatorService) {
      // 순환 참조 방지를 위해 필요한 서비스만 주입
      this.cardNavigatorService = new CardNavigatorService(
        this.app,
        this.cardRepository,
        this.plugin,
        this.getCardService(),
        undefined, // 임시로 undefined 설정
        this.getSortService(),
        this.getLayoutService(),
        this.getPresetService(),
        undefined  // 임시로 undefined 설정
      );
      
      // 나중에 의존성 설정
      if (this.cardSetSourceService) {
        this.cardNavigatorService.setCardSetSourceService(this.cardSetSourceService);
      }
      
      if (this.searchService) {
        this.cardNavigatorService.setSearchService(this.searchService);
      }
    }
    return this.cardNavigatorService;
  }
  
  /**
   * 설정 서비스 가져오기
   * @returns 설정 서비스
   */
  getSettingsService(): ISettingsService {
    if (!this.settingsService) {
      this.settingsService = new SettingsService(this.plugin);
    }
    return this.settingsService;
  }
  
  /**
   * 모든 서비스 초기화
   * 서비스 간 의존성을 설정하고 초기화합니다.
   */
  async initializeServices(): Promise<void> {
    try {
      // 기본 서비스 먼저 생성
      const cardService = this.getCardService();
      const sortService = this.getSortService();
      const layoutService = this.getLayoutService();
      const presetService = this.getPresetService();
      const settingsService = this.getSettingsService();
      
      // 순환 참조가 있는 서비스들 생성
      const cardSetSourceService = this.getCardSetSourceService();
      const cardNavigatorService = this.getCardNavigatorService();
      const searchService = this.getSearchService();
      
      // 의존성 설정
      cardSetSourceService.setSearchService(searchService);
      cardNavigatorService.setCardSetSourceService(cardSetSourceService);
      cardNavigatorService.setSearchService(searchService);
      
      // 서비스 초기화 - 의존성 설정 후 초기화
      await cardSetSourceService.initialize();
      await cardNavigatorService.initialize();
      
      console.log('[ServiceFactory] 모든 서비스 초기화 완료');
    } catch (error) {
      console.error('[ServiceFactory] 서비스 초기화 중 오류 발생:', error);
      throw error;
    }
  }
} 