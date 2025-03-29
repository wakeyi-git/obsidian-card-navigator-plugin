import { Setting, ButtonComponent, ToggleComponent, Notice, debounce } from 'obsidian';
import CardNavigatorPlugin from '../../../../main';
import { SettingsManager } from '../settingsManager';
import { PresetSuggest, FileSuggestMode } from '../components/PresetSuggest';
import { PresetEditModal } from '../modals/PresetEditModal';
import { PresetImportExportModal } from '../modals/PresetImportExportModal';
import { FolderSuggest } from '../components/FolderSuggest';
import { SettingTab } from '../settingsTab';
import { t } from 'i18next';
import { CardNavigatorView, VIEW_TYPE_CARD_NAVIGATOR } from '../../CardNavigatorView';
import { RefreshType, Preset } from '../../../../domain/models/types';

//#region 전역 변수
// 프리셋 목록을 표시할 컨테이너
let presetListContainer: HTMLElement;
//#endregion

//#region 메인 설정 추가
/**
 * 프리셋 설정을 추가하는 메인 함수입니다.
 * 모든 프리셋 관련 설정을 초기화하고 표시합니다.
 */
export function addPresetSettings(containerEl: HTMLElement, plugin: CardNavigatorPlugin, settingsManager: SettingsManager, settingTab: SettingTab): void {
	// 뷰 새로고침 함수 정의
	const refreshViews = () => {
		const leaves = plugin.app.workspace.getLeavesOfType(VIEW_TYPE_CARD_NAVIGATOR);
		leaves.forEach(leaf => {
			if (leaf.view instanceof CardNavigatorView) {
				leaf.view.refresh(RefreshType.FULL);
			}
		});
		settingTab.updateAllSections();
	};

	const debouncedRefreshViews = debounce(() => refreshViews(), 200);

	// 자동 적용 설정 섹션 추가
	addAutoApplyPresetsSection(containerEl, plugin, settingsManager, debouncedRefreshViews);

	// autoApplyPresets가 true일 때만 다른 프리셋 관련 섹션들을 표시
	if (plugin.settings.autoApplyPresets) {
		// 프리셋 폴더 설정
		addGlobalPresetSection(containerEl, plugin, debouncedRefreshViews);
		
		// 프리셋 관리 섹션
		addPresetManagementSection(containerEl, plugin, settingsManager, debouncedRefreshViews);
		
		// 프리셋 목록을 위한 컨테이너 생성
		presetListContainer = containerEl.createDiv('preset-list-container');
		refreshPresetList(plugin, settingsManager, debouncedRefreshViews);
		
		// 폴더별 프리셋 설정
		addFolderPresetSection(containerEl, plugin, settingsManager, debouncedRefreshViews);
	}
}
//#endregion

//#region 자동 적용 설정
/**
 * 프리셋 자동 적용 설정을 추가합니다.
 */
function addAutoApplyPresetsSection(containerEl: HTMLElement, plugin: CardNavigatorPlugin, settingsManager: SettingsManager, debouncedRefreshViews: () => void): void {
	new Setting(containerEl)
		.setName(t('AUTO_APPLY_PRESETS'))
		.setDesc(t('AUTO_APPLY_PRESETS_DESC'))
		.addToggle((toggle) => 
			toggle
				.setValue(plugin.settings.autoApplyPresets)
				.onChange(async (value) => {
					plugin.settings.autoApplyPresets = value;
					await plugin.saveSettings();
					plugin.refreshAllViews(RefreshType.FULL);
				})
		);
}
//#endregion

//#region 전역 프리셋 설정
/**
 * 전역 프리셋 폴더 설정을 추가합니다.
 */
function addGlobalPresetSection(containerEl: HTMLElement, plugin: CardNavigatorPlugin, debouncedRefreshViews: () => void): void {
	new Setting(containerEl)
		.setName(t('PRESET_FOLDER'))
		.setDesc(t('SELECT_PRESET_FOLDER'))
		.addSearch(cb => {
			new FolderSuggest(plugin.app, cb.inputEl, async () => {
				const newFolder = cb.inputEl.value;
				if (newFolder !== plugin.settings.presetFolderPath) {
					plugin.settings.presetFolderPath = newFolder;
					await plugin.saveSettings();
					await plugin.presetManager.updatePresetFolder(newFolder);
					debouncedRefreshViews();
				}
			});
			
			cb.setPlaceholder(t('PRESET_FOLDER_PLACEHOLDER'))
				.setValue(plugin.settings.presetFolderPath);

			const parentEl = cb.inputEl.parentElement;
			if (parentEl) {
				parentEl.classList.add('card-navigator-wide-input-container');
			}
		
		cb.inputEl.removeAttribute('autofocus');
		
		setTimeout(() => {
			cb.inputEl.blur();
		}, 0);
	});
}
//#endregion

//#region 폴더별 프리셋 설정
/**
 * 폴더별 프리셋 설정을 추가합니다.
 */
function addFolderPresetSection(containerEl: HTMLElement, plugin: CardNavigatorPlugin, settingsManager: SettingsManager, debouncedRefreshViews: () => void): void {
	// 폴더별 프리셋 자동 적용 설정
	new Setting(containerEl)
		.setName(t('AUTO_APPLY_FOLDER_PRESET'))
		.setDesc(t('AUTO_APPLY_FOLDER_PRESET_DESC'))
		.addToggle((toggle) => 
			toggle
				.setValue(plugin.settings.autoApplyFolderPresets)
				.onChange(async (value) => {
					await settingsManager.toggleAutoApplyPresets(value);
					const currentFile = plugin.app.workspace.getActiveFile();
					if (currentFile) {
						await plugin.selectAndApplyPresetForCurrentFile();
					}
				})
		);

	// 새 폴더 프리셋 추가 버튼
	new Setting(containerEl)
        .setName(t('ADD_NEW_FOLDER_PRESET'))
        .setDesc(t('ADD_NEW_FOLDER_PRESET_DESC'))
        .addButton((button: ButtonComponent) => 
            button
                .setTooltip(t('ADD_NEW_FOLDER_PRESET'))
                .setIcon('plus')
                .setCta()
                .onClick(async () => {
                    const newFolderPath = '';
                    
                    plugin.settings.folderPresets = plugin.settings.folderPresets || {};
                    plugin.settings.activeFolderPresets = plugin.settings.activeFolderPresets || {};
                    
                    if (!plugin.settings.folderPresets[newFolderPath]) {
                        plugin.settings.folderPresets[newFolderPath] = [];
                        plugin.settings.activeFolderPresets[newFolderPath] = '';
                        await settingsManager.saveSettings();
                        debouncedRefreshViews();
                    } else {
                        new Notice(t('PRESET_ALREADY_EXISTS'));
                    }
                })
        );

	// 기존 폴더 프리셋 목록 표시
	plugin.settings.folderPresets = plugin.settings.folderPresets || {};
	plugin.settings.activeFolderPresets = plugin.settings.activeFolderPresets || {};

    for (const [folderPath, presets] of Object.entries(plugin.settings.folderPresets)) {
		const s = new Setting(containerEl)
			.addSearch((cb) => {
				new FolderSuggest(plugin.app, cb.inputEl);
				cb.setPlaceholder(t('FOLDER'))
					.setValue(folderPath)
					.onChange((_newFolder) => {
						// 변경 사항을 처리하는 로직
					});
				cb.inputEl.addEventListener('blur', () => {
					const newFolder = cb.inputEl.value;
					if (newFolder && plugin.settings.folderPresets?.[newFolder]) {
						new Notice(t('PRESET_ALREADY_EXISTS_FOR_FOLDER'));
						return;
					}
					if (plugin.settings.folderPresets) {
						delete plugin.settings.folderPresets[folderPath];
						plugin.settings.folderPresets[newFolder] = presets;
					}
					if (plugin.settings.activeFolderPresets?.[folderPath]) {
						plugin.settings.activeFolderPresets[newFolder] = plugin.settings.activeFolderPresets[folderPath];
						delete plugin.settings.activeFolderPresets[folderPath];
					}
					settingsManager.saveSettings();
					debouncedRefreshViews();
				});
			});

		const presetInput = s.controlEl.createEl("input", {
			cls: "preset-suggest-input",
			type: "text",
			value: plugin.settings.activeFolderPresets?.[folderPath] || '',
			placeholder: t('PRESET')
		});
		
        new PresetSuggest(
            plugin.app,
            presetInput,
            plugin,
            FileSuggestMode.PresetsFiles
        );
		
		presetInput.onblur = async () => {
			const newValue = presetInput.value;
			plugin.settings.activeFolderPresets = plugin.settings.activeFolderPresets || {};
			plugin.settings.folderPresets = plugin.settings.folderPresets || {};
		
			if (newValue !== plugin.settings.activeFolderPresets[folderPath]) {
				plugin.settings.activeFolderPresets[folderPath] = newValue;
				plugin.settings.folderPresets[folderPath] = [newValue];
				await settingsManager.saveSettings();
				debouncedRefreshViews();
			}
		};

		// 이동 및 삭제 버튼 추가
		s.addExtraButton((cb) => {
			cb.setIcon('down-chevron-glyph')
				.setTooltip(t('MOVE_DOWN'))
				.onClick(() => {
					const entries = Object.entries(plugin.settings.folderPresets || {});
					const index = entries.findIndex(([path]) => path === folderPath);
					if (index < entries.length - 1) {
						[entries[index], entries[index + 1]] = [entries[index + 1], entries[index]];
						plugin.settings.folderPresets = Object.fromEntries(entries);
						settingsManager.saveSettings();
						debouncedRefreshViews();
					}
				});
		})
		.addExtraButton((cb) => {
			cb.setIcon('cross')
				.setTooltip(t('DELETE'))
				.onClick(() => {
					if (plugin.settings.folderPresets) {
						delete plugin.settings.folderPresets[folderPath];
					}
					if (plugin.settings.activeFolderPresets) {
						delete plugin.settings.activeFolderPresets[folderPath];
					}
					settingsManager.saveSettings();
					debouncedRefreshViews();
				});
		});
		s.infoEl.remove();
	}
}
//#endregion

//#region 프리셋 관리
/**
 * 프리셋 관리 섹션을 추가합니다.
 */
function addPresetManagementSection(containerEl: HTMLElement, plugin: CardNavigatorPlugin, settingsManager: SettingsManager, debouncedRefreshViews: () => void): void {
	addPresetManagementSectionContent(containerEl, plugin, settingsManager, debouncedRefreshViews);
}

/**
 * 프리셋 관리 섹션의 내용을 추가합니다.
 */
function addPresetManagementSectionContent(containerEl: HTMLElement, plugin: CardNavigatorPlugin, settingsManager: SettingsManager, debouncedRefreshViews: () => void): void {
	new Setting(containerEl)
		.setName(t('PRESET_MANAGEMENT_AND_GLOBAL_SETTINGS'))
		.setDesc(t('PRESET_MANAGEMENT_DESC'))
		.addButton((button: ButtonComponent) => 
			button
				.setTooltip(t('CREATE_NEW_PRESET'))
				.setIcon('plus')
				.setCta()
				.onClick(async () => {
					const modal = new PresetEditModal(
						plugin.app, 
						plugin, 
						settingsManager, 
						'create', 
						undefined,
						debouncedRefreshViews
					);
					await modal.open();
				})
		)
		.addButton((button: ButtonComponent) => 
			button
				.setTooltip(t('IMPORT_PRESET'))
				.setIcon('upload')
				.onClick(async () => {
					const modal = new PresetImportExportModal(
						plugin.app,
						plugin,
						settingsManager,
						'import',
						undefined,
						() => refreshPresetList(plugin, settingsManager, debouncedRefreshViews) 
					);
					await modal.open();
				})
		);
}

/**
 * 프리셋 목록을 새로고침합니다.
 */
async function refreshPresetList(plugin: CardNavigatorPlugin, settingsManager: SettingsManager, debouncedRefreshViews: () => void): Promise<void> {
	if (!presetListContainer) return;

	presetListContainer.empty();
	await addPresetListSection(presetListContainer, plugin, settingsManager, debouncedRefreshViews);
}

/**
 * 프리셋 목록 섹션을 추가합니다.
 */
async function addPresetListSection(containerEl: HTMLElement, plugin: CardNavigatorPlugin, settingsManager: SettingsManager, debouncedRefreshViews: () => void): Promise<void> {
	const presetNames = await plugin.presetManager.getPresetNames();
	const presets = await Promise.all(presetNames.map(name => plugin.presetManager.getPreset(name)));
	
	presets.forEach((preset: Preset | undefined, index: number) => {
		if (!preset) return;
		
		const presetName = presetNames[index];
		const presetContainer = presetListContainer.createEl('div', { cls: 'preset-item' });
		const setting = new Setting(presetContainer)
			.setName(presetName)
			.setDesc(preset.description || t('NO_DESCRIPTION'));
		
		if (presetName !== 'default') {
			setting.addButton((button: ButtonComponent) => 
				button
					.setTooltip(t('EDIT'))
					.setIcon('pencil')
					.onClick(() => {
						new PresetEditModal(
							plugin.app, 
							plugin, 
							settingsManager, 
							'edit', 
							presetName,
							debouncedRefreshViews
						).open();
					})
			);

			setting.addButton((button: ButtonComponent) => 
				button
					.setTooltip(t('CLONE'))
					.setIcon('copy')
					.onClick(() => {
						new PresetEditModal(
							plugin.app, 
							plugin, 
							settingsManager, 
							'clone', 
							presetName,
							debouncedRefreshViews
						).open();
					})
			);

			setting.addButton((button: ButtonComponent) => 
				button
					.setTooltip(t('DELETE'))
					.setIcon('trash')
					.onClick(async () => {
						if (await settingsManager.confirmDelete(t('PRESET_NAME', {name: presetName}))) {
							await plugin.presetManager.deletePreset(presetName);
							
							// 모든 폴더 프리셋 목록에서 삭제된 프리셋 제거
							await plugin.presetManager.removePresetFromAllFolders(presetName);
							
							if (plugin.settings.GlobalPreset === presetName) {
								await plugin.presetManager.applyGlobalPreset('default');
								new Notice(t('PRESET_DELETED_NOTICE'));
							}
							
							settingsManager.applyChanges();
							debouncedRefreshViews();
						}
					})
			);
		}

		setting.addButton((button: ButtonComponent) => 
			button
				.setTooltip(t('EXPORT'))
				.setIcon('download')
				.onClick(() => {
					new PresetImportExportModal(plugin.app, plugin, settingsManager, 'export', presetName).open();
				})
		)
		.addToggle((toggle: ToggleComponent) => {
			toggle
				.setTooltip(t('SET_AS_GLOBAL_PRESET'))
				.setValue(plugin.settings.GlobalPreset === presetName)
				.onChange(async (value: boolean) => {
					if (value) {
						await plugin.presetManager.applyGlobalPreset(presetName);
						debouncedRefreshViews();
					} else if (plugin.settings.GlobalPreset === presetName) {
						toggle.setValue(true);
					}
				});
		});
	});
}
//#endregion
