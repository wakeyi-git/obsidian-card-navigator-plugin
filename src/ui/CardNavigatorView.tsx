import React, { useState, useEffect, useCallback } from 'react';
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
import { SearchBar } from './toolbar/SearchBar';
import { SearchType as SearchModeType } from '../domain/mode/SearchMode';
import { ModeType } from '../domain/mode/Mode';

// 카드 네비게이터 뷰 컴포넌트
const CardNavigatorComponent: React.FC<{ app: App }> = ({ app }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [cards, setCards] = useState<ICardProps[]>([]);
  const [currentMode, setCurrentMode] = useState<ModeType>('folder');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<SearchType>('filename');
  const [frontmatterKey, setFrontmatterKey] = useState<string>('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [layout, setLayout] = useState<'grid' | 'masonry'>('grid');
  const [service, setService] = useState<ICardNavigatorService | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCardSetFixed, setIsCardSetFixed] = useState<boolean>(false);
  const [includeSubfolders, setIncludeSubfolders] = useState<boolean>(true);
  const [isSearchMode, setIsSearchMode] = useState<boolean>(false);
  const [previousMode, setPreviousMode] = useState<ModeType>('folder');
  
  // 성능 모니터링을 위한 카운터
  const [renderCount, setRenderCount] = useState<number>(0);
  const [cardLoadCount, setCardLoadCount] = useState<number>(0);
  
// 컴포넌트 렌더링 성능 측정
useEffect(() => {
  // 타이머 ID를 고유하게 만들기 위해 타임스탬프 추가
  const timerId = `[성능] CardNavigatorComponent 렌더링 시간-${Date.now()}`;
  
  // 타이머 시작
  console.time(timerId);
  
  setRenderCount(prev => prev + 1);
  console.log(`[성능] CardNavigatorComponent 렌더링 횟수: ${renderCount + 1}`);
  
  // 렌더링 횟수가 비정상적으로 많으면 경고
  if (renderCount > 100) {
    console.warn('[CardNavigatorComponent] 렌더링 횟수가 100회를 초과했습니다. 무한 루프가 발생했을 수 있습니다.');
  }
  
  return () => {
    // 클린업 함수에서 동일한 ID로 타이머 종료
    try {
      console.timeEnd(timerId);
    } catch (e) {
      // 타이머가 없는 경우 오류 무시
    }
  };
}, []); // 의존성 배열을 비워서 마운트 시에만 실행

  useEffect(() => {
    // 전역 스타일 추가
    const style = document.createElement('style');
    style.textContent = `
      .card-navigator-view * {
        opacity: 1 !important;
        visibility: visible !important;
      }
      .card-navigator-visible {
        opacity: 1 !important;
        visibility: visible !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    // 서비스 초기화 및 데이터 로딩
    const initializeService = async () => {
      // 이미 초기화 중인지 확인
      if ((window as any)._cardNavigatorInitializing) {
        console.log(`[CardNavigatorView] 이미 초기화 중입니다. 중복 초기화 방지`);
        return;
      }
      
      (window as any)._cardNavigatorInitializing = true;
      
      try {
        const initTimerLabel = `[성능] CardNavigatorComponent 초기화 시간-${Date.now()}`;
        console.time(initTimerLabel);
        
        // 인프라스트럭처 레이어 초기화
        const obsidianAdapter = new ObsidianAdapter(app);
        const cardFactory = new CardFactory();
        const cardRepository = new CardRepositoryImpl(obsidianAdapter, cardFactory);
        
        // 서비스 레이어 초기화
        console.log(`[CardNavigatorView] 서비스 초기화 시작`);
        const navigatorService = new CardNavigatorService(app, cardRepository, 'folder');
        
        try {
          await navigatorService.initialize();
          console.log(`[CardNavigatorView] 서비스 초기화 완료`);
        } catch (initError) {
          console.error(`[CardNavigatorView] 서비스 초기화 오류:`, initError);
          setError('서비스 초기화 중 오류가 발생했습니다.');
          setIsLoading(false);
          (window as any)._cardNavigatorInitializing = false;
          return;
        }
        
        // 서비스 상태 확인
        if (!navigatorService.getCardService() || 
            typeof navigatorService.getCardService().getAllCards !== 'function') {
          console.error('[CardNavigatorView] 카드 서비스가 올바르게 초기화되지 않았습니다.');
          setError('카드 서비스 초기화 오류');
          setIsLoading(false);
          (window as any)._cardNavigatorInitializing = false;
          return;
        }
        
        setService(navigatorService);
        
        // 초기 데이터 로드
        try {
          const loadTimerLabel = `[성능] 초기 카드 로드 시간-${Date.now()}`;
          console.time(loadTimerLabel);
          const initialCards = await navigatorService.getCards();
          console.timeEnd(loadTimerLabel);
          
          setCardLoadCount(prev => prev + 1);
          console.log(`[성능] 카드 로드 횟수: ${cardLoadCount + 1}, 카드 수: ${initialCards.length}`);
          
          setCards(initialCards.map(card => {
            const cardProps: ICardProps = {
              id: card.id,
              title: card.title,
              content: card.content || '',
              tags: card.tags || [],
              path: card.path,
              created: card.created,
              modified: card.modified,
              searchQuery: searchQuery,
              cardNavigatorService: service || undefined,
              isActive: false
            };
            return cardProps;
          }));
        } catch (loadError) {
          console.error(`[CardNavigatorView] 초기 카드 로드 오류:`, loadError);
          // 오류가 발생해도 계속 진행 (빈 카드 목록으로)
          setCards([]);
        }
        
        setCurrentMode(navigatorService.getModeService().getCurrentModeType());
        
        // 레이아웃 설정 로드
        const layoutService = navigatorService.getLayoutService();
        const currentLayout = layoutService.getCurrentLayout();
        if (currentLayout) {
          setLayout(currentLayout.type);
        }
        
        // 카드 세트 고정 여부 설정
        const modeService = navigatorService.getModeService();
        setIsCardSetFixed(modeService.isCardSetFixed());
        setIncludeSubfolders(modeService.getIncludeSubfolders());
        
        // 상태 정보 콘솔에 출력
        logCardNavigatorStatus(navigatorService);
        
        console.timeEnd(initTimerLabel);
        setIsLoading(false);
      } catch (error) {
        console.error('[CardNavigatorView] 서비스 초기화 중 오류 발생:', error);
        setError('서비스 초기화 중 오류가 발생했습니다.');
        setIsLoading(false);
      } finally {
        (window as any)._cardNavigatorInitializing = false;
      }
    };

    initializeService();
    
    // 컴포넌트 언마운트 시 정리
    return () => {
      console.log('[CardNavigatorView] 컴포넌트 언마운트');
      // 전역 초기화 플래그 초기화
      (window as any)._cardNavigatorInitializing = false;
    };
  }, [app]); // app이 변경될 때만 실행

  // 도메인 카드를 UI 카드 속성으로 변환하는 함수 (의존성 없음)
  const mapCardToProps = (card: ICard): ICardProps => {
    return {
      id: card.id,
      title: card.title,
      content: card.content || '',
      tags: card.tags || [],
      path: card.path,
      created: card.created,
      modified: card.modified,
      searchQuery: searchQuery,
      cardNavigatorService: service || undefined,
      isActive: false
    };
  };

  // UI 카드 속성을 도메인 카드로 변환하는 함수
  const mapPropsToCard = (cardProps: ICardProps): ICard => {
    return {
      id: cardProps.id,
      title: cardProps.title,
      content: cardProps.content || '',
      tags: cardProps.tags || [],
      path: cardProps.path || '',
      created: cardProps.created || Date.now(),
      modified: cardProps.modified || Date.now(),
      frontmatter: {}
    };
  };

  // UI 카드 속성 배열을 도메인 카드 배열로 변환하는 함수
  const mapPropsArrayToCardArray = (cardProps: ICardProps[]): ICard[] => {
    return cardProps.map(mapPropsToCard);
  };

  // 활성 파일 변경 처리 함수
  const handleActiveFileChange = useCallback(async (file: TFile | null) => {
    if (!file || !service) return;
    
    // 카드 세트가 고정되어 있으면 활성 파일 변경에 반응하지 않음
    if (isCardSetFixed) {
      console.log(`[CardNavigatorView] 카드 세트가 고정되어 있어 활성 파일 변경에 반응하지 않습니다.`);
      return;
    }
    
    // 현재 모드 확인
    const modeService = service.getModeService();
    const currentMode = modeService.getCurrentModeType();
    
    // 폴더 모드에서 같은 폴더 내 이동인지 확인
    if (currentMode === 'folder') {
      const filePath = file.path;
      const lastSlashIndex = filePath.lastIndexOf('/');
      const folderPath = lastSlashIndex > 0 ? filePath.substring(0, lastSlashIndex) : '/';
      
      // 현재 카드 세트(폴더)와 동일한 경우 업데이트 불필요
      if (modeService.getCurrentCardSet() === folderPath) {
        console.log(`[CardNavigatorView] 같은 폴더 내 이동이므로 카드 세트 업데이트를 건너뜁니다.`);
        return;
      }
    }
    
    // 활성 파일 변경 처리
    try {
      // 서비스의 ModeService를 통해 활성 파일 변경 처리
      const cardSetChanged = await modeService.handleActiveFileChange(file);
      
      // 카드 세트가 변경된 경우에만 카드 목록 다시 로드
      if (cardSetChanged) {
        console.log(`[CardNavigatorView] 카드 세트가 변경되어 카드 목록을 다시 로드합니다.`);
        const cards = await service.getCards();
        setCards(cards.map(mapCardToProps));
      } else {
        console.log(`[CardNavigatorView] 카드 세트가 변경되지 않아 카드 목록 로드를 건너뜁니다.`);
      }
    } catch (error) {
      console.error(`[CardNavigatorView] 활성 파일 변경 처리 중 오류 발생:`, error);
    }
  }, [service, isCardSetFixed, searchQuery]); // searchQuery 의존성 추가

  // 파일 열기 이벤트 리스너 등록
  useEffect(() => {
    if (!service || !app.workspace) return;
    
    // 파일 열기 이벤트 리스너 등록 (활성 리프 변경 대신)
    const removeListener = app.workspace.on('file-open', async (file: TFile | null) => {
      if (isCardSetFixed || !file) return; // 카드 세트가 고정된 경우 또는 파일이 없는 경우 무시
      
      await handleActiveFileChange(file);
    });
    
    // 현재 활성 파일 처리
    const activeFile = app.workspace.getActiveFile();
    if (activeFile) {
      handleActiveFileChange(activeFile);
    }
    
    // 컴포넌트 언마운트 시 이벤트 리스너 제거
    return () => {
      app.workspace.offref(removeListener);
    };
  }, [service, isCardSetFixed, app.workspace, handleActiveFileChange]);
  
  // 카드 세트 고정 상태 변경 시 활성 파일 처리
  useEffect(() => {
    if (!service) return;
    
    // 카드 세트가 고정되지 않은 상태로 변경된 경우, 현재 활성 파일 기준으로 카드 세트 업데이트
    if (!isCardSetFixed) {
      const activeFile = app.workspace.getActiveFile();
      if (activeFile) {
        const modeService = service.getModeService();
        modeService.handleActiveFileChange(activeFile);
        
        // 카드 목록 갱신
        service.getCards().then(updatedCards => {
          setCards(updatedCards.map(mapCardToProps));
        });
      }
    }
  }, [isCardSetFixed, service, app.workspace, searchQuery]); // 의존성 배열 최적화

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

  // 모드 변경 처리
  const handleModeChange = async (mode: ModeType) => {
    if (!service) return;
    
    try {
      // 모드 변경
      await service.getModeService().changeMode(mode);
      setCurrentMode(mode);
      
      // 카드 목록 가져오기
      const filteredCards = await service.getCards();
      setCards(filteredCards.map(mapCardToProps));
      
      // 상태 정보 콘솔에 출력
      logCardNavigatorStatus(service);
    } catch (error) {
      console.error('모드 변경 중 오류 발생:', error);
    }
  };

  // 카드 세트 선택 처리
  const handleCardSetSelect = async (cardSet: string, isFixed: boolean) => {
    if (!service) return;
    
    try {
      // 카드 세트 선택
      await service.getModeService().selectCardSet(cardSet, isFixed);
      setIsCardSetFixed(isFixed);
      
      // 카드 목록 가져오기
      const filteredCards = await service.getCards();
      
      // 카드 로드 횟수 증가
      setCardLoadCount(prev => prev + 1);
      console.log(`[성능] 카드 세트 선택 후 카드 로드 횟수: ${cardLoadCount + 1}, 카드 수: ${filteredCards.length}`);
      
      setCards(filteredCards.map(mapCardToProps));
      
      // 상태 정보 콘솔에 출력
      logCardNavigatorStatus(service);
    } catch (error) {
      console.error('카드 세트 선택 중 오류 발생:', error);
    }
  };

  // 하위 폴더 포함 여부 변경 처리
  const handleIncludeSubfoldersChange = async (include: boolean) => {
    if (!service) return;
    
    try {
      // 하위 폴더 포함 여부 변경
      await service.getModeService().setIncludeSubfolders(include);
      setIncludeSubfolders(include);
      
      const filteredCards = await service.getCards();
      setCards(filteredCards.map(mapCardToProps));
    } catch (error) {
      console.error('하위 폴더 포함 여부 변경 중 오류 발생:', error);
    }
  };

  // 정렬 변경 처리
  const handleSortChange = async (sortType: SortType, sortDirection: SortDirection) => {
    if (!service) return;
    
    try {
      // 정렬 변경
      await service.getSortService().setSortType(sortType, sortDirection);
      
      const sortedCards = await service.getCards();
      setCards(sortedCards.map(mapCardToProps));
    } catch (error) {
      console.error('정렬 변경 중 오류 발생:', error);
    }
  };

  // 레이아웃 변경 처리
  const handleLayoutChange = async (layoutType: 'grid' | 'masonry') => {
    setLayout(layoutType);
  };

  // 프리셋 적용 처리
  const handlePresetApply = async (presetId: string) => {
    if (!service) return;
    
    try {
      // 프리셋 적용
      await service.getPresetService().applyPreset(presetId);
      
      const filteredCards = await service.getCards();
      setCards(filteredCards.map(mapCardToProps));
    } catch (error) {
      console.error('프리셋 적용 중 오류 발생:', error);
    }
  };

  /**
   * 검색 모드 토글
   */
  const toggleSearchMode = useCallback(() => {
    if (service) {
      if (currentMode !== 'search') {
        // 검색 모드로 전환
        setCurrentMode('search');
        service.changeMode('search');
        
        // 설정에서 기본 검색 범위 가져와서 설정
        service.getSettings().then(settings => {
          const defaultScope = settings.defaultSearchScope || 'current';
          service.getSearchService().setSearchScope(defaultScope);
          console.log(`검색 모드 활성화: 검색 범위 ${defaultScope}로 설정됨`);
        });
      } else {
        // 이전 모드로 복귀
        setCurrentMode(previousMode);
        service.changeMode(previousMode);
      }
    }
  }, [service, currentMode, previousMode]);

  // 검색 핸들러
  const handleSearch = (query: string, type = 'filename') => {
    if (!service) return;
    
    // 검색어 상태 업데이트
    setSearchQuery(query);
    setSearchType(type as SearchType);
    
    // 검색어가 비어있으면 검색 모드 종료하고 이전 모드로 복귀
    if (!query.trim()) {
      if (isSearchMode) {
        console.log('[CardNavigatorView] 검색어가 비어있어 검색 모드 종료');
        toggleSearchMode();
      }
      return;
    }
    
    // 검색 모드가 아니면 검색 모드로 전환
    if (!isSearchMode) {
      // 검색 모드로 전환 전 현재 카드셋 저장
      service.getSearchService().setPreSearchCards(mapPropsArrayToCardArray(cards));
      toggleSearchMode();
    }
    
    // 검색 실행
    searchCards(query, type);
  };

  // 검색 실행
  const searchCards = async (query: string, type: string) => {
    if (!service) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`[CardNavigatorView] 검색 시작: 쿼리="${query}", 타입=${type}`);
      
      // 검색 서비스 가져오기
      const searchService = service.getSearchService();
      
      // 검색 쿼리 설정
      searchService.setSearchQuery(query);
      
      // 검색 타입 설정
      switch (type) {
        case 'content':
          searchService.changeSearchType('content');
          break;
        case 'tag':
          searchService.changeSearchType('tag');
          break;
        case 'folder':
          searchService.changeSearchType('folder');
          break;
        case 'path':
          searchService.changeSearchType('path');
          break;
        case 'filename':
          searchService.changeSearchType('filename');
          break;
        case 'create':
          searchService.changeSearchType('create');
          break;
        case 'modify':
          searchService.changeSearchType('modify');
          break;
        case 'complex':
          // 복합 검색은 별도 처리
          break;
        default:
          // frontmatter 검색인 경우
          if (type.startsWith('frontmatter:')) {
            const frontmatterKey = type.substring(12);
            searchService.changeSearchType('frontmatter', frontmatterKey);
          } else {
            // 기본값은 파일명 검색
            searchService.changeSearchType('filename');
          }
          break;
      }
      
      // 모든 카드 가져오기
      const allCards = await service.getCards();
      
      console.log(`[CardNavigatorView] 전체 카드: ${allCards.length}개`);
      
      // 검색 적용 (비동기 메서드 처리)
      let filteredCards: ICard[];
      if (type === 'complex') {
        filteredCards = await searchService.applyComplexSearch(query, allCards);
      } else {
        filteredCards = await searchService.applySearch(allCards);
      }
      
      console.log(`[CardNavigatorView] 검색 결과: ${filteredCards.length}개의 카드 찾음`);
      
      // 결과 설정
      setCards(filteredCards.map(mapCardToProps));
      setIsLoading(false);
    } catch (error) {
      console.error('[CardNavigatorView] 카드 검색 중 오류 발생:', error);
      setError('검색 중 오류가 발생했습니다.');
      setIsLoading(false);
    }
  };

  // 카드 로드
  const loadCards = async () => {
    if (!service) return;
    
    // 이미 로딩 중이면 중복 로드 방지
    if (isLoading) {
      console.log('[CardNavigatorView] 이미 로딩 중입니다. 중복 로드 방지');
      return;
    }
    
    setIsLoading(true);
    setError(null);

    try {
      console.log('[CardNavigatorView] 카드 로드 시작');
      const cards = await service.getCards();
      console.log(`[CardNavigatorView] 카드 로드 완료: ${cards.length}개의 카드`);
      
      // 카드 매핑
      setCards(cards.map(mapCardToProps));
      setIsLoading(false);
    } catch (error) {
      console.error('[CardNavigatorView] 카드 로드 중 오류 발생:', error);
      setError('카드를 로드하는 중 오류가 발생했습니다.');
      setIsLoading(false);
    }
  };

  // 모드 토글 핸들러
  const handleModeToggle = () => {
    if (currentMode === 'folder') {
      handleModeChange('tag');
    } else {
      handleModeChange('folder');
    }
  };

  return (
    <div className="card-navigator-container">
      <Toolbar
        onModeChange={handleModeChange}
        currentMode={currentMode}
        onSortChange={handleSortChange}
        onLayoutChange={handleLayoutChange}
        onCardSetSelect={handleCardSetSelect}
        onIncludeSubfoldersChange={handleIncludeSubfoldersChange}
        onPresetApply={handlePresetApply}
        onPresetSave={() => {
          // 프리셋 저장 처리
          if (service) {
            service.saveAsPreset('새 프리셋');
          }
        }}
        onPresetDelete={(presetId) => {
          // 프리셋 삭제 처리
          if (service) {
            const presetService = service.getPresetService();
            presetService.deletePreset(presetId);
          }
        }}
        currentLayout={layout}
        service={service}
        app={app}
        isSearchMode={isSearchMode}
        toggleSearchMode={toggleSearchMode}
        onSearch={handleSearch}
        cardSet=""
        cardSets={{
          folders: [],
          tags: []
        }}
        isFixed={isCardSetFixed}
        onModeToggle={handleModeToggle}
      />
      
      <div className={`card-navigator-search-wrapper ${isSearchMode ? 'visible' : 'hidden'}`}>
        <SearchBar 
          cardNavigatorService={service} 
          onSearch={handleSearch}
          currentCards={cards}
        />
      </div>
      
      {isLoading ? (
        <div className="card-navigator-loading">카드를 불러오는 중...</div>
      ) : error ? (
        <div className="card-navigator-error">{error}</div>
      ) : cards.length === 0 ? (
        <CardContainer
          cards={[]}
          layout={layout}
          searchQuery={searchQuery}
          onCardClick={() => {}}
          emptyMessage={searchQuery ? '검색 결과가 없습니다.' : '카드가 없습니다.'}
        />
      ) : (
        <CardContainer
          cards={cards}
          layout={layout}
          searchQuery={currentMode === 'search' ? searchQuery : ''}
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
    try {
      console.log('[CardNavigatorView] onOpen 시작');
      
      // 컨테이너 요소 준비
      const container = this.containerEl.children[1];
      container.empty();
      container.addClass('card-navigator-view');
      container.addClass('card-navigator-visible');
      
      // 루트 요소 생성
      const rootEl = createDiv({ cls: 'card-navigator-root card-navigator-visible' });
      rootEl.style.opacity = '1';
      rootEl.style.visibility = 'visible';
      container.appendChild(rootEl);
      
      console.log('[CardNavigatorView] 루트 요소 생성 완료');
      
      // React 루트 생성 및 컴포넌트 렌더링
      try {
        const root = createRoot(rootEl);
        
        // 렌더링 전 상태 확인
        console.log('[CardNavigatorView] React 루트 생성 완료, 렌더링 시작');
        
        // 컴포넌트 렌더링
        root.render(
          <React.StrictMode>
            <CardNavigatorComponent app={this.app} />
          </React.StrictMode>
        );
        
        console.log('[CardNavigatorView] 컴포넌트 렌더링 완료');
        
        // 렌더링 후 DOM 요소 확인
        setTimeout(() => {
          const cardNavigatorElements = container.querySelectorAll('.card-navigator-container');
          console.log(`[CardNavigatorView] 카드 네비게이터 요소 수: ${cardNavigatorElements.length}`);
          
          if (cardNavigatorElements.length === 0) {
            console.warn('[CardNavigatorView] 카드 네비게이터 요소가 없습니다. DOM 재구성 시도');
            this.reRenderComponent(rootEl);
          } else {
            console.log('[CardNavigatorView] 카드 네비게이터 요소 확인 완료');
          }
          
          // 추가 스타일 적용
          const toolbarElements = container.querySelectorAll('.card-navigator-toolbar, .card-navigator-toolbar-left, .card-navigator-toolbar-center, .card-navigator-toolbar-right');
          toolbarElements.forEach(el => {
            (el as HTMLElement).style.opacity = '1';
            (el as HTMLElement).style.visibility = 'visible';
          });
        }, 300);
      } catch (renderError) {
        console.error('[CardNavigatorView] React 렌더링 오류:', renderError);
        this.handleRenderError(container, renderError);
      }
    } catch (error) {
      console.error('[CardNavigatorView] onOpen 오류:', error);
      this.handleRenderError(this.containerEl.children[1], error);
    }
  }
  
  /**
   * 컴포넌트 재렌더링 시도
   */
  private reRenderComponent(rootEl: HTMLElement) {
    try {
      console.log('[CardNavigatorView] 컴포넌트 재렌더링 시도');
      
      // 기존 내용 제거
      rootEl.empty();
      
      // 새로운 React 루트 생성 및 컴포넌트 렌더링
      const newRoot = createRoot(rootEl);
      newRoot.render(<CardNavigatorComponent app={this.app} />);
      
      console.log('[CardNavigatorView] 컴포넌트 재렌더링 완료');
    } catch (error) {
      console.error('[CardNavigatorView] 컴포넌트 재렌더링 오류:', error);
    }
  }
  
  /**
   * 렌더링 오류 처리
   */
  private handleRenderError(container: Element, error: any) {
    try {
      // 오류 메시지 표시
      const errorEl = createDiv({ cls: 'card-navigator-error' });
      errorEl.setText('카드 네비게이터 렌더링 중 오류가 발생했습니다.');
      
      // 오류 세부 정보 표시
      const errorDetailsEl = createDiv({ cls: 'card-navigator-error-details' });
      errorDetailsEl.setText(error?.message || '알 수 없는 오류');
      errorEl.appendChild(errorDetailsEl);
      
      // 재시도 버튼 추가
      const retryButton = createEl('button', { cls: 'card-navigator-retry-button' });
      retryButton.setText('다시 시도');
      retryButton.addEventListener('click', () => {
        // 컨테이너 초기화 후 onOpen 다시 호출
        container.empty();
        this.onOpen();
      });
      errorEl.appendChild(retryButton);
      
      container.appendChild(errorEl);
    } catch (handlerError) {
      console.error('[CardNavigatorView] 오류 처리 중 추가 오류 발생:', handlerError);
    }
  }

  async onClose() {
    // 정리 작업
  }
} 