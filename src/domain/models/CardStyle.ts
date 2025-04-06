/**
 * 개별 스타일 속성 인터페이스
 */
export interface IStyleProperties {
  backgroundColor: string;
  borderColor: string;
  borderWidth: string;
  borderRadius: string;
  padding: string;
  margin: string;
  fontSize?: string;
  fontWeight?: string;
  color?: string;
  minWidth?: string;
  maxWidth?: string;
  minHeight?: string;
  maxHeight?: string;
}

/**
 * 카드 스타일 인터페이스
 * - 카드의 스타일 속성을 정의하는 불변 객체
 */
export interface ICardStyle {
  readonly card: IStyleProperties;
  readonly activeCard: IStyleProperties;
  readonly focusedCard: IStyleProperties;
  readonly header: IStyleProperties;
  readonly body: IStyleProperties;
  readonly footer: IStyleProperties;
  validate(): boolean;
}

/**
 * 카드 스타일 기본값
 */
export const DEFAULT_CARD_STYLE: ICardStyle = {
  card: {
    backgroundColor: '#ffffff',
    borderColor: '#e0e0e0',
    borderWidth: '1px',
    borderRadius: '8px',
    padding: '16px',
    margin: '0',
    minWidth: '0',
    maxWidth: '100%',
    minHeight: '0',
    maxHeight: '100%'
  },
  activeCard: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196f3',
    borderWidth: '2px',
    borderRadius: '8px',
    padding: '16px',
    margin: '0',
    minWidth: '0',
    maxWidth: '100%',
    minHeight: '0',
    maxHeight: '100%'
  },
  focusedCard: {
    backgroundColor: '#fff3e0',
    borderColor: '#ff9800',
    borderWidth: '2px',
    borderRadius: '8px',
    padding: '16px',
    margin: '0',
    minWidth: '0',
    maxWidth: '100%',
    minHeight: '0',
    maxHeight: '100%'
  },
  header: {
    backgroundColor: '#f5f5f5',
    borderColor: '#e0e0e0',
    borderWidth: '1px',
    borderRadius: '8px',
    padding: '8px',
    margin: '0',
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#000000'
  },
  body: {
    backgroundColor: '#ffffff',
    borderColor: '#e0e0e0',
    borderWidth: '1px',
    borderRadius: '8px',
    padding: '16px',
    margin: '0',
    fontSize: '16px',
    color: '#000000'
  },
  footer: {
    backgroundColor: '#f5f5f5',
    borderColor: '#e0e0e0',
    borderWidth: '1px',
    borderRadius: '8px',
    padding: '8px',
    margin: '0',
    fontSize: '16px',
    color: '#000000'
  },
  validate: () => true
};

/**
 * 카드 스타일 클래스
 */
export class CardStyle implements ICardStyle {
  constructor(
    public readonly card: {
      readonly backgroundColor: string;
      readonly borderColor: string;
      readonly borderWidth: string;
      readonly borderRadius: string;
      readonly padding: string;
      readonly margin: string;
      readonly minWidth: string;
      readonly maxWidth: string;
      readonly minHeight: string;
      readonly maxHeight: string;
    },
    public readonly activeCard: {
      readonly backgroundColor: string;
      readonly borderColor: string;
      readonly borderWidth: string;
      readonly borderRadius: string;
      readonly padding: string;
      readonly margin: string;
      readonly minWidth: string;
      readonly maxWidth: string;
      readonly minHeight: string;
      readonly maxHeight: string;
    },
    public readonly focusedCard: {
      readonly backgroundColor: string;
      readonly borderColor: string;
      readonly borderWidth: string;
      readonly borderRadius: string;
      readonly padding: string;
      readonly margin: string;
      readonly minWidth: string;
      readonly maxWidth: string;
      readonly minHeight: string;
      readonly maxHeight: string;
    },
    public readonly header: {
      readonly backgroundColor: string;
      readonly borderColor: string;
      readonly borderWidth: string;
      readonly borderRadius: string;
      readonly padding: string;
      readonly margin: string;
      readonly fontSize: string;
      readonly fontWeight: string;
      readonly color: string;
    },
    public readonly body: {
      readonly backgroundColor: string;
      readonly borderColor: string;
      readonly borderWidth: string;
      readonly borderRadius: string;
      readonly padding: string;
      readonly margin: string;
      readonly fontSize: string;
      readonly color: string;
    },
    public readonly footer: {
      readonly backgroundColor: string;
      readonly borderColor: string;
      readonly borderWidth: string;
      readonly borderRadius: string;
      readonly padding: string;
      readonly margin: string;
      readonly fontSize: string;
      readonly color: string;
    }
  ) {}

  /**
   * 스타일 유효성 검사
   */
  public validate(): boolean {
    return (
      !!this.card.backgroundColor &&
      !!this.card.borderColor &&
      !!this.card.borderWidth &&
      !!this.card.borderRadius &&
      !!this.card.padding &&
      !!this.card.margin &&
      !!this.card.minWidth &&
      !!this.card.maxWidth &&
      !!this.card.minHeight &&
      !!this.card.maxHeight &&
      !!this.activeCard.backgroundColor &&
      !!this.activeCard.borderColor &&
      !!this.activeCard.borderWidth &&
      !!this.activeCard.borderRadius &&
      !!this.activeCard.padding &&
      !!this.activeCard.margin &&
      !!this.activeCard.minWidth &&
      !!this.activeCard.maxWidth &&
      !!this.activeCard.minHeight &&
      !!this.activeCard.maxHeight &&
      !!this.focusedCard.backgroundColor &&
      !!this.focusedCard.borderColor &&
      !!this.focusedCard.borderWidth &&
      !!this.focusedCard.borderRadius &&
      !!this.focusedCard.padding &&
      !!this.focusedCard.margin &&
      !!this.focusedCard.minWidth &&
      !!this.focusedCard.maxWidth &&
      !!this.focusedCard.minHeight &&
      !!this.focusedCard.maxHeight &&
      !!this.header.backgroundColor &&
      !!this.header.borderColor &&
      !!this.header.borderWidth &&
      !!this.header.borderRadius &&
      !!this.header.padding &&
      !!this.header.margin &&
      !!this.header.fontSize &&
      !!this.header.fontWeight &&
      !!this.header.color &&
      !!this.body.backgroundColor &&
      !!this.body.borderColor &&
      !!this.body.borderWidth &&
      !!this.body.borderRadius &&
      !!this.body.padding &&
      !!this.body.margin &&
      !!this.body.fontSize &&
      !!this.body.color &&
      !!this.footer.backgroundColor &&
      !!this.footer.borderColor &&
      !!this.footer.borderWidth &&
      !!this.footer.borderRadius &&
      !!this.footer.padding &&
      !!this.footer.margin &&
      !!this.footer.fontSize &&
      !!this.footer.color
    );
  }
} 