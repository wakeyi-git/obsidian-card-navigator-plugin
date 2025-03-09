import { ICardService } from '../application/CardService';
import { ICardSetService } from '../application/CardSetService';
import { ICardSetSourceService } from '../application/CardSetSourceService';
import { ISearchService } from '../domain/search/SearchInterfaces';
import { ISortService } from '../application/SortService';
import { ILayoutService } from '../application/LayoutService';
import { IPresetService } from '../application/PresetService';
import { ICardNavigatorService } from '../application/CardNavigatorService';
import { ISettingsService } from '../application/SettingsService';
import { ICardRepository } from '../domain/card/CardRepository';
import { ICard } from '../domain/card/Card';
import { CardSetSourceType, ICardSetSource } from '../domain/cardset/CardSet';
import { ISearch, SearchType } from '../domain/search/Search';
import { IEventEmitter } from '../domain/events/EventTypes';

/**
 * 모킹 유틸리티 클래스
 * 테스트를 위한 모킹 유틸리티를 제공합니다.
 */
export class MockUtils {
  /**
   * 카드 서비스 모킹
   * @returns 모킹된 카드 서비스
   */
  static createMockCardService(): ICardService {
    return {
      getCardById: jest.fn(),
      getCardByPath: jest.fn(),
      getAllCards: jest.fn().mockResolvedValue([]),
      getCardsByTag: jest.fn(),
      getCardsByFolder: jest.fn(),
      refreshCards: jest.fn(),
      initialize: jest.fn()
    };
  }
  
  /**
   * 카드셋 서비스 모킹
   * @returns 모킹된 카드셋 서비스
   */
  static createMockCardSetService(): ICardSetService {
    return {
      getCurrentSource: jest.fn(),
      getCurrentSourceType: jest.fn(),
      changeSource: jest.fn(),
      selectCardSet: jest.fn(),
      getCurrentCardSet: jest.fn(),
      isCardSetFixed: jest.fn(),
      setIncludeSubfolders: jest.fn(),
      getIncludeSubfolders: jest.fn(),
      getCardSets: jest.fn(),
      getFilterOptions: jest.fn(),
      getFiles: jest.fn(),
      applySource: jest.fn(),
      initialize: jest.fn(),
      reset: jest.fn(),
      handleActiveFileChange: jest.fn(),
      getCards: jest.fn(),
      configureSearchSource: jest.fn(),
      getFolderSource: jest.fn(),
      getTagSource: jest.fn(),
      getPreviousSourceType: jest.fn(),
      setTagCaseSensitive: jest.fn(),
      isTagCaseSensitive: jest.fn(),
      saveCurrentSourceState: jest.fn(),
      restorePreviousSourceState: jest.fn(),
      setSearchService: jest.fn(),
      getPreviousCardSetSource: jest.fn(),
      on: jest.fn(),
      off: jest.fn()
    };
  }
  
  /**
   * 카드셋 소스 서비스 모킹
   * @returns 모킹된 카드셋 소스 서비스
   */
  static createMockCardSetSourceService(): ICardSetSourceService {
    return {
      ...MockUtils.createMockCardSetService(),
      saveSettingsToPlugin: jest.fn(),
      loadSettingsFromPlugin: jest.fn(),
      configureSearchCardSetSource: jest.fn()
    };
  }
  
  /**
   * 검색 서비스 모킹
   * @returns 모킹된 검색 서비스
   */
  static createMockSearchService(): ISearchService {
    return {
      getCurrentSearch: jest.fn(),
      setSearch: jest.fn(),
      setQuery: jest.fn(),
      setSearchQuery: jest.fn(),
      setSearchType: jest.fn(),
      setCaseSensitive: jest.fn(),
      applySearch: jest.fn(),
      clearSearch: jest.fn(),
      changeSearchType: jest.fn(),
      saveSearchHistory: jest.fn(),
      getSearchHistory: jest.fn(),
      clearSearchHistory: jest.fn(),
      initialize: jest.fn(),
      reset: jest.fn(),
      applyComplexSearch: jest.fn(),
      getFrontmatterKeys: jest.fn(),
      getFolderPaths: jest.fn(),
      getTags: jest.fn(),
      getHighlightInfo: jest.fn(),
      isSearchCardSetSource: jest.fn(),
      setSearchScope: jest.fn(),
      getSearchScope: jest.fn(),
      getQuery: jest.fn(),
      getSearchType: jest.fn(),
      isCaseSensitive: jest.fn(),
      getFrontmatterKey: jest.fn(),
      getFilesForSearch: jest.fn(),
      setPreviousCardSetSourceInfo: jest.fn(),
      getPreviousCardSetSource: jest.fn(),
      onCardSetSourceChanged: jest.fn(),
      getSearchSource: jest.fn(),
      setFrontmatterKey: jest.fn(),
      getScopedFrontmatterValues: jest.fn(),
      enterSearchCardSetSource: jest.fn(),
      exitSearchCardSetSource: jest.fn(),
      getScopedTags: jest.fn(),
      getScopedFilenames: jest.fn(),
      getScopedFrontmatterKeys: jest.fn(),
      configureSearchSource: jest.fn(),
      getSearchCardSetSourceState: jest.fn()
    };
  }
  
  /**
   * 정렬 서비스 모킹
   * @returns 모킹된 정렬 서비스
   */
  static createMockSortService(): ISortService {
    return {
      sortCards: jest.fn(),
      setSortBy: jest.fn(),
      setSortOrder: jest.fn(),
      getSortBy: jest.fn(),
      getSortOrder: jest.fn(),
      getSortOptions: jest.fn(),
      setCustomSortKey: jest.fn(),
      getCustomSortKey: jest.fn()
    };
  }
  
  /**
   * 레이아웃 서비스 모킹
   * @returns 모킹된 레이아웃 서비스
   */
  static createMockLayoutService(): ILayoutService {
    return {
      getLayoutType: jest.fn(),
      setLayoutType: jest.fn(),
      getLayoutOptions: jest.fn(),
      getCardWidth: jest.fn(),
      setCardWidth: jest.fn(),
      getCardHeight: jest.fn(),
      setCardHeight: jest.fn(),
      getCardGap: jest.fn(),
      setCardGap: jest.fn(),
      getGridColumns: jest.fn(),
      setGridColumns: jest.fn(),
      isFixedCardHeight: jest.fn(),
      setFixedCardHeight: jest.fn(),
      on: jest.fn(),
      off: jest.fn()
    };
  }
  
  /**
   * 프리셋 서비스 모킹
   * @returns 모킹된 프리셋 서비스
   */
  static createMockPresetService(): IPresetService {
    return {
      getPresets: jest.fn(),
      getPresetById: jest.fn(),
      createPreset: jest.fn(),
      updatePreset: jest.fn(),
      deletePreset: jest.fn(),
      applyPreset: jest.fn(),
      saveCurrentAsPreset: jest.fn(),
      getFolderPresetMappings: jest.fn(),
      getTagPresetMappings: jest.fn(),
      setFolderPresetMapping: jest.fn(),
      setTagPresetMapping: jest.fn(),
      removeFolderPresetMapping: jest.fn(),
      removeTagPresetMapping: jest.fn(),
      getPresetForFolder: jest.fn(),
      getPresetForTag: jest.fn()
    };
  }
  
  /**
   * 카드 네비게이터 서비스 모킹
   * @returns 모킹된 카드 네비게이터 서비스
   */
  static createMockCardNavigatorService(): ICardNavigatorService {
    return {
      initialize: jest.fn(),
      getCards: jest.fn(),
      changeCardSetSource: jest.fn(),
      selectCardSet: jest.fn(),
      changeLayout: jest.fn(),
      applyPreset: jest.fn(),
      saveAsPreset: jest.fn(),
      search: jest.fn(),
      getSettings: jest.fn(),
      updateSettings: jest.fn(),
      reset: jest.fn(),
      getCardSetSourceService: jest.fn(),
      getCardService: jest.fn(),
      getSearchService: jest.fn(),
      getSortService: jest.fn(),
      getLayoutService: jest.fn(),
      getPresetService: jest.fn(),
      refreshCards: jest.fn(),
      changeSearchType: jest.fn(),
      setCaseSensitive: jest.fn(),
      getApp: jest.fn(),
      getCurrentCards: jest.fn(),
      renderMarkdown: jest.fn(),
      getPlugin: jest.fn(),
      notifyCardSetSourceChanged: jest.fn()
    };
  }
  
  /**
   * 설정 서비스 모킹
   * @returns 모킹된 설정 서비스
   */
  static createMockSettingsService(): ISettingsService {
    return {
      getSettings: jest.fn(),
      updateSettings: jest.fn(),
      saveSettings: jest.fn(),
      resetSettings: jest.fn(),
      onSettingsChanged: jest.fn(),
      offSettingsChanged: jest.fn()
    };
  }
  
  /**
   * 카드 저장소 모킹
   * @returns 모킹된 카드 저장소
   */
  static createMockCardRepository(): ICardRepository {
    return {
      getAllCards: jest.fn(),
      getCardById: jest.fn(),
      getCardByPath: jest.fn(),
      getCardsByTag: jest.fn(),
      getCardsByFolder: jest.fn(),
      addCard: jest.fn(),
      updateCard: jest.fn(),
      deleteCard: jest.fn(),
      refresh: jest.fn()
    };
  }
  
  /**
   * 카드 모킹
   * @param path 파일 경로
   * @param title 제목
   * @returns 모킹된 카드
   */
  static createMockCard(path: string, title: string): ICard {
    return {
      id: path,
      path,
      title,
      content: '',
      tags: [],
      frontmatter: {},
      created: Date.now(),
      modified: Date.now(),
      size: 0,
      folder: path.split('/').slice(0, -1).join('/')
    };
  }
  
  /**
   * 카드셋 소스 모킹
   * @param type 소스 타입
   * @returns 모킹된 카드셋 소스
   */
  static createMockCardSetSource(type: CardSetSourceType): ICardSetSource {
    return {
      type,
      currentCardSet: null,
      selectCardSet: jest.fn(),
      isCardSetFixed: jest.fn().mockReturnValue(false),
      getCardSets: jest.fn().mockResolvedValue([]),
      getFilterOptions: jest.fn().mockResolvedValue([]),
      getFiles: jest.fn().mockResolvedValue([]),
      getCards: jest.fn().mockResolvedValue([]),
      reset: jest.fn(),
      getState: jest.fn().mockReturnValue({ currentCardSet: null, isFixed: false }),
      setState: jest.fn()
    };
  }
  
  /**
   * 검색 모킹
   * @param type 검색 타입
   * @returns 모킹된 검색
   */
  static createMockSearch(type: SearchType): ISearch {
    return {
      getType: jest.fn().mockReturnValue(type),
      getQuery: jest.fn().mockReturnValue(''),
      setQuery: jest.fn(),
      isCaseSensitive: jest.fn().mockReturnValue(false),
      setCaseSensitive: jest.fn(),
      match: jest.fn().mockResolvedValue(true),
      search: jest.fn().mockImplementation(cards => cards),
      serialize: jest.fn().mockReturnValue({ type, query: '', caseSensitive: false })
    };
  }
  
  /**
   * 이벤트 이미터 모킹
   * @returns 모킹된 이벤트 이미터
   */
  static createMockEventEmitter(): IEventEmitter {
    return {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn()
    };
  }
} 