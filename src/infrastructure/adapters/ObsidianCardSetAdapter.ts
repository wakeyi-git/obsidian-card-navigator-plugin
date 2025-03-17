import { App, TFolder, TFile } from 'obsidian';
import { ICardSet, CardSetSourceMode, ISortSettings, CardSet } from '../../domain/cardset/CardSet';
import { ICard, Card } from '../../domain/card/Card';
import { ObsidianCardAdapter } from './ObsidianCardAdapter';

/**
 * Obsidian 카드셋 어댑터
 * Obsidian의 폴더와 파일을 카드셋으로 변환하는 어댑터입니다.
 */
export class ObsidianCardSetAdapter {
  private cardAdapter: ObsidianCardAdapter;

  constructor(private app: App) {
    this.cardAdapter = new ObsidianCardAdapter(app);
  }

  /**
   * 폴더를 카드셋으로 변환
   * @param folder 폴더
   * @returns 카드셋
   */
  async folderToCardSet(folder: TFolder): Promise<ICardSet> {
    const files = this.getMarkdownFilesInFolder(folder);
    const cards = await Promise.all(
      files.map(file => this.cardAdapter.toCard(file))
    );

    const cardSet = new CardSet(
      folder.path,
      folder.name,
      CardSetSourceMode.FOLDER,
      folder.path,
      'active',
      cards.map(card => new Card(
        card.path,
        card.filename,
        card.content,
        card.tags,
        card.frontmatter,
        card.firstHeader,
        card.displaySettings,
        card.metadata,
        card.created || Date.now(),
        card.modified || Date.now()
      )),
      {
        sortBy: 'modified',
        sortOrder: 'desc'
      }
    );

    return cardSet;
  }

  /**
   * 파일 목록을 카드셋으로 변환
   * @param files 파일 목록
   * @param name 카드셋 이름
   * @returns 카드셋
   */
  async filesToCardSet(files: TFile[], name: string): Promise<ICardSet> {
    const cards = await Promise.all(
      files.map(file => this.cardAdapter.toCard(file))
    );

    const cardSet = new CardSet(
      `card-set-${Date.now()}`,
      name,
      CardSetSourceMode.FILE,
      files.map(f => f.path).join(','),
      'active',
      cards.map(card => new Card(
        card.path,
        card.filename,
        card.content,
        card.tags,
        card.frontmatter,
        card.firstHeader,
        card.displaySettings,
        card.metadata,
        card.created || Date.now(),
        card.modified || Date.now()
      )),
      {
        sortBy: 'modified',
        sortOrder: 'desc'
      }
    );

    return cardSet;
  }

  /**
   * 폴더 내의 마크다운 파일 목록 가져오기
   * @param folder 폴더
   * @returns 마크다운 파일 목록
   */
  private getMarkdownFilesInFolder(folder: TFolder): TFile[] {
    const files: TFile[] = [];
    this.traverseFolder(folder, files);
    return files;
  }

  /**
   * 폴더 순회하며 마크다운 파일 수집
   * @param folder 폴더
   * @param files 파일 목록
   */
  private traverseFolder(folder: TFolder, files: TFile[]): void {
    folder.children.forEach(child => {
      if (child instanceof TFile && child.extension === 'md') {
        files.push(child);
      } else if (child instanceof TFolder) {
        this.traverseFolder(child, files);
      }
    });
  }
} 