//src/ui/cardNavigator.ts

import { ItemView, WorkspaceLeaf, Menu } from "obsidian";
import CardNavigatorPlugin from '../main';
import { Toolbar } from './toolbar/toolbar';
import { CardContainer } from './cardContainer/cardContainer';
import { KeyboardNavigator } from "../common/keyboardNavigator";
import { t } from 'i18next';

export const VIEW_TYPE_CARD_NAVIGATOR = "card-navigator-view";

export class CardNavigator extends ItemView {
    public toolbar: Toolbar;
    public cardContainer: CardContainer;
    private resizeObserver: ResizeObserver;
    private isVertical: boolean;
    private keyboardNavigator: KeyboardNavigator;

    constructor(leaf: WorkspaceLeaf, private plugin: CardNavigatorPlugin) {
        super(leaf);
        this.toolbar = new Toolbar(this.plugin);
        this.cardContainer = new CardContainer(this.plugin, this.leaf);
        this.isVertical = this.calculateIsVertical();
        this.resizeObserver = new ResizeObserver(this.handleResize.bind(this));
        this.keyboardNavigator = new KeyboardNavigator(this.plugin, this.cardContainer, this.containerEl.children[1] as HTMLElement);
    }

    getViewType(): string {
        return VIEW_TYPE_CARD_NAVIGATOR;
    }

    getDisplayText(): string {
        return t("Card Navigator");
    }

    getIcon(): string {
        return "layers-3";
    }

    private calculateIsVertical(): boolean {
        const { width, height } = this.leaf.view.containerEl.getBoundingClientRect();
        return height > width;
    }

    private handleResize() {
        const newIsVertical = this.calculateIsVertical();
        if (newIsVertical !== this.isVertical) {
            this.isVertical = newIsVertical;
            this.updateLayoutAndRefresh();
        }
    }

    public openContextMenu() {
        const focusedCard = this.getFocusedCard();
        if (!focusedCard) return;

        const file = this.cardContainer.getFileFromCard(focusedCard);
        if (!file) return;

        const menu = new Menu();

        // 기존 옵시디언 파일 메뉴 항목 추가
        this.plugin.app.workspace.trigger('file-menu', menu, file, 'more-options');

        // 구분선 추가
        menu.addSeparator();

        // 링크 복사 메뉴 항목 추가
        menu.addItem((item) => {
            item
                .setTitle(t('Copy as Link'))
                .setIcon('link')
                .onClick(() => {
                    this.cardContainer.copyLink(file);
                });
        });

        // 카드 내용 복사 메뉴 항목 추가
        menu.addItem((item) => {
            item
                .setTitle(t('Copy Card Content'))
                .setIcon('file-text')
                .onClick(() => {
                    this.cardContainer.copyCardContent(file);
                });
        });

        // 포커스된 카드의 위치에 메뉴 표시
        const rect = focusedCard.getBoundingClientRect();
        menu.showAtPosition({ x: rect.left, y: rect.bottom });
    }

	public focusNavigator() {
    this.keyboardNavigator.focusNavigator();
}

    private getFocusedCard(): HTMLElement | null {
        return this.containerEl.querySelector('.card-navigator-card.card-navigator-focused');
    }

    public updateLayoutAndRefresh() {
        this.cardContainer.setOrientation(this.isVertical);
        this.toolbar.setOrientation(this.isVertical);
        this.refresh();
    }

    async onOpen() {
        const container = this.containerEl.children[1] as HTMLElement;
        container.empty();

        const navigatorEl = container.createDiv('card-navigator');
    
        const toolbarEl = navigatorEl.createDiv('card-navigator-toolbar');
        const cardContainerEl = navigatorEl.createDiv('card-navigator-container');

        this.toolbar.initialize(toolbarEl);
        this.cardContainer.initialize(cardContainerEl);
        this.keyboardNavigator = new KeyboardNavigator(this.plugin, this.cardContainer, cardContainerEl);

        this.isVertical = this.calculateIsVertical();
        this.updateLayoutAndRefresh();
        this.resizeObserver.observe(this.leaf.view.containerEl);

        await this.refresh();
        await this.centerActiveCardOnOpen();
    }

    private async centerActiveCardOnOpen() {
        if (this.plugin.settings.centerActiveCardOnOpen) {
            setTimeout(() => {
                this.cardContainer.centerActiveCard();
            }, 200);
        }
    }

    async onClose() {
        this.resizeObserver.disconnect();
        this.toolbar.onClose();
        this.cardContainer.onClose();
		this.keyboardNavigator.blurNavigator(); 
    }

    async refresh() {
        await this.toolbar.refresh();
        await this.cardContainer.refresh();
    }
}
