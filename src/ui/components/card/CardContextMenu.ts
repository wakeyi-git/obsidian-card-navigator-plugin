import { Menu, TFile, Workspace } from 'obsidian';
import { Card as CardModel } from '../../../core/models/Card';

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
   * 카드 모델
   */
  private cardModel: CardModel;
  
   /**
   * 워크스페이스 객체
   */
  private workspace: Workspace;
  
  /**
   * 이벤트 콜백 맵
   */
  private callbacks: Record<string, (file: TFile) => void> = {};
  
  /**
   * 카드 컨텍스트 메뉴 생성자
   * @param cardModel 카드 모델
   * @param workspace 워크스페이스 객체
   */
  constructor(cardModel: CardModel, workspace: Workspace) {
    this.cardModel = cardModel;
    this.workspace = workspace;
    this.menu = new Menu();
  }
  
  /**
   * 메뉴 표시
   * @param event 마우스 이벤트
   */
  show(event: MouseEvent): void {
    // 기존 메뉴 닫기
    this.menu.hide();
    
    // 새 메뉴 생성
    this.menu = new Menu();
    
    // 메뉴 항목 추가
    this.addMenuItems();
    
    // 메뉴 표시
    this.menu.showAtPosition({ x: event.clientX, y: event.clientY });
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
  registerCallback(action: string, callback: (file: TFile) => void): void {
    this.callbacks[action] = callback;
  }
  
  /**
   * 이벤트 콜백 제거
   * @param action 액션 이름
   */
  unregisterCallback(action: string): void {
    delete this.callbacks[action];
  }
  
  /**
   * 메뉴 항목 추가
   */
  private addMenuItems(): void {
    const file = this.cardModel.file;
    
    // 파일 열기
    this.menu.addItem(item => {
      item
        .setTitle('열기')
        .setIcon('document')
        .onClick(() => {
          this.openFile(file, false);
        });
    });
    
    // 새 탭에서 열기
    this.menu.addItem(item => {
      item
        .setTitle('새 탭에서 열기')
        .setIcon('lucide-external-link')
        .onClick(() => {
          this.openFile(file, true);
        });
    });
    
    // 편집 모드로 열기
    this.menu.addItem(item => {
      item
        .setTitle('편집 모드로 열기')
        .setIcon('lucide-edit')
        .onClick(() => {
          this.openFileInEditMode(file);
        });
    });
    
    // 구분선
    this.menu.addSeparator();
    
    // 링크 복사
    this.menu.addItem(item => {
      item
        .setTitle('링크 복사')
        .setIcon('lucide-link')
        .onClick(() => {
          this.copyLink(file);
        });
    });
    
    // 파일 경로 복사
    this.menu.addItem(item => {
      item
        .setTitle('파일 경로 복사')
        .setIcon('lucide-file')
        .onClick(() => {
          this.copyFilePath(file);
        });
    });
    
    // 구분선
    this.menu.addSeparator();
    
    // 파일 이름 변경
    this.menu.addItem(item => {
      item
        .setTitle('파일 이름 변경')
        .setIcon('lucide-text-cursor-input')
        .onClick(() => {
          this.triggerCallback('rename', file);
        });
    });
    
    // 파일 삭제
    this.menu.addItem(item => {
      item
        .setTitle('파일 삭제')
        .setIcon('lucide-trash-2')
        .onClick(() => {
          this.triggerCallback('delete', file);
        });
    });
    
    // 구분선
    this.menu.addSeparator();
    
    // 카드 고정/해제
    const isPinned = this.cardModel.isPinned;
    this.menu.addItem(item => {
      item
        .setTitle(isPinned ? '카드 고정 해제' : '카드 고정')
        .setIcon(isPinned ? 'lucide-pin-off' : 'lucide-pin')
        .onClick(() => {
          this.triggerCallback('togglePin', file);
        });
    });
    
    // 카드 색상 설정
    this.addColorSubmenu();
    
    // 구분선
    this.menu.addSeparator();
    
    // 파일 정보 보기
    this.menu.addItem(item => {
      item
        .setTitle('파일 정보 보기')
        .setIcon('lucide-info')
        .onClick(() => {
          this.showFileInfo(file);
        });
    });
  }
  
  /**
   * 색상 서브메뉴 추가
   */
  private addColorSubmenu(): void {
    this.menu.addItem(item => {
      item
        .setTitle('카드 색상 설정')
        .setIcon('lucide-palette')
        .onClick(evt => {
          // 서브메뉴 생성
          const colorMenu = new Menu();
          
          // 색상 옵션 추가
          const colors = [
            { name: '없음', value: '' },
            { name: '빨강', value: '#ffcdd2' },
            { name: '주황', value: '#ffe0b2' },
            { name: '노랑', value: '#fff9c4' },
            { name: '초록', value: '#c8e6c9' },
            { name: '파랑', value: '#bbdefb' },
            { name: '보라', value: '#e1bee7' },
            { name: '회색', value: '#e0e0e0' }
          ];
          
          colors.forEach(color => {
            colorMenu.addItem(colorItem => {
              // 색상 표시를 위한 원형 아이콘
              const colorIcon = color.value 
                ? `<div style="width: 16px; height: 16px; border-radius: 50%; background-color: ${color.value}; margin-right: 8px;"></div>` 
                : '<div style="width: 16px; height: 16px; border-radius: 50%; border: 1px solid #ccc; margin-right: 8px;"></div>';
              
              colorItem
                .setTitle(color.name)
                .setIcon('circle')
                .onClick(() => {
                  this.triggerCallback('setColor', this.cardModel.file, color.value);
                });
              
              // 아이콘 대신 색상 원형 사용
              const itemDom = (colorItem as any).dom as HTMLElement;
              const iconEl = itemDom.querySelector('.menu-item-icon');
              if (iconEl) {
                iconEl.innerHTML = colorIcon;
              }
            });
          });
          
          // 서브메뉴 표시
          colorMenu.showAtMouseEvent(evt);
        });
    });
  }
  
  /**
   * 파일 열기
   * @param file 파일 객체
   * @param newLeaf 새 탭에서 열기 여부
   */
  private openFile(file: TFile, newLeaf: boolean): void {
    this.workspace.getLeaf(newLeaf).openFile(file);
  }
  
  /**
   * 편집 모드로 파일 열기
   * @param file 파일 객체
   */
  private openFileInEditMode(file: TFile): void {
    const leaf = this.workspace.getLeaf();
    leaf.openFile(file).then(() => {
      if (leaf.getViewState().state?.mode !== 'source') {
        const view = leaf.view;
        if (view.getMode && view.setMode) {
          view.setMode('source');
        }
      }
    });
  }
  
  /**
   * 링크 복사
   * @param file 파일 객체
   */
  private copyLink(file: TFile): void {
    // 옵시디언 내부 링크 형식 생성
    const linkText = `[[${file.path}]]`;
    navigator.clipboard.writeText(linkText).then(() => {
      // 성공 메시지 표시 (옵시디언 Notice 사용 가능)
      console.log('링크가 클립보드에 복사되었습니다.');
    });
  }
  
  /**
   * 파일 경로 복사
   * @param file 파일 객체
   */
  private copyFilePath(file: TFile): void {
    navigator.clipboard.writeText(file.path).then(() => {
      // 성공 메시지 표시
      console.log('파일 경로가 클립보드에 복사되었습니다.');
    });
  }
  
  /**
   * 파일 정보 보기
   * @param file 파일 객체
   */
  private showFileInfo(file: TFile): void {
    // 파일 정보 모달 표시 (별도 구현 필요)
    this.triggerCallback('showInfo', file);
  }
  
  /**
   * 콜백 함수 호출
   * @param action 액션 이름
   * @param file 파일 객체
   * @param data 추가 데이터
   */
  private triggerCallback(action: string, file: TFile, data?: any): void {
    const callback = this.callbacks[action];
    if (callback) {
      callback(file);
    }
  }
} 