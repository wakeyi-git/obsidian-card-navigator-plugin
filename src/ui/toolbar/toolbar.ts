import { setIcon, TFolder, FuzzySuggestModal } from 'obsidian';
import CardNavigatorPlugin from '../../main';
import { CardNavigatorView } from '../cardNavigatorView';
import { createSearchContainer } from './search';
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
        return createSearchContainer(this.plugin, this.containerEl);
    }

    // 툴바에 대한 구분 요소를 생성
    private createSeparator(): HTMLElement {
        return createDiv('toolbar-separator');
    }

    // 작업 아이콘(폴더 선택, 정렬, 설정)을 위한 컨테이너를 생성
    private createActionIconsContainer(): HTMLElement {
        const container = createDiv('card-navigator-action-icons-container');
    
        const icons = [
            { name: 'folder', label: t('SELECT_FOLDER'), action: () => this.openFolderSelector() },
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

    // 폴더 선택 모달을 열고 선택한 폴더의 카드를 표시
    public openFolderSelector() {
        new FolderSuggestModal(this.plugin, (folder: TFolder) => {
            const view = this.plugin.app.workspace.getActiveViewOfType(CardNavigatorView);
            if (view) {
                view.cardContainer.displayCardsForFolder(folder);
            }
        }).open();
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
    constructor(private plugin: CardNavigatorPlugin, private onSelect: (folder: TFolder) => void) {
        super(plugin.app);
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
}
