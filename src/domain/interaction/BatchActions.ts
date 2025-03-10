import { ICard } from '../card/Card';

/**
 * 일괄 작업 타입
 * 다중 선택된 카드에 적용할 수 있는 작업 유형을 정의합니다.
 */
export type BatchActionType = 
  | 'copy-link'        // 링크 복사
  | 'copy-content'     // 내용 복사
  | 'open-all'         // 모두 열기
  | 'tag-all'          // 태그 추가
  | 'untag-all'        // 태그 제거
  | 'move-to-folder'   // 폴더로 이동
  | 'export-all'       // 내보내기
  | 'delete-all'       // 삭제
  | 'insert-links'     // 링크 삽입
  | 'insert-embeds'    // 임베드 삽입
  | 'insert-content'   // 내용 삽입
  | 'create-note'      // 새 노트 생성
  | 'add-property'     // 프로퍼티 추가
  | 'remove-property'  // 프로퍼티 제거
  | 'modify-property'; // 프로퍼티 수정

/**
 * 일괄 작업 매개변수 인터페이스
 * 일괄 작업 수행에 필요한 매개변수를 정의합니다.
 */
export interface IBatchActionParams {
  /**
   * 작업 타입
   */
  type: BatchActionType;
  
  /**
   * 추가 데이터
   * 작업 타입에 따라 필요한 추가 데이터를 포함합니다.
   */
  additionalData?: IBatchActionAdditionalData;
}

/**
 * 일괄 작업 추가 데이터 인터페이스
 * 작업 타입에 따라 필요한 추가 데이터를 정의합니다.
 */
export interface IBatchActionAdditionalData {
  /**
   * 태그 관련 데이터
   */
  tag?: {
    /**
     * 태그 이름
     */
    name: string;
  };
  
  /**
   * 폴더 관련 데이터
   */
  folder?: {
    /**
     * 폴더 경로
     */
    path: string;
  };
  
  /**
   * 삽입 관련 데이터
   */
  insert?: {
    /**
     * 대상 파일 경로
     */
    targetFilePath: string;
    
    /**
     * 삽입 위치 (라인 번호)
     */
    position?: number;
    
    /**
     * 삽입 형식
     */
    format?: 'list' | 'paragraph' | 'table';
  };
  
  /**
   * 노트 생성 관련 데이터
   */
  createNote?: {
    /**
     * 노트 제목
     */
    title: string;
    
    /**
     * 노트 내용 템플릿
     */
    template?: string;
    
    /**
     * 생성 폴더 경로
     */
    folderPath?: string;
  };
  
  /**
   * 프로퍼티 관련 데이터
   */
  property?: {
    /**
     * 프로퍼티 키
     */
    key: string;
    
    /**
     * 프로퍼티 값
     */
    value?: any;
  };
  
  /**
   * 내보내기 관련 데이터
   */
  export?: {
    /**
     * 내보내기 형식
     */
    format: 'markdown' | 'html' | 'pdf' | 'csv';
    
    /**
     * 내보내기 경로
     */
    path?: string;
    
    /**
     * 파일명 템플릿
     */
    filenameTemplate?: string;
  };
}

/**
 * 일괄 작업 결과 인터페이스
 * 일괄 작업 수행 결과를 정의합니다.
 */
export interface IBatchActionResult {
  /**
   * 작업 성공 여부
   */
  success: boolean;
  
  /**
   * 처리된 카드 수
   */
  processedCount: number;
  
  /**
   * 실패한 카드 수
   */
  failedCount: number;
  
  /**
   * 오류 메시지 (실패 시)
   */
  errorMessage?: string;
  
  /**
   * 결과 데이터
   * 작업 타입에 따라 다른 결과 데이터를 포함합니다.
   */
  resultData?: IBatchActionResultData;
  
  /**
   * 개별 카드 처리 결과
   */
  cardResults?: {
    /**
     * 카드 ID
     */
    cardId: string;
    
    /**
     * 성공 여부
     */
    success: boolean;
    
    /**
     * 오류 메시지 (실패 시)
     */
    errorMessage?: string;
  }[];
}

/**
 * 일괄 작업 결과 데이터 인터페이스
 * 작업 타입에 따라 다른 결과 데이터를 정의합니다.
 */
export interface IBatchActionResultData {
  /**
   * 복사 관련 결과
   */
  copy?: {
    /**
     * 복사된 텍스트
     */
    text: string;
  };
  
  /**
   * 삽입 관련 결과
   */
  insert?: {
    /**
     * 삽입된 파일 경로
     */
    filePath: string;
    
    /**
     * 삽입된 라인 번호
     */
    lineNumber: number;
  };
  
  /**
   * 노트 생성 관련 결과
   */
  createNote?: {
    /**
     * 생성된 노트 경로
     */
    filePath: string;
  };
  
  /**
   * 내보내기 관련 결과
   */
  export?: {
    /**
     * 내보내기 경로
     */
    path: string;
    
    /**
     * 내보내기 파일 목록
     */
    files: string[];
  };
}

/**
 * 일괄 작업 핸들러 타입
 * 일괄 작업을 처리하는 함수 타입을 정의합니다.
 */
export type BatchActionHandler = (cards: ICard[], params: IBatchActionParams) => Promise<IBatchActionResult>;

/**
 * 일괄 작업 관리자 인터페이스
 * 일괄 작업 관련 기능을 제공합니다.
 */
export interface IBatchActionManager {
  /**
   * 일괄 작업 실행
   * @param cards 대상 카드 목록
   * @param params 작업 매개변수
   * @returns 작업 결과
   */
  executeBatchAction(cards: ICard[], params: IBatchActionParams): Promise<IBatchActionResult>;
  
  /**
   * 일괄 작업 핸들러 등록
   * @param type 작업 타입
   * @param handler 핸들러 함수
   */
  registerBatchActionHandler(type: BatchActionType, handler: BatchActionHandler): void;
  
  /**
   * 일괄 작업 핸들러 제거
   * @param type 작업 타입
   */
  unregisterBatchActionHandler(type: BatchActionType): void;
  
  /**
   * 지원되는 일괄 작업 타입 목록 가져오기
   * @returns 지원되는 작업 타입 목록
   */
  getSupportedBatchActionTypes(): BatchActionType[];
} 