import { DomainEvent } from './DomainEvent';
import { DomainEventType } from './DomainEventType';
import { TFile } from 'obsidian';

/**
 * 파일 열기 이벤트
 */
export class FileOpenedEvent extends DomainEvent<typeof DomainEventType.FILE_OPENED> {
  constructor(file: TFile) {
    super(DomainEventType.FILE_OPENED, { file });
  }
}

/**
 * 여러 파일 열기 이벤트
 */
export class FilesOpenedEvent extends DomainEvent<typeof DomainEventType.FILES_OPENED> {
  constructor(files: TFile[]) {
    super(DomainEventType.FILES_OPENED, { files });
  }
}

/**
 * 파일 편집을 위해 열기 이벤트
 */
export class FileOpenedForEditingEvent extends DomainEvent<typeof DomainEventType.FILE_OPENED_FOR_EDITING> {
  constructor(file: TFile) {
    super(DomainEventType.FILE_OPENED_FOR_EDITING, { file });
  }
}

/**
 * 편집창에 링크 삽입 이벤트
 */
export class LinkInsertedToEditorEvent extends DomainEvent<typeof DomainEventType.LINK_INSERTED_TO_EDITOR> {
  constructor(file: TFile) {
    super(DomainEventType.LINK_INSERTED_TO_EDITOR, { file });
  }
}

/**
 * 파일에 링크 삽입 이벤트
 */
export class LinkInsertedToFileEvent extends DomainEvent<typeof DomainEventType.LINK_INSERTED_TO_FILE> {
  constructor(sourceFile: TFile, targetFile: TFile) {
    super(DomainEventType.LINK_INSERTED_TO_FILE, { sourceFile, targetFile });
  }
} 