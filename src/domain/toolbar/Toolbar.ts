/**
 * 툴바 아이템 타입 열거형
 */
export enum ToolbarItemType {
  SORT = 'sort',
  CARDSET = 'cardset',
  CARDSET_NAME = 'cardset-name',
  SETTINGS = 'settings',
  SEARCH = 'search',
  BUTTON = 'button',
  INPUT = 'input',
  SELECT = 'select',
  TOGGLE = 'toggle'
}

/**
 * 정렬 타입
 */
export type SortType = 'filename' | 'created' | 'modified' | 'frontmatter';

/**
 * 정렬 방향
 */
export type SortDirection = 'asc' | 'desc';

/**
 * 검색 타입 열거형
 */
export enum SearchType {
  FILENAME = 'filename',
  CONTENT = 'content',
  TAG = 'tag',
  PATH = 'path',
  FRONTMATTER = 'frontmatter',
  CREATE = 'create',
  MODIFY = 'modify',
  REGEX = 'regex'
}

/**
 * 카드셋 소스 타입
 */
export type CardSetSource = 'folder' | 'tag';

/**
 * 툴바 아이템 인터페이스
 */
export interface IToolbarItem {
  /**
   * 아이템 타입
   */
  type: ToolbarItemType;
  
  /**
   * 아이템 ID
   */
  id: string;

  /**
   * 아이템 위치
   */
  position?: 'left' | 'center' | 'right';

  /**
   * 아이템 표시 여부
   */
  visible?: boolean;

  /**
   * 아이템 비활성화 여부
   */
  disabled?: boolean;

  /**
   * 아이템 순서
   */
  order?: number;

  /**
   * 아이템 아이콘
   */
  icon?: string;

  /**
   * 아이템 레이블
   */
  label?: string;

  /**
   * 아이템 툴팁
   */
  tooltip?: string;

  /**
   * 아이템 액션
   */
  action?: () => void;

  /**
   * 아이템 옵션 (select 타입에서 사용)
   */
  options?: { value: string; label: string }[];

  /**
   * 아이템 값
   */
  value?: string;

  /**
   * 연결된 팝업 ID
   */
  popupId?: string;

  /**
   * CSS 클래스 목록
   */
  classes?: string[];
}

/**
 * 툴바 인터페이스
 */
export interface IToolbar {
  /**
   * 툴바 아이템 목록
   */
  items: IToolbarItem[];
  
  /**
   * 아이템 추가
   * @param item 추가할 아이템
   */
  addItem(item: IToolbarItem): void;
  
  /**
   * 아이템 제거
   * @param itemId 제거할 아이템 ID
   */
  removeItem(itemId: string): void;
  
  /**
   * 아이템 가져오기
   * @param itemId 아이템 ID
   */
  getItem(itemId: string): IToolbarItem | null;
  
  /**
   * 모든 아이템 가져오기
   */
  getItems(): IToolbarItem[];
}

/**
 * 툴바 도메인 모델
 */
export class Toolbar implements IToolbar {
  private _items: IToolbarItem[] = [];

  constructor(items: IToolbarItem[] = []) {
    this._items = [...items];
  }

  /**
   * 툴바 아이템 목록
   */
  get items(): IToolbarItem[] {
    return [...this._items];
  }

  /**
   * 툴바 아이템 목록 설정
   */
  set items(value: IToolbarItem[]) {
    this._items = [...value];
  }

  /**
   * 아이템 추가
   * @param item 추가할 아이템
   */
  addItem(item: IToolbarItem): void {
    if (!this.getItem(item.id)) {
      this._items.push(item);
    }
  }

  /**
   * 아이템 제거
   * @param itemId 제거할 아이템 ID
   */
  removeItem(itemId: string): void {
    this._items = this._items.filter(item => item.id !== itemId);
  }

  /**
   * 아이템 가져오기
   * @param itemId 아이템 ID
   */
  getItem(itemId: string): IToolbarItem | null {
    return this._items.find(item => item.id === itemId) || null;
  }

  /**
   * 모든 아이템 가져오기
   */
  getItems(): IToolbarItem[] {
    return [...this._items];
  }
}