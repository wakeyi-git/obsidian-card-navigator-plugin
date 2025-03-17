import { App, TFile, CachedMetadata } from 'obsidian';
import { ICard } from '../../domain/card/Card';
import { Card } from '../../domain/card/Card';

/**
 * Obsidian 카드 어댑터
 * Obsidian 파일을 카드로 변환하는 어댑터입니다.
 */
export class ObsidianCardAdapter {
  constructor(private app: App) {}

  /**
   * 파일을 카드로 변환
   * @param file 파일 객체
   * @returns 카드 객체
   */
  async toCard(file: TFile): Promise<ICard> {
    const content = await this.app.vault.read(file);
    const metadata = this.app.metadataCache.getFileCache(file);
    const tags = metadata?.tags?.map(tag => tag.tag) || [];
    const frontmatter = metadata?.frontmatter || {};
    const firstHeader = metadata?.headings?.[0]?.heading;

    return new Card(
      file.path,
      file.name,
      content,
      tags,
      frontmatter,
      firstHeader,
      undefined,
      metadata || undefined,
      file.stat.ctime,
      file.stat.mtime
    );
  }
} 