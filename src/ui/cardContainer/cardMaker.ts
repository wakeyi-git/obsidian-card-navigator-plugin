import { TFile, MarkdownRenderer, MarkdownView, Component } from 'obsidian';
import CardNavigatorPlugin from 'main';
import { Card } from 'common/types';
import { sortFiles, separateFrontmatterAndBody } from 'common/utils';
import { CardNavigatorSettings } from 'common/types';

type CardElementTag = 'div' | 'h3' | 'h4';

/**
 * 카드 생성 클래스
 */
export class CardMaker extends Component {
    private readonly MAX_CACHE_SIZE = 500;
    private readonly MAX_CONCURRENT_RENDERS = 15;
    private readonly INTERSECTION_ROOT_MARGIN = '400px';
    private readonly INTERSECTION_THRESHOLD = 0.1;
    private readonly RENDER_QUEUE_INTERVAL = 50;
    private readonly RENDER_TIMEOUT = 2000;

    private renderCache: Map<string, string> = new Map();
    private intersectionObserver: IntersectionObserver = null!;
    private modifiedCards: Set<string> = new Set();
    private renderQueue: Set<string> = new Set();
    private isProcessingQueue = false;
    private renderedCards: Set<string> = new Set();
    private renderTimeouts: Map<string, NodeJS.Timeout> = new Map();
    private settings: CardNavigatorSettings;
    private contentCache: Map<string, string> = new Map();
    private cardTemplateEl: HTMLElement | null = null;

    constructor(private plugin: CardNavigatorPlugin) {
        super();
        this.settings = plugin.settings;
        this.initCardTemplate();
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

    private setupIntersectionObserver() {
        // 기존 옵저버 해제
        if (this.intersectionObserver) {
            this.intersectionObserver.disconnect();
        }

        // 새 옵저버 생성 - 루트 마진을 늘려 더 넓은 영역 관찰
        this.intersectionObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    const cardElement = entry.target as HTMLElement;
                    const filePath = cardElement.getAttribute('data-card-id');
                    
                    if (!filePath) return;
                    
                    if (entry.isIntersecting) {
                        // 화면에 보이는 카드는 렌더링 큐에 추가
                        if (!this.renderedCards.has(filePath)) {
                            this.renderQueue.add(filePath);
                            // 큐 처리 시작
                            if (!this.isProcessingQueue) {
                                this.processRenderQueue();
                            }
                        }
                    }
                });
            },
            {
                root: null,
                rootMargin: '300px', // 루트 마진을 늘려 더 넓은 영역 관찰
                threshold: 0.1
            }
        );
    }

    private async processRenderQueue() {
        if (this.isProcessingQueue || this.renderQueue.size === 0) return;
        
        this.isProcessingQueue = true;
        console.log(`[CardMaker] 렌더링 큐 처리 시작 - ${this.renderQueue.size}개 항목`);
        
        // 처리할 항목 선택 (최대 10개씩 처리)
        const itemsToProcess = Array.from(this.renderQueue).slice(0, 10);
        
        for (const filePath of itemsToProcess) {
            this.renderQueue.delete(filePath);
            const safeCardId = CSS.escape(filePath);
            const cardElement = document.querySelector(`[data-card-id="${safeCardId}"]`) as HTMLElement;
            if (!cardElement) continue;

            // 타임아웃 시간을 늘려 더 많은 시간 제공
            const timeout = setTimeout(() => {
                console.warn(`[CardMaker] 렌더링 타임아웃 발생 - ${filePath}`);
                this.renderQueue.add(filePath);
                this.renderTimeouts.delete(filePath);
            }, 10000); // 10초로 늘림

            this.renderTimeouts.set(filePath, timeout);

            try {
                await this.ensureCardRendered(cardElement);
                this.renderedCards.add(filePath);
                console.log(`[CardMaker] 카드 렌더링 완료 - ${filePath}`);
            } catch (error) {
                console.error(`[CardMaker] 카드 렌더링 실패 - ${filePath}:`, error);
            } finally {
                clearTimeout(timeout);
                this.renderTimeouts.delete(filePath);
            }
        }

        this.isProcessingQueue = false;
        if (this.renderQueue.size > 0) {
            // 다음 렌더링 처리를 더 빠르게 시작
            setTimeout(() => this.processRenderQueue(), 0);
        } else {
            console.log(`[CardMaker] 모든 렌더링 큐 처리 완료`);
        }
    }

    private async renderCardContent(contentEl: HTMLElement, content: string, filePath: string) {
        try {
            const markdownContainer = contentEl.querySelector('.markdown-rendered') as HTMLElement;
            if (!markdownContainer) {
                console.warn(`[CardMaker] 마크다운 컨테이너를 찾을 수 없음 - ${filePath}`);
                return;
            }

            // 이미 렌더링된 경우 스킵 (단, 내용이 비어있지 않은 경우에만)
            if (markdownContainer.children.length > 0 && 
                !markdownContainer.classList.contains('loading') && 
                markdownContainer.innerHTML.trim() !== '') {
                console.log(`[CardMaker] 이미 렌더링된 카드 스킵 - ${filePath}`);
                markdownContainer.style.opacity = '1';
                markdownContainer.classList.remove('loading');
                contentEl.classList.remove('loading');
                
                // 렌더링된 카드 세트에 추가
                this.renderedCards.add(filePath);
                return;
            }

            console.log(`[CardMaker] 카드 내용 렌더링 시작 - ${filePath}`);
            markdownContainer.style.opacity = '0';
            markdownContainer.classList.add('loading');
            contentEl.classList.add('loading');

            // 기존 내용 제거
            markdownContainer.empty();

            // 새로운 내용 렌더링
            await MarkdownRenderer.render(
                this.plugin.app,
                content,
                markdownContainer,
                filePath,
                this
            );

            // 이미지 처리
            await this.processImages(contentEl, filePath);

            // 렌더링 완료 후 표시
            markdownContainer.style.opacity = '1';
            markdownContainer.classList.remove('loading');
            contentEl.classList.remove('loading');
            
            // 렌더링 성공 시 렌더링된 카드 세트에 추가
            this.renderedCards.add(filePath);
            
            console.log(`[CardMaker] 카드 내용 렌더링 완료 - ${filePath}`);
        } catch (error) {
            console.error(`[CardMaker] 카드 내용 렌더링 실패 - ${filePath}:`, error);
            try {
                const markdownContainer = contentEl.querySelector('.markdown-rendered') as HTMLElement;
                if (markdownContainer) {
                    markdownContainer.empty();
                    markdownContainer.createSpan({ text: content.substring(0, 200) + (content.length > 200 ? '...' : '') });
                    markdownContainer.style.opacity = '1';
                    markdownContainer.classList.remove('loading');
                }
                contentEl.classList.remove('loading');
                
                // 파일 내용을 다시 읽어와서 재시도
                try {
                    const file = this.plugin.app.vault.getAbstractFileByPath(filePath);
                    if (file instanceof TFile && file.extension === 'md') {
                        // 캐시에서 제거하여 다음 번에 새로 렌더링되도록 함
                        this.renderCache.delete(filePath);
                        this.renderedCards.delete(filePath);
                    }
                } catch (retryError) {
                    console.error(`[CardMaker] 파일 재시도 준비 중 오류 발생 - ${filePath}:`, retryError);
                }
            } catch (fallbackError) {
                console.error(`[CardMaker] 오류 처리 중 추가 오류 발생 - ${filePath}:`, fallbackError);
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

    /**
     * 링크 복사 메서드
     */
    public async copyLink(file: TFile) {
        const url = this.plugin.app.fileManager.generateMarkdownLink(file, '');
        await navigator.clipboard.writeText(url);
    }

    /**
     * 카드 내용 복사 메서드
     */
    public async copyCardContent(file: TFile) {
        const card = await this.createCard(file);
        const content = card.body || '';
        await navigator.clipboard.writeText(content);
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
                id: file.path,
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

    /**
     * 카드 템플릿 초기화
     */
    private initCardTemplate(): void {
        this.cardTemplateEl = document.createElement('div');
        this.cardTemplateEl.className = 'card-navigator-card';
        
        // 제목 요소
        const titleEl = document.createElement('div');
        titleEl.className = 'card-navigator-card-title';
        this.cardTemplateEl.appendChild(titleEl);
        
        // 내용 요소
        const contentEl = document.createElement('div');
        contentEl.className = 'card-navigator-card-content';
        this.cardTemplateEl.appendChild(contentEl);
        
        // 태그 컨테이너
        const tagsEl = document.createElement('div');
        tagsEl.className = 'card-navigator-card-tags';
        this.cardTemplateEl.appendChild(tagsEl);
    }

    /**
     * 설정 업데이트
     * @param settings 새 설정
     */
    public updateSettings(settings: CardNavigatorSettings): void {
        this.settings = settings;
    }

    /**
     * 카드 요소 생성
     * @param card 카드 데이터
     * @returns 생성된 카드 요소
     */
    public createCardElement(card: Card): HTMLElement {
        // 템플릿이 없으면 생성
        if (!this.cardTemplateEl) {
            this.initCardTemplate();
        }
        
        // 템플릿 복제
        const cardEl = this.cardTemplateEl!.cloneNode(true) as HTMLElement;
        cardEl.dataset.cardId = card.id;
        
        // 카드 내용 설정
        this.updateCardContent(cardEl, card);
        
        return cardEl;
    }

    /**
     * 카드 내용 업데이트
     * @param cardEl 카드 요소
     * @param card 카드 데이터
     */
    public updateCardContent(cardEl: HTMLElement, card: Card): void {
        // 캐시 키 생성
        const cacheKey = this.getContentCacheKey(card);
        
        // 캐시된 내용이 있고 변경되지 않았으면 업데이트하지 않음
        if (cardEl.dataset.contentHash === cacheKey) {
            return;
        }
        
        // 내용 해시 업데이트
        cardEl.dataset.contentHash = cacheKey;
        
        // 제목 업데이트
        const titleEl = cardEl.querySelector('.card-navigator-card-title');
        if (titleEl) {
            titleEl.textContent = card.fileName || card.file?.basename || '제목 없음';
            
            // 제목 글꼴 크기 설정
            if (this.settings?.fileNameFontSize) {
                (titleEl as HTMLElement).style.fontSize = `${this.settings.fileNameFontSize}px`;
            }
        }
        
        // 내용 업데이트
        const contentEl = cardEl.querySelector('.card-navigator-card-content');
        if (contentEl && card.body) {
            // 캐시된 내용 확인
            let formattedContent = this.contentCache.get(cacheKey);
            
            if (!formattedContent) {
                // 내용 길이 제한
                let truncatedContent = card.body;
                if (this.settings?.bodyLength && truncatedContent.length > this.settings.bodyLength) {
                    truncatedContent = truncatedContent.substring(0, this.settings.bodyLength) + '...';
                }
                
                // HTML 렌더링 옵션에 따라 처리
                formattedContent = this.settings?.renderContentAsHtml 
                    ? truncatedContent 
                    : this.escapeHtml(truncatedContent);
                
                // 캐시에 저장
                this.contentCache.set(cacheKey, formattedContent);
            }
            
            // 내용 설정
            if (this.settings?.renderContentAsHtml) {
                contentEl.innerHTML = formattedContent;
            } else {
                contentEl.textContent = formattedContent;
            }
            
            // 내용 글꼴 크기 설정
            if (this.settings?.bodyFontSize) {
                (contentEl as HTMLElement).style.fontSize = `${this.settings.bodyFontSize}px`;
            }
        }
        
        // 태그 업데이트
        const tagsEl = cardEl.querySelector('.card-navigator-card-tags');
        if (tagsEl) {
            tagsEl.innerHTML = '';
            
            // 파일에서 태그 추출
            let tags: string[] = [];
            if (card.tags && card.tags.length > 0) {
                tags = card.tags;
            } else if (card.file && this.plugin.app.metadataCache) {
                const fileCache = this.plugin.app.metadataCache.getFileCache(card.file);
                if (fileCache && fileCache.tags) {
                    tags = fileCache.tags.map(tag => tag.tag);
                }
            }
            
            if (tags.length > 0) {
                tags.forEach((tag: string) => {
                    const tagEl = document.createElement('span');
                    tagEl.className = 'card-navigator-card-tag';
                    tagEl.textContent = tag;
                    tagsEl.appendChild(tagEl);
                });
                
                // 태그 글꼴 크기 설정
                if (this.settings?.tagsFontSize) {
                    (tagsEl as HTMLElement).style.fontSize = `${this.settings.tagsFontSize}px`;
                }
            }
        }
    }

    /**
     * 내용 캐시 키 생성
     * @param card 카드 데이터
     * @returns 캐시 키
     */
    private getContentCacheKey(card: Card): string {
        // 태그 문자열 생성
        let tagString = '';
        if (card.tags && card.tags.length > 0) {
            tagString = card.tags.join(',');
        } else if (card.file && this.plugin.app.metadataCache) {
            const fileCache = this.plugin.app.metadataCache.getFileCache(card.file);
            if (fileCache && fileCache.tags) {
                tagString = fileCache.tags.map(tag => tag.tag).join(',');
            }
        }
        
        return `${card.id}-${card.fileName}-${card.body?.substring(0, 50)}-${tagString}-${this.settings?.bodyLength}-${this.settings?.renderContentAsHtml}`;
    }

    /**
     * HTML 이스케이프 처리
     * @param html HTML 문자열
     * @returns 이스케이프된 문자열
     */
    private escapeHtml(html: string): string {
        const div = document.createElement('div');
        div.textContent = html;
        return div.innerHTML;
    }

    /**
     * 캐시 정리
     * @param maxSize 최대 캐시 크기
     */
    public clearCache(maxSize: number = 100): void {
        if (this.contentCache.size > maxSize) {
            // 가장 오래된 항목부터 삭제
            const keysToDelete = Array.from(this.contentCache.keys()).slice(0, this.contentCache.size - maxSize);
            keysToDelete.forEach(key => this.contentCache.delete(key));
        }
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

    public async ensureCardRendered(cardElement: HTMLElement): Promise<void> {
        if (!cardElement) {
            console.warn('[CardMaker] 카드 요소가 없어 렌더링을 건너뜁니다.');
            return;
        }

        // 카드가 DOM에 있는지 확인
        if (!document.body.contains(cardElement)) {
            console.warn('[CardMaker] 카드가 DOM에 없어 렌더링을 건너뜁니다.');
            return;
        }

        // 카드 ID를 일관되게 가져오기
        const filePath = cardElement.getAttribute('data-card-id') || cardElement.getAttribute('data-original-path');
        if (!filePath) {
            console.warn('[CardMaker] 카드 파일 경로를 찾을 수 없습니다.');
            return;
        }

        const contentEl = cardElement.querySelector('.card-navigator-body') as HTMLElement;
        if (!contentEl) {
            console.warn(`[CardMaker] 카드 내용 요소를 찾을 수 없습니다. - ${filePath}`);
            return;
        }

        // 마크다운 컨테이너 확인
        let markdownContainer = contentEl.querySelector('.markdown-rendered') as HTMLElement;
        if (!markdownContainer) {
            console.log(`[CardMaker] 마크다운 컨테이너가 없어 새로 생성합니다. - ${filePath}`);
            markdownContainer = contentEl.createDiv({
                cls: 'markdown-rendered loading'
            });
            markdownContainer.style.opacity = '0';
        }

        const content = cardElement.dataset.content;
        if (!content) {
            console.warn(`[CardMaker] 카드 내용이 없습니다 - ${filePath}`);
            
            // 파일에서 내용을 다시 읽어오기 시도
            try {
                const file = this.plugin.app.vault.getAbstractFileByPath(filePath);
                if (file instanceof TFile && file.extension === 'md') {
                    const fileContent = await this.plugin.app.vault.read(file);
                    const { cleanBody } = separateFrontmatterAndBody(fileContent);
                    
                    // 내용을 카드에 설정
                    cardElement.dataset.content = cleanBody;
                    console.log(`[CardMaker] 파일에서 내용을 다시 읽어왔습니다 - ${filePath}`);
                    
                    // 재귀적으로 렌더링 시도
                    return this.ensureCardRendered(cardElement);
                }
            } catch (error) {
                console.error(`[CardMaker] 파일에서 내용을 다시 읽어오는 중 오류 발생 - ${filePath}:`, error);
            }
            
            return;
        }

        // 이미 렌더링 중인 경우 스킵
        if (cardElement.hasAttribute('data-rendering')) {
            console.log(`[CardMaker] 이미 렌더링 중인 카드 스킵 - ${filePath}`);
            return;
        }

        // 이미 렌더링된 경우 스킵 (단, 내용이 비어있지 않은 경우에만)
        if (markdownContainer.children.length > 0 && 
            !markdownContainer.classList.contains('loading') && 
            markdownContainer.innerHTML.trim() !== '') {
            console.log(`[CardMaker] 이미 렌더링된 카드 스킵 - ${filePath}`);
            cardElement.removeAttribute('data-rendering');
            markdownContainer.style.opacity = '1';
            markdownContainer.classList.remove('loading');
            contentEl.classList.remove('loading');
            return;
        }

        // 렌더링 시작 표시
        cardElement.setAttribute('data-rendering', 'true');
        console.log(`[CardMaker] 카드 렌더링 시작 - ${filePath}`);

        try {
            // 기존 내용 제거
            markdownContainer.empty();
            markdownContainer.classList.add('loading');
            markdownContainer.style.opacity = '0';
            contentEl.classList.add('loading');

            // 새로운 내용 렌더링
            await MarkdownRenderer.render(
                this.plugin.app,
                content,
                markdownContainer,
                filePath,
                this
            );

            // 이미지 처리
            await this.processImages(contentEl, filePath);

            // 렌더링 완료 표시
            markdownContainer.style.opacity = '1';
            markdownContainer.classList.remove('loading');
            contentEl.classList.remove('loading');
            cardElement.removeAttribute('data-rendering');
            
            // 렌더링 성공 시 렌더링된 카드 세트에 추가
            this.renderedCards.add(filePath);
            
            console.log(`[CardMaker] 카드 렌더링 완료 - ${filePath}`);
        } catch (error) {
            console.error(`[CardMaker] 카드 렌더링 실패 - ${filePath}:`, error);
            try {
                // 오류 발생 시 일반 텍스트로 표시
                markdownContainer.empty();
                markdownContainer.createSpan({ text: content.substring(0, 200) + (content.length > 200 ? '...' : '') });
                markdownContainer.style.opacity = '1';
                markdownContainer.classList.remove('loading');
                contentEl.classList.remove('loading');
                cardElement.removeAttribute('data-rendering');
            } catch (fallbackError) {
                console.error(`[CardMaker] 오류 처리 중 추가 오류 발생 - ${filePath}:`, fallbackError);
                cardElement.removeAttribute('data-rendering');
            }
        }
    }
}
