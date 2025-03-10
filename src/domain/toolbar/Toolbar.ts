import { 
  IToolbarManager, 
  IToolbarState, 
  ToolbarItemType, 
  ISearchPopupState, 
  ISortPopupState, 
  ISettingsPopupState 
} from './ToolbarInterfaces';

/**
 * 툴바 관리자 클래스
 * 툴바 상태 및 팝업을 관리합니다.
 */
export class ToolbarManager implements IToolbarManager {
  /**
   * 툴바 상태
   */
  private state: IToolbarState;
  
  /**
   * 검색 팝업 상태
   */
  private searchPopup: ISearchPopupState | null = null;
  
  /**
   * 정렬 팝업 상태
   */
  private sortPopup: ISortPopupState | null = null;
  
  /**
   * 설정 팝업 상태
   */
  private settingsPopup: ISettingsPopupState | null = null;
  
  /**
   * 생성자
   */
  constructor() {
    // 기본 툴바 상태 초기화
    this.state = {
      items: [
        {
          type: 'search',
          active: false,
          iconId: 'search',
          tooltip: '검색',
          id: 'toolbar-search'
        },
        {
          type: 'sort',
          active: false,
          iconId: 'sort',
          tooltip: '정렬',
          id: 'toolbar-sort'
        },
        {
          type: 'cardset',
          active: false,
          iconId: 'folder',
          tooltip: '카드셋',
          id: 'toolbar-cardset'
        },
        {
          type: 'settings',
          active: false,
          iconId: 'settings',
          tooltip: '설정',
          id: 'toolbar-settings'
        }
      ],
      searchQuery: '',
      isSearchActive: false
    };
  }
  
  /**
   * 툴바 상태 가져오기
   * @returns 툴바 상태
   */
  getToolbarState(): IToolbarState {
    return { ...this.state };
  }
  
  /**
   * 툴바 아이템 활성화/비활성화
   * @param itemType 아이템 타입
   * @param active 활성화 여부
   */
  setToolbarItemActive(itemType: ToolbarItemType, active: boolean): void {
    const updatedItems = this.state.items.map(item => {
      if (item.type === itemType) {
        return { ...item, active };
      }
      return item;
    });
    
    this.state = {
      ...this.state,
      items: updatedItems
    };
  }
  
  /**
   * 검색어 설정
   * @param query 검색어
   */
  setSearchQuery(query: string): void {
    this.state = {
      ...this.state,
      searchQuery: query,
      isSearchActive: query.length > 0
    };
  }
  
  /**
   * 검색어 삭제
   */
  clearSearchQuery(): void {
    this.state = {
      ...this.state,
      searchQuery: '',
      isSearchActive: false
    };
  }
  
  /**
   * 팝업 표시
   * @param popupType 팝업 타입
   * @param position 팝업 위치
   */
  showPopup(popupType: ToolbarItemType, position: { x: number; y: number }): void {
    // 다른 팝업 모두 숨기기
    this.hideAllPopups();
    
    // 요청된 팝업 표시
    switch (popupType) {
      case 'search':
        this.searchPopup = {
          type: 'search',
          visible: true,
          position,
          query: this.state.searchQuery,
          searchType: 'filename',
          caseSensitive: false,
          currentCardSetSource: 'folder', // 기본값
          folderModeFilters: {
            selectedTags: []
          },
          tagModeFilters: {
            selectedPaths: []
          },
          showSuggestions: false,
          suggestions: []
        };
        break;
        
      case 'sort':
        this.sortPopup = {
          type: 'sort',
          visible: true,
          position,
          currentSortType: 'filename',
          currentSortDirection: 'asc'
        };
        break;
        
      case 'settings':
        this.settingsPopup = {
          type: 'settings',
          visible: true,
          position,
          currentCardSetSource: 'folder',
          cardDisplay: {
            showHeader: true,
            showBody: true,
            showFooter: true
          },
          renderingMode: 'text',
          layoutMode: 'grid'
        };
        break;
        
      default:
        break;
    }
    
    // 해당 툴바 아이템 활성화
    this.setToolbarItemActive(popupType, true);
  }
  
  /**
   * 팝업 숨기기
   * @param popupType 팝업 타입
   */
  hidePopup(popupType: ToolbarItemType): void {
    switch (popupType) {
      case 'search':
        if (this.searchPopup) {
          this.searchPopup.visible = false;
        }
        break;
        
      case 'sort':
        if (this.sortPopup) {
          this.sortPopup.visible = false;
        }
        break;
        
      case 'settings':
        if (this.settingsPopup) {
          this.settingsPopup.visible = false;
        }
        break;
        
      default:
        break;
    }
    
    // 해당 툴바 아이템 비활성화
    this.setToolbarItemActive(popupType, false);
  }
  
  /**
   * 모든 팝업 숨기기
   */
  hideAllPopups(): void {
    if (this.searchPopup) {
      this.searchPopup.visible = false;
      this.setToolbarItemActive('search', false);
    }
    
    if (this.sortPopup) {
      this.sortPopup.visible = false;
      this.setToolbarItemActive('sort', false);
    }
    
    if (this.settingsPopup) {
      this.settingsPopup.visible = false;
      this.setToolbarItemActive('settings', false);
    }
  }
  
  /**
   * 검색 팝업 상태 가져오기
   * @returns 검색 팝업 상태
   */
  getSearchPopupState(): ISearchPopupState | null {
    return this.searchPopup ? { ...this.searchPopup } : null;
  }
  
  /**
   * 정렬 팝업 상태 가져오기
   * @returns 정렬 팝업 상태
   */
  getSortPopupState(): ISortPopupState | null {
    return this.sortPopup ? { ...this.sortPopup } : null;
  }
  
  /**
   * 설정 팝업 상태 가져오기
   * @returns 설정 팝업 상태
   */
  getSettingsPopupState(): ISettingsPopupState | null {
    return this.settingsPopup ? { ...this.settingsPopup } : null;
  }
} 