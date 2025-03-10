import { App, TFile, EventRef } from 'obsidian';
import { DomainEventBus } from '../domain/events/DomainEventBus';
import { EventType } from '../domain/events/EventTypes';
import { IObsidianApp } from '../domain/obsidian/ObsidianInterfaces';
import { IObsidianEventAdapter } from '../domain/obsidian/ObsidianEventAdapter';

/**
 * Obsidian 이벤트 어댑터 클래스
 * Obsidian 이벤트를 도메인 이벤트로 변환하여 전파합니다.
 */
export class ObsidianEventAdapter implements IObsidianEventAdapter {
  private app: App;
  private obsidianApp: IObsidianApp;
  private eventBus: DomainEventBus;
  private eventRefs: EventRef[] = [];
  
  /**
   * 생성자
   * @param app Obsidian 앱 인스턴스
   * @param obsidianApp Obsidian 앱 어댑터 인스턴스
   */
  constructor(app: App, obsidianApp: IObsidianApp) {
    this.app = app;
    this.obsidianApp = obsidianApp;
    this.eventBus = DomainEventBus.getInstance();
  }
  
  /**
   * 이벤트 리스너 등록
   */
  registerEvents(): void {
    // 파일 열기 이벤트
    this.eventRefs.push(
      this.app.workspace.on('file-open', (file: TFile | null) => {
        if (file) {
          this.eventBus.emit(EventType.FILE_OPENED, { file });
        }
      })
    );
    
    // 파일 생성 이벤트
    this.eventRefs.push(
      this.app.vault.on('create', (file) => {
        if (file instanceof TFile && file.extension === 'md') {
          this.eventBus.emit(EventType.FILE_CREATED, { file });
        }
      })
    );
    
    // 파일 수정 이벤트
    this.eventRefs.push(
      this.app.vault.on('modify', (file) => {
        if (file instanceof TFile && file.extension === 'md') {
          this.eventBus.emit(EventType.FILE_MODIFIED, { file });
        }
      })
    );
    
    // 파일 삭제 이벤트
    this.eventRefs.push(
      this.app.vault.on('delete', (file) => {
        if (file instanceof TFile && file.extension === 'md') {
          this.eventBus.emit(EventType.FILE_DELETED, { file });
        }
      })
    );
    
    // 파일 이름 변경 이벤트
    this.eventRefs.push(
      this.app.vault.on('rename', (file, oldPath) => {
        if (file instanceof TFile && file.extension === 'md') {
          this.eventBus.emit(EventType.FILE_RENAMED, { file, oldPath });
        }
      })
    );
    
    // 레이아웃 변경 이벤트
    this.eventRefs.push(
      this.app.workspace.on('layout-change', () => {
        // 레이아웃 변경 이벤트는 추가 데이터 없이 발생
        // 도메인 이벤트로 변환하여 전파
        this.eventBus.emit(EventType.LAYOUT_CHANGED, {
          previousLayout: 'grid', // 기본값 설정
          newLayout: 'grid'       // 기본값 설정
        });
      })
    );
    
    // 활성 리프 변경 이벤트
    this.eventRefs.push(
      this.app.workspace.on('active-leaf-change', (leaf) => {
        if (leaf) {
          this.eventBus.emit(EventType.ACTIVE_LEAF_CHANGED, { leaf });
        }
      })
    );
  }
  
  /**
   * 이벤트 리스너 제거
   */
  unregisterEvents(): void {
    this.eventRefs.forEach(ref => {
      this.app.workspace.offref(ref);
    });
    this.eventRefs = [];
  }
} 