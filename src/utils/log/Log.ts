/**
 * 로깅 클래스
 * 플러그인 내에서 로깅을 담당하며, 디버그 모드에 따라 로그 출력을 제어합니다.
 */
export class Log {
  /**
   * 디버그 모드 활성화 여부
   */
  private static debugMode: boolean = false;
  
  /**
   * 플러그인 이름
   */
  private static readonly PLUGIN_NAME = 'Card Navigator';
  
  /**
   * 디버그 모드 설정
   * @param enabled 디버그 모드 활성화 여부
   */
  public static setDebugMode(enabled: boolean): void {
    Log.debugMode = enabled;
    
    if (enabled) {
      Log.debug('디버그 모드가 활성화되었습니다.');
    }
  }
  
  /**
   * 디버그 모드 여부 확인
   * @returns 디버그 모드 활성화 여부
   */
  public static isDebugMode(): boolean {
    return Log.debugMode;
  }
  
  /**
   * 정보 로그 출력
   * @param message 로그 메시지
   * @param data 추가 데이터
   */
  public static info(message: string, data?: any): void {
    console.info(`[${Log.PLUGIN_NAME}] ${message}`, data ? data : '');
  }
  
  /**
   * 디버그 로그 출력 (디버그 모드에서만 출력)
   * @param message 로그 메시지
   * @param data 추가 데이터
   */
  public static debug(message: string, data?: any): void {
    if (Log.debugMode) {
      console.debug(`[${Log.PLUGIN_NAME}] ${message}`, data ? data : '');
    }
  }
  
  /**
   * 경고 로그 출력
   * @param message 로그 메시지
   * @param data 추가 데이터
   */
  public static warn(message: string, data?: any): void {
    console.warn(`[${Log.PLUGIN_NAME}] ${message}`, data ? data : '');
  }
  
  /**
   * 오류 로그 출력
   * @param message 로그 메시지
   * @param data 추가 데이터
   */
  public static error(message: string, data?: any): void {
    console.error(`[${Log.PLUGIN_NAME}] ${message}`, data ? data : '');
  }
  
  /**
   * 성능 측정 시작
   * @param label 성능 측정 라벨
   */
  public static startPerformance(label: string): void {
    if (Log.debugMode) {
      console.time(`[${Log.PLUGIN_NAME}] ${label}`);
    }
  }
  
  /**
   * 성능 측정 종료
   * @param label 성능 측정 라벨
   */
  public static endPerformance(label: string): void {
    if (Log.debugMode) {
      console.timeEnd(`[${Log.PLUGIN_NAME}] ${label}`);
    }
  }
  
  /**
   * 객체 로깅
   * @param label 객체 라벨
   * @param obj 로깅할 객체
   */
  public static object(label: string, obj: any): void {
    if (Log.debugMode) {
      console.groupCollapsed(`[${Log.PLUGIN_NAME}] ${label}`);
      console.dir(obj);
      console.groupEnd();
    }
  }
  
  /**
   * 그룹 시작
   * @param label 그룹 라벨
   * @param collapsed 축소 여부 (기본값: true)
   */
  public static groupStart(label: string, collapsed: boolean = true): void {
    if (Log.debugMode) {
      if (collapsed) {
        console.groupCollapsed(`[${Log.PLUGIN_NAME}] ${label}`);
      } else {
        console.group(`[${Log.PLUGIN_NAME}] ${label}`);
      }
    }
  }
  
  /**
   * 그룹 종료
   */
  public static groupEnd(): void {
    if (Log.debugMode) {
      console.groupEnd();
    }
  }
  
  /**
   * 테이블 로깅
   * @param label 테이블 라벨
   * @param data 테이블 데이터
   */
  public static table(label: string, data: any[]): void {
    if (Log.debugMode) {
      console.log(`[${Log.PLUGIN_NAME}] ${label}`);
      console.table(data);
    }
  }
  
  /**
   * 성능 측정 함수 래퍼
   * @param label 성능 측정 라벨
   * @param fn 측정할 함수
   * @returns 함수 실행 결과
   */
  public static measurePerformance<T>(label: string, fn: () => T): T {
    if (!Log.debugMode) {
      return fn();
    }
    
    Log.startPerformance(label);
    try {
      return fn();
    } finally {
      Log.endPerformance(label);
    }
  }
  
  /**
   * 비동기 성능 측정 함수 래퍼
   * @param label 성능 측정 라벨
   * @param fn 측정할 비동기 함수
   * @returns 비동기 함수 실행 결과를 포함한 Promise
   */
  public static async measurePerformanceAsync<T>(label: string, fn: () => Promise<T>): Promise<T> {
    if (!Log.debugMode) {
      return fn();
    }
    
    Log.startPerformance(label);
    try {
      return await fn();
    } finally {
      Log.endPerformance(label);
    }
  }
  
  /**
   * 조건부 로그 출력
   * @param condition 조건
   * @param level 로그 레벨 ('info', 'debug', 'warn', 'error')
   * @param message 로그 메시지
   * @param data 추가 데이터
   */
  public static logIf(condition: boolean, level: 'info' | 'debug' | 'warn' | 'error', message: string, data?: any): void {
    if (!condition) {
      return;
    }
    
    switch (level) {
      case 'info':
        Log.info(message, data);
        break;
      case 'debug':
        Log.debug(message, data);
        break;
      case 'warn':
        Log.warn(message, data);
        break;
      case 'error':
        Log.error(message, data);
        break;
    }
  }
} 