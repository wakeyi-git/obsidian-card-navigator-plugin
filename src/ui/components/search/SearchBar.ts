import { App, SearchComponent, Setting, Modal } from 'obsidian';
import { ISearchOptions, ISearchResult } from '@/domain/models/Search';
import { ISearchService } from '@/domain/services/SearchService';
import { Debouncer } from '@/domain/utils/Debouncer';

/**
 * 검색 바 컴포넌트
 */
export class SearchBar {
  private searchComponent: SearchComponent;
  private searchOptions: ISearchOptions;
  private previousCardSet: string | null = null;
  private readonly debouncer: Debouncer<[string], Promise<ISearchResult>>;

  constructor(
    private readonly containerEl: HTMLElement,
    private readonly app: App,
    private readonly searchService: ISearchService,
    private readonly onSearchResult: (result: ISearchResult) => void
  ) {
    this.searchOptions = {
      scope: 'current',
      fields: {
        title: true,
        content: true,
        tags: true,
        path: true
      },
      caseSensitive: false,
      useRegex: false,
      wholeWord: false
    };

    this.debouncer = new Debouncer<[string], Promise<ISearchResult>>(
      this._performSearch.bind(this),
      300
    );

    this._initializeUI();
  }

  /**
   * UI 초기화
   */
  private _initializeUI(): void {
    const searchContainer = this.containerEl.createDiv({ cls: 'search-container' });
    
    // 검색 옵션 버튼
    const optionsButton = searchContainer.createEl('button', { cls: 'search-options-button' });
    optionsButton.createEl('span', { text: '⚙️' });
    optionsButton.addEventListener('click', () => this._showSearchOptions());

    // 검색 컴포넌트
    const searchInput = searchContainer.createEl('input', { cls: 'search-input' });
    this.searchComponent = new SearchComponent(searchInput);
    this.searchComponent.inputEl.addClass('search-input');

    // 검색어 변경 이벤트
    this.searchComponent.inputEl.addEventListener('input', (e) => {
      const query = (e.target as HTMLInputElement).value;
      this._handleSearchInput(query);
    });

    // 검색어 삭제 버튼
    const clearButton = searchContainer.createEl('button', { cls: 'search-clear-button' });
    clearButton.createEl('span', { text: '✕' });
    clearButton.addEventListener('click', () => {
      this.searchComponent.inputEl.value = '';
      this._handleSearchInput('');
    });
  }

  /**
   * 검색어 입력 처리
   */
  private _handleSearchInput(query: string): void {
    if (query.trim()) {
      this.debouncer.debounce(query);
    } else {
      this._restorePreviousCardSet();
    }
  }

  /**
   * 검색 수행
   */
  private async _performSearch(query: string): Promise<ISearchResult> {
    const result = await this.searchService.searchRealtime(query, this.searchOptions);
    this.onSearchResult(result);
    return result;
  }

  /**
   * 이전 카드셋 복원
   */
  private _restorePreviousCardSet(): void {
    if (this.previousCardSet) {
      // TODO: 이전 카드셋으로 복원하는 로직 구현
      this.previousCardSet = null;
    }
  }

  /**
   * 검색 옵션 표시
   */
  private _showSearchOptions(): void {
    const modal = new SearchOptionsModal(this.app, this.searchOptions, (options) => {
      this.searchOptions = options;
      const query = this.searchComponent.inputEl.value;
      if (query.trim()) {
        this._performSearch(query);
      }
    });
    modal.open();
  }

  /**
   * 검색어 설정
   * @param query 설정할 검색어
   */
  setQuery(query: string): void {
    if (this.searchComponent) {
      this.searchComponent.inputEl.value = query;
      this._handleSearchInput(query);
    }
  }
}

/**
 * 검색 옵션 모달
 */
class SearchOptionsModal extends Modal {
  constructor(
    app: App,
    private readonly options: ISearchOptions,
    private readonly onSave: (options: ISearchOptions) => void
  ) {
    super(app);
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();

    new Setting(contentEl)
      .setName('검색 범위')
      .addDropdown(dropdown => {
        dropdown
          .addOption('current', '현재 카드셋')
          .addOption('vault', '전체 볼트')
          .setValue(this.options.scope)
          .onChange(value => {
            this.options.scope = value as 'current' | 'vault';
          });
      });

    new Setting(contentEl)
      .setName('검색 필드')
      .addToggle(toggle => {
        toggle
          .setValue(this.options.fields.title)
          .onChange(value => {
            this.options.fields.title = value;
          });
      })
      .setDesc('제목');

    new Setting(contentEl)
      .addToggle(toggle => {
        toggle
          .setValue(this.options.fields.content)
          .onChange(value => {
            this.options.fields.content = value;
          });
      })
      .setDesc('내용');

    new Setting(contentEl)
      .addToggle(toggle => {
        toggle
          .setValue(this.options.fields.tags)
          .onChange(value => {
            this.options.fields.tags = value;
          });
      })
      .setDesc('태그');

    new Setting(contentEl)
      .addToggle(toggle => {
        toggle
          .setValue(this.options.fields.path)
          .onChange(value => {
            this.options.fields.path = value;
          });
      })
      .setDesc('경로');

    new Setting(contentEl)
      .setName('대소문자 구분')
      .addToggle(toggle => {
        toggle
          .setValue(this.options.caseSensitive)
          .onChange(value => {
            this.options.caseSensitive = value;
          });
      });

    new Setting(contentEl)
      .setName('정규식 사용')
      .addToggle(toggle => {
        toggle
          .setValue(this.options.useRegex)
          .onChange(value => {
            this.options.useRegex = value;
          });
      });

    new Setting(contentEl)
      .setName('전체 단어 일치')
      .addToggle(toggle => {
        toggle
          .setValue(this.options.wholeWord)
          .onChange(value => {
            this.options.wholeWord = value;
          });
      });

    new Setting(contentEl)
      .addButton(button => {
        button
          .setButtonText('저장')
          .onClick(() => {
            this.onSave(this.options);
            this.close();
          });
      });
  }

  onClose(): void {
    const { contentEl } = this;
    contentEl.empty();
  }
} 