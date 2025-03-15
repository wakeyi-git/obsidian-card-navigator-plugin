import { PopupComponent } from './PopupComponent';
import { IPopupComponent } from './PopupInterfaces';
import { IToolbarService } from '../../../application/toolbar/ToolbarService';
import { ISettingsService } from '../../../domain/settings/SettingsInterfaces';
import { ObsidianService } from '../../../infrastructure/obsidian/adapters/ObsidianService';
import { FolderSuggestModal } from '../modals/FolderSuggestModal';
import { TagSuggestModal } from '../modals/TagSuggestModal';
import { setIcon } from 'obsidian';
import { DomainEventBus } from '../../../core/events/DomainEventBus';
import { EventType } from '../../../domain/events/EventTypes';
import { CardSetSourceMode } from '../../../domain/settings/SettingsInterfaces';

/**
 * 카드셋 팝업 컴포넌트
 * 카드셋 선택을 위한 팝업 컴포넌트입니다.
 */
export class CardSetPopupComponent extends PopupComponent implements IPopupComponent {
  /**
   * 팝업 ID
   */
  get popupId(): string {
    return 'cardset-popup';
  }
  
  private obsidianService: ObsidianService;
  private eventBus: DomainEventBus;
  private selectedTags: string[] = [];
  private currentMode: 'folder' | 'tag' = 'folder';
  private folderMode: 'active' | 'fixed' = 'active';
  private tagMode: 'active' | 'fixed' = 'active';
  private includeSubfolders = false;
  private tagCaseSensitive = false;
  private specificFolder = '';
  private specificTag = '';

  /**
   * 생성자
   * @param toolbarService 툴바 서비스
   * @param settingsService 설정 서비스
   * @param obsidianService Obsidian 서비스
   * @param eventBus 이벤트 버스
   */
  constructor(
    toolbarService: IToolbarService,
    settingsService: ISettingsService,
    obsidianService: ObsidianService,
    eventBus: DomainEventBus
  ) {
    super(toolbarService, settingsService);
    this.obsidianService = obsidianService;
    this.eventBus = eventBus;
    
    // 설정에서 초기값 가져오기
    const settings = this.settingsService.getSettings();
    this.currentMode = settings.cardSetSourceMode || CardSetSourceMode.FOLDER;
    this.includeSubfolders = settings.includeSubfolders || false;
    this.tagCaseSensitive = settings.tagCaseSensitive || false;
    this.specificFolder = settings.selectedFolder || '';
    this.specificTag = settings.selectedTags?.join(',') || '';
    
    // 폴더 모드 설정
    if (settings.isCardSetFixed && this.currentMode === CardSetSourceMode.FOLDER) {
      this.folderMode = 'fixed';
    } else {
      this.folderMode = 'active';
    }
    
    // 태그 모드 설정
    if (settings.isCardSetFixed && this.currentMode === CardSetSourceMode.TAG) {
      this.tagMode = 'fixed';
    } else {
      this.tagMode = 'active';
    }
    
    // 태그 목록 설정
    if (this.specificTag) {
      this.selectedTags = this.specificTag.split(',').map(tag => tag.trim());
    }
  }
  
  /**
   * 팝업 내용 생성
   * @returns 팝업 내용 HTML
   */
  generateContent(): string {
    const settings = this.settingsService.getSettings();
    const currentMode = settings.cardSetSourceMode || CardSetSourceMode.FOLDER;
    const isFixed = settings.isCardSetFixed || false;
    const includeSubfolders = settings.includeSubfolders || false;
    const tagCaseSensitive = settings.tagCaseSensitive || false;
    const selectedFolder = settings.selectedFolder || '';
    const selectedTags = settings.selectedTags || [];
    
    // 폴더 목록 가져오기
    const folders = this.obsidianService.getFolderPaths();
    
    // 태그 목록 가져오기
    const tags = this.obsidianService.getAllTags();
    
    return `
      <div class="popup-container">
        <div class="popup-header">
          <h3>카드셋 선택</h3>
          <button class="popup-close-button">&times;</button>
        </div>
        
        <div class="popup-body">
          <div class="mode-tabs">
            <button class="mode-tab ${currentMode === CardSetSourceMode.FOLDER ? 'active' : ''}" data-mode="${CardSetSourceMode.FOLDER}">폴더 모드</button>
            <button class="mode-tab ${currentMode === CardSetSourceMode.TAG ? 'active' : ''}" data-mode="${CardSetSourceMode.TAG}">태그 모드</button>
          </div>
          
          <div class="mode-content">
            <!-- 폴더 모드 내용 -->
            <div class="folder-mode-content" style="display: ${currentMode === CardSetSourceMode.FOLDER ? 'block' : 'none'}">
              <div class="form-group">
                <label for="folder-select">폴더 선택:</label>
                <select id="folder-select" class="dropdown">
                  <option value="">-- 폴더 선택 --</option>
                  ${folders.map(folder => `<option value="${folder}" ${folder === selectedFolder ? 'selected' : ''}>${folder}</option>`).join('')}
                </select>
              </div>
              
              <div class="checkbox-group">
                <label>
                  <input type="checkbox" id="include-subfolders" ${includeSubfolders ? 'checked' : ''}>
                  하위 폴더 포함
                </label>
              </div>
            </div>
            
            <!-- 태그 모드 내용 -->
            <div class="tag-mode-content" style="display: ${currentMode === CardSetSourceMode.TAG ? 'block' : 'none'}">
              <div class="form-group">
                <label>태그 선택:</label>
                <div class="tag-selector">
                  ${tags.map(tag => `
                    <div class="tag-item">
                      <label>
                        <input type="checkbox" class="tag-checkbox" value="${tag}" ${selectedTags.includes(tag) ? 'checked' : ''}>
                        ${tag}
                      </label>
                    </div>
                  `).join('')}
                </div>
              </div>
              
              <div class="checkbox-group">
                <label>
                  <input type="checkbox" id="tag-case-sensitive" ${tagCaseSensitive ? 'checked' : ''}>
                  대소문자 구분
                </label>
              </div>
            </div>
          </div>
          
          <div class="checkbox-group">
            <label>
              <input type="checkbox" id="fixed-cardset" ${isFixed ? 'checked' : ''}>
              카드셋 고정
            </label>
          </div>
        </div>
        
        <div class="popup-footer">
          <button class="cancel-button">취소</button>
          <button class="apply-button">적용</button>
        </div>
      </div>
    `;
  }
  
  /**
   * 팝업 이벤트 리스너 등록
   * @param popupElement 팝업 요소
   */
  registerPopupEventListeners(popupElement: HTMLElement): void {
    // 닫기 버튼 이벤트
    const closeButton = popupElement.querySelector('.popup-close-button');
    if (closeButton) {
      closeButton.addEventListener('click', () => {
        this.closePopup();
      });
    }
    
    // 취소 버튼 이벤트
    const cancelButton = popupElement.querySelector('.cancel-button');
    if (cancelButton) {
      cancelButton.addEventListener('click', () => {
        this.closePopup();
      });
    }
    
    // 적용 버튼 이벤트
    const applyButton = popupElement.querySelector('.apply-button');
    if (applyButton) {
      applyButton.addEventListener('click', () => {
        this.applySettings(popupElement);
      });
    }
    
    // 모드 탭 이벤트
    const modeTabs = popupElement.querySelectorAll('.mode-tab');
    modeTabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        const target = e.target as HTMLElement;
        const mode = target.dataset.mode as CardSetSourceMode;
        
        // 활성 탭 변경
        modeTabs.forEach(t => t.classList.remove('active'));
        target.classList.add('active');
        
        // 모드 내용 표시/숨김
        const folderContent = popupElement.querySelector('.folder-mode-content');
        const tagContent = popupElement.querySelector('.tag-mode-content');
        
        if (folderContent && tagContent) {
          if (mode === CardSetSourceMode.FOLDER) {
            folderContent.setAttribute('style', 'display: block');
            tagContent.setAttribute('style', 'display: none');
          } else {
            folderContent.setAttribute('style', 'display: none');
            tagContent.setAttribute('style', 'display: block');
          }
        }
      });
    });
  }
  
  /**
   * 설정 적용
   * @param popupElement 팝업 요소
   */
  private applySettings(popupElement: HTMLElement): void {
    // 현재 설정 가져오기
    const settings = this.settingsService.getSettings();
    
    // 활성 모드 가져오기
    const activeTab = popupElement.querySelector('.mode-tab.active');
    const mode = activeTab?.getAttribute('data-mode') as CardSetSourceMode || CardSetSourceMode.FOLDER;
    
    // 카드셋 고정 여부
    const fixedCardset = popupElement.querySelector('#fixed-cardset') as HTMLInputElement;
    const isFixed = fixedCardset?.checked || false;
    
    // 모드별 설정 적용
    if (mode === CardSetSourceMode.FOLDER) {
      // 폴더 모드 설정
      const folderSelect = popupElement.querySelector('#folder-select') as HTMLSelectElement;
      const selectedFolder = folderSelect?.value || '';
      
      // 하위 폴더 포함 여부
      const includeSubfolders = (popupElement.querySelector('#include-subfolders') as HTMLInputElement)?.checked || false;
      
      // 설정 업데이트
      this.settingsService.updateSettings({
        ...settings,
        cardSetSourceMode: CardSetSourceMode.FOLDER,
        selectedFolder,
        includeSubfolders,
        isCardSetFixed: isFixed
      });
      
      // 이벤트 발생
      this.eventBus.emit(EventType.CARDSET_SOURCE_CHANGED, {
        mode: CardSetSourceMode.FOLDER,
        isFixed,
        selectedFolder,
        includeSubfolders
      });
    } else {
      // 태그 모드 설정
      const tagCheckboxes = popupElement.querySelectorAll('.tag-checkbox:checked');
      const selectedTags: string[] = [];
      
      tagCheckboxes.forEach(checkbox => {
        const value = (checkbox as HTMLInputElement).value;
        if (value) {
          selectedTags.push(value);
        }
      });
      
      // 대소문자 구분 여부
      const tagCaseSensitive = (popupElement.querySelector('#tag-case-sensitive') as HTMLInputElement)?.checked || false;
      
      // 설정 업데이트
      this.settingsService.updateSettings({
        ...settings,
        cardSetSourceMode: CardSetSourceMode.TAG,
        selectedTags,
        tagCaseSensitive,
        isCardSetFixed: isFixed
      });
      
      // 이벤트 발생
      this.eventBus.emit(EventType.CARDSET_SOURCE_CHANGED, {
        mode: CardSetSourceMode.TAG,
        isFixed,
        selectedTags,
        tagCaseSensitive
      });
    }
    
    // 팝업 닫기
    this.closePopup();
  }
  
  /**
   * 팝업 닫기
   */
  private closePopup(): void {
    // 툴바 서비스를 통해 팝업 닫기
    this.toolbarService.closePopup(this.popupId);
  }
} 