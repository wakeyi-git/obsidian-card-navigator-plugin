import { CardNavigatorSettings, Card } from 'common/types';
import { LayoutDirection } from './layoutStrategy';
import { LayoutConfig } from './layoutConfig';

/**
 * 레이아웃 관련 스타일을 적용하고 관리하는 클래스
 * 
 * 이 클래스는 레이아웃 관련 스타일을 생성하고 적용하는 역할을 담당합니다.
 * 컨테이너와 카드의 스타일을 관리합니다.
 */
export class LayoutStyleManager {
    private settings: CardNavigatorSettings;
    private layoutConfig: LayoutConfig;
    private debugMode: boolean = true; // 디버그 모드 활성화
    private container: HTMLElement | null = null;

    constructor(settings: CardNavigatorSettings, layoutConfig: LayoutConfig) {
        this.settings = settings;
        this.layoutConfig = layoutConfig;
        this.logDebug('LayoutStyleManager 초기화');
    }

    /**
     * 디버그 로그를 출력합니다.
     */
    private logDebug(message: string, data?: any): void {
        if (this.debugMode) {
            console.log(`[LayoutStyleManager] ${message}`, data ? data : '');
        }
    }

    /**
     * 설정을 업데이트합니다.
     */
    updateSettings(settings: CardNavigatorSettings): void {
        this.settings = settings;
    }

    /**
     * LayoutConfig를 설정합니다.
     */
    setLayoutConfig(layoutConfig: LayoutConfig): void {
        this.layoutConfig = layoutConfig;
    }

    /**
     * 컨테이너 스타일을 적용합니다.
     */
    applyContainerStyle(container: HTMLElement, direction: LayoutDirection, columns: number, cardWidth: number): void {
        const styleString = this.getContainerStyle();
        
        // 스타일 문자열을 파싱하여 적용
        const styleLines = styleString.trim().split('\n');
        for (const line of styleLines) {
            const trimmedLine = line.trim();
            if (!trimmedLine || trimmedLine === '') continue;
            
            // 속성과 값 추출
            const colonIndex = trimmedLine.indexOf(':');
            if (colonIndex > 0) {
                const property = trimmedLine.substring(0, colonIndex).trim();
                // 세미콜론과 공백 제거
                let value = trimmedLine.substring(colonIndex + 1).trim();
                if (value.endsWith(';')) {
                    value = value.substring(0, value.length - 1).trim();
                }
                
                container.style.setProperty(property, value);
            }
        }
        
        // 방향에 따른 클래스 설정
        container.classList.toggle('is-vertical', direction === 'vertical');
        container.classList.toggle('is-horizontal', direction === 'horizontal');
        
        // CSS 변수 설정
        container.style.setProperty('--columns', columns.toString());
        container.style.setProperty('--card-width', `${cardWidth}px`);
        container.style.setProperty('--is-vertical', direction === 'vertical' ? '1' : '0');
        
        this.logDebug('컨테이너 스타일 적용', {
            direction,
            columns,
            cardWidth,
            isVertical: direction === 'vertical'
        });
    }

    /**
     * 컨테이너 스타일을 가져옵니다.
     */
    private getContainerStyle(): string {
        const direction = this.layoutConfig.getLayoutDirection();
        const cardWidth = this.layoutConfig.getCardWidth();
        const containerPadding = this.layoutConfig.getContainerPadding();
        
        this.logDebug('컨테이너 스타일 생성', { direction, cardWidth, containerPadding });
        
        return `
            position: relative;
            width: 100%;
            height: auto;
            min-height: min-content;
            padding: ${containerPadding}px;
            box-sizing: border-box;
            overflow: visible;
            --card-gap: ${this.layoutConfig.getCardGap()}px;
            --container-padding: ${containerPadding}px;
        `;
    }

    /**
     * 카드 스타일을 생성합니다.
     */
    getCardStyle(cardWidth: number, cardHeight: number | 'auto'): Record<string, string> {
        // 카드 스타일 객체 생성
        const style: Record<string, string> = {
            'position': 'absolute',
            'width': `${Math.floor(cardWidth)}px`,
            'min-width': `${Math.floor(cardWidth)}px`,
            'max-width': `${Math.floor(cardWidth)}px`,
            'box-sizing': 'border-box',
            // 위치와 너비에 부드러운 트랜지션 적용
            'transition': 'left 0.3s ease, top 0.3s ease, width 0.3s ease, min-width 0.3s ease, max-width 0.3s ease'
        };
        
        // 카드 높이 설정
        if (cardHeight !== 'auto') {
            const roundedHeight = Math.floor(cardHeight);
            style['height'] = `${roundedHeight}px`;
            style['min-height'] = `${roundedHeight}px`;
            style['max-height'] = `${roundedHeight}px`;
            style['transition'] += ', height 0.3s ease, min-height 0.3s ease, max-height 0.3s ease';
        }
        
        this.logDebug('카드 스타일 생성', style);
        
        return style;
    }

    /**
     * 레이아웃 스타일을 업데이트합니다.
     */
    public updateLayoutStyles(container: HTMLElement): void {
        this.logDebug('레이아웃 스타일 업데이트 시작');
        
        // 컨테이너 참조 저장
        this.container = container;
        
        // 컨테이너 스타일 적용
        if (this.container) {
            this.applyContainerStyle(
                this.container, 
                this.layoutConfig.getLayoutDirection(), 
                this.layoutConfig.getColumns(), 
                this.layoutConfig.getCardWidth()
            );
            this.logDebug('컨테이너 스타일 적용 완료');
        }
        
        this.logDebug('레이아웃 스타일 업데이트 완료');
    }

    /**
     * 카드 포커스 스타일을 적용합니다.
     */
    applyCardFocusStyle(cardElement: HTMLElement, isFocused: boolean): void {
        if (isFocused) {
            cardElement.classList.add('card-focused');
        } else {
            cardElement.classList.remove('card-focused');
        }
    }

    /**
     * 카드 활성화 스타일을 적용합니다.
     */
    applyCardActiveStyle(cardElement: HTMLElement, isActive: boolean): void {
        if (isActive) {
            cardElement.classList.add('card-active');
        } else {
            cardElement.classList.remove('card-active');
        }
    }

    /**
     * 카드 위치 스타일을 적용합니다.
     */
    applyCardPositionStyle(cardEl: HTMLElement, left: number, top: number, width?: number, height?: number | 'auto'): void {
        // 소수점 때문에 흔들리는 문제를 해결하기 위해 Math.floor 사용하고 짝수로 만들기
        const roundedLeft = Math.floor(left / 2) * 2;
        const roundedTop = Math.floor(top / 2) * 2;
        
        // transform 대신 left/top 속성 사용
        cardEl.style.left = `${roundedLeft}px`;
        cardEl.style.top = `${roundedTop}px`;
        
        // 너비와 높이가 제공된 경우 적용
        if (width !== undefined) {
            // 소수점 때문에 흔들리는 문제를 해결하기 위해 Math.floor 사용하고 짝수로 만들기
            const roundedWidth = Math.floor(width / 2) * 2;
            cardEl.style.width = `${roundedWidth}px`;
            cardEl.style.minWidth = `${roundedWidth}px`;
            cardEl.style.maxWidth = `${roundedWidth}px`;
        }
        
        if (height !== undefined) {
            if (height === 'auto') {
                cardEl.style.height = 'auto';
                cardEl.style.minHeight = 'auto';
                cardEl.style.maxHeight = 'none';
            } else {
                // 소수점 때문에 흔들리는 문제를 해결하기 위해 Math.floor 사용하고 짝수로 만들기
                const roundedHeight = Math.floor(height / 2) * 2;
                cardEl.style.height = `${roundedHeight}px`;
                cardEl.style.minHeight = `${roundedHeight}px`;
                cardEl.style.maxHeight = `${roundedHeight}px`;
            }
        }
        
        // 비정상적인 위치 확인 및 로깅
        if (roundedLeft === 0 && roundedTop === 0 && cardEl.dataset.index !== '0') {
            this.logDebug('비정상적인 카드 위치 감지', {
                cardIndex: cardEl.dataset.index,
                position: { left: roundedLeft, top: roundedTop },
                size: { width, height }
            });
        }
    }
} 
