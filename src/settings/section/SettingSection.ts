/**
 * 설정 섹션 인터페이스
 * 설정 탭에 표시되는 섹션의 기본 인터페이스입니다.
 */
export interface SettingSection {
  /**
   * 컨테이너 요소
   */
  containerEl: HTMLElement;
  
  /**
   * 섹션 표시
   */
  display(): void;
} 