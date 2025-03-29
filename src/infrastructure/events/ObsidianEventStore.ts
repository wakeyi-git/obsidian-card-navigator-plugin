import { App, TFile } from 'obsidian';
import { IDomainEvent } from '../../domain/events/DomainEvent';
import { IEventStore } from '../../domain/events/IEventStore';
import { EventClassMapper } from './EventClassMapper';
import { DomainEventDispatcher } from '../../domain/events/DomainEventDispatcher';

/**
 * Obsidian 이벤트 저장소
 */
export class ObsidianEventStore implements IEventStore {
  private readonly EVENT_FOLDER = '.card-navigator/events';
  private readonly EVENT_FILE_PREFIX = 'event_';

  constructor(
    private readonly app: App,
    private readonly eventDispatcher: DomainEventDispatcher
  ) {
    this.ensureEventFolder();
  }

  /**
   * 이벤트 폴더가 존재하는지 확인하고 없으면 생성합니다.
   */
  private async ensureEventFolder(): Promise<void> {
    try {
      const folder = this.app.vault.getAbstractFileByPath(this.EVENT_FOLDER);
      if (!folder) {
        await this.app.vault.createFolder(this.EVENT_FOLDER);
      }
    } catch (error) {
      // 폴더가 이미 존재하는 경우 무시
      if (error instanceof Error && error.message !== 'Folder already exists.') {
        throw error;
      }
    }
  }

  /**
   * 이벤트를 저장합니다.
   */
  async save(event: IDomainEvent): Promise<void> {
    const eventData = {
      eventId: event.eventId,
      occurredOn: event.occurredOn.toISOString(),
      eventType: event.constructor.name,
      eventData: event
    };

    const fileName = `${this.EVENT_FILE_PREFIX}${event.eventId}.json`;
    const filePath = `${this.EVENT_FOLDER}/${fileName}`;

    await this.app.vault.create(filePath, JSON.stringify(eventData, null, 2));
  }

  /**
   * 특정 ID의 이벤트를 조회합니다.
   */
  async findById(eventId: string): Promise<IDomainEvent | null> {
    const fileName = `${this.EVENT_FILE_PREFIX}${eventId}.json`;
    const filePath = `${this.EVENT_FOLDER}/${fileName}`;
    const file = this.app.vault.getAbstractFileByPath(filePath);

    if (!file || !(file instanceof TFile)) {
      return null;
    }

    const content = await this.app.vault.read(file);
    const eventData = JSON.parse(content);
    return this.reconstructEvent(eventData);
  }

  /**
   * 특정 시간 범위의 이벤트들을 조회합니다.
   */
  async findByDateRange(startDate: Date, endDate: Date): Promise<IDomainEvent[]> {
    const events: IDomainEvent[] = [];
    const files = this.app.vault.getFiles()
      .filter(file => file.path.startsWith(this.EVENT_FOLDER));

    for (const file of files) {
      if (!(file instanceof TFile)) continue;

      const content = await this.app.vault.read(file);
      const eventData = JSON.parse(content);
      const eventDate = new Date(eventData.occurredOn);

      if (eventDate >= startDate && eventDate <= endDate) {
        events.push(this.reconstructEvent(eventData));
      }
    }

    return events.sort((a, b) => a.occurredOn.getTime() - b.occurredOn.getTime());
  }

  /**
   * 모든 이벤트를 조회합니다.
   */
  async findAll(): Promise<IDomainEvent[]> {
    const events: IDomainEvent[] = [];
    const files = this.app.vault.getFiles()
      .filter(file => file.path.startsWith(this.EVENT_FOLDER));

    for (const file of files) {
      if (!(file instanceof TFile)) continue;

      const content = await this.app.vault.read(file);
      const eventData = JSON.parse(content);
      events.push(this.reconstructEvent(eventData));
    }

    return events.sort((a, b) => a.occurredOn.getTime() - b.occurredOn.getTime());
  }

  /**
   * 모든 이벤트를 조회합니다.
   */
  async getEvents(): Promise<IDomainEvent[]> {
    return this.findAll();
  }

  /**
   * 마지막으로 저장된 이벤트를 조회합니다.
   */
  async findLastEvent(): Promise<IDomainEvent | null> {
    const events = await this.findAll();
    return events.length > 0 ? events[events.length - 1] : null;
  }

  /**
   * 특정 타입의 이벤트를 조회합니다.
   */
  async getEventsByType(type: string): Promise<IDomainEvent[]> {
    const events: IDomainEvent[] = [];
    const files = this.app.vault.getFiles()
      .filter(file => file.path.startsWith(this.EVENT_FOLDER));

    for (const file of files) {
      if (!(file instanceof TFile)) continue;

      const content = await this.app.vault.read(file);
      const eventData = JSON.parse(content);
      
      if (eventData.eventType === type) {
        events.push(this.reconstructEvent(eventData));
      }
    }

    return events.sort((a, b) => a.occurredOn.getTime() - b.occurredOn.getTime());
  }

  /**
   * 모든 이벤트를 삭제합니다.
   */
  async deleteAll(): Promise<void> {
    const files = this.app.vault.getFiles()
      .filter(file => file.path.startsWith(this.EVENT_FOLDER));

    for (const file of files) {
      if (file instanceof TFile) {
        await this.app.vault.delete(file);
      }
    }
  }

  /**
   * 이벤트를 재구성합니다.
   */
  private reconstructEvent(eventData: any): IDomainEvent {
    const EventClass = EventClassMapper.getEventClass(eventData.eventType);
    if (!EventClass) {
      throw new Error(`Unknown event type: ${eventData.eventType}`);
    }

    return new EventClass(eventData.eventData);
  }
} 