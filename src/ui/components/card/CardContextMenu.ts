import { Menu, TFile, Workspace } from 'obsidian';
import { Card } from '../../../core/models/Card';
import { ErrorHandler } from '../../../utils/error/ErrorHandler';

/**
 * 메뉴 아이템 인터페이스
 */
interface MenuItem {
  id: string;
  title: string | ((card: Card) => string);
  icon: string | ((card: Card) => string);
}

/**
 * 메뉴 구분선 인터페이스
 */
interface MenuSeparator {
  id: string;
  isSeparator: true;
}

/**
 * 메뉴 항목 타입
 */
type MenuEntry = MenuItem | MenuSeparator;

/**
 * 메뉴 아이템 타입 가드
 */
function isMenuItem(item: MenuEntry): item is MenuItem {
  return !('isSeparator' in item);
}

/**
 * 메뉴 구분선 타입 가드
 */
function isMenuSeparator(item: MenuEntry): item is MenuSeparator {
  return 'isSeparator' in item;
}

/**
 * 카드 컨텍스트 메뉴 컴포넌트 클래스
 * 카드의 컨텍스트 메뉴를 생성하고 관리합니다.
 */
export class CardContextMenu {
  /**
   * 메뉴 객체
   */
  private menu: Menu;
  
  /**
   * 카드 객체
   */
  private card: Card;
  
  /**
   * 워크스페이스 객체
   */
  private workspace: Workspace;
  
  /**
   * 이벤트 콜백 맵
   */
  private callbacks: Map<string, (card: Card, data?: any) => void> = new Map();
  
  /**
   * 메뉴 아이템 정의
   */
  private readonly menuItems: MenuEntry[] = [
    {
      id: 'open',
      title: '열기',
      icon: 'document'
    },
    {
      id: 'openInNewTab',
      title: '새 탭에서 열기',
      icon: 'lucide-external-link'
    },
    {
      id: 'edit',
      title: '편집 모드로 열기',
      icon: 'lucide-edit'
    },
    {
      id: 'separator1',
      isSeparator: true
    },
    {
      id: 'copyLink',
      title: '링크 복사',
      icon: 'lucide-link'
    },
    {
      id: 'copyPath',
      title: '파일 경로 복사',
      icon: 'lucide-file'
    },
    {
      id: 'separator2',
      isSeparator: true
    },
    {
      id: 'rename',
      title: '파일 이름 변경',
      icon: 'lucide-text-cursor-input'
    },
    {
      id: 'delete',
      title: '파일 삭제',
      icon: 'lucide-trash-2'
    },
    {
      id: 'separator3',
      isSeparator: true
    },
    {
      id: 'togglePin',
      title: (card: Card) => card.isPinned ? '카드 고정 해제' : '카드 고정',
      icon: (card: Card) => card.isPinned ? 'lucide-pin-off' : 'lucide-pin'
    },
    {
      id: 'separator4',
      isSeparator: true
    },
    {
      id: 'showInfo',
      title: '파일 정보 보기',
      icon: 'lucide-info'
    }
  ];

  /**
   * 색상 옵션 정의
   */
  private readonly colorOptions = [
    { name: '없음', value: '' },
    { name: '빨강', value: '#ffcdd2' },
    { name: '주황', value: '#ffe0b2' },
    { name: '노랑', value: '#fff9c4' },
    { name: '초록', value: '#c8e6c9' },
    { name: '파랑', value: '#bbdefb' },
    { name: '보라', value: '#e1bee7' },
    { name: '회색', value: '#e0e0e0' }
  ];
  
  /**
   * 카드 컨텍스트 메뉴 생성자
   * @param card 카드 객체
   * @param workspace 워크스페이스 객체
   */
  constructor(card: Card, workspace: Workspace) {
    this.card = card;
    this.workspace = workspace;
    this.menu = new Menu();
  }
  
  /**
   * 컨텍스트 메뉴를 표시합니다.
   * @param event 마우스 또는 키보드 이벤트
   */
  public show(event: MouseEvent | KeyboardEvent): void {
    try {
      if (!this.card) {
        throw new Error('카드가 설정되지 않았습니다.');
      }

      event.preventDefault();
      event.stopPropagation();

      const menu = new Menu();
      this.addMenuItems(menu);
      
      if (event instanceof MouseEvent) {
        menu.showAtMouseEvent(event);
      } else {
        const target = event.target as HTMLElement;
        menu.showAtPosition({ x: target.offsetLeft, y: target.offsetTop });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      ErrorHandler.handleError('CardContextMenu.show', `메뉴 표시 실패: ${errorMessage}`, true);
    }
  }
  
  /**
   * 메뉴 숨기기
   */
  hide(): void {
    this.menu.hide();
  }
  
  /**
   * 이벤트 콜백 등록
   * @param action 액션 이름
   * @param callback 콜백 함수
   */
  registerCallback(action: string, callback: (card: Card, data?: any) => void): void {
    this.callbacks.set(action, callback);
  }
  
  /**
   * 이벤트 콜백 제거
   * @param action 액션 이름
   */
  unregisterCallback(action: string): void {
    this.callbacks.delete(action);
  }
  
  /**
   * 메뉴 항목 추가
   */
  private addMenuItems(menu: Menu): void {
    try {
      this.menuItems.forEach(item => {
        if (isMenuSeparator(item)) {
          menu.addSeparator();
        } else if (isMenuItem(item)) {
          menu.addItem(menuItem => {
            const title = typeof item.title === 'function' ? item.title(this.card) : item.title;
            const icon = typeof item.icon === 'function' ? item.icon(this.card) : item.icon;
            
            menuItem
              .setTitle(title)
              .setIcon(icon)
              .onClick(() => this.triggerCallback(item.id));
          });
        }
      });

      // 색상 메뉴 추가
      this.addColorSubmenu(menu);
    } catch (error) {
      ErrorHandler.handleError('CardContextMenu.addMenuItems', `메뉴 항목 추가 실패: ${error}`, false);
    }
  }
  
  /**
   * 색상 서브메뉴 추가
   */
  private addColorSubmenu(menu: Menu): void {
    try {
      menu.addItem(item => {
        item
          .setTitle('카드 색상 설정')
          .setIcon('lucide-palette')
          .onClick(this.handleColorMenuClick);
      });
    } catch (error) {
      ErrorHandler.handleError('CardContextMenu.addColorSubmenu', `색상 서브메뉴 추가 실패: ${error}`, false);
    }
  }
  
  /**
   * 색상 메뉴 클릭 핸들러
   */
  private handleColorMenuClick = (event: MouseEvent | KeyboardEvent): void => {
    try {
      const colorMenu = new Menu();
      
      this.colorOptions.forEach(color => {
        colorMenu.addItem(colorItem => {
          colorItem
            .setTitle(color.name)
            .setIcon('circle')
            .onClick(() => this.triggerCallback('setColor', color.value));
          
          const itemDom = (colorItem as any).dom as HTMLElement;
          const iconEl = itemDom.querySelector('.menu-item-icon');
          if (iconEl) {
            iconEl.empty();
            iconEl.appendChild(this.createColorIcon(color.value));
          }
        });
      });
      
      if (event instanceof MouseEvent) {
        colorMenu.showAtMouseEvent(event);
      } else {
        const target = event.target as HTMLElement;
        colorMenu.showAtPosition({ x: target.offsetLeft, y: target.offsetTop });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      ErrorHandler.handleError('CardContextMenu.handleColorMenuClick', `색상 메뉴 표시 실패: ${errorMessage}`, false);
    }
  };
  
  /**
   * 색상 아이콘 생성
   * @param color 색상 값
   * @returns HTMLElement 색상 아이콘 요소
   */
  private createColorIcon(color: string): HTMLElement {
    const iconContainer = document.createElement('div');
    iconContainer.style.width = '16px';
    iconContainer.style.height = '16px';
    iconContainer.style.borderRadius = '50%';
    iconContainer.style.marginRight = '8px';
    
    if (color) {
      iconContainer.style.backgroundColor = color;
    } else {
      iconContainer.style.border = '1px solid #ccc';
    }
    
    return iconContainer;
  }
  
  /**
   * 콜백 함수 호출
   * @param action 액션 이름
   * @param data 추가 데이터
   */
  private triggerCallback(action: string, data?: any): void {
    try {
      const callback = this.callbacks.get(action);
      if (callback) {
        callback(this.card, data);
      }
    } catch (error) {
      ErrorHandler.handleError('CardContextMenu.triggerCallback', `콜백 호출 실패: ${error}`, false);
    }
  }
} 