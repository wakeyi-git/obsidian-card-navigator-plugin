import { DomainEventBus } from '../../events/DomainEventBus';
import { ISettingsService } from '../core/SettingsService';

/**
 * 툴바 아이템 타입
 */
export type ToolbarItemType = 'button' | 'select' | 'input' | 'separator' | 'spacer';

/**
 * 툴바 아이템 위치
 */
export type ToolbarItemPosition = 'left' | 'center' | 'right';

/**
 * 툴바 아이템 인터페이스
 */
export interface IToolbarItem {
  id: string;
  type: ToolbarItemType;
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
}

/**
 * 툴바 팝업 인터페이스
 */
export interface IToolbarPopup {
  id: string;
  title?: string;
  content: string;
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
  getAllItems(): IToolbarItem[];
  
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
}

/**
 * 툴바 서비스 구현
 */
export class ToolbarService implements IToolbarService {
  private settingsService: ISettingsService;
  private eventBus: DomainEventBus;
  private items: Map<string, IToolbarItem> = new Map();
  private currentPopup: IToolbarPopup | undefined;
  
  /**
   * 생성자
   * @param settingsService 설정 서비스
   * @param eventBus 이벤트 버스
   */
  constructor(settingsService: ISettingsService, eventBus: DomainEventBus) {
    this.settingsService = settingsService;
    this.eventBus = eventBus;
    
    // 설정에서 툴바 아이템 로드
    const savedItems = this.settingsService.getSetting('toolbarItems', []);
    savedItems.forEach(item => this.items.set(item.id, item));
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
    
    // 툴바 아이템 등록 이벤트 발생
    this.eventBus.publish('toolbar:item-registered', { item: defaultItem });
    
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
    
    // 툴바 아이템 업데이트 이벤트 발생
    this.eventBus.publish('toolbar:item-updated', { item: updatedItem });
    
    // 설정 저장
    this.saveToolbarItems();
    
    return true;
  }
  
  removeItem(itemId: string): boolean {
    if (!this.items.has(itemId)) return false;
    
    // 아이템 제거
    const item = this.items.get(itemId);
    this.items.delete(itemId);
    
    // 툴바 아이템 제거 이벤트 발생
    this.eventBus.publish('toolbar:item-removed', { itemId, item });
    
    // 설정 저장
    this.saveToolbarItems();
    
    return true;
  }
  
  getItem(itemId: string): IToolbarItem | undefined {
    return this.items.get(itemId);
  }
  
  getAllItems(): IToolbarItem[] {
    return Array.from(this.items.values())
      .filter(item => item.visible)
      .sort((a, b) => {
        // 위치별 정렬
        const positionOrder = { left: 0, center: 1, right: 2 };
        const positionDiff = positionOrder[a.position] - positionOrder[b.position];
        if (positionDiff !== 0) return positionDiff;
        
        // 같은 위치 내에서는 order 값으로 정렬
        return (a.order || 0) - (b.order || 0);
      });
  }
  
  setItemValue(itemId: string, value: string): boolean {
    const item = this.items.get(itemId);
    if (!item) return false;
    
    // 값 설정
    item.value = value;
    
    // 툴바 아이템 값 변경 이벤트 발생
    this.eventBus.publish('toolbar:item-value-changed', { itemId, value });
    
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
    
    // 툴바 아이템 비활성화 변경 이벤트 발생
    this.eventBus.publish('toolbar:item-disabled-changed', { itemId, disabled });
    
    // 설정 저장
    this.saveToolbarItems();
    
    return true;
  }
  
  setItemVisible(itemId: string, visible: boolean): boolean {
    const item = this.items.get(itemId);
    if (!item) return false;
    
    // 표시 설정
    item.visible = visible;
    
    // 툴바 아이템 표시 변경 이벤트 발생
    this.eventBus.publish('toolbar:item-visible-changed', { itemId, visible });
    
    // 설정 저장
    this.saveToolbarItems();
    
    return true;
  }
  
  showPopup(popup: IToolbarPopup): string {
    // ID가 없는 경우 생성
    if (!popup.id) {
      popup.id = `toolbar_popup_${Date.now()}`;
    }
    
    // 현재 팝업 설정
    this.currentPopup = popup;
    
    // 툴바 팝업 표시 이벤트 발생
    this.eventBus.publish('toolbar:popup-shown', { popup });
    
    return popup.id;
  }
  
  closePopup(popupId: string): boolean {
    if (!this.currentPopup || this.currentPopup.id !== popupId) return false;
    
    // 팝업 닫기
    const popup = this.currentPopup;
    this.currentPopup = undefined;
    
    // 툴바 팝업 닫기 이벤트 발생
    this.eventBus.publish('toolbar:popup-closed', { popupId, popup });
    
    return true;
  }
  
  getCurrentPopup(): IToolbarPopup | undefined {
    return this.currentPopup;
  }
  
  executeItemAction(itemId: string, data?: any): void {
    const item = this.items.get(itemId);
    if (!item || !item.action) return;
    
    // 툴바 아이템 액션 실행 이벤트 발생
    this.eventBus.publish('toolbar:action-executed', {
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
    this.settingsService.updateSetting('toolbarItems', itemsToSave);
  }
} 