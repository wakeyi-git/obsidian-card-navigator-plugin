import { ICardNavigatorService } from '../../../application/CardNavigatorService';
import { ICardProps } from '../../../ui/cards-container/Card';
import { ICard } from '../../../domain/card/Card';
import type { SearchOption } from '../components/SearchOptionSuggest';

/**
 * 추천 검색어 필터링 관련 로직을 담당하는 훅
 */
export const useFilterSuggestedValues = (
  cardNavigatorService: ICardNavigatorService | null,
  currentCards: ICardProps[],
  suggestedValues: string[],
  setSuggestedValues: (values: string[]) => void,
  setShowSuggestedValues: (show: boolean) => void,
  setSelectedSuggestionIndex: (index: number) => void,
  mapPropsArrayToCardArray: (cardProps: ICardProps[]) => ICard[]
) => {
  /**
   * 추천 검색어 필터링
   */
  const filterSuggestedValues = (
    filterText: string,
    currentSearchOption?: SearchOption | null,
    searchScope?: 'all' | 'current',
    isComplexSearch?: boolean
  ) => {
    try {
      // 기본값 설정
      const scope = searchScope || 'current';
      const isComplex = isComplexSearch || false;
      
      if (!filterText) {
        // 필터 텍스트가 없으면 모든 값 표시 (필터링 없이)
        console.log('필터 텍스트가 없음: 모든 추천 검색어 표시');
        setShowSuggestedValues(suggestedValues.length > 0);
        return;
      }
      
      // 현재 검색 옵션에 따른 원본 추천 검색어 가져오기
      if (currentSearchOption && cardNavigatorService) {
        const searchService = cardNavigatorService.getSearchService();
        const currentCardsArray = mapPropsArrayToCardArray(currentCards);
        
        // 원본 추천 검색어 로드 (비동기 처리)
        const loadOriginalValues = async () => {
          try {
            let originalValues: string[] = [];
            
            // 복합 검색인 경우 현재 필터링된 카드 목록을 기반으로 추천 검색어 로드
            if (isComplex) {
              switch (currentSearchOption.type) {
                case 'tag':
                  originalValues = await searchService.getScopedTags(scope, currentCardsArray);
                  break;
                case 'filename':
                  originalValues = await searchService.getScopedFilenames(scope, currentCardsArray);
                  break;
                case 'path':
                  if (scope === 'current') {
                    const paths = new Set<string>();
                    currentCardsArray.forEach(card => {
                      if (card.path) {
                        const folderPath = card.path.split('/').slice(0, -1).join('/');
                        if (folderPath) paths.add(folderPath);
                      }
                    });
                    originalValues = Array.from(paths);
                  } else {
                    originalValues = await searchService.getFolderPaths();
                  }
                  break;
                default:
                  originalValues = suggestedValues;
                  break;
              }
            } else {
              switch (currentSearchOption.type) {
                case 'tag':
                  originalValues = await searchService.getScopedTags(scope, currentCardsArray);
                  break;
                case 'filename':
                  originalValues = await searchService.getScopedFilenames(scope, currentCardsArray);
                  break;
                case 'path':
                  if (scope === 'current') {
                    const paths = new Set<string>();
                    currentCardsArray.forEach(card => {
                      if (card.path) {
                        const folderPath = card.path.split('/').slice(0, -1).join('/');
                        if (folderPath) paths.add(folderPath);
                      }
                    });
                    originalValues = Array.from(paths);
                  } else {
                    originalValues = await searchService.getFolderPaths();
                  }
                  break;
                default:
                  originalValues = suggestedValues;
                  break;
              }
            }
            
            // 중복 제거 및 정렬
            originalValues = [...new Set(originalValues)].sort();
            
            // 필터 텍스트에 따라 추천 검색어 필터링
            const lowerCaseFilter = filterText.toLowerCase();
            const filtered = originalValues.filter(value => 
              value.toLowerCase().includes(lowerCaseFilter)
            );
            
            // 필터링된 결과 설정
            setSuggestedValues(filtered);
            setShowSuggestedValues(filtered.length > 0);
            setSelectedSuggestionIndex(-1);
          } catch (error) {
            console.error('원본 추천 검색어 로드 중 오류 발생:', error);
          }
        };
        
        // 원본 추천 검색어 로드 및 필터링 실행
        loadOriginalValues();
      } else {
        // 현재 검색 옵션이 없는 경우 기존 방식으로 필터링
        const lowerCaseFilter = filterText.toLowerCase();
        const filtered = suggestedValues.filter(value => 
          value.toLowerCase().includes(lowerCaseFilter)
        );
        
        // 필터링된 결과 설정
        setSuggestedValues(filtered);
        setShowSuggestedValues(filtered.length > 0);
        setSelectedSuggestionIndex(-1);
      }
    } catch (error) {
      console.error('추천 검색어 필터링 중 오류 발생:', error);
    }
  };
  
  return {
    filterSuggestedValues
  };
}; 