import { setIcon, TFolder, FuzzySuggestModal, Menu, MenuItem, debounce } from 'obsidian';
import CardNavigatorPlugin from '../../../main';
import { CardNavigatorView } from '../../views/CardNavigatorView';
import { SearchInput } from './search/SearchInput';
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
    private searchInput: SearchInput;
    //#endregion

    //#region 초기화 및 정리
    // 생성자: 툴바 초기화
    constructor(private plugin: CardNavigatorPlugin) {
        this.searchInput = new SearchInput(plugin);
    }

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

        toolbarContainer.appendChild(this.searchInput.createSearchInput());
        toolbarContainer.appendChild(this.createSeparator());
        toolbarContainer.appendChild(this.createActionIconsContainer());
    }

    // 툴바에 대한 구분 요소를 생성
    private createSeparator(): HTMLElement {
        return createDiv('toolbar-separator');
    }

    // 작업 아이콘(폴더 선택, 정렬, 설정)을 위한 컨테이너를 생성
    private createActionIconsContainer(): HTMLElement {
        const container = createDiv('card-navigator-action-icons-container');
    
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
                action: () => toggleSort(this.plugin, this.containerEl) 
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
            // autoApplyPresets 상태에 따라 강조 클래스 토글
            this.settingsIcon.classList.toggle('card-navigator-settings-active', this.plugin.settings.autoApplyPresets);
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
