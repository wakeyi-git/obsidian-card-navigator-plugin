/**
 * 개별 스타일 속성 인터페이스
 */
export interface IStyleProperties {
  backgroundColor: string;
  fontSize: string;
  borderColor: string;
  borderWidth: string;
}

/**
 * 카드 스타일 인터페이스
 * - 카드의 스타일 속성을 정의하는 불변 객체
 */
export interface ICardStyle {
  /**
   * 일반 카드 스타일
   */
  card: IStyleProperties;

  /**
   * 활성 카드 스타일
   */
  activeCard: IStyleProperties;

  /**
   * 포커스된 카드 스타일
   */
  focusedCard: IStyleProperties;

  /**
   * 헤더 스타일
   */
  header: IStyleProperties;

  /**
   * 본문 스타일
   */
  body: IStyleProperties;

  /**
   * 푸터 스타일
   */
  footer: IStyleProperties;

  /**
   * 카드 스타일 유효성 검사
   */
  validate(): boolean;
}

/**
 * 카드 스타일 기본값
 */
export const DEFAULT_CARD_STYLE: ICardStyle = {
  card: {
    backgroundColor: '#ffffff',
    fontSize: '14px',
    borderColor: '#e0e0e0',
    borderWidth: '1px'
  },
  activeCard: {
    backgroundColor: '#f5f5f5',
    fontSize: '14px',
    borderColor: '#2196f3',
    borderWidth: '2px'
  },
  focusedCard: {
    backgroundColor: '#e3f2fd',
    fontSize: '14px',
    borderColor: '#1976d2',
    borderWidth: '2px'
  },
  header: {
    backgroundColor: '#f8f9fa',
    fontSize: '16px',
    borderColor: '#e0e0e0',
    borderWidth: '1px'
  },
  body: {
    backgroundColor: '#ffffff',
    fontSize: '14px',
    borderColor: '#e0e0e0',
    borderWidth: '1px'
  },
  footer: {
    backgroundColor: '#f8f9fa',
    fontSize: '12px',
    borderColor: '#e0e0e0',
    borderWidth: '1px'
  },
  validate: () => true
}; 