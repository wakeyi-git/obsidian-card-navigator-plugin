import { setIcon, TFolder, FuzzySuggestModal, Menu, MenuItem } from 'obsidian';
import CardNavigatorPlugin from '../../main';
import { CardNavigatorView } from '../cardNavigatorView';
import { SearchOptions, debouncedSearch } from './search';
import { toggleSort } from './sort';
import { toggleSettings } from './settings';
import { t } from 'i18next';

// Card Navigator 플러그인의 툴바를 나타내는 클래스
export class Toolbar {
    //#region 클래스 속성
    private containerEl: HTMLElement | null = null;
    private settingsPopupOpen = false;
    private settingsIcon: HTMLElement | null = null;
    private popupObserver: MutationObserver | null = null;
    //#endregion

    //#region 초기화 및 정리
    // 생성자: 툴바 초기화
    constructor(private plugin: CardNavigatorPlugin) {}

    // 툴바 초기화 및 컨테이너 설정
    initialize(containerEl: HTMLElement) {
        this.containerEl = containerEl;
        this.createToolbar();
        this.setupPopupObserver();
    }

    // 리소스 정리
    onClose() {
        if (this.popupObserver) {
            this.popupObserver.disconnect();
        }
    }
    //#endregion

    //#region 툴바 UI 생성
    // 툴바 UI 요소 생성
    private createToolbar() {
        if (!this.containerEl) return;

        this.containerEl.empty();

        const toolbarContainer = this.containerEl.createDiv('card-navigator-toolbar-container');

        toolbarContainer.appendChild(this.createSearchContainer());
        toolbarContainer.appendChild(this.createSeparator());
        toolbarContainer.appendChild(this.createActionIconsContainer());
    }

    // 검색 컨테이너 생성
    private createSearchContainer(): HTMLElement {
        const container = createDiv('card-navigator-search-container');

        // 검색 입력 필드
        const input = container.createEl('input', {
            type: 'text',
            placeholder: t('SEARCH_PLACEHOLDER'),
            cls: 'card-navigator-search-input'
        });

        // 검색 옵션 컨테이너 (기본적으로 숨김)
        const searchOptionsContainer = container.createDiv('search-options-container');
        searchOptionsContainer.hide();
        
        // 검색 옵션 버튼들
        const optionButtons = [
            { key: 'path', label: t('PATH_SEARCH'), icon: 'folder' },
            { key: 'file', label: t('FILE_SEARCH'), icon: 'file' },
            { key: 'tag', label: t('TAG_SEARCH'), icon: 'tag' },
            { key: 'line', label: t('LINE_SEARCH'), icon: 'lines-of-text' },
            { key: 'section', label: t('SECTION_SEARCH'), icon: 'heading' },
            { key: 'property', label: t('PROPERTY_SEARCH'), icon: 'list-plus' }
        ];

        optionButtons.forEach(({ key, label, icon }) => {
            const button = searchOptionsContainer.createEl('button', {
                cls: 'search-option-button',
                attr: { 
                    'aria-label': label,
                    'data-search-key': key
                }
            });
            setIcon(button, icon);
            button.createSpan({ text: key });
        });

        // 검색 입력 필드 포커스/블러 이벤트
        input.addEventListener('focus', () => {
            searchOptionsContainer.show();
            container.addClass('focused');
        });

        // 컨테이너 외부 클릭 시 옵션 숨기기
        document.addEventListener('click', (e: MouseEvent) => {
            if (!container.contains(e.target as Node)) {
                searchOptionsContainer.hide();
                container.removeClass('focused');
            }
        });

        // 검색 이벤트
        input.addEventListener('input', (e: Event) => {
            const searchTerm = (e.target as HTMLInputElement).value;
            if (this.containerEl) {
                debouncedSearch(searchTerm, this.plugin, this.containerEl);
            }
        });

        input.addEventListener('keydown', (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                input.value = '';
                searchOptionsContainer.hide();
                container.removeClass('focused');
                if (this.containerEl) {
                    debouncedSearch('', this.plugin, this.containerEl);
                }
            }
        });

        // 검색 옵션 버튼 클릭 이벤트
        searchOptionsContainer.addEventListener('click', (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const button = target.closest('.search-option-button');
            if (button) {
                const currentText = input.value;
                const cursorPosition = input.selectionStart || 0;
                const prefix = button.getAttribute('data-search-key');
                
                if (prefix) {
                    // 현재 커서 위치 이전의 텍스트와 이후의 텍스트를 분리
                    const beforeCursor = currentText.substring(0, cursorPosition);
                    const afterCursor = currentText.substring(cursorPosition);
                    
                    // 커서 위치 이전에 공백이 없고, 텍스트가 있다면 공백 추가
                    const needsSpaceBefore = beforeCursor.length > 0 && !beforeCursor.endsWith(' ');
                    const spaceBefore = needsSpaceBefore ? ' ' : '';
                    
                    // 새로운 입력값 생성 (콜론 뒤에 공백 없이)
                    const newValue = beforeCursor + spaceBefore + prefix + ':' + afterCursor;
                    
                    // 입력값 업데이트
                    input.value = newValue;
                    
                    // 커서를 prefix: 뒤로 이동
                    const newCursorPosition = cursorPosition + spaceBefore.length + prefix.length + 1;
                    input.setSelectionRange(newCursorPosition, newCursorPosition);
                    
                    input.focus();
                    if (this.containerEl) {
                        debouncedSearch(newValue, this.plugin, this.containerEl);
                    }
                }
            }
        });

        return container;
    }

    // 검색 옵션 토글
    private toggleSearchOption(key: keyof SearchOptions) {
        const currentValue = this.plugin.searchService.getOption(key);
        this.plugin.searchService.setOptions({ [key]: !currentValue });
        
        // 현재 검색어로 다시 검색 실행
        const searchInput = this.containerEl?.querySelector('.card-navigator-search-input') as HTMLInputElement;
        if (searchInput && searchInput.value && this.containerEl) {
            debouncedSearch(searchInput.value, this.plugin, this.containerEl);
        }
    }

    // 툴바에 대한 구분 요소를 생성
    private createSeparator(): HTMLElement {
        return createDiv('toolbar-separator');
    }

    // 작업 아이콘(폴더 선택, 정렬, 설정)을 위한 컨테이너를 생성
    private createActionIconsContainer(): HTMLElement {
        const container = createDiv('card-navigator-action-icons-container');
    
        const icons = [
            { name: 'folder-cog', label: t('CHANGE_CARD_SET'), action: () => this.openCardSetMenu() },
            { name: 'arrow-up-narrow-wide', label: t('SORT_CARDS'), action: () => toggleSort(this.plugin, this.containerEl) },
            { name: 'settings', label: t('SETTINGS'), action: () => this.toggleSettingsPopup() },
        ] as const;
    
        // 툴바 아이콘을 생성하기 위해 아이콘 정의를 반복
        icons.forEach(icon => {
            const iconElement = this.createToolbarIcon(icon.name, icon.label, icon.action);
            if (icon.name === 'settings') {
                this.settingsIcon = iconElement;
            }
            container.appendChild(iconElement);
        });
    
        return container;
    }

    // 개별 툴바 아이콘을 생성하는 도우미 함수
    private createToolbarIcon(iconName: string, ariaLabel: string, action: () => void): HTMLElement {
        const icon = createDiv('clickable-icon');
        icon.ariaLabel = ariaLabel;
        
        // 정렬 아이콘인 경우 추가 클래스 부여
        if (iconName === 'arrow-up-narrow-wide') {
            icon.addClass('card-navigator-sort-button');
        }
    
        setIcon(icon, iconName);
        icon.addEventListener('click', () => action());
    
        return icon;
    }

    private openCardSetMenu() {
        const menu = new Menu();
        
        menu.addItem(item => 
            item.setTitle(t('ACTIVE_FOLDER'))
                .setIcon('folder')
                .setChecked(this.plugin.settings.cardSetType === 'activeFolder')
                .onClick(async () => {
                    await this.plugin.settingsManager.updateSetting('cardSetType', 'activeFolder');
                })
        );

        menu.addItem(item => 
            item.setTitle(t('SELECTED_FOLDER'))
                .setIcon('folder')
                .setChecked(this.plugin.settings.cardSetType === 'selectedFolder')
                .onClick(async () => {
                    // 이미 선택된 폴더가 있다면 cardSetType만 변경
                    if (this.plugin.settings.cardSetType !== 'selectedFolder') {
                        await this.plugin.settingsManager.updateSetting('cardSetType', 'selectedFolder');
                    }
                    
                    // 현재 선택된 폴더 경로 가져오기
                    const currentPath = this.plugin.settings.selectedFolder;
                    let initialFolder: TFolder | null = null;
                    
                    if (currentPath) {
                        const abstractFile = this.plugin.app.vault.getAbstractFileByPath(currentPath);
                        if (abstractFile instanceof TFolder) {
                            initialFolder = abstractFile;
                        }
                    }

                    // FolderSuggestModal 표시
                    const modal = new FolderSuggestModal(
                        this.plugin,
                        async (folder) => {
                            // 새 폴더가 선택된 경우에만 selectedFolder 업데이트
                            if (folder.path !== currentPath) {
                                await this.plugin.settingsManager.updateSetting('selectedFolder', folder.path);
                            }
                        }
                    );

                    // 초기 선택 폴더 설정
                    if (initialFolder) {
                        modal.setInitialFolder(initialFolder);
                    }

                    modal.open();
                })
        );

        menu.addItem(item => 
            item.setTitle(t('ENTIRE_VAULT'))
                .setIcon('vault')
                .setChecked(this.plugin.settings.cardSetType === 'vault')
                .onClick(async () => {
                    await this.plugin.settingsManager.updateSetting('cardSetType', 'vault');
                })
        );

        const rect = this.containerEl?.querySelector('.clickable-icon[aria-label="' + t('CHANGE_CARD_SET') + '"]')?.getBoundingClientRect();
        if (rect) {
            menu.showAtPosition({ x: rect.left, y: rect.bottom });
        }
    }

    // 설정 팝업을 토글
    private toggleSettingsPopup() {
        if (this.settingsPopupOpen) {
            this.closeSettingsPopup();
        } else {
            this.openSettingsPopup();
        }
        this.updateIconStates();
    }

    // 설정 팝업 열기
    private openSettingsPopup() {
        this.settingsPopupOpen = true;
        toggleSettings(this.plugin, this.containerEl);
    }

    // 설정 팝업 닫기
    private closeSettingsPopup() {
        this.settingsPopupOpen = false;
        const settingsPopup = this.containerEl?.querySelector('.card-navigator-settings-popup');
        if (settingsPopup) {
            settingsPopup.remove();
        }
    }

    // 팝업 오픈 상태에 따라 아이콘의 시각적 상태를 업데이트
    private updateIconStates() {
        if (this.settingsIcon) {
            this.settingsIcon.classList.toggle('card-navigator-icon-active', this.settingsPopupOpen);
        }
    }

    // 팝업 제거를 감시하기 위한 관찰자를 설정
    private setupPopupObserver() {
        if (!this.containerEl) return;

        this.popupObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.removedNodes.forEach((node) => {
                        if (node instanceof HTMLElement) {
                            if (node.classList.contains('card-navigator-settings-popup')) {
                                this.settingsPopupOpen = false;
                                this.updateIconStates();
                            }
                        }
                    });
                }
            });
        });

        this.popupObserver.observe(this.containerEl, { childList: true, subtree: true });
    }

    // 툴바를 새로 고침
    refresh() {
        // 필요한 경우 새로 고침 논리를 구현
    }
    //#endregion
}

// 툴바에서 폴더를 선택하기 위한 모달
class FolderSuggestModal extends FuzzySuggestModal<TFolder> {
    private initialFolder: TFolder | null = null;

    constructor(private plugin: CardNavigatorPlugin, private onSelect: (folder: TFolder) => void) {
        super(plugin.app);
    }

    // 초기 선택 폴더 설정 메서드
    setInitialFolder(folder: TFolder) {
        this.initialFolder = folder;
    }

    // 보관소에 있는 모든 폴더를 검색
    getItems(): TFolder[] {
        return this.plugin.app.vault.getAllLoadedFiles()
            .filter((file): file is TFolder => file instanceof TFolder);
    }

    // 폴더 경로를 항목 텍스트로 표시
    getItemText(folder: TFolder): string {
        return folder.path;
    }

    // 폴더 선택 처리
    onChooseItem(folder: TFolder): void {
        this.onSelect(folder);
    }

    // 모달이 열릴 때 초기 선택 폴더로 스크롤
    onOpen() {
        super.onOpen();
        if (this.initialFolder) {
            const items = this.getItems();
            const index = items.findIndex(folder => folder.path === this.initialFolder?.path);
            if (index !== -1) {
                // 다음 프레임에서 선택 항목으로 스크롤
                requestAnimationFrame(() => {
                    const element = this.resultContainerEl.children[index];
                    if (element) {
                        element.scrollIntoView({ block: 'center' });
                    }
                });
            }
        }
    }
}
