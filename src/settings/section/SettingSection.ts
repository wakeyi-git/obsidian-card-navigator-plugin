import { ISettingsService } from '../../domain/settings/SettingsInterfaces';
import { DomainEventBus } from '../../domain/events/DomainEventBus';
import { ISettingSection } from './BaseSettingSection';

/**
 * 설정 섹션 추상 클래스
 * 설정 탭에 표시되는 섹션의 기본 클래스입니다.
 */
export abstract class SettingSection implements ISettingSection {
  /**
   * 섹션 ID
   */
  id: string = '';
  
  /**
   * 컨테이너 요소
   */
  protected containerEl: HTMLElement;
  
  /**
   * 설정 서비스
   */
  protected settingsService: ISettingsService;
  
  /**
   * 이벤트 버스
   */
  protected eventBus: DomainEventBus;
  
  /**
   * 생성자
   * @param containerEl 컨테이너 요소
   * @param settingsService 설정 서비스
   * @param eventBus 이벤트 버스
   */
  constructor(
    containerEl: HTMLElement,
    settingsService: ISettingsService,
    eventBus: DomainEventBus
  ) {
    this.containerEl = containerEl;
    this.settingsService = settingsService;
    this.eventBus = eventBus;
  }
  
  /**
   * 섹션 초기화
   * @param settingsService 설정 서비스
   * @param eventBus 이벤트 버스
   */
  initialize(settingsService: ISettingsService, eventBus: DomainEventBus): void {
    this.settingsService = settingsService;
    this.eventBus = eventBus;
  }
  
  /**
   * 섹션 표시
   * @param containerEl 컨테이너 요소
   */
  display(containerEl: HTMLElement): void {
    this.containerEl = containerEl;
    this.displayContent();
  }
  
  /**
   * 섹션 표시 (추상 메서드)
   */
  abstract displayContent(): void;
  
  /**
   * 섹션 언로드
   * 이벤트 리스너 등 정리 작업을 수행합니다.
   */
  unload(): void {
    // 기본 언로드 구현
    // 하위 클래스에서 필요에 따라 오버라이드
  }
} 