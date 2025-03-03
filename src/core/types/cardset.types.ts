import { TFile } from 'obsidian';
import { IEventData, SortDirection } from './common.types';
import { ICardSetProvider } from '../interfaces/manager/ICardSetProvider';

/**
 * 카드셋 모드 열거형
 * 카드셋의 표시 모드를 정의합니다.
 */
export enum CardSetMode {
  /**
   * 활성 폴더 모드 - 현재 활성화된 파일이 위치한 폴더의 모든 노트를 카드로 표시
   */
  ACTIVE_FOLDER = 'ACTIVE_FOLDER',
  
  /**
   * 지정 폴더 모드 - 사용자가 명시적으로 지정한 특정 폴더의 노트만 표시
   */
  SELECTED_FOLDER = 'SELECTED_FOLDER',
  
  /**
   * 볼트 전체 모드 - Obsidian 볼트 내의 모든 노트 파일을 카드로 표시
   */
  VAULT = 'VAULT',
  
  /**
   * 검색 결과 모드 - 검색 쿼리에 일치하는 노트 파일들만 카드로 표시
   */
  SEARCH_RESULTS = 'SEARCH_RESULTS',
  
  /**
   * 태그 모드 - 특정 태그가 포함된 노트만 표시
   */
  TAG = 'TAG',
  
  /**
   * 사용자 정의 모드 - 사용자가 직접 정의한 카드셋 표시 방식
   */
  CUSTOM = 'CUSTOM'
}

/**
 * 카드셋 인터페이스
 */
export interface ICardSet {
  /**
   * 카드셋 ID
   */
  id: string;
  
  /**
   * 카드셋 모드
   */
  mode: CardSetMode;
  
  /**
   * 카드셋에 포함된 파일 목록
   */
  files: TFile[];
  
  /**
   * 카드셋 소스 (폴더 경로 또는 검색어)
   */
  source: string | null;
  
  /**
   * 마지막 업데이트 시간
   */
  lastUpdated: number;
}

/**
 * 카드셋 이벤트 타입
 */
export type CardSetEvent = 
  | 'cardset-loaded'
  | 'cardset-refreshed'
  | 'cardset-type-changed'
  | 'cardset-filtered'
  | 'cardset-sorted';

/**
 * 카드셋 이벤트 데이터 인터페이스
 */
export interface CardSetEventData extends IEventData {
  /**
   * 이벤트 타입
   */
  type: CardSetEvent;
  
  /**
   * 카드셋
   */
  cardSet: ICardSet;
  
  /**
   * 이전 카드셋 (변경 이벤트에 사용)
   */
  previousCardSet?: ICardSet;
}

/**
 * 카드셋 이벤트 핸들러 타입
 */
export type CardSetEventHandler = (data: CardSetEventData) => void;

/**
 * 카드 정렬 기준 열거형
 */
export enum CardSortBy {
  FILE_NAME = 'file-name',        // 파일 이름
  CREATED_TIME = 'created-time',  // 생성 시간
  MODIFIED_TIME = 'modified-time', // 수정 시간
  FILE_SIZE = 'file-size',        // 파일 크기
  CUSTOM_FIELD = 'custom-field'   // 사용자 정의 필드
}

/**
 * 카드 정렬 옵션 인터페이스
 */
export interface CardSortOption {
  /**
   * 정렬 필드
   */
  field: 'name' | 'path' | 'created' | 'modified' | 'size' | 'custom';
  
  /**
   * 정렬 방향
   */
  direction: 'asc' | 'desc';
  
  /**
   * 사용자 정의 정렬 필드 (field가 'custom'일 때 사용)
   */
  customField?: string;
}

/**
 * 카드 필터 타입
 */
export type CardFilterType = 
  | 'tag'              // 태그 기반 필터링
  | 'folder'           // 폴더 기반 필터링
  | 'frontmatter'      // 프론트매터 기반 필터링
  | 'custom';          // 사용자 정의 필터링

/**
 * 카드 필터 옵션 인터페이스
 */
export interface CardFilterOption {
  /**
   * 필터 타입
   */
  type: CardFilterType;
  
  /**
   * 필터 값
   */
  value: string | string[];
  
  /**
   * 프론트매터 필드 이름
   * type이 'frontmatter'인 경우 사용됩니다.
   */
  field?: string;
}

/**
 * 카드 그룹화 기준 타입
 */
export type CardGroupBy = 
  | 'none'             // 그룹화 없음
  | 'folder'           // 폴더별 그룹화
  | 'tag'              // 태그별 그룹화
  | 'date'             // 날짜별 그룹화
  | 'custom-field';    // 사용자 정의 필드별 그룹화

/**
 * 카드 그룹화 옵션 인터페이스
 */
export interface CardGroupOption {
  /**
   * 그룹화 기준
   */
  by: CardGroupBy;
  
  /**
   * 사용자 정의 필드 이름
   * by가 'custom-field'인 경우 사용됩니다.
   */
  customField?: string;
  
  /**
   * 날짜 형식
   * by가 'date'인 경우 사용됩니다.
   * 'year', 'month', 'day' 등
   */
  dateFormat?: string;
}

/**
 * 카드셋 옵션 인터페이스
 */
export interface CardSetOptions {
  /**
   * 카드셋 모드
   */
  mode: CardSetMode;
  
  /**
   * 선택된 폴더 경로
   * mode가 'selected-folder'인 경우 사용됩니다.
   */
  selectedFolderPath?: string;
  
  /**
   * 검색 쿼리
   * mode가 'search-results'인 경우 사용됩니다.
   */
  searchQuery?: string;
  
  /**
   * 정렬 옵션
   */
  sortOption: CardSortOption;
  
  /**
   * 필터 옵션 배열
   */
  filterOptions: CardFilterOption[];
  
  /**
   * 그룹화 옵션
   */
  groupOption: CardGroupOption;
  
  /**
   * 하위 폴더 포함 여부
   */
  includeSubfolders?: boolean;
  
  /**
   * 숨김 파일 포함 여부
   */
  showHiddenFiles?: boolean;
  
  /**
   * 최대 카드 수
   */
  maxCards?: number;
  
  autoRefresh: boolean;
}

/**
 * 카드셋 제공자 타입
 * @deprecated ICardSetProvider 인터페이스를 사용하세요.
 */
export type CardSetProvider = ICardSetProvider; 