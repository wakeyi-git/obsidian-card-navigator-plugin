import { DomainEventBus } from '../../domain/events/DomainEventBus';
import { EventType } from '../../domain/events/EventTypes';

/**
 * 탭 컨테이너 클래스
 * 설정 UI의 탭 기능을 구현합니다.
 */
export class TabContainer {
  private containerEl: HTMLElement;
  private tabsEl: HTMLElement;
  private contentEl: HTMLElement;
  private tabs: Map<string, HTMLElement> = new Map();
  private contents: Map<string, HTMLElement> = new Map();
  private activeTab: string | null = null;
  private eventBus: DomainEventBus | null = null;

  /**
   * 생성자
   * @param containerEl 컨테이너 요소
   * @param eventBus 이벤트 버스 (선택 사항)
   */
  constructor(containerEl: HTMLElement, eventBus?: DomainEventBus | null) {
    this.containerEl = containerEl;
    this.tabsEl = containerEl.createDiv({ cls: 'card-navigator-tabs' });
    this.contentEl = containerEl.createDiv({ cls: 'card-navigator-tab-content' });
    this.eventBus = eventBus || null;
    
    // 스타일 적용
    this.applyStyles();
  }

  /**
   * 스타일 적용
   */
  private applyStyles() {
    // 탭 컨테이너 스타일
    this.tabsEl.style.display = 'flex';
    this.tabsEl.style.flexWrap = 'wrap';
    this.tabsEl.style.borderBottom = '1px solid var(--background-modifier-border)';
  }

  /**
   * 탭 추가
   * @param id 탭 ID
   * @param name 탭 이름
   * @returns 탭 콘텐츠 요소
   */
  addTab(id: string, name: string): HTMLElement {
    // 탭 버튼 생성
    const tabEl = this.tabsEl.createDiv({ cls: 'card-navigator-tab', text: name });
    tabEl.dataset.tabId = id;
    
    // 탭 콘텐츠 컨테이너 생성
    const contentEl = this.contentEl.createDiv({ cls: 'card-navigator-tab-pane' });
    contentEl.dataset.tabId = id;
    
    // 탭 클릭 이벤트 처리
    tabEl.addEventListener('click', () => {
      this.activateTab(id);
    });
    
    // 탭 및 콘텐츠 저장
    this.tabs.set(id, tabEl);
    this.contents.set(id, contentEl);
    
    // 첫 번째 탭이면 활성화
    if (!this.activeTab) {
      this.activateTab(id);
    }
    
    return contentEl;
  }

  /**
   * 탭 활성화
   * @param id 활성화할 탭 ID
   */
  activateTab(id: string) {
    // 이전 활성 탭 비활성화
    if (this.activeTab) {
      const prevTab = this.tabs.get(this.activeTab);
      const prevContent = this.contents.get(this.activeTab);
      
      if (prevTab) {
        prevTab.classList.remove('is-active');
      }
      
      if (prevContent) {
        prevContent.classList.remove('is-active');
      }
    }
    
    // 새 탭 활성화
    const newTab = this.tabs.get(id);
    const newContent = this.contents.get(id);
    
    if (newTab) {
      newTab.classList.add('is-active');
    }
    
    if (newContent) {
      newContent.classList.add('is-active');
    }
    
    this.activeTab = id;
    
    // 탭 변경 이벤트 발생
    if (this.eventBus) {
      this.eventBus.emit(EventType.SETTINGS_TAB_CHANGED, {
        tabId: id
      });
    }
  }

  /**
   * 탭 콘텐츠 요소 가져오기
   * @param id 탭 ID
   * @returns 탭 콘텐츠 요소
   */
  getContentEl(id: string): HTMLElement | undefined {
    return this.contents.get(id);
  }
  
  /**
   * 현재 활성화된 탭 ID 가져오기
   * @returns 활성화된 탭 ID
   */
  getActiveTabId(): string | null {
    return this.activeTab;
  }
  
  /**
   * 하위 탭 컨테이너 생성
   * @param parentTabId 부모 탭 ID
   * @param subTabId 하위 탭 ID
   * @returns 하위 탭 컨테이너
   */
  createSubTabContainer(parentTabId: string, subTabId: string): TabContainer | null {
    const parentContent = this.getContentEl(parentTabId);
    if (!parentContent) return null;
    
    const subTabContainer = new TabContainer(parentContent, this.eventBus);
    return subTabContainer;
  }
} 