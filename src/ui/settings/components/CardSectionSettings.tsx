import React, { useState, useEffect } from 'react';
import { CardNavigatorSettings } from '../../../main';
import SliderWithValue from './SliderWithValue';
import SettingItem from './SettingItem';
import './CardSectionSettings.css';

interface CardSectionSettingsProps {
  section: 'card' | 'content' | 'header' | 'body' | 'footer';
  settings: CardNavigatorSettings;
  onChange: (key: string, value: any) => Promise<void>;
  contentOptions?: { value: string; label: string }[];
  selectedHeaderContent?: string[];
  selectedBodyContent?: string[];
  selectedFooterContent?: string[];
  onContentChange?: (type: 'header' | 'body' | 'footer', value: string, checked: boolean) => Promise<void>;
  onSelectSection?: (section: 'card' | 'content' | 'header' | 'body' | 'footer' | null) => void;
}

/**
 * 카드 섹션 설정 컴포넌트
 * 선택된 카드 섹션에 따라 다른 설정 옵션을 표시합니다.
 */
const CardSectionSettings: React.FC<CardSectionSettingsProps> = ({ 
  section, 
  settings, 
  onChange,
  contentOptions = [],
  selectedHeaderContent = [],
  selectedBodyContent = [],
  selectedFooterContent = [],
  onContentChange,
  onSelectSection
}) => {
  // 프론트매터 키 입력 필드 표시 여부
  const [showHeaderFrontmatterKey, setShowHeaderFrontmatterKey] = useState(false);
  const [showBodyFrontmatterKey, setShowBodyFrontmatterKey] = useState(false);
  const [showFooterFrontmatterKey, setShowFooterFrontmatterKey] = useState(false);
  
  // 컴포넌트 마운트 시 프론트매터 키 표시 여부 설정
  useEffect(() => {
    setShowHeaderFrontmatterKey(selectedHeaderContent.includes('frontmatter'));
    setShowBodyFrontmatterKey(selectedBodyContent.includes('frontmatter'));
    setShowFooterFrontmatterKey(selectedFooterContent.includes('frontmatter'));
  }, [selectedHeaderContent, selectedBodyContent, selectedFooterContent]);
  
  // 섹션 제목과 아이콘 설정
  const getSectionTitle = () => {
    switch (section) {
      case 'card':
        return (
          <div className="card-navigator-section-title">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            </svg>
            카드 배경 및 테두리 설정
            <button 
              className="card-section-close-button" 
              onClick={() => onSelectSection && onSelectSection(null)}
              title="설정 닫기"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        );
      case 'content':
        return (
          <div className="card-navigator-section-title">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            카드 내용 설정
            <button 
              className="card-section-close-button" 
              onClick={() => onSelectSection && onSelectSection(null)}
              title="설정 닫기"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        );
      case 'header':
        return (
          <div className="card-navigator-section-title">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12h16"></path>
              <path d="M4 6h16"></path>
            </svg>
            카드 헤더 설정
            <button 
              className="card-section-close-button" 
              onClick={() => onSelectSection && onSelectSection(null)}
              title="설정 닫기"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        );
      case 'body':
        return (
          <div className="card-navigator-section-title">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12h16"></path>
              <path d="M4 18h12"></path>
            </svg>
            카드 본문 설정
            <button 
              className="card-section-close-button" 
              onClick={() => onSelectSection && onSelectSection(null)}
              title="설정 닫기"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        );
      case 'footer':
        return (
          <div className="card-navigator-section-title">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 18h16"></path>
              <path d="M4 12h16"></path>
            </svg>
            카드 푸터 설정
            <button 
              className="card-section-close-button" 
              onClick={() => onSelectSection && onSelectSection(null)}
              title="설정 닫기"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        );
      default:
        return (
          <div className="card-navigator-section-title">
            카드 설정
            <button 
              className="card-section-close-button" 
              onClick={() => onSelectSection && onSelectSection(null)}
              title="설정 닫기"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        );
    }
  };
  
  // 카드 설정 렌더링
  const renderCardSettings = () => {
    return (
      <div className="card-navigator-section-content">
        <SettingItem label="일반 카드 배경색">
          <input
            type="color"
            value={settings.normalCardBgColor || '#ffffff'}
            onChange={async (e) => await onChange('normalCardBgColor', e.target.value)}
          />
        </SettingItem>
        
        <SettingItem label="활성 카드 배경색">
          <input
            type="color"
            value={settings.activeCardBgColor || '#f0f7ff'}
            onChange={async (e) => await onChange('activeCardBgColor', e.target.value)}
          />
        </SettingItem>
        
        <SettingItem label="포커스 카드 배경색">
          <input
            type="color"
            value={settings.focusedCardBgColor || '#e6f0ff'}
            onChange={async (e) => await onChange('focusedCardBgColor', e.target.value)}
          />
        </SettingItem>
        
        <SettingItem label="테두리 스타일">
          <select
            value={settings.normalCardBorderStyle || 'solid'}
            onChange={async (e) => await onChange('normalCardBorderStyle', e.target.value)}
          >
            <option value="solid">실선</option>
            <option value="dashed">점선</option>
            <option value="dotted">점</option>
            <option value="double">이중선</option>
            <option value="none">없음</option>
          </select>
        </SettingItem>
        
        <SettingItem label="테두리 색상">
          <input
            type="color"
            value={settings.normalCardBorderColor || '#cccccc'}
            onChange={async (e) => await onChange('normalCardBorderColor', e.target.value)}
          />
        </SettingItem>
        
        <SliderWithValue
          min={0}
          max={10}
          value={settings.normalCardBorderWidth || 1}
          onChange={async (value) => await onChange('normalCardBorderWidth', value)}
          step={1}
          label="테두리 두께 (px)"
        />
        
        <SliderWithValue
          min={0}
          max={20}
          value={settings.normalCardBorderRadius || 4}
          onChange={async (value) => await onChange('normalCardBorderRadius', value)}
          step={1}
          label="테두리 둥글기 (px)"
        />
        
        <SettingItem label="카드 크기">
          <div className="card-navigator-setting-group">
            <SliderWithValue
              min={100}
              max={800}
              value={settings.cardWidth || 300}
              onChange={async (value) => await onChange('cardWidth', value)}
              step={10}
              label="카드 너비 (px)"
            />
            
            <SliderWithValue
              min={100}
              max={800}
              value={settings.cardHeight || 200}
              onChange={async (value) => await onChange('cardHeight', value)}
              step={10}
              label="카드 높이 (px)"
            />
          </div>
        </SettingItem>
      </div>
    );
  };
  
  // 내용 설정 렌더링
  const renderContentSettings = () => {
    return (
      <div className="card-navigator-section-content">
        <SettingItem label="렌더링 방식">
          <div className="card-navigator-setting-description">
            HTML 렌더링을 활성화하면 이미지, 코드블록, 콜아웃, 수식 등이 카드에 표시됩니다. 비활성화하면 일반 텍스트로만 표시됩니다.
          </div>
          <div className="card-navigator-setting-toggle-item">
            <span>HTML 렌더링 사용</span>
            <div className="card-navigator-toggle">
              <input
                type="checkbox"
                id="renderingModeHtml"
                checked={settings.renderingMode === 'html'}
                onChange={async (e) => {
                  const newValue = e.target.checked ? 'html' : 'text';
                  await onChange('renderingMode', newValue);
                }}
              />
              <label htmlFor="renderingModeHtml" className="card-navigator-toggle-slider"></label>
            </div>
          </div>
        </SettingItem>
        
        <SettingItem label="제목 소스">
          <div className="card-navigator-setting-description">
            카드 제목으로 파일명을 사용할지, 첫 번째 헤더를 사용할지 선택합니다.
          </div>
          <div className="card-navigator-setting-toggle-item">
            <span>첫 번째 헤더를 제목으로 사용</span>
            <div className="card-navigator-toggle">
              <input
                type="checkbox"
                id="titleSourceFirstheader"
                checked={settings.titleSource === 'firstheader'}
                onChange={async (e) => {
                  const newValue = e.target.checked ? 'firstheader' : 'filename';
                  await onChange('titleSource', newValue);
                }}
              />
              <label htmlFor="titleSourceFirstheader" className="card-navigator-toggle-slider"></label>
            </div>
          </div>
        </SettingItem>
        
        <SettingItem label="본문 포함 내용">
          <div className="card-navigator-setting-description">
            카드 본문에 프론트매터나 첫 번째 헤더를 포함할지 여부를 설정합니다.
          </div>
          <div className="card-navigator-setting-toggle-item">
            <span>프론트매터 포함</span>
            <div className="card-navigator-toggle">
              <input
                type="checkbox"
                id="includeFrontmatterInContent"
                checked={settings.includeFrontmatterInContent || false}
                onChange={async (e) => {
                  await onChange('includeFrontmatterInContent', e.target.checked);
                }}
              />
              <label htmlFor="includeFrontmatterInContent" className="card-navigator-toggle-slider"></label>
            </div>
          </div>
          <div className="card-navigator-setting-toggle-item">
            <span>첫 번째 헤더 포함</span>
            <div className="card-navigator-toggle">
              <input
                type="checkbox"
                id="includeFirstHeaderInContent"
                checked={settings.includeFirstHeaderInContent || false}
                onChange={async (e) => {
                  await onChange('includeFirstHeaderInContent', e.target.checked);
                }}
              />
              <label htmlFor="includeFirstHeaderInContent" className="card-navigator-toggle-slider"></label>
            </div>
          </div>
        </SettingItem>
      </div>
    );
  };
  
  // 헤더 설정 렌더링
  const renderHeaderSettings = () => {
    return (
      <div className="card-navigator-section-content">
        <SettingItem label="헤더 내용 (다중 선택 가능)">
          {contentOptions.length > 0 && onContentChange && (
            <div className="card-navigator-checkbox-group">
              {contentOptions.map(option => (
                <label key={`header-${option.value}`} className="card-navigator-checkbox">
                  <input
                    type="checkbox"
                    value={option.value}
                    checked={selectedHeaderContent.includes(option.value)}
                    onChange={async (e) => await onContentChange('header', option.value, e.target.checked)}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          )}
        </SettingItem>
        
        {showHeaderFrontmatterKey && (
          <SettingItem label="헤더 프론트매터 키">
            <input
              type="text"
              value={settings.cardHeaderFrontmatterKey || ''}
              onChange={async (e) => await onChange('cardHeaderFrontmatterKey', e.target.value)}
              placeholder="프론트매터 키 입력 (쉼표로 구분)"
            />
          </SettingItem>
        )}
        
        <SettingItem label="헤더 배경색">
          <input
            type="color"
            value={settings.headerBgColor || '#f5f5f5'}
            onChange={async (e) => await onChange('headerBgColor', e.target.value)}
          />
        </SettingItem>
        
        <SliderWithValue
          min={8}
          max={24}
          value={settings.headerFontSize || 16}
          onChange={async (value) => await onChange('headerFontSize', value)}
          step={1}
          label="헤더 폰트 크기 (px)"
        />
        
        <SettingItem label="헤더 테두리 스타일">
          <select
            value={settings.headerBorderStyle || 'solid'}
            onChange={async (e) => await onChange('headerBorderStyle', e.target.value)}
          >
            <option value="solid">실선</option>
            <option value="dashed">점선</option>
            <option value="dotted">점</option>
            <option value="double">이중선</option>
            <option value="none">없음</option>
          </select>
        </SettingItem>
        
        <SettingItem label="헤더 테두리 색상">
          <input
            type="color"
            value={settings.headerBorderColor || '#e0e0e0'}
            onChange={async (e) => await onChange('headerBorderColor', e.target.value)}
          />
        </SettingItem>
        
        <SliderWithValue
          min={0}
          max={10}
          value={settings.headerBorderWidth || 1}
          onChange={async (value) => await onChange('headerBorderWidth', value)}
          step={1}
          label="헤더 테두리 두께 (px)"
        />
      </div>
    );
  };
  
  // 본문 설정 렌더링
  const renderBodySettings = () => {
    return (
      <div className="card-navigator-section-content">
        <SettingItem label="본문 내용 (다중 선택 가능)">
          {contentOptions.length > 0 && onContentChange && (
            <div className="card-navigator-checkbox-group">
              {contentOptions.map(option => (
                <label key={`body-${option.value}`} className="card-navigator-checkbox">
                  <input
                    type="checkbox"
                    value={option.value}
                    checked={selectedBodyContent.includes(option.value)}
                    onChange={async (e) => await onContentChange('body', option.value, e.target.checked)}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          )}
        </SettingItem>
        
        {showBodyFrontmatterKey && (
          <SettingItem label="본문 프론트매터 키">
            <input
              type="text"
              value={settings.cardBodyFrontmatterKey || ''}
              onChange={async (e) => await onChange('cardBodyFrontmatterKey', e.target.value)}
              placeholder="프론트매터 키 입력 (쉼표로 구분)"
            />
          </SettingItem>
        )}
        
        <SettingItem label="본문 배경색">
          <input
            type="color"
            value={settings.bodyBgColor || '#ffffff'}
            onChange={async (e) => await onChange('bodyBgColor', e.target.value)}
          />
        </SettingItem>
        
        <SliderWithValue
          min={8}
          max={24}
          value={settings.bodyFontSize || 14}
          onChange={async (value) => await onChange('bodyFontSize', value)}
          step={1}
          label="본문 폰트 크기 (px)"
        />
        
        <SettingItem label="본문 길이 제한">
          <div className="card-navigator-setting-toggles">
            <div className="card-navigator-setting-toggle-item">
              <span>본문 길이 제한</span>
              <div className="card-navigator-toggle">
                <input
                  type="checkbox"
                  id="limitContentLength"
                  checked={settings.limitContentLength || false}
                  onChange={async (e) => {
                    await onChange('limitContentLength', e.target.checked);
                  }}
                />
                <label htmlFor="limitContentLength" className="card-navigator-toggle-slider"></label>
              </div>
            </div>
          </div>
        </SettingItem>
        
        {settings.limitContentLength && (
          <SliderWithValue
            min={50}
            max={1000}
            value={settings.contentMaxLength || 200}
            onChange={async (value) => await onChange('contentMaxLength', value)}
            step={10}
            label="본문 최대 길이 (글자)"
          />
        )}
        
        <SettingItem label="본문 테두리 스타일">
          <select
            value={settings.bodyBorderStyle || 'none'}
            onChange={async (e) => await onChange('bodyBorderStyle', e.target.value)}
          >
            <option value="solid">실선</option>
            <option value="dashed">점선</option>
            <option value="dotted">점</option>
            <option value="double">이중선</option>
            <option value="none">없음</option>
          </select>
        </SettingItem>
        
        <SettingItem label="본문 테두리 색상">
          <input
            type="color"
            value={settings.bodyBorderColor || '#e0e0e0'}
            onChange={async (e) => await onChange('bodyBorderColor', e.target.value)}
          />
        </SettingItem>
        
        <SliderWithValue
          min={0}
          max={10}
          value={settings.bodyBorderWidth || 1}
          onChange={async (value) => await onChange('bodyBorderWidth', value)}
          step={1}
          label="본문 테두리 두께 (px)"
        />
      </div>
    );
  };
  
  // 푸터 설정 렌더링
  const renderFooterSettings = () => {
    return (
      <div className="card-navigator-section-content">
        <SettingItem label="푸터 내용 (다중 선택 가능)">
          {contentOptions.length > 0 && onContentChange && (
            <div className="card-navigator-checkbox-group">
              {contentOptions.map(option => (
                <label key={`footer-${option.value}`} className="card-navigator-checkbox">
                  <input
                    type="checkbox"
                    value={option.value}
                    checked={selectedFooterContent.includes(option.value)}
                    onChange={async (e) => await onContentChange('footer', option.value, e.target.checked)}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          )}
        </SettingItem>
        
        {showFooterFrontmatterKey && (
          <SettingItem label="푸터 프론트매터 키">
            <input
              type="text"
              value={settings.cardFooterFrontmatterKey || ''}
              onChange={async (e) => await onChange('cardFooterFrontmatterKey', e.target.value)}
              placeholder="프론트매터 키 입력 (쉼표로 구분)"
            />
          </SettingItem>
        )}
        
        <SettingItem label="푸터 배경색">
          <input
            type="color"
            value={settings.footerBgColor || '#f5f5f5'}
            onChange={async (e) => await onChange('footerBgColor', e.target.value)}
          />
        </SettingItem>
        
        <SliderWithValue
          min={8}
          max={24}
          value={settings.footerFontSize || 12}
          onChange={async (value) => await onChange('footerFontSize', value)}
          step={1}
          label="푸터 폰트 크기 (px)"
        />
        
        <SettingItem label="푸터 테두리 스타일">
          <select
            value={settings.footerBorderStyle || 'solid'}
            onChange={async (e) => await onChange('footerBorderStyle', e.target.value)}
          >
            <option value="solid">실선</option>
            <option value="dashed">점선</option>
            <option value="dotted">점</option>
            <option value="double">이중선</option>
            <option value="none">없음</option>
          </select>
        </SettingItem>
        
        <SettingItem label="푸터 테두리 색상">
          <input
            type="color"
            value={settings.footerBorderColor || '#e0e0e0'}
            onChange={async (e) => await onChange('footerBorderColor', e.target.value)}
          />
        </SettingItem>
        
        <SliderWithValue
          min={0}
          max={10}
          value={settings.footerBorderWidth || 1}
          onChange={async (value) => await onChange('footerBorderWidth', value)}
          step={1}
          label="푸터 테두리 두께 (px)"
        />
      </div>
    );
  };
  
  // 선택된 섹션에 따라 다른 설정 렌더링
  const renderSectionSettings = () => {
    switch (section) {
      case 'card':
        return renderCardSettings();
      case 'content':
        return renderContentSettings();
      case 'header':
        return renderHeaderSettings();
      case 'body':
        return renderBodySettings();
      case 'footer':
        return renderFooterSettings();
      default:
        return <div>섹션을 선택해주세요.</div>;
    }
  };
  
  return (
    <div className="card-navigator-section-settings">
      {getSectionTitle()}
      {renderSectionSettings()}
    </div>
  );
};

export default CardSectionSettings; 