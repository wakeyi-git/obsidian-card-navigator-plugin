/**
 * 프리셋 타입 정의
 */

import { 
  CardContentSettings as GlobalCardContentSettings, 
  CardStyleSettings as GlobalCardStyleSettings, 
  CardLayoutSettings, 
  CardSetSettings as GlobalCardSetSettings,
  PresetManagerSettings
} from './settings.types';

/**
 * 폴더-프리셋 매핑 타입
 * 키: 폴더 경로, 값: 프리셋 ID
 */
export type FolderPresetMapping = Record<string, string>;

/**
 * 프리셋 인터페이스
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
   * 생성 날짜
   */
  createdAt: number;
  
  /**
   * 수정 날짜
   */
  updatedAt: number;
  
  /**
   * 프리셋 설정
   */
  settings: PresetSettings;
}

// 기존 PresetData 인터페이스를 위한 타입 별칭 (하위 호환성 유지)
export type PresetData = IPreset;

/**
 * 프리셋 설정 타입
 */
export interface PresetSettings {
  /**
   * 카드 내용 설정
   */
  cardContent?: GlobalCardContentSettings;
  
  /**
   * 카드 스타일 설정
   */
  cardStyle?: GlobalCardStyleSettings;
  
  /**
   * 레이아웃 설정
   */
  layout?: CardLayoutSettings;
  
  /**
   * 정렬 설정
   */
  sort?: SortSettings;
  
  /**
   * 필터 설정
   */
  filter?: FilterSettings;
  
  /**
   * 카드셋 설정
   */
  cardSet?: GlobalCardSetSettings;
}

/**
 * 카드 내용 설정 타입
 */
export interface CardContentSettings {
  /**
   * 파일명 표시 여부
   */
  showFilename?: boolean;
  
  /**
   * 첫 번째 헤더 표시 여부
   */
  showFirstHeader?: boolean;
  
  /**
   * 본문 내용 표시 여부
   */
  showContent?: boolean;
  
  /**
   * 본문 내용 최대 길이
   */
  contentMaxLength?: number;
  
  /**
   * 태그 표시 여부
   */
  showTags?: boolean;
  
  /**
   * 생성 날짜 표시 여부
   */
  showCreationDate?: boolean;
  
  /**
   * 수정 날짜 표시 여부
   */
  showModificationDate?: boolean;
  
  /**
   * 마크다운 렌더링 여부
   */
  renderMarkdown?: boolean;
  
  /**
   * 코드 블록 하이라이팅 여부
   */
  highlightCodeBlocks?: boolean;
  
  /**
   * 수학 수식 렌더링 여부
   */
  renderMathEquations?: boolean;
  
  /**
   * 이미지 표시 여부
   */
  showImages?: boolean;
}

/**
 * 카드 스타일 설정 타입
 */
export interface CardStyleSettings {
  /**
   * 제목 글꼴 크기
   */
  titleFontSize?: string;
  
  /**
   * 본문 글꼴 크기
   */
  contentFontSize?: string;
  
  /**
   * 태그 글꼴 크기
   */
  tagFontSize?: string;
  
  /**
   * 카드 패딩
   */
  cardPadding?: string;
  
  /**
   * 카드 테두리 두께
   */
  cardBorderWidth?: string;
  
  /**
   * 카드 테두리 색상
   */
  cardBorderColor?: string;
  
  /**
   * 카드 테두리 모서리 둥글기
   */
  cardBorderRadius?: string;
  
  /**
   * 카드 그림자 활성화 여부
   */
  enableCardShadow?: boolean;
  
  /**
   * 카드 그림자 강도
   */
  cardShadowIntensity?: number;
  
  /**
   * 카드 배경색
   */
  cardBackgroundColor?: string;
  
  /**
   * 태그 기반 자동 색상 지정 여부
   */
  enableTagBasedColors?: boolean;
}

/**
 * 레이아웃 설정 타입
 */
export interface LayoutSettings {
  /**
   * 카드 너비 임계값
   */
  cardThresholdWidth?: number;
  
  /**
   * 카드 높이 정렬 여부
   */
  alignCardHeight?: boolean;
  
  /**
   * 고정 카드 높이
   */
  fixedCardHeight?: number;
  
  /**
   * 뷰당 카드 수
   */
  cardsPerView?: number;
  
  /**
   * 수직 방향 여부
   */
  isVertical?: boolean;
  
  /**
   * 카드 간 간격
   */
  cardGap?: number;
}

/**
 * 정렬 설정 타입
 */
export interface SortSettings {
  /**
   * 정렬 기준
   */
  sortBy?: 'filename' | 'creationDate' | 'modificationDate' | 'fileSize' | 'custom';
  
  /**
   * 정렬 방향
   */
  sortDirection?: 'asc' | 'desc';
  
  /**
   * 사용자 정의 정렬 필드
   */
  customSortField?: string;
}

/**
 * 필터 설정 타입
 */
export interface FilterSettings {
  /**
   * 태그 필터
   */
  tagFilter?: string[];
  
  /**
   * 폴더 필터
   */
  folderFilter?: string[];
  
  /**
   * YAML 프론트매터 필터
   */
  frontmatterFilter?: {
    key: string;
    value: string;
  }[];
}

/**
 * 카드셋 설정 타입
 */
export interface CardSetSettings {
  /**
   * 카드셋 모드
   */
  mode?: 'activeFolder' | 'selectedFolder' | 'vault' | 'searchResult';
  
  /**
   * 선택된 폴더 경로 (selectedFolder 모드에서 사용)
   */
  selectedFolderPath?: string;
  
  /**
   * 그룹화 옵션
   */
  groupBy?: 'folder' | 'tag' | 'date' | 'none';
}

/**
 * 폴더별 프리셋 맵
 */
export interface FolderPresetMap {
  /**
   * 폴더 경로를 키로 하고 프리셋 이름을 값으로 하는 맵
   */
  [folderPath: string]: string;
}

/**
 * 프리셋 이벤트 타입
 */
export type PresetEvent = 
  | 'preset-created'
  | 'preset-updated'
  | 'preset-deleted'
  | 'preset-applied'
  | 'preset-imported'
  | 'preset-exported';

/**
 * 프리셋 이벤트 데이터
 */
export interface PresetEventData {
  /**
   * 프리셋 이름
   */
  presetName: string;
  
  /**
   * 이벤트 관련 추가 데이터
   */
  data?: any;
}

/**
 * 프리셋 이벤트 핸들러
 */
export type PresetEventHandler = (data: PresetEventData) => void;

/**
 * 프리셋 내보내기 데이터
 */
export interface PresetExportData {
  /**
   * 내보내기 버전
   */
  version: string;
  
  /**
   * 프리셋 배열
   */
  presets: PresetData[];
}

/**
 * 프리셋 관리 옵션
 * @see PresetManagerSettings
 */
export type PresetManagementOptions = PresetManagerSettings; 