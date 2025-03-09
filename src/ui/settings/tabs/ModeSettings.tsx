import React, { useEffect, useState } from 'react';
import CardNavigatorPlugin from '../../../main';
import SettingItem from '../components/SettingItem';
import ToggleSwitch from '../components/ToggleSwitch';
import { App, SuggestModal } from 'obsidian';
import { ModeType, CardSetType } from '../../../domain/mode/Mode';
import { SearchScope } from '../../../domain/search/Search';
import { ICardNavigatorService } from '../../../application/CardNavigatorService';

/**
 * 폴더 선택 모달
 */
class FolderSuggestModal extends SuggestModal<string> {
  private folders: string[];
  private onSelect: (folder: string) => void;
  private currentFolder = '';

  constructor(app: App, folders: string[], onSelect: (folder: string) => void) {
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
    this.onSelect(folder);
  }

  setCurrentFolder(folder: string) {
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
  private onSelect: (tag: string) => void;
  private currentTag = '';

  constructor(app: App, tags: string[], onSelect: (tag: string) => void) {
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
    this.onSelect(tag);
  }

  setCurrentTag(tag: string) {
    this.currentTag = tag;
    
    // 현재 태그가 태그 목록에 없으면 추가
    if (tag && !this.tags.includes(tag)) {
      this.tags = [tag, ...this.tags];
    }
  }
}

/**
 * 모드 설정 탭 컴포넌트
 */
const ModeSettings: React.FC<{ plugin: CardNavigatorPlugin }> = ({ plugin }) => {
  const settings = plugin.settings;
  const { 
    defaultMode: initialDefaultMode, 
    defaultCardSet: initialDefaultCardSet, 
    isCardSetFixed: initialIsCardSetFixed, 
    includeSubfolders: initialIncludeSubfolders, 
    priorityTags, 
    priorityFolders,
    tagCaseSensitive: initialTagCaseSensitive,
    defaultSearchScope: initialDefaultSearchScope = 'current'
  } = settings;
  
  // 로컬 상태 관리
  const [defaultMode, setDefaultMode] = useState<ModeType>(initialDefaultMode);
  const [defaultCardSet, setDefaultCardSet] = useState<string>(initialDefaultCardSet || '');
  const [defaultFolderSet, setDefaultFolderSet] = useState<string>('');
  const [defaultTagSet, setDefaultTagSet] = useState<string>('');
  const [isCardSetFixed, setIsCardSetFixed] = useState<boolean>(initialIsCardSetFixed || false);
  const [includeSubfolders, setIncludeSubfolders] = useState<boolean>(initialIncludeSubfolders || false);
  const [tagCaseSensitive, setTagCaseSensitive] = useState<boolean>(initialTagCaseSensitive || false);
  const [defaultSearchScope, setDefaultSearchScope] = useState<SearchScope>(initialDefaultSearchScope || 'all');
  const [searchCaseSensitive, setSearchCaseSensitive] = useState<boolean>(plugin.settings.searchCaseSensitive || false);
  const [highlightSearchResults, setHighlightSearchResults] = useState<boolean>(plugin.settings.highlightSearchResults !== undefined ? plugin.settings.highlightSearchResults : true);
  const [maxSearchResults, setMaxSearchResults] = useState<number>(plugin.settings.maxSearchResults || 100);
  
  const [cardSets, setCardSets] = React.useState<string[]>([]);
  const [folderSets, setFolderSets] = React.useState<string[]>([]);
  const [tagSets, setTagSets] = React.useState<string[]>([]);
  const [selectedCardSetType, setSelectedCardSetType] = React.useState<'active' | 'fixed'>(isCardSetFixed ? 'fixed' : 'active');
  
  // 설정이 변경될 때 로컬 상태 업데이트
  useEffect(() => {
    setDefaultMode(initialDefaultMode);
    setDefaultCardSet(initialDefaultCardSet || '');
    setIsCardSetFixed(initialIsCardSetFixed || false);
    setIncludeSubfolders(initialIncludeSubfolders || false);
    setTagCaseSensitive(initialTagCaseSensitive || false);
    setDefaultSearchScope(initialDefaultSearchScope || 'all');
    setSearchCaseSensitive(plugin.settings.searchCaseSensitive || false);
    setHighlightSearchResults(plugin.settings.highlightSearchResults !== undefined ? plugin.settings.highlightSearchResults : true);
    setMaxSearchResults(plugin.settings.maxSearchResults || 100);
    
    // 모드별 기본 카드 세트 설정
    if (initialDefaultMode === 'folder') {
      setDefaultFolderSet(initialDefaultCardSet || '');
    } else if (initialDefaultMode === 'tag') {
      setDefaultTagSet(initialDefaultCardSet || '');
    }
  }, [
    initialDefaultMode, 
    initialDefaultCardSet, 
    initialIsCardSetFixed, 
    initialIncludeSubfolders, 
    initialTagCaseSensitive, 
    initialDefaultSearchScope,
    plugin.settings.searchCaseSensitive,
    plugin.settings.highlightSearchResults,
    plugin.settings.maxSearchResults
  ]);
  
  // 카드 세트 목록 로드
  React.useEffect(() => {
    const loadCardSets = async () => {
      const service = plugin.getCardNavigatorService();
      if (service) {
        const modeService = service.getModeService();
        
        // 현재 모드 저장
        const currentMode = modeService.getCurrentModeType();
        
        // 폴더 모드로 변경하여 폴더 목록 가져오기
        await service.changeMode('folder');
        const folders = await modeService.getCardSets();
        setFolderSets(folders);
        
        // 태그 모드로 변경하여 태그 목록 가져오기
        await service.changeMode('tag');
        const tags = await modeService.getCardSets();
        setTagSets(tags);
        
        // 원래 모드로 복원
        await service.changeMode(currentMode);
        
        // 현재 모드에 맞는 카드 세트 설정
        if (currentMode === 'folder') {
          setCardSets(folders);
          // 초기 설정에서 폴더 카드 세트 설정
          if (initialDefaultCardSet) {
            setDefaultFolderSet(initialDefaultCardSet);
          }
        } else if (currentMode === 'tag') {
          setCardSets(tags);
          // 초기 설정에서 태그 카드 세트 설정
          if (initialDefaultCardSet) {
            setDefaultTagSet(initialDefaultCardSet);
          }
        }
      }
    };
    
    loadCardSets();
  }, [plugin, initialDefaultCardSet]);
  
  // 모드 변경 시 카드 세트 목록 업데이트
  React.useEffect(() => {
    if (defaultMode === 'folder') {
      setCardSets(folderSets);
      // 폴더 모드로 변경 시 폴더 카드 세트 사용
      if (defaultFolderSet) {
        setDefaultCardSet(defaultFolderSet);
      } else {
        setDefaultCardSet('');
      }
    } else if (defaultMode === 'tag') {
      setCardSets(tagSets);
      // 태그 모드로 변경 시 태그 카드 세트 사용
      if (defaultTagSet) {
        setDefaultCardSet(defaultTagSet);
      } else {
        setDefaultCardSet('');
      }
    }
  }, [defaultMode, folderSets, tagSets, defaultFolderSet, defaultTagSet]);
  
  // 카드 세트 타입 변경 처리
  const handleCardSetTypeChange = (type: 'active' | 'fixed') => {
    setSelectedCardSetType(type);
    setIsCardSetFixed(type === 'fixed');
    onChange('isCardSetFixed', type === 'fixed');
  };
  
  // 폴더/태그 선택 모달 열기
  const openCardSetModal = () => {
    const app = plugin.app;
    
    if (defaultMode === 'folder') {
      // 폴더 선택 모달 열기
      const modal = new FolderSuggestModal(
        app,
        folderSets,
        (folder) => {
          setDefaultFolderSet(folder);
          setDefaultCardSet(folder);
          onChange('defaultCardSet', folder);
        }
      );
      
      // 현재 폴더 설정
      if (defaultFolderSet) {
        modal.setCurrentFolder(defaultFolderSet);
      } else if (defaultCardSet) {
        modal.setCurrentFolder(defaultCardSet);
      }
      
      modal.open();
    } else if (defaultMode === 'tag') {
      // 태그 선택 모달 열기
      const modal = new TagSuggestModal(
        app,
        tagSets,
        (tag) => {
          setDefaultTagSet(tag);
          setDefaultCardSet(tag);
          onChange('defaultCardSet', tag);
        }
      );
      
      // 현재 태그 설정
      if (defaultTagSet) {
        modal.setCurrentTag(defaultTagSet);
      } else if (defaultCardSet) {
        modal.setCurrentTag(defaultCardSet);
      }
      
      modal.open();
    }
  };
  
  // 설정 변경 핸들러
  const onChange = async (key: string, value: any) => {
    // 로컬 상태 업데이트
    switch (key) {
      case 'defaultMode':
        setDefaultMode(value);
        break;
      case 'defaultCardSet':
        setDefaultCardSet(value);
        break;
      case 'isCardSetFixed':
        setIsCardSetFixed(value);
        break;
      case 'includeSubfolders':
        setIncludeSubfolders(value);
        break;
      case 'tagCaseSensitive':
        setTagCaseSensitive(value);
        break;
      case 'defaultSearchScope':
        setDefaultSearchScope(value);
        break;
      case 'searchCaseSensitive':
        setSearchCaseSensitive(value);
        break;
      case 'highlightSearchResults':
        setHighlightSearchResults(value);
        break;
      case 'maxSearchResults':
        setMaxSearchResults(value);
        break;
    }
    
    // 설정 저장
    // @ts-ignore
    plugin.settings[key] = value;
    await plugin.saveSettings();
    
    // 서비스 업데이트
    const service = plugin.getCardNavigatorService();
    if (service) {
      if (key === 'defaultMode') {
        await service.changeMode(value as ModeType);
      } else if (key === 'defaultCardSet') {
        // 카드셋 선택 시 고정 여부도 함께 전달
        const isFixed = plugin.settings.isCardSetFixed || false;
        service.getModeService().selectCardSet(value, isFixed);
      } else if (key === 'isCardSetFixed') {
        const modeService = service.getModeService();
        const currentCardSet = modeService.getCurrentCardSet();
        if (currentCardSet) {
          // 현재 카드셋이 있는 경우에만 고정 상태 변경
          modeService.selectCardSet(currentCardSet, value);
        }
      } else if (key === 'includeSubfolders') {
        service.getModeService().setIncludeSubfolders(value);
      } else if (key === 'tagCaseSensitive') {
        service.getModeService().setTagCaseSensitive(value);
      } else if (key === 'defaultSearchScope') {
        const searchService = service.getSearchService();
        searchService.setSearchScope(value as SearchScope);
      } else if (key === 'searchCaseSensitive') {
        // 검색 대소문자 구분 설정
        if (plugin.settings.searchCaseSensitive !== undefined) {
          plugin.settings.searchCaseSensitive = value;
        }
      } else if (key === 'highlightSearchResults') {
        // 검색 결과 하이라이트 설정
        if (plugin.settings.highlightSearchResults !== undefined) {
          plugin.settings.highlightSearchResults = value;
        }
      } else if (key === 'maxSearchResults') {
        // 검색 결과 최대 개수 설정
        if (plugin.settings.maxSearchResults !== undefined) {
          plugin.settings.maxSearchResults = value;
        }
      }
    }
  };
  
  const handleModeChange = (mode: ModeType) => {
    setDefaultMode(mode);
    
    // 모드에 맞는 카드 세트 설정
    if (mode === 'folder') {
      const folderSet = defaultFolderSet || '';
      setDefaultCardSet(folderSet);
      onChange('defaultCardSet', folderSet);
    } else if (mode === 'tag') {
      const tagSet = defaultTagSet || '';
      setDefaultCardSet(tagSet);
      onChange('defaultCardSet', tagSet);
    } else {
      // 검색 모드인 경우 카드 세트 초기화
      setDefaultCardSet('');
      onChange('defaultCardSet', '');
    }
    
    onChange('defaultMode', mode);
  };

  const renderModeButtons = () => {
    return (
      <div className="card-navigator-mode-toggle">
        <div
          className={`card-navigator-mode-button ${defaultMode === 'folder' ? 'active' : ''}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleModeChange('folder');
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
          </svg>
          <span>폴더</span>
        </div>
        <div
          className={`card-navigator-mode-button ${defaultMode === 'tag' ? 'active' : ''}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleModeChange('tag');
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
            <line x1="7" y1="7" x2="7.01" y2="7"></line>
          </svg>
          <span>태그</span>
        </div>
        <div
          className={`card-navigator-mode-button ${defaultMode === 'search' ? 'active' : ''}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleModeChange('search');
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <span>검색</span>
        </div>
      </div>
    );
  };
  
  return (
    <div className="card-navigator-settings-section">
      <h3>모드 설정</h3>
      <p className="setting-item-description">
        카드 네비게이터가 노트를 표시하는 방식을 설정합니다.
      </p>
      
      <SettingItem label="기본 모드 선택">
        {renderModeButtons()}
      </SettingItem>
      
      <div className="card-navigator-settings-subsection">
        <h4>{defaultMode === 'folder' ? "폴더 모드 설정" : defaultMode === 'tag' ? "태그 모드 설정" : "검색 모드 설정"}</h4>
        
        <SettingItem label={defaultMode === 'folder' ? "폴더 선택 방식" : defaultMode === 'tag' ? "태그 선택 방식" : "검색 방식"}>
          <div className="card-navigator-mode-toggle">
            <button 
              className={`card-navigator-mode-button ${selectedCardSetType === 'active' ? 'active' : ''}`}
              onClick={() => handleCardSetTypeChange('active')}
            >
              <span>{defaultMode === 'folder' ? "활성 폴더" : defaultMode === 'tag' ? "활성 태그" : "활성 검색"}</span>
            </button>
            <button 
              className={`card-navigator-mode-button ${selectedCardSetType === 'fixed' ? 'active' : ''}`}
              onClick={() => handleCardSetTypeChange('fixed')}
            >
              <span>{defaultMode === 'folder' ? "지정 폴더" : defaultMode === 'tag' ? "지정 태그" : "지정 검색"}</span>
            </button>
          </div>
        </SettingItem>
        
        {selectedCardSetType === 'fixed' && (
          <SettingItem 
            label={defaultMode === 'folder' ? "지정 폴더 선택" : defaultMode === 'tag' ? "지정 태그 선택" : "지정 검색 선택"}
            description={defaultMode === 'folder' 
              ? "지정한 폴더의 노트를 표시합니다. 다른 폴더의 노트를 열어도 카드 목록이 변경되지 않습니다." 
              : defaultMode === 'tag' 
                ? "지정한 태그를 포함하는 노트를 표시합니다. 다른 태그의 노트를 열어도 카드 목록이 변경되지 않습니다."
                : "지정한 검색을 포함하는 노트를 표시합니다. 다른 검색의 노트를 열어도 카드 목록이 변경되지 않습니다."}
          >
            <div className="card-navigator-cardset-selector">
              <button
                className="card-navigator-select-button"
                onClick={openCardSetModal}
              >
                {defaultCardSet 
                  ? (defaultMode === 'folder' && defaultCardSet === '/' 
                    ? '루트 폴더' 
                    : defaultCardSet)
                  : `${defaultMode === 'folder' ? '폴더' : defaultMode === 'tag' ? '태그' : '검색'} 선택`}
              </button>
            </div>
          </SettingItem>
        )}
        
        {defaultMode === 'folder' && (
          <>
            <SettingItem 
              label="하위 폴더 포함" 
              description="선택한 폴더의 하위 폴더에 있는 노트도 함께 표시합니다."
            >
              <input
                type="checkbox"
                checked={includeSubfolders}
                onChange={(e) => {
                  setIncludeSubfolders(e.target.checked);
                  onChange('includeSubfolders', e.target.checked);
                }}
              />
            </SettingItem>
          </>
        )}
        
        {defaultMode === 'tag' && (
          <>
            <SettingItem 
              label="태그 대소문자 구분" 
              description="태그 검색 시 대소문자를 구분합니다."
            >
              <input
                type="checkbox"
                checked={tagCaseSensitive}
                onChange={(e) => {
                  setTagCaseSensitive(e.target.checked);
                  onChange('tagCaseSensitive', e.target.checked);
                }}
              />
            </SettingItem>
          </>
        )}
        
        {defaultMode === 'search' && (
          <>
            <SettingItem 
              label="기본 검색 범위" 
              description="검색 시 기본적으로 적용할 검색 범위를 설정합니다."
            >
              <div className="card-navigator-mode-toggle">
                <button 
                  className={`card-navigator-mode-button ${defaultSearchScope === 'current' ? 'active' : ''}`}
                  onClick={() => {
                    setDefaultSearchScope('current');
                    onChange('defaultSearchScope', 'current');
                  }}
                >
                  <span>현재 카드 세트</span>
                </button>
                <button 
                  className={`card-navigator-mode-button ${defaultSearchScope === 'all' ? 'active' : ''}`}
                  onClick={() => {
                    setDefaultSearchScope('all');
                    onChange('defaultSearchScope', 'all');
                  }}
                >
                  <span>볼트 전체</span>
                </button>
              </div>
            </SettingItem>
            
            <SettingItem 
              label="검색 대소문자 구분" 
              description="검색 시 대소문자를 구분할지 여부를 설정합니다."
            >
              <input
                type="checkbox"
                checked={searchCaseSensitive}
                onChange={(e) => {
                  setSearchCaseSensitive(e.target.checked);
                  onChange('searchCaseSensitive', e.target.checked);
                }}
              />
            </SettingItem>
            
            <SettingItem 
              label="검색 결과 하이라이트" 
              description="검색 결과에서 검색어를 하이라이트할지 여부를 설정합니다."
            >
              <input
                type="checkbox"
                checked={highlightSearchResults}
                onChange={(e) => {
                  setHighlightSearchResults(e.target.checked);
                  onChange('highlightSearchResults', e.target.checked);
                }}
              />
            </SettingItem>
            
            <SettingItem 
              label="검색 결과 최대 개수" 
              description="검색 결과로 표시할 최대 카드 개수를 설정합니다."
            >
              <input
                type="number"
                min="10"
                max="1000"
                step="10"
                value={maxSearchResults}
                onChange={(e) => onChange('maxSearchResults', parseInt(e.target.value))}
              />
            </SettingItem>
          </>
        )}
      </div>
      
      <style>
        {`
          .card-navigator-settings-section {
            margin-bottom: 24px;
          }
          
          .card-navigator-settings-subsection {
            margin-top: 16px;
            margin-bottom: 24px;
            padding-left: 16px;
            border-left: 2px solid var(--background-modifier-border);
          }
          
          .card-navigator-settings-subsection h4 {
            margin-top: 0;
            margin-bottom: 8px;
          }
          
          .card-navigator-mode-toggle {
            display: flex;
            gap: 8px;
            width: 100%;
            background: none !important;
          }
          
          .card-navigator-mode-toggle:hover {
            background: none !important;
            background-color: transparent !important;
            color: inherit !important;
          }
          
          .card-navigator-mode-toggle::before,
          .card-navigator-mode-toggle::after,
          .card-navigator-mode-toggle:hover::before,
          .card-navigator-mode-toggle:hover::after {
            content: none !important;
            display: none !important;
            opacity: 0 !important;
            visibility: hidden !important;
            background: none !important;
            box-shadow: none !important;
            border: none !important;
            position: static !important;
            pointer-events: none !important;
            transform: none !important;
            transition: none !important;
            animation: none !important;
          }
          
          /* 버튼 기본 스타일 완전 재정의 */
          .card-navigator-mode-button {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            padding: 6px 12px;
            border-radius: 4px;
            background-color: var(--background-secondary);
            border: 1px solid var(--background-modifier-border);
            cursor: default !important;
            position: relative;
            overflow: hidden;
            min-width: 120px;
            flex: 1;
            transition: background-color 0.2s ease;
            -webkit-appearance: none !important;
            -moz-appearance: none !important;
            appearance: none !important;
            box-shadow: none !important;
            text-shadow: none !important;
            pointer-events: auto !important;
            user-select: none !important;
            -webkit-user-drag: none !important;
            -webkit-tap-highlight-color: transparent !important;
          }
          
          /* 모든 가상 요소 제거 */
          .card-navigator-mode-button::before,
          .card-navigator-mode-button::after,
          .card-navigator-mode-button:hover::before,
          .card-navigator-mode-button:hover::after,
          .card-navigator-mode-button:active::before,
          .card-navigator-mode-button:active::after,
          .card-navigator-mode-button:focus::before,
          .card-navigator-mode-button:focus::after {
            content: none !important;
            display: none !important;
            opacity: 0 !important;
            visibility: hidden !important;
            background: none !important;
            box-shadow: none !important;
            border: none !important;
            position: static !important;
            pointer-events: none !important;
            transform: none !important;
            transition: none !important;
            animation: none !important;
          }
          
          /* 호버 상태 */
          .card-navigator-mode-button:hover {
            background-color: var(--background-modifier-hover) !important;
            box-shadow: none !important;
            text-shadow: none !important;
          }
          
          /* 활성 상태 */
          .card-navigator-mode-button.active {
            background-color: var(--interactive-accent) !important;
            color: var(--text-on-accent) !important;
            box-shadow: none !important;
            text-shadow: none !important;
          }
          
          /* 선택 버튼 스타일 */
          .card-navigator-select-button {
            padding: 6px 12px;
            border-radius: 4px;
            background-color: var(--background-secondary);
            border: 1px solid var(--background-modifier-border);
            cursor: default !important;
            width: 100%;
            text-align: left;
            position: relative;
            overflow: hidden;
            transition: background-color 0.2s ease;
            -webkit-appearance: none !important;
            -moz-appearance: none !important;
            appearance: none !important;
            box-shadow: none !important;
            text-shadow: none !important;
            pointer-events: auto !important;
            user-select: none !important;
            -webkit-user-drag: none !important;
            -webkit-tap-highlight-color: transparent !important;
          }
          
          /* 모든 가상 요소 제거 */
          .card-navigator-select-button::before,
          .card-navigator-select-button::after,
          .card-navigator-select-button:hover::before,
          .card-navigator-select-button:hover::after,
          .card-navigator-select-button:active::before,
          .card-navigator-select-button:active::after,
          .card-navigator-select-button:focus::before,
          .card-navigator-select-button:focus::after {
            content: none !important;
            display: none !important;
            opacity: 0 !important;
            visibility: hidden !important;
            background: none !important;
            box-shadow: none !important;
            border: none !important;
            position: static !important;
            pointer-events: none !important;
            transform: none !important;
            transition: none !important;
            animation: none !important;
          }
          
          /* 호버 상태 */
          .card-navigator-select-button:hover {
            background-color: var(--background-modifier-hover) !important;
            box-shadow: none !important;
            text-shadow: none !important;
          }
          
          .card-navigator-cardset-selector {
            width: 100%;
          }
          
          .card-navigator-current-selection {
            font-weight: bold;
            color: var(--interactive-accent);
          }
          
          /* 추가 스타일 재정의 */
          .card-navigator-settings-section button {
            background-image: none !important;
            cursor: default !important;
          }
          
          /* 모든 버튼 관련 요소에 대한 스타일 */
          button, 
          .clickable-icon, 
          .setting-item-control button,
          .setting-item button,
          .modal button,
          .prompt button,
          .dropdown button {
            cursor: default !important;
          }
          
          /* 전역 스타일 재정의 */
          :root {
            --button-hover-overlay: none !important;
          }
          
          /* 버튼 내부 요소 스타일 */
          .card-navigator-mode-button svg,
          .card-navigator-mode-button span {
            position: relative;
            z-index: 2;
          }
        `}
      </style>
    </div>
  );
};

export default ModeSettings; 