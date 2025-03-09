import React, { useState, useEffect } from 'react';
import { ICardNavigatorService } from '../../application/CardNavigatorService';
import TabNavigation from './components/TabNavigation';
import CardSetSourceSettings from './tabs/CardSetSettings';
import CardSettings from './tabs/CardSettings';
import SortSettings from './tabs/SortSettings';
import LayoutSettings from './tabs/LayoutSettings';
import PresetSettings from './tabs/PresetSettings';
import CardNavigatorPlugin from '../../main';
import './SettingsModal.css';

/**
 * 설정 모달 컴포넌트 속성 인터페이스
 */
export interface ISettingsModalProps {
  isOpen?: boolean;
  onClose: () => void;
  plugin: CardNavigatorPlugin;
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
  plugin,
  onLayoutChange = () => {},
  currentLayout = 'grid',
  onPresetApply = () => {},
  onPresetSave = () => {},
  onPresetDelete = () => {},
}) => {
  // 활성 탭 상태
  const [activeTab, setActiveTab] = useState<'cardSetSource' | 'card' | 'sort' | 'layout' | 'preset'>('cardSetSource');

  // 설정 로드
  useEffect(() => {
    const loadSettings = async () => {
      if (plugin) {
        // currentLayout props를 settings에 반영
        plugin.settings.defaultLayout = currentLayout || plugin.settings.defaultLayout;
        await plugin.saveSettings();
      }
    };

    if (isOpen) {
      loadSettings();
    }
  }, [isOpen, plugin, currentLayout]);

  // 설정 저장
  const handleSave = async () => {
    if (plugin) {
      try {
        // 플러그인 설정 저장
        await plugin.saveSettings();
        
        // CardNavigatorService 업데이트
        const service = plugin.getCardNavigatorService();
        if (service) {
          // 전체 설정을 업데이트하여 모든 서비스에 변경 사항 알림
          await service.updateSettings(plugin.settings);
        }
        
        // 모달 닫기
        onClose();
      } catch (error) {
        console.error('설정 저장 실패:', error);
      }
    }
  };

  if (!isOpen) return null;

  // 탭 정의
  const tabs = [
    { id: 'cardSetSource', label: '카드 세트' },
    { id: 'card', label: '카드' },
    { id: 'sort', label: '정렬' },
    { id: 'layout', label: '레이아웃' },
    { id: 'preset', label: '프리셋' },
  ];

  // 현재 활성 탭에 따른 컨텐츠 렌더링
  const renderTabContent = () => {
    switch (activeTab) {
      case 'cardSetSource':
        return (
          <div className="card-navigator-setting-group">
            <h3>카드 세트 설정</h3>
            <p className="card-navigator-setting-description">
              카드 네비게이터의 카드 세트와 관련된 설정을 변경합니다.
            </p>
            <CardSetSourceSettings plugin={plugin} />
          </div>
        );
      case 'card':
        return (
          <div className="card-navigator-setting-group">
            <h3>카드 설정</h3>
            <p className="card-navigator-setting-description">
              카드의 표시 항목, 렌더링 방식, 스타일을 설정합니다.
            </p>
            <CardSettings plugin={plugin} />
          </div>
        );
      case 'sort':
        return (
          <div className="card-navigator-setting-group">
            <h3>정렬 설정</h3>
            <p className="card-navigator-setting-description">
              카드 목록의 정렬 방식을 설정합니다.
            </p>
            <SortSettings plugin={plugin} />
          </div>
        );
      case 'layout':
        return (
          <div className="card-navigator-setting-group">
            <h3>레이아웃 설정</h3>
            <p className="card-navigator-setting-description">
              카드 레이아웃과 관련된 설정을 변경합니다.
            </p>
            <LayoutSettings plugin={plugin} />
          </div>
        );
      case 'preset':
        return (
          <div className="card-navigator-setting-group">
            <h3>프리셋 설정</h3>
            <p className="card-navigator-setting-description">
              설정 프리셋을 관리하고 적용합니다.
            </p>
            <PresetSettings plugin={plugin} />
          </div>
        );
      default:
        return null;
    }
  };

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
          {renderTabContent()}
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