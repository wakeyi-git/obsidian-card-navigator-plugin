import { DomainEventBus } from '../../core/events/DomainEventBus';
import { EventType } from '../../domain/events/EventTypes';
import { ISettingsService } from '../../domain/settings/SettingsInterfaces';
import { ToolbarItemType } from '../../domain/toolbar/ToolbarInterfaces';
import { IPopupManager, PopupManager } from '../../ui/components/popup/PopupManager';

// 툴바 관련 이벤트 타입 상수
const TOOLBAR_ITEM_REGISTERED = 'toolbar:item-registered';
const TOOLBAR_ITEM_UPDATED = 'toolbar:item-updated';
const TOOLBAR_ITEM_REMOVED = 'toolbar:item-removed';
const TOOLBAR_ITEM_VALUE_CHANGED = 'toolbar:item-value-changed';
const TOOLBAR_ITEM_DISABLED_CHANGED = 'toolbar:item-disabled-changed';
const TOOLBAR_ITEM_VISIBLE_CHANGED = 'toolbar:item-visible-changed';
const TOOLBAR_POPUP_SHOWN = 'toolbar:popup-shown';
const TOOLBAR_POPUP_CLOSED = 'toolbar:popup-closed';
const TOOLBAR_ACTION_EXECUTED = 'toolbar:action-executed';

// 툴바 아이템 위치 타입 정의
export type ToolbarItemPosition = 'left' | 'center' | 'right';

/**
 * 툴바 아이템 인터페이스
 */
export interface IToolbarItem {
  id: string;
  type: string;
  position: ToolbarItemPosition;
  icon?: string;
  label?: string;
  tooltip?: string;
  action?: string;
  options?: { value: string; label: string }[];
  value?: string;
  disabled?: boolean;
  visible?: boolean;
  order?: number;
  popupId?: string;
}

/**
 * 툴바 팝업 인터페이스
 */
export interface IToolbarPopup {
  id: string;
  title?: string;
  content: string;
  type?: string;
  width?: number;
  height?: number;
  position?: { x: number; y: number };
}

/**
 * 툴바 서비스 인터페이스
 */
export interface IToolbarService {
  /**
   * 툴바 아이템 등록
   * @param item 툴바 아이템
   * @returns 등록된 아이템 ID
   */
  registerItem(item: IToolbarItem): string;
  
  /**
   * 툴바 아이템 업데이트
   * @param itemId 아이템 ID
   * @param updates 업데이트할 필드
   * @returns 업데이트 성공 여부
   */
  updateItem(itemId: string, updates: Partial<IToolbarItem>): boolean;
  
  /**
   * 툴바 아이템 제거
   * @param itemId 아이템 ID
   * @returns 제거 성공 여부
   */
  removeItem(itemId: string): boolean;
  
  /**
   * 툴바 아이템 가져오기
   * @param itemId 아이템 ID
   * @returns 툴바 아이템
   */
  getItem(itemId: string): IToolbarItem | undefined;
  
  /**
   * 모든 툴바 아이템 가져오기
   * @returns 툴바 아이템 목록
   */
  getItems(): IToolbarItem[];
  
  /**
   * 툴바 아이템 값 설정
   * @param itemId 아이템 ID
   * @param value 값
   * @returns 설정 성공 여부
   */
  setItemValue(itemId: string, value: string): boolean;
  
  /**
   * 툴바 아이템 값 가져오기
   * @param itemId 아이템 ID
   * @returns 아이템 값
   */
  getItemValue(itemId: string): string | undefined;
  
  /**
   * 툴바 아이템 활성화/비활성화
   * @param itemId 아이템 ID
   * @param disabled 비활성화 여부
   * @returns 설정 성공 여부
   */
  setItemDisabled(itemId: string, disabled: boolean): boolean;
  
  /**
   * 툴바 아이템 표시/숨김
   * @param itemId 아이템 ID
   * @param visible 표시 여부
   * @returns 설정 성공 여부
   */
  setItemVisible(itemId: string, visible: boolean): boolean;
  
  /**
   * 툴바 팝업 표시
   * @param popup 툴바 팝업
   * @returns 팝업 ID
   */
  showPopup(popup: IToolbarPopup): string;
  
  /**
   * 툴바 팝업 닫기
   * @param popupId 팝업 ID
   * @returns 닫기 성공 여부
   */
  closePopup(popupId: string): boolean;
  
  /**
   * 현재 표시 중인 팝업 가져오기
   * @returns 현재 팝업
   */
  getCurrentPopup(): IToolbarPopup | undefined;
  
  /**
   * 툴바 아이템 액션 실행
   * @param itemId 아이템 ID
   * @param data 액션 데이터
   */
  executeItemAction(itemId: string, data?: any): void;
  
  /**
   * 이벤트 리스너 등록
   * @param event 이벤트 타입
   * @param listener 리스너 함수
   */
  on(event: string, listener: (data: any) => void): void;
  
  /**
   * 이벤트 리스너 제거
   * @param event 이벤트 타입
   * @param listener 리스너 함수
   */
  off(event: string, listener: (data: any) => void): void;
  
  /**
   * 정리
   */
  cleanup(): void;
}

/**
 * 툴바 서비스 구현
 */
export class ToolbarService implements IToolbarService {
  private settingsService: ISettingsService;
  private eventBus: DomainEventBus;
  private items: Map<string, IToolbarItem> = new Map();
  private popupManager: IPopupManager;
  
  /**
   * 생성자
   * @param settingsService 설정 서비스
   * @param eventBus 이벤트 버스
   */
  constructor(settingsService: ISettingsService, eventBus: DomainEventBus) {
    this.settingsService = settingsService;
    this.eventBus = eventBus;
    this.popupManager = new PopupManager(this, settingsService);
    
    // 저장된 툴바 아이템 로드
    const settings = this.settingsService.getSettings();
    const savedItems = settings.toolbarItems || [];
    
    if (savedItems.length > 0) {
      savedItems.forEach((item: IToolbarItem) => this.items.set(item.id, item));
    } else {
      // 기본 툴바 아이템 초기화
      this.initializeDefaultItems();
    }
  }
  
  /**
   * 기본 툴바 아이템 초기화
   */
  private initializeDefaultItems(): void {
    // 카드셋 선택 버튼 (좌측)
    this.registerItem({
      id: 'cardset-selector',
      type: 'button',
      position: 'left',
      icon: 'folder',
      tooltip: '카드셋 선택',
      action: 'showCardSetSelector',
      popupId: 'cardset-popup',
      order: 0
    });
    
    // 검색 입력 필드 (중앙)
    this.registerItem({
      id: 'search-input',
      type: 'input',
      position: 'center',
      tooltip: '검색',
      action: 'search',
      order: 0
    });
    
    // 검색 필터 버튼 (중앙)
    this.registerItem({
      id: 'search-filter',
      type: 'button',
      position: 'center',
      icon: 'filter',
      tooltip: '검색 필터',
      action: 'showSearchFilter',
      popupId: 'search-filter-popup',
      order: 1
    });
    
    // 정렬 버튼 (우측)
    this.registerItem({
      id: 'sort-button',
      type: 'button',
      position: 'right',
      icon: 'arrow-up-down',
      tooltip: '정렬 옵션',
      action: 'showSortOptions',
      popupId: 'sort-popup',
      order: 0
    });
    
    // 레이아웃 버튼 (우측)
    this.registerItem({
      id: 'layout-button',
      type: 'button',
      position: 'right',
      icon: 'layout-grid',
      tooltip: '레이아웃 설정',
      action: 'showLayoutOptions',
      popupId: 'layout-popup',
      order: 1
    });
    
    // 설정 버튼 (우측)
    this.registerItem({
      id: 'settings-button',
      type: 'button',
      position: 'right',
      icon: 'settings',
      tooltip: '설정 및 프리셋',
      action: 'showSettings',
      popupId: 'settings-popup',
      order: 2
    });
  }
  
  registerItem(item: IToolbarItem): string {
    // ID가 없는 경우 생성
    if (!item.id) {
      item.id = `toolbar_item_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    }
    
    // 기본값 설정
    const defaultItem: IToolbarItem = {
      id: item.id,
      type: item.type,
      position: item.position || 'left',
      visible: item.visible !== undefined ? item.visible : true,
      disabled: item.disabled || false,
      order: item.order || 0
    };
    
    // 아이템 타입별 추가 필드
    if (item.type === 'button') {
      defaultItem.icon = item.icon;
      defaultItem.label = item.label;
      defaultItem.tooltip = item.tooltip;
      defaultItem.action = item.action;
    } else if (item.type === 'select') {
      defaultItem.label = item.label;
      defaultItem.tooltip = item.tooltip;
      defaultItem.options = item.options || [];
      defaultItem.value = item.value || (item.options && item.options.length > 0 ? item.options[0].value : '');
      defaultItem.action = item.action;
    } else if (item.type === 'input') {
      defaultItem.label = item.label;
      defaultItem.tooltip = item.tooltip;
      defaultItem.value = item.value || '';
      defaultItem.action = item.action;
    }
    
    // 아이템 등록
    this.items.set(defaultItem.id, defaultItem);
    
    // 이벤트 발생
    this.eventBus.emit(TOOLBAR_ITEM_REGISTERED, { item: defaultItem });
    
    // 설정 저장
    this.saveToolbarItems();
    
    return defaultItem.id;
  }
  
  updateItem(itemId: string, updates: Partial<IToolbarItem>): boolean {
    const item = this.items.get(itemId);
    if (!item) return false;
    
    // 아이템 업데이트
    const updatedItem = { ...item, ...updates };
    this.items.set(itemId, updatedItem);
    
    // 이벤트 발생
    this.eventBus.emit(TOOLBAR_ITEM_UPDATED, { item: updatedItem });
    
    // 설정 저장
    this.saveToolbarItems();
    
    return true;
  }
  
  removeItem(itemId: string): boolean {
    if (!this.items.has(itemId)) return false;
    
    // 아이템 제거
    const item = this.items.get(itemId);
    this.items.delete(itemId);
    
    // 이벤트 발생
    this.eventBus.emit(TOOLBAR_ITEM_REMOVED, { itemId, item });
    
    // 설정 저장
    this.saveToolbarItems();
    
    return true;
  }
  
  getItem(itemId: string): IToolbarItem | undefined {
    return this.items.get(itemId);
  }
  
  getItems(): IToolbarItem[] {
    return Array.from(this.items.values());
  }
  
  setItemValue(itemId: string, value: string): boolean {
    const item = this.items.get(itemId);
    if (!item) return false;
    
    // 값 설정
    item.value = value;
    
    // 이벤트 발생
    this.eventBus.emit(TOOLBAR_ITEM_VALUE_CHANGED, { itemId, value });
    
    // 설정 저장
    this.saveToolbarItems();
    
    return true;
  }
  
  getItemValue(itemId: string): string | undefined {
    const item = this.items.get(itemId);
    return item?.value;
  }
  
  setItemDisabled(itemId: string, disabled: boolean): boolean {
    const item = this.items.get(itemId);
    if (!item) return false;
    
    // 비활성화 설정
    item.disabled = disabled;
    
    // 이벤트 발생
    this.eventBus.emit(TOOLBAR_ITEM_DISABLED_CHANGED, { itemId, disabled });
    
    // 설정 저장
    this.saveToolbarItems();
    
    return true;
  }
  
  setItemVisible(itemId: string, visible: boolean): boolean {
    const item = this.items.get(itemId);
    if (!item) return false;
    
    // 표시 설정
    item.visible = visible;
    
    // 이벤트 발생
    this.eventBus.emit(TOOLBAR_ITEM_VISIBLE_CHANGED, { itemId, visible });
    
    // 설정 저장
    this.saveToolbarItems();
    
    return true;
  }
  
  showPopup(popup: IToolbarPopup): string {
    // PopupManager를 통해 팝업 표시
    const popupId = this.popupManager.showPopup(popup);
    
    // 이벤트 발생
    this.eventBus.emit(TOOLBAR_POPUP_SHOWN, { popup });
    
    return popupId;
  }
  
  closePopup(popupId: string): boolean {
    // PopupManager를 통해 팝업 닫기
    const result = this.popupManager.closePopup(popupId);
    
    if (result) {
      // 이벤트 발생
      this.eventBus.emit(TOOLBAR_POPUP_CLOSED, { popupId });
    }
    
    return result;
  }
  
  getCurrentPopup(): IToolbarPopup | undefined {
    return this.popupManager.getCurrentPopup();
  }
  
  executeItemAction(itemId: string, data?: any): void {
    const item = this.items.get(itemId);
    if (!item || !item.action) return;
    
    // 이벤트 발생
    this.eventBus.emit(TOOLBAR_ACTION_EXECUTED, {
      itemId,
      action: item.action,
      data
    });
  }
  
  /**
   * 툴바 아이템 설정 저장
   */
  private saveToolbarItems(): void {
    const itemsToSave = Array.from(this.items.values());
    this.settingsService.updateSettings({
      toolbarItems: itemsToSave
    });
  }
  
  /**
   * 이벤트 리스너 등록
   * @param event 이벤트 타입
   * @param listener 리스너 함수
   */
  on(event: string, listener: (data: any) => void): void {
    this.eventBus.on(event as any, listener);
  }
  
  /**
   * 이벤트 리스너 제거
   * @param event 이벤트 타입
   * @param listener 리스너 함수
   */
  off(event: string, listener: (data: any) => void): void {
    this.eventBus.off(event as any, listener);
  }
  
  /**
   * 정리
   */
  cleanup(): void {
    // PopupManager 정리
    this.popupManager.cleanup();
  }
} 