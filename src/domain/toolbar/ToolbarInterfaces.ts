/**
 * 툴바 아이템 타입 열거형
 */
export enum ToolbarItemType {
  SORT = 'sort',
  CARDSET = 'cardset',
  SETTINGS = 'settings',
  SEARCH = 'search',
  BUTTON = 'button',
  INPUT = 'input',
  SELECT = 'select',
  TOGGLE = 'toggle'
}

/**
 * 툴바 아이템 상태 인터페이스
 * 툴바 아이템의 상태를 정의합니다.
 */
export interface IToolbarItemState {
  /**
   * 아이템 타입
   */
  type: ToolbarItemType;
  
  /**
   * 활성화 여부
   */
  active: boolean;
  
  /**
   * 아이콘 ID
   */
  iconId: string;
  
  /**
   * 툴팁 텍스트
   */
  tooltip: string;
  
  /**
   * 아이템 ID
   */
  id: string;
}

/**
 * 툴바 상태 인터페이스
 * 툴바의 전체 상태를 정의합니다.
 */
export interface IToolbarState {
  /**
   * 툴바 아이템 목록
   */
  items: IToolbarItemState[];
  
  /**
   * 검색어
   */
  searchQuery: string;
  
  /**
   * 검색 모드 활성화 여부
   */
  isSearchActive: boolean;
}

/**
 * 툴바 이벤트 핸들러 인터페이스
 * 툴바 이벤트를 처리하기 위한 인터페이스입니다.
 */
export interface IToolbarEventHandler {
  /**
   * 툴바 아이템 클릭 이벤트 처리
   * @param itemType 클릭된 아이템 타입
   * @returns 처리 결과
   */
  onToolbarItemClick(itemType: ToolbarItemType): Promise<boolean>;
  
  /**
   * 검색어 변경 이벤트 처리
   * @param query 변경된 검색어
   * @returns 처리 결과
   */
  onSearchQueryChange(query: string): Promise<boolean>;
  
  /**
   * 검색어 삭제 이벤트 처리
   * @returns 처리 결과
   */
  onSearchQueryClear(): Promise<boolean>;
}

/**
 * 툴바 팝업 인터페이스
 * 툴바 아이템 클릭 시 표시되는 팝업을 정의합니다.
 */
export interface IToolbarPopup {
  /**
   * 팝업 타입
   */
  type: string;
  
  /**
   * 팝업 표시 여부
   */
  visible: boolean;
  
  /**
   * 팝업 위치
   */
  position: {
    x: number;
    y: number;
  };
}

/**
 * 검색 팝업 인터페이스
 * 검색 팝업의 상태를 정의합니다.
 */
export interface ISearchPopupState extends IToolbarPopup {
  /**
   * 팝업 타입 (항상 'search')
   */
  type: 'search';
  
  /**
   * 검색어
   */
  query: string;
  
  /**
   * 검색 타입
   */
  searchType?: 'filename' | 'content' | 'tag' | 'path' | 'frontmatter' | 'create' | 'modify' | 'regex';
  
  /**
   * 대소문자 구분 여부
   */
  caseSensitive: boolean;
  
  /**
   * 현재 카드셋 소스
   */
  currentCardSetSource: 'folder' | 'tag';
  
  /**
   * 폴더 모드 필터 옵션
   */
  folderModeFilters: {
    /**
     * 선택된 태그 목록
     */
    selectedTags: string[];
    
    /**
     * 날짜 범위 필터
     */
    dateRange?: {
      /**
       * 생성일 범위
       */
      created?: {
        start?: string;
        end?: string;
      };
      
      /**
       * 수정일 범위
       */
      modified?: {
        start?: string;
        end?: string;
      };
    };
  };
  
  /**
   * 태그 모드 필터 옵션
   */
  tagModeFilters: {
    /**
     * 선택된 경로 목록
     */
    selectedPaths: string[];
    
    /**
     * 날짜 범위 필터
     */
    dateRange?: {
      /**
       * 생성일 범위
       */
      created?: {
        start?: string;
        end?: string;
      };
      
      /**
       * 수정일 범위
       */
      modified?: {
        start?: string;
        end?: string;
      };
    };
  };
  
  /**
   * 검색 제안 표시 여부
   */
  showSuggestions: boolean;
  
  /**
   * 검색 제안 목록
   */
  suggestions: any[];
}

/**
 * 정렬 팝업 인터페이스
 * 정렬 팝업의 상태를 정의합니다.
 */
export interface ISortPopupState extends IToolbarPopup {
  /**
   * 팝업 타입 (항상 'sort')
   */
  type: 'sort';
  
  /**
   * 현재 정렬 타입
   */
  currentSortType: 'filename' | 'created' | 'modified' | 'frontmatter';
  
  /**
   * 현재 정렬 방향
   */
  currentSortDirection: 'asc' | 'desc';
  
  /**
   * 프론트매터 키 (frontmatter 타입인 경우)
   */
  frontmatterKey?: string;
}

/**
 * 설정 팝업 인터페이스
 * 설정 팝업의 상태를 정의합니다.
 */
export interface ISettingsPopupState extends IToolbarPopup {
  /**
   * 팝업 타입 (항상 'settings')
   */
  type: 'settings';
  
  /**
   * 현재 카드셋 소스
   */
  currentCardSetSource: 'folder' | 'tag';
  
  /**
   * 현재 프리셋
   */
  currentPreset?: string;
  
  /**
   * 카드 표시 설정
   */
  cardDisplay: {
    /**
     * 헤더 표시 여부
     */
    showHeader: boolean;
    
    /**
     * 바디 표시 여부
     */
    showBody: boolean;
    
    /**
     * 풋터 표시 여부
     */
    showFooter: boolean;
  };
  
  /**
   * 렌더링 모드
   */
  renderingMode: 'text' | 'html';
  
  /**
   * 레이아웃 모드
   */
  layoutMode: 'grid' | 'masonry';
}

/**
 * 툴바 관리자 인터페이스
 * 툴바 관련 기능을 제공합니다.
 */
export interface IToolbarManager {
  /**
   * 툴바 상태 가져오기
   * @returns 툴바 상태
   */
  getToolbarState(): IToolbarState;
  
  /**
   * 툴바 아이템 활성화/비활성화
   * @param itemType 아이템 타입
   * @param active 활성화 여부
   */
  setToolbarItemActive(itemType: ToolbarItemType, active: boolean): void;
  
  /**
   * 검색어 설정
   * @param query 검색어
   */
  setSearchQuery(query: string): void;
  
  /**
   * 검색어 삭제
   */
  clearSearchQuery(): void;
  
  /**
   * 팝업 표시
   * @param popupType 팝업 타입
   * @param position 팝업 위치
   */
  showPopup(popupType: ToolbarItemType, position: { x: number; y: number }): void;
  
  /**
   * 팝업 숨기기
   * @param popupType 팝업 타입
   */
  hidePopup(popupType: ToolbarItemType): void;
  
  /**
   * 모든 팝업 숨기기
   */
  hideAllPopups(): void;
  
  /**
   * 검색 팝업 상태 가져오기
   * @returns 검색 팝업 상태
   */
  getSearchPopupState(): ISearchPopupState | null;
  
  /**
   * 정렬 팝업 상태 가져오기
   * @returns 정렬 팝업 상태
   */
  getSortPopupState(): ISortPopupState | null;
  
  /**
   * 설정 팝업 상태 가져오기
   * @returns 설정 팝업 상태
   */
  getSettingsPopupState(): ISettingsPopupState | null;
}

/**
 * 검색 제안 관리자 인터페이스
 * 검색어 입력 시 제안 목록을 관리합니다.
 */
export interface ISearchSuggestManager {
  /**
   * 검색 타입 제안 목록 가져오기
   * @returns 검색 타입 제안 목록
   */
  getSearchTypeSuggestions(): string[];
  
  /**
   * 검색어 제안 목록 가져오기
   * @param searchType 검색 타입
   * @param partialQuery 부분 검색어
   * @returns 검색어 제안 목록
   */
  getQuerySuggestions(searchType: string, partialQuery: string): Promise<string[]>;
  
  /**
   * 프론트매터 키 제안 목록 가져오기
   * @returns 프론트매터 키 제안 목록
   */
  getFrontmatterKeySuggestions(): Promise<string[]>;
  
  /**
   * 프론트매터 값 제안 목록 가져오기
   * @param key 프론트매터 키
   * @returns 프론트매터 값 제안 목록
   */
  getFrontmatterValueSuggestions(key: string): Promise<string[]>;
  
  /**
   * 태그 제안 목록 가져오기
   * @param partialTag 부분 태그
   * @returns 태그 제안 목록
   */
  getTagSuggestions(partialTag: string): Promise<string[]>;
  
  /**
   * 파일 경로 제안 목록 가져오기
   * @param partialPath 부분 경로
   * @returns 파일 경로 제안 목록
   */
  getPathSuggestions(partialPath: string): Promise<string[]>;
  
  /**
   * 파일 이름 제안 목록 가져오기
   * @param partialName 부분 파일 이름
   * @returns 파일 이름 제안 목록
   */
  getFilenameSuggestions(partialName: string): Promise<string[]>;
} 