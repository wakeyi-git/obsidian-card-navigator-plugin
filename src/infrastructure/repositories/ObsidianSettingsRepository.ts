import { App, Plugin, TFile } from 'obsidian';
import { ISettings, ISettingsRepository } from '../../domain/settings/Settings';
import { CardSetSourceMode } from '../../domain/cardset/CardSet';
import { NavigationMode } from '../../domain/navigation/Navigation';
import { LayoutDirectionPreference } from '../../domain/settings/Settings';

/**
 * 기본 설정값
 */
const DEFAULT_SETTINGS: ISettings = {
  enabled: true,
  autoRefresh: true,
  defaultCardSetSource: CardSetSourceMode.FOLDER,
  defaultLayout: 'grid',
  includeSubfolders: true,
  defaultFolderCardSet: '',
  defaultTagCardSet: '',
  isCardSetFixed: false,
  defaultSearchScope: 'all',
  tagCaseSensitive: false,
  useLastCardSetSourceOnLoad: true,
  debugMode: false,
  
  cardSetSourceMode: CardSetSourceMode.FOLDER,
  selectedFolder: '',
  selectedTags: [],
  
  cardWidth: 200,
  cardHeight: 150,
  cardHeaderContent: 'filename',
  cardBodyContent: 'content',
  cardFooterContent: 'tags',
  cardHeaderContentMultiple: ['filename'],
  cardBodyContentMultiple: ['content'],
  cardFooterContentMultiple: ['tags'],
  
  layout: {
    mode: 'grid',
    cardWidth: 200,
    cardHeight: 150,
    gap: 10,
    padding: 10,
    layoutDirectionPreference: LayoutDirectionPreference.AUTO
  },
  
  navigationMode: NavigationMode.GRID,
  
  presets: [],
  presetMappings: [],
  
  toolbarItems: []
};

/**
 * Obsidian 설정 저장소
 * 플러그인의 설정을 관리하고 저장합니다.
 */
export class ObsidianSettingsRepository implements ISettingsRepository {
  private app: App;

  constructor(private plugin: Plugin) {
    this.app = plugin.app;
  }

  /**
   * 설정 로드
   */
  async load(): Promise<ISettings> {
    const data = await this.plugin.loadData();
    return { ...DEFAULT_SETTINGS, ...data };
  }

  /**
   * 설정 저장
   */
  async save(settings: ISettings): Promise<void> {
    await this.plugin.saveData(settings);
  }

  /**
   * 기본 설정 가져오기
   */
  getDefaultSettings(): ISettings {
    return { ...DEFAULT_SETTINGS };
  }

  /**
   * 파일의 태그 확인
   */
  async hasFileTag(file: TFile, tag: string): Promise<boolean> {
    const cache = this.app.metadataCache.getFileCache(file);
    return cache?.tags?.some(t => t.tag === tag) || false;
  }

  /**
   * 파일의 프로퍼티 확인
   */
  async getFileProperty(file: TFile, key: string): Promise<any> {
    const cache = this.app.metadataCache.getFileCache(file);
    return cache?.frontmatter?.[key];
  }
} 