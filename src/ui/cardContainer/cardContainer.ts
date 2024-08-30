// src/ui/cardContainer/cardContainer.ts

import { WorkspaceLeaf, TFile, TFolder } from "obsidian";
import CardNavigatorPlugin from 'main';
import { CardMaker } from './cardMaker'
import { sortFiles } from '../../common/utils';
import { Card, SortCriterion } from '../../common/types';

export class CardContainer {
    private leaf: WorkspaceLeaf;
    private containerEl: HTMLElement | null = null;
    private cardMaker: CardMaker;
    private plugin: CardNavigatorPlugin;
    public isVertical: boolean;
    private toolbarHeight: number;
    private cardGap: number;
    private containerPadding: number;

    constructor(plugin: CardNavigatorPlugin, leaf: WorkspaceLeaf) {
        this.plugin = plugin;
        this.leaf = leaf;
        this.cardMaker = new CardMaker(this.plugin);
        this.isVertical = false;
        this.toolbarHeight = this.getCSSVariable('--card-navigator-toolbar-height', 50);
        this.cardGap = this.getCSSVariable('--card-navigator-gap', 10);
        this.containerPadding = this.getCSSVariable('--card-navigator-container-padding', 10);
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
        this.refresh();
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
            this.plugin.app.workspace.on('active-leaf-change', () => {
                this.plugin.triggerRefresh();
            })
        );
        this.plugin.registerEvent(
            this.plugin.app.vault.on('modify', () => {
                this.plugin.triggerRefresh();
            })
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
            this.containerEl.classList.toggle('fixed-height', this.plugin.settings.fixedCardHeight);
            this.containerEl.classList.toggle('flexible-height', !this.plugin.settings.fixedCardHeight);

            // CSS variables
            this.containerEl.style.setProperty('--cards-per-view', this.plugin.settings.cardsPerView.toString());
            this.containerEl.style.setProperty('--card-navigator-gap', `${this.cardGap}px`);
            this.containerEl.style.setProperty('--card-navigator-toolbar-height', `${this.toolbarHeight}px`);

            if (this.isVertical) {
                this.containerEl.style.flexDirection = 'column';
                this.containerEl.style.overflowY = 'auto';
                this.containerEl.style.overflowX = 'hidden';
                this.containerEl.style.height = `calc(100% - ${this.toolbarHeight}px)`;
                this.containerEl.style.marginTop = `${this.toolbarHeight}px`;
				this.containerEl.style.gap = `${this.cardGap}px`;
				this.containerEl.style.marginRight = `-10px`;
				this.containerEl.style.paddingRight = `${this.containerPadding}px`;
            } else {
                this.containerEl.style.flexDirection = 'row';
                this.containerEl.style.overflowX = 'auto';
                this.containerEl.style.overflowY = 'hidden';
                this.containerEl.style.height = '100%';
                this.containerEl.style.marginTop = '0';
				this.containerEl.style.gap = `${this.cardGap}px`;
                this.containerEl.style.paddingTop = `${this.containerPadding}px`;
				this.containerEl.style.paddingBottom = `${this.containerPadding}px`;
            }
        }
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

        const files = folder.children.filter((file): file is TFile => file instanceof TFile);
        const sortedFiles = sortFiles(files, this.plugin.settings.sortCriterion, this.plugin.settings.sortOrder);
        const cardsData = await Promise.all(sortedFiles.map(file => this.cardMaker.createCard(file)));

        this.renderCards(cardsData);
    }

	private renderCards(cardsData: Card[]) {
		const containerEl = this.containerEl;
		if (!containerEl) return;
	
		// Store the current scroll position
		const currentScrollTop = containerEl.scrollTop;
		const currentScrollLeft = containerEl.scrollLeft;
	
		// Find the active card's index before clearing
		const activeCardIndex = Array.from(containerEl.children).findIndex(
			child => child.classList.contains('card-navigator-active')
		);
	
		containerEl.innerHTML = '';
	
		const containerHeight = containerEl.clientHeight;
		const availableHeight = containerHeight - this.toolbarHeight;
	
		cardsData.forEach((cardData, index) => {
			const card = this.cardMaker.createCardElement(cardData);
			card.style.flexShrink = '0';
	
			if (this.isVertical) {
				card.style.width = '100%';
				if (this.plugin.settings.fixedCardHeight) {
					card.style.height = `${availableHeight / this.plugin.settings.cardsPerView}px`;
					card.style.overflow = 'auto';
				} else {
					card.style.height = 'auto';
					card.style.minHeight = `${availableHeight / this.plugin.settings.cardsPerView / 2}px`;
					card.style.maxHeight = `${availableHeight / 2}px`;
				}
			} else {
				card.style.width = `${100 / this.plugin.settings.cardsPerView}%`;
				card.style.height = '100%';
			}
	
			if (cardData.file === this.plugin.app.workspace.getActiveFile()) {
				card.classList.add('card-navigator-active');
			}
	
			containerEl.appendChild(card);
		});
	
		// Restore the scroll position
		containerEl.scrollTop = currentScrollTop;
		containerEl.scrollLeft = currentScrollLeft;
	
		// If the active card has moved, scroll to it
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
	
		let offset = 0;
		let scrollProperty: 'scrollTop' | 'scrollLeft';
	
		if (this.isVertical) {
			const containerCenter = containerRect.top + containerRect.height / 2;
			const cardCenter = activeCardRect.top + activeCardRect.height / 2;
			offset = cardCenter - containerCenter;
			scrollProperty = 'scrollTop';
		} else {
			const containerCenter = containerRect.left + containerRect.width / 2;
			const cardCenter = activeCardRect.left + activeCardRect.width / 2;
			offset = cardCenter - containerCenter;
			scrollProperty = 'scrollLeft';
		}
	
		// Check if the card is already in view
		const threshold = 50; // px
		if (Math.abs(offset) < threshold) return;
	
		// Calculate the new scroll position
		const newScrollPosition = this.containerEl[scrollProperty] + offset;
	
		if (animate) {
			// Animate the scroll
			const start = this.containerEl[scrollProperty];
			const change = newScrollPosition - start;
			const duration = 300; // ms
			let startTime: number | null = null;
	
			const animateScroll = (currentTime: number) => {
				if (startTime === null) startTime = currentTime;
				const timeElapsed = currentTime - startTime;
				const progress = Math.min(timeElapsed / duration, 1);
				const easeProgress = 0.5 - Math.cos(progress * Math.PI) / 2; // easeInOutSine
	
				if (this.containerEl) {
					this.containerEl[scrollProperty] = start + change * easeProgress;
				}
	
				if (timeElapsed < duration && this.containerEl) {
					requestAnimationFrame(animateScroll);
				}
			};
	
			requestAnimationFrame(animateScroll);
		} else {
			// Instant scroll without animation
			this.containerEl[scrollProperty] = newScrollPosition;
		}
	}
	
	public centerActiveCard() {
		this.scrollToActiveCard(true);
	}

    scrollUp(count = 1) {
        if (!this.containerEl) return;
        if (this.isVertical) {
            const scrollAmount = this.getCardHeight() * count;
            this.containerEl.scrollBy({ top: -scrollAmount, behavior: 'smooth' });
        } else {
            // 가로 모드에서는 왼쪽으로 스크롤
            const scrollAmount = this.getCardWidth() * count;
            this.containerEl.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
        }
    }

    scrollDown(count = 1) {
        if (!this.containerEl) return;
        if (this.isVertical) {
            const scrollAmount = this.getCardHeight() * count;
            this.containerEl.scrollBy({ top: scrollAmount, behavior: 'smooth' });
        } else {
            // 가로 모드에서는 오른쪽으로 스크롤
            const scrollAmount = this.getCardWidth() * count;
            this.containerEl.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    }

    scrollLeft(count = 1) {
        if (!this.containerEl) return;
        const scrollAmount = this.getCardWidth() * count;
        this.containerEl.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    }

    scrollRight(count = 1) {
        if (!this.containerEl) return;
        const scrollAmount = this.getCardWidth() * count;
        this.containerEl.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }

    private getCardHeight(): number {
        if (!this.containerEl) return 0;
        const firstCard = this.containerEl.querySelector('.card-navigator-card');
        return firstCard ? firstCard.clientHeight : 0;
    }

    private getCardWidth(): number {
        if (!this.containerEl) return 0;
        const firstCard = this.containerEl.querySelector('.card-navigator-card');
        return firstCard ? firstCard.clientWidth : 0;
    }

    scrollToCenter() {
        this.scrollToActiveCard();
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
        const cards = await Promise.all(files.map(file => this.cardMaker.createCard(file)));
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

    public async sortCards(criterion: SortCriterion, order: 'asc' | 'desc') {
        this.plugin.settings.sortCriterion = criterion;
        this.plugin.settings.sortOrder = order;
        await this.plugin.saveSettings();
        this.plugin.triggerRefresh();
    }

    onClose() {}
}
