import React from 'react';
import CardNavigatorPlugin from '../../../main';
import SettingItem from '../components/SettingItem';
import ToggleSwitch from '../components/ToggleSwitch';

/**
 * 레이아웃 설정 탭 컴포넌트
 */
const LayoutSettings: React.FC<{ plugin: CardNavigatorPlugin }> = ({ plugin }) => {
  const settings = plugin.settings;
  
  // 설정 변경 핸들러
  const onChange = async (key: string, value: any) => {
    // @ts-ignore
    plugin.settings[key] = value;
    await plugin.saveSettings();
  };
  
  return (
    <>
      <SettingItem 
        label="기본 레이아웃" 
        description="카드 네비게이터를 열 때 사용할 기본 레이아웃을 선택합니다."
      >
        <select
          value={settings.defaultLayout || 'grid'}
          onChange={(e) => onChange('defaultLayout', e.target.value)}
        >
          <option value="grid">그리드 레이아웃</option>
          <option value="masonry">메이슨리 레이아웃</option>
        </select>
      </SettingItem>
      
      <SettingItem 
        label="카드 너비" 
        description="카드의 기본 너비를 설정합니다. (픽셀)"
      >
        <div className="card-navigator-slider-container">
          <input
            type="range"
            min="200"
            max="500"
            step="10"
            value={settings.cardWidth || 300}
            onChange={(e) => onChange('cardWidth', parseInt(e.target.value))}
          />
          <span className="card-navigator-slider-value">{settings.cardWidth || 300}px</span>
        </div>
      </SettingItem>
      
      <SettingItem 
        label="카드 높이" 
        description="카드의 기본 높이를 설정합니다. (픽셀)"
      >
        <div className="card-navigator-slider-container">
          <input
            type="range"
            min="150"
            max="400"
            step="10"
            value={settings.cardHeight || 200}
            onChange={(e) => onChange('cardHeight', parseInt(e.target.value))}
          />
          <span className="card-navigator-slider-value">{settings.cardHeight || 200}px</span>
        </div>
      </SettingItem>
      
      <SettingItem 
        label="고정 카드 높이" 
        description="카드 높이를 고정할지 여부를 설정합니다. (메이슨리 레이아웃에서는 무시됩니다)"
      >
        <ToggleSwitch
          id="fixedCardHeight"
          checked={settings.fixedCardHeight || false}
          onChange={(checked) => onChange('fixedCardHeight', checked)}
        />
      </SettingItem>
      
      <SettingItem 
        label="카드 간격" 
        description="카드 사이의 간격을 설정합니다. (픽셀)"
      >
        <div className="card-navigator-slider-container">
          <input
            type="range"
            min="5"
            max="30"
            step="1"
            value={settings.cardGap || 10}
            onChange={(e) => onChange('cardGap', parseInt(e.target.value))}
          />
          <span className="card-navigator-slider-value">{settings.cardGap || 10}px</span>
        </div>
      </SettingItem>
      
      <SettingItem 
        label="그리드 열 수" 
        description="그리드 레이아웃에서 표시할 열의 수를 설정합니다. (자동은 화면 크기에 맞게 조정됩니다)"
      >
        <select
          value={settings.gridColumns || 'auto'}
          onChange={(e) => onChange('gridColumns', e.target.value)}
        >
          <option value="auto">자동</option>
          <option value="1">1열</option>
          <option value="2">2열</option>
          <option value="3">3열</option>
          <option value="4">4열</option>
          <option value="5">5열</option>
        </select>
      </SettingItem>
    </>
  );
};

export default LayoutSettings;