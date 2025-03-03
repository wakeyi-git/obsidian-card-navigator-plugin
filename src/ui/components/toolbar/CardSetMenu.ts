import { Menu, TFolder } from 'obsidian';

/**
 * 카드셋 메뉴 컴포넌트 클래스
 * 카드셋 타입 메뉴를 생성하고 관리합니다.
 */
export class CardSetMenu {
  /**
   * 메뉴 객체
   */
  private menu: Menu;
  
  /**
   * 현재 카드셋 모드
   */
  private currentMode: string = 'active-folder';
  
  /**
   * 현재 선택된 폴더 경로 (지정 폴더 모드에서 사용)
   */
  private selectedFolderPath: string | null = null;
  
  /**
   * 카드셋 모드 변경 콜백
   */
  private cardSetModeChangeCallback: ((mode: string, source?: string) => void) | null = null;
  
  /**
   * 카드셋 모드 옵션
   */
  private cardSetModeOptions: { value: string; label: string; icon: string }[] = [
    { value: 'active-folder', label: '활성 폴더', icon: 'lucide-folder-open' },
    { value: 'selected-folder', label: '지정 폴더', icon: 'lucide-folder' },
    { value: 'vault', label: '볼트 전체', icon: 'lucide-database' },
    { value: 'search-results', label: '검색 결과', icon: 'lucide-search' }
  ];
  
  /**
   * 카드셋 메뉴 컴포넌트 생성자
   */
  constructor() {
    this.menu = new Menu();
  }
  
  /**
   * 메뉴 표시
   * @param targetElement 메뉴를 표시할 대상 요소
   */
  show(targetElement: HTMLElement): void {
    // 기존 메뉴 닫기
    this.menu.hide();
    
    // 새 메뉴 생성
    this.menu = new Menu();
    
    // 카드셋 모드 옵션 추가
    this.addCardSetModeOptions();
    
    // 메뉴 표시
    this.menu.showAtPosition({
      x: targetElement.getBoundingClientRect().left,
      y: targetElement.getBoundingClientRect().bottom
    });
  }
  
  /**
   * 메뉴 숨기기
   */
  hide(): void {
    this.menu.hide();
  }
  
  /**
   * 현재 모드 설정
   * @param mode 카드셋 모드
   */
  setCurrentMode(mode: string): void {
    this.currentMode = mode;
  }
  
  /**
   * 선택된 폴더 경로 설정
   * @param folderPath 폴더 경로
   */
  setSelectedFolderPath(folderPath: string | null): void {
    this.selectedFolderPath = folderPath;
  }
  
  /**
   * 카드셋 모드 변경 이벤트 구독
   * @param callback 콜백 함수
   */
  onCardSetModeChange(callback: (mode: string, source?: string) => void): void {
    this.cardSetModeChangeCallback = callback;
  }
  
  /**
   * 카드셋 모드 옵션 추가
   */
  private addCardSetModeOptions(): void {
    // 메뉴 초기화
    this.menu.empty();
    
    // 카드셋 모드 옵션 추가
    this.cardSetModeOptions.forEach(option => {
      this.menu.addItem(item => {
        item
          .setTitle(option.label)
          .setIcon(option.icon)
          .setChecked(this.currentMode === option.value)
          .onClick(() => {
            this.currentMode = option.value;
            this.notifyCardSetModeChange();
          });
      });
    });
  }
  
  /**
   * 폴더 선택 서브메뉴 표시
   */
  private showFolderSelectionMenu(): void {
    // 기존 메뉴 닫기
    this.menu.hide();
    
    // 새 메뉴 생성
    const folderMenu = new Menu();
    
    // 폴더 선택 헤더
    folderMenu.addItem(item => {
      item
        .setTitle('폴더 선택')
        .setDisabled(true);
    });
    
    // 최근 선택한 폴더 표시 (있는 경우)
    if (this.selectedFolderPath) {
      folderMenu.addItem(item => {
        item
          .setTitle(`현재: ${this.selectedFolderPath}`)
          .setIcon('lucide-check')
          .setDisabled(true);
      });
      
      folderMenu.addSeparator();
    }
    
    // 루트 폴더 옵션
    folderMenu.addItem(item => {
      item
        .setTitle('루트')
        .setIcon('lucide-folder-root')
        .onClick(() => {
          this.currentMode = 'selected-folder';
          this.selectedFolderPath = '/';
          this.notifyCardSetModeChange();
        });
    });
    
    // 폴더 목록 가져오기 (실제 구현에서는 앱 인스턴스를 통해 가져와야 함)
    // 여기서는 예시로 구현
    this.getFolders().forEach(folder => {
      folderMenu.addItem(item => {
        item
          .setTitle(folder.path)
          .setIcon('lucide-folder')
          .onClick(() => {
            this.currentMode = 'selected-folder';
            this.selectedFolderPath = folder.path;
            this.notifyCardSetModeChange();
          });
      });
    });
    
    // 메뉴 표시
    folderMenu.showAtMouseEvent(new MouseEvent('click'));
  }
  
  /**
   * 폴더 목록 가져오기
   * @returns 폴더 목록
   */
  private getFolders(): TFolder[] {
    // 실제 구현에서는 앱 인스턴스를 통해 가져와야 함
    // 여기서는 빈 배열 반환
    return [];
  }
  
  /**
   * 카드셋 모드 변경 알림
   */
  private notifyCardSetModeChange(): void {
    if (this.cardSetModeChangeCallback) {
      if (this.currentMode === 'selected-folder' && this.selectedFolderPath) {
        this.cardSetModeChangeCallback(this.currentMode, this.selectedFolderPath);
      } else {
        this.cardSetModeChangeCallback(this.currentMode);
      }
    }
  }
} 