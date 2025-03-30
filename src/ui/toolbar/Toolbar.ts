import { App } from 'obsidian';
import { CardSet, CardSetType } from '@/domain/models/CardSet';
import { ICardRenderConfig } from '@/domain/models/Card';
import { ILayoutConfig } from '@/domain/models/Layout';
import { IPreset } from '@/domain/models/Preset';
import { DomainEventDispatcher } from '@/domain/events/DomainEventDispatcher';
import { SearchBar } from '@/ui/components/search/SearchBar';
import { ISearchService } from '@/domain/services/ISearchService';
import { IPresetService } from '@/domain/services/IPresetService';
import {
  ToolbarSearchEvent,
  ToolbarSortEvent,
  ToolbarCardSetTypeChangeEvent,
  ToolbarPresetChangeEvent,
  ToolbarCreateEvent,
  ToolbarUpdateEvent,
  ToolbarCardRenderConfigChangeEvent,
  ToolbarLayoutConfigChangeEvent
} from '@/domain/events/ToolbarEvents';

/**
 * 툴바 설정 인터페이스
 */
export interface IToolbarConfig {
  cardSetType: CardSetType;
  searchQuery: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  cardRenderConfig: ICardRenderConfig;
  layoutConfig: ILayoutConfig;
  selectedPreset: IPreset | null;
}

/**
 * 툴바 컴포넌트
 */
export class Toolbar {
  private container: HTMLElement;
  private config: IToolbarConfig;
  private cardSetTypeIcon: HTMLElement | null = null;
  private searchBar: SearchBar | null = null;
  private sortButton: HTMLElement | null = null;
  private settingsButton: HTMLElement | null = null;
  private sortMenu: HTMLElement | null = null;
  private settingsMenu: HTMLElement | null = null;
  private quickSettingsMenu: HTMLElement | null = null;
  private _handleOutsideClick: (event: MouseEvent) => void;

  constructor(
    private readonly app: App,
    private readonly containerEl: HTMLElement,
    initialConfig: IToolbarConfig,
    private readonly eventDispatcher: DomainEventDispatcher,
    private readonly searchService: ISearchService,
    private readonly presetService: IPresetService
  ) {
    this.config = initialConfig;
    this.container = containerEl;
    this._handleOutsideClick = this._handleOutsideClickImpl.bind(this);
    this.initialize();
  }

  /**
   * 툴바 초기화
   */
  private initialize(): void {
    // 카드셋 타입 아이콘
    this.cardSetTypeIcon = this.container.createDiv('card-set-type-icon');
    if (!this.cardSetTypeIcon) {
      throw new Error('카드셋 타입 아이콘 생성 실패');
    }
    this.updateCardSetTypeIcon();

    // 검색 바
    this.searchBar = new SearchBar(
      this.container,
      this.app,
      this.searchService,
      (result) => {
        this.config.searchQuery = result.query;
        this.onSearchQueryChange(this.config.searchQuery);
      }
    );

    // 정렬 버튼
    this.sortButton = this.container.createDiv('sort-button');
    if (!this.sortButton) {
      throw new Error('정렬 버튼 생성 실패');
    }
    this.setupSortButton();

    // 설정 버튼
    this.settingsButton = this.container.createDiv('settings-button');
    if (!this.settingsButton) {
      throw new Error('설정 버튼 생성 실패');
    }
    this.setupSettingsButton();

    // 정렬 메뉴
    this.sortMenu = this.container.createDiv('sort-menu');
    if (!this.sortMenu) {
      throw new Error('정렬 메뉴 생성 실패');
    }
    this.setupSortMenu();

    // 설정 메뉴
    this.settingsMenu = this.container.createDiv('settings-menu');
    if (!this.settingsMenu) {
      throw new Error('설정 메뉴 생성 실패');
    }
    this.setupSettingsMenu();

    // 빠른 설정 메뉴
    this.quickSettingsMenu = this.container.createDiv('quick-settings-menu');
    if (!this.quickSettingsMenu) {
      throw new Error('빠른 설정 메뉴 생성 실패');
    }
    this.setupQuickSettingsMenu();
  }

  /**
   * 카드셋 타입 아이콘 업데이트
   */
  private updateCardSetTypeIcon(): void {
    if (!this.cardSetTypeIcon) return;

    const iconMap: Record<CardSetType, string> = {
      folder: 'fa-folder',
      tag: 'fa-tag',
      link: 'fa-link',
      search: 'fa-search'
    };

    this.cardSetTypeIcon.empty();
    const icon = this.cardSetTypeIcon.createEl('i', { cls: `fas ${iconMap[this.config.cardSetType]}` });
  }

  /**
   * 검색어 변경 이벤트 핸들러
   */
  private onSearchQueryChange(query: string): void {
    this.eventDispatcher.dispatch(new ToolbarSearchEvent(query));
  }

  /**
   * 정렬 버튼 설정
   */
  private setupSortButton(): void {
    if (!this.sortButton) return;

    const icon = this.sortButton.createEl('i', { cls: 'fas fa-sort' });
    this.sortButton.addEventListener('click', () => {
      this.toggleSortMenu();
    });
  }

  /**
   * 설정 버튼 설정
   */
  private setupSettingsButton(): void {
    if (!this.settingsButton) return;

    const icon = this.settingsButton.createEl('i', { cls: 'fas fa-cog' });
    this.settingsButton.addEventListener('click', () => {
      this.toggleSettingsMenu();
    });
  }

  /**
   * 정렬 메뉴 설정
   */
  private setupSortMenu(): void {
    if (!this.sortMenu) return;

    const sortOptions = [
      { label: '파일 이름 (알파벳 순)', value: 'fileName', order: 'asc' },
      { label: '파일 이름 (알파벳 역순)', value: 'fileName', order: 'desc' },
      { label: '업데이트 날짜 (최신순)', value: 'updated', order: 'desc' },
      { label: '업데이트 날짜 (오래된 순)', value: 'updated', order: 'asc' },
      { label: '생성일 (최신순)', value: 'created', order: 'desc' },
      { label: '생성일 (오래된 순)', value: 'created', order: 'asc' }
    ];

    sortOptions.forEach(option => {
      const item = this.sortMenu?.createDiv('sort-menu-item');
      if (!item) {
        console.error('정렬 메뉴 아이템 생성 실패');
        return;
      }
      item.setText(option.label);
      item.addEventListener('click', () => {
        this.config.sortBy = option.value;
        this.config.sortOrder = option.order as 'asc' | 'desc';
        this.onSortChange(this.config.sortBy, this.config.sortOrder);
        this.toggleSortMenu();
      });
    });
  }

  /**
   * 설정 메뉴 설정
   */
  private setupSettingsMenu(): void {
    if (!this.settingsMenu) return;

    // 카드셋 생성 방식 선택
    const cardSetTypeSection = this.settingsMenu.createDiv('settings-section');
    cardSetTypeSection.createEl('h4').setText('카드셋 생성 방식');
    const cardSetTypeSelect = cardSetTypeSection.createEl('select');
    ['folder', 'tag', 'link'].forEach(type => {
      const option = cardSetTypeSelect.createEl('option');
      option.value = type;
      option.setText(type);
    });
    cardSetTypeSelect.value = this.config.cardSetType;
    cardSetTypeSelect.addEventListener('change', (e) => {
      const target = e.target as HTMLSelectElement;
      this.config.cardSetType = target.value as CardSetType;
      this.updateCardSetTypeIcon();
      this.onCardSetTypeChange(this.config.cardSetType);
    });

    // 프리셋 선택
    const presetSection = this.settingsMenu.createDiv('settings-section');
    presetSection.createEl('h4').setText('프리셋');
    const presetSelect = presetSection.createEl('select');
    
    // 프리셋 목록 로드
    this.loadPresets(presetSelect);

    // 프리셋 생성/업데이트 버튼
    const presetButtons = presetSection.createDiv('preset-buttons');
    
    // 프리셋 생성 버튼
    const createButton = presetButtons.createEl('button');
    const createIcon = createButton.createEl('i', { cls: 'fas fa-plus' });
    createButton.setText('현재 설정으로 생성');
    createButton.addEventListener('click', () => {
      const name = prompt('프리셋 이름을 입력하세요:');
      if (name) {
        this.onPresetCreate(name);
      }
    });

    // 프리셋 업데이트 버튼
    const updateButton = presetButtons.createEl('button');
    const updateIcon = updateButton.createEl('i', { cls: 'fas fa-save' });
    updateButton.setText('현재 설정으로 업데이트');
    updateButton.addEventListener('click', () => {
      if (this.config.selectedPreset) {
        this.onPresetUpdate(this.config.selectedPreset);
      }
    });

    // 카드 표시 항목 토글
    const displaySection = this.settingsMenu.createDiv('settings-section');
    displaySection.createEl('h4').setText('카드 표시 항목');
    const headerToggle = displaySection.createDiv('toggle-item');
    headerToggle.createEl('span').setText('헤더');
    const headerCheckbox = headerToggle.createEl('input', { type: 'checkbox' });
    headerCheckbox.checked = this.config.cardRenderConfig.header.showFileName;
    headerCheckbox.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      this.config.cardRenderConfig.header.showFileName = target.checked;
      this.onCardRenderConfigChange(this.config.cardRenderConfig);
    });

    // 카드 렌더링 방식 토글
    const renderSection = this.settingsMenu.createDiv('settings-section');
    renderSection.createEl('h4').setText('렌더링 방식');
    const htmlToggle = renderSection.createDiv('toggle-item');
    htmlToggle.createEl('span').setText('HTML 렌더링');
    const htmlCheckbox = htmlToggle.createEl('input', { type: 'checkbox' });
    htmlCheckbox.checked = this.config.cardRenderConfig.renderAsHtml;
    htmlCheckbox.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      this.config.cardRenderConfig.renderAsHtml = target.checked;
      this.onCardRenderConfigChange(this.config.cardRenderConfig);
    });

    // 레이아웃 모드 토글
    const layoutSection = this.settingsMenu.createDiv('settings-section');
    layoutSection.createEl('h4').setText('레이아웃');
    const fixedHeightToggle = layoutSection.createDiv('toggle-item');
    fixedHeightToggle.createEl('span').setText('카드 높이 일치');
    const fixedHeightCheckbox = fixedHeightToggle.createEl('input', { type: 'checkbox' });
    fixedHeightCheckbox.checked = this.config.layoutConfig.fixedHeight;
    fixedHeightCheckbox.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      this.config.layoutConfig.fixedHeight = target.checked;
      this.onLayoutConfigChange(this.config.layoutConfig);
    });
  }

  /**
   * 빠른 설정 메뉴 설정
   */
  private setupQuickSettingsMenu(): void {
    if (!this.quickSettingsMenu) return;

    // 카드셋 타입 빠른 전환
    const cardSetTypeSection = this.quickSettingsMenu.createDiv('quick-settings-section');
    const cardSetTypeIcons = [
      { type: 'folder' as CardSetType, icon: 'fa-folder' },
      { type: 'tag' as CardSetType, icon: 'fa-tag' },
      { type: 'link' as CardSetType, icon: 'fa-link' }
    ];

    cardSetTypeIcons.forEach(({ type, icon }) => {
      const button = cardSetTypeSection.createEl('button');
      const iconEl = button.createEl('i', { cls: `fas ${icon}` });
      button.title = type;
      button.addEventListener('click', () => {
        this.config.cardSetType = type;
        this.updateCardSetTypeIcon();
        this.onCardSetTypeChange(this.config.cardSetType);
      });
    });

    // 정렬 옵션 빠른 전환
    const sortSection = this.quickSettingsMenu.createDiv('quick-settings-section');
    const sortOptions = [
      { icon: 'fa-sort-alpha-down', label: '파일 이름 (알파벳 순)', value: 'fileName', order: 'asc' },
      { icon: 'fa-sort-alpha-up', label: '파일 이름 (알파벳 역순)', value: 'fileName', order: 'desc' },
      { icon: 'fa-clock', label: '업데이트 날짜 (최신순)', value: 'updated', order: 'desc' },
      { icon: 'fa-calendar', label: '생성일 (최신순)', value: 'created', order: 'desc' }
    ];

    sortOptions.forEach(option => {
      const button = sortSection.createEl('button');
      const iconEl = button.createEl('i', { cls: `fas ${option.icon}` });
      button.title = option.label;
      button.addEventListener('click', () => {
        this.config.sortBy = option.value;
        this.config.sortOrder = option.order as 'asc' | 'desc';
        this.onSortChange(this.config.sortBy, this.config.sortOrder);
      });
    });

    // 레이아웃 모드 빠른 전환
    const layoutSection = this.quickSettingsMenu.createDiv('quick-settings-section');
    const layoutButton = layoutSection.createEl('button');
    const layoutIcon = layoutButton.createEl('i', { cls: 'fas fa-th-large' });
    layoutButton.title = '레이아웃 모드';
    layoutButton.addEventListener('click', () => {
      this.config.layoutConfig.fixedHeight = !this.config.layoutConfig.fixedHeight;
      this.onLayoutConfigChange(this.config.layoutConfig);
    });

    // 렌더링 모드 빠른 전환
    const renderSection = this.quickSettingsMenu.createDiv('quick-settings-section');
    const renderButton = renderSection.createEl('button');
    const renderIcon = renderButton.createEl('i', { cls: 'fas fa-code' });
    renderButton.title = '렌더링 모드';
    renderButton.addEventListener('click', () => {
      this.config.cardRenderConfig.renderAsHtml = !this.config.cardRenderConfig.renderAsHtml;
      this.onCardRenderConfigChange(this.config.cardRenderConfig);
    });
  }

  /**
   * 정렬 메뉴 토글
   */
  private toggleSortMenu(): void {
    if (!this.sortMenu || !this.settingsMenu || !this.quickSettingsMenu) return;

    this.sortMenu.classList.toggle('active');
    if (this.sortMenu.classList.contains('active')) {
      this.settingsMenu.classList.remove('active');
      this.quickSettingsMenu.classList.remove('active');
    }
  }

  /**
   * 설정 메뉴 토글
   */
  private toggleSettingsMenu(): void {
    if (!this.settingsMenu || !this.sortMenu || !this.quickSettingsMenu) return;

    this.settingsMenu.classList.toggle('active');
    if (this.settingsMenu.classList.contains('active')) {
      this.sortMenu.classList.remove('active');
      this.quickSettingsMenu.classList.remove('active');
    }
  }

  /**
   * 정렬 변경 이벤트 핸들러
   */
  private onSortChange(sortBy: string, sortOrder: 'asc' | 'desc'): void {
    this.eventDispatcher.dispatch(new ToolbarSortEvent(sortBy, sortOrder));
  }

  /**
   * 카드셋 타입 변경 이벤트 핸들러
   */
  private onCardSetTypeChange(type: CardSetType): void {
    this.eventDispatcher.dispatch(new ToolbarCardSetTypeChangeEvent(type));
  }

  /**
   * 프리셋 변경 이벤트 핸들러
   */
  private onPresetChange(preset: IPreset | null): void {
    if (preset) {
      this.eventDispatcher.dispatch(new ToolbarPresetChangeEvent(preset.id));
    }
  }

  /**
   * 프리셋 생성 이벤트 핸들러
   */
  private onPresetCreate(name: string): void {
    this.eventDispatcher.dispatch(new ToolbarCreateEvent());
  }

  /**
   * 프리셋 업데이트 이벤트 핸들러
   */
  private onPresetUpdate(preset: IPreset): void {
    this.eventDispatcher.dispatch(new ToolbarUpdateEvent());
  }

  /**
   * 카드 렌더링 설정 변경 이벤트 핸들러
   */
  private onCardRenderConfigChange(config: ICardRenderConfig): void {
    this.eventDispatcher.dispatch(new ToolbarCardRenderConfigChangeEvent(config));
  }

  /**
   * 레이아웃 설정 변경 이벤트 핸들러
   */
  private onLayoutConfigChange(config: ILayoutConfig): void {
    this.eventDispatcher.dispatch(new ToolbarLayoutConfigChangeEvent(config));
  }

  /**
   * 프리셋 목록 로드
   */
  private async loadPresets(select: HTMLSelectElement): Promise<void> {
    try {
      // 프리셋 목록 가져오기
      const presets = await this.presetService.getAllPresets();
      
      // select 초기화
      select.empty();
      
      // 기본 옵션 추가
      const defaultOption = select.createEl('option');
      defaultOption.value = '';
      defaultOption.setText('프리셋 선택');
      
      // 프리셋 목록 추가
      presets.forEach(preset => {
        const option = select.createEl('option');
        option.value = preset.id;
        option.setText(preset.name);
      });
      
      // 현재 선택된 프리셋 설정
      if (this.config.selectedPreset) {
        select.value = this.config.selectedPreset.id;
      }
      
      // 변경 이벤트 리스너 등록
      select.addEventListener('change', (e) => {
        const target = e.target as HTMLSelectElement;
        const preset = presets.find(p => p.id === target.value);
        this.onPresetChange(preset || null);
      });
    } catch (error) {
      console.error('프리셋 목록을 로드하는 중 오류가 발생했습니다:', error);
      // 오류 발생 시 사용자에게 알림
      const errorOption = select.createEl('option');
      errorOption.value = '';
      errorOption.setText('프리셋 로드 실패');
    }
  }

  /**
   * 외부 클릭 처리
   */
  private _handleOutsideClickImpl(event: MouseEvent): void {
    if (this.sortMenu?.classList.contains('active') && !this.sortMenu.contains(event.target as Node)) {
      this.sortMenu.classList.remove('active');
    }
    if (this.settingsMenu?.classList.contains('active') && !this.settingsMenu.contains(event.target as Node)) {
      this.settingsMenu.classList.remove('active');
    }
    if (this.quickSettingsMenu?.classList.contains('active') && !this.quickSettingsMenu.contains(event.target as Node)) {
      this.quickSettingsMenu.classList.remove('active');
    }
  }

  /**
   * 툴바 정리
   */
  destroy(): void {
    // 이벤트 리스너 해제
    this.container.removeEventListener('click', this._handleOutsideClick);
    
    // DOM 요소 정리
    this.container.empty();
    
    // 컴포넌트 정리
    this.cardSetTypeIcon = null;
    this.searchBar = null;
    this.sortButton = null;
    this.settingsButton = null;
    this.sortMenu = null;
    this.settingsMenu = null;
    this.quickSettingsMenu = null;
  }

  /**
   * 카드셋 업데이트
   */
  public updateCardSet(cardSet: CardSet | null): void {
    if (cardSet) {
      this.config.cardSetType = cardSet.config.type;
      this.config.sortBy = cardSet.config.sortBy;
      this.config.sortOrder = cardSet.config.sortOrder;
      this.updateCardSetTypeIcon();
    }
  }

  /**
   * 프리셋 업데이트
   */
  public updatePreset(preset: IPreset | null): void {
    this.config.selectedPreset = preset;
    if (preset) {
      this.config.cardRenderConfig = preset.cardRenderConfig;
      this.config.layoutConfig = preset.layoutConfig;
    }
  }

  /**
   * 컨테이너 요소 반환
   */
  public getContainer(): HTMLElement {
    return this.container;
  }
} 