import { IPopupComponent, PopupComponent } from './PopupComponent';
import { IToolbarService } from '../../services/toolbar/ToolbarService';
import { ISettingsService } from '../../domain/settings/SettingsInterfaces';

/**
 * 검색 필터 팝업 컴포넌트
 */
export class SearchFilterPopupComponent extends PopupComponent implements IPopupComponent {
  /**
   * 생성자
   * @param toolbarService 툴바 서비스
   * @param settingsService 설정 서비스
   */
  constructor(toolbarService: IToolbarService, settingsService: ISettingsService) {
    super(toolbarService, settingsService, 'search-filter-popup', '검색 필터');
  }
  
  /**
   * 팝업 내용 생성
   * @returns 팝업 내용 HTML
   */
  generateContent(): string {
    // 현재 설정 가져오기
    const settings = this.settingsService.getSettings();
    const searchType = settings.defaultSearchType || 'content';
    const caseSensitive = settings.searchCaseSensitive || false;
    
    return `
      <div class="popup-content search-filter-popup">
        <div class="popup-body">
          <div class="form-group">
            <label for="search-type">검색 타입</label>
            <select id="search-type" class="search-type-select">
              <option value="filename" ${searchType === 'filename' ? 'selected' : ''}>파일명</option>
              <option value="content" ${searchType === 'content' ? 'selected' : ''}>내용</option>
              <option value="tag" ${searchType === 'tag' ? 'selected' : ''}>태그</option>
              <option value="path" ${searchType === 'path' ? 'selected' : ''}>경로</option>
              <option value="frontmatter" ${searchType === 'frontmatter' ? 'selected' : ''}>프론트매터</option>
              <option value="create" ${searchType === 'create' ? 'selected' : ''}>생성일</option>
              <option value="modify" ${searchType === 'modify' ? 'selected' : ''}>수정일</option>
              <option value="regex" ${searchType === 'regex' ? 'selected' : ''}>정규식</option>
            </select>
          </div>
          <div class="form-group frontmatter-field ${searchType === 'frontmatter' ? '' : 'hidden'}">
            <label for="frontmatter-key">프론트매터 키</label>
            <input type="text" id="frontmatter-key" placeholder="키 입력 (비워두면 모든 키 검색)">
          </div>
          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" id="case-sensitive" ${caseSensitive ? 'checked' : ''}>
              <span>대소문자 구분</span>
            </label>
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
    // 검색 타입 변경 이벤트
    const searchTypeSelect = popupElement.querySelector('#search-type');
    if (searchTypeSelect) {
      searchTypeSelect.addEventListener('change', (event) => {
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
        // 검색 필터 설정 가져오기
        const searchType = (popupElement.querySelector('#search-type') as HTMLSelectElement)?.value;
        const caseSensitive = (popupElement.querySelector('#case-sensitive') as HTMLInputElement)?.checked;
        const frontmatterKey = (popupElement.querySelector('#frontmatter-key') as HTMLInputElement)?.value;
        
        // 검색 필터 변경 이벤트 발생
        this.toolbarService.executeItemAction('search-filter', {
          searchType,
          caseSensitive,
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