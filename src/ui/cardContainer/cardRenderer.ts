import { TFile } from 'obsidian';
import { Card } from 'common/types';
import { CardMaker } from './cardMaker';
import { LayoutManager } from 'layouts/layoutManager';
import CardNavigatorPlugin from 'main';
import { CardPosition } from 'layouts/layoutStrategy';
import { MarkdownRenderer } from 'obsidian';

/**
 * 카드 렌더러 클래스
 * 
 * 이 클래스는 카드의 DOM 요소 생성 및 렌더링을 담당합니다.
 * 레이아웃 계산은 LayoutManager에 위임합니다.
 */
export class CardRenderer {
    private renderedCards: Set<string> = new Set(); // 렌더링된 카드 추적
    private cardElements: Map<string, HTMLElement> = new Map(); // 카드 ID와 요소 매핑
    private isInitialized: boolean = false;
    private initializationAttempts: number = 0;
    private maxInitAttempts: number = 3;

    //#region 초기화 및 기본 설정
    // 생성자: 카드 렌더러 초기화
    constructor(
        private containerEl: HTMLElement,
        private cardMaker: CardMaker,
        private layoutManager: LayoutManager,
        private plugin: CardNavigatorPlugin
    ) {
        // 초기화 완료 표시
        this.isInitialized = true;
        
        // 카드 요소 맵을 layoutManager와 공유 - 생성자에서는 제거하고 resetCardElements에서 처리
        // 초기화 시점에 맵 공유 설정
        this.layoutManager.setCardElements(this.cardElements);
    }

    /**
     * 카드 설정 업데이트
     * @param alignCardHeight 카드 높이 정렬 여부
     * @param cardsPerColumn 열당 카드 수
     */
    public updateCardSettings(alignCardHeight: boolean, cardsPerColumn: number): void {
        // 필요한 경우 layoutManager에 설정 전달
        // 현재는 이러한 설정이 layoutManager에서 직접 관리되므로 별도 처리 없음
        console.log(`[CardRenderer] 카드 설정 업데이트 - alignCardHeight: ${alignCardHeight}, cardsPerColumn: ${cardsPerColumn}`);
    }

    // 리소스 정리 메서드
    public cleanup(): void {
        if (this.containerEl) {
            this.containerEl.empty();
            this.resetCardElements();
        }
    }

    /**
     * 카드 요소 맵과 렌더링된 카드 세트를 초기화합니다.
     * 폴더 변경 시 이전 카드의 참조를 완전히 제거하기 위해 사용됩니다.
     */
    public resetCardElements(): void {
        // 카드 요소 맵에 있는 모든 요소를 DOM에서 제거
        this.cardElements.forEach((element) => {
            if (element && element.parentNode) {
                element.remove();
            }
        });
        
        // 맵과 세트 초기화
        this.cardElements.clear();
        this.renderedCards.clear();
        
        // 컨테이너에 남아있는 카드 요소가 있다면 모두 제거
        if (this.containerEl) {
            const remainingCards = this.containerEl.querySelectorAll('.card-navigator-card');
            remainingCards.forEach(card => card.remove());
        }
        
        // layoutManager와 맵 공유 상태 유지 - 맵이 초기화된 후 다시 공유
        this.layoutManager.setCardElements(this.cardElements);
    }
    //#endregion

    //#region 카드 렌더링
    /**
     * 카드 렌더링
     * @param cards 렌더링할 카드 목록
     * @param focusedCardId 포커스된 카드 ID
     * @param activeFile 활성 파일
     */
    public renderCards(cards: Card[], focusedCardId?: string | null, activeFile?: TFile): void {
        if (!this.containerEl || !this.layoutManager) {
            console.warn('[CardRenderer] 컨테이너 또는 레이아웃 매니저가 없습니다.');
            return;
        }

        // 초기화 상태 확인 - 이미 단순화됨
        if (!this.isInitialized) {
            this.isInitialized = true;
            console.log('[CardRenderer] 초기화 완료');
        }

        // 현재 스크롤 위치 저장
        const scrollTop = this.containerEl.scrollTop;
        const scrollLeft = this.containerEl.scrollLeft;

        // 기존 카드 요소 맵 업데이트
        this.updateCardElementsMap(cards);

        try {
            // 레이아웃 계산 - LayoutManager에 위임
            if (this.checkIfLayoutCalculationNeeded(cards)) {
                this.layoutManager.calculateLayout(cards);
            }
            
            // 카드 렌더링 - 배치 처리로 성능 최적화
            this.renderCardsBatched(cards, focusedCardId === null ? undefined : focusedCardId, activeFile);
        } catch (error) {
            console.error('[CardRenderer] 레이아웃 계산 중 오류 발생:', error);
            // 오류 발생 시 기본 레이아웃으로 렌더링
            this.renderCardsWithDefaultLayout(cards, focusedCardId === null ? undefined : focusedCardId, activeFile);
        }

        // 스크롤 위치 복원
        this.containerEl.scrollTop = scrollTop;
        this.containerEl.scrollLeft = scrollLeft;
    }
    
    /**
     * 레이아웃 계산이 필요한지 확인
     */
    private checkIfLayoutCalculationNeeded(cards: Card[]): boolean {
        // 카드 수가 변경된 경우 레이아웃 계산 필요
        if (this.renderedCards.size !== cards.length) {
            return true;
        }
        
        // 카드 ID가 변경된 경우 레이아웃 계산 필요
        for (const card of cards) {
            if (!this.renderedCards.has(card.id)) {
                return true;
            }
        }
        
        // 레이아웃 계산이 필요하지 않음
        return false;
    }
    
    /**
     * 카드를 배치 처리로 렌더링
     */
    private renderCardsBatched(cards: Card[], focusedCardId?: string, activeFile?: TFile): void {
        const batchSize = 20; // 한 번에 처리할 카드 수
        const totalCards = cards.length;
        let processedCards = 0;
        let positionNotFoundCount = 0;
        
        // 모든 카드의 위치를 미리 계산
        const positions: Map<string, CardPosition> = new Map();
        const missingPositions: { card: Card, index: number }[] = [];
        
        // 첫 번째 패스: 모든 카드의 위치 정보 수집
        for (let i = 0; i < totalCards; i++) {
            const card = cards[i];
            const position = this.layoutManager.getCardPosition(card.id);
            
            if (position) {
                positions.set(card.id, position);
            } else {
                missingPositions.push({ card, index: i });
            }
        }
        
        // 누락된 위치 계산 및 등록
        if (missingPositions.length > 0) {
            console.log(`[CardRenderer] ${missingPositions.length}개 카드의 위치를 찾을 수 없어 기본 위치를 계산합니다.`);
            
            const calculatedPositions: CardPosition[] = [];
            
            for (const { card, index } of missingPositions) {
                const position = this.layoutManager.calculateDefaultPosition(card.id, index);
                positions.set(card.id, position);
                calculatedPositions.push(position);
            }
            
            // 계산된 위치를 레이아웃 매니저에 등록
            if (calculatedPositions.length > 0) {
                this.layoutManager.registerCardPositions(calculatedPositions);
            }
        }
        
        // 배치 처리 함수
        const processBatch = () => {
            const endIdx = Math.min(processedCards + batchSize, totalCards);
            
            for (let i = processedCards; i < endIdx; i++) {
                const card = cards[i];
                const cardEl = this.getOrCreateCardElement(card);
                
                // 미리 계산된 위치 사용
                const position = positions.get(card.id);
                
                if (position) {
                    // 위치 적용
                    this.applyCardPosition(cardEl, position);
                } else {
                    // 이 경우는 발생하지 않아야 하지만, 안전장치로 남겨둠
                    console.error(`[CardRenderer] 카드 ${card.id}의 위치 정보가 없습니다. 이 오류는 발생하지 않아야 합니다.`);
                    cardEl.style.visibility = 'hidden';
                }
                
                // 카드 내용 업데이트 - 필요한 경우에만
                this.updateCardContent(cardEl, card);
                
                // 활성 상태 업데이트
                this.updateCardActiveState(cardEl, card, activeFile, focusedCardId);
            }
            
            processedCards = endIdx;
            
            // 아직 처리할 카드가 남아있으면 다음 프레임에서 계속
            if (processedCards < totalCards) {
                requestAnimationFrame(processBatch);
            }
        };
        
        // 첫 번째 배치 처리 시작
        processBatch();
    }
    
    /**
     * 카드 위치 적용
     */
    private applyCardPosition(cardEl: HTMLElement, position: CardPosition): void {
        cardEl.style.position = 'absolute';
        cardEl.style.left = `${position.left}px`;
        cardEl.style.top = `${position.top}px`;
        cardEl.style.width = `${position.width}px`;
        
        if (typeof position.height === 'string' && position.height === 'auto') {
            cardEl.style.height = 'auto';
        } else {
            cardEl.style.height = `${position.height}px`;
        }
        
        cardEl.style.visibility = 'visible';
        cardEl.style.opacity = '1';
    }

    /**
     * 오류 발생 시 기본 레이아웃으로 카드 렌더링
     */
    private renderCardsWithDefaultLayout(cards: Card[], focusedCardId?: string, activeFile?: TFile): void {
        if (!this.containerEl) return;
        
        // 컨테이너 크기
        const containerWidth = this.containerEl.offsetWidth;
        
        // 카드 크기 계산
        const cardWidth = Math.min(300, containerWidth * 0.8);
        const cardHeight = 200;
        
        // 카드 간격
        const cardMargin = 10;
        
        // 한 행에 표시할 카드 수 계산
        const cardsPerRow = Math.max(1, Math.floor(containerWidth / (cardWidth + cardMargin)));
        
        // 배치 처리로 카드 렌더링
        const batchSize = 20;
        const totalCards = cards.length;
        let processedCards = 0;
        
        const processBatch = () => {
            const endIdx = Math.min(processedCards + batchSize, totalCards);
            
            for (let i = processedCards; i < endIdx; i++) {
                const card = cards[i];
                const cardEl = this.getOrCreateCardElement(card);
                
                // 행과 열 계산
                const row = Math.floor(i / cardsPerRow);
                const col = i % cardsPerRow;
                
                // 카드 위치 계산
                const left = col * (cardWidth + cardMargin);
                const top = row * (cardHeight + cardMargin);
                
                // 카드 스타일 설정
                cardEl.style.position = 'absolute';
                cardEl.style.left = `${left}px`;
                cardEl.style.top = `${top}px`;
                cardEl.style.width = `${cardWidth}px`;
                cardEl.style.height = `${cardHeight}px`;
                cardEl.style.visibility = 'visible';
                cardEl.style.opacity = '1';
                
                // 활성 파일 및 포커스 상태 설정
                this.updateCardActiveState(cardEl, card, activeFile, focusedCardId);
            }
            
            processedCards = endIdx;
            
            // 아직 처리할 카드가 남아있으면 다음 프레임에서 계속
            if (processedCards < totalCards) {
                requestAnimationFrame(processBatch);
            }
        };
        
        // 첫 번째 배치 처리 시작
        processBatch();
    }

    /**
     * 카드 요소 가져오기 또는 생성
     * @param card 카드 데이터
     * @returns 카드 요소
     */
    private getOrCreateCardElement(card: Card): HTMLElement {
        // 기존 카드 요소가 있는지 확인
        let cardEl = this.cardElements.get(card.id);
        
        // 카드 요소가 없으면 새로 생성
        if (!cardEl) {
            cardEl = this.createCardElement(card);
            this.cardElements.set(card.id, cardEl);
            this.containerEl.appendChild(cardEl);
        }
        
        // 렌더링된 카드 목록에 추가
        this.renderedCards.add(card.id);
        
        return cardEl;
    }
    
    /**
     * 카드 요소 생성
     * @param card 카드 데이터
     * @returns 생성된 카드 요소
     */
    private createCardElement(card: Card): HTMLElement {
        const cardEl = document.createElement('div');
        cardEl.className = 'card-navigator-card';
        cardEl.dataset.cardId = card.id;
        
        // 카드 내용 설정
        this.updateCardContent(cardEl, card);
        
        // 초기 스타일 설정
        cardEl.style.position = 'absolute';
        cardEl.style.visibility = 'hidden'; // 위치가 설정되기 전까지 숨김
        cardEl.style.opacity = '0';
        
        return cardEl;
    }
    
    /**
     * 카드 내용 업데이트
     * @param cardEl 카드 요소
     * @param card 카드 데이터
     */
    private updateCardContent(cardEl: HTMLElement, card: Card): void {
        // 성능 최적화: 내용이 변경되지 않았으면 업데이트하지 않음
        const currentContent = cardEl.getAttribute('data-content-hash');
        const newContent = this.getContentHash(card);
        
        if (currentContent === newContent) {
            return;
        }
        
        // 내용 해시 업데이트
        cardEl.setAttribute('data-content-hash', newContent);
        
        // 카드 내용 설정
        cardEl.innerHTML = '';
        
        // 제목 추가
        const titleEl = document.createElement('div');
        titleEl.className = 'card-navigator-card-title';
        titleEl.textContent = card.fileName || card.file?.basename || '제목 없음';
        cardEl.appendChild(titleEl);
        
        // 내용 추가
        if (card.body) {
            const contentEl = document.createElement('div');
            contentEl.className = 'card-navigator-card-content';
            
            // HTML 렌더링 옵션에 따라 처리
            if (this.plugin?.settings?.renderContentAsHtml) {
                // 마크다운 렌더링을 위한 컨테이너 생성
                const markdownContainer = document.createElement('div');
                markdownContainer.className = 'markdown-rendered';
                contentEl.appendChild(markdownContainer);
                
                // 비동기 렌더링을 위해 setTimeout 사용
                setTimeout(async () => {
                    try {
                        // card.body가 undefined일 수 있으므로 안전하게 처리
                        const bodyContent = card.body || '';
                        
                        if (card.file) {
                            try {
                                // MarkdownRenderer.render 대신 직접 HTML 설정
                                // 기본적인 마크다운 변환 로직 적용
                                const html = this.convertMarkdownToHtml(bodyContent);
                                markdownContainer.innerHTML = html;
                                
                                // 링크 처리 - 클릭 이벤트 추가
                                this.processLinks(markdownContainer, card.file.path);
                            } catch (error) {
                                console.error(`[CardRenderer] 마크다운 변환 실패: ${card.id}`, error);
                                markdownContainer.textContent = bodyContent;
                            }
                        } else {
                            markdownContainer.innerHTML = bodyContent;
                        }
                    } catch (error) {
                        console.error(`[CardRenderer] 마크다운 렌더링 실패: ${card.id}`, error);
                        markdownContainer.textContent = card.body || '';
                    }
                }, 10);
            } else {
                contentEl.textContent = card.body || '';
            }
            
            cardEl.appendChild(contentEl);
        }
        
        // 태그 추가
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
            const tagsEl = document.createElement('div');
            tagsEl.className = 'card-navigator-card-tags';
            
            tags.forEach((tag: string) => {
                const tagEl = document.createElement('span');
                tagEl.className = 'card-navigator-card-tag';
                tagEl.textContent = tag;
                tagsEl.appendChild(tagEl);
            });
            
            cardEl.appendChild(tagsEl);
        }
    }
    
    /**
     * 카드 내용의 해시 값 계산 (변경 감지용)
     */
    private getContentHash(card: Card): string {
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
        
        return `${card.id}-${card.fileName}-${card.body?.substring(0, 100)}-${tagString}`;
    }
    
    /**
     * 카드 요소의 활성 상태 업데이트
     */
    private updateCardActiveState(cardEl: HTMLElement, card: Card, activeFile?: TFile, focusedCardId?: string): void {
        // 활성 파일 클래스 토글
        cardEl.classList.toggle('is-active', activeFile?.path === card.file?.path);
        
        // 포커스 클래스 토글
        cardEl.classList.toggle('is-focused', focusedCardId === card.id);
    }
    
    /**
     * 카드 요소 맵 업데이트
     */
    private updateCardElementsMap(cards: Card[]): void {
        // 현재 카드 ID 목록
        const currentCardIds = new Set(cards.map(card => card.id));
        
        // 더 이상 존재하지 않는 카드 요소 제거
        for (const [cardId, cardEl] of this.cardElements.entries()) {
            if (!currentCardIds.has(cardId)) {
                cardEl.remove();
                this.cardElements.delete(cardId);
                this.renderedCards.delete(cardId);
            }
        }
    }
    //#endregion

    //#region 카드 상태 및 정보 관리
    // 포커스된 카드 초기화 메서드
    public clearFocusedCards() {
        if (!this.containerEl) return;
        Array.from(this.containerEl.children).forEach((card) => {
            card.classList.remove('card-navigator-focused');
        });
    }

    // 카드 요소에서 파일 가져오기 메서드
    public getFileFromCard(cardElement: HTMLElement, cards: Card[]): TFile | null {
        if (!this.containerEl) return null;
        const cardIndex = Array.from(this.containerEl.children).indexOf(cardElement);
        if (cardIndex !== -1 && cardIndex < cards.length) {
            return cards[cardIndex].file;
        }
        return null;
    }

    /**
     * 카드 크기를 가져옵니다.
     * @returns 카드의 너비와 높이
     */
    public getCardSize(): { width: number, height: number } {
        // 레이아웃 매니저에서 카드 크기 가져오기
        return this.layoutManager.getCardSize();
    }
    //#endregion

    //#region 마크다운 변환 및 링크 처리
    /**
     * 마크다운을 HTML로 변환합니다.
     * 기본적인 마크다운 문법만 지원합니다.
     */
    private convertMarkdownToHtml(markdown: string): string {
        if (!markdown) return '';
        
        let html = markdown;
        
        // 줄바꿈 처리
        html = html.replace(/\n/g, '<br>');
        
        // 헤더 처리 (# Header)
        html = html.replace(/#{1,6}\s+([^\n]+)/g, (match, text) => {
            const level = match.trim().indexOf(' ');
            return `<h${level}>${text.trim()}</h${level}>`;
        });
        
        // 굵은 텍스트 (**text**)
        html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        
        // 기울임 텍스트 (*text*)
        html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
        
        // 인용구 (> text)
        html = html.replace(/>\s+([^\n]+)/g, '<blockquote>$1</blockquote>');
        
        // 링크 ([text](url))
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
        
        // 목록 (- item)
        html = html.replace(/^\s*-\s+([^\n]+)/gm, '<li>$1</li>');
        html = html.replace(/<li>([^<]+)<\/li>/g, '<ul><li>$1</li></ul>');
        
        return html;
    }

    /**
     * 링크를 처리합니다.
     * 내부 링크를 클릭했을 때 해당 파일을 열도록 처리합니다.
     */
    private processLinks(container: HTMLElement, filePath: string): void {
        // 내부 링크 처리
        container.querySelectorAll('a').forEach((link) => {
            // 외부 링크인 경우 새 탭에서 열기
            if (link.href.startsWith('http')) {
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                return;
            }
            
            // 내부 링크인 경우 클릭 이벤트 추가
            link.addEventListener('click', (event) => {
                event.preventDefault();
                
                // 링크 경로 추출
                const href = link.getAttribute('href');
                if (!href) return;
                
                // 현재 파일 경로 기준으로 상대 경로 해석
                const basePath = filePath.substring(0, filePath.lastIndexOf('/') + 1);
                const targetPath = href.startsWith('/') ? href.substring(1) : basePath + href;
                
                // 파일 열기
                const targetFile = this.plugin.app.vault.getAbstractFileByPath(targetPath);
                if (targetFile && targetFile instanceof TFile) {
                    this.plugin.app.workspace.openLinkText(targetPath, filePath);
                }
            });
        });
    }
    //#endregion
} 