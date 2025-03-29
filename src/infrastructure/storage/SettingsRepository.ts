import { Plugin } from 'obsidian';
import { CardNavigatorSettings } from '../../domain/models/types';

/**
 * 설정 저장소
 */
export class SettingsRepository {
  private settings: CardNavigatorSettings;

  constructor(
    private readonly plugin: Plugin,
    private readonly pluginId: string
  ) {
    this.settings = this.getDefaultSettings();
  }

  /**
   * 설정을 로드합니다.
   */
  async loadSettings(): Promise<CardNavigatorSettings> {
    const data = await this.plugin.loadData();
    if (data) {
      this.settings = { ...this.settings, ...data };
    }
    return this.settings;
  }

  /**
   * 설정을 저장합니다.
   */
  async saveSettings(): Promise<void> {
    await this.plugin.saveData(this.settings);
  }

  /**
   * 설정을 업데이트합니다.
   */
  async updateSettings(settings: Partial<CardNavigatorSettings>): Promise<void> {
    this.settings = { ...this.settings, ...settings };
    await this.saveSettings();
  }

  /**
   * 설정을 가져옵니다.
   */
  getSettings(): CardNavigatorSettings {
    return { ...this.settings };
  }

  /**
   * 기본 설정을 반환합니다.
   */
  private getDefaultSettings(): CardNavigatorSettings {
    return {
      cardSetType: 'activeFolder',
      selectedFolder: null,
      sortCriterion: 'fileName',
      sortOrder: 'asc',
      renderContentAsHtml: false,
      dragDropContent: true,
      defaultLayout: 'auto',
      cardWidthThreshold: 300,
      alignCardHeight: false,
      cardsPerView: 3,
      gridColumns: 3,
      gridCardHeight: 200,
      masonryColumns: 3,
      showFileName: true,
      showFirstHeader: true,
      showBody: true,
      bodyLengthLimit: true,
      bodyLength: 200,
      fileNameFontSize: 16,
      firstHeaderFontSize: 14,
      bodyFontSize: 12,
      presetFolderPath: '.obsidian/plugins/card-navigator/presets',
      GlobalPreset: '',
      lastActivePreset: '',
      autoApplyPresets: true,
      autoApplyFolderPresets: true,
      folderPresets: {},
      activeFolderPresets: {},
      enableScrollAnimation: true
    };
  }
} 