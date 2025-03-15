import { PopupComponent } from './PopupComponent';
import { IToolbarService } from '../../../application/toolbar/ToolbarService';
import { ISettingsService } from '../../../domain/settings/SettingsInterfaces';

/**
 * 설정 팝업 컴포넌트
 */
export class SettingsPopupComponent extends PopupComponent {
  /**
   * 생성자
   * @param toolbarService 툴바 서비스
   * @param settingsService 설정 서비스
   */
  constructor(toolbarService: IToolbarService, settingsService: ISettingsService) {
    super(toolbarService, settingsService, 'settings-popup', '설정');
  }
  
  /**
   * 팝업 내용 생성
   * @returns 팝업 내용 HTML
   */
  generateContent(): string {
    // 현재 설정 가져오기
    const settings = this.settingsService.getSettings();
    
    return `
      <div class="popup-content settings-popup">
        <div class="popup-body">
          <div class="settings-group">
            <h4>일반 설정</h4>
            <div class="form-group">
              <label class="checkbox-label">
                <input type="checkbox" id="autoRefresh" ${settings.autoRefresh ? 'checked' : ''}>
                <span>자동 새로고침</span>
              </label>
            </div>
            <div class="form-group">
              <label class="checkbox-label">
                <input type="checkbox" id="showToolbar" ${settings.showToolbar !== false ? 'checked' : ''}>
                <span>툴바 표시</span>
              </label>
            </div>
            <div class="form-group">
              <label class="checkbox-label">
                <input type="checkbox" id="showStatusBar" ${settings.showStatusBar !== false ? 'checked' : ''}>
                <span>상태 표시줄 표시</span>
              </label>
            </div>
          </div>
          
          <div class="settings-group">
            <h4>카드 설정</h4>
            <div class="form-group">
              <label class="checkbox-label">
                <input type="checkbox" id="showCardPreview" ${settings.showCardPreview !== false ? 'checked' : ''}>
                <span>카드 미리보기 표시</span>
              </label>
            </div>
            <div class="form-group">
              <label class="checkbox-label">
                <input type="checkbox" id="showCardTags" ${settings.showCardTags !== false ? 'checked' : ''}>
                <span>카드 태그 표시</span>
              </label>
            </div>
            <div class="form-group">
              <label for="cardClickAction">카드 클릭 동작</label>
              <select id="cardClickAction">
                <option value="open" ${settings.clickAction === 'open' ? 'selected' : ''}>파일 열기</option>
                <option value="preview" ${settings.clickAction === 'preview' ? 'selected' : ''}>미리보기</option>
                <option value="select" ${settings.clickAction === 'select' ? 'selected' : ''}>선택</option>
              </select>
            </div>
          </div>
          
          <div class="settings-group">
            <h4>검색 설정</h4>
            <div class="form-group">
              <label class="checkbox-label">
                <input type="checkbox" id="searchCaseSensitive" ${settings.searchCaseSensitive ? 'checked' : ''}>
                <span>대소문자 구분</span>
              </label>
            </div>
            <div class="form-group">
              <label class="checkbox-label">
                <input type="checkbox" id="searchAsYouType" ${settings.searchAsYouType !== false ? 'checked' : ''}>
                <span>입력 시 자동 검색</span>
              </label>
            </div>
          </div>
          
          <div class="popup-footer">
            <button class="save-button">저장</button>
            <button class="cancel-button">취소</button>
          </div>
        </div>
      </div>
    `;
  }
  
  /**
   * 팝업 이벤트 리스너 등록
   * @param popupElement 팝업 요소
   */
  registerPopupEventListeners(popupElement: HTMLElement): void {
    // 설정 변경 이벤트
    const settingInputs = popupElement.querySelectorAll('input, select');
    settingInputs.forEach((input) => {
      input.addEventListener('change', (event) => {
        const target = event.target as HTMLInputElement | HTMLSelectElement;
        const settingKey = target.id || target.name;
        let settingValue: any;
        
        if (target instanceof HTMLInputElement) {
          if (target.type === 'checkbox') {
            settingValue = target.checked;
          } else if (target.type === 'number') {
            settingValue = parseInt(target.value, 10);
          } else {
            settingValue = target.value;
          }
        } else {
          settingValue = target.value;
        }
        
        // 설정 변경 이벤트 발생
        this.toolbarService.executeItemAction('settings-button', {
          key: settingKey,
          value: settingValue
        });
      });
    });
    
    // 저장 버튼 클릭 이벤트
    const saveButton = popupElement.querySelector('.save-button');
    if (saveButton) {
      saveButton.addEventListener('click', () => {
        // 설정 저장 이벤트 발생
        this.toolbarService.executeItemAction('settings-button', {
          action: 'save'
        });
        
        // 팝업 닫기
        this.toolbarService.closePopup(this.popupId);
      });
    }
    
    // 취소 버튼 클릭 이벤트
    this.registerCancelButtonListener(popupElement, () => {
      this.toolbarService.closePopup(this.popupId);
    });
  }
} 