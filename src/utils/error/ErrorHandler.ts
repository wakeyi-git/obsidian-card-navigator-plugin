import { Notice } from 'obsidian';
import { Log } from '../log/Log';
import { ERROR_MESSAGES, ErrorCode, ErrorSeverity, ERROR_SEVERITIES, ERROR_NOTICE_DURATION, ErrorGroup, ERROR_GROUPS } from '../../core/constants/error.constants';
import { CardNavigatorError } from './CardNavigatorError';

/**
 * 오류 처리 클래스
 * 플러그인 내에서 발생하는 오류를 처리하고 사용자에게 알리는 역할을 합니다.
 */
export class ErrorHandler {
  /**
   * 오류 처리 메서드
   * @param message 오류 메시지
   * @param error 오류 객체
   * @param showNotice 사용자에게 알림 표시 여부
   */
  public static handleError(message: string, error: any, showNotice: boolean = true): void {
    // 오류 로깅
    Log.error(`${message}: ${error.message || error}`);
    
    if (error.stack) {
      Log.error(`스택 트레이스: ${error.stack}`);
    }
    
    // 사용자에게 알림 표시
    if (showNotice) {
      new Notice(`카드 네비게이터 오류: ${message}`, ERROR_NOTICE_DURATION[ErrorSeverity.ERROR]);
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
   * 오류 캡처 메서드
   * 비동기 함수에서 발생하는 오류를 캡처하고 처리합니다.
   * @param fn 실행할 비동기 함수
   * @param errorCode 오류 발생 시 사용할 오류 코드
   * @param params 오류 메시지에 포함될 매개변수
   * @param showNotice 사용자에게 알림 표시 여부
   * @returns 비동기 함수의 결과 또는 undefined(오류 발생 시)
   */
  public static async captureError<T>(
    fn: () => Promise<T>,
    errorCode: ErrorCode = 'UNKNOWN_ERROR',
    params: Record<string, string> = {},
    showNotice: boolean = true
  ): Promise<T | undefined> {
    try {
      return await fn();
    } catch (error) {
      // 오류가 이미 CardNavigatorError인 경우
      if (error instanceof CardNavigatorError) {
        Log.error(error.toString());
        
        if (showNotice) {
          new Notice(`카드 네비게이터 오류: ${error.message}`, ERROR_NOTICE_DURATION[error.severity]);
        }
      } else {
        // 일반 오류인 경우 errorCode를 사용하여 처리
        this.handleErrorWithCode(errorCode, {
          ...params,
          message: error instanceof Error ? error.message : String(error)
        }, showNotice);
      }
      
      return undefined;
    }
  }
  
  /**
   * 동기 오류 캡처 메서드
   * 동기 함수에서 발생하는 오류를 캡처하고 처리합니다.
   * @param fn 실행할 동기 함수
   * @param errorCode 오류 발생 시 사용할 오류 코드
   * @param params 오류 메시지에 포함될 매개변수
   * @param showNotice 사용자에게 알림 표시 여부
   * @returns 동기 함수의 결과 또는 undefined(오류 발생 시)
   */
  public static captureErrorSync<T>(
    fn: () => T,
    errorCode: ErrorCode = 'UNKNOWN_ERROR',
    params: Record<string, string> = {},
    showNotice: boolean = true
  ): T | undefined {
    try {
      return fn();
    } catch (error) {
      // 오류가 이미 CardNavigatorError인 경우
      if (error instanceof CardNavigatorError) {
        Log.error(error.toString());
        
        if (showNotice) {
          new Notice(`카드 네비게이터 오류: ${error.message}`, ERROR_NOTICE_DURATION[error.severity]);
        }
      } else {
        // 일반 오류인 경우 errorCode를 사용하여 처리
        this.handleErrorWithCode(errorCode, {
          ...params,
          message: error instanceof Error ? error.message : String(error)
        }, showNotice);
      }
      
      return undefined;
    }
  }
  
  /**
   * 그룹별 오류 처리 메서드
   * 특정 그룹에 속하는 오류 코드에 대한 처리 방법을 정의합니다.
   * @param group 오류 그룹
   * @param error 오류 객체
   * @param params 오류 메시지에 포함될 매개변수
   * @param showNotice 사용자에게 알림 표시 여부
   */
  public static handleErrorByGroup(group: ErrorGroup, error: any, params: Record<string, string> = {}, showNotice: boolean = true): void {
    // 오류가 이미 CardNavigatorError인 경우
    if (error instanceof CardNavigatorError) {
      // 오류 코드의 그룹이 지정된 그룹과 일치하는지 확인
      if (ERROR_GROUPS[error.code] === group) {
        Log.error(error.toString());
        
        if (showNotice) {
          new Notice(`카드 네비게이터 오류: ${error.message}`, ERROR_NOTICE_DURATION[error.severity]);
        }
      } else {
        // 그룹이 일치하지 않는 경우 일반 오류로 처리
        this.handleError(`${group} 그룹 오류: ${error.message}`, error, showNotice);
      }
    } else {
      // 일반 오류인 경우 그룹에 맞는 기본 오류 코드 선택
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
      
      this.handleErrorWithCode(errorCode, {
        ...params,
        message: error instanceof Error ? error.message : String(error)
      }, showNotice);
    }
  }
} 