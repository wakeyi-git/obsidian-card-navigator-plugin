import { TFile, Component, App } from 'obsidian';
import { CardRenderOptions } from '../../../core/types/card.types';
import { CARD_CLASS_NAMES, CARD_THEME } from '../../../styles/components/card.styles';
import { CardHeader } from './CardHeader';
import { CardBody } from './CardBody';
import { CardFooter } from './CardFooter';

/**
 * 카드 컴포넌트 클래스
 * 카드의 전체적인 구조와 동작을 관리합니다.
 */
export class Card extends Component {
  /**
   * 카드 컨테이너 요소
   */
  private element: HTMLElement;
  
  /**
   * 헤더 컴포넌트
   */
  private header: CardHeader;
  
  /**
   * 본문 컴포넌트
   */
  private body: CardBody;
  
  /**
   * 푸터 컴포넌트
   */
  private footer: CardFooter;
  
  /**
   * 파일 객체
   */
  private file: TFile;
  
  /**
   * 첫 번째 헤더 텍스트
   */
  private firstHeader: string | null;
  
  /**
   * 본문 내용
   */
  private content: string;
  
  /**
   * 태그 목록
   */
  private tags: string[];
  
  /**
   * 렌더링 옵션
   */
  private renderOptions: CardRenderOptions;
  
  /**
   * 선택 상태
   */
  private isSelected: boolean;
  
  /**
   * 포커스 상태
   */
  private isFocused: boolean;
  
  /**
   * 앱 인스턴스
   */
  private app: App;
  
  /**
   * 카드 컴포넌트 생성자
   * @param file 파일 객체
   * @param firstHeader 첫 번째 헤더 텍스트
   * @param content 본문 내용
   * @param tags 태그 목록
   * @param renderOptions 렌더링 옵션
   * @param app 앱 인스턴스
   */
  constructor(
    file: TFile,
    firstHeader: string | null,
    content: string,
    tags: string[],
    renderOptions: CardRenderOptions,
    app: App
  ) {
    super();
    
    this.file = file;
    this.firstHeader = firstHeader;
    this.content = content;
    this.tags = tags;
    this.renderOptions = renderOptions;
    this.app = app;
    this.isSelected = false;
    this.isFocused = false;
    
    // 카드 컨테이너 생성
    this.element = this.createCardElement();
    
    // 하위 컴포넌트 생성
    this.header = new CardHeader(file, firstHeader, renderOptions);
    this.body = new CardBody(file, content, renderOptions, app);
    this.footer = new CardFooter(file, tags, renderOptions, app);
    
    // 하위 컴포넌트 추가
    this.element.appendChild(this.header.getElement());
    this.element.appendChild(this.body.getElement());
    this.element.appendChild(this.footer.getElement());
    
    // 이벤트 리스너 등록
    this.registerEventListeners();
  }
  
  /**
   * 카드 요소 가져오기
   * @returns 카드 HTML 요소
   */
  getElement(): HTMLElement {
    return this.element;
  }
  
  /**
   * 파일 객체 가져오기
   * @returns 파일 객체
   */
  getFile(): TFile {
    return this.file;
  }
  
  /**
   * 선택 상태 설정
   * @param selected 선택 상태
   */
  setSelected(selected: boolean): void {
    this.isSelected = selected;
    this.updateCardState();
  }
  
  /**
   * 포커스 상태 설정
   * @param focused 포커스 상태
   */
  setFocused(focused: boolean): void {
    this.isFocused = focused;
    this.updateCardState();
  }
  
  /**
   * 카드 내용 업데이트
   * @param newContent 새 내용
   */
  updateContent(newContent: string): void {
    this.content = newContent;
    this.body.updateContent(newContent);
  }
  
  /**
   * 첫 번째 헤더 업데이트
   * @param newHeader 새 헤더 텍스트
   */
  updateFirstHeader(newHeader: string | null): void {
    this.firstHeader = newHeader;
    this.header.updateFirstHeader(newHeader);
  }
  
  /**
   * 태그 업데이트
   * @param newTags 새 태그 목록
   */
  updateTags(newTags: string[]): void {
    this.tags = newTags;
    this.footer.updateTags(newTags);
  }
  
  /**
   * 파일 업데이트
   * @param newFile 새 파일 객체
   */
  updateFile(newFile: TFile): void {
    this.file = newFile;
    this.header.updateFile(newFile);
    this.body.updateFile(newFile);
    this.footer.updateFile(newFile);
  }
  
  /**
   * 렌더링 옵션 업데이트
   * @param newOptions 새 렌더링 옵션
   */
  updateRenderOptions(newOptions: CardRenderOptions): void {
    this.renderOptions = newOptions;
    this.header.updateRenderOptions(newOptions);
    this.body.updateRenderOptions(newOptions);
    this.footer.updateRenderOptions(newOptions);
  }
  
  /**
   * 컴포넌트 언로드
   * 이벤트 리스너 제거 및 정리 작업 수행
   */
  onunload(): void {
    // 이벤트 리스너 제거
    this.element.removeEventListener('click', this.handleClick);
    this.element.removeEventListener('mouseenter', this.handleMouseEnter);
    this.element.removeEventListener('mouseleave', this.handleMouseLeave);
    
    // 하위 컴포넌트들의 unload 호출
    this.header?.unload();
    this.body?.unload();
    this.footer?.unload();
    
    // DOM에서 제거
    this.element.remove();
    
    super.onunload();
  }
  
  /**
   * 카드 요소 생성
   * @returns 카드 HTML 요소
   */
  private createCardElement(): HTMLElement {
    const card = document.createElement('div');
    
    // 기본 클래스 적용
    const baseClasses = [
      CARD_CLASS_NAMES.CARD.CONTAINER,
      CARD_CLASS_NAMES.INTERACTION.CLICKABLE,
      CARD_CLASS_NAMES.INTERACTION.HOVERABLE
    ];
    
    card.className = baseClasses.join(' ');
    
    // 테마 클래스 별도 적용
    const isDarkTheme = document.body.classList.contains('theme-dark');
    card.classList.add(isDarkTheme ? CARD_THEME.DARK : CARD_THEME.LIGHT);
    
    return card;
  }
  
  /**
   * 이벤트 리스너 등록
   */
  private registerEventListeners = (): void => {
    // 클릭 이벤트
    this.element.addEventListener('click', this.handleClick);
    
    // 마우스 호버 이벤트
    this.element.addEventListener('mouseenter', this.handleMouseEnter);
    this.element.addEventListener('mouseleave', this.handleMouseLeave);
  };
  
  /**
   * 클릭 이벤트 핸들러
   * @param event 클릭 이벤트
   */
  private handleClick = (event: MouseEvent): void => {
    // 이벤트 버블링 방지
    event.stopPropagation();
    
    // 클릭 이벤트 발생
    const customEvent = new CustomEvent('card-click', {
      detail: {
        file: this.file,
        originalEvent: event
      },
      bubbles: true
    });
    
    this.element.dispatchEvent(customEvent);
  };
  
  /**
   * 마우스 진입 이벤트 핸들러
   */
  private handleMouseEnter = (): void => {
    this.element.classList.add(CARD_CLASS_NAMES.CARD.STATE.FOCUSED);
  };
  
  /**
   * 마우스 이탈 이벤트 핸들러
   */
  private handleMouseLeave = (): void => {
    if (!this.isFocused) {
      this.element.classList.remove(CARD_CLASS_NAMES.CARD.STATE.FOCUSED);
    }
  };
  
  /**
   * 카드 상태 업데이트
   * 선택 및 포커스 상태에 따라 클래스 업데이트
   */
  private updateCardState(): void {
    const stateClasses = {
      [CARD_CLASS_NAMES.CARD.STATE.SELECTED]: this.isSelected,
      [CARD_CLASS_NAMES.CARD.STATE.FOCUSED]: this.isFocused
    };

    Object.entries(stateClasses).forEach(([className, shouldApply]) => {
      this.element.classList.toggle(className, shouldApply);
    });
  }
} 