import { useState, useEffect, useCallback } from 'react';
import { App, TFile } from 'obsidian';
import { ICardNavigatorService } from '../../application/CardNavigatorService';
import { CardSetSourceType } from '../../domain/cardset/CardSet';
import { SortDirection, SortType } from '../../domain/sorting/Sort';
import { SearchType } from '../../domain/search/Search';
import { createCardNavigatorService } from '../utils/serviceFactory';
import { TimerUtil } from '../../infrastructure/TimerUtil';
import { ICard } from '../../domain/card/Card';
import { IPreset } from '../../domain/preset/Preset';

/**
 * 서비스 초기화 훅 반환 타입
 */
interface UseCardNavigatorServiceReturn {
  currentCardSetSource: CardSetSourceType;
  currentCardSet: string | null;
  isCardSetFixed: boolean;
  includeSubfolders: boolean;
  currentSortType: SortType;
  currentSortDirection: SortDirection;
  layout: 'grid' | 'masonry';
  searchType: SearchType;
  caseSensitive: boolean;
  frontmatterKey: string;
  error: string | null;
  
  setCurrentCardSetSource: (cardSetSource: CardSetSourceType) => void;
  setCurrentCardSet: (cardSet: string | null) => void;
  setIsCardSetFixed: (isFixed: boolean) => void;
  setIncludeSubfolders: (include: boolean) => void;
  setCurrentSortType: (type: SortType) => void;
  setCurrentSortDirection: (direction: SortDirection) => void;
  setLayout: (layout: 'grid' | 'masonry') => void;
  setSearchType: (type: SearchType) => void;
  setCaseSensitive: (sensitive: boolean) => void;
  setFrontmatterKey: (key: string) => void;
  
  refreshCards: () => Promise<void>;
  handleCardClick: (id: string) => void;
  handleSearch: (query: string) => Promise<void>;
  handlePresetApply: (presetId: string) => Promise<void>;
  handlePresetSave: () => Promise<IPreset>;
  handlePresetDelete: (presetId: string) => Promise<void>;
}

/**
 * 카드 네비게이터 서비스 초기화 및 관리를 위한 커스텀 훅
 * @param service 카드 네비게이터 서비스 인스턴스
 * @returns 서비스 초기화 관련 상태와 함수
 */
export const useCardNavigatorService = (service: ICardNavigatorService): UseCardNavigatorServiceReturn => {
  const [currentCardSetSource, setCurrentCardSetSourceState] = useState<CardSetSourceType>('folder');
  const [currentCardSet, setCurrentCardSetState] = useState<string | null>(null);
  const [isCardSetFixed, setIsCardSetFixedState] = useState<boolean>(false);
  const [includeSubfolders, setIncludeSubfoldersState] = useState<boolean>(true);
  const [currentSortType, setCurrentSortTypeState] = useState<SortType>('filename');
  const [currentSortDirection, setCurrentSortDirectionState] = useState<SortDirection>('asc');
  const [layout, setLayoutState] = useState<'grid' | 'masonry'>('grid');
  const [searchType, setSearchTypeState] = useState<SearchType>('content');
  const [caseSensitive, setCaseSensitiveState] = useState<boolean>(false);
  const [frontmatterKey, setFrontmatterKeyState] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  
  // 초기 설정 로드
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await service.getSettings();
        
        setCurrentCardSetSourceState(settings.defaultCardSetSource);
        setIsCardSetFixedState(settings.isCardSetFixed);
        setIncludeSubfoldersState(settings.includeSubfolders);
        setLayoutState(settings.defaultLayout);
        setCaseSensitiveState(settings.tagCaseSensitive || false);
        
        if (settings.isCardSetFixed) {
          // 고정된 카드셋 설정
          if (settings.defaultCardSetSource === 'folder' && settings.defaultFolderCardSet) {
            setCurrentCardSetState(settings.defaultFolderCardSet);
          } else if (settings.defaultCardSetSource === 'tag' && settings.defaultTagCardSet) {
            setCurrentCardSetState(settings.defaultTagCardSet);
          }
        }
        
        // 정렬 설정 가져오기
        const sortService = service.getSortService();
        const currentSort = sortService.getCurrentSort();
        if (currentSort) {
          setCurrentSortTypeState(currentSort.type);
          setCurrentSortDirectionState(currentSort.direction);
        }
      } catch (error) {
        console.error('설정 로드 중 오류 발생:', error);
        setError('설정을 로드하는 중 오류가 발생했습니다.');
      }
    };
    
    // 현재 카드 세트 정보 업데이트 함수
    const updateCurrentCardSet = () => {
      try {
        if (service) {
          const cardSetSourceService = service.getCardSetSourceService();
          
          // 카드 세트 서비스가 초기화되었는지 확인
          if (!cardSetSourceService) {
            console.log('[useCardNavigatorService] 카드 세트 서비스가 아직 초기화되지 않았습니다.');
            return;
          }
          
          const currentCardSetObj = cardSetSourceService.getCurrentCardSet();
          const isFixed = cardSetSourceService.isCardSetFixed();
          
          // 값이 변경된 경우에만 상태 업데이트 및 로그 출력
          if ((currentCardSetObj?.source !== currentCardSet) || isFixed !== isCardSetFixed) {
            console.log(`[useCardNavigatorService] 현재 카드 세트 업데이트: ${currentCardSetObj?.source}, 고정 여부: ${isFixed}`);
            
            setCurrentCardSetState(currentCardSetObj?.source || null);
            setIsCardSetFixedState(isFixed);
          }
        }
      } catch (error) {
        console.error('[useCardNavigatorService] 현재 카드 세트 업데이트 중 오류 발생:', error);
      }
    };
    
    // 초기 로드
    loadSettings();
    
    // 설정 변경 감지를 위한 이벤트 리스너 등록
    const settingsChangeHandler = (changedSettings?: any) => {
      console.log('[useCardNavigatorService] 설정 변경 감지, 설정 다시 로드', changedSettings);
      
      // 변경된 설정이 있는 경우 해당 설정만 업데이트
      if (changedSettings) {
        if (changedSettings.defaultCardSetSource !== undefined) {
          setCurrentCardSetSourceState(changedSettings.defaultCardSetSource);
        }
        
        if (changedSettings.isCardSetFixed !== undefined) {
          setIsCardSetFixedState(changedSettings.isCardSetFixed);
        }
        
        if (changedSettings.includeSubfolders !== undefined) {
          setIncludeSubfoldersState(changedSettings.includeSubfolders);
        }
        
        if (changedSettings.defaultLayout !== undefined) {
          setLayoutState(changedSettings.defaultLayout);
        }
        
        if (changedSettings.tagCaseSensitive !== undefined) {
          setCaseSensitiveState(changedSettings.tagCaseSensitive);
        }
        
        // 카드셋 업데이트
        updateCurrentCardSet();
      } else {
        // 변경된 설정이 없는 경우 전체 설정 다시 로드
        loadSettings();
      }
    };
    
    // 이벤트 리스너 등록
    service.getApp().workspace.on('card-navigator:settings-changed', settingsChangeHandler);
    
    // 카드 세트 변경 이벤트 리스너 등록
    const cardSetSourceService = service.getCardSetSourceService();
    
    // 카드 세트 변경 이벤트 핸들러
    const cardSetChangedHandler = () => {
      console.log('[useCardNavigatorService] 카드 세트 변경 감지');
      updateCurrentCardSet();
    };
    
    // 소스 변경 이벤트 핸들러
    const sourceChangedHandler = () => {
      console.log('[useCardNavigatorService] 카드 세트 소스 변경 감지');
      updateCurrentCardSet();
    };
    
    // 이벤트 리스너 등록
    cardSetSourceService.on('cardSetChanged', cardSetChangedHandler);
    cardSetSourceService.on('sourceChanged', sourceChangedHandler);
    
    // 컴포넌트 언마운트 시 이벤트 리스너 제거
    return () => {
      service.getApp().workspace.off('card-navigator:settings-changed', settingsChangeHandler);
      cardSetSourceService.off('cardSetChanged', cardSetChangedHandler);
      cardSetSourceService.off('sourceChanged', sourceChangedHandler);
    };
  }, [service, currentCardSet, isCardSetFixed]);
  
  // 카드 세트 변경 핸들러
  const setCurrentCardSetSource = useCallback(async (cardSetSource: CardSetSourceType) => {
    try {
      await service.changeCardSetSource(cardSetSource);
      setCurrentCardSetSourceState(cardSetSource);
      setCurrentCardSetState(null);
    } catch (error) {
      console.error('카드 세트 변경 중 오류 발생:', error);
      setError('카드 세트를 변경하는 중 오류가 발생했습니다.');
    }
  }, [service]);
  
  // 카드 세트 변경 핸들러
  const setCurrentCardSet = useCallback(async (cardSet: string | null) => {
    try {
      if (cardSet) {
        await service.selectCardSet(cardSet);
      }
      setCurrentCardSetState(cardSet);
    } catch (error) {
      console.error('카드 세트 변경 중 오류 발생:', error);
      setError('카드 세트를 변경하는 중 오류가 발생했습니다.');
    }
  }, [service]);
  
  // 카드 세트 고정 여부 변경 핸들러
  const setIsCardSetFixed = useCallback(async (isFixed: boolean) => {
    try {
      const settings = await service.getSettings();
      await service.updateSettings({
        ...settings,
        isCardSetFixed: isFixed
      });
      setIsCardSetFixedState(isFixed);
    } catch (error) {
      console.error('카드 세트 고정 여부 변경 중 오류 발생:', error);
      setError('카드 세트 고정 여부를 변경하는 중 오류가 발생했습니다.');
    }
  }, [service]);
  
  // 하위 폴더 포함 여부 변경 핸들러
  const setIncludeSubfolders = useCallback(async (include: boolean) => {
    try {
      const settings = await service.getSettings();
      await service.updateSettings({
        ...settings,
        includeSubfolders: include
      });
      setIncludeSubfoldersState(include);
    } catch (error) {
      console.error('하위 폴더 포함 여부 변경 중 오류 발생:', error);
      setError('하위 폴더 포함 여부를 변경하는 중 오류가 발생했습니다.');
    }
  }, [service]);
  
  // 정렬 타입 변경 핸들러
  const setCurrentSortType = useCallback((type: SortType) => {
    try {
      const sortService = service.getSortService();
      sortService.setSortType(type, currentSortDirection);
      setCurrentSortTypeState(type);
    } catch (error) {
      console.error('정렬 타입 변경 중 오류 발생:', error);
      setError('정렬 타입을 변경하는 중 오류가 발생했습니다.');
    }
  }, [service, currentSortDirection]);
  
  // 정렬 방향 변경 핸들러
  const setCurrentSortDirection = useCallback((direction: SortDirection) => {
    try {
      const sortService = service.getSortService();
      sortService.setSortType(currentSortType, direction);
      setCurrentSortDirectionState(direction);
    } catch (error) {
      console.error('정렬 방향 변경 중 오류 발생:', error);
      setError('정렬 방향을 변경하는 중 오류가 발생했습니다.');
    }
  }, [service, currentSortType]);
  
  // 레이아웃 변경 핸들러
  const setLayout = useCallback(async (layoutType: 'grid' | 'masonry') => {
    try {
      await service.changeLayout(layoutType);
      setLayoutState(layoutType);
    } catch (error) {
      console.error('레이아웃 변경 중 오류 발생:', error);
      setError('레이아웃을 변경하는 중 오류가 발생했습니다.');
    }
  }, [service]);
  
  // 검색 타입 변경 핸들러
  const setSearchType = useCallback(async (type: SearchType) => {
    try {
      await service.changeSearchType(type, frontmatterKey);
      setSearchTypeState(type);
    } catch (error) {
      console.error('검색 타입 변경 중 오류 발생:', error);
      setError('검색 타입을 변경하는 중 오류가 발생했습니다.');
    }
  }, [service, frontmatterKey]);
  
  // 대소문자 구분 여부 변경 핸들러
  const setCaseSensitive = useCallback(async (sensitive: boolean) => {
    try {
      await service.setCaseSensitive(sensitive);
      setCaseSensitiveState(sensitive);
    } catch (error) {
      console.error('대소문자 구분 여부 변경 중 오류 발생:', error);
      setError('대소문자 구분 여부를 변경하는 중 오류가 발생했습니다.');
    }
  }, [service]);
  
  // 프론트매터 키 변경 핸들러
  const setFrontmatterKey = useCallback(async (key: string) => {
    try {
      await service.changeSearchType(searchType, key);
      setFrontmatterKeyState(key);
    } catch (error) {
      console.error('프론트매터 키 변경 중 오류 발생:', error);
      setError('프론트매터 키를 변경하는 중 오류가 발생했습니다.');
    }
  }, [service, searchType]);
  
  // 카드 새로고침 핸들러
  const refreshCards = useCallback(async () => {
    try {
      await service.refreshCards();
    } catch (error) {
      console.error('카드 새로고침 중 오류 발생:', error);
      setError('카드를 새로고침하는 중 오류가 발생했습니다.');
    }
  }, [service]);
  
  // 카드 클릭 핸들러
  const handleCardClick = useCallback((id: string) => {
    try {
      const app = service.getApp();
      const cardService = service.getCardService();
      
      cardService.getCardById(id).then(card => {
        if (card && card.path) {
          // 파일 열기
          const file = app.vault.getAbstractFileByPath(card.path);
          if (file) {
            app.workspace.getLeaf().openFile(file as any);
          }
        }
      });
    } catch (error) {
      console.error('카드 클릭 처리 중 오류 발생:', error);
      setError('카드 클릭을 처리하는 중 오류가 발생했습니다.');
    }
  }, [service]);
  
  // 검색 핸들러
  const handleSearch = useCallback(async (query: string) => {
    try {
      await service.search(query, 'filename', false);
    } catch (error) {
      console.error('검색 중 오류 발생:', error);
      setError('검색하는 중 오류가 발생했습니다.');
    }
  }, [service]);
  
  // 프리셋 적용 핸들러
  const handlePresetApply = useCallback(async (presetId: string) => {
    try {
      await service.applyPreset(presetId);
      
      // 설정 다시 로드
      const settings = await service.getSettings();
      
      setCurrentCardSetSourceState(settings.defaultCardSetSource);
      setIsCardSetFixedState(settings.isCardSetFixed);
      setIncludeSubfoldersState(settings.includeSubfolders);
      setLayoutState(settings.defaultLayout);
      setCaseSensitiveState(settings.tagCaseSensitive || false);
      
      if (settings.isCardSetFixed) {
        // 고정된 카드셋 설정
        if (settings.defaultCardSetSource === 'folder' && settings.defaultFolderCardSet) {
          setCurrentCardSetState(settings.defaultFolderCardSet);
        } else if (settings.defaultCardSetSource === 'tag' && settings.defaultTagCardSet) {
          setCurrentCardSetState(settings.defaultTagCardSet);
        }
      }
      
      // 정렬 설정 가져오기
      const sortService = service.getSortService();
      const currentSort = sortService.getCurrentSort();
      if (currentSort) {
        setCurrentSortTypeState(currentSort.type);
        setCurrentSortDirectionState(currentSort.direction);
      }
    } catch (error) {
      console.error('프리셋 적용 중 오류 발생:', error);
      setError('프리셋을 적용하는 중 오류가 발생했습니다.');
    }
  }, [service]);
  
  // 프리셋 저장 핸들러
  const handlePresetSave = useCallback(async () => {
    try {
      const preset = service.saveAsPreset('새 프리셋');
      return preset;
    } catch (error) {
      console.error('프리셋 저장 중 오류 발생:', error);
      setError('프리셋을 저장하는 중 오류가 발생했습니다.');
      throw error;
    }
  }, [service]);
  
  // 프리셋 삭제 핸들러
  const handlePresetDelete = useCallback(async (presetId: string) => {
    try {
      const presetService = service.getPresetService();
      presetService.deletePreset(presetId);
    } catch (error) {
      console.error('프리셋 삭제 중 오류 발생:', error);
      setError('프리셋을 삭제하는 중 오류가 발생했습니다.');
    }
  }, [service]);
  
  return {
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
    error,
    
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
  };
}; 