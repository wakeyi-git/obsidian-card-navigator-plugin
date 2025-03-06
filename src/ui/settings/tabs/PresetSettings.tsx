import React, { useState, useEffect } from 'react';
import { ISettingsTabProps } from '../types/SettingsTypes';
import SettingItem from '../components/SettingItem';
import { IPreset } from '../types/SettingsTypes';

/**
 * 프리셋 설정 탭 컴포넌트
 */
const PresetSettings: React.FC<ISettingsTabProps> = ({ settings, onChange, service }) => {
  const [activeSubTab, setActiveSubTab] = useState<'list' | 'create' | 'mapping' | 'priority'>('list');
  const [presets, setPresets] = useState<IPreset[]>([]);
  const [newPresetName, setNewPresetName] = useState('');
  const [newPresetDescription, setNewPresetDescription] = useState('');
  const [folderPresetMappings, setFolderPresetMappings] = useState<{folder: string, presetId: string}[]>(
    settings.folderPresetMappings || []
  );
  const [tagPresetMappings, setTagPresetMappings] = useState<{tag: string, presetId: string}[]>(
    settings.tagPresetMappings || []
  );
  const [presetPriorities, setPresetPriorities] = useState<{id: string, type: 'folder' | 'tag', target: string}[]>(
    settings.presetPriorities || []
  );
  const [folders, setFolders] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [newFolder, setNewFolder] = useState('');
  const [newTag, setNewTag] = useState('');
  const [selectedPresetId, setSelectedPresetId] = useState('');
  
  // 프리셋 목록 로드
  useEffect(() => {
    const loadPresets = async () => {
      if (service) {
        const presetService = service.getPresetService();
        const presetList = await presetService.getAllPresets();
        setPresets(presetList);
      }
    };
    
    const loadFoldersAndTags = async () => {
      if (service) {
        const modeService = service.getModeService();
        const folderList = await modeService.getFolders();
        const tagList = await modeService.getTags();
        setFolders(folderList);
        setTags(tagList);
      }
    };
    
    loadPresets();
    loadFoldersAndTags();
  }, [service]);
  
  // 프리셋 적용
  const handlePresetApply = (presetId: string) => {
    if (settings.onPresetApply) {
      settings.onPresetApply(presetId);
    }
  };
  
  // 프리셋 저장
  const handlePresetSave = () => {
    if (newPresetName.trim() && settings.onPresetSave) {
      settings.onPresetSave();
      setNewPresetName('');
      setNewPresetDescription('');
    }
  };
  
  // 프리셋 삭제
  const handlePresetDelete = (presetId: string) => {
    if (settings.onPresetDelete) {
      settings.onPresetDelete(presetId);
    }
  };
  
  // 폴더-프리셋 매핑 추가
  const handleAddFolderMapping = () => {
    if (newFolder && selectedPresetId) {
      const newMapping = { folder: newFolder, presetId: selectedPresetId };
      const updatedMappings = [...folderPresetMappings, newMapping];
      setFolderPresetMappings(updatedMappings);
      onChange('folderPresetMappings', updatedMappings);
      setNewFolder('');
    }
  };
  
  // 태그-프리셋 매핑 추가
  const handleAddTagMapping = () => {
    if (newTag && selectedPresetId) {
      const newMapping = { tag: newTag, presetId: selectedPresetId };
      const updatedMappings = [...tagPresetMappings, newMapping];
      setTagPresetMappings(updatedMappings);
      onChange('tagPresetMappings', updatedMappings);
      setNewTag('');
    }
  };
  
  // 매핑 삭제
  const handleRemoveFolderMapping = (index: number) => {
    const updatedMappings = [...folderPresetMappings];
    updatedMappings.splice(index, 1);
    setFolderPresetMappings(updatedMappings);
    onChange('folderPresetMappings', updatedMappings);
  };
  
  const handleRemoveTagMapping = (index: number) => {
    const updatedMappings = [...tagPresetMappings];
    updatedMappings.splice(index, 1);
    setTagPresetMappings(updatedMappings);
    onChange('tagPresetMappings', updatedMappings);
  };
  
  // 우선순위 이동
  const movePriority = (index: number, direction: 'up' | 'down') => {
    const newPriorities = [...presetPriorities];
    if (direction === 'up' && index > 0) {
      [newPriorities[index], newPriorities[index - 1]] = [newPriorities[index - 1], newPriorities[index]];
    } else if (direction === 'down' && index < newPriorities.length - 1) {
      [newPriorities[index], newPriorities[index + 1]] = [newPriorities[index + 1], newPriorities[index]];
    }
    setPresetPriorities(newPriorities);
    onChange('presetPriorities', newPriorities);
  };
  
  // 우선순위 추가
  const addToPriority = (type: 'folder' | 'tag', id: string, target: string) => {
    const newPriority = { id, type, target };
    const updatedPriorities = [...presetPriorities, newPriority];
    setPresetPriorities(updatedPriorities);
    onChange('presetPriorities', updatedPriorities);
  };
  
  // 우선순위 제거
  const removeFromPriority = (index: number) => {
    const updatedPriorities = [...presetPriorities];
    updatedPriorities.splice(index, 1);
    setPresetPriorities(updatedPriorities);
    onChange('presetPriorities', updatedPriorities);
  };
  
  return (
    <div className="card-navigator-setting-group">
      <div className="card-navigator-subtabs">
        <button 
          className={`card-navigator-subtab ${activeSubTab === 'list' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('list')}
        >
          프리셋 목록
        </button>
        <button 
          className={`card-navigator-subtab ${activeSubTab === 'create' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('create')}
        >
          프리셋 생성
        </button>
        <button 
          className={`card-navigator-subtab ${activeSubTab === 'mapping' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('mapping')}
        >
          프리셋 매핑
        </button>
        <button 
          className={`card-navigator-subtab ${activeSubTab === 'priority' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('priority')}
        >
          적용 우선순위
        </button>
      </div>
      
      {/* 프리셋 목록 */}
      {activeSubTab === 'list' && (
        <>
          <h3>프리셋 목록</h3>
          
          <div className="card-navigator-presets-list">
            {presets.length > 0 ? (
              presets.map(preset => (
                <div key={preset.id} className="card-navigator-preset-item">
                  <div className="card-navigator-preset-info">
                    <div className="card-navigator-preset-name">{preset.name}</div>
                    {preset.description && (
                      <div className="card-navigator-preset-description">{preset.description}</div>
                    )}
                  </div>
                  <div className="card-navigator-preset-actions">
                    <button
                      className="card-navigator-preset-button apply"
                      onClick={() => handlePresetApply(preset.id)}
                    >
                      적용
                    </button>
                    <button
                      className="card-navigator-preset-button delete"
                      onClick={() => handlePresetDelete(preset.id)}
                    >
                      삭제
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="card-navigator-preset-empty">
                저장된 프리셋이 없습니다.
              </div>
            )}
          </div>
        </>
      )}
      
      {/* 프리셋 생성 */}
      {activeSubTab === 'create' && (
        <>
          <h3>프리셋 생성</h3>
          
          <SettingItem label="프리셋 이름">
            <input
              type="text"
              value={newPresetName}
              onChange={(e) => setNewPresetName(e.target.value)}
              placeholder="새 프리셋 이름"
            />
          </SettingItem>
          
          <SettingItem label="프리셋 설명">
            <textarea
              value={newPresetDescription}
              onChange={(e) => setNewPresetDescription(e.target.value)}
              placeholder="프리셋에 대한 설명 (선택사항)"
              rows={3}
            />
          </SettingItem>
          
          <div className="card-navigator-setting-actions">
            <button
              className="card-navigator-button primary"
              onClick={handlePresetSave}
              disabled={!newPresetName.trim()}
            >
              현재 설정으로 프리셋 저장
            </button>
          </div>
        </>
      )}
      
      {/* 프리셋 매핑 */}
      {activeSubTab === 'mapping' && (
        <>
          <h3>프리셋 매핑</h3>
          
          <div className="card-navigator-setting-section">
            <h4>폴더 프리셋 매핑</h4>
            
            <div className="card-navigator-mapping-form">
              <div className="card-navigator-mapping-inputs">
                <select
                  value={newFolder}
                  onChange={(e) => setNewFolder(e.target.value)}
                >
                  <option value="">폴더 선택...</option>
                  {folders.map(folder => (
                    <option key={folder} value={folder}>{folder}</option>
                  ))}
                </select>
                <select
                  value={selectedPresetId}
                  onChange={(e) => setSelectedPresetId(e.target.value)}
                >
                  <option value="">프리셋 선택...</option>
                  {presets.map(preset => (
                    <option key={preset.id} value={preset.id}>{preset.name}</option>
                  ))}
                </select>
                <button
                  className="card-navigator-button secondary"
                  onClick={handleAddFolderMapping}
                  disabled={!newFolder || !selectedPresetId}
                >
                  추가
                </button>
              </div>
            </div>
            
            <div className="card-navigator-mappings-list">
              {folderPresetMappings.length > 0 ? (
                folderPresetMappings.map((mapping, index) => (
                  <div key={index} className="card-navigator-mapping-item">
                    <div className="card-navigator-mapping-info">
                      <span className="card-navigator-mapping-target">{mapping.folder}</span>
                      <span className="card-navigator-mapping-arrow">→</span>
                      <span className="card-navigator-mapping-preset">
                        {presets.find(p => p.id === mapping.presetId)?.name || '알 수 없는 프리셋'}
                      </span>
                    </div>
                    <button
                      className="card-navigator-mapping-remove"
                      onClick={() => handleRemoveFolderMapping(index)}
                    >
                      ×
                    </button>
                  </div>
                ))
              ) : (
                <div className="card-navigator-mapping-empty">
                  폴더-프리셋 매핑이 없습니다.
                </div>
              )}
            </div>
          </div>
          
          <div className="card-navigator-setting-section">
            <h4>태그 프리셋 매핑</h4>
            
            <div className="card-navigator-mapping-form">
              <div className="card-navigator-mapping-inputs">
                <select
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                >
                  <option value="">태그 선택...</option>
                  {tags.map(tag => (
                    <option key={tag} value={tag}>{tag}</option>
                  ))}
                </select>
                <select
                  value={selectedPresetId}
                  onChange={(e) => setSelectedPresetId(e.target.value)}
                >
                  <option value="">프리셋 선택...</option>
                  {presets.map(preset => (
                    <option key={preset.id} value={preset.id}>{preset.name}</option>
                  ))}
                </select>
                <button
                  className="card-navigator-button secondary"
                  onClick={handleAddTagMapping}
                  disabled={!newTag || !selectedPresetId}
                >
                  추가
                </button>
              </div>
            </div>
            
            <div className="card-navigator-mappings-list">
              {tagPresetMappings.length > 0 ? (
                tagPresetMappings.map((mapping, index) => (
                  <div key={index} className="card-navigator-mapping-item">
                    <div className="card-navigator-mapping-info">
                      <span className="card-navigator-mapping-target">{mapping.tag}</span>
                      <span className="card-navigator-mapping-arrow">→</span>
                      <span className="card-navigator-mapping-preset">
                        {presets.find(p => p.id === mapping.presetId)?.name || '알 수 없는 프리셋'}
                      </span>
                    </div>
                    <button
                      className="card-navigator-mapping-remove"
                      onClick={() => handleRemoveTagMapping(index)}
                    >
                      ×
                    </button>
                  </div>
                ))
              ) : (
                <div className="card-navigator-mapping-empty">
                  태그-프리셋 매핑이 없습니다.
                </div>
              )}
            </div>
          </div>
        </>
      )}
      
      {/* 적용 우선순위 */}
      {activeSubTab === 'priority' && (
        <>
          <h3>적용 우선순위 설정</h3>
          
          <p className="card-navigator-setting-description">
            목록의 위에 있는 항목이 우선적으로 적용됩니다. 위아래 버튼으로 순서를 변경할 수 있습니다.
          </p>
          
          <div className="card-navigator-priorities-list">
            {presetPriorities.length > 0 ? (
              presetPriorities.map((priority, index) => (
                <div key={index} className="card-navigator-priority-item">
                  <div className="card-navigator-priority-info">
                    <span className="card-navigator-priority-type">
                      {priority.type === 'folder' ? '폴더' : '태그'}:
                    </span>
                    <span className="card-navigator-priority-target">{priority.target}</span>
                    <span className="card-navigator-priority-preset">
                      ({presets.find(p => p.id === priority.id)?.name || '알 수 없는 프리셋'})
                    </span>
                  </div>
                  <div className="card-navigator-priority-actions">
                    <button
                      className="card-navigator-priority-button"
                      onClick={() => movePriority(index, 'up')}
                      disabled={index === 0}
                    >
                      ↑
                    </button>
                    <button
                      className="card-navigator-priority-button"
                      onClick={() => movePriority(index, 'down')}
                      disabled={index === presetPriorities.length - 1}
                    >
                      ↓
                    </button>
                    <button
                      className="card-navigator-priority-button remove"
                      onClick={() => removeFromPriority(index)}
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="card-navigator-priority-empty">
                설정된 우선순위가 없습니다.
              </div>
            )}
          </div>
          
          <div className="card-navigator-setting-section">
            <h4>폴더 매핑 추가</h4>
            <div className="card-navigator-mapping-list">
              {folderPresetMappings.map((mapping, index) => {
                // 이미 우선순위에 있는지 확인
                const isAlreadyInPriority = presetPriorities.some(
                  p => p.type === 'folder' && p.target === mapping.folder && p.id === mapping.presetId
                );
                
                if (isAlreadyInPriority) return null;
                
                return (
                  <div key={`folder-${index}`} className="card-navigator-mapping-item">
                    <div className="card-navigator-mapping-info">
                      <span className="card-navigator-mapping-type">폴더:</span>
                      <span className="card-navigator-mapping-target">{mapping.folder}</span>
                      <span className="card-navigator-mapping-preset">
                        ({presets.find(p => p.id === mapping.presetId)?.name || '알 수 없는 프리셋'})
                      </span>
                    </div>
                    <button
                      className="card-navigator-button small"
                      onClick={() => addToPriority('folder', mapping.presetId, mapping.folder)}
                    >
                      우선순위에 추가
                    </button>
                    </div>
                );
              })}
            </div>
          </div>
          
          <div className="card-navigator-setting-section">
            <h4>태그 매핑 추가</h4>
            <div className="card-navigator-mapping-list">
              {tagPresetMappings.map((mapping, index) => {
                // 이미 우선순위에 있는지 확인
                const isAlreadyInPriority = presetPriorities.some(
                  p => p.type === 'tag' && p.target === mapping.tag && p.id === mapping.presetId
                );
                
                if (isAlreadyInPriority) return null;
                
                return (
                  <div key={`tag-${index}`} className="card-navigator-mapping-item">
                    <div className="card-navigator-mapping-info">
                      <span className="card-navigator-mapping-type">태그:</span>
                      <span className="card-navigator-mapping-target">{mapping.tag}</span>
                      <span className="card-navigator-mapping-preset">
                        ({presets.find(p => p.id === mapping.presetId)?.name || '알 수 없는 프리셋'})
                      </span>
                    </div>
                    <button
                      className="card-navigator-button small"
                      onClick={() => addToPriority('tag', mapping.presetId, mapping.tag)}
                    >
                      우선순위에 추가
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PresetSettings;