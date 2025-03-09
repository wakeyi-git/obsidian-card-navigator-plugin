import React, { useState, useEffect } from 'react';
import { CardNavigatorSettings } from '../../../main';
import './CardPreview.css';

interface CardPreviewProps {
  settings: CardNavigatorSettings;
  onSelectSection: (section: 'card' | 'header' | 'body' | 'footer' | 'content' | null) => void;
}

/**
 * 카드 미리보기 컴포넌트
 * 카드의 각 부분을 클릭하여 해당 부분의 설정을 변경할 수 있습니다.
 */
const CardPreview: React.FC<CardPreviewProps> = ({ settings, onSelectSection }) => {
  const [activeSection, setActiveSection] = useState<'card' | 'header' | 'body' | 'footer' | 'content' | null>(null);
  
  // 카드 스타일 계산
  const cardStyle: React.CSSProperties = {
    width: '100%',
    maxWidth: '350px',
    height: '220px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: settings.normalCardBgColor || '#ffffff',
    borderStyle: settings.normalCardBorderStyle || 'solid',
    borderColor: settings.normalCardBorderColor || '#cccccc',
    borderWidth: `${settings.normalCardBorderWidth || 1}px`,
    borderRadius: `${settings.normalCardBorderRadius || 4}px`,
    overflow: 'hidden',
    position: 'relative',
    cursor: 'pointer',
    padding: '10px',
  };
  
  // 헤더 스타일 계산
  const headerStyle: React.CSSProperties = {
    padding: '8px 12px',
    backgroundColor: settings.headerBgColor || '#f5f5f5',
    borderBottom: '1px solid #e0e0e0',
    fontSize: `${settings.headerFontSize || 14}px`,
    fontWeight: 500,
    color: '#333',
    cursor: 'pointer',
    position: 'relative',
    zIndex: 5,
    marginBottom: '10px',
    borderRadius: '4px',
    width: '90%',
    marginLeft: 'auto',
    marginRight: 'auto',
  };
  
  // 본문 스타일 계산
  const bodyStyle: React.CSSProperties = {
    padding: '12px',
    flex: 1,
    overflow: 'hidden',
    fontSize: `${settings.bodyFontSize || 12}px`,
    color: '#444',
    backgroundColor: settings.bodyBgColor || '#ffffff',
    border: '1px solid #e0e0e0',
    cursor: 'pointer',
    position: 'relative',
    zIndex: 5,
    marginBottom: '10px',
    borderRadius: '4px',
    width: '90%',
    marginLeft: 'auto',
    marginRight: 'auto',
  };
  
  // 푸터 스타일 계산
  const footerStyle: React.CSSProperties = {
    padding: '8px 12px',
    backgroundColor: settings.footerBgColor || '#f5f5f5',
    borderTop: '1px solid #e0e0e0',
    fontSize: `${settings.footerFontSize || 11}px`,
    color: '#666',
    cursor: 'pointer',
    position: 'relative',
    zIndex: 5,
    borderRadius: '4px',
    width: '90%',
    marginLeft: 'auto',
    marginRight: 'auto',
  };
  
  // 카드 클릭 핸들러
  const handleCardClick = (e: React.MouseEvent) => {
    // 이벤트 타겟이 카드 자체인 경우에만 처리
    if ((e.target as HTMLElement).className.includes('card-navigator-preview-card')) {
      e.stopPropagation();
      setActiveSection('card');
      onSelectSection('card');
    }
  };
  
  // 내용 설정 클릭 핸들러
  const handleContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveSection('content');
    onSelectSection('content');
  };
  
  // 헤더 클릭 핸들러
  const handleHeaderClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveSection('header');
    onSelectSection('header');
  };
  
  // 본문 클릭 핸들러
  const handleBodyClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveSection('body');
    onSelectSection('body');
  };
  
  // 푸터 클릭 핸들러
  const handleFooterClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveSection('footer');
    onSelectSection('footer');
  };
  
  // 선택된 섹션이 변경될 때 activeSection 업데이트
  useEffect(() => {
    setActiveSection(null);
  }, [onSelectSection]);
  
  return (
    <div className="card-navigator-preview-container">
      <div className="card-navigator-preview-sections">
        <div 
          className={`card-navigator-preview-card ${activeSection === 'card' ? 'active' : ''}`}
          style={cardStyle}
          onClick={handleCardClick}
        >
          {/* 카드 배경 오버레이 */}
          {activeSection === 'card' && (
            <div className="card-navigator-preview-card-overlay"></div>
          )}
          
          {/* 내용 설정 버튼 */}
          <div
            className={`card-navigator-preview-content-button ${activeSection === 'content' ? 'active' : ''}`}
            onClick={handleContentClick}
            title="카드 내용 설정"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
              <path d="M2 17l10 5 10-5"></path>
              <path d="M2 12l10 5 10-5"></path>
            </svg>
          </div>
          
          {/* 헤더 */}
          <div 
            className={`card-navigator-preview-header ${activeSection === 'header' ? 'active' : ''}`}
            style={headerStyle}
            onClick={handleHeaderClick}
          >
            카드 제목
            {activeSection === 'header' && (
              <div className="card-navigator-preview-overlay"></div>
            )}
          </div>
          
          {/* 본문 */}
          <div 
            className={`card-navigator-preview-body ${activeSection === 'body' ? 'active' : ''}`}
            style={bodyStyle}
            onClick={handleBodyClick}
          >
            카드 본문 내용입니다.
            {activeSection === 'body' && (
              <div className="card-navigator-preview-overlay"></div>
            )}
          </div>
          
          {/* 푸터 */}
          <div 
            className={`card-navigator-preview-footer ${activeSection === 'footer' ? 'active' : ''}`}
            style={footerStyle}
            onClick={handleFooterClick}
          >
            #태그 #카드네비게이터
            {activeSection === 'footer' && (
              <div className="card-navigator-preview-overlay"></div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardPreview; 