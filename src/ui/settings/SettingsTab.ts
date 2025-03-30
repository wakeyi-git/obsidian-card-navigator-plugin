import { App, PluginSettingTab, Setting } from 'obsidian';
import { CardSet, CardSetType, ICardSetConfig } from '@/domain/models/CardSet';
import { Layout, LayoutType, LayoutDirection, ILayoutConfig } from '@/domain/models/Layout';
import { Preset } from '@/domain/models/Preset';
import { ICardRenderConfig } from '@/domain/models/Card';
import { CardSettings } from '@/ui/settings/components/CardSettings';
import { CardSetSettings } from '@/ui/settings/components/CardSetSettings';
import { SearchSettings } from '@/ui/settings/components/SearchSettings';
import { SortSettings } from '@/ui/settings/components/SortSettings';
import { LayoutSettings } from '@/ui/settings/components/LayoutSettings';
import { NavigationSettings } from '@/ui/settings/components/NavigationSettings';
import { PresetSettings } from '@/ui/settings/components/PresetSettings';
import { Command } from 'obsidian';
import CardNavigatorPlugin from '@/main';

/**
 * 카드 내비게이터 설정 인터페이스
 */
export interface ICardNavigatorSettings {
  // 카드셋 설정
  defaultCardSetType: CardSetType;
  includeSubfolders: boolean;
  linkLevel: number;

  // 검색 설정
  defaultSearchScope: 'vault' | 'current';
  realtimeSearch: boolean;
  maxSearchResults: number;
  searchInFileName: boolean;
  searchInTags: boolean;
  searchInLinks: boolean;

  // 카드 설정
  cardRenderConfig: ICardRenderConfig;
  cardStyle: {
    card: ICardStyle;
    activeCard: ICardStyle;
    focusedCard: ICardStyle;
    header: ICardStyle;
    body: ICardStyle;
    footer: ICardStyle;
  };

  // 정렬 설정
  sortBy: ICardSetConfig['sortBy'];
  sortOrder: ICardSetConfig['sortOrder'];
  customSortField?: string;
  priorityTags?: string[];
  priorityFolders?: string[];

  // 레이아웃 설정
  layout: {
    type: LayoutType;
    direction: LayoutDirection;
    fixedHeight: boolean;
    minCardWidth: number;
    minCardHeight: number;
    gap?: number;
    padding?: number;
  };

  // 프리셋 설정
  presets: Preset[];
  folderPresets: Map<string, string>; // 폴더 경로 -> 프리셋 ID
  tagPresets: Map<string, string>; // 태그 -> 프리셋 ID
  presetPriority: string[]; // 프리셋 우선순위 (폴더/태그 ID)

  // 네비게이션 설정
  keyboardNavigationEnabled: boolean;
  scrollBehavior: 'smooth' | 'instant';
  autoFocusActiveCard: boolean;
}

/**
 * 카드 스타일 인터페이스
 */
interface ICardStyle {
  background: string;
  fontSize: string;
  borderColor: string;
  borderWidth: string;
}

/**
 * 설정 컴포넌트에 전달할 플러그인 인터페이스
 */
export interface IPluginWithSettings {
  settings: ICardNavigatorSettings;
  app: App;
  getSetting: (key: string) => any;
  setSetting: (key: string, value: any) => void;
  saveSettings: () => void;
  addCommand: (command: Command) => void;
  registerEvent: (event: any) => void;
  registerDomEvent: (el: HTMLElement, type: keyof HTMLElementEventMap, callback: (evt: Event) => any) => void;
  registerInterval: (id: any) => void;
}

/**
 * 카드 내비게이터 설정 탭
 */
export class CardNavigatorSettingsTab extends PluginSettingTab {
  constructor(
    app: App,
    private readonly plugin: CardNavigatorPlugin,
    private readonly settings: ICardNavigatorSettings
  ) {
    super(app, plugin);
  }

  /**
   * 설정 표시
   */
  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    // 설정 탭 제목 추가
    containerEl.createEl('h2', { text: '카드 내비게이터 설정' });

    // 설정 컨테이너 생성
    const settingsContainer = containerEl.createDiv('card-navigator-settings');

    // settings가 없으면 기본값으로 초기화
    if (!this.settings) {
      const defaultSettings: ICardNavigatorSettings = {
        defaultCardSetType: 'folder',
        includeSubfolders: true,
        linkLevel: 1,
        defaultSearchScope: 'current',
        realtimeSearch: true,
        maxSearchResults: 50,
        searchInFileName: true,
        searchInTags: true,
        searchInLinks: true,
        cardRenderConfig: {
          header: {
            showFileName: true,
            showFirstHeader: true,
            showTags: true,
            showCreatedDate: false,
            showUpdatedDate: false,
            showProperties: [],
            renderMarkdown: true
          },
          body: {
            showFileName: false,
            showFirstHeader: false,
            showContent: true,
            showTags: false,
            showCreatedDate: false,
            showUpdatedDate: false,
            showProperties: [],
            contentLength: 200,
            renderMarkdown: true
          },
          footer: {
            showFileName: false,
            showFirstHeader: false,
            showTags: false,
            showCreatedDate: false,
            showUpdatedDate: false,
            showProperties: [],
            renderMarkdown: true
          },
          renderAsHtml: true
        },
        cardStyle: {
          card: {
            background: 'var(--background-secondary)',
            fontSize: '14px',
            borderColor: 'var(--background-modifier-border)',
            borderWidth: '1px'
          },
          activeCard: {
            background: 'var(--background-modifier-hover)',
            fontSize: '14px',
            borderColor: 'var(--interactive-accent)',
            borderWidth: '2px'
          },
          focusedCard: {
            background: 'var(--background-modifier-hover)',
            fontSize: '14px',
            borderColor: 'var(--interactive-accent)',
            borderWidth: '2px'
          },
          header: {
            background: 'var(--background-secondary)',
            fontSize: '14px',
            borderColor: 'var(--background-modifier-border)',
            borderWidth: '1px'
          },
          body: {
            background: 'var(--background-primary)',
            fontSize: '14px',
            borderColor: 'var(--background-modifier-border)',
            borderWidth: '1px'
          },
          footer: {
            background: 'var(--background-secondary)',
            fontSize: '12px',
            borderColor: 'var(--background-modifier-border)',
            borderWidth: '1px'
          }
        },
        sortBy: 'fileName',
        sortOrder: 'asc',
        layout: {
          type: LayoutType.GRID,
          direction: LayoutDirection.VERTICAL,
          fixedHeight: false,
          minCardWidth: 300,
          minCardHeight: 200,
          gap: 16,
          padding: 16
        },
        presets: [],
        folderPresets: new Map(),
        tagPresets: new Map(),
        presetPriority: [],
        keyboardNavigationEnabled: true,
        scrollBehavior: 'smooth',
        autoFocusActiveCard: true
      };
      this.plugin.setSettings(defaultSettings);
    }

    // 각 설정 컴포넌트에 전달할 plugin 객체 준비
    const pluginWithSettings: IPluginWithSettings = {
      settings: this.settings,
      app: this.app,
      getSetting: (key: string) => {
        const parts = key.split('.');
        let value: any = this.settings;
        
        for (const part of parts) {
          value = value[part];
        }
        
        return value;
      },
      setSetting: (key: string, value: any) => {
        this.plugin.setSetting(key, value);
      },
      saveSettings: () => this.plugin.saveSettings(),
      addCommand: (command: Command) => {
        this.plugin.addCommand(command);
      },
      registerEvent: (event: any) => {
        this.plugin.registerEvent(event);
      },
      registerDomEvent: (el: HTMLElement, type: keyof HTMLElementEventMap, callback: (evt: Event) => any) => {
        this.plugin.registerDomEvent(el, type, callback);
      },
      registerInterval: (id: any) => {
        this.plugin.registerInterval(id);
      }
    };

    // 카드셋 설정
    const cardSetContainer = settingsContainer.createDiv('card-navigator-settings-section');
    new CardSetSettings(cardSetContainer, pluginWithSettings).display();

    // 검색 설정
    const searchContainer = settingsContainer.createDiv('card-navigator-settings-section');
    new SearchSettings(searchContainer, pluginWithSettings).display();

    // 정렬 설정
    const sortContainer = settingsContainer.createDiv('card-navigator-settings-section');
    new SortSettings(sortContainer, pluginWithSettings).display();

    // 카드 설정
    const cardContainer = settingsContainer.createDiv('card-navigator-settings-section');
    new CardSettings(cardContainer, pluginWithSettings).display();

    // 레이아웃 설정
    const layoutContainer = settingsContainer.createDiv('card-navigator-settings-section');
    new LayoutSettings(layoutContainer, pluginWithSettings).display();

    // 네비게이션 설정
    const navigationContainer = settingsContainer.createDiv('card-navigator-settings-section');
    new NavigationSettings(navigationContainer, pluginWithSettings).display();

    // 프리셋 설정
    const presetService = this.plugin.getPresetService();
    if (presetService) {
      const presetContainer = settingsContainer.createDiv('card-navigator-settings-section');
      new PresetSettings(presetContainer, this.app, pluginWithSettings, presetService).display();
    }
  }
} 