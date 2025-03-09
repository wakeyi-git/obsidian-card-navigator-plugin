import { App } from 'obsidian';
import { PresetData } from '../domain/preset/Preset';
import { ModeType } from '../domain/mode/Mode';

/**
 * 플러그인 설정 인터페이스
 */
export interface CardNavigatorSettings {
  // 기본 설정
  defaultMode: ModeType;
  defaultLayout: 'grid' | 'masonry';
  includeSubfolders: boolean;
  defaultCardSet: string;
  isCardSetFixed: boolean;
  defaultSearchScope?: 'all' | 'current';
  tagCaseSensitive?: boolean;
  
  // 카드 설정
  cardWidth: number;
  cardHeight: number;
  cardHeaderContent?: string[] | string;
  cardBodyContent?: string[] | string;
  cardFooterContent?: string[] | string;
  cardHeaderFrontmatterKey?: string;
  cardBodyFrontmatterKey?: string;
  cardFooterFrontmatterKey?: string;
  renderingMode?: string;
  titleSource?: 'filename' | 'firstheader';
  includeFrontmatterInContent?: boolean;
  includeFirstHeaderInContent?: boolean;
  limitContentLength?: boolean;
  contentMaxLength?: number;
  
  // 카드 스타일 설정
  normalCardBgColor?: string;
  activeCardBgColor?: string;
  focusedCardBgColor?: string;
  headerBgColor?: string;
  bodyBgColor?: string;
  footerBgColor?: string;
  headerFontSize?: number;
  bodyFontSize?: number;
  footerFontSize?: number;
  
  // 테두리 스타일 설정
  normalCardBorderStyle?: string;
  normalCardBorderColor?: string;
  normalCardBorderWidth?: number;
  normalCardBorderRadius?: number;
  
  activeCardBorderStyle?: string;
  activeCardBorderColor?: string;
  activeCardBorderWidth?: number;
  activeCardBorderRadius?: number;
  
  focusedCardBorderStyle?: string;
  focusedCardBorderColor?: string;
  focusedCardBorderWidth?: number;
  focusedCardBorderRadius?: number;
  
  headerBorderStyle?: string;
  headerBorderColor?: string;
  headerBorderWidth?: number;
  headerBorderRadius?: number;
  
  bodyBorderStyle?: string;
  bodyBorderColor?: string;
  bodyBorderWidth?: number;
  bodyBorderRadius?: number;
  
  footerBorderStyle?: string;
  footerBorderColor?: string;
  footerBorderWidth?: number;
  footerBorderRadius?: number;
  
  // 검색 설정
  tagModeSearchOptions?: string[];
  folderModeSearchOptions?: string[];
  priorityTags: string[];
  priorityFolders: string[];
  presets: PresetData[];
  lastUsedPresetId?: string;
  searchHistory: string[];
}

/**
 * 기본 설정
 */
export const DEFAULT_SETTINGS: CardNavigatorSettings = {
  defaultMode: 'folder',
  defaultLayout: 'grid',
  includeSubfolders: true,
  defaultCardSet: '',
  isCardSetFixed: false,
  cardWidth: 300,
  cardHeight: 200,
  limitContentLength: true,
  contentMaxLength: 200,
  priorityTags: [],
  priorityFolders: [],
  presets: [],
  searchHistory: []
};

/**
 * 스토리지 인터페이스
 * 플러그인 설정 및 프리셋을 저장하고 불러오기 위한 인터페이스입니다.
 */
export interface IStorage {
  /**
   * 설정 불러오기
   * @returns 플러그인 설정
   */
  loadSettings(): Promise<CardNavigatorSettings>;
  
  /**
   * 설정 저장하기
   * @param settings 저장할 설정
   */
  saveSettings(settings: CardNavigatorSettings): Promise<void>;
  
  /**
   * 프리셋 불러오기
   * @returns 프리셋 데이터 목록
   */
  loadPresets(): Promise<PresetData[]>;
  
  /**
   * 프리셋 저장하기
   * @param presets 저장할 프리셋 데이터 목록
   */
  savePresets(presets: PresetData[]): Promise<void>;
  
  /**
   * 검색 기록 불러오기
   * @returns 검색 기록 목록
   */
  loadSearchHistory(): Promise<string[]>;
  
  /**
   * 검색 기록 저장하기
   * @param history 저장할 검색 기록 목록
   */
  saveSearchHistory(history: string[]): Promise<void>;
}

/**
 * 스토리지 클래스
 * 플러그인 설정 및 프리셋을 저장하고 불러오는 클래스입니다.
 */
export class Storage implements IStorage {
  private app: App;
  private plugin: any;
  private settings: CardNavigatorSettings;
  
  constructor(app: App, plugin: any) {
    this.app = app;
    this.plugin = plugin;
    this.settings = DEFAULT_SETTINGS;
  }
  
  async loadSettings(): Promise<CardNavigatorSettings> {
    try {
      const loadedData = await this.plugin.loadData();
      this.settings = Object.assign({}, DEFAULT_SETTINGS, loadedData || {});
      return this.settings;
    } catch (error) {
      console.error('Error loading settings:', error);
      return DEFAULT_SETTINGS;
    }
  }
  
  async saveSettings(settings: CardNavigatorSettings): Promise<void> {
    try {
      this.settings = settings;
      await this.plugin.saveData(settings);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }
  
  async loadPresets(): Promise<PresetData[]> {
    const settings = await this.loadSettings();
    return settings.presets || [];
  }
  
  async savePresets(presets: PresetData[]): Promise<void> {
    const settings = await this.loadSettings();
    settings.presets = presets;
    await this.saveSettings(settings);
  }
  
  async loadSearchHistory(): Promise<string[]> {
    const settings = await this.loadSettings();
    return settings.searchHistory || [];
  }
  
  async saveSearchHistory(history: string[]): Promise<void> {
    const settings = await this.loadSettings();
    settings.searchHistory = history;
    await this.saveSettings(settings);
  }
  
  /**
   * 마지막으로 사용한 프리셋 ID 저장
   * @param presetId 프리셋 ID
   */
  async saveLastUsedPresetId(presetId: string): Promise<void> {
    const settings = await this.loadSettings();
    settings.lastUsedPresetId = presetId;
    await this.saveSettings(settings);
  }
  
  /**
   * 마지막으로 사용한 프리셋 ID 불러오기
   * @returns 프리셋 ID 또는 undefined
   */
  async loadLastUsedPresetId(): Promise<string | undefined> {
    const settings = await this.loadSettings();
    return settings.lastUsedPresetId;
  }
  
  /**
   * 우선순위 태그 저장
   * @param tags 태그 목록
   */
  async savePriorityTags(tags: string[]): Promise<void> {
    const settings = await this.loadSettings();
    settings.priorityTags = tags;
    await this.saveSettings(settings);
  }
  
  /**
   * 우선순위 폴더 저장
   * @param folders 폴더 목록
   */
  async savePriorityFolders(folders: string[]): Promise<void> {
    const settings = await this.loadSettings();
    settings.priorityFolders = folders;
    await this.saveSettings(settings);
  }
  
  /**
   * 기본 모드 저장
   * @param mode 모드 타입
   */
  async saveDefaultMode(mode: ModeType): Promise<void> {
    const settings = await this.loadSettings();
    settings.defaultMode = mode;
    await this.saveSettings(settings);
  }
  
  /**
   * 기본 레이아웃 저장
   * @param layout 레이아웃 타입
   */
  async saveDefaultLayout(layout: 'grid' | 'masonry'): Promise<void> {
    const settings = await this.loadSettings();
    settings.defaultLayout = layout;
    await this.saveSettings(settings);
  }
  
  /**
   * 카드 크기 저장
   * @param width 카드 너비
   * @param height 카드 높이
   */
  async saveCardSize(width: number, height: number): Promise<void> {
    const settings = await this.loadSettings();
    settings.cardWidth = width;
    settings.cardHeight = height;
    await this.saveSettings(settings);
  }
} 