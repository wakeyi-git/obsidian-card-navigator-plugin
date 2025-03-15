import { ObsidianService } from '../adapters/ObsidianService';
import { DomainEventBus } from '../../../core/events/DomainEventBus';
import { EventType } from '../../../domain/events/EventTypes';

/**
 * 리본 서비스 인터페이스
 */
export interface IRibbonService {
  /**
   * 리본 아이콘 추가
   * @param icon 아이콘 ID
   * @param title 툴팁 텍스트
   * @param callback 클릭 콜백
   * @returns 생성된 HTML 요소
   */
  addRibbonIcon(icon: string, title: string, callback: (evt: MouseEvent) => void): HTMLElement;
  
  /**
   * 리본 아이콘 제거
   */
  removeRibbonIcon(): void;
}

/**
 * 리본 서비스
 * 리본 메뉴를 관리합니다.
 */
export class RibbonService implements IRibbonService {
  private obsidianService: ObsidianService;
  private ribbonIcon: HTMLElement | null = null;
  
  /**
   * 생성자
   * @param obsidianService Obsidian 서비스
   */
  constructor(obsidianService: ObsidianService) {
    this.obsidianService = obsidianService;
  }
  
  /**
   * 리본 아이콘 추가
   * @param icon 아이콘 ID
   * @param title 툴팁 텍스트
   * @param callback 클릭 콜백
   * @returns 생성된 HTML 요소
   */
  addRibbonIcon(icon: string, title: string, callback: (evt: MouseEvent) => void): HTMLElement {
    // 기존 아이콘이 있으면 제거
    this.removeRibbonIcon();
    
    // 새 아이콘 추가
    this.ribbonIcon = this.obsidianService.addRibbonIcon(icon, title, callback);
    return this.ribbonIcon;
  }
  
  /**
   * 리본 아이콘 제거
   */
  removeRibbonIcon(): void {
    if (this.ribbonIcon) {
      this.ribbonIcon.remove();
      this.ribbonIcon = null;
    }
  }
} 