import React, { useState, useEffect } from 'react';
import { IPreset } from '../../domain/preset/Preset';
import { ICardNavigatorService } from '../../application/CardNavigatorService';

/**
 * 프리셋 선택기 컴포넌트 속성 인터페이스
 */
export interface IPresetSelectorProps {
  service: ICardNavigatorService | null;
  onPresetApply: (presetId: string) => void;
  onPresetSave: () => void;
  onPresetDelete: (presetId: string) => void;
}

/**
 * 프리셋 선택기 컴포넌트
 * 저장된 프리셋을 선택하고 관리하는 UI를 제공합니다.
 */
const PresetSelector: React.FC<IPresetSelectorProps> = ({
  service,
  onPresetApply,
  onPresetSave,
  onPresetDelete,
}) => {
  const [presets, setPresets] = useState<IPreset[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // 프리셋 목록 로드
  useEffect(() => {
    const loadPresets = async () => {
      if (service) {
        const presetService = service.getPresetService();
        const allPresets = await presetService.getAllPresets();
        setPresets(allPresets);
      }
    };

    loadPresets();
  }, [service]);

  // 프리셋 적용
  const handlePresetApply = (presetId: string) => {
    onPresetApply(presetId);
    setIsOpen(false);
  };

  // 프리셋 삭제
  const handlePresetDelete = (e: React.MouseEvent, presetId: string) => {
    e.stopPropagation();
    if (confirm('이 프리셋을 삭제하시겠습니까?')) {
      onPresetDelete(presetId);
      setPresets(presets.filter(preset => preset.id !== presetId));
    }
  };

  // 새 프리셋 생성
  const handleCreatePreset = async () => {
    if (!service || !newPresetName) return;
    
    const presetService = service.getPresetService();
    const newPreset = await presetService.saveCurrentAsPreset(newPresetName);
    
    if (newPreset) {
      setPresets([...presets, newPreset]);
      setNewPresetName('');
      setIsCreating(false);
    }
  };

  return (
    <div className="card-navigator-preset-selector">
      <button
        className="card-navigator-preset-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="프리셋"
        title="프리셋"
      >
        <svg viewBox="0 0 24 24" width="16" height="16">
          <path d="M19 5v2h-4V5h4M9 5v6H5V5h4m10 8v6h-4v-6h4M9 17v2H5v-2h4M21 3h-8v6h8V3zM11 3H3v10h8V3zm10 8h-8v10h8V11zm-10 4H3v6h8v-6z" />
        </svg>
        <span>프리셋</span>
      </button>

      {isOpen && (
        <div className="card-navigator-preset-dropdown">
          <div className="card-navigator-preset-header">
            <h3>프리셋</h3>
            <button
              className="card-navigator-preset-create-button"
              onClick={() => setIsCreating(true)}
              aria-label="새 프리셋 생성"
              title="새 프리셋 생성"
            >
              <svg viewBox="0 0 24 24" width="16" height="16">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
              </svg>
            </button>
          </div>

          {isCreating && (
            <div className="card-navigator-preset-create">
              <input
                type="text"
                placeholder="프리셋 이름"
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
                autoFocus
              />
              <div className="card-navigator-preset-create-actions">
                <button onClick={handleCreatePreset}>저장</button>
                <button onClick={() => {
                  setIsCreating(false);
                  setNewPresetName('');
                }}>취소</button>
              </div>
            </div>
          )}

          <div className="card-navigator-preset-list">
            {presets.length === 0 ? (
              <div className="card-navigator-preset-empty">
                저장된 프리셋이 없습니다.
              </div>
            ) : (
              presets.map((preset) => (
                <div
                  key={preset.id}
                  className="card-navigator-preset-item"
                  onClick={() => handlePresetApply(preset.id)}
                >
                  <span>{preset.name}</span>
                  <button
                    className="card-navigator-preset-delete"
                    onClick={(e) => handlePresetDelete(e, preset.id)}
                    aria-label="프리셋 삭제"
                    title="프리셋 삭제"
                  >
                    <svg viewBox="0 0 24 24" width="14" height="14">
                      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PresetSelector; 