import { IPopupComponent, PopupComponent } from './PopupComponent';
import { IToolbarService } from '../../services/toolbar/ToolbarService';
import { ISettingsService } from '../../domain/settings/SettingsInterfaces';
import { setIcon } from 'obsidian';

/**
 * 카드셋 팝업 컴포넌트
 */
export class CardSetPopupComponent extends PopupComponent implements IPopupComponent {
  /**
   * 생성자
   * @param toolbarService 툴바 서비스
   * @param settingsService 설정 서비스
   */
  constructor(toolbarService: IToolbarService, settingsService: ISettingsService) {
    super(toolbarService, settingsService, 'cardset-popup', '카드셋 선택');
  }
  
  /**
   * 팝업 내용 생성
   * @returns 팝업 내용 HTML
   */
  generateContent(): string {
    // 현재 설정 가져오기
    const settings = this.settingsService.getSettings();
    const includeSubfolders = settings.includeSubfolders || false;
    const specificFolder = settings.specificFolder || '';
    const useTagsForCardSet = settings.useTagsForCardSet || false;
    
    // 현재 카드셋 타입 결정
    let currentCardSetType = 'current';
    if (includeSubfolders) {
      currentCardSetType = 'include-subfolders';
    } else if (specificFolder) {
      currentCardSetType = 'specific-folder';
    }
    
    return `
      <div class="popup-content cardset-popup">
        <div class="popup-body">
          <div class="radio-group">
            <label class="radio-label">
              <input type="radio" name="cardset-type" value="current" ${currentCardSetType === 'current' ? 'checked' : ''}>
              <span>현재 폴더</span>
            </label>
            <label class="radio-label">
              <input type="radio" name="cardset-type" value="include-subfolders" ${currentCardSetType === 'include-subfolders' ? 'checked' : ''}>
              <span>하위 폴더 포함</span>
            </label>
            <label class="radio-label">
              <input type="radio" name="cardset-type" value="specific-folder" ${currentCardSetType === 'specific-folder' ? 'checked' : ''}>
              <span>특정 폴더 선택</span>
            </label>
          </div>
          <div class="folder-selector ${currentCardSetType === 'specific-folder' ? 'visible' : 'hidden'}">
            <div class="folder-tree">
              <!-- 폴더 트리 내용은 동적으로 생성됨 -->
              <div class="folder-tree-placeholder">폴더 로딩 중...</div>
            </div>
          </div>
          
          <div class="setting-item">
            <div class="setting-item-info">
              <div class="setting-item-name">태그 기반 카드셋 사용</div>
            </div>
            <div class="setting-item-control">
              <div class="checkbox-container">
                <input class="checkbox-real" type="checkbox" id="use-tag-cardset" ${useTagsForCardSet ? 'checked' : ''}>
                <div class="checkbox-fake"></div>
              </div>
            </div>
          </div>
          
          <div class="tag-selector ${useTagsForCardSet ? 'visible' : 'hidden'}">
            <div class="tag-input-container">
              <input type="text" id="tag-input" placeholder="태그 입력 (쉼표로 구분)" value="${settings.lastTagCardSet || ''}">
            </div>
            <div class="tag-list">
              <!-- 태그 목록은 동적으로 생성됨 -->
            </div>
          </div>
          <div class="popup-footer">
            <button class="apply-button">적용</button>
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
    // 라디오 버튼 변경 이벤트
    const radioButtons = popupElement.querySelectorAll('input[name="cardset-type"]');
    radioButtons.forEach((radio) => {
      radio.addEventListener('change', (event) => {
        const target = event.target as HTMLInputElement;
        if (target.value === 'specific-folder') {
          // 폴더 선택기 표시
          const folderSelector = popupElement.querySelector('.folder-selector');
          if (folderSelector) {
            folderSelector.classList.remove('hidden');
            folderSelector.classList.add('visible');
          }
        } else {
          // 폴더 선택기 숨김
          const folderSelector = popupElement.querySelector('.folder-selector');
          if (folderSelector) {
            folderSelector.classList.remove('visible');
            folderSelector.classList.add('hidden');
          }
        }
      });
    });
    
    // 태그 기반 카드셋 토글 이벤트
    const tagToggle = popupElement.querySelector('#use-tag-cardset');
    if (tagToggle) {
      tagToggle.addEventListener('change', (event) => {
        const target = event.target as HTMLInputElement;
        const tagSelector = popupElement.querySelector('.tag-selector');
        if (tagSelector) {
          if (target.checked) {
            tagSelector.classList.remove('hidden');
            tagSelector.classList.add('visible');
          } else {
            tagSelector.classList.remove('visible');
            tagSelector.classList.add('hidden');
          }
        }
      });
    }
    
    // 적용 버튼 클릭 이벤트
    const applyButton = popupElement.querySelector('.apply-button');
    if (applyButton) {
      applyButton.addEventListener('click', () => {
        // 선택된 카드셋 타입 가져오기
        const selectedType = popupElement.querySelector('input[name="cardset-type"]:checked') as HTMLInputElement;
        if (selectedType) {
          // 카드셋 변경 이벤트 발생
          this.toolbarService.executeItemAction('cardset-selector', {
            type: selectedType.value
          });
        }
        
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