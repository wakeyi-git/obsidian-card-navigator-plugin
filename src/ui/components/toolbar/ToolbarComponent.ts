import { Component } from '../Component';
import { IToolbarService, IToolbarItem, IToolbarPopup } from '../../../application/toolbar/ToolbarService';
import { ToolbarItemPosition } from '../../../application/toolbar/ToolbarService';
import { setIcon } from 'obsidian';
import { ISearchComponent } from '../search/SearchComponent';
import { ISettingsService } from '../../../domain/settings/SettingsInterfaces';
import './ToolbarComponent.css';
import '../popup/popup.css';
import { PopupManager } from '../popup/PopupManager';
import { CardSetSourceMode } from '../../../domain/settings/SettingsInterfaces';
import { EventType } from '../../../domain/events/EventTypes';
import { ObsidianService } from '../../../infrastructure/obsidian/adapters/ObsidianService';

/**
 * 툴바 컴포넌트 인터페이스
 */
export interface IToolbarComponent {
  /**
   * 툴바 아이템 추가
   * @param item 툴바 아이템
   */
  addItem(item: IToolbarItem): void;
  
  /**
   * 툴바 아이템 제거
   * @param itemId 툴바 아이템 ID
   */
  removeItem(itemId: string): void;
  
  /**
   * 툴바 아이템 업데이트
   * @param itemId 툴바 아이템 ID
   * @param updates 업데이트할 속성
   */
  updateItem(itemId: string, updates: Partial<IToolbarItem>): void;
}

/**
 * 툴바 컴포넌트
 * 툴바를 렌더링하는 컴포넌트입니다.
 */
export class ToolbarComponent extends Component implements IToolbarComponent {
  private toolbarService: IToolbarService;
  private searchComponent: ISearchComponent;
  private obsidianService: ObsidianService;
  private items: IToolbarItem[] = [];
  private searchBarVisible: boolean = false;
  private searchBarElement: HTMLElement | null = null;
  
  // 이벤트 리스너 참조 저장
  private itemRegisteredListener: (data: any) => void = () => {};
  private itemUpdatedListener: (data: any) => void = () => {};
  private itemRemovedListener: (data: any) => void = () => {};
  private itemValueChangedListener: (data: any) => void = () => {};
  private itemDisabledChangedListener: (data: any) => void = () => {};
  private itemVisibleChangedListener: (data: any) => void = () => {};

  /**
   * 생성자
   * @param toolbarService 툴바 서비스
   * @param searchComponent 검색 컴포넌트
   * @param obsidianService ObsidianService
   */
  constructor(toolbarService: IToolbarService, searchComponent: ISearchComponent, obsidianService: ObsidianService) {
    super();
    this.toolbarService = toolbarService;
    this.searchComponent = searchComponent;
    this.obsidianService = obsidianService;
    
    // 이벤트 리스너 초기화
    this.initializeEventListeners();
    
    // 툴바 아이템 로드
    this.loadItems();
  }
  
  /**
   * 툴바 아이템 로드
   */
  private loadItems(): void {
    this.items = this.toolbarService.getItems();
  }
  
  /**
   * 툴바 아이템 추가
   * @param item 툴바 아이템
   */
  addItem(item: IToolbarItem): void {
    this.toolbarService.registerItem(item);
    this.loadItems();
    this.update();
  }
  
  /**
   * 툴바 아이템 제거
   * @param itemId 툴바 아이템 ID
   */
  removeItem(itemId: string): void {
    this.toolbarService.removeItem(itemId);
    this.loadItems();
    this.update();
  }
  
  /**
   * 툴바 아이템 업데이트
   * @param itemId 툴바 아이템 ID
   * @param updates 업데이트할 속성
   */
  updateItem(itemId: string, updates: Partial<IToolbarItem>): void {
    this.toolbarService.updateItem(itemId, updates);
    this.loadItems();
    this.update();
  }
  
  /**
   * 컴포넌트 생성
   * @returns 생성된 컴포넌트 요소
   */
  protected async createComponent(): Promise<HTMLElement> {
    // 툴바 컨테이너 생성
    const container = document.createElement('div');
    container.className = 'card-navigator-toolbar-container';
    
    // 툴바 요소 생성
    const toolbarElement = document.createElement('div');
    toolbarElement.className = 'card-navigator-toolbar';
    
    // 툴바 섹션 생성
    const leftSection = document.createElement('div');
    leftSection.className = 'toolbar-section left';
    
    const centerSection = document.createElement('div');
    centerSection.className = 'toolbar-section center';
    
    const rightSection = document.createElement('div');
    rightSection.className = 'toolbar-section right';
    
    // 툴바에 섹션 추가
    toolbarElement.appendChild(leftSection);
    toolbarElement.appendChild(centerSection);
    toolbarElement.appendChild(rightSection);
    
    // 아이템 렌더링
    this.renderItems(leftSection, centerSection, rightSection);
    
    // 컨테이너에 툴바 추가
    container.appendChild(toolbarElement);
    
    return container;
  }
  
  /**
   * 툴바 아이템 렌더링
   * @param leftSection 왼쪽 섹션
   * @param centerSection 중앙 섹션
   * @param rightSection 오른쪽 섹션
   */
  private renderItems(
    leftSection: HTMLElement,
    centerSection: HTMLElement,
    rightSection: HTMLElement
  ): void {
    // 아이템 정렬
    const sortedItems = [...this.items].sort((a, b) => {
      // 위치에 따른 정렬
      const positionOrder: Record<ToolbarItemPosition, number> = {
        left: 0,
        center: 1,
        right: 2
      };
      
      const positionDiff = positionOrder[a.position] - positionOrder[b.position];
      if (positionDiff !== 0) return positionDiff;
      
      // 같은 위치 내에서는 order 속성으로 정렬
      return (a.order || 0) - (b.order || 0);
    });
    
    // 아이템 렌더링
    sortedItems.forEach(item => {
      if (!item.visible) return;
      
      const itemElement = this.createItemElement(item);
      
      // 위치에 따라 적절한 섹션에 추가
      switch (item.position) {
        case 'left':
          leftSection.appendChild(itemElement);
          break;
        case 'center':
          centerSection.appendChild(itemElement);
          break;
        case 'right':
          rightSection.appendChild(itemElement);
          break;
      }
    });
  }
  
  /**
   * 툴바 아이템 요소 생성
   * @param item 툴바 아이템
   * @returns 생성된 HTML 요소
   */
  private createItemElement(item: IToolbarItem): HTMLElement {
    let itemElement: HTMLElement;
    
    // 아이템 타입에 따라 다른 요소 생성
    switch (item.type) {
      case 'button':
        itemElement = this.createButton(item);
        break;
      case 'select':
        if (item.id === 'cardset-name') {
          itemElement = this.createCardsetNameElement(item);
        } else {
          itemElement = this.createSelectElement(item);
        }
        break;
      case 'input':
        itemElement = this.searchComponent.createToolbarSearchElement(item, (value: string) => {
          this.toolbarService.setItemValue(item.id, value);
        });
        break;
      default:
        itemElement = this.createButton(item);
    }
    
    // 공통 속성 설정
    itemElement.classList.add('toolbar-item');
    itemElement.dataset.id = item.id;
    itemElement.dataset.type = item.type;
    
    if (item.disabled) {
      itemElement.classList.add('disabled');
      itemElement.setAttribute('aria-disabled', 'true');
    }
    
    return itemElement;
  }
  
  /**
   * 버튼 생성
   * @param item 툴바 아이템
   * @returns 버튼 요소
   */
  private createButton(item: IToolbarItem): HTMLElement {
    const button = document.createElement('button');
    button.className = 'toolbar-button';
    button.setAttribute('data-item-id', item.id);
    
    if (item.tooltip) {
      button.setAttribute('aria-label', item.tooltip);
      button.setAttribute('title', item.tooltip);
    }
    
    if (item.icon) {
      const iconContainer = document.createElement('div');
      iconContainer.className = 'toolbar-button-icon';
      setIcon(iconContainer, item.icon);
      button.appendChild(iconContainer);
    }
    
    if (item.label) {
      const labelContainer = document.createElement('div');
      labelContainer.className = 'toolbar-button-label';
      labelContainer.textContent = item.label;
      button.appendChild(labelContainer);
    }
    
    // 비활성화 상태 설정
    if (item.disabled) {
      button.disabled = true;
      button.classList.add('disabled');
    }
    
    // 클릭 이벤트 리스너 등록
    button.addEventListener('click', (event) => {
      this.handleItemClick(item, event);
    });
    
    return button;
  }
  
  /**
   * 선택 요소 생성
   * @param item 툴바 아이템
   * @returns 생성된 HTML 요소
   */
  private createSelectElement(item: IToolbarItem): HTMLElement {
    const selectContainer = document.createElement('div');
    selectContainer.className = 'toolbar-select-container';
    
    const selectButton = document.createElement('button');
    selectButton.className = 'toolbar-select-button';
    selectButton.type = 'button';
    
    // 현재 선택된 옵션 표시
    const selectedOption = item.options?.find(opt => opt.value === item.value);
    const selectedText = document.createElement('span');
    selectedText.className = 'selected-text';
    selectedText.textContent = selectedOption?.label || '';
    
    // 드롭다운 아이콘
    const dropdownIcon = document.createElement('span');
    dropdownIcon.className = 'dropdown-icon';
    setIcon(dropdownIcon, 'chevron-down');
    
    selectButton.appendChild(selectedText);
    selectButton.appendChild(dropdownIcon);
    
    if (item.tooltip) {
      selectButton.title = item.tooltip;
    }
    
    // 이벤트 리스너 등록
    selectButton.addEventListener('click', () => {
      if (!item.disabled && item.popupId) {
        const buttonElement = selectButton;
        const rect = buttonElement.getBoundingClientRect();
        
        // 팝업 위치 계산 - 버튼 중앙 아래에 표시
        const position = {
          x: rect.left + (rect.width / 2),
          y: rect.bottom
        };
        
        // 팝업 표시
        this.toolbarService.showPopup({
          id: item.popupId,
          type: item.popupId,
          position: position,
          content: '' // 내용은 PopupManager에서 생성
        });
      }
    });
    
    selectContainer.appendChild(selectButton);
    
    return selectContainer;
  }
  
  /**
   * 카드셋 이름 요소 생성
   * @param item 툴바 아이템
   * @returns 생성된 HTML 요소
   */
  private createCardsetNameElement(item: IToolbarItem): HTMLElement {
    const container = document.createElement('div');
    container.className = 'cardset-name-container';
    container.setAttribute('data-item-id', item.id);
    
    if (item.tooltip) {
      container.setAttribute('aria-label', item.tooltip);
      container.setAttribute('title', item.tooltip);
    }
    
    // 카드셋 이름 텍스트
    const nameText = document.createElement('span');
    nameText.className = 'cardset-name-text';
    
    // 현재 설정 가져오기
    const settings = this.toolbarService.getSettings();
    const isFixed = settings.isCardSetFixed;
    const mode = settings.cardSetSourceMode || CardSetSourceMode.FOLDER;
    
    // 카드셋 이름 설정
    let cardsetName = '활성 카드셋';
    
    if (isFixed) {
      if (mode === CardSetSourceMode.FOLDER) {
        cardsetName = settings.selectedFolder || '선택된 폴더 없음';
      } else {
        cardsetName = settings.selectedTags?.join(', ') || '선택된 태그 없음';
      }
    } else {
      if (mode === CardSetSourceMode.FOLDER) {
        // 활성 파일의 폴더 경로 가져오기
        const activeFile = this.obsidianService.getActiveFile();
        const folderPath = activeFile?.parent?.path || '';
        cardsetName = folderPath || '활성 폴더';
      } else {
        cardsetName = '활성 태그';
      }
    }
    
    nameText.textContent = cardsetName;
    container.appendChild(nameText);
    
    // 클릭 이벤트 리스너 등록
    container.addEventListener('click', () => {
      if (isFixed) {
        this.showCardsetSuggestModal(container);
      }
    });
    
    return container;
  }
  
  /**
   * 카드셋 서제스트 모달 표시
   * @param triggerElement 트리거 요소
   */
  private showCardsetSuggestModal(triggerElement: HTMLElement): void {
    // 이미 열려있는 모달 닫기
    this.closeCardsetSuggestModal();
    
    // 현재 설정 가져오기
    const settings = this.toolbarService.getSettings();
    const mode = settings.cardSetSourceMode || CardSetSourceMode.FOLDER;
    
    // 모달 컨테이너 생성
    const modalContainer = document.createElement('div');
    modalContainer.className = 'cardset-suggest-modal';
    
    // 모달 위치 설정
    const rect = triggerElement.getBoundingClientRect();
    modalContainer.style.top = `${rect.bottom}px`;
    modalContainer.style.left = `${rect.left}px`;
    modalContainer.style.width = `${Math.max(rect.width, 200)}px`;
    
    // 모달 내용 생성
    if (mode === CardSetSourceMode.FOLDER) {
      this.createFolderSuggestItems(modalContainer);
    } else {
      this.createTagSuggestItems(modalContainer);
    }
    
    // 문서에 모달 추가
    document.body.appendChild(modalContainer);
    
    // 문서 클릭 이벤트 리스너 등록
    setTimeout(() => {
      document.addEventListener('click', this.handleDocumentClickForModal);
    }, 0);
  }
  
  /**
   * 폴더 서제스트 아이템 생성
   * @param container 모달 컨테이너
   */
  private createFolderSuggestItems(container: HTMLElement): void {
    // 폴더 목록 가져오기
    const folders = this.toolbarService.getFolders();
    
    if (folders.length === 0) {
      const emptyItem = document.createElement('div');
      emptyItem.className = 'cardset-suggest-item';
      emptyItem.textContent = '폴더가 없습니다';
      container.appendChild(emptyItem);
      return;
    }
    
    // 폴더 아이템 생성
    folders.forEach(folder => {
      const item = document.createElement('div');
      item.className = 'cardset-suggest-item';
      
      const icon = document.createElement('span');
      icon.className = 'cardset-suggest-item-icon';
      setIcon(icon, 'folder');
      
      const text = document.createElement('span');
      text.className = 'cardset-suggest-item-text';
      text.textContent = folder;
      
      item.appendChild(icon);
      item.appendChild(text);
      
      // 클릭 이벤트 리스너 등록
      item.addEventListener('click', () => {
        this.selectFolder(folder).catch(error => {
          console.error('폴더 선택 중 오류 발생:', error);
        });
        this.closeCardsetSuggestModal();
      });
      
      container.appendChild(item);
    });
  }
  
  /**
   * 태그 서제스트 아이템 생성
   * @param container 모달 컨테이너
   */
  private createTagSuggestItems(container: HTMLElement): void {
    // 태그 목록 가져오기
    const tags = this.toolbarService.getTags();
    
    if (tags.length === 0) {
      const emptyItem = document.createElement('div');
      emptyItem.className = 'cardset-suggest-item';
      emptyItem.textContent = '태그가 없습니다';
      container.appendChild(emptyItem);
      return;
    }
    
    // 태그 아이템 생성
    tags.forEach(tag => {
      const item = document.createElement('div');
      item.className = 'cardset-suggest-item';
      
      const icon = document.createElement('span');
      icon.className = 'cardset-suggest-item-icon';
      setIcon(icon, 'tag');
      
      const text = document.createElement('span');
      text.className = 'cardset-suggest-item-text';
      text.textContent = tag;
      
      item.appendChild(icon);
      item.appendChild(text);
      
      // 클릭 이벤트 리스너 등록
      item.addEventListener('click', () => {
        this.selectTag(tag).catch(error => {
          console.error('태그 선택 중 오류 발생:', error);
        });
        this.closeCardsetSuggestModal();
      });
      
      container.appendChild(item);
    });
  }
  
  /**
   * 폴더 선택
   * @param folder 선택한 폴더
   */
  private async selectFolder(folder: string): Promise<void> {
    // 설정 업데이트
    await this.toolbarService.updateSettings({
      selectedFolder: folder
    });
    
    // 카드셋 이름 업데이트
    this.updateCardsetName();
    
    // 이벤트 발생
    this.toolbarService.emitEvent(EventType.CARDSET_SOURCE_CHANGED, {
      mode: CardSetSourceMode.FOLDER,
      isFixed: true,
      selectedFolder: folder
    });
  }
  
  /**
   * 태그 선택
   * @param tag 선택한 태그
   */
  private async selectTag(tag: string): Promise<void> {
    // 설정 업데이트
    await this.toolbarService.updateSettings({
      selectedTags: [tag]
    });
    
    // 카드셋 이름 업데이트
    this.updateCardsetName();
    
    // 이벤트 발생
    this.toolbarService.emitEvent(EventType.CARDSET_SOURCE_CHANGED, {
      mode: CardSetSourceMode.TAG,
      isFixed: true,
      selectedTags: [tag]
    });
  }
  
  /**
   * 카드셋 이름 업데이트
   */
  private updateCardsetName(): void {
    if (!this.element) return;
    
    const nameContainer = this.element.querySelector('[data-item-id="cardset-name"]');
    if (!nameContainer) return;
    
    const nameText = nameContainer.querySelector('.cardset-name-text');
    if (!nameText) return;
    
    // 현재 설정 가져오기
    const settings = this.toolbarService.getSettings();
    const isFixed = settings.isCardSetFixed;
    const mode = settings.cardSetSourceMode || CardSetSourceMode.FOLDER;
    
    // 카드셋 이름 설정
    let cardsetName = '활성 카드셋';
    
    if (isFixed) {
      if (mode === CardSetSourceMode.FOLDER) {
        cardsetName = settings.selectedFolder || '선택된 폴더 없음';
      } else {
        cardsetName = settings.selectedTags?.join(', ') || '선택된 태그 없음';
      }
    } else {
      if (mode === CardSetSourceMode.FOLDER) {
        // 활성 파일의 폴더 경로 가져오기
        const activeFile = this.obsidianService.getActiveFile();
        const folderPath = activeFile?.parent?.path || '';
        cardsetName = folderPath || '활성 폴더';
      } else {
        cardsetName = '활성 태그';
      }
    }
    
    nameText.textContent = cardsetName;
  }
  
  /**
   * 카드셋 서제스트 모달 닫기
   */
  private closeCardsetSuggestModal(): void {
    const modal = document.querySelector('.cardset-suggest-modal');
    if (modal && modal.parentNode) {
      modal.parentNode.removeChild(modal);
    }
    
    // 문서 클릭 이벤트 리스너 제거
    document.removeEventListener('click', this.handleDocumentClickForModal);
  }
  
  /**
   * 문서 클릭 이벤트 처리 (모달용)
   * @param event 클릭 이벤트
   */
  private handleDocumentClickForModal = (event: MouseEvent): void => {
    const target = event.target as HTMLElement;
    const modal = document.querySelector('.cardset-suggest-modal');
    
    if (modal && !modal.contains(target) && !target.closest('.cardset-name-container')) {
      this.closeCardsetSuggestModal();
    }
  };
  
  /**
   * 툴바 아이템 클릭 이벤트 처리
   * @param item 툴바 아이템
   * @param event 클릭 이벤트
   */
  private handleItemClick(item: IToolbarItem, event: MouseEvent): void {
    if (item.disabled) return;
    
    // 검색 토글 처리
    if (item.action === 'toggleSearch') {
      this.toggleSearchBar();
      return;
    }
    
    // 카드셋 소스 토글 처리
    if (item.action === 'toggleCardsetSource') {
      this.toggleCardsetSource().catch(error => {
        console.error('카드셋 소스 토글 중 오류 발생:', error);
      });
      return;
    }
    
    // 카드셋 고정 토글 처리
    if (item.action === 'toggleCardsetLock') {
      this.toggleCardsetLock().catch(error => {
        console.error('카드셋 고정 토글 중 오류 발생:', error);
      });
      return;
    }
    
    // 팝업 표시
    if (item.popupId) {
      const buttonElement = event.currentTarget as HTMLElement;
      const rect = buttonElement.getBoundingClientRect();
      
      // 팝업 위치 계산 - 버튼 중앙 아래에 표시
      const position = {
        x: rect.left + (rect.width / 2),
        y: rect.bottom
      };
      
      // 팝업 표시
      this.toolbarService.showPopup({
        id: item.popupId,
        type: item.popupId,
        position: position,
        content: '' // 내용은 PopupManager에서 생성
      });
      
      return;
    }
    
    // 액션 실행
    if (item.action) {
      this.toolbarService.executeItemAction(item.id);
    }
  }
  
  /**
   * 검색바 토글
   */
  private toggleSearchBar(): void {
    this.searchBarVisible = !this.searchBarVisible;
    
    if (this.searchBarVisible) {
      this.showSearchBar();
    } else {
      this.hideSearchBar();
    }
    
    // 검색 버튼 활성화 상태 업데이트
    const searchButton = this.element?.querySelector('[data-item-id="search-button"]');
    if (searchButton) {
      if (this.searchBarVisible) {
        searchButton.classList.add('active');
      } else {
        searchButton.classList.remove('active');
      }
    }
  }
  
  /**
   * 검색바 표시
   */
  private showSearchBar(): void {
    if (!this.element) return;
    
    // 이미 존재하는 검색바 제거
    this.hideSearchBar();
    
    // 검색바 컨테이너 생성
    const searchBarContainer = document.createElement('div');
    searchBarContainer.className = 'card-navigator-searchbar-container';
    
    // 검색 입력 필드 생성
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.className = 'card-navigator-searchbar-input';
    searchInput.placeholder = '검색어 입력...';
    
    // 검색 범위 선택 버튼 생성
    const searchScopeButton = document.createElement('button');
    searchScopeButton.className = 'card-navigator-searchbar-scope-button';
    searchScopeButton.title = '검색 범위';
    const scopeIcon = document.createElement('span');
    setIcon(scopeIcon, 'lucide-layers');
    searchScopeButton.appendChild(scopeIcon);
    
    // 대소문자 구분 버튼 생성
    const caseSensitiveButton = document.createElement('button');
    caseSensitiveButton.className = 'card-navigator-searchbar-case-button';
    caseSensitiveButton.title = '대소문자 구분';
    const caseIcon = document.createElement('span');
    setIcon(caseIcon, 'lucide-text-case-sensitive');
    caseSensitiveButton.appendChild(caseIcon);
    
    // 검색 버튼 생성
    const searchButton = document.createElement('button');
    searchButton.className = 'card-navigator-searchbar-search-button';
    searchButton.title = '검색';
    const searchIcon = document.createElement('span');
    setIcon(searchIcon, 'search');
    searchButton.appendChild(searchIcon);
    
    // 검색바에 요소 추가
    searchBarContainer.appendChild(searchInput);
    searchBarContainer.appendChild(searchScopeButton);
    searchBarContainer.appendChild(caseSensitiveButton);
    searchBarContainer.appendChild(searchButton);
    
    // 툴바 컨테이너에 검색바 추가
    this.element.appendChild(searchBarContainer);
    this.searchBarElement = searchBarContainer;
    
    // 이벤트 리스너 등록
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.performSearch(searchInput.value);
      }
    });
    
    searchButton.addEventListener('click', () => {
      this.performSearch(searchInput.value);
    });
    
    // 검색 범위 토글
    searchScopeButton.addEventListener('click', () => {
      const settings = this.toolbarService.getSettings();
      const newScope = settings.defaultSearchScope === 'all' ? 'current' : 'all';
      
      // 설정 업데이트
      this.toolbarService.updateSettings({
        defaultSearchScope: newScope
      }).catch(error => {
        console.error('검색 범위 설정 업데이트 중 오류 발생:', error);
      });
      
      // 아이콘 업데이트
      if (newScope === 'all') {
        setIcon(scopeIcon, 'lucide-layers');
        searchScopeButton.title = '검색 범위: 전체';
      } else {
        setIcon(scopeIcon, 'lucide-layer-group');
        searchScopeButton.title = '검색 범위: 현재 카드셋';
      }
    });
    
    // 대소문자 구분 토글
    caseSensitiveButton.addEventListener('click', () => {
      const settings = this.toolbarService.getSettings();
      const newValue = !settings.searchCaseSensitive;
      
      // 설정 업데이트
      this.toolbarService.updateSettings({
        searchCaseSensitive: newValue
      }).catch(error => {
        console.error('대소문자 구분 설정 업데이트 중 오류 발생:', error);
      });
      
      // 버튼 스타일 업데이트
      if (newValue) {
        caseSensitiveButton.classList.add('active');
      } else {
        caseSensitiveButton.classList.remove('active');
      }
    });
    
    // 초기 상태 설정
    const settings = this.toolbarService.getSettings();
    if (settings.searchCaseSensitive) {
      caseSensitiveButton.classList.add('active');
    }
    
    if (settings.defaultSearchScope === 'current') {
      setIcon(scopeIcon, 'lucide-layer-group');
      searchScopeButton.title = '검색 범위: 현재 카드셋';
    } else {
      setIcon(scopeIcon, 'lucide-layers');
      searchScopeButton.title = '검색 범위: 전체';
    }
    
    // 포커스 설정
    setTimeout(() => {
      searchInput.focus();
    }, 0);
  }
  
  /**
   * 검색바 숨기기
   */
  private hideSearchBar(): void {
    if (this.searchBarElement && this.element) {
      this.element.removeChild(this.searchBarElement);
      this.searchBarElement = null;
    }
  }
  
  /**
   * 검색 실행
   * @param query 검색어
   */
  private performSearch(query: string): void {
    if (!query.trim()) return;
    
    const settings = this.toolbarService.getSettings();
    
    // 검색 이벤트 발생
    this.toolbarService.executeSearch({
      query: query,
      caseSensitive: settings.searchCaseSensitive || false,
      scope: settings.defaultSearchScope || 'all'
    });
  }
  
  /**
   * 카드셋 소스 토글
   */
  private async toggleCardsetSource(): Promise<void> {
    const settings = this.toolbarService.getSettings();
    const currentMode = settings.cardSetSourceMode || CardSetSourceMode.FOLDER;
    const newMode = currentMode === CardSetSourceMode.FOLDER ? CardSetSourceMode.TAG : CardSetSourceMode.FOLDER;
    
    // 설정 업데이트
    await this.toolbarService.updateSettings({
      cardSetSourceMode: newMode
    });
    
    // 아이콘 업데이트
    const sourceButton = this.element?.querySelector('[data-item-id="cardset-source-selector"]');
    if (sourceButton) {
      const iconContainer = sourceButton.querySelector('.toolbar-button-icon');
      if (iconContainer) {
        if (newMode === CardSetSourceMode.FOLDER) {
          setIcon(iconContainer as HTMLElement, 'folder');
          
          // 하위 폴더 포함 아이콘 추가
          this.addOrUpdateOptionIcon(sourceButton as HTMLElement, 'includeSubfolders', settings.includeSubfolders, 'folder-tree');
        } else {
          setIcon(iconContainer as HTMLElement, 'tag');
          
          // 대소문자 구분 아이콘 추가
          this.addOrUpdateOptionIcon(sourceButton as HTMLElement, 'tagCaseSensitive', settings.tagCaseSensitive, 'case-sensitive');
        }
      }
    }
  }
  
  /**
   * 카드셋 고정 토글
   */
  private async toggleCardsetLock(): Promise<void> {
    const settings = this.toolbarService.getSettings();
    const isFixed = !settings.isCardSetFixed;
    
    // 설정 업데이트
    await this.toolbarService.updateSettings({
      isCardSetFixed: isFixed
    });
    
    // 아이콘 업데이트
    const lockButton = this.element?.querySelector('[data-item-id="cardset-lock"]');
    if (lockButton) {
      const iconContainer = lockButton.querySelector('.toolbar-button-icon');
      if (iconContainer) {
        if (isFixed) {
          setIcon(iconContainer as HTMLElement, 'lucide-lock');
        } else {
          setIcon(iconContainer as HTMLElement, 'lucide-unlock');
        }
      }
    }
    
    // 이벤트 발생
    this.toolbarService.emitEvent(EventType.CARDSET_FIXED_CHANGED, { isFixed });
  }
  
  /**
   * 이벤트 리스너 초기화
   */
  private initializeEventListeners(): void {
    // 아이템 등록 이벤트
    this.itemRegisteredListener = () => {
      this.loadItems();
      this.update();
    };
    
    // 아이템 업데이트 이벤트
    this.itemUpdatedListener = () => {
      this.loadItems();
      this.update();
    };
    
    // 아이템 제거 이벤트
    this.itemRemovedListener = () => {
      this.loadItems();
      this.update();
    };
    
    // 아이템 값 변경 이벤트
    this.itemValueChangedListener = () => {
      this.loadItems();
      this.update();
    };
    
    // 아이템 비활성화 변경 이벤트
    this.itemDisabledChangedListener = () => {
      this.loadItems();
      this.update();
    };
    
    // 아이템 표시 변경 이벤트
    this.itemVisibleChangedListener = () => {
      this.loadItems();
      this.update();
    };
    
    // 설정 변경 이벤트
    this.toolbarService.on(EventType.SETTINGS_CHANGED, () => {
      this.updateCardsetSourceIcon();
      this.updateCardsetLockIcon();
      this.updateCardsetName();
    });
    
    // 카드셋 소스 변경 이벤트
    this.toolbarService.on(EventType.CARDSET_SOURCE_CHANGED, () => {
      this.updateCardsetSourceIcon();
      this.updateCardsetName();
    });
    
    // 하위 폴더 포함 변경 이벤트
    this.toolbarService.on(EventType.INCLUDE_SUBFOLDERS_CHANGED, () => {
      this.updateCardsetSourceIcon();
    });
    
    // 태그 대소문자 구분 변경 이벤트
    this.toolbarService.on(EventType.TAG_CASE_SENSITIVE_CHANGED, () => {
      this.updateCardsetSourceIcon();
    });
    
    // 카드셋 변경 이벤트
    this.toolbarService.on(EventType.CARDSET_CHANGED, () => {
      this.updateCardsetName();
    });
    
    // 활성 파일 변경 이벤트
    this.toolbarService.on(EventType.ACTIVE_LEAF_CHANGED, () => {
      this.updateCardsetName();
    });
    
    // 이벤트 리스너 등록
    this.toolbarService.on('toolbar:item-registered', this.itemRegisteredListener);
    this.toolbarService.on('toolbar:item-updated', this.itemUpdatedListener);
    this.toolbarService.on('toolbar:item-removed', this.itemRemovedListener);
    this.toolbarService.on('toolbar:item-value-changed', this.itemValueChangedListener);
    this.toolbarService.on('toolbar:item-disabled-changed', this.itemDisabledChangedListener);
    this.toolbarService.on('toolbar:item-visible-changed', this.itemVisibleChangedListener);
  }
  
  /**
   * 카드셋 소스 아이콘 업데이트
   */
  private updateCardsetSourceIcon(): void {
    if (!this.element) return;
    
    const sourceButton = this.element.querySelector('[data-item-id="cardset-source-selector"]');
    if (!sourceButton) return;
    
    const iconContainer = sourceButton.querySelector('.toolbar-button-icon');
    if (!iconContainer) return;
    
    // 현재 설정 가져오기
    const settings = this.toolbarService.getSettings();
    const mode = settings.cardSetSourceMode || CardSetSourceMode.FOLDER;
    
    // 아이콘 업데이트
    if (mode === CardSetSourceMode.FOLDER) {
      setIcon(iconContainer as HTMLElement, 'folder');
      
      // 하위 폴더 포함 아이콘 추가
      this.addOrUpdateOptionIcon(sourceButton as HTMLElement, 'includeSubfolders', settings.includeSubfolders, 'folder-tree');
    } else {
      setIcon(iconContainer as HTMLElement, 'tag');
      
      // 대소문자 구분 아이콘 추가
      this.addOrUpdateOptionIcon(sourceButton as HTMLElement, 'tagCaseSensitive', settings.tagCaseSensitive, 'case-sensitive');
    }
  }
  
  /**
   * 옵션 아이콘 추가 또는 업데이트
   * @param parentElement 부모 요소
   * @param optionId 옵션 ID
   * @param isEnabled 활성화 여부
   * @param iconName 아이콘 이름
   */
  private addOrUpdateOptionIcon(parentElement: HTMLElement, optionId: string, isEnabled: boolean, iconName: string): void {
    // 기존 옵션 아이콘 찾기
    let optionIcon = parentElement.querySelector(`.option-icon-${optionId}`);
    
    // 없으면 새로 생성
    if (!optionIcon) {
      optionIcon = document.createElement('div');
      optionIcon.className = `option-icon option-icon-${optionId}`;
      optionIcon.setAttribute('aria-label', optionId === 'includeSubfolders' ? '하위 폴더 포함' : '대소문자 구분');
      
      // 스타일 설정
      optionIcon.setAttribute('style', `
        position: absolute;
        bottom: 0;
        right: 0;
        width: 12px;
        height: 12px;
        font-size: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        background-color: ${isEnabled ? 'var(--interactive-accent)' : 'var(--background-modifier-border)'};
        color: ${isEnabled ? 'var(--text-on-accent)' : 'var(--text-muted)'};
        opacity: ${isEnabled ? 1 : 0.7};
      `);
      
      // 아이콘 설정
      setIcon(optionIcon as HTMLElement, iconName);
      
      // 부모 요소에 추가
      parentElement.style.position = 'relative';
      parentElement.appendChild(optionIcon);
    } else {
      // 기존 아이콘 업데이트
      optionIcon.setAttribute('style', `
        position: absolute;
        bottom: 0;
        right: 0;
        width: 12px;
        height: 12px;
        font-size: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        background-color: ${isEnabled ? 'var(--interactive-accent)' : 'var(--background-modifier-border)'};
        color: ${isEnabled ? 'var(--text-on-accent)' : 'var(--text-muted)'};
        opacity: ${isEnabled ? 1 : 0.7};
      `);
    }
  }
  
  /**
   * 카드셋 고정 아이콘 업데이트
   */
  private updateCardsetLockIcon(): void {
    if (!this.element) return;
    
    const lockButton = this.element.querySelector('[data-item-id="cardset-lock"]');
    if (!lockButton) return;
    
    const iconContainer = lockButton.querySelector('.toolbar-button-icon');
    if (!iconContainer) return;
    
    // 현재 설정 가져오기
    const settings = this.toolbarService.getSettings();
    const isFixed = settings.isCardSetFixed;
    
    // 아이콘 업데이트
    if (isFixed) {
      setIcon(iconContainer as HTMLElement, 'lucide-lock');
    } else {
      setIcon(iconContainer as HTMLElement, 'lucide-unlock');
    }
  }
  
  /**
   * 컴포넌트 업데이트
   */
  async update(): Promise<void> {
    if (!this.element) return;
    
    const toolbarElement = this.element.querySelector('.card-navigator-toolbar');
    if (!toolbarElement) return;
    
    // 기존 섹션 요소 가져오기
    const leftSection = toolbarElement.querySelector('.toolbar-section.left') as HTMLElement;
    const centerSection = toolbarElement.querySelector('.toolbar-section.center') as HTMLElement;
    const rightSection = toolbarElement.querySelector('.toolbar-section.right') as HTMLElement;
    
    if (!leftSection || !centerSection || !rightSection) return;
    
    // 기존 아이템 제거
    leftSection.innerHTML = '';
    centerSection.innerHTML = '';
    rightSection.innerHTML = '';
    
    // 아이템 다시 렌더링
    this.renderItems(leftSection, centerSection, rightSection);
  }
  
  /**
   * 컴포넌트 정리
   */
  cleanup(): void {
    // 이벤트 리스너 제거
    this.removeEventListeners();
    
    // 컴포넌트 제거
    this.remove();
  }
} 