import { ICard } from '../../card/Card';

/**
 * 배치 작업 타입
 */
export type BatchActionType = 
  | 'move'
  | 'copy'
  | 'delete'
  | 'tag'
  | 'untag'
  | 'property'
  | 'convert';

/**
 * 배치 작업 매개변수 인터페이스
 */
export interface IBatchActionParams {
  cards: ICard[];
  type: BatchActionType;
  additionalData?: IBatchActionAdditionalData;
}

/**
 * 배치 작업 추가 데이터 인터페이스
 */
export interface IBatchActionAdditionalData {
  targetPath?: string;
  tags?: string[];
  property?: {
    key: string;
    value: any;
  };
  format?: string;
}

/**
 * 배치 작업 카드별 결과 인터페이스
 */
export interface IBatchActionCardResult {
  card: ICard;
  success: boolean;
  error?: string;
  newPath?: string;
}

/**
 * 배치 작업 결과 데이터 인터페이스
 */
export interface IBatchActionResultData {
  totalCount: number;
  successCount: number;
  failureCount: number;
  errors: string[];
}

/**
 * 배치 작업 결과 인터페이스
 */
export interface IBatchActionResult {
  type: BatchActionType;
  cardResults: IBatchActionCardResult[];
  resultData: IBatchActionResultData;
}

/**
 * 배치 작업 핸들러 인터페이스
 */
export interface IBatchActionHandler {
  /**
   * 배치 작업 실행
   */
  execute(params: IBatchActionParams): Promise<IBatchActionResult>;
  
  /**
   * 작업 타입 조회
   */
  getActionType(): BatchActionType;
  
  /**
   * 작업 실행 가능 여부 확인
   */
  canExecute(params: IBatchActionParams): boolean;
} 