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
  enabled: boolean;
  autoRefresh: boolean;
  defaultCardSetSource: CardSetSourceType;
  defaultLayout: 'grid' | 'masonry';
  includeSubfolders: boolean;
  defaultFolderCardSet: string;
  defaultTagCardSet: string;
  isCardSetFixed: boolean;
  defaultSearchScope?: 'all' | 'current';
  tagCaseSensitive?: boolean;
  useLastCardSetSourceOnLoad?: boolean;
  debugMode?: boolean;
  
  // 툴바 관련 설정
  specificFolder?: string;
  useTagsForCardSet?: boolean;
  showToolbar?: boolean;
  showStatusBar?: boolean;
  showCardPreview?: boolean;
  showCardTags?: boolean;
  showPreview?: boolean;
  searchAsYouType?: boolean;
  viewType?: string;
  gridColumns?: number;
  visibleColumns?: string[];
  sortBy?: string;
  sortDirection?: string;
  defaultSearchType?: string;
  searchCaseSensitive?: boolean;
  clickAction?: string;
  toolbarItems?: any[];
  
  // 마지막 상태 저장
  lastCardSetSource?: CardSetSourceType;
  lastFolderCardSet?: string;
  lastFolderCardSetFixed?: boolean;
  lastTagCardSet?: string;
  lastTagCardSetFixed?: boolean;
  
  // 카드 설정
  cardWidth: number;
  cardHeight: number;
  cardHeaderContent: string;
  cardBodyContent: string;
  cardFooterContent: string;
  cardHeaderFrontmatterKey?: string;
  cardBodyFrontmatterKey?: string;
  cardFooterFrontmatterKey?: string;
  
  // 다중 선택 콘텐츠 설정
  cardHeaderContentMultiple?: string[];
  cardBodyContentMultiple?: string[];
  cardFooterContentMultiple?: string[];
  
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
  
  /**
   * 레이아웃 설정
   * 카드 레이아웃 관련 설정을 포함합니다.
   */
  layout?: ILayoutSettings;
  
  // 내비게이션 설정
  navigationMode?: NavigationMode;
  
  // 상호작용 설정
  selectionMode?: 'single' | 'multiple';
  dragMode?: 'none' | 'move' | 'copy';
  doubleClickAction?: 'open' | 'preview' | 'none';
  rightClickAction?: 'menu' | 'select' | 'none';
  hoverEffect?: 'highlight' | 'zoom' | 'none';
  enableKeyboardNavigation?: boolean;
  autoFocus?: boolean;
  
  // 우선 순위 설정
  priorityTags?: string[];
  priorityFolders?: string[];
  
  // 프리셋 설정
  presets?: any[];
  folderPresetMappings?: {folder: string, presetId: string}[];
  tagPresetMappings?: {tag: string, presetId: string}[];
  presetPriorities?: {id: string, type: 'folder' | 'tag', target: string}[];
  activePreset?: string;
  customPreset?: Partial<ICardNavigatorSettings>;
  
  // 검색 히스토리 설정
  searchHistory?: string[];
  maxSearchHistory?: number;
  
  // 카드셋 설정
  cardSetSourceType?: CardSetSourceType;
  currentPresetId?: string | null;
  
  // 미리보기 설정
  previewSampleType?: string;
  
  // 미리보기 설정
  showHeader?: boolean;
  showFooter?: boolean;
  bodyMaxLength?: number;
  borderRadius?: number;
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
   * 카드 임계 너비 (px)
   * 그리드 세로 방향: 열 수 계산에 사용
   * 그리드 가로 방향: 카드 너비로 고정
   * 메이슨리: 열 수 계산에 사용
   */
  cardThresholdWidth: number;
  
  /**
   * 카드 임계 높이 (px)
   * 그리드 세로 방향: 카드 높이로 고정
   * 그리드 가로 방향: 행 수 계산에 사용
   * 메이슨리: 최소 높이로 사용
   */
  cardThresholdHeight: number;
  
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
  
  /**
   * 디버그 모드 활성화 여부
   * 개발 중 디버깅을 위한 로그 출력 여부를 결정합니다.
   */
  debugMode: boolean;
  
  // ... existing code ...
} 