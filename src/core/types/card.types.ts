import { TFile } from 'obsidian';
import { ThemeMode, IEventData } from './common.types';
import { ICardPosition } from './layout.types';

// Card 클래스 타입 참조를 위한 전방 선언
import { Card } from '../models/Card';

/**
 * 카드 렌더링 옵션 인터페이스
 * 카드 렌더링에 필요한 옵션을 정의합니다.
 */
export interface CardRenderOptions {
  /**
   * 파일명 표시 여부
   */
  showFileName: boolean;
  
  /**
   * 첫 번째 헤더 표시 여부
   */
  showFirstHeader: boolean;
  
  /**
   * 본문 내용 표시 여부
   */
  showContent: boolean;
  
  /**
   * 본문 내용 최대 길이
   */
  contentMaxLength: number;
  
  /**
   * 태그 표시 여부
   */
  showTags: boolean;
  
  /**
   * 생성 날짜 표시 여부
   */
  showCreationDate: boolean;
  
  /**
   * 수정 날짜 표시 여부
   */
  showModificationDate: boolean;
  
  /**
   * 파일명 글꼴 크기
   */
  fileNameFontSize: number;
  
  /**
   * 본문 글꼴 크기
   */
  bodyFontSize: number;
  
  /**
   * 태그 글꼴 크기
   */
  tagsFontSize: number;
  
  /**
   * 마크다운 렌더링 여부
   */
  renderMarkdown: boolean;
  
  /**
   * 코드 블록 하이라이팅 여부
   */
  highlightCodeBlocks: boolean;
  
  /**
   * 수학 수식 렌더링 여부
   */
  renderMathEquations: boolean;
  
  /**
   * 이미지 표시 여부
   */
  showImages: boolean;
  
  /**
   * 태그 모드
   */
  themeMode: ThemeMode;
}

/**
 * 카드 데이터 인터페이스
 * 카드의 기본 데이터 구조를 정의합니다.
 */
export interface CardData {
  /**
   * 고유 식별자
   */
  id: string;
  
  /**
   * 파일 객체
   */
  file: TFile;
  
  /**
   * 파일 경로
   */
  path: string;
  
  /**
   * 파일명
   */
  filename: string;
  
  /**
   * 첫 번째 헤더
   */
  firstHeader?: string;
  
  /**
   * 본문 내용
   */
  content?: string;
  
  /**
   * 태그 배열
   */
  tags: string[];
  
  /**
   * 생성 날짜
   */
  creationDate: number;
  
  /**
   * 수정 날짜
   */
  modificationDate: number;
  
  /**
   * 파일 크기
   */
  fileSize: number;
  
  /**
   * 카드 위치
   */
  position?: ICardPosition;
}

/**
 * 카드 상태 열거형
 * 카드의 상태를 정의합니다.
 */
export enum CardStateEnum {
  /**
   * 일반 상태
   */
  NORMAL = 'normal',
  
  /**
   * 호버 상태
   */
  HOVER = 'hover',
  
  /**
   * 선택된 상태
   */
  SELECTED = 'selected',
  
  /**
   * 드래그 중인 상태
   */
  DRAGGING = 'dragging',
  
  /**
   * 편집 중인 상태
   */
  EDITING = 'editing'
}

/**
 * 카드 상태 타입
 * @deprecated CardStateEnum을 사용하세요.
 */
export type CardState = 'normal' | 'hover' | 'selected' | 'dragging' | 'editing';

/**
 * 카드 이벤트 타입 열거형
 * 카드와 관련된 이벤트 유형을 정의합니다.
 */
export enum CardEventType {
  CLICK = 'card:click',
  CONTEXT_MENU = 'card:contextmenu',
  DRAG_START = 'card:dragstart',
  DRAG_END = 'card:dragend',
  HOVER = 'card:hover',
  LEAVE = 'card:leave',
  SELECTION_CHANGE = 'card:selectionchange',
  CONTENT_UPDATE = 'card:contentupdate',
  STYLE_UPDATE = 'card:styleupdate'
}

/**
 * 카드 이벤트 데이터 인터페이스
 * 카드 이벤트 발생 시 전달되는 데이터 구조를 정의합니다.
 */
export interface CardEventData extends IEventData {
  /** 이벤트 타입 */
  type: CardEventType;
  /** 이벤트와 관련된 카드 */
  card: Card;
  /** 원본 DOM 이벤트 (있는 경우) */
  originalEvent?: Event;
  /** 추가 데이터 (이벤트 타입에 따라 다름) */
  data?: any;
  /** 이벤트 발생 시간 */
  timestamp: number;
}

/**
 * 카드 컨테이너 이벤트 타입
 * 카드 컨테이너 관련 이벤트 타입을 정의합니다.
 */
export type CardContainerEventType = 
  | 'card-added'
  | 'card-removed'
  | 'cards-set'
  | 'card-selected'
  | 'card-deselected'
  | 'selection-cleared'
  | 'layout-updated'
  | 'card-moved';

/**
 * 카드 컨테이너 이벤트 데이터 인터페이스
 * 카드 컨테이너 이벤트 데이터를 정의합니다.
 */
export interface CardContainerEventData extends IEventData {
  /**
   * 이벤트 타입
   */
  type: CardContainerEventType;
  
  /**
   * 카드 ID
   */
  cardId?: string;
  
  /**
   * 카드 객체
   */
  card?: any; // Card 타입으로 변경 필요 (순환 참조 방지를 위해 any 사용)
  
  /**
   * 카드 수
   */
  cardCount?: number;
  
  /**
   * 카드 위치
   */
  position?: ICardPosition;
}

/**
 * 이벤트 핸들러 타입
 * 이벤트 발생 시 호출되는 콜백 함수의 타입을 정의합니다.
 */
export type CardEventHandler<T> = (data: T) => void; 