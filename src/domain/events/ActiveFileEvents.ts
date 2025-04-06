import { DomainEvent } from './DomainEvent';
import { TFile } from 'obsidian';
import { DomainEventType } from './DomainEventType';

/**
 * 활성 파일 변경 이벤트
 */
export class ActiveFileChangedEvent extends DomainEvent<typeof DomainEventType.ACTIVE_FILE_CHANGED> {
  constructor(file: TFile | null) {
    super(DomainEventType.ACTIVE_FILE_CHANGED, { file });
  }
}

/**
 * 활성 파일 감시 시작 이벤트
 */
export class ActiveFileWatchStartedEvent extends DomainEvent<typeof DomainEventType.ACTIVE_FILE_WATCH_STARTED> {
  constructor(file: TFile | null) {
    super(DomainEventType.ACTIVE_FILE_WATCH_STARTED, { file });
  }
}

/**
 * 활성 파일 감시 중지 이벤트
 */
export class ActiveFileWatchStoppedEvent extends DomainEvent<typeof DomainEventType.ACTIVE_FILE_WATCH_STOPPED> {
  constructor(file: TFile | null) {
    super(DomainEventType.ACTIVE_FILE_WATCH_STOPPED, { file });
  }
} 