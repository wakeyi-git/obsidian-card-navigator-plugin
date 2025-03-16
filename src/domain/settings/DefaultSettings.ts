import { ICardNavigatorSettings, LayoutDirectionPreference, CardSetSourceMode } from './SettingsInterfaces';
import { NavigationMode } from '../navigation';

/**
 * 기본 설정
 * 카드 네비게이터 플러그인의 기본 설정값을 정의합니다.
 */
export const DEFAULT_SETTINGS: Partial<ICardNavigatorSettings> = {
  // 기본 설정
  enabled: true,
  autoRefresh: true,
  defaultCardSetSource: 'folder',
  defaultLayout: 'grid',
  includeSubfolders: true,
  defaultFolderCardSet: '',
  defaultTagCardSet: '',
  isCardSetFixed: false,
  defaultSearchScope: 'all',
  tagCaseSensitive: false,
  useLastCardSetSourceOnLoad: true,
  debugMode: false,
  
  // 카드셋 소스 모드 설정
  cardSetSourceMode: CardSetSourceMode.FOLDER,
  selectedFolder: '',
  selectedTags: [],
  
  // 카드 설정
  cardWidth: 250,
  cardHeight: 150,
  cardHeaderContent: 'filename',
  cardHeaderFrontmatterKey: '',
  cardBodyContent: 'content',
  cardBodyFrontmatterKey: '',
  cardFooterContent: 'tags',
  cardFooterFrontmatterKey: '',
  cardHeaderContentMultiple: ['filename'],
  cardBodyContentMultiple: ['content'],
  cardFooterContentMultiple: ['tags'],
  titleSource: 'filename',
  includeFrontmatterInContent: false,
  includeFirstHeaderInContent: true,
  limitContentLength: true,
  contentMaxLength: 200,
  
  // 카드 스타일 설정
  normalCardBgColor: '',
  activeCardBgColor: '',
  focusedCardBgColor: '',
  hoverCardBgColor: '#f0f7ff',
  headerBgColor: '',
  bodyBgColor: '',
  footerBgColor: '',
  headerFontSize: 16,
  bodyFontSize: 14,
  footerFontSize: 12,
  
  // 테두리 스타일 설정
  normalCardBorderStyle: 'solid',
  normalCardBorderColor: '',
  normalCardBorderWidth: 1,
  normalCardBorderRadius: 5,
  
  activeCardBorderStyle: 'solid',
  activeCardBorderColor: 'var(--interactive-accent)',
  activeCardBorderWidth: 2,
  activeCardBorderRadius: 5,
  
  focusedCardBorderStyle: 'solid',
  focusedCardBorderColor: 'var(--interactive-accent)',
  focusedCardBorderWidth: 3,
  focusedCardBorderRadius: 5,
  
  headerBorderStyle: 'none',
  headerBorderColor: '',
  headerBorderWidth: 0,
  headerBorderRadius: 0,
  
  bodyBorderStyle: 'none',
  bodyBorderColor: '',
  bodyBorderWidth: 0,
  bodyBorderRadius: 0,
  
  footerBorderStyle: 'none',
  footerBorderColor: '',
  footerBorderWidth: 0,
  footerBorderRadius: 0,
  
  // 검색 설정
  searchCaseSensitive: false,
  highlightSearchResults: true,
  maxSearchResults: 100,
  
  // 정렬 설정
  sortBy: 'filename',
  sortDirection: 'asc',
  defaultSortType: 'filename',
  defaultSortDirection: 'asc',
  defaultSortBy: 'filename',
  customSortFrontmatterKey: '',
  customSortValueType: 'string',
  
  // 레이아웃 설정
  fixedCardHeight: true,
  cardMinWidth: 200,
  cardMinHeight: 100,
  cardGap: 10,
  
  // 우선 순위 설정
  priorityTags: [],
  priorityFolders: [],
  
  // 추가 설정
  cardRenderingMode: 'text',
  frontmatterKey: 'status',
  hoverCardBorderColor: '#80b3ff',
  defaultFilterEnabled: false,
  defaultFilterType: 'tag',
  defaultTagFilter: '',
  defaultTextFilter: '',
  defaultFrontmatterFilterKey: '',
  defaultFrontmatterFilterValue: '',
  defaultFilterOperator: 'AND',
  filterCaseSensitive: false,
  previewSampleType: 'sample1',
  maxSearchHistory: 10,
  navigationMode: 'grid' as NavigationMode,
  selectionMode: 'single',
  dragMode: 'none',
  
  // 미리보기 설정
  showHeader: true,
  showFooter: true,
  bodyMaxLength: 200,
  borderRadius: 5,
  
  // 상호작용 설정
  clickAction: 'select',
  doubleClickAction: 'open',
  rightClickAction: 'menu',
  hoverEffect: 'highlight',
  enableKeyboardNavigation: true,
  autoFocus: true,
  
  // 프리셋 설정
  activePreset: 'default',
  
  // 레이아웃 설정
  layout: {
    fixedCardHeight: true,
    layoutDirectionPreference: LayoutDirectionPreference.AUTO,
    cardThresholdWidth: 200,
    cardThresholdHeight: 150,
    cardGap: 10,
    cardsetPadding: 10,
    cardSizeFactor: 1.0,
    useLayoutTransition: true
  },
}; 

// 디버깅: 기본 설정 값 로깅
console.log('기본 설정 값:');
console.log('cardHeaderContent:', DEFAULT_SETTINGS.cardHeaderContent);
console.log('cardBodyContent:', DEFAULT_SETTINGS.cardBodyContent);
console.log('cardFooterContent:', DEFAULT_SETTINGS.cardFooterContent); 