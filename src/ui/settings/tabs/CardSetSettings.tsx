import React, { useEffect, useState } from 'react';
import CardNavigatorPlugin from '../../../main';
import SettingItem from '../components/SettingItem';
import ToggleSwitch from '../components/ToggleSwitch';
import { App, SuggestModal } from 'obsidian';
import { CardSetSourceType, CardSetType } from '../../../domain/cardset/CardSet';
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

  onChooseSuggestion(folder: string, _evt: MouseEvent | KeyboardEvent): void {
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

  onChooseSuggestion(tag: string, _evt: MouseEvent | KeyboardEvent): void {
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
 * 카드 세트 설정 탭 컴포넌트
 */
const CardSetSettings: React.FC<{ plugin: CardNavigatorPlugin }> = ({ plugin }) => {
  const settings = plugin.settings;
  const { 
    defaultCardSetSource: initialDefaultCardSetSource, 
    defaultFolderCardSet: initialDefaultFolderCardSet,
    defaultTagCardSet: initialDefaultTagCardSet,
    isCardSetFixed: initialIsCardSetFixed, 
    includeSubfolders: initialIncludeSubfolders, 
    priorityTags, 
    priorityFolders,
    tagCaseSensitive: initialTagCaseSensitive,
    defaultSearchScope: initialDefaultSearchScope = 'current',
    useLastCardSetSourceOnLoad: initialUseLastCardSetSourceOnLoad = false
  } = settings;
  
  // 로컬 상태 관리
  const [defaultCardSetSource, setDefaultCardSetSource] = useState<CardSetSourceType>(initialDefaultCardSetSource);
  const [defaultFolderCardSet, setDefaultFolderCardSet] = useState<string>(initialDefaultFolderCardSet || '');
  const [defaultTagCardSet, setDefaultTagCardSet] = useState<string>(initialDefaultTagCardSet || '');
  const [isCardSetFixed, setIsCardSetFixed] = useState<boolean>(initialIsCardSetFixed || false);
  const [includeSubfolders, setIncludeSubfolders] = useState<boolean>(initialIncludeSubfolders || false);
  const [tagCaseSensitive, setTagCaseSensitive] = useState<boolean>(initialTagCaseSensitive || false);
  const [defaultSearchScope, setDefaultSearchScope] = useState<SearchScope>(initialDefaultSearchScope || 'all');
  const [searchCaseSensitive, setSearchCaseSensitive] = useState<boolean>(plugin.settings.searchCaseSensitive || false);
  const [highlightSearchResults, setHighlightSearchResults] = useState<boolean>(plugin.settings.highlightSearchResults !== undefined ? plugin.settings.highlightSearchResults : true);
  const [maxSearchResults, setMaxSearchResults] = useState<number>(plugin.settings.maxSearchResults || 100);
  const [useLastCardSetSourceOnLoad, setUseLastCardSetSourceOnLoad] = useState<boolean>(initialUseLastCardSetSourceOnLoad || false);
  
  const [cardSets, setCardSets] = React.useState<string[]>([]);
  const [folderSets, setFolderSets] = React.useState<string[]>([]);
  const [tagSets, setTagSets] = React.useState<string[]>([]);
  const [currentCardSetSource, setCurrentCardSetSource] = useState<CardSetSourceType>('folder');
  const [selectedCardSetType, setSelectedCardSetType] = React.useState<'active' | 'fixed'>(isCardSetFixed ? 'fixed' : 'active');
  
  // 설정이 변경될 때 로컬 상태 업데이트
  useEffect(() => {
    // 플러그인 설정에서 초기값 로드
    if (plugin && plugin.settings) {
      setDefaultCardSetSource(plugin.settings.defaultCardSetSource || 'folder');
      setDefaultFolderCardSet(plugin.settings.defaultFolderCardSet || '');
      setDefaultTagCardSet(plugin.settings.defaultTagCardSet || '');
      setIsCardSetFixed(plugin.settings.isCardSetFixed || false);
      setIncludeSubfolders(plugin.settings.includeSubfolders || false);
      setTagCaseSensitive(plugin.settings.tagCaseSensitive || false);
      setDefaultSearchScope(plugin.settings.defaultSearchScope || 'all');
      setSearchCaseSensitive(plugin.settings.searchCaseSensitive || false);
      setHighlightSearchResults(plugin.settings.highlightSearchResults || true);
      setMaxSearchResults(plugin.settings.maxSearchResults || 50);
      setUseLastCardSetSourceOnLoad(plugin.settings.useLastCardSetSourceOnLoad || false);
    }
    
    // 설정 변경 이벤트 리스너 등록
    const handleSettingsChanged = () => {
      console.log('[CardSetSourceSettings] 설정 변경 감지, 설정 다시 로드');
      if (plugin && plugin.settings) {
        setDefaultCardSetSource(plugin.settings.defaultCardSetSource || 'folder');
        setDefaultFolderCardSet(plugin.settings.defaultFolderCardSet || '');
        setDefaultTagCardSet(plugin.settings.defaultTagCardSet || '');
        setIsCardSetFixed(plugin.settings.isCardSetFixed || false);
        setIncludeSubfolders(plugin.settings.includeSubfolders || false);
        setTagCaseSensitive(plugin.settings.tagCaseSensitive || false);
        setDefaultSearchScope(plugin.settings.defaultSearchScope || 'all');
        setSearchCaseSensitive(plugin.settings.searchCaseSensitive || false);
        setHighlightSearchResults(plugin.settings.highlightSearchResults || true);
        setMaxSearchResults(plugin.settings.maxSearchResults || 50);
        setUseLastCardSetSourceOnLoad(plugin.settings.useLastCardSetSourceOnLoad || false);
      }
    };
    
    // 이벤트 리스너 등록
    if (plugin) {
      const eventRef = plugin.app.workspace.on('card-navigator:settings-changed', handleSettingsChanged);
      plugin.registerEvent(eventRef);
    }
    
    return () => {
      // 컴포넌트 언마운트 시 필요한 정리 작업
    };
  }, [plugin]);
  
  // 카드 세트 목록 로드
  React.useEffect(() => {
    const loadCardSets = async () => {
      const service = plugin.getCardNavigatorService();
      if (service) {
        try {
          const cardSetSourceService = service.getCardSetSourceService();
          
          // 폴더 카드 세트로 변경하여 폴더 목록 가져오기
          await service.changeCardSetSource('folder');
          const folders = await cardSetSourceService.getCardSets();
          // ICardSet[]을 string[]으로 변환
          const folderStrings = folders.map(folder => folder.source);
          setFolderSets(folderStrings);
          
          // 태그 카드 세트로 변경하여 태그 목록 가져오기
          await service.changeCardSetSource('tag');
          const tags = await cardSetSourceService.getCardSets();
          // ICardSet[]을 string[]으로 변환
          const tagStrings = tags.map(tag => tag.source);
          setTagSets(tagStrings);
          
          // 원래 카드 세트로 복원
          await service.changeCardSetSource(currentCardSetSource);
          
          // 현재 카드 세트에 맞는 카드 세트 설정
          if (currentCardSetSource === 'folder') {
            setCardSets(folderStrings);
            // 초기 설정에서 폴더 카드 세트 설정
            if (initialDefaultFolderCardSet) {
              setDefaultFolderCardSet(initialDefaultFolderCardSet);
            }
          } else if (currentCardSetSource === 'tag') {
            setCardSets(tagStrings);
            // 초기 설정에서 태그 카드 세트 설정
            if (initialDefaultTagCardSet) {
              setDefaultTagCardSet(initialDefaultTagCardSet);
            }
          }
        } catch (error) {
          console.error('카드 세트 로드 중 오류 발생:', error);
        }
      }
    };
    
    loadCardSets();
  }, [plugin, initialDefaultFolderCardSet, initialDefaultTagCardSet]);
  
  // 카드 세트 변경 시 카드 세트 목록 업데이트
  React.useEffect(() => {
    if (defaultCardSetSource === 'folder') {
      setCardSets(folderSets);
      // 폴더 카드 세트로 변경 시 폴더 카드 세트 사용
      if (defaultFolderCardSet) {
        setDefaultFolderCardSet(defaultFolderCardSet);
      } else {
        setDefaultFolderCardSet('');
      }
    } else if (defaultCardSetSource === 'tag') {
      setCardSets(tagSets);
      // 태그 카드 세트로 변경 시 태그 카드 세트 사용
      if (defaultTagCardSet) {
        setDefaultTagCardSet(defaultTagCardSet);
      } else {
        setDefaultTagCardSet('');
      }
    }
  }, [defaultCardSetSource, folderSets, tagSets, defaultFolderCardSet, defaultTagCardSet]);
  
  // 카드 세트 타입 변경 처리
  const handleCardSetTypeChange = (type: 'active' | 'fixed') => {
    setSelectedCardSetType(type);
    setIsCardSetFixed(type === 'fixed');
    onChange('isCardSetFixed', type === 'fixed');
  };
  
  // 폴더/태그 선택 모달 열기
  const openCardSetModal = () => {
    const app = plugin.app;
    
    if (defaultCardSetSource === 'folder') {
      // 폴더 선택 모달 열기
      const modal = new FolderSuggestModal(
        app,
        folderSets,
        (folder) => {
          setDefaultFolderCardSet(folder);
          onChange('defaultFolderCardSet', folder);
        }
      );
      
      // 현재 폴더 설정
      if (defaultFolderCardSet) {
        modal.setCurrentFolder(defaultFolderCardSet);
      } else if (defaultFolderCardSet) {
        modal.setCurrentFolder(defaultFolderCardSet);
      }
      
      modal.open();
    } else if (defaultCardSetSource === 'tag') {
      // 태그 선택 모달 열기
      const modal = new TagSuggestModal(
        app,
        tagSets,
        (tag) => {
          setDefaultTagCardSet(tag);
          onChange('defaultTagCardSet', tag);
        }
      );
      
      // 현재 태그 설정
      if (defaultTagCardSet) {
        modal.setCurrentTag(defaultTagCardSet);
      } else if (defaultFolderCardSet) {
        modal.setCurrentTag(defaultFolderCardSet);
      }
      
      modal.open();
    }
  };
  
  // 설정 변경 핸들러
  const onChange = async (key: string, value: any) => {
    try {
      console.log(`[CardSetSourceSettings] 설정 변경: ${key} = ${value}`);
      
      // 설정 업데이트
      if (plugin) {
        // 설정 객체 생성
        const settingsUpdate: any = {
          [key]: value
        };
        
        // 카드 네비게이터 서비스 가져오기
        const cardNavigatorService = plugin.getCardNavigatorService();
        
        // 특별한 처리가 필요한 설정들
        if (key === 'defaultCardSetSource') {
          // 카드셋 소스 변경 시 관련 설정도 함께 업데이트
          if (value === 'folder') {
            settingsUpdate.defaultFolderCardSet = defaultFolderCardSet;
          } else if (value === 'tag') {
            settingsUpdate.defaultTagCardSet = defaultTagCardSet;
          }
          
          // 상태 업데이트
          setDefaultCardSetSource(value);
        } else if (key === 'defaultFolderCardSet') {
          setDefaultFolderCardSet(value);
        } else if (key === 'defaultTagCardSet') {
          setDefaultTagCardSet(value);
        } else if (key === 'isCardSetFixed') {
          setIsCardSetFixed(value);
          
          // 현재 선택된 카드셋이 있는 경우 카드셋 선택 상태 업데이트
          if (cardNavigatorService) {
            const currentCardSetSource = plugin.settings.defaultCardSetSource;
            let currentCardSet = '';
            
            if (currentCardSetSource === 'folder') {
              currentCardSet = plugin.settings.defaultFolderCardSet;
            } else if (currentCardSetSource === 'tag') {
              currentCardSet = plugin.settings.defaultTagCardSet;
            }
            
            if (currentCardSet) {
              await cardNavigatorService.selectCardSet(currentCardSet, value);
            }
          }
        } else if (key === 'includeSubfolders') {
          setIncludeSubfolders(value);
        } else if (key === 'tagCaseSensitive') {
          setTagCaseSensitive(value);
        } else if (key === 'defaultSearchScope') {
          setDefaultSearchScope(value);
        } else if (key === 'searchCaseSensitive') {
          setSearchCaseSensitive(value);
        } else if (key === 'highlightSearchResults') {
          setHighlightSearchResults(value);
        } else if (key === 'maxSearchResults') {
          setMaxSearchResults(value);
        } else if (key === 'useLastCardSetSourceOnLoad') {
          setUseLastCardSetSourceOnLoad(value);
        }
        
        // 서비스를 통해 설정 업데이트
        if (cardNavigatorService) {
          await cardNavigatorService.updateSettings(settingsUpdate);
        } else {
          // 서비스가 없는 경우 직접 설정 업데이트
          Object.assign(plugin.settings, settingsUpdate);
          await plugin.saveSettings();
        }
      }
    } catch (error) {
      console.error('설정 변경 중 오류 발생:', error);
    }
  };
  
  const handleCardSetSourceChange = (cardSetSource: CardSetSourceType) => {
    setDefaultCardSetSource(cardSetSource);
    
    // 카드 세트에 맞는 카드 세트 설정
    if (cardSetSource === 'folder') {
      const folderSet = defaultFolderCardSet || '';
      setDefaultFolderCardSet(folderSet);
      onChange('defaultFolderCardSet', folderSet);
    } else if (cardSetSource === 'tag') {
      const tagSet = defaultTagCardSet || '';
      setDefaultTagCardSet(tagSet);
      onChange('defaultTagCardSet', tagSet);
    } else {
      // 검색 카드 세트인 경우 카드 세트 초기화
      setDefaultFolderCardSet('');
      setDefaultTagCardSet('');
      onChange('defaultFolderCardSet', '');
      onChange('defaultTagCardSet', '');
    }
    
    onChange('defaultCardSetSource', cardSetSource);
  };

  const renderCardSetSourceButtons = () => {
    return (
      <div className="card-navigator-cardSetSource-toggle">
        <div
          className={`card-navigator-cardSetSource-button ${defaultCardSetSource === 'folder' ? 'active' : ''}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleCardSetSourceChange('folder');
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
          </svg>
          <span>폴더</span>
        </div>
        <div
          className={`card-navigator-cardSetSource-button ${defaultCardSetSource === 'tag' ? 'active' : ''}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleCardSetSourceChange('tag');
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
            <line x1="7" y1="7" x2="7.01" y2="7"></line>
          </svg>
          <span>태그</span>
        </div>
        <div
          className={`card-navigator-cardSetSource-button ${defaultCardSetSource === 'search' ? 'active' : ''}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleCardSetSourceChange('search');
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
  
  // 컴포넌트가 마운트될 때 스타일 추가
  useEffect(() => {
    // 스타일 요소 생성
    const style = document.createElement('style');
    style.textContent = `
      .card-navigator-setting-warning {
        color: var(--text-warning);
        font-size: 12px;
        margin-top: 8px;
        padding: 4px 8px;
        background-color: var(--background-modifier-error);
        border-radius: 4px;
        opacity: 0.8;
      }
      
      .card-navigator-toggle-container {
        display: flex;
        align-items: center;
        margin-bottom: 8px;
      }
      
      .card-navigator-toggle-label {
        margin-right: 8px;
      }
      
      .card-navigator-toggle {
        position: relative;
        width: 40px;
        height: 20px;
        background-color: var(--background-modifier-border);
        border-radius: 10px;
        cursor: pointer;
        transition: background-color 0.3s;
      }
      
      .card-navigator-toggle.is-enabled {
        background-color: var(--interactive-accent);
      }
      
      .card-navigator-toggle-slider {
        position: absolute;
        top: 2px;
        left: 2px;
        width: 16px;
        height: 16px;
        background-color: var(--background-primary);
        border-radius: 50%;
        transition: transform 0.3s;
      }
      
      .card-navigator-toggle.is-enabled .card-navigator-toggle-slider {
        transform: translateX(20px);
      }
      
      .card-navigator-setting-description {
        font-size: 12px;
        color: var(--text-muted);
        margin-top: 4px;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  
  return (
    <div className="card-navigator-settings-section">   
      <div className="setting-item">
        <div className="setting-item-info">
          <div className="setting-item-name">시작 시 카드 세트 설정</div>
          <div className="setting-item-description">
            플러그인 로드 시 사용할 카드 세트와 카드 세트를 설정합니다.
          </div>
        </div>
        <div className="setting-item-control">
          <div className="card-navigator-toggle-container">
            <div className="card-navigator-toggle-label">마지막 카드 세트 사용</div>
            <div 
              className={`card-navigator-toggle ${useLastCardSetSourceOnLoad ? 'is-enabled' : ''}`}
              onClick={() => onChange('useLastCardSetSourceOnLoad', !useLastCardSetSourceOnLoad)}
            >
              <div className="card-navigator-toggle-slider"></div>
            </div>
          </div>
          <div className="card-navigator-setting-description">
            {useLastCardSetSourceOnLoad ? 
              '플러그인 로드 시 마지막으로 사용한 카드 세트와 카드 세트를 사용합니다.' : 
              '플러그인 로드 시 아래에서 설정한 기본 카드 세트와 카드 세트를 사용합니다.'}
          </div>
        </div>
      </div>
      
      <div className="setting-item">
        <div className="setting-item-info">
          <div className="setting-item-name">기본 카드 세트</div>
          <div className="setting-item-description">
            플러그인 로드 시 사용할 기본 카드 세트를 선택합니다.
            {useLastCardSetSourceOnLoad && <div className="card-navigator-setting-warning">
              마지막 카드 세트 사용이 활성화되어 있어 이 설정은 마지막 카드 세트가 없을 때만 적용됩니다.
            </div>}
          </div>
        </div>
        <div className="setting-item-control">
          {renderCardSetSourceButtons()}
        </div>
      </div>
      
      <div className="card-navigator-settings-subsection">
        <h3>기본 카드 세트 설정</h3>
        
        <div className="setting-item">
          <div className="setting-item-info">
            <div className="setting-item-name">기본 카드 세트</div>
            <div className="setting-item-description">
              플러그인 로드 시 사용할 기본 카드 세트를 선택합니다.
              {useLastCardSetSourceOnLoad && <div className="card-navigator-setting-warning">
                마지막 카드 세트 사용이 활성화되어 있어 이 설정은 마지막 카드 세트가 없을 때만 적용됩니다.
              </div>}
            </div>
          </div>
          <div className="setting-item-control">
            <div className="card-navigator-cardset-selector">
              <button
                className="card-navigator-cardset-button"
                onClick={openCardSetModal}
              >
                <span className="card-navigator-cardset-name">
                  {defaultFolderCardSet || '카드 세트 선택'}
                </span>
              </button>
            </div>
          </div>
        </div>
        
        <SettingItem label={defaultCardSetSource === 'folder' ? "폴더 선택 방식" : defaultCardSetSource === 'tag' ? "태그 선택 방식" : "검색 방식"}>
          <div className="card-navigator-toggle-container">
            <div className="card-navigator-toggle-label">카드 세트 고정</div>
            <div 
              className={`card-navigator-toggle ${isCardSetFixed ? 'is-enabled' : ''}`}
              onClick={() => onChange('isCardSetFixed', !isCardSetFixed)}
            >
              <div className="card-navigator-toggle-slider"></div>
            </div>
          </div>
          <div className="card-navigator-setting-description">
            {isCardSetFixed ? 
              '선택한 카드 세트를 고정하여 사용합니다.' : 
              '활성 파일에 따라 카드 세트가 자동으로 변경됩니다.'}
            {useLastCardSetSourceOnLoad && <div className="card-navigator-setting-warning">
              마지막 카드 세트 사용이 활성화되어 있어 이 설정은 마지막 카드 세트 고정 여부가 없을 때만 적용됩니다.
            </div>}
          </div>
        </SettingItem>
        
        {selectedCardSetType === 'fixed' && (
          <SettingItem 
            label={defaultCardSetSource === 'folder' ? "지정 폴더 선택" : defaultCardSetSource === 'tag' ? "지정 태그 선택" : "지정 검색 선택"}
            description={defaultCardSetSource === 'folder' 
              ? "지정한 폴더의 노트를 표시합니다. 다른 폴더의 노트를 열어도 카드 목록이 변경되지 않습니다." 
              : defaultCardSetSource === 'tag' 
                ? "지정한 태그를 포함하는 노트를 표시합니다. 다른 태그의 노트를 열어도 카드 목록이 변경되지 않습니다."
                : "지정한 검색을 포함하는 노트를 표시합니다. 다른 검색의 노트를 열어도 카드 목록이 변경되지 않습니다."}
          >
            <div className="card-navigator-cardset-selector">
              <button
                className="card-navigator-select-button"
                onClick={openCardSetModal}
              >
                {defaultFolderCardSet 
                  ? (defaultCardSetSource === 'folder' && defaultFolderCardSet === '/' 
                    ? '루트 폴더' 
                    : defaultFolderCardSet)
                  : `${defaultCardSetSource === 'folder' ? '폴더' : defaultCardSetSource === 'tag' ? '태그' : '검색'} 선택`}
              </button>
            </div>
          </SettingItem>
        )}
        
        {defaultCardSetSource === 'folder' && (
          <SettingItem label="하위 폴더 포함">
            <div className="card-navigator-toggle-container">
              <div className="card-navigator-toggle-label">하위 폴더 포함</div>
              <div 
                className={`card-navigator-toggle ${includeSubfolders ? 'is-enabled' : ''}`}
                onClick={() => onChange('includeSubfolders', !includeSubfolders)}
              >
                <div className="card-navigator-toggle-slider"></div>
              </div>
            </div>
            <div className="card-navigator-setting-description">
              {includeSubfolders ? 
                '선택한 폴더의 하위 폴더에 있는 파일도 포함합니다.' : 
                '선택한 폴더에 있는 파일만 포함합니다.'}
              {useLastCardSetSourceOnLoad && <div className="card-navigator-setting-warning">
                마지막 카드 세트 사용이 활성화되어 있어 이 설정은 마지막 하위 폴더 포함 여부가 없을 때만 적용됩니다.
              </div>}
            </div>
          </SettingItem>
        )}
        
        {defaultCardSetSource === 'tag' && (
          <SettingItem label="태그 대소문자 구분">
            <div className="card-navigator-toggle-container">
              <div className="card-navigator-toggle-label">대소문자 구분</div>
              <div 
                className={`card-navigator-toggle ${tagCaseSensitive ? 'is-enabled' : ''}`}
                onClick={() => onChange('tagCaseSensitive', !tagCaseSensitive)}
              >
                <div className="card-navigator-toggle-slider"></div>
              </div>
            </div>
            <div className="card-navigator-setting-description">
              {tagCaseSensitive ? 
                '태그 검색 시 대소문자를 구분합니다.' : 
                '태그 검색 시 대소문자를 구분하지 않습니다.'}
              {useLastCardSetSourceOnLoad && <div className="card-navigator-setting-warning">
                마지막 카드 세트 사용이 활성화되어 있어 이 설정은 마지막 태그 대소문자 구분 여부가 없을 때만 적용됩니다.
              </div>}
            </div>
          </SettingItem>
        )}
        
        {defaultCardSetSource === 'search' && (
          <>
            <SettingItem 
              label="기본 검색 범위" 
              description="검색 시 기본적으로 적용할 검색 범위를 설정합니다."
            >
              <div className="card-navigator-cardSetSource-toggle">
                <button 
                  className={`card-navigator-cardSetSource-button ${defaultSearchScope === 'current' ? 'active' : ''}`}
                  onClick={() => {
                    setDefaultSearchScope('current');
                    onChange('defaultSearchScope', 'current');
                  }}
                >
                  <span>현재 카드 세트</span>
                </button>
                <button 
                  className={`card-navigator-cardSetSource-button ${defaultSearchScope === 'all' ? 'active' : ''}`}
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
          
          .card-navigator-cardSetSource-toggle {
            display: flex;
            gap: 8px;
            width: 100%;
            background: none !important;
          }
          
          .card-navigator-cardSetSource-toggle:hover {
            background: none !important;
            background-color: transparent !important;
            color: inherit !important;
          }
          
          .card-navigator-cardSetSource-toggle::before,
          .card-navigator-cardSetSource-toggle::after,
          .card-navigator-cardSetSource-toggle:hover::before,
          .card-navigator-cardSetSource-toggle:hover::after {
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
          .card-navigator-cardSetSource-button {
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
          .card-navigator-cardSetSource-button::before,
          .card-navigator-cardSetSource-button::after,
          .card-navigator-cardSetSource-button:hover::before,
          .card-navigator-cardSetSource-button:hover::after,
          .card-navigator-cardSetSource-button:active::before,
          .card-navigator-cardSetSource-button:active::after,
          .card-navigator-cardSetSource-button:focus::before,
          .card-navigator-cardSetSource-button:focus::after {
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
          .card-navigator-cardSetSource-button:hover {
            background-color: var(--background-modifier-hover) !important;
            box-shadow: none !important;
            text-shadow: none !important;
          }
          
          /* 활성 상태 */
          .card-navigator-cardSetSource-button.active {
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
          .card-navigator-cardSetSource-button svg,
          .card-navigator-cardSetSource-button span {
            position: relative;
            z-index: 2;
          }
        `}
      </style>
    </div>
  );
};

export default CardSetSettings; 