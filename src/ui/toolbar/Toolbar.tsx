import React, { useState, useEffect, useRef } from 'react';
import ModeToggle from './ModeToggle';
import SortDropdown from './SortDropdown';
import { ICardNavigatorService } from '../../application/CardNavigatorService';
import { SortType, SortDirection } from '../../domain/sorting/Sort';
import SettingsModal from '../settings/SettingsModal';
import { App, SuggestModal, setIcon } from 'obsidian';
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

  /**
   * 카드셋 로드
   */
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
    toggleSearchMode();
  };

  return (
    <div className={`card-navigator-toolbar ${isCardSetFixed ? 'fixed' : ''}`}>
      <div className="card-navigator-toolbar-left">
        <ModeToggle
          currentMode={currentMode}
          onModeChange={onModeChange}
          service={service}
        />
        <button
          className="card-navigator-cardset-button"
          onClick={openCardSetModal}
          aria-label="카드셋 선택"
        >
          <span className="card-navigator-cardset-icon" ref={el => {
            if (el) setIcon(el, currentMode === 'tag' ? 'card-navigator-tag' : 'card-navigator-folder');
          }}></span>
          <span className="card-navigator-cardset-name">
            {getDisplayCardSetName()}
          </span>
        </button>
        <button
          className={`card-navigator-lock-button ${isCardSetFixed ? 'active' : ''}`}
          onClick={handleCardSetFixedToggle}
          aria-label={isCardSetFixed ? '고정 해제' : '고정'}
        >
          <span className="card-navigator-lock-icon" ref={el => {
            if (el) setIcon(el, isCardSetFixed ? 'card-navigator-lock' : 'card-navigator-unlock');
          }}></span>
        </button>
      </div>
      <div className="card-navigator-toolbar-center">
        {/* 검색바는 CardNavigatorView에서 직접 렌더링됩니다 */}
      </div>
      <div className="card-navigator-toolbar-right">
        <button
          className={`card-navigator-search-icon-button ${showSearchBar ? 'active' : ''}`}
          onClick={handleSearchIconClick}
          aria-label="검색"
        >
          <span className="card-navigator-search-icon" ref={el => {
            if (el) setIcon(el, 'card-navigator-search');
          }}></span>
        </button>
        <SortDropdown
          onSortChange={onSortChange}
          service={service}
        />
        <button
          className="card-navigator-settings-button"
          onClick={() => setIsSettingsModalOpen(true)}
          aria-label="설정"
        >
          <span className="card-navigator-settings-icon" ref={el => {
            if (el) setIcon(el, 'card-navigator-settings');
          }}></span>
        </button>
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