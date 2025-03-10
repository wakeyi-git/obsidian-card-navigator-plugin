import { App, TFile, TFolder, CachedMetadata, Workspace, Vault, MetadataCache, EventRef } from 'obsidian';
import { IObsidianApp, IVault, IWorkspace, IMetadataCache } from './ObsidianInterfaces';

/**
 * Obsidian 앱 어댑터 인터페이스
 * Obsidian 앱의 주요 기능을 추상화합니다.
 */
export interface IObsidianAdapter extends IObsidianApp {
  /**
   * Obsidian 앱 인스턴스 가져오기
   */
  getApp(): App;
}

/**
 * Vault 어댑터 인터페이스
 * Obsidian의 Vault 기능을 추상화합니다.
 */
export interface IVaultAdapter extends IVault {
  /**
   * 원본 Vault 인스턴스 가져오기
   */
  getVault(): Vault;
}

/**
 * Workspace 어댑터 인터페이스
 * Obsidian의 Workspace 기능을 추상화합니다.
 */
export interface IWorkspaceAdapter extends IWorkspace {
  /**
   * 원본 Workspace 인스턴스 가져오기
   */
  getWorkspace(): Workspace;
}

/**
 * MetadataCache 어댑터 인터페이스
 * Obsidian의 MetadataCache 기능을 추상화합니다.
 */
export interface IMetadataCacheAdapter extends IMetadataCache {
  /**
   * 원본 MetadataCache 인스턴스 가져오기
   */
  getMetadataCache(): MetadataCache;
} 