import { CardNavigatorSettings, Card } from 'common/types';
import { LayoutDirection } from './layoutStrategy';

/**
 * 레이아웃 설정 및 계산을 담당하는 클래스
 * 
 * 이 클래스는 레이아웃 관련 설정을 관리하고 계산하는 역할을 담당합니다.
 * 컨테이너 크기, 카드 크기, 레이아웃 방향 등을 계산합니다.
 */
export class LayoutConfig {
    private settings: CardNavigatorSettings;
    private defaultContainerSize: { width: number; height: number } = { width: 800, height: 600 };
    private cachedColumns: number = 1;
    private layoutDirection: LayoutDirection;
    private containerWidth: number;
    private cardWidth: number;
    private cardGap: number;
    private isVerticalContainer: boolean = true;

    constructor(settings: CardNavigatorSettings) {
        this.settings = settings;
        
        // 기본 속성 초기화
        this.layoutDirection = 'vertical'; // 기본값으로 vertical 설정
        this.containerWidth = this.defaultContainerSize.width;
        this.cardWidth = settings.cardThresholdWidth || 200;
        this.cardGap = 10; // 기본 카드 간격 설정
        
        // 초기 열 수 계산
        this.cachedColumns = this.calculateAutoColumns();
    }

    /**
     * 설정을 업데이트합니다.
     */
    updateSettings(settings: CardNavigatorSettings): void {
        this.settings = settings;
    }

    /**
     * 현재 설정을 반환합니다.
     */
    getSettings(): CardNavigatorSettings {
        return this.settings;
    }

    /**
     * 레이아웃 방향을 계산합니다.
     */
    getLayoutDirection(): LayoutDirection {
        // 컨테이너 크기에 따라 방향 결정
        return this.isVerticalContainer ? 'vertical' : 'horizontal';
    }

    /**
     * 컨테이너 크기를 업데이트합니다.
     * 
     * @param width 컨테이너 너비
     * @param height 컨테이너 높이
     */
    updateContainerSize(width: number, height: number): void {
        // 컨테이너 크기 업데이트
        this.containerWidth = width || this.defaultContainerSize.width;
        
        // 컨테이너 방향 결정 (너비가 높이보다 크면 수평, 아니면 수직)
        this.isVerticalContainer = height > width;
        
        // 레이아웃 방향 업데이트
        this.layoutDirection = this.getLayoutDirection();
        
        // 카드 속성 업데이트
        this.cardWidth = this.getCardWidth();
        this.cardGap = this.getCardGap();
        
        // 열 수 재계산
        this.cachedColumns = this.calculateAutoColumns();
    }

    /**
     * 컨테이너 방향을 계산합니다.
     * @returns 컨테이너가 수직인지 여부
     */
    calculateContainerOrientation(): { isVertical: boolean } {
        return { isVertical: this.isVerticalContainer };
    }

    /**
     * 사용 가능한 너비를 계산합니다.
     */
    getAvailableWidth(containerWidth: number): number {
        return containerWidth - (this.getContainerPadding() * 2);
    }

    /**
     * 사용 가능한 높이를 계산합니다.
     */
    getAvailableHeight(containerHeight: number): number {
        return containerHeight - (this.getContainerPadding() * 2);
    }

    /**
     * 컨테이너 패딩을 가져옵니다.
     * CSS 변수에서 값을 가져오거나 기본값을 사용합니다.
     */
    getContainerPadding(): number {
        // CSS 변수에서 값을 가져오기
        const cssValue = getComputedStyle(document.documentElement).getPropertyValue('--container-padding');
        if (cssValue) {
            const value = parseInt(cssValue);
            if (!isNaN(value)) {
                return value;
            }
        }
        
        // 기본값 반환
        return 10;
    }

    /**
     * 카드 간격을 가져옵니다.
     * CSS 변수에서 값을 가져오거나 기본값을 사용합니다.
     */
    getCardGap(): number {
        // CSS 변수에서 값을 가져오기
        const cssValue = getComputedStyle(document.documentElement).getPropertyValue('--card-gap');
        if (cssValue) {
            const value = parseInt(cssValue);
            if (!isNaN(value)) {
                return value;
            }
        }
        
        // 기본값 반환
        return 10;
    }

    /**
     * 컨테이너 너비에 따라 자동으로 열 수를 계산합니다.
     * 
     * @returns 계산된 열 수
     */
    calculateAutoColumns(): number {
        // 레이아웃 방향이 가로인 경우 항상 1열 반환
        if (this.layoutDirection === 'horizontal') {
            return 1;
        }
        
        // 세로 레이아웃의 경우 컨테이너 너비와 카드 너비를 기반으로 계산
        const containerWidth = this.containerWidth;
        const cardWidth = this.cardWidth;
        const cardGap = this.cardGap;
        
        // 컨테이너에 맞는 최대 열 수 계산
        const maxColumns = Math.max(1, Math.floor((containerWidth + cardGap) / (cardWidth + cardGap)));
        
        return maxColumns;
    }

    /**
     * 열 수를 가져옵니다.
     */
    getColumns(): number {
        return this.cachedColumns || 1;
    }

    /**
     * 카드 너비를 계산합니다.
     */
    getCardWidth(): number {
        const availableWidth = this.getAvailableWidth(this.defaultContainerSize.width);
        const columns = this.getColumns();
        const cardGap = this.getCardGap();
        
        // 사용 가능한 너비를 열 수로 나누어 카드 너비 계산
        return (availableWidth - (cardGap * (columns - 1))) / columns;
    }

    /**
     * 카드 높이를 계산합니다.
     */
    getCardHeight(): number | 'auto' {
        // 카드 높이 정렬이 비활성화된 경우 'auto' 반환
        if (!this.settings.alignCardHeight) {
            return 'auto';
        }
        
        // 고정 높이 사용 여부에 따라 높이 결정
        if (this.settings.useFixedHeight) {
            return this.settings.fixedCardHeight || 200;
        } else {
            // 뷰당 카드 수에 따라 높이 계산
            const availableHeight = this.getAvailableHeight(this.defaultContainerSize.height);
            const cardsPerColumn = this.settings.cardsPerColumn || 3;
            const cardGap = this.getCardGap();
            
            // 최소 높이 보장
            const calculatedHeight = (availableHeight - (cardGap * (cardsPerColumn - 1))) / cardsPerColumn;
            return Math.max(100, calculatedHeight); // 최소 100px 보장
        }
    }

    /**
     * 카드 렌더링 방식 설정을 가져옵니다.
     */
    public shouldRenderContentAsHtml(): boolean {
        return this.settings.renderContentAsHtml;
    }

    /**
     * 스크롤 애니메이션 활성화 여부를 가져옵니다.
     */
    public isScrollAnimationEnabled(): boolean {
        return this.settings.enableScrollAnimation;
    }

    /**
     * 열당 카드 수를 가져옵니다.
     */
    public getCardsPerColumn(): number {
        return this.settings.cardsPerColumn;
    }
} 