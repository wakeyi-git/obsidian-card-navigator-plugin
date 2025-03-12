import { App, PluginSettingTab, Setting } from 'obsidian';
import { DomainEventBus } from '../../domain/events/DomainEventBus';
import { EventType } from '../../domain/events/EventTypes';
import { ISettingsService } from '../../domain/settings/SettingsInterfaces';

/**
 * 설정 섹션 인터페이스
 * 설정 탭의 섹션을 정의합니다.
 */
export interface ISettingSection {
  /**
   * 섹션 ID
   */
  id: string;
  
  /**
   * 섹션 초기화
   * @param settingsService 설정 서비스
   * @param eventBus 이벤트 버스
   */
  initialize(settingsService: ISettingsService, eventBus: DomainEventBus): void;
  
  /**
   * 섹션 표시
   * @param containerEl 컨테이너 요소
   */
  display(containerEl: HTMLElement): void;
}

/**
 * 기본 설정 섹션 추상 클래스
 * 모든 설정 섹션 클래스의 기본 클래스입니다.
 */
export abstract class BaseSettingSection implements ISettingSection {
  /**
   * 섹션 ID
   */
  id: string;
  
  /**
   * 설정 서비스
   */
  protected settingsService!: ISettingsService;
  
  /**
   * 이벤트 버스
   */
  protected eventBus!: DomainEventBus;
  
  /**
   * 앱 인스턴스
   */
  protected app!: App;
  
  /**
   * 생성자
   * @param id 섹션 ID
   */
  constructor(id: string) {
    this.id = id;
  }
  
  /**
   * 섹션 초기화
   * @param settingsService 설정 서비스
   * @param eventBus 이벤트 버스
   */
  initialize(settingsService: ISettingsService, eventBus: DomainEventBus): void {
    this.settingsService = settingsService;
    this.eventBus = eventBus;
    this.app = (this.settingsService.getPlugin() as any).app;
  }
  
  /**
   * 섹션 표시
   * @param containerEl 컨테이너 요소
   */
  abstract display(containerEl: HTMLElement): void;
  
  /**
   * 설정 변경 알림
   * 설정이 변경되었을 때 이벤트를 발생시킵니다.
   * @param changedKey 변경된 설정 키 (지정하지 않으면 섹션 ID 사용)
   */
  protected notifySettingsChanged(changedKey?: string): void {
    // 디버깅: 설정 변경 알림 로깅
    console.log(`설정 변경 알림 호출 - 섹션: ${this.id}, 변경된 키: ${changedKey || this.id}`);
    console.log('현재 설정 값:', this.settingsService.getSettings());
    
    // UI 설정 변경 이벤트 발생
    this.eventBus.emit(EventType.SETTINGS_UI_CHANGED, {
      sectionId: this.id,
      key: changedKey || this.id
    });
    
    // 미리보기 업데이트 이벤트 발생
    this.eventBus.emit(EventType.SETTINGS_PREVIEW_UPDATE, {
      sectionId: this.id,
      key: changedKey || this.id
    });
    
    // 설정 변경 이벤트 발생 - 실제 카드에 적용하기 위해 추가
    // 이미 settingsService.updateSettings()에서 SETTINGS_CHANGED 이벤트를 발생시키지만,
    // 섹션 ID와 변경된 키를 포함하여 추가로 발생시킵니다.
    this.eventBus.emit(EventType.SETTINGS_CHANGED, {
      settings: this.settingsService.getSettings(),
      changedKeys: changedKey ? [changedKey, this.id] : [this.id]
    });
    
    // 디버깅용 로그
    console.log(`설정 변경 알림: ${this.id}, 변경된 키: ${changedKey || this.id}`);
  }
  
  /**
   * 설정 생성
   * @param containerEl 컨테이너 요소
   * @param name 설정 이름
   * @param desc 설정 설명
   * @returns 설정 객체
   */
  protected createSetting(containerEl: HTMLElement, name: string, desc: string): Setting {
    return new Setting(containerEl)
      .setName(name)
      .setDesc(desc);
  }
} 