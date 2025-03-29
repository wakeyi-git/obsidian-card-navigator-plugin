import { App, TFile } from 'obsidian';
import { CardSet, CardSetType, ICardSetConfig } from '../models/CardSet';
import { Card } from '../models/Card';
import { CardRepository } from './CardRepository';
import { ICardService } from '../services/CardService';

/**
 * 카드셋 저장소
 */
export class CardSetRepository {
  private cardSets: Map<string, CardSet> = new Map();
  private activeFile: TFile | null = null;

  constructor(
    private readonly app: App,
    private readonly cardRepository: CardRepository,
    private readonly cardService: ICardService
  ) {
    // 활성 파일 변경 이벤트 구독
    this.app.workspace.on('active-leaf-change', () => {
      const activeFile = this.app.workspace.getActiveFile();
      if (activeFile) {
        this.activeFile = activeFile;
        this._updateActiveCardSets();
      }
    });
  }

  /**
   * 카드셋 생성
   */
  createCardSet(config: ICardSetConfig): CardSet {
    const id = crypto.randomUUID();
    const name = this._generateCardSetName(config);
    const description = this._generateCardSetDescription(config);
    
    const cardSet = new CardSet(
      id,
      name,
      description,
      config,
      this.app,
      this.cardService
    );
    
    this.cardSets.set(id, cardSet);
    this._updateCardSet(cardSet);
    return cardSet;
  }

  /**
   * 카드셋 이름 생성
   */
  private _generateCardSetName(config: ICardSetConfig): string {
    switch (config.type) {
      case 'folder':
        return config.isActiveFolder ? '활성 폴더' : config.value;
      case 'tag':
        return config.isActiveTag ? '활성 태그' : `#${config.value}`;
      case 'link':
        return `${config.linkType === 'backlink' ? '백링크' : '아웃고잉링크'}: ${config.value}`;
      case 'search':
        return `검색: ${config.options?.query || ''}`;
      default:
        return '알 수 없는 카드셋';
    }
  }

  /**
   * 카드셋 설명 생성
   */
  private _generateCardSetDescription(config: ICardSetConfig): string {
    const parts: string[] = [];
    
    switch (config.type) {
      case 'folder':
        if (config.includeSubfolders) {
          parts.push('하위 폴더 포함');
        }
        break;
      case 'tag':
        parts.push('태그 기반');
        break;
      case 'link':
        parts.push(`링크 레벨: ${config.linkLevel}`);
        parts.push(config.linkType === 'backlink' ? '백링크' : '아웃고잉링크');
        break;
    }

    parts.push(`정렬: ${config.sortBy} ${config.sortOrder}`);
    
    return parts.join(', ');
  }

  /**
   * 카드셋 업데이트
   */
  updateCardSet(cardSet: CardSet): void {
    this.cardSets.set(cardSet.id, cardSet);
    this._updateCardSet(cardSet);
  }

  /**
   * 카드셋 삭제
   */
  deleteCardSet(id: string): void {
    this.cardSets.delete(id);
  }

  /**
   * 카드셋 조회
   */
  getCardSet(id: string): CardSet | undefined {
    const cardSet = this.cardSets.get(id);
    if (!cardSet) {
      return undefined;
    }

    const name = this._generateCardSetName(cardSet.config);
    const description = this._generateCardSetDescription(cardSet.config);

    switch (cardSet.config.type) {
      case 'folder':
        return new CardSet(id, name, description, cardSet.config, this.app, this.cardService);
      case 'tag':
        return new CardSet(id, name, description, cardSet.config, this.app, this.cardService);
      case 'link':
        return new CardSet(id, name, description, cardSet.config, this.app, this.cardService);
      case 'search':
        return new CardSet(id, name, description, cardSet.config, this.app, this.cardService);
      default:
        return undefined;
    }
  }

  /**
   * 모든 카드셋 가져오기
   */
  getAllCardSets(): CardSet[] {
    return Array.from(this.cardSets.values());
  }

  /**
   * 카드셋 업데이트
   */
  private _updateCardSet(cardSet: CardSet): void {
    const files = this._getFilesForCardSet(cardSet);
    const cards = files.map(file => this.cardRepository.getOrCreateCard(file));
    
    // 카드셋의 카드 목록 업데이트
    cardSet.setCards(cards);
  }

  /**
   * 카드셋에 포함될 파일 가져오기
   */
  private _getFilesForCardSet(cardSet: CardSet): TFile[] {
    const files = this.app.vault.getMarkdownFiles();
    return files.filter(file => cardSet.includesFile(file));
  }

  /**
   * 활성 카드셋 업데이트
   */
  private _updateActiveCardSets(): void {
    if (!this.activeFile) return;

    this.cardSets.forEach(cardSet => {
      if (cardSet.config.isActiveFolder || cardSet.config.isActiveTag) {
        this._updateCardSet(cardSet);
      }
    });
  }

  /**
   * 링크 카드셋 업데이트
   */
  private _updateLinkCardSet(cardSet: CardSet): void {
    if (cardSet.config.type !== 'link') return;

    const targetFile = this.app.vault.getAbstractFileByPath(cardSet.config.value);
    if (!targetFile || !(targetFile instanceof TFile)) return;

    const files = new Set<TFile>();
    const visited = new Set<string>();

    const addLinks = (file: TFile, depth: number) => {
      if (depth <= 0 || visited.has(file.path)) return;
      visited.add(file.path);

      if (cardSet.config.linkType === 'backlink') {
        // 백링크 처리
        const backlinks = this.app.metadataCache.resolvedLinks;
        Object.entries(backlinks).forEach(([sourcePath, targets]) => {
          if (targets[file.path]) {
            const linkedFile = this.app.vault.getAbstractFileByPath(sourcePath);
            if (linkedFile instanceof TFile) {
              files.add(linkedFile);
              if (depth > 1) {
                addLinks(linkedFile, depth - 1);
              }
            }
          }
        });
      } else {
        // 아웃고잉링크 처리
        const outgoingLinks = this.app.metadataCache.getFileCache(file)?.links || [];
        outgoingLinks.forEach(link => {
          const linkedFile = this.app.vault.getAbstractFileByPath(link.link);
          if (linkedFile instanceof TFile) {
            files.add(linkedFile);
            if (depth > 1) {
              addLinks(linkedFile, depth - 1);
            }
          }
        });
      }
    };

    addLinks(targetFile, cardSet.config.linkLevel || 1);
    const cards = Array.from(files).map(file => this.cardRepository.getOrCreateCard(file));
    cardSet.setCards(cards);
  }
} 