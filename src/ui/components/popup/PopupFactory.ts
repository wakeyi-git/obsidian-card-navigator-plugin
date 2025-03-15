import { PopupComponent } from './PopupComponent';
import { CardSetPopupComponent } from './CardSetPopupComponent';
import { SortPopupComponent } from './SortPopupComponent';
import { SearchFilterPopupComponent } from './SearchFilterPopupComponent';
import { SettingsPopupComponent } from './SettingsPopupComponent';
import { LayoutPopupComponent } from './LayoutPopupComponent';
import { IToolbarService } from '../../../application/toolbar/ToolbarService';
import { ISettingsService } from '../../../domain/settings/SettingsInterfaces';

/**
 * 팝업 컴포넌트 팩토리
 * 팝업 타입에 따라 적절한 팝업 컴포넌트를 생성합니다.
 */
export class PopupFactory {
  private toolbarService: IToolbarService;
  private settingsService: ISettingsService;
  
  /**
   * 생성자
   * @param toolbarService 툴바 서비스
   * @param settingsService 설정 서비스
   */
  constructor(toolbarService: IToolbarService, settingsService: ISettingsService) {
    this.toolbarService = toolbarService;
    this.settingsService = settingsService;
  }
  
  /**
   * 팝업 컴포넌트 생성
   * @param popupType 팝업 타입
   * @returns 팝업 컴포넌트
   */
  createPopup(popupType: string): PopupComponent {
    switch (popupType) {
      case 'cardset-popup':
        return new CardSetPopupComponent(this.toolbarService, this.settingsService);
      case 'search-filter-popup':
        return new SearchFilterPopupComponent(this.toolbarService, this.settingsService);
      case 'sort-popup':
        return new SortPopupComponent(this.toolbarService, this.settingsService);
      case 'layout-popup':
        return new LayoutPopupComponent(this.toolbarService, this.settingsService);
      case 'settings-popup':
        return new SettingsPopupComponent(this.toolbarService, this.settingsService);
      default:
        throw new Error(`알 수 없는 팝업 타입: ${popupType}`);
    }
  }
} 