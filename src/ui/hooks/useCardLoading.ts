import { useState, useCallback } from 'react';
import { ICardNavigatorService } from '../../application/CardNavigatorService';
import { ICardProps } from '../cards-container/Card';
import { mapCardArrayToPropsArray } from '../utils/cardMapping';
import { TimerUtil } from '../../infrastructure/TimerUtil';

/**
 * 카드 로딩 훅 반환 타입
 */
interface UseCardLoadingReturn {
  cards: ICardProps[];
  isLoading: boolean;
  error: string | null;
  loadCards: () => Promise<void>;
  setCards: (cards: ICardProps[]) => void;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

/**
 * 카드 로딩 관련 로직을 관리하는 커스텀 훅
 * @param service 카드 네비게이터 서비스
 * @returns 카드 로딩 관련 상태와 함수
 */
export const useCardLoading = (service: ICardNavigatorService | null): UseCardLoadingReturn => {
  const [cards, setCards] = useState<ICardProps[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  /**
   * 카드 로드 함수
   */
  const loadCards = useCallback(async () => {
    // 서비스가 없는 경우 조용히 반환
    if (!service) {
      console.log('[CardNavigatorView] 서비스가 초기화되지 않았습니다. 카드 로드를 건너뜁니다.');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null); // 이전 오류 메시지 초기화
      
      // 카드 로드 시간 측정
      const timerId = TimerUtil.startTimer('[성능] 카드 로드 시간');
      
      // 카드 가져오기
      console.log('[CardNavigatorView] 카드 로드 시작');
      const cardList = await service.getCards();
      console.log(`[CardNavigatorView] 카드 로드 완료: ${cardList.length}개 카드`);
      
      // 카드 매핑
      const mapTimerId = TimerUtil.startTimer('[성능] 카드 매핑 시간');
      const cardProps = mapCardArrayToPropsArray(cardList);
      TimerUtil.endTimer(mapTimerId);
      
      // 카드 설정
      setCards(cardProps);
      
      TimerUtil.endTimer(timerId);
      console.log(`[성능] 카드 로드 완료: ${cardProps.length}개 카드`);
    } catch (error: unknown) {
      console.error('[CardNavigatorView] 카드 로드 오류:', error);
      setError(`카드 로드 중 오류가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`);
      setCards([]); // 오류 발생 시 카드 목록 초기화
    } finally {
      setIsLoading(false);
    }
  }, [service]);
  
  return {
    cards,
    isLoading,
    error,
    loadCards,
    setCards,
    setIsLoading,
    setError
  };
}; 