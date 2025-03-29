import { LayoutStrategy, CardPosition } from '@layouts/layoutStrategy';
import { CardNavigatorSettings } from '@domain/models/types';
import { Card } from '@domain/models/Card';
import { CardMaker } from '@presentation/views/cardContainer/cardMaker';
import { LayoutConfig } from '@layouts/layoutConfig';

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
        private settings: CardNavigatorSettings,
        private cardMaker: CardMaker,
        layoutConfig: LayoutConfig
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

    // 컨테이너 설정
    setContainer(container: HTMLElement) {
        this.container = container;
        this.container.classList.add('masonry-layout');
        
        // 컨테이너 스타일 적용
        this.applyContainerStyle();
        
        // 초기 컨테이너 너비 저장
        if (this.container) {
            this.previousContainerWidth = this.layoutConfig.getAvailableWidth();
        }
    }

    // 컨테이너 스타일 적용 (일원화된 메서드)
    private applyContainerStyle() {
        if (!this.container) return;
        
        // 기본 컨테이너 스타일 가져오기
        const containerStyle = this.layoutConfig.getContainerStyle(true);
        
        // 메이슨리 레이아웃 특화 스타일 추가
        Object.assign(this.container.style, {
            ...containerStyle,
            position: 'relative',
            width: '100%',
            height: '100%',
            boxSizing: 'border-box',
            display: 'block',
            overflow: 'hidden',
            transition: 'height 0.35s cubic-bezier(0.25, 0.1, 0.25, 1)' // 부드러운 높이 변화를 위한 트랜지션 추가
        });

        // CSS 변수 설정
        const cardGap = this.layoutConfig.getCardGap();
        this.container.style.setProperty('--masonry-columns', this.columns.toString());
        this.container.style.setProperty('--masonry-gap', `${cardGap}px`);
        this.container.style.setProperty('--masonry-card-width', `${this.cardWidth}px`);
    }

    // 카드 너비 계산 (일원화된 메서드)
    private calculateCardWidth(): number {
        return this.layoutConfig.calculateCardWidth(this.columns);
    }

    /**
     * 카드 너비 설정
     * 컨테이너 너비 변화에 따라 카드 너비를 업데이트합니다.
     * 카드 높이는 고정된 상태를 유지합니다.
     */
    setCardWidth(width?: number, forceUpdate: boolean = false): void {
        const oldWidth = this.cardWidth;
        
        // width 매개변수가 제공되지 않으면 계산
        if (width === undefined) {
            this.cardWidth = this.calculateCardWidth();
        } else {
            this.cardWidth = width;
        }

        // 카드 너비 변경 감지
        const widthChanged = Math.abs(oldWidth - this.cardWidth) > 1;

        // 강제 업데이트 또는 카드 너비가 변경된 경우에만 업데이트
        if (forceUpdate || widthChanged) {
            // 컨테이너가 있는 경우 CSS 변수 업데이트
            if (this.container) {
                this.container.style.setProperty('--masonry-columns', this.columns.toString());
                this.container.style.setProperty('--masonry-card-width', `${this.cardWidth}px`);
                
                // 컨테이너 스타일 다시 적용
                this.applyContainerStyle();
                
                // 모든 카드 요소의 너비 강제 업데이트
                this.updateAllCardWidths();
                
                // 카드 너비 변경 시 모든 카드 위치 재계산
                this.requestImmediateReflow();
            }
        }
    }

    /**
     * 컨테이너 너비 변화에 직접 반응하는 메서드
     * 레이아웃 매니저에서 직접 호출할 수 있습니다.
     */
    public updateContainerWidth(newWidth: number): void {
        if (!this.container || newWidth <= 0) return;
        
        // 너비 변경 감지 (1px 이상 차이가 있을 때)
        const widthChanged = Math.abs(newWidth - this.previousContainerWidth) > 1;
        
        if (widthChanged) {
            // 이전 너비 업데이트
            const oldWidth = this.previousContainerWidth;
            this.previousContainerWidth = newWidth;
            
            // 새 너비에 맞게 카드 너비 계산 (열 수는 고정)
            const oldCardWidth = this.cardWidth;
            const newCardWidth = this.layoutConfig.calculateCardWidth(this.columns);
            
            // 너비 변경 비율 계산 (카드 위치 조정에 사용)
            const widthRatio = newCardWidth / oldCardWidth;
            
            // 카드 너비 설정 (강제 업데이트 없이 먼저 값만 변경)
            this.cardWidth = newCardWidth;
            
            // 컨테이너 CSS 변수 업데이트
            if (this.container) {
                this.container.style.setProperty('--masonry-card-width', `${newCardWidth}px`);
            }
            
            // 모든 카드 요소의 너비와 위치를 한 번에 업데이트
            this.updateAllCardsWithNewWidth(newCardWidth, widthRatio);
            
            // 컨테이너 스타일 다시 적용
            this.applyContainerStyle();
        }
    }
    
    /**
     * 모든 카드의 너비와 위치를 새 너비에 맞게 한 번에 업데이트
     * 카드 위치가 안정적으로 유지되도록 함
     */
    private updateAllCardsWithNewWidth(newCardWidth: number, widthRatio: number): void {
        if (!this.container) return;
        
        // 모든 카드 요소 선택
        const cardElements = this.container.querySelectorAll('.card-navigator-card') as NodeListOf<HTMLElement>;
        
        // 컬럼 높이 초기화
        this.columnHeights = new Array(this.columns).fill(0);
        const cardGap = this.layoutConfig.getCardGap();
        
        // 각 카드 요소의 너비와 위치 업데이트
        cardElements.forEach(cardElement => {
            const cardId = cardElement.getAttribute('data-card-id');
            if (!cardId) return;
            
            // 카드 높이 가져오기
            let contentHeight = 0;
            if (this.cardHeights.has(cardId)) {
                contentHeight = this.cardHeights.get(cardId)!;
            } else {
                // 높이 정보가 없는 경우 현재 요소 높이 사용
                contentHeight = cardElement.offsetHeight;
                this.cardHeights.set(cardId, contentHeight);
            }
            
            // 가장 높이가 낮은 열 찾기
            const minHeightIndex = this.columnHeights.indexOf(Math.min(...this.columnHeights));
            
            // 새 위치 계산
            const x = minHeightIndex * (newCardWidth + cardGap);
            const y = this.columnHeights[minHeightIndex];
            
            // 카드 요소 스타일 업데이트
            const cardStyle = this.getCardStyle();
            Object.assign(cardElement.style, {
                position: 'absolute',
                transform: `translate3d(${x}px, ${y}px, 0)`,
                width: `${newCardWidth}px`,
                transition: this.getCardTransitionStyle(),
                willChange: 'transform, width',
                zIndex: '1',
                left: '0',
                top: '0'
            });
            
            // 해당 열의 높이 업데이트
            this.columnHeights[minHeightIndex] += contentHeight + cardGap;
        });
        
        // 컨테이너 높이 업데이트
        const containerPadding = this.layoutConfig.getContainerPadding();
        const maxHeight = Math.max(...this.columnHeights, 100) + containerPadding * 2;
        this.container.style.height = `${maxHeight}px`;
    }

    /**
     * 즉시 카드 재배치를 요청하는 메서드
     * 컨테이너 너비 변경 등으로 인해 카드 위치를 즉시 재계산해야 할 때 사용
     */
    private requestImmediateReflow(): void {
        if (!this.container) return;
        
        // 현재 표시된 모든 카드 요소 가져오기
        const cardElements = this.container.querySelectorAll('.card-navigator-card') as NodeListOf<HTMLElement>;
        
        // 컬럼 높이 초기화
        this.columnHeights = new Array(this.columns).fill(0);
        const cardGap = this.layoutConfig.getCardGap();
        
        // 각 카드 요소의 위치 재계산
        cardElements.forEach(cardElement => {
            const cardId = cardElement.getAttribute('data-card-id');
            if (!cardId) return;
            
            // 카드 높이 가져오기
            let contentHeight = 0;
            if (this.cardHeights.has(cardId)) {
                contentHeight = this.cardHeights.get(cardId)!;
            } else {
                // 높이 정보가 없는 경우 현재 요소 높이 사용
                contentHeight = cardElement.offsetHeight;
                this.cardHeights.set(cardId, contentHeight);
            }
            
            // 가장 높이가 낮은 열 찾기
            const minHeightIndex = this.columnHeights.indexOf(Math.min(...this.columnHeights));
            
            // 새 위치 계산
            const x = minHeightIndex * (this.cardWidth + cardGap);
            const y = this.columnHeights[minHeightIndex];
            
            // 카드 요소 스타일 업데이트
            const cardStyle = this.getCardStyle();
            Object.assign(cardElement.style, {
                ...cardStyle,
                position: 'absolute',
                transform: `translate3d(${x}px, ${y}px, 0)`,
                width: `${this.cardWidth}px`,
                height: `${contentHeight}px`,
                minHeight: '100px',
                zIndex: '1',
                left: '0',
                top: '0'
            });
            
            // 해당 열의 높이 업데이트
            this.columnHeights[minHeightIndex] += contentHeight + cardGap;
        });
        
        // 컨테이너 높이 업데이트
        const containerPadding = this.layoutConfig.getContainerPadding();
        const maxHeight = Math.max(...this.columnHeights, 100) + containerPadding * 2;
        this.container.style.height = `${maxHeight}px`;
    }

    /**
     * 모든 카드 요소의 너비를 현재 계산된 카드 너비로 강제 업데이트
     */
    private updateAllCardWidths(): void {
        if (!this.container) return;
        
        // 모든 카드 요소 선택
        const cardElements = this.container.querySelectorAll('.card-navigator-card') as NodeListOf<HTMLElement>;
        
        let updatedCount = 0;
        
        // 각 카드 요소의 너비 업데이트
        cardElements.forEach(cardElement => {
            const currentWidth = cardElement.style.width;
            const newWidth = `${this.cardWidth}px`;
            
            // 너비가 다른 경우에만 업데이트
            if (currentWidth !== newWidth) {
                // 트랜지션 스타일이 없는 경우 추가
                if (!cardElement.style.transition) {
                    cardElement.style.transition = this.getCardTransitionStyle();
                }
                
                // willChange 속성 추가
                if (!cardElement.style.willChange) {
                    cardElement.style.willChange = 'transform, width';
                }
                
                cardElement.style.width = newWidth;
                updatedCount++;
            }
        });
    }

    /**
     * 카드 트랜지션 스타일 반환
     * 모든 카드에 일관된 트랜지션 효과를 적용하기 위한 헬퍼 메서드
     */
    private getCardTransitionStyle(): string {
        return 'transform 0.35s cubic-bezier(0.25, 0.1, 0.25, 1), width 0.35s cubic-bezier(0.25, 0.1, 0.25, 1)';
    }

    // 카드를 메이슨리 형태로 배치
    arrange(cards: Card[], containerWidth: number, containerHeight: number): CardPosition[] {
        if (!this.container) return [];

        // 컨테이너 너비 변화 감지 및 카드 너비 업데이트
        if (Math.abs(containerWidth - this.previousContainerWidth) > 1) {
            // 이전 너비 업데이트
            this.previousContainerWidth = containerWidth;
            
            // 새 너비에 맞게 카드 너비 계산 (열 수는 고정)
            const cardWidth = this.layoutConfig.calculateCardWidth(this.columns);
            
            // 카드 너비 설정 (강제 업데이트)
            this.setCardWidth(cardWidth, true);
        }

        // 컨테이너 스타일 적용
        this.applyContainerStyle();

        // 컬럼 높이 초기화
        this.columnHeights = new Array(this.columns).fill(0);
        const positions: CardPosition[] = [];
        const cardGap = this.layoutConfig.getCardGap();

        // 카드 배치
        cards.forEach((card, index) => {
            // 카드 ID (파일 경로 사용)
            const cardId = card.getFile().path;
            
            // 카드 높이 결정 (이미 계산된 높이가 있으면 재사용, 없으면 계산)
            let contentHeight: number;
            if (this.cardHeights.has(cardId)) {
                // 이미 계산된 높이 재사용 (고정 높이 유지)
                contentHeight = this.cardHeights.get(cardId)!;
            } else {
                // 새 카드의 경우 높이 계산 및 저장
                contentHeight = this.calculateEstimatedHeight(card);
                this.cardHeights.set(cardId, contentHeight);
            }
            
            // 가장 높이가 낮은 열 찾기
            const minHeightIndex = this.columnHeights.indexOf(Math.min(...this.columnHeights));
            
            // 카드 위치 계산 - 현재 cardWidth 값을 사용하여 정확한 위치 계산
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
            
            // 해당 열의 높이 업데이트
            this.columnHeights[minHeightIndex] += contentHeight + cardGap;
            
            // 카드 요소 스타일 업데이트
            const cardElement = this.container!.querySelector(
                `[data-card-id="${cardId}"]`
            ) as HTMLElement;
            
            if (cardElement) {
                const cardStyle = this.getCardStyle();
                
                // 카드 요소에 정확한 위치와 크기 적용
                Object.assign(cardElement.style, {
                    ...cardStyle,
                    position: 'absolute',
                    transform: `translate3d(${x}px, ${y}px, 0)`,
                    width: `${this.cardWidth}px`,
                    height: `${contentHeight}px`,
                    minHeight: '100px',
                    zIndex: '1', // z-index 추가하여 겹침 방지
                    left: '0',  // left/top을 0으로 설정하고 transform으로 위치 조정
                    top: '0',
                    transition: this.getCardTransitionStyle(),
                    willChange: 'transform, width'
                });
            }
        });

        // 컨테이너 높이 설정
        const containerPadding = this.layoutConfig.getContainerPadding();
        const maxHeight = Math.max(...this.columnHeights, 100) + containerPadding * 2;
        this.container.style.height = `${maxHeight}px`;
        
        // 모든 카드 배치 후 카드 너비 일관성 확인
        this.updateAllCardWidths();
        
        return positions;
    }

    // 컨텐츠 기반 예상 높이 계산
    // 참고: 이 메서드는 카드 생성 시 한 번만 호출되며, 이후 높이는 고정됩니다.
    private calculateEstimatedHeight(card: Card): number {
        const lineHeight = 1.5;  // 기본 줄간격
        const padding = 32;      // 카드 내부 여백 (16px * 2)
        let estimatedHeight = padding;  // 시작 높이는 패딩값
        
        // 1. 파일명 높이 계산
        if (this.settings.showFileName) {
            const fileName = card.getFile().basename;
            if (fileName) {
                estimatedHeight += Math.ceil(
                    (fileName.length * this.settings.fileNameFontSize * 0.6) 
                    / (this.cardWidth - padding)
                ) * this.settings.fileNameFontSize * lineHeight;
                estimatedHeight += 8; // 파일명 아래 여백
            }
        }
        
        // 2. 첫 번째 헤더 높이 계산
        if (this.settings.showFirstHeader) {
            const content = card.getContent();
            const headerSection = content.header.find(section => section.type === 'header');
            if (headerSection) {
                estimatedHeight += Math.ceil(
                    (headerSection.content.length * this.settings.firstHeaderFontSize * 0.6) 
                    / (this.cardWidth - padding)
                ) * this.settings.firstHeaderFontSize * lineHeight;
                estimatedHeight += 16; // 헤더 아래 여백
            }
        }
        
        // 3. 본문 텍스트 높이 계산
        if (this.settings.showBody) {
            const content = card.getContent();
            const bodySection = content.body.find(section => section.type === 'text');
            if (bodySection) {
                const bodyText = bodySection.content;
                
                // 마크다운 구문 제거 전에 이미지 카운트 계산
                const markdownImages = (bodyText.match(/!\[(?:.*?)\]\((?:.*?)\)/g) || []);
                const htmlImages = (bodyText.match(/<img[^>]+>/g) || []);
                const embedImages = (bodyText.match(/\[\[(?:.*?\.(?:png|jpg|jpeg|gif|bmp|svg))\]\]/gi) || []);
                
                // 총 이미지 개수
                const imageCount = markdownImages.length + htmlImages.length + embedImages.length;
                
                if (imageCount > 0) {
                    // 이미지당 예상 높이 추가 (기본 500px)
                    const baseImageHeight = 200;
                    
                    // 이미지 크기 힌트 확인 (예: ![|100x200])
                    let totalImageHeight = 0;
                    
                    // 마크다운 이미지 크기 분석
                    markdownImages.forEach((img: string) => {
                        const sizeHint = img.match(/\|(\d+)x(\d+)/);
                        if (sizeHint) {
                            totalImageHeight += parseInt(sizeHint[2]); // 높이값 사용
                        } else {
                            totalImageHeight += baseImageHeight;
                        }
                    });
                    
                    // HTML 이미지 크기 분석
                    htmlImages.forEach((img: string) => {
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
                const plainText = bodyText
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
                
                lines.forEach((line: string) => {
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
                const htmlTagCount = (bodyText.match(/<[^>]*>/g) || []).length;
                if (htmlTagCount > 0) {
                    const tagHeightMultiplier = this.settings.renderContentAsHtml ? 0.8 : 0.3;
                    estimatedHeight += htmlTagCount * this.settings.bodyFontSize * tagHeightMultiplier;
                }
                
                // 코드 블록 높이 추가
                const codeBlocks = bodyText.match(/```[\s\S]*?```/g) || [];
                codeBlocks.forEach((block: string) => {
                    const lines = block.split('\n').length;
                    estimatedHeight += lines * this.settings.bodyFontSize * lineHeight;
                    estimatedHeight += 32; // 코드 블록 여백
                });
            }
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

    getContainerStyle(): Partial<CSSStyleDeclaration> {
        return this.layoutConfig.getContainerStyle(true);
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
        
        // 설정이 변경되면 열 수도 다시 계산
        const newColumns = this.determineColumnsCount();
        const columnsChanged = newColumns !== this.columns;
        
        if (columnsChanged) {
            this.columns = newColumns;
            this.columnHeights = new Array(this.columns).fill(0);
        }
        
        // 카드 너비 업데이트 (강제 업데이트)
        const cardWidth = this.calculateCardWidth();
        this.setCardWidth(cardWidth, true);
        
        // 카드 내용 관련 설정이 변경된 경우 카드 높이 캐시 초기화
        if (
            oldSettings.showFileName !== settings.showFileName ||
            oldSettings.showFirstHeader !== settings.showFirstHeader ||
            oldSettings.showBody !== settings.showBody ||
            oldSettings.fileNameFontSize !== settings.fileNameFontSize ||
            oldSettings.firstHeaderFontSize !== settings.firstHeaderFontSize ||
            oldSettings.bodyFontSize !== settings.bodyFontSize ||
            oldSettings.bodyLength !== settings.bodyLength ||
            oldSettings.bodyLengthLimit !== settings.bodyLengthLimit ||
            oldSettings.renderContentAsHtml !== settings.renderContentAsHtml // HTML 렌더링 설정 변경 감지 추가
        ) {
            // 카드 높이 캐시 초기화
            this.cardHeights.clear();
        }
    }
    //#endregion
}
