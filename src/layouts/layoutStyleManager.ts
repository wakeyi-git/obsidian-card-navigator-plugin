import { CardNavigatorSettings } from 'common/types';
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

    constructor(settings: CardNavigatorSettings, layoutConfig: LayoutConfig) {
        this.settings = settings;
        this.layoutConfig = layoutConfig;
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
        const style = this.getContainerStyle();
        
        Object.entries(style).forEach(([key, value]) => {
            container.style.setProperty(key, value);
        });
        
        // 방향에 따른 클래스 설정
        container.classList.toggle('is-vertical', direction === 'vertical');
        container.classList.toggle('is-horizontal', direction === 'horizontal');
        
        // CSS 변수 설정
        container.style.setProperty('--columns', columns.toString());
        container.style.setProperty('--card-width', `${cardWidth}px`);
        
        // 이미 :root에 정의된 CSS 변수를 사용하므로 여기서는 설정하지 않음
        // container.style.setProperty('--card-gap', `${this.layoutConfig.getCardGap()}px`);
        // container.style.setProperty('--container-padding', `${this.layoutConfig.getContainerPadding()}px`);
        
        container.style.setProperty('--is-vertical', direction === 'vertical' ? '1' : '0');
    }

    /**
     * 컨테이너 스타일을 가져옵니다.
     */
    getContainerStyle(): Record<string, string> {
        return {
            'display': 'grid',
            'grid-gap': 'var(--card-gap, 10px)',
            'padding': 'var(--container-padding, 10px)',
            'box-sizing': 'border-box',
            'width': '100%',
            'height': '100%',
            'overflow': 'auto'
        };
    }

    /**
     * 카드 스타일을 가져옵니다.
     */
    getCardStyle(cardWidth: number, cardHeight: number | 'auto'): Record<string, string> {
        const style: Record<string, string> = {
            'width': `${cardWidth}px`,
            'min-width': `${cardWidth}px`,
            'max-width': `${cardWidth}px`,
        };
        
        if (cardHeight !== 'auto') {
            style['height'] = `${cardHeight}px`;
            style['min-height'] = `${cardHeight}px`;
            style['max-height'] = `${cardHeight}px`;
        }
        
        return style;
    }

    /**
     * 레이아웃 스타일을 업데이트합니다.
     */
    updateLayoutStyles(container: HTMLElement, direction: LayoutDirection, columns: number, cardWidth: number): void {
        this.applyContainerStyle(container, direction, columns, cardWidth);
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
    applyCardPositionStyle(cardElement: HTMLElement, left: number, top: number, width: number, height: number | 'auto'): void {
        cardElement.style.position = 'absolute';
        cardElement.style.left = `${left}px`;
        cardElement.style.top = `${top}px`;
        cardElement.style.width = `${width}px`;
        
        if (height === 'auto') {
            cardElement.style.height = 'auto';
        } else {
            cardElement.style.height = `${height}px`;
        }
        
        cardElement.style.visibility = 'visible';
        cardElement.style.opacity = '1';
        cardElement.style.transition = 'left 0.3s ease, top 0.3s ease, opacity 0.3s ease';
    }
} 
