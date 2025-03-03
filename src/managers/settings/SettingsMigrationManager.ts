import { CardNavigatorSettings } from '../../core/types/settings.types';
import { CardSetMode, CardSortBy } from '../../core/types/cardset.types';
import { SortDirection } from '../../core/types/common.types';
import { PresetApplyMode, PresetMergeStrategy } from '../../core/types/preset.types';

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
  public migrateSettings(settings: CardNavigatorSettings): CardNavigatorSettings {
    try {
      // 설정 버전이 없는 경우 버전 1로 간주
      if (!settings.version) {
        settings = this.migrateFromV0ToV1(settings);
      }

      // 버전 1에서 버전 2로 마이그레이션
      if (settings.version === '1.0.0') {
        settings = this.migrateFromV1ToV2(settings);
      }

      // 추가 마이그레이션은 여기에 추가

      // 최종 버전 설정
      settings.version = '2.0.0';

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
  private migrateFromV0ToV1(oldSettings: any): CardNavigatorSettings {
    try {
      const newSettings: CardNavigatorSettings = {
        ...this.getDefaultSettings(),
        version: '1.0.0'
      };

      // 기존 설정 값 복사
      if (oldSettings) {
        // 카드 내용 설정 마이그레이션
        if (oldSettings.showFileName !== undefined) newSettings.content.showFileName = oldSettings.showFileName;
        if (oldSettings.showFirstHeader !== undefined) newSettings.content.showFirstHeader = oldSettings.showFirstHeader;
        if (oldSettings.showBody !== undefined) newSettings.content.showBody = oldSettings.showBody;
        if (oldSettings.showTags !== undefined) newSettings.content.showTags = oldSettings.showTags;
        if (oldSettings.maxBodyLength !== undefined) newSettings.content.bodyLength = oldSettings.maxBodyLength;
        
        // 카드 스타일 설정 마이그레이션
        if (oldSettings.titleFontSize !== undefined) newSettings.style.fileNameFontSize = oldSettings.titleFontSize;
        if (oldSettings.bodyFontSize !== undefined) newSettings.style.bodyFontSize = oldSettings.bodyFontSize;
        if (oldSettings.tagFontSize !== undefined) newSettings.style.tagsFontSize = oldSettings.tagFontSize;
        if (oldSettings.cardPadding !== undefined) newSettings.style.cardPadding = oldSettings.cardPadding;
        if (oldSettings.cardBorderRadius !== undefined) newSettings.style.cardBorderRadius = oldSettings.cardBorderRadius;
        if (oldSettings.cardBorderWidth !== undefined) newSettings.style.cardBorderWidth = oldSettings.cardBorderWidth;
        if (oldSettings.enableCardShadow !== undefined) newSettings.style.cardShadow = oldSettings.enableCardShadow;
        
        // 레이아웃 설정 마이그레이션
        if (oldSettings.cardThresholdWidth !== undefined) newSettings.layout.cardThresholdWidth = oldSettings.cardThresholdWidth;
        if (oldSettings.alignCardHeight !== undefined) newSettings.layout.alignCardHeight = oldSettings.alignCardHeight;
        if (oldSettings.useFixedHeight !== undefined) newSettings.layout.useFixedHeight = oldSettings.useFixedHeight;
        if (oldSettings.fixedCardHeight !== undefined) newSettings.layout.fixedCardHeight = oldSettings.fixedCardHeight;
        if (oldSettings.cardsPerColumn !== undefined) newSettings.layout.cardsPerColumn = oldSettings.cardsPerColumn;
        if (oldSettings.enableScrollAnimation !== undefined) newSettings.scroll.enableScrollAnimation = oldSettings.enableScrollAnimation;
        if (oldSettings.enableSnapToCard !== undefined) newSettings.scroll.enableSnapToCard = oldSettings.enableSnapToCard;
        
        // 프리셋 설정 마이그레이션
        if (oldSettings.globalPreset !== undefined) newSettings.presetManagement.globalDefaultPresetId = oldSettings.globalPreset;
        if (oldSettings.lastActivePreset !== undefined) newSettings.presetManagement.activePresetId = oldSettings.lastActivePreset;
        if (oldSettings.autoApplyPresets !== undefined) newSettings.presetManagement.autoApplyPresets = oldSettings.autoApplyPresets;
        if (oldSettings.folderPresets !== undefined) newSettings.folderPresetMapping = oldSettings.folderPresets;
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
  private migrateFromV1ToV2(oldSettings: CardNavigatorSettings): CardNavigatorSettings {
    try {
      const newSettings: CardNavigatorSettings = {
        ...oldSettings,
        version: '2.0.0'
      };

      // 검색 설정 초기화 (cardSet 내부로 이동)
      if (!newSettings.cardSet) {
        newSettings.cardSet = {
          mode: CardSetMode.ACTIVE_FOLDER,
          selectedFolder: null,
          sortBy: CardSortBy.FILE_NAME,
          sortDirection: SortDirection.ASC
        };
      }

      // 이전 버전의 검색 설정 마이그레이션
      if ((oldSettings as any).searchInTitle !== undefined) {
        // 검색 관련 설정은 cardSet 내부에 직접 추가
        (newSettings.cardSet as any).searchInTitle = (oldSettings as any).searchInTitle;
      }
      if ((oldSettings as any).searchInHeader !== undefined) {
        (newSettings.cardSet as any).searchInHeader = (oldSettings as any).searchInHeader;
      }
      if ((oldSettings as any).searchInTags !== undefined) {
        (newSettings.cardSet as any).searchInTags = (oldSettings as any).searchInTags;
      }
      if ((oldSettings as any).searchInContent !== undefined) {
        (newSettings.cardSet as any).searchInContent = (oldSettings as any).searchInContent;
      }
      if ((oldSettings as any).searchInFrontmatter !== undefined) {
        (newSettings.cardSet as any).searchInFrontmatter = (oldSettings as any).searchInFrontmatter;
      }
      if ((oldSettings as any).caseSensitiveSearch !== undefined) {
        (newSettings.cardSet as any).caseSensitiveSearch = (oldSettings as any).caseSensitiveSearch;
      }
      if ((oldSettings as any).useRegexSearch !== undefined) {
        (newSettings.cardSet as any).useRegexSearch = (oldSettings as any).useRegexSearch;
      }

      // 카드셋 설정 마이그레이션
      if ((oldSettings as any).defaultCardSetType !== undefined) {
        if ((oldSettings as any).defaultCardSetType === 'active-folder') {
          newSettings.cardSet.mode = CardSetMode.ACTIVE_FOLDER;
        } else if ((oldSettings as any).defaultCardSetType === 'selected-folder') {
          newSettings.cardSet.mode = CardSetMode.SELECTED_FOLDER;
        } else if ((oldSettings as any).defaultCardSetType === 'vault') {
          newSettings.cardSet.mode = CardSetMode.VAULT;
        } else if ((oldSettings as any).defaultCardSetType === 'search-results') {
          newSettings.cardSet.mode = CardSetMode.SEARCH_RESULTS;
        }
      }
      if ((oldSettings as any).lastSelectedFolder !== undefined) {
        newSettings.cardSet.selectedFolder = (oldSettings as any).lastSelectedFolder;
      }

      // 프리셋 구조 업데이트
      if (!newSettings.presetManagement) {
        // 프리셋 관련 설정은 presetManagement 객체에 직접 추가
        newSettings.presetManagement = {
          activePresetId: (oldSettings as any).lastActivePreset || undefined,
          defaultPresetId: (oldSettings as any).globalPreset || undefined,
          autoApplyPresets: (oldSettings as any).autoApplyPresets !== undefined ? (oldSettings as any).autoApplyPresets : true,
          autoApplyFolderPresets: true,
          autoApplyTagPresets: true,
          folderPresetMappings: {},
          tagPresetMappings: {},
          folderPresetPriorities: {},
          tagPresetPriorities: {},
          defaultPriorityOrder: 'tag-folder-global',
          conflictResolution: 'priority-only',
          presetApplyMode: PresetApplyMode.FOLDER_FIRST,
          presetMergeStrategy: PresetMergeStrategy.FOLDER_BASE
        };
        
        // 폴더 프리셋 매핑 추가
        if ((oldSettings as any).folderPresets) {
          newSettings.presetManagement.folderPresetMappings = (oldSettings as any).folderPresets;
        }
      }

      // 이전 버전의 속성 제거
      delete (newSettings as any).searchInTitle;
      delete (newSettings as any).searchInHeader;
      delete (newSettings as any).searchInTags;
      delete (newSettings as any).searchInContent;
      delete (newSettings as any).searchInFrontmatter;
      delete (newSettings as any).caseSensitiveSearch;
      delete (newSettings as any).useRegexSearch;
      delete (newSettings as any).defaultCardSetType;
      delete (newSettings as any).lastSelectedFolder;
      delete (newSettings as any).folderPresets;
      delete (newSettings as any).globalPreset;
      delete (newSettings as any).lastActivePreset;
      delete (newSettings as any).autoApplyPresets;

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
  private getDefaultSettings(): CardNavigatorSettings {
    return {
      version: '2.0.0',
      
      // 카드 내용 설정
      content: {
        showFileName: true,
        showFirstHeader: true,
        showBody: true,
        bodyLengthLimit: true,
        showTags: true,
        bodyLength: 200,
        renderContentAsHtml: false
      },
      
      // 카드 스타일 설정
      style: {
        fileNameFontSize: 16,
        bodyFontSize: 14,
        tagsFontSize: 12,
        cardPadding: 16,
        cardBorderRadius: 8,
        cardBorderWidth: 1,
        cardShadow: true,
        dragDropContent: true,
        firstHeaderFontSize: 16,
        cardWidth: 250,
        cardHeight: 200
      },
      
      // 레이아웃 설정
      layout: {
        cardThresholdWidth: 250,
        alignCardHeight: false,
        useFixedHeight: false,
        fixedCardHeight: 200,
        cardsPerColumn: 3,
        isVertical: true
      },
      
      // 스크롤 설정
      scroll: {
        enableScrollAnimation: true,
        scrollSpeed: 500,
        enableSnapToCard: false
      },
      
      // 카드셋 설정
      cardSet: {
        mode: CardSetMode.ACTIVE_FOLDER,
        selectedFolder: null,
        sortBy: CardSortBy.FILE_NAME,
        sortDirection: SortDirection.ASC
      },
      
      // 프리셋 관리 설정
      presetManagement: {
        activePresetId: undefined,
        defaultPresetId: undefined,
        autoApplyPresets: true,
        autoApplyFolderPresets: true,
        autoApplyTagPresets: true,
        folderPresetMappings: {},
        tagPresetMappings: {},
        folderPresetPriorities: {},
        tagPresetPriorities: {},
        defaultPriorityOrder: 'tag-folder-global',
        conflictResolution: 'priority-only',
        presetApplyMode: PresetApplyMode.FOLDER_FIRST,
        presetMergeStrategy: PresetMergeStrategy.FOLDER_BASE
      },
      
      // 폴더 프리셋 매핑
      folderPresetMapping: {},
      
      // 태그 프리셋 매핑
      tagPresetMapping: {},
      
      // 폴더 프리셋 우선순위
      folderPresetPriorities: {},
      
      // 태그 프리셋 우선순위
      tagPresetPriorities: {},
      
      // 프리셋 설정
      preset: {
        activePresetId: undefined,
        defaultPresetId: undefined,
        autoApplyPresets: true,
        autoApplyFolderPresets: true,
        autoApplyTagPresets: true,
        folderPresets: {},
        tagPresets: {},
        folderPresetPriorities: {},
        tagPresetPriorities: {},
        defaultPriorityOrder: 'tag-folder-global',
        conflictResolution: 'priority-only',
        presetApplyMode: PresetApplyMode.FOLDER_FIRST,
        presetMergeStrategy: PresetMergeStrategy.FOLDER_BASE,
        lastActivePreset: undefined,
        globalDefaultPreset: undefined
      },
      
      // 언어 설정
      language: {
        locale: 'en',
        useSystemLanguage: true
      },
      
      // 디버그 모드
      debug: false
    };
  }
} 