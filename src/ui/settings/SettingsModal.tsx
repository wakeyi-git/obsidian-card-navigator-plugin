import React, { useState, useEffect } from 'react';
import { ICardNavigatorService } from '../../application/CardNavigatorService';
import { ICardNavigatorSettings } from './types/SettingsTypes';
import TabNavigation from './components/TabNavigation';
import GeneralSettings from './tabs/GeneralSettings';
import CardSettings from './tabs/CardSettings';
import SearchSettings from './tabs/SearchSettings';
import SortSettings from './tabs/SortSettings';
import LayoutSettings from './tabs/LayoutSettings';
import PresetSettings from './tabs/PresetSettings';
import './SettingsModal.css';

/**
 * 설정 모달 컴포넌트 속성 인터페이스
 */
export interface ISettingsModalProps {
  isOpen?: boolean;
  onClose: () => void;
  service: ICardNavigatorService | null;
  onLayoutChange?: (layout: 'grid' | 'masonry') => void;
  currentLayout?: 'grid' | 'masonry';
  onPresetApply?: (presetId: string) => void;
  onPresetSave?: () => void;
  onPresetDelete?: (presetId: string) => void;
}

/**
 * 설정 모달 컴포넌트
 * 카드 네비게이터의 설정을 변경할 수 있는 모달 UI를 제공합니다.
 */
const SettingsModal: React.FC<ISettingsModalProps> = ({
  isOpen = true,
  onClose,
  service,
  onLayoutChange = () => {},
  currentLayout = 'grid',
  onPresetApply = () => {},
  onPresetSave = () => {},
  onPresetDelete = () => {},
}) => {
  // 설정 상태
  const [settings, setSettings] = useState<Partial<ICardNavigatorSettings>>({});
  
  // 활성 탭 상태
  const [activeTab, setActiveTab] = useState<'general' | 'card' | 'search' | 'sort' | 'layout' | 'presets'>('general');

  // 설정 로드
  useEffect(() => {
    const loadSettings = async () => {
      if (service) {
        const loadedSettings = await service.getSettings();
        if (loadedSettings) {
          // currentLayout props를 settings에 반영
          setSettings({
            ...loadedSettings,
            defaultLayout: currentLayout || loadedSettings.defaultLayout
          });
        }
      }
    };

    if (isOpen) {
      loadSettings();
    }
  }, [isOpen, service, currentLayout]);

  // 설정 변경 핸들러
  const handleSettingChange = (key: keyof ICardNavigatorSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // 설정 저장
  const handleSave = async () => {
    if (service) {
      try {
        await service.updateSettings(settings);
        onClose();
      } catch (error) {
        console.error('설정 저장 실패:', error);
      }
    }
  };

  if (!isOpen) return null;

  // 탭 정의
  const tabs = [
    { id: 'general', label: '일반 설정' },
    { id: 'card', label: '카드' },
    { id: 'search', label: '검색' },
    { id: 'sort', label: '정렬' },
    { id: 'layout', label: '레이아웃' },
    { id: 'presets', label: '프리셋' },
  ];

  return (
    <div className="card-navigator-modal-overlay">
      <div className="card-navigator-modal">
        <div className="card-navigator-modal-header">
          <h2>카드 네비게이터 설정</h2>
          <button
            className="card-navigator-modal-close"
            onClick={onClose}
            aria-label="닫기"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="card-navigator-x-icon">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <TabNavigation 
          tabs={tabs} 
          activeTab={activeTab} 
          onTabChange={(tabId) => setActiveTab(tabId as any)} 
        />

        <div className="card-navigator-modal-content">
          {activeTab === 'general' && (
            <GeneralSettings 
              settings={settings} 
              onChange={handleSettingChange} 
              service={service} 
            />
          )}
          
          {activeTab === 'card' && (
            <CardSettings 
              settings={settings} 
              onChange={handleSettingChange} 
              service={service} 
            />
          )}
          
          {activeTab === 'search' && (
            <SearchSettings 
              settings={settings} 
              onChange={handleSettingChange} 
              service={service} 
            />
          )}
          
          {activeTab === 'sort' && (
            <SortSettings 
              settings={settings} 
              onChange={handleSettingChange} 
              service={service} 
            />
          )}
          
          {activeTab === 'layout' && (
            <LayoutSettings 
              settings={{
                ...settings,
                onLayoutChange
              }} 
              onChange={handleSettingChange} 
              service={service} 
            />
          )}
          
          {activeTab === 'presets' && (
            <PresetSettings 
              settings={{
                ...settings,
                onPresetApply,
                onPresetSave,
                onPresetDelete
              }} 
              onChange={handleSettingChange} 
              service={service} 
            />
          )}
        </div>

        <div className="card-navigator-modal-footer">
          <button
            className="card-navigator-button secondary"
            onClick={onClose}
          >
            취소
          </button>
          <button
            className="card-navigator-button primary"
            onClick={handleSave}
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;