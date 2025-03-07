import React, { useState, useEffect } from 'react';
import ModeToggle from './ModeToggle';
import SortDropdown from './SortDropdown';
import { ICardNavigatorService } from '../../application/CardNavigatorService';
import { SortType, SortDirection } from '../../domain/sorting/Sort';
import SettingsModal from '../settings/SettingsModal';
import { App, SuggestModal } from 'obsidian';
import { ModeType } from '../../domain/mode/Mode';
import { SearchBar } from './SearchBar';
import './Toolbar.css';

/**
 * 툴바 컴포넌트 속성 인터페이스
 */
export interface IToolbarProps {
  onModeChange: (mode: ModeType) => void;
  currentMode: ModeType;
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
  cardSet: string;
  cardSets: {
    folders: string[];
    tags: string[];
  };
  isFixed: boolean;
  onModeToggle: () => void;
  onSearch: (query: string, type: string) => void;
  isSearchMode: boolean;
  toggleSearchMode: () => void;
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
  cardSet,
  cardSets,
  isFixed,
  onModeToggle,
  onSearch,
  isSearchMode,
  toggleSearchMode,
}) => {
  const [availableCardSets, setAvailableCardSets] = useState<string[]>([]);
  const [selectedCardSet, setSelectedCardSet] = useState<string>('');
  const [isCardSetFixed, setIsCardSetFixed] = useState<boolean>(false);
  const [includeSubfolders, setIncludeSubfolders] = useState<boolean>(true);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [showSearchBar, setShowSearchBar] = useState(isSearchMode);

  // 카드셋 로드
  useEffect(() => {
    const loadCardSets = async () => {
      if (service) {
        try {
          // 서비스에서 카드셋 목록 가져오기
          const modeService = service.getModeService();
          const sets = await modeService.getCardSets();
          setAvailableCardSets(sets);
          
          // 현재 선택된 카드셋 가져오기
          const currentSet = await modeService.getCurrentCardSet();
          if (currentSet) {
            setSelectedCardSet(currentSet);
            setIsCardSetFixed(modeService.isCardSetFixed());
          } else if (sets.length > 0) {
            setSelectedCardSet(sets[0]);
            setIsCardSetFixed(false);
          }
        } catch (error) {
          console.error('카드 세트 로드 중 오류 발생:', error);
        }
      }
    };
    
    loadCardSets();
  }, [service, currentMode]);

  useEffect(() => {
    setShowSearchBar(isSearchMode);
  }, [isSearchMode]);

  // 카드 세트 선택 처리
  const handleCardSetSelectInternal = async (cardSet: string) => {
    setSelectedCardSet(cardSet);
    await onCardSetSelect(cardSet, isCardSetFixed);
    return cardSet;
  };

  // 카드셋 고정 토글
  const handleCardSetFixedToggle = async () => {
    const newFixedState = !isCardSetFixed;
    setIsCardSetFixed(newFixedState);
    await onCardSetSelect(selectedCardSet, newFixedState);
  };

  // 카드셋 표시 이름 가져오기
  const getDisplayCardSetName = () => {
    if (!selectedCardSet) {
      return currentMode === 'folder' ? '폴더 선택' : '태그 선택';
    }
    
    if (currentMode === 'tag' && selectedCardSet.startsWith('#')) {
      return selectedCardSet.substring(1);
    }
    
    return selectedCardSet;
  };

  // 카드셋 선택 모달 열기
  const openCardSetModal = () => {
    if (currentMode === 'folder') {
      new FolderSuggestModal(app, availableCardSets, handleCardSetSelectInternal).open();
    } else if (currentMode === 'tag') {
      new TagSuggestModal(app, availableCardSets, handleCardSetSelectInternal).open();
    }
  };

  /**
   * 검색 아이콘 클릭 핸들러
   */
  const handleSearchIconClick = () => {
    try {
      // 검색 모드 토글
      toggleSearchMode();
      
      // 검색 모드 상태 변경 후 약간의 지연을 두고 검색 입력 필드에 포커스
      setTimeout(() => {
        const searchInput = document.querySelector('.card-navigator-search-input') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      }, 100);
    } catch (error) {
      console.error('[Toolbar] 검색 아이콘 클릭 처리 중 오류 발생:', error);
    }
  };

  return (
    <div className={`card-navigator-toolbar ${isCardSetFixed ? 'fixed' : ''}`}>
      <div className="card-navigator-toolbar-left">
        <ModeToggle
          currentMode={currentMode}
          onModeChange={onModeChange}
          service={service}
        />
        <div className="card-navigator-cardset-selector">
          <button
            className="card-navigator-cardset-button"
            onClick={openCardSetModal}
            aria-label="카드셋 선택"
          >
            {currentMode === 'folder' ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-folder card-navigator-cardset-icon">
                <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"></path>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-tag card-navigator-cardset-icon">
                <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"></path>
                <path d="M7 7h.01"></path>
              </svg>
            )}
            <span className="card-navigator-cardset-name">
              {getDisplayCardSetName()}
            </span>
          </button>
        </div>
        <div
          className={`clickable-icon card-navigator-icon card-navigator-lock-button ${isCardSetFixed ? 'active' : ''}`}
          onClick={handleCardSetFixedToggle}
          aria-label={isCardSetFixed ? '고정 해제' : '고정'}
          title={isCardSetFixed ? '고정 해제' : '고정'}
        >
          {isCardSetFixed ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-lock">
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-unlock">
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 9.9-1"></path>
            </svg>
          )}
        </div>
      </div>
      <div className="card-navigator-toolbar-center">
        {/* 검색바는 CardNavigatorView에서 직접 렌더링됩니다 */}
      </div>
      <div className="card-navigator-toolbar-right">
        <div
          className={`clickable-icon card-navigator-icon card-navigator-search-icon-button ${showSearchBar ? 'active' : ''}`}
          onClick={handleSearchIconClick}
          aria-label="검색"
          title="검색"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-search">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.3-4.3"></path>
          </svg>
        </div>
        <SortDropdown
          onSortChange={onSortChange}
          service={service}
        />
        <div
          className="clickable-icon card-navigator-icon card-navigator-settings-button"
          onClick={() => setIsSettingsModalOpen(true)}
          aria-label="설정"
          title="설정"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-settings">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
        </div>
      </div>
      
      {isSettingsModalOpen && (
        <SettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          service={service}
          onLayoutChange={onLayoutChange}
          currentLayout={currentLayout}
          onPresetApply={onPresetApply}
          onPresetSave={onPresetSave}
          onPresetDelete={onPresetDelete}
        />
      )}
    </div>
  );
};

export default Toolbar; 