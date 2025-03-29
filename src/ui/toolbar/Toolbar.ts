import { App } from 'obsidian';
import { CardSet, CardSetType } from '@/domain/models/CardSet';
import { ICardRenderConfig } from '@/domain/models/Card';
import { ILayoutConfig, LayoutType, LayoutDirection } from '@/domain/models/Layout';
import { IPreset } from '@/domain/models/Preset';
import { DomainEventDispatcher } from '@/domain/events/DomainEventDispatcher';
import { SearchBar } from '@/ui/components/search/SearchBar';
import { ISearchService } from '@/domain/services/SearchService';
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
  private cardSetTypeIcon: HTMLElement;
  private searchBar: SearchBar;
  private sortButton: HTMLElement;
  private settingsButton: HTMLElement;
  private sortMenu: HTMLElement;
  private settingsMenu: HTMLElement;

  constructor(
    private readonly app: App,
    private readonly containerEl: HTMLElement,
    initialConfig: IToolbarConfig,
    private readonly eventDispatcher: DomainEventDispatcher,
    private readonly searchService: ISearchService
  ) {
    this.config = initialConfig;
    this.container = containerEl.createDiv('card-navigator-toolbar');
    this.initialize();
  }

  /**
   * 툴바 초기화
   */
  private initialize(): void {
    // 카드셋 타입 아이콘
    this.cardSetTypeIcon = this.container.createDiv('card-set-type-icon');
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
    this.setupSortButton();

    // 설정 버튼
    this.settingsButton = this.container.createDiv('settings-button');
    this.setupSettingsButton();

    // 정렬 메뉴
    this.sortMenu = this.container.createDiv('sort-menu');
    this.setupSortMenu();

    // 설정 메뉴
    this.settingsMenu = this.container.createDiv('settings-menu');
    this.setupSettingsMenu();
  }

  /**
   * 카드셋 타입 아이콘 업데이트
   */
  private updateCardSetTypeIcon(): void {
    const iconMap: Record<CardSetType, string> = {
      folder: 'folder',
      tag: 'tag',
      link: 'link',
      search: 'search'
    };

    this.cardSetTypeIcon.empty();
    this.cardSetTypeIcon.createEl('i', {
      cls: `fas fa-${iconMap[this.config.cardSetType]}`
    });
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
    this.sortButton.createEl('i', { cls: 'fas fa-sort' });
    this.sortButton.addEventListener('click', () => {
      this.toggleSortMenu();
    });
  }

  /**
   * 설정 버튼 설정
   */
  private setupSettingsButton(): void {
    this.settingsButton.createEl('i', { cls: 'fas fa-cog' });
    this.settingsButton.addEventListener('click', () => {
      this.toggleSettingsMenu();
    });
  }

  /**
   * 정렬 메뉴 설정
   */
  private setupSortMenu(): void {
    const sortOptions = [
      { label: '파일 이름 (알파벳 순)', value: 'fileName', order: 'asc' },
      { label: '파일 이름 (알파벳 역순)', value: 'fileName', order: 'desc' },
      { label: '업데이트 날짜 (최신순)', value: 'updated', order: 'desc' },
      { label: '업데이트 날짜 (오래된 순)', value: 'updated', order: 'asc' },
      { label: '생성일 (최신순)', value: 'created', order: 'desc' },
      { label: '생성일 (오래된 순)', value: 'created', order: 'asc' }
    ];

    sortOptions.forEach(option => {
      const item = this.sortMenu.createDiv('sort-menu-item');
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
    const createButton = presetButtons.createEl('button');
    createButton.setText('현재 설정으로 생성');
    createButton.addEventListener('click', () => {
      const name = prompt('프리셋 이름을 입력하세요:');
      if (name) {
        this.onPresetCreate(name);
      }
    });

    const updateButton = presetButtons.createEl('button');
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
   * 정렬 메뉴 토글
   */
  private toggleSortMenu(): void {
    this.sortMenu.classList.toggle('active');
    if (this.sortMenu.classList.contains('active')) {
      this.settingsMenu.classList.remove('active');
    }
  }

  /**
   * 설정 메뉴 토글
   */
  private toggleSettingsMenu(): void {
    this.settingsMenu.classList.toggle('active');
    if (this.settingsMenu.classList.contains('active')) {
      this.sortMenu.classList.remove('active');
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
    // TODO: 프리셋 목록을 서비스에서 가져와서 select에 추가
    // const presets = await this.presetService.getAllPresets();
    // presets.forEach(preset => {
    //   const option = select.createEl('option');
    //   option.value = preset.id;
    //   option.setText(preset.name);
    // });
    // select.value = this.config.selectedPreset?.id || '';
    // select.addEventListener('change', (e) => {
    //   const target = e.target as HTMLSelectElement;
    //   const preset = presets.find(p => p.id === target.value);
    //   this.onPresetChange(preset || null);
    // });
  }

  /**
   * 툴바 정리
   */
  public cleanup(): void {
    this.container.remove();
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