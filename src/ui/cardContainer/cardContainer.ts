import { WorkspaceLeaf, TFile, TFolder, Notice, debounce } from "obsidian";
import CardNavigatorPlugin from 'main';
import { CardMaker } from './cardMaker';
import { LayoutStrategy } from '../layouts/layoutStrategy';
import { ListLayout } from '../layouts/listLayout';
import { GridLayout } from '../layouts/gridLayout';
import { MasonryLayout } from '../layouts/masonryLayout';
import { KeyboardNavigator } from '../../common/keyboardNavigator';
import { CardNavigatorSettings } from "common/types";
import { sortFiles, separateFrontmatterAndBody } from 'common/utils';
import { Card, SortCriterion, SortOrder } from 'common/types';
import { t } from "i18next";

// Main class for managing the card container and its layout
export class CardContainer {
    private containerEl: HTMLElement;
    private cardMaker: CardMaker;
    private layoutStrategy: LayoutStrategy;
	private currentLayout: CardNavigatorSettings['defaultLayout'];
    public isVertical: boolean;
    private cardGap: number;
    private keyboardNavigator: KeyboardNavigator | null = null;
    private cards: Card[] = [];
    private resizeObserver: ResizeObserver;
	private focusedCardId: string | null = null;

    constructor(private plugin: CardNavigatorPlugin, private leaf: WorkspaceLeaf) {
		// leaf의 view를 통해 컨테이너 요소에 접근
		const leafView = this.leaf.view;
		if (!leafView || !leafView.containerEl) {
			throw new Error('Invalid leaf view or container');
		}
	
		// 새로운 div 요소를 생성하고 leaf의 컨테이너에 추가
		this.containerEl = leafView.containerEl.createDiv('card-navigator-container');
		
		if (!this.containerEl) {
			throw new Error('Failed to create container element');
		}
	
        this.cardMaker = new CardMaker(
            this.plugin,
            (file: TFile) => this.copyLink(file),
            (file: TFile) => this.copyCardContent(file)
        );
	
		this.isVertical = this.calculateIsVertical();
		this.cardGap = this.getCSSVariable('--card-navigator-gap', 10);
		
        try {
            this.layoutStrategy = this.determineAutoLayout();
        } catch (error) {
            console.error('Failed to determine layout strategy:', error);
            this.layoutStrategy = new ListLayout(this.isVertical, this.cardGap, this.plugin.settings.alignCardHeight);
        }

        if (this.layoutStrategy instanceof MasonryLayout && this.containerEl) {
            this.layoutStrategy.setContainer(this.containerEl);
        }
	
		this.resizeObserver = new ResizeObserver(debounce(() => {
			this.handleResize();
		}, 100));
	
		// ResizeObserver 설정
		this.setupResizeObserver();
	
		// 키보드 네비게이터 초기화
		this.initializeKeyboardNavigator();

        this.currentLayout = this.plugin.settings.defaultLayout; // 초기 레이아웃 설정
	}
	
	private setupResizeObserver() {
		this.resizeObserver = new ResizeObserver(() => {
			this.updateLayout();
		});
		this.resizeObserver.observe(this.containerEl);
		this.updateLayout(); // 즉시 한 번 실행
	}
	
	private initializeKeyboardNavigator() {
		if (this.containerEl) {
			this.keyboardNavigator = new KeyboardNavigator(this.plugin, this, this.containerEl);
		} else {
			console.warn('Container element not available for KeyboardNavigator');
		}
	}

	// Determines whether the container should be considered vertical
	private calculateIsVertical(): boolean {
		if (!this.containerEl) return true;
		const { width, height } = this.containerEl.getBoundingClientRect();
		return height > width;
	}

    // Retrieves the value of a CSS variable, or returns a default value if not found
	private getCSSVariable(variableName: string, defaultValue: number): number {
		if (!this.containerEl) return defaultValue;
		const valueStr = getComputedStyle(this.containerEl).getPropertyValue(variableName).trim();
		return parseInt(valueStr) || defaultValue;
	}

    // Initializes the card container with necessary settings and prepares it for use
	async initialize(containerEl: HTMLElement) {
		this.containerEl = containerEl;
		await this.waitForContainerSize();
		this.updateContainerStyle();
		this.keyboardNavigator = new KeyboardNavigator(this.plugin, this, this.containerEl);
		this.setupResizeObserver();
		this.layoutStrategy = this.determineAutoLayout();
	}
	
	private waitForContainerSize(): Promise<void> {
		return new Promise((resolve) => {
			const checkSize = () => {
				if (this.containerEl && this.containerEl.offsetWidth > 0 && this.containerEl.offsetHeight > 0) {
					resolve();
				} else {
					requestAnimationFrame(checkSize);
				}
			};
			checkSize();
		});
	}

	// Updates the container's styles based on the current plugin settings
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
	
	// Refreshes the card container by fetching the current folder, sorting files, and rendering the cards
	public async refresh() {
		const folder = await this.getCurrentFolder();
		if (!folder || !this.containerEl) return;

		this.updateContainerStyle();

		const files = folder.children.filter((file): file is TFile => file instanceof TFile);
		const sortedFiles = this.sortFiles(files);
		const cardsData = await this.createCardsData(sortedFiles);

		await this.renderCards(cardsData);
	}

    // Updates the container settings based on the provided partial settings
	updateSettings(settings: Partial<CardNavigatorSettings>) {
        if (settings.alignCardHeight !== undefined) {
            this.plugin.settings.alignCardHeight = settings.alignCardHeight;
        }
        if (settings.bodyLengthLimit !== undefined) {
            this.plugin.settings.bodyLengthLimit = settings.bodyLengthLimit;
        }
        if (settings.bodyLength !== undefined) {
            this.plugin.settings.bodyLength = settings.bodyLength;
        }
    }

	// Determines the appropriate layout strategy based on the container size and plugin settings
    private determineAutoLayout(): LayoutStrategy {
        if (!this.containerEl) {
            throw new Error('Container element is not initialized');
        }

        const containerStyle = window.getComputedStyle(this.containerEl);
        const containerWidth = this.containerEl.offsetWidth;
        const paddingLeft = parseFloat(containerStyle.paddingLeft) || 0;
        const paddingRight = parseFloat(containerStyle.paddingRight) || 0;
        const availableWidth = containerWidth - paddingLeft - paddingRight;
        
        const {
            alignCardHeight,
            cardWidthThreshold,
            defaultLayout
        } = this.plugin.settings;

        if (defaultLayout !== 'auto') {
            switch (defaultLayout) {
                case 'list':
                    return new ListLayout(this.isVertical, this.cardGap, alignCardHeight);
                case 'grid':
                    return new GridLayout(this.plugin.settings.gridColumns, this.cardGap, this.plugin.settings);
                case 'masonry': {
                    const masonryLayout = new MasonryLayout(
                        this.plugin.settings.masonryColumns,
                        this.cardGap,
                        this.plugin.settings,
                        this.cardMaker
                    );
                    masonryLayout.setContainer(this.containerEl);
                    return masonryLayout;
                }
            }
        }

        // Calculate the number of columns
        let columns = Math.floor((availableWidth + this.cardGap) / (cardWidthThreshold + this.cardGap));
        columns = Math.max(1, columns); // Ensure at least one column

        // Adjust gap for single column layout
        const adjustedGap = columns === 1 ? Math.min(this.cardGap, 10) : this.cardGap;

        if (columns === 1) {
            return new ListLayout(this.isVertical, adjustedGap, alignCardHeight);
        } else if (alignCardHeight) {
            return new GridLayout(columns, this.cardGap, this.plugin.settings);
        } else {
            const masonryLayout = new MasonryLayout(columns, this.cardGap, this.plugin.settings, this.cardMaker);
            masonryLayout.setContainer(this.containerEl);
            return masonryLayout;
        }
    }

	private updateLayout() {
		if (!this.containerEl) return;
		const newIsVertical = this.calculateIsVertical();
		const previousIsVertical = this.isVertical;
		this.isVertical = newIsVertical;
	
		if (this.plugin.settings.defaultLayout === 'auto' || 
			this.plugin.settings.defaultLayout === 'list' || 
			previousIsVertical !== this.isVertical) {
			this.layoutStrategy = this.determineAutoLayout();
		}
	
		this.keyboardNavigator?.updateLayout(this.layoutStrategy);
		this.refresh();
	}
	
	public handleResize() {
		this.updateLayout();
	}

    // Returns the current layout strategy
	public getLayoutStrategy(): LayoutStrategy {
		return this.layoutStrategy;
	}

	// Sets the layout strategy based on the provided layout type
    setLayout(layout: CardNavigatorSettings['defaultLayout']) {
        const { gridColumns, alignCardHeight } = this.plugin.settings;

        // 현재 레이아웃을 업데이트
        this.currentLayout = layout;

        if (layout === 'auto') {
            this.layoutStrategy = this.determineAutoLayout();
        } else {
            switch (layout) {
                case 'list':
                    this.layoutStrategy = new ListLayout(this.isVertical, this.cardGap, alignCardHeight);
                    break;
                case 'grid':
                    this.layoutStrategy = new GridLayout(gridColumns, this.cardGap, this.plugin.settings);
                    break;
				case 'masonry':
					this.layoutStrategy = new MasonryLayout(
						this.plugin.settings.masonryColumns,
						this.cardGap,
						this.plugin.settings,
						this.cardMaker
					);
					if (this.containerEl) {
						(this.layoutStrategy as MasonryLayout).setContainer(this.containerEl);
					}
					break;
			}
		}
		
		// 키보드 내비게이터 업데이트
		this.keyboardNavigator?.updateLayout(this.layoutStrategy);
	}


    // Checks if the current layout is a grid layout
    public isGridLayout(): boolean {
        return this.layoutStrategy instanceof GridLayout;
    }

    // Sets the layout orientation of the cards (vertical or horizontal)
    setOrientation(isVertical: boolean) {
        this.isVertical = isVertical;
        this.updateContainerStyle();
    }

    // Retrieves the current folder from which to display cards, either selected or active
    private async getCurrentFolder(): Promise<TFolder | null> {
        if (this.plugin.settings.useSelectedFolder && this.plugin.settings.selectedFolder) {
            const abstractFile = this.plugin.app.vault.getAbstractFileByPath(this.plugin.settings.selectedFolder);
            return abstractFile instanceof TFolder ? abstractFile : null;
        } else {
            const activeFile = this.plugin.app.workspace.getActiveFile();
            return activeFile?.parent || null;
        }
    }

    // Sorts the files based on the plugin's current sort criteria
    private sortFiles(files: TFile[]): TFile[] {
        const mdFiles = files.filter(file => file.extension === 'md');
        return sortFiles(mdFiles, this.plugin.settings.sortCriterion, this.plugin.settings.sortOrder);
    }

    // Retrieves the file associated with a given card element
    public getFileFromCard(cardElement: HTMLElement): TFile | null {
        if (!this.containerEl) return null;
        const cardIndex = Array.from(this.containerEl.children).indexOf(cardElement);
        if (cardIndex !== -1 && cardIndex < this.cards.length) {
            return this.cards[cardIndex].file;
        }
        return null;
    }

    // Focuses on the keyboard navigator to allow keyboard-based navigation
    public focusNavigator() {
        this.keyboardNavigator?.focusNavigator();
    }
    
    // Removes focus from the keyboard navigator
    public blurNavigator() {
        this.keyboardNavigator?.blurNavigator();
    }

    // Creates card data objects for a list of files
	private async createCardsData(files: TFile[]): Promise<Card[]> {
		const mdFiles = files.filter(file => file.extension === 'md');
		try {
			return await Promise.all(mdFiles.map(file => this.cardMaker.createCard(file)));
		} catch (error) {
			console.error('카드 데이터 생성 중 오류 발생:', error);
			return [];
		}
	}

    // Renders the card elements inside the container
	private async renderCards(cardsData: Card[]) {
        if (!this.containerEl) return;
    
        if (!cardsData || cardsData.length === 0) {
            console.warn('The card data is empty.');
            return;
        }

        if (!this.layoutStrategy) {
            console.error('The layout strategy has not been set.');
            return;
        }

        const containerEl = this.containerEl;
        const currentScrollTop = containerEl.scrollTop;
        const currentScrollLeft = containerEl.scrollLeft;
    
        // Store the focused card index before clearing the container
        const focusedCardIndex = Array.from(containerEl.children).findIndex(
            child => child.classList.contains('card-navigator-focused')
        );
    
        const containerRect = containerEl.getBoundingClientRect();
        const containerStyle = window.getComputedStyle(this.containerEl);
        const paddingLeft = parseFloat(containerStyle.paddingLeft);
        const paddingRight = parseFloat(containerStyle.paddingRight);
        const paddingTop = parseFloat(containerStyle.paddingTop);
        const availableWidth = containerRect.width - paddingLeft - paddingRight;

        // Apply container styles for List layout
        if (this.layoutStrategy instanceof ListLayout) {
            const listContainerStyle = this.layoutStrategy.getContainerStyle();
            Object.assign(containerEl.style, listContainerStyle);
        } else {
            // Reset styles for other layouts
            containerEl.style.display = '';
            containerEl.style.flexDirection = '';
            containerEl.style.gap = '';
            containerEl.style.alignItems = '';
            containerEl.style.overflowY = '';
            containerEl.style.height = '100%';
        }

        const cardPositions = this.layoutStrategy.arrange(
            cardsData,
            availableWidth,
            containerRect.height,
            this.plugin.settings.cardsPerView
        );
	
		if (cardPositions.length !== cardsData.length) {
			console.warn('Card positions and card data length mismatch. Adjusting...');
			const minLength = Math.min(cardPositions.length, cardsData.length);
			cardsData = cardsData.slice(0, minLength);
			cardPositions.length = minLength;
		}

		this.focusedCardId = this.getFocusedCardId();
	
        containerEl.empty();
        this.cards = cardsData;
    
        cardPositions.forEach((position, index) => {
            const card = cardsData[index];
            const cardEl = this.cardMaker.createCardElement(card);

            if (this.layoutStrategy instanceof ListLayout) {
                const cardStyle = this.layoutStrategy.getCardStyle();
                Object.assign(cardEl.style, cardStyle);
            } else {
                const position = cardPositions[index];
                cardEl.style.position = 'absolute';
                cardEl.style.left = `${position.x + paddingLeft}px`;
                cardEl.style.top = `${position.y + paddingTop}px`;
                cardEl.style.width = `${position.width}px`;
                cardEl.style.height = typeof position.height === 'number' ? `${position.height}px` : position.height;
            }

            containerEl.appendChild(cardEl);

            cardEl.classList.add(this.layoutStrategy.getScrollDirection() === 'vertical' ? 'vertical' : 'horizontal');
            cardEl.classList.toggle('align-height', this.plugin.settings.alignCardHeight);
            cardEl.classList.toggle('card-navigator-active', card.file === this.plugin.app.workspace.getActiveFile());
            
            // Restore the focused state
            if (index === focusedCardIndex) {
                cardEl.classList.add('card-navigator-focused');
            }

			if (card.file.path === this.focusedCardId) {
                cardEl.classList.add('card-navigator-focused');
            }

            containerEl.appendChild(cardEl);
        });

        containerEl.scrollTop = currentScrollTop;
        containerEl.scrollLeft = currentScrollLeft;

        const newActiveCardIndex = Array.from(containerEl.children).findIndex(
            child => child.classList.contains('card-navigator-active')
        );

        if (newActiveCardIndex !== -1) {
            this.scrollToActiveCard(false);
        }

        this.updateScrollDirection();
        void this.ensureCardSizesAreSet();
    }

	private getFocusedCardId(): string | null {
        if (!this.containerEl) return null;
        const focusedCard = this.containerEl.querySelector('.card-navigator-focused') as HTMLElement;
        return focusedCard ? focusedCard.dataset.cardId || null : null;
    }

    public focusCard(cardId: string) {
        this.focusedCardId = cardId;
        this.updateFocusedCard();
    }

    private updateFocusedCard() {
        if (!this.containerEl || !this.focusedCardId) return;
        
        const cards = this.containerEl.querySelectorAll('.card-navigator-card');
        cards.forEach(card => {
            if (card instanceof HTMLElement) {
                if (card.dataset.cardId === this.focusedCardId) {
                    card.classList.add('card-navigator-focused');
                } else {
                    card.classList.remove('card-navigator-focused');
                }
            }
        });
    }

	// Updates the scroll direction of the container element based on the layout strategy
	private updateScrollDirection() {
		if (!this.containerEl) return;
		const scrollDirection = this.layoutStrategy.getScrollDirection();
		this.containerEl.style.overflowY = scrollDirection === 'vertical' ? 'auto' : 'hidden';
		this.containerEl.style.overflowX = scrollDirection === 'horizontal' ? 'auto' : 'hidden';
	}

	// Clears the 'focused' status from all card elements
	public clearFocusedCards() {
		if (!this.containerEl) return;
		Array.from(this.containerEl.children).forEach((card) => {
			card.classList.remove('card-navigator-focused');
		});
	}

	// Ensures the size of the cards is properly set after rendering
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

	// Scrolls to the currently active card, centering it within the container
	private scrollToActiveCard(animate = true) {
		if (!this.containerEl) return;
		const activeCard = this.containerEl.querySelector('.card-navigator-active') as HTMLElement | null;
		if (!activeCard) return;

		this.centerCard(activeCard, animate);
	}

	// Centers a specific card within the container, either horizontally or vertically
	public centerCard(card: HTMLElement, animate = true) {
		if (!this.containerEl) return;

		const containerRect = this.containerEl.getBoundingClientRect();
		const cardRect = card.getBoundingClientRect();

		let offset = 0;
		let scrollProperty: 'scrollTop' | 'scrollLeft';

		if (this.isVertical) {
			const containerVisibleHeight = containerRect.height;
			offset = cardRect.top - containerRect.top - (containerVisibleHeight - cardRect.height) / 2;
			scrollProperty = 'scrollTop';
		} else {
			const containerVisibleWidth = containerRect.width;
			offset = cardRect.left - containerRect.left - (containerVisibleWidth - cardRect.width) / 2;
			scrollProperty = 'scrollLeft';
		}

		const newScrollPosition = this.containerEl[scrollProperty] + offset;

		if (animate) {
			this.smoothScroll(scrollProperty, newScrollPosition);
		} else {
			this.containerEl[scrollProperty] = newScrollPosition;
		}
	}

	// Smoothly scrolls to a target position in the container
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

	// Centers the currently active card
	public centerActiveCard() {
		this.scrollToActiveCard(true);
	}

	// Retrieves the size of the card elements, including the gap between them
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

	// Scrolls the container in the specified direction by a given number of cards
	private scrollInDirection(direction: 'up' | 'down' | 'left' | 'right', count = 1) {
		if (!this.containerEl) return;
		const { width, height } = this.getCardSize();
		const cardsPerView = this.plugin.settings.cardsPerView;
		const totalCards = this.cards.length;
		const isVertical = this.layoutStrategy.getScrollDirection() === 'vertical';
		
		const cardSize = isVertical ? height : width;
		const currentScroll = isVertical ? this.containerEl.scrollTop : this.containerEl.scrollLeft;
		const totalSize = totalCards * cardSize;
		const containerSize = isVertical ? this.containerEl.clientHeight : this.containerEl.clientWidth;
		
		let targetScroll;
		if (count === cardsPerView) { // Page Up/Left or Page Down/Right
			const currentEdgeCard = Math.floor((currentScroll + (direction === 'down' || direction === 'right' ? containerSize : 0)) / cardSize);
			if (direction === 'up' || direction === 'left') {
				if (currentEdgeCard < cardsPerView) {
					targetScroll = 0; // Scroll to the very start
				} else {
					targetScroll = Math.max(0, (currentEdgeCard - cardsPerView) * cardSize);
				}
			} else { // down or right
				if (totalCards - currentEdgeCard < cardsPerView) {
					targetScroll = totalSize - containerSize; // Scroll to the very end
				} else {
					targetScroll = Math.min(totalSize - containerSize, (currentEdgeCard + 1) * cardSize);
				}
			}
		} else {
			const scrollAmount = cardSize * count;
			if (direction === 'up' || direction === 'left') {
				targetScroll = Math.max(0, currentScroll - scrollAmount);
			} else {
				targetScroll = Math.min(totalSize - containerSize, currentScroll + scrollAmount);
			}
		}

		this.containerEl.scrollTo({
			[isVertical ? 'top' : 'left']: targetScroll,
			behavior: 'smooth'
		});
	}

	// Scrolls the container upwards by a specified number of cards
	scrollUp(count = 1) {
		this.scrollInDirection('up', count);
	}

	// Scrolls the container downwards by a specified number of cards
	scrollDown(count = 1) {
		this.scrollInDirection('down', count);
	}

	// Scrolls the container to the left by a specified number of cards
	scrollLeft(count = 1) {
		this.scrollInDirection('left', count);
	}

	// Scrolls the container to the right by a specified number of cards
	scrollRight(count = 1) {
		this.scrollInDirection('right', count);
	}

	// Displays the cards based on the filtered files
	public async displayCards(filteredFiles: TFile[]) {
		const sortedFiles = this.sortFiles(filteredFiles);
		const cardsData = await this.createCardsData(sortedFiles);
		await this.renderCards(cardsData);
	}

	// Searches for cards by file body or file name and displays them
	public async searchCards(searchTerm: string) {
		const folder = await this.getCurrentFolder();
		if (!folder) return;

		const files = folder.children.filter((file): file is TFile => file instanceof TFile);
		const filteredFiles = await this.filterFilesByContent(files, searchTerm);

		await this.displayCards(filteredFiles);
	}

	// Filters files based on their body or name
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

	// Displays cards for a specific folder
	public async displayCardsForFolder(folder: TFolder) {
		const files = folder.children.filter((file): file is TFile => file instanceof TFile);
		await this.displayCards(files);
	}

	// Sorts the cards based on a given criterion and order
	public async sortCards(criterion: SortCriterion, order: SortOrder) {
		this.plugin.settings.sortCriterion = criterion;
		this.plugin.settings.sortOrder = order;
		await this.plugin.saveSettings();
	}

	// Copies the link to a file to the clipboard
	public copyLink(file: TFile) {
		const link = this.plugin.app.fileManager.generateMarkdownLink(file, '');
		navigator.clipboard.writeText(link).then(() => {
			new Notice(t('LINK_COPIED_TO_CLIPBOARD'));
		}).catch(err => {
			console.error(t('FAILED_TO_COPY_LINK'), err);
			new Notice(t('FAILED_TO_COPY_LINK'));
		});
	}

	// Copies the content of a card to the clipboard
	public async copyCardContent(file: TFile) {
		try {
			const content = await this.plugin.app.vault.read(file);
			const { cleanBody } = separateFrontmatterAndBody(content);
			const truncatedBody = this.truncateBody(cleanBody);
			await navigator.clipboard.writeText(truncatedBody);
			new Notice(t('CARD_CONTENT_COPIED_TO_CLIPBOARD'));
		} catch (err) {
			console.error(t('FAILED_TO_COPY_CARD_CONTENT'), err);
			new Notice(t('FAILED_TO_COPY_CARD_CONTENT'));
		}
	}

	// Truncates card body if it's longer than the allowed maximum length
	private truncateBody(body: string): string {
		if (!this.plugin.settings.bodyLengthLimit) {
			return body;
		}
		const maxLength = this.plugin.settings.bodyLength;
		return body.length <= maxLength ? body : `${body.slice(0, maxLength)}...`;
	}

	// Cleans up event listeners when the card container is closed
	onClose() {
		this.plugin.app.workspace.off('active-leaf-change', this.plugin.triggerRefresh);
		this.plugin.app.vault.off('modify', this.plugin.triggerRefresh);
		if (this.resizeObserver) {
			this.resizeObserver.disconnect();
		}
	}
}
