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
    //#endregion

    //#region 초기화 및 설정
    // 생성자: 메이슨리 레이아웃 초기화
    constructor(
        private settings: CardNavigatorSettings,
        private cardMaker: CardMaker,
        layoutConfig: LayoutConfig
    ) {
        this.layoutConfig = layoutConfig;
        // 초기 열 수와 카드 너비 설정
        this.columns = this.layoutConfig.calculateAutoColumns();
        this.cardWidth = this.layoutConfig.calculateCardWidth(this.columns);
        this.columnHeights = new Array(this.columns).fill(0);
    }

    // 컨테이너 설정
    setContainer(container: HTMLElement) {
        this.container = container;
        this.container.classList.add('masonry-layout');
        
        // 컨테이너 기본 스타일 설정
        Object.assign(container.style, {
            position: 'relative',
            width: '100%',
            height: '100%',
            boxSizing: 'border-box',
            display: 'block',
            overflow: 'hidden'
        });

        // CSS 변수 설정
        const cardGap = this.layoutConfig.getCardGap();
        container.style.setProperty('--masonry-columns', this.columns.toString());
        container.style.setProperty('--masonry-gap', `${cardGap}px`);
        container.style.setProperty('--masonry-card-width', `${this.cardWidth}px`);
    }

    // 카드 너비 설정
    setCardWidth(width: number): void {
        const oldWidth = this.cardWidth;
        this.cardWidth = width;

        // 카드 너비가 변경되면 열 수도 다시 계산
        const newColumns = this.layoutConfig.calculateAutoColumns();
        if (newColumns !== this.columns || Math.abs(oldWidth - width) > 1) {
            this.columns = newColumns;
            this.columnHeights = new Array(this.columns).fill(0);
            this.layoutConfig.updatePreviousColumns(this.columns);

            // 컨테이너가 있는 경우 CSS 변수 업데이트
            if (this.container) {
                this.container.style.setProperty('--masonry-columns', this.columns.toString());
                this.container.style.setProperty('--masonry-card-width', `${this.cardWidth}px`);
            }
        }
    }

    // 카드를 메이슨리 형태로 배치
    arrange(cards: Card[], containerWidth: number, containerHeight: number): CardPosition[] {
        if (!this.container) return [];

        // 열 수와 카드 너비 업데이트
        this.setCardWidth(this.layoutConfig.calculateCardWidth(this.columns));

        // 컨테이너 스타일 설정
        const containerStyle = this.layoutConfig.getContainerStyle(true);
        Object.assign(this.container.style, {
            ...containerStyle,
            position: 'relative',
            width: 'calc(100% + 12px)',
            paddingRight: '12px',
            height: '100%'
        });

        // 컬럼 높이 초기화
        this.columnHeights = new Array(this.columns).fill(0);
        const positions: CardPosition[] = [];
        const cardGap = this.layoutConfig.getCardGap();

        // 카드 배치
        cards.forEach((card) => {
            const contentHeight = this.calculateEstimatedHeight(card);
            const minHeightIndex = this.columnHeights.indexOf(Math.min(...this.columnHeights));
            const x = minHeightIndex * (this.cardWidth + cardGap);
            const y = this.columnHeights[minHeightIndex];
            
            positions.push({
                card,
                x,
                y,
                width: this.cardWidth,
                height: contentHeight
            });
            
            this.columnHeights[minHeightIndex] += contentHeight + cardGap;
            
            // 카드 요소 스타일 업데이트
            const cardElement = this.container!.querySelector(
                `[data-card-id="${card.file.path}"]`
            ) as HTMLElement;
            
            if (cardElement) {
                const cardStyle = this.getCardStyle();
                Object.assign(cardElement.style, {
                    ...cardStyle,
                    position: 'absolute',
                    transform: `translate3d(${x}px, ${y}px, 0)`,
                    height: `${contentHeight}px`,
                    minHeight: '100px',
                    transition: 'transform 0.3s ease-in-out, width 0.3s ease-in-out'
                });
            }
        });

        // 컨테이너 높이 설정
        const containerPadding = this.layoutConfig.getContainerPadding();
        const maxHeight = Math.max(...this.columnHeights, 100) + containerPadding * 2;
        this.container.style.height = `${maxHeight}px`;

        return positions;
    }

    // 컨텐츠 기반 예상 높이 계산
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
            
            lines.forEach(line => {
                if (line.trim() === '') {
                    // 빈 줄은 1줄로 계산
                    totalLines += 1;
                } else {
                    // 한글은 1자당 1.0, 나머지는 0.5 기준으로 계산 (기존 1.2, 0.6에서 조정)
                    let lineWidth = 0;
                    for (let char of line) {
                        // 한글 유니코드 범위: AC00-D7AF
                        if (/[\uAC00-\uD7AF]/.test(char)) {
                            lineWidth += this.settings.bodyFontSize * 1.0;
                        } else {
                            lineWidth += this.settings.bodyFontSize * 0.5;
                        }
                    }
                    
                    // 실제 줄 수 계산 (올림하되 여유 공간 고려)
                    const availableWidth = this.cardWidth - (padding + 8); // 8px 추가 여유 공간
                    const lineCount = Math.ceil(lineWidth / availableWidth);
                    totalLines += Math.max(1, lineCount);
                }
            });
            
            // 줄 간격을 고려한 높이 계산 (줄간격 미세 조정)
            estimatedHeight += totalLines * this.settings.bodyFontSize * 1.4; // lineHeight 1.5에서 1.4로 조정
            
            // 단락 간격 조정
            const paragraphCount = plainText.split(/\n\s*\n/).length - 1;
            if (paragraphCount > 0) {
                estimatedHeight += paragraphCount * this.settings.bodyFontSize * 0.4; // 0.5에서 0.4로 조정
            }
            
            // HTML 태그가 있는 경우 추가 높이 계산
            const htmlTagCount = (card.body.match(/<[^>]*>/g) || []).length;
            if (htmlTagCount > 0) {
                estimatedHeight += htmlTagCount * this.settings.bodyFontSize * 0.5;
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
        return Math.max(estimatedHeight, 100);
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
            width: `${this.cardWidth}px`
        };
    }
    //#endregion

    //#region 리소스 정리
    // 레이아웃 정리
    destroy() {
        this.container = null;
        this.columnHeights = [];
    }

    updateSettings(settings: CardNavigatorSettings) {
        this.settings = settings;
        this.setCardWidth(this.layoutConfig.calculateCardWidth(this.columns));
    }
    //#endregion
}
