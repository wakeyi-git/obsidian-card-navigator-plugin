import React, { useState, useEffect } from 'react';
import CardSetSourceToggle from './CardSetToggle';
import SortDropdown from './SortDropdown';
import { ICardNavigatorService } from '../../application/CardNavigatorService';
import { SortType, SortDirection } from '../../domain/sorting/Sort';
import SettingsModal from '../settings/SettingsModal';
import { App, SuggestModal, TFile, Notice } from 'obsidian';
import { CardSetSourceType } from '../../domain/cardset/CardSet';
import { SearchBar } from './SearchBar';
import './Toolbar.css';

/**
 * 툴바 컴포넌트 속성 인터페이스
 */
export interface IToolbarProps {
  onCardSetSourceChange: (cardSetSource: CardSetSourceType) => void;
  currentCardSetSource: CardSetSourceType;
  onSortChange?: (sortType: SortType, sortDirection: SortDirection) => void;
  onLayoutChange?: (layout: 'grid' | 'masonry') => void;
  onCardSetSelect?: (cardSet: string, isFixed: boolean) => void;
  onIncludeSubfoldersChange?: (include: boolean) => void;
  onPresetApply?: (presetId: string) => void;
  onPresetSave?: () => void;
  onPresetDelete?: (presetId: string) => void;
  service: ICardNavigatorService | null;
  
  // 추가 속성
  layout?: 'grid' | 'masonry';
  isCardSetFixed?: boolean;
  includeSubfolders?: boolean;
  currentSortType?: SortType;
  currentSortDirection?: SortDirection;
  
  // 이전 속성 (선택적으로 변경)
  app?: App;
  cardSet?: string;
  cardSets?: {
    folders: string[];
    tags: string[];
  };
  isFixed?: boolean;
  onCardSetSourceToggle?: () => void;
  onSearch?: (query: string, type: string) => void;
  isSearchCardSetSource?: boolean;
  toggleSearchCardSetSource?: () => void;
  currentLayout?: 'grid' | 'masonry';
}

/**
 * 폴더 선택 모달
 */
class FolderSuggestModal extends SuggestModal<string> {
  private folders: string[];
  private onSelect: (folder: string, isFixed: boolean) => void;
  private currentFolder = '';

  constructor(app: App, folders: string[], onSelect: (folder: string, isFixed: boolean) => void) {
    super(app);
    this.folders = folders;
    this.onSelect = onSelect;
  }

  getSuggestions(query: string): string[] {
    // 현재 폴더가 있고 검색어가 비어있으면 현재 폴더를 맨 앞에 표시
    if (this.currentFolder && !query) {
      const otherFolders = this.folders.filter(folder => folder !== this.currentFolder);
      return [this.currentFolder, ...otherFolders];
    }
    
    return this.folders.filter(folder => 
      folder.toLowerCase().includes(query.toLowerCase())
    );
  }

  renderSuggestion(folder: string, el: HTMLElement): void {
    // 현재 선택된 폴더인 경우 강조 표시
    if (folder === this.currentFolder) {
      el.createEl('div', { text: folder, cls: 'card-navigator-current-selection' });
    } else {
      el.createEl('div', { text: folder });
    }
  }

  onChooseSuggestion(folder: string, evt: MouseEvent | KeyboardEvent): void {
    this.onSelect(folder, true);
  }

  setCurrentFolder(folder: string) {
    console.log(`[FolderSuggestModal] 현재 폴더 설정: ${folder}`);
    this.currentFolder = folder;
    
    // 현재 폴더가 폴더 목록에 없으면 추가
    if (folder && !this.folders.includes(folder)) {
      this.folders = [folder, ...this.folders];
    }
  }
}

/**
 * 태그 선택 모달
 */
class TagSuggestModal extends SuggestModal<string> {
  private tags: string[];
  private onSelect: (tag: string, isFixed: boolean) => void;
  private currentTag = '';

  constructor(app: App, tags: string[], onSelect: (tag: string, isFixed: boolean) => void) {
    super(app);
    this.tags = tags;
    this.onSelect = onSelect;
  }

  getSuggestions(query: string): string[] {
    // 현재 태그가 있고 검색어가 비어있으면 현재 태그를 맨 앞에 표시
    if (this.currentTag && !query) {
      const otherTags = this.tags.filter(tag => tag !== this.currentTag);
      return [this.currentTag, ...otherTags];
    }
    
    return this.tags.filter(tag => 
      tag.toLowerCase().includes(query.toLowerCase())
    );
  }

  renderSuggestion(tag: string, el: HTMLElement): void {
    // 현재 선택된 태그인 경우 강조 표시
    if (tag === this.currentTag) {
      el.createEl('div', { text: tag, cls: 'card-navigator-current-selection' });
    } else {
      el.createEl('div', { text: tag });
    }
  }

  onChooseSuggestion(tag: string, evt: MouseEvent | KeyboardEvent): void {
    this.onSelect(tag, true);
  }

  setCurrentTag(tag: string) {
    console.log(`[TagSuggestModal] 현재 태그 설정: ${tag}`);
    this.currentTag = tag;
    
    // 현재 태그가 태그 목록에 없으면 추가
    if (tag && !this.tags.includes(tag)) {
      this.tags = [tag, ...this.tags];
    }
  }
}

/**
 * 툴바 컴포넌트
 * 검색, 모드 전환, 정렬, 레이아웃 변경 등의 컨트롤을 제공합니다.
 */
const Toolbar: React.FC<IToolbarProps> = ({
  onCardSetSourceChange,
  currentCardSetSource,
  onSortChange = () => {},
  onLayoutChange = () => {},
  onCardSetSelect = () => {},
  onIncludeSubfoldersChange = () => {},
  onPresetApply = () => {},
  onPresetSave = () => {},
  onPresetDelete = () => {},
  service,
  
  // 추가 속성
  layout = 'grid',
  isCardSetFixed: propIsCardSetFixed = false,
  includeSubfolders: propIncludeSubfolders = true,
  currentSortType = 'filename',
  currentSortDirection = 'asc',
  
  // 이전 속성
  app,
  cardSet = '',
  cardSets = { folders: [], tags: [] },
  isFixed = false,
  onCardSetSourceToggle = () => {},
  onSearch = () => {},
  isSearchCardSetSource = false,
  toggleSearchCardSetSource = () => {},
  currentLayout = 'grid'
}) => {
  const [availableCardSets, setAvailableCardSets] = useState<string[]>([]);
  const [isCardSetFixed, setIsCardSetFixed] = useState<boolean>(propIsCardSetFixed);
  const [includeSubfolders, setIncludeSubfolders] = useState<boolean>(propIncludeSubfolders);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [showSearchBar, setShowSearchBar] = useState(isSearchCardSetSource);
  const [showSubfolderToggle, setShowSubfolderToggle] = useState(false);

  // propIncludeSubfolders props가 변경될 때 includeSubfolders 상태 업데이트
  useEffect(() => {
    setIncludeSubfolders(propIncludeSubfolders);
    console.log(`[Toolbar] propIncludeSubfolders props 변경: ${propIncludeSubfolders}`);
  }, [propIncludeSubfolders]);

  // propIsCardSetFixed props가 변경될 때 isCardSetFixed 상태 업데이트
  useEffect(() => {
    setIsCardSetFixed(propIsCardSetFixed);
    console.log(`[Toolbar] propIsCardSetFixed props 변경: ${propIsCardSetFixed}`);
  }, [propIsCardSetFixed]);

  // cardSet props가 변경될 때 로그 출력
  useEffect(() => {
    console.log(`[Toolbar] cardSet props 변경: ${cardSet}`);
  }, [cardSet]);

  // isSearchCardSetSource 상태가 변경될 때 showSearchBar 상태 업데이트
  useEffect(() => {
    setShowSearchBar(isSearchCardSetSource);
  }, [isSearchCardSetSource]);

  // 현재 모드가 폴더 모드일 때만 하위 폴더 토글 표시
  useEffect(() => {
    setShowSubfolderToggle(currentCardSetSource === 'folder');
  }, [currentCardSetSource]);

  // 카드셋 로드
  useEffect(() => {
    const loadCardSets = async () => {
      if (service) {
        try {
          // 서비스에서 카드셋 목록 가져오기
          const cardSetSourceService = service.getCardSetSourceService();
          const sets = await cardSetSourceService.getCardSets();
          setAvailableCardSets(sets);
        } catch (error) {
          console.error('카드 세트 로드 중 오류 발생:', error);
        }
      }
    };
    
    loadCardSets();
  }, [service, currentCardSetSource]);

  // 컴포넌트 마운트 및 props 변경 시 로깅
  useEffect(() => {
    console.log(`[Toolbar] 컴포넌트 마운트/업데이트: cardSet=${cardSet}, currentCardSetSource=${currentCardSetSource}, isCardSetFixed=${isCardSetFixed}`);
  }, [cardSet, currentCardSetSource, isCardSetFixed]);

  /**
   * 카드셋 선택 모달 열기
   */
  const openCardSetModal = () => {
    console.log(`[Toolbar] 카드셋 선택 모달 열기: 현재 모드=${currentCardSetSource}`);
    console.log(`[Toolbar] 사용 가능한 카드셋:`, availableCardSets);
    
    // App 객체 가져오기 (props에서 직접 또는 service에서)
    const obsidianApp = app || (service ? service.getApp() : null);
    
    if (!obsidianApp) {
      console.error('[Toolbar] App 객체를 가져올 수 없습니다.');
      return;
    }
    
    // 현재 카드셋 가져오기
    let currentCardSet = '';
    if (service) {
      const cardSetSourceService = service.getCardSetSourceService();
      currentCardSet = cardSetSourceService.getCurrentCardSet() || '';
      console.log(`[Toolbar] 현재 카드셋: ${currentCardSet}`);
    }
    
    // 모드에 따라 다른 모달 열기
    if (currentCardSetSource === 'folder') {
      // 폴더 선택 모달
      const modal = new FolderSuggestModal(
        obsidianApp,
        availableCardSets,
        (folder) => {
          console.log(`[Toolbar] 폴더 선택: ${folder}`);
          onCardSetSelect(folder, isCardSetFixed);
        }
      );
      
      // 현재 폴더 설정
      modal.setCurrentFolder(currentCardSet);
      
      // 모달 열기
      modal.open();
    } else if (currentCardSetSource === 'tag') {
      // 태그 선택 모달
      const modal = new TagSuggestModal(
        obsidianApp,
        availableCardSets,
        (tag, isFixed) => {
          console.log(`[Toolbar] 태그 선택: ${tag}, 고정: ${isFixed}`);
          onCardSetSelect(tag, isCardSetFixed);
        }
      );
      
      // 현재 태그 설정
      modal.setCurrentTag(currentCardSet);
      
      // 모달 열기
      modal.open();
    }
  };

  /**
   * 모드 변경 처리
   * @param newCardSetSource 새 모드
   */
  const handleCardSetSourceChange = (newCardSetSource: CardSetSourceType) => {
    console.log(`[Toolbar] 카드셋 소스 변경: ${currentCardSetSource} -> ${newCardSetSource}`);
    
    try {
      // 상태 업데이트
      if (service) {
        // 서비스를 통해 설정 업데이트
        service.updateSettings({
          defaultCardSetSource: newCardSetSource
        });
      }
      
      // 콜백 호출
      onCardSetSourceChange(newCardSetSource);
    } catch (error) {
      console.error('카드셋 소스 변경 중 오류 발생:', error);
    }
  };

  /**
   * 카드셋 고정 상태 토글
   */
  const handleCardSetFixedToggle = async () => {
    console.log(`[Toolbar] 카드셋 고정 여부 토글: ${!isCardSetFixed}`);
    
    try {
      // 상태 업데이트
      setIsCardSetFixed(!isCardSetFixed);
      
      // 서비스를 통해 설정 업데이트
      if (service) {
        await service.updateSettings({
          isCardSetFixed: !isCardSetFixed
        });
        
        // 현재 카드셋이 있는 경우 카드셋 선택 함수 호출
        if (cardSet) {
          // 카드셋 소스 서비스를 통해 카드셋 선택 상태 업데이트
          await service.selectCardSet(cardSet, !isCardSetFixed);
          
          // 콜백 호출
          onCardSetSelect(cardSet, !isCardSetFixed);
        }
      }
    } catch (error) {
      console.error('카드셋 고정 여부 변경 중 오류 발생:', error);
      // 오류 발생 시 상태 복원
      setIsCardSetFixed(isCardSetFixed);
    }
  };

  /**
   * 하위 폴더 포함 여부 토글
   */
  const handleIncludeSubfoldersToggle = () => {
    console.log(`[Toolbar] 하위 폴더 포함 여부 토글: ${!includeSubfolders}`);
    
    try {
      // 상태 업데이트
      setIncludeSubfolders(!includeSubfolders);
      
      // 서비스를 통해 설정 업데이트
      if (service) {
        service.updateSettings({
          includeSubfolders: !includeSubfolders
        });
      }
      
      // 콜백 호출
      onIncludeSubfoldersChange(!includeSubfolders);
    } catch (error) {
      console.error('하위 폴더 포함 여부 변경 중 오류 발생:', error);
      // 오류 발생 시 상태 복원
      setIncludeSubfolders(includeSubfolders);
    }
  };

  // 카드셋 표시 이름 가져오기
  const getDisplayCardSetName = () => {
    // 검색 모드인 경우 '검색 결과' 표시
    if (showSearchBar) {
      return '검색 결과';
    }
    
    // 서비스에서 현재 카드 세트 가져오기
    if (service) {
      try {
        const cardSetSourceService = service.getCardSetSourceService();
        
        // 모드 서비스가 초기화되었는지 확인
        if (!cardSetSourceService) {
          console.log('[Toolbar] 모드 서비스가 아직 초기화되지 않았습니다.');
          return currentCardSetSource === 'folder' ? '폴더 선택' : '태그 선택';
        }
        
        const currentCardSet = cardSetSourceService.getCurrentCardSet();
        const isFixed = cardSetSourceService.isCardSetFixed();
        
        console.log(`[Toolbar] 현재 카드셋 정보: ${currentCardSet}, 소스: ${currentCardSetSource}, 고정: ${isFixed}`);
        
        // 현재 카드 세트가 있으면 사용
        if (currentCardSet) {
          // 고정 여부에 따라 아이콘 추가
          const fixedPrefix = isFixed ? '📌 ' : '';
          
          // 태그 모드에서 # 제거
          if (currentCardSetSource === 'tag' && currentCardSet.startsWith('#')) {
            return fixedPrefix + currentCardSet.substring(1);
          }
          // 폴더 모드에서 루트 폴더 표시 개선
          else if (currentCardSetSource === 'folder' && currentCardSet === '/') {
            return fixedPrefix + '루트 폴더';
          }
          // 폴더 모드에서 마지막 폴더 이름만 표시
          else if (currentCardSetSource === 'folder' && currentCardSet.includes('/')) {
            const folderName = currentCardSet.split('/').pop() || currentCardSet;
            return fixedPrefix + folderName;
          }
          else {
            return fixedPrefix + currentCardSet;
          }
        }
      } catch (error) {
        console.error('[Toolbar] 카드 세트 이름 가져오기 중 오류 발생:', error);
      }
    }
    
    // 실제 사용할 카드셋 값 결정
    if (!cardSet) {
      return currentCardSetSource === 'folder' ? '폴더 선택' : '태그 선택';
    }
    
    // 태그 모드에서 # 제거
    if (currentCardSetSource === 'tag' && cardSet.startsWith('#')) {
      return cardSet.substring(1);
    }
    // 폴더 모드에서 루트 폴더 표시 개선
    else if (currentCardSetSource === 'folder' && cardSet === '/') {
      return '루트 폴더';
    }
    else {
      return cardSet;
    }
  };

  /**
   * 검색 아이콘 클릭 처리
   */
  const handleSearchIconClick = () => {
    console.log(`[Toolbar] 검색 아이콘 클릭`);
    
    // 검색 모드 토글
    setShowSearchBar(!showSearchBar);
    
    // 검색 모드 토글 콜백 호출
    if (toggleSearchCardSetSource) {
      toggleSearchCardSetSource();
    }
    
    // 검색바에 포커스
    if (!showSearchBar) {
      setTimeout(() => {
        const searchInput = document.querySelector('.card-navigator-search-input') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      }, 100);
    }
  };

  return (
    <div className="card-navigator-toolbar-container">
      <div className={`card-navigator-toolbar ${isCardSetFixed ? 'fixed' : ''}`}>
        <div className="card-navigator-toolbar-left">
          <CardSetSourceToggle
            currentCardSetSource={currentCardSetSource}
            onCardSetSourceChange={handleCardSetSourceChange}
            service={service}
          />
          
          <div className="card-navigator-cardset-selector">
            <button
              className={`card-navigator-cardset-button ${isCardSetFixed ? 'card-navigator-fixed-cardset' : 'card-navigator-active-cardset'}`}
              onClick={openCardSetModal}
              aria-label="카드셋 선택"
              title={isCardSetFixed ? "고정된 카드셋" : "활성 카드셋"}
            >
              <div 
                className="card-navigator-cardset-icon-container"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCardSetFixedToggle();
                }}
                title={isCardSetFixed ? "고정 해제" : "고정"}
              >
                {isCardSetFixed ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-lock card-navigator-lock-icon">
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-unlock card-navigator-lock-icon">
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 9.9-1"></path>
                  </svg>
                )}
              </div>
              <span className={`card-navigator-cardset-name ${isCardSetFixed ? 'card-navigator-fixed-cardset-name' : ''}`}>
                {getDisplayCardSetName()}
              </span>
            </button>
          </div>
          
          {showSubfolderToggle && (
            <div 
              className={`card-navigator-subfolder-toggle ${includeSubfolders ? 'active' : ''}`}
              onClick={handleIncludeSubfoldersToggle}
              title={includeSubfolders ? "하위 폴더 포함" : "하위 폴더 제외"}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-folder-tree">
                <path d="M20 10a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-2.5a1 1 0 0 1-.8-.4l-.9-1.2A1 1 0 0 0 15 3h-2a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1Z"/>
                <path d="M20 21a1 1 0 0 0 1-1v-3a1 1 0 0 0-1-1h-2.9a1 1 0 0 1-.88-.55l-.42-.85a1 1 0 0 0-.92-.6H13a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1Z"/>
                <path d="M3 5a2 2 0 0 0 2 2h3"/>
                <path d="M3 3v13a2 2 0 0 0 2 2h3"/>
              </svg>
            </div>
          )}
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
            currentSortType={currentSortType}
            currentSortDirection={currentSortDirection}
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
      </div>
      
      {showSearchBar && (
        <div className="card-navigator-search-container">
          <SearchBar 
            onSearch={(query: string, type?: string) => {
              if (onSearch) {
                onSearch(query, type || '');
              }
            }}
            service={service}
          />
        </div>
      )}
      
      {isSettingsModalOpen && service && (
        <SettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          plugin={service.getPlugin()}
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