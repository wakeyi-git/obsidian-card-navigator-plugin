import { TFile, MarkdownRenderer, MarkdownView, Component } from 'obsidian';
import CardNavigatorPlugin from 'main';
import { Card } from 'common/types';
import { sortFiles, separateFrontmatterAndBody } from 'common/utils';
import { CardInteractionManager } from './cardInteractionManager';

type CardElementTag = 'div' | 'h3' | 'h4';

export class CardMaker extends Component {
    private readonly MAX_CACHE_SIZE = 100;
    private readonly MAX_CONCURRENT_RENDERS = 3;
    private readonly INTERSECTION_ROOT_MARGIN = '100px';
    private readonly INTERSECTION_THRESHOLD = 0.1;
    private readonly RENDER_QUEUE_INTERVAL = 50;

    private interactionManager: CardInteractionManager;
    private renderCache: Map<string, string> = new Map();
    private intersectionObserver: IntersectionObserver;
    private modifiedCards: Set<string> = new Set();
    private renderQueue: Set<string> = new Set();
    private isProcessingQueue = false;

    constructor(private plugin: CardNavigatorPlugin) {
        super();
        this.interactionManager = new CardInteractionManager(plugin);
        this.intersectionObserver = this.createIntersectionObserver();
        this.registerFileEvents();
    }

    private cleanCache() {
        if (this.renderCache.size > this.MAX_CACHE_SIZE) {
            const entriesToDelete = Array.from(this.renderCache.keys())
                .slice(0, this.renderCache.size - this.MAX_CACHE_SIZE);
            entriesToDelete.forEach(key => this.renderCache.delete(key));
        }
    }

    private registerFileEvents() {
        this.registerEvent(
            this.plugin.app.vault.on('modify', (file) => {
                if (file instanceof TFile && file.extension === 'md') {
                    this.modifiedCards.add(file.path);
                    this.renderCache.delete(file.path);
                    this.updateModifiedCard(file);
                }
            })
        );
    }

    private async updateModifiedCard(file: TFile) {
        const cardElement = document.querySelector(`[data-card-id="${file.path}"]`) as HTMLElement;
        if (cardElement) {
            const contentEl = cardElement.querySelector('.card-navigator-body') as HTMLElement;
            if (contentEl) {
                const content = await this.plugin.app.vault.cachedRead(file);
                const { cleanBody } = separateFrontmatterAndBody(content);
                await this.renderCardContent(contentEl, cleanBody, file.path);
                this.modifiedCards.delete(file.path);
            }
        }
    }

    private createIntersectionObserver(): IntersectionObserver {
        return new IntersectionObserver((entries) => {
            entries
                .filter(entry => entry.isIntersecting)
                .forEach(entry => {
                    const cardElement = entry.target as HTMLElement;
                    const filePath = cardElement.dataset.cardId;
                    if (filePath) {
                        this.renderQueue.add(filePath);
                        this.processRenderQueue();
                    }
                });
        }, {
            rootMargin: this.INTERSECTION_ROOT_MARGIN,
            threshold: this.INTERSECTION_THRESHOLD
        });
    }

    private async processRenderQueue() {
        if (this.isProcessingQueue || this.renderQueue.size === 0) return;

        this.isProcessingQueue = true;
        const itemsToProcess = Array.from(this.renderQueue).slice(0, this.MAX_CONCURRENT_RENDERS);

        for (const filePath of itemsToProcess) {
            this.renderQueue.delete(filePath);
            const cardElement = document.querySelector(`[data-card-id="${filePath}"]`) as HTMLElement;
            if (!cardElement) continue;

            const contentEl = cardElement.querySelector('.card-navigator-body') as HTMLElement;
            const content = cardElement.dataset.content;

            if (contentEl && content && this.plugin.settings.renderContentAsHtml) {
                await this.renderCardContent(contentEl, content, filePath);
            }
        }

        this.isProcessingQueue = false;
        if (this.renderQueue.size > 0) {
            setTimeout(() => this.processRenderQueue(), this.RENDER_QUEUE_INTERVAL);
        }
    }

    private async renderCardContent(contentEl: HTMLElement, content: string, filePath: string) {
        try {
            contentEl.empty();
            
            if (!this.plugin.settings.renderContentAsHtml) {
                contentEl.removeClass('html-content');
                contentEl.addClass('plain-text');
                contentEl.textContent = content;
                return;
            }

            contentEl.removeClass('plain-text');
            contentEl.addClass('html-content');

            const markdownContainer = contentEl.createDiv({
                cls: 'markdown-rendered'
            });

            // 캐시된 내용이 있고 수정되지 않은 경우 사용
            const cachedContent = this.modifiedCards.has(filePath) ? null : this.renderCache.get(filePath);
            if (cachedContent) {
                markdownContainer.innerHTML = cachedContent;
                await this.processImages(contentEl, filePath);
                return;
            }

            // 새로운 렌더링 수행
            await MarkdownRenderer.render(
                this.plugin.app,
                content,
                markdownContainer,
                filePath,
                this
            );

            // 캐시 업데이트
            this.renderCache.set(filePath, markdownContainer.innerHTML);
            this.cleanCache();
            
            await this.processImages(contentEl, filePath);
        } catch (error) {
            console.error(`Failed to render content for ${filePath}:`, error);
            contentEl.textContent = content;
        }
    }

    private async processImages(contentEl: HTMLElement, filePath: string) {
        const images = contentEl.querySelectorAll('img');
        const file = this.plugin.app.vault.getAbstractFileByPath(filePath);
        if (!file || !(file instanceof TFile)) return;

        const loadingPromises: Promise<void>[] = [];

        for (const img of Array.from(images)) {
            const src = img.getAttribute('src');
            if (!src) continue;

            try {
                if (!img.parentElement?.classList.contains('image-container')) {
                    const imgContainer = document.createElement('div');
                    imgContainer.className = 'image-container';
                    img.parentNode?.replaceChild(imgContainer, img);
                    imgContainer.appendChild(img);
                }

                img.setAttribute('loading', 'lazy');
                
                if (!src.startsWith('http')) {
                    const imgFile = this.plugin.app.metadataCache.getFirstLinkpathDest(src, filePath);
                    if (imgFile instanceof TFile) {
                        const loadPromise = new Promise<void>((resolve) => {
                            this.plugin.app.vault.readBinary(imgFile).then(imgArrayBuffer => {
                                const blob = new Blob([imgArrayBuffer]);
                                const objectUrl = URL.createObjectURL(blob);
                                img.src = objectUrl;
                                
                                img.onload = () => {
                                    URL.revokeObjectURL(objectUrl);
                                    resolve();
                                };
                                
                                img.onerror = () => {
                                    console.error(`Failed to load image: ${src}`);
                                    resolve();
                                };
                            }).catch(error => {
                                console.error(`Failed to read image file: ${src}`, error);
                                resolve();
                            });
                        });
                        
                        loadingPromises.push(loadPromise);
                    }
                }
            } catch (error) {
                console.error(`Failed to process image ${src}:`, error);
            }
        }

        await Promise.all(loadingPromises);
    }

    public async copyLink(file: TFile) {
        await this.interactionManager.copyLink(file);
    }

    public async copyCardContent(file: TFile) {
        const card = await this.createCard(file);
        await this.interactionManager.copyCardContent(card);
    }

    async getCardsForActiveFile(activeFile: TFile): Promise<Card[]> {
        const folder = activeFile.parent;
        if (!folder) return [];
        
        const files = folder.children
            .filter((file): file is TFile => file instanceof TFile && file.extension === 'md');
        
        const sortedFiles = sortFiles(files, this.plugin.settings.sortCriterion, this.plugin.settings.sortOrder);
        return Promise.all(sortedFiles.map(file => this.createCard(file)));
    }

    public async createCard(file: TFile): Promise<Card> {
        try {
            const content = await this.plugin.app.vault.cachedRead(file);
            const { cleanBody } = separateFrontmatterAndBody(content);
            const firstHeader = this.plugin.settings.showFirstHeader ? this.findFirstHeader(cleanBody) : undefined;
            const body = this.plugin.settings.showBody ? 
                this.truncateBody(this.removeFirstHeader(cleanBody)) : undefined;

            return {
                file,
                fileName: this.plugin.settings.showFileName ? file.basename : undefined,
                firstHeader,
                body,
            };
        } catch (error) {
            console.error(`Failed to create card for file ${file.path}:`, error);
            throw error;
        }
    }

    private findFirstHeader(body: string): string | undefined {
        return body.match(/^#+\s+(.+)$/m)?.[1]?.trim();
    }

    private removeFirstHeader(body: string): string {
        return body.replace(/^#+\s+(.+)$/m, '').trim();
    }

    private truncateBody(body: string): string {
        if (!this.plugin.settings.bodyLengthLimit) return body;
        const maxLength = this.plugin.settings.bodyLength;
        return body.length <= maxLength ? body : `${body.slice(0, maxLength)}...`;
    }

    createCardElement(card: Card): HTMLElement {
        const cardElement = document.createElement('div');
        cardElement.className = 'card-navigator-card';
        cardElement.dataset.cardId = card.file.path;

        this.addCardContent(cardElement, card);
        this.interactionManager.setupInteractions(cardElement, card);

        return cardElement;
    }

    private addCardContent(cardElement: HTMLElement, card: Card) {
        const { settings } = this.plugin;
        
        if (settings.showFileName && card.fileName) {
            this.createContentElement(cardElement, 'h3', card.fileName, 'filename', settings.fileNameFontSize);
        }

        if (settings.showFirstHeader && card.firstHeader) {
            this.createContentElement(cardElement, 'h4', card.firstHeader, 'first-header', settings.firstHeaderFontSize);
        }

        if (settings.showBody && card.body) {
            const contentEl = this.createContentElement(cardElement, 'div', '', 'body', settings.bodyFontSize);
            
            if (settings.renderContentAsHtml) {
                cardElement.dataset.content = card.body;
                contentEl.textContent = '로딩 중...';
                this.intersectionObserver.observe(cardElement);
            } else {
                contentEl.textContent = card.body;
                contentEl.addClass('ellipsis');
            }
        }
    }

    private createContentElement(parent: HTMLElement, tag: CardElementTag, text: string, type: string, fontSize: number): HTMLElement {
        const element = parent.createEl(tag, { 
            text, 
            cls: `card-navigator-${type}`
        });
        element.style.fontSize = `${fontSize}px`;
        return element;
    }

    public onunload() {
        this.intersectionObserver.disconnect();
        this.renderCache.clear();
        this.modifiedCards.clear();
        this.renderQueue.clear();
        super.onunload();
    }
}
