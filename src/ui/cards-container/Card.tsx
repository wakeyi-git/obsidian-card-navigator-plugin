import React, { useEffect, useState } from 'react';
import './Card.css';
import { ICardNavigatorService } from '../../application/CardNavigatorService';

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
}) => {
  const [highlightInfo, setHighlightInfo] = useState<{ text: string, positions: number[] }[]>([]);

  // 검색어 강조 정보 가져오기
  useEffect(() => {
    try {
      if (cardNavigatorService && searchQuery && cardNavigatorService.getSearchService().isSearchMode()) {
        const card = {
          id,
          title,
          content,
          tags,
          path: path || '',
          created: created || Date.now(),
          modified: modified || Date.now(),
        };
        
        const info = cardNavigatorService.getSearchService().getHighlightInfo(card);
        setHighlightInfo(info);
      } else {
        setHighlightInfo([]);
      }
    } catch (error) {
      console.error('검색어 강조 정보 가져오기 중 오류 발생:', error);
      setHighlightInfo([]);
    }
  }, [id, title, content, tags, path, created, modified, searchQuery, cardNavigatorService]);

  const handleClick = () => {
    if (onClick) {
      onClick(id);
    }
  };

  // 날짜 포맷팅 함수
  const formatDate = (timestamp?: number) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // 내용 요약 (150자 제한)
  const summarizeContent = (text: string) => {
    if (text.length <= 150) return text;
    return text.substring(0, 150) + '...';
  };

  /**
   * 텍스트에서 검색어 강조 처리
   * @param text 원본 텍스트
   * @param searchInfo 검색어 및 위치 정보
   * @returns 강조 처리된 JSX 요소
   */
  const highlightText = (text: string, searchInfo: { text: string, positions: number[] }[]): JSX.Element => {
    if (!searchInfo || searchInfo.length === 0 || !text) {
      return <>{text}</>;
    }
    
    // 모든 검색어 정보를 하나의 배열로 통합
    const allPositions: { start: number; end: number; text: string }[] = [];
    
    searchInfo.forEach(info => {
      info.positions.forEach(pos => {
        allPositions.push({
          start: pos,
          end: pos + info.text.length,
          text: info.text
        });
      });
    });
    
    // 위치 정보를 시작 위치 기준으로 정렬
    allPositions.sort((a, b) => a.start - b.start);
    
    // 겹치는 위치 정보 병합
    const mergedPositions: { start: number; end: number; text: string }[] = [];
    
    allPositions.forEach(pos => {
      const lastPos = mergedPositions[mergedPositions.length - 1];
      
      if (lastPos && pos.start <= lastPos.end) {
        // 겹치는 경우 병합
        lastPos.end = Math.max(lastPos.end, pos.end);
        lastPos.text = text.substring(lastPos.start, lastPos.end);
      } else {
        // 겹치지 않는 경우 추가
        mergedPositions.push({ ...pos });
      }
    });
    
    // 강조 처리된 JSX 요소 생성
    const result: JSX.Element[] = [];
    let lastIndex = 0;
    
    mergedPositions.forEach((pos, index) => {
      // 강조 구간 이전 텍스트
      if (pos.start > lastIndex) {
        result.push(
          <span key={`text-${index}`}>
            {text.substring(lastIndex, pos.start)}
          </span>
        );
      }
      
      // 강조 구간
      result.push(
        <span key={`highlight-${index}`} className="card-navigator-highlight">
          {pos.text}
        </span>
      );
      
      lastIndex = pos.end;
    });
    
    // 마지막 강조 구간 이후 텍스트
    if (lastIndex < text.length) {
      result.push(
        <span key={`text-last`}>
          {text.substring(lastIndex)}
        </span>
      );
    }
    
    return <>{result}</>;
  };

  // 복합 검색어 하이라이트 함수
  const highlightComplexText = (text: string, highlightInfo: { text: string, positions: number[] }[]) => {
    if (!highlightInfo.length) return text;
    
    // 모든 검색어의 위치를 수집
    const allPositions: { start: number; end: number; text: string }[] = [];
    
    highlightInfo.forEach(info => {
      info.positions.forEach(pos => {
        allPositions.push({
          start: pos,
          end: pos + info.text.length,
          text: info.text
        });
      });
    });
    
    // 위치를 시작 위치 기준으로 정렬
    allPositions.sort((a, b) => a.start - b.start);
    
    // 겹치는 위치 병합
    const mergedPositions: { start: number; end: number; text: string }[] = [];
    
    allPositions.forEach(pos => {
      const last = mergedPositions[mergedPositions.length - 1];
      
      if (last && pos.start <= last.end) {
        // 겹치는 경우 병합
        last.end = Math.max(last.end, pos.end);
        last.text = text.substring(last.start, last.end);
      } else {
        // 겹치지 않는 경우 추가
        mergedPositions.push(pos);
      }
    });
    
    // 텍스트 분할 및 하이라이트 적용
    let result: React.ReactNode[] = [];
    let lastEnd = 0;
    
    mergedPositions.forEach((pos, index) => {
      // 하이라이트 전 텍스트 추가
      if (pos.start > lastEnd) {
        result.push(text.substring(lastEnd, pos.start));
      }
      
      // 하이라이트 텍스트 추가
      result.push(
        <span key={`highlight-${index}`} className="card-navigator-highlight">
          {text.substring(pos.start, pos.end)}
        </span>
      );
      
      lastEnd = pos.end;
    });
    
    // 마지막 하이라이트 이후 텍스트 추가
    if (lastEnd < text.length) {
      result.push(text.substring(lastEnd));
    }
    
    return result;
  };

  // 요약된 내용에 검색어 하이라이트 적용
  const highlightedContent = highlightInfo.length > 0 ? 
    highlightComplexText(summarizeContent(content), highlightInfo) : 
    (searchQuery ? highlightText(summarizeContent(content), highlightInfo) : summarizeContent(content));

  // 제목에 검색어 하이라이트 적용
  const highlightedTitle = highlightInfo.length > 0 ? 
    highlightComplexText(title, highlightInfo) : 
    (searchQuery ? highlightText(title, highlightInfo) : title);

  return (
    <div
      className={`card-navigator-card ${isActive ? 'card-navigator-card-active' : ''}`}
      onClick={handleClick}
      style={style}
    >
      <div className="card-navigator-card-header">
        <h3 className="card-navigator-card-title" title={title}>
          {highlightedTitle}
        </h3>
      </div>
      
      <div className="card-navigator-card-content">
        {highlightedContent}
      </div>
      
      <div className="card-navigator-card-footer">
        {tags.length > 0 && (
          <div className="card-navigator-card-tags">
            {tags.map((tag, index) => (
              <span key={index} className="card-navigator-card-tag">
                {highlightInfo.length > 0 ? highlightComplexText(tag, highlightInfo) : (searchQuery ? highlightText(tag, highlightInfo) : tag)}
              </span>
            ))}
          </div>
        )}
        
        <div className="card-navigator-card-meta">
          {path && <span className="card-navigator-card-path" title={path}>{path}</span>}
          {created && <span className="card-navigator-card-created">생성: {formatDate(created)}</span>}
          {modified && <span className="card-navigator-card-modified">수정: {formatDate(modified)}</span>}
        </div>
      </div>
    </div>
  );
};

export default Card; 