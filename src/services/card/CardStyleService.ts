import { ICard, ICardElementStyle, ICardStyle } from '../../domain/card/Card';
import { ISettingsService } from '../../domain/settings/SettingsInterfaces';

/**
 * 카드 스타일 서비스 인터페이스
 */
export interface ICardStyleService {
  /**
   * 카드 스타일 적용
   * @param card 카드
   * @param element 요소
   * @param isActive 활성 카드 여부
   * @param isFocused 포커스 카드 여부
   */
  applyCardStyle(card: ICard, element: HTMLElement, isActive: boolean, isFocused: boolean): void;
  
  /**
   * 카드 스타일 가져오기
   * @param card 카드
   * @param isActive 활성 카드 여부
   * @param isFocused 포커스 카드 여부
   * @returns 카드 스타일
   */
  getCardStyle(card: ICard, isActive: boolean, isFocused: boolean): ICardElementStyle;
  
  /**
   * 기본 카드 스타일 가져오기
   * @returns 기본 카드 스타일
   */
  getDefaultCardStyle(): ICardStyle;
}

/**
 * 카드 스타일 서비스
 * 카드 스타일 관련 기능을 관리합니다.
 */
export class CardStyleService implements ICardStyleService {
  private settingsService: ISettingsService;
  
  /**
   * 생성자
   * @param settingsService 설정 서비스
   */
  constructor(settingsService: ISettingsService) {
    this.settingsService = settingsService;
  }
  
  /**
   * 카드 스타일 적용
   * @param card 카드
   * @param element 요소
   * @param isActive 활성 카드 여부
   * @param isFocused 포커스 카드 여부
   */
  applyCardStyle(card: ICard, element: HTMLElement, isActive: boolean, isFocused: boolean): void {
    // 카드 스타일 가져오기
    const style = this.getCardStyle(card, isActive, isFocused);
    
    // 스타일 적용
    if (style.backgroundColor) element.style.backgroundColor = style.backgroundColor;
    if (style.fontSize) element.style.fontSize = `${style.fontSize}px`;
    if (style.borderStyle) element.style.borderStyle = style.borderStyle;
    if (style.borderColor) element.style.borderColor = style.borderColor;
    if (style.borderWidth) element.style.borderWidth = `${style.borderWidth}px`;
    if (style.borderRadius) element.style.borderRadius = `${style.borderRadius}px`;
    
    // 클래스 추가
    element.classList.add('card');
    if (isActive) element.classList.add('card-active');
    if (isFocused) element.classList.add('card-focused');
  }
  
  /**
   * 카드 스타일 가져오기
   * @param card 카드
   * @param isActive 활성 카드 여부
   * @param isFocused 포커스 카드 여부
   * @returns 카드 스타일
   */
  getCardStyle(card: ICard, isActive: boolean, isFocused: boolean): ICardElementStyle {
    // 카드 스타일 가져오기
    const cardStyle = card.displaySettings?.cardStyle || this.getDefaultCardStyle();
    
    // 상태에 따른 스타일 반환
    if (isFocused && cardStyle.focused) {
      return cardStyle.focused;
    } else if (isActive && cardStyle.active) {
      return cardStyle.active;
    } else if (cardStyle.normal) {
      return cardStyle.normal;
    }
    
    // 기본 스타일 반환
    return {};
  }
  
  /**
   * 기본 카드 스타일 가져오기
   * @returns 기본 카드 스타일
   */
  getDefaultCardStyle(): ICardStyle {
    const settings = this.settingsService.getSettings();
    
    return {
      normal: {
        backgroundColor: settings.normalCardBgColor,
        borderStyle: settings.normalCardBorderStyle,
        borderColor: settings.normalCardBorderColor,
        borderWidth: settings.normalCardBorderWidth,
        borderRadius: settings.normalCardBorderRadius
      },
      active: {
        backgroundColor: settings.activeCardBgColor,
        borderStyle: settings.activeCardBorderStyle,
        borderColor: settings.activeCardBorderColor,
        borderWidth: settings.activeCardBorderWidth,
        borderRadius: settings.activeCardBorderRadius
      },
      focused: {
        backgroundColor: settings.focusedCardBgColor,
        borderStyle: settings.focusedCardBorderStyle,
        borderColor: settings.focusedCardBorderColor,
        borderWidth: settings.focusedCardBorderWidth,
        borderRadius: settings.focusedCardBorderRadius
      },
      header: {
        backgroundColor: settings.headerBgColor,
        fontSize: settings.headerFontSize,
        borderStyle: settings.headerBorderStyle,
        borderColor: settings.headerBorderColor,
        borderWidth: settings.headerBorderWidth,
        borderRadius: settings.headerBorderRadius
      },
      body: {
        backgroundColor: settings.bodyBgColor,
        fontSize: settings.bodyFontSize,
        borderStyle: settings.bodyBorderStyle,
        borderColor: settings.bodyBorderColor,
        borderWidth: settings.bodyBorderWidth,
        borderRadius: settings.bodyBorderRadius
      },
      footer: {
        backgroundColor: settings.footerBgColor,
        fontSize: settings.footerFontSize,
        borderStyle: settings.footerBorderStyle,
        borderColor: settings.footerBorderColor,
        borderWidth: settings.footerBorderWidth,
        borderRadius: settings.footerBorderRadius
      }
    };
  }
} 