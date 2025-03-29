import { Card } from './Card';
import { CardSetType, CardFilter, CardSort, CardSection, CardSectionType, CardPosition } from './types';

/**
 * 카드셋 도메인 모델
 */
export class CardSet {
  private readonly createdAt: Date;
  private updatedAt: Date;
  private cards: Card[] = [];
  private cardPositions: Map<string, CardPosition> = new Map();

  constructor(
    private readonly id: string,
    private readonly type: CardSetType,
    private readonly source: string,
    private filter: CardFilter,
    private sort: CardSort,
    initialCards: Card[] = [],
    createdAt: Date = new Date(),
    updatedAt: Date = new Date()
  ) {
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.cards = initialCards;
  }

  /**
   * 카드셋 ID를 반환합니다.
   */
  getId(): string {
    return this.id;
  }

  /**
   * 카드셋 타입을 반환합니다.
   */
  getType(): CardSetType {
    return this.type;
  }

  /**
   * 카드셋 소스를 반환합니다.
   */
  getSource(): string {
    return this.source;
  }

  /**
   * 카드셋의 카드 목록을 반환합니다.
   */
  getCards(): Card[] {
    return this.cards;
  }

  /**
   * 카드셋의 필터를 반환합니다.
   */
  getFilter(): CardFilter {
    return this.filter;
  }

  /**
   * 카드셋의 정렬 설정을 반환합니다.
   */
  getSort(): CardSort {
    return this.sort;
  }

  /**
   * ID로 카드를 조회합니다.
   */
  getCardById(id: string): Card | null {
    return this.cards.find(card => card.getId() === id) || null;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  /**
   * 카드를 카드셋에 추가합니다.
   */
  addCard(card: Card): void {
    this.cards.push(card);
    this.applyFilterAndSort();
  }

  /**
   * 카드를 카드셋에서 제거합니다.
   */
  removeCard(cardId: string): void {
    this.cards = this.cards.filter(card => card.getId() !== cardId);
  }

  /**
   * 카드셋의 필터를 업데이트합니다.
   */
  updateFilter(filter: CardFilter): void {
    this.filter = filter;
    this.applyFilterAndSort();
  }

  /**
   * 카드셋의 정렬 설정을 업데이트합니다.
   */
  updateSort(sort: CardSort): void {
    this.sort = sort;
    this.applyFilterAndSort();
  }

  /**
   * 필터와 정렬을 적용합니다.
   */
  private applyFilterAndSort(): void {
    // 필터 적용
    this.cards = this.cards.filter(card => {
      switch (this.filter.type) {
        case 'search':
          return this.applySearchFilter(card);
        case 'tag':
          return this.applyTagFilter(card);
        case 'folder':
          return this.applyFolderFilter(card);
        case 'date':
          return this.applyDateFilter(card);
        default:
          return true;
      }
    });

    // 정렬 적용
    this.cards.sort((a, b) => {
      // 우선순위 태그/폴더 적용
      if (this.sort.priorityTags) {
        const aHasPriorityTag = this.hasPriorityTag(a);
        const bHasPriorityTag = this.hasPriorityTag(b);
        if (aHasPriorityTag !== bHasPriorityTag) {
          return aHasPriorityTag ? -1 : 1;
        }
      }

      if (this.sort.priorityFolders) {
        const aInPriorityFolder = this.isInPriorityFolder(a);
        const bInPriorityFolder = this.isInPriorityFolder(b);
        if (aInPriorityFolder !== bInPriorityFolder) {
          return aInPriorityFolder ? -1 : 1;
        }
      }

      // 일반 정렬 기준 적용
      switch (this.sort.criterion) {
        case 'fileName':
          return this.sort.order === 'asc' 
            ? a.getFile().name.localeCompare(b.getFile().name)
            : b.getFile().name.localeCompare(a.getFile().name);
        case 'updateDate':
          return this.sort.order === 'asc'
            ? a.getFile().stat.mtime - b.getFile().stat.mtime
            : b.getFile().stat.mtime - a.getFile().stat.mtime;
        case 'createDate':
          return this.sort.order === 'asc'
            ? a.getFile().stat.ctime - b.getFile().stat.ctime
            : b.getFile().stat.ctime - a.getFile().stat.ctime;
        default:
          return 0;
      }
    });
  }

  /**
   * 검색 필터를 적용합니다.
   */
  private applySearchFilter(card: Card): boolean {
    const searchValue = this.filter.criteria.value.toLowerCase();
    const content = card.getContent();
    
    return (
      card.getFile().name.toLowerCase().includes(searchValue) ||
      this.searchCardContent(content.header, searchValue) ||
      this.searchCardContent(content.body, searchValue) ||
      this.searchCardContent(content.footer, searchValue)
    );
  }

  /**
   * 카드 내용을 검색합니다.
   */
  private searchCardContent(content: CardSection[], searchTerm: string): boolean {
    return content.some(section => {
      if (section.type === 'header' || section.type === 'text') {
        return section.content.toLowerCase().includes(searchTerm.toLowerCase());
      }
      return false;
    });
  }

  /**
   * 태그 필터를 적용합니다.
   */
  private applyTagFilter(card: Card): boolean {
    const tagValue = this.filter.criteria.value;
    const content = card.getContent();
    
    return content.body.some(section => 
      section.type === 'text' && section.content.startsWith('#') && section.content.includes(tagValue)
    );
  }

  /**
   * 폴더 필터를 적용합니다.
   */
  private applyFolderFilter(card: Card): boolean {
    const folderPath = this.filter.criteria.value;
    return card.getFile().path.startsWith(folderPath);
  }

  /**
   * 날짜 필터를 적용합니다.
   */
  private applyDateFilter(card: Card): boolean {
    const dateValue = this.filter.criteria.value;
    const options = this.filter.criteria.options;
    
    if (!options) return true;
    
    const fileDate = new Date(card.getFile().stat.mtime);
    const startDate = options.startDate ? new Date(options.startDate) : null;
    const endDate = options.endDate ? new Date(options.endDate) : null;
    
    if (startDate && fileDate < startDate) return false;
    if (endDate && fileDate > endDate) return false;
    
    return true;
  }

  /**
   * 카드가 우선순위 태그를 가지고 있는지 확인합니다.
   */
  private hasPriorityTag(card: Card): boolean {
    if (!this.sort.priorityTags) return false;
    
    const content = card.getContent();
    const tags = content.body.filter(section => 
      section.type === 'text' && section.content.startsWith('#')
    );
    
    return tags.some(tag => 
      this.sort.priorityTags!.some(priorityTag => 
        tag.content.toLowerCase().includes(priorityTag.toLowerCase())
      )
    );
  }

  /**
   * 카드가 우선순위 폴더에 있는지 확인합니다.
   */
  private isInPriorityFolder(card: Card): boolean {
    if (!this.sort.priorityFolders) return false;
    
    return this.sort.priorityFolders.some(folder => 
      card.getFile().path.startsWith(folder)
    );
  }

  /**
   * 카드 태그를 검색합니다.
   */
  private searchCardTags(card: Card, searchTerm: string): boolean {
    const tags = card.getContent().body.filter(section => 
      section.type === 'text' && section.content.startsWith('#')
    );
    return tags.some(tag => tag.content.toLowerCase().includes(searchTerm.toLowerCase()));
  }

  /**
   * 카드 내용을 검색합니다.
   */
  private searchCardContentByType(content: CardSection[], type: CardSectionType, searchTerm: string): boolean {
    return content.some(section => {
      if (section.type === type) {
        return section.content.toLowerCase().includes(searchTerm.toLowerCase());
      }
      return false;
    });
  }

  /**
   * 카드 위치를 업데이트합니다.
   */
  async updateCardPosition(cardId: string, position: CardPosition): Promise<void> {
    const card = this.getCardById(cardId);
    if (!card) {
      throw new Error(`Card not found: ${cardId}`);
    }

    this.cardPositions.set(cardId, position);
    this.updatedAt = new Date();
  }

  /**
   * 카드 위치를 가져옵니다.
   */
  getCardPosition(cardId: string): CardPosition | null {
    return this.cardPositions.get(cardId) || null;
  }

  /**
   * 모든 카드 위치를 가져옵니다.
   */
  getAllCardPositions(): Map<string, CardPosition> {
    return new Map(this.cardPositions);
  }

  /**
   * 카드 위치를 초기화합니다.
   */
  resetCardPositions(): void {
    this.cardPositions.clear();
    this.updatedAt = new Date();
  }
} 