import { TFile, Component } from 'obsidian';
import { CardRenderOptions } from '../../../core/types/card.types';

/**
 * 카드 헤더 컴포넌트 클래스
 * 카드의 헤더 부분을 생성하고 관리합니다.
 */
export class CardHeader extends Component {
  /**
   * 헤더 요소
   */
  private element: HTMLElement;
  
  /**
   * 제목 요소
   */
  private titleElement: HTMLElement;
  
  /**
   * 파일 객체
   */
  private file: TFile;
  
  /**
   * 첫 번째 헤더 텍스트
   */
  private firstHeader: string | null;
  
  /**
   * 렌더링 옵션
   */
  private renderOptions: CardRenderOptions;
  
  /**
   * 카드 헤더 컴포넌트 생성자
   * @param file 파일 객체
   * @param firstHeader 첫 번째 헤더 텍스트
   * @param renderOptions 렌더링 옵션
   */
  constructor(file: TFile, firstHeader: string | null, renderOptions: CardRenderOptions) {
    super();
    this.file = file;
    this.firstHeader = firstHeader;
    this.renderOptions = renderOptions;
    
    this.element = this.createHeaderElement();
    this.titleElement = this.createTitleElement();
    
    this.element.appendChild(this.titleElement);
    
    // 추가 헤더 요소가 필요한 경우 여기에 추가
    if (this.renderOptions.showCreationDate || this.renderOptions.showModificationDate) {
      const dateElement = this.createDateElement();
      this.element.appendChild(dateElement);
    }
  }
  
  /**
   * 헤더 요소 가져오기
   * @returns 헤더 HTML 요소
   */
  getElement(): HTMLElement {
    return this.element;
  }
  
  /**
   * 제목 텍스트 업데이트
   * @param newTitle 새 제목 텍스트
   */
  updateTitle(newTitle: string): void {
    this.titleElement.textContent = newTitle;
  }
  
  /**
   * 첫 번째 헤더 업데이트
   * @param newHeader 새 헤더 텍스트
   */
  updateFirstHeader(newHeader: string | null): void {
    this.firstHeader = newHeader;
    
    // 제목 업데이트
    if (this.renderOptions.showFirstHeader && this.firstHeader) {
      this.titleElement.textContent = this.firstHeader;
    } else {
      this.titleElement.textContent = this.file.basename;
    }
  }
  
  /**
   * 파일 업데이트
   * @param newFile 새 파일 객체
   */
  updateFile(newFile: TFile): void {
    this.file = newFile;
    
    // 제목 업데이트
    if (!this.renderOptions.showFirstHeader || !this.firstHeader) {
      this.titleElement.textContent = this.file.basename;
    }
    
    // 날짜 정보 업데이트
    if (this.renderOptions.showCreationDate || this.renderOptions.showModificationDate) {
      const dateElement = this.element.querySelector('.card-date');
      if (dateElement) {
        dateElement.remove();
      }
      
      const newDateElement = this.createDateElement();
      this.element.appendChild(newDateElement);
    }
  }
  
  /**
   * 렌더링 옵션 업데이트
   * @param newOptions 새 렌더링 옵션
   */
  updateRenderOptions(newOptions: CardRenderOptions): void {
    this.renderOptions = newOptions;
    
    // 제목 폰트 크기 업데이트
    this.titleElement.style.fontSize = `${this.renderOptions.titleFontSize}px`;
    
    // 제목 내용 업데이트
    if (this.renderOptions.showFirstHeader && this.firstHeader) {
      this.titleElement.textContent = this.firstHeader;
    } else {
      this.titleElement.textContent = this.file.basename;
    }
    
    // 날짜 표시 업데이트
    const dateElement = this.element.querySelector('.card-date');
    if (this.renderOptions.showCreationDate || this.renderOptions.showModificationDate) {
      if (!dateElement) {
        const newDateElement = this.createDateElement();
        this.element.appendChild(newDateElement);
      } else {
        dateElement.remove();
        const newDateElement = this.createDateElement();
        this.element.appendChild(newDateElement);
      }
    } else if (dateElement) {
      dateElement.remove();
    }
  }
  
  /**
   * 헤더 요소 생성
   * @returns 헤더 HTML 요소
   */
  private createHeaderElement(): HTMLElement {
    const header = document.createElement('div');
    header.className = 'card-header';
    
    return header;
  }
  
  /**
   * 제목 요소 생성
   * @returns 제목 HTML 요소
   */
  private createTitleElement(): HTMLElement {
    const title = document.createElement('div');
    title.className = 'card-title';
    
    // 제목 폰트 크기 설정
    title.style.fontSize = `${this.renderOptions.titleFontSize}px`;
    
    // 파일명 또는 첫 번째 헤더 표시
    if (this.renderOptions.showFirstHeader && this.firstHeader) {
      title.textContent = this.firstHeader;
    } else {
      title.textContent = this.file.basename;
    }
    
    // 제목 말줄임 설정
    title.style.overflow = 'hidden';
    title.style.textOverflow = 'ellipsis';
    title.style.whiteSpace = 'nowrap';
    
    return title;
  }
  
  /**
   * 날짜 요소 생성
   * @returns 날짜 HTML 요소
   */
  private createDateElement(): HTMLElement {
    const dateContainer = document.createElement('div');
    dateContainer.className = 'card-date';
    
    // 날짜 폰트 크기 설정 (제목보다 작게)
    dateContainer.style.fontSize = `${Math.max(10, this.renderOptions.titleFontSize - 2)}px`;
    
    // 생성 날짜 표시
    if (this.renderOptions.showCreationDate) {
      const createdDate = document.createElement('span');
      createdDate.className = 'card-created-date';
      
      // 파일 생성 시간을 가져와 포맷팅
      const created = this.file.stat.ctime;
      const createdStr = this.formatDate(created);
      
      createdDate.textContent = `생성: ${createdStr}`;
      dateContainer.appendChild(createdDate);
    }
    
    // 생성 날짜와 수정 날짜 모두 표시하는 경우 구분자 추가
    if (this.renderOptions.showCreationDate && this.renderOptions.showModificationDate) {
      const separator = document.createElement('span');
      separator.textContent = ' | ';
      dateContainer.appendChild(separator);
    }
    
    // 수정 날짜 표시
    if (this.renderOptions.showModificationDate) {
      const modifiedDate = document.createElement('span');
      modifiedDate.className = 'card-modified-date';
      
      // 파일 수정 시간을 가져와 포맷팅
      const modified = this.file.stat.mtime;
      const modifiedStr = this.formatDate(modified);
      
      modifiedDate.textContent = `수정: ${modifiedStr}`;
      dateContainer.appendChild(modifiedDate);
    }
    
    return dateContainer;
  }
  
  /**
   * 날짜 포맷팅
   * @param timestamp 타임스탬프
   * @returns 포맷팅된 날짜 문자열
   */
  private formatDate(timestamp: number): string {
    const date = new Date(timestamp);
    
    // 날짜 포맷 설정 (YYYY-MM-DD)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  }

  /**
   * 컴포넌트 언로드
   * 이벤트 리스너 제거 및 정리 작업 수행
   */
  onunload(): void {
    // DOM에서 제거
    this.element.remove();
    
    super.onunload();
  }
} 