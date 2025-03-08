import { useState } from 'react';
import { ICardNavigatorService } from '../../../application/CardNavigatorService';
import { ICardProps } from '../../../ui/cards-container/Card';
import { ICard } from '../../../domain/card/Card';

/**
 * 프론트매터 값 로드 관련 로직을 담당하는 훅
 */
export const useFrontmatterValues = (
  cardNavigatorService: ICardNavigatorService | null,
  currentCards: ICardProps[],
  mapPropsArrayToCardArray: (cardProps: ICardProps[]) => ICard[]
) => {
  const [frontmatterKey, setFrontmatterKey] = useState<string>('');
  const [suggestedValues, setSuggestedValues] = useState<string[]>([]);
  const [showSuggestedValues, setShowSuggestedValues] = useState<boolean>(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState<number>(-1);
  
  /**
   * 프론트매터 값 로드
   */
  const loadFrontmatterValues = async (key: string, searchScope: 'all' | 'current' = 'current') => {
    if (!cardNavigatorService) return;
    
    try {
      console.log('프론트매터 값 로드 시작:', key);
      
      // 선택된 프론트매터 키 저장
      setFrontmatterKey(key);
      
      const searchService = cardNavigatorService.getSearchService();
      const currentCardsArray = mapPropsArrayToCardArray(currentCards);
      
      const values = await searchService.getScopedFrontmatterValues(key, searchScope, currentCardsArray);
      console.log('로드된 프론트매터 값:', values);
      
      setSuggestedValues(values);
      setShowSuggestedValues(values.length > 0);
      setSelectedSuggestionIndex(-1);
    } catch (error) {
      console.error('프론트매터 값 로드 중 오류 발생:', error);
    }
  };
  
  return {
    frontmatterKey,
    setFrontmatterKey,
    suggestedValues,
    setSuggestedValues,
    showSuggestedValues,
    setShowSuggestedValues,
    selectedSuggestionIndex,
    setSelectedSuggestionIndex,
    loadFrontmatterValues
  };
}; 