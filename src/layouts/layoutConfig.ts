import { App } from 'obsidian';
import { CardNavigatorSettings, Card } from 'common/types';

/**
 * 레이아웃 설정을 관리하는 클래스
 * 
 * 이 클래스는 카드 레이아웃에 필요한 설정값을 계산하고 관리합니다.
 * 컨테이너 크기, 카드 간격, 방향 등의 설정을 처리합니다.
 */
export class LayoutConfig {
    private container: HTMLElement | null = null;
    private settings: CardNavigatorSettings;
    private isInitialized: boolean = false;
    private defaultContainerSize: { width: number; height: number };
    private lastRatio: number | null = null;
    private lastAvailableWidth: number | null = null;

    constructor(settings: CardNavigatorSettings) {
        this.settings = settings;
        // 초기 기본값을 뷰포트 크기의 일부로 설정
        this.defaultContainerSize = this.calculateDefaultSizeFromViewport();
    }

    /**
     * 뷰포트 크기를 기반으로 기본 컨테이너 크기를 계산합니다.
     */
    private calculateDefaultSizeFromViewport(): { width: number; height: number } {
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // 뷰포트의 80%를 기본 크기로 사용 (최소 400x600)
        return {
            width: Math.max(400, Math.floor(viewportWidth * 0.8)),
            height: Math.max(600, Math.floor(viewportHeight * 0.8))
        };
    }

    /**
     * 컨테이너를 설정합니다.
     */
    setContainer(container: HTMLElement): void {
        this.container = container;
        if (container) {
            this.isInitialized = true;
        } else {
            console.warn('[LayoutConfig] 컨테이너가 null로 설정되었습니다. 기본 뷰포트 크기를 사용합니다.');
            // 컨테이너가 null인 경우에도 초기화 상태를 true로 설정하여 기본 크기를 사용하도록 함
            this.isInitialized = true;
            this.defaultContainerSize = this.calculateDefaultSizeFromViewport();
        }
    }

    /**
     * 설정을 업데이트합니다.
     */
    updateSettings(settings: CardNavigatorSettings): void {
        this.settings = settings;
    }

    /**
     * 컨테이너가 수직 방향인지 확인합니다.
     * @returns 수직 방향 여부
     */
    public isVerticalContainer(): boolean {
        // calculateContainerOrientation 메서드 재사용
        const { isVertical } = this.calculateContainerOrientation();
        return isVertical;
    }

    /**
     * 컨테이너 방향을 계산합니다.
     * @returns 컨테이너 방향 정보 (비율, 수직 여부)
     */
    public calculateContainerOrientation(): { ratio: number, isVertical: boolean } {
        // 컨테이너 크기 가져오기
        const { width, height } = this.getContainerSize();
        
        // 비율 계산
        const ratio = width / height;
        
        // 방향 결정
        let isVertical = true;
        
        // 설정에 따라 방향 결정
        if (this.settings.layoutDirection === 'auto') {
            // 자동 방향 - 비율에 따라 결정
            isVertical = ratio < 1.2; // 너비가 높이의 1.2배 미만이면 수직
        } else {
            // 명시적 방향 설정
            isVertical = this.settings.layoutDirection === 'vertical';
        }
        
        return { ratio, isVertical };
    }

    /**
     * 카드 간격을 가져옵니다.
     */
    getCardGap(): number {
        return this.settings.cardGap;
    }

    //#region CSS 변수 가져오기
    /**
     * CSS 변수 값을 가져옵니다.
     */
    public getCSSVariable(variableName: string, defaultValue: number): number {
        if (!this.container) return defaultValue;
        const valueStr = getComputedStyle(this.container).getPropertyValue(variableName).trim();
        return parseInt(valueStr) || defaultValue;
    }


    /**
     * 컨테이너 패딩을 가져옵니다.
     */
    public getContainerPadding(): number {
        // 설정에서 containerPadding 값을 사용
        return this.settings.containerPadding;
    }
    //#endregion

    //#region 컨테이너 관련 메서드
    /**
     * 컨테이너 크기를 가져옵니다.
     * @returns 컨테이너 크기 (너비, 높이)
     */
    public getContainerSize(): { width: number, height: number } {
        if (!this.container) {
            // 컨테이너가 없는 경우 뷰포트 크기 사용
            return {
                width: window.innerWidth,
                height: window.innerHeight
            };
        }
        
        // 컨테이너 크기 계산
        const containerRect = this.container.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // 뷰포트 내에서 실제 사용 가능한 컨테이너 크기 계산
        let width = Math.min(containerRect.width, viewportWidth - containerRect.left);
        let height = Math.min(containerRect.height, viewportHeight - containerRect.top);
        
        // 비정상적인 값 처리 - 뷰포트 기반 값으로 대체
        if (width <= 0 || height <= 0) {
            console.log(`[LayoutConfig] 컨테이너 크기가 유효하지 않습니다: ${width}x${height}. 뷰포트 기반 크기를 사용합니다.`);
            
            // 뷰포트 기반 크기 계산
            width = Math.max(400, Math.floor(viewportWidth * 0.8));
            height = Math.max(600, Math.floor(viewportHeight * 0.8));
        }
        
        return { width, height };
    }
    
    /**
     * 사용 가능한 너비를 계산합니다.
     * @returns 사용 가능한 너비
     */
    public getAvailableWidth(): number {
        const { width } = this.getContainerSize();
        const padding = this.getContainerPadding() * 2;
        const availableWidth = Math.max(0, width - padding);
        
        // 로그 출력 빈도 줄이기 - 정적 변수 사용
        if (!this.lastAvailableWidth || Math.abs(this.lastAvailableWidth - availableWidth) > 5) {
            console.debug(`[LayoutConfig] 사용 가능한 너비 - 컨테이너 너비: ${width}, 패딩: ${padding}, 사용 가능: ${availableWidth}`);
            this.lastAvailableWidth = availableWidth;
        }
        
        return availableWidth;
    }

    /**
     * 사용 가능한 높이를 계산합니다.
     * @returns 사용 가능한 높이
     */
    public getAvailableHeight(): number {
        const { height } = this.getContainerSize();
        const padding = this.getContainerPadding() * 2;
        const availableHeight = Math.max(0, height - padding);
        
        // 비정상적으로 큰 높이 값 제한 (최대 10000px)
        const maxReasonableHeight = 10000;
        const finalHeight = Math.min(availableHeight, maxReasonableHeight);
        
        if (finalHeight !== availableHeight) {
            console.warn(`[LayoutConfig] 비정상적으로 큰 높이 값 감지: ${availableHeight}px, ${finalHeight}px로 제한됨`);
        }
        
        console.log(`[LayoutConfig] 사용 가능한 높이 - 컨테이너 높이: ${height}, 패딩: ${padding}, 사용 가능: ${finalHeight}`);
        
        return finalHeight;
    }
    //#endregion

    //#region 레이아웃 계산
    /**
     * 컨테이너 너비에 따라 자동으로 열 수를 계산합니다.
     * 히스테리시스를 적용하여 너비가 약간 변경될 때 열 수가 자주 변경되는 것을 방지합니다.
     */
    public calculateAutoColumns(): number {
        // 컨테이너 크기 가져오기
        const containerWidth = this.getContainerSize().width;
        const availableWidth = this.getAvailableWidth();
        
        // 카드 간격 가져오기
        const gap = this.getCardGap();
        
        // 카드 임계값 너비 (설정에서 가져옴)
        const cardThresholdWidth = this.settings.cardThresholdWidth;
        
        // 히스테리시스 버퍼 (열 수 변경 시 안정성을 위해)
        const hysteresisBuffer = 50; // 더 큰 버퍼로 조정
        
        // 현재 열 수
        const currentColumns = this.settings.cardsPerColumn || 1;
        
        // 최대 가능한 열 수 계산
        const maxPossibleColumns = Math.max(1, Math.floor((availableWidth + gap) / (cardThresholdWidth + gap)));
        
        console.log(`[LayoutConfig] 열 수 계산 - 컨테이너 너비: ${containerWidth}px, 사용 가능한 너비: ${availableWidth}px`);
        console.log(`[LayoutConfig] 열 수 계산 - 카드 임계값 너비: ${cardThresholdWidth}px, 간격: ${gap}px, 현재 열 수: ${currentColumns}`);
        
        // 열 수 증가 조건: 현재보다 더 많은 열을 수용할 수 있고, 히스테리시스 버퍼를 고려해도 충분한 공간이 있는 경우
        const shouldIncrease = maxPossibleColumns > currentColumns && 
            availableWidth >= (currentColumns + 1) * cardThresholdWidth + currentColumns * gap + hysteresisBuffer;
        
        // 열 수 감소 조건: 현재 열 수가 최대 가능 열 수보다 크거나, 히스테리시스 버퍼를 고려했을 때 현재 열 수를 유지할 수 없는 경우
        const shouldDecrease = currentColumns > 1 && (
            maxPossibleColumns < currentColumns || 
            availableWidth < currentColumns * cardThresholdWidth + (currentColumns - 1) * gap - hysteresisBuffer
        );
        
        console.log(`[LayoutConfig] 열 수 변경 조건 - 증가: ${shouldIncrease}, 감소: ${shouldDecrease}, 최대 가능 열 수: ${maxPossibleColumns}`);
        
        // 열 수 결정
        let newColumns = currentColumns;
        
        if (shouldIncrease) {
            newColumns = Math.min(maxPossibleColumns, currentColumns + 1);
            console.log(`[LayoutConfig] 열 수 증가: ${currentColumns} -> ${newColumns}`);
        } else if (shouldDecrease) {
            newColumns = Math.max(1, maxPossibleColumns);
            console.log(`[LayoutConfig] 열 수 감소: ${currentColumns} -> ${newColumns}`);
        }
        
        return newColumns;
    }

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
     * 통합 레이아웃에서는 수직 방향, 높이 정렬 여부, 카드 뷰 수에 따라 높이를 결정합니다.
     */
    public calculateCardHeight(isVertical: boolean, card?: Card, cardWidth?: number): number | 'auto' {
        // 디버그 로그 레벨 설정 (true: 상세 로그, false: 최소 로그)
        const verboseLogging = false;
        
        if (verboseLogging) {
            console.log(`[LayoutConfig] 카드 높이 계산 시작 - 높이 정렬: ${this.settings.alignCardHeight}, 수직 방향: ${isVertical}`);
        }
        
        // 높이 정렬이 활성화되지 않은 경우 'auto' 반환
        if (!this.settings.alignCardHeight) {
            if (verboseLogging) {
                console.log(`[LayoutConfig] 높이 정렬이 비활성화되어 'auto' 반환`);
            }
            return 'auto';
        }
        
        // 높이 정렬이 활성화된 경우, 선택된 방식에 따라 높이 계산:
        if (verboseLogging) {
            console.log(`[LayoutConfig] 높이 계산 방식 - 고정 높이 사용: ${this.settings.useFixedHeight}, 고정 높이 값: ${this.settings.fixedCardHeight}, 열당 카드 수: ${this.settings.cardsPerColumn}`);
        }
        
        // 1. 고정 높이 사용 (useFixedHeight가 true이고 fixedCardHeight가 0보다 큰 경우)
        if (this.settings.useFixedHeight && this.settings.fixedCardHeight > 0) {
            if (verboseLogging) {
                console.log(`[LayoutConfig] 고정 높이 사용: ${this.settings.fixedCardHeight}px`);
            }
            return this.settings.fixedCardHeight;
        }
        
        // 2. 열당 카드 수에 따른 높이 계산 (useFixedHeight가 false이고 cardsPerColumn이 0보다 큰 경우)
        if (!this.settings.useFixedHeight && this.settings.cardsPerColumn > 0) {
            const availableHeight = this.getAvailableHeight();
            const cardGap = this.getCardGap();
            const totalGapHeight = (this.settings.cardsPerColumn - 1) * cardGap;
            const calculatedHeight = Math.floor((availableHeight - totalGapHeight) / this.settings.cardsPerColumn);
            
            if (verboseLogging) {
                console.log(`[LayoutConfig] 열당 카드 수에 따른 높이 계산:`);
                console.log(`  - 사용 가능한 높이: ${availableHeight}px`);
                console.log(`  - 카드 간격: ${cardGap}px`);
                console.log(`  - 총 간격 높이: ${totalGapHeight}px`);
                console.log(`  - 계산된 카드 높이: ${calculatedHeight}px`);
                console.log(`  - 설정된 cardsPerColumn: ${this.settings.cardsPerColumn}`);
                console.log(`  - 실제 사용된 cardsPerColumn: ${this.settings.cardsPerColumn}`);
            }
            
            return calculatedHeight;
        }
        
        // 기본값: 자동 높이 (alignCardHeight는 true지만 다른 설정이 없는 경우)
        if (verboseLogging) {
            console.log(`[LayoutConfig] 기본값 'auto' 반환 - 높이 정렬은 활성화되었지만 다른 설정이 없음`);
        }
        return 'auto';
    }
    //#endregion

    //#region 레이아웃 속성
    /**
     * 열 수를 가져옵니다.
     * 통합 레이아웃에서는 수직 컨테이너인 경우 1, 그렇지 않은 경우 자동 계산된 값을 반환합니다.
     */
    public getColumns(): number {
        // 자동 계산된 열 수 반환
        return this.calculateAutoColumns();
    }
    //#endregion
} 