import { ErrorCode, ErrorSeverity, ERROR_SEVERITIES, ErrorGroup, ERROR_GROUPS } from '../../core/constants/error.constants';

/**
 * 카드 네비게이터 오류 클래스
 * 플러그인 내에서 발생하는 오류를 나타내는 클래스입니다.
 */
export class CardNavigatorError extends Error {
  /**
   * 오류 코드
   */
  public readonly code: ErrorCode;
  
  /**
   * 오류 심각도
   */
  public readonly severity: ErrorSeverity;
  
  /**
   * 오류 그룹
   */
  public readonly group: ErrorGroup;
  
  /**
   * 오류 세부 정보
   */
  public readonly details?: Record<string, any>;
  
  /**
   * 오류 발생 시간
   */
  public readonly timestamp: Date;
  
  /**
   * 생성자
   * @param message 오류 메시지
   * @param code 오류 코드
   * @param details 오류 세부 정보
   */
  constructor(message: string, code: ErrorCode = 'UNKNOWN_ERROR', details?: Record<string, any>) {
    super(message);
    this.name = 'CardNavigatorError';
    this.code = code;
    this.severity = ERROR_SEVERITIES[code] || ErrorSeverity.ERROR;
    this.group = ERROR_GROUPS[code] || ErrorGroup.GENERAL;
    this.details = details;
    this.timestamp = new Date();
    
    // Error 객체의 프로토타입 체인 설정
    Object.setPrototypeOf(this, CardNavigatorError.prototype);
  }
  
  /**
   * 오류 객체를 문자열로 변환
   * @returns 오류 문자열 표현
   */
  public toString(): string {
    const detailsStr = this.details ? `\n세부 정보: ${JSON.stringify(this.details, null, 2)}` : '';
    const timestampStr = this.timestamp.toISOString();
    
    return `[${this.name}] [${this.code}] [${this.group}] [${this.severity}] [${timestampStr}]
메시지: ${this.message}${detailsStr}
${this.stack ? `\n스택 트레이스:\n${this.stack}` : ''}`;
  }
  
  /**
   * 오류 객체를 JSON으로 변환
   * @returns 오류 JSON 표현
   */
  public toJSON(): Record<string, any> {
    return {
      name: this.name,
      code: this.code,
      group: this.group,
      severity: this.severity,
      message: this.message,
      details: this.details,
      timestamp: this.timestamp.toISOString(),
      stack: this.stack
    };
  }
  
  /**
   * 오류 객체 생성 팩토리 메서드
   * @param message 오류 메시지
   * @param code 오류 코드
   * @param details 오류 세부 정보
   * @returns 카드 네비게이터 오류 객체
   */
  public static create(message: string, code: ErrorCode = 'UNKNOWN_ERROR', details?: Record<string, any>): CardNavigatorError {
    return new CardNavigatorError(message, code, details);
  }
  
  /**
   * 특정 그룹의 오류 객체 생성 팩토리 메서드
   * @param message 오류 메시지
   * @param group 오류 그룹
   * @param details 오류 세부 정보
   * @returns 카드 네비게이터 오류 객체
   */
  public static createWithGroup(message: string, group: ErrorGroup, details?: Record<string, any>): CardNavigatorError {
    // 그룹에 맞는 기본 오류 코드 선택
    let errorCode: ErrorCode;
    
    switch (group) {
      case ErrorGroup.FILE:
        errorCode = 'FILE_NOT_FOUND';
        break;
      case ErrorGroup.SETTINGS:
        errorCode = 'SETTINGS_LOAD_ERROR';
        break;
      case ErrorGroup.PRESET:
        errorCode = 'PRESET_LOAD_ERROR';
        break;
      case ErrorGroup.CARDSET:
        errorCode = 'CARDSET_LOAD_ERROR';
        break;
      case ErrorGroup.LAYOUT:
        errorCode = 'LAYOUT_INITIALIZATION_ERROR';
        break;
      case ErrorGroup.SEARCH:
        errorCode = 'SEARCH_ERROR';
        break;
      case ErrorGroup.RENDER:
        errorCode = 'RENDER_ERROR';
        break;
      case ErrorGroup.API:
        errorCode = 'API_ERROR';
        break;
      default:
        errorCode = 'UNKNOWN_ERROR';
    }
    
    return new CardNavigatorError(message, errorCode, details);
  }
  
  /**
   * 오류가 특정 그룹에 속하는지 확인
   * @param group 오류 그룹
   * @returns 그룹 소속 여부
   */
  public isInGroup(group: ErrorGroup): boolean {
    return this.group === group;
  }
} 