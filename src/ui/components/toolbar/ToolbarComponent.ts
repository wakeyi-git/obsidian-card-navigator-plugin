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
import { FolderSuggestModal } from '../modals/FolderSuggestModal';
import { TagSuggestModal } from '../modals/TagSuggestModal';
import { ICardSetService } from '../../../application/cardset/CardSetService';
import { DomainEventBus } from '../../../core/events/DomainEventBus';

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
  private cardSetService: ICardSetService;
  private eventBus: DomainEventBus;
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
  private itemActionExecutedListener: (data: any) => void = () => {};
  private cardsetChangedListener: (data: any) => void = () => {};
  private activeFileChangedListener: (data: any) => void = () => {};

  /**
   * 생성자
   * @param toolbarService 툴바 서비스
   * @param searchComponent 검색 컴포넌트
   * @param obsidianService Obsidian 서비스
   * @param cardSetService 카드셋 서비스
   */
  constructor(
    toolbarService: IToolbarService,
    searchComponent: ISearchComponent,
    obsidianService: ObsidianService,
    cardSetService: ICardSetService
  ) {
    super();
    this.toolbarService = toolbarService;
    this.searchComponent = searchComponent;
    this.obsidianService = obsidianService;
    this.cardSetService = cardSetService;
    this.eventBus = DomainEventBus.getInstance();
    
    // 현재 설정 가져오기 및 로그 출력
    const settings = this.toolbarService.getSettings();
    console.log('ToolbarComponent 생성자 - 현재 카드셋 소스 모드:', settings.cardSetSourceMode);
    console.log('ToolbarComponent 생성자 - 설정 정보:', {
      cardSetSourceMode: settings.cardSetSourceMode,
      includeSubfolders: settings.includeSubfolders,
      isCardSetFixed: settings.isCardSetFixed
    });
    
    // cardSetSourceMode가 undefined인 경우 FOLDER로 설정
    if (settings.cardSetSourceMode === undefined || settings.cardSetSourceMode === null) {
      console.log('생성자: 카드셋 소스 모드가 undefined/null이므로 FOLDER로 설정');
      this.toolbarService.updateSettings({
        cardSetSourceMode: CardSetSourceMode.FOLDER
      }).catch(error => {
        console.error('생성자: 카드셋 소스 모드 설정 업데이트 중 오류 발생:', error);
      });
    }
    
    // 툴바 아이템 초기화
    this.initializeToolbarItems();
    
    // 이벤트 리스너 등록
    this.registerToolbarEventListeners();
  }
  
  /**
   * 이벤트 리스너 등록
   */
  private registerToolbarEventListeners(): void {
    // 툴바 아이템 등록 이벤트 리스너
    this.itemRegisteredListener = (item: IToolbarItem) => {
      this.addItem(item);
    };
    this.toolbarService.on('toolbar:item-registered', this.itemRegisteredListener);
    
    // 툴바 아이템 업데이트 이벤트 리스너
    this.itemUpdatedListener = (data: { id: string, updates: Partial<IToolbarItem> }) => {
      this.updateItem(data.id, data.updates);
    };
    this.toolbarService.on('toolbar:item-updated', this.itemUpdatedListener);
    
    // 툴바 아이템 제거 이벤트 리스너
    this.itemRemovedListener = (id: string) => {
      this.removeItem(id);
    };
    this.toolbarService.on('toolbar:item-removed', this.itemRemovedListener);
    
    // 툴바 액션 실행 이벤트 리스너
    this.itemActionExecutedListener = (data: { action: string, data?: any }) => {
      this.handleToolbarAction(data.action, data.data);
    };
    this.toolbarService.on('toolbar:action-executed', this.itemActionExecutedListener);
    
    // 카드셋 변경 이벤트 리스너
    this.cardsetChangedListener = () => {
      console.log('카드셋 변경 이벤트 수신: 카드셋 이름 업데이트');
      this.updateCardsetName().catch(error => {
        console.error('카드셋 변경 이벤트 처리 중 오류 발생:', error);
      });
    };
    this.eventBus.on(EventType.CARDSET_CHANGED, this.cardsetChangedListener);
    
    // 활성 파일 변경 이벤트 리스너
    this.activeFileChangedListener = () => {
      console.log('활성 파일 변경 이벤트 수신: 카드셋 이름 업데이트 검토');
      const settings = this.toolbarService.getSettings();
      if (settings.cardSetSourceMode === CardSetSourceMode.FOLDER && !settings.isCardSetFixed) {
        this.updateCardsetName().catch(error => {
          console.error('활성 파일 변경 이벤트 처리 중 오류 발생:', error);
        });
      }
    };
    this.eventBus.on(EventType.ACTIVE_FILE_CHANGED, this.activeFileChangedListener);
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
   * 기본 툴바 아이템 초기화
   */
  private initializeToolbarItems(): void {
    // 현재 설정 가져오기
    const settings = this.toolbarService.getSettings();
    console.log('initializeToolbarItems - 현재 설정:', {
      cardSetSourceMode: settings.cardSetSourceMode,
      includeSubfolders: settings.includeSubfolders,
      isCardSetFixed: settings.isCardSetFixed,
      toolbarItems: settings.toolbarItems?.length || 0
    });
    
    // 이미 등록된 아이템 가져오기
    const existingItems = this.toolbarService.getItems();
    console.log('initializeToolbarItems - 기존 아이템 수:', existingItems.length);
    
    // 카드셋 소스 모드 - undefined인 경우 강제로 FOLDER로 설정
    let mode = settings.cardSetSourceMode;
    if (mode === undefined || mode === null) {
      console.log('카드셋 소스 모드가 undefined/null이므로 FOLDER로 강제 설정');
      mode = CardSetSourceMode.FOLDER;
      
      // 설정에도 반영 (비동기 호출이므로 await 없이 호출)
      this.toolbarService.updateSettings({
        cardSetSourceMode: CardSetSourceMode.FOLDER
      }).catch(error => {
        console.error('카드셋 소스 모드 설정 업데이트 중 오류 발생:', error);
      });
    }
    
    console.log('현재 카드셋 소스 모드:', mode, '(타입:', typeof mode, ')');
    console.log('CardSetSourceMode.FOLDER 값:', CardSetSourceMode.FOLDER, '(타입:', typeof CardSetSourceMode.FOLDER, ')');
    console.log('모드 비교 결과:', mode === CardSetSourceMode.FOLDER ? '일치함' : '일치하지 않음');
    
    // 이미 아이템이 등록되어 있는 경우 하위 폴더 포함 버튼만 확인
    if (existingItems.length > 0) {
      console.log('이미 툴바 아이템이 등록되어 있어 초기화 생략');
      this.items = existingItems;
      
      // 하위 폴더 포함 버튼이 없고 폴더 모드인 경우 추가
      const hasSubfolderButton = existingItems.some(item => item.id === 'include-subfolders');
      if (!hasSubfolderButton && mode !== CardSetSourceMode.TAG) {
        console.log('기존 아이템에 하위 폴더 포함 버튼이 없어 추가합니다.');
        
        // 현재 하위 폴더 포함 상태 가져오기
        const includeSubfolders = this.cardSetService.getIncludeSubfolders();
        console.log('하위 폴더 포함 상태:', includeSubfolders);
        
        this.addItem({
          id: 'include-subfolders',
          type: 'button',
          position: 'left',
          icon: 'folder-tree',
          tooltip: '하위 폴더 포함',
          action: 'toggleIncludeSubfolders',
          order: 1,
          visible: true,
          classes: includeSubfolders ? ['is-active'] : []
        });
        
        console.log('하위 폴더 포함 버튼 추가 완료, 초기 상태:', includeSubfolders ? '활성화' : '비활성화');
      }
      return;
    }
    
    console.log('툴바 아이템 초기화 시작');
    
    // 카드셋 소스 선택기 버튼 (왼쪽)
    this.addItem({
      id: 'cardset-source-selector',
      type: 'button',
      position: 'left',
      icon: mode === CardSetSourceMode.FOLDER ? 'folder-open' : 'tag',
      tooltip: '카드셋 소스 선택',
      action: 'toggleCardsetSource',
      order: 0
    });
    
    // 하위 폴더 포함 버튼 (왼쪽) - 폴더 모드일 때만 표시
    if (mode !== CardSetSourceMode.TAG) {
      console.log('폴더 모드 감지: 하위 폴더 포함 버튼 추가 시도');
      
      // 현재 하위 폴더 포함 상태 가져오기 (CardSetService 사용)
      const includeSubfolders = this.cardSetService.getIncludeSubfolders();
      console.log('initializeToolbarItems: 하위 폴더 포함 상태:', includeSubfolders);
      
      const includeSubfoldersItem: IToolbarItem = {
        id: 'include-subfolders',
        type: 'button',
        position: 'left',
        icon: 'folder-tree',
        tooltip: '하위 폴더 포함',
        action: 'toggleIncludeSubfolders',
        order: 1,
        visible: true,
        // 초기 상태에 따라 클래스 추가
        classes: includeSubfolders ? ['is-active'] : []
      };
      console.log('하위 폴더 포함 버튼 생성:', includeSubfoldersItem);
      this.addItem(includeSubfoldersItem);
      console.log('하위 폴더 포함 버튼 초기화:', includeSubfolders ? '활성화' : '비활성화');
    } else {
      console.log('폴더 모드가 아니므로 하위 폴더 포함 버튼 추가하지 않음');
    }
    
    // 카드셋 이름 (중앙)
    this.addItem({
      id: 'cardset-name',
      type: 'select',
      position: 'center',
      tooltip: '카드셋 이름',
      action: 'selectCardset',
      order: 0
    });
    
    // 카드셋 고정 버튼 (중앙)
    this.addItem({
      id: 'cardset-lock',
      type: 'button',
      position: 'center',
      icon: settings.isCardSetFixed ? 'lucide-lock' : 'lucide-unlock',
      tooltip: '카드셋 고정',
      action: 'toggleCardsetLock',
      order: 1
    });
    
    // 검색 버튼 (오른쪽)
    this.addItem({
      id: 'search-button',
      type: 'button',
      position: 'right',
      icon: 'search',
      tooltip: '검색',
      action: 'toggleSearch',
      order: 0
    });
    
    // 정렬 버튼 (오른쪽)
    this.addItem({
      id: 'sort-button',
      type: 'button',
      position: 'right',
      icon: 'arrow-up-down',
      tooltip: '정렬 옵션',
      action: 'showSortOptions',
      order: 1
    });
    
    // 설정 버튼 (오른쪽)
    this.addItem({
      id: 'settings-button',
      type: 'button',
      position: 'right',
      icon: 'settings',
      tooltip: '설정',
      action: 'showSettings',
      order: 2
    });
    
    console.log('툴바 아이템 초기화 완료');
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
    // 버튼 대신 div 요소 사용 (옵시디언 스타일)
    const button = document.createElement('div');
    button.className = 'toolbar-button clickable-icon';
    button.setAttribute('data-item-id', item.id);
    
    if (item.tooltip) {
      button.setAttribute('aria-label', item.tooltip);
      button.setAttribute('title', item.tooltip);
    }
    
    if (item.icon) {
      setIcon(button, item.icon);
    }
    
    // 비활성화 상태 설정
    if (item.disabled) {
      button.classList.add('disabled');
    }
    
    // 추가 클래스 설정
    if (item.classes && Array.isArray(item.classes)) {
      console.log(`버튼 ${item.id} 클래스 추가 전:`, button.className);
      item.classes.forEach(className => {
        button.classList.add(className);
        console.log(`버튼 ${item.id}에 클래스 '${className}' 추가`);
      });
      console.log(`버튼 ${item.id} 클래스 추가 후:`, button.className);
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
    
    // 폴더 아이콘 추가
    const iconElement = document.createElement('div');
    iconElement.className = 'cardset-name-icon';
    setIcon(iconElement, 'folder-open');
    container.appendChild(iconElement);
    
    // 카드셋 이름 텍스트
    const nameText = document.createElement('span');
    nameText.className = 'cardset-name-text';
    
    // 현재 설정 가져오기
    const settings = this.toolbarService.getSettings();
    const isFixed = settings.isCardSetFixed;
    const mode = settings.cardSetSourceMode || CardSetSourceMode.FOLDER;
    
    // 카드셋 이름 설정
    let cardsetName = '';
    
    if (mode === CardSetSourceMode.FOLDER) {
      if (isFixed) {
        // 지정 폴더 모드
        cardsetName = settings.selectedFolder || '선택된 폴더 없음';
        console.log('지정 폴더 모드에서 이름 설정:', cardsetName);
      } else {
        // 활성 폴더 모드
        const activeFile = this.obsidianService.getActiveFile();
        const folderPath = activeFile?.parent?.path || '';
        cardsetName = folderPath || '활성 폴더';
        console.log('활성 폴더 모드에서 이름 설정:', cardsetName, '활성 파일:', activeFile?.path);
      }
    } else {
      // 태그 모드
      if (isFixed) {
        cardsetName = settings.selectedTags?.join(', ') || '선택된 태그 없음';
        console.log('지정 태그 모드에서 이름 설정:', cardsetName);
      } else {
        cardsetName = '활성 태그';
        console.log('활성 태그 모드에서 이름 설정:', cardsetName);
      }
    }
    
    nameText.textContent = cardsetName;
    container.appendChild(nameText);
    
    // 클릭 이벤트 리스너 등록 - 모든 경우에 폴더 선택 모달 표시
    container.addEventListener('click', () => {
      if (mode === CardSetSourceMode.FOLDER) {
        // 폴더 서제스트 모달 표시
        this.showFolderSuggestModal();
      } else {
        // 태그 서제스트 모달 표시
        this.showTagSuggestModal();
      }
    });
    
    return container;
  }
  
  /**
   * 폴더 서제스트 모달 표시
   */
  private showFolderSuggestModal(): void {
    // 옵시디언 API를 사용하여 폴더 서제스트 모달 생성
    const modal = new FolderSuggestModal(
      this.obsidianService,
      async (folderPath: string) => {
        // 폴더 선택 시 처리
        await this.selectFolder(folderPath);
      }
    );
    
    // 모달 표시
    modal.open();
  }
  
  /**
   * 태그 서제스트 모달 표시
   */
  private showTagSuggestModal(): void {
    // 옵시디언 API를 사용하여 태그 서제스트 모달 생성
    const modal = new TagSuggestModal(
      this.obsidianService,
      async (tag: string) => {
        // 태그 선택 시 처리
        await this.selectTag(tag);
      }
    );
    
    // 모달 표시
    modal.open();
  }
  
  /**
   * 폴더 선택
   * @param folder 선택한 폴더
   */
  private async selectFolder(folder: string): Promise<void> {
    console.log('폴더 선택됨:', folder);
    
    try {
      // 카드셋 서비스를 통해 폴더 모드로 설정
      await this.cardSetService.setCardSetSourceMode(CardSetSourceMode.FOLDER);
      
      // 카드셋 고정 모드로 설정
      await this.cardSetService.setCardSetFixed(true);
      
      // 설정 업데이트 - 선택한 폴더 저장
      await this.toolbarService.updateSettings({
        selectedFolder: folder
      });
      
      // 카드셋 선택 (중요: 이 메서드가 카드셋을 실제로 변경함)
      await this.cardSetService.selectCardSet(folder, true);
      
      // 자물쇠 아이콘 업데이트
      this.updateLockIcon(true);
      
      // 카드셋 이름 업데이트
      await this.updateCardsetName();
      
      console.log('폴더 선택 완료:', folder);
    } catch (error) {
      console.error('폴더 선택 중 오류 발생:', error);
    }
  }
  
  /**
   * 태그 선택
   * @param tag 선택한 태그
   */
  private async selectTag(tag: string): Promise<void> {
    console.log('태그 선택됨:', tag);
    
    try {
      // 카드셋 서비스를 통해 태그 모드로 설정
      await this.cardSetService.setCardSetSourceMode(CardSetSourceMode.TAG);
      
      // 카드셋 고정 모드로 설정
      await this.cardSetService.setCardSetFixed(true);
      
      // 설정 업데이트 - 선택한 태그 저장
      await this.toolbarService.updateSettings({
        selectedTags: [tag]
      });
      
      // 카드셋 선택 (중요: 이 메서드가 카드셋을 실제로 변경함)
      await this.cardSetService.selectCardSet(tag, true);
      
      // 카드셋 이름 업데이트
      await this.updateCardsetName();
      
      console.log('태그 선택 완료:', tag);
    } catch (error) {
      console.error('태그 선택 중 오류 발생:', error);
    }
  }
  
  /**
   * 카드셋 이름 업데이트
   */
  public async updateCardsetName(): Promise<void> {
    if (!this.element) {
      console.log('카드셋 이름 업데이트 실패: 컴포넌트 요소가 없음');
      return;
    }
    
    const nameContainer = this.element.querySelector('[data-item-id="cardset-name"]');
    if (!nameContainer) {
      console.log('카드셋 이름 업데이트 실패: 카드셋 이름 컨테이너를 찾을 수 없음');
      return;
    }
    
    const nameText = nameContainer.querySelector('.cardset-name-text');
    if (!nameText) {
      console.log('카드셋 이름 업데이트 실패: 카드셋 이름 텍스트 요소를 찾을 수 없음');
      return;
    }
    
    // 현재 설정 가져오기
    const settings = this.toolbarService.getSettings();
    const isFixed = settings.isCardSetFixed;
    const mode = settings.cardSetSourceMode || CardSetSourceMode.FOLDER;
    
    console.log('카드셋 이름 업데이트 시작', {
      isFixed,
      mode,
      selectedFolder: settings.selectedFolder,
      selectedTags: settings.selectedTags
    });
    
    // 카드셋 이름 설정
    let cardsetName = '';
    let cardsetSource = '';
    
    try {
      // 현재 카드셋 가져오기
      const currentCardSet = await this.cardSetService.getCurrentCardSet();
      console.log('현재 카드셋 정보:', currentCardSet ? {
        id: currentCardSet.id,
        name: currentCardSet.name,
        source: currentCardSet.source,
        sourceType: currentCardSet.sourceType,
        type: currentCardSet.type,
        filesCount: currentCardSet.files?.length || 0
      } : '없음');
      
      // 카드셋 소스가 있으면 해당 값 사용
      if (currentCardSet && currentCardSet.source) {
        cardsetSource = currentCardSet.source;
        cardsetName = cardsetSource;
        console.log('카드셋 소스에서 이름 설정:', cardsetName);
      } else {
        // 기존 방식으로 폴백
        if (mode === CardSetSourceMode.FOLDER) {
          if (isFixed) {
            // 지정 폴더 모드
            cardsetName = settings.selectedFolder || '선택된 폴더 없음';
            console.log('지정 폴더 모드에서 이름 설정:', cardsetName);
          } else {
            // 활성 폴더 모드
            const activeFile = this.obsidianService.getActiveFile();
            const folderPath = activeFile?.parent?.path || '';
            cardsetName = folderPath || '활성 폴더';
            console.log('활성 폴더 모드에서 이름 설정:', cardsetName, '활성 파일:', activeFile?.path);
          }
        } else {
          // 태그 모드
          if (isFixed) {
            cardsetName = settings.selectedTags?.join(', ') || '선택된 태그 없음';
            console.log('지정 태그 모드에서 이름 설정:', cardsetName);
          } else {
            cardsetName = '활성 태그';
            console.log('활성 태그 모드에서 이름 설정:', cardsetName);
          }
        }
      }
    } catch (error) {
      console.error('카드셋 가져오기 오류:', error);
      
      // 오류 발생 시 기존 방식으로 폴백
      if (mode === CardSetSourceMode.FOLDER) {
        if (isFixed) {
          cardsetName = settings.selectedFolder || '선택된 폴더 없음';
          console.log('오류 발생 후 지정 폴더 모드에서 이름 설정:', cardsetName);
        } else {
          const activeFile = this.obsidianService.getActiveFile();
          const folderPath = activeFile?.parent?.path || '';
          cardsetName = folderPath || '활성 폴더';
          console.log('오류 발생 후 활성 폴더 모드에서 이름 설정:', cardsetName);
        }
      } else {
        if (isFixed) {
          cardsetName = settings.selectedTags?.join(', ') || '선택된 태그 없음';
          console.log('오류 발생 후 지정 태그 모드에서 이름 설정:', cardsetName);
        } else {
          cardsetName = '활성 태그';
          console.log('오류 발생 후 활성 태그 모드에서 이름 설정:', cardsetName);
        }
      }
    }
    
    // 이전 이름과 다른 경우에만 업데이트
    if (nameText.textContent !== cardsetName) {
      console.log('카드셋 이름 변경:', nameText.textContent, '->', cardsetName);
      nameText.textContent = cardsetName;
    } else {
      console.log('카드셋 이름 변경 없음:', cardsetName);
    }
  }
  
  /**
   * 자물쇠 아이콘 업데이트
   * @param isLocked 잠금 여부
   */
  private updateLockIcon(isLocked: boolean): void {
    const lockButton = this.element?.querySelector('[data-item-id="cardset-lock"]');
    if (lockButton) {
      // 클리커블 아이콘 방식으로 아이콘 업데이트
      setIcon(lockButton as HTMLElement, isLocked ? 'lucide-lock' : 'lucide-unlock');
      console.log('자물쇠 아이콘 업데이트:', isLocked ? 'lucide-lock' : 'lucide-unlock');
    } else {
      console.log('자물쇠 버튼을 찾을 수 없음');
    }
  }
  
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
    // 카드셋 서비스에서 현재 모드 가져오기
    const currentMode = this.cardSetService.getCardSetSourceMode();
    console.log('toggleCardsetSource - 현재 모드:', currentMode);
    
    // 새 모드 계산
    const newMode = currentMode === CardSetSourceMode.FOLDER ? CardSetSourceMode.TAG : CardSetSourceMode.FOLDER;
    console.log('toggleCardsetSource - 새 모드:', newMode);
    
    // 카드셋 서비스를 통해 모드 변경
    await this.cardSetService.setCardSetSourceMode(newMode);
    console.log('toggleCardsetSource - 모드 변경 완료');
    
    // 아이콘 업데이트
    const sourceButton = this.element?.querySelector('[data-item-id="cardset-source-selector"]');
    if (sourceButton) {
      // 클리커블 아이콘 방식으로 아이콘 업데이트
      setIcon(sourceButton as HTMLElement, newMode === CardSetSourceMode.FOLDER ? 'folder-open' : 'tag');
      console.log('소스 아이콘 업데이트:', newMode === CardSetSourceMode.FOLDER ? 'folder-open' : 'tag');
    }
    
    // 하위 폴더 포함 버튼 처리
    let includeSubfoldersButton = this.element?.querySelector('[data-item-id="include-subfolders"]');
    
    if (newMode === CardSetSourceMode.FOLDER) {
      // 폴더 모드로 변경된 경우
      if (includeSubfoldersButton) {
        // 버튼이 있으면 표시
        console.log('폴더 모드로 변경: 하위 폴더 포함 버튼 표시');
        includeSubfoldersButton.classList.remove('hidden');
        
        // 하위 폴더 포함 아이콘 상태 초기화
        const includeSubfolders = this.cardSetService.getIncludeSubfolders();
        if (includeSubfolders) {
          includeSubfoldersButton.classList.add('is-active');
        } else {
          includeSubfoldersButton.classList.remove('is-active');
        }
        
        console.log('하위 폴더 포함 아이콘 상태 설정:', includeSubfolders ? '활성화' : '비활성화');
      } else {
        // 버튼이 없으면 새로 추가
        console.log('폴더 모드로 변경: 하위 폴더 포함 버튼 새로 추가');
        
        // 현재 하위 폴더 포함 상태 가져오기
        const includeSubfolders = this.cardSetService.getIncludeSubfolders();
        console.log('현재 하위 폴더 포함 상태:', includeSubfolders);
        
        this.addItem({
          id: 'include-subfolders',
          type: 'button',
          position: 'left',
          icon: 'folder-tree',
          tooltip: '하위 폴더 포함',
          action: 'toggleIncludeSubfolders',
          order: 1,
          visible: true,
          classes: includeSubfolders ? ['is-active'] : []
        });
        
        // 툴바 다시 렌더링
        this.render();
        
        console.log('하위 폴더 포함 버튼 추가 완료, 초기 상태:', includeSubfolders ? '활성화' : '비활성화');
      }
    } else if (includeSubfoldersButton) {
      // 태그 모드로 변경된 경우 버튼 숨김
      console.log('태그 모드로 변경: 하위 폴더 포함 버튼 숨김');
      includeSubfoldersButton.classList.add('hidden');
    }
    
    // 카드셋 이름 업데이트
    this.updateCardsetName().catch(error => {
      console.error('카드셋 이름 업데이트 중 오류 발생:', error);
    });
  }
  
  /**
   * 카드셋 고정 토글
   */
  private async toggleCardsetLock(): Promise<void> {
    // 카드셋 서비스에서 현재 고정 상태 가져오기
    const isFixed = this.cardSetService.isCardSetFixed();
    console.log('toggleCardsetLock - 현재 고정 상태:', isFixed);
    
    // 카드셋 서비스를 통해 고정 상태 변경
    await this.cardSetService.setCardSetFixed(!isFixed);
    console.log('toggleCardsetLock - 고정 상태 변경 완료:', !isFixed);
    
    // 아이콘 업데이트
    this.updateLockIcon(!isFixed);
    
    // 카드셋 이름 업데이트
    this.updateCardsetName().catch(error => {
      console.error('카드셋 이름 업데이트 중 오류 발생:', error);
    });
  }
  
  /**
   * 하위 폴더 포함 토글
   */
  private toggleIncludeSubfolders(): void {
    try {
      console.log('toggleIncludeSubfolders 호출됨');
      
      // 현재 설정 가져오기
      const currentIncludeSubfolders = this.cardSetService.getIncludeSubfolders();
      console.log('현재 하위 폴더 포함 설정:', currentIncludeSubfolders);
      
      // 새 설정 계산 (현재 설정의 반대)
      const newIncludeSubfolders = !currentIncludeSubfolders;
      console.log('새 하위 폴더 포함 설정:', newIncludeSubfolders);
      
      // 설정 업데이트
      this.cardSetService.setIncludeSubfolders(newIncludeSubfolders);
      
      // 버튼 찾기
      const button = this.element?.querySelector('[data-item-id="include-subfolders"]');
      console.log('하위 폴더 포함 버튼 찾음:', !!button);
      
      if (button) {
        console.log('버튼 클래스 업데이트 전:', button.className);
        
        // 아이콘 업데이트
        setIcon(button as HTMLElement, 'folder-tree');
        
        // 버튼 클래스 업데이트
        if (newIncludeSubfolders) {
          button.classList.add('is-active');
        } else {
          button.classList.remove('is-active');
        }
        
        console.log('버튼 클래스 업데이트 후:', button.className);
      }
      
      // 카드셋 업데이트
      this.updateCardsetName().catch(error => {
        console.error('카드셋 이름 업데이트 중 오류 발생:', error);
      });
    } catch (error) {
      console.error('하위 폴더 포함 토글 중 오류 발생:', error);
    }
  }

  /**
   * 툴바 아이템 액션 처리
   * @param action 액션 이름
   * @param data 액션 데이터
   */
  private async handleToolbarAction(action: string, data?: any): Promise<void> {
    console.log('툴바 액션 처리:', action, data);
    
    switch (action) {
      case 'toggleCardsetSource':
        await this.toggleCardsetSource();
        break;
      case 'toggleIncludeSubfolders':
        await this.toggleIncludeSubfolders();
        break;
      case 'selectCardset':
        // 카드셋 선택 처리
        break;
      case 'toggleCardsetLock':
        await this.toggleCardsetLock();
        break;
      case 'toggleSearch':
        this.toggleSearchBar();
        break;
      case 'showSortOptions':
        // 정렬 옵션 표시
        break;
      case 'showSettings':
        // 설정 표시
        break;
      default:
        console.log('알 수 없는 액션:', action);
    }
  }

  /**
   * 컴포넌트 생성 후 초기화
   */
  protected async onComponentCreated(): Promise<void> {
    // 현재 설정 가져오기
    const settings = this.toolbarService.getSettings();
    console.log('onComponentCreated - 현재 설정:', {
      cardSetSourceMode: settings.cardSetSourceMode,
      includeSubfolders: settings.includeSubfolders,
      isCardSetFixed: settings.isCardSetFixed
    });
    
    // 카드셋 소스 모드 확인 및 설정
    let mode = settings.cardSetSourceMode;
    if (mode === undefined || mode === null) {
      console.log('onComponentCreated: 카드셋 소스 모드가 undefined/null이므로 FOLDER로 설정');
      mode = CardSetSourceMode.FOLDER;
      
      // 설정에도 반영 (비동기 호출이므로 await 없이 호출)
      this.toolbarService.updateSettings({
        cardSetSourceMode: CardSetSourceMode.FOLDER
      }).catch(error => {
        console.error('onComponentCreated: 카드셋 소스 모드 설정 업데이트 중 오류 발생:', error);
      });
    }
    
    // 하위 폴더 포함 아이콘 초기 상태 설정
    let includeSubfoldersButton = this.element?.querySelector('[data-item-id="include-subfolders"]');
    console.log('onComponentCreated - 하위 폴더 포함 버튼 존재 여부:', !!includeSubfoldersButton);
    
    // 하위 폴더 포함 버튼이 없고 폴더 모드인 경우 추가
    if (!includeSubfoldersButton && mode !== CardSetSourceMode.TAG) {
      console.log('onComponentCreated: 하위 폴더 포함 버튼이 없어 추가합니다.');
      
      // 현재 하위 폴더 포함 상태 가져오기
      const includeSubfolders = this.cardSetService.getIncludeSubfolders();
      console.log('onComponentCreated: 하위 폴더 포함 상태:', includeSubfolders);
      
      this.addItem({
        id: 'include-subfolders',
        type: 'button',
        position: 'left',
        icon: 'folder-tree',
        tooltip: '하위 폴더 포함',
        action: 'toggleIncludeSubfolders',
        order: 1,
        visible: true,
        classes: includeSubfolders ? ['is-active'] : []
      });
      
      // 버튼 참조 업데이트
      includeSubfoldersButton = this.element?.querySelector('[data-item-id="include-subfolders"]');
      console.log('onComponentCreated: 하위 폴더 포함 버튼 추가 완료, 초기 상태:', includeSubfolders ? '활성화' : '비활성화');
    }
    
    // 하위 폴더 포함 버튼 상태 강제 설정
    if (includeSubfoldersButton) {
      // 현재 하위 폴더 포함 상태 가져오기
      const includeSubfolders = this.cardSetService.getIncludeSubfolders();
      console.log('onComponentCreated: 하위 폴더 포함 버튼 상태 설정 전 클래스:', includeSubfoldersButton.className);
      
      // 상태에 따라 클래스 설정 (기존 클래스 제거 후 추가)
      if (includeSubfolders) {
        includeSubfoldersButton.classList.add('is-active');
      } else {
        includeSubfoldersButton.classList.remove('is-active');
      }
      
      console.log('onComponentCreated: 하위 폴더 포함 버튼 상태 설정 후 클래스:', includeSubfoldersButton.className);
      console.log('하위 폴더 포함 아이콘 초기 상태 설정:', includeSubfolders ? '활성화' : '비활성화');
    }
    
    // 자물쇠 아이콘 초기 상태 설정
    this.updateLockIcon(settings.isCardSetFixed);
    console.log('자물쇠 아이콘 초기 상태 설정:', settings.isCardSetFixed);
    
    // 카드셋 이름 초기화
    this.updateCardsetName().catch(error => {
      console.error('카드셋 이름 초기화 중 오류 발생:', error);
    });
  }

  /**
   * 컴포넌트 정리
   * 이벤트 리스너 등을 정리합니다.
   */
  public cleanup(): void {
    // 이벤트 리스너 제거
    this.toolbarService.off('toolbar:item-registered', this.itemRegisteredListener);
    this.toolbarService.off('toolbar:item-updated', this.itemUpdatedListener);
    this.toolbarService.off('toolbar:item-removed', this.itemRemovedListener);
    this.toolbarService.off('toolbar:action-executed', this.itemActionExecutedListener);
    
    // 도메인 이벤트 리스너 제거
    this.eventBus.off(EventType.CARDSET_CHANGED, this.cardsetChangedListener);
    this.eventBus.off(EventType.ACTIVE_FILE_CHANGED, this.activeFileChangedListener);
    
    // 컴포넌트 제거
    super.remove();
  }

  /**
   * 컴포넌트 렌더링
   */
  public async render(container?: HTMLElement): Promise<HTMLElement> {
    const element = await super.render(container);
    
    // 렌더링 후 하위 폴더 포함 버튼 상태 확인 및 설정
    setTimeout(() => {
      // 현재 모드 확인
      const currentMode = this.cardSetService.getCardSetSourceMode();
      if (currentMode === CardSetSourceMode.FOLDER) {
        // 하위 폴더 포함 버튼 찾기
        const includeSubfoldersButton = this.element?.querySelector('[data-item-id="include-subfolders"]');
        if (includeSubfoldersButton) {
          // 현재 하위 폴더 포함 상태 가져오기
          const includeSubfolders = this.cardSetService.getIncludeSubfolders();
          console.log('render: 하위 폴더 포함 버튼 상태 설정 전 클래스:', includeSubfoldersButton.className);
          
          // 상태에 따라 클래스 설정
          if (includeSubfolders) {
            includeSubfoldersButton.classList.add('is-active');
          } else {
            includeSubfoldersButton.classList.remove('is-active');
          }
          
          console.log('render: 하위 폴더 포함 버튼 상태 설정 후 클래스:', includeSubfoldersButton.className);
          console.log('render: 하위 폴더 포함 아이콘 상태 설정:', includeSubfolders ? '활성화' : '비활성화');
        }
      }
    }, 0);
    
    return element;
  }
} 