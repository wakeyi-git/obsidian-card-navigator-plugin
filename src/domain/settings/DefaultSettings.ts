import { ICardNavigatorSettings } from './SettingsInterfaces';
import { NavigationMode } from '../navigation';

/**
 * 기본 설정
 * 카드 네비게이터 플러그인의 기본 설정값을 정의합니다.
 */
export const DEFAULT_SETTINGS: Partial<ICardNavigatorSettings> = {
  // 기본 설정
  defaultCardSetSource: 'folder',
  defaultLayout: 'grid',
  includeSubfolders: true,
  defaultFolderCardSet: '',
  defaultTagCardSet: '',
  isCardSetFixed: false,
  defaultSearchScope: 'current',
  tagCaseSensitive: false,
  useLastCardSetSourceOnLoad: true,
  
  // 카드 설정
  cardWidth: 250,
  cardHeight: 150,
  cardHeaderContent: 'filename',
  cardBodyContent: 'content',
  cardFooterContent: 'tags',
  titleSource: 'filename',
  includeFrontmatterInContent: false,
  includeFirstHeaderInContent: true,
  limitContentLength: true,
  contentMaxLength: 200,
  
  // 카드 스타일 설정
  normalCardBgColor: '',
  activeCardBgColor: '',
  focusedCardBgColor: '',
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
  focusedCardBorderWidth: 2,
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
  sortOrder: 'asc',
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
  hoverCardBgColor: '#f0f7ff',
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
  dragMode: 'copy',
}; 