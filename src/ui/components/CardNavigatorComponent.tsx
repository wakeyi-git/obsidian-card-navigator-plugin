import React, { useState, useEffect, useRef } from 'react';
import { App } from 'obsidian';
import CardContainer from '../cards-container/CardContainer';
import Toolbar from '../toolbar/Toolbar';
import { EmptyState } from './EmptyState';
import { useCardNavigatorService } from '../hooks/useCardNavigatorService';
import { useCardLoading } from '../hooks/useCardLoading';
import { useCardEvents } from '../hooks/useCardEvents';
import { TimerUtil } from '../../infrastructure/TimerUtil';
import { SearchBar } from '../toolbar/SearchBar';
import { SearchType, SearchType as SearchBarSearchType } from '../../domain/search/Search';
import { ICardNavigatorService } from '../../application/CardNavigatorService';
import { ICardSet } from '../../domain/cardset/CardSet';

/**
 * 카드 네비게이터 컴포넌트 속성
 */
export interface CardNavigatorComponentProps {
  service: ICardNavigatorService;
}

/**
 * 카드 네비게이터 컴포넌트
 * 카드 네비게이터의 메인 컴포넌트
 */
export const CardNavigatorComponent: React.FC<CardNavigatorComponentProps> = ({ service }) => {
  // 성능 모니터링을 위한 카운터
  const [renderCount, setRenderCount] = useState<number>(0);
  
  // 초기화 상태 추적
  const isInitializedRef = useRef<boolean>(false);
  
  // 서비스 초기화 및 관리
  const {
    currentCardSetSource,
    currentCardSet,
    isCardSetFixed,
    includeSubfolders,
    currentSortType,
    currentSortDirection,
    layout,
    searchType,
    caseSensitive,
    frontmatterKey,
    error: serviceError,
    
    setCurrentCardSetSource,
    setCurrentCardSet,
    setIsCardSetFixed,
    setIncludeSubfolders,
    setCurrentSortType,
    setCurrentSortDirection,
    setLayout,
    setSearchType,
    setCaseSensitive,
    setFrontmatterKey,
    
    refreshCards,
    handleCardClick,
    handleSearch,
    handlePresetApply,
    handlePresetSave,
    handlePresetDelete
  } = useCardNavigatorService(service);
  
  // 카드 로딩 관리
  const {
    cards,
    isLoading,
    error: loadingError,
    loadCards,
    setCards,
    setIsLoading,
    setError: setLoadingError
  } = useCardLoading(service);
  
  // 카드 이벤트 핸들러
  const {
    handleCardSetSourceChange,
    handleCardSetSelect,
    handleIncludeSubfoldersChange,
    handleSortChange,
    handleLayoutChange,
    handleSearchTypeChange,
    handleCaseSensitiveChange,
    handleFrontmatterKeyChange,
    handleCardDragStart,
    handleCardDragEnd,
    handleCardDrop,
    handleCardDragOver,
    handleCardDragEnter,
    handleCardDragLeave
  } = useCardEvents(
    service,
    loadCards,
    setCurrentCardSetSource,
    setCurrentCardSet,
    setIsCardSetFixed,
    setIncludeSubfolders,
    setCurrentSortType,
    setCurrentSortDirection,
    setLayout,
    setSearchType,
    setCaseSensitive,
    setFrontmatterKey
  );
  
  // 검색 카드 세트 여부
  const [isSearchCardSetSource, setIsSearchCardSetSource] = useState<boolean>(false);
  
  // 사용 가능한 폴더와 태그 목록
  const [availableFolders, setAvailableFolders] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  
  // 검색 관련 상태
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchScope, setSearchScope] = useState<'all' | 'current'>('current');
  
  // currentCardSetSource 상태가 변경될 때 isSearchCardSetSource 상태 업데이트
  useEffect(() => {
    setIsSearchCardSetSource(currentCardSetSource === 'search');
  }, [currentCardSetSource]);
  
  // 카드 세트가 변경될 때만 카드 다시 로드
  useEffect(() => {
    if (service && currentCardSet !== null && isInitializedRef.current) {
      console.log('[CardNavigatorView] 카드 세트 변경으로 카드 다시 로드:', currentCardSet);
      loadCards();
    }
  }, [currentCardSet, service, loadCards]);
  
  // 로깅용 useEffect
  useEffect(() => {
    console.log('[CardNavigatorView] currentCardSet 상태 변경:', currentCardSet);
    console.log('[CardNavigatorView] Toolbar 렌더링 시 전달되는 cardSet:', currentCardSet);
  }, [currentCardSet]);
  
  // 컴포넌트 마운트 시 카드 로드 및 초기화
  useEffect(() => {
    if (service && !isInitializedRef.current) {
      console.log('[CardNavigatorView] 컴포넌트 마운트, 카드 로드 시작');
      
      // 초기화 플래그 설정
      isInitializedRef.current = true;
      
      // 카드 로드
      loadCards();
      
      // 폴더 및 태그 목록 비동기 로드
      loadAvailableFoldersAndTags();
    }
  }, [service, loadCards]);
  
  // 폴더 및 태그 목록 비동기 로드 함수
  const loadAvailableFoldersAndTags = async () => {
    if (!service) return;
    
    try {
      console.log('[CardNavigatorView] 서비스가 초기화되었습니다. 폴더 및 태그 목록 로드를 시작합니다.');
      
      const cardSetSourceService = service.getCardSetSourceService();
      const currentSource = cardSetSourceService.getCurrentSourceType();
      
      // 폴더 목록 가져오기
      await cardSetSourceService.changeCardSetSource('folder');
      const folderCardSets = await cardSetSourceService.getCardSets();
      const folders = folderCardSets.map(cardSet => cardSet.source);
      console.log(`[CardNavigatorView] 폴더 목록 로드: ${folders.length}개`);
      setAvailableFolders(folders);
      
      // 태그 목록 가져오기
      await cardSetSourceService.changeCardSetSource('tag');
      const tagCardSets = await cardSetSourceService.getCardSets();
      const tags = tagCardSets.map(cardSet => cardSet.source);
      console.log(`[CardNavigatorView] 태그 목록 로드: ${tags.length}개`);
      setAvailableTags(tags);
      
      // 원래 카드 세트로 복원
      await cardSetSourceService.changeCardSetSource(currentSource);
    } catch (error) {
      console.error('[CardNavigatorView] 폴더 및 태그 목록 로드 중 오류 발생:', error);
    }
  };
  
  // 컴포넌트 렌더링 성능 측정
  useEffect(() => {
    setRenderCount(prev => prev + 1);
    
    const timerId = TimerUtil.startTimer('[성능] CardNavigatorComponent 렌더링 시간');
    console.log(`[성능] CardNavigatorComponent 렌더링 횟수: ${renderCount + 1}`);
    
    return () => {
      TimerUtil.endTimer(timerId);
    };
  }, []);
  
  // 전역 스타일 추가
  useEffect(() => {
    // 전역 스타일 추가
    const style = document.createElement('style');
    style.textContent = `
      .card-navigator-container {
        display: flex;
        flex-direction: column;
        height: 100%;
        overflow: hidden;
      }
      
      .card-navigator-header {
        flex: 0 0 auto;
        display: flex;
        flex-direction: column;
        border-bottom: 1px solid var(--background-modifier-border);
      }
      
      .card-navigator-toolbar {
        flex: 0 0 auto;
        padding: 4px 4px 4px 4px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
      }
      
      .card-navigator-search-bar-container {
        flex: 0 0 auto;
        padding: 0;
      }
      
      .card-navigator-content {
        flex: 1 1 auto;
        overflow: auto;
        padding: 0px;
        position: relative;
      }
      
      .card-navigator-loading {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100%;
        width: 100%;
        position: absolute;
        top: 0;
        left: 0;
        background-color: rgba(var(--background-primary-rgb), 0.7);
        z-index: 10;
      }
      
      .card-navigator-loading-spinner {
        border: 4px solid rgba(var(--text-muted-rgb), 0.3);
        border-radius: 50%;
        border-top: 4px solid var(--text-accent);
        width: 40px;
        height: 40px;
        animation: card-navigator-spin 1s linear infinite;
      }
      
      @keyframes card-navigator-spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      .card-navigator-error {
        padding: 16px;
        color: var(--text-error);
        background-color: rgba(var(--text-error-rgb), 0.1);
        border-radius: 4px;
        margin: 16px;
      }
      
      .card-navigator-empty {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        height: 100%;
        padding: 32px;
        text-align: center;
        color: var(--text-muted);
      }
      
      .card-navigator-empty-icon {
        font-size: 48px;
        margin-bottom: 16px;
      }
      
      .card-navigator-empty-title {
        font-size: 18px;
        font-weight: 500;
        margin-bottom: 8px;
      }
      
      .card-navigator-empty-description {
        font-size: 14px;
        max-width: 400px;
      }
    `;
    
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  
  // 카드 세트 소스 토글 핸들러
  const handleCardSetSourceToggle = () => {
    if (currentCardSetSource === 'folder') {
      handleCardSetSourceChange('tag');
    } else {
      handleCardSetSourceChange('folder');
    }
  };
  
  // 검색 모드 진입 처리
  const handleEnterSearchCardSetSource = (query: string, type?: SearchType) => {
    console.log(`[CardNavigatorView] 검색 모드 진입: 쿼리=${query}, 타입=${type}`);
    
    // 검색 쿼리 설정
    setSearchQuery(query);
    
    // 검색 타입 설정 (useCardNavigatorService에서 가져온 setSearchType 사용)
    if (type) {
      setSearchType(type);
    }
    
    // 검색 카드 세트 소스로 변경
    handleCardSetSourceChange('search');
  };
  
  // 검색 모드 종료 처리
  const handleExitSearchCardSetSource = () => {
    console.log('[CardNavigatorView] 검색 모드 종료');
    
    // 검색 쿼리 초기화
    setSearchQuery('');
    
    // 이전 카드 세트 소스로 복원
    const searchService = service.getSearchService();
    const previousSourceType = searchService.getPreviousCardSetSource();
    
    // 이전 소스로 변경
    handleCardSetSourceChange(previousSourceType);
  };
  
  // 검색 범위 변경 처리
  const handleSearchScopeChange = (scope: 'all' | 'current') => {
    console.log(`[CardNavigatorView] 검색 범위 변경: ${scope}`);
    
    // 검색 범위 설정
    setSearchScope(scope);
    
    // 검색 서비스에 검색 범위 설정
    const searchService = service.getSearchService();
    searchService.setSearchScope(scope);
    
    // 현재 검색 쿼리가 있으면 검색 다시 실행
    if (searchQuery) {
      // useCardNavigatorService에서 가져온 handleSearch 함수 호출
      // handleSearch 함수는 (query: string, type?: string) => Promise<void> 형태
      handleSearch(searchQuery);
    }
  };
  
  // 오류 메시지 (서비스 오류 또는 로딩 오류)
  const errorMessage = serviceError || loadingError;
  
  return (
    <div className="card-navigator-container">
      <div className="card-navigator-header">
        <Toolbar
          currentCardSetSource={currentCardSetSource}
          onCardSetSourceChange={handleCardSetSourceChange}
          onCardSetSourceToggle={handleCardSetSourceToggle}
          onSearch={handleSearch}
          cardSet={currentCardSet || undefined}
          isCardSetFixed={isCardSetFixed}
          onCardSetSelect={handleCardSetSelect}
          includeSubfolders={includeSubfolders}
          onIncludeSubfoldersChange={handleIncludeSubfoldersChange}
          layout={layout}
          onLayoutChange={handleLayoutChange}
          currentSortType={currentSortType}
          currentSortDirection={currentSortDirection}
          onSortChange={handleSortChange}
          service={service}
          app={service.getApp()}
          cardSets={{
            folders: availableFolders,
            tags: availableTags
          }}
          isSearchCardSetSource={isSearchCardSetSource}
          toggleSearchCardSetSource={() => setIsSearchCardSetSource(!isSearchCardSetSource)}
        />
        
        {isSearchCardSetSource && (
          <div className="card-navigator-search-bar-container">
            <SearchBar
              cardNavigatorService={service}
              onSearch={handleSearch}
              currentCards={cards}
              onSearchTypeChange={(type: SearchBarSearchType) => {
                // SearchBarSearchType를 SearchType으로 변환
                const convertedType = type === 'filename' ? 'title' : 
                                     (type === 'tag' || type === 'folder' || type === 'create' || type === 'modify') ? 'content' : 
                                     type as any;
                handleSearchTypeChange(convertedType);
              }}
              onCaseSensitiveChange={handleCaseSensitiveChange}
              onFrontmatterKeyChange={handleFrontmatterKeyChange}
              onSearchScopeChange={handleSearchScopeChange}
              onEnterSearchCardSetSource={handleEnterSearchCardSetSource}
              onExitSearchCardSetSource={handleExitSearchCardSetSource}
              searchQuery={searchQuery}
              searchType={searchType}
              caseSensitive={caseSensitive}
              frontmatterKey={frontmatterKey}
              searchScopeProps={searchScope}
              isSearchCardSetSource={isSearchCardSetSource}
              app={service.getApp()}
            />
          </div>
        )}
      </div>
      
      <div className="card-navigator-content">
        {errorMessage && (
          <div className="card-navigator-error">
            {errorMessage}
          </div>
        )}
        
        {isLoading && (
          <div className="card-navigator-loading">
            <div className="card-navigator-loading-spinner"></div>
          </div>
        )}
        
        {!isLoading && !errorMessage && cards.length === 0 && (
          <EmptyState
            title="카드가 없습니다"
            description={
              currentCardSetSource === 'folder' ? 
                "선택한 폴더에 노트가 없거나 폴더를 선택하지 않았습니다." : 
              currentCardSetSource === 'tag' ? 
                "선택한 태그가 포함된 노트가 없거나 태그를 선택하지 않았습니다." : 
              currentCardSetSource === 'search' ? 
                "검색 결과가 없습니다." : 
                "카드가 없습니다."
            }
            icon={
              currentCardSetSource === 'folder' ? 
                "folder" : 
              currentCardSetSource === 'tag' ? 
                "tag" : 
              currentCardSetSource === 'search' ? 
                "search" : 
                "card"
            }
          />
        )}
        
        {!isLoading && !errorMessage && cards.length > 0 && (
          <CardContainer
            cards={cards}
            layout={layout}
            onCardClick={handleCardClick}
            onCardDragStart={handleCardDragStart}
            onCardDragEnd={handleCardDragEnd}
            onCardDrop={handleCardDrop}
            onCardDragOver={handleCardDragOver}
            onCardDragEnter={handleCardDragEnter}
            onCardDragLeave={handleCardDragLeave}
          />
        )}
      </div>
    </div>
  );
}; 