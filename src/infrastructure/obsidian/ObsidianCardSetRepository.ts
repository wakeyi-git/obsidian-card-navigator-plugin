import { TFile, TFolder, App } from 'obsidian';
import { CardSet } from '../../domain/models/CardSet';
import { CardSetType, CardFilter, CardSort } from '../../domain/models/types';
import { ICardSetRepository } from '../../domain/repositories/ICardSetRepository';
import { ObsidianCardRepository } from './ObsidianCardRepository';
import { Card } from '../../domain/models/Card';

/**
 * Obsidian API를 사용하는 카드셋 저장소 구현체
 */
export class ObsidianCardSetRepository implements ICardSetRepository {
  private cardSetCache: Map<string, CardSet> = new Map();

  constructor(
    private readonly app: App,
    private readonly cardRepository: ObsidianCardRepository
  ) {}

  /**
   * ID로 카드셋을 조회합니다.
   */
  async findById(id: string): Promise<CardSet | null> {
    return this.cardSetCache.get(id) || null;
  }

  /**
   * 타입과 소스로 카드셋을 조회합니다.
   */
  async findByTypeAndSource(type: CardSetType, source: string): Promise<CardSet | null> {
    const id = `${type}:${source}`;
    return this.findById(id);
  }

  /**
   * 카드셋을 생성합니다.
   */
  async create(
    type: CardSetType,
    source: string,
    filter: CardFilter,
    sort: CardSort
  ): Promise<CardSet> {
    const id = `${type}-${source}-${Date.now()}`;
    const cardSet = new CardSet(id, type, source, filter, sort);
    await this.loadCardsForCardSet(cardSet);
    this.cardSetCache.set(id, cardSet);
    return cardSet;
  }

  /**
   * 카드셋을 업데이트합니다.
   */
  async update(cardSet: CardSet): Promise<void> {
    // 카드셋은 메모리에만 저장되므로 여기서는 아무것도 하지 않음
  }

  /**
   * 카드셋의 필터를 업데이트합니다.
   */
  async updateFilter(cardSet: CardSet, filter: CardFilter): Promise<CardSet> {
    cardSet.updateFilter(filter);
    await this.loadCardsForCardSet(cardSet);
    this.cardSetCache.set(cardSet.getId(), cardSet);
    return cardSet;
  }

  /**
   * 카드셋의 정렬 설정을 업데이트합니다.
   */
  async updateSort(cardSet: CardSet, sort: CardSort): Promise<CardSet> {
    cardSet.updateSort(sort);
    await this.loadCardsForCardSet(cardSet);
    this.cardSetCache.set(cardSet.getId(), cardSet);
    return cardSet;
  }

  /**
   * 카드셋을 삭제합니다.
   */
  async delete(cardSet: CardSet): Promise<void> {
    this.cardSetCache.delete(cardSet.getId());
  }

  /**
   * 모든 카드셋을 조회합니다.
   */
  async findAll(): Promise<CardSet[]> {
    return Array.from(this.cardSetCache.values());
  }

  /**
   * 카드셋 타입에 따라 카드를 로드합니다.
   */
  private async loadCardsForCardSet(cardSet: CardSet): Promise<void> {
    const files = await this.getFilesForCardSet(cardSet);
    
    // 기존 카드 제거
    cardSet.getCards().forEach(card => {
      cardSet.removeCard(card.getId());
    });

    // 새 카드 추가
    for (const file of files) {
      const card = await this.cardRepository.createFromFile(file, this.app);
      cardSet.addCard(card);
    }
  }

  /**
   * 카드셋 타입에 따라 파일 목록을 가져옵니다.
   */
  private async getFilesForCardSet(cardSet: CardSet): Promise<TFile[]> {
    switch (cardSet.getType()) {
      case 'folder':
        return this.getFilesFromFolder(cardSet.getSource());
      case 'tag':
        return this.getFilesWithTag(cardSet.getSource());
      case 'link':
        return this.getFilesWithLink(cardSet.getSource());
      default:
        return [];
    }
  }

  /**
   * 폴더에서 파일 목록을 가져옵니다.
   */
  private async getFilesFromFolder(folderPath: string): Promise<TFile[]> {
    const folder = this.app.vault.getAbstractFileByPath(folderPath);
    if (!folder || !(folder instanceof TFolder)) {
      return [];
    }

    return folder.children
      .filter((file): file is TFile => file instanceof TFile && file.extension === 'md');
  }

  /**
   * 특정 태그를 가진 파일 목록을 가져옵니다.
   */
  private async getFilesWithTag(tag: string): Promise<TFile[]> {
    const files: TFile[] = [];
    
    // 모든 마크다운 파일 검색
    this.app.vault.getMarkdownFiles().forEach(async (file) => {
      const content = await file.vault.read(file);
      if (content.includes(`#${tag}`)) {
        files.push(file);
      }
    });

    return files;
  }

  /**
   * 특정 링크를 가진 파일 목록을 가져옵니다.
   */
  private async getFilesWithLink(link: string): Promise<TFile[]> {
    const files: TFile[] = [];
    
    // 모든 마크다운 파일 검색
    this.app.vault.getMarkdownFiles().forEach(async (file) => {
      const content = await file.vault.read(file);
      if (content.includes(`[[${link}]]`)) {
        files.push(file);
      }
    });

    return files;
  }

  /**
   * 캐시를 초기화합니다.
   */
  clearCache(): void {
    this.cardSetCache.clear();
    this.cardRepository.clearCache();
  }
} 