import { Direction } from './common.types';
import { EventHandler, IEventData } from './common.types';

/**
 * 카드 정렬 방식 열거형
 */
export enum CardAlignment {
  /**
   * 왼쪽 정렬
   */
  LEFT = 'left',
  
  /**
   * 가운데 정렬
   */
  CENTER = 'center',
  
  /**
   * 오른쪽 정렬
   */
  RIGHT = 'right',
  
  /**
   * 양쪽 정렬
   */
  JUSTIFY = 'justify'
}

/**
 * 카드 크기 모드 열거형
 */
export enum CardSizeMode {
  /**
   * 자동 크기 조정
   */
  AUTO = 'auto',
  
  /**
   * 고정 크기
   */
  FIXED = 'fixed',
  
  /**
   * 최소/최대 크기 제한
   */
  CONSTRAINED = 'constrained',

  /**
   * 적응형 크기 조정
   * 컨테이너 크기와 콘텐츠에 따라 자동으로 크기가 조정됩니다.
   */
  ADAPTIVE = 'adaptive'
}

/**
 * 카드 위치 인터페이스
 * 카드의 위치 정보를 정의합니다.
 */
export interface ICardPosition {
  /**
   * 카드 ID
   */
  cardId: string;
  
  /**
   * X 좌표
   */
  x: number;
  
  /**
   * Y 좌표
   */
  y: number;
  
  /**
   * 열 인덱스
   */
  column: number;
  
  /**
   * 행 인덱스
   */
  row: number;
  
  /**
   * 너비 (열 수)
   */
  width: number;
  
  /**
   * 높이 (행 수)
   */
  height: number;
}

/**
 * 레이아웃 방향 열거형
 * 레이아웃의 스크롤 방향을 정의합니다.
 */
export enum LayoutDirection {
  /**
   * 수직 방향 (세로 스크롤)
   */
  VERTICAL = 'vertical',
  
  /**
   * 수평 방향 (가로 스크롤)
   */
  HORIZONTAL = 'horizontal'
}

/**
 * 레이아웃 타입 열거형
 * 내부적으로 사용되는 레이아웃 타입을 정의합니다.
 * 사용자 설정과 컨테이너 크기에 따라 자동으로 결정됩니다.
 */
export enum LayoutType {
  /**
   * 메이슨리 레이아웃
   * 다중 열 레이아웃으로, 카드 높이가 콘텐츠에 따라 다양하게 조정됩니다.
   */
  MASONRY = 'masonry',
  
  /**
   * 그리드 레이아웃
   * 다중 열 레이아웃으로, 모든 카드가 동일한 높이를 가집니다.
   */
  GRID = 'grid',
  
  /**
   * 리스트 레이아웃
   * 단일 열 레이아웃으로, 카드 너비가 컨테이너 너비에 맞춰집니다.
   */
  LIST = 'list',
  
  /**
   * 수평 스크롤 레이아웃
   * 카드가 수평으로 배치되고 가로 스크롤로 탐색합니다.
   */
  HORIZONTAL = 'horizontal'
}

/**
 * 레이아웃 설정 인터페이스
 * 레이아웃 구성에 필요한 설정을 정의합니다.
 */
export interface LayoutSettings {
  /**
   * 레이아웃 타입
   */
  type?: LayoutType;
  
  /**
   * 레이아웃 방향
   * vertical: 세로 스크롤, horizontal: 가로 스크롤
   */
  direction?: Direction;
  
  /**
   * 수직 방향 여부
   * true: 수직 방향, false: 수평 방향
   */
  isVertical?: boolean;
  
  /**
   * 카드 너비 임계값 (px)
   * 이 값을 기준으로 열 수가 결정됩니다.
   */
  cardThresholdWidth?: number;
  
  /**
   * 카드 높이 정렬 여부
   * true인 경우 모든 카드의 높이가 동일하게 설정됩니다.
   */
  alignCardHeight?: boolean;
  
  /**
   * 고정 카드 높이 (px)
   * alignCardHeight가 true인 경우 사용됩니다.
   */
  fixedCardHeight?: number;
  
  /**
   * 뷰당 카드 수
   * 뷰포트에 표시할 카드 수를 지정합니다.
   */
  cardsPerView?: number;
  
  /**
   * 카드 간 간격 (px)
   */
  cardGap?: number;
  
  /**
   * 컨테이너 패딩 (px)
   */
  containerPadding?: number;
  
  /**
   * 자동 방향 전환 여부
   * true인 경우 컨테이너 크기에 따라 방향이 자동으로 전환됩니다.
   */
  autoDirection?: boolean;
  
  /**
   * 자동 방향 전환 비율
   * 컨테이너 너비/높이 비율이 이 값보다 크면 수평 방향으로 전환됩니다.
   */
  autoDirectionRatio?: number;
  
  /**
   * 애니메이션 사용 여부
   */
  useAnimation?: boolean;
  
  /**
   * 애니메이션 지속 시간 (ms)
   */
  animationDuration?: number;
  
  /**
   * 애니메이션 이징 함수
   */
  animationEasing?: string;
  
  /**
   * 카드 최소 너비 (px)
   */
  cardMinWidth?: number;
  
  /**
   * 카드 최대 너비 (px)
   */
  cardMaxWidth?: number;
  
  /**
   * 카드 최소 높이 (px)
   */
  cardMinHeight?: number;
  
  /**
   * 카드 최대 높이 (px)
   */
  cardMaxHeight?: number;
  
  /**
   * 카드 높이 (px)
   * 고정 높이를 사용할 때 지정합니다.
   */
  cardHeight?: number;
}

/**
 * 레이아웃 옵션 인터페이스
 * 모든 레이아웃 설정이 필수인 인터페이스입니다.
 */
export interface LayoutOptions extends Required<LayoutSettings> {}

/**
 * 레이아웃 스타일 옵션 인터페이스
 * 레이아웃 스타일 관련 설정을 정의합니다.
 */
export interface LayoutStyleOptions {
  /**
   * 카드 배경색
   */
  cardBackgroundColor?: string;
  
  /**
   * 카드 테두리 색상
   */
  cardBorderColor?: string;
  
  /**
   * 카드 테두리 두께 (px)
   */
  cardBorderWidth?: number;
  
  /**
   * 카드 테두리 반경 (px)
   */
  cardBorderRadius?: number;
  
  /**
   * 카드 그림자 사용 여부
   */
  cardShadow?: boolean;
  
  /**
   * 카드 그림자 색상
   */
  cardShadowColor?: string;
  
  /**
   * 카드 그림자 크기 (px)
   */
  cardShadowSize?: number;
  
  /**
   * 카드 패딩 (px)
   */
  cardPadding?: number;
  
  /**
   * 카드 호버 효과 사용 여부
   */
  cardHoverEffect?: boolean;
  
  /**
   * 카드 호버 시 스케일
   */
  cardHoverScale?: number;
  
  /**
   * 카드 호버 시 그림자 크기 (px)
   */
  cardHoverShadowSize?: number;
}

/**
 * 레이아웃 계산 결과 인터페이스
 * 레이아웃 계산 결과를 정의합니다.
 */
export interface LayoutCalculationResult {
  /**
   * 열 수
   */
  columns: number;
  
  /**
   * 행 수
   */
  rows: number;
  
  /**
   * 카드 너비
   */
  cardWidth: number;
  
  /**
   * 카드 높이
   */
  cardHeight: number;
  
  /**
   * 컨테이너 너비
   */
  containerWidth: number;
  
  /**
   * 컨테이너 높이
   */
  containerHeight: number;
  
  /**
   * 레이아웃 방향
   */
  direction: Direction;
  
  /**
   * 수직 방향 여부
   * true: 수직 방향, false: 수평 방향
   */
  isVertical: boolean;
  
  /**
   * 카드 위치 배열
   */
  cardPositions: ICardPosition[];
  
  /**
   * 컨텐츠 전체 높이
   */
  contentHeight: number;
  
  /**
   * 컨텐츠 전체 너비
   */
  contentWidth: number;
}

/**
 * 레이아웃 이벤트 타입 열거형
 * 레이아웃 관련 이벤트 유형을 정의합니다.
 */
export enum LayoutEventType {
  /** 레이아웃 초기화 완료 */
  INITIALIZED = 'layout:initialized',
  /** 레이아웃 업데이트 시작 */
  UPDATE_START = 'layout:update:start',
  /** 레이아웃 업데이트 완료 */
  UPDATE_COMPLETE = 'layout:update:complete',
  /** 레이아웃 계산 완료 */
  CALCULATION_COMPLETE = 'layout:calculation:complete',
  /** 레이아웃 방향 변경 */
  DIRECTION_CHANGE = 'layout:direction:change',
  /** 레이아웃 크기 변경 */
  RESIZE = 'layout:resize',
  /** 레이아웃 스타일 변경 */
  STYLE_CHANGE = 'layout:style:change',
  /** 레이아웃 옵션 변경 */
  OPTIONS_CHANGE = 'layout:options:change'
}

/**
 * 레이아웃 이벤트 데이터 인터페이스
 */
export interface LayoutEventData {
  /**
   * 이벤트 타입
   */
  type: LayoutEventType;
  
  /**
   * 타임스탬프
   */
  timestamp?: number;
  
  /**
   * 레이아웃 옵션
   */
  options?: LayoutOptions;
  
  /**
   * 레이아웃 방향
   */
  direction?: LayoutDirection;
  
  /**
   * 레이아웃 계산 결과
   */
  calculationResult?: LayoutCalculationResult;
}

/**
 * 레이아웃 이벤트 인터페이스
 * 레이아웃 관련 이벤트를 정의합니다.
 */
export interface LayoutEvent extends IEventData {
  /**
   * 이벤트 타입
   */
  type: LayoutEventType;
  
  /**
   * 이벤트 데이터
   */
  data?: LayoutEventData;
}

/**
 * 레이아웃 이벤트 핸들러 타입
 * 레이아웃 이벤트 처리 함수의 타입을 정의합니다.
 */
export type LayoutEventHandler = EventHandler<LayoutEvent>; 