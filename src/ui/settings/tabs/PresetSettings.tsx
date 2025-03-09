import React, { useState } from 'react';
import CardNavigatorPlugin from '../../../main';
import SettingItem from '../components/SettingItem';

/**
 * 프리셋 설정 탭 컴포넌트
 */
const PresetSettings: React.FC<{ plugin: CardNavigatorPlugin }> = ({ plugin }) => {
  const settings = plugin.settings;
  const [presets, setPresets] = useState<string[]>(settings.presets || []);
  const [newPresetName, setNewPresetName] = useState<string>('');
  
  // 설정 변경 핸들러
  const onChange = async (key: string, value: any) => {
    // @ts-ignore
    plugin.settings[key] = value;
    await plugin.saveSettings();
  };
  
  // 프리셋 추가
  const addPreset = async () => {
    if (!newPresetName.trim()) return;
    
    // 현재 설정을 복제하여 새 프리셋 생성
    const newPreset = {
      name: newPresetName.trim(),
      settings: { ...settings }
    };
    
    // 프리셋 목록에 추가
    const updatedPresets = [...presets, newPresetName.trim()];
    setPresets(updatedPresets);
    onChange('presets', updatedPresets);
    
    // 프리셋 설정 저장
    onChange(`preset_${newPresetName.trim()}`, newPreset);
    
    // 입력 필드 초기화
    setNewPresetName('');
  };
  
  // 프리셋 삭제
  const deletePreset = async (presetName: string) => {
    // 프리셋 목록에서 제거
    const updatedPresets = presets.filter(p => p !== presetName);
    setPresets(updatedPresets);
    onChange('presets', updatedPresets);
    
    // 프리셋 설정 삭제
    // @ts-ignore
    delete plugin.settings[`preset_${presetName}`];
    await plugin.saveSettings();
  };
  
  // 프리셋 적용
  const applyPreset = async (presetName: string) => {
    // @ts-ignore
    const presetSettings = plugin.settings[`preset_${presetName}`];
    if (presetSettings && presetSettings.settings) {
      // 프리셋 설정 적용
      Object.assign(plugin.settings, presetSettings.settings);
      await plugin.saveSettings();
    }
  };
  
  return (
    <>
      <SettingItem 
        label="우선 순위 태그" 
        description="쉼표로 구분된 태그 목록입니다. 이 태그들은 카드 정렬 시 우선적으로 표시됩니다."
      >
        <input
          type="text"
          value={(settings.priorityTags || []).join(', ')}
          onChange={(e) => onChange('priorityTags', e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag))}
          placeholder="태그1, 태그2, 태그3"
        />
      </SettingItem>
      
      <SettingItem 
        label="우선 순위 폴더" 
        description="쉼표로 구분된 폴더 경로 목록입니다. 이 폴더들은 카드 정렬 시 우선적으로 표시됩니다."
      >
        <input
          type="text"
          value={(settings.priorityFolders || []).join(', ')}
          onChange={(e) => onChange('priorityFolders', e.target.value.split(',').map(folder => folder.trim()).filter(folder => folder))}
          placeholder="/폴더1, /폴더2, /폴더3"
        />
      </SettingItem>
      
      <h4>프리셋 관리</h4>
      
      <SettingItem 
        label="새 프리셋 추가" 
        description="현재 설정을 프리셋으로 저장합니다."
      >
        <div className="card-navigator-preset-add">
          <input
            type="text"
            value={newPresetName}
            onChange={(e) => setNewPresetName(e.target.value)}
            placeholder="프리셋 이름"
          />
          <button 
            className="card-navigator-button"
            onClick={addPreset}
            disabled={!newPresetName.trim()}
          >
            추가
          </button>
        </div>
      </SettingItem>
      
      {presets.length > 0 && (
        <SettingItem 
          label="저장된 프리셋" 
          description="저장된 프리셋을 적용하거나 삭제합니다."
        >
          <div className="card-navigator-preset-list">
            {presets.map(preset => (
              <div key={preset} className="card-navigator-preset-item">
                <span className="card-navigator-preset-name">{preset}</span>
                <div className="card-navigator-preset-actions">
                  <button 
                    className="card-navigator-button"
                    onClick={() => applyPreset(preset)}
                  >
                    적용
                  </button>
                  <button 
                    className="card-navigator-button card-navigator-button-danger"
                    onClick={() => deletePreset(preset)}
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        </SettingItem>
      )}
    </>
  );
};

export default PresetSettings;