/**
 * 팝업 컴포넌트 인터페이스
 */
export interface IPopupComponent {
  /**
   * 팝업 ID
   */
  popupId: string;
  
  /**
   * 팝업 내용 생성
   * @returns 팝업 내용 HTML
   */
  generateContent(): string;
  
  /**
   * 팝업 이벤트 리스너 등록
   * @param popupElement 팝업 요소
   */
  registerPopupEventListeners(popupElement: HTMLElement): void;
  
  /**
   * 팝업 이벤트 리스너 제거
   * @param popupElement 팝업 요소
   */
  removePopupEventListeners(popupElement: HTMLElement): void;
  
  /**
   * 팝업 ID 가져오기
   * @returns 팝업 ID
   */
  getPopupId(): string;
  
  /**
   * 팝업 제목 가져오기
   * @returns 팝업 제목
   */
  getPopupTitle(): string;
  
  /**
   * 현재 팝업 요소 설정
   * @param popupElement 팝업 요소
   */
  setCurrentPopupElement(popupElement: HTMLElement): void;
}
