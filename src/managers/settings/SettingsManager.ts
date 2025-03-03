import { App, Plugin } from 'obsidian';
import { ISettingsManager } from '../../core/interfaces/manager/ISettingsManager';
import { CardNavigatorSettings } from '../../core/types/settings.types';
import { ErrorCode } from '../../core/constants/error.constants';
import { PresetSettings, FolderPresetMapping, PresetManagementOptions, TagPresetMapping, FolderPresetPriorities, TagPresetPriorities } from '../../core/types/preset.types';
import { CardSetMode, CardSortBy } from '../../core/types/cardset.types';
import { SizeValue, SortDirection } from '../../core/types/common.types';
import { Log } from '../../utils/log/Log';

/**
 * 기본 설정값
 */
const DEFAULT_SETTINGS: CardNavigatorSettings = {
  content: {
    showFileName: true,
    showFirstHeader: true,
    showBody: true,
    bodyLengthLimit: true,
    showTags: true,
    bodyLength: 200,
    renderContentAsHtml: true
  },
  
  style: {
    fileNameFontSize: 16,
    firstHeaderFontSize: 16,
    bodyFontSize: 14,
    tagsFontSize: 12,
    cardWidth: 250,
    cardHeight: 200,
    cardPadding: 16,
    cardBorderRadius: 8,
    cardBorderWidth: 1,
    cardShadow: true,
    dragDropContent: true
  },
  
  layout: {
    cardThresholdWidth: 250,
    alignCardHeight: false,
    useFixedHeight: false,
    fixedCardHeight: 200,
    cardsPerColumn: 3,
    isVertical: true
  },
  
  cardSet: {
    mode: CardSetMode.ACTIVE_FOLDER,
    selectedFolder: null,
    sortBy: CardSortBy.FILE_NAME,
    sortDirection: SortDirection.ASC
  },
  
  preset: {
    activePresetId: undefined,
    defaultPresetId: undefined,
    autoApplyPresets: true,
    autoApplyFolderPresets: true,
    autoApplyTagPresets: true,
    folderPresets: {},
    folderPresetPriorities: {},
    tagPresets: {},
    tagPresetPriorities: {}
  },
  
  presetManagement: {
    activePresetId: undefined,
    globalDefaultPresetId: undefined,
    autoApplyPresets: true,
    autoApplyFolderPresets: true,
    autoApplyTagPresets: true,
    defaultPriorityOrder: 'tag-folder-global',
    conflictResolution: 'merge',
    lastActivePresetId: undefined,
    presetApplyMode: 'manual',
    presetMergeStrategy: 'priority-only',
    presetFolderPath: undefined
  },
  
  folderPresetMapping: {},
  tagPresetMapping: {},
  folderPresetPriorities: {},
  tagPresetPriorities: {},
  
  version: '1.0.0',
  
  scroll: {
    enableScrollAnimation: true,
    enableSnapToCard: false,
    scrollSpeed: 0
  },
  
  language: {
    locale: 'en',
    useSystemLanguage: true
  },
  
  debug: false
};

/**
 * 설정 관리자 구현 클래스
 * 플러그인 설정 관리와 관련된 기능을 구현합니다.
 */
export class SettingsManager implements ISettingsManager {
  /**
   * Obsidian 앱 인스턴스
   */
  private app: App;
  
  /**
   * 플러그인 인스턴스
   */
  private plugin: Plugin;
  
  /**
   * 플러그인 ID
   */
  private pluginId: string;
  
  /**
   * 현재 설정
   */
  private settings: CardNavigatorSettings;
  
  /**
   * 설정 변경 콜백 함수 목록
   */
  private changeCallbacks: Record<string, (settings: CardNavigatorSettings) => void> = {};
  
  /**
   * 설정 관리자 생성자
   * @param plugin 플러그인 인스턴스
   */
  constructor(plugin: Plugin) {
    this.plugin = plugin;
    this.app = plugin.app;
    this.pluginId = plugin.manifest.id;
    this.settings = { ...DEFAULT_SETTINGS };
  }
  
  /**
   * 설정 로드
   */
  async loadSettings(): Promise<CardNavigatorSettings> {
    try {
      // 저장된 설정 로드
      const loadedData = await this.plugin.loadData();
      
      // 설정 병합
      if (loadedData) {
        // 설정 마이그레이션 수행
        this.settings = this.migrateSettings(loadedData);
      } else {
        // 저장된 설정이 없는 경우 기본 설정 사용
        this.settings = { ...DEFAULT_SETTINGS };
      }
      
      return this.settings;
    } catch (error: any) {
      console.error(`${ErrorCode.SETTINGS_LOAD_ERROR}: ${error.message}`, error);
      // 오류 발생 시 기본 설정 사용
      this.settings = { ...DEFAULT_SETTINGS };
      return this.settings;
    }
  }
  
  /**
   * 설정 저장
   */
  async saveSettings(): Promise<void> {
    try {
      await this.plugin.saveData(this.settings);
    } catch (error: any) {
      console.error(`${ErrorCode.SETTINGS_SAVE_ERROR}: ${error.message}`, error);
      throw new Error(`${ErrorCode.SETTINGS_SAVE_ERROR}: ${error.message}`);
    }
  }
  
  /**
   * 설정 업데이트
   * @param settings 업데이트할 설정
   */
  async updateSettings(settings: Partial<CardNavigatorSettings>): Promise<void> {
    try {
      // 이전 설정 저장
      const previousSettings = { ...this.settings };
      
      // 설정 업데이트
      this.settings = {
        ...this.settings,
        ...settings
      };
      
      // 설정 저장
      await this.saveSettings();
      
      // 변경 콜백 호출
      this.notifyChangeCallbacks();
    } catch (error: any) {
      console.error(`${ErrorCode.SETTINGS_UPDATE_ERROR}: ${error.message}`, error);
      throw new Error(`${ErrorCode.SETTINGS_UPDATE_ERROR}: ${error.message}`);
    }
  }
  
  /**
   * 현재 설정을 가져옵니다.
   * @returns 현재 설정
   */
  getSettings(): CardNavigatorSettings {
    return structuredClone(this.settings);
  }
  
  /**
   * 기본 설정을 가져옵니다.
   * @returns 기본 설정
   */
  getDefaultSettings(): CardNavigatorSettings {
    return structuredClone(DEFAULT_SETTINGS);
  }
  
  /**
   * 특정 설정 가져오기
   * @param key 설정 키
   * @returns 설정 값
   */
  getSetting<K extends keyof CardNavigatorSettings>(key: K): CardNavigatorSettings[K] {
    return this.settings[key];
  }
  
  /**
   * 특정 설정 설정하기
   * @param key 설정 키
   * @param value 설정 값
   */
  async setSetting<K extends keyof CardNavigatorSettings>(
    key: K,
    value: CardNavigatorSettings[K]
  ): Promise<void> {
    try {
      // 이전 값과 동일한지 확인
      if (this.settings[key] === value) {
        return;
      }
      
      // 설정 업데이트
      this.settings[key] = value;
      
      // 설정 저장
      await this.saveSettings();
      
      // 변경 콜백 호출
      this.notifyChangeCallbacks();
    } catch (error: any) {
      console.error(`${ErrorCode.SETTINGS_UPDATE_ERROR}: ${error.message}`, error);
      throw new Error(`${ErrorCode.SETTINGS_UPDATE_ERROR}: ${error.message}`);
    }
  }
  
  /**
   * 설정 초기화
   */
  async resetSettings(): Promise<void> {
    try {
      // 설정 초기화
      this.settings = { ...DEFAULT_SETTINGS };
      
      // 설정 저장
      await this.saveSettings();
      
      // 변경 콜백 호출
      this.notifyChangeCallbacks();
    } catch (error: any) {
      console.error(`${ErrorCode.SETTINGS_RESET_ERROR}: ${error.message}`, error);
      throw new Error(`${ErrorCode.SETTINGS_RESET_ERROR}: ${error.message}`);
    }
  }
  
  /**
   * 설정 변경 콜백을 등록합니다.
   * @param callback 설정 변경 시 호출될 콜백 함수
   * @returns 콜백 ID
   */
  registerChangeCallback(callback: (settings: CardNavigatorSettings) => void): string {
    const callbackId = `callback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.changeCallbacks[callbackId] = callback;
    return callbackId;
  }
  
  /**
   * 설정 변경 콜백을 해제합니다.
   * @param callbackId 해제할 콜백 ID
   * @returns 해제 성공 여부
   */
  unregisterChangeCallback(callbackId: string): boolean {
    if (this.changeCallbacks[callbackId]) {
      delete this.changeCallbacks[callbackId];
      return true;
    }
    return false;
  }
  
  /**
   * 설정 마이그레이션
   * @param oldSettings 이전 설정
   * @returns 마이그레이션된 설정
   */
  migrateSettings(oldSettings: any): CardNavigatorSettings {
    try {
      // 이전 설정이 평면적인 구조인지 확인
      const isLegacySettings = oldSettings && (
        oldSettings.showFileName !== undefined ||
        oldSettings.showFirstHeader !== undefined ||
        oldSettings.showBody !== undefined
      );
      
      if (isLegacySettings) {
        // 이전 버전의 평면적인 설정을 새로운 중첩 구조로 변환
        const migratedSettings: CardNavigatorSettings = {
          content: {
            showFileName: oldSettings.showFileName ?? DEFAULT_SETTINGS.content.showFileName,
            showFirstHeader: oldSettings.showFirstHeader ?? DEFAULT_SETTINGS.content.showFirstHeader,
            showBody: oldSettings.showBody ?? DEFAULT_SETTINGS.content.showBody,
            bodyLengthLimit: true,
            showTags: oldSettings.showTags ?? DEFAULT_SETTINGS.content.showTags,
            bodyLength: oldSettings.maxBodyLength ?? DEFAULT_SETTINGS.content.bodyLength,
            renderContentAsHtml: oldSettings.renderContentAsHtml ?? DEFAULT_SETTINGS.content.renderContentAsHtml
          },
          
          style: {
            fileNameFontSize: oldSettings.titleFontSize ?? DEFAULT_SETTINGS.style.fileNameFontSize,
            firstHeaderFontSize: oldSettings.titleFontSize ?? DEFAULT_SETTINGS.style.firstHeaderFontSize,
            bodyFontSize: oldSettings.bodyFontSize ?? DEFAULT_SETTINGS.style.bodyFontSize,
            tagsFontSize: oldSettings.tagFontSize ?? DEFAULT_SETTINGS.style.tagsFontSize,
            cardWidth: oldSettings.cardThresholdWidth ?? DEFAULT_SETTINGS.style.cardWidth,
            cardHeight: oldSettings.fixedCardHeight ?? DEFAULT_SETTINGS.style.cardHeight,
            cardPadding: oldSettings.cardPadding ?? DEFAULT_SETTINGS.style.cardPadding,
            cardBorderRadius: oldSettings.cardBorderRadius ?? DEFAULT_SETTINGS.style.cardBorderRadius,
            cardBorderWidth: oldSettings.cardBorderWidth ?? DEFAULT_SETTINGS.style.cardBorderWidth,
            cardShadow: oldSettings.enableCardShadow ?? DEFAULT_SETTINGS.style.cardShadow,
            dragDropContent: oldSettings.enableDragAndDrop ?? DEFAULT_SETTINGS.style.dragDropContent
          },
          
          layout: {
            cardThresholdWidth: oldSettings.cardThresholdWidth ?? DEFAULT_SETTINGS.layout.cardThresholdWidth,
            alignCardHeight: oldSettings.alignCardHeight ?? DEFAULT_SETTINGS.layout.alignCardHeight,
            useFixedHeight: oldSettings.useFixedHeight ?? DEFAULT_SETTINGS.layout.useFixedHeight,
            fixedCardHeight: oldSettings.fixedCardHeight ?? DEFAULT_SETTINGS.layout.fixedCardHeight,
            cardsPerColumn: oldSettings.cardsPerColumn ?? DEFAULT_SETTINGS.layout.cardsPerColumn,
            isVertical: oldSettings.isVertical ?? DEFAULT_SETTINGS.layout.isVertical
          },
          
          cardSet: {
            mode: oldSettings.defaultCardSetType ? this.convertLegacyCardSetMode(oldSettings.defaultCardSetType) : DEFAULT_SETTINGS.cardSet.mode,
            selectedFolder: oldSettings.lastSelectedFolder ?? DEFAULT_SETTINGS.cardSet.selectedFolder,
            sortBy: CardSortBy.FILE_NAME,
            sortDirection: SortDirection.ASC
          },
          
          preset: {
            activePresetId: undefined,
            defaultPresetId: undefined,
            autoApplyPresets: true,
            autoApplyFolderPresets: true,
            autoApplyTagPresets: true,
            folderPresets: oldSettings.folderPresets ?? {},
            folderPresetPriorities: {},
            tagPresets: {},
            tagPresetPriorities: {}
          },
          
          presetManagement: {
            activePresetId: undefined,
            globalDefaultPresetId: undefined,
            autoApplyPresets: true,
            autoApplyFolderPresets: true,
            autoApplyTagPresets: true,
            defaultPriorityOrder: 'tag-folder-global',
            conflictResolution: 'merge',
            lastActivePresetId: undefined,
            presetApplyMode: 'manual',
            presetMergeStrategy: 'priority-only',
            presetFolderPath: undefined
          },
          
          folderPresetMapping: oldSettings.folderPresets ?? {},
          tagPresetMapping: {},
          folderPresetPriorities: {},
          tagPresetPriorities: {},
          
          version: '1.0.0',
          
          scroll: {
            enableScrollAnimation: oldSettings.enableScrollAnimation ?? DEFAULT_SETTINGS.scroll.enableScrollAnimation,
            enableSnapToCard: oldSettings.enableSnapToCard ?? DEFAULT_SETTINGS.scroll.enableSnapToCard,
            scrollSpeed: oldSettings.scrollSpeed ?? DEFAULT_SETTINGS.scroll.scrollSpeed
          },
          
          language: {
            locale: 'en',
            useSystemLanguage: true
          },
          
          debug: oldSettings.debugMode ?? DEFAULT_SETTINGS.debug
        };
        
        return migratedSettings;
      }
      
      // 이미 새로운 구조인 경우 그대로 반환
      return oldSettings as CardNavigatorSettings;
    } catch (error) {
      console.error(`설정 마이그레이션 중 오류 발생: ${error}`);
      // 오류 발생 시 기본 설정 반환
      return { ...DEFAULT_SETTINGS };
    }
  }
  
  /**
   * 설정 변경 콜백을 호출합니다.
   */
  private notifyChangeCallbacks(): void {
    const settingsCopy = structuredClone(this.settings);
    for (const callback of Object.values(this.changeCallbacks)) {
      try {
        callback(settingsCopy);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        Log.error(ErrorCode.CALLBACK_EXECUTION_ERROR, { message: errorMessage });
      }
    }
  }
  
  /**
   * 프리셋 설정 가져오기
   * @returns 프리셋 설정
   */
  getPresetSettings(): PresetSettings {
    return {
      cardContent: {
        showFileName: this.settings.content.showFileName,
        showFirstHeader: this.settings.content.showFirstHeader,
        showBody: this.settings.content.showBody,
        bodyLength: this.settings.content.bodyLength,
        bodyLengthLimit: this.settings.content.bodyLengthLimit,
        showTags: this.settings.content.showTags,
        renderContentAsHtml: this.settings.content.renderContentAsHtml,
        showCreationDate: this.settings.content.showCreationDate,
        showModificationDate: this.settings.content.showModificationDate,
        highlightCodeBlocks: this.settings.content.highlightCodeBlocks,
        renderMathEquations: this.settings.content.renderMathEquations,
        showImages: this.settings.content.showImages
      },
      cardStyle: {
        fileNameFontSize: this.settings.style.fileNameFontSize,
        firstHeaderFontSize: this.settings.style.firstHeaderFontSize,
        bodyFontSize: this.settings.style.bodyFontSize,
        tagsFontSize: this.settings.style.tagsFontSize,
        cardWidth: this.settings.style.cardWidth,
        cardHeight: this.settings.style.cardHeight,
        cardPadding: this.settings.style.cardPadding,
        cardBorderRadius: this.settings.style.cardBorderRadius,
        cardBorderWidth: this.settings.style.cardBorderWidth,
        cardShadow: this.settings.style.cardShadow,
        dragDropContent: this.settings.style.dragDropContent
      },
      layout: {
        cardThresholdWidth: this.settings.layout.cardThresholdWidth,
        alignCardHeight: this.settings.layout.alignCardHeight,
        useFixedHeight: this.settings.layout.useFixedHeight,
        fixedCardHeight: this.settings.layout.fixedCardHeight,
        cardsPerColumn: this.settings.layout.cardsPerColumn,
        isVertical: this.settings.layout.isVertical,
        smoothScroll: this.settings.scroll.enableScrollAnimation
      },
      cardSet: {
        mode: this.convertCardSetModeToPresetMode(this.settings.cardSet.mode),
        selectedFolder: this.settings.cardSet.selectedFolder,
        sortBy: this.settings.cardSet.sortBy,
        sortDirection: this.settings.cardSet.sortDirection
      }
    };
  }
  
  /**
   * CardSetMode를 프리셋 모드 문자열로 변환
   * @param mode CardSetMode
   * @returns 프리셋 모드 문자열
   */
  private convertCardSetModeToPresetMode(mode: CardSetMode): CardSetMode {
    // 열거형 값을 그대로 반환
    return mode;
  }
  
  /**
   * 프리셋 설정을 업데이트합니다.
   * @param presetSettings 업데이트할 프리셋 설정
   * @returns 업데이트된 프리셋 설정
   */
  async updatePresetSettings(presetSettings: PresetSettings): Promise<PresetSettings> {
    try {
      // 카드 내용 설정 업데이트
      if (presetSettings.cardContent) {
        this.settings.content = {
          ...this.settings.content,
          showFileName: presetSettings.cardContent.showFileName ?? this.settings.content.showFileName,
          showFirstHeader: presetSettings.cardContent.showFirstHeader ?? this.settings.content.showFirstHeader,
          showBody: presetSettings.cardContent.showBody ?? this.settings.content.showBody,
          bodyLength: presetSettings.cardContent.bodyLength ?? this.settings.content.bodyLength,
          showTags: presetSettings.cardContent.showTags ?? this.settings.content.showTags,
          renderContentAsHtml: presetSettings.cardContent.renderContentAsHtml ?? this.settings.content.renderContentAsHtml
        };
      }
      
      if (presetSettings.cardStyle) {
        // 문자열 값을 숫자로 변환
        const fileNameFontSize = presetSettings.cardStyle.fileNameFontSize ? 
          this.parseSize(presetSettings.cardStyle.fileNameFontSize) : this.settings.style.fileNameFontSize;
        const firstHeaderFontSize = presetSettings.cardStyle.firstHeaderFontSize ? 
          this.parseSize(presetSettings.cardStyle.firstHeaderFontSize) : this.settings.style.firstHeaderFontSize;
        const bodyFontSize = presetSettings.cardStyle.bodyFontSize ? 
          this.parseSize(presetSettings.cardStyle.bodyFontSize) : this.settings.style.bodyFontSize;
        const tagsFontSize = presetSettings.cardStyle.tagsFontSize ? 
          this.parseSize(presetSettings.cardStyle.tagsFontSize) : this.settings.style.tagsFontSize;
        const cardWidth = presetSettings.cardStyle.cardWidth ? 
          this.parseSize(presetSettings.cardStyle.cardWidth) : this.settings.style.cardWidth;
        const cardHeight = presetSettings.cardStyle.cardHeight ? 
          this.parseSize(presetSettings.cardStyle.cardHeight) : this.settings.style.cardHeight;
        const cardPadding = presetSettings.cardStyle.cardPadding ? 
          this.parseSize(presetSettings.cardStyle.cardPadding) : this.settings.style.cardPadding;
        const cardBorderRadius = presetSettings.cardStyle.cardBorderRadius ? 
          this.parseSize(presetSettings.cardStyle.cardBorderRadius) : this.settings.style.cardBorderRadius;
        const cardBorderWidth = presetSettings.cardStyle.cardBorderWidth ? 
          this.parseSize(presetSettings.cardStyle.cardBorderWidth) : this.settings.style.cardBorderWidth;
          
        this.settings.style = {
          ...this.settings.style,
          fileNameFontSize: fileNameFontSize,
          firstHeaderFontSize: firstHeaderFontSize,
          bodyFontSize: bodyFontSize,
          tagsFontSize: tagsFontSize,
          cardWidth: cardWidth,
          cardHeight: cardHeight,
          cardPadding: cardPadding,
          cardBorderRadius: cardBorderRadius,
          cardBorderWidth: cardBorderWidth,
          cardShadow: presetSettings.cardStyle.cardShadow ?? this.settings.style.cardShadow
        };
      }
      
      if (presetSettings.layout) {
        this.settings.layout = {
          ...this.settings.layout,
          cardThresholdWidth: presetSettings.layout.cardThresholdWidth ?? this.settings.layout.cardThresholdWidth,
          alignCardHeight: presetSettings.layout.alignCardHeight ?? this.settings.layout.alignCardHeight,
          fixedCardHeight: presetSettings.layout.fixedCardHeight ?? this.settings.layout.fixedCardHeight,
          cardsPerColumn: presetSettings.layout.cardsPerColumn ?? this.settings.layout.cardsPerColumn
        };
        
        // smoothScroll 속성이 있는 경우 스크롤 설정 업데이트
        if ('smoothScroll' in presetSettings.layout) {
          const smoothScroll = presetSettings.layout.smoothScroll;
          this.settings.scroll = {
            ...this.settings.scroll,
            enableScrollAnimation: smoothScroll !== undefined ? smoothScroll : this.settings.scroll.enableScrollAnimation
          };
        }
      }
      
      if (presetSettings.cardSet) {
        this.settings.cardSet = {
          ...this.settings.cardSet,
          mode: presetSettings.cardSet.mode ? 
            this.convertPresetModeToCardSetMode(presetSettings.cardSet.mode as string) : this.settings.cardSet.mode,
          selectedFolder: presetSettings.cardSet.selectedFolder ?? this.settings.cardSet.selectedFolder,
          sortBy: presetSettings.cardSet.sortBy ?? this.settings.cardSet.sortBy,
          sortDirection: presetSettings.cardSet.sortDirection ?? this.settings.cardSet.sortDirection
        };
      }
      
      // 설정 저장
      await this.saveSettings();
      this.notifyChangeCallbacks();
      
      return this.getPresetSettings();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      Log.error(ErrorCode.SETTINGS_UPDATE_ERROR, { message: errorMessage });
      throw new Error(`${ErrorCode.SETTINGS_UPDATE_ERROR}: ${errorMessage}`);
    }
  }
  
  /**
   * 크기 값을 숫자로 변환
   * @param size 크기 값 (문자열 또는 숫자)
   * @returns 숫자 값
   */
  private parseSize(size: string | number): number {
    if (size === undefined || size === null) return 0;
    
    // 숫자인 경우 바로 반환
    if (typeof size === 'number') return size;
    
    // 문자열에서 숫자만 추출
    const match = size.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  }
  
  /**
   * 프리셋 모드 문자열을 CardSetMode로 변환
   * @param mode 프리셋 모드 문자열
   * @returns CardSetMode
   */
  private convertPresetModeToCardSetMode(mode: string): CardSetMode {
    // 입력된 모드가 CardSetMode 열거형 값 중 하나인지 확인
    if (Object.values(CardSetMode).includes(mode as CardSetMode)) {
      return mode as CardSetMode;
    }
    
    // 이전 버전과의 호환성을 위한 변환 로직
    switch (mode) {
      case 'active_folder':
        return CardSetMode.ACTIVE_FOLDER;
      case 'selected_folder':
        return CardSetMode.SELECTED_FOLDER;
      case 'vault':
        return CardSetMode.VAULT;
      case 'search_results':
        return CardSetMode.SEARCH_RESULTS;
      case 'tag':
        return CardSetMode.TAG;
      case 'custom':
        return CardSetMode.CUSTOM;
      default:
        return CardSetMode.ACTIVE_FOLDER;
    }
  }
  
  /**
   * 프리셋 설정을 적용합니다.
   * @param presetSettings 적용할 프리셋 설정
   * @returns 적용된 프리셋 설정
   */
  async applyPresetSettings(presetSettings: PresetSettings): Promise<PresetSettings> {
    try {
      await this.updatePresetSettings(presetSettings);
      return this.getPresetSettings();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to apply preset settings: ${errorMessage}`);
    }
  }
  
  /**
   * 프리셋 관리 옵션을 업데이트합니다.
   * @param options 업데이트할 프리셋 관리 옵션
   * @returns 업데이트된 프리셋 관리 옵션
   */
  async updatePresetManagementOptions(options: Partial<PresetManagementOptions>): Promise<PresetManagementOptions> {
    try {
      // 프리셋 관리 옵션 업데이트
      if (options.activePresetId !== undefined) {
        this.settings.presetManagement.activePresetId = options.activePresetId;
      }
      
      if (options.globalDefaultPresetId !== undefined) {
        this.settings.presetManagement.globalDefaultPresetId = options.globalDefaultPresetId;
      }
      
      if (options.autoApplyPresets !== undefined) {
        this.settings.presetManagement.autoApplyPresets = options.autoApplyPresets;
      }
      
      if (options.autoApplyFolderPresets !== undefined) {
        this.settings.presetManagement.autoApplyFolderPresets = options.autoApplyFolderPresets;
      }
      
      if (options.autoApplyTagPresets !== undefined) {
        this.settings.presetManagement.autoApplyTagPresets = options.autoApplyTagPresets;
      }
      
      if (options.defaultPriorityOrder !== undefined) {
        this.settings.presetManagement.defaultPriorityOrder = options.defaultPriorityOrder;
      }
      
      if (options.conflictResolution !== undefined) {
        this.settings.presetManagement.conflictResolution = options.conflictResolution;
      }
      
      if (options.lastActivePresetId !== undefined) {
        this.settings.presetManagement.lastActivePresetId = options.lastActivePresetId;
      }
      
      if (options.presetApplyMode !== undefined) {
        this.settings.presetManagement.presetApplyMode = options.presetApplyMode;
      }
      
      if (options.presetMergeStrategy !== undefined) {
        this.settings.presetManagement.presetMergeStrategy = options.presetMergeStrategy;
      }
      
      if (options.presetFolderPath !== undefined) {
        this.settings.presetManagement.presetFolderPath = options.presetFolderPath;
      }
      
      // 설정 저장
      await this.saveSettings();
      this.notifyChangeCallbacks();
      
      return this.settings.presetManagement;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      Log.error(ErrorCode.SETTINGS_UPDATE_ERROR, { message: errorMessage });
      throw new Error(`${ErrorCode.SETTINGS_UPDATE_ERROR}: ${errorMessage}`);
    }
  }
  
  /**
   * 폴더 프리셋 매핑 가져오기
   * @returns 폴더 프리셋 매핑
   */
  getFolderPresetMapping(): FolderPresetMapping {
    return this.settings.folderPresetMapping || {};
  }
  
  /**
   * 태그 프리셋 매핑 가져오기
   * @returns 태그 프리셋 매핑
   */
  getTagPresetMapping(): TagPresetMapping {
    return this.settings.tagPresetMapping || {};
  }
  
  /**
   * 폴더 프리셋 우선순위 가져오기
   * @returns 폴더 프리셋 우선순위
   */
  getFolderPresetPriorities(): FolderPresetPriorities {
    return this.settings.folderPresetPriorities || {};
  }
  
  /**
   * 태그 프리셋 우선순위 가져오기
   * @returns 태그 프리셋 우선순위
   */
  getTagPresetPriorities(): TagPresetPriorities {
    return this.settings.tagPresetPriorities || {};
  }
  
  /**
   * 폴더 프리셋 매핑을 업데이트합니다.
   * @param mapping 업데이트할 폴더 프리셋 매핑
   * @returns 업데이트된 폴더 프리셋 매핑
   */
  async updateFolderPresetMapping(mapping: FolderPresetMapping): Promise<FolderPresetMapping> {
    try {
      // 폴더 프리셋 매핑 업데이트
      this.settings.folderPresetMapping = mapping;
      
      // 설정 저장
      await this.saveSettings();
      this.notifyChangeCallbacks();
      
      return this.settings.folderPresetMapping;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      Log.error(ErrorCode.FOLDER_PRESET_UPDATE_ERROR, { message: errorMessage });
      throw new Error(`${ErrorCode.FOLDER_PRESET_UPDATE_ERROR}: ${errorMessage}`);
    }
  }
  
  /**
   * 태그 프리셋 매핑을 업데이트합니다.
   * @param mapping 업데이트할 태그 프리셋 매핑
   * @returns 업데이트된 태그 프리셋 매핑
   */
  async updateTagPresetMapping(mapping: TagPresetMapping): Promise<TagPresetMapping> {
    try {
      // 태그 프리셋 매핑 업데이트
      this.settings.tagPresetMapping = mapping;
      
      // 설정 저장
      await this.saveSettings();
      this.notifyChangeCallbacks();
      
      return this.settings.tagPresetMapping;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      Log.error(ErrorCode.TAG_PRESET_UPDATE_ERROR, { message: errorMessage });
      throw new Error(`${ErrorCode.TAG_PRESET_UPDATE_ERROR}: ${errorMessage}`);
    }
  }
  
  /**
   * 폴더 프리셋 우선순위를 업데이트합니다.
   * @param priorities 업데이트할 폴더 프리셋 우선순위
   * @returns 업데이트된 폴더 프리셋 우선순위
   */
  async updateFolderPresetPriorities(priorities: FolderPresetPriorities): Promise<FolderPresetPriorities> {
    try {
      // 폴더 프리셋 우선순위 업데이트
      this.settings.folderPresetPriorities = priorities;
      
      // 설정 저장
      await this.saveSettings();
      this.notifyChangeCallbacks();
      
      return this.settings.folderPresetPriorities;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      Log.error(ErrorCode.FOLDER_PRESET_UPDATE_ERROR, { message: errorMessage });
      throw new Error(`${ErrorCode.FOLDER_PRESET_UPDATE_ERROR}: ${errorMessage}`);
    }
  }
  
  /**
   * 태그 프리셋 우선순위를 업데이트합니다.
   * @param priorities 업데이트할 태그 프리셋 우선순위
   * @returns 업데이트된 태그 프리셋 우선순위
   */
  async updateTagPresetPriorities(priorities: TagPresetPriorities): Promise<TagPresetPriorities> {
    try {
      // 태그 프리셋 우선순위 업데이트
      this.settings.tagPresetPriorities = priorities;
      
      // 설정 저장
      await this.saveSettings();
      this.notifyChangeCallbacks();
      
      return this.settings.tagPresetPriorities;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      Log.error(ErrorCode.TAG_PRESET_UPDATE_ERROR, { message: errorMessage });
      throw new Error(`${ErrorCode.TAG_PRESET_UPDATE_ERROR}: ${errorMessage}`);
    }
  }
  
  /**
   * 레거시 카드셋 모드를 새 형식으로 변환합니다.
   * @param legacyMode 레거시 카드셋 모드
   * @returns 변환된 카드셋 모드
   */
  private convertLegacyCardSetMode(legacyMode: string): CardSetMode {
    switch (legacyMode) {
      case 'active-folder':
        return CardSetMode.ACTIVE_FOLDER;
      case 'selected-folder':
        return CardSetMode.SELECTED_FOLDER;
      case 'vault':
        return CardSetMode.VAULT;
      case 'search-result':
        return CardSetMode.SEARCH_RESULTS;
      case 'tag':
        return CardSetMode.TAG;
      case 'custom':
        return CardSetMode.CUSTOM;
      default:
        return CardSetMode.ACTIVE_FOLDER;
    }
  }
} 