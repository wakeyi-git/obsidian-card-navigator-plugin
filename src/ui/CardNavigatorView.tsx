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
          
          setCards(mapDomainCardsToProps(initialCards));
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

  // 활성 파일 변경 이벤트 리스너 등록
  useEffect(() => {
    if (!service) return;
    
    // 마지막으로 처리한 파일 경로를 저장하는 변수
    let lastProcessedFilePath: string | null = null;
    
    // 활성 파일 변경 이벤트 리스너
    const handleActiveFileChange = async (file: TFile | null) => {
      if (!file) return;
      
      // 이미 처리한 파일이면 중복 처리 방지
      if (lastProcessedFilePath === file.path) {
        console.log(`[CardNavigatorView] 이미 처리한 파일입니다: ${file.path}`);
        return;
      }
      
      // 현재 처리 중인 파일 경로 저장
      lastProcessedFilePath = file.path;
      
      const modeService = service.getModeService();
      
      // 카드 세트가 고정되지 않은 경우에만 활성 파일 변경 처리
      if (!modeService.isCardSetFixed()) {
        console.log(`[CardNavigatorView] 활성 파일 변경 감지: ${file.path}`);
        
        // ModeService의 handleActiveFileChange 호출
        modeService.handleActiveFileChange(file);
        
        // 카드 목록 갱신
        const updatedCards = await service.getCards();
        setCardLoadCount(prev => prev + 1);
        console.log(`[CardNavigatorView] 활성 파일 변경 후 카드 로드 횟수: ${cardLoadCount + 1}, 카드 수: ${updatedCards.length}`);
        
        setCards(mapDomainCardsToProps(updatedCards));
        
        // 상태 정보 콘솔에 출력
        logCardNavigatorStatus(service);
      }
    };
    
    // 이벤트 리스너 등록
    const eventRef = app.workspace.on('file-open', handleActiveFileChange);
    
    // 현재 활성 파일이 있으면 처리
    const activeFile = app.workspace.getActiveFile();
    if (activeFile) {
      handleActiveFileChange(activeFile);
    }
    
    // 컴포넌트 언마운트 시 이벤트 리스너 제거
    return () => {
      app.workspace.offref(eventRef);
    };
  }, [service, app]); // cardLoadCount 의존성 제거
  
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
          setCards(mapDomainCardsToProps(updatedCards));
        });
      }
    }
  }, [isCardSetFixed, service, app]);

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
    
    setIsLoading(true);
    
    try {
      console.time('[성능] 검색 실행 시간');
      
      // 검색 수행
      await service.search(query);
      
      // 카드 목록 가져오기
      const filteredCards = await service.getCards();
      setCards(mapDomainCardsToProps(filteredCards));
      
      // 상태 정보 콘솔에 출력
      logCardNavigatorStatus(service);
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
    
    setIsLoading(true);
    
    try {
      console.time('[성능] 검색 타입 변경 실행 시간');
      
      // 검색 모드 서비스 가져오기
      const modeService = service.getModeService();
      
      // 검색 모드 설정
      if (modeService.getCurrentModeType() === 'search') {
        (modeService as any).configureSearchMode(
          (modeService.getCurrentMode() as any).query || '',
          type,
          (modeService.getCurrentMode() as any).caseSensitive || false,
          frontmatterKey
        );
      }
      
      // 카드 목록 가져오기
      const filteredCards = await service.getCards();
      setCards(mapDomainCardsToProps(filteredCards));
      
      // 상태 정보 콘솔에 출력
      logCardNavigatorStatus(service);
      console.timeEnd('[성능] 검색 타입 변경 실행 시간');
    } catch (error) {
      console.error('검색 타입 변경 중 오류 발생:', error);
      setError('검색 타입 변경 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // 대소문자 구분 변경 처리
  const handleCaseSensitiveChange = async (caseSensitive: boolean) => {
    if (!service) return;
    
    setIsLoading(true);
    
    try {
      console.time('[성능] 대소문자 구분 변경 실행 시간');
      
      // 검색 모드 서비스 가져오기
      const modeService = service.getModeService();
      
      // 검색 모드 설정
      if (modeService.getCurrentModeType() === 'search') {
        (modeService as any).configureSearchMode(
          (modeService.getCurrentMode() as any).query || '',
          (modeService.getCurrentMode() as any).searchType || 'content',
          caseSensitive,
          (modeService.getCurrentMode() as any).frontmatterKey
        );
      }
      
      // 카드 목록 가져오기
      const filteredCards = await service.getCards();
      setCards(mapDomainCardsToProps(filteredCards));
      
      // 상태 정보 콘솔에 출력
      logCardNavigatorStatus(service);
      console.timeEnd('[성능] 대소문자 구분 변경 실행 시간');
    } catch (error) {
      console.error('대소문자 구분 변경 중 오류 발생:', error);
      setError('대소문자 구분 변경 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 모드 변경 처리
  const handleModeChange = async (mode: ModeType) => {
    if (!service) return;
    
    setIsLoading(true);
    
    try {
      console.time('[성능] 모드 변경 실행 시간');
      
      // 모드 변경
      await service.changeMode(mode);
      setCurrentMode(mode);
      
      // 카드 목록 가져오기
      const filteredCards = await service.getCards();
      setCards(mapDomainCardsToProps(filteredCards));
      
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