import { IPopupComponent, PopupComponent } from './PopupComponent';
import { IToolbarService } from '../../../application/toolbar/ToolbarService';
import { ISettingsService } from '../../../domain/settings/SettingsInterfaces';

/**
 * 정렬 팝업 컴포넌트
 */
export class SortPopupComponent extends PopupComponent implements IPopupComponent {
  /**
   * 생성자
   * @param toolbarService 툴바 서비스
   * @param settingsService 설정 서비스
   */
  constructor(toolbarService: IToolbarService, settingsService: ISettingsService) {
    super(toolbarService, settingsService, 'sort-popup', '정렬 옵션');
  }
  
  /**
   * 팝업 내용 생성
   * @returns 팝업 내용 HTML
   */
  generateContent(): string {
    // 현재 설정 가져오기
    const settings = this.settingsService.getSettings();
    const sortBy = settings.sortBy || 'filename';
    const sortDirection = settings.sortDirection || 'asc';
    const frontmatterKey = settings.frontmatterKey || '';
    
    return `
      <div class="popup-content sort-popup">
        <div class="popup-body">
          <div class="form-group">
            <label for="sort-field">정렬 기준</label>
            <select id="sort-field" class="sort-field-select">
              <option value="filename" ${sortBy === 'filename' ? 'selected' : ''}>파일명</option>
              <option value="created" ${sortBy === 'created' ? 'selected' : ''}>생성일</option>
              <option value="modified" ${sortBy === 'modified' ? 'selected' : ''}>수정일</option>
              <option value="path" ${sortBy === 'path' ? 'selected' : ''}>경로</option>
              <option value="frontmatter" ${sortBy === 'frontmatter' ? 'selected' : ''}>프론트매터</option>
            </select>
          </div>
          <div class="form-group frontmatter-field ${sortBy === 'frontmatter' ? '' : 'hidden'}">
            <label for="frontmatter-key">프론트매터 키</label>
            <input type="text" id="frontmatter-key" placeholder="키 입력" value="${frontmatterKey}">
          </div>
          <div class="form-group">
            <label for="sort-direction">정렬 방향</label>
            <select id="sort-direction" class="sort-direction-select">
              <option value="asc" ${sortDirection === 'asc' ? 'selected' : ''}>오름차순</option>
              <option value="desc" ${sortDirection === 'desc' ? 'selected' : ''}>내림차순</option>
            </select>
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
    // 정렬 필드 변경 이벤트
    const sortFieldSelect = popupElement.querySelector('#sort-field');
    if (sortFieldSelect) {
      sortFieldSelect.addEventListener('change', (event) => {
        const target = event.target as HTMLSelectElement;
        const frontmatterField = popupElement.querySelector('.frontmatter-field');
        if (frontmatterField) {
          if (target.value === 'frontmatter') {
            frontmatterField.classList.remove('hidden');
          } else {
            frontmatterField.classList.add('hidden');
          }
        }
      });
    }
    
    // 적용 버튼 클릭 이벤트
    const applyButton = popupElement.querySelector('.apply-button');
    if (applyButton) {
      applyButton.addEventListener('click', () => {
        // 정렬 설정 가져오기
        const sortField = (popupElement.querySelector('#sort-field') as HTMLSelectElement)?.value;
        const sortDirection = (popupElement.querySelector('#sort-direction') as HTMLSelectElement)?.value;
        const frontmatterKey = (popupElement.querySelector('#frontmatter-key') as HTMLInputElement)?.value;
        
        // 정렬 변경 이벤트 발생
        this.toolbarService.executeItemAction('sort-button', {
          field: sortField,
          direction: sortDirection,
          frontmatterKey
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