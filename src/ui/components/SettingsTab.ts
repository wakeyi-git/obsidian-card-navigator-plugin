import { App, PluginSettingTab, Setting } from 'obsidian';
import { CardSet, CardSetType, ICardSetConfig } from '@/domain/models/CardSet';
import { Layout, LayoutType, LayoutDirection, ILayoutConfig } from '@/domain/models/Layout';
import { Preset } from '@/domain/models/Preset';
import { ICardRenderConfig } from '@/domain/models/Card';
import { PresetEditModal } from '@/ui/components/modals/PresetEditModal';
import { PresetImportExportModal } from '@/ui/components/modals/PresetImportExportModal';
import { CardSettings } from '@/ui/settings/components/CardSettings';
import { CardSetSettings } from '@/ui/settings/components/CardSetSettings';
import { SearchSettings } from '@/ui/settings/components/SearchSettings';
import { SortSettings } from '@/ui/settings/components/SortSettings';
import { LayoutSettings } from '@/ui/settings/components/LayoutSettings';
import { NavigationSettings } from '@/ui/settings/components/NavigationSettings';
import { PresetSettings } from '@/ui/settings/components/PresetSettings';
import { ToolbarSettings } from '@/ui/settings/components/ToolbarSettings';

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
    card: {
      background: string;
      fontSize: string;
      borderColor: string;
      borderWidth: string;
    };
    activeCard: {
      background: string;
      fontSize: string;
      borderColor: string;
      borderWidth: string;
    };
    focusedCard: {
      background: string;
      fontSize: string;
      borderColor: string;
      borderWidth: string;
    };
    header: {
      background: string;
      fontSize: string;
      borderColor: string;
      borderWidth: string;
    };
    body: {
      background: string;
      fontSize: string;
      borderColor: string;
      borderWidth: string;
    };
    footer: {
      background: string;
      fontSize: string;
      borderColor: string;
      borderWidth: string;
    };
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
 * 카드 내비게이터 설정 탭
 */
export class CardNavigatorSettingsTab extends PluginSettingTab {
  constructor(
    app: App,
    private readonly plugin: any,
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

    // settings가 없으면 기본값으로 초기화
    if (!this.plugin.settings) {
      this.plugin.settings = {
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
          minCardHeight: 200
        },
        presets: [],
        folderPresets: new Map(),
        tagPresets: new Map(),
        presetPriority: [],
        keyboardNavigationEnabled: true,
        scrollBehavior: 'smooth',
        autoFocusActiveCard: true
      };
      this.plugin.saveData();
    }

    // 카드셋 설정
    new CardSetSettings(containerEl, this.plugin).display();

    // 검색 설정
    new SearchSettings(containerEl, this.plugin).display();

    // 정렬 설정
    new SortSettings(containerEl, this.plugin).display();

    // 카드 설정
    new CardSettings(containerEl, this.plugin).display();

    // 레이아웃 설정
    new LayoutSettings(containerEl, this.plugin).display();

    // 네비게이션 설정
    new NavigationSettings(containerEl, this.plugin).display();

    // 툴바 설정
    new ToolbarSettings(containerEl, this.app, this.plugin).display();

    // 프리셋 설정
    new PresetSettings(containerEl, this.app, this.plugin).display();
  }
} 