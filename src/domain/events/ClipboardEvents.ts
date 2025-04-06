import { DomainEvent } from './DomainEvent';
import { DomainEventType } from './DomainEventType';
import { TFile } from 'obsidian';

/**
 * 파일 링크 복사 이벤트
 */
export class FileLinkCopiedEvent extends DomainEvent<typeof DomainEventType.FILE_LINK_COPIED> {
  constructor(file: TFile, link: string) {
    super(DomainEventType.FILE_LINK_COPIED, { file, link });
  }
}

/**
 * 파일 내용 복사 이벤트
 */
export class FileContentCopiedEvent extends DomainEvent<typeof DomainEventType.FILE_CONTENT_COPIED> {
  constructor(file: TFile, content: string) {
    super(DomainEventType.FILE_CONTENT_COPIED, { file, content });
  }
}

/**
 * 여러 파일 링크 복사 이벤트
 */
export class FileLinksCopiedEvent extends DomainEvent<typeof DomainEventType.FILE_LINKS_COPIED> {
  constructor(files: TFile[], links: string) {
    super(DomainEventType.FILE_LINKS_COPIED, { files, links });
  }
}

/**
 * 여러 파일 내용 복사 이벤트
 */
export class FileContentsCopiedEvent extends DomainEvent<typeof DomainEventType.FILE_CONTENTS_COPIED> {
  constructor(files: TFile[], contents: string) {
    super(DomainEventType.FILE_CONTENTS_COPIED, { files, contents });
  }
} 