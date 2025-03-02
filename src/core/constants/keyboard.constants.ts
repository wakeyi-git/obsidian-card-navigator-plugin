/**
 * 키보드 단축키 관련 상수
 * 
 * 이 파일은 키보드 단축키와 관련된 모든 상수를 정의합니다.
 * 단축키 정의, 기본값, 모드 등을 포함합니다.
 */

/**
 * 단축키 모드 열거형
 */
export enum KeyboardMode {
  GLOBAL = 'global',         // 전역 단축키 (어디서나 작동)
  VIEW = 'view',             // 뷰 내부 단축키 (Card Navigator 뷰가 활성화되었을 때만 작동)
  CARD = 'card',             // 카드 단축키 (카드가 선택되었을 때만 작동)
  SEARCH = 'search',         // 검색 단축키 (검색 입력 필드가 포커스되었을 때만 작동)
}

/**
 * 단축키 액션 열거형
 */
export enum KeyboardAction {
  // 전역 액션
  TOGGLE_VIEW = 'toggleView',                // 뷰 토글
  OPEN_CURRENT_NOTE = 'openCurrentNote',     // 현재 노트 열기
  QUICK_SEARCH = 'quickSearch',              // 빠른 검색
  CYCLE_PRESETS = 'cyclePresets',            // 프리셋 순환
  
  // 뷰 액션
  NAVIGATE_UP = 'navigateUp',                // 위로 이동
  NAVIGATE_DOWN = 'navigateDown',            // 아래로 이동
  NAVIGATE_LEFT = 'navigateLeft',            // 왼쪽으로 이동
  NAVIGATE_RIGHT = 'navigateRight',          // 오른쪽으로 이동
  NAVIGATE_START = 'navigateStart',          // 처음으로 이동
  NAVIGATE_END = 'navigateEnd',              // 끝으로 이동
  NAVIGATE_PAGE_UP = 'navigatePageUp',       // 페이지 위로 이동
  NAVIGATE_PAGE_DOWN = 'navigatePageDown',   // 페이지 아래로 이동
  SELECT_CARD = 'selectCard',                // 카드 선택
  SELECT_MULTIPLE = 'selectMultiple',        // 다중 선택
  SELECT_ALL = 'selectAll',                  // 모두 선택
  DESELECT_ALL = 'deselectAll',              // 모두 선택 해제
  TOGGLE_SEARCH = 'toggleSearch',            // 검색 토글
  TOGGLE_SORT = 'toggleSort',                // 정렬 토글
  TOGGLE_FILTER = 'toggleFilter',            // 필터 토글
  TOGGLE_VIEW_MODE = 'toggleViewMode',       // 뷰 모드 토글
  TOGGLE_CARDSET_MODE = 'toggleCardsetMode', // 카드셋 모드 토글
  REFRESH_VIEW = 'refreshView',              // 뷰 새로고침
  SHOW_HELP = 'showHelp',                    // 도움말 표시
  
  // 카드 액션
  OPEN_CARD = 'openCard',                    // 카드 열기
  EDIT_CARD = 'editCard',                    // 카드 편집
  DELETE_CARD = 'deleteCard',                // 카드 삭제
  DUPLICATE_CARD = 'duplicateCard',          // 카드 복제
  COPY_CARD_LINK = 'copyCardLink',           // 카드 링크 복사
  PIN_CARD = 'pinCard',                      // 카드 고정
  TAG_CARD = 'tagCard',                      // 카드 태그 지정
  EXPAND_CARD = 'expandCard',                // 카드 확장
  COLLAPSE_CARD = 'collapseCard',            // 카드 축소
  
  // 검색 액션
  SEARCH_FOCUS = 'searchFocus',              // 검색 포커스
  SEARCH_CLEAR = 'searchClear',              // 검색 지우기
  SEARCH_SUBMIT = 'searchSubmit',            // 검색 제출
  SEARCH_NEXT_RESULT = 'searchNextResult',   // 다음 검색 결과
  SEARCH_PREV_RESULT = 'searchPrevResult',   // 이전 검색 결과
  SEARCH_NEXT_SUGGESTION = 'searchNextSuggestion', // 다음 검색 제안
  SEARCH_PREV_SUGGESTION = 'searchPrevSuggestion', // 이전 검색 제안
  SEARCH_SELECT_SUGGESTION = 'searchSelectSuggestion', // 검색 제안 선택
}

/**
 * 단축키 정의 인터페이스
 */
export interface KeyboardShortcut {
  action: KeyboardAction;    // 액션
  mode: KeyboardMode;        // 모드
  defaultKeys: string;       // 기본 키 조합
  description: string;       // 설명
  isEnabled: boolean;        // 활성화 여부
}

/**
 * 기본 단축키 정의
 */
export const DEFAULT_KEYBOARD_SHORTCUTS: KeyboardShortcut[] = [
  // 전역 단축키
  {
    action: KeyboardAction.TOGGLE_VIEW,
    mode: KeyboardMode.GLOBAL,
    defaultKeys: 'mod+shift+c',
    description: '카드 네비게이터 뷰 토글',
    isEnabled: true,
  },
  {
    action: KeyboardAction.OPEN_CURRENT_NOTE,
    mode: KeyboardMode.GLOBAL,
    defaultKeys: 'mod+shift+o',
    description: '현재 노트를 카드로 열기',
    isEnabled: true,
  },
  {
    action: KeyboardAction.QUICK_SEARCH,
    mode: KeyboardMode.GLOBAL,
    defaultKeys: 'mod+shift+f',
    description: '카드 네비게이터에서 빠른 검색',
    isEnabled: true,
  },
  {
    action: KeyboardAction.CYCLE_PRESETS,
    mode: KeyboardMode.GLOBAL,
    defaultKeys: 'mod+shift+p',
    description: '프리셋 순환',
    isEnabled: true,
  },
  
  // 뷰 단축키
  {
    action: KeyboardAction.NAVIGATE_UP,
    mode: KeyboardMode.VIEW,
    defaultKeys: 'up',
    description: '위로 이동',
    isEnabled: true,
  },
  {
    action: KeyboardAction.NAVIGATE_DOWN,
    mode: KeyboardMode.VIEW,
    defaultKeys: 'down',
    description: '아래로 이동',
    isEnabled: true,
  },
  {
    action: KeyboardAction.NAVIGATE_LEFT,
    mode: KeyboardMode.VIEW,
    defaultKeys: 'left',
    description: '왼쪽으로 이동',
    isEnabled: true,
  },
  {
    action: KeyboardAction.NAVIGATE_RIGHT,
    mode: KeyboardMode.VIEW,
    defaultKeys: 'right',
    description: '오른쪽으로 이동',
    isEnabled: true,
  },
  {
    action: KeyboardAction.NAVIGATE_START,
    mode: KeyboardMode.VIEW,
    defaultKeys: 'home',
    description: '처음으로 이동',
    isEnabled: true,
  },
  {
    action: KeyboardAction.NAVIGATE_END,
    mode: KeyboardMode.VIEW,
    defaultKeys: 'end',
    description: '끝으로 이동',
    isEnabled: true,
  },
  {
    action: KeyboardAction.NAVIGATE_PAGE_UP,
    mode: KeyboardMode.VIEW,
    defaultKeys: 'pageup',
    description: '페이지 위로 이동',
    isEnabled: true,
  },
  {
    action: KeyboardAction.NAVIGATE_PAGE_DOWN,
    mode: KeyboardMode.VIEW,
    defaultKeys: 'pagedown',
    description: '페이지 아래로 이동',
    isEnabled: true,
  },
  {
    action: KeyboardAction.SELECT_CARD,
    mode: KeyboardMode.VIEW,
    defaultKeys: 'enter',
    description: '카드 선택',
    isEnabled: true,
  },
  {
    action: KeyboardAction.SELECT_MULTIPLE,
    mode: KeyboardMode.VIEW,
    defaultKeys: 'shift+click',
    description: '다중 카드 선택',
    isEnabled: true,
  },
  {
    action: KeyboardAction.SELECT_ALL,
    mode: KeyboardMode.VIEW,
    defaultKeys: 'mod+a',
    description: '모든 카드 선택',
    isEnabled: true,
  },
  {
    action: KeyboardAction.DESELECT_ALL,
    mode: KeyboardMode.VIEW,
    defaultKeys: 'escape',
    description: '모든 카드 선택 해제',
    isEnabled: true,
  },
  {
    action: KeyboardAction.TOGGLE_SEARCH,
    mode: KeyboardMode.VIEW,
    defaultKeys: 'mod+f',
    description: '검색 토글',
    isEnabled: true,
  },
  {
    action: KeyboardAction.TOGGLE_SORT,
    mode: KeyboardMode.VIEW,
    defaultKeys: 'mod+s',
    description: '정렬 토글',
    isEnabled: true,
  },
  {
    action: KeyboardAction.TOGGLE_FILTER,
    mode: KeyboardMode.VIEW,
    defaultKeys: 'mod+l',
    description: '필터 토글',
    isEnabled: true,
  },
  {
    action: KeyboardAction.TOGGLE_VIEW_MODE,
    mode: KeyboardMode.VIEW,
    defaultKeys: 'mod+v',
    description: '뷰 모드 토글',
    isEnabled: true,
  },
  {
    action: KeyboardAction.TOGGLE_CARDSET_MODE,
    mode: KeyboardMode.VIEW,
    defaultKeys: 'mod+m',
    description: '카드셋 모드 토글',
    isEnabled: true,
  },
  {
    action: KeyboardAction.REFRESH_VIEW,
    mode: KeyboardMode.VIEW,
    defaultKeys: 'mod+r',
    description: '뷰 새로고침',
    isEnabled: true,
  },
  {
    action: KeyboardAction.SHOW_HELP,
    mode: KeyboardMode.VIEW,
    defaultKeys: 'shift+?',
    description: '키보드 단축키 도움말 표시',
    isEnabled: true,
  },
  
  // 카드 단축키
  {
    action: KeyboardAction.OPEN_CARD,
    mode: KeyboardMode.CARD,
    defaultKeys: 'enter',
    description: '카드 열기',
    isEnabled: true,
  },
  {
    action: KeyboardAction.EDIT_CARD,
    mode: KeyboardMode.CARD,
    defaultKeys: 'e',
    description: '카드 편집',
    isEnabled: true,
  },
  {
    action: KeyboardAction.DELETE_CARD,
    mode: KeyboardMode.CARD,
    defaultKeys: 'delete',
    description: '카드 삭제',
    isEnabled: true,
  },
  {
    action: KeyboardAction.DUPLICATE_CARD,
    mode: KeyboardMode.CARD,
    defaultKeys: 'd',
    description: '카드 복제',
    isEnabled: true,
  },
  {
    action: KeyboardAction.COPY_CARD_LINK,
    mode: KeyboardMode.CARD,
    defaultKeys: 'c',
    description: '카드 링크 복사',
    isEnabled: true,
  },
  {
    action: KeyboardAction.PIN_CARD,
    mode: KeyboardMode.CARD,
    defaultKeys: 'p',
    description: '카드 고정/고정 해제',
    isEnabled: true,
  },
  {
    action: KeyboardAction.TAG_CARD,
    mode: KeyboardMode.CARD,
    defaultKeys: 't',
    description: '카드 태그 지정',
    isEnabled: true,
  },
  {
    action: KeyboardAction.EXPAND_CARD,
    mode: KeyboardMode.CARD,
    defaultKeys: '+',
    description: '카드 확장',
    isEnabled: true,
  },
  {
    action: KeyboardAction.COLLAPSE_CARD,
    mode: KeyboardMode.CARD,
    defaultKeys: '-',
    description: '카드 축소',
    isEnabled: true,
  },
  
  // 검색 단축키
  {
    action: KeyboardAction.SEARCH_FOCUS,
    mode: KeyboardMode.SEARCH,
    defaultKeys: 'mod+f',
    description: '검색 입력 필드 포커스',
    isEnabled: true,
  },
  {
    action: KeyboardAction.SEARCH_CLEAR,
    mode: KeyboardMode.SEARCH,
    defaultKeys: 'escape',
    description: '검색어 지우기',
    isEnabled: true,
  },
  {
    action: KeyboardAction.SEARCH_SUBMIT,
    mode: KeyboardMode.SEARCH,
    defaultKeys: 'enter',
    description: '검색 실행',
    isEnabled: true,
  },
  {
    action: KeyboardAction.SEARCH_NEXT_RESULT,
    mode: KeyboardMode.SEARCH,
    defaultKeys: 'enter',
    description: '다음 검색 결과로 이동',
    isEnabled: true,
  },
  {
    action: KeyboardAction.SEARCH_PREV_RESULT,
    mode: KeyboardMode.SEARCH,
    defaultKeys: 'shift+enter',
    description: '이전 검색 결과로 이동',
    isEnabled: true,
  },
  {
    action: KeyboardAction.SEARCH_NEXT_SUGGESTION,
    mode: KeyboardMode.SEARCH,
    defaultKeys: 'down',
    description: '다음 검색 제안으로 이동',
    isEnabled: true,
  },
  {
    action: KeyboardAction.SEARCH_PREV_SUGGESTION,
    mode: KeyboardMode.SEARCH,
    defaultKeys: 'up',
    description: '이전 검색 제안으로 이동',
    isEnabled: true,
  },
  {
    action: KeyboardAction.SEARCH_SELECT_SUGGESTION,
    mode: KeyboardMode.SEARCH,
    defaultKeys: 'tab',
    description: '검색 제안 선택',
    isEnabled: true,
  },
];

/**
 * 키보드 단축키 그룹
 */
export const KEYBOARD_SHORTCUT_GROUPS = {
  GLOBAL: '전역 단축키',
  VIEW: '뷰 단축키',
  CARD: '카드 단축키',
  SEARCH: '검색 단축키',
};

/**
 * 키보드 단축키 도움말 관련 상수
 */
export const KEYBOARD_HELP = {
  MODAL_TITLE: '카드 네비게이터 키보드 단축키',
  MODAL_DESCRIPTION: '다음 키보드 단축키를 사용하여 카드 네비게이터를 더 효율적으로 사용할 수 있습니다.',
  CLOSE_BUTTON: '닫기',
  RESET_BUTTON: '기본값으로 재설정',
  CUSTOMIZE_BUTTON: '단축키 사용자 정의',
};

/**
 * 키보드 이벤트 관련 상수
 */
export const KEYBOARD_EVENTS = {
  // 키보드 이벤트 유형
  KEY_DOWN: 'keydown',
  KEY_UP: 'keyup',
  KEY_PRESS: 'keypress',
  
  // 키보드 이벤트 수정자
  MODIFIERS: ['ctrl', 'alt', 'shift', 'meta'],
  
  // 플랫폼별 수정자 키
  PLATFORM_MODIFIERS: {
    MAC: {
      MOD: 'meta',
      ALT: 'alt',
      SHIFT: 'shift',
      CTRL: 'ctrl',
    },
    WINDOWS: {
      MOD: 'ctrl',
      ALT: 'alt',
      SHIFT: 'shift',
      META: 'meta',
    },
    LINUX: {
      MOD: 'ctrl',
      ALT: 'alt',
      SHIFT: 'shift',
      META: 'meta',
    },
  },
  
  // 특수 키 코드
  SPECIAL_KEYS: {
    ENTER: 'Enter',
    ESCAPE: 'Escape',
    SPACE: ' ',
    ARROW_UP: 'ArrowUp',
    ARROW_DOWN: 'ArrowDown',
    ARROW_LEFT: 'ArrowLeft',
    ARROW_RIGHT: 'ArrowRight',
    TAB: 'Tab',
    HOME: 'Home',
    END: 'End',
    PAGE_UP: 'PageUp',
    PAGE_DOWN: 'PageDown',
    DELETE: 'Delete',
    BACKSPACE: 'Backspace',
  },
}; 