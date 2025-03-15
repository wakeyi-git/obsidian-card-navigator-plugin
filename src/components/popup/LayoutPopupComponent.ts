import { IPopupComponent, PopupComponent } from './PopupComponent';
import { IToolbarService } from '../../services/toolbar/ToolbarService';
import { ISettingsService } from '../../domain/settings/SettingsInterfaces';

/**
 * 레이아웃 팝업 컴포넌트
 */
export class LayoutPopupComponent extends PopupComponent implements IPopupComponent {
  /**
   * 생성자
   * @param toolbarService 툴바 서비스
   * @param settingsService 설정 서비스
   */
  constructor(toolbarService: IToolbarService, settingsService: ISettingsService) {
    super(toolbarService, settingsService, 'layout-popup', '레이아웃 설정');
  }
  
  /**
   * 팝업 내용 생성
   * @returns 팝업 내용 HTML
   */
  generateContent(): string {
    // 현재 설정 가져오기
    const settings = this.settingsService.getSettings();
    const viewType = settings.viewType || 'grid';
    const gridColumns = settings.gridColumns || 3;
    const cardWidth = settings.cardWidth || 250;
    const showPreview = settings.showPreview !== false;
    const visibleColumns = settings.visibleColumns || ['filename', 'created', 'modified'];
    
    // 카드 크기 결정
    let cardSize = 'medium';
    if (cardWidth <= 150) {
      cardSize = 'small';
    } else if (cardWidth >= 350) {
      cardSize = 'large';
    }
    
    return `
      <div class="popup-content layout-popup">
        <div class="popup-body">
          <div class="form-group">
            <label for="layout-type">레이아웃 타입</label>
            <select id="layout-type" class="layout-type-select">
              <option value="grid" ${viewType === 'grid' ? 'selected' : ''}>그리드</option>
              <option value="list" ${viewType === 'list' ? 'selected' : ''}>리스트</option>
              <option value="table" ${viewType === 'table' ? 'selected' : ''}>테이블</option>
            </select>
          </div>
          
          <div class="layout-options grid-options ${viewType === 'grid' ? '' : 'hidden'}">
            <div class="form-group">
              <label for="grid-columns">열 개수</label>
              <input type="number" id="grid-columns" min="1" max="6" value="${gridColumns}">
            </div>
            <div class="form-group">
              <label for="card-size">카드 크기</label>
              <select id="card-size" class="card-size-select">
                <option value="small" ${cardSize === 'small' ? 'selected' : ''}>작게</option>
                <option value="medium" ${cardSize === 'medium' ? 'selected' : ''}>중간</option>
                <option value="large" ${cardSize === 'large' ? 'selected' : ''}>크게</option>
              </select>
            </div>
          </div>
          
          <div class="layout-options list-options ${viewType === 'list' ? '' : 'hidden'}">
            <div class="form-group">
              <label class="checkbox-label">
                <input type="checkbox" id="show-preview" ${showPreview ? 'checked' : ''}>
                <span>미리보기 표시</span>
              </label>
            </div>
          </div>
          
          <div class="layout-options table-options ${viewType === 'table' ? '' : 'hidden'}">
            <div class="form-group">
              <label>표시할 열</label>
              <div class="checkbox-group">
                <label class="checkbox-label">
                  <input type="checkbox" class="table-column" value="filename" ${visibleColumns.includes('filename') ? 'checked' : ''}>
                  <span>파일명</span>
                </label>
                <label class="checkbox-label">
                  <input type="checkbox" class="table-column" value="created" ${visibleColumns.includes('created') ? 'checked' : ''}>
                  <span>생성일</span>
                </label>
                <label class="checkbox-label">
                  <input type="checkbox" class="table-column" value="modified" ${visibleColumns.includes('modified') ? 'checked' : ''}>
                  <span>수정일</span>
                </label>
                <label class="checkbox-label">
                  <input type="checkbox" class="table-column" value="path" ${visibleColumns.includes('path') ? 'checked' : ''}>
                  <span>경로</span>
                </label>
                <label class="checkbox-label">
                  <input type="checkbox" class="table-column" value="tags" ${visibleColumns.includes('tags') ? 'checked' : ''}>
                  <span>태그</span>
                </label>
              </div>
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
    // 레이아웃 타입 변경 이벤트
    const layoutTypeSelect = popupElement.querySelector('#layout-type');
    if (layoutTypeSelect) {
      layoutTypeSelect.addEventListener('change', (event) => {
        const target = event.target as HTMLSelectElement;
        
        // 레이아웃별 옵션 표시/숨김
        const gridOptions = popupElement.querySelector('.grid-options');
        const listOptions = popupElement.querySelector('.list-options');
        const tableOptions = popupElement.querySelector('.table-options');
        
        if (gridOptions && listOptions && tableOptions) {
          gridOptions.classList.add('hidden');
          listOptions.classList.add('hidden');
          tableOptions.classList.add('hidden');
          
          if (target.value === 'grid') {
            gridOptions.classList.remove('hidden');
          } else if (target.value === 'list') {
            listOptions.classList.remove('hidden');
          } else if (target.value === 'table') {
            tableOptions.classList.remove('hidden');
          }
        }
      });
    }
    
    // 적용 버튼 클릭 이벤트
    const applyButton = popupElement.querySelector('.apply-button');
    if (applyButton) {
      applyButton.addEventListener('click', () => {
        // 레이아웃 설정 가져오기
        const layoutType = (popupElement.querySelector('#layout-type') as HTMLSelectElement)?.value;
        
        // 레이아웃별 추가 설정
        let additionalSettings = {};
        
        if (layoutType === 'grid') {
          const columns = (popupElement.querySelector('#grid-columns') as HTMLInputElement)?.value;
          const cardSize = (popupElement.querySelector('#card-size') as HTMLSelectElement)?.value;
          additionalSettings = { columns, cardSize };
        } else if (layoutType === 'list') {
          const showPreview = (popupElement.querySelector('#show-preview') as HTMLInputElement)?.checked;
          additionalSettings = { showPreview };
        } else if (layoutType === 'table') {
          const columns = Array.from(popupElement.querySelectorAll('.table-column:checked')).map(
            (el) => (el as HTMLInputElement).value
          );
          additionalSettings = { columns };
        }
        
        // 레이아웃 변경 이벤트 발생
        this.toolbarService.executeItemAction('layout-button', {
          type: layoutType,
          ...additionalSettings
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