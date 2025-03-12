import { CardSetSourceType } from '../cardset/CardSet';
import { EventType } from '../events/EventTypes';
import { SelectionMode } from '../interaction/SelectionState';
import { NavigationMode } from '../navigation';
import { CardRenderingMode } from '../card/Card';

/**
 * 카드 네비게이터 설정 인터페이스
 * 플러그인 설정을 정의합니다.
 */
export interface ICardNavigatorSettings {
  // 기본 설정
  defaultCardSetSource: CardSetSourceType;
  defaultLayout: 'grid' | 'masonry';
  includeSubfolders: boolean;
  defaultFolderCardSet: string;
  defaultTagCardSet: string;
  isCardSetFixed: boolean;
  defaultSearchScope?: 'all' | 'current';
  tagCaseSensitive?: boolean;
  useLastCardSetSourceOnLoad?: boolean;
  
  // 마지막 상태 저장
  lastCardSetSource?: CardSetSourceType;
  lastFolderCardSet?: string;
  lastFolderCardSetFixed?: boolean;
  lastTagCardSet?: string;
  lastTagCardSetFixed?: boolean;
  
  // 카드 설정
  cardWidth: number;
  cardHeight: number;
  cardHeaderContent?: string[] | string;
  cardBodyContent?: string[] | string;
  cardFooterContent?: string[] | string;
  cardHeaderFrontmatterKey?: string;
  cardBodyFrontmatterKey?: string;
  cardFooterFrontmatterKey?: string;
  renderingCardSetSource?: string;
  titleSource?: 'filename' | 'firstheader';
  includeFrontmatterInContent?: boolean;
  includeFirstHeaderInContent?: boolean;
  limitContentLength?: boolean;
  contentMaxLength?: number;
  cardRenderingMode?: CardRenderingMode;
  frontmatterKey?: string;
  
  // 카드 스타일 설정
  normalCardBgColor?: string;
  activeCardBgColor?: string;
  focusedCardBgColor?: string;
  hoverCardBgColor?: string;
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
  
  hoverCardBorderColor?: string;
  
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
  
  // 정렬 설정
  defaultSortType?: string;
  defaultSortDirection?: 'asc' | 'desc';
  defaultSortBy?: 'filename' | 'title' | 'created' | 'modified' | 'random' | 'custom';
  customSortFrontmatterKey?: string;
  customSortValueType?: 'string' | 'number' | 'date';
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  customSortKey?: string;
  tagSortBy?: string;
  folderSortBy?: string;
  
  // 필터 설정
  defaultFilterEnabled?: boolean;
  defaultFilterType?: 'tag' | 'text' | 'frontmatter';
  defaultTagFilter?: string;
  defaultTextFilter?: string;
  defaultFrontmatterFilterKey?: string;
  defaultFrontmatterFilterValue?: string;
  defaultFilterOperator?: 'AND' | 'OR';
  filterCaseSensitive?: boolean;
  
  // 검색 설정
  defaultSearchType?: string;
  defaultSearchCaseSensitive?: boolean;
  searchCaseSensitive?: boolean;
  highlightSearchResults?: boolean;
  maxSearchResults?: number;
  tagCardSetSourceSearchOptions?: string[];
  folderCardSetSourceSearchOptions?: string[];
  frontmatterSearchKey?: string;
  
  // 레이아웃 설정
  fixedCardHeight?: boolean;
  cardMinWidth?: number;
  cardMinHeight?: number;
  cardGap?: number;
  gridColumns?: string;
  
  /**
   * 레이아웃 설정
   * 카드 레이아웃 관련 설정을 포함합니다.
   */
  layout?: ILayoutSettings;
  
  // 내비게이션 설정
  navigationMode?: NavigationMode;
  
  // 상호작용 설정
  selectionMode?: SelectionMode;
  dragMode?: 'none' | 'move' | 'copy';
  
  // 우선 순위 설정
  priorityTags?: string[];
  priorityFolders?: string[];
  
  // 프리셋 설정
  presets?: any[];
  folderPresetMappings?: {folder: string, presetId: string}[];
  tagPresetMappings?: {tag: string, presetId: string}[];
  presetPriorities?: {id: string, type: 'folder' | 'tag', target: string}[];
  
  // 검색 히스토리 설정
  searchHistory?: string[];
  maxSearchHistory?: number;
  
  // 카드셋 설정
  cardSetSourceType?: CardSetSourceType;
  currentPresetId?: string | null;
  
  // 툴바 설정
  toolbarItems?: any[];
  
  // 미리보기 설정
  previewSampleType?: string;
}

/**
 * 설정 이벤트 타입
 * @deprecated EventType을 사용하세요.
 */
export type SettingsEventType = 
  | typeof EventType.SETTINGS_CHANGED
  | typeof EventType.SETTINGS_LOADED
  | typeof EventType.SETTINGS_SAVED
  | typeof EventType.SETTINGS_RESET;

/**
 * 설정 관리 인터페이스
 * 설정 관련 기능을 제공합니다.
 */
export interface ISettingsManager {
  /**
   * 설정 로드
   * @returns 로드된 설정
   */
  loadSettings(): Promise<ICardNavigatorSettings>;
  
  /**
   * 설정 저장
   * @param settings 저장할 설정
   */
  saveSettings(settings: ICardNavigatorSettings): Promise<void>;
  
  /**
   * 설정 업데이트
   * @param settings 업데이트할 설정
   */
  updateSettings(settings: Partial<ICardNavigatorSettings>): Promise<void>;
  
  /**
   * 설정 초기화
   */
  resetSettings(): Promise<void>;
  
  /**
   * 현재 설정 가져오기
   * @returns 현재 설정
   */
  getSettings(): ICardNavigatorSettings;
  
  /**
   * 설정 변경 이벤트 리스너 등록
   * @param listener 리스너 함수
   */
  onSettingsChanged(listener: (settings: ICardNavigatorSettings) => void): void;
  
  /**
   * 설정 변경 이벤트 리스너 제거
   * @param listener 리스너 함수
   */
  offSettingsChanged(listener: (settings: ICardNavigatorSettings) => void): void;
}

/**
 * 설정 서비스 인터페이스
 * 설정 관련 기능을 제공합니다.
 */
export interface ISettingsService extends ISettingsManager {
  /**
   * 이벤트 리스너 등록
   * @param event 이벤트 이름
   * @param listener 리스너 함수
   */
  on(event: EventType, listener: (...args: any[]) => void): void;
  
  /**
   * 이벤트 리스너 제거
   * @param event 이벤트 이름
   * @param listener 리스너 함수
   */
  off(event: EventType, listener: (...args: any[]) => void): void;
  
  /**
   * 이벤트 발생
   * @param event 이벤트 이름
   * @param data 이벤트 데이터
   */
  emit(event: EventType, data: any): void;
  
  /**
   * 플러그인 인스턴스 가져오기
   * @returns 플러그인 인스턴스
   */
  getPlugin(): any;
}

/**
 * 레이아웃 방향 선호도
 */
export enum LayoutDirectionPreference {
  AUTO = 'auto',         // 뷰포트 비율에 따라 자동 결정
  VERTICAL = 'vertical', // 항상 세로 레이아웃 사용
  HORIZONTAL = 'horizontal'  // 항상 가로 레이아웃 사용
}

/**
 * 레이아웃 설정 인터페이스
 */
export interface ILayoutSettings {
  /**
   * 카드 높이 고정 여부
   * - true: 그리드 레이아웃 (고정 높이)
   * - false: 메이슨리 레이아웃 (가변 높이)
   */
  fixedCardHeight: boolean;
  
  /**
   * 레이아웃 방향 선호도
   */
  layoutDirectionPreference: LayoutDirectionPreference;
  
  /**
   * 카드 최소 너비 (px)
   */
  cardMinWidth: number;
  
  /**
   * 카드 최대 너비 (px)
   */
  cardMaxWidth: number;
  
  /**
   * 카드 최소 높이 (px)
   */
  cardMinHeight: number;
  
  /**
   * 카드 최대 높이 (px)
   */
  cardMaxHeight: number;
  
  /**
   * 카드 간 간격 (px)
   */
  cardGap: number;
  
  /**
   * 카드셋 패딩 (px)
   */
  cardsetPadding: number;
  
  /**
   * 카드 크기 조정 팩터 (0.8 ~ 1.2)
   */
  cardSizeFactor: number;
  
  /**
   * 레이아웃 전환 애니메이션 사용 여부
   */
  useLayoutTransition: boolean;
}

/**
 * 플러그인 설정 인터페이스
 */
export interface IPluginSettings {
  // ... existing code ...
  
  /**
   * 레이아웃 설정
   */
  layout: ILayoutSettings;
  
  // ... existing code ...
} 