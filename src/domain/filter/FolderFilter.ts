import { ICard } from '../card/Card';
import { Filter, FilterType } from './Filter';

/**
 * 폴더 필터 클래스
 * 카드의 경로(폴더)를 기준으로 필터링하는 클래스입니다.
 */
export class FolderFilter extends Filter {
  constructor(folders: string | string[] = []) {
    super('folder', folders);
  }
  
  /**
   * 폴더 필터 적용
   * 주어진 카드 목록에서 지정된 폴더에 있는 카드만 필터링합니다.
   * @param cards 카드 목록
   * @returns 필터링된 카드 목록
   */
  apply(cards: ICard[]): ICard[] {
    if (this.isEmpty()) {
      return cards;
    }
    
    const folderValues = Array.isArray(this.value) ? this.value : [this.value];
    
    return cards.filter(card => {
      // 카드의 경로가 없으면 필터링에서 제외
      if (!card.path) {
        return false;
      }
      
      // 카드의 폴더 경로 추출
      const lastSlashIndex = card.path.lastIndexOf('/');
      const cardFolder = lastSlashIndex > 0 ? card.path.substring(0, lastSlashIndex) : '/';
      
      // 지정된 폴더 중 하나라도 카드의 폴더 경로에 포함되어 있으면 통과
      return folderValues.some(folder => {
        // 루트 폴더인 경우 특별 처리
        if (folder === '/' && cardFolder === '/') {
          return true;
        }
        
        // 정확히 일치하거나 하위 폴더인 경우
        return cardFolder === folder || cardFolder.startsWith(`${folder}/`);
      });
    });
  }
  
  /**
   * 폴더 추가
   * @param folder 추가할 폴더
   */
  addFolder(folder: string): void {
    if (Array.isArray(this.value)) {
      if (!this.value.includes(folder)) {
        this.value = [...this.value, folder];
      }
    } else {
      this.value = [this.value, folder].filter(Boolean);
    }
  }
  
  /**
   * 폴더 제거
   * @param folder 제거할 폴더
   */
  removeFolder(folder: string): void {
    if (Array.isArray(this.value)) {
      this.value = this.value.filter(f => f !== folder);
    } else if (this.value === folder) {
      this.value = [];
    }
  }
  
  /**
   * 모든 폴더 제거
   */
  clearFolders(): void {
    this.value = [];
  }
} 