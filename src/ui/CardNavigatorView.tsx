import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { ItemView, WorkspaceLeaf, App, TFile, TAbstractFile } from 'obsidian';
import Toolbar from './toolbar/Toolbar';
import CardContainer from './cards-container/CardContainer';
import { ICardProps } from './cards-container/Card';
import { CardNavigatorService, ICardNavigatorService } from '../application/CardNavigatorService';
import { CardRepositoryImpl } from '../infrastructure/CardRepositoryImpl';
import { ObsidianAdapter } from '../infrastructure/ObsidianAdapter';
import { CardFactory } from '../domain/card/CardFactory';
import { ICard } from '../domain/card/Card';
import { SortType, SortDirection } from '../domain/sorting/Sort';
import { LayoutType } from '../domain/layout/Layout';
import { SearchType } from '../domain/search/Search';
import SearchBar from './toolbar/SearchBar';

// 카드 네비게이터 뷰 컴포넌트
const CardNavigatorComponent: React.FC<{ app: App }> = ({ app }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [cards, setCards] = useState<ICardProps[]>([]);
  const [currentMode, setCurrentMode] = useState<'folder' | 'tag'>('folder');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<SearchType>('filename');
  const [frontmatterKey, setFrontmatterKey] = useState<string>('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [layout, setLayout] = useState<'grid' | 'masonry'>('grid');
  const [service, setService] = useState<ICardNavigatorService | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCardSetFixed, setIsCardSetFixed] = useState<boolean>(false);
  const [includeSubfolders, setIncludeSubfolders] = useState<boolean>(true);
  
  // 성능 모니터링을 위한 카운터
  const [renderCount, setRenderCount] = useState<number>(0);
  const [cardLoadCount, setCardLoadCount] = useState<number>(0);
  
  // 컴포넌트 렌더링 성능 측정
  useEffect(() => {
    console.timeEnd('[성능] CardNavigatorComponent 렌더링 시간');
    console.time('[성능] CardNavigatorComponent 렌더링 시간');
    setRenderCount(prev => prev + 1);
    console.log(`[성능] CardNavigatorComponent 렌더링 횟수: ${renderCount + 1}`);
    
    return () => {
      console.timeEnd('[성능] CardNavigatorComponent 렌더링 시간');
    };
  }, [cards, isLoading, error, currentMode, layout, isCardSetFixed, includeSubfolders]);

  useEffect(() => {
    // 서비스 초기화 및 데이터 로딩
    const initializeService = async () => {
      try {
        const initTimerLabel = `[성능] CardNavigatorComponent 초기화 시간-${Date.now()}`;
        console.time(initTimerLabel);
        
        // 인프라스트럭처 레이어 초기화
        const obsidianAdapter = new ObsidianAdapter(app);
        const cardFactory = new CardFactory();
        const cardRepository = new CardRepositoryImpl(obsidianAdapter, cardFactory);
        
        // 서비스 레이어 초기화
        const navigatorService = new CardNavigatorService(app, cardRepository, 'folder');
        await navigatorService.initialize();
        setService(navigatorService);
        
        // 초기 데이터 로드
        const loadTimerLabel = `[성능] 초기 카드 로드 시간-${Date.now()}`;
        console.time(loadTimerLabel);
        const initialCards = await navigatorService.getCards();
        console.timeEnd(loadTimerLabel);
        
        setCardLoadCount(prev => prev + 1);
        console.log(`[성능] 카드 로드 횟수: ${cardLoadCount + 1}, 카드 수: ${initialCards.length}`);
        
        setCards(mapDomainCardsToProps(initialCards));
        setCurrentMode(navigatorService.getModeService().getCurrentModeType());
        
        // 레이아웃 설정 로드
        const layoutService = navigatorService.getLayoutService();
        const currentLayout = layoutService.getCurrentLayout();
        if (currentLayout) {
          setLayout(currentLayout.type);
        }
        
        // 모드 설정 로드
        const modeService = navigatorService.getModeService();
        setIsCardSetFixed(modeService.isCardSetFixed());
        setIncludeSubfolders(modeService.getIncludeSubfolders());
        
        // 상태 정보 콘솔에 출력
        logCardNavigatorStatus(navigatorService);
        
        console.timeEnd(initTimerLabel);
        setIsLoading(false);
      } catch (error) {
        console.error('서비스 초기화 중 오류 발생:', error);
        setError('카드 네비게이터를 초기화하는 중 오류가 발생했습니다.');
        setIsLoading(false);
      }
    };

    initializeService();
  }, [app]);

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

  // 도메인 카드 객체를 UI 컴포넌트 속성으로 변환
  const mapDomainCardsToProps = (domainCards: ICard[]): ICardProps[] => {
    return domainCards.map((card) => ({
      id: card.id,
      title: card.title,
      content: card.content,
      tags: card.tags,
      path: card.path,
      created: card.created,
      modified: card.modified,
    }));
  };

  // 검색 처리
  const handleSearch = async (query: string) => {
    if (!service) return;
    
    setSearchQuery(query);
    setIsLoading(true);
    
    try {
      console.time('[성능] 검색 실행 시간');
      
      const searchService = service.getSearchService();
      await service.search(query);
      
      const filteredCards = await service.getCards();
      setCardLoadCount(prev => prev + 1);
      console.log(`[성능] 검색 후 카드 로드 횟수: ${cardLoadCount + 1}, 카드 수: ${filteredCards.length}`);
      
      setCards(mapDomainCardsToProps(filteredCards));
      console.timeEnd('[성능] 검색 실행 시간');
    } catch (error) {
      console.error('검색 중 오류 발생:', error);
      setError('검색 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 검색 타입 변경 처리
  const handleSearchTypeChange = async (type: SearchType, frontmatterKey?: string) => {
    if (!service) return;
    
    setSearchType(type);
    if (frontmatterKey) {
      setFrontmatterKey(frontmatterKey);
    }
    
    try {
      const searchService = service.getSearchService();
      searchService.changeSearchType(type, frontmatterKey);
      
      if (searchQuery) {
        await service.search(searchQuery);
        const filteredCards = await service.getCards();
        setCards(mapDomainCardsToProps(filteredCards));
      }
    } catch (error) {
      console.error('검색 타입 변경 중 오류 발생:', error);
      setError('검색 타입 변경 중 오류가 발생했습니다.');
    }
  };

  // 대소문자 구분 변경 처리
  const handleCaseSensitiveChange = async (caseSensitive: boolean) => {
    if (!service) return;
    
    setCaseSensitive(caseSensitive);
    
    try {
      const searchService = service.getSearchService();
      searchService.setCaseSensitive(caseSensitive);
      
      if (searchQuery) {
        await service.search(searchQuery);
        const filteredCards = await service.getCards();
        setCards(mapDomainCardsToProps(filteredCards));
      }
    } catch (error) {
      console.error('대소문자 구분 변경 중 오류 발생:', error);
      setError('대소문자 구분 변경 중 오류가 발생했습니다.');
    }
  };

  // 모드 변경 처리
  const handleModeChange = async (mode: 'folder' | 'tag') => {
    if (!service) return;
    
    setCurrentMode(mode);
    setIsLoading(true);
    
    try {
      console.time('[성능] 모드 변경 실행 시간');
      
      const modeService = service.getModeService();
      modeService.changeMode(mode);
      
      const filteredCards = await service.getCards();
      setCardLoadCount(prev => prev + 1);
      console.log(`[성능] 모드 변경 후 카드 로드 횟수: ${cardLoadCount + 1}, 카드 수: ${filteredCards.length}`);
      
      setCards(mapDomainCardsToProps(filteredCards));
      
      // 모드 설정 업데이트
      setIsCardSetFixed(modeService.isCardSetFixed());
      setIncludeSubfolders(modeService.getIncludeSubfolders());
      
      // 상태 정보 콘솔에 출력
      logCardNavigatorStatus(service);
      console.timeEnd('[성능] 모드 변경 실행 시간');
    } catch (error) {
      console.error('모드 변경 중 오류 발생:', error);
      setError('모드 변경 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 카드 세트 선택 처리
  const handleCardSetSelect = async (cardSet: string, isFixed: boolean) => {
    if (!service) return;
    
    setIsLoading(true);
    setIsCardSetFixed(isFixed);
    
    try {
      console.time('[성능] 카드 세트 선택 실행 시간');
      
      // 모드 서비스에서 카드 세트 선택 (이미 내부적으로 refreshCards를 호출함)
      await service.selectCardSet(cardSet);
      
      // 모드 서비스 상태 업데이트 (isFixed 설정)
      const modeService = service.getModeService();
      modeService.selectCardSet(cardSet, isFixed);
      
      // 카드 목록 가져오기
      const filteredCards = await service.getCards();
      setCardLoadCount(prev => prev + 1);
      console.log(`[성능] 카드 세트 선택 후 카드 로드 횟수: ${cardLoadCount + 1}, 카드 수: ${filteredCards.length}`);
      
      setCards(mapDomainCardsToProps(filteredCards));
      
      // 상태 정보 콘솔에 출력
      logCardNavigatorStatus(service);
      console.timeEnd('[성능] 카드 세트 선택 실행 시간');
    } catch (error) {
      console.error('카드 세트 선택 중 오류 발생:', error);
      setError('카드 세트 선택 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 하위 폴더 포함 여부 변경 처리
  const handleIncludeSubfoldersChange = async (include: boolean) => {
    if (!service) return;
    
    setIncludeSubfolders(include);
    setIsLoading(true);
    
    try {
      const modeService = service.getModeService();
      modeService.setIncludeSubfolders(include);
      
      const filteredCards = await service.getCards();
      setCards(mapDomainCardsToProps(filteredCards));
    } catch (error) {
      console.error('하위 폴더 포함 여부 변경 중 오류 발생:', error);
      setError('하위 폴더 포함 여부 변경 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 정렬 변경 처리
  const handleSortChange = async (sortType: SortType, sortDirection: SortDirection) => {
    if (!service) return;
    
    setIsLoading(true);
    
    try {
      const sortService = service.getSortService();
      sortService.setSortType(sortType, sortDirection);
      
      const sortedCards = await service.getCards();
      setCards(mapDomainCardsToProps(sortedCards));
    } catch (error) {
      console.error('정렬 변경 중 오류 발생:', error);
      setError('정렬 변경 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 레이아웃 변경 처리
  const handleLayoutChange = async (layoutType: 'grid' | 'masonry') => {
    if (!service) return;
    
    setLayout(layoutType);
    
    try {
      const layoutService = service.getLayoutService();
      layoutService.changeLayoutType(layoutType);
    } catch (error) {
      console.error('레이아웃 변경 중 오류 발생:', error);
      setError('레이아웃 변경 중 오류가 발생했습니다.');
    }
  };

  // 프리셋 적용 처리
  const handlePresetApply = async (presetId: string) => {
    if (!service) return;
    
    setIsLoading(true);
    
    try {
      const presetService = service.getPresetService();
      await presetService.applyPreset(presetId);
      
      // 모드 설정 업데이트
      const modeService = service.getModeService();
      setCurrentMode(modeService.getCurrentModeType());
      setIsCardSetFixed(modeService.isCardSetFixed());
      setIncludeSubfolders(modeService.getIncludeSubfolders());
      
      // 레이아웃 설정 업데이트
      const layoutService = service.getLayoutService();
      const currentLayout = layoutService.getCurrentLayout();
      if (currentLayout) {
        setLayout(currentLayout.type);
      }
      
      const filteredCards = await service.getCards();
      setCards(mapDomainCardsToProps(filteredCards));
    } catch (error) {
      console.error('프리셋 적용 중 오류 발생:', error);
      setError('프리셋 적용 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card-navigator-container">
      <Toolbar
        onSearch={handleSearch}
        onSearchTypeChange={handleSearchTypeChange}
        onCaseSensitiveChange={handleCaseSensitiveChange}
        onModeChange={handleModeChange}
        currentMode={currentMode}
        onSortChange={handleSortChange}
        onLayoutChange={handleLayoutChange}
        onCardSetSelect={handleCardSetSelect}
        onIncludeSubfoldersChange={handleIncludeSubfoldersChange}
        onPresetApply={handlePresetApply}
        currentLayout={layout}
        service={service}
        app={app}
      />
      
      {error && (
        <div className="card-navigator-error">
          <p>{error}</p>
          <button onClick={() => setError(null)}>닫기</button>
        </div>
      )}
      
      {isLoading ? (
        <div className="card-navigator-loading">
          <p>로딩 중...</p>
        </div>
      ) : (
        <CardContainer
          cards={cards}
          layout={layout}
          onCardClick={(cardId) => {
            // 카드 클릭 처리
            const card = cards.find((c) => c.id === cardId);
            if (card && card.path) {
              app.workspace.openLinkText(card.path, '', true);
            }
          }}
        />
      )}
    </div>
  );
};

/**
 * Obsidian ItemView를 확장한 CardNavigatorView 클래스
 * React 컴포넌트를 Obsidian 뷰에 마운트하는 역할을 합니다.
 */
export class CardNavigatorView extends ItemView {
  private reactComponent: React.ReactNode;

  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
  }

  getViewType(): string {
    return 'card-navigator-view';
  }

  getDisplayText(): string {
    return '카드 네비게이터';
  }

  getIcon(): string {
    return 'layout-grid';
  }

  async onOpen() {
    const container = this.containerEl.children[1];
    container.empty();
    container.addClass('card-navigator-view');

    const rootEl = createDiv();
    container.appendChild(rootEl);

    const root = createRoot(rootEl);
    root.render(<CardNavigatorComponent app={this.app} />);
  }

  async onClose() {
    // 정리 작업
  }
} 