//src/ui/cardContainer/cardContainer.ts

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

    private getCSSVariable(variableName: string, defaultValue: number): number {
        const valueStr = getComputedStyle(document.documentElement)
            .getPropertyValue(variableName)
            .trim();
        return parseInt(valueStr) || defaultValue;
    }

    async initialize(containerEl: HTMLElement) {
        this.containerEl = containerEl;
        await this.waitForLeafCreation();
        this.updateContainerStyle();
        this.keyboardNavigator = new KeyboardNavigator(this.plugin, this, this.containerEl);
        await this.refresh();
    }

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

    setOrientation(isVertical: boolean) {
        this.isVertical = isVertical;
        this.updateContainerStyle();
    }

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

	async refresh() {
		const folder = await this.getCurrentFolder();
		if (!folder || !this.containerEl) return;
	
		this.updateContainerStyle();
	
		const files = folder.children.filter((file): file is TFile => file instanceof TFile);
		const sortedFiles = this.sortFiles(files);
		const cardsData = await this.createCardsData(sortedFiles);
	
		await this.renderCards(cardsData);
	}

    private async getCurrentFolder(): Promise<TFolder | null> {
        if (this.plugin.settings.useSelectedFolder && this.plugin.settings.selectedFolder) {
            const abstractFile = this.plugin.app.vault.getAbstractFileByPath(this.plugin.settings.selectedFolder);
            return abstractFile instanceof TFolder ? abstractFile : null;
        } else {
            const activeFile = this.plugin.app.workspace.getActiveFile();
            return activeFile?.parent || null;
        }
    }

    private sortFiles(files: TFile[]): TFile[] {
        const mdFiles = files.filter(file => file.extension === 'md');
        return sortFiles(mdFiles, this.plugin.settings.sortCriterion, this.plugin.settings.sortOrder);
    }

    public getFileFromCard(cardElement: HTMLElement): TFile | null {
        if (!this.containerEl) return null;
        const cardIndex = Array.from(this.containerEl.children).indexOf(cardElement);
        if (cardIndex !== -1 && cardIndex < this.cards.length) {
            return this.cards[cardIndex].file;
        }
        return null;
    }

	public focusNavigator() {
		this.keyboardNavigator?.focusNavigator();
	}
	
	public blurNavigator() {
		this.keyboardNavigator?.blurNavigator();
	}

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

    private async createCardsData(files: TFile[]): Promise<Card[]> {
        const mdFiles = files.filter(file => file.extension === 'md');
        return Promise.all(mdFiles.map(file => this.cardMaker.createCard(file)));
    }

	private async renderCards(cardsData: Card[]) {
		if (!this.containerEl) return;
	
		const containerEl = this.containerEl;
		const currentScrollTop = containerEl.scrollTop;
		const currentScrollLeft = containerEl.scrollLeft;
	
		// 현재 포커스된 카드의 인덱스를 저장
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

	public clearFocusedCards() {
		if (!this.containerEl) return;
		Array.from(this.containerEl.children).forEach((card) => {
			card.classList.remove('card-navigator-focused');
		});
	}

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

    public async displayCards(filteredFiles: TFile[]) {
        const sortedFiles = this.sortFiles(filteredFiles);
        const cardsData = await this.createCardsData(sortedFiles);
        await this.renderCards(cardsData);
    }

    public async searchCards(searchTerm: string) {
        const folder = await this.getCurrentFolder();
        if (!folder) return;

        const files = folder.children.filter((file): file is TFile => file instanceof TFile);
        const filteredFiles = await this.filterFilesByContent(files, searchTerm);

        await this.displayCards(filteredFiles);
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

    public async displayCardsForFolder(folder: TFolder) {
        const files = folder.children.filter((file): file is TFile => file instanceof TFile);
        await this.displayCards(files);
    }

    public async sortCards(criterion: SortCriterion, order: SortOrder) {
        this.plugin.settings.sortCriterion = criterion;
        this.plugin.settings.sortOrder = order;
        await this.plugin.saveSettings();
        await this.refresh();
    }

    public copyLink(file: TFile) {
        const link = this.plugin.app.fileManager.generateMarkdownLink(file, '');
        navigator.clipboard.writeText(link).then(() => {
            new Notice(t('Link copied to clipboard'));
        }).catch(err => {
            console.error(t('Failed to copy link: '), err);
            new Notice(t('Failed to copy link'));
        });
    }

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

	private truncateContent(content: string): string {
		if (this.plugin.settings.isContentLengthUnlimited) {
			return content;
		}
		const maxLength = this.plugin.settings.contentLength;
		return content.length <= maxLength ? content : `${content.slice(0, maxLength)}...`;
	}

    onClose() {
        this.plugin.app.workspace.off('active-leaf-change', this.plugin.triggerRefresh);
        this.plugin.app.vault.off('modify', this.plugin.triggerRefresh);
    }
}
