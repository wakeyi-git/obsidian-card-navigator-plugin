import React, { useState, useEffect } from 'react';
import { App } from 'obsidian';
import CardContainer from '../cards-container/CardContainer';
import Toolbar from '../toolbar/Toolbar';
import { EmptyState } from './EmptyState';
import { useCardNavigatorService } from '../hooks/useCardNavigatorService';
import { useCardLoading } from '../hooks/useCardLoading';
import { useCardEvents } from '../hooks/useCardEvents';
import { TimerUtil } from '../../infrastructure/TimerUtil';
import { SearchBar } from '../toolbar/SearchBar';
import { SearchType as SearchBarSearchType } from '../../domain/search/Search';

/**
 * 카드 네비게이터 컴포넌트 속성
 */
interface CardNavigatorComponentProps {
  app: App;
}

/**
 * 카드 네비게이터 컴포넌트
 * 카드 네비게이터의 메인 컴포넌트
 */
export const CardNavigatorComponent: React.FC<CardNavigatorComponentProps> = ({ app }) => {
  // 성능 모니터링을 위한 카운터
  const [renderCount, setRenderCount] = useState<number>(0);
  
  // 서비스 초기화 및 관리
  const {
    service,
    currentMode,
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
    
    setCurrentMode,
    setCurrentCardSet,
    setIsCardSetFixed,
    setIncludeSubfolders,
    setCurrentSortType,
    setCurrentSortDirection,
    setLayout,
    setSearchType,
    setCaseSensitive,
    setFrontmatterKey,
    setError: setServiceError
  } = useCardNavigatorService(app);
  
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
    handleModeChange,
    handleCardSetSelect,
    handleIncludeSubfoldersChange,
    handleSortChange,
    handleLayoutChange,
    handleSearch,
    handleSearchTypeChange,
    handleCaseSensitiveChange,
    handleFrontmatterKeyChange,
    handleCardClick,
    handleCardContextMenu,
    handleCardDragStart,
    handleCardDragEnd,
    handleCardDrop,
    handleCardDragOver,
    handleCardDragEnter,
    handleCardDragLeave
  } = useCardEvents(
    service,
    loadCards,
    setCurrentMode,
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
  
  // 검색 모드 여부
  const [isSearchMode, setIsSearchMode] = useState<boolean>(false);
  
  // currentMode 상태가 변경될 때 isSearchMode 상태 업데이트
  useEffect(() => {
    setIsSearchMode(currentMode === 'search');
  }, [currentMode]);
  
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
        border: 4px solid var(--background-modifier-border);
        border-top: 4px solid var(--interactive-accent);
        border-radius: 50%;
        width: 40px;
        height: 40px;
        animation: card-navigator-spin 1s linear infinite;
      }
      
      @keyframes card-navigator-spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      .card-navigator-error {
        color: var(--text-error);
        padding: 16px;
        text-align: center;
        background-color: var(--background-modifier-error);
        border-radius: 4px;
        margin: 16px;
      }
      
      .card-navigator-empty-state {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        height: 100%;
        min-height: 200px;
        color: var(--text-muted);
      }
      
      .card-navigator-empty-state-icon {
        font-size: 48px;
        margin-bottom: 16px;
      }
      
      .card-navigator-empty-state-message {
        font-size: 16px;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  
  // currentCardSet 상태가 변경될 때 로그 출력
  useEffect(() => {
    console.log('[CardNavigatorView] currentCardSet 상태 변경:', currentCardSet);
    console.log('[CardNavigatorView] Toolbar 렌더링 시 전달되는 cardSet:', currentCardSet);
  }, [currentCardSet]);
  
  // 서비스가 초기화되면 카드 로드
  useEffect(() => {
    if (service) {
      console.log('[CardNavigatorView] 서비스가 초기화되었습니다. 카드 로드를 시작합니다.');
      loadCards();
    }
  }, [service, loadCards]);
  
  // 모드 토글 핸들러
  const handleModeToggle = () => {
    if (currentMode === 'folder') {
      handleModeChange('tag');
    } else {
      handleModeChange('folder');
    }
  };
  
  // 오류 메시지 (서비스 오류 또는 로딩 오류)
  const errorMessage = serviceError || loadingError;
  
  return (
    <div className="card-navigator-container">
      <div className="card-navigator-header">
        <Toolbar
          currentMode={currentMode}
          onModeChange={handleModeChange}
          onModeToggle={handleModeToggle}
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
          app={app}
          isSearchMode={isSearchMode}
          toggleSearchMode={() => setIsSearchMode(!isSearchMode)}
        />
        
        {isSearchMode && (
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
              searchQuery=""
              searchType={'content' as SearchBarSearchType}
              caseSensitive={caseSensitive}
              frontmatterKey={frontmatterKey}
              app={app}
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
          <EmptyState mode={currentMode} />
        )}
        
        {!isLoading && !errorMessage && cards.length > 0 && (
          <CardContainer
            cards={cards}
            layout={layout}
            onCardClick={handleCardClick}
            onCardContextMenu={handleCardContextMenu}
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