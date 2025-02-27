import { App } from 'obsidian';
import { CardNavigatorSettings, Card } from 'common/types';
import { VIEW_TYPE_CARD_NAVIGATOR } from 'ui/cardNavigatorView';

/**
 * 레이아웃 설정과 계산을 중앙에서 관리하는 클래스
 * 모든 레이아웃 관련 계산의 단일 소스 역할을 합니다.
 */
export class LayoutConfig {
    //#region 클래스 속성
    private containerEl: HTMLElement;
    private settings: CardNavigatorSettings;
    private app: App;
    private previousColumns: number = 0;
    private _isVertical: boolean | null = null; // 캐시된 방향 값
    //#endregion

    constructor(app: App, containerEl: HTMLElement, settings: CardNavigatorSettings) {
        this.app = app;
        this.containerEl = containerEl;
        this.settings = settings;
    }

    //#region CSS 변수 가져오기
    /**
     * CSS 변수 값을 가져옵니다.
     */
    public getCSSVariable(variableName: string, defaultValue: number): number {
        if (!this.containerEl) return defaultValue;
        const valueStr = getComputedStyle(this.containerEl).getPropertyValue(variableName).trim();
        return parseInt(valueStr) || defaultValue;
    }

    /**
     * CSS 변수 값을 숫자로 가져옵니다.
     */
    private getCSSVariableAsNumber(variableName: string, defaultValue: number): number {
        if (!this.containerEl) return defaultValue;
        
        const value = getComputedStyle(this.containerEl).getPropertyValue(variableName);
        if (!value) return defaultValue;
        
        // px 단위 제거 후 숫자로 변환
        const numValue = parseFloat(value.replace('px', ''));
        return isNaN(numValue) ? defaultValue : numValue;
    }

    /**
     * 카드 간격을 가져옵니다.
     */
    public getCardGap(): number {
        return this.getCSSVariable('--card-navigator-gap', 10);
    }

    /**
     * 컨테이너 패딩을 가져옵니다.
     */
    public getContainerPadding(): number {
        return this.getCSSVariable('--card-navigator-container-padding', 10);
    }
    //#endregion

    //#region 컨테이너 관련 메서드
    /**
     * 컨테이너 크기 정보를 가져옵니다.
     */
    public getContainerSize(): { width: number, height: number, ratio: number } {
        const width = this.containerEl?.offsetWidth || 0;
        const height = this.containerEl?.offsetHeight || 0;
        const ratio = width > 0 && height > 0 ? width / height : 0;
        
        return { width, height, ratio };
    }
    
    /**
     * 사용 가능한 컨테이너 너비를 계산합니다.
     */
    public getAvailableWidth(): number {
        if (!this.containerEl) return 0;
        
        const containerStyle = window.getComputedStyle(this.containerEl);
        const containerWidth = this.containerEl.offsetWidth;
        const paddingLeft = parseFloat(containerStyle.paddingLeft) || 0;
        const paddingRight = parseFloat(containerStyle.paddingRight) || 0;
        
        return containerWidth - paddingLeft - paddingRight;
    }

    /**
     * 사용 가능한 컨테이너 높이를 계산합니다.
     */
    public getAvailableHeight(): number {
        if (!this.containerEl) return 0;
        
        const containerStyle = window.getComputedStyle(this.containerEl);
        const containerHeight = this.containerEl.offsetHeight;
        const paddingTop = parseFloat(containerStyle.paddingTop) || 0;
        const paddingBottom = parseFloat(containerStyle.paddingBottom) || 0;
        
        return containerHeight - paddingTop - paddingBottom;
    }

    /**
     * 컨테이너가 수직인지 확인합니다.
     * 이 메서드는 레이아웃 방향을 결정하는 핵심 메서드입니다.
     */
    public isVerticalContainer(): boolean {
        // 컨테이너 크기 정보 가져오기
        const { width, height, ratio } = this.getContainerSize();
        console.log(`[CardNavigator] 컨테이너 크기: ${width}x${height}, 비율(w/h): ${ratio.toFixed(2)}`);
        
        // 레이아웃 타입 로깅
        console.log(`[CardNavigator] isVerticalContainer 호출: defaultLayout = ${this.settings.defaultLayout}`);
        
        // 컨테이너 크기가 아직 계산되지 않은 경우 (초기 렌더링 시)
        if (width === 0 || height === 0) {
            console.log(`[CardNavigator] 컨테이너 크기가 아직 계산되지 않음. 대체 방법 시도`);
            
            // CSS 변수에서 크기 정보 가져오기 시도
            const containerWidth = this.getCSSVariableAsNumber('--container-width', 0);
            const containerHeight = this.getCSSVariableAsNumber('--container-height', 0);
            
            if (containerWidth > 0 && containerHeight > 0) {
                const cssRatio = containerWidth / containerHeight;
                const isVerticalByCSS = cssRatio < 1;
                console.log(`[CardNavigator] CSS 변수 기반 방향 결정: ${containerWidth}x${containerHeight}, isVertical = ${isVerticalByCSS}`);
                
                // 캐시된 방향 값 업데이트
                this._isVertical = isVerticalByCSS;
                
                // 레이아웃 타입에 따른 추가 처리
                if (this.settings.defaultLayout === 'grid' || this.settings.defaultLayout === 'masonry') {
                    this._isVertical = true;
                    console.log(`[CardNavigator] 그리드/메이슨리 레이아웃은 항상 세로 모드 사용`);
                    return true;
                }
                
                return isVerticalByCSS;
            }
            
            // 캐시된 값이 있으면 사용
            if (this._isVertical !== null) {
                console.log(`[CardNavigator] 캐시된 방향 값 사용: isVertical = ${this._isVertical}`);
                return this._isVertical;
            }
            
            // 리스트 레이아웃인 경우 기본적으로 세로 모드 사용
            if (this.settings.defaultLayout === 'list') {
                this._isVertical = true;
                console.log(`[CardNavigator] 리스트 레이아웃 기본값: isVertical = true (세로 모드)`);
                return true;
            }
            
            // auto 레이아웃에서 1열인 경우에도 기본적으로 세로 모드 사용
            if (this.settings.defaultLayout === 'auto' && this.calculateAutoColumns() === 1) {
                this._isVertical = true;
                console.log(`[CardNavigator] auto 레이아웃 1열 기본값: isVertical = true (세로 모드)`);
                return true;
            }
            
            // 그리드 및 메이슨리 레이아웃은 항상 세로 모드 사용
            this._isVertical = true;
            console.log(`[CardNavigator] 그리드/메이슨리 레이아웃: isVertical = true (세로 모드)`);
            return true;
        }
        
        // 컨테이너 비율에 따른 방향 결정
        // 비율이 1보다 작으면 세로로 긴 컨테이너 (세로 모드 사용)
        // 비율이 1보다 크면 가로로 긴 컨테이너 (가로 모드 사용)
        const isVerticalByRatio = ratio < 1;
        
        // 리스트 레이아웃인 경우 컨테이너 비율에 따라 방향 결정
        if (this.settings.defaultLayout === 'list') {
            this._isVertical = isVerticalByRatio;
            console.log(`[CardNavigator] 리스트 레이아웃: isVertical = ${isVerticalByRatio} (${isVerticalByRatio ? '세로' : '가로'} 모드)`);
            return isVerticalByRatio;
        }
        
        // auto 레이아웃에서 1열인 경우에도 컨테이너 비율에 따라 방향 결정
        if (this.settings.defaultLayout === 'auto' && this.calculateAutoColumns() === 1) {
            this._isVertical = isVerticalByRatio;
            console.log(`[CardNavigator] auto 레이아웃 1열: isVertical = ${isVerticalByRatio} (${isVerticalByRatio ? '세로' : '가로'} 모드)`);
            return isVerticalByRatio;
        }
        
        // 그리드 및 메이슨리 레이아웃은 항상 세로 모드 사용
        this._isVertical = true;
        console.log(`[CardNavigator] 그리드/메이슨리 레이아웃: isVertical = true (세로 모드)`);
        return true;
    }
    
    /**
     * 컨테이너 스타일을 가져옵니다.
     */
    public getContainerStyle(isVertical: boolean): Partial<CSSStyleDeclaration> {
        console.log(`[CardNavigator] 컨테이너 스타일 가져오기: isVertical = ${isVertical}`);
        
        const cardGap = this.getCardGap();
        const containerPadding = this.getContainerPadding();
        
        // isVertical 값에 따라 컨테이너 스타일 설정
        // true: 세로 배열 및 세로 스크롤, false: 가로 배열 및 가로 스크롤
        return {
            display: 'flex',
            flexDirection: isVertical ? 'column' : 'row',
            gap: `${cardGap}px`,
            alignItems: 'stretch',
            overflowY: isVertical ? 'auto' : 'hidden',
            overflowX: isVertical ? 'hidden' : 'auto',
            paddingLeft: isVertical ? `${containerPadding}px` : '0',
            paddingRight: isVertical ? `${containerPadding}px` : '0',
            paddingTop: isVertical ? '0' : `${containerPadding}px`,
            paddingBottom: isVertical ? '0' : `${containerPadding}px`,
        };
    }
    //#endregion

    //#region 레이아웃 계산
    /**
     * 자동 레이아웃의 열 수를 계산합니다.
     */
    public calculateAutoColumns(): number {
        const availableWidth = this.getAvailableWidth();
        const cardGap = this.getCardGap();
        const threshold = this.settings.cardWidthThreshold;
        
        // 히스테리시스 버퍼
        const upperBuffer = 40;
        const lowerBuffer = 20;
        
        // 현재 열 수 계산
        let columns = Math.max(1, Math.floor((availableWidth + cardGap) / (threshold + cardGap)));
        
        // 실제 카드 너비 계산
        const actualCardWidth = (availableWidth - (columns - 1) * cardGap) / columns;
        
        // 1열 강제 전환 조건
        if (actualCardWidth < threshold - lowerBuffer) {
            return 1;
        }
        
        // 2열 이상에서의 히스테리시스 적용
        if (columns >= 2 && this.previousColumns > 0) {
            // 이전 열 수에서의 카드 너비 계산
            const previousWidth = (availableWidth - (this.previousColumns - 1) * cardGap) / this.previousColumns;
            
            // 이전 상태가 유효하면 히스테리시스 적용
            if (previousWidth >= threshold - lowerBuffer && previousWidth <= threshold + upperBuffer) {
                return this.previousColumns;
            }
            
            // 열 수가 증가하는 경우 (컨테이너 너비 증가)
            if (columns > this.previousColumns) {
                // 새로운 열 수에서의 카드 너비가 임계값보다 충분히 큰 경우에만 열 수 증가
                if (actualCardWidth >= threshold + upperBuffer) {
                    return columns;
                } else {
                    // 그렇지 않으면 이전 열 수 유지
                    return this.previousColumns;
                }
            }
        }
        
        return columns;
    }
    //#endregion

    //#region 카드 관련 메서드
    /**
     * 카드 너비를 계산합니다.
     */
    public calculateCardWidth(columns: number): number {
        const availableWidth = this.getAvailableWidth();
        const cardGap = this.getCardGap();
        const totalGapWidth = cardGap * (columns - 1);
        
        return Math.floor((availableWidth - totalGapWidth) / columns);
    }

    /**
     * 카드 높이를 계산합니다.
     * @param layout 레이아웃 타입
     * @param isVertical 수직 방향 여부
     * @param card 카드 객체 (메이슨리 레이아웃에서만 사용)
     * @param cardWidth 카드 너비 (메이슨리 레이아웃에서만 사용)
     * @returns 계산된 카드 높이 또는 'auto'
     */
    public calculateCardHeight(
        layout: CardNavigatorSettings['defaultLayout'], 
        isVertical: boolean, 
        card?: Card, 
        cardWidth?: number
    ): number | 'auto' {
        // 그리드 레이아웃은 고정 높이 사용
        if (layout === 'grid') {
            return this.settings.gridCardHeight;
        }

        // 메이슨리 레이아웃은 카드 내용 기반 높이 계산
        if (layout === 'masonry') {
            // 카드 객체와 너비가 제공된 경우 직접 높이 계산
            if (card && cardWidth) {
                return this.calculateEstimatedHeight(card, cardWidth);
            }
            // 그렇지 않으면 'auto' 반환
            return 'auto';
        }

        // 리스트 레이아웃 또는 자동 레이아웃
        if (layout === 'list' || layout === 'auto') {
            // 세로 모드에서 높이 정렬이 활성화된 경우
            if (isVertical && this.settings.alignCardHeight) {
                const containerHeight = this.getAvailableHeight();
                const cardGap = this.getCardGap();
                
                // 사용 가능한 높이에서 모든 여백 제외
                const availableHeight = containerHeight;
                
                // 정수로 나누어 떨어지는 높이 계산
                const totalGaps = cardGap * (this.settings.cardsPerView - 1);
                const heightWithoutGaps = availableHeight - totalGaps;
                const cardHeight = Math.floor(heightWithoutGaps / this.settings.cardsPerView);
                
                // 마지막 1px 여유 확보
                return Math.max(100, cardHeight - 1);
            }
            
            // 가로 모드에서는 컨테이너 높이에 맞춤
            if (!isVertical) {
                const containerHeight = this.getAvailableHeight();
                return Math.max(100, containerHeight - 20); // 약간의 여백 제공
            }
            
            // 높이 정렬이 비활성화된 경우
            // 카드 객체와 너비가 제공된 경우 내용 기반 높이 계산
            if (card && cardWidth) {
                return this.calculateEstimatedHeight(card, cardWidth);
            }
            
            // 카드 객체나 너비가 제공되지 않은 경우 자동 높이 사용
            return 'auto';
        }
        
        return 'auto';
    }

    /**
     * 카드 내용에 기반한 예상 높이를 계산합니다.
     * 메이슨리 레이아웃에서 사용됩니다.
     * @param card 높이를 계산할 카드 객체
     * @param cardWidth 카드의 너비 (픽셀)
     * @returns 예상 카드 높이 (픽셀)
     */
    public calculateEstimatedHeight(card: Card, cardWidth: number): number {
        const lineHeight = 1.6;  // 기본 줄간격
        const padding = 40;      // 카드 내부 여백
        let estimatedHeight = padding;  // 시작 높이는 패딩값

        // 카드 너비에 따른 보정 계수 계산
        // 좁은 너비에서는 높이를 줄이고, 넓은 너비에서는 높이를 늘림
        const widthFactor = Math.max(0.8, Math.min(1.2, this.settings.cardWidthThreshold / cardWidth));
        
        // 1. 파일명 높이 계산 - 너비 기반 계수 조정
        if (this.settings.showFileName && card.file.basename) {
            const fileNameCharWidth = this.settings.fileNameFontSize * 0.6 * widthFactor;
            const fileNameLines = Math.ceil(
                (card.file.basename.length * fileNameCharWidth) 
                / (cardWidth - padding)
            );
            estimatedHeight += fileNameLines * this.settings.fileNameFontSize * lineHeight;
            estimatedHeight += 12; // 파일명 아래 여백
        }

        // 2. 첫 번째 헤더 높이 계산 - 너비 기반 계수 조정
        if (this.settings.showFirstHeader && card.firstHeader) {
            const headerCharWidth = this.settings.firstHeaderFontSize * 0.6 * widthFactor;
            const headerLines = Math.ceil(
                (card.firstHeader.length * headerCharWidth) 
                / (cardWidth - padding)
            );
            estimatedHeight += headerLines * this.settings.firstHeaderFontSize * lineHeight;
            estimatedHeight += 20; // 헤더 아래 여백
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
                // 이미지당 예상 높이 추가 (너비에 비례하여 조정)
                const baseImageHeight = Math.min(220, cardWidth * 0.7); // 너비에 비례한 이미지 높이
                
                // 이미지 크기 힌트 확인 (예: ![|100x200])
                let totalImageHeight = 0;
                
                // 마크다운 이미지 크기 분석
                markdownImages.forEach(img => {
                    const sizeHint = img.match(/\|(\d+)x(\d+)/);
                    if (sizeHint) {
                        // 명시적 높이에 여유 공간 추가 (너비 비율에 따라 조정)
                        const specifiedWidth = parseInt(sizeHint[1]);
                        const specifiedHeight = parseInt(sizeHint[2]);
                        
                        // 이미지 비율 유지하면서 카드 너비에 맞게 조정
                        const scaleFactor = Math.min(1, (cardWidth - padding) / specifiedWidth);
                        totalImageHeight += specifiedHeight * scaleFactor + 20;
                    } else {
                        totalImageHeight += baseImageHeight;
                    }
                });
                
                // HTML 이미지 크기 분석
                htmlImages.forEach(img => {
                    const widthMatch = img.match(/width="(\d+)"/);
                    const heightMatch = img.match(/height="(\d+)"/);
                    
                    if (widthMatch && heightMatch) {
                        // 너비와 높이가 모두 지정된 경우 비율 유지
                        const specifiedWidth = parseInt(widthMatch[1]);
                        const specifiedHeight = parseInt(heightMatch[1]);
                        
                        // 이미지 비율 유지하면서 카드 너비에 맞게 조정
                        const scaleFactor = Math.min(1, (cardWidth - padding) / specifiedWidth);
                        totalImageHeight += specifiedHeight * scaleFactor + 20;
                    } else if (heightMatch) {
                        // 높이만 지정된 경우
                        totalImageHeight += parseInt(heightMatch[1]) + 20;
                    } else {
                        totalImageHeight += baseImageHeight;
                    }
                });
                
                // 임베드 이미지는 기본 크기 적용
                totalImageHeight += embedImages.length * baseImageHeight;
                
                estimatedHeight += totalImageHeight;
                // 이미지 간격은 카드 너비에 비례하여 조정
                estimatedHeight += imageCount * Math.min(40, cardWidth * 0.1); 
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
            
            // HTML 렌더링 여부와 카드 너비에 따른 계수 조정
            const charWidthMultiplier = this.settings.renderContentAsHtml ? 
                { korean: 1.1 * widthFactor, other: 0.55 * widthFactor } : // HTML 렌더링 시
                { korean: 1.0 * widthFactor, other: 0.5 * widthFactor };   // 일반 텍스트 시
            
            // 여유 공간도 카드 너비에 비례하여 조정
            const spaceMultiplier = Math.min(16, cardWidth * 0.05);
            const emptyLineHeight = this.settings.renderContentAsHtml ? 1.2 : 0.7;
            
            lines.forEach(line => {
                if (line.trim() === '') {
                    // 빈 줄 계산
                    totalLines += emptyLineHeight;
                } else {
                    // 한글/영문 너비 계산
                    let lineWidth = 0;
                    for (let char of line) {
                        // 한글 유니코드 범위: AC00-D7AF
                        if (/[\uAC00-\uD7AF]/.test(char)) {
                            lineWidth += this.settings.bodyFontSize * charWidthMultiplier.korean;
                        } else {
                            lineWidth += this.settings.bodyFontSize * charWidthMultiplier.other;
                        }
                    }
                    
                    // 실제 줄 수 계산 (카드 너비에 따라 조정)
                    const availableWidth = cardWidth - (padding + spaceMultiplier);
                    const lineCount = Math.max(1, Math.ceil(lineWidth / availableWidth));
                    
                    // 줄 수에 따른 높이 계산 계수 조정 (카드 너비에 따라 조정)
                    const lineMultiplier = this.settings.renderContentAsHtml ? 
                        1.1 * Math.pow(widthFactor, 0.8) : // 넓은 카드에서는 더 작은 계수 적용
                        0.8 * Math.pow(widthFactor, 0.8);
                    totalLines += lineCount * lineMultiplier;
                }
            });
            
            // 줄 간격을 고려한 높이 계산 (카드 너비에 따라 조정)
            const lineHeightMultiplier = this.settings.renderContentAsHtml ? 
                1.4 * Math.pow(widthFactor, 0.7) : // 넓은 카드에서는 더 작은 계수 적용
                1.0 * Math.pow(widthFactor, 0.7);
            estimatedHeight += totalLines * this.settings.bodyFontSize * lineHeightMultiplier;
            
            // 단락 간격 조정 (카드 너비에 따라 조정)
            const paragraphCount = plainText.split(/\n\s*\n/).length - 1;
            if (paragraphCount > 0) {
                const paragraphSpaceMultiplier = this.settings.renderContentAsHtml ? 
                    1.0 * widthFactor : 
                    0.5 * widthFactor;
                estimatedHeight += paragraphCount * this.settings.bodyFontSize * paragraphSpaceMultiplier;
            }
            
            // HTML 태그가 있는 경우 추가 높이 계산
            const htmlTagCount = (card.body.match(/<[^>]*>/g) || []).length;
            if (htmlTagCount > 0) {
                const tagHeightMultiplier = this.settings.renderContentAsHtml ? 
                    1.0 * widthFactor : 
                    0.5 * widthFactor;
                estimatedHeight += htmlTagCount * this.settings.bodyFontSize * tagHeightMultiplier;
            }
            
            // 코드 블록 높이 추가 (카드 너비에 따라 조정)
            const codeBlocks = card.body.match(/```[\s\S]*?```/g) || [];
            codeBlocks.forEach(block => {
                const blockLines = block.split('\n');
                let codeBlockHeight = 0;
                
                // 코드 블록 내 각 줄의 길이에 따른 높이 계산
                blockLines.forEach(line => {
                    const codeCharWidth = this.settings.bodyFontSize * 0.6 * widthFactor; // 코드 글꼴은 일반적으로 더 좁음
                    const lineWidth = line.length * codeCharWidth;
                    const availableWidth = cardWidth - (padding + 20); // 코드 블록은 추가 패딩 있음
                    const lineCount = Math.max(1, Math.ceil(lineWidth / availableWidth));
                    
                    codeBlockHeight += lineCount * this.settings.bodyFontSize * lineHeight;
                });
                
                estimatedHeight += codeBlockHeight;
                estimatedHeight += 40; // 코드 블록 여백
            });
        }
        
        // 4. 최소 높이 보장 및 추가 여백 (카드 너비에 따라 조정)
        const minHeight = Math.max(120, cardWidth * 0.4); // 카드 너비에 비례한 최소 높이
        const additionalPadding = Math.min(20, cardWidth * 0.05); // 카드 너비에 비례한 추가 여백
        
        const finalHeight = Math.max(estimatedHeight, minHeight) + additionalPadding;
        
        return finalHeight;
    }

    /**
     * 카드 스타일을 가져옵니다.
     */
    public getCardStyle(isVertical: boolean, alignCardHeight: boolean): Partial<CSSStyleDeclaration> {
        console.log(`[CardNavigator] 카드 스타일 가져오기: isVertical = ${isVertical}, alignCardHeight = ${alignCardHeight}`);
        
        const style: Partial<CSSStyleDeclaration> = {
            flexShrink: '0',
            boxSizing: 'border-box',
            transition: 'left 0.3s ease, top 0.3s ease, width 0.3s ease',
            padding: `var(--size-4-4)`
        };

        // isVertical 값에 따라 카드 스타일 설정
        if (isVertical) {
            // 세로 모드: 카드가 세로로 쌓임
            // 너비는 컨테이너 너비에 맞추고, 높이는 계산된 값 또는 auto 사용
            style.width = '100%';
            // 메이슨리 레이아웃이 아니므로 카드 객체와 너비를 전달하지 않음
            const height = this.calculateCardHeight(this.settings.defaultLayout, isVertical);
            style.height = height === 'auto' ? 'auto' : `${height}px`;
            console.log(`[CardNavigator] 세로 모드 카드 스타일: width = 100%, height = ${style.height}`);
        } else {
            // 가로 모드: 카드가 가로로 나열됨
            // 너비는 계산된 값 사용, 높이는 컨테이너 높이에 맞춤
            const cardWidth = this.calculateCardWidth(this.settings.cardsPerView);
            style.width = `${cardWidth}px`;
            style.height = '100%';
            
            // 가로 모드에서 카드 내용이 잘 보이도록 최소 높이 설정
            style.minHeight = '200px';
            console.log(`[CardNavigator] 가로 모드 카드 스타일: width = ${style.width}, height = 100%, minHeight = 200px`);
        }

        return style;
    }
    //#endregion

    //#region 레이아웃 속성
    /**
     * 그리드 레이아웃의 열 수를 가져옵니다.
     */
    public getGridColumns(): number {
        return this.settings.gridColumns;
    }

    /**
     * 메이슨리 레이아웃의 열 수를 가져옵니다.
     */
    public getMasonryColumns(): number {
        return this.settings.masonryColumns;
    }
    //#endregion

    //#region 이전 열 수 업데이트
    public updatePreviousColumns(columns: number) {
        this.previousColumns = columns;
    }
    //#endregion

    /**
     * 설정을 업데이트합니다.
     */
    public updateSettings(settings: CardNavigatorSettings) {
        this.settings = settings;
        // 방향 캐시 초기화
        this._isVertical = null;
    }
} 