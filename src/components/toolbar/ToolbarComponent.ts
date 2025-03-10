import { Component } from '../Component';
import { IToolbarService, IToolbarItem } from '../../services/toolbar/ToolbarService';
import { ToolbarItemPosition } from '../../services/toolbar/ToolbarService';

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
  private items: IToolbarItem[] = [];
  
  /**
   * 생성자
   * @param toolbarService 툴바 서비스
   */
  constructor(toolbarService: IToolbarService) {
    super();
    this.toolbarService = toolbarService;
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
   * @returns 생성된 HTML 요소
   */
  protected createComponent(): HTMLElement {
    const toolbarElement = document.createElement('div');
    toolbarElement.className = 'card-navigator-toolbar';
    
    // 툴바 영역 생성
    const leftSection = document.createElement('div');
    leftSection.className = 'toolbar-section left';
    
    const centerSection = document.createElement('div');
    centerSection.className = 'toolbar-section center';
    
    const rightSection = document.createElement('div');
    rightSection.className = 'toolbar-section right';
    
    toolbarElement.appendChild(leftSection);
    toolbarElement.appendChild(centerSection);
    toolbarElement.appendChild(rightSection);
    
    // 아이템 렌더링
    this.renderItems(leftSection, centerSection, rightSection);
    
    return toolbarElement;
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
        itemElement = this.createButtonElement(item);
        break;
      case 'select':
        itemElement = this.createSelectElement(item);
        break;
      case 'input':
        itemElement = this.createInputElement(item);
        break;
      default:
        itemElement = this.createButtonElement(item);
    }
    
    // 공통 속성 설정
    itemElement.classList.add('toolbar-item');
    itemElement.dataset.id = item.id;
    itemElement.dataset.type = item.type;
    
    if (item.disabled) {
      itemElement.classList.add('disabled');
      itemElement.setAttribute('disabled', 'disabled');
    }
    
    return itemElement;
  }
  
  /**
   * 버튼 요소 생성
   * @param item 툴바 아이템
   * @returns 생성된 HTML 요소
   */
  private createButtonElement(item: IToolbarItem): HTMLElement {
    const buttonElement = document.createElement('button');
    buttonElement.className = 'toolbar-button';
    buttonElement.type = 'button';
    
    if (item.icon) {
      const iconElement = document.createElement('span');
      iconElement.className = `toolbar-icon ${item.icon}`;
      buttonElement.appendChild(iconElement);
    }
    
    if (item.label) {
      const labelElement = document.createElement('span');
      labelElement.className = 'toolbar-label';
      labelElement.textContent = item.label;
      buttonElement.appendChild(labelElement);
    }
    
    if (item.tooltip) {
      buttonElement.title = item.tooltip;
    }
    
    // 이벤트 리스너 등록
    buttonElement.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      
      if (!item.disabled && item.action) {
        this.toolbarService.executeItemAction(item.id);
      }
    });
    
    return buttonElement;
  }
  
  /**
   * 선택 요소 생성
   * @param item 툴바 아이템
   * @returns 생성된 HTML 요소
   */
  private createSelectElement(item: IToolbarItem): HTMLElement {
    const selectElement = document.createElement('select');
    selectElement.className = 'toolbar-select';
    
    if (item.tooltip) {
      selectElement.title = item.tooltip;
    }
    
    // 옵션 추가
    if (item.options) {
      item.options.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option.value;
        optionElement.textContent = option.label;
        
        if (item.value === option.value) {
          optionElement.selected = true;
        }
        
        selectElement.appendChild(optionElement);
      });
    }
    
    // 이벤트 리스너 등록
    selectElement.addEventListener('change', () => {
      if (!item.disabled) {
        this.toolbarService.setItemValue(item.id, selectElement.value);
      }
    });
    
    return selectElement;
  }
  
  /**
   * 입력 요소 생성
   * @param item 툴바 아이템
   * @returns 생성된 HTML 요소
   */
  private createInputElement(item: IToolbarItem): HTMLElement {
    const inputElement = document.createElement('input');
    inputElement.className = 'toolbar-input';
    inputElement.type = 'text';
    
    if (item.value) {
      inputElement.value = item.value;
    }
    
    if (item.tooltip) {
      inputElement.title = item.tooltip;
    }
    
    // 이벤트 리스너 등록
    inputElement.addEventListener('input', () => {
      if (!item.disabled) {
        this.toolbarService.setItemValue(item.id, inputElement.value);
      }
    });
    
    return inputElement;
  }
  
  /**
   * 이벤트 리스너 등록
   */
  registerEventListeners(): void {
    // 툴바 서비스 이벤트 구독
    this.toolbarService.on('toolbar:item-registered', () => this.update());
    this.toolbarService.on('toolbar:item-updated', () => this.update());
    this.toolbarService.on('toolbar:item-removed', () => this.update());
    this.toolbarService.on('toolbar:item-value-changed', () => this.update());
    this.toolbarService.on('toolbar:item-disabled-changed', () => this.update());
    this.toolbarService.on('toolbar:item-visible-changed', () => this.update());
  }
  
  /**
   * 이벤트 리스너 제거
   */
  removeEventListeners(): void {
    // 툴바 서비스 이벤트 구독 해제
    this.toolbarService.off('toolbar:item-registered', () => this.update());
    this.toolbarService.off('toolbar:item-updated', () => this.update());
    this.toolbarService.off('toolbar:item-removed', () => this.update());
    this.toolbarService.off('toolbar:item-value-changed', () => this.update());
    this.toolbarService.off('toolbar:item-disabled-changed', () => this.update());
    this.toolbarService.off('toolbar:item-visible-changed', () => this.update());
  }
} 