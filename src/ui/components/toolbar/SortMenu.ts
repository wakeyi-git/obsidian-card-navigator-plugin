import { Menu } from 'obsidian';
import { SortDirection, SortField } from '../../../core/types/card.types';

/**
 * 정렬 메뉴 컴포넌트 클래스
 * 카드 정렬 메뉴를 생성하고 관리합니다.
 */
export class SortMenu {
  /**
   * 메뉴 객체
   */
  private menu: Menu;
  
  /**
   * 현재 정렬 필드
   */
  private currentField: SortField = 'name';
  
  /**
   * 현재 정렬 방향
   */
  private currentDirection: SortDirection = 'asc';
  
  /**
   * 정렬 변경 콜백
   */
  private sortChangeCallback: ((field: SortField, direction: SortDirection) => void) | null = null;
  
  /**
   * 정렬 필드 옵션
   */
  private sortFieldOptions: { value: SortField; label: string; icon: string }[] = [
    { value: 'name', label: '파일명', icon: 'lucide-text' },
    { value: 'created', label: '생성일', icon: 'lucide-calendar-plus' },
    { value: 'modified', label: '수정일', icon: 'lucide-calendar-clock' },
    { value: 'size', label: '파일 크기', icon: 'lucide-file' },
    { value: 'tag', label: '태그', icon: 'lucide-tag' },
    { value: 'path', label: '경로', icon: 'lucide-folder' }
  ];
  
  /**
   * 정렬 메뉴 컴포넌트 생성자
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
    
    // 정렬 필드 옵션 추가
    this.addSortFieldOptions();
    
    // 구분선 추가
    this.menu.addSeparator();
    
    // 정렬 방향 옵션 추가
    this.addSortDirectionOptions();
    
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
   * 현재 정렬 필드 설정
   * @param field 정렬 필드
   */
  setCurrentField(field: SortField): void {
    this.currentField = field;
  }
  
  /**
   * 현재 정렬 방향 설정
   * @param direction 정렬 방향
   */
  setCurrentDirection(direction: SortDirection): void {
    this.currentDirection = direction;
  }
  
  /**
   * 정렬 변경 이벤트 리스너 등록
   * @param callback 콜백 함수
   */
  onSortChange(callback: (field: SortField, direction: SortDirection) => void): void {
    this.sortChangeCallback = callback;
  }
  
  /**
   * 정렬 필드 옵션 추가
   */
  private addSortFieldOptions(): void {
    this.menu.addItem(item => {
      item
        .setTitle('정렬 기준')
        .setDisabled(true);
    });
    
    this.sortFieldOptions.forEach(option => {
      this.menu.addItem(item => {
        const isSelected = this.currentField === option.value;
        
        item
          .setTitle(option.label)
          .setIcon(option.icon)
          .setChecked(isSelected)
          .onClick(() => {
            this.currentField = option.value;
            this.notifySortChange();
          });
      });
    });
  }
  
  /**
   * 정렬 방향 옵션 추가
   */
  private addSortDirectionOptions(): void {
    this.menu.addItem(item => {
      item
        .setTitle('정렬 방향')
        .setDisabled(true);
    });
    
    // 오름차순 옵션
    this.menu.addItem(item => {
      item
        .setTitle('오름차순')
        .setIcon('lucide-arrow-up')
        .setChecked(this.currentDirection === 'asc')
        .onClick(() => {
          this.currentDirection = 'asc';
          this.notifySortChange();
        });
    });
    
    // 내림차순 옵션
    this.menu.addItem(item => {
      item
        .setTitle('내림차순')
        .setIcon('lucide-arrow-down')
        .setChecked(this.currentDirection === 'desc')
        .onClick(() => {
          this.currentDirection = 'desc';
          this.notifySortChange();
        });
    });
  }
  
  /**
   * 정렬 변경 알림
   */
  private notifySortChange(): void {
    if (this.sortChangeCallback) {
      this.sortChangeCallback(this.currentField, this.currentDirection);
    }
  }
} 