import { Menu, TFolder } from 'obsidian';
import { CardSetType } from '../../../core/types/cardset.types';

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
   * 현재 카드셋 타입
   */
  private currentType: CardSetType = 'active-folder';
  
  /**
   * 현재 선택된 폴더 경로 (지정 폴더 모드에서 사용)
   */
  private selectedFolderPath: string | null = null;
  
  /**
   * 카드셋 타입 변경 콜백
   */
  private cardSetTypeChangeCallback: ((type: CardSetType, source?: string) => void) | null = null;
  
  /**
   * 카드셋 타입 옵션
   */
  private cardSetTypeOptions: { value: CardSetType; label: string; icon: string }[] = [
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
    
    // 카드셋 타입 옵션 추가
    this.addCardSetTypeOptions();
    
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
   * 현재 카드셋 타입 설정
   * @param type 카드셋 타입
   */
  setCurrentType(type: CardSetType): void {
    this.currentType = type;
  }
  
  /**
   * 선택된 폴더 경로 설정
   * @param folderPath 폴더 경로
   */
  setSelectedFolderPath(folderPath: string | null): void {
    this.selectedFolderPath = folderPath;
  }
  
  /**
   * 카드셋 타입 변경 이벤트 리스너 등록
   * @param callback 콜백 함수
   */
  onCardSetTypeChange(callback: (type: CardSetType, source?: string) => void): void {
    this.cardSetTypeChangeCallback = callback;
  }
  
  /**
   * 카드셋 타입 옵션 추가
   */
  private addCardSetTypeOptions(): void {
    this.menu.addItem(item => {
      item
        .setTitle('카드셋 타입')
        .setDisabled(true);
    });
    
    this.cardSetTypeOptions.forEach(option => {
      this.menu.addItem(item => {
        const isSelected = this.currentType === option.value;
        
        item
          .setTitle(option.label)
          .setIcon(option.icon)
          .setChecked(isSelected)
          .onClick(() => {
            // 지정 폴더 모드인 경우 폴더 선택 서브메뉴 표시
            if (option.value === 'selected-folder') {
              this.showFolderSelectionMenu();
            } else {
              this.currentType = option.value;
              this.notifyCardSetTypeChange();
            }
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
          this.currentType = 'selected-folder';
          this.selectedFolderPath = '/';
          this.notifyCardSetTypeChange();
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
            this.currentType = 'selected-folder';
            this.selectedFolderPath = folder.path;
            this.notifyCardSetTypeChange();
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
   * 카드셋 타입 변경 알림
   */
  private notifyCardSetTypeChange(): void {
    if (this.cardSetTypeChangeCallback) {
      if (this.currentType === 'selected-folder' && this.selectedFolderPath) {
        this.cardSetTypeChangeCallback(this.currentType, this.selectedFolderPath);
      } else {
        this.cardSetTypeChangeCallback(this.currentType);
      }
    }
  }
} 