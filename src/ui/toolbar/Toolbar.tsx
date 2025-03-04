import React, { useState, useEffect } from 'react';
import SearchBar from './SearchBar';
import ModeToggle from './ModeToggle';
import SortDropdown from './SortDropdown';
import { ICardNavigatorService } from '../../application/CardNavigatorService';
import { SortType, SortDirection } from '../../domain/sorting/Sort';
import LayoutToggle from '../layout/LayoutToggle';
import PresetSelector from '../presets/PresetSelector';
import SettingsModal from '../settings/SettingsModal';
import { SearchType } from '../../domain/search/Search';
import { App, SuggestModal } from 'obsidian';

/**
 * 툴바 컴포넌트 속성 인터페이스
 */
export interface IToolbarProps {
  onSearch: (query: string) => void;
  onSearchTypeChange?: (type: SearchType, frontmatterKey?: string) => void;
  onCaseSensitiveChange?: (caseSensitive: boolean) => void;
  onModeChange: (mode: 'folder' | 'tag') => void;
  currentMode: 'folder' | 'tag';
  onSortChange?: (sortType: SortType, sortDirection: SortDirection) => void;
  onLayoutChange?: (layout: 'grid' | 'masonry') => void;
  onCardSetSelect?: (cardSet: string, isFixed: boolean) => void;
  onIncludeSubfoldersChange?: (include: boolean) => void;
  onPresetApply?: (presetId: string) => void;
  onPresetSave?: () => void;
  onPresetDelete?: (presetId: string) => void;
  currentLayout: 'grid' | 'masonry';
  service: ICardNavigatorService | null;
  app: App;
}

/**
 * 폴더 선택 모달
 */
class FolderSuggestModal extends SuggestModal<string> {
  private folders: string[];
  private onSelect: (folder: string) => void;

  constructor(app: App, folders: string[], onSelect: (folder: string) => void) {
    super(app);
    this.folders = folders;
    this.onSelect = onSelect;
  }

  getSuggestions(query: string): string[] {
    return this.folders.filter(folder => 
      folder.toLowerCase().includes(query.toLowerCase())
    );
  }

  renderSuggestion(folder: string, el: HTMLElement): void {
    el.setText(folder);
  }

  onChooseSuggestion(folder: string, evt: MouseEvent | KeyboardEvent): void {
    this.onSelect(folder);
  }
}

/**
 * 태그 선택 모달
 */
class TagSuggestModal extends SuggestModal<string> {
  private tags: string[];
  private onSelect: (tag: string) => void;

  constructor(app: App, tags: string[], onSelect: (tag: string) => void) {
    super(app);
    this.tags = tags;
    this.onSelect = onSelect;
  }

  getSuggestions(query: string): string[] {
    return this.tags.filter(tag => 
      tag.toLowerCase().includes(query.toLowerCase())
    );
  }

  renderSuggestion(tag: string, el: HTMLElement): void {
    el.setText(tag);
  }

  onChooseSuggestion(tag: string, evt: MouseEvent | KeyboardEvent): void {
    this.onSelect(tag);
  }
}

/**
 * 툴바 컴포넌트
 * 검색, 모드 전환, 정렬, 레이아웃 변경 등의 컨트롤을 제공합니다.
 */
const Toolbar: React.FC<IToolbarProps> = ({
  onSearch,
  onSearchTypeChange = () => {},
  onCaseSensitiveChange = () => {},
  onModeChange,
  currentMode,
  onSortChange = () => {},
  onLayoutChange = () => {},
  onCardSetSelect = () => {},
  onIncludeSubfoldersChange = () => {},
  onPresetApply = () => {},
  onPresetSave = () => {},
  onPresetDelete = () => {},
  currentLayout = 'grid',
  service,
  app,
}) => {
  const [cardSets, setCardSets] = useState<string[]>([]);
  const [selectedCardSet, setSelectedCardSet] = useState<string>('');
  const [isCardSetFixed, setIsCardSetFixed] = useState<boolean>(false);
  const [includeSubfolders, setIncludeSubfolders] = useState<boolean>(true);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // 카드 세트 로드
  useEffect(() => {
    const loadCardSets = async () => {
      if (service) {
        try {
          const modeService = service.getModeService();
          const sets = await modeService.getCardSets();
          setCardSets(sets);
          
          // 현재 선택된 카드 세트 가져오기
          const currentSet = await modeService.getCurrentCardSet();
          if (currentSet) {
            setSelectedCardSet(currentSet);
          }
          
          // 카드 세트 고정 여부 가져오기
          setIsCardSetFixed(modeService.isCardSetFixed());
          
          // 하위 폴더 포함 여부 가져오기
          setIncludeSubfolders(modeService.getIncludeSubfolders());
        } catch (error) {
          console.error('카드 세트 로드 중 오류 발생:', error);
        }
      }
    };

    loadCardSets();
  }, [service, currentMode]);

  // 카드 세트 선택 처리
  const handleCardSetSelect = (cardSet: string) => {
    console.log(`[Toolbar] 카드 세트 선택: ${cardSet}, 고정 상태: ${isCardSetFixed}`);
    setSelectedCardSet(cardSet);
    onCardSetSelect(cardSet, isCardSetFixed);
  };

  // 카드 세트 고정 여부 변경 처리
  const handleCardSetFixedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isFixed = e.target.checked;
    console.log(`[Toolbar] 카드 세트 고정 상태 변경: ${isFixed}, 현재 카드 세트: ${selectedCardSet}`);
    setIsCardSetFixed(isFixed);
    onCardSetSelect(selectedCardSet, isFixed);
  };

  // 하위 폴더 포함 여부 변경 처리
  const handleIncludeSubfoldersChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const include = e.target.checked;
    console.log('하위 폴더 포함 상태 변경:', include);
    setIncludeSubfolders(include);
    onIncludeSubfoldersChange(include);
  };

  // 폴더/태그 선택 모달 열기
  const openCardSetModal = () => {
    if (!service || !app) return;
    
    const modeService = service.getModeService();
    const currentMode = modeService.getCurrentModeType();
    
    if (currentMode === 'folder') {
      // 폴더 선택 모달 열기
      modeService.getCardSets().then(folders => {
        console.log('사용 가능한 폴더 목록:', folders);
        new FolderSuggestModal(app, folders, handleCardSetSelect).open();
      });
    } else {
      // 태그 선택 모달 열기
      modeService.getCardSets().then(tags => {
        console.log('사용 가능한 태그 목록:', tags);
        new TagSuggestModal(app, tags, handleCardSetSelect).open();
      });
    }
  };

  // 하위 폴더 포함 여부 토글
  const handleIncludeSubfoldersToggle = () => {
    if (!service) return;
    
    const modeService = service.getModeService();
    const newValue = !includeSubfolders;
    modeService.setIncludeSubfolders(newValue);
    setIncludeSubfolders(newValue);
    
    // 상태 정보 콘솔에 출력
    logCardNavigatorStatus(service);
    
    // 변경 이벤트 발생
    onIncludeSubfoldersChange(newValue);
  };
  
  // 카드 세트 고정 여부 토글
  const handleCardSetFixedToggle = () => {
    if (!service) return;
    
    const modeService = service.getModeService();
    const currentCardSet = modeService.getCurrentCardSet();
    
    if (currentCardSet) {
      const newValue = !isCardSetFixed;
      modeService.selectCardSet(currentCardSet, newValue);
      setIsCardSetFixed(newValue);
      
      // 상태 정보 콘솔에 출력
      logCardNavigatorStatus(service);
      
      // 변경 이벤트 발생
      onCardSetSelect(currentCardSet, newValue);
    }
  };
  
  // 카드 네비게이터 상태 정보를 콘솔에 출력하는 함수
  const logCardNavigatorStatus = (service: ICardNavigatorService) => {
    const modeService = service.getModeService();
    const currentMode = modeService.getCurrentModeType();
    const currentCardSet = modeService.getCurrentCardSet() || '/';
    const isCardSetFixed = modeService.isCardSetFixed();
    const includeSubfolders = modeService.getIncludeSubfolders();

    console.log('===== 카드 네비게이터 상태 정보 =====');
    console.log(`현재 모드: ${currentMode === 'folder' ? '폴더 모드' : '태그 모드'}`);
    console.log(`현재 ${currentMode === 'folder' ? '폴더 경로' : '태그'}: ${currentCardSet}`);
    console.log(`카드 세트 고정 여부: ${isCardSetFixed ? '고정됨' : '고정되지 않음'}`);
    console.log(`하위 폴더 포함 여부: ${includeSubfolders ? '포함' : '미포함'}`);
    console.log('===================================');
  };

  return (
    <div className="card-navigator-toolbar">
      <div className="card-navigator-toolbar-left">
        <ModeToggle
          currentMode={currentMode}
          onModeChange={onModeChange}
        />
        
        <SearchBar
          onSearch={onSearch}
          onSearchTypeChange={onSearchTypeChange}
          onCaseSensitiveChange={onCaseSensitiveChange}
          placeholder="카드 검색..."
          service={service}
        />
      </div>
      
      <div className="card-navigator-toolbar-center">
        <div className="card-navigator-cardset-selector">
          <button
            className="card-navigator-cardset-button"
            onClick={openCardSetModal}
            aria-label={currentMode === 'folder' ? '폴더 선택' : '태그 선택'}
          >
            {selectedCardSet || (currentMode === 'folder' ? '폴더 선택' : '태그 선택')}
          </button>
          
          <div className="card-navigator-cardset-options">
            <label className="card-navigator-checkbox-label">
              <input
                type="checkbox"
                checked={isCardSetFixed}
                onChange={handleCardSetFixedChange}
              />
              {currentMode === 'folder' ? '폴더 고정' : '태그 고정'}
            </label>
            
            {currentMode === 'folder' && (
              <label className="card-navigator-checkbox-label">
                <input
                  type="checkbox"
                  checked={includeSubfolders}
                  onChange={handleIncludeSubfoldersChange}
                />
                하위 폴더 포함
              </label>
            )}
          </div>
        </div>
      </div>
      
      <div className="card-navigator-toolbar-right">
        <SortDropdown
          onSortChange={onSortChange}
          service={service}
        />
        
        <LayoutToggle
          onLayoutChange={onLayoutChange}
          currentLayout={currentLayout}
        />
        
        <PresetSelector
          onPresetApply={onPresetApply}
          onPresetSave={onPresetSave}
          onPresetDelete={onPresetDelete}
          service={service}
        />
        
        <button
          className="card-navigator-settings-button"
          onClick={() => setIsSettingsModalOpen(true)}
          aria-label="설정"
        >
          <svg viewBox="0 0 24 24" width="24" height="24">
            <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
          </svg>
        </button>
      </div>
      
      {isSettingsModalOpen && (
        <SettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          service={service}
        />
      )}
    </div>
  );
};

export default Toolbar; 