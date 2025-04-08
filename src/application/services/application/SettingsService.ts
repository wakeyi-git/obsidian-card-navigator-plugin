import { Plugin } from 'obsidian';
import { Container } from '@/infrastructure/di/Container';
import { ISettingsService } from '@/domain/services/application/ISettingsService';
import { ICardDomainSettings, IPluginSettings, DEFAULT_PLUGIN_SETTINGS } from '@/domain/models/PluginSettings';
import { ICardStyle, ICardSection } from '@/domain/models/Card';
import { CardSetType } from '@/domain/models/CardSet';
import { IEventDispatcher } from '@/domain/infrastructure/IEventDispatcher';
import { DomainEvent } from '@/domain/events/DomainEvent';
import {
  SettingsChangedEvent,
  CardConfigChangedEvent,
  CardSetConfigChangedEvent,
  LayoutConfigChangedEvent,
  SortConfigChangedEvent,
  SearchConfigChangedEvent,
} from '@/domain/events/SettingsEvents';
import { IEventHandler } from '@/domain/infrastructure/IEventDispatcher';

export class SettingsService implements ISettingsService {
  private static instance: SettingsService | null = null;
  private plugin: Plugin;
  private settings: IPluginSettings;
  private eventDispatcher: IEventDispatcher;

  private constructor() {
    const container = Container.getInstance();
    this.plugin = container.resolve<Plugin>('Plugin');
    this.settings = DEFAULT_PLUGIN_SETTINGS;
    this.eventDispatcher = container.resolve<IEventDispatcher>('IEventDispatcher');
  }

  public static getInstance(): SettingsService {
    if (!SettingsService.instance) {
      SettingsService.instance = new SettingsService();
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
      this.settings = this.mergeSettings(DEFAULT_PLUGIN_SETTINGS, savedSettings);
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

  public getCardDomainSettings(): ICardDomainSettings {
    return this.settings.card;
  }

  public async updateCardDomainSettings(settings: Partial<ICardDomainSettings>): Promise<void> {
    const oldSettings = { ...this.settings };
    const newSettings = { ...oldSettings };
    newSettings.card = { ...oldSettings.card, ...settings };
    await this.saveSettings(newSettings);
    this.eventDispatcher.dispatch(new CardConfigChangedEvent(oldSettings.card.style, newSettings.card.style));
  }

  public getCardSetDomainSettings(type: CardSetType) {
    return this.settings.cardSet;
  }

  public async updateCardSetDomainSettings(type: CardSetType, settings: Partial<IPluginSettings['cardSet']>): Promise<void> {
    const oldSettings = { ...this.settings };
    const newSettings = { ...oldSettings };
    newSettings.cardSet = { ...oldSettings.cardSet, ...settings };
    await this.saveSettings(newSettings);
    this.eventDispatcher.dispatch(new CardSetConfigChangedEvent(type, oldSettings.cardSet.config, newSettings.cardSet.config));
  }

  public getLayoutDomainSettings() {
    return this.settings.layout;
  }

  public async updateLayoutDomainSettings(settings: Partial<IPluginSettings['layout']>): Promise<void> {
    const oldSettings = { ...this.settings };
    const newSettings = { ...oldSettings };
    newSettings.layout = { ...oldSettings.layout, ...settings };
    await this.saveSettings(newSettings);
    this.eventDispatcher.dispatch(new LayoutConfigChangedEvent(oldSettings.layout.config, newSettings.layout.config));
  }

  public getSortDomainSettings() {
    return this.settings.sort;
  }

  public async updateSortDomainSettings(settings: Partial<IPluginSettings['sort']>): Promise<void> {
    const oldSettings = { ...this.settings };
    const newSettings = { ...oldSettings };
    newSettings.sort = { ...oldSettings.sort, ...settings };
    await this.saveSettings(newSettings);
    this.eventDispatcher.dispatch(new SortConfigChangedEvent(oldSettings.sort.config, newSettings.sort.config));
  }

  public getSearchDomainSettings() {
    return this.settings.search;
  }

  public async updateSearchDomainSettings(settings: Partial<IPluginSettings['search']>): Promise<void> {
    const oldSettings = { ...this.settings };
    const newSettings = { ...oldSettings };
    newSettings.search = { ...oldSettings.search, ...settings };
    await this.saveSettings(newSettings);
    this.eventDispatcher.dispatch(new SearchConfigChangedEvent(oldSettings.search.config, newSettings.search.config));
  }

  public getPresetDomainSettings() {
    return this.settings.preset;
  }

  public async updatePresetDomainSettings(settings: Partial<IPluginSettings['preset']>): Promise<void> {
    const oldSettings = { ...this.settings };
    const newSettings = { ...oldSettings };
    newSettings.preset = { ...oldSettings.preset, ...settings };
    await this.saveSettings(newSettings);
    this.eventDispatcher.dispatch(new SettingsChangedEvent(oldSettings, newSettings));
  }

  public validateSettings(settings: IPluginSettings): boolean {
    return this.validateSettingsInternal(settings);
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
    const newSettings = this.updateNestedSettingsInternal(this.settings, path, value);
    await this.saveSettings(newSettings);
    this.eventDispatcher.dispatch(new SettingsChangedEvent(oldSettings, newSettings));
  }

  public getCardStyle(): ICardStyle {
    return this.settings.card.style;
  }

  public async updateCardStyle(styleKey: keyof ICardStyle, property: keyof ICardStyle, value: string): Promise<void> {
    const oldSettings = { ...this.settings };
    const newSettings = { ...oldSettings };
    const oldStyleValue = oldSettings.card.style[styleKey];
    const newStyleValue = typeof oldStyleValue === 'object' 
      ? { ...oldStyleValue, [property]: value }
      : value;
    
    newSettings.card = {
      ...oldSettings.card,
      style: {
        ...oldSettings.card.style,
        [styleKey]: newStyleValue
      }
    };
    await this.saveSettings(newSettings);
    this.eventDispatcher.dispatch(new CardConfigChangedEvent(oldSettings.card.style, newSettings.card.style));
  }

  public getCardSectionDisplay(section: 'header' | 'body' | 'footer'): ICardSection {
    return this.settings.card.sections[section];
  }

  public async updateCardSectionDisplay(
    section: 'header' | 'body' | 'footer',
    property: keyof ICardSection,
    value: boolean
  ): Promise<void> {
    const oldSettings = { ...this.settings };
    const newSettings = { ...oldSettings };
    newSettings.card = {
      ...oldSettings.card,
      sections: {
        ...oldSettings.card.sections,
        [section]: {
          ...oldSettings.card.sections[section],
          [property]: value
        }
      }
    };
    await this.saveSettings(newSettings);
    this.eventDispatcher.dispatch(new CardConfigChangedEvent(oldSettings.card.style, newSettings.card.style));
  }

  private mergeSettings(base: IPluginSettings, override: Partial<IPluginSettings>): IPluginSettings {
    return {
      ...base,
      ...override,
      card: {
        ...base.card,
        ...override.card,
        style: {
          ...base.card.style,
          ...override.card?.style
        },
        sections: {
          header: {
            ...base.card.sections.header,
            ...override.card?.sections?.header
          },
          body: {
            ...base.card.sections.body,
            ...override.card?.sections?.body
          },
          footer: {
            ...base.card.sections.footer,
            ...override.card?.sections?.footer
          }
        }
      },
      cardSet: {
        ...base.cardSet,
        ...override.cardSet,
        config: {
          ...base.cardSet.config,
          ...override.cardSet?.config
        }
      },
      layout: {
        ...base.layout,
        ...override.layout,
        config: {
          ...base.layout.config,
          ...override.layout?.config
        }
      },
      search: {
        ...base.search,
        ...override.search,
        config: {
          ...base.search.config,
          ...override.search?.config
        }
      },
      sort: {
        ...base.sort,
        ...override.sort,
        config: {
          ...base.sort.config,
          ...override.sort?.config
        }
      },
      preset: {
        ...base.preset,
        ...override.preset,
        config: {
          ...base.preset.config,
          ...override.preset?.config
        }
      }
    };
  }

  private updateNestedSettingsInternal<T>(settings: T, path: string, value: any): T {
    const draft = JSON.parse(JSON.stringify(settings));
    const pathParts = path.split('.');
    let current: any = draft;
    for (let i = 0; i < pathParts.length - 1; i++) {
      current = current[pathParts[i]];
    }
    current[pathParts[pathParts.length - 1]] = value;
    return draft;
  }

  private validateSettingsInternal(settings: IPluginSettings): boolean {
    return !!settings.card && !!settings.cardSet && !!settings.layout && 
           !!settings.search && !!settings.sort && !!settings.preset;
  }
}