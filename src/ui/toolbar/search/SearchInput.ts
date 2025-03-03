import { debounce } from 'obsidian';
import CardNavigatorPlugin from 'main';
import { CardNavigatorView } from 'ui/cardNavigatorView';
import { SearchSuggest } from './SearchSuggest';
import { debouncedSearch } from './';
import { t } from 'i18next';

export class SearchInput {
    private containerEl!: HTMLElement;
    private input!: HTMLInputElement;
    private searchOptionsContainer!: HTMLElement;
    private suggestionsContainer!: HTMLElement;
    private searchSuggest: SearchSuggest;

    constructor(private plugin: CardNavigatorPlugin) {
        this.searchSuggest = new SearchSuggest(plugin);
    }

    // 검색 입력 필드 생성
    createSearchInput(): HTMLElement {
        this.containerEl = createDiv('card-navigator-search-container');
        
        // 검색 입력 필드 생성
        this.input = this.containerEl.createEl('input', {
            type: 'text',
            placeholder: t('SEARCH_PLACEHOLDER'),
            cls: 'card-navigator-search-input'
        });

        // 검색 옵션과 추천 컨테이너 생성
        this.searchOptionsContainer = this.containerEl.createDiv('search-options-container');
        this.searchOptionsContainer.hide();
        
        this.suggestionsContainer = this.containerEl.createDiv('search-suggestions-container');
        this.suggestionsContainer.hide();

        this.initializeSearchOptions();
        this.setupEventListeners();

        return this.containerEl;
    }

    // 검색 옵션 초기화
    private initializeSearchOptions() {
        const searchOptions = [
            { key: 'path', label: t('PATH_SEARCH') },
            { key: 'file', label: t('FILE_SEARCH') },
            { key: 'tag', label: t('TAG_SEARCH') },
            { key: 'line', label: t('LINE_SEARCH') },
            { key: 'section', label: t('SECTION_SEARCH') },
            { key: 'property', label: t('PROPERTY_SEARCH') }
        ];

        this.searchOptionsContainer.empty();
        searchOptions.forEach(option => {
            const optionEl = this.searchOptionsContainer.createDiv('search-option-item');
            optionEl.createSpan({ text: `${option.key}:` });
            optionEl.createSpan({ text: option.label, cls: 'search-option-label' });
            
            optionEl.addEventListener('click', () => {
                const currentText = this.input.value;
                const cursorPosition = this.input.selectionStart || 0;
                
                const beforeCursor = currentText.substring(0, cursorPosition);
                const afterCursor = currentText.substring(cursorPosition);
                
                const needsSpaceBefore = beforeCursor.length > 0 && !beforeCursor.endsWith(' ');
                const spaceBefore = needsSpaceBefore ? ' ' : '';
                
                const newValue = beforeCursor + spaceBefore + option.key + ':' + afterCursor;
                
                this.input.value = newValue;
                const newCursorPosition = cursorPosition + spaceBefore.length + option.key.length + 1;
                this.input.setSelectionRange(newCursorPosition, newCursorPosition);
                
                this.input.focus();
                debouncedSearch(newValue, this.plugin, this.containerEl);
                this.debouncedUpdateSuggestions();
            });
        });
    }

    // 검색어 입력 시 추천 항목 업데이트
    private async updateSuggestions() {
        const searchTerm = this.input.value;
        const lastTerm = searchTerm.split(' ').pop() || '';
        
        if (lastTerm.includes(':')) {
            this.searchOptionsContainer.hide();
            const view = this.plugin.app.workspace.getActiveViewOfType(CardNavigatorView);
            if (!view) return;

            const filteredFiles = await view.cardContainer.getFilteredFiles();
            const suggestions = await this.searchSuggest.getSuggestions(lastTerm, filteredFiles);

            this.suggestionsContainer.empty();
            if (suggestions.length > 0) {
                suggestions.forEach(suggestion => {
                    const suggestionEl = this.suggestionsContainer.createDiv('search-suggestion-item');
                    suggestionEl.createSpan({ text: suggestion.display });
                    
                    suggestionEl.addEventListener('click', () => {
                        const terms = searchTerm.split(' ');
                        terms.pop();
                        const colonIndex = lastTerm.lastIndexOf(':');
                        const beforeColon = lastTerm.substring(0, colonIndex + 1);
                        terms.push(beforeColon + suggestion.value);
                        
                        this.input.value = terms.join(' ');
                        this.suggestionsContainer.hide();
                        this.initializeSearchOptions();
                        this.searchOptionsContainer.show();
                        
                        debouncedSearch(this.input.value, this.plugin, this.containerEl);
                        this.input.focus();
                    });
                });
                this.suggestionsContainer.show();
            } else {
                this.suggestionsContainer.hide();
            }
        } else {
            this.suggestionsContainer.hide();
            this.initializeSearchOptions();
            this.searchOptionsContainer.show();
        }
    }

    private debouncedUpdateSuggestions = debounce(() => this.updateSuggestions(), 200);

    // 이벤트 리스너 설정
    private setupEventListeners() {
        // 입력 이벤트
        this.input.addEventListener('input', () => {
            debouncedSearch(this.input.value, this.plugin, this.containerEl);
            this.debouncedUpdateSuggestions();
        });

        // 포커스 이벤트
        this.input.addEventListener('focus', () => {
            const lastTerm = this.input.value.split(' ').pop() || '';
            if (!this.input.value || !lastTerm.includes(':')) {
                this.initializeSearchOptions();
                this.searchOptionsContainer.show();
            } else {
                this.debouncedUpdateSuggestions();
            }
            this.containerEl.addClass('focused');
        });

        // 클릭 이벤트
        this.input.addEventListener('click', () => {
            const lastTerm = this.input.value.split(' ').pop() || '';
            if (!this.input.value || !lastTerm.includes(':')) {
                this.initializeSearchOptions();
                this.searchOptionsContainer.show();
            } else {
                this.debouncedUpdateSuggestions();
            }
        });

        // 외부 클릭 이벤트
        document.addEventListener('click', (e: MouseEvent) => {
            if (!this.containerEl.contains(e.target as Node)) {
                this.searchOptionsContainer.hide();
                this.suggestionsContainer.hide();
                this.containerEl.removeClass('focused');
            }
        });
    }
} 