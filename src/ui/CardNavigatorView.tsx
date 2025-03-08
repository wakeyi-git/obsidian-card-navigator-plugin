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
import { SearchType as DomainSearchType } from '../domain/search/Search';
import { SearchBar } from './toolbar/SearchBar';
import { SearchType as ModeSearchType } from '../domain/mode/SearchMode';
import { ModeType } from '../domain/mode/Mode';
import { TimerUtil } from '../infrastructure/TimerUtil';
import { VIEW_TYPE_CARD_NAVIGATOR } from '../main';

/**
 * 빈 상태 컴포넌트 속성
 */
interface EmptyStateProps {
  mode: ModeType;
  message?: string;
}

/**
 * 빈 상태 컴포넌트
 * 카드가 없거나 태그 모드에서 태그가 없을 때 표시됩니다.
 */
const EmptyState: React.FC<EmptyStateProps> = ({ mode, message }) => {
  // 모드에 따라 다른 메시지와 아이콘 표시
  let title = '';
  let description = '';
  let icon = null;
  
  if (mode === 'tag') {
    title = '태그가 없습니다';
    description = message || '활성 파일에 태그를 추가하면 해당 태그를 가진 노트들이 여기에 표시됩니다.';
    icon = (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
        <line x1="7" y1="7" x2="7.01" y2="7"></line>
      </svg>
    );
  } else if (mode === 'folder') {
    title = '폴더가 비어 있습니다';
    description = message || '이 폴더에는 노트가 없습니다. 노트를 추가하면 여기에 표시됩니다.';
    icon = (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
      </svg>
    );
  } else {
    title = '검색 결과가 없습니다';
    description = message || '검색어와 일치하는 노트가 없습니다. 다른 검색어를 입력해보세요.';
    icon = (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
      </svg>
    );
  }
  
  return (
    <div className="card-navigator-empty-tag-message">
      {icon}
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
};

// 카드 네비게이터 뷰 컴포넌트
const CardNavigatorComponent: React.FC<{ app: App }> = ({ app }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [cards, setCards] = useState<ICardProps[]>([]);
  const [currentMode, setCurrentMode] = useState<ModeType>('folder');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<DomainSearchType>('filename');
  const [frontmatterKey, setFrontmatterKey] = useState<string>('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [layout, setLayout] = useState<'grid' | 'masonry'>('grid');
  const [service, setService] = useState<ICardNavigatorService | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCardSetFixed, setIsCardSetFixed] = useState<boolean>(false);
  const [includeSubfolders, setIncludeSubfolders] = useState<boolean>(true);
  const [isSearchMode, setIsSearchMode] = useState<boolean>(false);
  const [previousMode, setPreviousMode] = useState<ModeType>('folder');
  const [currentSortType, setCurrentSortType] = useState<SortType>('filename');
  const [currentSortDirection, setCurrentSortDirection] = useState<SortDirection>('asc');
  const [currentCardSet, setCurrentCardSet] = useState<string | null>(null);
  
  // 성능 모니터링을 위한 카운터
  const [renderCount, setRenderCount] = useState<number>(0);
  const [cardLoadCount, setCardLoadCount] = useState<number>(0);
  
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
    // 서비스 초기화
    const initializeService = async () => {
      try {
        // 서비스 생성
        const newService = await createCardNavigatorService(app);
        setService(newService);
        
        // 모드 서비스 가져오기
        const modeService = newService.getModeService();
        
        // 현재 모드 가져오기
        const currentModeType = modeService.getCurrentModeType();
        setCurrentMode(currentModeType);
        
        // 카드 세트 고정 여부 가져오기
        const isFixed = modeService.isCardSetFixed();
        setIsCardSetFixed(isFixed);
        
        // 하위 폴더 포함 여부 가져오기
        const includeSubfolders = modeService.getIncludeSubfolders();
        setIncludeSubfolders(includeSubfolders);
        
        // 현재 카드 세트 가져오기
        const currentSet = modeService.getCurrentCardSet();
        setCurrentCardSet(currentSet);
        
        // 카드 목록 가져오기
        const cards = await newService.getCards();
        setCards(cards.map(mapCardToProps));
        setIsLoading(false);
      } catch (error) {
        console.error('서비스 초기화 중 오류 발생:', error);
        setError('서비스 초기화 중 오류가 발생했습니다.');
        setIsLoading(false);
      }
    };
    
    initializeService();
  }, [app]);

  // isSearchMode 상태가 변경될 때 로그 출력
  useEffect(() => {
    console.log(`[CardNavigatorView] isSearchMode 상태 변경: ${isSearchMode}`);
  }, [isSearchMode]);

  // currentCardSet 상태가 변경될 때 로그 출력
  useEffect(() => {
    console.log(`[CardNavigatorView] currentCardSet 상태 변경: ${currentCardSet}`);
    console.log(`[CardNavigatorView] Toolbar 렌더링 시 전달되는 cardSet: ${currentCardSet}`);
  }, [currentCardSet]);

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
      
      // 현재 카드 세트 상태 항상 업데이트
      const currentSet = modeService.getCurrentCardSet();
      setCurrentCardSet(currentSet);
      
      // 카드 세트 고정 여부 상태 업데이트
      const isFixed = modeService.isCardSetFixed();
      setIsCardSetFixed(isFixed);
      
      console.log(`[CardNavigatorView] 현재 카드 세트 업데이트: ${currentSet}, 고정 여부: ${isFixed}`);
      
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
      // 비동기 함수 즉시 실행
      (async () => {
        await handleActiveFileChange(activeFile);
      })();
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
        
        // 비동기 처리를 위한 즉시 실행 함수
        (async () => {
          await modeService.handleActiveFileChange(activeFile);
          
          // 현재 카드 세트 상태 업데이트
          const currentSet = modeService.getCurrentCardSet();
          setCurrentCardSet(currentSet);
          
          // 카드 세트 고정 여부 상태 업데이트 (이미 false로 설정되어 있지만 일관성을 위해 유지)
          const isFixed = modeService.isCardSetFixed();
          setIsCardSetFixed(isFixed);
          
          console.log(`[CardNavigatorView] 고정 해제 후 현재 카드 세트 업데이트: ${currentSet}, 고정 여부: ${isFixed}`);
          
          // 카드 목록 갱신
          const updatedCards = await service.getCards();
          setCards(updatedCards.map(mapCardToProps));
        })();
      }
    } else {
      // 카드 세트가 고정된 상태로 변경된 경우, 로그 출력
      console.log(`[CardNavigatorView] 카드 세트가 고정되었습니다. 활성 파일 변경에 반응하지 않습니다.`);
    }
  }, [isCardSetFixed, service, app.workspace]);

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
      
      // 현재 카드 세트 상태 업데이트
      const modeService = service.getModeService();
      const currentSet = modeService.getCurrentCardSet();
      setCurrentCardSet(currentSet);
      
      // 카드 세트 고정 여부 업데이트
      const isFixed = modeService.isCardSetFixed();
      setIsCardSetFixed(isFixed);
      
      console.log(`[CardNavigatorView] 모드 변경 후 현재 카드 세트 업데이트: ${currentSet}, 고정 여부: ${isFixed}`);
      
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
      console.log(`[CardNavigatorView] handleCardSetSelect 호출: cardSet=${cardSet}, isFixed=${isFixed}`);
      
      // 카드 세트 선택
      await service.getModeService().selectCardSet(cardSet, isFixed);
      
      // 상태 업데이트 전 로그
      console.log(`[CardNavigatorView] 상태 업데이트 전: currentCardSet=${currentCardSet}, isCardSetFixed=${isCardSetFixed}`);
      
      // 상태 업데이트
      setIsCardSetFixed(isFixed);
      setCurrentCardSet(cardSet);
      
      // 상태 업데이트 후 서비스에서 값 확인
      const modeService = service.getModeService();
      const serviceCardSet = modeService.getCurrentCardSet();
      const serviceIsFixed = modeService.isCardSetFixed();
      
      console.log(`[CardNavigatorView] 카드 세트 선택 후 상태 업데이트: currentCardSet=${cardSet}, isCardSetFixed=${isFixed}`);
      console.log(`[CardNavigatorView] 서비스 확인: serviceCardSet=${serviceCardSet}, serviceIsFixed=${serviceIsFixed}`);
      
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
  const toggleSearchMode = useCallback(async () => {
    if (service) {
      console.log(`[CardNavigatorView] 검색 모드 토글: 현재 모드=${currentMode}, isSearchMode=${isSearchMode}`);
      
      if (currentMode !== 'search') {
        // 검색 모드로 전환
        console.log('[CardNavigatorView] 검색 모드로 전환');
        setCurrentMode('search');
        setIsSearchMode(true);
        await service.changeMode('search');
        
        // 설정에서 기본 검색 범위 가져와서 설정
        try {
          const settings = await service.getSettings();
          const defaultScope = settings && settings.defaultSearchScope ? settings.defaultSearchScope : 'current';
          service.getSearchService().setSearchScope(defaultScope);
          console.log(`[CardNavigatorView] 검색 모드 활성화: 검색 범위 ${defaultScope}로 설정됨`);
        } catch (error) {
          console.error('[CardNavigatorView] 검색 모드 전환 중 오류 발생:', error);
          // 예외 발생 시 기본값 사용
          service.getSearchService().setSearchScope('current');
        }
      } else {
        // 이전 모드로 복귀
        console.log(`[CardNavigatorView] 이전 모드(${previousMode})로 복귀`);
        setCurrentMode(previousMode);
        setIsSearchMode(false);
        await service.changeMode(previousMode);
      }
      
      // 상태 변경 후 로그
      setTimeout(() => {
        console.log(`[CardNavigatorView] 검색 모드 토글 후: 현재 모드=${currentMode}, isSearchMode=${isSearchMode}`);
      }, 0);
    }
  }, [service, currentMode, previousMode, isSearchMode]);

  // 검색 핸들러
  const handleSearch = async (query: string, type = 'filename') => {
    if (!service) return;
    
    // 검색어 상태 업데이트
    setSearchQuery(query);
    setSearchType(type as DomainSearchType);
    
    // 검색어가 비어있으면 검색 모드 종료하고 이전 모드로 복귀
    if (!query.trim()) {
      if (isSearchMode) {
        console.log('[CardNavigatorView] 검색어가 비어있어 검색 모드 종료');
        await toggleSearchMode();
      }
      return;
    }
    
    // 검색 모드가 아니면 검색 모드로 전환
    if (!isSearchMode) {
      // 검색 모드로 전환 전 현재 카드셋 저장
      service.getSearchService().setPreSearchCards(mapPropsArrayToCardArray(cards));
      await toggleSearchMode();
    }
    
    // 검색 실행
    await searchCards(query, type);
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
    
    try {
      setIsLoading(true);
      
      // 현재 카드 세트 가져오기
      const modeService = service.getModeService();
      const currentSet = modeService.getCurrentCardSet();
      setCurrentCardSet(currentSet);
      
      // 카드 가져오기
      const cardList = await service.getCards();
      const cardProps = cardList.map(mapCardToProps);
      
      setCards(cardProps);
      setCardLoadCount(prev => prev + 1);
      setError(null);
    } catch (error) {
      console.error('[CardNavigatorView] 카드 로드 오류:', error);
      setError(`카드 로드 중 오류가 발생했습니다: ${error}`);
    } finally {
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

  // 검색 관련 핸들러 함수들
  const handleSearchTypeChange = (type: DomainSearchType) => {
    setSearchType(type);
    if (service) {
      const searchModeType = convertSearchType(type);
      service.getModeService().configureSearchMode(searchQuery, searchModeType, caseSensitive, frontmatterKey);
    }
  };

  const handleCaseSensitiveChange = (sensitive: boolean) => {
    setCaseSensitive(sensitive);
    if (service) {
      const searchModeType = convertSearchType(searchType);
      service.getModeService().configureSearchMode(searchQuery, searchModeType, sensitive, frontmatterKey);
    }
  };

  const handleFrontmatterKeyChange = (key: string) => {
    setFrontmatterKey(key);
    if (service) {
      const searchModeType = convertSearchType(searchType);
      service.getModeService().configureSearchMode(searchQuery, searchModeType, caseSensitive, key);
    }
  };
  
  // SearchType을 SearchModeType으로 변환하는 함수
  const convertSearchType = (type: DomainSearchType): ModeSearchType => {
    switch (type) {
      case 'filename':
        return 'title';
      case 'content':
        return 'content';
      case 'tag':
        return 'all'; // 태그는 SearchMode에 없으므로 'all'로 매핑
      case 'path':
        return 'path';
      case 'frontmatter':
        return 'frontmatter';
      case 'create':
      case 'modify':
      case 'folder':
        return 'all'; // 이 타입들은 SearchMode에 없으므로 'all'로 매핑
      default:
        return 'all';
    }
  };

  // 카드 상호작용 핸들러 함수들
  const handleCardClick = (cardId: string) => {
    const card = cards.find(c => c.id === cardId);
    if (card && card.path && app) {
      app.workspace.openLinkText(card.path, '', true);
    }
  };

  const handleCardContextMenu = (cardId: string, event: React.MouseEvent) => {
    event.preventDefault();
    // 컨텍스트 메뉴 표시 로직
    const card = cards.find(c => c.id === cardId);
    if (card && service) {
      // 여기에 컨텍스트 메뉴 표시 로직 구현
      console.log(`카드 컨텍스트 메뉴: ${cardId}`);
    }
  };

  const handleCardDragStart = (cardId: string, event: React.DragEvent) => {
    const card = cards.find(c => c.id === cardId);
    if (card) {
      event.dataTransfer.setData('text/plain', card.path || '');
      event.dataTransfer.effectAllowed = 'copy';
    }
  };

  const handleCardDragEnd = (cardId: string, event: React.DragEvent) => {
    // 드래그 종료 처리
  };

  const handleCardDrop = (cardId: string, event: React.DragEvent) => {
    event.preventDefault();
    const sourceCardPath = event.dataTransfer.getData('text/plain');
    const targetCard = cards.find(c => c.id === cardId);
    
    if (sourceCardPath && targetCard && targetCard.path) {
      // 카드 간 드롭 처리 로직
      console.log(`${sourceCardPath}에서 ${targetCard.path}로 드롭`);
    }
  };

  const handleCardDragOver = (cardId: string, event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  };

  const handleCardDragEnter = (cardId: string, event: React.DragEvent) => {
    event.preventDefault();
    // 드래그 진입 시 시각적 피드백
    const element = event.currentTarget as HTMLElement;
    if (element) {
      element.classList.add('card-navigator-drag-over');
    }
  };

  const handleCardDragLeave = (cardId: string, event: React.DragEvent) => {
    event.preventDefault();
    // 드래그 이탈 시 시각적 피드백 제거
    const element = event.currentTarget as HTMLElement;
    if (element) {
      element.classList.remove('card-navigator-drag-over');
    }
  };

  return (
    <div className={`card-navigator-container ${isSearchMode ? 'search-mode' : ''}`}>
      <Toolbar
        key={`toolbar-${currentCardSet || 'empty'}-${currentMode}-${isCardSetFixed ? 'fixed' : 'unfixed'}-${Date.now()}`}
        onModeChange={handleModeChange}
        onCardSetSelect={handleCardSetSelect}
        onIncludeSubfoldersChange={handleIncludeSubfoldersChange}
        onSortChange={handleSortChange}
        onLayoutChange={handleLayoutChange}
        onPresetApply={handlePresetApply}
        currentMode={currentMode}
        isCardSetFixed={isCardSetFixed}
        includeSubfolders={includeSubfolders}
        currentSortType={currentSortType}
        currentSortDirection={currentSortDirection}
        layout={layout}
        service={service}
        cardSet={currentCardSet || ''}
        isSearchMode={isSearchMode}
        toggleSearchMode={toggleSearchMode}
      />
      
      {isSearchMode && (
        <SearchBar
          onSearch={handleSearch}
          onSearchTypeChange={handleSearchTypeChange}
          onCaseSensitiveChange={handleCaseSensitiveChange}
          onFrontmatterKeyChange={handleFrontmatterKeyChange}
          searchQuery={searchQuery}
          searchType={searchType}
          caseSensitive={caseSensitive}
          frontmatterKey={frontmatterKey}
        />
      )}
      
      {isLoading ? (
        <div className="card-navigator-loading">로딩 중...</div>
      ) : error ? (
        <div className="card-navigator-error">{error}</div>
      ) : cards.length === 0 && currentMode === 'tag' && !currentCardSet ? (
        <EmptyState mode="tag" />
      ) : cards.length === 0 ? (
        <EmptyState mode={currentMode} />
      ) : (
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
          service={service}
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
    return VIEW_TYPE_CARD_NAVIGATOR;
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
      container.addClass('card-navigator-container-view');
      
      // React 루트 생성 및 컴포넌트 렌더링
      try {
        const root = createRoot(container);
        
        // 렌더링 전 상태 확인
        console.log('[CardNavigatorView] React 루트 생성 완료, 렌더링 시작');
        
        // 컴포넌트 렌더링
        root.render(
          <React.StrictMode>
            <CardNavigatorComponent app={this.app} />
          </React.StrictMode>
        );
        
        console.log('[CardNavigatorView] 컴포넌트 렌더링 완료');
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

// 카드 네비게이터 서비스 생성 함수
const createCardNavigatorService = async (app: App): Promise<ICardNavigatorService> => {
  const initTimerId = TimerUtil.startTimer('[성능] CardNavigatorService 생성 시간');
  
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
    throw new Error('서비스 초기화 중 오류가 발생했습니다.');
  }
  
  // 서비스 상태 확인
  if (!navigatorService.getCardService() || 
      typeof navigatorService.getCardService().getAllCards !== 'function') {
    console.error('[CardNavigatorView] 카드 서비스가 올바르게 초기화되지 않았습니다.');
    throw new Error('카드 서비스 초기화 오류');
  }
  
  TimerUtil.endTimer(initTimerId);
  return navigatorService;
}; 