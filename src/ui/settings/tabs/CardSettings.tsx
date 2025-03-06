import React, { useState } from 'react';
import { ISettingsTabProps } from '../types/SettingsTypes';
import SettingItem from '../components/SettingItem';

/**
 * 카드 설정 탭 컴포넌트
 */
const CardSettings: React.FC<ISettingsTabProps> = ({ settings, onChange }) => {
  const [activeSubTab, setActiveSubTab] = useState<'content' | 'rendering' | 'style'>('content');
  
  const {
    cardHeaderContent,
    cardBodyContent,
    cardFooterContent,
    renderingMode,
    normalCardBgColor,
    activeCardBgColor,
    focusedCardBgColor,
    headerBgColor,
    bodyBgColor,
    footerBgColor,
    headerFontSize,
    bodyFontSize,
    footerFontSize
  } = settings;
  
  return (
    <div className="card-navigator-setting-group">
      <div className="card-navigator-subtabs">
        <button 
          className={`card-navigator-subtab ${activeSubTab === 'content' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('content')}
        >
          내용
        </button>
        <button 
          className={`card-navigator-subtab ${activeSubTab === 'rendering' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('rendering')}
        >
          렌더링 방식
        </button>
        <button 
          className={`card-navigator-subtab ${activeSubTab === 'style' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('style')}
        >
          스타일
        </button>
      </div>
      
      {/* 카드 내용 설정 */}
      {activeSubTab === 'content' && (
        <>
          <h3>카드 내용 설정</h3>
          
          <SettingItem label="헤더 내용">
            <select
              value={cardHeaderContent || 'filename'}
              onChange={(e) => onChange('cardHeaderContent', e.target.value)}
            >
              <option value="filename">파일명</option>
              <option value="firstheader">첫 번째 헤더</option>
              <option value="content">본문</option>
              <option value="tags">태그</option>
              <option value="date">날짜</option>
              <option value="frontmatter">프론트매터 값</option>
            </select>
          </SettingItem>
          
          <SettingItem label="본문 내용">
            <select
              value={cardBodyContent || 'content'}
              onChange={(e) => onChange('cardBodyContent', e.target.value)}
            >
              <option value="filename">파일명</option>
              <option value="firstheader">첫 번째 헤더</option>
              <option value="content">본문</option>
              <option value="tags">태그</option>
              <option value="date">날짜</option>
              <option value="frontmatter">프론트매터 값</option>
            </select>
          </SettingItem>
          
          <SettingItem label="푸터 내용">
            <select
              value={cardFooterContent || 'tags'}
              onChange={(e) => onChange('cardFooterContent', e.target.value)}
            >
              <option value="filename">파일명</option>
              <option value="firstheader">첫 번째 헤더</option>
              <option value="content">본문</option>
              <option value="tags">태그</option>
              <option value="date">날짜</option>
              <option value="frontmatter">프론트매터 값</option>
            </select>
          </SettingItem>
        </>
      )}
      
      {/* 렌더링 방식 설정 */}
      {activeSubTab === 'rendering' && (
        <>
          <h3>렌더링 방식 설정</h3>
          
          <SettingItem label="렌더링 방식">
            <div className="card-navigator-radio-group">
              <label className="card-navigator-radio">
                <input
                  type="radio"
                  name="renderingMode"
                  value="text"
                  checked={renderingMode === 'text' || !renderingMode}
                  onChange={() => onChange('renderingMode', 'text')}
                />
                <span>일반 텍스트</span>
              </label>
              <label className="card-navigator-radio">
                <input
                  type="radio"
                  name="renderingMode"
                  value="html"
                  checked={renderingMode === 'html'}
                  onChange={() => onChange('renderingMode', 'html')}
                />
                <span>HTML (이미지, 코드블록, 콜아웃, 수식 등)</span>
              </label>
            </div>
          </SettingItem>
        </>
      )}
      
      {/* 카드 스타일 설정 */}
      {activeSubTab === 'style' && (
        <>
          <h3>카드 스타일 설정</h3>
          
          <div className="card-navigator-style-section">
            <h4>카드 종류별 스타일</h4>
            
            <SettingItem label="일반 카드 배경색">
              <input
                type="color"
                value={normalCardBgColor || '#ffffff'}
                onChange={(e) => onChange('normalCardBgColor', e.target.value)}
              />
            </SettingItem>
            
            <SettingItem label="활성 카드 배경색">
              <input
                type="color"
                value={activeCardBgColor || '#f0f0f0'}
                onChange={(e) => onChange('activeCardBgColor', e.target.value)}
              />
            </SettingItem>
            
            <SettingItem label="포커스 카드 배경색">
              <input
                type="color"
                value={focusedCardBgColor || '#e0e0e0'}
                onChange={(e) => onChange('focusedCardBgColor', e.target.value)}
              />
            </SettingItem>
          </div>
          
          <div className="card-navigator-style-section">
            <h4>헤더 스타일</h4>
            
            <SettingItem label="헤더 배경색">
              <input
                type="color"
                value={headerBgColor || '#f5f5f5'}
                onChange={(e) => onChange('headerBgColor', e.target.value)}
              />
            </SettingItem>
            
            <SettingItem label="헤더 폰트 크기 (px)">
              <input
                type="number"
                value={headerFontSize || 16}
                onChange={(e) => onChange('headerFontSize', Number(e.target.value))}
                min="10"
                max="30"
              />
            </SettingItem>
          </div>
          
          <div className="card-navigator-style-section">
            <h4>본문 스타일</h4>
            
            <SettingItem label="본문 배경색">
              <input
                type="color"
                value={bodyBgColor || '#ffffff'}
                onChange={(e) => onChange('bodyBgColor', e.target.value)}
              />
            </SettingItem>
            
            <SettingItem label="본문 폰트 크기 (px)">
              <input
                type="number"
                value={bodyFontSize || 14}
                onChange={(e) => onChange('bodyFontSize', Number(e.target.value))}
                min="10"
                max="30"
              />
            </SettingItem>
          </div>
          
          <div className="card-navigator-style-section">
            <h4>푸터 스타일</h4>
            
            <SettingItem label="푸터 배경색">
              <input
                type="color"
                value={footerBgColor || '#f5f5f5'}
                onChange={(e) => onChange('footerBgColor', e.target.value)}
              />
            </SettingItem>
            
            <SettingItem label="푸터 폰트 크기 (px)">
              <input
                type="number"
                value={footerFontSize || 12}
                onChange={(e) => onChange('footerFontSize', Number(e.target.value))}
                min="10"
                max="30"
              />
            </SettingItem>
          </div>
        </>
      )}
    </div>
  );
};

export default CardSettings;