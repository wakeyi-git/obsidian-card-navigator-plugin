/**
 * 일괄 작업 타입
 * 다중 선택된 카드에 적용할 수 있는 작업 유형을 정의합니다.
 */
export enum BatchActionType {
  COPY_LINK = 'copy-link',           // 링크 복사
  COPY_CONTENT = 'copy-content',     // 내용 복사
  OPEN_ALL = 'open-all',             // 모두 열기
  TAG_ALL = 'tag-all',               // 태그 추가
  UNTAG_ALL = 'untag-all',           // 태그 제거
  MOVE_TO_FOLDER = 'move-to-folder', // 폴더로 이동
  EXPORT_ALL = 'export-all',         // 내보내기
  DELETE_ALL = 'delete-all',         // 삭제
  INSERT_LINKS = 'insert-links',     // 링크 삽입
  INSERT_EMBEDS = 'insert-embeds',   // 임베드 삽입
  INSERT_CONTENT = 'insert-content', // 내용 삽입
  CREATE_NOTE = 'create-note',       // 새 노트 생성
  ADD_PROPERTY = 'add-property',     // 프로퍼티 추가
  REMOVE_PROPERTY = 'remove-property', // 프로퍼티 제거
  MODIFY_PROPERTY = 'modify-property' // 프로퍼티 수정
}

/**
 * 일괄 작업 매개변수 인터페이스
 */
export interface IBatchActionParams {
  type: BatchActionType;
  additionalData?: IBatchActionAdditionalData;
}

/**
 * 일괄 작업 결과 인터페이스
 */
export interface IBatchActionResult {
  success: boolean;
  processedCount: number;
  failedCount: number;
  errorMessage?: string;
  resultData?: IBatchActionResultData;
  cardResults?: IBatchActionCardResult[];
}

/**
 * 개별 카드 처리 결과 인터페이스
 */
export interface IBatchActionCardResult {
  cardId: string;
  success: boolean;
  errorMessage?: string;
}

/**
 * 일괄 작업 추가 데이터 인터페이스
 */
export interface IBatchActionAdditionalData {
  tag?: {
    name: string;
  };
  folder?: {
    path: string;
  };
  insert?: {
    targetFilePath: string;
    position?: number;
    format?: 'list' | 'paragraph' | 'table';
  };
  createNote?: {
    title: string;
    template?: string;
    folderPath?: string;
  };
  property?: {
    key: string;
    value?: any;
  };
  export?: {
    format: 'markdown' | 'html' | 'pdf' | 'csv';
    path?: string;
    filenameTemplate?: string;
  };
}

/**
 * 일괄 작업 결과 데이터 인터페이스
 */
export interface IBatchActionResultData {
  copy?: {
    text: string;
  };
  insert?: {
    filePath: string;
    lineNumber: number;
  };
  createNote?: {
    filePath: string;
  };
  export?: {
    path: string;
    files: string[];
  };
} 