//src/ui/cardContainer/cardContainer.ts

import { WorkspaceLeaf, TFile, TFolder } from "obsidian";
import CardNavigatorPlugin from 'main';
import { CardMaker } from './cardMaker';
import { sortFiles } from 'common/utils';
import { Card, SortCriterion, SortOrder } from 'common/types';

export class CardContainer {
    private containerEl: HTMLElement | null = null;
    private cardMaker: CardMaker;
    public isVertical: boolean;
    private toolbarHeight: number;
    private cardGap: number;

    constructor(private plugin: CardNavigatorPlugin, private leaf: WorkspaceLeaf) {
        this.cardMaker = new CardMaker(this.plugin);
        this.isVertical = false;
        this.toolbarHeight = this.getCSSVariable('--card-navigator-toolbar-height', 50);
        this.cardGap = this.getCSSVariable('--card-navigator-gap', 10);
    }

    private getCSSVariable(variableName: string, defaultValue: number): number {
        const valueStr = getComputedStyle(document.documentElement)
            .getPropertyValue(variableName)
            .trim();
        return parseInt(valueStr) || defaultValue;
    }

    async initialize(containerEl: HTMLElement) {
        this.containerEl = containerEl;
        await this.waitForLeafCreation();
        this.registerEvents();
        this.updateContainerStyle();
        await this.refresh();
    }

    private async waitForLeafCreation(): Promise<void> {
        return new Promise((resolve) => {
            const checkLeaf = () => {
                if (this.containerEl && this.containerEl.getBoundingClientRect().width > 0 && this.containerEl.clientHeight > 0) {
                    resolve();
                } else {
                    requestAnimationFrame(checkLeaf);
                }
            };
            checkLeaf();
        });
    }

    private registerEvents() {
        this.plugin.registerEvent(
            this.plugin.app.workspace.on('active-leaf-change', this.plugin.triggerRefresh.bind(this.plugin))
        );
        this.plugin.registerEvent(
            this.plugin.app.vault.on('modify', this.plugin.triggerRefresh.bind(this.plugin))
        );
    }

    setOrientation(isVertical: boolean) {
        this.isVertical = isVertical;
        this.updateContainerStyle();
        this.refresh();
    }

    private updateContainerStyle() {
        if (this.containerEl) {
            this.containerEl.classList.add('card-navigator-container');
            this.containerEl.classList.toggle('vertical', this.isVertical);
            this.containerEl.classList.toggle('horizontal', !this.isVertical);
            this.containerEl.classList.toggle('align-height', this.plugin.settings.alignCardHeight);
            this.containerEl.classList.toggle('flexible-height', !this.plugin.settings.alignCardHeight);

            this.containerEl.style.setProperty('--cards-per-view', this.plugin.settings.cardsPerView.toString());
            this.containerEl.style.setProperty('--card-navigator-toolbar-height', `${this.toolbarHeight}px`);
        }
    }

    async refresh() {
        let folder: TFolder | null = null;

        if (this.plugin.settings.useSelectedFolder && this.plugin.settings.selectedFolder) {
            const abstractFile = this.plugin.app.vault.getAbstractFileByPath(this.plugin.settings.selectedFolder);
            if (abstractFile instanceof TFolder) {
                folder = abstractFile;
            } else {
                console.warn(`Selected path is not a folder: ${this.plugin.settings.selectedFolder}`);
            }
        } else {
            const activeFile = this.plugin.app.workspace.getActiveFile();
            folder = activeFile?.parent || null;
        }

        if (!folder || !this.containerEl) {
            return;
        }

        const files = folder.children.filter((file): file is TFile => file instanceof TFile);
        const sortedFiles = sortFiles(files, this.plugin.settings.sortCriterion, this.plugin.settings.sortOrder);
        const cardsData = await Promise.all(sortedFiles.map(file => this.cardMaker.createCard(file)));

        this.renderCards(cardsData);
    }

    private renderCards(cardsData: Card[]) {
        const containerEl = this.containerEl;
        if (!containerEl) return;

        const currentScrollTop = containerEl.scrollTop;
        const currentScrollLeft = containerEl.scrollLeft;

        const activeCardIndex = Array.from(containerEl.children).findIndex(
            child => child.classList.contains('card-navigator-active')
        );

        containerEl.empty();

        containerEl.classList.toggle('vertical', this.isVertical);
        containerEl.classList.toggle('horizontal', !this.isVertical);

        containerEl.style.setProperty('--cards-per-view', this.plugin.settings.cardsPerView.toString());

        cardsData.forEach((cardData, index) => {
            const card = this.cardMaker.createCardElement(cardData);

            card.classList.add(this.isVertical ? 'vertical' : 'horizontal');
            card.classList.toggle('align-height', this.plugin.settings.alignCardHeight);

            if (cardData.file === this.plugin.app.workspace.getActiveFile()) {
                card.classList.add('card-navigator-active');
            }

            containerEl.appendChild(card);
        });

        containerEl.scrollTop = currentScrollTop;
        containerEl.scrollLeft = currentScrollLeft;

        const newActiveCardIndex = Array.from(containerEl.children).findIndex(
            child => child.classList.contains('card-navigator-active')
        );

        if (activeCardIndex !== newActiveCardIndex && newActiveCardIndex !== -1) {
            this.scrollToActiveCard(false);
        }
    }

    private scrollToActiveCard(animate = true) {
        if (!this.containerEl) return;
        const activeCard = this.containerEl.querySelector('.card-navigator-active') as HTMLElement | null;
        if (!activeCard) return;

        const containerRect = this.containerEl.getBoundingClientRect();
        const activeCardRect = activeCard.getBoundingClientRect();
        const { width: cardWidth, height: cardHeight } = this.getCardSize();

        let offset = 0;
        let scrollProperty: 'scrollTop' | 'scrollLeft';

        if (this.isVertical) {
            const containerVisibleHeight = containerRect.height - this.toolbarHeight;
            offset = activeCardRect.top - containerRect.top - this.toolbarHeight - (containerVisibleHeight - cardHeight) / 2;
            scrollProperty = 'scrollTop';
        } else {
            const containerVisibleWidth = containerRect.width;
            offset = activeCardRect.left - containerRect.left - (containerVisibleWidth - cardWidth) / 2;
            scrollProperty = 'scrollLeft';
        }

        const newScrollPosition = this.containerEl[scrollProperty] + offset;

        if (animate) {
            const start = this.containerEl[scrollProperty];
            const change = newScrollPosition - start;
            const duration = 300; // ms
            let startTime: number | null = null;

            const animateScroll = (currentTime: number) => {
                if (startTime === null) startTime = currentTime;
                const timeElapsed = currentTime - startTime;
                const progress = Math.min(timeElapsed / duration, 1);
                const easeProgress = 0.5 - Math.cos(progress * Math.PI) / 2;

                if (this.containerEl) {
                    this.containerEl[scrollProperty] = start + change * easeProgress;
                }

                if (timeElapsed < duration && this.containerEl) {
                    requestAnimationFrame(animateScroll);
                }
            };

            requestAnimationFrame(animateScroll);
        } else {
            this.containerEl[scrollProperty] = newScrollPosition;
        }
    }

    public centerActiveCard() {
        this.scrollToActiveCard(true);
    }

    private getCardSize(): { width: number, height: number } {
        if (!this.containerEl) return { width: 0, height: 0 };
        const firstCard = this.containerEl.querySelector('.card-navigator-card') as HTMLElement;
        if (!firstCard) return { width: 0, height: 0 };

        const computedStyle = getComputedStyle(this.containerEl);
        const gap = parseInt(computedStyle.getPropertyValue('--card-navigator-gap') || '0', 10);

        return {
            width: firstCard.offsetWidth + gap,
            height: firstCard.offsetHeight + gap
        };
    }

    scrollUp(count = 1) {
        if (!this.containerEl) return;
        const { height } = this.getCardSize();
        const scrollAmount = height * count;
        this.containerEl.scrollBy({
            top: -scrollAmount,
            behavior: 'smooth'
        });
    }

    scrollDown(count = 1) {
        if (!this.containerEl) return;
        const { height } = this.getCardSize();
        const scrollAmount = height * count;
        this.containerEl.scrollBy({
            top: scrollAmount,
            behavior: 'smooth'
        });
    }

    scrollLeft(count = 1) {
        if (!this.containerEl) return;
        const { width } = this.getCardSize();
        const scrollAmount = width * count;
        this.containerEl.scrollBy({
            left: -scrollAmount,
            behavior: 'smooth'
        });
    }

    scrollRight(count = 1) {
        if (!this.containerEl) return;
        const { width } = this.getCardSize();
        const scrollAmount = width * count;
        this.containerEl.scrollBy({
            left: scrollAmount,
            behavior: 'smooth'
        });
    }

    public displayCards(filteredFiles: TFile[]) {
    }

    public async searchCards(searchTerm: string) {
        const activeFile = this.plugin.app.workspace.getActiveFile();
        if (!activeFile) return;

        const folder = activeFile.parent;
        if (!folder) return;

        const files = folder.children.filter((file): file is TFile => file instanceof TFile);
        const filteredFiles = await this.filterFilesByContent(files, searchTerm);

        const cards = await Promise.all(filteredFiles.map(file => this.cardMaker.createCard(file)));
        this.renderCards(cards);
    }

    async displayCardsForFolder(folder: TFolder) {
        const files = folder.children.filter((file): file is TFile => file instanceof TFile);
        const sortedFiles = sortFiles(files, this.plugin.settings.sortCriterion, this.plugin.settings.sortOrder);
        const cards = await Promise.all(sortedFiles.map(file => this.cardMaker.createCard(file)));
        this.renderCards(cards);
    }

    private async filterFilesByContent(files: TFile[], searchTerm: string): Promise<TFile[]> {
        const lowercaseSearchTerm = searchTerm.toLowerCase();
        const filteredFiles = [];
        for (const file of files) {
            const content = await this.plugin.app.vault.cachedRead(file);
            if (file.basename.toLowerCase().includes(lowercaseSearchTerm) ||
                content.toLowerCase().includes(lowercaseSearchTerm)) {
                filteredFiles.push(file);
            }
        }
        return filteredFiles;
    }

    public async sortCards(criterion: SortCriterion, order: SortOrder) {
        this.plugin.settings.sortCriterion = criterion;
        this.plugin.settings.sortOrder = order;
        await this.plugin.saveSettings();
        this.plugin.triggerRefresh();
    }

    onClose() {
        this.plugin.app.workspace.off('active-leaf-change', this.plugin.triggerRefresh);
        this.plugin.app.vault.off('modify', this.plugin.triggerRefresh);
    }
}
