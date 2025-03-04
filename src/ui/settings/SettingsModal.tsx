import React, { useState, useEffect } from 'react';
import { ICardNavigatorService } from '../../application/CardNavigatorService';
import { ModeType } from '../../domain/mode/Mode';

/**
 * 설정 모달 컴포넌트 속성 인터페이스
 */
export interface ISettingsModalProps {
  isOpen?: boolean;
  onClose: () => void;
  service: ICardNavigatorService | null;
}

/**
 * 설정 모달 컴포넌트
 * 카드 네비게이터의 설정을 변경할 수 있는 모달 UI를 제공합니다.
 */
const SettingsModal: React.FC<ISettingsModalProps> = ({
  isOpen = true,
  onClose,
  service,
}) => {
  const [cardWidth, setCardWidth] = useState(300);
  const [cardHeight, setCardHeight] = useState(200);
  const [priorityTags, setPriorityTags] = useState<string[]>([]);
  const [priorityFolders, setPriorityFolders] = useState<string[]>([]);
  const [defaultMode, setDefaultMode] = useState<ModeType>('folder');
  const [defaultLayout, setDefaultLayout] = useState<'grid' | 'masonry'>('grid');
  const [includeSubfolders, setIncludeSubfolders] = useState<boolean>(true);
  const [defaultCardSet, setDefaultCardSet] = useState<string>('/');
  const [isCardSetFixed, setIsCardSetFixed] = useState<boolean>(false);
  const [cardSets, setCardSets] = useState<string[]>([]);

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
          setIncludeSubfolders(settings.includeSubfolders !== undefined ? settings.includeSubfolders : true);
          setDefaultCardSet(settings.defaultCardSet || '/');
          setIsCardSetFixed(settings.isCardSetFixed || false);
        }
        
        // 카드 세트 목록 로드
        const modeService = service.getModeService();
        const sets = await modeService.getCardSets();
        setCardSets(sets);
      }
    };

    if (isOpen) {
      loadSettings();
    }
  }, [isOpen, service]);

  // 설정 저장
  const handleSave = async () => {
    if (service) {
      try {
        const settings = {
          cardWidth,
          cardHeight,
          priorityTags,
          priorityFolders,
          defaultMode,
          defaultLayout,
          includeSubfolders,
          defaultCardSet,
          isCardSetFixed,
        };
        
        await service.updateSettings(settings);
        onClose();
      } catch (error) {
        console.error('설정 저장 실패:', error);
      }
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
                onChange={(e) => setDefaultMode(e.target.value as ModeType)}
              >
                <option value="folder">폴더 모드</option>
                <option value="tag">태그 모드</option>
                <option value="search">검색 모드</option>
              </select>
            </div>

            <div className="card-navigator-setting-item">
              <label htmlFor="defaultLayout">기본 레이아웃</label>
              <select
                id="defaultLayout"
                value={defaultLayout}
                onChange={(e) => setDefaultLayout(e.target.value as 'grid' | 'masonry')}
              >
                <option value="grid">그리드</option>
                <option value="masonry">메이슨리</option>
              </select>
            </div>
            
            <div className="card-navigator-setting-item">
              <label htmlFor="includeSubfolders">하위 폴더 포함</label>
              <div className="card-navigator-toggle">
                <input
                  type="checkbox"
                  id="includeSubfolders"
                  checked={includeSubfolders}
                  onChange={(e) => setIncludeSubfolders(e.target.checked)}
                />
                <span className="card-navigator-toggle-slider"></span>
              </div>
            </div>
            
            <div className="card-navigator-setting-item">
              <label htmlFor="defaultCardSet">기본 카드 세트</label>
              <select
                id="defaultCardSet"
                value={defaultCardSet}
                onChange={(e) => setDefaultCardSet(e.target.value)}
              >
                {cardSets.map((set) => (
                  <option key={set} value={set}>
                    {set}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="card-navigator-setting-item">
              <label htmlFor="isCardSetFixed">카드 세트 고정</label>
              <div className="card-navigator-toggle">
                <input
                  type="checkbox"
                  id="isCardSetFixed"
                  checked={isCardSetFixed}
                  onChange={(e) => setIsCardSetFixed(e.target.checked)}
                />
                <span className="card-navigator-toggle-slider"></span>
              </div>
            </div>
          </div>

          <div className="card-navigator-setting-group">
            <h3>카드 설정</h3>
            
            <div className="card-navigator-setting-item">
              <label htmlFor="cardWidth">카드 너비 (px)</label>
              <input
                type="number"
                id="cardWidth"
                value={cardWidth}
                onChange={(e) => setCardWidth(Number(e.target.value))}
                min="100"
                max="800"
              />
            </div>
            
            <div className="card-navigator-setting-item">
              <label htmlFor="cardHeight">카드 높이 (px)</label>
              <input
                type="number"
                id="cardHeight"
                value={cardHeight}
                onChange={(e) => setCardHeight(Number(e.target.value))}
                min="100"
                max="800"
              />
            </div>
          </div>

          <div className="card-navigator-setting-group">
            <h3>우선 순위 설정</h3>
            
            <div className="card-navigator-setting-item">
              <label htmlFor="priorityTags">우선 순위 태그</label>
              <input
                type="text"
                id="priorityTags"
                value={priorityTags.join(', ')}
                onChange={(e) => setPriorityTags(e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag))}
                placeholder="태그1, 태그2, 태그3"
              />
              <p className="card-navigator-setting-description">
                쉼표로 구분된 태그 목록입니다. 이 태그들은 카드 정렬 시 우선적으로 표시됩니다.
              </p>
            </div>
            
            <div className="card-navigator-setting-item">
              <label htmlFor="priorityFolders">우선 순위 폴더</label>
              <input
                type="text"
                id="priorityFolders"
                value={priorityFolders.join(', ')}
                onChange={(e) => setPriorityFolders(e.target.value.split(',').map(folder => folder.trim()).filter(folder => folder))}
                placeholder="/폴더1, /폴더2, /폴더3"
              />
              <p className="card-navigator-setting-description">
                쉼표로 구분된 폴더 경로 목록입니다. 이 폴더들은 카드 정렬 시 우선적으로 표시됩니다.
              </p>
            </div>
          </div>
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