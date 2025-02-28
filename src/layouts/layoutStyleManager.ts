import { CardNavigatorSettings } from 'common/types';
import { LAYOUT_CLASSES, LayoutDirection } from './layoutStrategy';

/**
 * 레이아웃 스타일을 관리하는 클래스
 * 
 * 이 클래스는 레이아웃 관련 스타일을 적용하고 관리합니다.
 * 컨테이너와 카드 요소의 스타일을 설정합니다.
 */
export class LayoutStyleManager {
    private container: HTMLElement | null = null;
    private settings: CardNavigatorSettings;

    constructor(settings: CardNavigatorSettings) {
        this.settings = settings;
    }

    /**
     * 컨테이너를 설정합니다.
     */
    setContainer(container: HTMLElement): void {
        this.container = container;
    }

    /**
     * 설정을 업데이트합니다.
     */
    updateSettings(settings: CardNavigatorSettings): void {
        this.settings = settings;
    }

    /**
     * 컨테이너 스타일을 적용합니다.
     * @param direction 레이아웃 방향
     */
    public applyContainerStyle(direction: LayoutDirection): void {
        if (!this.container) {
            console.warn('[LayoutStyleManager] 컨테이너가 없어 스타일을 적용할 수 없습니다.');
            return;
        }
        
        // 컨테이너 패딩 설정
        const padding = this.settings.containerPadding;
        this.container.style.padding = `${padding}px`;
        
        // 카드 간격 설정
        const gap = this.settings.cardGap;
        this.container.style.setProperty('--card-gap', `${gap}px`);
        
        // 컨테이너 방향 설정
        const isVertical = direction === 'vertical';
        this.container.classList.toggle(LAYOUT_CLASSES.VERTICAL, isVertical);
        this.container.classList.toggle(LAYOUT_CLASSES.HORIZONTAL, !isVertical);
        
        // 카드 높이 정렬 설정
        this.container.classList.toggle(LAYOUT_CLASSES.ALIGN_HEIGHT, this.settings.alignCardHeight);
        this.container.classList.toggle(LAYOUT_CLASSES.FLEXIBLE_HEIGHT, !this.settings.alignCardHeight);
        
        // 컨테이너 패딩 CSS 변수 설정 (다른 컴포넌트에서 참조할 수 있도록)
        this.container.style.setProperty('--container-padding', `${padding}px`);
    }

    /**
     * 컨테이너 스타일을 가져옵니다.
     * @param direction 레이아웃 방향
     * @returns 컨테이너 스타일 객체
     */
    public getContainerStyle(direction: LayoutDirection): Partial<CSSStyleDeclaration> {
        // 기본 컨테이너 스타일 설정
        const style: Partial<CSSStyleDeclaration> = {
            position: 'relative',
            overflow: 'auto',
            padding: `${this.settings.containerPadding}px`,
        };
        
        return style;
    }

    /**
     * 카드 스타일을 가져옵니다.
     */
    getCardStyle(): Partial<CSSStyleDeclaration> {
        return {
            boxSizing: 'border-box',
            padding: 'var(--size-4-4)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            borderRadius: 'var(--radius-m)',
            border: 'var(--border-width) solid var(--background-modifier-border)',
            backgroundColor: 'var(--background-primary)',
            position: 'absolute',
            left: '0',
            top: '0',
            transition: 'transform 0.35s cubic-bezier(0.25, 0.1, 0.25, 1), width 0.35s cubic-bezier(0.25, 0.1, 0.25, 1), height 0.3s ease',
            willChange: 'transform, width'
        };
    }

    /**
     * 레이아웃 스타일을 업데이트합니다.
     * @param direction 레이아웃 방향
     * @param columns 열 수
     * @param cardWidth 카드 너비
     */
    public updateLayoutStyles(direction: LayoutDirection, columns: number, cardWidth: number): void {
        if (!this.container) {
            console.warn('[LayoutStyleManager] 컨테이너가 없어 레이아웃 스타일을 업데이트할 수 없습니다.');
            return;
        }
        
        // 컨테이너 스타일 적용
        this.applyContainerStyle(direction);
        
        // 레이아웃 관련 CSS 변수 설정
        // 정확한 카드 너비를 설정하여 모든 카드가 동일한 너비를 갖도록 합니다.
        this.container.style.setProperty('--card-width', `${cardWidth}px`);
        this.container.style.setProperty('--columns', `${columns}`);
        
        // 레이아웃 방향에 따른 추가 스타일 설정
        const isVertical = direction === 'vertical';
        this.container.style.setProperty('--layout-direction', isVertical ? 'column' : 'row');
    }
} 
