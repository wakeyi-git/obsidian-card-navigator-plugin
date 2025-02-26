import { TFile, MarkdownRenderer, MarkdownView, Component } from 'obsidian';
import CardNavigatorPlugin from 'main';
import { Card } from 'common/types';
import { sortFiles, separateFrontmatterAndBody } from 'common/utils';
import { CardInteractionManager } from './cardInteractionManager';

type CardElementTag = 'div' | 'h3' | 'h4';

export class CardMaker extends Component {
    private readonly MAX_CACHE_SIZE = 500;
    private readonly RENDER_TIMEOUT = 2000;

    private interactionManager: CardInteractionManager;
    private renderCache: Map<string, string> = new Map();
    private modifiedCards: Set<string> = new Set();
    private renderTimeouts: Map<string, NodeJS.Timeout> = new Map();

    constructor(private plugin: CardNavigatorPlugin) {
        super();
        this.interactionManager = new CardInteractionManager(plugin);
        this.registerFileEvents();
    }

    private cleanCache() {
        if (this.renderCache.size > this.MAX_CACHE_SIZE) {
            const entriesToDelete = Array.from(this.renderCache.keys())
                .slice(0, this.renderCache.size - this.MAX_CACHE_SIZE);
            entriesToDelete.forEach(key => {
                this.renderCache.delete(key);
            });
        }
    }

    private registerFileEvents() {
        this.registerEvent(
            this.plugin.app.vault.on('modify', async (file) => {
                if (file instanceof TFile && file.extension === 'md') {
                    const activeFile = this.plugin.app.workspace.getActiveFile();
                    if (activeFile && activeFile.path === file.path) {
                        // 이미 수정 중인 카드는 처리하지 않음
                        if (this.modifiedCards.has(file.path)) return;
                        
                        // 캐시 초기화 및 수정 중 상태 설정
                        this.modifiedCards.add(file.path);
                        this.renderCache.delete(file.path);
                        
                        try {
                            // 카드 내용 즉시 업데이트
                            const content = await this.plugin.app.vault.cachedRead(file);
                            const { cleanBody } = separateFrontmatterAndBody(content);
                            
                            const safeCardId = CSS.escape(file.path);
                            const cardElements = document.querySelectorAll(`.card-navigator-card[data-card-id="${safeCardId}"]`) as NodeListOf<HTMLElement>;
                            
                            for (const cardElement of Array.from(cardElements)) {
                                const contentEl = cardElement.querySelector('.card-navigator-body') as HTMLElement;
                                if (!contentEl) continue;
                                
                                if (this.plugin.settings.renderContentAsHtml) {
                                    // HTML 렌더링 시 기존 마크다운 컨테이너 초기화
                                    const markdownContainer = contentEl.querySelector('.markdown-rendered') as HTMLElement;
                                    if (markdownContainer) {
                                        markdownContainer.empty();
                                        markdownContainer.classList.add('loading');
                                        markdownContainer.style.opacity = '0';
                                        
                                        try {
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
                                        } catch (error) {
                                            console.error(`[CardNavigator] 수정된 카드 렌더링 실패 ${file.path}:`, error);
                                            markdownContainer.textContent = cleanBody;
                                            markdownContainer.style.opacity = '1';
                                            markdownContainer.classList.remove('loading');
                                        }
                                    }
                                } else {
                                    // HTML 렌더링을 사용하지 않는 경우 직접 텍스트 설정
                                    contentEl.textContent = cleanBody;
                                }
                            }
                        } finally {
                            // 처리 완료 후 수정 중 상태 해제
                            this.modifiedCards.delete(file.path);
                        }
                    }
                }
            })
        );
    }

    private async renderCardContent(contentEl: HTMLElement, content: string, filePath: string) {
        try {
            const markdownContainer = contentEl.querySelector('.markdown-rendered') as HTMLElement;
            if (!markdownContainer) return;
            
            // 기존 내용을 유지하면서 렌더링 준비
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
            console.error(`[CardNavigator] ${filePath} 내용 렌더링 실패:`, error);
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
            throw error; // 오류를 상위로 전파하여 적절한 상태 처리
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

    private async addCardContent(cardElement: HTMLElement, card: Card) {
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
                // 카드 내용 데이터 저장
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
                
                // 즉시 렌더링 (큐 사용하지 않고 직접 렌더링)
                try {
                    const timeout = setTimeout(() => {
                        console.warn(`[CardNavigator] 렌더링 타임아웃 발생: ${card.file.path}`);
                        this.renderTimeouts.delete(card.file.path);
                    }, this.RENDER_TIMEOUT);
                    
                    this.renderTimeouts.set(card.file.path, timeout);
                    
                    // 비동기로 렌더링 시작하고 완료를 기다리지 않음
                    this.renderCardContent(contentEl, card.body, card.file.path)
                        .catch(error => console.error(`[CardNavigator] 카드 렌더링 실패 ${card.file.path}:`, error))
                        .finally(() => {
                            clearTimeout(timeout);
                            this.renderTimeouts.delete(card.file.path);
                        });
                } catch (error) {
                    console.error(`[CardNavigator] 카드 렌더링 시작 실패 ${card.file.path}:`, error);
                    markdownContainer.textContent = card.body;
                    markdownContainer.style.opacity = '1';
                }
            } else {
                contentEl.textContent = card.body;
            }
        }
    }

    // 기존 카드 요소의 내용을 업데이트하는 public 메서드 추가
    public async updateCardContent(cardElement: HTMLElement, card: Card) {
        // 기존 내용 요소 제거
        const contentElements = cardElement.querySelectorAll('.card-navigator-filename, .card-navigator-first-header, .card-navigator-body');
        contentElements.forEach(el => el.remove());
        
        // 내용 다시 추가
        await this.addCardContent(cardElement, card);
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
        this.renderCache.clear();
        this.modifiedCards.clear();
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
            return;
        }

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
        } catch (error) {
            console.error(`[CardNavigator] ${filePath} 내용 렌더링 실패:`, error);
            
            // 플레이스홀더 텍스트 제거
            const placeholderText = markdownContainer.querySelector('.placeholder-text');
            if (placeholderText) {
                placeholderText.remove();
            }
            
            markdownContainer.createSpan({ text: content });
            markdownContainer.style.opacity = '1';
        }
    }

    // 설정이 변경될 때 호출되는 메서드
    public clearCache() {
        // 모든 캐시 초기화
        this.renderCache.clear();
        this.modifiedCards.clear();
        
        // 진행 중인 타임아웃 정리
        this.renderTimeouts.forEach(timeout => clearTimeout(timeout));
        this.renderTimeouts.clear();
        
        // 모든 카드 요소를 즉시 다시 렌더링
        const cardElements = document.querySelectorAll('.card-navigator-card') as NodeListOf<HTMLElement>;
        for (const cardElement of Array.from(cardElements)) {
            const filePath = cardElement.getAttribute('data-original-path');
            const content = cardElement.dataset.content;
            
            if (filePath && content) {
                const contentEl = cardElement.querySelector('.card-navigator-body') as HTMLElement;
                if (contentEl) {
                    const markdownContainer = contentEl.querySelector('.markdown-rendered') as HTMLElement;
                    if (markdownContainer) {
                        // 렌더링 상태 초기화
                        markdownContainer.empty();
                        markdownContainer.style.opacity = '0.3';
                        
                        // 로딩 중 표시를 위한 임시 텍스트 추가
                        const placeholderText = content.length > 50 ? content.substring(0, 50) + '...' : content;
                        markdownContainer.createSpan({ text: placeholderText, cls: 'placeholder-text' });
                        
                        // 비동기로 렌더링 시작하고 완료를 기다리지 않음
                        this.renderCardContent(contentEl, content, filePath)
                            .catch(error => console.error(`[CardNavigator] 카드 렌더링 실패 ${filePath}:`, error));
                    }
                }
            }
        }
    }
}
