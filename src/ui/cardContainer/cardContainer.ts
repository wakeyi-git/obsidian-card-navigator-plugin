// src/ui/cardContainer/cardContainer.ts

import { WorkspaceLeaf, TFile, TFolder } from "obsidian";
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
	private animationQueue: (() => Promise<void>)[] = [];

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

    private updateContainerStyle() {
        if (this.containerEl) {
            this.containerEl.style.display = 'flex';
            this.containerEl.style.flexDirection = this.isVertical ? 'column' : 'row';
            this.containerEl.style.overflowX = this.isVertical ? 'hidden' : 'auto';
            this.containerEl.style.overflowY = this.isVertical ? 'auto' : 'hidden';
			this.containerEl.style.marginTop = this.isVertical ? 'var(--card-navigator-toolbar-height)' : '0';
			this.containerEl.style.padding = this.isVertical ? '0' : '1rem';
            this.containerEl.style.width = '100%';
        }
    }

	private renderCards(cardsData: Card[], cardWidth: number, cardHeight: number) {
		const containerEl = this.containerEl;
		if (!containerEl) return;
	
		containerEl.innerHTML = '';
	
        cardsData.forEach((cardData) => {
            const card = this.cardMaker.createCardElement(cardData);
            card.style.width = `${cardWidth}px`;
            card.style.flexShrink = '0';

            if (this.plugin.settings.fixedCardHeight) {
                card.style.height = `${cardHeight}px`;
                card.style.overflow = 'hidden';
            } else {
                card.style.height = 'auto';
                card.style.maxHeight = 'none';
            }

            containerEl.appendChild(card);
	
			// 이미지 로딩 처리
			if (this.plugin.settings.renderContentAsHtml) {
				card.querySelectorAll('img').forEach((img: HTMLImageElement) => {
					img.addEventListener('load', () => {
						this.adjustCardSize(card);
					});
				});
			}
	
			// 활성 카드 처리
			if (cardData.file === this.plugin.app.workspace.getActiveFile()) {
				card.classList.add('card-navigator-active');
			}
		});
	
		// 스크롤 위치 조정
		if (this.plugin.settings.centerCardMethod === 'scroll') {
			this.scrollToActiveCard();
		}
	}

    private scrollToActiveCard() {
        if (!this.containerEl) return;
        const activeCard = this.containerEl.querySelector('.card-navigator-active') as HTMLElement;
        if (activeCard) {
            if (this.isVertical) {
                const containerTop = this.containerEl.scrollTop;
                const containerHeight = this.containerEl.clientHeight;
                const activeCardTop = activeCard.offsetTop;
                const activeCardHeight = activeCard.clientHeight;
                const scrollTop = activeCardTop - containerTop - (containerHeight / 2) + (activeCardHeight / 2);
                this.containerEl.scrollTop += scrollTop;
            } else {
                const containerLeft = this.containerEl.scrollLeft;
                const containerWidth = this.containerEl.clientWidth;
                const activeCardLeft = activeCard.offsetLeft;
                const activeCardWidth = activeCard.clientWidth;
                const scrollLeft = activeCardLeft - containerLeft - (containerWidth / 2) + (activeCardWidth / 2);
                this.containerEl.scrollLeft += scrollLeft;
            }
        }
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

    scrollUp(amount: 'single' | 'multiple') {
        if (!this.containerEl) return;
        const scrollAmount = amount === 'single' ? this.cardHeight : this.cardHeight * this.plugin.settings.cardsPerView;
        this.containerEl.scrollBy({ top: -scrollAmount, behavior: 'smooth' });
    }

    scrollDown(amount: 'single' | 'multiple') {
        if (!this.containerEl) return;
        const scrollAmount = amount === 'single' ? this.cardHeight : this.cardHeight * this.plugin.settings.cardsPerView;
        this.containerEl.scrollBy({ top: scrollAmount, behavior: 'smooth' });
    }

    scrollLeft(amount: 'single' | 'multiple') {
        if (!this.containerEl) return;
        const scrollAmount = amount === 'single' ? this.cardWidth : this.cardWidth * this.plugin.settings.cardsPerView;
        this.containerEl.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    }

    scrollRight(amount: 'single' | 'multiple') {
        if (!this.containerEl) return;
        const scrollAmount = amount === 'single' ? this.cardWidth : this.cardWidth * this.plugin.settings.cardsPerView;
        this.containerEl.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }

    scrollToCenter() {
        if (!this.containerEl) return;
        const activeCard = this.containerEl.querySelector('.card-navigator-active') as HTMLElement;
        if (activeCard) {
            activeCard.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
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
        let folder: TFolder | null = null;

        if (this.plugin.settings.useSelectedFolder && this.plugin.settings.selectedFolder) {
            folder = this.plugin.app.vault.getAbstractFileByPath(this.plugin.settings.selectedFolder) as TFolder;
        } else {
            const activeFile = this.plugin.app.workspace.getActiveFile();
            folder = activeFile?.parent || null;
        }

        if (!folder || !this.containerEl) {
            return;
        }

        setContainerSize(this.containerEl, this.cardWidth, this.cardHeight, this.plugin.settings.cardsPerView, this.isVertical);

        const files = folder.children.filter((file): file is TFile => file instanceof TFile);
        const sortedFiles = sortFiles(files, this.plugin.settings.sortCriterion, this.plugin.settings.sortOrder);
        const cardsData = await Promise.all(sortedFiles.map(file => this.cardMaker.createCard(file)));
        
        if (this.plugin.settings.centerCardMethod === 'centered') {
            await this.renderCenteredCards(cardsData);
        } else {
            this.renderCards(cardsData, this.cardWidth, this.cardHeight);
        }
    }

    private adjustCardSize(card: HTMLElement) {
        const content = card.querySelector('.card-navigator-content');
        if (content instanceof HTMLElement) {
            if (this.plugin.settings.fixedCardHeight) {
                content.style.maxHeight = `${card.clientHeight - 40}px`; // 40px는 대략적인 여백
                content.style.overflow = 'hidden';
            } else {
                content.style.maxHeight = 'none';
                content.style.overflow = 'visible';
            }
        }
    }

    private async renderCenteredCards(cardsData: Card[]) {
        if (!this.containerEl) return;

        const activeFile = this.plugin.app.workspace.getActiveFile();
        const activeIndex = cardsData.findIndex(card => card.file === activeFile);

        if (activeIndex === -1) {
            this.renderCards(cardsData, this.cardWidth, this.cardHeight);
            return;
        }

        this.containerEl.innerHTML = '';

        const cardSpacing = 10;
        const containerSize = this.isVertical ? this.containerEl.clientHeight : this.containerEl.clientWidth;

        const padding = this.isVertical ? parseFloat(getComputedStyle(this.containerEl).paddingTop) : parseFloat(getComputedStyle(this.containerEl).paddingLeft);
        const activeCardOffset = (containerSize - (this.isVertical ? this.cardHeight : this.cardWidth)) / 2 + padding;

        // Render active card
        const activeCard = this.cardMaker.createCardElement(cardsData[activeIndex]);
        activeCard.classList.add('card-navigator-active');
        this.setCardPosition(activeCard, activeCardOffset, 9999);
        this.containerEl.appendChild(activeCard);

        // Prepare animation queue
        this.animationQueue = [];

        // Reorder cards: maintain sort order but center active card
        const reorderedCards = this.reorderCardsFromCenter(cardsData, activeIndex);

        // Render other cards
        reorderedCards.forEach((card, index) => {
            if (!this.containerEl) return;

            const cardEl = this.cardMaker.createCardElement(card);

            // Calculate final position
            const finalOffset = this.calculateCardOffset(activeCardOffset, index + 1, cardSpacing);
            this.setCardPosition(cardEl, finalOffset, reorderedCards.length - index);
            cardEl.style.opacity = '0';

            this.containerEl.appendChild(cardEl);
            this.queueAnimation(cardEl, index);
        });

        // Start animations
        this.startAnimations();
    }

    private reorderCardsFromCenter(cards: Card[], centerIndex: number): Card[] {
        const reorderedCards: Card[] = [];
        let leftIndex = centerIndex - 1;
        let rightIndex = centerIndex + 1;

        while (leftIndex >= 0 || rightIndex < cards.length) {
            if (leftIndex >= 0) {
                reorderedCards.push(cards[leftIndex]);
                leftIndex--;
            }
            if (rightIndex < cards.length) {
                reorderedCards.push(cards[rightIndex]);
                rightIndex++;
            }
        }

        return reorderedCards;
    }

    private calculateCardOffset(activeCardOffset: number, index: number, spacing: number): number {
        const cardSize = this.isVertical ? this.cardHeight : this.cardWidth;
        const direction = index % 2 === 0 ? 1 : -1; // Alternate between positive and negative
        const distance = Math.ceil(index / 2);
        return activeCardOffset + direction * distance * (cardSize + spacing);
    }

    private setCardPosition(card: HTMLElement, offset: number, zIndex: number) {
        card.style.position = 'absolute';
        if (this.isVertical) {
            card.style.top = `${offset}px`;
            card.style.left = '0';
        } else {
            card.style.left = `${offset}px`;
            card.style.top = '0';
        }
        card.style.width = `${this.cardWidth}px`;
        card.style.height = `${this.cardHeight}px`;
        card.style.transition = `opacity ${this.plugin.settings.animationDuration}ms ease-in-out`;
        card.style.zIndex = zIndex.toString();
    }

    private queueAnimation(card: HTMLElement, index: number) {
        const animate = () => new Promise<void>(resolve => {
            const delay = index * (this.plugin.settings.animationDuration / 4);
            setTimeout(() => {
                card.style.opacity = '1';
                card.addEventListener('transitionend', () => resolve(), { once: true });
            }, delay);
        });
        this.animationQueue.push(animate);
    }

    private async startAnimations() {
        for (const animate of this.animationQueue) {
            await animate();
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
	
		const cards = await Promise.all(filteredFiles.map(file => this.cardMaker.createCard(file)));
		this.renderCards(cards, this.cardWidth, this.cardHeight);
	}
	
	async displayCardsForFolder(folder: TFolder) {
		const files = folder.children.filter((file): file is TFile => file instanceof TFile);
		const cards = await Promise.all(files.map(file => this.cardMaker.createCard(file)));
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
        this.plugin.settings.sortCriterion = criterion;
        this.plugin.settings.sortOrder = order;
        await this.plugin.saveSettings();
        this.refresh();
    }

    onClose() {}
}
