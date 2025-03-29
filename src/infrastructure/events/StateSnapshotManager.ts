import { IEventStore } from '../../domain/events/IEventStore';
import { ILogger } from '../logging/Logger';
import { Card } from '../../domain/models/Card';
import { ExtendedApp } from '../types/AppExtensions';

/**
 * 상태 스냅샷 인터페이스
 */
interface IStateSnapshot {
  timestamp: Date;
  cards: Card[];
}

/**
 * 상태 스냅샷 관리자
 */
export class StateSnapshotManager {
  private readonly SNAPSHOT_INTERVAL = 1000 * 60 * 60; // 1시간마다 스냅샷 생성
  private snapshotInterval: NodeJS.Timeout | null = null;

  constructor(
    private readonly app: ExtendedApp,
    private readonly eventStore: IEventStore,
    private readonly logger: ILogger
  ) {}

  /**
   * 스냅샷 생성을 시작합니다.
   */
  startSnapshotting(): void {
    if (this.snapshotInterval) {
      return;
    }

    this.snapshotInterval = setInterval(() => {
      this.createSnapshot().catch(error => {
        this.logger.error('Failed to create snapshot', error as Error);
      });
    }, this.SNAPSHOT_INTERVAL);

    this.logger.info('Started periodic state snapshotting');
  }

  /**
   * 스냅샷 생성을 중지합니다.
   */
  stopSnapshotting(): void {
    if (this.snapshotInterval) {
      clearInterval(this.snapshotInterval);
      this.snapshotInterval = null;
      this.logger.info('Stopped periodic state snapshotting');
    }
  }

  /**
   * 스냅샷을 생성합니다.
   */
  private async createSnapshot(): Promise<void> {
    try {
      const cards = await this.app.cardService.getAllCards();
      const snapshot: IStateSnapshot = {
        timestamp: new Date(),
        cards
      };

      await this.saveSnapshot(snapshot);
      this.logger.info('Created state snapshot successfully');
    } catch (error) {
      this.logger.error('Failed to create state snapshot', error as Error);
      throw error;
    }
  }

  /**
   * 스냅샷을 저장합니다.
   */
  private async saveSnapshot(snapshot: IStateSnapshot): Promise<void> {
    try {
      const snapshotData = JSON.stringify(snapshot);
      await this.app.vault.adapter.write(
        '.obsidian/plugins/card-navigator/snapshots.json',
        snapshotData
      );
    } catch (error) {
      this.logger.error('Failed to save state snapshot', error as Error);
      throw error;
    }
  }

  /**
   * 마지막 스냅샷을 로드합니다.
   */
  async loadLastSnapshot(): Promise<IStateSnapshot | null> {
    try {
      const snapshotData = await this.app.vault.adapter.read(
        '.obsidian/plugins/card-navigator/snapshots.json'
      );
      return JSON.parse(snapshotData);
    } catch (error) {
      this.logger.error('Failed to load state snapshot', error as Error);
      return null;
    }
  }

  /**
   * 특정 시점의 스냅샷을 로드합니다.
   */
  async loadSnapshotAt(date: Date): Promise<IStateSnapshot | null> {
    try {
      const snapshot = await this.loadLastSnapshot();
      if (!snapshot || snapshot.timestamp > date) {
        return null;
      }
      return snapshot;
    } catch (error) {
      this.logger.error('Failed to load state snapshot at date', error as Error);
      return null;
    }
  }
} 