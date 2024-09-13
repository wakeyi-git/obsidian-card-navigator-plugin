import { WorkspaceLeaf, TFile, TFolder, Notice } from "obsidian";
import CardNavigatorPlugin from 'main';
import { CardMaker } from './cardMaker';
import { KeyboardNavigator } from '../../common/keyboardNavigator';
import { sortFiles, separateFrontmatterAndContent } from 'common/utils';
import { Card, SortCriterion, SortOrder } from 'common/types';
import { t } from "i18next";

export class CardContainer {
    private containerEl: HTMLElement | null = null;
    private cardMaker: CardMaker;
    public isVertical: boolean;
    private cardGap: number;
    private keyboardNavigator: KeyboardNavigator | null = null;
    private cards: Card[] = [];

    constructor(private plugin: CardNavigatorPlugin, private leaf: WorkspaceLeaf) {
        this.cardMaker = new CardMaker(this.plugin);
        this.isVertical = false;
        this.cardGap = this.getCSSVariable('--card-navigator-gap', 10);
    }

    // Retrieves the value of a CSS variable. If not available, returns a default value.
    private getCSSVariable(variableName: string, defaultValue: number): number {
        const valueStr = getComputedStyle(document.documentElement)
            .getPropertyValue(variableName)
            .trim();
        return parseInt(valueStr) || defaultValue;
    }

    // Initializes the card container with necessary settings and prepares it for use.
    async initialize(containerEl: HTMLElement) {
        this.containerEl = containerEl;
        await this.waitForLeafCreation();
        this.updateContainerStyle();
        this.keyboardNavigator = new KeyboardNavigator(this.plugin, this, this.containerEl);
        await this.refresh();
    }

    // Waits for the container element to be fully rendered before continuing.
    private async waitForLeafCreation(): Promise<void> {
        return new Promise((resolve) => {
            const checkLeaf = () => {
                if (this.containerEl && this.containerEl.offsetWidth > 0 && this.containerEl.offsetHeight > 0) {
                    resolve();
                } else {
                    requestAnimationFrame(checkLeaf);
                }
            };
            checkLeaf();
        });
    }

    // Sets the layout orientation of the cards (vertical or horizontal).
    setOrientation(isVertical: boolean) {
        this.isVertical = isVertical;
        this.updateContainerStyle();
    }

    // Updates the container's styles based on the current plugin settings.
    private updateContainerStyle() {
        if (this.containerEl) {
            this.containerEl.classList.add('card-navigator-container');
            this.containerEl.classList.toggle('vertical', this.isVertical);
            this.containerEl.classList.toggle('horizontal', !this.isVertical);
            this.containerEl.classList.toggle('align-height', this.plugin.settings.alignCardHeight);
            this.containerEl.classList.toggle('flexible-height', !this.plugin.settings.alignCardHeight);

            this.containerEl.style.setProperty('--cards-per-view', this.plugin.settings.cardsPerView.toString());
        }
    }

    // Refreshes the card container by fetching the current folder, sorting files, and rendering the cards.
    async refresh() {
        const folder = await this.getCurrentFolder();
        if (!folder || !this.containerEl) return;

        this.updateContainerStyle();

        const files = folder.children.filter((file): file is TFile => file instanceof TFile);
        const sortedFiles = this.sortFiles(files);
        const cardsData = await this.createCardsData(sortedFiles);

        await this.renderCards(cardsData);
    }

    // Retrieves the current folder from which to display cards, either selected or active.
    private async getCurrentFolder(): Promise<TFolder | null> {
        if (this.plugin.settings.useSelectedFolder && this.plugin.settings.selectedFolder) {
            const abstractFile = this.plugin.app.vault.getAbstractFileByPath(this.plugin.settings.selectedFolder);
            return abstractFile instanceof TFolder ? abstractFile : null;
        } else {
            const activeFile = this.plugin.app.workspace.getActiveFile();
            return activeFile?.parent || null;
        }
    }

    // Sorts the files based on the plugin's current sort criteria.
    private sortFiles(files: TFile[]): TFile[] {
        const mdFiles = files.filter(file => file.extension === 'md');
        return sortFiles(mdFiles, this.plugin.settings.sortCriterion, this.plugin.settings.sortOrder);
    }

    // Retrieves the file associated with a given card element.
    public getFileFromCard(cardElement: HTMLElement): TFile | null {
        if (!this.containerEl) return null;
        const cardIndex = Array.from(this.containerEl.children).indexOf(cardElement);
        if (cardIndex !== -1 && cardIndex < this.cards.length) {
            return this.cards[cardIndex].file;
        }
        return null;
    }

    // Focuses on the keyboard navigator to allow keyboard-based navigation.
    public focusNavigator() {
        this.keyboardNavigator?.focusNavigator();
    }
    
    // Removes focus from the keyboard navigator.
    public blurNavigator() {
        this.keyboardNavigator?.blurNavigator();
    }

    // Centers a specific card within the container, either horizontally or vertically.
    public centerCard(card: HTMLElement) {
        if (!this.containerEl) return;

        const containerRect = this.containerEl.getBoundingClientRect();
        const cardRect = card.getBoundingClientRect();

        if (this.isVertical) {
            const containerCenter = containerRect.top + containerRect.height / 2;
            const cardCenter = cardRect.top + cardRect.height / 2;
            const offset = cardCenter - containerCenter;

            this.containerEl.scrollBy({
                top: offset,
                behavior: 'smooth'
            });
        } else {
            const containerCenter = containerRect.left + containerRect.width / 2;
            const cardCenter = cardRect.left + cardRect.width / 2;
            const offset = cardCenter - containerCenter;

            this.containerEl.scrollBy({
                left: offset,
                behavior: 'smooth'
            });
        }
    }

    // Creates card data objects for a list of files.
    private async createCardsData(files: TFile[]): Promise<Card[]> {
        const mdFiles = files.filter(file => file.extension === 'md');
        return Promise.all(mdFiles.map(file => this.cardMaker.createCard(file)));
    }

    // Renders the card elements inside the container.
    private async renderCards(cardsData: Card[]) {
        if (!this.containerEl) return;

        const containerEl = this.containerEl;
        const currentScrollTop = containerEl.scrollTop;
        const currentScrollLeft = containerEl.scrollLeft;

        // Saves the index of the currently focused card.
        const focusedCardIndex = Array.from(containerEl.children).findIndex(
            child => child.classList.contains('card-navigator-focused')
        );

        containerEl.empty();

        this.cards = cardsData;

        cardsData.forEach((cardData, index) => {
            const cardEl = this.cardMaker.createCardElement(cardData);
            containerEl.appendChild(cardEl);

            cardEl.classList.add(this.isVertical ? 'vertical' : 'horizontal');
            cardEl.classList.toggle('align-height', this.plugin.settings.alignCardHeight);
            cardEl.classList.toggle('card-navigator-active', cardData.file === this.plugin.app.workspace.getActiveFile());
            cardEl.classList.toggle('card-navigator-focused', index === focusedCardIndex);
        });

        containerEl.scrollTop = currentScrollTop;
        containerEl.scrollLeft = currentScrollLeft;

        const newActiveCardIndex = Array.from(containerEl.children).findIndex(
            child => child.classList.contains('card-navigator-active')
        );

        if (newActiveCardIndex !== -1) {
            this.scrollToActiveCard(false);
        }

        void this.ensureCardSizesAreSet();
    }

    // Clears the 'focused' status from all card elements.
    public clearFocusedCards() {
        if (!this.containerEl) return;
        Array.from(this.containerEl.children).forEach((card) => {
            card.classList.remove('card-navigator-focused');
        });
    }

    // Ensures the size of the cards is properly set after rendering.
    private async ensureCardSizesAreSet(): Promise<void> {
        return new Promise((resolve) => {
            const checkSizes = () => {
                const firstCard = this.containerEl?.querySelector('.card-navigator-card') as HTMLElement;
                if (firstCard && firstCard.offsetWidth > 0 && firstCard.offsetHeight > 0) {
                    resolve();
                } else {
                    requestAnimationFrame(checkSizes);
                }
            };
            checkSizes();
        });
    }

    // Scrolls to the currently active card, centering it within the container.
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
            const containerVisibleHeight = containerRect.height;
            offset = activeCardRect.top - containerRect.top - (containerVisibleHeight - cardHeight) / 2;
            scrollProperty = 'scrollTop';
        } else {
            const containerVisibleWidth = containerRect.width;
            offset = activeCardRect.left - containerRect.left - (containerVisibleWidth - cardWidth) / 2;
            scrollProperty = 'scrollLeft';
        }

        const newScrollPosition = this.containerEl[scrollProperty] + offset;

        if (animate) {
            this.smoothScroll(scrollProperty, newScrollPosition);
        } else {
            this.containerEl[scrollProperty] = newScrollPosition;
        }
    }

    // Smoothly scrolls to a target position in the container.
    private smoothScroll(scrollProperty: 'scrollTop' | 'scrollLeft', targetPosition: number) {
        if (!this.containerEl) return;

        const startPosition = this.containerEl[scrollProperty];
        const distance = targetPosition - startPosition;
        const duration = 300; // ms
        let startTime: number | null = null;

        const animation = (currentTime: number) => {
            if (startTime === null) startTime = currentTime;
            const timeElapsed = currentTime - startTime;
            const progress = Math.min(timeElapsed / duration, 1);
            const easeProgress = 0.5 - Math.cos(progress * Math.PI) / 2;

            if (this.containerEl) {
                this.containerEl[scrollProperty] = startPosition + distance * easeProgress;
            }

            if (timeElapsed < duration && this.containerEl) {
                requestAnimationFrame(animation);
            }
        };

        requestAnimationFrame(animation);
    }

    // Centers the currently active card.
    public centerActiveCard() {
        this.scrollToActiveCard(true);
    }

    // Retrieves the size of the card elements, including the gap between them.
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

    // Scrolls the container up by a specified number of cards.
    scrollUp(count = 1) {
        if (!this.containerEl) return;
        const { height } = this.getCardSize();
        const scrollAmount = height * count;
        this.containerEl.scrollBy({
            top: -scrollAmount,
            behavior: 'smooth'
        });
    }

    // Scrolls the container down by a specified number of cards.
    scrollDown(count = 1) {
        if (!this.containerEl) return;
        const { height } = this.getCardSize();
        const scrollAmount = height * count;
        this.containerEl.scrollBy({
            top: scrollAmount,
            behavior: 'smooth'
        });
    }

    // Scrolls the container to the left by a specified number of cards.
    scrollLeft(count = 1) {
        if (!this.containerEl) return;
        const { width } = this.getCardSize();
        const scrollAmount = width * count;
        this.containerEl.scrollBy({
            left: -scrollAmount,
            behavior: 'smooth'
        });
    }

    // Scrolls the container to the right by a specified number of cards.
    scrollRight(count = 1) {
        if (!this.containerEl) return;
        const { width } = this.getCardSize();
        const scrollAmount = width * count;
        this.containerEl.scrollBy({
            left: scrollAmount,
            behavior: 'smooth'
        });
    }

    // Displays the cards based on the filtered files.
    public async displayCards(filteredFiles: TFile[]) {
        const sortedFiles = this.sortFiles(filteredFiles);
        const cardsData = await this.createCardsData(sortedFiles);
        await this.renderCards(cardsData);
    }

    // Searches for cards by file content or file name and displays them.
    public async searchCards(searchTerm: string) {
        const folder = await this.getCurrentFolder();
        if (!folder) return;

        const files = folder.children.filter((file): file is TFile => file instanceof TFile);
        const filteredFiles = await this.filterFilesByContent(files, searchTerm);

        await this.displayCards(filteredFiles);
    }

    // Filters files based on their content or name.
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

    // Displays cards for a specific folder.
    public async displayCardsForFolder(folder: TFolder) {
        const files = folder.children.filter((file): file is TFile => file instanceof TFile);
        await this.displayCards(files);
    }

    // Sorts the cards based on a given criterion and order.
    public async sortCards(criterion: SortCriterion, order: SortOrder) {
        this.plugin.settings.sortCriterion = criterion;
        this.plugin.settings.sortOrder = order;
        await this.plugin.saveSettings();
        await this.refresh();
    }

    // Copies the link to a file to the clipboard.
    public copyLink(file: TFile) {
        const link = this.plugin.app.fileManager.generateMarkdownLink(file, '');
        navigator.clipboard.writeText(link).then(() => {
            new Notice(t('Link copied to clipboard'));
        }).catch(err => {
            console.error(t('Failed to copy link: '), err);
            new Notice(t('Failed to copy link'));
        });
    }

    // Copies the content of a card to the clipboard.
    public async copyCardContent(file: TFile) {
        try {
            const content = await this.plugin.app.vault.read(file);
            const { cleanContent } = separateFrontmatterAndContent(content);
            const truncatedContent = this.truncateContent(cleanContent);
            await navigator.clipboard.writeText(truncatedContent);
            new Notice(t('Card content copied to clipboard'));
        } catch (err) {
            console.error(t('Failed to copy card content: '), err);
            new Notice(t('Failed to copy card content'));
        }
    }

    // Truncates card content if it's longer than the allowed maximum length.
    private truncateContent(content: string): string {
        if (this.plugin.settings.isContentLengthUnlimited) {
            return content;
        }
        const maxLength = this.plugin.settings.contentLength;
        return content.length <= maxLength ? content : `${content.slice(0, maxLength)}...`;
    }

    // Cleans up event listeners when the card container is closed.
    onClose() {
        this.plugin.app.workspace.off('active-leaf-change', this.plugin.triggerRefresh);
        this.plugin.app.vault.off('modify', this.plugin.triggerRefresh);
    }
}
