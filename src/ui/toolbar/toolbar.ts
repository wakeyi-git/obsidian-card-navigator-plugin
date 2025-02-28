import { setIcon, TFolder, FuzzySuggestModal, Menu } from 'obsidian';
import CardNavigatorPlugin from '../../main';
import { CardNavigatorView } from '../cardNavigatorView';
import { toggleSort } from './sort';
import { toggleSettings, closePopup } from './settings';
import { t } from 'i18next';
import { CardContainer } from 'ui/cardContainer/cardContainer';
import { SearchBar } from 'ui/toolbar/search/SearchBar';

// Card Navigator 플러그인의 툴바를 나타내는 클래스
export class Toolbar {
    //#region 클래스 속성
    private containerEl: HTMLElement | null = null;
    private settingsIcon: HTMLElement | null = null;
    private popupObserver: MutationObserver | null = null;
    private searchBar: SearchBar | null = null;
    private settingsButton: HTMLElement | null = null;
    private folderPathDisplay: HTMLElement | null = null;
    private sortButton: HTMLElement | null = null;
    private cardContainer: CardContainer;
    //#endregion

    //#region 초기화 및 정리
    // 생성자: 툴바 초기화
    constructor(
        private plugin: CardNavigatorPlugin,
        private view: CardNavigatorView,
        cardContainer: CardContainer
    ) {
        this.cardContainer = cardContainer;
    }

    /**
     * 툴바를 초기화합니다.
     * @param containerEl 툴바 컨테이너 요소
     */
    async initialize(containerEl: HTMLElement): Promise<void> {
        this.containerEl = containerEl;
        
        // 툴바 요소 생성
        this.createToolbarElements();
        
        // 검색 바 초기화
        await this.initializeSearchBar();
        
        // 정렬 버튼 초기화
        this.initializeSortButton();
        
        // 폴더 경로 표시 초기화
        this.initializeFolderPathDisplay();
        
        // 설정 버튼 초기화
        this.initializeSettingsButton();
        
        this.setupPopupObserver();
    }

    /**
     * 툴바를 닫습니다.
     */
    public onClose(): void {
        // 팝업 옵저버 정리
        if (this.popupObserver) {
            this.popupObserver.disconnect();
            this.popupObserver = null;
        }
        
        // 검색 바 정리
        if (this.searchBar) {
            this.searchBar.onClose();
        }
    }
    //#endregion

    //#region 툴바 UI 생성
    // 툴바 UI 요소 생성
    private createToolbarElements() {
        if (!this.containerEl) return;

        this.containerEl.empty();
        
        // 검색 컨테이너를 위한 래퍼 추가
        const searchWrapper = document.createElement('div');
        searchWrapper.addClass('card-navigator-search-wrapper');
        this.containerEl.appendChild(searchWrapper);

        // 검색 컨테이너 추가 (SearchBar에서 사용할 컨테이너)
        const searchContainer = document.createElement('div');
        searchContainer.addClass('card-navigator-search-container');
        searchWrapper.appendChild(searchContainer);
        
        // 구분선 추가
        const separator = this.createSeparator();
        this.containerEl.appendChild(separator);
        
        // 아이콘 컨테이너 추가
        const actionIcons = this.createActionIconsContainer();
        this.containerEl.appendChild(actionIcons);
    }

    // 툴바에 대한 구분 요소를 생성
    private createSeparator(): HTMLElement {
        const separator = document.createElement('div');
        separator.addClass('toolbar-separator');
        return separator;
    }

    // 작업 아이콘(폴더 선택, 정렬, 설정)을 위한 컨테이너를 생성
    private createActionIconsContainer(): HTMLElement {
        const container = document.createElement('div');
        container.addClass('card-navigator-action-icons-container');
    
        // 현재 CardSetType에 따라 적절한 아이콘 선택
        const getCardSetIcon = () => {
            switch (this.plugin.settings.cardSetType) {
                case 'activeFolder':
                    return 'folder-open';
                case 'selectedFolder':
                    return 'folder-tree';
                case 'vault':
                    return 'vault';
                default:
                    return 'folder-open';
            }
        };
    
        const icons = [
            { 
                name: getCardSetIcon(), 
                label: t('CHANGE_CARD_SET'), 
                action: () => this.openCardSetMenu() 
            },
            { 
                name: 'arrow-up-narrow-wide', 
                label: t('SORT_CARDS'), 
                action: () => this.openSortMenu(this.sortButton as HTMLElement) 
            },
            { 
                name: 'settings', 
                label: t('SETTINGS'), 
                action: () => this.toggleSettingsPopup(),
                className: this.plugin.settings.autoApplyPresets ? 'card-navigator-settings-active' : ''
            },
        ] as const;
    
        // 툴바 아이콘을 생성하기 위해 아이콘 정의를 반복
        icons.forEach(icon => {
            const iconElement = this.createToolbarIcon(icon.name, icon.label, icon.action);
            if (icon.name === 'settings') {
                this.settingsIcon = iconElement;
                // autoApplyPresets가 true일 때 강조 클래스 추가
                if (this.plugin.settings.autoApplyPresets) {
                    iconElement.addClass('card-navigator-settings-active');
                }
            }
            container.appendChild(iconElement);
        });
    
        return container;
    }

    // 개별 툴바 아이콘을 생성하는 도우미 함수
    private createToolbarIcon(iconName: string, ariaLabel: string, action: () => void): HTMLElement {
        const icon = document.createElement('div');
        icon.addClass('clickable-icon');
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
    toggleSettingsPopup(): void {
        // 현재 팝업이 열려있는지 확인
        const isPopupOpen = !!document.querySelector('.card-navigator-settings-popup');
        
        if (isPopupOpen) {
            this.closeSettingsPopup();
        } else {
            this.openSettingsPopup();
        }
    }

    // 설정 팝업 열기
    openSettingsPopup(): void {
        // 툴바 컨테이너 요소가 올바르게 선택되었는지 확인
        if (!this.containerEl) {
            console.error('설정 팝업 열기에서 컨테이너 요소가 null입니다');
            return;
        }
        
        // 툴바 컨테이너 요소가 DOM에 있는지 확인
        if (!this.containerEl.isConnected) {
            console.error('설정 팝업 열기에서 컨테이너 요소가 DOM에 연결되어 있지 않습니다');
            return;
        }
        
        // 설정 팝업 토글
        toggleSettings(this.plugin, this.containerEl);
        
        // 아이콘 상태 업데이트
        this.updateIconStates({ settings: true });
    }

    // 설정 팝업 닫기
    closeSettingsPopup(): void {
        // 팝업 닫기
        closePopup('card-navigator-settings-popup', window);
        
        // 아이콘 상태 업데이트
        this.updateIconStates();
    }

    // 아이콘 상태 업데이트
    updateIconStates(states?: { settings?: boolean }): void {
        // 설정 아이콘 상태 업데이트
        const settingsIcon = this.getSettingsIcon();
        if (settingsIcon) {
            const isSettingsOpen = states?.settings !== undefined 
                ? states.settings 
                : !!document.querySelector('.card-navigator-settings-popup');
                
            if (isSettingsOpen) {
                settingsIcon.addClass('active');
            } else {
                settingsIcon.removeClass('active');
            }
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
        if (this.containerEl) {
            const cardSetIcon = this.containerEl.querySelector(`[aria-label="${t('CHANGE_CARD_SET')}"]`) as HTMLElement;
            if (cardSetIcon) {
                cardSetIcon.empty();
                const newIconName = (() => {
                    switch (this.plugin.settings.cardSetType) {
                        case 'activeFolder':
                            return 'folder-open';
                        case 'selectedFolder':
                            return 'folder-tree';
                        case 'vault':
                            return 'vault';
                        default:
                            return 'folder-open';
                    }
                })();
                setIcon(cardSetIcon, newIconName);
            }

            // settings 아이콘 상태 업데이트
            if (this.settingsIcon) {
                this.settingsIcon.classList.toggle('card-navigator-settings-active', this.plugin.settings.autoApplyPresets);
            }
        }
    }

    /**
     * 검색 입력에 포커스를 설정합니다.
     */
    public focusSearch(): void {
        if (this.searchBar) {
            this.searchBar.focus();
        }
    }

    /**
     * 검색어를 설정합니다.
     * @param searchTerm 검색어
     */
    public setSearchTerm(searchTerm: string): void {
        if (this.searchBar) {
            this.searchBar.setSearchTerm(searchTerm);
        }
    }

    /**
     * 현재 검색어 가져오기
     * @returns 현재 검색어
     */
    public getSearchTerm(): string {
        return this.searchBar ? this.searchBar.getSearchTerm() : '';
    }

    // 설정 아이콘 요소 가져오기
    getSettingsIcon(): HTMLElement | null {
        return this.containerEl?.querySelector('.card-navigator-settings-icon') as HTMLElement || null;
    }
    
    // 정렬 아이콘 요소 가져오기
    getSortIcon(): HTMLElement | null {
        return this.containerEl?.querySelector('.card-navigator-sort-icon') as HTMLElement || null;
    }

    /**
     * 폴더 경로 표시를 업데이트합니다.
     * @param folder 표시할 폴더
     */
    public updateFolderPathDisplay(folder: TFolder): void {
        if (!this.containerEl || !folder) {
            return;
        }
        
        // 폴더 경로 표시 요소 찾기
        const folderPathEl = this.containerEl.querySelector('.card-navigator-folder-path');
        if (!folderPathEl) {
            return;
        }
        
        // 폴더 경로 표시 업데이트
        folderPathEl.textContent = folder.path || folder.name;
        folderPathEl.setAttribute('aria-label', `현재 폴더: ${folder.path || folder.name}`);
        
        // 툴팁 업데이트
        folderPathEl.setAttribute('title', folder.path || folder.name);
    }

    /**
     * 검색 바를 초기화합니다.
     */
    private async initializeSearchBar(): Promise<void> {
        if (!this.containerEl) return;
        
        // 검색 바 컨테이너 찾기
        const searchBarContainer = this.containerEl.querySelector('.card-navigator-search-container');
        if (!searchBarContainer) return;
        
        // 검색 바 초기화
        this.searchBar = new SearchBar(this.plugin, this.view, this.cardContainer);
        await this.searchBar.initialize(searchBarContainer as HTMLElement);
    }

    /**
     * 정렬 버튼을 초기화합니다.
     */
    private initializeSortButton(): void {
        if (!this.containerEl) return;
        
        // 정렬 버튼 찾기
        this.sortButton = this.containerEl.querySelector('.card-navigator-sort-button');
        if (!this.sortButton) return;
        
        // 정렬 버튼 클릭 이벤트 설정
        this.sortButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.openSortMenu(this.sortButton as HTMLElement);
        });
    }

    /**
     * 폴더 경로 표시를 초기화합니다.
     */
    private initializeFolderPathDisplay(): void {
        if (!this.containerEl) return;
        
        // 폴더 경로 표시 요소 찾기
        this.folderPathDisplay = this.containerEl.querySelector('.card-navigator-folder-path');
        
        // 현재 폴더 가져오기
        this.cardContainer.getCurrentFolder().then(folder => {
            if (folder && this.folderPathDisplay) {
                this.updateFolderPathDisplay(folder);
            }
        });
    }

    /**
     * 설정 버튼을 초기화합니다.
     */
    private initializeSettingsButton(): void {
        if (!this.containerEl) return;
        
        // 설정 버튼 찾기
        this.settingsButton = this.containerEl.querySelector('.card-navigator-settings-button');
        if (!this.settingsButton) return;
        
        // 설정 버튼 클릭 이벤트 설정
        this.settingsButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.openSettingsMenu(this.settingsButton as HTMLElement);
        });
    }

    /**
     * 정렬 메뉴를 엽니다.
     * @param targetEl 메뉴를 열 대상 요소
     */
    private openSortMenu(targetEl: HTMLElement): void {
        // 전체 툴바 컨테이너를 전달
        toggleSort(this.plugin, this.containerEl);
    }

    /**
     * 설정 메뉴를 엽니다.
     * @param targetEl 메뉴를 열 대상 요소
     */
    private openSettingsMenu(targetEl: HTMLElement): void {
        toggleSettings(this.plugin, targetEl);
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
