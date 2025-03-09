import React, { useEffect, useState } from 'react';
import './Card.css';
import { ICardNavigatorService } from '../../application/CardNavigatorService';
import { ICard, ICardDisplaySettings, ICardStyle, ICardElementStyle } from '../../domain/card/Card';

/**
 * 내용 요약 함수
 * @param text 원본 텍스트
 * @param settings 설정
 * @returns 요약된 텍스트
 */
const summarizeContent = (text: string, settings?: any): string => {
  if (!text) return '';
  
  // 설정에서 본문 길이 제한 여부와 최대 길이 가져오기
  const limitContentLength = settings?.limitContentLength !== undefined ? settings.limitContentLength : true;
  const maxLength = settings?.contentMaxLength || 200;
  
  // 길이 제한이 비활성화되어 있거나 텍스트 길이가 최대 길이보다 작으면 원본 텍스트 반환
  if (!limitContentLength || text.length <= maxLength) return text;
  
  // 내용 요약
  return text.substring(0, maxLength) + '...';
};

/**
 * 카드 컴포넌트 속성 인터페이스
 */
export interface ICardProps {
  id: string;
  title: string;
  content: string;
  tags?: string[];
  path?: string;
  created?: number;
  modified?: number;
  onClick?: (id: string) => void;
  style?: React.CSSProperties;
  searchQuery?: string;
  cardNavigatorService?: ICardNavigatorService;
  isActive?: boolean;
  isFocused?: boolean;
  firstHeader?: string;
  frontmatter?: Record<string, any>;
  displaySettings?: ICardDisplaySettings;
  settings?: any;
  
  // 추가 속성
  onContextMenu?: (id: string, event: React.MouseEvent) => void;
  onDragStart?: (id: string, event: React.DragEvent) => void;
  onDragEnd?: (id: string, event: React.DragEvent) => void;
  onDrop?: (id: string, event: React.DragEvent) => void;
  onDragOver?: (id: string, event: React.DragEvent) => void;
  onDragEnter?: (id: string, event: React.DragEvent) => void;
  onDragLeave?: (id: string, event: React.DragEvent) => void;
}

/**
 * 카드 컴포넌트
 * 노트의 내용을 카드 형태로 표시합니다.
 */
const Card: React.FC<ICardProps> = ({
  id,
  title,
  content,
  tags = [],
  path,
  created,
  modified,
  onClick,
  style = {},
  searchQuery = '',
  cardNavigatorService,
  isActive = false,
  isFocused = false,
  firstHeader = '',
  frontmatter = {},
  displaySettings,
  settings,
  onContextMenu,
  onDragStart,
  onDragEnd,
  onDrop,
  onDragOver,
  onDragEnter,
  onDragLeave,
}) => {
  // 카드 상태
  const [isHovered, setIsHovered] = useState(false);
  const [cardContent, setCardContent] = useState<{
    header: string;
    body: string;
    footer: string;
  }>({
    header: title,
    body: summarizeContent(content, settings),
    footer: tags.map(tag => `#${tag}`).join(' ')
  });
  
  // 카드 스타일 상태
  const [cardStyle, setCardStyle] = useState<React.CSSProperties>({});
  const [headerStyle, setHeaderStyle] = useState<React.CSSProperties>({});
  const [bodyStyle, setBodyStyle] = useState<React.CSSProperties>({});
  const [footerStyle, setFooterStyle] = useState<React.CSSProperties>({});
  
  // 카드 내용 및 스타일 업데이트
  useEffect(() => {
    updateCardContent();
    updateCardStyles();
  }, [
    title, content, tags, displaySettings, settings,
    isActive, isFocused, isHovered
  ]);
  
  // 카드 내용 업데이트
  const updateCardContent = () => {
    if (!cardNavigatorService || !settings) {
      setCardContent({
        header: title,
        body: summarizeContent(content, settings),
        footer: tags.map(tag => `#${tag}`).join(' ')
      });
      return;
    }
    
    // 카드 객체 생성
    const card: ICard = {
      id,
      title,
      content,
      tags,
      path: path || '',
      created: created || Date.now(),
      modified: modified || Date.now(),
      frontmatter,
      firstHeader,
      displaySettings
    };
    
    try {
      // 헤더 내용 가져오기
      const headerContentSetting = settings.cardHeaderContent || ['filename'];
      const headerContent = cardNavigatorService.getCardService().getCardContent(
        card,
        headerContentSetting,
        settings
      );
      
      // 본문 내용 가져오기
      const bodyContentSetting = settings.cardBodyContent || ['content'];
      const bodyContent = cardNavigatorService.getCardService().getCardContent(
        card,
        bodyContentSetting,
        settings
      );
      
      // 푸터 내용 가져오기
      const footerContentSetting = settings.cardFooterContent || ['tags'];
      const footerContent = cardNavigatorService.getCardService().getCardContent(
        card,
        footerContentSetting,
        settings
      );
      
      setCardContent({
        header: headerContent || title,
        body: summarizeContent(bodyContent || content, settings),
        footer: footerContent || tags.map(tag => `#${tag}`).join(' ')
      });
    } catch (error) {
      console.error('카드 내용 업데이트 오류:', error);
      setCardContent({
        header: title,
        body: summarizeContent(content, settings),
        footer: tags.map(tag => `#${tag}`).join(' ')
      });
    }
  };
  
  // 카드 스타일 업데이트
  const updateCardStyles = () => {
    if (!settings) return;
    
    // 카드 상태에 따른 스타일 결정
    let cardStateStyle: ICardElementStyle = {};
    
    if (isFocused && displaySettings?.cardStyle?.focused) {
      cardStateStyle = displaySettings.cardStyle.focused;
    } else if (isActive && displaySettings?.cardStyle?.active) {
      cardStateStyle = displaySettings.cardStyle.active;
    } else if (displaySettings?.cardStyle?.normal) {
      cardStateStyle = displaySettings.cardStyle.normal;
    } else {
      // 설정에서 스타일 가져오기
      if (isFocused) {
        cardStateStyle = {
          backgroundColor: settings.focusedCardBgColor,
          borderStyle: settings.focusedCardBorderStyle,
          borderColor: settings.focusedCardBorderColor,
          borderWidth: settings.focusedCardBorderWidth,
          borderRadius: settings.focusedCardBorderRadius
        };
      } else if (isActive) {
        cardStateStyle = {
          backgroundColor: settings.activeCardBgColor,
          borderStyle: settings.activeCardBorderStyle,
          borderColor: settings.activeCardBorderColor,
          borderWidth: settings.activeCardBorderWidth,
          borderRadius: settings.activeCardBorderRadius
        };
      } else {
        cardStateStyle = {
          backgroundColor: settings.normalCardBgColor,
          borderStyle: settings.normalCardBorderStyle,
          borderColor: settings.normalCardBorderColor,
          borderWidth: settings.normalCardBorderWidth,
          borderRadius: settings.normalCardBorderRadius
        };
      }
    }
    
    // 카드 스타일 설정 - CSS 클래스로 기본 스타일을 적용하고 인라인 스타일로 사용자 설정 적용
    setCardStyle({
      ...style,
      backgroundColor: cardStateStyle.backgroundColor,
      borderStyle: cardStateStyle.borderStyle,
      borderColor: cardStateStyle.borderColor,
      borderWidth: cardStateStyle.borderWidth ? `${cardStateStyle.borderWidth}px` : undefined,
      borderRadius: cardStateStyle.borderRadius ? `${cardStateStyle.borderRadius}px` : undefined,
      // 기본 스타일은 CSS에서 처리하므로 여기서는 사용자 설정만 적용
    });
    
    // 헤더 스타일 설정
    const headerStyleObj = displaySettings?.cardStyle?.header || {
      backgroundColor: settings.headerBgColor,
      fontSize: settings.headerFontSize,
      borderStyle: settings.headerBorderStyle,
      borderColor: settings.headerBorderColor,
      borderWidth: settings.headerBorderWidth,
      borderRadius: settings.headerBorderRadius
    };
    
    setHeaderStyle({
      backgroundColor: headerStyleObj.backgroundColor,
      fontSize: headerStyleObj.fontSize ? `${headerStyleObj.fontSize}px` : undefined,
      borderStyle: headerStyleObj.borderStyle,
      borderColor: headerStyleObj.borderColor,
      borderWidth: headerStyleObj.borderWidth ? `${headerStyleObj.borderWidth}px` : undefined,
      borderRadius: headerStyleObj.borderRadius ? `${headerStyleObj.borderRadius}px` : undefined,
      // 기본 스타일은 CSS에서 처리
    });
    
    // 본문 스타일 설정
    const bodyStyleObj = displaySettings?.cardStyle?.body || {
      backgroundColor: settings.bodyBgColor,
      fontSize: settings.bodyFontSize,
      borderStyle: settings.bodyBorderStyle,
      borderColor: settings.bodyBorderColor,
      borderWidth: settings.bodyBorderWidth,
      borderRadius: settings.bodyBorderRadius
    };
    
    setBodyStyle({
      backgroundColor: bodyStyleObj.backgroundColor,
      fontSize: bodyStyleObj.fontSize ? `${bodyStyleObj.fontSize}px` : undefined,
      borderStyle: bodyStyleObj.borderStyle,
      borderColor: bodyStyleObj.borderColor,
      borderWidth: bodyStyleObj.borderWidth ? `${bodyStyleObj.borderWidth}px` : undefined,
      borderRadius: bodyStyleObj.borderRadius ? `${bodyStyleObj.borderRadius}px` : undefined,
      // 기본 스타일은 CSS에서 처리
    });
    
    // 푸터 스타일 설정
    const footerStyleObj = displaySettings?.cardStyle?.footer || {
      backgroundColor: settings.footerBgColor,
      fontSize: settings.footerFontSize,
      borderStyle: settings.footerBorderStyle,
      borderColor: settings.footerBorderColor,
      borderWidth: settings.footerBorderWidth,
      borderRadius: settings.footerBorderRadius
    };
    
    setFooterStyle({
      backgroundColor: footerStyleObj.backgroundColor,
      fontSize: footerStyleObj.fontSize ? `${footerStyleObj.fontSize}px` : undefined,
      borderStyle: footerStyleObj.borderStyle,
      borderColor: footerStyleObj.borderColor,
      borderWidth: footerStyleObj.borderWidth ? `${footerStyleObj.borderWidth}px` : undefined,
      borderRadius: footerStyleObj.borderRadius ? `${footerStyleObj.borderRadius}px` : undefined,
      color: 'var(--text-muted)',
      // 기본 스타일은 CSS에서 처리
    });
  };
  
  // 이벤트 핸들러
  const handleClick = () => {
    if (onClick) {
      onClick(id);
    }
  };
  
  const handleContextMenu = (event: React.MouseEvent) => {
    if (onContextMenu) {
      onContextMenu(id, event);
    }
  };
  
  const handleDragStart = (event: React.DragEvent) => {
    if (onDragStart) {
      onDragStart(id, event);
    }
  };
  
  const handleDragEnd = (event: React.DragEvent) => {
    if (onDragEnd) {
      onDragEnd(id, event);
    }
  };
  
  const handleDrop = (event: React.DragEvent) => {
    if (onDrop) {
      onDrop(id, event);
    }
  };
  
  const handleDragOver = (event: React.DragEvent) => {
    if (onDragOver) {
      onDragOver(id, event);
    }
  };
  
  const handleDragEnter = (event: React.DragEvent) => {
    if (onDragEnter) {
      onDragEnter(id, event);
    }
  };
  
  const handleDragLeave = (event: React.DragEvent) => {
    if (onDragLeave) {
      onDragLeave(id, event);
    }
  };
  
  // 날짜 포맷팅
  const formatDate = (timestamp?: number) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // 텍스트 하이라이팅
  const highlightText = (text: string, searchInfo: { text: string, positions: number[] }[]): JSX.Element => {
    if (!searchInfo || searchInfo.length === 0 || !text) {
      return <>{text}</>;
    }
    
    // 검색어 위치 정보 정렬
    const positions = searchInfo.flatMap(info => 
      info.positions.map(pos => ({ pos, length: info.text.length }))
    ).sort((a, b) => a.pos - b.pos);
    
    // 겹치는 위치 제거
    const filteredPositions = positions.filter((pos, index) => {
      if (index === 0) return true;
      const prevPos = positions[index - 1];
      return pos.pos >= prevPos.pos + prevPos.length;
    });
    
    // 텍스트 분할
    const parts: JSX.Element[] = [];
    let lastIndex = 0;
    
    filteredPositions.forEach((pos, index) => {
      // 검색어 앞 부분
      if (pos.pos > lastIndex) {
        parts.push(
          <span key={`text-${index}-before`}>
            {text.substring(lastIndex, pos.pos)}
          </span>
        );
      }
      
      // 검색어 부분
      parts.push(
        <span key={`highlight-${index}`} className="card-highlight">
          {text.substring(pos.pos, pos.pos + pos.length)}
        </span>
      );
      
      lastIndex = pos.pos + pos.length;
    });
    
    // 마지막 부분
    if (lastIndex < text.length) {
      parts.push(
        <span key="text-last">
          {text.substring(lastIndex)}
        </span>
      );
    }
    
    return <>{parts}</>;
  };
  
  // 렌더링 방식에 따른 내용 표시
  const renderContent = (content: string, isMarkdown: boolean) => {
    if (!content) return null;
    
    // HTML 태그가 포함된 경우 (프론트매터 표시 등)
    if (content.includes('<div class="card-frontmatter">')) {
      return (
        <div className="card-text-content" dangerouslySetInnerHTML={{ __html: content }} />
      );
    }
    
    // 줄바꿈으로 내용 분리
    const contentItems = content.split('\n');
    
    if (isMarkdown) {
      // 마크다운 렌더링 (HTML 변환)
      return (
        <div className="card-markdown-content">
          <div dangerouslySetInnerHTML={{ 
            __html: cardNavigatorService?.renderMarkdown(contentItems.join('\n')) || contentItems.join('\n') 
          }} />
        </div>
      );
    } else {
      // 일반 텍스트 렌더링
      return (
        <div className="card-text-content">
          {contentItems.map((item, index) => (
            <div key={index} className="card-content-item">
              {searchQuery ? highlightText(item, []) : item}
            </div>
          ))}
        </div>
      );
    }
  };
  
  // 마크다운 렌더링 여부 확인
  const isMarkdownRendering = settings?.renderingMode === 'html';
  
  // 컴포넌트 마운트 시 스타일 추가
  useEffect(() => {
    // 스타일 요소 생성
    const style = document.createElement('style');
    style.textContent = `
      .card {
        display: flex;
        flex-direction: column;
        width: 100%;
        height: 100%;
        min-height: 100px;
        max-height: 400px;
        padding: 8px;
        overflow: hidden;
      }
      
      .card:hover {
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        transform: translateY(-2px);
      }
      
      .card.active {
        border-color: var(--interactive-accent);
      }
      
      .card.focused {
        border-color: var(--text-accent);
        box-shadow: 0 0 0 2px var(--text-accent-hover);
      }
      
      .card-header, .card-body, .card-footer {
        padding: 12px;
        overflow: hidden;
      }
      
      .card-header {
        font-weight: 600;
        border-bottom: 1px solid var(--background-modifier-border);
        padding: 4px 6px;
      }
      
      .card-body {
        flex: 1;
        min-height: 60px;
        max-height: 200px;
        overflow-y: auto;
        padding: 6px;
      }
      
      .card-footer {
        font-size: 0.85em;
        color: var(--text-muted);
        border-top: 1px solid var(--background-modifier-border);
        padding: 4px 6px;
      }
      
      .card-content-item {
        margin-bottom: 4px;
        padding-bottom: 4px;
        border-bottom: 1px dashed var(--background-modifier-border);
      }
      
      .card-content-item:last-child {
        margin-bottom: 0;
        padding-bottom: 0;
        border-bottom: none;
      }
      
      .card-highlight {
        background-color: rgba(var(--interactive-accent-rgb), 0.3);
        border-radius: 2px;
        padding: 0 2px;
      }
      
      /* 프론트매터 스타일 */
      .card-text-content {
        white-space: pre-wrap;
      }
      
      .card-text-content:has(+ .card-content-item) {
        margin-bottom: 4px;
      }
      
      /* 마크다운 내용 스타일 조정 */
      .card-markdown-content p {
        margin: 0 0 4px 0;
        line-height: 1.4;
      }
      
      .card-markdown-content ul, 
      .card-markdown-content ol {
        margin: 0 0 4px 0;
        padding-left: 16px;
      }
      
      .card-markdown-content li {
        margin: 0 0 2px 0;
      }
      
      .card-markdown-content a.tag {
        padding: 1px 4px;
        margin: 0 2px;
      }
      
      /* 첫 번째 헤더 스타일 */
      .card-first-header {
        font-size: 1.1em;
        font-weight: bold;
        margin-bottom: 8px;
        padding-bottom: 4px;
        border-bottom: 1px solid var(--background-modifier-border);
        color: var(--text-accent);
      }
      
      /* 프론트매터 헤더 스타일 */
      .card-frontmatter {
        background-color: var(--background-secondary);
        border-radius: 4px;
        padding: 8px;
        font-family: monospace;
        font-size: 0.9em;
        margin-bottom: 8px;
      }
      
      .card-content-main {
        margin-top: 8px;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  
  return (
    <div
      className={`card ${isActive ? 'active' : ''} ${isFocused ? 'focused' : ''}`}
      style={cardStyle}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      draggable={true}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 카드 헤더 */}
      <div className="card-header" style={headerStyle}>
        {renderContent(cardContent.header, isMarkdownRendering)}
      </div>
      
      {/* 카드 본문 */}
      <div className="card-body" style={bodyStyle}>
        {renderContent(cardContent.body, isMarkdownRendering)}
      </div>
      
      {/* 카드 푸터 */}
      <div className="card-footer" style={footerStyle}>
        {renderContent(cardContent.footer, isMarkdownRendering)}
      </div>
    </div>
  );
};

export default Card;