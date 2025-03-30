import { Card } from '@/domain/models/Card';

/**
 * 컨텍스트 메뉴 아이템 인터페이스
 */
interface IContextMenuItem {
  /** 아이템 ID */
  id: string;
  /** 아이템 레이블 */
  label: string;
  /** 아이템 아이콘 */
  icon?: string;
  /** 단축키 */
  shortcut?: string;
  /** 핸들러 함수 */
  handler: (card: Card) => void;
}

/**
 * 컨텍스트 메뉴 핸들러 인터페이스
 */
export interface IContextMenuHandlers {
  onCopyLink: (card: Card) => void;
  onCopyContent: (card: Card) => void;
  onOpenInNewPane: (card: Card) => void;
  onOpenInNewTab: (card: Card) => void;
  onDelete: (card: Card) => void;
}

/**
 * 컨텍스트 메뉴 클래스
 */
export class ContextMenu {
  private _container: HTMLElement | null = null;
  private _handlers: IContextMenuHandlers | null = null;
  private _menu: HTMLElement | null = null;
  private _items: Map<string, IContextMenuItem> = new Map();
  private _isVisible: boolean = false;

  /**
   * 컨텍스트 메뉴 초기화
   */
  initialize(container: HTMLElement, handlers: IContextMenuHandlers): void {
    this._container = container;
    this._handlers = handlers;
    this._createMenu();
    this._addDefaultItems();
    this._addOutsideClickHandler();
  }

  /**
   * 컨텍스트 메뉴 정리
   */
  cleanup(): void {
    this._container?.removeEventListener('click', this._handleOutsideClick);
    this._container = null;
    this._handlers = null;
    this._menu = null;
    this._items.clear();
  }

  /**
   * 메뉴 표시
   */
  show(event: MouseEvent, card: Card): void {
    if (!this._menu) return;

    // 메뉴 위치 설정
    const x = event.clientX;
    const y = event.clientY;
    this._menu.style.left = `${x}px`;
    this._menu.style.top = `${y}px`;

    // 뷰포트 경계 확인
    const rect = this._menu.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (x + rect.width > viewportWidth) {
      this._menu.style.left = `${viewportWidth - rect.width}px`;
    }
    if (y + rect.height > viewportHeight) {
      this._menu.style.top = `${viewportHeight - rect.height}px`;
    }

    // 메뉴 표시
    this._menu.style.display = 'block';
    this._isVisible = true;
  }

  /**
   * 메뉴 숨김
   */
  hide(): void {
    if (!this._menu) return;

    this._menu.style.display = 'none';
    this._isVisible = false;
  }

  /**
   * 메뉴 아이템 추가
   */
  addItem(item: IContextMenuItem): void {
    this._items.set(item.id, item);
    this._createMenuItem(item);
  }

  /**
   * 메뉴 아이템 제거
   */
  removeItem(itemId: string): void {
    const item = this._items.get(itemId);
    if (item) {
      const element = this._menu?.querySelector(`[data-item-id="${itemId}"]`);
      element?.remove();
      this._items.delete(itemId);
    }
  }

  /**
   * 메뉴 생성
   */
  private _createMenu(): void {
    if (!this._container) return;

    this._menu = document.createElement('div');
    this._menu.className = 'context-menu';
    this._menu.style.display = 'none';
    this._container.appendChild(this._menu);
  }

  /**
   * 기본 메뉴 아이템 추가
   */
  private _addDefaultItems(): void {
    if (!this._handlers) return;

    this.addItem({
      id: 'copy-link',
      label: '링크 복사',
      icon: 'link',
      handler: this._handlers.onCopyLink
    });

    this.addItem({
      id: 'copy-content',
      label: '내용 복사',
      icon: 'copy',
      handler: this._handlers.onCopyContent
    });

    this.addItem({
      id: 'open-in-new-pane',
      label: '새 창에서 열기',
      icon: 'split',
      handler: this._handlers.onOpenInNewPane
    });

    this.addItem({
      id: 'open-in-new-tab',
      label: '새 탭에서 열기',
      icon: 'external-link',
      handler: this._handlers.onOpenInNewTab
    });

    this.addItem({
      id: 'delete',
      label: '삭제',
      icon: 'trash',
      handler: this._handlers.onDelete
    });
  }

  /**
   * 메뉴 아이템 생성
   */
  private _createMenuItem(item: IContextMenuItem): void {
    if (!this._menu) return;

    const menuItem = document.createElement('div');
    menuItem.className = 'context-menu-item';
    menuItem.dataset.itemId = item.id;

    if (item.icon) {
      const icon = document.createElement('span');
      icon.className = `context-menu-icon icon-${item.icon}`;
      menuItem.appendChild(icon);
    }

    const label = document.createElement('span');
    label.className = 'context-menu-label';
    label.textContent = item.label;
    menuItem.appendChild(label);

    if (item.shortcut) {
      const shortcut = document.createElement('span');
      shortcut.className = 'context-menu-shortcut';
      shortcut.textContent = item.shortcut;
      menuItem.appendChild(shortcut);
    }

    menuItem.addEventListener('click', () => {
      // TODO: 카드 객체 전달
      item.handler({} as Card);
      this.hide();
    });

    this._menu.appendChild(menuItem);
  }

  /**
   * 외부 클릭 핸들러 추가
   */
  private _addOutsideClickHandler(): void {
    if (!this._container) return;

    this._container.addEventListener('click', this._handleOutsideClick);
  }

  /**
   * 외부 클릭 처리
   */
  private _handleOutsideClick = (event: MouseEvent): void => {
    if (this._isVisible && !this._menu?.contains(event.target as Node)) {
      this.hide();
    }
  };

  /**
   * 메뉴 표시 여부 반환
   */
  get isVisible(): boolean {
    return this._isVisible;
  }
} 