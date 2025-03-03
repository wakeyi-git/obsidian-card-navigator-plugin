import React, { useState, useEffect } from 'react';
import { ICardNavigatorService } from '../../application/CardNavigatorService';

/**
 * 설정 모달 컴포넌트 속성 인터페이스
 */
export interface ISettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: ICardNavigatorService | null;
}

/**
 * 설정 모달 컴포넌트
 * 카드 네비게이터의 설정을 변경할 수 있는 모달 UI를 제공합니다.
 */
const SettingsModal: React.FC<ISettingsModalProps> = ({
  isOpen,
  onClose,
  service,
}) => {
  const [cardWidth, setCardWidth] = useState(300);
  const [cardHeight, setCardHeight] = useState(200);
  const [priorityTags, setPriorityTags] = useState<string[]>([]);
  const [priorityFolders, setPriorityFolders] = useState<string[]>([]);
  const [defaultMode, setDefaultMode] = useState<'folder' | 'tag'>('folder');
  const [defaultLayout, setDefaultLayout] = useState<'grid' | 'masonry'>('grid');

  // 설정 로드
  useEffect(() => {
    const loadSettings = async () => {
      if (service) {
        const settings = await service.getSettings();
        if (settings) {
          setCardWidth(settings.cardWidth);
          setCardHeight(settings.cardHeight);
          setPriorityTags(settings.priorityTags || []);
          setPriorityFolders(settings.priorityFolders || []);
          setDefaultMode(settings.defaultMode);
          setDefaultLayout(settings.defaultLayout);
        }
      }
    };

    if (isOpen) {
      loadSettings();
    }
  }, [isOpen, service]);

  // 설정 저장
  const handleSave = async () => {
    if (service) {
      await service.updateSettings({
        cardWidth,
        cardHeight,
        priorityTags,
        priorityFolders,
        defaultMode,
        defaultLayout,
      });
      onClose();
    }
  };

  if (!isOpen) return null;

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
            <svg viewBox="0 0 24 24" width="24" height="24">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </div>

        <div className="card-navigator-modal-content">
          <div className="card-navigator-setting-group">
            <h3>기본 설정</h3>
            
            <div className="card-navigator-setting-item">
              <label htmlFor="defaultMode">기본 모드</label>
              <select
                id="defaultMode"
                value={defaultMode}
                onChange={(e) => setDefaultMode(e.target.value as 'folder' | 'tag')}
              >
                <option value="folder">폴더 모드</option>
                <option value="tag">태그 모드</option>
              </select>
            </div>

            <div className="card-navigator-setting-item">
              <label htmlFor="defaultLayout">기본 레이아웃</label>
              <select
                id="defaultLayout"
                value={defaultLayout}
                onChange={(e) => setDefaultLayout(e.target.value as 'grid' | 'masonry')}
              >
                <option value="grid">그리드 레이아웃</option>
                <option value="masonry">메이슨리 레이아웃</option>
              </select>
            </div>
          </div>

          <div className="card-navigator-setting-group">
            <h3>카드 크기</h3>
            
            <div className="card-navigator-setting-item">
              <label htmlFor="cardWidth">카드 너비</label>
              <div className="card-navigator-slider-container">
                <input
                  type="range"
                  id="cardWidth"
                  min="200"
                  max="500"
                  step="10"
                  value={cardWidth}
                  onChange={(e) => setCardWidth(Number(e.target.value))}
                />
                <span>{cardWidth}px</span>
              </div>
            </div>

            <div className="card-navigator-setting-item">
              <label htmlFor="cardHeight">카드 높이</label>
              <div className="card-navigator-slider-container">
                <input
                  type="range"
                  id="cardHeight"
                  min="150"
                  max="400"
                  step="10"
                  value={cardHeight}
                  onChange={(e) => setCardHeight(Number(e.target.value))}
                />
                <span>{cardHeight}px</span>
              </div>
            </div>
          </div>

          <div className="card-navigator-setting-group">
            <h3>우선 순위</h3>
            
            <div className="card-navigator-setting-item">
              <label htmlFor="priorityTags">우선 태그</label>
              <input
                type="text"
                id="priorityTags"
                placeholder="쉼표로 구분 (예: tag1, tag2)"
                value={priorityTags.join(', ')}
                onChange={(e) => {
                  const tags = e.target.value
                    .split(',')
                    .map((tag) => tag.trim())
                    .filter((tag) => tag.length > 0);
                  setPriorityTags(tags);
                }}
              />
            </div>

            <div className="card-navigator-setting-item">
              <label htmlFor="priorityFolders">우선 폴더</label>
              <input
                type="text"
                id="priorityFolders"
                placeholder="쉼표로 구분 (예: folder1, folder2)"
                value={priorityFolders.join(', ')}
                onChange={(e) => {
                  const folders = e.target.value
                    .split(',')
                    .map((folder) => folder.trim())
                    .filter((folder) => folder.length > 0);
                  setPriorityFolders(folders);
                }}
              />
            </div>
          </div>
        </div>

        <div className="card-navigator-modal-footer">
          <button
            className="card-navigator-modal-cancel"
            onClick={onClose}
          >
            취소
          </button>
          <button
            className="card-navigator-modal-save"
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