import { App, Plugin } from 'obsidian';
import { Container } from '../../infrastructure/di/Container';
import { ISettingsService } from '../../domain/services/ISettingsService';
import { IPluginSettings, DefaultValues } from '../../domain/models/DefaultValues';
import { ICardConfig, ICardSectionConfig } from '../../domain/models/CardConfig';
import { ICardSetConfig, CardSetType } from '../../domain/models/CardSetConfig';
import { ILayoutConfig } from '../../domain/models/LayoutConfig';
import { ISortConfig } from '../../domain/models/SortConfig';
import { IFilterConfig } from '../../domain/models/FilterConfig';
import { ISearchConfig } from '../../domain/models/SearchConfig';
import { ICardStyle, IStyleProperties } from '../../domain/models/CardStyle';
import { IEventDispatcher } from '@/domain/infrastructure/IEventDispatcher';
import { DomainEventType } from '@/domain/events/DomainEventType';
import { IDomainEvent, DomainEvent } from '@/domain/events/DomainEvent';
import {
  SettingsChangedEvent,
  CardConfigChangedEvent,
  CardSetConfigChangedEvent,
  LayoutConfigChangedEvent,
  SortConfigChangedEvent,
  FilterConfigChangedEvent,
  SearchConfigChangedEvent,
  CardStyleChangedEvent,
  CardSectionDisplayChangedEvent
} from '../../domain/events/SettingsEvents';
import { Subscription } from 'rxjs';
import { IEventHandler } from '@/domain/infrastructure/IEventDispatcher';

export class SettingsService implements ISettingsService {
  private static instance: SettingsService | null = null;
  private plugin: Plugin;
  private settings: IPluginSettings;
  private eventDispatcher: IEventDispatcher;

  private constructor(plugin: Plugin, eventDispatcher: IEventDispatcher) {
    this.plugin = plugin;
    this.settings = DefaultValues.plugin;
    this.eventDispatcher = eventDispatcher;
  }

  public static getInstance(plugin: Plugin): SettingsService {
    if (!SettingsService.instance) {
      const eventDispatcher = Container.getInstance().resolve<IEventDispatcher>('IEventDispatcher');
      SettingsService.instance = new SettingsService(plugin, eventDispatcher);
    }
    return SettingsService.instance;
  }

  public initialize(): void {
    // 초기화 로직 구현
  }

  public cleanup(): void {
    // 정리 로직 구현
  }

  public async loadSettings(): Promise<IPluginSettings> {
    const savedSettings = await this.plugin.loadData();
    if (savedSettings) {
      this.settings = { ...DefaultValues.plugin, ...savedSettings };
    }
    return this.settings;
  }

  public async saveSettings(settings: IPluginSettings): Promise<void> {
    this.settings = settings;
    await this.plugin.saveData(settings);
    this.eventDispatcher.dispatch(new SettingsChangedEvent(this.settings, settings));
  }

  public getSettings(): IPluginSettings {
    return this.settings;
  }

  public onSettingsChanged(callback: (data: { oldSettings: IPluginSettings; newSettings: IPluginSettings }) => void): () => void {
    const wrappedCallback = (event: DomainEvent<'settings:changed'>) => {
      callback(event.data);
    };
    
    const subscription = this.eventDispatcher.subscribe('settings:changed', wrappedCallback);
    return () => subscription.unsubscribe();
  }

  public subscribeToSettingsChange(callback: (newSettings: IPluginSettings) => void): () => void {
    return this.onSettingsChanged(({ newSettings }) => callback(newSettings));
  }

  public getCardConfig(): ICardConfig {
    return this.settings.cardConfig;
  }

  public async updateCardConfig(config: ICardConfig): Promise<void> {
    const oldSettings = this.settings;
    this.settings = { ...this.settings, cardConfig: config };
    await this.saveSettings(this.settings);
    this.eventDispatcher.dispatch(new CardConfigChangedEvent(oldSettings.cardConfig, config));
  }

  public getCardSetConfig(type: CardSetType): ICardSetConfig {
    return this.settings.cardSetConfig;
  }

  public async updateCardSetConfig(type: CardSetType, config: ICardSetConfig): Promise<void> {
    const oldSettings = this.settings;
    this.settings = { ...this.settings, cardSetConfig: config };
    await this.saveSettings(this.settings);
    this.eventDispatcher.dispatch(new CardSetConfigChangedEvent(type, oldSettings.cardSetConfig, config));
  }

  public getLayoutConfig(): ILayoutConfig {
    return this.settings.layoutConfig;
  }

  public async updateLayoutConfig(config: ILayoutConfig): Promise<void> {
    const oldSettings = this.settings;
    this.settings = { ...this.settings, layoutConfig: config };
    await this.saveSettings(this.settings);
    this.eventDispatcher.dispatch(new LayoutConfigChangedEvent(oldSettings.layoutConfig, config));
  }

  public getSortConfig(): ISortConfig {
    return this.settings.sortConfig;
  }

  public async updateSortConfig(config: ISortConfig): Promise<void> {
    const oldSettings = this.settings;
    this.settings = { ...this.settings, sortConfig: config };
    await this.saveSettings(this.settings);
    this.eventDispatcher.dispatch(new SortConfigChangedEvent(oldSettings.sortConfig, config));
  }

  public getFilterConfig(): IFilterConfig {
    return this.settings.filterConfig;
  }

  public async updateFilterConfig(config: IFilterConfig): Promise<void> {
    const oldSettings = this.settings;
    this.settings = { ...this.settings, filterConfig: config };
    await this.saveSettings(this.settings);
    this.eventDispatcher.dispatch(new FilterConfigChangedEvent(oldSettings.filterConfig, config));
  }

  public getSearchConfig(): ISearchConfig {
    return this.settings.searchConfig;
  }

  public async updateSearchConfig(config: ISearchConfig): Promise<void> {
    const oldSettings = this.settings;
    this.settings = { ...this.settings, searchConfig: config };
    await this.saveSettings(this.settings);
    this.eventDispatcher.dispatch(new SearchConfigChangedEvent(oldSettings.searchConfig, config));
  }

  public validateSettings(settings: IPluginSettings): boolean {
    // TODO: 설정 유효성 검사 로직 구현
    return true;
  }

  public unsubscribeFromSettingsChange(callback: (settings: IPluginSettings) => void): void {
    const wrappedCallback = (event: DomainEvent<'settings:changed'>) => {
      const { newSettings } = event.data;
      callback(newSettings);
    };
    const handler: IEventHandler<DomainEvent<'settings:changed'>> = {
      handle: wrappedCallback
    };
    this.eventDispatcher.unregisterHandler('settings:changed', handler);
  }

  public async updateNestedSettings(path: string, value: any): Promise<void> {
    const oldSettings = this.settings;
    const pathParts = path.split('.');
    let current: any = this.settings;
    for (let i = 0; i < pathParts.length - 1; i++) {
      current = current[pathParts[i]];
    }
    current[pathParts[pathParts.length - 1]] = value;
    await this.saveSettings(this.settings);
    this.eventDispatcher.dispatch(new SettingsChangedEvent(oldSettings, this.settings));
  }

  public getCardStyle(): ICardStyle {
    return this.settings.cardConfig.style;
  }

  public async updateCardStyle(styleKey: keyof ICardStyle, property: keyof IStyleProperties, value: string): Promise<void> {
    const oldSettings = this.settings;
    this.settings = {
      ...this.settings,
      cardStyle: {
        ...this.settings.cardStyle,
        [styleKey]: {
          ...this.settings.cardStyle[styleKey],
          [property]: value
        }
      }
    };
    await this.saveSettings(this.settings);
    this.eventDispatcher.dispatch(new CardStyleChangedEvent(oldSettings.cardStyle, this.settings.cardStyle));
  }

  public getCardSectionDisplay(section: 'header' | 'body' | 'footer'): ICardSectionConfig {
    return this.settings.cardConfig[section];
  }

  public async updateCardSectionDisplay(section: 'header' | 'body' | 'footer', property: keyof ICardSectionConfig, value: boolean): Promise<void> {
    const oldSettings = this.settings;
    this.settings = {
      ...this.settings,
      cardConfig: {
        ...this.settings.cardConfig,
        [section]: {
          ...this.settings.cardConfig[section],
          [property]: value
        }
      }
    };
    await this.saveSettings(this.settings);
    this.eventDispatcher.dispatch(new CardSectionDisplayChangedEvent(section, property, oldSettings.cardConfig[section][property] ?? false, value));
  }
}