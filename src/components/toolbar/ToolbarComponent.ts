import { Component } from '../Component';
import { IToolbarService, IToolbarItem, IToolbarPopup } from '../../services/toolbar/ToolbarService';
import { ToolbarItemPosition } from '../../services/toolbar/ToolbarService';
import { setIcon } from 'obsidian';
import { ISearchComponent } from '../search/SearchComponent';
import { ISettingsService } from '../../domain/settings/SettingsInterfaces';
import './ToolbarComponent.css';
import '../popup/popup.css';

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
  private items: IToolbarItem[] = [];
  
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
   */
  constructor(toolbarService: IToolbarService, searchComponent: ISearchComponent) {
    super();
    this.toolbarService = toolbarService;
    this.searchComponent = searchComponent;
    
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
        itemElement = this.createSelectElement(item);
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
   * 툴바 아이템 클릭 이벤트 처리
   * @param item 툴바 아이템
   * @param event 클릭 이벤트
   */
  private handleItemClick(item: IToolbarItem, event: MouseEvent): void {
    if (item.disabled) return;
    
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
   * 이벤트 리스너 초기화
   */
  private initializeEventListeners(): void {
    // 아이템 등록 이벤트 리스너
    this.itemRegisteredListener = (data) => {
      this.addItem(data.item);
    };
    
    // 아이템 업데이트 이벤트 리스너
    this.itemUpdatedListener = (data) => {
      this.updateItem(data.item.id, data.item);
    };
    
    // 아이템 제거 이벤트 리스너
    this.itemRemovedListener = (data) => {
      this.removeItem(data.itemId);
    };
    
    // 아이템 값 변경 이벤트 리스너
    this.itemValueChangedListener = (data) => {
      const item = this.items.find(item => item.id === data.itemId);
      if (item) {
        item.value = data.value;
        this.updateItem(item.id, item);
      }
    };
    
    // 아이템 비활성화 변경 이벤트 리스너
    this.itemDisabledChangedListener = (data) => {
      const item = this.items.find(item => item.id === data.itemId);
      if (item) {
        item.disabled = data.disabled;
        this.updateItem(item.id, item);
      }
    };
    
    // 아이템 표시 변경 이벤트 리스너
    this.itemVisibleChangedListener = (data) => {
      const item = this.items.find(item => item.id === data.itemId);
      if (item) {
        item.visible = data.visible;
        this.updateItem(item.id, item);
      }
    };
  }
  
  /**
   * 이벤트 리스너 등록
   */
  protected registerEventListeners(): void {
    // 툴바 서비스 이벤트 리스너 등록
    this.toolbarService.on('toolbar:item-registered', this.itemRegisteredListener);
    this.toolbarService.on('toolbar:item-updated', this.itemUpdatedListener);
    this.toolbarService.on('toolbar:item-removed', this.itemRemovedListener);
    this.toolbarService.on('toolbar:item-value-changed', this.itemValueChangedListener);
    this.toolbarService.on('toolbar:item-disabled-changed', this.itemDisabledChangedListener);
    this.toolbarService.on('toolbar:item-visible-changed', this.itemVisibleChangedListener);
  }
  
  /**
   * 이벤트 리스너 제거
   */
  protected removeEventListeners(): void {
    // 툴바 서비스 이벤트 리스너 제거
    this.toolbarService.off('toolbar:item-registered', this.itemRegisteredListener);
    this.toolbarService.off('toolbar:item-updated', this.itemUpdatedListener);
    this.toolbarService.off('toolbar:item-removed', this.itemRemovedListener);
    this.toolbarService.off('toolbar:item-value-changed', this.itemValueChangedListener);
    this.toolbarService.off('toolbar:item-disabled-changed', this.itemDisabledChangedListener);
    this.toolbarService.off('toolbar:item-visible-changed', this.itemVisibleChangedListener);
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