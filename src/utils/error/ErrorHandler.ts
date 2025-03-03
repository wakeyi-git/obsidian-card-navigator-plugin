import { Notice } from 'obsidian';
import { Log } from '../log/Log';
import { ERROR_MESSAGES, ErrorCode, ErrorSeverity, ERROR_SEVERITIES, ERROR_NOTICE_DURATION, ErrorGroup, ERROR_GROUPS } from '../../core/constants/error.constants';
import { CardNavigatorError } from './CardNavigatorError';

/**
 * 오류 처리 클래스
 * 애플리케이션 전체에서 발생하는 오류를 일관되게 처리합니다.
 */
export class ErrorHandler {
  private static instance: ErrorHandler;

  /**
   * 싱글톤 인스턴스를 반환합니다.
   * @returns ErrorHandler 인스턴스
   */
  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * 오류 처리 함수
   * 오류를 로깅하고 필요한 경우 사용자에게 알립니다.
   * @param message 오류 메시지
   * @param error 오류 객체
   * @param showNotice 사용자에게 알림 표시 여부
   */
  public static handleError(message: string, error: unknown, showNotice: boolean = false): void {
    // 오류 로깅
    Log.error(message, error);
    
    // 콘솔에 오류 출력
    console.error(message, error);
    
    // 사용자에게 알림 표시 (옵션)
    if (showNotice) {
      new Notice(`오류: ${message}`);
    }
  }
  
  /**
   * 사용자에게 오류 알림 표시 함수
   * @param message 오류 메시지
   * @param error 오류 객체
   */
  public static showErrorNotice(message: string, error?: unknown): void {
    // 오류 로깅
    if (error) {
      Log.error(message, error);
      console.error(message, error);
    }
    
    // 사용자에게 알림 표시
    new Notice(`오류: ${message}`);
  }
  
  /**
   * 오류 객체에서 메시지 추출 함수
   * 다양한 형태의 오류 객체에서 메시지를 추출합니다.
   * @param error 오류 객체
   * @returns 오류 메시지
   */
  public static getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    } else if (typeof error === 'string') {
      return error;
    } else if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
      return error.message;
    } else {
      return '알 수 없는 오류가 발생했습니다.';
    }
  }
  
  /**
   * 특정 오류 코드에 해당하는 오류 처리 메서드
   * @param errorCode 오류 코드
   * @param params 오류 메시지에 포함될 매개변수
   * @param showNotice 사용자에게 알림 표시 여부
   */
  public static handleErrorWithCode(errorCode: ErrorCode, params: Record<string, string> = {}, showNotice: boolean = true): void {
    // 오류 코드에 해당하는 메시지 가져오기
    let message = ERROR_MESSAGES[errorCode] || '알 수 없는 오류가 발생했습니다.';
    
    // 메시지에 매개변수 적용
    Object.keys(params).forEach(key => {
      message = message.replace(`{${key}}`, params[key]);
    });
    
    // 오류 심각도 가져오기
    const severity = ERROR_SEVERITIES[errorCode] || ErrorSeverity.ERROR;
    
    // 오류 로깅
    Log.error(`오류 코드 ${errorCode} (${severity}): ${message}`);
    
    // 사용자에게 알림 표시
    if (showNotice) {
      new Notice(`카드 네비게이터 오류: ${message}`, ERROR_NOTICE_DURATION[severity]);
    }
  }
  
  /**
   * 경고 처리 메서드
   * @param message 경고 메시지
   * @param showNotice 사용자에게 알림 표시 여부
   */
  public static handleWarning(message: string, showNotice: boolean = true): void {
    // 경고 로깅
    Log.warn(message);
    
    // 사용자에게 알림 표시
    if (showNotice) {
      new Notice(`카드 네비게이터 경고: ${message}`, ERROR_NOTICE_DURATION[ErrorSeverity.WARNING]);
    }
  }
  
  /**
   * 특정 오류 코드에 해당하는 경고 처리 메서드
   * @param warningCode 경고 코드
   * @param params 경고 메시지에 포함될 매개변수
   * @param showNotice 사용자에게 알림 표시 여부
   */
  public static handleWarningWithCode(warningCode: ErrorCode, params: Record<string, string> = {}, showNotice: boolean = true): void {
    // 경고 코드에 해당하는 메시지 가져오기
    let message = ERROR_MESSAGES[warningCode] || '알 수 없는 경고가 발생했습니다.';
    
    // 메시지에 매개변수 적용
    Object.keys(params).forEach(key => {
      message = message.replace(`{${key}}`, params[key]);
    });
    
    // 경고 심각도 가져오기
    const severity = ERROR_SEVERITIES[warningCode] || ErrorSeverity.WARNING;
    
    // 경고 로깅
    Log.warn(`경고 코드 ${warningCode} (${severity}): ${message}`);
    
    // 사용자에게 알림 표시
    if (showNotice) {
      new Notice(`카드 네비게이터 경고: ${message}`, ERROR_NOTICE_DURATION[severity]);
    }
  }
  
  /**
   * 정보 메시지 처리 메서드
   * @param message 정보 메시지
   * @param showNotice 사용자에게 알림 표시 여부
   */
  public static handleInfo(message: string, showNotice: boolean = true): void {
    // 정보 로깅
    Log.info(message);
    
    // 사용자에게 알림 표시
    if (showNotice) {
      new Notice(`카드 네비게이터: ${message}`, ERROR_NOTICE_DURATION[ErrorSeverity.INFO]);
    }
  }
  
  /**
   * 오류 객체 생성 메서드
   * @param errorCode 오류 코드
   * @param params 오류 메시지에 포함될 매개변수
   * @returns 오류 객체
   */
  public static createError(errorCode: ErrorCode, params: Record<string, string> = {}): CardNavigatorError {
    // 오류 코드에 해당하는 메시지 가져오기
    let message = ERROR_MESSAGES[errorCode] || '알 수 없는 오류가 발생했습니다.';
    
    // 메시지에 매개변수 적용
    Object.keys(params).forEach(key => {
      message = message.replace(`{${key}}`, params[key]);
    });
    
    // 오류 객체 생성 및 반환
    return new CardNavigatorError(message, errorCode);
  }
  
  /**
   * 오류 심각도 가져오기
   * @param errorCode 오류 코드
   * @returns 오류 심각도
   */
  public static getSeverity(errorCode: ErrorCode): ErrorSeverity {
    return ERROR_SEVERITIES[errorCode] || ErrorSeverity.ERROR;
  }
  
  /**
   * 오류 그룹 가져오기
   * @param errorCode 오류 코드
   * @returns 오류 그룹
   */
  public static getGroup(errorCode: ErrorCode): ErrorGroup {
    return ERROR_GROUPS[errorCode] || ErrorGroup.GENERAL;
  }
  
  /**
   * 오류 메시지 가져오기
   * @param errorCode 오류 코드
   * @param params 오류 메시지에 포함될 매개변수
   * @returns 오류 메시지
   */
  public static getMessage(errorCode: ErrorCode, params: Record<string, string> = {}): string {
    // 오류 코드에 해당하는 메시지 가져오기
    let message = ERROR_MESSAGES[errorCode] || '알 수 없는 오류가 발생했습니다.';
    
    // 메시지에 매개변수 적용
    Object.keys(params).forEach(key => {
      message = message.replace(`{${key}}`, params[key]);
    });
    
    return message;
  }
  
  /**
   * 특정 그룹의 오류 코드 가져오기
   * @param group 오류 그룹
   * @returns 오류 코드 배열
   */
  public static getErrorCodesByGroup(group: ErrorGroup): ErrorCode[] {
    return Object.entries(ERROR_GROUPS)
      .filter(([_, g]) => g === group)
      .map(([code]) => code as ErrorCode);
  }
  
  /**
   * 비동기 함수 실행 중 발생하는 오류 처리
   * @param fn 실행할 비동기 함수
   * @param errorCode 오류 코드
   * @param params 오류 메시지에 포함될 매개변수
   * @param showNotice 사용자에게 알림 표시 여부
   * @returns 함수 실행 결과 또는 오류 발생 시 undefined
   */
  public static async captureError<T>(
    fn: () => Promise<T>,
    errorCode: ErrorCode = ErrorCode.UNKNOWN_ERROR,
    params: Record<string, string> = {},
    showNotice: boolean = true
  ): Promise<T | undefined> {
    try {
      return await fn();
    } catch (error: Error | unknown) {
      // 오류 메시지 가져오기
      const message = ErrorHandler.getMessage(errorCode, params);
      
      // 오류 처리
      ErrorHandler.handleError(message, error, showNotice);
      return undefined;
    }
  }
  
  /**
   * 동기 함수 실행 중 발생하는 오류 처리
   * @param fn 실행할 동기 함수
   * @param errorCode 오류 코드
   * @param params 오류 메시지에 포함될 매개변수
   * @param showNotice 사용자에게 알림 표시 여부
   * @returns 함수 실행 결과 또는 오류 발생 시 undefined
   */
  public static captureErrorSync<T>(
    fn: () => T,
    errorCode: ErrorCode = ErrorCode.UNKNOWN_ERROR,
    params: Record<string, string> = {},
    showNotice: boolean = true
  ): T | undefined {
    try {
      return fn();
    } catch (error: Error | unknown) {
      // 오류 메시지 가져오기
      const message = ErrorHandler.getMessage(errorCode, params);
      
      // 오류 처리
      ErrorHandler.handleError(message, error, showNotice);
      return undefined;
    }
  }
  
  /**
   * 그룹별 오류 처리 메서드
   * @param group 오류 그룹
   * @param error 오류 객체
   * @param params 오류 메시지에 포함될 매개변수
   * @param showNotice 사용자에게 알림 표시 여부
   */
  public static handleErrorByGroup(group: ErrorGroup, error: Error | unknown, params: Record<string, string> = {}, showNotice: boolean = true): void {
    // 그룹에 따른 오류 코드 결정
    let errorCode: ErrorCode;
    
    switch (group) {
      case ErrorGroup.FILE:
        errorCode = ErrorCode.FILE_NOT_FOUND;
        break;
      case ErrorGroup.SETTINGS:
        errorCode = ErrorCode.SETTINGS_LOAD_ERROR;
        break;
      case ErrorGroup.PRESET:
        errorCode = ErrorCode.PRESET_LOAD_ERROR;
        break;
      case ErrorGroup.CARDSET:
        errorCode = ErrorCode.CARDSET_LOAD_ERROR;
        break;
      case ErrorGroup.LAYOUT:
        errorCode = ErrorCode.LAYOUT_INITIALIZATION_ERROR;
        break;
      case ErrorGroup.SEARCH:
        errorCode = ErrorCode.SEARCH_ERROR;
        break;
      case ErrorGroup.RENDER:
        errorCode = ErrorCode.RENDER_ERROR;
        break;
      case ErrorGroup.API:
        errorCode = ErrorCode.API_ERROR;
        break;
      default:
        errorCode = ErrorCode.UNKNOWN_ERROR;
    }
    
    // 오류 코드에 해당하는 메시지 가져오기
    let message = ERROR_MESSAGES[errorCode] || '알 수 없는 오류가 발생했습니다.';
    
    // 메시지에 매개변수 적용
    Object.keys(params).forEach(key => {
      message = message.replace(`{${key}}`, params[key]);
    });
    
    // 오류 처리
    ErrorHandler.handleError(message, error, showNotice);
  }

  /**
   * 오류 처리 메서드 (인스턴스 메서드)
   * @param message 오류 메시지
   * @param error 오류 객체
   * @param showNotice 사용자에게 알림 표시 여부
   */
  public handleError(message: string, error: Error | unknown, showNotice: boolean = true): void {
    ErrorHandler.handleError(message, error, showNotice);
  }
  
  /**
   * 특정 오류 코드에 해당하는 오류 처리 메서드 (인스턴스 메서드)
   * @param errorCode 오류 코드
   * @param params 오류 메시지에 포함될 매개변수
   * @param showNotice 사용자에게 알림 표시 여부
   */
  public handleErrorWithCode(errorCode: ErrorCode, params: Record<string, string> = {}, showNotice: boolean = true): void {
    ErrorHandler.handleErrorWithCode(errorCode, params, showNotice);
  }
  
  /**
   * 경고 처리 메서드 (인스턴스 메서드)
   * @param message 경고 메시지
   * @param showNotice 사용자에게 알림 표시 여부
   */
  public handleWarning(message: string, showNotice: boolean = true): void {
    ErrorHandler.handleWarning(message, showNotice);
  }
  
  /**
   * 특정 경고 코드에 해당하는 경고 처리 메서드 (인스턴스 메서드)
   * @param warningCode 경고 코드
   * @param params 경고 메시지에 포함될 매개변수
   * @param showNotice 사용자에게 알림 표시 여부
   */
  public handleWarningWithCode(warningCode: ErrorCode, params: Record<string, string> = {}, showNotice: boolean = true): void {
    ErrorHandler.handleWarningWithCode(warningCode, params, showNotice);
  }
  
  /**
   * 정보 처리 메서드 (인스턴스 메서드)
   * @param message 정보 메시지
   * @param showNotice 사용자에게 알림 표시 여부
   */
  public handleInfo(message: string, showNotice: boolean = true): void {
    ErrorHandler.handleInfo(message, showNotice);
  }
  
  /**
   * 오류 생성 메서드 (인스턴스 메서드)
   * @param errorCode 오류 코드
   * @param params 오류 메시지에 포함될 매개변수
   * @returns CardNavigatorError 인스턴스
   */
  public createError(errorCode: ErrorCode, params: Record<string, string> = {}): CardNavigatorError {
    return ErrorHandler.createError(errorCode, params);
  }
  
  /**
   * 그룹별 오류 처리 메서드 (인스턴스 메서드)
   * @param group 오류 그룹
   * @param error 오류 객체
   * @param params 오류 메시지에 포함될 매개변수
   * @param showNotice 사용자에게 알림 표시 여부
   */
  public handleErrorByGroup(group: ErrorGroup, error: Error | unknown, params: Record<string, string> = {}, showNotice: boolean = true): void {
    ErrorHandler.handleErrorByGroup(group, error, params, showNotice);
  }
} 