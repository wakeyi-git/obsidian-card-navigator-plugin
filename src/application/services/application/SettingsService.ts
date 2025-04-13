import { Plugin } from 'obsidian';
import { Container } from '@/infrastructure/di/Container';
import { ISettingsService } from '@/domain/services/application/ISettingsService';
import { IPluginSettings, DEFAULT_PLUGIN_SETTINGS } from '@/domain/models/PluginSettings';
import { ICardStyle, ICardSection, ICardDomainSettings, ICardStateStyle } from '@/domain/models/Card';
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
  CardSectionDisplayChangedEvent,
} from '@/domain/events/SettingsEvents';
import { IEventHandler } from '@/domain/infrastructure/IEventDispatcher';
import { SettingsUtils } from '@/domain/utils/settingsUtils';

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
      this.settings = SettingsUtils.mergeSettings(DEFAULT_PLUGIN_SETTINGS, savedSettings);
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
    const newSettings = SettingsUtils.updateSettings(oldSettings, (draft) => {
      draft.card = { ...oldSettings.card, ...settings };
    });
    await this.saveSettings(newSettings);
    this.eventDispatcher.dispatch(new SettingsChangedEvent(oldSettings, newSettings));
  }

  public getCardSetDomainSettings(type: CardSetType) {
    return this.settings.cardSet;
  }

  public async updateCardSetDomainSettings(type: CardSetType, settings: Partial<IPluginSettings['cardSet']>): Promise<void> {
    const oldSettings = { ...this.settings };
    const newSettings = SettingsUtils.updateSettings(oldSettings, (draft) => {
      draft.cardSet = { ...oldSettings.cardSet, ...settings };
    });
    await this.saveSettings(newSettings);
    this.eventDispatcher.dispatch(new CardSetConfigChangedEvent(type, oldSettings.cardSet.config, newSettings.cardSet.config));
  }

  public getLayoutDomainSettings() {
    return this.settings.layout;
  }

  public async updateLayoutDomainSettings(settings: Partial<IPluginSettings['layout']>): Promise<void> {
    const oldSettings = { ...this.settings };
    const newSettings = SettingsUtils.updateSettings(oldSettings, (draft) => {
      draft.layout = { ...oldSettings.layout, ...settings };
    });
    await this.saveSettings(newSettings);
    this.eventDispatcher.dispatch(new LayoutConfigChangedEvent(oldSettings.layout.config, newSettings.layout.config));
  }

  public getSortDomainSettings() {
    return this.settings.sort;
  }

  public async updateSortDomainSettings(settings: Partial<IPluginSettings['sort']>): Promise<void> {
    const oldSettings = { ...this.settings };
    const newSettings = SettingsUtils.updateSettings(oldSettings, (draft) => {
      draft.sort = { ...oldSettings.sort, ...settings };
    });
    await this.saveSettings(newSettings);
    this.eventDispatcher.dispatch(new SortConfigChangedEvent(oldSettings.sort.config, newSettings.sort.config));
  }

  public getSearchDomainSettings() {
    return this.settings.search;
  }

  public async updateSearchDomainSettings(settings: Partial<IPluginSettings['search']>): Promise<void> {
    const oldSettings = { ...this.settings };
    const newSettings = SettingsUtils.updateSettings(oldSettings, (draft) => {
      draft.search = { ...oldSettings.search, ...settings };
    });
    await this.saveSettings(newSettings);
    this.eventDispatcher.dispatch(new SearchConfigChangedEvent(oldSettings.search.config, newSettings.search.config));
  }

  public getPresetDomainSettings() {
    return this.settings.preset;
  }

  public async updatePresetDomainSettings(settings: Partial<IPluginSettings['preset']>): Promise<void> {
    const oldSettings = { ...this.settings };
    const newSettings = SettingsUtils.updateSettings(oldSettings, (draft) => {
      draft.preset = { ...oldSettings.preset, ...settings };
    });
    await this.saveSettings(newSettings);
    this.eventDispatcher.dispatch(new SettingsChangedEvent(oldSettings, newSettings));
  }

  public validateSettings(settings: IPluginSettings): boolean {
    return SettingsUtils.validateSettings(settings);
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
    const newSettings = SettingsUtils.updateNestedSettings(this.settings, path, value);
    await this.saveSettings(newSettings);
    this.eventDispatcher.dispatch(new SettingsChangedEvent(oldSettings, newSettings));
  }

  public getCardStyle(): ICardStateStyle {
    return this.settings.card.stateStyle;
  }

  public async updateCardStyle(state: 'normal' | 'active' | 'focused', property: keyof ICardStyle, value: string): Promise<void> {
    const oldSettings = { ...this.settings };
    const newSettings = SettingsUtils.updateSettings(oldSettings, (draft) => {
      const oldStyleValue = oldSettings.card.stateStyle[state][property];
      const newStyleValue = typeof oldStyleValue === 'object' 
        ? { ...oldStyleValue, [property]: value }
        : value;
      
      draft.card = {
        ...oldSettings.card,
        stateStyle: {
          ...oldSettings.card.stateStyle,
          [state]: {
            ...oldSettings.card.stateStyle[state],
            [property]: newStyleValue
          }
        }
      };
    });
    await this.saveSettings(newSettings);
    this.eventDispatcher.dispatch(new CardConfigChangedEvent(oldSettings.card.stateStyle, newSettings.card.stateStyle));
  }

  public getCardSectionDisplay(section: 'header' | 'body' | 'footer'): ICardSection {
    return this.settings.card.sections[section];
  }

  public async updateCardSectionDisplay(
    section: 'header' | 'body' | 'footer',
    property: keyof ICardSection['displayOptions'],
    value: boolean
  ): Promise<void> {
    const oldSettings = { ...this.settings };
    const newSettings = SettingsUtils.updateSettings(oldSettings, (draft) => {
      draft.card = {
        ...oldSettings.card,
        sections: {
          ...oldSettings.card.sections,
          [section]: {
            ...oldSettings.card.sections[section],
            displayOptions: {
              ...oldSettings.card.sections[section].displayOptions,
              [property]: value
            }
          }
        }
      };
    });
    await this.saveSettings(newSettings);
    const oldValue = oldSettings.card.sections[section].displayOptions[property];
    const newValue = newSettings.card.sections[section].displayOptions[property];
    if (typeof oldValue === 'boolean' && typeof newValue === 'boolean') {
      this.eventDispatcher.dispatch(new CardSectionDisplayChangedEvent(
        section,
        property,
        oldValue,
        newValue
      ));
    }
  }
}