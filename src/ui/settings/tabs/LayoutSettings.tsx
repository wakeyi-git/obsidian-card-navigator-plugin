import React from 'react';
import { ISettingsTabProps } from '../types/SettingsTypes';
import SettingItem from '../components/SettingItem';
import ToggleSwitch from '../components/ToggleSwitch';

/**
 * 레이아웃 설정 탭 컴포넌트
 */
const LayoutSettings: React.FC<ISettingsTabProps> = ({ settings, onChange }) => {
  const { 
    fixedCardHeight = true, 
    cardMinWidth = 250, 
    cardMinHeight = 150 
  } = settings;
  
  const handleLayoutChange = (checked: boolean) => {
    onChange('fixedCardHeight', checked);
    if (settings.onLayoutChange) {
      settings.onLayoutChange(checked ? 'grid' : 'masonry');
    }
  };
  
  return (
    <div className="card-navigator-setting-group">
      <h3>레이아웃 설정</h3>
      
      <SettingItem 
        label="카드 높이 일치" 
        description="활성화하면 그리드 레이아웃, 비활성화하면 메이슨리 레이아웃이 적용됩니다."
      >
        <ToggleSwitch
          id="fixedCardHeight"
          checked={fixedCardHeight}
          onChange={handleLayoutChange}
        />
      </SettingItem>
      
      <SettingItem label="카드 최소 너비 (px)">
        <div className="card-navigator-range-container">
          <input
            type="range"
            min="150"
            max="500"
            step="10"
            value={cardMinWidth}
            onChange={(e) => onChange('cardMinWidth', Number(e.target.value))}
          />
          <span className="card-navigator-range-value">{cardMinWidth}px</span>
        </div>
      </SettingItem>
      
      <SettingItem label="카드 최소 높이 (px)">
        <div className="card-navigator-range-container">
          <input
            type="range"
            min="100"
            max="400"
            step="10"
            value={cardMinHeight}
            onChange={(e) => onChange('cardMinHeight', Number(e.target.value))}
          />
          <span className="card-navigator-range-value">{cardMinHeight}px</span>
        </div>
      </SettingItem>
      
      <div className="card-navigator-layout-preview-container">
        <h4>레이아웃 미리보기</h4>
        <div className={`card-navigator-layout-preview ${fixedCardHeight ? 'grid' : 'masonry'}`}>
          <div className="preview-card" style={{width: `${cardMinWidth / 2}px`, height: fixedCardHeight ? `${cardMinHeight / 2}px` : 'auto'}}></div>
          <div className="preview-card" style={{width: `${cardMinWidth / 2}px`, height: fixedCardHeight ? `${cardMinHeight / 2}px` : `${cardMinHeight / 3}px`}}></div>
          <div className="preview-card" style={{width: `${cardMinWidth / 2}px`, height: fixedCardHeight ? `${cardMinHeight / 2}px` : `${cardMinHeight / 1.5}px`}}></div>
          <div className="preview-card" style={{width: `${cardMinWidth / 2}px`, height: fixedCardHeight ? `${cardMinHeight / 2}px` : `${cardMinHeight / 2.5}px`}}></div>
        </div>
      </div>
    </div>
  );
};

export default LayoutSettings;