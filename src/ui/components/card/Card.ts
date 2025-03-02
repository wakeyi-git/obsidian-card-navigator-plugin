import { TFile } from 'obsidian';
import { Card as CardModel } from '../../../core/models/Card';
import { CardPosition } from '../../../core/models/CardPosition';
import { CardInteractionEvent, CardInteractionHandler, CardRenderOptions, CardState } from '../../../core/types/card.types';

/**
 * 카드 컴포넌트 클래스
 * 카드 UI 요소를 생성하고 관리합니다.
 */
export class Card {
  /**
   * 카드 요소
   */
  private element: HTMLElement;
  
  /**
   * 카드 모델
   */
  private model: CardModel;
  
  /**
   * 카드 위치
   */
  private position: CardPosition | null = null;
  
  /**
   * 카드 상태
   */
  private state: CardState = 'normal';
  
  /**
   * 렌더링 옵션
   */
  private renderOptions: CardRenderOptions;
  
  /**
   * 이벤트 핸들러 맵
   */
  private eventHandlers: Map<CardInteractionEvent, CardInteractionHandler[]> = new Map();
  
  /**
   * 카드 컴포넌트 생성자
   * @param model 카드 모델
   * @param renderOptions 렌더링 옵션
   */
  constructor(model: CardModel, renderOptions: CardRenderOptions) {
    this.model = model;
    this.renderOptions = renderOptions;
    this.element = this.createCardElement();
    this.setupEventListeners();
  }
  
  /**
   * 카드 요소 가져오기
   * @returns 카드 HTML 요소
   */
  getElement(): HTMLElement {
    return this.element;
  }
  
  /**
   * 카드 모델 가져오기
   * @returns 카드 모델
   */
  getModel(): CardModel {
    return this.model;
  }
  
  /**
   * 카드 ID 가져오기
   * @returns 카드 ID
   */
  getId(): string {
    return this.model.id;
  }
  
  /**
   * 카드 파일 가져오기
   * @returns 카드 파일
   */
  getFile(): TFile {
    return this.model.file;
  }
  
  /**
   * 카드 위치 설정
   * @param position 카드 위치
   */
  setPosition(position: CardPosition): void {
    this.position = position;
    this.updatePosition();
  }
  
  /**
   * 카드 위치 가져오기
   * @returns 카드 위치
   */
  getPosition(): CardPosition | null {
    return this.position;
  }
  
  /**
   * 카드 상태 설정
   * @param state 카드 상태
   */
  setState(state: CardState): void {
    // 이전 상태 클래스 제거
    this.element.classList.remove(`card-state-${this.state}`);
    
    // 새 상태 설정
    this.state = state;
    
    // 새 상태 클래스 추가
    this.element.classList.add(`card-state-${state}`);
    
    // 상태에 따른 추가 처리
    switch (state) {
      case 'active':
        this.element.setAttribute('aria-selected', 'true');
        break;
      case 'focused':
        this.element.focus();
        break;
      default:
        this.element.setAttribute('aria-selected', 'false');
    }
  }
  
  /**
   * 카드 상태 가져오기
   * @returns 카드 상태
   */
  getState(): CardState {
    return this.state;
  }
  
  /**
   * 카드 업데이트
   * @param model 새 카드 모델
   */
  update(model: CardModel): void {
    this.model = model;
    this.render();
  }
  
  /**
   * 카드 렌더링
   */
  render(): void {
    // 카드 내용 초기화
    this.element.innerHTML = '';
    
    // 카드 헤더 생성
    if (this.renderOptions.showFileName || this.renderOptions.showFirstHeader) {
      const header = this.createCardHeader();
      this.element.appendChild(header);
    }
    
    // 카드 본문 생성
    if (this.renderOptions.showBody && this.model.body) {
      const body = this.createCardBody();
      this.element.appendChild(body);
    }
    
    // 카드 푸터 생성
    if (this.renderOptions.showTags && this.model.tags && this.model.tags.length > 0) {
      const footer = this.createCardFooter();
      this.element.appendChild(footer);
    }
  }
  
  /**
   * 이벤트 리스너 등록
   * @param event 이벤트 타입
   * @param handler 이벤트 핸들러
   */
  on(event: CardInteractionEvent, handler: CardInteractionHandler): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    
    this.eventHandlers.get(event)?.push(handler);
  }
  
  /**
   * 이벤트 리스너 제거
   * @param event 이벤트 타입
   * @param handler 이벤트 핸들러
   */
  off(event: CardInteractionEvent, handler: CardInteractionHandler): void {
    if (!this.eventHandlers.has(event)) {
      return;
    }
    
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index !== -1) {
        handlers.splice(index, 1);
      }
    }
  }
  
  /**
   * 리소스 정리
   */
  destroy(): void {
    // 이벤트 리스너 제거
    this.removeEventListeners();
    
    // 요소 제거
    if (this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    
    // 이벤트 핸들러 정리
    this.eventHandlers.clear();
  }
  
  /**
   * 카드 요소 생성
   * @returns 카드 HTML 요소
   */
  private createCardElement(): HTMLElement {
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.id = this.model.id;
    card.dataset.path = this.model.file.path;
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'listitem');
    card.setAttribute('aria-label', this.model.file.basename);
    
    // 카드 상태 클래스 추가
    card.classList.add(`card-state-${this.state}`);
    
    // 카드 내용 렌더링
    this.render();
    
    return card;
  }
  
  /**
   * 카드 헤더 생성
   * @returns 카드 헤더 요소
   */
  private createCardHeader(): HTMLElement {
    const header = document.createElement('div');
    header.className = 'card-header';
    
    // 제목 요소 생성
    const title = document.createElement('div');
    title.className = 'card-title';
    
    // 제목 폰트 크기 설정
    title.style.fontSize = `${this.renderOptions.titleFontSize}px`;
    
    // 파일명 또는 첫 번째 헤더 표시
    if (this.renderOptions.showFirstHeader && this.model.firstHeader) {
      title.textContent = this.model.firstHeader;
    } else {
      title.textContent = this.model.file.basename;
    }
    
    header.appendChild(title);
    
    return header;
  }
  
  /**
   * 카드 본문 생성
   * @returns 카드 본문 요소
   */
  private createCardBody(): HTMLElement {
    const body = document.createElement('div');
    body.className = 'card-body';
    
    // 본문 폰트 크기 설정
    body.style.fontSize = `${this.renderOptions.bodyFontSize}px`;
    
    // 본문 내용 제한
    let content = this.model.body || '';
    if (this.renderOptions.maxBodyLength > 0 && content.length > this.renderOptions.maxBodyLength) {
      content = content.substring(0, this.renderOptions.maxBodyLength) + '...';
    }
    
    // 마크다운 렌더링 (간단한 구현, 실제로는 Obsidian의 마크다운 렌더러 사용)
    body.textContent = content;
    
    return body;
  }
  
  /**
   * 카드 푸터 생성
   * @returns 카드 푸터 요소
   */
  private createCardFooter(): HTMLElement {
    const footer = document.createElement('div');
    footer.className = 'card-footer';
    
    // 태그 컨테이너 생성
    const tagContainer = document.createElement('div');
    tagContainer.className = 'card-tags';
    
    // 태그 폰트 크기 설정
    tagContainer.style.fontSize = `${this.renderOptions.tagFontSize}px`;
    
    // 태그 추가
    if (this.model.tags) {
      for (const tag of this.model.tags) {
        const tagElement = document.createElement('span');
        tagElement.className = 'card-tag';
        tagElement.textContent = `#${tag}`;
        tagContainer.appendChild(tagElement);
      }
    }
    
    footer.appendChild(tagContainer);
    
    return footer;
  }
  
  /**
   * 카드 위치 업데이트
   */
  private updatePosition(): void {
    if (!this.position) return;
    
    // 위치 설정
    this.element.style.position = 'absolute';
    this.element.style.left = `${this.position.x}px`;
    this.element.style.top = `${this.position.y}px`;
    this.element.style.width = `${this.position.width}px`;
    this.element.style.height = `${this.position.height}px`;
    
    // 그리드 위치 데이터 설정
    this.element.dataset.column = String(this.position.column);
    this.element.dataset.row = String(this.position.row);
  }
  
  /**
   * 이벤트 리스너 설정
   */
  private setupEventListeners(): void {
    // 클릭 이벤트
    this.element.addEventListener('click', this.handleClick.bind(this));
    
    // 더블 클릭 이벤트
    this.element.addEventListener('dblclick', this.handleDblClick.bind(this));
    
    // 컨텍스트 메뉴 이벤트
    this.element.addEventListener('contextmenu', this.handleContextMenu.bind(this));
    
    // 마우스 이벤트
    this.element.addEventListener('mouseenter', this.handleMouseEnter.bind(this));
    this.element.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
    
    // 키보드 이벤트
    this.element.addEventListener('keydown', this.handleKeyDown.bind(this));
    
    // 드래그 이벤트
    this.element.addEventListener('dragstart', this.handleDragStart.bind(this));
    this.element.addEventListener('dragend', this.handleDragEnd.bind(this));
    
    // 드롭 이벤트
    this.element.addEventListener('dragover', this.handleDragOver.bind(this));
    this.element.addEventListener('drop', this.handleDrop.bind(this));
    
    // 드래그 가능 설정
    this.element.setAttribute('draggable', 'true');
  }
  
  /**
   * 이벤트 리스너 제거
   */
  private removeEventListeners(): void {
    // 클릭 이벤트
    this.element.removeEventListener('click', this.handleClick.bind(this));
    
    // 더블 클릭 이벤트
    this.element.removeEventListener('dblclick', this.handleDblClick.bind(this));
    
    // 컨텍스트 메뉴 이벤트
    this.element.removeEventListener('contextmenu', this.handleContextMenu.bind(this));
    
    // 마우스 이벤트
    this.element.removeEventListener('mouseenter', this.handleMouseEnter.bind(this));
    this.element.removeEventListener('mouseleave', this.handleMouseLeave.bind(this));
    
    // 키보드 이벤트
    this.element.removeEventListener('keydown', this.handleKeyDown.bind(this));
    
    // 드래그 이벤트
    this.element.removeEventListener('dragstart', this.handleDragStart.bind(this));
    this.element.removeEventListener('dragend', this.handleDragEnd.bind(this));
    
    // 드롭 이벤트
    this.element.removeEventListener('dragover', this.handleDragOver.bind(this));
    this.element.removeEventListener('drop', this.handleDrop.bind(this));
  }
  
  /**
   * 클릭 이벤트 핸들러
   * @param event 마우스 이벤트
   */
  private handleClick(event: MouseEvent): void {
    this.triggerEvent('click', event);
  }
  
  /**
   * 더블 클릭 이벤트 핸들러
   * @param event 마우스 이벤트
   */
  private handleDblClick(event: MouseEvent): void {
    this.triggerEvent('dblclick', event);
  }
  
  /**
   * 컨텍스트 메뉴 이벤트 핸들러
   * @param event 마우스 이벤트
   */
  private handleContextMenu(event: MouseEvent): void {
    this.triggerEvent('contextmenu', event);
  }
  
  /**
   * 마우스 진입 이벤트 핸들러
   * @param event 마우스 이벤트
   */
  private handleMouseEnter(event: MouseEvent): void {
    this.triggerEvent('mouseenter', event);
  }
  
  /**
   * 마우스 이탈 이벤트 핸들러
   * @param event 마우스 이벤트
   */
  private handleMouseLeave(event: MouseEvent): void {
    this.triggerEvent('mouseleave', event);
  }
  
  /**
   * 키 다운 이벤트 핸들러
   * @param event 키보드 이벤트
   */
  private handleKeyDown(event: KeyboardEvent): void {
    this.triggerEvent('keydown', event);
  }
  
  /**
   * 드래그 시작 이벤트 핸들러
   * @param event 드래그 이벤트
   */
  private handleDragStart(event: DragEvent): void {
    if (event.dataTransfer) {
      // 드래그 데이터 설정
      event.dataTransfer.setData('text/plain', this.model.file.path);
      event.dataTransfer.effectAllowed = 'copyLink';
    }
    
    // 드래그 중 클래스 추가
    this.element.classList.add('card-dragging');
    
    this.triggerEvent('dragstart', event);
  }
  
  /**
   * 드래그 종료 이벤트 핸들러
   * @param event 드래그 이벤트
   */
  private handleDragEnd(event: DragEvent): void {
    // 드래그 중 클래스 제거
    this.element.classList.remove('card-dragging');
    
    this.triggerEvent('dragend', event);
  }
  
  /**
   * 드래그 오버 이벤트 핸들러
   * @param event 드래그 이벤트
   */
  private handleDragOver(event: DragEvent): void {
    // 기본 동작 방지 (드롭 허용)
    event.preventDefault();
    
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copyLink';
    }
    
    this.triggerEvent('dragover', event);
  }
  
  /**
   * 드롭 이벤트 핸들러
   * @param event 드래그 이벤트
   */
  private handleDrop(event: DragEvent): void {
    // 기본 동작 방지
    event.preventDefault();
    
    if (event.dataTransfer) {
      const sourcePath = event.dataTransfer.getData('text/plain');
      
      // 드롭 처리
      if (sourcePath && sourcePath !== this.model.file.path) {
        this.triggerEvent('drop', event, { sourcePath });
      }
    }
  }
  
  /**
   * 이벤트 발생
   * @param event 이벤트 타입
   * @param originalEvent 원본 이벤트
   * @param data 추가 데이터
   */
  private triggerEvent(
    event: CardInteractionEvent,
    originalEvent: Event,
    data: any = {}
  ): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => handler(originalEvent, this.model.file, data));
    }
  }
} 