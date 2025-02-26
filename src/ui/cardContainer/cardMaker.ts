import { TFile, MarkdownRenderer, MarkdownView, Component } from 'obsidian';
import CardNavigatorPlugin from 'main';
import { Card } from 'common/types';
import { sortFiles, separateFrontmatterAndBody } from 'common/utils';
import { CardInteractionManager } from './cardInteractionManager';

type CardElementTag = 'div' | 'h3' | 'h4';

export class CardMaker extends Component {
    private readonly MAX_CACHE_SIZE = 500;
    private readonly MAX_CONCURRENT_RENDERS = 5;
    private readonly INTERSECTION_ROOT_MARGIN = '200px';
    private readonly INTERSECTION_THRESHOLD = 0.1;
    private readonly RENDER_QUEUE_INTERVAL = 50;
    private readonly RENDER_TIMEOUT = 2000;

    private interactionManager: CardInteractionManager;
    private renderCache: Map<string, string> = new Map();
    private intersectionObserver: IntersectionObserver;
    private modifiedCards: Set<string> = new Set();
    private renderQueue: Set<string> = new Set();
    private isProcessingQueue = false;
    private renderedCards: Set<string> = new Set();
    private renderTimeouts: Map<string, NodeJS.Timeout> = new Map();

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
            entriesToDelete.forEach(key => {
                this.renderCache.delete(key);
                this.renderedCards.delete(key);
            });
        }
    }

    private registerFileEvents() {
        this.registerEvent(
            this.plugin.app.vault.on('modify', async (file) => {
                if (file instanceof TFile && file.extension === 'md') {
                    const activeFile = this.plugin.app.workspace.getActiveFile();
                    if (activeFile && activeFile.path === file.path) {
                        // 캐시 초기화
                        this.modifiedCards.add(file.path);
                        this.renderCache.delete(file.path);
                        this.renderedCards.delete(file.path);

                        // 카드 내용 즉시 업데이트
                        const content = await this.plugin.app.vault.cachedRead(file);
                        const { cleanBody } = separateFrontmatterAndBody(content);
                        
                        const safeCardId = CSS.escape(file.path);
                        const cardElements = document.querySelectorAll(`.card-navigator-card[data-card-id="${safeCardId}"]`) as NodeListOf<HTMLElement>;
                        
                        for (const cardElement of Array.from(cardElements)) {
                            const contentEl = cardElement.querySelector('.card-navigator-body') as HTMLElement;
                            if (contentEl) {
                                if (this.plugin.settings.renderContentAsHtml) {
                                    // HTML 렌더링 시 기존 마크다운 컨테이너 초기화
                                    const markdownContainer = contentEl.querySelector('.markdown-rendered') as HTMLElement;
                                    if (markdownContainer) {
                                        markdownContainer.empty();
                                        markdownContainer.classList.add('loading');
                                        markdownContainer.style.opacity = '0';
                                        
                                        // 새로운 내용 렌더링
                                        await MarkdownRenderer.render(
                                            this.plugin.app,
                                            cleanBody,
                                            markdownContainer,
                                            file.path,
                                            this
                                        );
                                        
                                        // 렌더링 완료 후 표시
                                        markdownContainer.style.opacity = '1';
                                        markdownContainer.classList.remove('loading');
                                    }
                                } else {
                                    contentEl.textContent = cleanBody;
                                }
                            }
                        }
                        
                        this.modifiedCards.delete(file.path);
                    }
                }
            })
        );
    }

    private createIntersectionObserver(): IntersectionObserver {
        return new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const cardElement = entry.target as HTMLElement;
                const filePath = cardElement.getAttribute('data-original-path');
                if (!filePath) return;

                if (entry.isIntersecting) {
                    this.renderQueue.add(filePath);
                    this.processRenderQueue();
                } else {
                    this.renderQueue.delete(filePath);
                    const timeout = this.renderTimeouts.get(filePath);
                    if (timeout) {
                        clearTimeout(timeout);
                        this.renderTimeouts.delete(filePath);
                    }
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
            const safeCardId = CSS.escape(filePath);
            const cardElement = document.querySelector(`[data-card-id="${safeCardId}"]`) as HTMLElement;
            if (!cardElement) continue;

            const contentEl = cardElement.querySelector('.card-navigator-body') as HTMLElement;
            const content = cardElement.dataset.content;

            if (contentEl && content && this.plugin.settings.renderContentAsHtml) {
                const timeout = setTimeout(() => {
                    console.warn(`Rendering timeout for ${filePath}`);
                    this.renderQueue.add(filePath);
                    this.renderTimeouts.delete(filePath);
                }, this.RENDER_TIMEOUT);

                this.renderTimeouts.set(filePath, timeout);

                try {
                    await this.renderCardContent(contentEl, content, filePath);
                    this.renderedCards.add(filePath);
                } catch (error) {
                    console.error(`Failed to render card ${filePath}:`, error);
                } finally {
                    clearTimeout(timeout);
                    this.renderTimeouts.delete(filePath);
                }
            }
        }

        this.isProcessingQueue = false;
        if (this.renderQueue.size > 0) {
            setTimeout(() => this.processRenderQueue(), this.RENDER_QUEUE_INTERVAL);
        }
    }

    private async renderCardContent(contentEl: HTMLElement, content: string, filePath: string) {
        try {
            const markdownContainer = contentEl.querySelector('.markdown-rendered') as HTMLElement;
            if (!markdownContainer) return;

            // 기존 내용을 유지하면서 렌더링 준비
            // 플레이스홀더 텍스트는 유지하고 나중에 제거
            const placeholderText = markdownContainer.querySelector('.placeholder-text');
            
            // 새로운 내용을 렌더링할 임시 컨테이너 생성
            const tempContainer = document.createElement('div');
            tempContainer.style.position = 'absolute';
            tempContainer.style.visibility = 'hidden';
            tempContainer.className = 'temp-markdown-container';
            contentEl.appendChild(tempContainer);

            // 임시 컨테이너에 새 내용 렌더링
            await MarkdownRenderer.render(
                this.plugin.app,
                content,
                tempContainer,
                filePath,
                this
            );

            // 이미지 처리
            await this.processImages(tempContainer, filePath);

            // 렌더링된 내용을 실제 컨테이너로 이동
            // 플레이스홀더 텍스트 제거
            if (placeholderText) {
                placeholderText.remove();
            }
            
            // 기존 내용 제거 (플레이스홀더 제외)
            Array.from(markdownContainer.children)
                .filter(child => !child.classList.contains('placeholder-text'))
                .forEach(child => child.remove());
            
            // 새 내용 이동
            while (tempContainer.firstChild) {
                markdownContainer.appendChild(tempContainer.firstChild);
            }
            
            // 임시 컨테이너 제거
            tempContainer.remove();

            // 부드러운 전환으로 표시
            setTimeout(() => {
                markdownContainer.style.opacity = '1';
            }, 10);
            
        } catch (error) {
            console.error(`Failed to render content for ${filePath}:`, error);
            const markdownContainer = contentEl.querySelector('.markdown-rendered') as HTMLElement;
            if (markdownContainer) {
                // 플레이스홀더 텍스트 제거
                const placeholderText = markdownContainer.querySelector('.placeholder-text');
                if (placeholderText) {
                    placeholderText.remove();
                }
                
                // 오류 시 일반 텍스트로 표시
                markdownContainer.createSpan({ text: content });
                markdownContainer.style.opacity = '1';
            }
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
        // 캐시 키 생성
        const cacheKey = `${body}_${this.plugin.settings.bodyLengthLimit}_${this.plugin.settings.bodyLength}`;
        
        // 캐시된 결과가 있으면 반환
        const cachedResult = this.renderCache.get(cacheKey);
        if (cachedResult) {
            return cachedResult;
        }

        let result = body;
        if (this.plugin.settings.bodyLengthLimit) {
            const maxLength = this.plugin.settings.bodyLength;
            result = body.length <= maxLength ? body : `${body.slice(0, maxLength)}...`;
        }

        // 결과를 캐시에 저장
        this.renderCache.set(cacheKey, result);
        this.cleanCache();

        return result;
    }

    createCardElement(card: Card): HTMLElement {
        const cardElement = document.createElement('div');
        cardElement.className = 'card-navigator-card';
        cardElement.setAttribute('data-card-id', card.file.path);
        cardElement.setAttribute('data-original-path', card.file.path);

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
                
                // 마크다운 컨테이너 생성 및 스타일 개선
                const markdownContainer = contentEl.createDiv({
                    cls: 'markdown-rendered'
                });
                
                // 깜빡임 방지를 위한 스타일 설정
                markdownContainer.style.opacity = '0.3';
                markdownContainer.style.transition = 'opacity 0.2s ease-in-out';
                
                // 로딩 중 표시를 위한 임시 텍스트 추가 (깜빡임 감소)
                const placeholderText = card.body.length > 50 ? card.body.substring(0, 50) + '...' : card.body;
                markdownContainer.createSpan({ text: placeholderText, cls: 'placeholder-text' });
                
                // 인터섹션 옵저버로 뷰포트에 들어올 때 렌더링
                this.intersectionObserver.observe(cardElement);
            } else {
                contentEl.textContent = card.body;
                contentEl.addClass('ellipsis');
            }
        }
    }

    // 기존 카드 요소의 내용을 업데이트하는 public 메서드 추가
    public updateCardContent(cardElement: HTMLElement, card: Card) {
        // 기존 내용 요소 제거
        const contentElements = cardElement.querySelectorAll('.card-navigator-filename, .card-navigator-first-header, .card-navigator-body');
        contentElements.forEach(el => el.remove());
        
        // 내용 다시 추가
        this.addCardContent(cardElement, card);
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
        this.renderedCards.clear();
        this.renderTimeouts.forEach(timeout => clearTimeout(timeout));
        this.renderTimeouts.clear();
        super.onunload();
    }

    public async ensureCardRendered(cardElement: HTMLElement) {
        if (!cardElement) return;

        const contentEl = cardElement.querySelector('.card-navigator-body') as HTMLElement;
        if (!contentEl) return;

        const markdownContainer = contentEl.querySelector('.markdown-rendered') as HTMLElement;
        if (!markdownContainer) return;

        const filePath = cardElement.getAttribute('data-original-path');
        if (!filePath) return;

        const content = cardElement.dataset.content;
        if (!content) return;

        // 이미 완전히 렌더링된 경우 스킵 (플레이스홀더만 있는 경우는 렌더링 필요)
        const hasOnlyPlaceholder = markdownContainer.children.length === 1 && 
                                  markdownContainer.querySelector('.placeholder-text') !== null;
        
        if (markdownContainer.children.length > 0 && !hasOnlyPlaceholder) {
            cardElement.removeAttribute('data-rendering');
            return;
        }

        // 렌더링 중 표시
        cardElement.setAttribute('data-rendering', 'true');

        try {
            // 새로운 내용을 렌더링할 임시 컨테이너 생성
            const tempContainer = document.createElement('div');
            tempContainer.style.position = 'absolute';
            tempContainer.style.visibility = 'hidden';
            tempContainer.className = 'temp-markdown-container';
            contentEl.appendChild(tempContainer);

            // 임시 컨테이너에 새 내용 렌더링
            await MarkdownRenderer.render(
                this.plugin.app,
                content,
                tempContainer,
                filePath,
                this
            );

            // 이미지 처리
            await this.processImages(tempContainer, filePath);

            // 플레이스홀더 텍스트 제거
            const placeholderText = markdownContainer.querySelector('.placeholder-text');
            if (placeholderText) {
                placeholderText.remove();
            }
            
            // 기존 내용 제거 (플레이스홀더 제외)
            Array.from(markdownContainer.children)
                .filter(child => !child.classList.contains('placeholder-text'))
                .forEach(child => child.remove());
            
            // 새 내용 이동
            while (tempContainer.firstChild) {
                markdownContainer.appendChild(tempContainer.firstChild);
            }
            
            // 임시 컨테이너 제거
            tempContainer.remove();

            // 부드러운 전환으로 표시
            setTimeout(() => {
                markdownContainer.style.opacity = '1';
            }, 10);

            // 렌더링 완료 표시
            cardElement.removeAttribute('data-rendering');
        } catch (error) {
            console.error(`Failed to render content for ${filePath}:`, error);
            
            // 플레이스홀더 텍스트 제거
            const placeholderText = markdownContainer.querySelector('.placeholder-text');
            if (placeholderText) {
                placeholderText.remove();
            }
            
            markdownContainer.createSpan({ text: content });
            markdownContainer.style.opacity = '1';
            cardElement.removeAttribute('data-rendering');
        }
    }

    // 설정이 변경될 때 호출되는 메서드 추가
    public clearCache() {
        this.renderCache.clear();
        this.renderedCards.clear();
        this.modifiedCards.clear();
        this.renderQueue.clear();
        
        // 진행 중인 타임아웃 정리
        this.renderTimeouts.forEach(timeout => clearTimeout(timeout));
        this.renderTimeouts.clear();
    }
}
