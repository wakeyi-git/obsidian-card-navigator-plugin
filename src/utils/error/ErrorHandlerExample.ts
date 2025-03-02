import { ErrorHandler } from './ErrorHandler';
import { CardNavigatorError } from './CardNavigatorError';
import { ErrorGroup, ErrorSeverity } from '../../core/constants/error.constants';
import { Log } from '../log/Log';

/**
 * 오류 처리 시스템 예제
 * 이 파일은 오류 처리 시스템의 사용 방법을 보여주는 예제입니다.
 */
export class ErrorHandlerExample {
  /**
   * 기본 오류 처리 예제
   */
  public static basicErrorHandling(): void {
    try {
      // 일반적인 오류 발생
      throw new Error('일반 오류 발생');
    } catch (error) {
      // ErrorHandler를 사용하여 오류 처리
      ErrorHandler.handleError('기본 오류 처리 예제', error);
    }
  }
  
  /**
   * 오류 코드를 사용한 오류 처리 예제
   */
  public static errorHandlingWithCode(): void {
    try {
      // 파일을 찾을 수 없는 상황 가정
      throw new Error('파일을 찾을 수 없음');
    } catch (error) {
      // 오류 코드와 매개변수를 사용하여 오류 처리
      ErrorHandler.handleErrorWithCode('FILE_NOT_FOUND', {
        path: '/path/to/file.md'
      });
    }
  }
  
  /**
   * CardNavigatorError 사용 예제
   */
  public static customErrorHandling(): void {
    try {
      // CardNavigatorError 생성 및 발생
      throw new CardNavigatorError('프리셋을 찾을 수 없습니다.', 'PRESET_NOT_FOUND', {
        presetId: 'my-preset'
      });
    } catch (error) {
      if (error instanceof CardNavigatorError) {
        // 오류 정보 로깅
        Log.error(error.toString());
        
        // 오류 그룹 확인
        if (error.isInGroup(ErrorGroup.PRESET)) {
          Log.info('프리셋 관련 오류 발생');
        }
      } else {
        // 일반 오류 처리
        ErrorHandler.handleError('알 수 없는 오류', error);
      }
    }
  }
  
  /**
   * 오류 캡처 메서드 사용 예제
   */
  public static async errorCapturing(): Promise<void> {
    // 비동기 함수에서 오류 캡처
    const result = await ErrorHandler.captureError(
      async () => {
        // 비동기 작업 시뮬레이션
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // 오류 발생
        throw new Error('비동기 작업 실패');
      },
      'OPERATION_FAILED',
      { message: '비동기 작업 중 오류 발생' }
    );
    
    if (result === undefined) {
      Log.info('오류가 발생하여 결과가 없습니다.');
    }
    
    // 동기 함수에서 오류 캡처
    const syncResult = ErrorHandler.captureErrorSync(
      () => {
        // 동기 작업 시뮬레이션
        
        // 오류 발생
        throw new Error('동기 작업 실패');
        
        // 반환값 (실행되지 않음)
        return 'success';
      },
      'OPERATION_FAILED',
      { message: '동기 작업 중 오류 발생' }
    );
    
    if (syncResult === undefined) {
      Log.info('오류가 발생하여 결과가 없습니다.');
    }
  }
  
  /**
   * 그룹별 오류 처리 예제
   */
  public static groupErrorHandling(): void {
    try {
      // 레이아웃 관련 오류 발생
      throw new Error('레이아웃 초기화 실패');
    } catch (error) {
      // 그룹별 오류 처리
      ErrorHandler.handleErrorByGroup(ErrorGroup.LAYOUT, error, {
        message: '레이아웃을 초기화하는 중 오류가 발생했습니다.'
      });
    }
    
    try {
      // CardNavigatorError 생성 및 발생
      throw CardNavigatorError.createWithGroup(
        '검색 쿼리 처리 중 오류가 발생했습니다.',
        ErrorGroup.SEARCH,
        { query: 'tag:#project' }
      );
    } catch (error) {
      // 그룹별 오류 처리
      ErrorHandler.handleErrorByGroup(ErrorGroup.SEARCH, error);
    }
  }
  
  /**
   * 모든 예제 실행
   */
  public static runAllExamples(): void {
    Log.setDebugMode(true);
    
    Log.info('===== 오류 처리 시스템 예제 시작 =====');
    
    // 기본 오류 처리 예제
    Log.info('--- 기본 오류 처리 예제 ---');
    this.basicErrorHandling();
    
    // 오류 코드를 사용한 오류 처리 예제
    Log.info('--- 오류 코드를 사용한 오류 처리 예제 ---');
    this.errorHandlingWithCode();
    
    // CardNavigatorError 사용 예제
    Log.info('--- CardNavigatorError 사용 예제 ---');
    this.customErrorHandling();
    
    // 그룹별 오류 처리 예제
    Log.info('--- 그룹별 오류 처리 예제 ---');
    this.groupErrorHandling();
    
    // 오류 캡처 메서드 사용 예제
    Log.info('--- 오류 캡처 메서드 사용 예제 ---');
    this.errorCapturing().then(() => {
      Log.info('===== 오류 처리 시스템 예제 종료 =====');
    });
  }
} 