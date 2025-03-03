import { App } from 'obsidian';
import { SortDirection, SortField } from '../../../core/types/card.types';
import { PresetManager } from '../../../managers/preset/PresetManager';
import { ToolbarButton, ToolbarButtonOptions } from './ToolbarButton';
import { SortMenu } from './SortMenu';
import { CardSetMenu } from './CardSetMenu';
import { PresetMenu } from './PresetMenu';
import { ErrorHandler } from '../../../utils/error/ErrorHandler';
import { TOOLBAR_CLASS_NAMES } from '../../../styles/components/toolbar.styles';
import { IToolbarService } from '../../../core/interfaces/service/IToolbarService';
import { CardSetMode } from '../../../core/types/cardset.types';
import { SortBy } from '../../../core/types/common.types';
import { IPreset } from '../../../core/types/preset.types';
import { Log } from '../../../utils/log/Log';

/**
 * 툴바 옵션 인터페이스
 */
export interface ToolbarOptions {
  sortBy: SortBy;
  sortDirection: SortDirection;
  cardSetMode: CardSetMode;
  selectedFolderPath?: string;
  currentPreset: IPreset | null;
  presets: IPreset[];
  onFolderSelect?: (path: string) => void;
  onPresetCreate?: () => void;
  onPresetEdit?: (preset: IPreset) => void;
  onPresetDelete?: (preset: IPreset) => void;
  onPresetImport?: () => void;
  onPresetExport?: (preset: IPreset) => void;
}

/**
 * 툴바 컴포넌트
 * 카드 네비게이터의 툴바를 관리합니다.
 */
export class Toolbar {
  /**
   * 툴바 컨테이너 요소
   */
  private containerEl: HTMLElement;
  
  /**
   * 툴바 버튼 맵
   */
  private buttons: Map<string, ToolbarButton> = new Map();
  
  /**
   * 툴바 요소
   */
  private element: HTMLElement;
  
  /**
   * 왼쪽 영역 요소
   */
  private leftSection: HTMLElement;
  
  /**
   * 중앙 영역 요소
   */
  private centerSection: HTMLElement;
  
  /**
   * 오른쪽 영역 요소
   */
  private rightSection: HTMLElement;
  
  /**
   * 검색 입력 요소
   */
  private searchInput: HTMLInputElement;
  
  /**
   * 앱 인스턴스
   */
  private app: App;
  
  /**
   * 프리셋 관리자
   */
  private presetManager: PresetManager;
  
  /**
   * 정렬 메뉴
   */
  private sortMenu: SortMenu;
  
  /**
   * 카드셋 메뉴
   */
  private cardSetMenu: CardSetMenu;
  
  /**
   * 프리셋 메뉴
   */
  private presetMenu: PresetMenu;
  
  /**
   * 이벤트 콜백 맵
   */
  private callbacks: Record<string, (...args: any[]) => void> = {};
  
  private toolbarService: IToolbarService;
  private options: ToolbarOptions;
  
  /**
   * 생성자
   * @param containerEl 툴바를 추가할 컨테이너 요소
   */
  constructor(containerEl: HTMLElement, toolbarService: IToolbarService, options: ToolbarOptions) {
    try {
      this.containerEl = containerEl;
      this.app = containerEl.app;
      this.presetManager = containerEl.presetManager;
      this.toolbarService = toolbarService;
      this.options = options;
      this.initialize();
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        '툴바를 초기화하는 중 오류가 발생했습니다.',
        error
      );
    }
  }
  
  /**
   * 툴바를 초기화합니다.
   */
  private initialize(): void {
    try {
      // 기존 툴바가 있으면 제거
      const existingToolbar = this.containerEl.querySelector(`.${TOOLBAR_CLASS_NAMES.CONTAINER}`);
      if (existingToolbar) {
        existingToolbar.remove();
      }
      
      // 툴바 요소 생성
      const toolbarEl = document.createElement('div');
      toolbarEl.className = TOOLBAR_CLASS_NAMES.CONTAINER;
      
      // 컨테이너에 툴바 추가
      this.containerEl.prepend(toolbarEl);
      
      // 툴바 컨테이너 업데이트
      this.containerEl = toolbarEl;
      
      this.element = this.createToolbarElement();
      this.leftSection = this.createLeftSection();
      this.centerSection = this.createCenterSection();
      this.rightSection = this.createRightSection();
      
      this.element.appendChild(this.leftSection);
      this.element.appendChild(this.centerSection);
      this.element.appendChild(this.rightSection);
      
      this.searchInput = this.createSearchInput();
      this.centerSection.appendChild(this.searchInput);
      
      // 정렬 메뉴 생성
      this.sortMenu = new SortMenu(this.toolbarService, {
        sortBy: this.options.sortBy,
        direction: this.options.sortDirection
      });
      this.element.appendChild(this.sortMenu.getElement());
      
      // 카드셋 메뉴 생성
      this.cardSetMenu = new CardSetMenu(this.toolbarService, {
        mode: this.options.cardSetMode,
        selectedFolderPath: this.options.selectedFolderPath,
        onFolderSelect: this.options.onFolderSelect
      });
      this.element.appendChild(this.cardSetMenu.getElement());
      
      // 프리셋 메뉴 생성
      this.presetMenu = new PresetMenu(this.toolbarService, {
        currentPreset: this.options.currentPreset,
        presets: this.options.presets,
        onPresetCreate: this.options.onPresetCreate,
        onPresetEdit: this.options.onPresetEdit,
        onPresetDelete: this.options.onPresetDelete,
        onPresetImport: this.options.onPresetImport,
        onPresetExport: this.options.onPresetExport
      });
      this.element.appendChild(this.presetMenu.getElement());
      
      // 버튼 추가
      this.addButtons();
      
      this.subscribeToEvents();
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        '툴바 요소를 생성하는 중 오류가 발생했습니다.',
        error
      );
    }
  }
  
  /**
   * 툴바 요소 가져오기
   * @returns 툴바 HTML 요소
   */
  getElement(): HTMLElement {
    return this.element;
  }
  
  /**
   * 검색어 가져오기
   * @returns 검색어
   */
  getSearchQuery(): string {
    return this.searchInput.value;
  }
  
  /**
   * 검색어 설정
   * @param query 검색어
   */
  setSearchQuery(query: string): void {
    this.searchInput.value = query;
  }
  
  /**
   * 현재 정렬 필드 설정
   * @param field 정렬 필드
   */
  setCurrentSortField(field: SortField): void {
    this.sortMenu.setCurrentField(field);
  }
  
  /**
   * 현재 정렬 방향 설정
   * @param direction 정렬 방향
   */
  setCurrentSortDirection(direction: SortDirection): void {
    this.sortMenu.setCurrentDirection(direction);
  }
  
  /**
   * 현재 카드셋 타입 설정
   * @param type 카드셋 타입
   */
  setCurrentCardSetType(type: CardSetType): void {
    this.cardSetMenu.setCurrentType(type);
  }
  
  /**
   * 현재 프리셋 설정
   * @param presetName 프리셋 이름
   */
  setCurrentPreset(presetName: string): void {
    this.presetMenu.setCurrentPreset(presetName);
  }
  
  /**
   * 이벤트 콜백 등록
   * @param action 액션 이름
   * @param callback 콜백 함수
   */
  on(action: string, callback: (...args: any[]) => void): void {
    this.callbacks[action] = callback;
  }
  
  /**
   * 이벤트 콜백 제거
   * @param action 액션 이름
   */
  off(action: string): void {
    delete this.callbacks[action];
  }
  
  /**
   * 툴바 요소 생성
   * @returns 툴바 HTML 요소
   */
  private createToolbarElement(): HTMLElement {
    const toolbar = document.createElement('div');
    toolbar.className = TOOLBAR_CLASS_NAMES.CONTAINER;
    
    return toolbar;
  }
  
  /**
   * 왼쪽 영역 요소 생성
   * @returns 왼쪽 영역 HTML 요소
   */
  private createLeftSection(): HTMLElement {
    const section = document.createElement('div');
    section.className = `${TOOLBAR_CLASS_NAMES.SECTION.BASE} ${TOOLBAR_CLASS_NAMES.SECTION.LEFT}`;
    
    return section;
  }
  
  /**
   * 중앙 영역 요소 생성
   * @returns 중앙 영역 HTML 요소
   */
  private createCenterSection(): HTMLElement {
    const section = document.createElement('div');
    section.className = `${TOOLBAR_CLASS_NAMES.SECTION.BASE} ${TOOLBAR_CLASS_NAMES.SECTION.CENTER}`;
    
    return section;
  }
  
  /**
   * 오른쪽 영역 요소 생성
   * @returns 오른쪽 영역 HTML 요소
   */
  private createRightSection(): HTMLElement {
    const section = document.createElement('div');
    section.className = `${TOOLBAR_CLASS_NAMES.SECTION.BASE} ${TOOLBAR_CLASS_NAMES.SECTION.RIGHT}`;
    
    return section;
  }
  
  /**
   * 검색 입력 요소 생성
   * @returns 검색 입력 HTML 요소
   */
  private createSearchInput(): HTMLInputElement {
    const searchContainer = document.createElement('div');
    searchContainer.className = TOOLBAR_CLASS_NAMES.SEARCH.CONTAINER;
    
    const searchIcon = document.createElement('span');
    searchIcon.className = TOOLBAR_CLASS_NAMES.SEARCH.ICON;
    searchIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-search"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`;
    
    const input = document.createElement('input');
    input.type = 'text';
    input.className = TOOLBAR_CLASS_NAMES.SEARCH.INPUT;
    input.placeholder = '검색...';
    
    const clearButton = document.createElement('span');
    clearButton.className = TOOLBAR_CLASS_NAMES.SEARCH.CLEAR;
    clearButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-x"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
    clearButton.style.display = 'none';
    
    searchContainer.appendChild(searchIcon);
    searchContainer.appendChild(input);
    searchContainer.appendChild(clearButton);
    
    // 이벤트 리스너 설정
    input.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      clearButton.style.display = target.value ? 'flex' : 'none';
      this.triggerCallback('search', target.value);
    });
    
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        input.value = '';
        clearButton.style.display = 'none';
        this.triggerCallback('search', '');
        input.blur();
      } else if (e.key === 'Enter') {
        this.triggerCallback('searchEnter', input.value);
      }
    });
    
    clearButton.addEventListener('click', () => {
      input.value = '';
      clearButton.style.display = 'none';
      this.triggerCallback('search', '');
      input.focus();
    });
    
    this.centerSection.appendChild(searchContainer);
    
    return input;
  }
  
  /**
   * 버튼 추가
   */
  private addButtons(): void {
    // 왼쪽 영역 버튼
    
    // 카드셋 타입 버튼
    const cardSetButton = new ToolbarButton({
      icon: 'lucide-layers',
      title: '카드셋 타입',
      onClick: (e) => {
        this.cardSetMenu.show(e.currentTarget as HTMLElement);
      }
    });
    this.leftSection.appendChild(cardSetButton.getElement());
    
    // 정렬 버튼
    const sortButton = new ToolbarButton({
      icon: 'lucide-arrow-up-down',
      title: '정렬',
      onClick: (e) => {
        this.sortMenu.show(e.currentTarget as HTMLElement);
      }
    });
    this.leftSection.appendChild(sortButton.getElement());
    
    // 오른쪽 영역 버튼
    
    // 레이아웃 버튼
    const layoutButton = new ToolbarButton({
      icon: 'lucide-layout-grid',
      title: '레이아웃',
      onClick: () => {
        this.triggerCallback('toggleLayout');
      }
    });
    this.rightSection.appendChild(layoutButton.getElement());
    
    // 프리셋 버튼
    const presetButton = new ToolbarButton({
      icon: 'lucide-bookmark',
      title: '프리셋',
      onClick: (e) => {
        this.presetMenu.show(e.currentTarget as HTMLElement);
      }
    });
    this.rightSection.appendChild(presetButton.getElement());
    
    // 설정 버튼
    const settingsButton = new ToolbarButton({
      icon: 'lucide-settings',
      title: '설정',
      onClick: () => {
        this.triggerCallback('openSettings');
      }
    });
    this.rightSection.appendChild(settingsButton.getElement());
  }
  
  /**
   * 콜백 함수 호출
   * @param action 액션 이름
   * @param args 인자 목록
   */
  private triggerCallback(action: string, ...args: any[]): void {
    const callback = this.callbacks[action];
    if (callback) {
      callback(...args);
    }
  }
  
  /**
   * 툴바에 버튼을 추가합니다.
   * @param id 버튼 ID
   * @param options 버튼 옵션
   * @returns 생성된 버튼 인스턴스
   */
  public addButton(id: string, options: ToolbarButtonOptions): ToolbarButton {
    try {
      // 이미 존재하는 버튼 ID 확인
      if (this.buttons.has(id)) {
        throw new Error(`이미 존재하는 버튼 ID입니다: ${id}`);
      }
      
      // 버튼 옵션에 ID 추가
      const buttonOptions: ToolbarButtonOptions = {
        ...options,
        id
      };
      
      // 버튼 생성
      const button = new ToolbarButton(buttonOptions);
      
      // 툴바에 버튼 추가
      this.containerEl.appendChild(button.getElement());
      
      // 버튼 맵에 저장
      this.buttons.set(id, button);
      
      return button;
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        `버튼(${id})을 추가하는 중 오류가 발생했습니다.`,
        error
      );
      throw error;
    }
  }
  
  /**
   * 툴바에서 버튼을 제거합니다.
   * @param id 버튼 ID
   * @returns 성공 여부
   */
  public removeButton(id: string): boolean {
    try {
      const button = this.buttons.get(id);
      
      if (!button) {
        return false;
      }
      
      // 버튼 요소 제거
      button.remove();
      
      // 버튼 맵에서 제거
      this.buttons.delete(id);
      
      return true;
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        `버튼(${id})을 제거하는 중 오류가 발생했습니다.`,
        error
      );
      return false;
    }
  }
  
  /**
   * 툴바에서 버튼을 가져옵니다.
   * @param id 버튼 ID
   * @returns 버튼 인스턴스 또는 undefined
   */
  public getButton(id: string): ToolbarButton | undefined {
    return this.buttons.get(id);
  }
  
  /**
   * 툴바에 구분선을 추가합니다.
   * @returns 구분선 요소
   */
  public addSeparator(): HTMLElement {
    try {
      const separator = document.createElement('div');
      separator.className = TOOLBAR_CLASS_NAMES.SEPARATOR;
      
      this.containerEl.appendChild(separator);
      
      return separator;
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        '툴바에 구분선을 추가하는 중 오류가 발생했습니다.',
        error
      );
      throw error;
    }
  }
  
  /**
   * 툴바에 그룹을 추가합니다.
   * @param id 그룹 ID
   * @returns 그룹 요소
   */
  public addGroup(id: string): HTMLElement {
    try {
      // 이미 존재하는 그룹 확인
      const existingGroup = this.containerEl.querySelector(`#${id}`);
      if (existingGroup) {
        return existingGroup as HTMLElement;
      }
      
      const group = document.createElement('div');
      group.id = id;
      group.className = TOOLBAR_CLASS_NAMES.GROUP;
      
      this.containerEl.appendChild(group);
      
      return group;
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        `툴바에 그룹(${id})을 추가하는 중 오류가 발생했습니다.`,
        error
      );
      throw error;
    }
  }
  
  /**
   * 툴바에 사용자 정의 요소를 추가합니다.
   * @param element 추가할 HTML 요소
   * @returns 추가된 요소
   */
  public addCustomElement(element: HTMLElement): HTMLElement {
    try {
      this.containerEl.appendChild(element);
      return element;
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        '툴바에 사용자 정의 요소를 추가하는 중 오류가 발생했습니다.',
        error
      );
      throw error;
    }
  }
  
  /**
   * 툴바의 모든 버튼을 제거합니다.
   */
  public clearButtons(): void {
    try {
      // 모든 버튼 제거
      this.buttons.forEach(button => {
        button.remove();
      });
      
      // 버튼 맵 초기화
      this.buttons.clear();
      
      // 툴바 내용 초기화
      this.containerEl.empty();
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        '툴바의 모든 버튼을 제거하는 중 오류가 발생했습니다.',
        error
      );
    }
  }
  
  /**
   * 툴바를 제거합니다.
   */
  public remove(): void {
    try {
      // 모든 버튼 제거
      this.clearButtons();
      
      // 툴바 요소 제거
      this.containerEl.remove();
      
      this.sortMenu.remove();
      this.cardSetMenu.remove();
      this.presetMenu.remove();
      
      Log.debug('툴바가 제거되었습니다.');
    } catch (error) {
      ErrorHandler.getInstance().handleError(
        '툴바를 제거하는 중 오류가 발생했습니다.',
        error
      );
    }
  }
  
  /**
   * 이벤트 구독
   */
  private subscribeToEvents(): void {
    try {
      // 정렬 변경 이벤트 구독
      this.toolbarService.onSortChange((sortBy, direction) => {
        this.options.sortBy = sortBy;
        this.options.sortDirection = direction;
      });

      // 카드셋 모드 변경 이벤트 구독
      this.toolbarService.onCardSetModeChange((mode) => {
        this.options.cardSetMode = mode;
      });

      // 프리셋 변경 이벤트 구독
      this.toolbarService.onPresetChange((preset) => {
        this.options.currentPreset = preset;
      });

      Log.debug('툴바 이벤트 구독이 완료되었습니다.');
    } catch (error) {
      ErrorHandler.getInstance().handleError('툴바 이벤트 구독 중 오류가 발생했습니다.', error);
    }
  }
} 