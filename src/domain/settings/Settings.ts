import { Plugin } from 'obsidian';
import { ICardNavigatorSettings, ISettingsService } from './SettingsInterfaces';
import { DomainEventBus } from '../events/DomainEventBus';
import { CardSetSourceType } from '../cardset/CardSet';
import { EventType } from '../events/EventTypes';

/**
 * 기본 설정
 */
export const DEFAULT_SETTINGS: ICardNavigatorSettings = {
  // 기본 설정
  defaultCardSetSource: 'folder',
  defaultLayout: 'grid',
  includeSubfolders: true,
  defaultFolderCardSet: '',
  defaultTagCardSet: '',
  isCardSetFixed: false,
  defaultSearchScope: 'current',
  tagCaseSensitive: false,
  useLastCardSetSourceOnLoad: true,
  
  // 카드 설정
  cardWidth: 250,
  cardHeight: 150,
  cardHeaderContent: 'filename',
  cardBodyContent: 'content',
  cardFooterContent: 'tags',
  titleSource: 'filename',
  includeFrontmatterInContent: false,
  includeFirstHeaderInContent: true,
  limitContentLength: true,
  contentMaxLength: 200,
  
  // 카드 스타일 설정
  normalCardBgColor: '',
  activeCardBgColor: '',
  focusedCardBgColor: '',
  headerBgColor: '',
  bodyBgColor: '',
  footerBgColor: '',
  headerFontSize: 16,
  bodyFontSize: 14,
  footerFontSize: 12,
  
  // 테두리 스타일 설정
  normalCardBorderStyle: 'solid',
  normalCardBorderColor: '',
  normalCardBorderWidth: 1,
  normalCardBorderRadius: 5,
  
  activeCardBorderStyle: 'solid',
  activeCardBorderColor: 'var(--interactive-accent)',
  activeCardBorderWidth: 2,
  activeCardBorderRadius: 5,
  
  focusedCardBorderStyle: 'solid',
  focusedCardBorderColor: 'var(--interactive-accent)',
  focusedCardBorderWidth: 2,
  focusedCardBorderRadius: 5,
  
  headerBorderStyle: 'none',
  headerBorderColor: '',
  headerBorderWidth: 0,
  headerBorderRadius: 0,
  
  bodyBorderStyle: 'none',
  bodyBorderColor: '',
  bodyBorderWidth: 0,
  bodyBorderRadius: 0,
  
  footerBorderStyle: 'none',
  footerBorderColor: '',
  footerBorderWidth: 0,
  footerBorderRadius: 0,
  
  // 검색 설정
  searchCaseSensitive: false,
  highlightSearchResults: true,
  maxSearchResults: 100,
  
  // 정렬 설정
  sortBy: 'filename',
  sortOrder: 'asc',
  
  // 레이아웃 설정
  fixedCardHeight: true,
  cardMinWidth: 200,
  cardMinHeight: 100,
  cardGap: 10,
  
  // 우선 순위 설정
  priorityTags: [],
  priorityFolders: [],
};

/**
 * 설정 클래스
 * 카드 네비게이터 설정을 관리합니다.
 */
export class Settings implements ISettingsService {
  /**
   * 현재 설정
   */
  private settings: ICardNavigatorSettings;
  
  /**
   * 플러그인 인스턴스
   */
  private plugin: Plugin;
  
  /**
   * 이벤트 버스
   */
  private eventBus: DomainEventBus;
  
  /**
   * 생성자
   * @param plugin 플러그인 인스턴스
   * @param eventBus 이벤트 버스
   */
  constructor(plugin: Plugin, eventBus: DomainEventBus) {
    this.plugin = plugin;
    this.eventBus = eventBus;
    this.settings = { ...DEFAULT_SETTINGS };
  }
  
  /**
   * 설정 로드
   * @returns 로드된 설정
   */
  async loadSettings(): Promise<ICardNavigatorSettings> {
    const loadedData = await this.plugin.loadData();
    this.settings = { ...DEFAULT_SETTINGS, ...loadedData };
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
    this.settings = { ...DEFAULT_SETTINGS };
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