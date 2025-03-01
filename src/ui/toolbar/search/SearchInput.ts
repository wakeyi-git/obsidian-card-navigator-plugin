import { debounce } from 'obsidian';
import CardNavigatorPlugin from 'main';
import { CardNavigatorView } from 'ui/cardNavigatorView';
import { SearchSuggest } from './SearchSuggest';
import { SearchService } from './SearchService';
import { getSearchService } from './index';
import { t } from 'i18next';
import { SearchSuggestion } from 'common/types';
import { setIcon } from 'obsidian';
import { CardContainer } from 'ui/cardContainer/cardContainer';

export class SearchInput {
    public containerEl!: HTMLElement;
    private input!: HTMLInputElement;
    private searchOptionsContainer!: HTMLElement;
    private suggestionsContainer!: HTMLElement;
    private clearButton!: HTMLElement;
    private loadingIndicator!: HTMLElement;
    private searchSuggest: SearchSuggest;
    private selectedSuggestionIndex: number = -1;
    private currentSuggestions: SearchSuggestion[] = [];
    private selectedOptionIndex: number = -1;
    private searchOptions: Array<{ key: string, label: string }> = [];
    private isComposing: boolean = false; // 한글 입력 중인지 여부를 추적
    private compositionTimer: NodeJS.Timeout | null = null; // 조합 타이머
    private searchTimer: NodeJS.Timeout | null = null; // 검색 타이머
    private inputChanged: boolean = false; // 입력 변경 여부 추적
    private isLoading: boolean = false;
    private debouncedSearch: ((searchTerm: string) => void) | null = null;
    private searchService: SearchService;

    constructor(
        private plugin: CardNavigatorPlugin,
        private parentEl: HTMLElement,
        private cardContainer: CardContainer
    ) {
        this.containerEl = parentEl.createDiv({ cls: 'card-navigator-search-container' });
        
        this.input = this.containerEl.createEl('input', {
            cls: 'card-navigator-search-input',
            attr: {
                type: 'text',
                placeholder: t('Search cards...'),
                spellcheck: 'false'
            }
        });

        this.loadingIndicator = this.containerEl.createDiv({ cls: 'card-navigator-search-loading' });
        setIcon(this.loadingIndicator, 'loader');
        this.loadingIndicator.style.display = 'none';

        this.clearButton = this.containerEl.createDiv({ cls: 'card-navigator-search-clear' });
        setIcon(this.clearButton, 'x');
        this.clearButton.style.display = 'none';
        
        this.searchOptionsContainer = this.containerEl.createDiv('search-options-container');
        this.searchOptionsContainer.hide();
        
        this.suggestionsContainer = this.containerEl.createDiv('search-suggestions-container');
        this.suggestionsContainer.hide();

        this.initializeSearchOptions();
        this.setupEventListeners();

        this.searchSuggest = new SearchSuggest(this.plugin);
        this.searchService = getSearchService(this.plugin);
        
        // 디바운스된 검색 함수 생성
        this.debouncedSearch = this.searchService.createDebouncedSearch(this.cardContainer);
        
        // 태그 검색 이벤트 리스너 등록
        this.registerTagSearchEventListener();
    }

    private initializeSearchOptions() {
        this.searchOptions = [
            { key: 'path', label: t('PATH_SEARCH') },
            { key: 'file', label: t('FILE_SEARCH') },
            { key: 'tag', label: t('TAG_SEARCH') },
            { key: 'line', label: t('LINE_SEARCH') },
            { key: 'section', label: t('SECTION_SEARCH') },
            { key: 'property', label: t('PROPERTY_SEARCH') }
        ];

        this.searchOptionsContainer.empty();
        this.selectedOptionIndex = -1;
        
        this.searchOptions.forEach((option, index) => {
            const optionEl = this.searchOptionsContainer.createDiv('search-option-item');
            optionEl.dataset.index = index.toString();
            optionEl.createSpan({ text: `${option.key}:` });
            optionEl.createSpan({ text: option.label, cls: 'search-option-label' });
            
            optionEl.addEventListener('click', () => {
                this.selectOption(index);
            });
            
            optionEl.addEventListener('mouseover', () => {
                this.highlightOption(index);
            });
        });
    }

    private clearSearch() {
        this.input.value = '';
        this.clearButton.style.display = 'none';
        
        this.cardContainer.setSearchResults(null);
        this.cardContainer.loadCards();
        
        this.input.focus();
        this.initializeSearchOptions();
        this.searchOptionsContainer.show();
    }

    private selectOption(index: number) {
        if (index < 0 || index >= this.searchOptions.length) return;
        
        const option = this.searchOptions[index];
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
        this.executeSearch(newValue);
        this.debouncedUpdateSuggestions();
        this.updateClearButtonVisibility();
    }

    private highlightOption(index: number) {
        if (index < 0 || index >= this.searchOptions.length) return;
        
        const items = this.searchOptionsContainer.querySelectorAll('.search-option-item');
        items.forEach(item => item.removeClass('is-selected'));
        
        const selectedItem = this.searchOptionsContainer.querySelector(`.search-option-item[data-index="${index}"]`);
        if (selectedItem) {
            selectedItem.addClass('is-selected');
            this.selectedOptionIndex = index;
            
            this.scrollItemIntoView(selectedItem as HTMLElement, this.searchOptionsContainer);
        }
    }

    private async updateSuggestions() {
        if (this.isComposing) return;
        
        const searchTerm = this.input.value;
        const lastTerm = searchTerm.split(' ').pop() || '';
        
        if (lastTerm === '#') {
            this.convertHashToTagSearch();
            return;
        }
        
        if (lastTerm.includes(':')) {
            this.searchOptionsContainer.hide();
            const view = this.plugin.app.workspace.getActiveViewOfType(CardNavigatorView);
            if (!view) return;

            // 현재 표시된 파일 목록 가져오기
            const filteredFiles = this.plugin.app.vault.getMarkdownFiles();
            const suggestions = await this.searchSuggest.getSuggestions(lastTerm, filteredFiles);
            this.currentSuggestions = suggestions;
            this.selectedSuggestionIndex = -1;

            this.suggestionsContainer.empty();
            if (suggestions.length > 0) {
                suggestions.forEach((suggestion, index) => {
                    const suggestionEl = this.suggestionsContainer.createDiv('search-suggestion-item');
                    suggestionEl.dataset.index = index.toString();
                    suggestionEl.createSpan({ text: suggestion.display });
                    
                    suggestionEl.addEventListener('click', () => {
                        this.selectSuggestion(index);
                    });
                    
                    suggestionEl.addEventListener('mouseover', () => {
                        this.highlightSuggestion(index);
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

    private convertHashToTagSearch() {
        const currentText = this.input.value;
        const cursorPosition = this.input.selectionStart || 0;
        
        const beforeCursor = currentText.substring(0, cursorPosition - 1);
        const afterCursor = currentText.substring(cursorPosition);
        
        const needsSpaceBefore = beforeCursor.length > 0 && !beforeCursor.endsWith(' ');
        const spaceBefore = needsSpaceBefore ? ' ' : '';
        
        const newValue = beforeCursor + spaceBefore + 'tag:' + afterCursor;
        
        this.input.value = newValue;
        const newCursorPosition = beforeCursor.length + spaceBefore.length + 'tag:'.length;
        this.input.setSelectionRange(newCursorPosition, newCursorPosition);
        
        this.executeSearch(newValue);
        this.debouncedUpdateSuggestions();
        this.updateClearButtonVisibility();
    }

    private selectSuggestion(index: number) {
        if (index < 0 || index >= this.currentSuggestions.length) return;
        
        const suggestion = this.currentSuggestions[index];
        const searchTerm = this.input.value;
        const terms = searchTerm.split(' ');
        const lastTerm = terms.pop() || '';
        const colonIndex = lastTerm.lastIndexOf(':');
        const beforeColon = lastTerm.substring(0, colonIndex + 1);
        terms.push(beforeColon + suggestion.value);
        
        const newValue = terms.join(' ');
        this.input.value = newValue;
        this.suggestionsContainer.hide();
        this.initializeSearchOptions();
        this.searchOptionsContainer.show();
        
        this.executeSearch(newValue);
        this.input.focus();
        this.updateClearButtonVisibility();
    }

    private highlightSuggestion(index: number) {
        if (index < 0 || index >= this.currentSuggestions.length) return;
        
        const items = this.suggestionsContainer.querySelectorAll('.search-suggestion-item');
        items.forEach(item => item.removeClass('is-selected'));
        
        const selectedItem = this.suggestionsContainer.querySelector(`.search-suggestion-item[data-index="${index}"]`);
        if (selectedItem) {
            selectedItem.addClass('is-selected');
            this.selectedSuggestionIndex = index;
            
            this.scrollItemIntoView(selectedItem as HTMLElement, this.suggestionsContainer);
        }
    }

    private scrollItemIntoView(item: HTMLElement, container: HTMLElement) {
        const itemRect = item.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        
        if (itemRect.top < containerRect.top) {
            container.scrollTop = container.scrollTop - (containerRect.top - itemRect.top);
        }
        else if (itemRect.bottom > containerRect.bottom) {
            container.scrollTop = container.scrollTop + (itemRect.bottom - containerRect.bottom);
        }
    }

    private updateClearButtonVisibility() {
        if (this.input.value) {
            this.clearButton.style.display = 'flex';
        } else {
            this.clearButton.style.display = 'none';
        }
    }

    private performSearch(searchTerm: string): void {
        if (!this.cardContainer) return;
        
        if (!searchTerm || searchTerm.trim() === '') {
            this.cardContainer.setSearchResults(null);
            this.cardContainer.loadCards();
            return;
        }
        
        // 디바운스된 검색 실행
        if (this.debouncedSearch) {
            this.debouncedSearch(searchTerm);
        } else {
            this.searchService.executeSearch(searchTerm, this.cardContainer);
        }
    }

    private executeSearch(inputValue: string) {
        // 검색 실행
        this.performSearch(inputValue);
        
        this.debouncedUpdateSuggestions();
        this.updateClearButtonVisibility();
    }

    private finishComposition() {
        if (this.isComposing) {
            this.isComposing = false;
            this.performSearch(this.input.value);
            
            if (this.compositionTimer) {
                clearTimeout(this.compositionTimer);
                this.compositionTimer = null;
            }
        }
    }

    private setCompositionTimer() {
        if (this.compositionTimer) {
            clearTimeout(this.compositionTimer);
        }
        
        this.compositionTimer = setTimeout(() => {
            this.finishComposition();
        }, 500);
    }

    private debouncedUpdateSuggestions = debounce(() => this.updateSuggestions(), 200);

    private setupEventListeners() {
        this.input.addEventListener('compositionstart', () => {
            this.isComposing = true;
            
            this.setCompositionTimer();
        });

        this.input.addEventListener('compositionupdate', () => {
            this.setCompositionTimer();
        });

        this.input.addEventListener('compositionend', (e: CompositionEvent) => {
            this.isComposing = false;
            
            if (this.compositionTimer) {
                clearTimeout(this.compositionTimer);
                this.compositionTimer = null;
            }
            
            this.executeSearch(this.input.value);
        });

        this.input.addEventListener('input', (e: Event) => {
            const inputValue = this.input.value;
            const selectionStart = this.input.selectionStart;
            const lastChar = selectionStart !== null ? inputValue.charAt(selectionStart - 1) : '';
            
            if (this.isComposing) {
                this.setCompositionTimer();
                return;
            }
            
            this.inputChanged = true;
            
            if (lastChar === '#') {
                this.performSearch(inputValue);
            } else {
                this.performSearch(inputValue);
            }
        });

        this.clearButton.addEventListener('click', () => {
            this.clearSearch();
        });

        this.input.addEventListener('keydown', (e: KeyboardEvent) => {
            if (e.key === 'Backspace' || e.key === 'Delete') {
                this.inputChanged = true;
                
                setTimeout(() => {
                    if (!this.input.value) {
                        this.cardContainer.setSearchResults(null);
                        this.cardContainer.loadCards();
                    } else {
                        this.executeSearch(this.input.value);
                    }
                }, 10);
            }
            
            const compositionEndKeys = [
                'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
                'Enter', 'Tab', 'Escape', ' '
            ];
            
            if (this.isComposing && compositionEndKeys.includes(e.key)) {
                this.finishComposition();
                
                if (e.key.startsWith('Arrow')) {
                    return;
                }
            }
            
            // ESC 키를 눌렀을 때 검색 모드 중단
            if (e.key === 'Escape') {
                e.preventDefault();
                this.cancelSearch();
                return;
            }
            
            if (!this.isComposing) {
                if (this.suggestionsContainer.isShown()) {
                    switch (e.key) {
                        case 'ArrowDown':
                            e.preventDefault();
                            this.highlightSuggestion(
                                this.selectedSuggestionIndex < this.currentSuggestions.length - 1 
                                    ? this.selectedSuggestionIndex + 1 
                                    : 0
                            );
                            break;
                        case 'ArrowUp':
                            e.preventDefault();
                            this.highlightSuggestion(
                                this.selectedSuggestionIndex > 0 
                                    ? this.selectedSuggestionIndex - 1 
                                    : this.currentSuggestions.length - 1
                            );
                            break;
                        case 'Enter':
                            e.preventDefault();
                            if (this.selectedSuggestionIndex >= 0) {
                                this.selectSuggestion(this.selectedSuggestionIndex);
                            }
                            break;
                        case 'Escape':
                            e.preventDefault();
                            this.suggestionsContainer.hide();
                            break;
                    }
                } 
                else if (this.searchOptionsContainer.isShown()) {
                    switch (e.key) {
                        case 'ArrowDown':
                            e.preventDefault();
                            this.highlightOption(
                                this.selectedOptionIndex < this.searchOptions.length - 1 
                                    ? this.selectedOptionIndex + 1 
                                    : 0
                            );
                            break;
                        case 'ArrowUp':
                            e.preventDefault();
                            this.highlightOption(
                                this.selectedOptionIndex > 0 
                                    ? this.selectedOptionIndex - 1 
                                    : this.searchOptions.length - 1
                            );
                            break;
                        case 'Enter':
                            e.preventDefault();
                            if (this.selectedOptionIndex >= 0) {
                                this.selectOption(this.selectedOptionIndex);
                            }
                            break;
                        case 'Escape':
                            e.preventDefault();
                            this.searchOptionsContainer.hide();
                            break;
                    }
                }
            }
        });

        this.input.addEventListener('focus', () => {
            const lastTerm = this.input.value.split(' ').pop() || '';
            if (!this.input.value || !lastTerm.includes(':')) {
                this.initializeSearchOptions();
                this.searchOptionsContainer.show();
            } else {
                this.debouncedUpdateSuggestions();
            }
            this.containerEl.addClass('focused');
            this.updateClearButtonVisibility();
        });

        this.input.addEventListener('blur', () => {
            this.finishComposition();
        });

        this.input.addEventListener('click', () => {
            this.finishComposition();
            
            const lastTerm = this.input.value.split(' ').pop() || '';
            if (!this.input.value || !lastTerm.includes(':')) {
                this.initializeSearchOptions();
                this.searchOptionsContainer.show();
            } else {
                this.debouncedUpdateSuggestions();
            }
        });

        document.addEventListener('click', (e: MouseEvent) => {
            if (!this.containerEl.contains(e.target as Node)) {
                this.searchOptionsContainer.hide();
                this.suggestionsContainer.hide();
                this.containerEl.removeClass('focused');
                
                this.finishComposition();
            }
        });
    }

    private updateLoadingState(isLoading: boolean) {
        this.isLoading = isLoading;
        this.loadingIndicator.style.display = isLoading ? 'flex' : 'none';
    }

    public setSearchTerm(searchTerm: string) {
        this.input.value = searchTerm;
        this.clearButton.style.display = searchTerm ? 'flex' : 'none';
        
        this.executeSearch(searchTerm);
    }

    public getSearchTerm(): string {
        return this.input.value.trim();
    }

    public focus() {
        this.input.focus();
    }

    /**
     * 태그 검색 이벤트 리스너 등록
     */
    private registerTagSearchEventListener(): void {
        document.addEventListener('card-navigator-tag-search', ((event: CustomEvent) => {
            const { tagName } = event.detail;
            
            // 검색어 설정
            const searchTerm = `tag:${tagName}`;
            this.setSearchTerm(searchTerm);
            
            // 검색 실행
            this.executeSearch(searchTerm);
            
            // 검색 입력 필드에 포커스
            this.focus();
        }) as EventListener);
    }

    /**
     * 검색 모드를 취소하고 초기 상태로 돌아갑니다.
     */
    private cancelSearch(): void {
        // 검색어 초기화
        this.input.value = '';
        this.clearButton.style.display = 'none';
        
        // 검색 결과 초기화
        this.cardContainer.setSearchResults(null);
        this.cardContainer.loadCards();
        
        // UI 요소 숨기기
        this.suggestionsContainer.hide();
        this.searchOptionsContainer.hide();
        this.containerEl.removeClass('focused');
        
        // 로딩 상태 초기화
        this.updateLoadingState(false);
        
        // 입력 필드에서 포커스 제거
        this.input.blur();
    }
} 