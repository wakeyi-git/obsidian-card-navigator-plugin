import { PluginSettings } from '../../core/types/settings.types';

/**
 * 설정 마이그레이션 관리자 클래스
 * 플러그인 설정의 버전 간 마이그레이션을 관리합니다.
 */
export class SettingsMigrationManager {
  /**
   * 현재 설정 버전
   */
  private static readonly CURRENT_SETTINGS_VERSION = 2;

  /**
   * 설정 마이그레이션 수행
   * @param settings 현재 설정 객체
   * @returns 마이그레이션된 설정 객체
   */
  public migrateSettings(settings: PluginSettings): PluginSettings {
    try {
      // 설정 버전이 없는 경우 버전 1로 간주
      if (!settings.version) {
        settings = this.migrateFromV0ToV1(settings);
      }

      // 버전 1에서 버전 2로 마이그레이션
      if (settings.version === 1) {
        settings = this.migrateFromV1ToV2(settings);
      }

      // 추가 마이그레이션은 여기에 추가

      // 최종 버전 설정
      settings.version = SettingsMigrationManager.CURRENT_SETTINGS_VERSION;

      return settings;
    } catch (error) {
      console.error('SettingsMigrationManager.migrateSettings: 설정 마이그레이션 중 오류가 발생했습니다.', error);
      
      // 오류 발생 시 기본 설정 반환
      return this.getDefaultSettings();
    }
  }

  /**
   * 버전 0(버전 없음)에서 버전 1로 마이그레이션
   * @param oldSettings 이전 설정 객체
   * @returns 마이그레이션된 설정 객체
   */
  private migrateFromV0ToV1(oldSettings: any): PluginSettings {
    try {
      const newSettings: PluginSettings = {
        ...this.getDefaultSettings(),
        version: 1
      };

      // 기존 설정 값 복사
      if (oldSettings) {
        // 카드 설정 마이그레이션
        if (oldSettings.cardSettings) {
          newSettings.cardSettings = {
            ...newSettings.cardSettings,
            ...oldSettings.cardSettings
          };
        }

        // 레이아웃 설정 마이그레이션
        if (oldSettings.layoutSettings) {
          newSettings.layoutSettings = {
            ...newSettings.layoutSettings,
            ...oldSettings.layoutSettings
          };
        }

        // 프리셋 마이그레이션
        if (oldSettings.presets) {
          newSettings.presets = [...oldSettings.presets];
        }

        // 폴더별 프리셋 마이그레이션
        if (oldSettings.folderPresets) {
          newSettings.folderPresets = { ...oldSettings.folderPresets };
        }
      }

      return newSettings;
    } catch (error) {
      console.error('SettingsMigrationManager.migrateFromV0ToV1: 버전 0에서 버전 1로 마이그레이션 중 오류가 발생했습니다.', error);
      return this.getDefaultSettings();
    }
  }

  /**
   * 버전 1에서 버전 2로 마이그레이션
   * @param oldSettings 이전 설정 객체
   * @returns 마이그레이션된 설정 객체
   */
  private migrateFromV1ToV2(oldSettings: PluginSettings): PluginSettings {
    try {
      const newSettings: PluginSettings = {
        ...oldSettings,
        version: 2
      };

      // 버전 2에서 추가된 설정 초기화
      newSettings.searchSettings = {
        saveSearchHistory: true,
        maxSearchHistoryItems: 10,
        enableSearchSuggestions: true,
        searchInFilename: true,
        searchInContent: true,
        searchInTags: true,
        caseSensitive: false,
        useRegex: false
      };

      // 카드셋 설정 추가
      newSettings.cardSetSettings = {
        defaultCardSetMode: 'activeFolder',
        rememberLastCardSetMode: true,
        autoUpdateCardSet: true
      };

      return newSettings;
    } catch (error) {
      console.error('SettingsMigrationManager.migrateFromV1ToV2: 버전 1에서 버전 2로 마이그레이션 중 오류가 발생했습니다.', error);
      return oldSettings;
    }
  }

  /**
   * 기본 설정 가져오기
   * @returns 기본 설정 객체
   */
  private getDefaultSettings(): PluginSettings {
    return {
      version: SettingsMigrationManager.CURRENT_SETTINGS_VERSION,
      cardSettings: {
        showFilename: true,
        showFirstHeader: true,
        showContent: true,
        contentMaxLength: 200,
        showTags: true,
        showDate: false,
        dateFormat: 'YYYY-MM-DD',
        showFrontmatter: false,
        renderMarkdown: true,
        enableCodeHighlighting: true,
        enableMathRendering: true,
        showImages: true,
        maxImageHeight: 200
      },
      layoutSettings: {
        cardThresholdWidth: 300,
        alignCardHeight: false,
        fixedCardHeight: 0,
        cardsPerView: 0,
        isVertical: true,
        cardGap: 16
      },
      styleSettings: {
        cardBorderRadius: 8,
        cardBorderWidth: 1,
        cardPadding: 16,
        enableCardShadow: true,
        cardShadowIntensity: 2,
        titleFontSize: 16,
        contentFontSize: 14,
        tagFontSize: 12,
        dateFontSize: 12
      },
      presets: [],
      folderPresets: {},
      autoApplyPresets: true,
      defaultPresetId: null,
      searchSettings: {
        saveSearchHistory: true,
        maxSearchHistoryItems: 10,
        enableSearchSuggestions: true,
        searchInFilename: true,
        searchInContent: true,
        searchInTags: true,
        caseSensitive: false,
        useRegex: false
      },
      cardSetSettings: {
        defaultCardSetMode: 'activeFolder',
        rememberLastCardSetMode: true,
        autoUpdateCardSet: true
      }
    };
  }
} 