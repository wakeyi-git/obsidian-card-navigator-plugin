// src/ui/cardContainer/cardContainer.ts

import { WorkspaceLeaf, TFile } from "obsidian";
import CardNavigatorPlugin from 'main';
import { CardMaker } from './cardMaker'
import { debounce, sortFiles, setContainerSize } from '../../common/utils';
import { Card, SortCriterion } from '../../common/types';

export class CardContainer {
    private leaf: WorkspaceLeaf;
    private containerEl: HTMLElement | null = null;
    private cardMaker: CardMaker;
    private plugin: CardNavigatorPlugin;
	private isVertical: boolean;
	private cardWidth = 0;
    private cardHeight = 0;

    constructor(plugin: CardNavigatorPlugin, leaf: WorkspaceLeaf) {
        this.plugin = plugin;
        this.leaf = leaf;
        this.cardMaker = new CardMaker(this.plugin);
        this.isVertical = false;
    }

    async initialize(containerEl: HTMLElement) {
        this.containerEl = containerEl;
        await this.waitForLeafCreation();
        this.registerEvents();
        this.refresh();
    }

	setOrientation(isVertical: boolean) {
        this.isVertical = isVertical;
        this.updateContainerStyle();
    }

    setCardSize(cardWidth: number, cardHeight: number) {
        this.cardWidth = cardWidth;
        this.cardHeight = cardHeight;
    }

    getContainerEl(): HTMLElement | null {
        return this.containerEl;
    }

    getCardSizeAndOrientation() {
        return {
            cardWidth: this.cardWidth,
            cardHeight: this.cardHeight,
            isVertical: this.isVertical,
        };
    }

	private updateContainerStyle() {
        if (this.containerEl) {
            if (this.isVertical) {
                this.containerEl.classList.add('vertical');
                this.containerEl.classList.remove('horizontal');
            } else {
                this.containerEl.classList.add('horizontal');
                this.containerEl.classList.remove('vertical');
            }
        }
    }

    private async waitForLeafCreation(): Promise<void> {
        return new Promise((resolve) => {
            const checkLeaf = () => {
                if (this.containerEl && this.containerEl.getBoundingClientRect().width > 0) {
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
            this.plugin.app.workspace.on('active-leaf-change', debounce(this.refresh.bind(this), 100))
        );
        this.plugin.registerEvent(
            this.plugin.app.vault.on('modify', debounce(this.refresh.bind(this), 100))
        );
    }

	async refresh() {
		const activeFile = this.plugin.app.workspace.getActiveFile();
		if (!activeFile || !this.containerEl) {
			return;
		}
	
		setContainerSize(this.containerEl, this.cardWidth, this.cardHeight, this.plugin.settings.cardsPerView, this.isVertical);
	
		const cardsData = await this.cardMaker.getCardsForActiveFile(activeFile);
		this.renderCards(cardsData, this.cardWidth, this.cardHeight);
	}

	private renderCards(cardsData: Card[], cardWidth: number, cardHeight: number) {
		const containerEl = this.containerEl;
		if (!containerEl) return;
	
		containerEl.innerHTML = '';
		containerEl.classList.toggle('card-container-horizontal', !this.isVertical);
	
		cardsData.forEach((cardData) => {
			const card = this.cardMaker.createCardElement(cardData);
			card.classList.toggle('card-navigator-card-horizontal', !this.isVertical);
			card.style.width = `${cardWidth}px`;
			card.style.height = `${cardHeight}px`;
			containerEl.appendChild(card);
		});
	
		if (this.plugin.settings.centerCardMethod === 'scroll') {
			this.scrollToActiveCard(cardsData, cardWidth, cardHeight);
		}
	}

    private renderActiveCardCentered(cardsData: Card[], activeIndex: number, cardWidth: number, cardHeight: number) {
        const containerEl = this.containerEl;
        if (!containerEl) {
            return;
        }

        const isVertical = this.isVertical;

        const leftCards = cardsData.slice(0, activeIndex);
        const rightCards = cardsData.slice(activeIndex + 1);

        const cardSpacing = 15;
        const containerSize = isVertical ? cardHeight : cardWidth;
        const totalSize = (containerSize + cardSpacing) * this.plugin.settings.cardsPerView - cardSpacing;
        const activeCardOffset = ((totalSize - containerSize) / 2);

        let currentOffset = activeCardOffset - ((leftCards.length * containerSize) + (leftCards.length * cardSpacing));

        leftCards.forEach((cardData) => {
            const card = this.cardMaker.createCardElement(cardData);
            card.style.position = 'absolute';
            card.style.width = `${cardWidth}px`;
            card.style.height = `${cardHeight}px`;
            if (isVertical) {
                card.style.top = `${currentOffset}px`;
            } else {
                card.style.left = `${currentOffset}px`;
            }
            containerEl.appendChild(card);
            currentOffset += containerSize + cardSpacing;
        });

        const activeCard = this.cardMaker.createCardElement(cardsData[activeIndex]);
        activeCard.style.position = 'absolute';
        activeCard.style.width = `${cardWidth}px`;
        activeCard.style.height = `${cardHeight}px`;
        if (isVertical) {
            activeCard.style.top = `${activeCardOffset}px`;
        } else {
            activeCard.style.left = `${activeCardOffset}px`;
        }
        containerEl.appendChild(activeCard);

        currentOffset = activeCardOffset + containerSize + cardSpacing;
        rightCards.forEach((cardData) => {
            const card = this.cardMaker.createCardElement(cardData);
            card.style.position = 'absolute';
            card.style.width = `${cardWidth}px`;
            card.style.height = `${cardHeight}px`;
            if (isVertical) {
                card.style.top = `${currentOffset}px`;
            } else {
                card.style.left = `${currentOffset}px`;
            }
            containerEl.appendChild(card);
            currentOffset += containerSize + cardSpacing;
        });
    }

	private scrollToActiveCard(cardsData: Card[], cardWidth: number, cardHeight: number) {
        const containerEl = this.containerEl;
        if (!containerEl) {
            return;
        }

        containerEl.innerHTML = '';

        let activeCard: HTMLElement | null = null;

        cardsData.forEach((cardData) => {
            const card = this.cardMaker.createCardElement(cardData);
            card.style.width = `${cardWidth}px`;
            card.style.height = `${cardHeight}px`;
            containerEl.appendChild(card);

            if (card.classList.contains('card-navigator-active')) {
                activeCard = card;
            }
        });

        if (activeCard && this.plugin.settings.centerCardMethod === 'scroll') {
            (activeCard as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
        }
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
	
		const cards = await Promise.all(filteredFiles.map(async file => ({
			file,
			fileName: this.plugin.settings.showFileName ? file.basename : undefined,
			firstHeader: this.plugin.settings.showFirstHeader ? await this.findFirstHeader(file) : undefined,
			content: this.plugin.settings.showContent ? await this.getFileContent(file) : undefined,
		})));
	
		this.renderCards(cards, this.cardWidth, this.cardHeight);
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

	public async sortCards(criterion: SortCriterion, order: 'asc' | 'desc') {
		const activeFile = this.plugin.app.workspace.getActiveFile();
		if (!activeFile) return;
	
		const folder = activeFile.parent;
		if (!folder) return;
	
		const files = folder.children.filter((file): file is TFile => file instanceof TFile);
		const sortedFiles = sortFiles(files, criterion, order);
	
		const cards = await Promise.all(sortedFiles.map(async file => ({
			file,
			fileName: this.plugin.settings.showFileName ? file.basename : undefined,
			firstHeader: this.plugin.settings.showFirstHeader ? await this.findFirstHeader(file) : undefined,
			content: this.plugin.settings.showContent ? await this.getFileContent(file) : undefined,
		})));
	
		this.renderCards(cards, this.cardWidth, this.cardHeight);
	}
	
	private async findFirstHeader(file: TFile): Promise<string | undefined> {
		const content = await this.plugin.app.vault.cachedRead(file);
		const headerRegex = /^#+\s+(.+)$/m;
		const match = content.match(headerRegex);
		return match ? match[1].trim() : undefined;
	}
	
	private async getFileContent(file: TFile): Promise<string> {
		const content = await this.plugin.app.vault.cachedRead(file);
		const maxLength = this.plugin.settings.contentLength * 100;
		return content.length <= maxLength ? content : content.slice(0, maxLength) + '...';
	}

    onClose() {}
}
