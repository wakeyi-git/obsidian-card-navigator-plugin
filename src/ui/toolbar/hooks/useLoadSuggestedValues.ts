import { useState } from 'react';
import { ICardNavigatorService } from '../../../application/CardNavigatorService';
import { ICardProps } from '../../../ui/cards-container/Card';
import { ICard } from '../../../domain/card/Card';
import type { SearchOption } from '../components/SearchOptionSuggest';

/**
 * 추천 검색어 로드 관련 로직을 담당하는 훅
 */
export const useLoadSuggestedValues = (
  cardNavigatorService: ICardNavigatorService | null,
  currentCards: ICardProps[],
  mapPropsArrayToCardArray: (cardProps: ICardProps[]) => ICard[]
) => {
  const [suggestedValues, setSuggestedValues] = useState<string[]>([]);
  const [showSuggestedValues, setShowSuggestedValues] = useState<boolean>(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState<number>(-1);
  const [currentSearchOption, setCurrentSearchOption] = useState<SearchOption | null>(null);
  
  /**
   * 추천 검색어 로드
   */
  const loadSuggestedValues = async (option: SearchOption, searchScope: 'all' | 'current' = 'current') => {
    if (!cardNavigatorService) return;
    
    try {
      console.log('추천 검색어 로드 시작:', option.type, '검색 범위:', searchScope);
      
      // 현재 선택된 검색 옵션 저장
      setCurrentSearchOption(option);
      
      // 기존 추천 검색어 초기화
      setSuggestedValues([]);
      setShowSuggestedValues(false);
      
      const searchService = cardNavigatorService.getSearchService();
      const currentCardsArray = mapPropsArrayToCardArray(currentCards);
      
      let values: string[] = [];
      
      switch (option.type) {
        case 'tag':
          // 태그 검색: 검색 범위에 따라 전체 또는 현재 카드셋의 태그 로드
          values = await searchService.getScopedTags(searchScope, currentCardsArray);
          break;
        case 'filename':
          // 파일명 검색: 검색 범위에 따라 전체 또는 현재 카드셋의 파일명 로드
          values = await searchService.getScopedFilenames(searchScope, currentCardsArray);
          break;
        case 'frontmatter':
          // 프론트매터 키 목록 로드 (이미 FrontmatterKeySuggestions 컴포넌트에서 처리)
          return;
        case 'path':
          // 경로 검색: 폴더 경로 로드 (검색 범위가 current인 경우 현재 카드셋의 경로만 로드)
          if (searchScope === 'current') {
            // 현재 카드셋의 고유한 경로 목록 추출
            const paths = new Set<string>();
            currentCardsArray.forEach(card => {
              if (card.path) {
                // 파일 이름을 제외한 경로만 추출
                const folderPath = card.path.split('/').slice(0, -1).join('/');
                if (folderPath) paths.add(folderPath);
              }
            });
            values = Array.from(paths);
          } else {
            // 전체 폴더 경로 로드
            values = await searchService.getFolderPaths();
          }
          break;
        case 'content':
          // 내용 검색: 검색 범위에 따라 전체 또는 현재 카드셋의 내용 중 주요 키워드 로드
          // (이 기능은 복잡할 수 있으므로 기본적인 구현만 제공)
          if (searchScope === 'current') {
            // 현재 카드셋의 내용에서 주요 키워드 추출 (간단한 구현)
            const contentWords = new Set<string>();
            currentCardsArray.forEach(card => {
              if (card.content) {
                // 내용에서 단어 추출 (최소 3자 이상)
                const words = card.content.split(/\s+/).filter(word => word.length >= 3);
                words.forEach(word => contentWords.add(word));
              }
            });
            values = Array.from(contentWords).slice(0, 50); // 최대 50개 키워드만 표시
          } else {
            // 전체 내용에서 주요 키워드 추출은 성능 문제로 제한적으로 구현
            // 임시 구현: 검색 서비스에서 제공하는 기능이 없으므로 빈 배열 반환
            values = [];
            console.log('전체 내용 키워드 추출은 아직 구현되지 않았습니다.');
          }
          break;
        default:
          return;
      }
      
      console.log('로드된 추천 검색어:', values.length, '개');
      
      // 중복 제거 및 정렬
      values = [...new Set(values)].sort();
      
      setSuggestedValues(values);
      setShowSuggestedValues(values.length > 0);
      setSelectedSuggestionIndex(-1);
    } catch (error) {
      console.error('추천 검색어 로드 중 오류 발생:', error);
      setSuggestedValues([]);
      setShowSuggestedValues(false);
    }
  };
  
  return {
    suggestedValues,
    setSuggestedValues,
    showSuggestedValues,
    setShowSuggestedValues,
    selectedSuggestionIndex,
    setSelectedSuggestionIndex,
    currentSearchOption,
    setCurrentSearchOption,
    loadSuggestedValues
  };
}; 