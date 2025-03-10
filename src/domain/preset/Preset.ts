import { CardSetSourceType } from '../cardset/CardSet';
import { LayoutType } from '../layout/Layout';
import { SortType } from '../sorting/SortingInterfaces';

/**
 * 프리셋 인터페이스
 * 사용자 정의 설정 프리셋을 정의합니다.
 */
export interface IPreset {
  /**
   * 프리셋 ID
   */
  id: string;
  
  /**
   * 프리셋 이름
   */
  name: string;
  
  /**
   * 프리셋 설명
   */
  description?: string;
  
  /**
   * 카드셋 소스 타입 (선택적)
   */
  cardSetSourceType?: CardSetSourceType;
  
  /**
   * 카드셋 소스 (선택적)
   */
  cardSetSource?: string;
  
  /**
   * 레이아웃 타입 (선택적)
   */
  layoutType?: LayoutType;
  
  /**
   * 정렬 타입 (선택적)
   */
  sortType?: SortType;
  
  /**
   * 정렬 방향 (선택적)
   */
  sortDirection?: 'asc' | 'desc';
  
  /**
   * 카드 표시 설정 (선택적)
   */
  cardDisplaySettings?: {
    header?: {
      enabled: boolean;
      content?: string[];
      style?: any;
    };
    body?: {
      enabled: boolean;
      content?: string[];
      style?: any;
    };
    footer?: {
      enabled: boolean;
      content?: string[];
      style?: any;
    };
    renderingMode?: 'plain' | 'markdown';
  };
  
  /**
   * 레이아웃 설정 (선택적)
   */
  layoutSettings?: {
    gridMode?: boolean;
    cardWidth?: number;
    cardHeight?: number;
    columns?: number;
    rows?: number;
  };
  
  /**
   * 생성일
   */
  createdAt: number;
  
  /**
   * 수정일
   */
  updatedAt: number;
}

/**
 * 프리셋 설정 적용 결과 인터페이스
 * 프리셋 적용 결과를 정의합니다.
 */
export interface IPresetApplyResult {
  /**
   * 적용된 프리셋 ID
   */
  presetId: string;
  
  /**
   * 적용된 프리셋 이름
   */
  presetName: string;
  
  /**
   * 적용 성공 여부
   */
  success: boolean;
  
  /**
   * 적용된 설정 키 목록
   */
  appliedSettings: string[];
  
  /**
   * 오류 메시지 (실패 시)
   */
  errorMessage?: string;
} 