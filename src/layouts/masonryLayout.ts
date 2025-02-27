import { LayoutStrategy, CardPosition } from './layoutStrategy';
import { Card, CardNavigatorSettings } from 'common/types';
import { CardMaker } from 'ui/cardContainer/cardMaker';
import { LayoutConfig } from './layoutConfig';

/**
 * 메이슨리 레이아웃 전략을 구현하는 클래스
 * 카드를 다양한 높이를 가진 열 형태로 배열합니다.
 */
export class MasonryLayout implements LayoutStrategy {
    //#region 클래스 속성
    private container: HTMLElement | null = null;
    private cardWidth: number = 0;
    private columns: number = 1;
    private columnHeights: number[] = [];
    private layoutConfig: LayoutConfig;
    private previousContainerWidth: number = 0; // 이전 컨테이너 너비 저장 변수
    private cardHeights: Map<string, number> = new Map(); // 카드 ID별 높이 저장 (고정 높이 유지용)
    //#endregion

    //#region 초기화 및 설정
    // 생성자: 메이슨리 레이아웃 초기화
    constructor(
        layoutConfig: LayoutConfig,
        private settings: CardNavigatorSettings,
        private cardMaker: CardMaker
    ) {
        this.layoutConfig = layoutConfig;
        // 초기 열 수 설정
        this.columns = this.determineColumnsCount();
        this.cardWidth = this.calculateCardWidth();
        this.columnHeights = new Array(this.columns).fill(0);
    }

    // 열 수 결정 (일원화된 메서드)
    private determineColumnsCount(): number {
        // defaultLayout이 'masonry'일 때는 settings.masonryColumns 사용
        if (this.settings.defaultLayout === 'masonry') {
            return this.settings.masonryColumns;
        }
        
        // defaultLayout이 'auto'이고 alignCardHeight가 false일 때만 동적 계산
        if (this.settings.defaultLayout === 'auto' && !this.settings.alignCardHeight) {
            return this.layoutConfig.calculateAutoColumns();
        }
        
        // 기본값으로 masonryColumns 사용
        return this.settings.masonryColumns;
    }

    /**
     * 컨테이너 요소 설정
     */
    setContainer(container: HTMLElement): void {
        // 동일한 컨테이너가 이미 설정되어 있는 경우 스타일만 재적용
        const isSameContainer = this.container === container;
        this.container = container;
        
        // 컨테이너 스타일 적용
        this.applyContainerStyle();
        
        // 초기 카드 너비 계산 (새 컨테이너인 경우에만)
        if (!isSameContainer) {
            const cardWidth = this.calculateCardWidth();
            this.setCardWidth(cardWidth);
            
            // 컨테이너 너비 초기화
            this.previousContainerWidth = container.offsetWidth;
        }
    }

    // 컨테이너 스타일 적용 (완전히 재작성된 메서드)
    private applyContainerStyle(): void {
        if (!this.container) return;
        
        // 메이슨리 레이아웃 클래스 추가
        this.container.classList.add('masonry-layout');
        
        // 기존 스타일 속성 제거 (충돌 방지)
        this.container.style.removeProperty('flex-direction');
        this.container.style.removeProperty('gap');
        this.container.style.removeProperty('align-items');
        this.container.style.removeProperty('display');
        this.container.style.removeProperty('grid-template-columns');
        this.container.style.removeProperty('grid-auto-rows');
        this.container.style.removeProperty('align-content');
        
        // 패딩 값 가져오기
        const containerPadding = this.layoutConfig.getContainerPadding();
        const cardGap = this.layoutConfig.getCardGap();
        
        // CSS 변수 설정 - 일관된 변수명 사용
        this.container.style.setProperty('--card-navigator-columns', this.columns.toString());
        this.container.style.setProperty('--card-navigator-card-width', `${this.cardWidth}px`);
        this.container.style.setProperty('--card-navigator-gap', `${cardGap}px`);
        this.container.style.setProperty('--card-navigator-container-padding', `${containerPadding}px`);
        
        // 컨테이너 스타일 적용
        const containerStyle = this.getContainerStyle();
        Object.assign(this.container.style, containerStyle);
    }

    // 카드 너비 계산 (일원화된 메서드)
    private calculateCardWidth(): number {
        return this.layoutConfig.calculateCardWidth(this.columns);
    }

    /**
     * 카드 너비 설정
     * 모든 카드의 너비를 업데이트하고 필요한 경우 레이아웃을 다시 계산합니다.
     */
    public setCardWidth(width?: number): void {
        // 매개변수가 제공되지 않으면 계산
        const newWidth = width !== undefined ? width : this.calculateCardWidth();
        
        // 너비 변화가 미미한 경우 무시 (1px 이하 변화는 무시)
        if (Math.abs(newWidth - this.cardWidth) <= 1) return;
        
        // 카드 너비 업데이트
        this.cardWidth = newWidth;
        
        if (this.container) {
            // CSS 변수 업데이트
            this.container.style.setProperty('--card-navigator-card-width', `${this.cardWidth}px`);
            
            // 성능 최적화: requestAnimationFrame을 사용하여 다음 프레임에서 카드 너비 업데이트
            requestAnimationFrame(() => {
                this.updateAllCardWidths();
            });
        }
    }

    /**
     * 컨테이너 너비 변경 시 호출
     * 카드 너비를 다시 계산하고 필요한 경우 레이아웃을 업데이트합니다.
     */
    updateContainerWidth(newWidth: number): void {
        if (!this.container) return;
        
        // 너비 변화가 미미한 경우 무시 (1px 이하 변화는 무시)
        if (Math.abs(newWidth - this.previousContainerWidth) <= 1) return;
        
        // 이전 너비 업데이트
        this.previousContainerWidth = newWidth;
        
        // 열 수 재계산
        const newColumns = this.determineColumnsCount();
        const columnsChanged = newColumns !== this.columns;
        
        if (columnsChanged) {
            this.columns = newColumns;
            this.columnHeights = new Array(this.columns).fill(0);
            
            // 레이아웃 설정에 열 수 업데이트
            this.layoutConfig.updatePreviousColumns(this.columns);
            
            // 컨테이너에 열 수 CSS 변수만 업데이트
            if (this.container) {
                this.container.style.setProperty('--card-navigator-columns', this.columns.toString());
            }
        }
        
        // 카드 너비 업데이트 (열 수 변경 또는 컨테이너 너비 변경 시에만)
        const cardWidth = this.calculateCardWidth();
        if (Math.abs(cardWidth - this.cardWidth) > 1 || columnsChanged) {
            this.setCardWidth(cardWidth);
            
            // 컨테이너 스타일 재적용 (패딩 일관성 유지)
            this.applyContainerStyle();
        }
    }

    /**
     * 카드 배치 로직을 처리하는 공통 메서드
     * arrange와 updateAllCardWidths에서 공유하는 로직을 통합
     */
    private arrangeCards(cardElements: NodeListOf<HTMLElement> | null = null, cards: Card[] = []): CardPosition[] {
        if (!this.container) return [];
        
        // 컬럼 높이 초기화
        this.columnHeights = new Array(this.columns).fill(0);
        
        const positions: CardPosition[] = [];
        const cardGap = this.layoutConfig.getCardGap();
        const containerPadding = this.layoutConfig.getContainerPadding();
        const cardStyle = this.getCardStyle();
        const transitionStyle = this.getCardTransitionStyle();
        
        // 성능 최적화: 모든 위치 계산을 먼저 완료한 후 DOM 업데이트
        const updates: Array<{element: HTMLElement | null, id: string, x: number, y: number, height: number}> = [];
        
        // 카드 배치 방식 결정 (DOM 요소 기반 또는 카드 데이터 기반)
        if (cardElements && cardElements.length > 0) {
            // DOM 요소 기반 배치 (updateAllCardWidths 로직)
            Array.from(cardElements).forEach(cardElement => {
                const cardId = cardElement.getAttribute('data-card-id');
                if (!cardId) return;
                
                // 카드 높이 가져오기
                const contentHeight = this.cardHeights.get(cardId) || 100;
                
                // 가장 높이가 낮은 열 찾기
                const minHeightIndex = this.columnHeights.indexOf(Math.min(...this.columnHeights));
                
                // 새 위치 계산 - 패딩 고려
                const x = minHeightIndex * (this.cardWidth + cardGap) + containerPadding;
                const y = this.columnHeights[minHeightIndex];
                
                // 위치 정보 저장
                positions.push({
                    id: cardId,
                    left: x,
                    top: y,
                    width: this.cardWidth,
                    height: contentHeight
                });
                
                // 업데이트 정보 저장
                updates.push({
                    element: cardElement,
                    id: cardId,
                    x,
                    y,
                    height: contentHeight
                });
                
                // 해당 열의 높이 업데이트
                this.columnHeights[minHeightIndex] += contentHeight + cardGap;
            });
        } else if (cards.length > 0) {
            // 카드 데이터 기반 배치 (arrange 로직)
            cards.forEach((card) => {
                const cardId = card.file.path;
                
                // 카드 높이 결정 (이미 계산된 높이가 있으면 재사용, 없으면 계산)
                let contentHeight: number;
                if (this.cardHeights.has(cardId)) {
                    contentHeight = this.cardHeights.get(cardId)!;
                } else {
                    contentHeight = this.calculateEstimatedHeight(card);
                    this.cardHeights.set(cardId, contentHeight);
                }
                
                // 가장 높이가 낮은 열 찾기
                const minHeightIndex = this.columnHeights.indexOf(Math.min(...this.columnHeights));
                
                // 카드 위치 계산 - 컨테이너 패딩 고려
                const x = minHeightIndex * (this.cardWidth + cardGap);
                const y = this.columnHeights[minHeightIndex];
                
                // 위치 정보 저장
                positions.push({
                    id: cardId,
                    left: x,
                    top: y,
                    width: this.cardWidth,
                    height: contentHeight
                });
                
                // 카드 요소 찾기
                const cardElement = this.container!.querySelector(
                    `[data-card-id="${cardId}"]`
                ) as HTMLElement;
                
                // 업데이트 정보 저장
                updates.push({
                    element: cardElement,
                    id: cardId,
                    x,
                    y,
                    height: contentHeight
                });
                
                // 해당 열의 높이 업데이트
                this.columnHeights[minHeightIndex] += contentHeight + cardGap;
            });
        }
        
        // 배치 처리: 모든 DOM 업데이트를 한 번에 수행
        updates.forEach(update => {
            if (update.element) {
                Object.assign(update.element.style, {
                    ...cardStyle,
                    position: 'absolute',
                    transform: `translate3d(${update.x}px, ${update.y}px, 0)`,
                    width: `${this.cardWidth}px`,
                    height: `${update.height}px`,
                    minHeight: '100px',
                    zIndex: '1',
                    left: '0',
                    top: '0',
                    transition: transitionStyle,
                    willChange: 'transform, width'
                });
            }
        });
        
        // 컨테이너 높이 설정 - 패딩 고려
        const maxHeight = Math.max(...this.columnHeights, 100);
        this.container.style.height = `${maxHeight + containerPadding * 2}px`;
        
        return positions;
    }

    /**
     * 모든 카드 요소의 너비를 현재 계산된 카드 너비로 강제 업데이트
     */
    private updateAllCardWidths(): void {
        if (!this.container) return;
        
        // 모든 카드 요소 선택
        const cardElements = this.container.querySelectorAll('.card-navigator-card') as NodeListOf<HTMLElement>;
        if (cardElements.length === 0) return;
        
        // 공통 arrangeCards 메서드 호출
        this.arrangeCards(cardElements);
    }

    // 컨텐츠 기반 예상 높이 계산
    // 참고: 이 메서드는 카드 생성 시 한 번만 호출되며, 이후 높이는 고정됩니다.
    private calculateEstimatedHeight(card: Card): number {
        const lineHeight = 1.5;  // 기본 줄간격
        const padding = 32;      // 카드 내부 여백 (16px * 2)
        let estimatedHeight = padding;  // 시작 높이는 패딩값
        
        // 1. 파일명 높이 계산
        if (this.settings.showFileName && card.file.basename) {
            estimatedHeight += Math.ceil(
                (card.file.basename.length * this.settings.fileNameFontSize * 0.6) 
                / (this.cardWidth - padding)
            ) * this.settings.fileNameFontSize * lineHeight;
            estimatedHeight += 8; // 파일명 아래 여백
        }
        
        // 2. 첫 번째 헤더 높이 계산
        if (this.settings.showFirstHeader && card.firstHeader) {
            estimatedHeight += Math.ceil(
                (card.firstHeader.length * this.settings.firstHeaderFontSize * 0.6) 
                / (this.cardWidth - padding)
            ) * this.settings.firstHeaderFontSize * lineHeight;
            estimatedHeight += 16; // 헤더 아래 여백
        }
        
        // 3. 본문 텍스트 높이 계산
        if (this.settings.showBody && card.body) {
            // 마크다운 구문 제거 전에 이미지 카운트 계산
            const markdownImages = (card.body.match(/!\[(?:.*?)\]\((?:.*?)\)/g) || []);
            const htmlImages = (card.body.match(/<img[^>]+>/g) || []);
            const embedImages = (card.body.match(/\[\[(?:.*?\.(?:png|jpg|jpeg|gif|bmp|svg))\]\]/gi) || []);
            
            // 총 이미지 개수
            const imageCount = markdownImages.length + htmlImages.length + embedImages.length;
            
            if (imageCount > 0) {
                // 이미지당 예상 높이 추가 (기본 500px)
                const baseImageHeight = 200;
                
                // 이미지 크기 힌트 확인 (예: ![|100x200])
                let totalImageHeight = 0;
                
                // 마크다운 이미지 크기 분석
                markdownImages.forEach(img => {
                    const sizeHint = img.match(/\|(\d+)x(\d+)/);
                    if (sizeHint) {
                        totalImageHeight += parseInt(sizeHint[2]); // 높이값 사용
                    } else {
                        totalImageHeight += baseImageHeight;
                    }
                });
                
                // HTML 이미지 크기 분석
                htmlImages.forEach(img => {
                    const heightMatch = img.match(/height="(\d+)"/);
                    if (heightMatch) {
                        totalImageHeight += parseInt(heightMatch[1]);
                    } else {
                        totalImageHeight += baseImageHeight;
                    }
                });
                
                // 임베드 이미지는 기본 크기 적용
                totalImageHeight += embedImages.length * baseImageHeight;
                
                estimatedHeight += totalImageHeight;
                estimatedHeight += imageCount * 32; // 이미지 간격
            }
            
            // 마크다운 구문 제거 (이미지 제외)
            const plainText = card.body
                .replace(/!\[(?:.*?)\]\((?:.*?)\)/g, '') // 이미지 마크다운 제거
                .replace(/<img[^>]+>/g, '') // HTML 이미지 태그 제거
                .replace(/\[\[(?:.*?\.(?:png|jpg|jpeg|gif|bmp|svg))\]\]/gi, '') // 임베드 이미지 제거
                .replace(/[#*`_~\[\]()]/g, ''); // 다른 마크다운 구문 제거
            
            // 텍스트 줄 수 계산 개선
            const lines = plainText.split('\n');
            let totalLines = 0;
            
            // HTML 렌더링 여부에 따른 계수 조정
            const charWidthMultiplier = this.settings.renderContentAsHtml ? 
                { korean: 1.0, other: 0.5 } : // HTML 렌더링 시 더 조밀하게
                { korean: 0.9, other: 0.45 };  // 일반 텍스트 시 더 넓게
            
            const spaceMultiplier = this.settings.renderContentAsHtml ? 12 : 4; // 여유 공간 조정
            const emptyLineHeight = this.settings.renderContentAsHtml ? 1.0 : 0.5; // 빈 줄 높이 조정
            
            lines.forEach(line => {
                if (line.trim() === '') {
                    // 빈 줄 계산 (HTML 렌더링 여부에 따라 다르게)
                    totalLines += emptyLineHeight;
                } else {
                    // 한글/영문 너비 계산 (HTML 렌더링 여부에 따라 다르게)
                    let lineWidth = 0;
                    for (let char of line) {
                        // 한글 유니코드 범위: AC00-D7AF
                        if (/[\uAC00-\uD7AF]/.test(char)) {
                            lineWidth += this.settings.bodyFontSize * charWidthMultiplier.korean;
                        } else {
                            lineWidth += this.settings.bodyFontSize * charWidthMultiplier.other;
                        }
                    }
                    
                    // 실제 줄 수 계산 (HTML 렌더링 여부에 따라 여유 공간 다르게)
                    const availableWidth = this.cardWidth - (padding + spaceMultiplier);
                    const lineCount = Math.ceil(lineWidth / availableWidth);
                    
                    // HTML 렌더링 시 더 조밀하게, 일반 텍스트 시 더 넓게
                    const lineMultiplier = this.settings.renderContentAsHtml ? 1.0 : 0.7;
                    totalLines += Math.max(1, lineCount * lineMultiplier);
                }
            });
            
            // 줄 간격을 고려한 높이 계산 (HTML 렌더링 여부에 따라 다르게)
            const lineHeightMultiplier = this.settings.renderContentAsHtml ? 1.3 : 0.9;
            estimatedHeight += totalLines * this.settings.bodyFontSize * lineHeightMultiplier;
            
            // 단락 간격 조정 (HTML 렌더링 여부에 따라 다르게)
            const paragraphCount = plainText.split(/\n\s*\n/).length - 1;
            if (paragraphCount > 0) {
                const paragraphSpaceMultiplier = this.settings.renderContentAsHtml ? 0.8 : 0.3;
                estimatedHeight += paragraphCount * this.settings.bodyFontSize * paragraphSpaceMultiplier;
            }
            
            // HTML 태그가 있는 경우 추가 높이 계산
            const htmlTagCount = (card.body.match(/<[^>]*>/g) || []).length;
            if (htmlTagCount > 0) {
                const tagHeightMultiplier = this.settings.renderContentAsHtml ? 0.8 : 0.3;
                estimatedHeight += htmlTagCount * this.settings.bodyFontSize * tagHeightMultiplier;
            }
            
            // 코드 블록 높이 추가
            const codeBlocks = card.body.match(/```[\s\S]*?```/g) || [];
            codeBlocks.forEach(block => {
                const lines = block.split('\n').length;
                estimatedHeight += lines * this.settings.bodyFontSize * lineHeight;
                estimatedHeight += 32; // 코드 블록 여백
            });
        }
        
        // 4. 최소 높이 보장
        const finalHeight = Math.max(estimatedHeight, 100);
                
        return finalHeight;
    }
    //#endregion

    //#region 레이아웃 속성 조회
    // 열 수 반환
    getColumnsCount(): number {
        return this.columns;
    }

    // 스크롤 방향 반환 (항상 수직)
    getScrollDirection(): 'vertical' | 'horizontal' {
        return 'vertical';
    }

    // 레이아웃 타입 반환
    getLayoutType(): string {
        return 'masonry';
    }

    /**
     * 컨테이너 스타일을 가져옵니다.
     * 메이슨리 레이아웃에 특화된 스타일을 반환합니다.
     */
    getContainerStyle(): Partial<CSSStyleDeclaration> {
        const containerPadding = this.layoutConfig.getContainerPadding();
        return {
            position: 'relative',
            width: '100%',
            height: '100%',
            boxSizing: 'border-box',
            display: 'block',
            overflow: 'auto',
            overflowY: 'auto',
            overflowX: 'hidden',
            transition: 'height 0.35s cubic-bezier(0.25, 0.1, 0.25, 1)',
            paddingRight: `${containerPadding}px`,
            paddingLeft: `${containerPadding}px`,
        };
    }

    getCardStyle(): Partial<CSSStyleDeclaration> {
        return {
            ...this.layoutConfig.getCardStyle(true, false),
            position: 'absolute',
            width: `${this.cardWidth}px`,
            transition: this.getCardTransitionStyle(),
            willChange: 'transform, width'
        };
    }

    /**
     * 카드 트랜지션 스타일 반환
     * 모든 카드에 일관된 트랜지션 효과를 적용하기 위한 헬퍼 메서드
     */
    private getCardTransitionStyle(): string {
        return 'transform 0.35s cubic-bezier(0.25, 0.1, 0.25, 1), width 0.35s cubic-bezier(0.25, 0.1, 0.25, 1)';
    }
    //#endregion

    //#region 리소스 정리
    // 레이아웃 정리
    destroy() {
        this.container = null;
        this.columnHeights = [];
        this.cardHeights.clear();
    }

    // 설정 업데이트
    updateSettings(settings: CardNavigatorSettings) {
        const oldSettings = this.settings;
        this.settings = settings;
        
        // 설정 변경 감지 플래그
        let needsLayoutUpdate = false;
        let needsHeightRecalculation = false;
        
        // 열 수 관련 설정 변경 감지
        if (
            oldSettings.defaultLayout !== settings.defaultLayout ||
            oldSettings.masonryColumns !== settings.masonryColumns ||
            oldSettings.cardWidthThreshold !== settings.cardWidthThreshold
        ) {
            // 열 수 재계산
            const newColumns = this.determineColumnsCount();
            const columnsChanged = newColumns !== this.columns;
            
            if (columnsChanged) {
                this.columns = newColumns;
                this.columnHeights = new Array(this.columns).fill(0);
                needsLayoutUpdate = true;
                
                // 컨테이너가 있는 경우 CSS 변수 업데이트
                if (this.container) {
                    this.container.style.setProperty('--card-navigator-columns', this.columns.toString());
                }
            }
        }
        
        // 카드 내용 관련 설정 변경 감지
        if (
            oldSettings.showFileName !== settings.showFileName ||
            oldSettings.showFirstHeader !== settings.showFirstHeader ||
            oldSettings.showBody !== settings.showBody ||
            oldSettings.fileNameFontSize !== settings.fileNameFontSize ||
            oldSettings.firstHeaderFontSize !== settings.firstHeaderFontSize ||
            oldSettings.bodyFontSize !== settings.bodyFontSize ||
            oldSettings.bodyLength !== settings.bodyLength ||
            oldSettings.bodyLengthLimit !== settings.bodyLengthLimit ||
            oldSettings.renderContentAsHtml !== settings.renderContentAsHtml
        ) {
            // 카드 높이 캐시 초기화
            this.cardHeights.clear();
            needsHeightRecalculation = true;
        }
        
        // 레이아웃 업데이트가 필요한 경우에만 카드 너비 업데이트
        if (needsLayoutUpdate || needsHeightRecalculation) {
            const cardWidth = this.calculateCardWidth();
            this.setCardWidth(cardWidth);
        }
    }

    // 카드를 메이슨리 형태로 배치
    arrange(cards: Card[], containerWidth: number, containerHeight: number): CardPosition[] {
        if (!this.container) return [];

        // 컨테이너 너비 변화 감지 및 카드 너비 업데이트
        if (Math.abs(containerWidth - this.previousContainerWidth) > 1) {
            this.updateContainerWidth(containerWidth);
        }

        // 공통 arrangeCards 메서드 호출
        return this.arrangeCards(null, cards);
    }
    //#endregion
}
