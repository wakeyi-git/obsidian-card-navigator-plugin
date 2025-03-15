import { App, PluginSettingTab, Setting } from 'obsidian';
import { ICardNavigatorSettings, ISettingsService, LayoutDirectionPreference } from '../../domain/settings/SettingsInterfaces';
import CardNavigatorPlugin from '../../main';
import { EventType } from '../../domain/events/EventTypes';
import { DomainEventBus } from '../../domain/events/DomainEventBus';
import { NavigationMode } from '../../domain/navigation';

/**
 * 설정 서비스
 * 플러그인 설정을 관리하는 서비스입니다.
 */
export class SettingsService implements ISettingsService {
  private plugin: CardNavigatorPlugin;
  private settings: ICardNavigatorSettings;
  private eventBus: DomainEventBus;
  
  /**
   * 생성자
   * @param plugin 플러그인 인스턴스
   * @param eventBus 이벤트 버스
   */
  constructor(plugin: CardNavigatorPlugin, eventBus: DomainEventBus) {
    this.plugin = plugin;
    this.eventBus = eventBus;
    this.settings = this.getDefaultSettings();
  }
  
  /**
   * 기본 설정 값 가져오기
   * @returns 기본 설정 값
   */
  getDefaultSettings(): ICardNavigatorSettings {
    return {
      // 기본 설정
      enabled: true,
      autoRefresh: true,
      
      // 카드셋 관련 설정
      defaultCardSetSource: 'folder',
      defaultLayout: 'grid',
      includeSubfolders: true,
      defaultFolderCardSet: '',
      defaultTagCardSet: '',
      isCardSetFixed: false,
      defaultSearchScope: 'all',
      tagCaseSensitive: false,
      useLastCardSetSourceOnLoad: true,
      
      // 디버그 모드
      debugMode: false,
      
      // 카드 스타일 설정
      cardWidth: 250,
      cardHeight: 150, // 숫자 값으로 변경
      cardHeaderContent: 'filename',
      cardBodyContent: 'content',
      cardFooterContent: 'tags',
      
      // 카드 콘텐츠 설정
      titleSource: 'filename',
      includeFrontmatterInContent: false,
      includeFirstHeaderInContent: true,
      limitContentLength: true,
      contentMaxLength: 200,
      
      // 카드 색상 설정
      normalCardBgColor: 'var(--background-primary)',
      activeCardBgColor: 'var(--background-primary-alt)',
      focusedCardBgColor: 'var(--background-primary-alt)',
      hoverCardBgColor: 'var(--background-primary-alt)',
      
      // 카드 섹션 색상 설정
      headerBgColor: 'var(--background-secondary-alt)',
      bodyBgColor: 'var(--background-primary)',
      footerBgColor: 'var(--background-secondary-alt)',
      
      // 카드 폰트 크기 설정
      headerFontSize: 14,
      bodyFontSize: 14,
      footerFontSize: 12,
      
      // 카드 테두리 설정 - 기본
      normalCardBorderStyle: 'solid',
      normalCardBorderColor: 'var(--background-modifier-border)',
      normalCardBorderWidth: 1,
      normalCardBorderRadius: 5,
      
      // 카드 테두리 설정 - 활성
      activeCardBorderStyle: 'solid',
      activeCardBorderColor: 'var(--interactive-accent)',
      activeCardBorderWidth: 2,
      activeCardBorderRadius: 5,
      
      // 카드 테두리 설정 - 포커스
      focusedCardBorderStyle: 'solid',
      focusedCardBorderColor: 'var(--interactive-accent)',
      focusedCardBorderWidth: 2,
      focusedCardBorderRadius: 5,
      
      // 카드 테두리 설정 - 호버
      hoverCardBorderColor: 'var(--interactive-accent)',
      
      // 카드 섹션 테두리 설정 - 헤더
      headerBorderStyle: 'none',
      headerBorderColor: 'var(--background-modifier-border)',
      headerBorderWidth: 0,
      headerBorderRadius: 0,
      
      // 카드 섹션 테두리 설정 - 바디
      bodyBorderStyle: 'none',
      bodyBorderColor: 'var(--background-modifier-border)',
      bodyBorderWidth: 0,
      bodyBorderRadius: 0,
      
      // 카드 섹션 테두리 설정 - 푸터
      footerBorderStyle: 'none',
      footerBorderColor: 'var(--background-modifier-border)',
      footerBorderWidth: 0,
      footerBorderRadius: 0,
      
      // 검색 설정
      searchCaseSensitive: false,
      highlightSearchResults: true,
      maxSearchResults: 50,
      
      // 정렬 설정
      sortBy: 'name',
      sortOrder: 'asc',
      defaultSortType: 'alphabetical',
      defaultSortDirection: 'asc',
      defaultSortBy: 'filename',
      customSortFrontmatterKey: '',
      customSortValueType: 'string',
      
      // 레이아웃 설정
      layout: {
        fixedCardHeight: true,
        layoutDirectionPreference: LayoutDirectionPreference.AUTO,
        cardThresholdWidth: 200,
        cardThresholdHeight: 150,
        cardGap: 10,
        cardsetPadding: 10,
        cardSizeFactor: 1.0,
        useLayoutTransition: true
      },
      
      // 태그 및 폴더 우선순위 설정
      priorityTags: [],
      priorityFolders: [],
      
      // 카드 렌더링 모드
      cardRenderingMode: 'text',
      
      // 프론트매터 키
      frontmatterKey: '',
      
      // 필터 설정
      defaultFilterEnabled: false,
      defaultFilterType: 'tag',
      defaultTagFilter: '',
      defaultTextFilter: '',
      defaultFrontmatterFilterKey: '',
      defaultFrontmatterFilterValue: '',
      defaultFilterOperator: 'AND',
      filterCaseSensitive: false,
      
      // 미리보기 설정
      previewSampleType: 'first',
      
      // 검색 기록 설정
      maxSearchHistory: 10,
      
      // 네비게이션 모드
      navigationMode: 'grid' as NavigationMode,
      
      // 선택 모드
      selectionMode: 'single',
      
      // 드래그 모드
      dragMode: 'none'
    };
  }
  
  /**
   * 설정 로드
   * @returns 로드된 설정
   */
  async loadSettings(): Promise<ICardNavigatorSettings> {
    const loadedSettings = await this.plugin.loadData();
    this.settings = { ...this.getDefaultSettings(), ...loadedSettings };
    
    // 디버깅: 설정 로드 로깅
    console.log('기본 설정 값:', {
      cardHeaderContent: this.settings.cardHeaderContent,
      cardBodyContent: this.settings.cardBodyContent,
      cardFooterContent: this.settings.cardFooterContent
    });
    
    this.emit(EventType.SETTINGS_LOADED, null);
    return this.settings;
  }
  
  /**
   * 설정 저장
   * @param settings 저장할 설정
   */
  async saveSettings(settings: ICardNavigatorSettings): Promise<void> {
    this.settings = settings;
    await this.plugin.saveData(this.settings);
    this.emit(EventType.SETTINGS_SAVED, null);
  }
  
  /**
   * 설정 업데이트
   * @param settings 업데이트할 설정
   */
  async updateSettings(settings: Partial<ICardNavigatorSettings>): Promise<void> {
    this.settings = { ...this.settings, ...settings };
    await this.plugin.saveData(this.settings);
    this.emit(EventType.SETTINGS_CHANGED, { 
      settings: this.settings, 
      changedKeys: Object.keys(settings) 
    });
  }
  
  /**
   * 설정 초기화
   */
  async resetSettings(): Promise<void> {
    this.settings = this.getDefaultSettings();
    await this.plugin.saveData(this.settings);
    this.emit(EventType.SETTINGS_RESET, null);
  }
  
  /**
   * 현재 설정 가져오기
   * @returns 현재 설정
   */
  getSettings(): ICardNavigatorSettings {
    return { ...this.settings };
  }
  
  /**
   * 플러그인 인스턴스 가져오기
   * @returns 플러그인 인스턴스
   */
  getPlugin(): any {
    return this.plugin;
  }
  
  /**
   * 설정 변경 이벤트 리스너 등록
   * @param listener 리스너 함수
   */
  onSettingsChanged(listener: (settings: ICardNavigatorSettings) => void): void {
    this.on(EventType.SETTINGS_CHANGED, listener);
  }
  
  /**
   * 설정 변경 이벤트 리스너 제거
   * @param listener 리스너 함수
   */
  offSettingsChanged(listener: (settings: ICardNavigatorSettings) => void): void {
    this.off(EventType.SETTINGS_CHANGED, listener);
  }
  
  /**
   * 이벤트 리스너 등록
   * @param event 이벤트 이름
   * @param listener 리스너 함수
   */
  on(event: EventType, listener: (...args: any[]) => void): void {
    this.eventBus.on(event, listener);
  }
  
  /**
   * 이벤트 리스너 제거
   * @param event 이벤트 이름
   * @param listener 리스너 함수
   */
  off(event: EventType, listener: (...args: any[]) => void): void {
    this.eventBus.off(event, listener);
  }
  
  /**
   * 이벤트 발생
   * @param event 이벤트 이름
   * @param data 이벤트 데이터
   */
  emit(event: EventType, data: any): void {
    this.eventBus.emit(event, data);
  }
} 