import { App } from 'obsidian';
import { CardSetManager } from '../managers/cardset/CardSetManager';
import { CardSetMode } from '../core/types/cardset.types';

/**
 * 카드셋 관리자 테스트 함수
 * @param app Obsidian 앱 인스턴스
 */
export function testCardSetManager(app: App): void {
  console.log('카드셋 관리자 테스트 시작');
  
  // 카드셋 관리자 생성
  const cardSetManager = new CardSetManager(app);
  
  // 카드셋 관리자 초기화
  cardSetManager.initialize();
  console.log('카드셋 관리자 초기화 완료');
  
  // 현재 카드셋 모드 확인
  const currentMode = cardSetManager.getMode();
  console.log(`현재 카드셋 모드: ${currentMode}`);
  
  // 현재 카드셋 가져오기
  const currentCardSet = cardSetManager.getCurrentCardSet();
  console.log(`현재 카드셋: ${currentCardSet.id}, 파일 수: ${currentCardSet.files.length}`);
  
  // 카드셋 변경 구독
  const subscriptionId = cardSetManager.subscribeToChanges(cardSet => {
    console.log(`카드셋 변경 감지: ${cardSet.id}, 파일 수: ${cardSet.files.length}`);
  });
  console.log(`카드셋 변경 구독 ID: ${subscriptionId}`);
  
  // 카드셋 옵션 설정
  cardSetManager.setOptions({
    includeSubfolders: false
  });
  console.log('카드셋 옵션 설정 완료');
  
  // 볼트 모드로 변경
  setTimeout(() => {
    console.log('볼트 모드로 변경');
    cardSetManager.setMode(CardSetMode.VAULT);
    
    // 정렬 옵션 설정
    setTimeout(() => {
      console.log('정렬 옵션 설정');
      cardSetManager.setSortOption({
        field: 'name',
        direction: 'desc'
      });
      
      // 선택 폴더 모드로 변경
      setTimeout(() => {
        console.log('선택 폴더 모드로 변경');
        cardSetManager.setMode(CardSetMode.SELECTED_FOLDER);
        
        // 카드셋 새로고침
        setTimeout(() => {
          console.log('카드셋 새로고침');
          cardSetManager.refreshCardSet();
          
          // 구독 취소
          setTimeout(() => {
            console.log('구독 취소');
            cardSetManager.unsubscribeFromChanges(subscriptionId);
            
            // 카드셋 관리자 정리
            setTimeout(() => {
              console.log('카드셋 관리자 정리');
              cardSetManager.cleanup();
              console.log('카드셋 관리자 테스트 완료');
            }, 1000);
          }, 1000);
        }, 1000);
      }, 1000);
    }, 1000);
  }, 1000);
} 