import { App } from 'obsidian';
import { CardSet } from '@/domain/models/CardSet';
import { Preset } from '@/domain/models/Preset';
import { DomainEventDispatcher } from '@/domain/events/DomainEventDispatcher';
import { SearchBar } from '@/ui/components/search/SearchBar';
import { ISearchService } from '@/domain/services/SearchService';
import { 
    ToolbarEventType,
    ToolbarSearchEvent,
    ToolbarSortEvent,
    ToolbarSettingsEvent,
    ToolbarCardSetTypeChangeEvent,
    ToolbarPresetChangeEvent,
    ToolbarCreateEvent,
    ToolbarUpdateEvent
} from '@/domain/events/ToolbarEvents';

/**
 * 툴바 이벤트 핸들러 인터페이스
 */
export interface IToolbarHandlers {
  onSearch: (query: string) => void;
  onSort: (criterion: string, order: 'asc' | 'desc') => void;
  onSettings: () => void;
  onCardSetTypeChange: (type: string) => void;
  onPresetChange: (presetId: string) => void;
  onCreate: () => void;
  onUpdate: () => void;
}

/**
 * 툴바 클래스
 */
export class Toolbar {
  private _container: HTMLElement | null = null;
  private _eventDispatcher: DomainEventDispatcher;
  private _cardSet: CardSet | null = null;
  private _preset: Preset | null = null;
  private _searchBar: SearchBar | null = null;
  private _sortButton: HTMLElement | null = null;
  private _settingsButton: HTMLElement | null = null;
  private _cardSetTypeButtons: Map<string, HTMLElement> = new Map();
  private _presetSelect: HTMLSelectElement | null = null;

  constructor(
    private readonly app: App,
    private readonly searchService: ISearchService,
    eventDispatcher: DomainEventDispatcher
  ) {
    this._eventDispatcher = eventDispatcher;
  }

  /**
   * DOM 요소 생성
   */
  createEl<K extends keyof HTMLElementTagNameMap>(
    tag: K,
    attrs?: string | { cls?: string; text?: string; type?: string; placeholder?: string }
  ): HTMLElementTagNameMap[K] {
    if (!this._container) {
      throw new Error('Toolbar container is not initialized');
    }
    return this._container.createEl(tag, attrs);
  }

  /**
   * 툴바 초기화
   */
  initialize(container: HTMLElement): void {
    this._container = container;
    this._createToolbar();
  }

  /**
   * 툴바 정리
   */
  cleanup(): void {
    if (this._container) {
      this._container.empty();
    }
    this._container = null;
    this._searchBar = null;
    this._sortButton = null;
    this._settingsButton = null;
    this._cardSetTypeButtons.clear();
    this._presetSelect = null;
  }

  /**
   * 카드셋 업데이트
   */
  updateCardSet(cardSet: CardSet | null): void {
    this._cardSet = cardSet;
    this._updateCardSetTypeButtons();
  }

  /**
   * 프리셋 업데이트
   */
  updatePreset(preset: Preset | null): void {
    this._preset = preset;
    if (this._presetSelect) {
      this._presetSelect.value = preset?.id || '';
    }
  }

  /**
   * 검색어 설정
   */
  setSearchQuery(query: string): void {
    if (this._searchBar) {
      this._searchBar.setQuery(query);
    }
  }

  /**
   * 선택된 프리셋 설정
   */
  setSelectedPreset(presetId: string): void {
    if (this._presetSelect) {
      this._presetSelect.value = presetId;
    }
  }

  /**
   * 툴바 생성
   */
  private _createToolbar(): void {
    if (!this._container) return;

    this._container.empty();
    const toolbar = this._container.createEl('div', { cls: 'card-navigator-toolbar' });

    // 카드셋 타입 버튼
    this._createCardSetTypeButtons(toolbar);

    // 검색 바
    this._createSearchBar(toolbar);

    // 정렬 버튼
    this._createSortButton(toolbar);

    // 프리셋 선택
    this._createPresetSelect(toolbar);

    // 설정 버튼
    this._createSettingsButton(toolbar);
  }

  /**
   * 카드셋 타입 버튼 생성
   */
  private _createCardSetTypeButtons(toolbar: HTMLElement): void {
    const buttonContainer = toolbar.createEl('div', { cls: 'card-set-type-buttons' });

    const types = ['folder', 'tag', 'link'];
    types.forEach(type => {
      const button = buttonContainer.createEl('button', {
        cls: 'card-set-type-button',
        text: type
      });
      button.addEventListener('click', () => {
        this._eventDispatcher.dispatch(new ToolbarCardSetTypeChangeEvent(type));
      });
      this._cardSetTypeButtons.set(type, button);
    });
  }

  /**
   * 검색 바 생성
   */
  private _createSearchBar(toolbar: HTMLElement): void {
    const searchContainer = toolbar.createEl('div', { cls: 'search-container' });
    this._searchBar = new SearchBar(
      searchContainer,
      this.app,
      this.searchService,
      (result) => {
        this._eventDispatcher.dispatch(new ToolbarSearchEvent(result.query));
      }
    );
  }

  /**
   * 정렬 버튼 생성
   */
  private _createSortButton(toolbar: HTMLElement): void {
    this._sortButton = toolbar.createEl('button', {
      cls: 'sort-button',
      text: '정렬'
    });

    this._sortButton.addEventListener('click', () => {
      this._eventDispatcher.dispatch(new ToolbarSortEvent('name', 'asc'));
    });
  }

  /**
   * 프리셋 선택 생성
   */
  private _createPresetSelect(toolbar: HTMLElement): void {
    const presetContainer = toolbar.createEl('div', { cls: 'preset-container' });
    this._presetSelect = presetContainer.createEl('select', {
      cls: 'preset-select'
    });

    this._presetSelect.addEventListener('change', (event: Event) => {
      const presetId = (event.target as HTMLSelectElement).value;
      this._eventDispatcher.dispatch(new ToolbarPresetChangeEvent(presetId));
    });
  }

  /**
   * 설정 버튼 생성
   */
  private _createSettingsButton(toolbar: HTMLElement): void {
    this._settingsButton = toolbar.createEl('button', {
      cls: 'settings-button',
      text: '설정'
    });

    this._settingsButton.addEventListener('click', () => {
      this._eventDispatcher.dispatch(new ToolbarSettingsEvent());
    });
  }

  /**
   * 카드셋 타입 버튼 업데이트
   */
  private _updateCardSetTypeButtons(): void {
    if (!this._cardSet) return;

    this._cardSetTypeButtons.forEach((button, type) => {
      button.classList.toggle('active', type === this._cardSet?.config.type);
    });
  }
} 