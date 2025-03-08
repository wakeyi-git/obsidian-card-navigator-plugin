import { useState } from 'react';
import { ICardNavigatorService } from '../../../application/CardNavigatorService';
import { ICardProps } from '../../../ui/cards-container/Card';
import { ICard } from '../../../domain/card/Card';
import type { SearchOption } from '../components/SearchOptionSuggest';

/**
 * 현재 필터링된 카드 목록을 기반으로 추천 검색어를 로드하는 훅
 */
export const useSuggestedValuesFromCurrentCards = (
  cardNavigatorService: ICardNavigatorService | null,
  currentCards: ICardProps[]
) => {
  const [suggestedValues, setSuggestedValues] = useState<string[]>([]);
  const [showSuggestedValues, setShowSuggestedValues] = useState<boolean>(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState<number>(-1);
  
  /**
   * UI 카드 속성을 도메인 카드로 변환하는 함수
   */
  const mapPropsToCard = (cardProps: ICardProps): ICard => {
    return {
      id: cardProps.id,
      title: cardProps.title,
      content: cardProps.content || '',
      tags: cardProps.tags || [],
      path: cardProps.path || '',
      created: cardProps.created || Date.now(),
      modified: cardProps.modified || Date.now(),
      frontmatter: {} // ICardProps에는 frontmatter 속성이 없으므로 빈 객체로 초기화
    };
  };
  
  /**
   * UI 카드 속성 배열을 도메인 카드 배열로 변환하는 함수
   */
  const mapPropsArrayToCardArray = (cardProps: ICardProps[]): ICard[] => {
    return cardProps.map(mapPropsToCard);
  };
  
  /**
   * 추천 검색어 로드 (현재 필터링된 카드 목록을 기반으로)
   */
  const loadSuggestedValuesFromCurrentCards = async (option: SearchOption, searchScope: 'all' | 'current' = 'current') => {
    if (!cardNavigatorService || !currentCards.length) return;
    
    try {
      console.log('현재 필터링된 카드 목록을 기반으로 추천 검색어 로드:', option.type, '검색 범위:', searchScope);
      
      const searchService = cardNavigatorService.getSearchService();
      const currentCardsArray = mapPropsArrayToCardArray(currentCards);
      
      let values: string[] = [];
      
      switch (option.type) {
        case 'tag':
          values = await searchService.getScopedTags(searchScope, currentCardsArray);
          break;
        case 'filename':
          values = await searchService.getScopedFilenames(searchScope, currentCardsArray);
          break;
        case 'path':
          if (searchScope === 'current') {
            const paths = new Set<string>();
            currentCardsArray.forEach(card => {
              if (card.path) {
                const folderPath = card.path.split('/').slice(0, -1).join('/');
                if (folderPath) paths.add(folderPath);
              }
            });
            values = Array.from(paths);
          } else {
            values = await searchService.getFolderPaths();
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
      console.error('현재 필터링된 카드 목록을 기반으로 추천 검색어 로드 중 오류 발생:', error);
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
    loadSuggestedValuesFromCurrentCards,
    mapPropsToCard,
    mapPropsArrayToCardArray
  };
}; 